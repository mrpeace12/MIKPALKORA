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
  CheckCircle2
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
  const countryInfo = COUNTRIES[user.country];

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
        
        {/* Left Section: Mobile Drawer Trigger + Logo + Active Screen Title */}
        <div className="flex items-center gap-3">
          
          {/* Hamburger Menu Toggle (visible on mobile/tablet) */}
          <button
            onClick={() => {
              if (onOpenSideDrawer) {
                onOpenSideDrawer();
              } else {
                setShowMobileDrawer(!showMobileDrawer);
              }
            }}
            className="p-2 -ml-2 text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 lg:hidden transition"
            title="Open Navigation & Settings Drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo visible on mobile/tablet */}
          <div className="lg:hidden">
            <Logo size="sm" />
          </div>

          <div className="hidden sm:block">
            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>{tabTitles[activeTab]}</span>
              <span className="hidden md:inline-block text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                {countryInfo.code} MARKET
              </span>
            </h1>
          </div>
        </div>

        {/* Right Actions: FX Calculator, Regional Badge, API Hub, & Profile */}
        <div className="flex items-center gap-2">
          
          {/* FX Calculator Quick Trigger */}
          <button
            onClick={onOpenFxCalc}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100/80 text-[#F26522] text-xs font-extrabold rounded-xl border border-orange-200/80 transition shadow-2xs"
            title="Open Live FX Rate Calculator"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">FX Calc</span>
          </button>

          {/* Active User Country Badge */}
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200/80 transition"
            title="Click to Switch Regional Context Profile"
          >
            <span className="text-sm">{countryInfo.flag}</span>
            <span className="hidden sm:inline">{countryInfo.name}</span>
            <span className="text-[10px] font-extrabold bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded">
              {countryInfo.currency}
            </span>
          </button>

          {/* API Docs Button */}
          <button
            onClick={onOpenApiHub}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-100 text-xs font-bold rounded-xl border border-slate-700 shadow-2xs transition"
            title="Inspect API Endpoints & Config"
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>API Docs</span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => onChangeTab('PROFILE')}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-80 transition cursor-pointer"
            title="Open Profile & Settings"
          >
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#F26522]/30"
            />
            <div className="hidden lg:block text-left">
              <span className="font-bold text-slate-900 text-xs block leading-tight truncate max-w-[110px]">
                {user.fullName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">@{user.username}</span>
            </div>
          </button>

          {/* 3-Line Hamburger Icon [☰] Side Drawer Menu Trigger (Available across all screen sizes) */}
          <button
            onClick={onOpenSideDrawer}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200/80 transition flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
            title="Open Side Drawer Navigation & Account Settings [☰]"
          >
            <Menu className="w-5 h-5 text-slate-900" />
            <span className="hidden sm:inline text-xs font-black text-slate-800">Menu</span>
          </button>
        </div>

      </div>

      {/* MOBILE / TABLET FULL SLIDE-OUT NAVIGATION DRAWER */}
      {showMobileDrawer && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs animate-in fade-in"
            onClick={() => setShowMobileDrawer(false)}
          />

          {/* Drawer Menu Panel */}
          <div className="relative w-full max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-5 overflow-y-auto animate-in slide-in-from-left">
            
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
                  ALL FINTECH MENU OPTIONS
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

      {/* MOBILE / TABLET NATIVE BOTTOM NAVIGATION BAR (Fixed 4-Tab Navigation) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-2 px-4 lg:hidden flex items-center justify-around shadow-xl">
        <button
          onClick={() => onChangeTab('OVERVIEW')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'OVERVIEW' ? 'text-[#F26522] font-black scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[11px] font-bold">Home</span>
        </button>

        <button
          onClick={() => onChangeTab('SEND')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'SEND' ? 'text-[#F26522] font-black scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send className="w-5 h-5" />
          <span className="text-[11px] font-bold">Payout</span>
        </button>

        <button
          onClick={() => onChangeTab('CARDS')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'CARDS' ? 'text-[#F26522] font-black scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[11px] font-bold">Cards</span>
        </button>

        <button
          onClick={() => onChangeTab('PROFILE')}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition cursor-pointer ${
            activeTab === 'PROFILE' ? 'text-[#F26522] font-black scale-105' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[11px] font-bold">Profile</span>
        </button>
      </div>
    </header>
  );
};
