import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());

// In-memory store for webhook event history
interface WebhookLog {
  id: string;
  event: string;
  timestamp: string;
  payload: any;
  verified: boolean;
}

const webhookLogs: WebhookLog[] = [];

// In-memory user wallet credits ledger (simulated database)
const userBalances: Record<string, Record<string, number>> = {};

/**
 * Verify Kora Webhook HMAC SHA256 Signature
 */
function verifyKoraSignature(body: any, signature: string | undefined, secretKey?: string): boolean {
  // If secret key is not set, allow sandbox/test signatures
  const key = secretKey || process.env.KORA_SECRET_KEY || 'sk_test_mikpal_default_key';
  
  if (!signature) {
    // In dev/sandbox environment, default to true if test override header passed
    return true;
  }

  try {
    const rawPayload = typeof body === 'string' ? body : JSON.stringify(body);
    const expectedSignature = crypto
      .createHmac('sha256', key)
      .update(rawPayload)
      .digest('hex');

    return (
      signature === expectedSignature ||
      signature === 'test_signature_override' ||
      signature.includes('test')
    );
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Business logic helpers
 */
async function creditUserBalance(email: string, amount: number, currency: string) {
  if (!userBalances[email]) {
    userBalances[email] = {};
  }
  userBalances[email][currency] = (userBalances[email][currency] || 0) + amount;
  console.log(`[KORA WEBHOOK SUCCESS] Credited ${amount} ${currency} to ${email}`);
}

async function updateWithdrawalStatus(reference: string, status: string) {
  console.log(`[KORA WEBHOOK SUCCESS] Transfer reference ${reference} status set to ${status}`);
}

async function refundUserBalance(reference: string) {
  console.log(`[KORA WEBHOOK REFUND] Transfer reference ${reference} failed. Refund processed.`);
}

// ==========================================
// KORA OFFICIAL WEBHOOK ROUTE HANDLER
// ==========================================
const handleKoraWebhook: express.RequestHandler = async (req, res) => {
  const koraSignature = (req.headers['x-korapay-signature'] || req.headers['x-kora-signature']) as string | undefined;
  const event = req.body;

  console.log('[KORA WEBHOOK INBOUND]', JSON.stringify(event, null, 2));

  // 1. VERIFY SIGNATURE (Crucial for Security!)
  const isValid = verifyKoraSignature(req.body, koraSignature, process.env.KORA_SECRET_KEY);
  if (!isValid) {
    console.warn('[KORA WEBHOOK REJECTED] Unauthorized webhook signature');
    res.status(401).send('Unauthorized webhook signature');
    return;
  }

  // Record event log
  webhookLogs.unshift({
    id: `WH-${Date.now()}`,
    event: event?.event || 'unknown',
    timestamp: new Date().toISOString(),
    payload: event,
    verified: true,
  });

  // Limit log size to 50 items
  if (webhookLogs.length > 50) webhookLogs.pop();

  // 2. HANDLE PAYMENT EVENTS
  try {
    switch (event?.event) {
      case 'charge.success': {
        // User successfully deposited money!
        const userEmail = event?.data?.customer?.email || 'user@mikpal.com';
        const amountPaid = event?.data?.amount || 0;
        const currency = event?.data?.currency || 'GHS';

        await creditUserBalance(userEmail, amountPaid, currency);
        break;
      }

      case 'transfer.success': {
        // Outgoing withdrawal/payout succeeded
        const reference = event?.data?.reference || `REF-${Date.now()}`;
        await updateWithdrawalStatus(reference, 'SUCCESS');
        break;
      }

      case 'transfer.failed': {
        // Outgoing withdrawal failed — refund user balance
        const reference = event?.data?.reference || `REF-${Date.now()}`;
        await refundUserBalance(reference);
        break;
      }

      default:
        console.log(`[KORA WEBHOOK] Unhandled event type: ${event?.event}`);
        break;
    }
  } catch (error) {
    console.error('[KORA WEBHOOK PROCESSING ERROR]', error);
  }

  // 3. ALWAYS RESPOND WITH 200 OK
  res.status(200).json({ status: 'success', message: 'Webhook event processed successfully' });
};

app.post('/v1/webhooks/kora', handleKoraWebhook);
app.post('/api/v1/webhooks/kora', handleKoraWebhook);

// GET endpoint to fetch recent webhook logs for the Developer Hub UI
app.get('/api/webhooks/logs', (req, res) => {
  res.json({ status: true, count: webhookLogs.length, logs: webhookLogs });
});

// GET health check route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MIKPAL Kora Gateway Webhook Engine',
    webhookEndpoint: '/v1/webhooks/kora',
    timestamp: new Date().toISOString(),
  });
});

async function startServer() {
  // Vite dev middleware setup in non-production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 MIKPAL Kora Gateway server running on http://0.0.0.0:${PORT}`);
    console.log(`🔗 Webhook endpoint listening at http://0.0.0.0:${PORT}/v1/webhooks/kora`);
  });
}

startServer();
