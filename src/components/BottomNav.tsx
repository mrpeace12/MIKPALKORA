import React from 'react';
import { Home, Send, CreditCard, User, ArrowDownLeft } from 'lucide-react';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onDeposit: () => void;
  user?: any;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, onDeposit, user }) => {
  const tabs = [
    {
      id: 'DASHBOARD' as const,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'SEND' as const,
      label: 'Send',
      icon: Send,
    },
    {
      id: 'CARDS' as const,
      label: 'Cards',
      icon: CreditCard,
      badge: (user?.cards?.length || 0) > 0 ? (user?.cards?.length || 0) : null,
    },
    {
      id: 'PROFILE' as const,
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 z-40 flex items-center justify-around shadow-lg">
      {tabs.map((t) => {
        const Icon = t.icon;
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex flex-col items-center relative py-1 px-3 rounded-xl transition cursor-pointer ${
              isActive ? 'text-[#F26522]' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {t.badge !== null && t.badge !== undefined && (
                <span className="absolute -top-1 -right-2 px-1.5 py-0.2 bg-[#F26522] text-white text-[10px] font-bold rounded-full min-w-4 text-center">
                  {t.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold mt-1">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
};
