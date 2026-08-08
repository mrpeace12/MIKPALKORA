import { timingSafeEqual } from 'node:crypto';

// ==========================================
// Password / PIN hashing — PBKDF2-SHA256, 100k iterations, per-user random salt.
// Never a shared/static salt — that's what makes a hash "salted" at all.
// ==========================================
const PBKDF2_ITERATIONS = 100_000;

function bufToHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

async function deriveBits(secret: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' }, keyMaterial, 256);
}

export async function hashSecret(secret: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const derived = await deriveBits(secret, salt);
  return { hash: bufToHex(derived), salt: bufToHex(salt.buffer as ArrayBuffer) };
}

export async function verifySecret(secret: string, saltHex: string, expectedHashHex: string): Promise<boolean> {
  const derived = await deriveBits(secret, hexToBuf(saltHex));
  const computedHex = bufToHex(derived);
  const a = Buffer.from(computedHex, 'utf8');
  const b = Buffer.from(expectedHashHex, 'utf8');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Hashes a 6-digit OTP, bound to the email so a leaked hash can't be replayed for another account. */
export async function hashOtp(code: string, email: string): Promise<string> {
  const data = new TextEncoder().encode(`${email.toLowerCase()}:${code}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bufToHex(digest);
}

// ==========================================
// JWT — HS256, hand-rolled (small enough surface not to need a dependency).
// ==========================================
function base64urlEncode(input: ArrayBuffer | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(input);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecodeToBuf(input: string): Uint8Array {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export interface SessionPayload {
  sub: string;
  email: string;
  username: string;
}

export async function signToken(payload: Record<string, unknown>, secret: string, expiresInSeconds: number): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSeconds };
  const encHeader = base64urlEncode(JSON.stringify(header));
  const encBody = base64urlEncode(JSON.stringify(body));
  const data = `${encHeader}.${encBody}`;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return `${data}.${base64urlEncode(sig)}`;
}

export async function verifyToken<T = Record<string, unknown>>(token: string, secret: string): Promise<(T & { iat: number; exp: number }) | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [encHeader, encBody, encSig] = parts;

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify('HMAC', key, base64urlDecodeToBuf(encSig), new TextEncoder().encode(`${encHeader}.${encBody}`));
  if (!valid) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecodeToBuf(encBody)));
    if (typeof payload.exp === 'number' && Math.floor(Date.now() / 1000) > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// ==========================================
// Session cookie helpers
// ==========================================
const SESSION_COOKIE_NAME = 'mikpal_session';

export function buildSessionCookie(token: string, maxAgeSeconds: number, domain?: string): string {
  const parts = [`${SESSION_COOKIE_NAME}=${token}`, 'HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', `Max-Age=${maxAgeSeconds}`];
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join('; ');
}

export function clearSessionCookie(domain?: string): string {
  const parts = [`${SESSION_COOKIE_NAME}=`, 'HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/', 'Max-Age=0'];
  if (domain) parts.push(`Domain=${domain}`);
  return parts.join('; ');
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  return match.substring(name.length + 1);
}

/** Reads and verifies the session cookie. Returns null if missing/invalid/expired — never throws. */
export async function requireAuth(request: Request, jwtSecret: string): Promise<SessionPayload | null> {
  const token = getCookie(request, SESSION_COOKIE_NAME);
  if (!token) return null;
  const payload = await verifyToken<SessionPayload>(token, jwtSecret);
  if (!payload) return null;
  return { sub: payload.sub, email: payload.email, username: payload.username };
}

// ==========================================
// PIN step-up token — proves the user just entered their transaction PIN
// correctly, separate from (and in addition to) the login session. Short-lived
// and single-purpose: possessing a valid login session alone is NOT enough to
// move money; this token is required too.
// ==========================================
export async function signPinToken(userId: string, secret: string): Promise<string> {
  return signToken({ sub: userId, purpose: 'pin_verified' }, secret, 5 * 60); // 5 minutes
}

export async function verifyPinToken(token: string, secret: string, expectedUserId: string): Promise<boolean> {
  const payload = await verifyToken<{ sub: string; purpose: string }>(token, secret);
  if (!payload) return false;
  return payload.purpose === 'pin_verified' && payload.sub === expectedUserId;
}
