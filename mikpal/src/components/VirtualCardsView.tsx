import React, { useState, useEffect } from 'react';
import { UserProfile, VirtualCard } from '../types';
import { COUNTRIES } from '../data/mockData';
import { PinVerificationModal } from './PinVerificationModal';
import {
  CreditCard,
  Eye,
  EyeOff,
  Snowflake,
  Plus,
  Sliders,
  ShieldCheck,
  Lock,
  ArrowDownRight,
  ArrowUpRight,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Logo } from './Logo';

interface VirtualCardsViewProps {
  user: UserProfile;
  onOrderCard: (brand: 'VISA' | 'MASTERCARD', cardHolderName: string) => void;
  onToggleFreezeCard: (cardId: string) => void;
  onTopUpCard: (cardId: string, amount: number) => void;
  onUpdateLimit: (cardId: string, limit: number) => void;
  onDeleteCard?: (cardId: string) => void;
}

export const VirtualCardsView: React.FC<VirtualCardsViewProps> = ({
  user,
  onOrderCard,
  onToggleFreezeCard,
  onTopUpCard,
  onUpdateLimit,
  onDeleteCard,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    user.cards[0]?.id || null
  );

  const activeCard = user.cards.find((c) => c.id === selectedCardId) || user.cards[0];

  const [showMaskedDetails, setShowMaskedDetails] = useState<boolean>(true);
  const [revealCountdown, setRevealCountdown] = useState<number>(0);

  // Modals
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

  // Security PIN Modal state
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'ORDER_CARD' | 'TOP_UP' | 'REVEAL_DETAILS' | 'TERMINATE_CARD';
    amount?: number;
  } | null>(null);

  // Form States
  const [brandChoice, setBrandChoice] = useState<'VISA' | 'MASTERCARD'>('VISA');
  const [cardHolderInput, setCardHolderInput] = useState<string>(user.fullName.toUpperCase());
  const [topUpAmount, setTopUpAmount] = useState<string>('50');
  const [limitInput, setLimitInput] = useState<string>('1000');

  // Copy Feedback
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const countryInfo = COUNTRIES[user.country];

  // Auto-mask after 30s countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!showMaskedDetails && revealCountdown > 0) {
      timer = setInterval(() => {
        setRevealCountdown((prev) => {
          if (prev <= 1) {
            setShowMaskedDetails(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showMaskedDetails, revealCountdown]);

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleRequestRevealDetails = () => {
    if (!showMaskedDetails) {
      // Hide details immediately
      setShowMaskedDetails(true);
      setRevealCountdown(0);
    } else {
      // Prompt for PIN/Biometrics
      setPendingAction({ type: 'REVEAL_DETAILS' });
      setShowPinModal(true);
    }
  };

  const handleCreateCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingAction({ type: 'ORDER_CARD' });
    setShowOrderModal(false);
    setShowPinModal(true);
  };

  const handleConfirmTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;
    const num = parseFloat(topUpAmount);
    if (num > 0) {
      setPendingAction({ type: 'TOP_UP', amount: num });
      setShowTopUpModal(false);
      setShowPinModal(true);
    }
  };

  const handleConfirmDelete = () => {
    if (!activeCard) return;
    setPendingAction({ type: 'TERMINATE_CARD' });
    setShowDeleteModal(false);
    setShowPinModal(true);
  };

  const handleExecutePinSuccess = (_pinToken: string) => {
    setShowPinModal(false);
    if (!pendingAction) return;

    if (pendingAction.type === 'ORDER_CARD') {
      onOrderCard(brandChoice, cardHolderInput || user.fullName.toUpperCase());
    } else if (pendingAction.type === 'TOP_UP' && activeCard && pendingAction.amount) {
      onTopUpCard(activeCard.id, pendingAction.amount);
    } else if (pendingAction.type === 'REVEAL_DETAILS') {
      setShowMaskedDetails(false);
      setRevealCountdown(30);
    } else if (pendingAction.type === 'TERMINATE_CARD' && activeCard && onDeleteCard) {
      onDeleteCard(activeCard.id);
      setShowMaskedDetails(true);
    }
    setPendingAction(null);
  };

  const handleConfirmLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;
    const num = parseFloat(limitInput);
    if (num >= 0) {
      onUpdateLimit(activeCard.id, num);
      setShowLimitModal(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#F26522]" />
            <span>Virtual Cards</span>
            <span className="text-xs bg-teal-50 text-[#00796B] px-2.5 py-0.5 rounded-full font-bold border border-teal-200">
              Visa & Mastercard
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Issued instantly for global e-commerce, Apple Pay, subscriptions, and online payments. Base price: {countryInfo.cardPriceLocal}.
          </p>
        </div>

        <button
          onClick={() => setShowOrderModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F26522] to-[#E85D04] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New Virtual Card ({countryInfo.cardPriceLocal})</span>
        </button>
      </div>

      {/* NO CARDS STATE */}
      {user.cards.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-xs text-center space-y-4 max-w-md mx-auto my-6">
          <div className="w-16 h-16 bg-orange-100 text-[#F26522] rounded-3xl flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">No Virtual Cards Issued Yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Order your regional MIKPAL USD Virtual Visa or Mastercard for strictly <strong className="text-slate-800">{countryInfo.cardPriceLocal}</strong>.
            </p>
          </div>
          <button
            onClick={() => setShowOrderModal(true)}
            className="px-6 py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
          >
            Order Virtual Card Now
          </button>
        </div>
      ) : (
        /* CARDS DASHBOARD SECTION */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Photorealistic Card View & Selector (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Card Switcher Tabs if multiple */}
            {user.cards.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {user.cards.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCardId(c.id);
                      setShowMaskedDetails(true);
                      setRevealCountdown(0);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      activeCard?.id === c.id
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{c.brand}</span>
                    <span className="font-mono">•••• {c.cardNumber.slice(-4)}</span>
                  </button>
                ))}
              </div>
            )}

            {/* PHOTOREALISTIC CARD UI */}
            {activeCard && (
              <div className="relative group perspective-1000">
                {/* Matte finish container */}
                <div
                  className={`w-full aspect-[1.586/1] max-w-md mx-auto rounded-3xl p-6 sm:p-7 text-white shadow-2xl relative overflow-hidden transition-all duration-300 border border-white/20 flex flex-col justify-between ${
                    activeCard.status === 'FROZEN'
                      ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 grayscale'
                      : activeCard.brand === 'VISA'
                      ? 'bg-gradient-to-br from-[#0F4C5C] via-[#00796B] to-slate-900'
                      : 'bg-gradient-to-br from-slate-900 via-[#1E293B] to-[#F26522]/90'
                  }`}
                >
                  {/* FROZEN OVERLAY */}
                  {activeCard.status === 'FROZEN' && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs z-20 flex flex-col items-center justify-center gap-2 text-cyan-300">
                      <Snowflake className="w-10 h-10 animate-spin-slow" />
                      <span className="font-black text-sm uppercase tracking-widest text-white">CARD FROZEN</span>
                      <button
                        onClick={() => onToggleFreezeCard(activeCard.id)}
                        className="px-4 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-white text-xs font-bold rounded-full border border-cyan-400/40 mt-1 transition cursor-pointer"
                      >
                        Click to Unfreeze
                      </button>
                    </div>
                  )}

                  {/* Ambient sheen effects */}
                  <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
                  <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#F26522]/20 rounded-full blur-2xl pointer-events-none"></div>

                  {/* Top Row: Logo & Mask Toggle */}
                  <div className="flex items-center justify-between z-10">
                    <Logo size="sm" showText={false} />
                    <div className="flex items-center gap-2">
                      {!showMaskedDetails && revealCountdown > 0 && (
                        <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-300/30 flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" />
                          <span>{revealCountdown}s</span>
                        </span>
                      )}

                      <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">
                        {activeCard.currency} VIRTUAL
                      </span>

                      <button
                        onClick={handleRequestRevealDetails}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/20 transition cursor-pointer"
                        title={showMaskedDetails ? 'Reveal Card Details (Face ID / PIN)' : 'Hide Card Details'}
                      >
                        {showMaskedDetails ? (
                          <Eye className="w-4 h-4 text-white" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-amber-300" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Middle Row: Chip & Contactless */}
                  <div className="flex items-center gap-4 my-2 z-10">
                    {/* Metallic Chip */}
                    <div className="w-11 h-9 rounded-lg bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-500 border border-amber-400/80 shadow-md relative overflow-hidden flex items-center justify-center">
                      <div className="w-full h-[1px] bg-amber-600/40"></div>
                      <div className="h-full w-[1px] bg-amber-600/40 absolute"></div>
                    </div>
                    {/* Contactless Signal */}
                    <svg className="w-6 h-6 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8.5 14.5A4.5 4.5 0 0 1 8.5 9.5" />
                      <path d="M12 17A8 8 0 0 0 12 7" />
                      <path d="M15.5 19.5A11.5 11.5 0 0 0 15.5 4.5" />
                    </svg>
                  </div>

                  {/* PAN Card Number */}
                  <div className="z-10 my-1">
                    <div className="text-xl sm:text-2xl font-mono font-bold tracking-widest text-white shadow-xs flex items-center justify-between">
                      <span>
                        {showMaskedDetails
                          ? `•••• •••• •••• ${activeCard.cardNumber.slice(-4)}`
                          : activeCard.cardNumber}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Row: Expiry, CVV & Brand Logo */}
                  <div className="flex items-end justify-between z-10 pt-2 border-t border-white/10">
                    <div>
                      <div className="flex gap-4 text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                        <div>
                          <span>EXPIRES</span>
                          <p className="text-xs font-mono font-bold text-white mt-0.5">
                            {activeCard.expiryMonth}/{activeCard.expiryYear}
                          </p>
                        </div>
                        <div>
                          <span>CVV</span>
                          <p className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                            {showMaskedDetails ? '•••' : activeCard.cvv}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs font-bold uppercase tracking-wider text-white mt-1">
                        {activeCard.cardHolderName}
                      </p>
                    </div>

                    {/* Brand Emblem */}
                    <div className="text-right">
                      {activeCard.brand === 'VISA' ? (
                        <span className="text-2xl font-black italic tracking-tighter text-white drop-shadow">
                          VISA
                        </span>
                      ) : (
                        <div className="flex items-center -space-x-2">
                          <div className="w-7 h-7 rounded-full bg-red-500/90"></div>
                          <div className="w-7 h-7 rounded-full bg-amber-400/90"></div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* UNMASKED CARD DETAILS BAR / COPY ACTIONS */}
            {activeCard && (
              <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${showMaskedDetails ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-800'}`}>
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        {showMaskedDetails ? 'Card Details Protected' : 'Full Card Details Revealed'}
                      </h4>
                      <p className="text-[10px] text-slate-500">
                        {showMaskedDetails
                          ? 'Tap "Reveal Details" with PIN / Face ID for e-commerce checkout'
                          : `Auto-locking in ${revealCountdown}s for security`}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleRequestRevealDetails}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                      showMaskedDetails
                        ? 'bg-[#F26522] hover:bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                    }`}
                  >
                    {showMaskedDetails ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{showMaskedDetails ? 'Reveal Details' : 'Hide Details'}</span>
                  </button>
                </div>

                {/* Quick Copy Inputs when Unmasked */}
                {!showMaskedDetails && (
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2.5 animate-in fade-in">
                    {/* Copy PAN */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Card Number</span>
                        <span className="text-xs font-mono font-bold text-slate-900 truncate block">
                          {activeCard.cardNumber}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyText(activeCard.cardNumber.replace(/\s+/g, ''), 'pan')}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition shrink-0 cursor-pointer"
                        title="Copy Card Number"
                      >
                        {copiedField === 'pan' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Copy Expiry */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">Expiry</span>
                        <span className="text-xs font-mono font-bold text-slate-900 truncate block">
                          {activeCard.expiryMonth}/{activeCard.expiryYear}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyText(`${activeCard.expiryMonth}/${activeCard.expiryYear}`, 'exp')}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition shrink-0 cursor-pointer"
                        title="Copy Expiry"
                      >
                        {copiedField === 'exp' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {/* Copy CVV */}
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold uppercase text-slate-400 block">CVV Code</span>
                        <span className="text-xs font-mono font-bold text-amber-600 truncate block">
                          {activeCard.cvv}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopyText(activeCard.cvv, 'cvv')}
                        className="p-1.5 hover:bg-slate-200 text-slate-600 rounded-lg transition shrink-0 cursor-pointer"
                        title="Copy CVV"
                      >
                        {copiedField === 'cvv' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Card Controls, Balance & Activity (5 cols) */}
          {activeCard && (
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
              
              {/* Card Balance */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block uppercase tracking-wider">Card Balance</span>
                  <span className="text-2xl font-black text-slate-900">
                    ${activeCard.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  onClick={() => setShowTopUpModal(true)}
                  className="px-3.5 py-2 bg-[#00796B] hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Top-Up Card</span>
                </button>
              </div>

              {/* Monthly Spend Limit Progress */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-500 font-semibold">Monthly Spend Limit</span>
                  <button
                    onClick={() => setShowLimitModal(true)}
                    className="text-[#F26522] font-bold hover:underline cursor-pointer"
                  >
                    Edit Limit
                  </button>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#F26522] h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (activeCard.spentThisMonth / activeCard.spendLimitMonthly) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium mt-1">
                  <span>Spent: ${activeCard.spentThisMonth}</span>
                  <span>Limit: ${activeCard.spendLimitMonthly}</span>
                </div>
              </div>

              {/* Quick Action Toggles */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => onToggleFreezeCard(activeCard.id)}
                  className={`p-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer ${
                    activeCard.status === 'FROZEN'
                      ? 'bg-amber-50 text-amber-700 border-amber-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Snowflake className="w-4 h-4" />
                  <span>{activeCard.status === 'FROZEN' ? 'Unfreeze Card' : 'Freeze Card'}</span>
                </button>

                <button
                  onClick={() => setShowLimitModal(true)}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 text-xs font-bold transition cursor-pointer"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Limit Control</span>
                </button>
              </div>

              {/* TERMINATE VIRTUAL CARD BUTTON */}
              {onDeleteCard && (
                <div className="pt-1">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/80 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Terminate Virtual Card</span>
                  </button>
                </div>
              )}

              {/* CARD TRANSACTION LOG (BALANCED LOGICAL SAMPLE DATA) */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Recent Card Activity
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">Card •••• {activeCard.cardNumber.slice(-4)}</span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Top-up Entry */}
                  <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[10px]">
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">Card Top-Up Deposit</span>
                        <span className="text-[10px] text-emerald-700 font-bold">Wallet Transfer</span>
                      </div>
                    </div>
                    <span className="font-black text-emerald-700">+$50.00 USD</span>
                  </div>

                  {/* Expense 1 */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px]">
                        APP
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">Apple Services</span>
                        <span className="text-[10px] text-slate-400">iTunes / App Store</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">-$14.99 USD</span>
                  </div>

                  {/* Expense 2 */}
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px]">
                        NFLX
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">Netflix Subscription</span>
                        <span className="text-[10px] text-slate-400">Streaming Monthly</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">-$19.99 USD</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ORDER CARD MODAL */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#F26522]" />
                <span>Issue MIKPAL Virtual Debit Card</span>
              </h3>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCardSubmit} className="space-y-4">
              {/* Brand Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Card Brand
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBrandChoice('VISA')}
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      brandChoice === 'VISA'
                        ? 'border-[#00796B] bg-teal-50/70 text-[#00796B] font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-xl font-black italic tracking-tighter text-[#00796B]">VISA</span>
                    <span className="text-[11px]">Virtual Visa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrandChoice('MASTERCARD')}
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 cursor-pointer ${
                      brandChoice === 'MASTERCARD'
                        ? 'border-[#F26522] bg-orange-50/70 text-[#F26522] font-bold shadow-xs'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center -space-x-1">
                      <div className="w-5 h-5 rounded-full bg-red-500"></div>
                      <div className="w-5 h-5 rounded-full bg-amber-400"></div>
                    </div>
                    <span className="text-[11px]">Virtual Mastercard</span>
                  </button>
                </div>
              </div>

              {/* Cardholder name input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardHolderInput}
                  onChange={(e) => setCardHolderInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-hidden"
                  required
                />
              </div>

              {/* Price Breakdown in native currency */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Card Issuance Price:</span>
                  <span className="font-bold text-slate-900">{countryInfo.cardPriceLocal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Initial USD Card Balance:</span>
                  <span className="font-bold text-emerald-600">$10.00 USD</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                  <span>Debited Wallet:</span>
                  <span className="font-bold text-orange-600">{countryInfo.currency} Wallet</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
              >
                Pay {countryInfo.cardPriceLocal} & Issue Card
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOP-UP MODAL */}
      {showTopUpModal && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#00796B]" />
              <span>Top-Up Virtual Card Balance</span>
            </h3>
            <p className="text-xs text-slate-500">
              Transfer funds from your wallet directly to card •••• {activeCard.cardNumber.slice(-4)}.
            </p>

            {/* Wallet Balance Badge */}
            <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-teal-800 font-semibold">Available USD Wallet:</span>
              <span className="font-extrabold text-teal-900">
                ${user.wallets['USD']?.available?.toFixed(2) || '0.00'} USD
              </span>
            </div>

            <form onSubmit={handleConfirmTopUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Top-Up Amount ($ USD)
                </label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-[#00796B] outline-hidden"
                  min="1"
                  required
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {['10', '25', '50', '100'].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTopUpAmount(amt)}
                    className={`py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      topUpAmount === amt
                        ? 'bg-[#00796B] text-white border-[#00796B]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    +${amt}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#00796B] hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  Authorize Top-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIMIT MODAL */}
      {showLimitModal && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Set Monthly Spend Limit</h3>
            <p className="text-xs text-slate-500">
              Control maximum monthly expenditure on card •••• {activeCard.cardNumber.slice(-4)}.
            </p>

            <form onSubmit={handleConfirmLimit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Monthly Limit ($ USD)
                </label>
                <input
                  type="number"
                  value={limitInput}
                  onChange={(e) => setLimitInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-hidden"
                  min="0"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLimitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow cursor-pointer"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TERMINATE CARD CONFIRMATION MODAL */}
      {showDeleteModal && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 text-left">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Terminate Virtual Card?</h3>
                <p className="text-xs text-slate-500">Card •••• {activeCard.cardNumber.slice(-4)}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 bg-red-50 p-3.5 rounded-2xl border border-red-200/80 leading-relaxed">
              This action will permanently destroy this virtual card and prevent further merchant billings. Any remaining balance of <strong>${activeCard.balance.toFixed(2)} USD</strong> will be refunded to your USD Wallet.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Keep Card
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Terminate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN AUTHORIZATION MODAL */}
      <PinVerificationModal
        isOpen={showPinModal}
        title={
          pendingAction?.type === 'ORDER_CARD'
            ? 'Authorize Virtual Card Issuance'
            : pendingAction?.type === 'REVEAL_DETAILS'
            ? 'Authorize Card Details Unmask'
            : pendingAction?.type === 'TERMINATE_CARD'
            ? 'Authorize Card Termination'
            : 'Authorize Card Top-Up'
        }
        subtitle={
          pendingAction?.type === 'ORDER_CARD'
            ? `Confirm issuance of Virtual Card (${countryInfo.cardPriceLocal})`
            : pendingAction?.type === 'REVEAL_DETAILS'
            ? `Authenticate with Face ID / PIN to unmask PAN and CVV on card ending in ${activeCard?.cardNumber.slice(-4) || '••••'}`
            : pendingAction?.type === 'TERMINATE_CARD'
            ? `Confirm permanent deletion of card ending in ${activeCard?.cardNumber.slice(-4) || '••••'}`
            : `Confirm top-up of $${pendingAction?.amount || 0} to card ending in ${activeCard?.cardNumber.slice(-4) || '••••'}`
        }
        onSuccess={handleExecutePinSuccess}
        onClose={() => {
          setShowPinModal(false);
          setPendingAction(null);
        }}
      />

    </div>
  );
};


