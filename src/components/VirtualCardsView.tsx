import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { CreditCard, Plus, Loader2, Trash2, X } from 'lucide-react';

export const VirtualCardsView: React.FC = () => {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [cardType, setCardType] = useState('visa');
  const [last4, setLast4] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadCards(); }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await api.getCards();
      setCards(data.cards || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (last4.length !== 4) { alert('Last 4 digits required'); return; }
    setSaving(true);
    try {
      await api.addCard({ card_type: cardType, last4, cardholder_name: cardholderName });
      setShowAdd(false); setLast4(''); setCardholderName('');
      await loadCards();
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this card?')) return;
    try {
      await api.removeCard(id);
      await loadCards();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-[#F26522] animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-slate-900">Virtual Cards</h2>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 px-4 py-2 bg-[#F26522] text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-95">
          <Plus className="w-4 h-4" /> Add Card
        </button>
      </div>
      <div className="space-y-3">
        {cards.map(card => (
          <div key={card.id} className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl ${card.card_type === 'visa' ? 'bg-gradient-to-br from-blue-600 to-blue-900' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
            <div className="flex items-center justify-between mb-8">
              <CreditCard className="w-8 h-8" />
              <span className="text-xs font-bold uppercase">{card.card_type}</span>
            </div>
            <p className="text-lg font-mono tracking-widest mb-4">•••• •••• •••• {card.last4}</p>
            <div className="flex items-center justify-between">
              <div><p className="text-xs opacity-70">Cardholder</p><p className="text-sm font-bold">{card.cardholder_name || 'N/A'}</p></div>
              <div><p className="text-xs opacity-70">Expires</p><p className="text-sm font-bold">{card.expiry_month}/{card.expiry_year}</p></div>
            </div>
            <button onClick={() => handleRemove(card.id)} className="absolute top-4 right-4 text-white/50 hover:text-white cursor-pointer"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {cards.length === 0 && (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No cards yet. Add your first card.</p>
          </div>
        )}
      </div>
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">Add Card</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Card Type</label>
                <select value={cardType} onChange={(e) => setCardType(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F26522]">
                  <option value="visa">Visa</option><option value="mastercard">Mastercard</option><option value="virtual">Virtual</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Last 4 Digits</label>
                <input type="text" maxLength={4} value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, ''))} placeholder="1234" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F26522]" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Cardholder Name</label>
                <input type="text" value={cardholderName} onChange={(e) => setCardholderName(e.target.value)} placeholder="John Doe" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F26522]" />
              </div>
              <button onClick={handleAdd} disabled={saving || last4.length !== 4} className="w-full py-3 bg-[#F26522] text-white font-bold text-sm rounded-xl cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
