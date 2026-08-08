import { createHmac, timingSafeEqual } from 'node:crypto';
import { requireAuth, verifyPinToken } from './lib/auth';
import {
  handleSignup,
  handleVerifyOtp,
  handleResendOtp,
  handleLogin,
  handleLogout,
  handleMe,
  handleSetPin,
  handleVerifyPin,
  handleUpdateProfile,
  resolveRecipient,
} from './routes/auth';

export interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  KORA_SECRET_KEY: string;
  KORA_PUBLIC_KEY: string;
  JWT_SECRET: string;
  RESEND_API_KEY: string;
  FROM_EMAIL: string;
  COOKIE_DOMAIN?: string;
  ALLOWED_ORIGIN: string;
  ADMIN_API_KEY: string;
}

const KORA_BASE_URL = 'https://api.korapay.com';

/**
 * Defense-in-depth against CSRF: SameSite=Lax on the session cookie already blocks
 * cross-site POSTs from carrying it in most browsers, but this catches the rest.
 * Requests with no Origin header (same-origin navigations, curl, server-to-server) pass through.
 */
function isAllowedOrigin(request: Request, env: Env): boolean {
  const origin = request.headers.get('Origin');
  if (!origin) return true;
  return origin === env.ALLOWED_ORIGIN;
}

/**
 * Requires BOTH a valid login session AND a fresh PIN step-up token (issued by
 * /api/auth/verify-pin within the last 5 minutes) for the given user. A stolen
 * session cookie alone is not enough to move money.
 */
async function requireAuthAndPin(request: Request, env: Env, body: any): Promise<{ email: string; sub: string } | Response> {
  const session = await requireAuth(request, env.JWT_SECRET);
  if (!session) return Response.json({ status: false, message: 'Not authenticated' }, { status: 401 });

  const pinToken = typeof body?.pinToken === 'string' ? body.pinToken : '';
  const pinOk = pinToken && (await verifyPinToken(pinToken, env.JWT_SECRET, session.sub));
  if (!pinOk) {
    return Response.json({ status: false, message: 'PIN verification required or expired. Please re-enter your PIN.' }, { status: 401 });
  }

  return { email: session.email, sub: session.sub };
}

// ==========================================
// Kora HMAC verification + proxy (secret key never leaves the server)
// ==========================================
function verifyKoraSignature(rawBody: string, signature: string | null, secretKey: string | undefined): boolean {
  if (!signature || !secretKey) return false;
  const expected = createHmac('sha256', secretKey).update(rawBody).digest('hex');
  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) return false;
  return timingSafeEqual(sigBuf, expBuf);
}

async function koraRequest(env: Env, method: string, path: string, body?: unknown) {
  const res = await fetch(`${KORA_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.KORA_SECRET_KEY}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json()) as any;
  return { ok: res.ok, status: res.status, data };
}

// ==========================================
// D1 helpers — deposits
// ==========================================
async function createDepositIntent(db: D1Database, reference: string, email: string, amount: number, currency: string) {
  await db
    .prepare(`INSERT INTO deposit_intents (reference, email, amount, currency, status, created_at) VALUES (?, ?, ?, ?, 'PENDING', ?)`)
    .bind(reference, email, amount, currency, new Date().toISOString())
    .run();
}

async function getDepositIntent(db: D1Database, reference: string) {
  return db
    .prepare(`SELECT reference, email, amount, currency, status FROM deposit_intents WHERE reference = ?`)
    .bind(reference)
    .first<{ reference: string; email: string; amount: number; currency: string; status: string }>();
}

async function markDepositIntent(db: D1Database, reference: string, status: 'SUCCESS' | 'FAILED') {
  await db.prepare(`UPDATE deposit_intents SET status = ?, completed_at = ? WHERE reference = ?`).bind(status, new Date().toISOString(), reference).run();
}

// ==========================================
// D1 helpers — balances (the ledger)
// ==========================================
async function creditUserBalance(db: D1Database, email: string, amount: number, currency: string) {
  await db
    .prepare(`INSERT INTO balances (email, currency, amount) VALUES (?, ?, ?) ON CONFLICT(email, currency) DO UPDATE SET amount = amount + excluded.amount`)
    .bind(email, currency, amount)
    .run();
}

/**
 * Debit with the guard baked into the SQL itself (amount >= ?), so a concurrent
 * request can't push a balance negative — matches zero rows if funds are
 * insufficient, detected via meta.changes.
 */
async function tryDebitUserBalance(db: D1Database, email: string, amount: number, currency: string): Promise<boolean> {
  const result = await db
    .prepare(`UPDATE balances SET amount = amount - ? WHERE email = ? AND currency = ? AND amount >= ?`)
    .bind(amount, email, currency, amount)
    .run();
  return (result.meta.changes ?? 0) > 0;
}

// ==========================================
// D1 helpers — payouts
// ==========================================
async function createPayoutRecord(db: D1Database, reference: string, email: string, amount: number, currency: string) {
  await db
    .prepare(`INSERT INTO transfers (reference, status, updated_at, email, amount, currency) VALUES (?, 'PENDING', ?, ?, ?, ?)`)
    .bind(reference, new Date().toISOString(), email, amount, currency)
    .run();
}

async function getPayoutRecord(db: D1Database, reference: string) {
  return db
    .prepare(`SELECT reference, status, email, amount, currency FROM transfers WHERE reference = ?`)
    .bind(reference)
    .first<{ reference: string; status: string; email: string; amount: number; currency: string }>();
}

async function updatePayoutStatus(db: D1Database, reference: string, status: string) {
  await db.prepare(`UPDATE transfers SET status = ?, updated_at = ? WHERE reference = ?`).bind(status, new Date().toISOString(), reference).run();
}

// ==========================================
// D1 helpers — P2P ledger
// ==========================================
async function createP2PRecord(db: D1Database, reference: string, senderEmail: string, recipientEmail: string, amount: number, currency: string, status: string) {
  await db
    .prepare(`INSERT INTO p2p_transfers (reference, sender_email, recipient_email, amount, currency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(reference, senderEmail, recipientEmail, amount, currency, status, new Date().toISOString())
    .run();
}

// ==========================================
// D1 helpers — webhook log
// ==========================================
async function logWebhook(db: D1Database, id: string, event: string, payload: string, verified: boolean) {
  await db.prepare(`INSERT INTO webhook_logs (id, event, timestamp, payload, verified) VALUES (?, ?, ?, ?, ?)`).bind(id, event, new Date().toISOString(), payload, verified ? 1 : 0).run();
  await db.prepare(`DELETE FROM webhook_logs WHERE id NOT IN (SELECT id FROM webhook_logs ORDER BY timestamp DESC LIMIT 50)`).run();
}

// ==========================================
// Webhook handler — the only server-to-server source of truth for Korapay events
// ==========================================
async function handleKoraWebhook(request: Request, env: Env): Promise<Response> {
  const signature = request.headers.get('x-korapay-signature') || request.headers.get('x-kora-signature');
  const rawBody = await request.text();

  if (!verifyKoraSignature(rawBody, signature, env.KORA_SECRET_KEY)) {
    console.warn('[KORA WEBHOOK REJECTED] Invalid or missing signature');
    return new Response('Unauthorized webhook signature', { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response('Invalid JSON payload', { status: 400 });
  }

  await logWebhook(env.DB, `WH-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`, event?.event || 'unknown', rawBody, true);

  try {
    switch (event?.event) {
      case 'charge.success': {
        const reference = event?.data?.reference;
        if (!reference) break;
        const intent = await getDepositIntent(env.DB, reference);
        if (!intent) {
          console.warn(`[KORA WEBHOOK] charge.success for unknown reference ${reference} — ignoring`);
          break;
        }
        if (intent.status !== 'PENDING') break; // already processed — avoid double-credit on webhook retry
        await creditUserBalance(env.DB, intent.email, intent.amount, intent.currency);
        await markDepositIntent(env.DB, reference, 'SUCCESS');
        break;
      }
      case 'transfer.success': {
        const reference = event?.data?.reference;
        if (!reference) break;
        const payout = await getPayoutRecord(env.DB, reference);
        if (!payout || payout.status !== 'PENDING') break;
        await updatePayoutStatus(env.DB, reference, 'SUCCESS');
        break;
      }
      case 'transfer.failed': {
        const reference = event?.data?.reference;
        if (!reference) break;
        const payout = await getPayoutRecord(env.DB, reference);
        if (!payout || payout.status !== 'PENDING') break;
        await creditUserBalance(env.DB, payout.email, payout.amount, payout.currency); // refund what we reserved
        await updatePayoutStatus(env.DB, reference, 'FAILED');
        break;
      }
      default:
        console.log(`[KORA WEBHOOK] Unhandled event type: ${event?.event}`);
    }
  } catch (err) {
    console.error('[KORA WEBHOOK PROCESSING ERROR]', err);
    return Response.json({ status: 'error', message: 'Processing failed' }, { status: 500 });
  }

  return Response.json({ status: 'success' });
}

// ==========================================
// Deposits (pay-in) — auth required, PIN NOT required (depositing your own money in isn't a theft risk)
// ==========================================
async function handleInitiateDeposit(request: Request, env: Env): Promise<Response> {
  const session = await requireAuth(request, env.JWT_SECRET);
  if (!session) return Response.json({ status: false, message: 'Not authenticated' }, { status: 401 });

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const email = session.email;
  const amount = Number(body?.amount);
  const currency = typeof body?.currency === 'string' ? body.currency.toUpperCase() : '';

  if (!Number.isFinite(amount) || amount <= 0) return Response.json({ status: false, message: 'Amount must be a positive number' }, { status: 400 });
  if (!currency) return Response.json({ status: false, message: 'Currency is required' }, { status: 400 });
  if (!env.KORA_PUBLIC_KEY) return Response.json({ status: false, message: 'Payments are not configured yet' }, { status: 500 });

  const reference = `MP-DEP-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  await createDepositIntent(env.DB, reference, email, amount, currency);

  return Response.json({ status: true, reference, publicKey: env.KORA_PUBLIC_KEY, amount, currency, email });
}

async function handleDepositStatus(request: Request, env: Env, reference: string): Promise<Response> {
  const session = await requireAuth(request, env.JWT_SECRET);
  if (!session) return Response.json({ status: false, message: 'Not authenticated' }, { status: 401 });
  const intent = await getDepositIntent(env.DB, reference);
  if (!intent) return Response.json({ status: false, message: 'Unknown reference' }, { status: 404 });
  if (intent.email.toLowerCase() !== session.email.toLowerCase()) {
    return Response.json({ status: false, message: 'Not authorized' }, { status: 403 });
  }
  return Response.json({ status: true, reference: intent.reference, depositStatus: intent.status });
}

// ==========================================
// P2P transfers — auth + PIN step-up required
// ==========================================
async function handleP2PTransfer(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const authResult = await requireAuthAndPin(request, env, body);
  if (authResult instanceof Response) return authResult;
  const senderEmail = authResult.email;

  const recipientIdentifier = typeof body?.recipient === 'string' ? body.recipient.trim() : '';
  const amount = Number(body?.amount);
  const currency = typeof body?.currency === 'string' ? body.currency.toUpperCase() : '';

  if (!recipientIdentifier) return Response.json({ status: false, message: 'Recipient username or email is required' }, { status: 400 });
  if (!Number.isFinite(amount) || amount <= 0) return Response.json({ status: false, message: 'Amount must be a positive number' }, { status: 400 });
  if (!currency) return Response.json({ status: false, message: 'Currency is required' }, { status: 400 });

  // Resolve against the real users table — stops money going to a typo'd, made-up,
  // or impersonated identifier instead of a real registered account.
  const recipient = await resolveRecipient(env.DB, recipientIdentifier);
  if (!recipient) return Response.json({ status: false, message: 'No MIKPAL account found for that username or email' }, { status: 404 });
  const recipientEmail = recipient.email;

  if (senderEmail.toLowerCase() === recipientEmail.toLowerCase()) {
    return Response.json({ status: false, message: 'Cannot send to yourself' }, { status: 400 });
  }

  const reference = `MP-P2P-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  const debited = await tryDebitUserBalance(env.DB, senderEmail, amount, currency);
  if (!debited) return Response.json({ status: false, message: 'Insufficient balance' }, { status: 400 });

  try {
    await creditUserBalance(env.DB, recipientEmail, amount, currency);
  } catch (err) {
    console.error('[P2P TRANSFER] Credit failed, refunding sender', err);
    await creditUserBalance(env.DB, senderEmail, amount, currency);
    return Response.json({ status: false, message: 'Transfer failed, your balance was not affected' }, { status: 500 });
  }

  await createP2PRecord(env.DB, reference, senderEmail, recipientEmail, amount, currency, 'SUCCESS');

  return Response.json({ status: true, reference, recipient: { username: recipient.username, fullName: recipient.fullName }, message: 'Transfer completed' });
}

// ==========================================
// Bank / Mobile Money payouts — auth + PIN step-up required, real Korapay disbursement
// ==========================================
async function handleInitiatePayout(request: Request, env: Env): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const authResult = await requireAuthAndPin(request, env, body);
  if (authResult instanceof Response) return authResult;
  const email = authResult.email;

  const amount = Number(body?.amount);
  const currency = typeof body?.currency === 'string' ? body.currency.toUpperCase() : '';
  const destination = body?.destination;
  const customerName = typeof body?.customerName === 'string' ? body.customerName : '';

  if (!Number.isFinite(amount) || amount <= 0) return Response.json({ status: false, message: 'Amount must be a positive number' }, { status: 400 });
  if (!currency) return Response.json({ status: false, message: 'Currency is required' }, { status: 400 });
  if (!destination || (destination.type !== 'bank_account' && destination.type !== 'mobile_money')) {
    return Response.json({ status: false, message: 'destination.type must be bank_account or mobile_money' }, { status: 400 });
  }
  if (destination.type === 'bank_account' && (!destination.bank_account?.bank || !destination.bank_account?.account)) {
    return Response.json({ status: false, message: 'Bank code and account number are required' }, { status: 400 });
  }
  if (destination.type === 'mobile_money' && (!destination.mobile_money?.operator || !destination.mobile_money?.mobile_number)) {
    return Response.json({ status: false, message: 'Mobile money operator and number are required' }, { status: 400 });
  }

  const reference = `MP-PAYOUT-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

  // Hold the funds up front — refunded automatically if Korapay reports failure.
  const debited = await tryDebitUserBalance(env.DB, email, amount, currency);
  if (!debited) return Response.json({ status: false, message: 'Insufficient balance' }, { status: 400 });

  await createPayoutRecord(env.DB, reference, email, amount, currency);

  const korapayBody = {
    reference,
    destination: {
      type: destination.type,
      amount,
      currency,
      narration: destination.narration || 'MIKPAL payout',
      ...(destination.type === 'bank_account' ? { bank_account: destination.bank_account } : {}),
      ...(destination.type === 'mobile_money' ? { mobile_money: destination.mobile_money } : {}),
      customer: { name: customerName, email },
    },
  };

  const { ok, data } = await koraRequest(env, 'POST', '/merchant/api/v1/transactions/disburse', korapayBody);

  if (!ok || data?.status !== true) {
    await creditUserBalance(env.DB, email, amount, currency); // refund immediately — Korapay rejected outright
    await updatePayoutStatus(env.DB, reference, 'FAILED');
    console.error('[PAYOUT REJECTED]', data);
    return Response.json({ status: false, message: data?.message || 'Payout was rejected' }, { status: 400 });
  }

  return Response.json({ status: true, reference, payoutStatus: 'processing', message: 'Payout initiated' });
}

async function handlePayoutStatus(request: Request, env: Env, reference: string): Promise<Response> {
  const session = await requireAuth(request, env.JWT_SECRET);
  if (!session) return Response.json({ status: false, message: 'Not authenticated' }, { status: 401 });
  const payout = await getPayoutRecord(env.DB, reference);
  if (!payout) return Response.json({ status: false, message: 'Unknown reference' }, { status: 404 });
  if (payout.email.toLowerCase() !== session.email.toLowerCase()) {
    return Response.json({ status: false, message: 'Not authorized' }, { status: 403 });
  }
  return Response.json({ status: true, reference: payout.reference, payoutStatus: payout.status });
}

// ==========================================
// Payout utilities — bank list / mobile money list / account resolve
// (proxied so the secret key never touches the browser)
// ==========================================
async function handleListBanks(env: Env, countryCode: string): Promise<Response> {
  const { ok, data } = await koraRequest(env, 'GET', `/merchant/api/v1/misc/banks?countryCode=${encodeURIComponent(countryCode)}`);
  return Response.json(data, { status: ok ? 200 : 502 });
}

async function handleListMobileMoney(env: Env, countryCode: string): Promise<Response> {
  const { ok, data } = await koraRequest(env, 'GET', `/merchant/api/v1/misc/mobile-money?countryCode=${encodeURIComponent(countryCode)}`);
  return Response.json(data, { status: ok ? 200 : 502 });
}

async function handleResolveBankAccount(request: Request, env: Env): Promise<Response> {
  const session = await requireAuth(request, env.JWT_SECRET);
  if (!session) return Response.json({ status: false, message: 'Not authenticated' }, { status: 401 });
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  const { ok, data } = await koraRequest(env, 'POST', '/merchant/api/v1/misc/banks/resolve', body);
  return Response.json(data, { status: ok ? 200 : 502 });
}

/** Same as handleResolveBankAccount, but accepts the {accountNumber, bankCode, country} shape the frontend actually sends. */
async function handleResolveAccountAlias(request: Request, env: Env): Promise<Response> {
  const session = await requireAuth(request, env.JWT_SECRET);
  if (!session) return Response.json({ status: false, message: 'Not authenticated' }, { status: 401 });
  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ status: false, message: 'Invalid JSON body' }, { status: 400 });
  }
  const { ok, data } = await koraRequest(env, 'POST', '/merchant/api/v1/misc/banks/resolve', {
    bank: body?.bankCode,
    account_number: body?.accountNumber,
  });
  if (!ok || !data?.data?.account_name) {
    return Response.json({ status: false, message: data?.message || 'Could not resolve account' }, { status: ok ? 404 : 502 });
  }
  return Response.json({ status: true, accountName: data.data.account_name });
}

/**
 * Real recipient search — resolves a username/email against the actual users table.
 * Returns only public info (username, fullName, country), never balances or password data.
 */
async function handleLookupUser(request: Request, env: Env): Promise<Response> {
  const session = await requireAuth(request, env.JWT_SECRET);
  if (!session) return Response.json({ status: false, message: 'Not authenticated' }, { status: 401 });

  const url = new URL(request.url);
  const identifier = url.searchParams.get('identifier') || '';
  if (!identifier.trim()) return Response.json({ status: false, message: 'identifier is required' }, { status: 400 });

  const recipient = await resolveRecipient(env.DB, identifier);
  if (!recipient) return Response.json({ status: false, message: 'No MIKPAL account found' }, { status: 404 });
  if (recipient.email.toLowerCase() === session.email.toLowerCase()) {
    return Response.json({ status: false, message: 'That is your own account' }, { status: 400 });
  }

  return Response.json({ status: true, username: recipient.username, fullName: recipient.fullName, email: recipient.email, country: recipient.country });
}

// ==========================================
// Balance / logs / health
// ==========================================
async function handleGetBalance(env: Env, email: string): Promise<Response> {
  const { results } = await env.DB.prepare(`SELECT currency, amount FROM balances WHERE email = ?`).bind(email).all();
  return Response.json({ status: true, email, balances: results });
}

async function handleGetMyBalance(request: Request, env: Env): Promise<Response> {
  const session = await requireAuth(request, env.JWT_SECRET);
  if (!session) return Response.json({ status: false, message: 'Not authenticated' }, { status: 401 });
  return handleGetBalance(env, session.email);
}

async function handleGetLogs(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(`SELECT id, event, timestamp, payload, verified FROM webhook_logs ORDER BY timestamp DESC LIMIT 50`).all();
  return Response.json({ status: true, count: results.length, logs: results });
}

async function handleHealth(): Promise<Response> {
  return Response.json({ status: 'ok', service: 'MIKPAL API', timestamp: new Date().toISOString() });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const p = url.pathname;

    if (request.method === 'POST' && (p === '/v1/webhooks/kora' || p === '/api/v1/webhooks/kora')) {
      return handleKoraWebhook(request, env);
    }

    // Defense-in-depth CSRF guard for every other mutating request. The webhook above is
    // exempt since it's a server-to-server call from Kora, not a browser.
    if (request.method !== 'GET' && request.method !== 'HEAD' && !isAllowedOrigin(request, env)) {
      return Response.json({ status: false, message: 'Origin not allowed' }, { status: 403 });
    }

    // Auth
    if (request.method === 'POST' && p === '/api/auth/signup') return handleSignup(request, env);
    if (request.method === 'POST' && p === '/api/auth/verify-otp') return handleVerifyOtp(request, env);
    if (request.method === 'POST' && p === '/api/auth/resend-otp') return handleResendOtp(request, env);
    if (request.method === 'POST' && p === '/api/auth/login') return handleLogin(request, env);
    if (request.method === 'POST' && p === '/api/auth/logout') return handleLogout(env);
    if (request.method === 'GET' && p === '/api/auth/me') return handleMe(request, env);
    if (request.method === 'POST' && p === '/api/auth/update-profile') return handleUpdateProfile(request, env);
    if (request.method === 'POST' && p === '/api/auth/set-pin') return handleSetPin(request, env);
    if (request.method === 'POST' && p === '/api/auth/verify-pin') return handleVerifyPin(request, env);

    // Deposits
    if (request.method === 'POST' && p === '/api/deposits/initiate') return handleInitiateDeposit(request, env);
    if (request.method === 'GET' && p.startsWith('/api/deposits/') && p.endsWith('/status')) {
      const reference = p.split('/api/deposits/')[1]?.replace('/status', '');
      if (!reference) return Response.json({ status: false, message: 'Reference required' }, { status: 400 });
      return handleDepositStatus(request, env, decodeURIComponent(reference));
    }

    // P2P transfers
    if (request.method === 'POST' && p === '/api/transfers/p2p') return handleP2PTransfer(request, env);

    // Bank / mobile money payouts
    if (request.method === 'POST' && p === '/api/payouts/initiate') return handleInitiatePayout(request, env);
    if (request.method === 'GET' && p.startsWith('/api/payouts/') && p.endsWith('/status')) {
      const reference = p.split('/api/payouts/')[1]?.replace('/status', '');
      if (!reference) return Response.json({ status: false, message: 'Reference required' }, { status: 400 });
      return handlePayoutStatus(request, env, decodeURIComponent(reference));
    }

    // Payout utilities
    if (request.method === 'GET' && p === '/api/payout-utils/banks') return handleListBanks(env, url.searchParams.get('countryCode') || 'NG');
    if (request.method === 'GET' && p === '/api/payout-utils/mobile-money') return handleListMobileMoney(env, url.searchParams.get('countryCode') || 'GH');
    if (request.method === 'POST' && p === '/api/payout-utils/resolve-bank') return handleResolveBankAccount(request, env);
    if (request.method === 'POST' && p === '/api/transfers/resolve-account') return handleResolveAccountAlias(request, env);
    if (request.method === 'GET' && p === '/api/users/lookup') return handleLookupUser(request, env);

    // Balance / logs / health
    if (request.method === 'GET' && p === '/api/webhooks/logs') {
      const adminKey = request.headers.get('X-Admin-Key');
      if (!adminKey || adminKey !== env.ADMIN_API_KEY) return Response.json({ status: false, message: 'Not authorized' }, { status: 401 });
      return handleGetLogs(env);
    }
    if (request.method === 'GET' && p === '/api/me/balance') return handleGetMyBalance(request, env);
    if (request.method === 'GET' && p === '/api/health') return handleHealth();

    // Anything else falls through to the static frontend (SPA)
    return env.ASSETS.fetch(request);
  },
};
