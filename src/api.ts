// MIKPAL Client API Utility for Express Backend Integration

const API_BASE = '';

function getToken(): string | null {
  return localStorage.getItem('mikpal_session_token');
}

function setToken(token: string): void {
  localStorage.setItem('mikpal_session_token', token);
}

function clearToken(): void {
  localStorage.removeItem('mikpal_session_token');
}

async function apiRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...((options.headers as Record<string, string>) || {}) },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  return data as T;
}

export const api = {
  // Token management
  getToken,
  setToken,
  clearToken,

  // Auth
  signup: (data: { email: string; password: string; full_name: string; username?: string; country?: string; phone?: string }) =>
    apiRequest('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),

  signin: (email: string, password: string) =>
    apiRequest('/api/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) }),

  me: () => apiRequest('/api/auth/me'),

  signout: () => apiRequest('/api/auth/signout', { method: 'POST' }),

  // Profile & Security
  getProfile: () => apiRequest('/api/profile'),

  updateProfile: (data: { display_name?: string; phone?: string; country?: string }) =>
    apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify(data) }),

  setPin: (new_pin: string) =>
    apiRequest('/api/profile/pin', { method: 'PUT', body: JSON.stringify({ new_pin }) }),

  verifyPin: (pin: string) =>
    apiRequest('/api/profile/pin/verify', { method: 'POST', body: JSON.stringify({ pin }) }),

  submitKyc: (document_type: string, document_number: string, full_name?: string) =>
    apiRequest('/api/profile/kyc', { method: 'POST', body: JSON.stringify({ document_type, document_number, full_name }) }),

  // Dashboard & Wallets
  getDashboard: () => apiRequest('/api/dashboard'),

  getWallets: () => apiRequest('/api/wallets'),

  createWallet: (currency: string) =>
    apiRequest('/api/wallets', { method: 'POST', body: JSON.stringify({ currency }) }),

  // Transactions & Transfers
  getTransactions: () => apiRequest('/api/transactions'),

  p2pLookup: (username: string) =>
    apiRequest('/api/p2p/lookup', { method: 'POST', body: JSON.stringify({ username }) }),

  p2pTransfer: (data: { recipient_username: string; amount: number; currency?: string; description?: string }) =>
    apiRequest('/api/p2p/transfer', { method: 'POST', body: JSON.stringify(data) }),

  payout: (data: { channel?: string; amount: number; currency?: string; recipient_name?: string; recipient_account?: string; recipient_bank?: string }) =>
    apiRequest('/api/transactions/payout', { method: 'POST', body: JSON.stringify(data) }),

  // Deposits
  initiateDeposit: (amount: number, currency?: string, paymentMethod?: string) =>
    apiRequest('/api/deposit/initiate', { method: 'POST', body: JSON.stringify({ amount, currency, paymentMethod }) }),

  verifyDeposit: (reference: string) =>
    apiRequest(`/api/deposit/verify/${reference}`),

  // Virtual Accounts & Cards
  getVirtualAccounts: () => apiRequest('/api/virtual-accounts'),

  createVirtualAccount: () => apiRequest('/api/virtual-accounts', { method: 'POST' }),

  getCards: () => apiRequest('/api/cards'),

  addCard: (data: { card_type?: string; last4?: string; cardholder_name?: string }) =>
    apiRequest('/api/cards', { method: 'POST', body: JSON.stringify(data) }),

  removeCard: (card_id: string) =>
    apiRequest('/api/cards', { method: 'DELETE', body: JSON.stringify({ card_id }) }),

  // System & Health & Rates
  getRates: () => apiRequest('/api/rates'),
  getHealth: () => apiRequest('/api/health'),
};
