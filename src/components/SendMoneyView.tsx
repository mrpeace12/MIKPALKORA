import React, { useState } from 'react';
import { UserProfile, RecipientProfile } from '../types';
import { RECIPIENTS, FX_RATES_TO_USD, COUNTRIES, REGIONAL_BANKS, BankDestination } from '../data/mockData';
import { PinVerificationModal } from './PinVerificationModal';
import { GlobalSearchBar } from './GlobalSearchBar';
import { Logo } from './Logo';
import { PaymentChannelBadge } from './PaymentLogos';
import {
  Send,
  Search,
  CheckCircle2,
  ShieldCheck,
  Lock,
  ArrowRight,
  Wallet,
  RefreshCw,
  Building2,
  Globe,
  Smartphone,
  CreditCard,
  UserCheck,
  Check,
  AlertCircle
} from 'lucide-react';

interface SendMoneyViewProps {
  user: UserProfile;
  onExecuteP2PTransfer: (
    recipient: RecipientProfile,
    sendAmount: number,
    debitCurrency: string,
    receivedAmount: number,
    receiveCurrency: string,
    fxRate: number
  ) => void;
  onExecuteBankPayout: (
    debitSource: string, // wallet currency or account id
    sendAmount: number,
    debitCurrency: string,
    destBank: BankDestination,
    accountNumber: string,
    accountName: string,
    payoutAmount: number,
    payoutCurrency: string,
    fxRate: number
  ) => void;
  onNavigateTab?: (tab: 'OVERVIEW' | 'SEND' | 'CARDS' | 'PROFILE' | 'KYC' | 'TRANSACTIONS') => void;
}

export const SendMoneyView: React.FC<SendMoneyViewProps> = ({
  user,
  onExecuteP2PTransfer,
  onExecuteBankPayout,
  onNavigateTab,
}) => {
  const [transferMode, setTransferMode] = useState<'P2P' | 'BANK_PAYOUT'>('BANK_PAYOUT');

  // --- MODE 1: P2P STATES ---
  const [searchTerm, setSearchText] = useState<string>('');
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientProfile | null>(null);
  const [p2pDebitCurrency, setP2pDebitCurrency] = useState<string>(COUNTRIES[user.country].currency);
  const [p2pSendAmount, setP2pSendAmount] = useState<string>('50');

  // --- MODE 2: BANK / MOBILE MONEY PAYOUT STATES ---
  const [payoutDebitSource, setPayoutDebitSource] = useState<string>(
    user.bankAccounts[0]?.id || COUNTRIES[user.country].currency
  );
  const [destCountry, setDestCountry] = useState<string>(user.country);
  const countryBanks = REGIONAL_BANKS[destCountry as keyof typeof REGIONAL_BANKS] || REGIONAL_BANKS['GH'];
  const [selectedBank, setSelectedBank] = useState<BankDestination>(countryBanks[0]);
  const [accountNumber, setAccountNumber] = useState<string>('0129384012');
  const [isResolvingAccount, setIsResolvingAccount] = useState<boolean>(false);
  const [resolvedAccountName, setResolvedAccountName] = useState<string>('Emmanuel Adewale');
  const [payoutSendAmount, setPayoutSendAmount] = useState<string>('100');

  // Security PIN Modal states
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [inputPin, setInputPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [transferSuccess, setTransferSuccess] = useState<boolean>(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);

  // Available user wallet currencies
  const userWalletKeys = Object.keys(user.wallets);

  // Determine debit currency & available balance for Payout
  let payoutDebitCurrency = COUNTRIES[user.country].currency;
  let payoutAvailableBalance = user.wallets[payoutDebitCurrency]?.available || 0;

  const selectedBankAccount = user.bankAccounts.find((b) => b.id === payoutDebitSource);
  if (selectedBankAccount) {
    payoutDebitCurrency = selectedBankAccount.currency;
    payoutAvailableBalance = user.wallets[payoutDebitCurrency]?.available || 0;
  } else if (user.wallets[payoutDebitSource]) {
    payoutDebitCurrency = payoutDebitSource;
    payoutAvailableBalance = user.wallets[payoutDebitSource].available;
  }

  // Calculate FX & Receive Amount for P2P
  const selectedP2pWallet = user.wallets[p2pDebitCurrency] || { available: 0, currencySymbol: '$' };
  const numP2pSend = parseFloat(p2pSendAmount) || 0;
  const p2pRecipientCurrency = selectedRecipient ? selectedRecipient.defaultCurrency : p2pDebitCurrency;
  const p2pSendToUsd = 1 / (FX_RATES_TO_USD[p2pDebitCurrency] || 1);
  const p2pUsdToReceive = FX_RATES_TO_USD[p2pRecipientCurrency] || 1;
  const p2pFxRate = p2pSendToUsd * p2pUsdToReceive;
  const p2pReceiveAmount = numP2pSend * p2pFxRate;

  // Calculate FX & Receive Amount for Bank Payout
  const numPayoutSend = parseFloat(payoutSendAmount) || 0;
  const destCurrency = COUNTRIES[destCountry as keyof typeof COUNTRIES]?.currency || 'USD';
  const payoutSendToUsd = 1 / (FX_RATES_TO_USD[payoutDebitCurrency] || 1);
  const payoutUsdToDest = FX_RATES_TO_USD[destCurrency] || 1;
  const payoutFxRate = payoutSendToUsd * payoutUsdToDest;
  const payoutReceiveAmount = numPayoutSend * payoutFxRate;

  // Auto resolve account name when account number or bank changes
  const handleAccountNumberChange = (val: string) => {
    setAccountNumber(val);
    if (val.length >= 8) {
      setIsResolvingAccount(true);
      setTimeout(() => {
        setIsResolvingAccount(false);
        if (selectedBank.type === 'MOBILE_MONEY') {
          setResolvedAccountName(`Verified Mobile Wallet: ${user.country === 'GH' ? 'Kofi' : 'Abena'} Mensah`);
        } else {
          setResolvedAccountName(`Verified Bank Account: ${val.endsWith('2') ? 'Adekoya Emmanuel' : 'Grace Olamide'}`);
        }
      }, 400);
    } else {
      setResolvedAccountName('');
    }
  };

  const handleBankChange = (bankCode: string) => {
    const bank = countryBanks.find((b) => b.code === bankCode) || countryBanks[0];
    setSelectedBank(bank);
    if (accountNumber.length >= 8) {
      handleAccountNumberChange(accountNumber);
    }
  };

  // Recipient search match for P2P
  const filteredRecipients = RECIPIENTS.filter((r) => {
    if (r.username.toLowerCase() === user.username.toLowerCase()) return false;
    const query = searchTerm.toLowerCase().replace('@', '');
    return (
      r.username.toLowerCase().includes(query) ||
      r.fullName.toLowerCase().includes(query) ||
      r.email.toLowerCase().includes(query)
    );
  });

  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setInputPin('');

    if (transferMode === 'P2P') {
      if (!selectedRecipient || numP2pSend <= 0) return;
      if (numP2pSend > selectedP2pWallet.available) {
        alert(`Insufficient funds in your ${p2pDebitCurrency} wallet balance.`);
        return;
      }
    } else {
      if (numPayoutSend <= 0) return;
      if (numPayoutSend > payoutAvailableBalance) {
        alert(`Insufficient balance in your ${payoutDebitCurrency} source.`);
        return;
      }
      if (!accountNumber || accountNumber.length < 6) {
        alert('Please enter a valid destination account or mobile money number.');
        return;
      }
    }

    setShowPinModal(true);
  };

  const handleExecuteVerifiedTransfer = () => {
    if (transferMode === 'P2P' && selectedRecipient) {
      onExecuteP2PTransfer(
        selectedRecipient,
        numP2pSend,
        p2pDebitCurrency,
        p2pReceiveAmount,
        p2pRecipientCurrency,
        p2pFxRate
      );

      setLastReceipt({
        type: 'P2P',
        title: `P2P Transfer to @${selectedRecipient.username}`,
        debitText: `${p2pDebitCurrency} ${numP2pSend.toFixed(2)}`,
        recipientText: `${selectedRecipient.fullName} (${selectedRecipient.flag})`,
        creditText: `${COUNTRIES[selectedRecipient.country].currencySymbol}${p2pReceiveAmount.toFixed(2)} ${p2pRecipientCurrency}`,
        feeText: '$0.00 (Zero Internal Fee)',
      });
    } else if (transferMode === 'BANK_PAYOUT') {
      onExecuteBankPayout(
        payoutDebitSource,
        numPayoutSend,
        payoutDebitCurrency,
        selectedBank,
        accountNumber,
        resolvedAccountName || 'Account Holder',
        payoutReceiveAmount,
        destCurrency,
        payoutFxRate
      );

      setLastReceipt({
        type: 'BANK_PAYOUT',
        title: `Bank Transfer to ${selectedBank.name}`,
        debitText: `${payoutDebitCurrency} ${numPayoutSend.toFixed(2)}`,
        recipientText: `${resolvedAccountName || 'Account Holder'} • ${accountNumber}`,
        bankName: selectedBank.name,
        creditText: `${COUNTRIES[destCountry as keyof typeof COUNTRIES]?.currencySymbol || '$'}${payoutReceiveAmount.toFixed(2)} ${destCurrency}`,
        feeText: payoutDebitCurrency === destCurrency ? '$0.00 Local Settlement Fee' : 'Zero FX Markup Fee',
      });
    }

    setShowPinModal(false);
    setTransferSuccess(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* STICKY GLOBAL SEARCH BAR */}
      <GlobalSearchBar
        user={user}
        onNavigateTab={(tab) => {
          if (onNavigateTab) {
            if (tab === 'HOME') onNavigateTab('OVERVIEW');
            else if (tab === 'PAYOUT') onNavigateTab('SEND');
            else onNavigateTab(tab as any);
          }
        }}
      />

      {/* HEADER NAVIGATION CARD & MODE SWITCHER */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shrink-0">
              <Logo size="md" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>MIKPAL Transfer & Payout Checkout</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Send money locally or cross-border via Virtual Bank Routing & Instant P2P.
              </p>
            </div>
          </div>

          {/* Mode Switcher Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => {
                setTransferMode('BANK_PAYOUT');
                setTransferSuccess(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                transferMode === 'BANK_PAYOUT'
                  ? 'bg-white text-[#F26522] shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Virtual Bank Payout</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTransferMode('P2P');
                setTransferSuccess(false);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition ${
                transferMode === 'P2P'
                  ? 'bg-white text-[#F26522] shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Internal P2P</span>
            </button>
          </div>
        </div>
      </div>

      {transferSuccess && lastReceipt ? (
        /* SUCCESS RECEIPT VIEW */
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900">Funds Released & Settled!</h3>
            <p className="text-sm text-slate-500 mt-1">
              {lastReceipt.type === 'BANK_PAYOUT'
                ? 'Your virtual bank payout was routed directly to the destination bank / mobile money network.'
                : 'Your MIKPAL internal P2P payment was delivered instantly.'}
            </p>
          </div>

          <div className="max-w-md mx-auto p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3 text-left">
            <div className="flex justify-between text-slate-600">
              <span>Transfer Mode:</span>
              <span className="font-bold text-slate-900">{lastReceipt.title}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Debited Source:</span>
              <span className="font-bold text-slate-900">{lastReceipt.debitText}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Beneficiary Account:</span>
              <span className="font-bold text-slate-900">{lastReceipt.recipientText}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Credit Amount:</span>
              <span className="font-bold text-emerald-600">{lastReceipt.creditText}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
              <span>Settlement Fee:</span>
              <span className="font-bold text-emerald-600">{lastReceipt.feeText}</span>
            </div>
          </div>

          <button
            onClick={() => {
              setTransferSuccess(false);
            }}
            className="px-6 py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-sm rounded-2xl shadow-md transition"
          >
            Send Another Payout
          </button>
        </div>
      ) : (
        /* MAIN FORM CONTAINER */
        <form onSubmit={handleInitiateTransfer} className="space-y-6">
          
          {/* ================= MODE 1: VIRTUAL BANK & EXTERNAL PAYOUT ================= */}
          {transferMode === 'BANK_PAYOUT' && (
            <>
              {/* STEP 1: Select Source (Wallet Balances) */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-[#F26522]" />
                    <span>1. Debit Source (Wallet Balance)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Available: {payoutAvailableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} {payoutDebitCurrency}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {userWalletKeys.map((curr) => {
                    const w = user.wallets[curr];
                    const isSelected = payoutDebitSource === curr || payoutDebitSource === user.bankAccounts.find(b => b.currency === curr)?.id;
                    return (
                      <button
                        type="button"
                        key={curr}
                        onClick={() => setPayoutDebitSource(curr)}
                        className={`p-4 rounded-2xl border text-left transition flex items-center justify-between ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-[#F26522]'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-900 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{w.flag}</span>
                          <div>
                            <span className="font-extrabold text-sm block">{curr} Wallet</span>
                            <span className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                              Available Ledger
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`text-sm font-black font-mono block ${isSelected ? 'text-emerald-400' : 'text-slate-900'}`}>
                            {w.currencySymbol}{w.available.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: Destination Bank & Beneficiary Details */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#00796B]" />
                  <span>2. Beneficiary Bank & Account</span>
                </label>

                {/* Country Destination Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Destination Region
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.keys(COUNTRIES).map((cCode) => {
                      const c = COUNTRIES[cCode as keyof typeof COUNTRIES];
                      const isSel = destCountry === cCode;
                      return (
                        <button
                          type="button"
                          key={cCode}
                          onClick={() => {
                            setDestCountry(cCode);
                            const banks = REGIONAL_BANKS[cCode as keyof typeof REGIONAL_BANKS];
                            if (banks && banks.length > 0) {
                              setSelectedBank(banks[0]);
                            }
                          }}
                          className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition cursor-pointer ${
                            isSel
                              ? 'bg-[#F26522] text-white border-[#F26522] shadow-xs'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span className="text-base">{c.flag}</span>
                          <span>{c.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  
                  {/* Select Destination Bank / Mobile Money Network */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Select Bank / Mobile Money Provider
                    </label>
                    <div className="space-y-2">
                      <select
                        value={selectedBank.code}
                        onChange={(e) => handleBankChange(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-none"
                      >
                        {countryBanks.map((b) => (
                          <option key={b.code} value={b.code}>
                            {b.type === 'MOBILE_MONEY' ? '📱 Mobile Money' : '🏦 Bank'} — {b.name}
                          </option>
                        ))}
                      </select>

                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Provider Logo:</span>
                        <PaymentChannelBadge providerCode={selectedBank.code} name={selectedBank.name} type={selectedBank.type} />
                      </div>
                    </div>
                  </div>

                  {/* Account / NUBAN / Mobile Number Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      {selectedBank.type === 'MOBILE_MONEY' ? 'Mobile Money Phone Number' : 'Account Number / NUBAN'}
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => handleAccountNumberChange(e.target.value)}
                      placeholder={selectedBank.type === 'MOBILE_MONEY' ? 'e.g. 0241234567' : 'e.g. 0129384012'}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-none"
                    />
                  </div>

                </div>

                {/* INSTANT ACCOUNT NAME RESOLUTION BADGE */}
                {isResolvingAccount ? (
                  <div className="p-3 bg-slate-100 rounded-2xl text-xs text-slate-600 flex items-center gap-2 animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#F26522]" />
                    <span>Resolving account name with NIBSS / Switch API...</span>
                  </div>
                ) : resolvedAccountName ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{resolvedAccountName}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded uppercase font-extrabold">
                      MATCH VERIFIED
                    </span>
                  </div>
                ) : null}
              </div>

              {/* STEP 3: Transfer Amount & FX Rate Summary */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. Payout Amount & FX Breakdown
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Amount to Send ({payoutDebitCurrency})
                    </label>
                    <input
                      type="number"
                      value={payoutSendAmount}
                      onChange={(e) => setPayoutSendAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-none"
                      min="1"
                    />
                  </div>

                  <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex flex-col justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Beneficiary Receives</span>
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      {COUNTRIES[destCountry as keyof typeof COUNTRIES]?.currencySymbol || '$'}
                      {payoutReceiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {destCurrency}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono pt-1">
                      Rate: 1 {payoutDebitCurrency} = {payoutFxRate.toFixed(4)} {destCurrency}
                    </span>
                  </div>
                </div>
              </div>

              {/* DYNAMIC ACTION BUTTON */}
              <button
                type="submit"
                disabled={numPayoutSend <= 0 || !accountNumber}
                className={`w-full py-4 font-extrabold text-base rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                  numPayoutSend > 0 && accountNumber
                    ? 'bg-gradient-to-r from-[#F26522] to-[#E85D04] hover:opacity-95 text-white shadow-orange-500/25'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>
                  Send {COUNTRIES[destCountry as keyof typeof COUNTRIES]?.currencySymbol || ''}
                  {payoutReceiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {destCurrency}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* ================= MODE 2: MIKPAL INTERNAL P2P ================= */}
          {transferMode === 'P2P' && (
            <>
              {/* STEP 1: Recipient Lookup */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Internal Recipient Lookup (@Username or Email)
                </label>

                <div className="relative">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchText(e.target.value);
                      const matched = RECIPIENTS.find(
                        (r) =>
                          r.username.toLowerCase() === e.target.value.toLowerCase().replace('@', '') ||
                          r.email.toLowerCase() === e.target.value.toLowerCase()
                      );
                      if (matched) setSelectedRecipient(matched);
                      else setSelectedRecipient(null);
                    }}
                    placeholder="Search @kwame_m, @chimamanda_e, @jabari_o..."
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-none"
                  />
                </div>

                {/* INSTANT PROFILE MATCH CARD */}
                {selectedRecipient ? (
                  <div className="p-4 bg-gradient-to-r from-teal-50 to-orange-50/40 rounded-2xl border border-teal-200 flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-3.5">
                      <img
                        src={selectedRecipient.avatar}
                        alt={selectedRecipient.fullName}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-teal-500/30"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-base">{selectedRecipient.fullName}</span>
                          <span className="text-lg">{selectedRecipient.flag}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-300">
                            Verified
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">@{selectedRecipient.username} • {selectedRecipient.defaultCurrency} Wallet</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRecipient(null);
                        setSearchText('');
                      }}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-slate-400 block mb-2">QUICK SUGGESTIONS:</span>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {filteredRecipients.map((rec) => (
                        <button
                          key={rec.id}
                          type="button"
                          onClick={() => {
                            setSelectedRecipient(rec);
                            setSearchText(`@${rec.username}`);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 shrink-0 text-left transition"
                        >
                          <img src={rec.avatar} alt={rec.fullName} className="w-7 h-7 rounded-full object-cover" />
                          <div>
                            <span className="font-bold text-xs text-slate-900 block truncate max-w-[100px]">{rec.fullName}</span>
                            <span className="text-[10px] text-slate-500 block">{rec.flag} {rec.defaultCurrency}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 2: Wallet & Amount */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    2. Debiting Wallet & Amount
                  </label>

                  <span className="flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>$0.00 Internal Fee Badge</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Source Wallet
                    </label>
                    <select
                      value={p2pDebitCurrency}
                      onChange={(e) => setP2pDebitCurrency(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-none"
                    >
                      {userWalletKeys.map((curr) => {
                        const w = user.wallets[curr];
                        return (
                          <option key={curr} value={curr}>
                            {w.flag} {curr} Wallet (Avail: {w.currencySymbol}{w.available.toLocaleString()})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Send Amount ({p2pDebitCurrency})
                    </label>
                    <input
                      type="number"
                      value={p2pSendAmount}
                      onChange={(e) => setP2pSendAmount(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-none"
                      min="1"
                    />
                  </div>
                </div>

                {selectedRecipient && (
                  <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Mid-Market FX Rate:</span>
                      <span className="font-mono font-bold text-amber-400">
                        1 {p2pDebitCurrency} = {p2pFxRate.toFixed(4)} {p2pRecipientCurrency}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      <span className="text-xs text-slate-300 font-semibold">Recipient Receives:</span>
                      <span className="text-lg font-black text-emerald-400">
                        {COUNTRIES[selectedRecipient.country].currencySymbol}
                        {p2pReceiveAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {p2pRecipientCurrency}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <button
                type="submit"
                disabled={!selectedRecipient || numP2pSend <= 0}
                className={`w-full py-4 font-extrabold text-base rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                  selectedRecipient && numP2pSend > 0
                    ? 'bg-gradient-to-r from-[#F26522] to-[#E85D04] hover:opacity-95 text-white shadow-orange-500/25'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>
                  {selectedRecipient && numP2pSend > 0
                    ? `Transfer ${p2pDebitCurrency} ${numP2pSend.toFixed(2)} to @${selectedRecipient.username}`
                    : 'Authorize Internal P2P Transfer'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

        </form>
      )}

      {/* SECURITY PIN AUTHORIZATION MODAL */}
      <PinVerificationModal
        isOpen={showPinModal}
        userPin={user.securityPin}
        biometricEnabled={user.biometricEnabled ?? true}
        title="Confirm Payout Transfer"
        subtitle={`Authorize payout of ${
          transferMode === 'P2P' ? `${p2pDebitCurrency} ${p2pSendAmount}` : `${payoutDebitCurrency} ${payoutSendAmount}`
        }`}
        onSuccess={() => {
          setShowPinModal(false);
          handleExecuteVerifiedTransfer();
        }}
        onClose={() => setShowPinModal(false)}
      />

    </div>
  );
};
