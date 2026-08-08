# MIKPAL — Deploy Guide

This is a from-scratch rebuild of the backend on top of your real frontend
(from `mikpal_complete_codebase.txt`). The previous Express `server.ts` is
removed entirely — everything now runs as a Cloudflare Worker (`worker/index.ts`)
backed by D1.

## What changed, and why

### 1. Real authentication (previously: none)
Every money-moving endpoint used to trust whatever email the client sent it —
anyone could have called the API with someone else's email and moved their
money. Now:
- Real signup/login with PBKDF2-hashed passwords (per-user random salt —
  never a shared/static salt, which is the mistake I found and avoided when
  reviewing a different Hono-based `worker.ts` you'd been sent separately)
- Email verification via a real 6-digit OTP, sent through Resend
- Sessions are an httpOnly, Secure, SameSite=Lax cookie holding a signed JWT —
  never readable by JavaScript, so an XSS bug can't casually steal it
- Every endpoint that touches money reads the account from the verified
  session — never from a client-supplied field

### 2. A real transaction PIN (previously: cosmetic)
The old `PinVerificationModal` compared the entered PIN to a plaintext value
sitting in client state (`user.securityPin`, defaulting to `'1234'` and
displayed in the UI). Anyone could read or override that in devtools and
bypass it entirely. Now:
- PINs are PBKDF2-hashed server-side, same as passwords
- `/api/auth/verify-pin` checks the real PIN and, only on a match, issues a
  short-lived (5 min) `pinToken`
- Every P2P transfer and payout requires a **valid session AND a fresh
  pinToken** — a stolen session cookie alone isn't enough to move money
- 5 failed PIN attempts locks the account's PIN for 30 minutes
- The fake "always works" biometric bypass is removed

### 3. Real recipient resolution (previously: 5 hardcoded mock users)
`SendMoneyView` used to search a local `RECIPIENTS` array — you could only
ever send money to 5 fake demo accounts, and username/email typos or
impersonation had no real backstop. Now:
- `/api/users/lookup` resolves a username or email against the real `users`
  table (case-insensitively unique, so nobody can register a lookalike)
- P2P transfers re-resolve the recipient server-side too — the frontend's
  "confirmed" recipient is never blindly trusted
- Sending to a non-existent identifier fails with a clear error instead of
  silently succeeding against nothing

### 4. Real Korapay integration, secret key never exposed
- Deposits use Korapay's client-side checkout widget (public key only) — the
  webhook is the only thing that ever actually credits a balance, and it
  re-verifies the HMAC signature with your secret key server-side
- Payouts call Korapay's disbursement API from the Worker; funds are reserved
  the moment a payout starts and auto-refunded if Korapay reports failure
- Bank list / mobile money list / account-name resolution are proxied through
  the Worker — your frontend never sees `KORA_SECRET_KEY`

### 5. Ledger correctness
- Debits use a SQL guard (`WHERE amount >= ?`) so concurrent requests can't
  push a balance negative
- Deposit/payout webhook handling is idempotent — a duplicate webhook
  delivery can't double-credit
- No fabricated "verification bonus" money — I found and removed a bug where
  completing the (still-simulated) KYC flow silently added 500 GHS + $10 USD
  to the wallet, since a UI-only "credit" had nothing stopping the real
  ledger from disagreeing with what the screen showed

### 6. CSRF / origin lockdown
Every mutating request is checked against `ALLOWED_ORIGIN` (your real domain)
as defense-in-depth alongside the SameSite cookie. The Kora webhook is exempt
since it's server-to-server, not a browser request.

### 7. Admin data locked down
`/api/webhooks/logs` contains other users' transaction payloads and now
requires an `X-Admin-Key` header matching a secret — it was previously wide open.

## One-time setup

```bash
npm install
wrangler d1 create mikpal-db          # copy the database_id into wrangler.jsonc
npm run db:migrate                     # applies schema.sql
wrangler secret put JWT_SECRET         # any long random string, e.g. `openssl rand -hex 32`
wrangler secret put KORA_SECRET_KEY    # from your Korapay dashboard
wrangler secret put RESEND_API_KEY     # from your Resend dashboard
wrangler secret put ADMIN_API_KEY      # any long random string, for viewing webhook logs
```

Then in `wrangler.jsonc`:
- Set `KORA_PUBLIC_KEY` to your real Korapay public key
- Confirm `ALLOWED_ORIGIN` / `COOKIE_DOMAIN` are `https://mikpal.com` / `mikpal.com`
- Set `FROM_EMAIL` to an address on a domain you've verified in Resend

Point your Korapay webhook (in the Korapay dashboard) to:
```
https://mikpal.com/v1/webhooks/kora
```

Attach your domain in Cloudflare under Workers & Pages -> mikpal -> Settings
-> Domains & Routes if it isn't already.

## Local dev / deploy
```bash
npm run dev      # local dev server
npm run deploy   # builds the frontend + deploys the Worker together
```

## What's still simulated - on purpose, not by accident

- Virtual card issuance/top-up (VirtualCardsView.tsx): Korapay doesn't
  issue cards. This stays a UI mockup until you pick a card-issuing provider
  and I wire it the same way (real API call -> webhook/callback -> real ledger).
- KYC document storage: the liveness/document flow still isn't backed by
  a real database table -- completing it updates local state only, not a
  server record. No fake money is granted anymore, but the "VERIFIED" status
  itself isn't persisted server-side yet.
- GlobalSearchBar.tsx: this is a separate, secondary search widget from
  the main Send Money recipient search -- it still searches the old mock
  RECIPIENTS array. Worth fixing before launch using the same
  /api/users/lookup endpoint the Send Money flow now uses.
- AdminPortal: still reads from local mock data, not the real D1 tables.
- Biometric toggle in ProfileView: cosmetic only -- flips a local flag with
  no real WebAuthn/platform biometric behind it.
- Currency conversion in P2P/payouts: the backend ledger moves a single
  amount in a single currency. If sender/recipient currencies differ, the app
  blocks the transfer with a clear message rather than faking an FX rate.
- The single-payout Korapay endpoint (/merchant/api/v1/transactions/disburse)
  was inferred from Korapay's documented pattern (bulk is at /disburse/bulk)
  rather than confirmed directly against a single-payout doc page. Verify this
  against your Korapay dashboard/API reference before going live -- a wrong
  path fails loudly (400, funds auto-refunded), not silently.

## Database migration note
If you already ran an earlier version of schema.sql against a live D1
database, re-running this one will add the new users/otp_codes tables via
CREATE TABLE IF NOT EXISTS -- safe to re-run. It won't retroactively alter an
existing transfers table's columns; if you have an older deployed schema,
check that transfers has email, amount, currency columns before deploying.
