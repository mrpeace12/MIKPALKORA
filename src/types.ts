export type CountryCode = 'GH' | 'NG' | 'KE' | 'ZA';

export interface CountryInfo {
  code: CountryCode;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  phoneCode: string;
  cardPriceLocal: string;
  cardPriceAmount: number;
  supportsLocalVBA: boolean;
  localBankName?: string;
  kycDocName: string;
  kycDocFormat: string;
  kycFields: {
    key: string;
    label: string;
    placeholder: string;
    type: 'text' | 'number';
    required: boolean;
  }[];
}

export interface BankAccount {
  id: string;
  type: 'LOCAL' | 'USD_GLOBAL';
  accountName: string;
  accountNumber: string;
  bankName: string;
  bankCode?: string;
  routingNumber?: string;
  swiftCode?: string;
  currency: string;
  status: 'ACTIVE' | 'PENDING' | 'SUSPENDED';
  isDefault: boolean;
  detailsBanner?: string;
}

export interface WalletBalance {
  currency: string;
  currencySymbol: string;
  available: number;
  pending: number;
  flag: string;
}

export interface VirtualCard {
  id: string;
  brand: 'VISA' | 'MASTERCARD';
  cardHolderName: string;
  cardNumber: string; // 16 digits
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'FROZEN' | 'TERMINATED';
  spendLimitMonthly: number;
  spentThisMonth: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  reference: string;
  title: string;
  subtitle?: string;
  type: 'P2P_SEND' | 'P2P_RECEIVE' | 'CARD_PURCHASE' | 'DEPOSIT' | 'USD_ACTIVATION' | 'CARD_ISSUANCE' | 'BANK_TRANSFER';
  amount: number;
  currency: string;
  currencySymbol: string;
  convertedAmount?: number;
  convertedCurrency?: string;
  convertedSymbol?: string;
  fxRate?: number;
  fee: number;
  status: 'SUCCESS' | 'PROCESSING' | 'FAILED';
  date: string;
  recipientUsername?: string;
  recipientAvatar?: string;
  recipientCountryFlag?: string;
  cardLast4?: string;
  bankName?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  country: CountryCode;
  phone: string;
  avatar: string;
  kycStatus: 'VERIFIED' | 'PENDING' | 'UNVERIFIED';
  kycDocuments: {
    docType: string;
    docNumber: string;
    verifiedAt?: string;
    status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  }[];
  wallets: Record<string, WalletBalance>; // e.g. { GHS: ..., USD: ... }
  bankAccounts: BankAccount[];
  cards: VirtualCard[];
  transactions: Transaction[];
  securityPin: string;
  biometricEnabled?: boolean;
  preferredCurrency?: string;
}

export interface RecipientProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  country: CountryCode;
  flag: string;
  avatar: string;
  defaultCurrency: string;
}

export interface AdminAuditLog {
  id: string;
  timestamp: string;
  actor: string;
  category: 'LOGIN' | 'SETTLEMENT' | 'KYC_OVERRIDE' | 'CARD_MANAGEMENT' | 'DISBURSEMENT' | 'CHARGEBACK' | 'SETTINGS';
  action: string;
  details: string;
  ipAddress: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface AdminChargeback {
  id: string;
  reference: string;
  paymentReference: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  deadline: string;
  reason: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'PARTIAL' | 'WON' | 'LOST';
  approvedAmount?: number;
  evidenceUrl?: string;
  createdAt: string;
}

export interface WebhookEventLog {
  id: string;
  event: string; // e.g. "charge.success", "payout.success", "direct_debit.auth"
  reference: string;
  url: string;
  httpStatus: number;
  attempts: number;
  status: 'DELIVERED' | 'FAILED' | 'RETRYING';
  timestamp: string;
  payload: Record<string, any>;
}

