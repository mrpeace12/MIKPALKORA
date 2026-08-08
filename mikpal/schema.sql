-- MIKPAL D1 schema
-- Run with: wrangler d1 execute mikpal-db --remote --file=./schema.sql

-- ==========================================
-- Users — real accounts, not the mock profiles the frontend used to fake.
-- Username/email are case-insensitively unique so nobody can register a
-- lookalike to impersonate someone else.
-- ==========================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE COLLATE NOCASE,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  full_name TEXT,
  country TEXT,
  phone TEXT,
  email_verified INTEGER NOT NULL DEFAULT 0,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,

  -- Transaction PIN — a SECOND factor required at the moment of sending money,
  -- separate from the login session. Hashed the same way as the password
  -- (per-user random salt + PBKDF2), never stored or compared in plaintext.
  pin_hash TEXT,
  pin_salt TEXT,
  pin_failed_attempts INTEGER NOT NULL DEFAULT 0,
  pin_locked_until TEXT,

  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

-- One-time codes for email verification (signup) and OTP resend.
CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  code_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_codes (email, purpose);

-- ==========================================
-- Wallet balances — real money, keyed by user email + currency.
-- ==========================================
CREATE TABLE IF NOT EXISTS balances (
  email TEXT NOT NULL COLLATE NOCASE,
  currency TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  PRIMARY KEY (email, currency)
);

-- Tracks every deposit we initiated, so the Korapay webhook can reconcile
-- against something we actually created (never trust the webhook payload's
-- own amount/email) and so a duplicate webhook delivery can't double-credit.
CREATE TABLE IF NOT EXISTS deposit_intents (
  reference TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | SUCCESS | FAILED
  created_at TEXT NOT NULL,
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_deposit_intents_email ON deposit_intents (email);

-- Bank/mobile-money payouts. Funds are reserved (debited) the moment a payout
-- is initiated; email/amount/currency are recorded so a failed payout can be
-- refunded automatically when Korapay's webhook reports transfer.failed.
CREATE TABLE IF NOT EXISTS transfers (
  reference TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL, -- PENDING | SUCCESS | FAILED
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_transfers_email ON transfers (email);

-- Internal P2P transfers between two MIKPAL wallets — no Korapay call needed.
CREATE TABLE IF NOT EXISTS p2p_transfers (
  reference TEXT PRIMARY KEY,
  sender_email TEXT NOT NULL COLLATE NOCASE,
  recipient_email TEXT NOT NULL COLLATE NOCASE,
  amount REAL NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_p2p_sender ON p2p_transfers (sender_email);
CREATE INDEX IF NOT EXISTS idx_p2p_recipient ON p2p_transfers (recipient_email);

-- Raw webhook event history — admin-only visibility (contains other users' data).
CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  event TEXT,
  timestamp TEXT NOT NULL,
  payload TEXT,
  verified INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_timestamp ON webhook_logs (timestamp DESC);
