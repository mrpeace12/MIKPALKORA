import React, { useState } from 'react';
import { COUNTRIES } from '../data/mockData';
import { Calculator, ArrowRightLeft, X, TrendingUp } from 'lucide-react';

// Approximate static rates — replace with real API later
const FX_RATES_TO_USD: Record<string, number> = {
  GHS: 0.012, NGN: 0.0007, KES: 0.0078, ZAR: 0.054, UGX: 0.00027,
  TZS: 0.00039, RWF: 0.00078, USD: 1, GBP: 1.27, CAD: 0.74,
};

interface FxCalculatorModalProps {
  onClose: () => void;
}

export const FxCalculatorModal: React.FC<FxCalculatorModalProps> = ({ onClose }) => {
  const [fromCurrency, setFromCurrency] = useState('GHS');
  const [toCurrency, setToCurrency] = useState('USD');
  const [amount, setAmount] = useState('100');

  const convert = (amt: number, from: string, to: string): number => {
    const usdValue = amt * (FX_RATES_TO_USD[from] || 1);
    return usdValue / (FX_RATES_TO_USD[to] || 1);
  };

  const result = convert(parseFloat(amount) || 0, fromCurrency, toCurrency);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#F26522]" />
            <span className="font-bold">FX Calculator</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">From</label>
            <div className="flex gap-2">
              <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)} className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                {Object.entries(COUNTRIES).map(([code, c]) => <option key={code} value={c.currency}>{c.flag} {c.currency}</option>)}
              </select>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-[#F26522]" />
            </div>
          </div>
          <div className="flex justify-center"><ArrowRightLeft className="w-5 h-5 text-slate-400" /></div>
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">To</label>
            <div className="flex gap-2">
              <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)} className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold">
                {Object.entries(COUNTRIES).map(([code, c]) => <option key={code} value={c.currency}>{c.flag} {c.currency}</option>)}
              </select>
              <div className="flex-1 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl text-sm font-black text-[#F26522]">{result.toFixed(2)}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <TrendingUp className="w-3 h-3" />
            <span>1 {fromCurrency} = {convert(1, fromCurrency, toCurrency).toFixed(4)} {toCurrency}</span>
          </div>
          <p className="text-xs text-slate-400 text-center">Rates are approximate. Real-time rates coming soon.</p>
        </div>
      </div>
    </div>
  );
};
