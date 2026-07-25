import React, { useState, useEffect } from 'react';
import { UserProfile, WalletBalance } from '../types';
import { COUNTRIES, FX_RATES_TO_USD } from '../data/mockData';
import { BankAccountCards } from './BankAccountCards';
import { GlobalSearchBar } from './GlobalSearchBar';
import {
  Wallet,
  ArrowUpRight,
  Send,
  CreditCard,
  ShieldCheck,
  Globe,
  ChevronDown,
  Check,
  X,
  Clock,
  Sparkles,
  ArrowRightLeft,
  AlertTriangle,
  Lock,
  ArrowRight
} from 'lucide-react';

interface DashboardViewProps {
  user: UserProfile;
  onActivateUsdAccount: () => void;
  onDepositFunds: (amount: number, currency: string, method: string) => void;
  onNavigateTab: (tab: 'OVERVIEW' | 'SEND' | 'CARDS' | 'KYC' | 'TRANSACTIONS') => void;
  onOpenDepositModal: () => void;
}

const CURRENCY_META: Record<string, { name: string; flag: string; symbol: string }> = {
  GHS: { name: 'Ghanaian Cedi', flag: '🇬🇭', symbol: '₵' },
  USD: { name: 'US Dollar', flag: '🇺🇸', symbol: '$' },
  NGN: { name: 'Nigerian Naira', flag: '🇳🇬', symbol: '₦' },
  KES: { name: 'Kenyan Shilling', flag: '🇰🇪', symbol: 'KSh' },
  ZAR: { name: 'South African Rand', flag: '🇿🇦', symbol: 'R' },
  EUR: { name: 'Euro', flag: '🇪🇺', symbol: '€' },
  GBP: { name: 'British Pound', flag: '🇬🇧', symbol: '£' },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  onActivateUsdAccount,
  onDepositFunds,
  onNavigateTab,
  onOpenDepositModal,
}) => {
  const countryInfo = COUNTRIES[user.country];
  const [selectedCurrency, setSelectedCurrency] = useState<string>(countryInfo.currency);
  const [showCurrencyModal, setShowCurrencyModal] = useState<boolean>(false);
  const [showKycBlocker, setShowKycBlocker] = useState<boolean>(false);
  const [blockerActionName, setBlockerActionName] = useState<string>('banking features');

  // Sync default currency if user switches country context
  useEffect(() => {
    setSelectedCurrency(countryInfo.currency);
  }, [user.country, countryInfo.currency]);

  const isUnverified = user.kycStatus === 'UNVERIFIED';

  const handleGuardedAction = (actionName: string, executeCallback: () => void) => {
    if (isUnverified) {
      setBlockerActionName(actionName);
      setShowKycBlocker(true);
    } else {
      executeCallback();
    }
  };

  // Retrieve selected wallet or fallback
  const currentWallet: WalletBalance = user.wallets[selectedCurrency] || {
    currency: selectedCurrency,
    currencySymbol: CURRENCY_META[selectedCurrency]?.symbol || '$',
    available: 0,
    pending: 0,
    flag: CURRENCY_META[selectedCurrency]?.flag || '🌐',
  };

  const meta = CURRENCY_META[selectedCurrency] || {
    name: `${selectedCurrency} Wallet`,
    flag: currentWallet.flag,
    symbol: currentWallet.currencySymbol,
  };

  // Filter transactions for the selected currency, or show recent all
  const filteredTransactions = user.transactions.filter(
    (t) => t.currency === selectedCurrency || t.convertedCurrency === selectedCurrency
  );
  const displayTransactions = filteredTransactions.length > 0 ? filteredTransactions : user.transactions;

  return (
    <div className="space-y-6">

      {/* STICKY GLOBAL SEARCH BAR */}
      <GlobalSearchBar
        user={user}
        onNavigateTab={(tab) => {
          if (tab === 'HOME') onNavigateTab('OVERVIEW');
          else if (tab === 'PAYOUT') onNavigateTab('SEND');
          else onNavigateTab(tab as any);
        }}
        onOpenDepositModal={onOpenDepositModal}
      />

      {/* ⚠️ PROGRESSIVE KYC UNVERIFIED BANNER (SOFT NUDGE) */}
      {isUnverified && (
        <div className="p-5 bg-amber-500/10 border-2 border-amber-500/40 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-800 rounded-2xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span>Account Setup Incomplete (Tier 0)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold uppercase">
                  Verification Required
                </span>
              </h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Verify your identity to generate virtual bank accounts, send cross-border transfers, and issue virtual cards.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('KYC')}
            className="shrink-0 px-5 py-2.5 bg-[#F26522] hover:bg-orange-600 text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
          >
            <span>Complete KYC Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      
      {/* 1. SINGLE MAIN BALANCE HERO CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        
        {/* Ambient Glow Sheen */}
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-[#F26522]/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-[#00796B]/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-6">
          
          {/* Top Row: Wallet Label + Tappable Currency Switcher Pill */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl sm:text-3xl">{currentWallet.flag}</span>
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  {meta.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Primary Operating Wallet
                </span>
              </div>
            </div>

            {/* TAPPABLE CURRENCY SWITCHER PILL */}
            <button
              onClick={() => setShowCurrencyModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800/90 hover:bg-slate-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl border border-slate-700 shadow-md transition cursor-pointer active:scale-95 group"
              title="Click to switch currency view"
            >
              <span className="flex items-center gap-1.5">
                <span>{currentWallet.flag}</span>
                <span className="font-mono">{selectedCurrency}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-[#F26522] group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Main Focused Balance Display */}
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-6xl font-black text-white font-mono tracking-tight">
                {currentWallet.currencySymbol}
                {currentWallet.available.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-sm sm:text-base font-bold text-slate-400 font-mono">
                {selectedCurrency}
              </span>
            </div>

            {currentWallet.pending > 0 && (
              <p className="text-xs text-amber-400 font-bold mt-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  +{currentWallet.currencySymbol}{currentWallet.pending.toLocaleString()} pending settlement
                </span>
              </p>
            )}
          </div>

          {/* STREAMLINED QUICK ACTIONS (Directly beneath total balance) */}
          <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-slate-800/80">
            <button
              onClick={() => handleGuardedAction('generating deposits and virtual accounts', onOpenDepositModal)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-[#F26522] hover:bg-orange-600 text-white font-black text-xs rounded-2xl shadow-lg shadow-orange-500/20 transition active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>+ Deposit</span>
            </button>

            <button
              onClick={() => handleGuardedAction('sending payouts and transfers', () => onNavigateTab('SEND'))}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-[#00796B] hover:bg-teal-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-teal-500/20 transition active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>→ Send</span>
            </button>

            <button
              onClick={() => handleGuardedAction('issuing virtual cards', () => onNavigateTab('CARDS'))}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-black text-xs rounded-2xl shadow-md transition active:scale-95"
            >
              <span>Manage Cards</span>
            </button>
          </div>

          {/* KYC & Regional Status */}
          <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400 flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className={`w-4 h-4 ${isUnverified ? 'text-amber-400' : 'text-emerald-400'} shrink-0`} />
              <span>
                KYC Status: <strong className={isUnverified ? 'text-amber-300 uppercase' : 'text-emerald-300 uppercase'}>{user.kycStatus}</strong>
              </span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-300 font-mono text-[11px]">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>{countryInfo.code} Regional Market</span>
            </span>
          </div>

        </div>
      </div>

      {/* 3. RECENT ACTIVITY SECTION FOR SELECTED CURRENCY */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Activity Overview ({selectedCurrency})</h3>
            <p className="text-xs text-slate-400">Transactions associated with your {selectedCurrency} wallet</p>
          </div>

          <button
            onClick={() => onNavigateTab('TRANSACTIONS')}
            className="text-xs font-bold text-[#F26522] hover:underline"
          >
            See All Logs ({user.transactions.length})
          </button>
        </div>

        {displayTransactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No recent activity on your {selectedCurrency} wallet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {displayTransactions.slice(0, 4).map((t) => (
              <div key={t.id} className="py-3 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 block">{t.title}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {t.reference} • {t.date}
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {t.currencySymbol}
                  {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {t.currency}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* HARD BLOCKER MODAL FOR UNVERIFIED USERS */}
      {showKycBlocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-5 relative">
            <button
              onClick={() => setShowKycBlocker(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <Lock className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900">Identity Verification Required</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                To comply with regional financial regulations, identity verification is mandatory before <strong>{blockerActionName}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>KYC Vault Unlock Benefits:</span>
              </div>
              <ul className="space-y-1 text-slate-600 list-disc list-inside text-[11px]">
                <li>Issued Virtual Bank Account in {countryInfo.currency}</li>
                <li>Instant Cross-Border Payouts & Internal Transfers</li>
                <li>Instant Visa / Mastercard Virtual Card Issuance</li>
              </ul>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowKycBlocker(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowKycBlocker(false);
                  onNavigateTab('KYC');
                }}
                className="flex-1 py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Verify in Vault</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CURRENCY SELECTOR MODAL / BOTTOM SHEET */}
      {showCurrencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in zoom-in-95">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/20 text-[#F26522] rounded-xl border border-orange-500/30">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-sm tracking-tight">Select Operating Wallet</h4>
                  <p className="text-[11px] text-slate-400">Switch active balance display & rates</p>
                </div>
              </div>

              <button
                onClick={() => setShowCurrencyModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wallet Options List */}
            <div className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto">
              {Object.keys(CURRENCY_META).map((currKey) => {
                const cMeta = CURRENCY_META[currKey];
                const wallet = user.wallets[currKey];
                const isSelected = currKey === selectedCurrency;
                const available = wallet ? wallet.available : 0;

                return (
                  <button
                    key={currKey}
                    onClick={() => {
                      setSelectedCurrency(currKey);
                      setShowCurrencyModal(false);
                    }}
                    className={`w-full p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-orange-50/80 border-[#F26522] ring-2 ring-[#F26522]/30 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100/90'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cMeta.flag}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-sm">{currKey}</span>
                          <span className="text-xs text-slate-500 font-medium">{cMeta.name}</span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                          Available: {cMeta.symbol}{available.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="p-1 bg-[#F26522] text-white rounded-full">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-100 border-t border-slate-200 text-center">
              <p className="text-[11px] text-slate-500">
                Zero exchange markup on all internal multi-currency wallet transfers.
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
