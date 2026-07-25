import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Transaction, RecipientProfile } from '../types';
import { RECIPIENTS, COUNTRIES } from '../data/mockData';
import {
  Search,
  X,
  Send,
  CreditCard,
  ShieldCheck,
  Calculator,
  ArrowUpRight,
  User,
  History,
  Lock,
  ArrowRight
} from 'lucide-react';

interface GlobalSearchBarProps {
  user: UserProfile;
  onNavigateTab: (tab: 'HOME' | 'PAYOUT' | 'CARDS' | 'PROFILE' | 'KYC' | 'TRANSACTIONS') => void;
  onOpenDepositModal?: () => void;
  onOpenFxCalc?: () => void;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  user,
  onNavigateTab,
  onOpenDepositModal,
  onOpenFxCalc,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const query = searchQuery.trim().toLowerCase();

  // App Features List
  const FEATURES = [
    { id: 'deposit', title: 'Deposit Funds & Virtual Accounts', tab: 'HOME', action: onOpenDepositModal, icon: ArrowUpRight },
    { id: 'payout', title: 'Send Payout & Bank Transfer', tab: 'PAYOUT', icon: Send },
    { id: 'cards', title: 'Issue Virtual Visa / Mastercard', tab: 'CARDS', icon: CreditCard },
    { id: 'profile', title: 'Profile & Settings Hub', tab: 'PROFILE', icon: User },
    { id: 'pin', title: 'Transaction PIN & Security', tab: 'PROFILE', icon: Lock },
    { id: 'kyc', title: 'KYC Vault & Biometrics', tab: 'KYC', icon: ShieldCheck },
    { id: 'fx', title: 'Live FX Calculator', tab: 'HOME', action: onOpenFxCalc, icon: Calculator },
  ];

  const matchedFeatures = query
    ? FEATURES.filter((f) => f.title.toLowerCase().includes(query))
    : [];

  const matchedContacts = query
    ? RECIPIENTS.filter(
        (r) =>
          r.fullName.toLowerCase().includes(query) ||
          r.username.toLowerCase().includes(query) ||
          r.country.toLowerCase().includes(query)
      )
    : [];

  const matchedTxns = query
    ? user.transactions.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          (t.subtitle && t.subtitle.toLowerCase().includes(query)) ||
          t.reference.toLowerCase().includes(query) ||
          t.amount.toString().includes(query) ||
          t.currency.toLowerCase().includes(query)
      )
    : [];

  const hasResults =
    matchedFeatures.length > 0 || matchedContacts.length > 0 || matchedTxns.length > 0;

  return (
    <div ref={containerRef} className="relative w-full z-30 mb-6">
      <div className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="🔍 Search transactions, contacts, or features..."
          className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F26522] shadow-xs transition"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* SEARCH RESULTS DROPDOWN POPOVER */}
      {isOpen && searchQuery.trim() !== '' && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden max-h-96 overflow-y-auto animate-in fade-in">
          {!hasResults ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No matching transactions, contacts, or features found for "{searchQuery}".
            </div>
          ) : (
            <div className="p-3 space-y-4">
              
              {/* FEATURES MATCHES */}
              {matchedFeatures.length > 0 && (
                <div>
                  <p className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Features & Actions
                  </p>
                  <div className="space-y-1">
                    {matchedFeatures.map((feat) => {
                      const Icon = feat.icon;
                      return (
                        <button
                          key={feat.id}
                          onClick={() => {
                            setIsOpen(false);
                            setSearchQuery('');
                            if (feat.action) feat.action();
                            onNavigateTab(feat.tab as any);
                          }}
                          className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl text-left transition group"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-orange-50 text-[#F26522] rounded-lg">
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-xs text-slate-900 group-hover:text-[#F26522]">
                              {feat.title}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#F26522]" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* CONTACTS MATCHES */}
              {matchedContacts.length > 0 && (
                <div>
                  <p className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    P2P Contacts
                  </p>
                  <div className="space-y-1">
                    {matchedContacts.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => {
                          setIsOpen(false);
                          setSearchQuery('');
                          onNavigateTab('PAYOUT');
                        }}
                        className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl text-left transition group"
                      >
                        <div className="flex items-center gap-2.5">
                          <img
                            src={contact.avatar}
                            alt={contact.fullName}
                            className="w-7 h-7 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900 block leading-tight">
                              {contact.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              @{contact.username} • {contact.flag}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          Send Money
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TRANSACTIONS MATCHES */}
              {matchedTxns.length > 0 && (
                <div>
                  <p className="px-2 text-[10px] font-black uppercase text-slate-400 tracking-wider mb-1">
                    Recent Transactions
                  </p>
                  <div className="space-y-1">
                    {matchedTxns.slice(0, 4).map((txn) => (
                      <div
                        key={txn.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{txn.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {txn.reference} • {txn.date}
                          </p>
                        </div>
                        <span className="font-bold font-mono text-slate-900">
                          {txn.currencySymbol}
                          {txn.amount.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      )}
    </div>
  );
};
