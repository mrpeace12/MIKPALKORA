import React, { useState } from 'react';
import { UserProfile } from '../types';
import { COUNTRIES } from '../data/mockData';
import { Logo } from './Logo';
import {
  X,
  LayoutDashboard,
  Send,
  CreditCard,
  User,
  ShieldCheck,
  History,
  Calculator,
  Globe,
  Code,
  CheckCircle2,
  Headphones,
  FileText,
  Shield,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  activeTab: 'OVERVIEW' | 'SEND' | 'CARDS' | 'KYC' | 'TRANSACTIONS' | 'PROFILE';
  onChangeTab: (tab: 'OVERVIEW' | 'SEND' | 'CARDS' | 'KYC' | 'TRANSACTIONS' | 'PROFILE') => void;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onOpenApiHub: () => void;
  onOpenOnboarding: () => void;
  onOpenFxCalc: () => void;
  onSignOut: () => void;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  user,
  activeTab,
  onChangeTab,
  onOpenApiHub,
  onOpenOnboarding,
  onOpenFxCalc,
}) => {
  if (!isOpen) return null;

  const countryInfo = COUNTRIES[user.country];
  const isVerified = user.kycStatus === 'VERIFIED';

  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const navMenuItems = [
    {
      id: 'OVERVIEW' as const,
      label: 'Home & Accounts',
      desc: 'Virtual Bank Accounts & Balances',
      icon: LayoutDashboard,
      badge: `${user.bankAccounts.length} Active`,
    },
    {
      id: 'SEND' as const,
      label: 'Send & Payout',
      desc: 'P2P & Cross-Border Bank Transfers',
      icon: Send,
      badge: 'Zero Markup',
    },
    {
      id: 'CARDS' as const,
      label: 'Virtual Cards',
      desc: 'USD Visa & Mastercard Issuance',
      icon: CreditCard,
      badge: user.cards.length > 0 ? `${user.cards.length} Cards` : 'Instant',
    },
    {
      id: 'PROFILE' as const,
      label: 'Profile & Settings',
      desc: 'Identity, Security & Preferences',
      icon: User,
      badge: isVerified ? 'Verified' : 'Pending',
    },
    {
      id: 'KYC' as const,
      label: 'KYC Vault',
      desc: 'Identity & Biometric Compliance',
      icon: ShieldCheck,
      badge: isVerified ? 'Tier-2' : 'Action Req.',
    },
    {
      id: 'TRANSACTIONS' as const,
      label: 'Activity Logs',
      desc: 'Statements & Audit History',
      icon: History,
      badge: null,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-slate-200">
        
        {/* Top Drawer Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-1.5 rounded-2xl border border-white/20 backdrop-blur-xs">
              <Logo size="sm" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white">MIKPAL Utility Hub</h3>
              <p className="text-[11px] text-slate-400">Quick Tools & System Navigation</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-5 space-y-6 flex-1">
          
          {/* User Profile Card Header */}
          <div
            onClick={() => {
              onChangeTab('PROFILE');
              onClose();
            }}
            className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/90 rounded-2xl border border-slate-200/90 flex items-center gap-3.5 relative overflow-hidden cursor-pointer hover:border-slate-300 transition group"
          >
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#F26522]/30 shadow-xs shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-black text-slate-900 text-sm truncate group-hover:text-[#F26522] transition">
                  {user.fullName}
                </h4>
                {isVerified && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-300"
                    title="Official KYC Verified"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Tier-2 Verified</span>
                  </span>
                )}
              </div>

              <p className="text-xs font-mono text-slate-500 font-bold truncate">@{user.username}</p>

              <div className="flex items-center gap-2 text-[11px] text-slate-600">
                <span className="font-bold flex items-center gap-1">
                  <span>{countryInfo.flag}</span>
                  <span>{countryInfo.name} Market</span>
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
          </div>

          {/* GLOBAL UTILITIES & TOOLS (REPURPOSED DRAWER HUB) */}
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
              Global Utilities & Tools
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Live FX Calculator */}
              <button
                onClick={() => {
                  onOpenFxCalc();
                  onClose();
                }}
                className="p-3 bg-slate-50 hover:bg-orange-50/70 border border-slate-200/90 hover:border-orange-200 rounded-2xl text-left transition flex flex-col justify-between space-y-2 cursor-pointer group"
              >
                <div className="p-2 bg-orange-100 text-[#F26522] rounded-xl w-fit group-hover:scale-105 transition">
                  <Calculator className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 group-hover:text-[#F26522] transition">
                    Live FX Rates
                  </p>
                  <p className="text-[10px] text-slate-500">Cross-currency converter</p>
                </div>
              </button>

              {/* 2. KYC Vault & Limits */}
              <button
                onClick={() => {
                  onChangeTab('KYC');
                  onClose();
                }}
                className="p-3 bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/90 hover:border-emerald-200 rounded-2xl text-left transition flex flex-col justify-between space-y-2 cursor-pointer group"
              >
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl w-fit group-hover:scale-105 transition">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-800 transition">
                    KYC & Limits
                  </p>
                  <p className="text-[10px] text-slate-500">Tier verification vault</p>
                </div>
              </button>

              {/* 3. Activity Logs & Statements */}
              <button
                onClick={() => {
                  onChangeTab('TRANSACTIONS');
                  onClose();
                }}
                className="p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/90 hover:border-blue-200 rounded-2xl text-left transition flex flex-col justify-between space-y-2 cursor-pointer group"
              >
                <div className="p-2 bg-blue-100 text-blue-700 rounded-xl w-fit group-hover:scale-105 transition">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 group-hover:text-blue-800 transition">
                    Statements
                  </p>
                  <p className="text-[10px] text-slate-500">Download audit logs</p>
                </div>
              </button>

              {/* 4. Developer API Hub */}
              <button
                onClick={() => {
                  onOpenApiHub();
                  onClose();
                }}
                className="p-3 bg-slate-50 hover:bg-purple-50/70 border border-slate-200/90 hover:border-purple-200 rounded-2xl text-left transition flex flex-col justify-between space-y-2 cursor-pointer group"
              >
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl w-fit group-hover:scale-105 transition">
                  <Code className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 group-hover:text-purple-800 transition">
                    Developer Sandbox
                  </p>
                  <p className="text-[10px] text-slate-500">API keys & Webhooks</p>
                </div>
              </button>

              {/* 5. Help & Live Support */}
              <button
                onClick={() => setShowSupportModal(true)}
                className="p-3 bg-slate-50 hover:bg-teal-50/70 border border-slate-200/90 hover:border-teal-200 rounded-2xl text-left transition flex flex-col justify-between space-y-2 cursor-pointer group"
              >
                <div className="p-2 bg-teal-100 text-[#00796B] rounded-xl w-fit group-hover:scale-105 transition">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 group-hover:text-[#00796B] transition">
                    Help & Support
                  </p>
                  <p className="text-[10px] text-slate-500">24/7 Dispute Desk</p>
                </div>
              </button>

              {/* 6. Switch Regional Market */}
              <button
                onClick={() => {
                  onOpenOnboarding();
                  onClose();
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-2xl text-left transition flex flex-col justify-between space-y-2 cursor-pointer group"
              >
                <div className="p-2 bg-slate-200 text-slate-800 rounded-xl w-fit group-hover:scale-105 transition">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-900 transition">
                    Switch Market
                  </p>
                  <p className="text-[10px] text-slate-500">{countryInfo.code} Regional Profile</p>
                </div>
              </button>
            </div>
          </div>

          {/* MAIN APP NAVIGATION TABS */}
          <div className="space-y-1 pt-2 border-t border-slate-100">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2">
              Navigation Menu
            </p>

            {navMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChangeTab(item.id);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-2xl flex items-center justify-between transition text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#F26522] text-white font-bold shadow-md shadow-orange-500/20'
                      : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-900'}`}>
                        {item.label}
                      </p>
                      <p className={`text-[10px] truncate ${isActive ? 'text-orange-100' : 'text-slate-500'}`}>
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* FOOTER COMPLIANCE INFO */}
          <div className="pt-4 border-t border-slate-200 space-y-2 text-center text-[11px] text-slate-400 font-medium">
            <div className="flex items-center justify-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>Bank-Grade Encryption</span>
            </div>
            <p>MIKPAL © 2026</p>
          </div>

        </div>
      </div>

      {/* SUPPORT MODAL FROM DRAWER */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 relative text-left">
            <button
              onClick={() => setShowSupportModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-100 text-[#00796B] rounded-2xl">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">MIKPAL Support Desk</h3>
                <p className="text-xs text-slate-500">24/7 Live Assistance & Dispute Resolution</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowSupportModal(false);
                  showToast('Connecting to live support agent...');
                }}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center gap-3 cursor-pointer transition"
              >
                <MessageSquare className="w-5 h-5 text-[#F26522]" />
                <div>
                  <p className="font-extrabold text-xs text-slate-900">Start Live Chat</p>
                  <p className="text-[10px] text-slate-500">Connect with an agent in ~2 minutes</p>
                </div>
              </button>

              <button
                onClick={() => {
                  setShowSupportModal(false);
                  onChangeTab('TRANSACTIONS');
                  onClose();
                }}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center gap-3 cursor-pointer transition"
              >
                <Shield className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-extrabold text-xs text-slate-900">Dispute a Transaction</p>
                  <p className="text-[10px] text-slate-500">Select transaction from activity logs</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
