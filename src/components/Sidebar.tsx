import React from 'react';
import { UserProfile } from '../types';
import { X, LayoutGrid, Send, CreditCard, ShieldCheck, Receipt, User, LogOut } from 'lucide-react';
import { COUNTRIES } from '../data/mockData';

interface SidebarProps {
  user: UserProfile;
  activeTab: string;
  onNavigate: (tab: any) => void;
  onClose: () => void;
  onSignOut: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, onNavigate, onClose, onSignOut }) => {
  const countryInfo = COUNTRIES[user.country];
  const menuItems = [
    { id: 'OVERVIEW', label: 'Dashboard', icon: LayoutGrid },
    { id: 'SEND', label: 'Send Money', icon: Send },
    { id: 'CARDS', label: 'Cards', icon: CreditCard },
    { id: 'KYC', label: 'KYC Vault', icon: ShieldCheck },
    { id: 'TRANSACTIONS', label: 'Transactions', icon: Receipt },
    { id: 'PROFILE', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="w-72 bg-white h-full shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <span className="font-black text-xl text-[#F26522]">MIKPAL</span>
          <button onClick={onClose} className="text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 border-b border-slate-200">
          <img src={user.avatar} alt="" className="w-16 h-16 rounded-full object-cover mb-3" />
          <p className="text-sm font-bold text-slate-900">{user.fullName}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span>{countryInfo.flag}</span>
            <span className="text-xs text-slate-400">{countryInfo.name}</span>
            {user.kycStatus === 'VERIFIED' && <span className="text-xs text-emerald-600 font-bold">✓ KYC</span>}
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => { onNavigate(item.id); onClose(); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition cursor-pointer ${activeTab === item.id ? 'bg-[#F26522] text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                <Icon className="w-4 h-4" /> {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200">
          <button onClick={onSignOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition cursor-pointer">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
      <div className="flex-1 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
    </div>
  );
};
