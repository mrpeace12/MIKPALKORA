import React, { useState } from 'react';
import { FX_RATES_TO_USD, COUNTRIES } from '../data/mockData';
import { Calculator, ArrowRightLeft, RefreshCw, X, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

interface FxCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FxCalculatorModal: React.FC<FxCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('NGN');
  const [fromAmount, setFromAmount] = useState<string>('100');

  if (!isOpen) return null;

  const currencies = ['USD', 'GHS', 'NGN', 'KES', 'ZAR', 'EUR', 'GBP'];

  const numAmount = parseFloat(fromAmount) || 0;

  // Rate calculation using USD as anchor
  const fromToUsd = 1 / (FX_RATES_TO_USD[fromCurrency] || 1);
  const usdToTarget = FX_RATES_TO_USD[toCurrency] || 1;
  const rate = fromToUsd * usdToTarget;
  const convertedAmount = numAmount * rate;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const getSymbol = (curr: string) => {
    const cKey = Object.keys(COUNTRIES).find((k) => COUNTRIES[k as keyof typeof COUNTRIES].currency === curr);
    if (cKey) return COUNTRIES[cKey as keyof typeof COUNTRIES].currencySymbol;
    if (curr === 'USD') return '$';
    if (curr === 'EUR') return '€';
    if (curr === 'GBP') return '£';
    return '$';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden text-slate-900 animate-in zoom-in-95">
        
        {/* Header Bar */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/20 text-[#F26522] rounded-2xl border border-orange-500/30">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight flex items-center gap-2">
                <span>Real-Time FX Calculator</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  LIVE RATES
                </span>
              </h3>
              <p className="text-xs text-slate-400">Zero markup mid-market exchange simulator</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <div className="p-6 space-y-5">
          
          {/* FROM AMOUNT & CURRENCY */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              You Send
            </label>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-2.5 focus-within:ring-2 focus-within:ring-[#F26522]">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                className="w-full bg-transparent px-2 text-xl font-mono font-bold text-slate-900 outline-none"
                placeholder="0.00"
                min="0"
              />
              <select
                value={fromCurrency}
                onChange={(e) => setFromCurrency(e.target.value)}
                className="bg-white border border-slate-200 text-xs font-bold px-3 py-2 rounded-xl text-slate-900 shadow-xs outline-none cursor-pointer"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* SWAP BUTTON DIVIDER */}
          <div className="relative flex justify-center py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <button
              onClick={handleSwap}
              type="button"
              className="relative p-2.5 bg-slate-900 hover:bg-[#F26522] text-white rounded-full shadow-md transition-all transform hover:rotate-180"
              title="Swap currencies"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>
          </div>

          {/* TO AMOUNT & CURRENCY */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recipient Gets (Estimated)
            </label>
            <div className="flex items-center gap-2 bg-slate-900 text-white rounded-2xl p-2.5 border border-slate-800 shadow-inner">
              <div className="w-full px-2 text-xl font-mono font-black text-emerald-400 truncate">
                {getSymbol(toCurrency)}
                {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <select
                value={toCurrency}
                onChange={(e) => setToCurrency(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs font-bold px-3 py-2 rounded-xl text-white shadow-xs outline-none cursor-pointer"
              >
                {currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* FX BREAKDOWN TILE */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span className="flex items-center gap-1 font-semibold">
                <TrendingUp className="w-3.5 h-3.5 text-[#F26522]" />
                Mid-Market Exchange Rate:
              </span>
              <span className="font-mono font-bold text-slate-900">
                1 {fromCurrency} = {rate.toFixed(4)} {toCurrency}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>MIKPAL Service Fee:</span>
              <span className="font-bold text-emerald-600">$0.00 (Zero FX Fee)</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
              <span>Estimated Delivery:</span>
              <span className="font-bold text-slate-900">Instant Virtual Settlement</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Guaranteed Rate Lock</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
