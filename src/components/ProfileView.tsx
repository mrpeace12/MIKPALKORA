import React, { useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../api';
import { User, Mail, Phone, MapPin, Shield, Lock, LogOut, Edit2, Check, X, Loader2 } from 'lucide-react';
import { COUNTRIES } from '../data/mockData';

interface ProfileViewProps {
  user: UserProfile;
  onUpdate: (updated: UserProfile) => void;
  onSignOut: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdate, onSignOut }) => {
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [saving, setSaving] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinSaving, setPinSaving] = useState(false);

  const countryInfo = COUNTRIES[user.country];

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile({ display_name: fullName, phone, country: user.country });
      onUpdate({ ...user, fullName, phone });
      setEditing(false);
    } catch (err: any) { alert(err.message); }
    finally { setSaving(false); }
  };

  const handleSetPin = async () => {
    if (newPin.length !== 4) { alert('PIN must be 4 digits'); return; }
    setPinSaving(true);
    try {
      await api.setPin(newPin);
      setPinModal(false); setNewPin('');
      alert('PIN set successfully');
    } catch (err: any) { alert(err.message); }
    finally { setPinSaving(false); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-black text-slate-900">Profile</h2>
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <img src={user.avatar} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg" />
        <div>
          <p className="text-lg font-bold text-slate-900">{user.fullName || 'Unknown'}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg">{countryInfo.flag}</span>
            <span className="text-xs text-slate-500">{countryInfo.name}</span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        {editing ? (
          <>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F26522]" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+233..." className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#F26522]" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-[#F26522] text-white text-sm font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Save</>}
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3"><User className="w-4 h-4 text-slate-400" /><div><p className="text-xs text-slate-400">Full Name</p><p className="text-sm font-bold text-slate-900">{user.fullName || 'Not set'}</p></div></div>
              <button onClick={() => setEditing(true)} className="text-slate-400 hover:text-[#F26522] cursor-pointer"><Edit2 className="w-4 h-4" /></button>
            </div>
            <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /><div><p className="text-xs text-slate-400">Email</p><p className="text-sm font-bold text-slate-900">{user.email}</p></div></div>
            <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /><div><p className="text-xs text-slate-400">Phone</p><p className="text-sm font-bold text-slate-900">{user.phone || 'Not set'}</p></div></div>
            <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-slate-400" /><div><p className="text-xs text-slate-400">Country</p><p className="text-sm font-bold text-slate-900">{countryInfo.name}</p></div></div>
            <div className="flex items-center gap-3"><Shield className="w-4 h-4 text-slate-400" /><div><p className="text-xs text-slate-400">KYC Status</p><p className={`text-sm font-bold ${user.kycStatus === 'VERIFIED' ? 'text-emerald-600' : 'text-amber-500'}`}>{user.kycStatus}</p></div></div>
          </>
        )}
      </div>

      {/* Security */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Security</h3>
        <button onClick={() => setPinModal(true)} className="w-full flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition cursor-pointer">
          <div className="flex items-center gap-3"><Lock className="w-4 h-4 text-slate-400" /><span className="text-sm font-bold text-slate-900">Set / Change PIN</span></div>
          <span className="text-xs text-slate-400">{user.securityPin ? 'Set' : 'Not set'}</span>
        </button>
      </div>

      {/* Sign out */}
      <button onClick={onSignOut} className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 font-bold text-sm rounded-2xl hover:bg-red-100 transition cursor-pointer">
        <LogOut className="w-4 h-4" /> Sign Out
      </button>

      {/* PIN Modal */}
      {pinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-lg font-black text-slate-900 mb-2">Set Transaction PIN</h3>
            <p className="text-xs text-slate-500 mb-4">Enter a 4-digit PIN for transaction authorization.</p>
            <input type="password" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="••••"
              className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-2xl text-center tracking-widest focus:outline-none focus:border-[#F26522]" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setPinModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold text-sm rounded-xl cursor-pointer">Cancel</button>
              <button onClick={handleSetPin} disabled={pinSaving || newPin.length !== 4} className="flex-1 py-3 bg-[#F26522] text-white font-bold text-sm rounded-xl cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50">
                {pinSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set PIN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
