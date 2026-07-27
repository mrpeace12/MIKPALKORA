CREATE TABLE IF NOT EXISTS fee_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    min_amount INTEGER NOT NULL, 
    max_amount INTEGER, 
    fee_amount INTEGER NOT NULL, 
    fee_type TEXT DEFAULT 'fixed', 
    fee_percent REAL DEFAULT 0, 
    is_active INTEGER DEFAULT 1, 
    transaction_type TEXT DEFAULT 'all', 
    created_at TEXT DEFAULT (datetime('now')), 
    updated_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO fee_rules (min_amount, max_amount, fee_amount, fee_type, fee_percent, transaction_type) 
VALUES 
(0, 2999, 0, 'fixed', 0, 'all'), 
(3000, 9999, 50, 'fixed', 0, 'all'), 
(10000, 19999, 100, 'fixed', 0, 'all'), 
(20000, 99999, 200, 'fixed', 0, 'all'), 
(100000, 1000000, 1000, 'fixed', 0, 'all'), 
(1000001, 999999999, 10000, 'fixed', 0, 'all');

CREATE TABLE IF NOT EXISTS settlement_history (
    id TEXT PRIMARY KEY, 
    user_id TEXT NOT NULL, 
    transaction_id TEXT NOT NULL, 
    amount INTEGER NOT NULL, 
    fee INTEGER NOT NULL, 
    settlement_type TEXT NOT NULL, 
    destination_details TEXT, 
    status TEXT DEFAULT 'initiated', 
    korapay_reference TEXT, 
    korapay_response TEXT, 
    failure_reason TEXT, 
    created_at TEXT DEFAULT (datetime('now')), 
    completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_settlement_user ON settlement_history(user_id);
CREATE INDEX IF NOT EXISTS idx_settlement_status ON settlement_history(status);
CREATE INDEX IF NOT EXISTS idx_settlement_tx ON settlement_history(transaction_id);
CREATE INDEX IF NOT EXISTS idx_fee_rules_active ON fee_rules(is_active);
