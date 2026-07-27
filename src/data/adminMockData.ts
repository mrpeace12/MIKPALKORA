import { AdminAuditLog, AdminChargeback, WebhookEventLog } from '../types';

export const INITIAL_ADMIN_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'LOG-882910',
    timestamp: '2026-07-25 15:42:10',
    actor: 'Admin (Master Key)',
    category: 'SETTINGS',
    action: 'Scrubbed Uncertified PCI Claims',
    details: 'Scrubbed all public PCI-DSS Level 1 references & updated copy to Bank-Grade Encryption.',
    ipAddress: '197.210.22.44',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-882909',
    timestamp: '2026-07-25 14:18:05',
    actor: 'Compliance System',
    category: 'KYC_OVERRIDE',
    action: 'eIDV CAC Verification Approved',
    details: 'RC00000011 (John Doe Inc) verified against CAC Nigeria Registry via eIDV endpoint.',
    ipAddress: '10.0.4.12',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-882908',
    timestamp: '2026-07-25 13:05:44',
    actor: 'Card Issuing Switch',
    category: 'CARD_MANAGEMENT',
    action: 'USD Virtual Card Issued',
    details: 'Issued Visa Card ending in 6714 for Kwame Mensah ($500.00 initial float).',
    ipAddress: '102.176.19.2',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-882907',
    timestamp: '2026-07-25 11:30:22',
    actor: 'Disbursement Engine',
    category: 'DISBURSEMENT',
    action: 'Bulk Mobile Money Payout Processed',
    details: 'Batch BATCH-KE-88390 executed 14 payouts totaling KES 2,450,000 via Safaricom M-Pesa.',
    ipAddress: '197.254.12.89',
    status: 'SUCCESS',
  },
  {
    id: 'LOG-882906',
    timestamp: '2026-07-25 09:12:15',
    actor: 'Risk Guard Rail',
    category: 'CHARGEBACK',
    action: 'Chargeback Dispute Logged',
    details: 'Dispute KPY-CHG-9w905W7Q raised by Access Bank on TXN KPY-PAY-ZKEUshae ($100.00 NGN).',
    ipAddress: '105.112.4.11',
    status: 'WARNING',
  },
  {
    id: 'LOG-882905',
    timestamp: '2026-07-25 08:00:00',
    actor: 'NIBSS E-Mandate Gateway',
    category: 'SETTLEMENT',
    action: 'Direct Debit Mandate Activated',
    details: 'NIBSS Variable Direct Debit mandate KPY-AUTH-7d2f9c0e approved for NGN 500,000 cap.',
    ipAddress: '10.0.1.200',
    status: 'SUCCESS',
  },
];

export const INITIAL_CHARGEBACKS: AdminChargeback[] = [
  {
    id: 'CHG-9021',
    reference: 'KPY-CHG-9w905W7QY2A9jzw',
    paymentReference: 'KPY-PAY-ZKEUshaeZcC1pzLB',
    customerName: 'Ope Praise',
    customerEmail: 'ope.praise@gmail.com',
    amount: 150.00,
    currency: 'USD',
    deadline: '2026-08-10T23:59:59.000Z',
    reason: 'Fraudulent transaction - Cardholder claims unapproved digital purchase',
    status: 'PENDING',
    createdAt: '2026-07-24 16:30:00',
  },
  {
    id: 'CHG-9020',
    reference: 'KPY-CHG-440192837482',
    paymentReference: 'KPY-PAY-882910293847',
    customerName: 'Emmanuel Adebayo',
    customerEmail: 'e.adebayo@yahoo.com',
    amount: 35000.00,
    currency: 'NGN',
    deadline: '2026-07-29T18:00:00.000Z',
    reason: 'Services not rendered within agreed timeframe',
    status: 'DECLINED',
    approvedAmount: 0,
    evidenceUrl: 'https://mikpal.com/evidence/rebuttal_doc_8820.pdf',
    createdAt: '2026-07-22 11:15:00',
  },
  {
    id: 'CHG-9019',
    reference: 'KPY-CHG-102938475612',
    paymentReference: 'KPY-PAY-009182736451',
    customerName: 'Amina Zainab',
    customerEmail: 'zainab.a@outlook.com',
    amount: 1200.00,
    currency: 'KES',
    deadline: '2026-07-20T12:00:00.000Z',
    reason: 'Duplicate billing error on STK Push',
    status: 'ACCEPTED',
    approvedAmount: 1200.00,
    createdAt: '2026-07-18 09:45:00',
  },
];

export const INITIAL_WEBHOOK_LOGS: WebhookEventLog[] = [
  {
    id: 'WH-9001',
    event: 'charge.success',
    reference: 'KPY-PAY-47AgdDKFMklhVSg',
    url: 'https://merchant-app.com/webhooks/korapay',
    httpStatus: 200,
    attempts: 1,
    status: 'DELIVERED',
    timestamp: '2026-07-25 15:35:10',
    payload: {
      event: 'charge.success',
      data: {
        reference: 'KPY-PAY-47AgdDKFMklhVSg',
        currency: 'USD',
        amount: 500,
        fee: 2.50,
        status: 'success',
        customer: { name: 'Kwame Mensah', email: 'kwame@mikpal.com' }
      }
    }
  },
  {
    id: 'WH-9002',
    event: 'issuing.card_funding.success',
    reference: 'KPY-CARD-FUND-88201',
    url: 'https://merchant-app.com/webhooks/korapay',
    httpStatus: 200,
    attempts: 1,
    status: 'DELIVERED',
    timestamp: '2026-07-25 14:10:00',
    payload: {
      event: 'issuing.card_funding.success',
      data: {
        card_reference: 'Card-Ref-0000-0011',
        amount: 250,
        currency: 'USD',
        card_balance: 750.00
      }
    }
  },
  {
    id: 'WH-9003',
    event: 'direct_debit.auth',
    reference: 'KPY-AUTH-7d2f9c0e',
    url: 'https://merchant-app.com/webhooks/korapay',
    httpStatus: 502,
    attempts: 3,
    status: 'RETRYING',
    timestamp: '2026-07-25 12:00:15',
    payload: {
      event: 'direct_debit.auth',
      status: 'success',
      data: {
        authorization_code: 'KPY-AUTH-7d2f9c0e',
        debit_type: 'variable',
        amount_cap: 500000,
        currency: 'NGN'
      }
    }
  }
];

export const MASTER_LIQUIDITY_POOLS = {
  USD: { total: 2450890.50, available: 1950000.00, issuingFloat: 245850.00, pendingSettlement: 255040.50, flag: '🇺🇸' },
  NGN: { total: 485900250.00, available: 412000000.00, issuingFloat: 0, pendingSettlement: 73900250.00, flag: '🇳🇬' },
  GHS: { total: 4250900.00, available: 3800000.00, issuingFloat: 0, pendingSettlement: 450900.00, flag: '🇬🇭' },
  KES: { total: 38200150.00, available: 32000000.00, issuingFloat: 0, pendingSettlement: 6200150.00, flag: '🇰🇪' },
  ZAR: { total: 8500200.00, available: 7200000.00, issuingFloat: 0, pendingSettlement: 1300200.00, flag: '🇿🇦' },
  XOF: { total: 120500000.00, available: 110000000.00, issuingFloat: 0, pendingSettlement: 10500000.00, flag: '🇨🇮' },
};
