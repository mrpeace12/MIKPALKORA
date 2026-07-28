import React, { useState } from 'react';
import { api } from '../api';
import { UserProfile, RecipientProfile } from '../types';
import { Search, Send, Loader2, AlertCircle, ArrowUpRight, Building2, Smartphone, CheckCircle2 } from 'lucide-react';
import { COUNTRIES, BANK_DESTINATIONS } from '../data/mockData';

interface SendMoneyViewProps {
  user: UserProfile;
  onP2PTransfer: (recipient: RecipientProfile, sendAmount: number, debitCurrency: string) => Promise<void>;
  onBankPayout: (sendAmount: number, debitCurrency: string, destBank: any, accountNumber: string, accountName: string) => Promise<void>;
}

export const SendMoneyView: React.FC<SendMoneyViewProps> = ({ user, onP2PTransfer, onBankPayout }) => {
  const [tab, setTab] = useState<'P2P' | 'BANK'>('P2P');
  const [searchUsername, setSearchUsername] = useState('');
  const [recipient, setRecipient] = useState<RecipientProfile | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [amount, setAmount] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [success, setSuccess] = useState(false);

  // Bank payout state
  const [selectedBank, setSelectedBank] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  const countryInfo = COUNTRIES[user.country];
  const primaryCurrency = countryInfo.currency;
  const wallet = user.wallets?.[primaryCurrency];
  const availableBalance = wallet?.available || 0;

  const handleSearch = async () => {
    if (!searchUsername) return;
    setSearching(true); setSearchError(''); setRecipient(null);
    try {
      const data = await api.p2pLookup(searchUsername);
      const r = data.recipient;
      const rCountry = Object.values(COUNTRIES).find(c => c.currency === r.currency) || COUNTRIES.GH;
      setRecipient({
        username: r.username, fullName: r.full_name, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
        country: rCountry.name as any, flag: rCountry.flag, currency: r.currency, currencySymbol: rCountry.currencySymbol,
      });
    } catch (err: any) { setSearchError(err.message); }
    finally { setSearching(false); }
  };

  const handleSendP2P = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setSendError('Enter a valid amount'); return; }
    if (!recipient) { setSendError('Search for a recipient first'); return; }
    if (amt > availableBalance) { setSendError('Insufficient balance'); return; }
    setSending(true); setSendError('');
    try {
      await onP2PTransfer(recipient, amt, primaryCurrency);
      setSuccess(true);
      setAmount(''); setSearchUsername(''); setRecipient(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) { setSendError(err.message); }
    finally { setSending(false); }
  };

  const handleSendBank = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setSendError('Enter a valid amount'); return; }
    if (!selectedBank) { setSendError('Select a destination'); return; }
    if (!accountNumber) { setSendError('Enter account number'); return; }
    if (!accountName) { setSendError('Enter account name'); return; }
    if (amt > availableBalance) { setSendError('Insufficient balance'); return; }
    setSending(true); setSendError('');
    try {
      await onBankPayout(amt, primaryCurrency, selectedBank, accountNumber, accountName);
      setSuccess(true);
      setAmount(''); setAccountNumber(''); setAccountName(''); setSelectedBank(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) { setSendError(err.message); }
    finally { setSending(false); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-slate-900">Send Money</h2>

      {/* Balance */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white">
        <p className="text-xs text-slate-400 uppercase">Available Balance</p>
        <p className="text-2xl font-black">{countryInfo.currencySymbol}{availableBalance.toFixed(2)} <span className="text-sm text-slate-400">{primaryCurrency}</span></p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('P2P')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition cursor-pointer ${tab === 'P2P' ? 'bg-[#F26522] text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>To MIKPAL User</button>
        <button onClick={() => setTab('BANK')} className={`flex-1 py-3 text-sm font-bold rounded-xl transition cursor-pointer ${tab === 'BANK' ? 'bg-[#F26522] text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>To Bank/MoMo</button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="w-5 h-5" /> Transfer successful!
        </div>
      )}

      {sendError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-5 h-5" /> {sendError}
        </div>
      )}

      {tab === 'P2P' ? (
        <div className="space-y-4">
          {/* Recipient search */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Recipient Username</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={searchUsername} onChange={(e) => setSearchUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="e.g. johndoe"
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F26522]" />
              </div>
              <button onClick={handleSearch} disabled={searching || !searchUsername} className="px-5 py-3 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition cursor-pointer disabled:opacity-50">
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </button>
            </div>
            {searchError && <p className="text-xs text-red-500 mt-2">{searchError}</p>}
          </div>
          {/* Recipient card */}
          {recipient && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
              <img src={recipient.avatar} alt="" className="w-12 h-12 rounded-full object-cover" />
              <div>
                <p className="text-sm font-bold text-slate-900">{recipient.fullName}</p>
                <p className="text-xs text-slate-500">@{recipient.username}  {recipient.flag} {recipient.currency}</p>
              </div>
            </div>
          )}
          {/* Amount */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Amount ({primaryCurrency})</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:border-[#F26522]" />
          </div>
          <button onClick={handleSendP2P} disabled={sending || !recipient || !amount}
            className="w-full py-4 bg-gradient-to-r from-[#F26522] to-[#E85D04] text-white font-bold text-sm rounded-2xl hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send {amount && `${countryInfo.currencySymbol}${amount}`}</>}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Destination type */}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Select Destination</label>
            <div className="space-y-2">
              {BANK_DESTINATIONS.map(bank => (
                <button key={bank.code} onClick={() => setSelectedBank(bank)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition cursor-pointer ${selectedBank?.code === bank.code ? 'border-[#F26522] bg-orange-50' : 'border-slate-200 bg-white'}`}>
                  {bank.type === 'MOBILE_MONEY' ? <Smartphone className="w-5 h-5 text-[#F26522]" /> : <Building2 className="w-5 h-5 text-slate-700" />}
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">{bank.name}</p>
                    <p className="text-xs text-slate-500">{bank.type === 'MOBILE_MONEY' ? 'Mobile Money' : 'Bank Transfer'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          {selectedBank && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Account Number / MoMo Number</label>
                <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="024XXXXXXX"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F26522]" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Account Name</label>
                <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="John Doe"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F26522]" />
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Amount ({primaryCurrency})</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:outline-none focus:border-[#F26522]" />
          </div>
          <button onClick={handleSendBank} disabled={sending || !selectedBank || !amount || !accountNumber}
            className="w-full py-4 bg-gradient-to-r from-[#F26522] to-[#E85D04] text-white font-bold text-sm rounded-2xl hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowUpRight className="w-4 h-4" /> Send Payout</>}
          </button>
        </div>
      )}
    </div>
  );
};
