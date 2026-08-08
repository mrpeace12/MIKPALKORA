import { hashSecret, verifySecret, hashOtp, signToken, buildSessionCookie, clearSessionCookie, requireAuth, signPinToken } from '../lib/auth';
import { sendOtpEmail } from '../lib/email';

export interface AuthEnv {
  DB: D1Database;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  COOKIE_DOMAIN?: string;
}

const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_TTL_SECONDS = 10 * 60;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const MAX_FAILED_LOGINS = 5;
const LOGIN_LOCKOUT_MINUTES = 15;
const MAX_FAILED_PINS = 5;
const PIN_LOCKOUT_MINUTES = 30;

function genId(): string {
  return crypto.randomUUID();
}
function genOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function handleSignup(request: Request, env: AuthEnv): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  // Matches the real UI order: email + password first, username/country/phone come
  // later via handleUpdateProfile (after OTP verification). A placeholder username
  // is generated now so the row satisfies the UNIQUE constraint immediately.
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!EMAIL_RE.test(email)) return Response.json({ status: false, message: 'Valid email is required' }, { status: 400 });
  if (password.length < 8) return Response.json({ status: false, message: 'Password must be at least 8 characters' }, { status: 400 });

  const existing = await env.DB.prepare(`SELECT id FROM users WHERE email = ? COLLATE NOCASE`).bind(email).first();
  if (existing) return Response.json({ status: false, message: 'An account with this email already exists' }, { status: 409 });

  const { hash, salt } = await hashSecret(password);
  const userId = genId();
  const placeholderUsername = `user_${userId.replace(/-/g, '').slice(0, 12)}`;

  await env.DB.prepare(
    `INSERT INTO users (id, username, email, password_hash, password_salt, full_name, country, phone, email_verified, created_at)
     VALUES (?, ?, ?, ?, ?, '', '', '', 0, ?)`
  )
    .bind(userId, placeholderUsername, email, hash, salt, new Date().toISOString())
    .run();

  await issueAndSendOtp(env, email);

  return Response.json({ status: true, message: 'Account created. Check your email for a verification code.' });
}

/**
 * Called after OTP verification, once the user picks a real username and country
 * in the UI's profile-setup step. Enforces the same case-insensitive uniqueness
 * as signup — this is what actually finalizes a chosen @handle.
 */
export async function handleUpdateProfile(request: Request, env: AuthEnv): Promise<Response> {
  const session = await requireAuth(request, env.JWT_SECRET);
  if (!session) return Response.json({ status: false, message: 'Not authenticated' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const username = typeof body?.username === 'string' ? body.username.replace(/^@/, '').trim() : '';
  const fullName = typeof body?.fullName === 'string' ? body.fullName.trim() : '';
  const country = typeof body?.country === 'string' ? body.country : '';
  const phone = typeof body?.phone === 'string' ? body.phone : '';

  if (!USERNAME_RE.test(username)) {
    return Response.json({ status: false, message: 'Username must be 3-20 characters, letters/numbers/underscore only' }, { status: 400 });
  }

  const taken = await env.DB.prepare(`SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?`).bind(username, session.sub).first();
  if (taken) return Response.json({ status: false, message: 'That username is already taken' }, { status: 409 });

  await env.DB.prepare(`UPDATE users SET username = ?, full_name = ?, country = ?, phone = ? WHERE id = ?`)
    .bind(username, fullName, country, phone, session.sub)
    .run();

  // Re-issue the session token so its embedded username stays in sync.
  const token = await signToken({ sub: session.sub, email: session.email, username }, env.JWT_SECRET, SESSION_TTL_SECONDS);

  return new Response(
    JSON.stringify({ status: true, user: { username, email: session.email, fullName, country } }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': buildSessionCookie(token, SESSION_TTL_SECONDS, env.COOKIE_DOMAIN) } }
  );
}

async function issueAndSendOtp(env: AuthEnv, email: string): Promise<void> {
  const code = genOtp();
  const codeHash = await hashOtp(code, email);
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO otp_codes (id, email, code_hash, purpose, expires_at, used, created_at) VALUES (?, ?, ?, 'verify_email', ?, 0, ?)`
  )
    .bind(genId(), email, codeHash, expiresAt, new Date().toISOString())
    .run();

  await sendOtpEmail(env, email, code);
}

export async function handleResendOtp(request: Request, env: AuthEnv): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email)) return Response.json({ status: false, message: 'Valid email is required' }, { status: 400 });

  const user = await env.DB.prepare(`SELECT email_verified FROM users WHERE email = ? COLLATE NOCASE`).bind(email).first<{ email_verified: number }>();
  // Don't reveal whether the account exists — always return the same generic response.
  if (user && !user.email_verified) await issueAndSendOtp(env, email);
  return Response.json({ status: true, message: 'If that account needs verification, a new code has been sent.' });
}

export async function handleVerifyOtp(request: Request, env: AuthEnv): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const code = typeof body?.code === 'string' ? body.code.trim() : '';

  if (!EMAIL_RE.test(email) || !/^\d{6}$/.test(code)) {
    return Response.json({ status: false, message: 'A valid email and 6-digit code are required' }, { status: 400 });
  }

  const codeHash = await hashOtp(code, email);
  const row = await env.DB.prepare(
    `SELECT id FROM otp_codes WHERE email = ? COLLATE NOCASE AND code_hash = ? AND purpose = 'verify_email' AND used = 0 AND expires_at > ?
     ORDER BY created_at DESC LIMIT 1`
  )
    .bind(email, codeHash, new Date().toISOString())
    .first<{ id: string }>();

  if (!row) return Response.json({ status: false, message: 'Invalid or expired code' }, { status: 400 });

  await env.DB.prepare(`UPDATE otp_codes SET used = 1 WHERE id = ?`).bind(row.id).run();

  const user = await env.DB.prepare(`SELECT id, username, email, full_name, country FROM users WHERE email = ? COLLATE NOCASE`)
    .bind(email)
    .first<{ id: string; username: string; email: string; full_name: string; country: string }>();
  if (!user) return Response.json({ status: false, message: 'Account not found' }, { status: 404 });

  await env.DB.prepare(`UPDATE users SET email_verified = 1 WHERE id = ?`).bind(user.id).run();

  const token = await signToken({ sub: user.id, email: user.email, username: user.username }, env.JWT_SECRET, SESSION_TTL_SECONDS);

  return new Response(
    JSON.stringify({ status: true, user: { username: user.username, email: user.email, fullName: user.full_name, country: user.country } }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': buildSessionCookie(token, SESSION_TTL_SECONDS, env.COOKIE_DOMAIN) } }
  );
}

export async function handleLogin(request: Request, env: AuthEnv): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!EMAIL_RE.test(email) || !password) return Response.json({ status: false, message: 'Invalid email or password' }, { status: 400 });

  const user = await env.DB.prepare(
    `SELECT id, username, email, password_hash, password_salt, full_name, country, email_verified, failed_login_attempts, locked_until
     FROM users WHERE email = ? COLLATE NOCASE`
  )
    .bind(email)
    .first<{
      id: string; username: string; email: string; password_hash: string; password_salt: string;
      full_name: string; country: string; email_verified: number; failed_login_attempts: number; locked_until: string | null;
    }>();

  // Same generic error whether the account exists or the password is wrong — don't leak which.
  const genericError = () => Response.json({ status: false, message: 'Invalid email or password' }, { status: 401 });
  if (!user) return genericError();

  if (user.locked_until && new Date(user.locked_until).getTime() > Date.now()) {
    return Response.json({ status: false, message: 'Too many failed attempts. Try again in a few minutes.' }, { status: 429 });
  }

  const passwordOk = await verifySecret(password, user.password_salt, user.password_hash);
  if (!passwordOk) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    const lockedUntil = attempts >= MAX_FAILED_LOGINS ? new Date(Date.now() + LOGIN_LOCKOUT_MINUTES * 60 * 1000).toISOString() : null;
    await env.DB.prepare(`UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`).bind(attempts, lockedUntil, user.id).run();
    return genericError();
  }

  await env.DB.prepare(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?`).bind(user.id).run();

  if (!user.email_verified) {
    await issueAndSendOtp(env, user.email);
    return Response.json({ status: false, message: 'Please verify your email first — a new code has been sent.', needsVerification: true }, { status: 403 });
  }

  const token = await signToken({ sub: user.id, email: user.email, username: user.username }, env.JWT_SECRET, SESSION_TTL_SECONDS);

  return new Response(
    JSON.stringify({ status: true, user: { username: user.username, email: user.email, fullName: user.full_name, country: user.country } }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Set-Cookie': buildSessionCookie(token, SESSION_TTL_SECONDS, env.COOKIE_DOMAIN) } }
  );
}

export async function handleLogout(env: AuthEnv): Promise<Response> {
  return new Response(JSON.stringify({ status: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearSessionCookie(env.COOKIE_DOMAIN) },
  });
}

export async function handleMe(request: Request, env: AuthEnv): Promise<Response> {
  const session = await requireAuth(request, env.JWT_SECRET);
  if (!session) return Response.json({ status: false, message: 'Not authenticated' }, { status: 401 });

  const user = await env.DB.prepare(`SELECT username, email, full_name, country, pin_hash FROM users WHERE id = ?`)
    .bind(session.sub)
    .first<{ username: string; email: string; full_name: string; country: string; pin_hash: string | null }>();
  if (!user) return Response.json({ status: false, message: 'Account not found' }, { status: 404 });

  return Response.json({
    status: true,
    user: { username: user.username, email: user.email, fullName: user.full_name, country: user.country, hasPin: !!user.pin_hash },
  });
}

// ==========================================
// Transaction PIN — set once, then required (as a fresh step-up token) before
// every P2P transfer or payout. This is what makes the PIN screen in the UI
// mean something, instead of comparing against a plaintext value in client state.
// ==========================================
const PIN_RE = /^\d{4,6}$/;

export async function handleSetPin(request: Request, env: AuthEnv): Promise<Response> {
  const session = await requireAuth(request, env.JWT_SECRET);
  if (!session) return Response.json({ status: false, message: 'Not authenticated' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  const pin = typeof body?.pin === 'string' ? body.pin : '';
  if (!PIN_RE.test(pin)) return Response.json({ status: false, message: 'PIN must be 4-6 digits' }, { status: 400 });

  const { hash, salt } = await hashSecret(pin);
  await env.DB.prepare(`UPDATE users SET pin_hash = ?, pin_salt = ?, pin_failed_attempts = 0, pin_locked_until = NULL WHERE id = ?`)
    .bind(hash, salt, session.sub)
    .run();

  return Response.json({ status: true, message: 'PIN set' });
}

export async function handleVerifyPin(request: Request, env: AuthEnv): Promise<Response> {
  const session = await requireAuth(request, env.JWT_SECRET);
  if (!session) return Response.json({ status: false, message: 'Not authenticated' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  const pin = typeof body?.pin === 'string' ? body.pin : '';

  const user = await env.DB.prepare(`SELECT pin_hash, pin_salt, pin_failed_attempts, pin_locked_until FROM users WHERE id = ?`)
    .bind(session.sub)
    .first<{ pin_hash: string | null; pin_salt: string | null; pin_failed_attempts: number; pin_locked_until: string | null }>();

  if (!user || !user.pin_hash || !user.pin_salt) {
    return Response.json({ status: false, message: 'No PIN set for this account yet' }, { status: 400 });
  }
  if (user.pin_locked_until && new Date(user.pin_locked_until).getTime() > Date.now()) {
    return Response.json({ status: false, message: 'Too many failed PIN attempts. Try again later.' }, { status: 429 });
  }

  const ok = await verifySecret(pin, user.pin_salt, user.pin_hash);
  if (!ok) {
    const attempts = (user.pin_failed_attempts || 0) + 1;
    const lockedUntil = attempts >= MAX_FAILED_PINS ? new Date(Date.now() + PIN_LOCKOUT_MINUTES * 60 * 1000).toISOString() : null;
    await env.DB.prepare(`UPDATE users SET pin_failed_attempts = ?, pin_locked_until = ? WHERE id = ?`).bind(attempts, lockedUntil, session.sub).run();
    return Response.json({ status: false, message: 'Incorrect PIN' }, { status: 401 });
  }

  await env.DB.prepare(`UPDATE users SET pin_failed_attempts = 0, pin_locked_until = NULL WHERE id = ?`).bind(session.sub).run();

  const pinToken = await signPinToken(session.sub, env.JWT_SECRET);
  return Response.json({ status: true, pinToken });
}

/**
 * Resolves a recipient identifier (username, with or without "@", or an email address)
 * to exactly one real, registered account. Returns null if it doesn't match a real user —
 * this is what stops P2P transfers from going to a made-up or mistyped identifier.
 */
export async function resolveRecipient(
  db: D1Database,
  identifier: string
): Promise<{ id: string; username: string; email: string; fullName: string; country: string } | null> {
  const cleaned = identifier.trim().replace(/^@/, '');
  if (!cleaned) return null;

  const row = await db
    .prepare(`SELECT id, username, email, full_name, country FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE LIMIT 1`)
    .bind(cleaned, cleaned.toLowerCase())
    .first<{ id: string; username: string; email: string; full_name: string; country: string }>();

  if (!row) return null;
  return { id: row.id, username: row.username, email: row.email, fullName: row.full_name, country: row.country };
}
