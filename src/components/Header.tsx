import React from 'react';
import { UserProfile } from '../types';
import { Menu, Bell } from 'lucide-react';
import { COUNTRIES } from '../data/mockData';

interface HeaderProps {
  user: UserProfile;
  onMenuClick: () => void;
  onBellClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onMenuClick, onBellClick }) => {
  const countryInfo = COUNTRIES[user.country];
  const totalBalance = Object.values(user.wallets || {}).reduce((sum, w) => sum + (w.available || 0), 0);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="text-slate-600 cursor-pointer"><Menu className="w-5 h-5" /></button>
        <div>
          <p className="text-xs text-slate-400">Balance</p>
          <p className="text-sm font-black text-slate-900">{countryInfo.currencySymbol}{totalBalance.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onBellClick} className="relative text-slate-600 cursor-pointer">
          <Bell className="w-5 h-5" />
        </button>
        <img src={user.avatar} alt="" className="w-8 h-8 rounded-full object-cover" />
      </div>
    </header>
  );
};
