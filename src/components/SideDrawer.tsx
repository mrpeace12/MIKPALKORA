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
  DollarSign,
  KeyRound,
  Lock,
  Fingerprint,
  LogOut,
  Edit2,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Globe,
  Code,
  Check,
  Building2,
  Sparkles
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
  onUpdateUser,
  onOpenApiHub,
  onOpenOnboarding,
  onOpenFxCalc,
  onSignOut,
}) => {
  if (!isOpen) return null;

  const countryInfo = COUNTRIES[user.country];
  const isVerified = user.kycStatus === 'VERIFIED';

  // Sub-modal states inside Side Drawer
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);

  // Personal Info Form State
  const [fullNameInput, setFullNameInput] = useState<string>(user.fullName);
  const [emailInput, setEmailInput] = useState<string>(user.email);
  const [phoneInput, setPhoneInput] = useState<string>(user.phone);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  // PIN Form State
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [pinSuccess, setPinSuccess] = useState<boolean>(false);

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

  const handleSelectPreferredCurrency = (curr: string) => {
    onUpdateUser({
      ...user,
      preferredCurrency: curr,
    });
  };

  const handleToggleBiometric = () => {
    onUpdateUser({
      ...user,
      biometricEnabled: !(user.biometricEnabled ?? true),
    });
  };

  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      // If KYC verified, retain official verified name
      fullName: isVerified ? user.fullName : fullNameInput,
      email: emailInput,
      phone: phoneInput,
    });
    setShowPersonalInfoModal(false);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowChangePasswordModal(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1200);
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length !== 4 || !/^\d+$/.test(newPinInput)) {
      alert('PIN must be exactly 4 digits');
      return;
    }
    onUpdateUser({
      ...user,
      securityPin: newPinInput,
    });
    setPinSuccess(true);
    setTimeout(() => {
      setPinSuccess(false);
      setShowPinModal(false);
      setNewPinInput('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
      
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
            <div className="bg-white/10 p-1.5 rounded-2xl border border-white/20 backdrop-blur-sm">
              <Logo size="sm" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-white">MIKPAL Account Hub</h3>
              <p className="text-[11px] text-slate-400">Drawer Navigation & Settings</p>
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
          <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100/90 rounded-2xl border border-slate-200/90 flex items-center gap-3.5 relative overflow-hidden">
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-14 h-14 rounded-full object-cover ring-2 ring-[#F26522]/30 shadow-sm shrink-0"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-black text-slate-900 text-sm truncate">{user.fullName}</h4>
                {isVerified && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-300"
                    title="Official KYC Verified Name"
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Verified Name</span>
                  </span>
                )}
              </div>

              <p className="text-xs font-mono text-slate-500 font-bold truncate">@{user.username}</p>

              <div className="flex items-center gap-2 text-[11px] text-slate-600 flex-wrap">
                <span className="font-bold flex items-center gap-1">
                  <span>{countryInfo.flag}</span>
                  <span>{countryInfo.name}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-bold text-slate-700">
                  {isVerified ? 'Tier-2 Verified' : 'Tier 0 Pending'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenFxCalc();
                onClose();
              }}
              className="p-2.5 bg-orange-50 hover:bg-orange-100 text-[#F26522] rounded-xl border border-orange-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>Live FX Rates</span>
            </button>

            <button
              onClick={() => {
                onOpenOnboarding();
                onClose();
              }}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl border border-slate-200 text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span>Switch Market</span>
            </button>
          </div>

          {/* MAIN APP NAVIGATION TABS */}
          <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1 mb-2">
              Main Menu
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

          {/* MOVED ACCOUNT SETTINGS BLOCK */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 px-1">
              Account Settings & Preferences
            </p>

            <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/80 space-y-4">
              
              {/* 1. Preferred Display Currency */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-100 text-[#F26522] rounded-xl shrink-0">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900">Display Currency</p>
                    <p className="text-[10px] text-slate-500">Wallet preview unit</p>
                  </div>
                </div>

                <select
                  value={user.preferredCurrency || countryInfo.currency}
                  onChange={(e) => handleSelectPreferredCurrency(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                >
                  <option value="GHS">GHS (₵)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="KES">KES (KSh)</option>
                  <option value="ZAR">ZAR (R)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              {/* 2. Email & Info Edit */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 bg-teal-100 text-[#00796B] rounded-xl shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900">Email & Profile Info</p>
                    <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPersonalInfoModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              {/* 3. Change Password */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-100 text-purple-700 rounded-xl shrink-0">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900">Account Password</p>
                    <p className="text-[10px] text-slate-500">Sign-in security credential</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition shrink-0 flex items-center gap-1 cursor-pointer"
                >
                  <span>Update</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* 4. 4-Digit Transaction PIN (No raw PIN exposed!) */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900">4-Digit Transaction PIN</p>
                    <p className="text-[10px] text-slate-500">Protected 256-bit payout PIN</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPinModal(true)}
                  className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl transition shrink-0 cursor-pointer"
                >
                  Change PIN
                </button>
              </div>

              {/* 5. Biometric Toggle */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-xs text-slate-900">Biometrics</p>
                    <p className="text-[10px] text-slate-500">Face ID / Touch ID authorization</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleBiometric}
                  className={`w-11 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                    (user.biometricEnabled ?? true) ? 'bg-[#00796B] justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                </button>
              </div>

            </div>
          </div>

          {/* DEVELOPER HUB & SYSTEM ACTIONS */}
          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                onOpenApiHub();
                onClose();
              }}
              className="w-full p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-emerald-400" />
                <span>Developer API Sandbox Hub</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            {/* SIGN OUT BUTTON */}
            <button
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="w-full p-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-red-200 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>
          </div>

        </div>
      </div>

      {/* EDIT PERSONAL INFO SUB-MODAL */}
      {showPersonalInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 relative text-left">
            <button
              onClick={() => setShowPersonalInfoModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900">Edit Personal Information</h3>

            <form onSubmit={handleSavePersonalInfo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>Full Name</span>
                  {isVerified && (
                    <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Verified Name (Locked)</span>
                    </span>
                  )}
                </label>
                {isVerified ? (
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>{user.fullName}</span>
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                ) : (
                  <input
                    type="text"
                    required
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#F26522] outline-none"
                  />
                )}
                {isVerified && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Name is officially locked to {countryInfo.kycDocName} government document verification.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#F26522] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#F26522] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD SUB-MODAL */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 relative text-left">
            <button
              onClick={() => setShowChangePasswordModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900">Change Account Password</h3>

            {passwordSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-center font-bold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Password updated successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#F26522] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#F26522] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#F26522] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  Update Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4-DIGIT PIN SETUP SUB-MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 relative text-left">
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900">Update 4-Digit Security PIN</h3>
            <p className="text-xs text-slate-500">
              Set a new 4-digit PIN required for confirming payouts, card issuance, and high-value transactions.
            </p>

            {pinSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-center font-bold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Security PIN updated successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleSavePin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="• • • •"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-bold font-mono tracking-widest focus:ring-2 focus:ring-[#F26522] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#00796B] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  Save New PIN
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
