const API_BASE = '';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function setToken(token: string): void {
  localStorage.setItem('token', token);
}

function clearToken(): void {
  localStorage.removeItem('token');
}

async function apiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...headers, ...((options.headers as Record<string, string>) || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  signup: (email: string, password: string, full_name: string, username?: string) =>
    apiRequest('/api/auth/signup', { method: 'POST', body: JSON.stringify({ email, password, full_name, username }) }),
  signin: (email: string, password: string) =>
    apiRequest('/api/auth/signin', { method: 'POST', body: JSON.stringify({ email, password }) }),
  googleAuth: (credential: string) =>
    apiRequest('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  verifyEmail: (token: string) =>
    apiRequest('/api/auth/verify-email', { method: 'POST', body: JSON.stringify({ token }) }),
  forgotPassword: (email: string) =>
    apiRequest('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token: string, password: string) =>
    apiRequest('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  me: () => apiRequest('/api/auth/me'),
  signout: () => apiRequest('/api/auth/signout', { method: 'POST' }),

  getProfile: () => apiRequest('/api/profile'),
  updateProfile: (data: any) => apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (current_password: string, new_password: string) =>
    apiRequest('/api/profile/password', { method: 'PUT', body: JSON.stringify({ current_password, new_password }) }),
  setPin: (new_pin: string, current_pin?: string) =>
    apiRequest('/api/profile/pin', { method: 'PUT', body: JSON.stringify({ new_pin, current_pin }) }),
  verifyPin: (pin: string) =>
    apiRequest('/api/profile/pin/verify', { method: 'POST', body: JSON.stringify({ pin }) }),
  toggleBiometrics: (enabled: boolean) =>
    apiRequest('/api/profile/biometrics', { method: 'PUT', body: JSON.stringify({ enabled }) }),
  submitKyc: (document_type: string, document_number: string, full_name?: string) =>
    apiRequest('/api/profile/kyc', { method: 'POST', body: JSON.stringify({ document_type, document_number, full_name }) }),

  getDashboard: () => apiRequest('/api/dashboard'),
  getWallets: () => apiRequest('/api/wallets'),
  createWallet: (currency: string) =>
    apiRequest('/api/wallets', { method: 'POST', body: JSON.stringify({ currency }) }),

  getTransactions: (limit = 20, offset = 0) =>
    apiRequest(`/api/transactions?limit=${limit}&offset=${offset}`),
  getTransaction: (id: string) => apiRequest(`/api/transactions/${id}`),
  transfer: (data: any) =>
    apiRequest('/api/transactions/transfer', { method: 'POST', body: JSON.stringify(data) }),
  payout: (data: any) =>
    apiRequest('/api/transactions/payout', { method: 'POST', body: JSON.stringify(data) }),

  p2pLookup: (username: string) =>
    apiRequest('/api/p2p/lookup', { method: 'POST', body: JSON.stringify({ username }) }),
  p2pTransfer: (data: any) =>
    apiRequest('/api/p2p/transfer', { method: 'POST', body: JSON.stringify(data) }),
  p2pHistory: (limit = 20, offset = 0) =>
    apiRequest(`/api/p2p/history?limit=${limit}&offset=${offset}`),

  initiateDeposit: (amount: number, currency: string, paymentMethod: string) =>
    apiRequest('/api/deposit/initiate', { method: 'POST', body: JSON.stringify({ amount, currency, paymentMethod }) }),
  verifyDeposit: (reference: string) =>
    apiRequest(`/api/deposit/verify/${reference}`),

  getVirtualAccounts: () => apiRequest('/api/virtual-accounts'),
  createVirtualAccount: () =>
    apiRequest('/api/virtual-accounts', { method: 'POST' }),

  getCards: () => apiRequest('/api/cards'),
  addCard: (data: any) =>
    apiRequest('/api/cards', { method: 'POST', body: JSON.stringify(data) }),
  removeCard: (card_id: string) =>
    apiRequest('/api/cards', { method: 'DELETE', body: JSON.stringify({ card_id }) }),

  getNotifications: (unreadOnly = false) =>
    apiRequest(`/api/notifications${unreadOnly ? '?unread=true' : ''}`),
  markNotificationRead: (id: string) =>
    apiRequest(`/api/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () =>
    apiRequest('/api/notifications/read-all', { method: 'PUT' }),
  deleteNotification: (id: string) =>
    apiRequest(`/api/notifications/${id}`, { method: 'DELETE' }),

  freezeAccount: (reason?: string) =>
    apiRequest('/api/account/freeze', { method: 'POST', body: JSON.stringify({ reason }) }),

  reverseTransaction: (id: string, pin: string, reason?: string) =>
    apiRequest(`/api/transactions/${id}/reverse`, { method: 'POST', body: JSON.stringify({ pin, reason }) }),

  setToken,
  getToken,
  clearToken,
};
