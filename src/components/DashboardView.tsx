import React from 'react';
import { UserProfile } from '../types';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, Plus, Eye, EyeOff } from 'lucide-react';
import { COUNTRIES } from '../data/mockData';

interface DashboardViewProps {
  user: UserProfile;
  onDepositClick: () => void;
  onSendClick: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ user, onDepositClick, onSendClick }) => {
  const [showBalance, setShowBalance] = React.useState(true);
  const countryInfo = COUNTRIES[user.country] || COUNTRIES.GH;
  const walletValues = Object.values(user.wallets || {});
  const primaryWallet = walletValues[0] || { currency: countryInfo.currency, currencySymbol: countryInfo.currencySymbol, available: 0, pending: 0, flag: countryInfo.flag };
  const totalBalance = walletValues.reduce((sum, w) => sum + (w.available || 0), 0);
  const recentTx = (user.transactions || []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#F26522]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{countryInfo.flag}</span>
              <span className="text-xs font-bold text-slate-400 uppercase">{countryInfo.name} Wallet</span>
            </div>
            <button onClick={() => setShowBalance(!showBalance)} className="text-slate-400 hover:text-white transition cursor-pointer">
              {showBalance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <div className="mb-1">
            <p className="text-xs text-slate-400">Total Balance</p>
          </div>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-4xl font-black tracking-tight">
              {showBalance ? `${countryInfo.currencySymbol}${totalBalance.toFixed(2)}` : '••••••'}
            </span>
            <span className="text-sm text-slate-400">{primaryWallet.currency}</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onDepositClick} className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#F26522] hover:bg-[#E85D04] text-white font-bold text-sm rounded-xl transition cursor-pointer">
              <Plus className="w-4 h-4" /> Deposit
            </button>
            <button onClick={onSendClick} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl transition cursor-pointer">
              <ArrowUpRight className="w-4 h-4" /> Send
            </button>
          </div>
        </div>
      </div>

      {walletValues.length > 1 && (
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">All Wallets</h3>
          <div className="grid grid-cols-2 gap-3">
            {walletValues.map((w) => (
              <div key={w.currency} className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{w.flag}</span>
                  <span className="text-xs font-bold text-slate-500">{w.currency}</span>
                </div>
                <p className="text-lg font-black text-slate-900">{w.currencySymbol}{(w.available || 0).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Recent Transactions</h3>
        {recentTx.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <Wallet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No transactions yet. Make your first deposit!</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type.includes('RECEIVE') || tx.type === 'DEPOSIT' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                    {tx.type.includes('RECEIVE') || tx.type === 'DEPOSIT' ? <TrendingDown className="w-5 h-5 text-emerald-600" /> : <TrendingUp className="w-5 h-5 text-red-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{tx.title}</p>
                    <p className="text-xs text-slate-400">{tx.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-black ${tx.type.includes('RECEIVE') || tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {tx.type.includes('RECEIVE') || tx.type === 'DEPOSIT' ? '+' : '-'}{tx.currencySymbol}{tx.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
