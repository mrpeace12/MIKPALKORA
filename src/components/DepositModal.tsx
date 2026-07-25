import React, { useState } from 'react';
import { UserProfile } from '../types';
import { COUNTRIES } from '../data/mockData';
import { Logo } from './Logo';
import {
  ArrowDownRight,
  Smartphone,
  CreditCard,
  Building2,
  CheckCircle2,
  X,
  ShieldCheck,
  Lock,
  Zap,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  user: UserProfile;
  onClose: () => void;
  onDepositFunds: (amount: number, currency: string, method: string) => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  user,
  onClose,
  onDepositFunds,
}) => {
  const countryInfo = COUNTRIES[user.country];
  const [depositAmount, setDepositAmount] = useState<string>('200');
  const [selectedChannel, setSelectedChannel] = useState<'MOMO' | 'CARD' | 'VIRTUAL_TRANSFER'>('MOMO');
  
  // Method-specific input states
  const [phoneNumber, setPhoneNumber] = useState<string>('0241234567');
  const [momoProvider, setMomoProvider] = useState<string>('MTN MoMo');
  const [cardNumber, setCardNumber] = useState<string>('4218 •••• •••• 9012');
  const [copiedAcc, setCopiedAcc] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [depositSuccess, setDepositSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const numAmount = parseFloat(depositAmount) || 0;
  const primaryAccount = user.bankAccounts[0];

  const handleCopyAccount = () => {
    if (primaryAccount) {
      navigator.clipboard.writeText(primaryAccount.accountNumber);
      setCopiedAcc(true);
      setTimeout(() => setCopiedAcc(false), 2000);
    }
  };

  const handleSubmitDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onDepositFunds(numAmount, countryInfo.currency, selectedChannel.toLowerCase());
      setDepositSuccess(true);
    }, 800);
  };

  const handleDone = () => {
    setDepositSuccess(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1.5 rounded-2xl border border-white/20 backdrop-blur-sm">
              <Logo size="sm" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight flex items-center gap-2">
                <span>MIKPAL Payment Checkout</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {countryInfo.flag} {countryInfo.currency}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Secure Instant Deposit & Wallet Funding</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {depositSuccess ? (
          /* SUCCESS VIEW */
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h4 className="text-2xl font-black text-slate-900">Deposit Successful!</h4>
              <p className="text-xs text-slate-500 mt-1">
                {countryInfo.currencySymbol}{numAmount.toLocaleString()} has been credited to your {countryInfo.currency} balance.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2 text-left max-w-xs mx-auto font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Method:</span>
                <span className="font-bold text-slate-900 uppercase">{selectedChannel}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount:</span>
                <span className="font-bold text-emerald-600">+{countryInfo.currencySymbol}{numAmount}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Fee:</span>
                <span className="font-bold text-slate-900">$0.00</span>
              </div>
            </div>

            <button
              onClick={handleDone}
              className="w-full py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-sm rounded-2xl shadow-md transition"
            >
              Return to Dashboard
            </button>
          </div>
        ) : (
          /* MAIN DEPOSIT FORM */
          <form onSubmit={handleSubmitDeposit} className="p-6 space-y-5">
            
            {/* AMOUNT INPUT */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Deposit Amount ({countryInfo.currency})
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-lg font-bold text-slate-400">
                  {countryInfo.currencySymbol}
                </span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-mono font-black text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-none"
                  min="1"
                  required
                />
              </div>
            </div>

            {/* CHANNEL SELECTOR TILES */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Deposit Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedChannel('MOMO')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    selectedChannel === 'MOMO'
                      ? 'bg-orange-50 border-[#F26522] text-[#F26522] shadow-xs font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs font-bold">Mobile Money</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel('CARD')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    selectedChannel === 'CARD'
                      ? 'bg-orange-50 border-[#F26522] text-[#F26522] shadow-xs font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs font-bold">Debit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedChannel('VIRTUAL_TRANSFER')}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
                    selectedChannel === 'VIRTUAL_TRANSFER'
                      ? 'bg-orange-50 border-[#F26522] text-[#F26522] shadow-xs font-black'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                  <span className="text-xs font-bold">Bank Transfer</span>
                </button>
              </div>
            </div>

            {/* CHANNEL SPECIFIC FIELDS */}
            {selectedChannel === 'MOMO' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Network Provider</label>
                    <select
                      value={momoProvider}
                      onChange={(e) => setMomoProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
                    >
                      {user.country === 'GH' && (
                        <>
                          <option value="MTN MoMo">MTN Mobile Money</option>
                          <option value="Telecel Cash">Telecel Cash</option>
                          <option value="AT Money">AT Money</option>
                        </>
                      )}
                      {user.country === 'KE' && <option value="M-Pesa">M-Pesa Express</option>}
                      {user.country === 'NG' && <option value="OPay / Palmpay">OPay / PalmPay</option>}
                      {user.country === 'ZA' && <option value="Ozow EFT">Ozow Instant EFT</option>}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile Number</label>
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>An STK push prompt will pop up on your mobile device to authorize payment.</span>
                </div>
              </div>
            )}

            {selectedChannel === 'CARD' && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      defaultValue="12/28"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">CVV Security Code</label>
                    <input
                      type="password"
                      maxLength={3}
                      defaultValue="882"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedChannel === 'VIRTUAL_TRANSFER' && (
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Assigned Virtual Bank:</span>
                  <span className="font-bold text-teal-400">{primaryAccount?.bankName || 'MIKPAL Virtual Bank'}</span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                  <span className="text-slate-400">Account Number:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-white">{primaryAccount?.accountNumber || '0129384012'}</span>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="p-1 hover:bg-slate-800 rounded text-slate-300"
                    >
                      {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  Transfer funds directly to your account number above via your local bank app. Settlement is automatic and instant.
                </p>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isProcessing || numAmount <= 0}
              className="w-full py-4 bg-gradient-to-r from-[#F26522] to-[#E85D04] hover:opacity-95 text-white font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <span>Processing Payment Gateway...</span>
              ) : (
                <>
                  <span>Complete Deposit ({countryInfo.currencySymbol}{numAmount.toLocaleString()})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-Bit PCI-DSS Encryption</span>
          </span>
          <span className="font-bold text-slate-700">Zero Processing Fees</span>
        </div>

      </div>
    </div>
  );
};
