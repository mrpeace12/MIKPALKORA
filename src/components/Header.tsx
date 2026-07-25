import React, { useState } from 'react';
import { UserProfile } from '../types';
import { COUNTRIES } from '../data/mockData';
import { Logo } from './Logo';
import {
  LayoutDashboard,
  Send,
  CreditCard,
  ShieldCheck,
  History,
  Code,
  Globe,
  Building2,
  Menu,
  X,
  Calculator,
  ChevronRight,
  User,
  Sparkles,
  Lock,
  Search,
  CheckCircle2,
  Bell,
  CheckCheck,
  ArrowRight
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  activeTab: 'OVERVIEW' | 'SEND' | 'CARDS' | 'KYC' | 'TRANSACTIONS' | 'PROFILE';
  onChangeTab: (tab: 'OVERVIEW' | 'SEND' | 'CARDS' | 'KYC' | 'TRANSACTIONS' | 'PROFILE') => void;
  onOpenApiHub: () => void;
  onOpenOnboarding: () => void;
  onOpenFxCalc: () => void;
  onOpenSideDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeTab,
  onChangeTab,
  onOpenApiHub,
  onOpenOnboarding,
  onOpenFxCalc,
  onOpenSideDrawer,
}) => {
  const [showMobileDrawer, setShowMobileDrawer] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(3);
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'Instant Remittance Delivered',
      description: `Payout to Mobile Money processed successfully.`,
      time: '10m ago',
      type: 'TRANSACTION',
      read: false,
      tab: 'TRANSACTIONS' as const,
    },
    {
      id: '2',
      title: 'KYC Tier-3 Verification Active',
      description: 'National ID verified. Full cross-border limits unlocked.',
      time: '1h ago',
      type: 'SECURITY',
      read: false,
      tab: 'KYC' as const,
    },
    {
      id: '3',
      title: 'Virtual Card Active',
      description: 'USD Corporate Visa card is ready for online payments.',
      time: '3h ago',
      type: 'CARD',
      read: false,
      tab: 'CARDS' as const,
    },
  ]);

  const countryInfo = COUNTRIES[user.country];

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotificationClick = (tab: 'OVERVIEW' | 'SEND' | 'CARDS' | 'KYC' | 'TRANSACTIONS' | 'PROFILE', id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    onChangeTab(tab);
    setShowNotifications(false);
  };

  const tabTitles: Record<string, string> = {
    OVERVIEW: 'Home & Banking Overview',
    SEND: 'Payouts & Transfers',
    CARDS: 'Virtual Debit Cards',
    PROFILE: 'Profile & Account Settings',
    KYC: 'KYC Document Vault',
    TRANSACTIONS: 'Activity & History Logs',
  };

  const navMenuItems = [
    {
      id: 'OVERVIEW' as const,
      label: 'Home',
      desc: 'Balance, Currency Switcher & Accounts',
      icon: LayoutDashboard,
      badge: `${user.bankAccounts.length} Active`,
    },
    {
      id: 'SEND' as const,
      label: 'Payout',
      desc: 'Instant P2P & Cross-Border Bank Transfers',
      icon: Send,
      badge: 'Zero Markup',
    },
    {
      id: 'CARDS' as const,
      label: 'Cards',
      desc: 'Instant USD Visa & Mastercard Issuance',
      icon: CreditCard,
      badge: user.cards.length > 0 ? `${user.cards.length} Cards` : 'Instant',
    },
    {
      id: 'PROFILE' as const,
      label: 'Profile & Settings',
      desc: 'Avatar, Virtual Banks, PIN & Preferences',
      icon: User,
      badge: user.kycStatus === 'VERIFIED' ? 'Verified' : 'Pending',
    },
    {
      id: 'KYC' as const,
      label: 'KYC Vault',
      desc: 'Biometric & Identity Verification',
      icon: ShieldCheck,
      badge: null,
    },
    {
      id: 'TRANSACTIONS' as const,
      label: 'Activity Logs',
      desc: 'Audit Trail & Transaction Statements',
      icon: History,
      badge: null,
    },
  ];

  const handleMobileNav = (tab: any) => {
    onChangeTab(tab);
    setShowMobileDrawer(false);
  };

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        
        {/* Left Section: Logo */}
        <div className="flex items-center gap-3">
          <Logo size="sm" />
        </div>

        {/* Right Actions: FX Calculator, API Hub, Profile & TOP RIGHT MENU */}
        <div className="flex items-center gap-2">
          
          {/* FX Calculator Quick Trigger */}
          <button
            onClick={onOpenFxCalc}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-orange-50 hover:bg-orange-100/80 text-[#F26522] text-xs font-extrabold rounded-xl border border-orange-200/80 transition shadow-2xs cursor-pointer"
            title="Open Live FX Rate Calculator"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">FX Calc</span>
          </button>

          {/* API Docs Button */}
          <button
            onClick={onOpenApiHub}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-bold rounded-xl border border-slate-700 shadow-2xs transition cursor-pointer"
            title="Inspect API Endpoints & Config"
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>API Docs</span>
          </button>

          {/* NOTIFICATION CENTER BUTTON */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 sm:px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200/80 transition flex items-center justify-center gap-1.5 cursor-pointer relative shadow-2xs"
              title="Notification Center"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              {unreadCount > 0 && (
                <span className="bg-[#F26522] text-white text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-xs">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* NOTIFICATION CENTER POPOVER DROPDOWN */}
            {showNotifications && (
              <>
                {/* Backdrop to close on click outside */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowNotifications(false)}
                />

                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#F26522]" />
                      <span className="font-extrabold text-sm">Notifications</span>
                      {unreadCount > 0 && (
                        <span className="bg-[#F26522] text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                          {unreadCount} New
                        </span>
                      )}
                    </div>

                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-slate-300 hover:text-white font-bold underline flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  {/* NOTIFICATION ITEMS */}
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        No active notifications
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleNotificationClick(item.tab, item.id)}
                          className={`p-3.5 transition flex gap-3 cursor-pointer ${
                            item.read ? 'bg-white hover:bg-slate-50' : 'bg-orange-50/50 hover:bg-orange-50'
                          }`}
                        >
                          <div className="mt-0.5">
                            {item.type === 'TRANSACTION' && (
                              <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                                <Send className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {item.type === 'SECURITY' && (
                              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                                <ShieldCheck className="w-3.5 h-3.5" />
                              </div>
                            )}
                            {item.type === 'CARD' && (
                              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                                <CreditCard className="w-3.5 h-3.5" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 text-left">
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <h4 className={`text-xs ${item.read ? 'font-bold text-slate-800' : 'font-black text-slate-900'}`}>
                                {item.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{item.time}</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug line-clamp-2">{item.description}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* FOOTER */}
                  <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        onChangeTab('TRANSACTIONS');
                        setShowNotifications(false);
                      }}
                      className="text-xs font-bold text-[#F26522] hover:text-[#E85D04] inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View All Activity Logs</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* TOP RIGHT CORNER MENU BUTTON [☰] */}
          <button
            onClick={() => {
              if (onOpenSideDrawer) {
                onOpenSideDrawer();
              } else {
                setShowMobileDrawer(true);
              }
            }}
            className="p-2 sm:px-3 bg-[#F26522] hover:bg-[#E85D04] text-white rounded-xl border border-orange-600 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm font-black text-xs"
            title="Open Side Drawer Menu [☰]"
          >
            <Menu className="w-5 h-5 text-white" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>

      </div>

      {/* MOBILE / TABLET FULL SLIDE-OUT NAVIGATION DRAWER */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
            onClick={() => setShowMobileDrawer(false)}
          />

          {/* Drawer Menu Panel */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-5 overflow-y-auto animate-in slide-in-from-right ml-auto">
            
            {/* Top Logo & Close Button */}
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <Logo size="md" />
                <button
                  onClick={() => setShowMobileDrawer(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Regional Market Context Banner */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{countryInfo.flag}</span>
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">{countryInfo.name} Market</span>
                    <span className="text-[10px] text-slate-500 font-mono">Currency: {countryInfo.currency}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowMobileDrawer(false);
                    onOpenOnboarding();
                  }}
                  className="text-[10px] font-extrabold text-[#F26522] hover:underline"
                >
                  Switch
                </button>
              </div>

              {/* COMPLETE MENU LIST */}
              <nav className="space-y-1">
                <p className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                  FINTECH NAVIGATION
                </p>

                {navMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleMobileNav(item.id)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl text-left text-xs font-bold transition ${
                        isActive
                          ? 'bg-[#F26522] text-white shadow-md'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <div>
                          <span className="block leading-tight">{item.label}</span>
                          <span className={`text-[10px] font-normal block ${isActive ? 'text-orange-100' : 'text-slate-400'}`}>
                            {item.desc}
                          </span>
                        </div>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              {/* QUICK UTILITY TOOLS */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <p className="px-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  DEVELOPER & TOOLS
                </p>

                <button
                  onClick={() => {
                    setShowMobileDrawer(false);
                    onOpenFxCalc();
                  }}
                  className="w-full flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 text-[#F26522] rounded-2xl text-xs font-bold transition border border-orange-200/80"
                >
                  <div className="flex items-center gap-2.5">
                    <Calculator className="w-4 h-4" />
                    <span>Real-Time FX Calculator</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setShowMobileDrawer(false);
                    onOpenApiHub();
                  }}
                  className="w-full flex items-center justify-between p-3 bg-slate-900 text-white rounded-2xl text-xs font-bold transition"
                >
                  <div className="flex items-center gap-2.5">
                    <Code className="w-4 h-4 text-amber-400" />
                    <span>Developer API Hub</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Bottom Profile Header Tile */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-[#F26522]"
                />
                <div>
                  <span className="font-bold text-slate-900 text-xs block">{user.fullName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">@{user.username}</span>
                </div>
              </div>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                VERIFIED
              </span>
            </div>

          </div>
        </div>
      )}
    </header>
  );
};
