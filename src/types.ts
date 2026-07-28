export type CountryCode = 'GH' | 'NG' | 'KE' | 'ZA' | 'UG' | 'TZ' | 'RW' | 'US' | 'GB' | 'CA';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  country: CountryCode;
  phone: string;
  avatar: string;
  kycStatus: 'VERIFIED' | 'UNVERIFIED' | 'PENDING';
  kycDocuments: KycDocument[];
  wallets: Record<string, Wallet>;
  bankAccounts: BankAccount[];
  cards: VirtualCard[];
  transactions: Transaction[];
  securityPin: string;
}

export interface Wallet {
  currency: string;
  currencySymbol: string;
  available: number;
  pending: number;
  flag: string;
}

export interface KycDocument {
  docType: string;
  docNumber: string;
  verifiedAt: string;
  status: string;
}

export interface BankAccount {
  id: string;
  type: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  routingNumber?: string;
  swiftCode?: string;
  currency: string;
  status: string;
  isDefault: boolean;
  detailsBanner?: string;
}

export interface VirtualCard {
  id: string;
  brand: 'VISA' | 'MASTERCARD';
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  status: 'ACTIVE' | 'FROZEN';
  balance: number;
  limit: number;
  color: string;
}

export interface Transaction {
  id: string;
  reference: string;
  title: string;
  subtitle?: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'P2P_SEND' | 'P2P_RECEIVE' | 'CARD_PURCHASE' | 'BANK_TRANSFER' | 'USD_ACTIVATION' | 'CARD_TOPUP' | 'FEE';
  amount: number;
  currency: string;
  currencySymbol: string;
  fee: number;
  status: 'SUCCESS' | 'PROCESSING' | 'FAILED' | 'REVERSED';
  date: string;
  convertedAmount?: number;
  convertedCurrency?: string;
  convertedSymbol?: string;
  fxRate?: number;
  recipientUsername?: string;
  recipientAvatar?: string;
  recipientCountryFlag?: string;
  bankName?: string;
}

export interface RecipientProfile {
  username: string;
  fullName: string;
  avatar: string;
  country: CountryCode;
  flag: string;
  currency: string;
  currencySymbol: string;
}
