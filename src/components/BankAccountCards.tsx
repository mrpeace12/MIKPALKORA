import React, { useState } from 'react';
import { UserProfile, BankAccount } from '../types';
import { COUNTRIES } from '../data/mockData';
import { Building2, Copy, Check, Plus, Globe, ShieldCheck, Sparkles, AlertCircle, ArrowUpRight, Smartphone, CreditCard } from 'lucide-react';

interface BankAccountCardsProps {
  user: UserProfile;
  onActivateUsdAccount: () => void;
  onDepositFunds: (amount: number, currency: string, method: string) => void;
}

export const BankAccountCards: React.FC<BankAccountCardsProps> = ({
  user,
  onActivateUsdAccount,
  onDepositFunds,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showActivateModal, setShowActivateModal] = useState<boolean>(false);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>('100');
  const [depositMethod, setDepositMethod] = useState<string>('momo');

  const countryInfo = COUNTRIES[user.country];
  const hasUsdAccount = (user.bankAccounts || []).some((acc) => acc.type === 'USD_GLOBAL');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleConfirmActivateUsd = () => {
    setShowActivateModal(false);
    onActivateUsdAccount();
  };

  const handleConfirmDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(depositAmount);
    if (num > 0) {
      onDepositFunds(num, countryInfo.currency, depositMethod);
      setShowDepositModal(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Title & Deposit Quick Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#00796B]" />
            <span>Virtual Banking Accounts</span>
            <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold border border-slate-200">
              {countryInfo.flag} {countryInfo.name} Market
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dedicated virtual bank accounts assigned to your MIKPAL identity for pay-ins and collections.
          </p>
        </div>

        <button
          onClick={() => setShowDepositModal(true)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Deposit / Fund Account</span>
        </button>
      </div>

      {/* BANK ACCOUNTS GRID (Compact Dark Matte & Light Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(user.bankAccounts || []).map((acc) => (
          <div
            key={acc.id}
            className={`p-5 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
              acc.type === 'USD_GLOBAL'
                ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white border-slate-800 shadow-lg'
                : 'bg-white text-slate-900 border-slate-200/90 shadow-2xs hover:shadow-md'
            }`}
          >
            {/* Background Sheen */}
            <div className={`absolute -right-8 -top-8 w-28 h-28 rounded-full blur-2xl ${acc.type === 'USD_GLOBAL' ? 'bg-[#00796B]/20' : 'bg-orange-500/10'}`}></div>

            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200/15">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${acc.type === 'USD_GLOBAL' ? 'bg-teal-950 text-teal-300 border border-teal-800/60' : 'bg-orange-50 text-[#F26522]'}`}>
                    {acc.type === 'USD_GLOBAL' ? <Globe className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider block opacity-75">
                      {acc.type === 'USD_GLOBAL' ? 'Global USD Account' : `Local ${acc.currency} Virtual Account`}
                    </span>
                    <span className="text-xs font-bold block">{acc.bankName}</span>
                  </div>
                </div>

                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  acc.status === 'ACTIVE'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-500'
                }`}>
                  {acc.status}
                </span>
              </div>

              {/* Account Details */}
              <div className="space-y-2.5 my-1">
                <div className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/50">
                  <div>
                    <span className={`text-[10px] uppercase tracking-wider block font-bold ${acc.type === 'USD_GLOBAL' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Account Number
                    </span>
                    <span className="text-lg font-mono font-black tracking-wider text-white">{acc.accountNumber}</span>
                  </div>

                  <button
                    onClick={() => handleCopy(acc.accountNumber, `num-${acc.id}`)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      acc.type === 'USD_GLOBAL'
                        ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'
                        : 'bg-orange-50 text-[#F26522] hover:bg-orange-100'
                    }`}
                    title="Copy Account Number"
                  >
                    {copiedId === `num-${acc.id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div>
                    <span className={`text-[9px] uppercase tracking-wider block ${acc.type === 'USD_GLOBAL' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Account Holder
                    </span>
                    <span className="font-semibold block truncate">{acc.accountName}</span>
                  </div>

                  {acc.routingNumber && (
                    <div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                        ACH / ABA Routing
                      </span>
                      <span className="font-mono font-semibold text-teal-300 block">{acc.routingNumber}</span>
                    </div>
                  )}

                  {acc.bankCode && (
                    <div>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider block">
                        Bank Code
                      </span>
                      <span className="font-mono font-semibold text-slate-800 block">{acc.bankCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/15 flex items-center justify-between text-xs">
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex items-center gap-1 text-[11px] text-teal-300 hover:text-white font-medium"
              >
                <AlertCircle className="w-3.5 h-3.5 text-teal-400" />
                <span>ⓘ Deposit Info</span>
              </button>

              <button
                onClick={() => handleCopy(`${acc.bankName} - ${acc.accountNumber} (${acc.accountName})`, `full-${acc.id}`)}
                className={`font-bold text-[11px] transition ${acc.type === 'USD_GLOBAL' ? 'text-teal-300 hover:text-white' : 'text-[#F26522] hover:text-orange-700'}`}
              >
                {copiedId === `full-${acc.id}` ? 'Copied Details!' : 'Share Details'}
              </button>
            </div>
          </div>
        ))}

        {/* OPTIONAL USD EXPANSION CARD (For markets like NG, KE where USD isn't pre-activated) */}
        {countryInfo.supportsLocalVBA && !hasUsdAccount && (
          <div className="p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/80 hover:bg-slate-100/80 transition-all flex flex-col justify-between items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-[#00796B] flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">Activate USD Global Account</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Receive international wires, ACH transfers, and USD payments directly via Bank of the Lakes routing.
              </p>
            </div>

            <button
              onClick={() => setShowActivateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#00796B] to-[#0F4C5C] hover:opacity-95 text-white font-bold text-xs rounded-xl shadow transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Activate USD Global Account</span>
            </button>
            <span className="text-[11px] text-slate-400 font-medium">
              One-time activation fee: $0.50 (~{countryInfo.currencySymbol}{Math.round(0.50 * (countryInfo.currency === 'NGN' ? 1510 : 130))})
            </span>
          </div>
        )}
      </div>

      {/* ACTIVATE USD CONFIRMATION MODAL */}
      {showActivateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="w-12 h-12 bg-teal-100 text-[#00796B] rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">Activate USD Virtual Account</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Activate USD Virtual Account for a one-time fee of <strong className="text-slate-900">$0.50</strong> (deducted from your local {countryInfo.currency} balance).
            </p>

            <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Account Provider:</span>
                <span className="font-semibold text-slate-900">Bank of the Lakes (US)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Routing Methods:</span>
                <span className="font-semibold text-slate-900">ACH & FedWire</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Activation Fee:</span>
                <span className="font-bold text-orange-600">$0.50 USD</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowActivateModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmActivateUsd}
                className="px-5 py-2.5 bg-[#00796B] hover:bg-teal-800 text-white font-bold text-xs rounded-xl shadow"
              >
                Confirm & Pay $0.50
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEPOSIT / FUNDING MODAL */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-[#F26522]" />
                <span>Deposit Funds ({countryInfo.currency})</span>
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDeposit} className="space-y-4 my-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Deposit Amount ({countryInfo.currencySymbol})
                </label>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-none"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDepositMethod('momo')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold ${
                      depositMethod === 'momo'
                        ? 'border-[#F26522] bg-orange-50/60 text-[#F26522]'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 shrink-0" />
                    <span>Mobile Money</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepositMethod('card')}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2 text-xs font-semibold ${
                      depositMethod === 'card'
                        ? 'border-[#F26522] bg-orange-50/60 text-[#F26522]'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    <span>Debit Card / EFT</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                Instant credit simulation to your local {countryInfo.currency} balance. Zero processing fee.
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow-md transition"
              >
                Simulate Instant Deposit ({countryInfo.currencySymbol}{depositAmount})
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
