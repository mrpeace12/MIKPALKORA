import React from 'react';
import { UserProfile } from '../types';
import {
  Home,
  Send,
  CreditCard,
  User,
  Menu,
  ShieldCheck,
  History
} from 'lucide-react';

interface BottomNavProps {
  activeTab: 'OVERVIEW' | 'SEND' | 'CARDS' | 'KYC' | 'TRANSACTIONS' | 'PROFILE';
  onChangeTab: (tab: 'OVERVIEW' | 'SEND' | 'CARDS' | 'KYC' | 'TRANSACTIONS' | 'PROFILE') => void;
  user: UserProfile;
  onOpenSideDrawer: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  user,
  onOpenSideDrawer,
}) => {
  const navTabs = [
    {
      id: 'OVERVIEW' as const,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'SEND' as const,
      label: 'Payout',
      icon: Send,
    },
    {
      id: 'CARDS' as const,
      label: 'Cards',
      icon: CreditCard,
      badge: user.cards.length > 0 ? user.cards.length : null,
    },
    {
      id: 'PROFILE' as const,
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-white shadow-2xl transition-all">
      <div className="max-w-md md:max-w-xl mx-auto px-2 sm:px-4 py-2 flex items-center justify-around">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all relative cursor-pointer min-w-[68px] ${
                isActive
                  ? 'text-[#F26522] bg-white/10 font-black scale-105'
                  : 'text-slate-400 hover:text-slate-200 font-bold'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#F26522] stroke-[2.5]' : 'text-slate-400'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#F26522] text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-slate-900">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>

              {isActive && (
                <span className="absolute -bottom-1 w-5 h-1 bg-[#F26522] rounded-full shadow-xs shadow-orange-500/50" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
