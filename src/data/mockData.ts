import { CountryCode } from '../types';

// Real country data (not mock — this is reference data)
export const COUNTRIES: Record<CountryCode, { name: string; flag: string; currency: string; currencySymbol: string; phoneCode: string }> = {
  GH: { name: 'Ghana', flag: '🇬🇭', currency: 'GHS', currencySymbol: '₵', phoneCode: '+233' },
  NG: { name: 'Nigeria', flag: '🇳🇬', currency: 'NGN', currencySymbol: '₦', phoneCode: '+234' },
  KE: { name: 'Kenya', flag: '🇰🇪', currency: 'KES', currencySymbol: 'KSh', phoneCode: '+254' },
  ZA: { name: 'South Africa', flag: '🇿🇦', currency: 'ZAR', currencySymbol: 'R', phoneCode: '+27' },
  UG: { name: 'Uganda', flag: '🇺🇬', currency: 'UGX', currencySymbol: 'USh', phoneCode: '+256' },
  TZ: { name: 'Tanzania', flag: '🇹🇿', currency: 'TZS', currencySymbol: 'TSh', phoneCode: '+255' },
  RW: { name: 'Rwanda', flag: '🇷🇼', currency: 'RWF', currencySymbol: 'FRw', phoneCode: '+250' },
  US: { name: 'United States', flag: '🇺🇸', currency: 'USD', currencySymbol: '$', phoneCode: '+1' },
  GB: { name: 'United Kingdom', flag: '🇬🇧', currency: 'GBP', currencySymbol: '£', phoneCode: '+44' },
  CA: { name: 'Canada', flag: '🇨🇦', currency: 'CAD', currencySymbol: 'C$', phoneCode: '+1' },
};

// Empty default profile — real data comes from API
export const DEFAULT_USER_PROFILE = null;

// Bank destinations for payouts (reference data)
export const BANK_DESTINATIONS: BankDestination[] = [
  { code: 'MTN', name: 'MTN Mobile Money', type: 'MOBILE_MONEY', country: 'GH' },
  { code: 'VOD', name: 'Vodafone Cash', type: 'MOBILE_MONEY', country: 'GH' },
  { code: 'ATL', name: 'AirtelTigo Money', type: 'MOBILE_MONEY', country: 'GH' },
  { code: 'GTB', name: 'GTBank', type: 'BANK', country: 'GH' },
  { code: 'ECO', name: 'Ecobank', type: 'BANK', country: 'GH' },
  { code: 'ZEN', name: 'Zenith Bank', type: 'BANK', country: 'GH' },
];

export interface BankDestination {
  code: string;
  name: string;
  type: 'MOBILE_MONEY' | 'BANK';
  country: string;
}

// FX rates removed — use real API for currency conversion
