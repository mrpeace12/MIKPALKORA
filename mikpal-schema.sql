-- ============================================================
-- MIKPAL — Unified D1 Schema (hardened v2.1)
-- Multi-currency P2P wallet + Korapay + Email/Google Auth
-- Database: mikpal-db
-- ============================================================

-- 1. Users (core accounts)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  password_hash TEXT,
  full_name TEXT,
  display_name TEXT,
  phone TEXT,
  country TEXT DEFAULT 'Ghana',
  currency TEXT DEFAULT 'GHS',
  email_verified INTEGER DEFAULT 0,
  avatar_url TEXT,
  kyc_verified INTEGER DEFAULT 0,
  kyc_verified_name TEXT,
  kyc_document_type TEXT,
  kyc_document_number TEXT,
  pin_hash TEXT,
  pin_attempts INTEGER DEFAULT 0,
  pin_locked_until INTEGER DEFAULT 0,
  biometrics_enabled INTEGER DEFAULT 0,
  daily_limit REAL DEFAULT 50000.0,
  is_frozen INTEGER DEFAULT 0,
  frozen_reason TEXT,
  frozen_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. OAuth Accounts
CREATE TABLE IF NOT EXISTS oauth_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(provider, provider_account_id)
);

-- 3. Auth Tokens
CREATE TABLE IF NOT EXISTS auth_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 4. Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT UNIQUE NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 5. Wallets (SOURCE OF TRUTH for balance)
CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  balance REAL DEFAULT 0.0,
  locked_balance REAL DEFAULT 0.0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, currency)
);

-- 6. P2P Ledger Entries
CREATE TABLE IF NOT EXISTS ledger_entries (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  recipient_id TEXT NOT NULL,
  amount REAL NOT NULL,
  fee REAL DEFAULT 0.0,
  currency TEXT NOT NULL,
  status TEXT DEFAULT 'success',
  reference TEXT UNIQUE,
  idempotency_key TEXT UNIQUE,
  pin_verified INTEGER DEFAULT 0,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 7. Transactions
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  channel TEXT,
  amount REAL NOT NULL,
  fee REAL DEFAULT 0.0,
  currency TEXT DEFAULT 'GHS',
  status TEXT DEFAULT 'pending',
  reference TEXT UNIQUE,
  description TEXT,
  recipient_name TEXT,
  recipient_account TEXT,
  recipient_bank TEXT,
  webhook_reference TEXT,
  pin_verified INTEGER DEFAULT 0,
  idempotency_key TEXT UNIQUE,
  reversed_by TEXT,
  reversed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 8. Gateway Transactions
CREATE TABLE IF NOT EXISTS gateway_transactions (
  reference TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  provider TEXT DEFAULT 'korapay',
  provider_reference TEXT,
  status TEXT DEFAULT 'pending',
  webhook_data TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 9. Virtual Accounts
CREATE TABLE IF NOT EXISTS virtual_accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  routing_number TEXT,
  swift_code TEXT,
  provider TEXT DEFAULT 'kora',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 10. Cards
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  card_type TEXT NOT NULL,
  last4 TEXT NOT NULL,
  expiry_month TEXT,
  expiry_year TEXT,
  cardholder_name TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 11. Webhook Events
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  reference TEXT UNIQUE,
  processed INTEGER DEFAULT 0,
  payload TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 12. Audit Log
CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT NOT NULL,
  ip_address TEXT,
  details TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 13. KYC Verifications
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  status TEXT DEFAULT 'unverified',
  document_type TEXT,
  document_number TEXT,
  verified_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 14. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference TEXT,
  amount REAL,
  currency TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON wallets(user_id, currency);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_sender ON ledger_entries(sender_id);
CREATE INDEX IF NOT EXISTS idx_ledger_recipient ON ledger_entries(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gateway_reference ON gateway_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);
