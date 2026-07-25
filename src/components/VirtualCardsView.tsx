import React, { useState } from 'react';
import { UserProfile, VirtualCard } from '../types';
import { COUNTRIES } from '../data/mockData';
import { PinVerificationModal } from './PinVerificationModal';
import { CreditCard, Eye, EyeOff, Snowflake, Plus, Sliders, ShieldCheck, Lock, ArrowDownRight, Sparkles, Check, ChevronRight } from 'lucide-react';
import { Logo } from './Logo';

interface VirtualCardsViewProps {
  user: UserProfile;
  onOrderCard: (brand: 'VISA' | 'MASTERCARD', cardHolderName: string) => void;
  onToggleFreezeCard: (cardId: string) => void;
  onTopUpCard: (cardId: string, amount: number) => void;
  onUpdateLimit: (cardId: string, limit: number) => void;
}

export const VirtualCardsView: React.FC<VirtualCardsViewProps> = ({
  user,
  onOrderCard,
  onToggleFreezeCard,
  onTopUpCard,
  onUpdateLimit,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(
    user.cards[0]?.id || null
  );
  const [showMaskedDetails, setShowMaskedDetails] = useState<boolean>(true);
  const [showOrderModal, setShowOrderModal] = useState<boolean>(false);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [showLimitModal, setShowLimitModal] = useState<boolean>(false);

  // Security PIN Modal state
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'ORDER_CARD' | 'TOP_UP'; amount?: number } | null>(null);

  // New Card Form State
  const [brandChoice, setBrandChoice] = useState<'VISA' | 'MASTERCARD'>('VISA');
  const [cardHolderInput, setCardHolderInput] = useState<string>(user.fullName.toUpperCase());

  // Top Up state
  const [topUpAmount, setTopUpAmount] = useState<string>('50');

  // Limit state
  const [limitInput, setLimitInput] = useState<string>('1000');

  const countryInfo = COUNTRIES[user.country];
  const activeCard = user.cards.find((c) => c.id === selectedCardId) || user.cards[0];

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

  const handleExecutePinSuccess = () => {
    setShowPinModal(false);
    if (!pendingAction) return;

    if (pendingAction.type === 'ORDER_CARD') {
      onOrderCard(brandChoice, cardHolderInput || user.fullName.toUpperCase());
    } else if (pendingAction.type === 'TOP_UP' && activeCard && pendingAction.amount) {
      onTopUpCard(activeCard.id, pendingAction.amount);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#F26522]" />
            <span>Regional Virtual Debit Cards</span>
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
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#F26522] to-[#E85D04] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New Virtual Card ({countryInfo.cardPriceLocal})</span>
        </button>
      </div>

      {/* NO CARDS STATE */}
      {user.cards.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center space-y-4 max-w-md mx-auto my-6">
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
            className="px-6 py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow transition"
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
                    onClick={() => setSelectedCardId(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                      activeCard?.id === c.id
                        ? 'bg-slate-900 text-white shadow'
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
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-2 text-cyan-300">
                      <Snowflake className="w-10 h-10 animate-spin-slow" />
                      <span className="font-black text-sm uppercase tracking-widest text-white">CARD FROZEN</span>
                      <button
                        onClick={() => onToggleFreezeCard(activeCard.id)}
                        className="px-4 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-white text-xs font-bold rounded-full border border-cyan-400/40 mt-1 transition"
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
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-bold tracking-widest uppercase text-white/70">
                        {activeCard.currency} VIRTUAL
                      </span>
                      <button
                        onClick={() => setShowMaskedDetails(!showMaskedDetails)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/20 transition"
                        title={showMaskedDetails ? 'Reveal Card Details' : 'Hide Card Details'}
                      >
                        {showMaskedDetails ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-amber-300" />}
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
                    <div className="text-xl sm:text-2xl font-mono font-bold tracking-widest text-white shadow-sm">
                      {showMaskedDetails
                        ? `•••• •••• •••• ${activeCard.cardNumber.slice(-4)}`
                        : activeCard.cardNumber}
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
          </div>

          {/* RIGHT: Card Controls & Stats (5 cols) */}
          {activeCard && (
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-6">
              
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
                  className="px-3.5 py-2 bg-[#00796B] hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
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
                    className="text-[#F26522] font-bold hover:underline"
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
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => onToggleFreezeCard(activeCard.id)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-center gap-2 text-xs font-bold transition ${
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
                  className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-2 text-xs font-bold transition"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Limit Control</span>
                </button>
              </div>

              {/* Card Transaction Log */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Recent Card Activity
                </span>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px]">
                        APP
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">Apple Services</span>
                        <span className="text-[10px] text-slate-400">Card •••• {activeCard.cardNumber.slice(-4)}</span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">-$14.99 USD</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px]">
                        NFLX
                      </div>
                      <div>
                        <span className="font-semibold text-slate-900 block">Netflix Subscription</span>
                        <span className="text-[10px] text-slate-400">Card •••• {activeCard.cardNumber.slice(-4)}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#F26522]" />
                <span>Issue MIKPAL Virtual Debit Card</span>
              </h3>
              <button onClick={() => setShowOrderModal(false)} className="text-slate-400 hover:text-slate-600">
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
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                      brandChoice === 'VISA'
                        ? 'border-[#00796B] bg-teal-50/70 text-[#00796B] font-bold shadow-sm'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="text-xl font-black italic tracking-tighter text-[#00796B]">VISA</span>
                    <span className="text-[11px]">Virtual Visa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBrandChoice('MASTERCARD')}
                    className={`p-4 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                      brandChoice === 'MASTERCARD'
                        ? 'border-[#F26522] bg-orange-50/70 text-[#F26522] font-bold shadow-sm'
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-none"
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
                  <span className="font-bold text-emerald-600">$0.00 USD</span>
                </div>
                <div className="flex justify-between text-slate-600 pt-1 border-t border-slate-200">
                  <span>Debited Wallet:</span>
                  <span className="font-bold text-orange-600">{countryInfo.currency} Wallet</span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md transition"
              >
                Pay {countryInfo.cardPriceLocal} & Issue Card
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOP-UP MODAL */}
      {showTopUpModal && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Top-Up Card Balance</h3>
            <p className="text-xs text-slate-500">
              Transfer USD from your wallet to card •••• {activeCard.cardNumber.slice(-4)}.
            </p>

            <form onSubmit={handleConfirmTopUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Amount ($ USD)
                </label>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-[#00796B] outline-none"
                  min="1"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTopUpModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#00796B] hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow"
                >
                  Confirm Top-Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIMIT MODAL */}
      {showLimitModal && activeCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Set Monthly Spend Limit</h3>
            <p className="text-xs text-slate-500">
              Control maximum monthly expenditure on this virtual card.
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
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-none"
                  min="0"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLimitModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN AUTHORIZATION MODAL */}
      <PinVerificationModal
        isOpen={showPinModal}
        userPin={user.securityPin}
        biometricEnabled={user.biometricEnabled ?? true}
        title={pendingAction?.type === 'ORDER_CARD' ? 'Authorize Virtual Card Issuance' : 'Authorize Card Top-Up'}
        subtitle={
          pendingAction?.type === 'ORDER_CARD'
            ? `Confirm issuance of regional Virtual Card (${countryInfo.cardPriceLocal})`
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
