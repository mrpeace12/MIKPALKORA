import React, { useState } from 'react';
import { UserProfile, Transaction } from '../types';
import { History, Search, ArrowUpRight, ArrowDownLeft, CreditCard, RefreshCw, FileText, CheckCircle2, Download } from 'lucide-react';

interface TransactionsViewProps {
  user: UserProfile;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  const filtered = user.transactions.filter((t) => {
    const matchesQuery =
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.recipientUsername && t.recipientUsername.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterType === 'P2P') return matchesQuery && (t.type === 'P2P_SEND' || t.type === 'P2P_RECEIVE');
    if (filterType === 'DEPOSIT') return matchesQuery && t.type === 'DEPOSIT';
    if (filterType === 'CARD') return matchesQuery && (t.type === 'CARD_PURCHASE' || t.type === 'CARD_ISSUANCE');
    return matchesQuery;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* View Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-[#F26522]" />
            <span>Transaction Activity & Audit History</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time ledger of pay-ins, payouts, P2P transfers, virtual card purchases, and conversion logs.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          {['ALL', 'P2P', 'DEPOSIT', 'CARD'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-xl transition ${
                filterType === f ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by reference, title or username..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-none"
        />
      </div>

      {/* TRANSACTIONS LIST */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs">
            No transaction records found matching filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTxn(t)}
                className="p-4 sm:px-6 hover:bg-slate-50/80 cursor-pointer transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      t.type === 'P2P_SEND'
                        ? 'bg-orange-100 text-[#F26522]'
                        : t.type === 'DEPOSIT'
                        ? 'bg-teal-100 text-[#00796B]'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {t.type === 'P2P_SEND' ? (
                      <ArrowUpRight className="w-5 h-5" />
                    ) : t.type === 'DEPOSIT' ? (
                      <ArrowDownLeft className="w-5 h-5" />
                    ) : (
                      <CreditCard className="w-5 h-5" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm truncate">{t.title}</span>
                      {t.recipientCountryFlag && <span>{t.recipientCountryFlag}</span>}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono block mt-0.5">{t.reference} • {t.date}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`font-mono font-bold text-sm block ${
                      t.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {t.type === 'DEPOSIT' ? '+' : '-'}{t.currencySymbol}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {t.currency}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 inline-block mt-0.5">
                    {t.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DETAILED RECEIPT MODAL */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F26522]" />
                <h3 className="font-bold text-slate-900 text-base">Transaction Receipt</h3>
              </div>
              <button onClick={() => setSelectedTxn(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="text-center py-2 space-y-1">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <span className="text-3xl font-black text-slate-900 font-mono">
                {selectedTxn.currencySymbol}{selectedTxn.amount.toFixed(2)} {selectedTxn.currency}
              </span>
              <p className="text-xs font-semibold text-slate-500">{selectedTxn.title}</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5 font-sans">
              <div className="flex justify-between text-slate-600">
                <span>Reference ID:</span>
                <span className="font-mono font-bold text-slate-900">{selectedTxn.reference}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transaction Date:</span>
                <span className="font-semibold text-slate-900">{selectedTxn.date}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Transfer Fee:</span>
                <span className="font-bold text-emerald-600">${selectedTxn.fee.toFixed(2)} (Zero Fee Tag)</span>
              </div>
              {selectedTxn.convertedAmount && (
                <div className="flex justify-between text-slate-600 pt-2 border-t border-slate-200">
                  <span>Converted Outcome:</span>
                  <span className="font-bold text-amber-600">
                    {selectedTxn.convertedSymbol}{selectedTxn.convertedAmount.toFixed(2)} {selectedTxn.convertedCurrency}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  alert(`Downloading receipt PDF for reference ${selectedTxn.reference}...`);
                }}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Download Receipt PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

