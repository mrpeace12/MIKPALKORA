import React from 'react';
import { X, Home, Send, CreditCard, User, ShieldCheck, ArrowRightLeft, LogOut } from 'lucide-react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: any) => void;
  user?: any;
  onSignOut: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  user,
  onSignOut,
}) => {
  if (!isOpen) return null;

  const isVerified = user?.kyc_status === 'VERIFIED';

  const menuItems = [
    {
      id: 'DASHBOARD' as const,
      label: 'Dashboard',
      desc: 'Overview & Wallets',
      icon: Home,
    },
    {
      id: 'SEND' as const,
      label: 'Send Money',
      desc: 'P2P & Bank Transfers',
      icon: Send,
    },
    {
      id: 'CARDS' as const,
      label: 'Virtual Cards',
      desc: 'USD Visa & Mastercard Issuance',
      icon: CreditCard,
      badge: (user?.cards?.length || 0) > 0 ? `${(user?.cards?.length || 0)} Cards` : 'Instant',
    },
    {
      id: 'KYC' as const,
      label: 'KYC & Limits',
      desc: 'Identity Verification',
      icon: ShieldCheck,
      badge: isVerified ? 'Verified' : 'Pending',
    },
    {
      id: 'PROFILE' as const,
      label: 'Profile & Settings',
      desc: 'Identity, Security & Preferences',
      icon: User,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Content */}
      <div className="relative w-80 max-w-full bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={user?.full_name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">{user?.full_name || 'User'}</p>
              <p className="text-xs text-slate-500">@{user?.username || 'username'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  onClose();
                }}
                className={`w-full p-3 rounded-2xl flex items-center justify-between transition cursor-pointer ${
                  isActive ? 'bg-[#F26522]/10 text-[#F26522]' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-[#F26522] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.desc}</p>
                  </div>
                </div>
                {item.badge && (
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-[#F26522] text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={() => {
              onSignOut();
              onClose();
            }}
            className="w-full py-3 bg-red-50 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 transition cursor-pointer flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};
