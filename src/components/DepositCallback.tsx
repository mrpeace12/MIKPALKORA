import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

export const DepositCallback: React.FC<{ reference: string; onClose: () => void }> = ({ reference, onClose }) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [message, setMessage] = useState('Verifying your deposit with Korapay...');
  const [newBalance, setNewBalance] = useState<number | null>(null);

  useEffect(() => {
    let attempts = 0;
    const poll = async () => {
      attempts++;
      try {
        const data = await api.verifyDeposit(reference);
        if (data.status === 'success') {
          setStatus('success');
          setMessage(`Deposit of ${data.amount} ${data.currency} confirmed!`);
          setNewBalance(data.new_balance ?? null);
          return;
        } else if (data.status === 'failed') {
          setStatus('failed');
          setMessage('Deposit failed. Please contact support.');
          return;
        }
        if (attempts < 10) setTimeout(poll, 2000);
        else { setStatus('failed'); setMessage('Verification timed out. If charged, contact support with ref: ' + reference); }
      } catch (err: any) {
        if (attempts < 10) setTimeout(poll, 2000);
        else { setStatus('failed'); setMessage('Could not verify. If charged, contact support with ref: ' + reference); }
      }
    };
    poll();
  }, [reference]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-slate-900 text-white p-6 flex items-center gap-3 border-b border-slate-800">
          <span className="font-black text-lg text-[#F26522]">MIKPAL</span>
          <span className="text-xs font-bold text-slate-400">Deposit Verification</span>
        </div>
        <div className="p-8 text-center">
          {status === 'verifying' && (
            <div className="space-y-4">
              <Loader2 className="w-16 h-16 text-[#F26522] animate-spin mx-auto" />
              <h3 className="text-xl font-bold text-slate-900">Verifying Deposit</h3>
              <p className="text-sm text-slate-500">{message}</p>
              <p className="text-xs text-slate-400">Reference: {reference}</p>
            </div>
          )}
          {status === 'success' && (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-12 h-12 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-900">Deposit Successful!</h3>
              <p className="text-sm text-slate-600">{message}</p>
              {newBalance !== null && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <p className="text-xs text-slate-500 uppercase font-bold">New Balance</p>
                  <p className="text-2xl font-black text-[#F26522]">{newBalance.toFixed(2)}</p>
                </div>
              )}
              <button onClick={onClose} className="w-full py-3 bg-gradient-to-r from-[#F26522] to-[#E85D04] text-white font-bold text-sm rounded-xl hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2">
                <span>Continue to Dashboard</span><ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
          {status === 'failed' && (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Deposit Issue</h3>
              <p className="text-sm text-slate-500">{message}</p>
              <p className="text-xs text-slate-400">Reference: {reference}</p>
              <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition cursor-pointer">Close</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
