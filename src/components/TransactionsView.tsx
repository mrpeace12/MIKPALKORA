import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Transaction } from '../types';
import { ArrowUpRight, ArrowDownRight, Loader2, Search, Filter } from 'lucide-react';

export const TransactionsView: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'DEPOSIT' | 'P2P_SEND' | 'P2P_RECEIVE' | 'BANK_TRANSFER'>('ALL');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const data = await api.getTransactions(50, 0);
      const mapped: Transaction[] = (data.transactions || []).map((t: any) => {
        const typeMap: Record<string, Transaction['type']> = {
          deposit: 'DEPOSIT', transfer: 'BANK_TRANSFER', payout: 'BANK_TRANSFER',
          p2p_send: 'P2P_SEND', p2p_receive: 'P2P_RECEIVE', fee: 'FEE',
        };
        return {
          id: t.id, reference: t.reference || '', title: t.description || t.type,
          type: typeMap[t.type] || 'BANK_TRANSFER', amount: t.amount, currency: t.currency,
          currencySymbol: '', fee: t.fee || 0,
          status: t.status === 'success' ? 'SUCCESS' : t.status === 'pending' ? 'PROCESSING' : 'FAILED',
          date: t.created_at || '',
        };
      });
      setTransactions(mapped);
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = transactions.filter(t => {
    if (filter !== 'ALL' && t.type !== filter) return false;
    if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.reference.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#F26522] animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black text-slate-900">Transactions</h2>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by reference or description..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F26522]" />
      </div>
      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['ALL', 'DEPOSIT', 'P2P_SEND', 'P2P_RECEIVE', 'BANK_TRANSFER'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition cursor-pointer ${filter === f ? 'bg-[#F26522] text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
            {f === 'P2P_SEND' ? 'Sent' : f === 'P2P_RECEIVE' ? 'Received' : f === 'BANK_TRANSFER' ? 'Payouts' : f === 'DEPOSIT' ? 'Deposits' : 'All'}
          </button>
        ))}
      </div>
      {/* List */}
      <div className="space-y-2">
        {filtered.map((tx) => {
          const isPositive = tx.type === 'DEPOSIT' || tx.type === 'P2P_RECEIVE';
          return (
            <div key={tx.id} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  {isPositive ? <ArrowDownRight className="w-5 h-5 text-emerald-600" /> : <ArrowUpRight className="w-5 h-5 text-red-500" />}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{tx.title}</p>
                  <p className="text-xs text-slate-500">{tx.reference} • {new Date(tx.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                  {isPositive ? '+' : '-'}{tx.currencySymbol}{tx.amount.toFixed(2)}
                </p>
                <p className="text-xs text-slate-400">{tx.status}</p>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-12 text-center text-slate-400 text-sm">No transactions found.</div>
        )}
      </div>
    </div>
  );
};
