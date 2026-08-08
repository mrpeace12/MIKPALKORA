// Real backend integration for MIKPAL. Every request includes credentials
// so the httpOnly session cookie is sent — without this, auth silently fails.

async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.status === false) {
    throw new Error(data?.message || `Request failed (${res.status})`);
  }
  return data;
}

// ==========================================
// Shared helper: turn the server's real balance list into the frontend's
// WalletBalance shape, so nobody hand-rolls a fake wallet object anymore.
// ==========================================
export function buildWalletsFromBalances(
  balances: { currency: string; amount: number }[],
  countryInfo: { currency: string; currencySymbol: string; flag: string }
): Record<string, { currency: string; currencySymbol: string; available: number; pending: number; flag: string }> {
  const wallets: Record<string, { currency: string; currencySymbol: string; available: number; pending: number; flag: string }> = {
    [countryInfo.currency]: { currency: countryInfo.currency, currencySymbol: countryInfo.currencySymbol, available: 0, pending: 0, flag: countryInfo.flag },
    USD: { currency: 'USD', currencySymbol: '$', available: 0, pending: 0, flag: '🇺🇸' },
  };
  for (const b of balances) {
    wallets[b.currency] = {
      currency: b.currency,
      currencySymbol: wallets[b.currency]?.currencySymbol || (b.currency === countryInfo.currency ? countryInfo.currencySymbol : b.currency === 'USD' ? '$' : b.currency),
      available: b.amount,
      pending: 0,
      flag: wallets[b.currency]?.flag || '🌐',
    };
  }
  return wallets;
}

// ==========================================
// Auth
// ==========================================
export interface AuthUser {
  username: string;
  email: string;
  fullName: string;
  country: string;
  hasPin?: boolean;
}

export async function signup(email: string, password: string) {
  return apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function updateProfile(params: { username: string; fullName: string; country: string; phone: string }): Promise<{ status: true; user: AuthUser }> {
  return apiFetch('/api/auth/update-profile', { method: 'POST', body: JSON.stringify(params) });
}

export async function verifyOtp(email: string, code: string): Promise<{ status: true; user: AuthUser }> {
  return apiFetch('/api/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email, code }) });
}

export async function resendOtp(email: string) {
  return apiFetch('/api/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email }) });
}

export async function login(email: string, password: string): Promise<{ status: true; user: AuthUser }> {
  return apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export async function logout() {
  return apiFetch('/api/auth/logout', { method: 'POST' });
}

/** Call on app load to check for an existing session — replaces the old "always logged in as mock user" behavior. */
export async function getMe(): Promise<{ status: true; user: AuthUser } | null> {
  try {
    return await apiFetch('/api/auth/me');
  } catch {
    return null;
  }
}

// ==========================================
// Transaction PIN — required before every P2P transfer or payout, separate
// from the login session. This is what makes the PIN screen in the UI real.
// ==========================================
export async function setPin(pin: string) {
  return apiFetch('/api/auth/set-pin', { method: 'POST', body: JSON.stringify({ pin }) });
}

/** Returns a short-lived pinToken to attach to the next transfer/payout call. */
export async function verifyPin(pin: string): Promise<{ status: true; pinToken: string }> {
  return apiFetch('/api/auth/verify-pin', { method: 'POST', body: JSON.stringify({ pin }) });
}

// ==========================================
// Balance
// ==========================================
export async function getServerBalance(): Promise<{ status: true; email: string; balances: { currency: string; amount: number }[] }> {
  return apiFetch('/api/me/balance');
}

// ==========================================
// Deposits — Korapay checkout widget
// ==========================================
const KORAPAY_SCRIPT_URL = 'https://korablobstorage.blob.core.windows.net/modal-bucket/korapay-collections.min.js';
let korapayScriptPromise: Promise<void> | null = null;

function loadKorapayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if ((window as any).Korapay) return Promise.resolve();
  if (korapayScriptPromise) return korapayScriptPromise;
  korapayScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = KORAPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Korapay checkout script'));
    document.body.appendChild(script);
  });
  return korapayScriptPromise;
}

export async function initiateDeposit(amount: number, currency: string) {
  return apiFetch('/api/deposits/initiate', { method: 'POST', body: JSON.stringify({ amount, currency }) });
}

export async function getDepositStatus(reference: string): Promise<{ status: true; reference: string; depositStatus: 'PENDING' | 'SUCCESS' | 'FAILED' }> {
  return apiFetch(`/api/deposits/${encodeURIComponent(reference)}/status`);
}

export function openKorapayCheckout(params: {
  publicKey: string;
  reference: string;
  amount: number;
  currency: string;
  customerEmail: string;
  customerName: string;
}): Promise<void> {
  return loadKorapayScript().then(
    () =>
      new Promise((resolve) => {
        (window as any).Korapay.initialize({
          key: params.publicKey,
          reference: params.reference,
          amount: params.amount,
          currency: params.currency,
          customer: { name: params.customerName, email: params.customerEmail },
          // The webhook does the actual crediting — these are UX hooks only.
          onClose: () => resolve(),
          onSuccess: () => resolve(),
          onFailed: () => resolve(),
        });
      })
  );
}

export async function waitForDepositConfirmation(reference: string, timeoutMs = 30000): Promise<'SUCCESS' | 'FAILED' | 'PENDING'> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { depositStatus } = await getDepositStatus(reference);
    if (depositStatus !== 'PENDING') return depositStatus;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return 'PENDING';
}

// ==========================================
// P2P transfers — recipient is a username or email, resolved server-side.
// Requires a fresh pinToken from verifyPin().
// ==========================================
export async function sendP2PTransfer(recipient: string, amount: number, currency: string, pinToken: string) {
  return apiFetch('/api/transfers/p2p', { method: 'POST', body: JSON.stringify({ recipient, amount, currency, pinToken }) });
}

// ==========================================
// Bank / mobile-money payouts — also requires a fresh pinToken.
// ==========================================
export interface PayoutDestination {
  type: 'bank_account' | 'mobile_money';
  narration?: string;
  bank_account?: { bank: string; account: string };
  mobile_money?: { operator: string; mobile_number: string };
}

export async function initiatePayout(params: {
  amount: number;
  currency: string;
  customerName: string;
  destination: PayoutDestination;
  pinToken: string;
}) {
  return apiFetch('/api/payouts/initiate', { method: 'POST', body: JSON.stringify(params) });
}

export async function getPayoutStatus(reference: string): Promise<{ status: true; reference: string; payoutStatus: 'PENDING' | 'SUCCESS' | 'FAILED' }> {
  return apiFetch(`/api/payouts/${encodeURIComponent(reference)}/status`);
}

export async function waitForPayoutConfirmation(reference: string, timeoutMs = 30000): Promise<'SUCCESS' | 'FAILED' | 'PENDING'> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const { payoutStatus } = await getPayoutStatus(reference);
    if (payoutStatus !== 'PENDING') return payoutStatus;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return 'PENDING';
}

// ==========================================
// Payout utilities — bank list / mobile money list / account name resolution
// ==========================================
export async function listBanks(countryCode: string) {
  return apiFetch(`/api/payout-utils/banks?countryCode=${encodeURIComponent(countryCode)}`);
}

export async function listMobileMoneyOperators(countryCode: string) {
  return apiFetch(`/api/payout-utils/mobile-money?countryCode=${encodeURIComponent(countryCode)}`);
}

export async function lookupUser(identifier: string): Promise<{ status: true; username: string; fullName: string; email: string; country: string }> {
  return apiFetch(`/api/users/lookup?identifier=${encodeURIComponent(identifier)}`);
}

export async function resolveBankAccount(bankCode: string, accountNumber: string) {
  return apiFetch('/api/payout-utils/resolve-bank', { method: 'POST', body: JSON.stringify({ bank: bankCode, account_number: accountNumber }) });
}
