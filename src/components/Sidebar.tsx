import React from 'react';
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
  Building2,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Calculator,
  UserCheck,
  Globe,
  Sliders,
  HelpCircle,
  User
} from 'lucide-react';

interface SidebarProps {
  user: UserProfile;
  activeTab: 'OVERVIEW' | 'SEND' | 'CARDS' | 'KYC' | 'TRANSACTIONS' | 'PROFILE';
  onChangeTab: (tab: 'OVERVIEW' | 'SEND' | 'CARDS' | 'KYC' | 'TRANSACTIONS' | 'PROFILE') => void;
  onOpenApiHub: () => void;
  onOpenOnboarding: () => void;
  onOpenFxCalc: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  activeTab,
  onChangeTab,
  onOpenApiHub,
  onOpenOnboarding,
  onOpenFxCalc,
}) => {
  const countryInfo = COUNTRIES[user.country];
  const primaryAccount = user.bankAccounts.find((a) => a.isDefault) || user.bankAccounts[0];

  const coreNavItems = [
    {
      id: 'OVERVIEW' as const,
      label: 'Home',
      icon: LayoutDashboard,
      badge: `${user.bankAccounts.length} Active`,
    },
    {
      id: 'SEND' as const,
      label: 'Send & Payout',
      icon: Send,
      badge: 'P2P & Bank',
    },
    {
      id: 'CARDS' as const,
      label: 'Virtual Cards',
      icon: CreditCard,
      badge: user.cards.length > 0 ? `${user.cards.length} Cards` : 'Issue',
    },
    {
      id: 'PROFILE' as const,
      label: 'Profile & Settings',
      icon: User,
      badge: 'Hub',
    },
  ];

  const securityNavItems = [
    {
      id: 'KYC' as const,
      label: 'KYC Document Vault',
      icon: ShieldCheck,
      badge: user.kycStatus === 'VERIFIED' ? 'Verified' : 'Pending',
    },
    {
      id: 'TRANSACTIONS' as const,
      label: 'Activity & History Logs',
      icon: History,
      badge: null,
    },
  ];

  return (
    <aside className="w-68 bg-white border-r border-slate-200/80 shrink-0 hidden lg:flex flex-col justify-between h-screen sticky top-0 z-30 p-4 selection:bg-[#F26522] selection:text-white overflow-y-auto">
      
      {/* TOP CONTAINER: Logo, Regional isolation, and Main Categorized Navigation */}
      <div className="space-y-5">
        
        {/* Brand Logo Header */}
        <div className="pt-2 px-2 flex items-center justify-between">
          <Logo size="md" />
          <span className="flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            V2.4 ACTIVE
          </span>
        </div>

        {/* Regional Isolation Badge Pill */}
        <div className="mx-1 p-3 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200/80 flex items-center justify-between transition group">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl leading-none">{countryInfo.flag}</span>
            <div className="text-left">
              <span className="font-extrabold text-xs text-slate-900 block leading-tight">
                {countryInfo.name} Market
              </span>
              <span className="text-[10px] text-slate-500 font-mono block">
                Primary: {countryInfo.currency} ({countryInfo.currencySymbol})
              </span>
            </div>
          </div>
          <button
            onClick={onOpenOnboarding}
            className="text-[10px] font-black px-2.5 py-1 bg-white hover:bg-slate-900 hover:text-white text-[#F26522] rounded-xl border border-slate-200 transition shadow-2xs"
            title="Switch Regional Context Profile"
          >
            Switch
          </button>
        </div>

        {/* CORE BANKING NAVIGATION SECTION */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            CORE BANKING & CARDS
          </p>

          {coreNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#F26522] via-orange-600 to-[#E85D04] text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* SECURITY & LOGS SECTION */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            VAULT & AUDIT TRAIL
          </p>

          {securityNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#F26522] via-orange-600 to-[#E85D04] text-white shadow-md shadow-orange-500/20'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : item.id === 'KYC' && user.kycStatus === 'VERIFIED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* QUICK FINTECH TOOLS */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <p className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
            UTILITIES & TOOLKIT
          </p>

          <button
            onClick={onOpenFxCalc}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-100/80 transition"
          >
            <div className="flex items-center gap-3">
              <Calculator className="w-4 h-4 text-[#F26522]" />
              <span>FX Calculator</span>
            </div>
            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Live
            </span>
          </button>
        </div>

        {/* VIRTUAL BANK QUICK STATUS TILE */}
        {primaryAccount && (
          <div className="mx-1 p-3.5 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-[#00796B]" />
                Primary VBA
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                ACTIVE
              </span>
            </div>

            <div>
              <p className="text-xs font-bold text-white truncate">{primaryAccount.bankName}</p>
              <p className="text-[11px] font-mono text-slate-400">
                Acc: {primaryAccount.accountNumber}
              </p>
            </div>

            <button
              onClick={() => onChangeTab('SEND')}
              className="w-full mt-1 py-1.5 bg-[#00796B] hover:bg-teal-700 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1 transition"
            >
              <span>Transfer & Payout</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* BOTTOM CONTAINER: Developer API Hub & User Profile Tile */}
      <div className="pt-3 border-t border-slate-200/80 space-y-2.5">
        
        {/* Developer API Docs Button */}
        <button
          onClick={onOpenApiHub}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-700 shadow-2xs transition"
        >
          <div className="flex items-center gap-2">
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>Developer API Hub</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {/* User Profile Footer Tile */}
        <button
          onClick={() => onChangeTab('PROFILE')}
          className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 flex items-center justify-between transition text-left cursor-pointer"
          title="Open Profile & Settings"
        >
          <div className="flex items-center gap-2.5 truncate">
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-[#F26522]/30 shrink-0"
            />
            <div className="truncate text-left">
              <span className="font-bold text-xs text-slate-900 block truncate leading-tight">
                {user.fullName}
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">@{user.username}</span>
            </div>
          </div>

          <span
            className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 shrink-0"
            title="KYC Verified Identity"
          />
        </button>
      </div>

    </aside>
  );
};
