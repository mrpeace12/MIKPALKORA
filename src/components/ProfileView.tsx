import React, { useState } from 'react';
import { UserProfile, CountryCode } from '../types';
import { COUNTRIES, MOCK_USER_PROFILES } from '../data/mockData';
import {
  User,
  ShieldCheck,
  Building2,
  Lock,
  Fingerprint,
  LogOut,
  Mail,
  Phone,
  Globe,
  Camera,
  CheckCircle2,
  Copy,
  Check,
  ChevronRight,
  Edit2,
  KeyRound,
  DollarSign,
  AlertTriangle,
  X,
  Sparkles
} from 'lucide-react';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onNavigateTab: (tab: 'HOME' | 'PAYOUT' | 'CARDS' | 'PROFILE' | 'KYC' | 'TRANSACTIONS') => void;
  onActivateUsdAccount: () => void;
  onSignOut: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onUpdateUser,
  onNavigateTab,
  onActivateUsdAccount,
  onSignOut,
}) => {
  const countryInfo = COUNTRIES[user.country];
  const [copiedAccNum, setCopiedAccNum] = useState<string | null>(null);

  // Modal / Form States
  const [showPersonalInfoModal, setShowPersonalInfoModal] = useState<boolean>(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  // Edit Personal Info State
  const [fullNameInput, setFullNameInput] = useState<string>(user.fullName);
  const [emailInput, setEmailInput] = useState<string>(user.email);
  const [phoneInput, setPhoneInput] = useState<string>(user.phone);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordSuccess, setPasswordSuccess] = useState<boolean>(false);

  // PIN Setup State
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [pinSuccess, setPinSuccess] = useState<boolean>(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccNum(id);
    setTimeout(() => setCopiedAccNum(null), 2000);
  };

  const isVerified = user.kycStatus === 'VERIFIED';

  const handleSavePersonalInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
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

  const handleToggleBiometric = () => {
    onUpdateUser({
      ...user,
      biometricEnabled: !(user.biometricEnabled ?? true),
    });
  };

  const handleSelectPreferredCurrency = (curr: string) => {
    onUpdateUser({
      ...user,
      preferredCurrency: curr,
    });
  };

  const AVATAR_PRESETS = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  ];

  const hasUsdAccount = user.bankAccounts.some((a) => a.currency === 'USD');

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12">
      
      {/* 1. USER PROFILE HEADER HERO CARD */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          
          {/* Avatar with Camera Overlay */}
          <div className="relative group shrink-0">
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover ring-4 ring-[#F26522]/20 shadow-md"
            />
            <button
              onClick={() => setShowAvatarPicker(!showAvatarPicker)}
              className="absolute bottom-0 right-0 p-2 bg-[#F26522] hover:bg-orange-600 text-white rounded-full shadow-lg transition active:scale-95 cursor-pointer"
              title="Change Profile Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start flex-wrap">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{user.fullName}</h2>
                  {user.kycStatus === 'VERIFIED' && (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-black rounded-full border border-emerald-300"
                      title="Verified Official Name"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Verified Name</span>
                    </span>
                  )}
                </div>
                <p className="text-sm font-mono text-slate-500 font-bold">@{user.username}</p>
              </div>

              {/* KYC Status Badge */}
              <div>
                {user.kycStatus === 'VERIFIED' ? (
                  <button
                    onClick={() => onNavigateTab('KYC')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black rounded-full border border-emerald-200 transition"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Tier-2 KYC Verified</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onNavigateTab('KYC')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-black rounded-full border border-amber-200 transition animate-pulse"
                  >
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Verification Required (Tier 0)</span>
                  </button>
                )}
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.phone}</span>
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className="text-sm leading-none">{countryInfo.flag}</span>
                <span>{countryInfo.name}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Avatar Preset Selector Dropdown */}
        {showAvatarPicker && (
          <div className="mt-6 pt-4 border-t border-slate-100 animate-in fade-in">
            <p className="text-xs font-bold text-slate-700 mb-2">Choose Avatar Photo:</p>
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {AVATAR_PRESETS.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onUpdateUser({ ...user, avatar: url });
                    setShowAvatarPicker(false);
                  }}
                  className="relative shrink-0 hover:scale-105 transition"
                >
                  <img
                    src={url}
                    alt="Preset"
                    className={`w-12 h-12 rounded-full object-cover ring-2 ${
                      user.avatar === url ? 'ring-[#F26522]' : 'ring-slate-200'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. ASSIGNED VIRTUAL BANK ACCOUNTS SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#00796B]" />
              <span>Assigned Virtual Bank Accounts</span>
            </h3>
            <p className="text-xs text-slate-500">
              Local and international routing accounts dedicated for automated deposits.
            </p>
          </div>

          {!hasUsdAccount && (
            <button
              onClick={onActivateUsdAccount}
              className="px-4 py-2 bg-[#00796B] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Activate USD Global Account</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {user.bankAccounts.map((acc) => (
            <div
              key={acc.id}
              className="p-5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-3 relative hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  {acc.type === 'USD_GLOBAL' ? '🇺🇸 USD Global VBA' : `${countryInfo.flag} Local Regional VBA`}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {acc.status}
                </span>
              </div>

              <div>
                <p className="font-extrabold text-slate-900 text-sm">{acc.bankName}</p>
                <p className="text-xs text-slate-500 font-medium">{acc.accountName}</p>
              </div>

              <div className="p-3 bg-white rounded-xl border border-slate-200 font-mono text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Account Number:</span>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-slate-900">{acc.accountNumber}</strong>
                    <button
                      onClick={() => handleCopy(acc.accountNumber, acc.id)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      {copiedAccNum === acc.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {acc.routingNumber && (
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>Routing Number:</span>
                    <strong className="text-slate-800">{acc.routingNumber}</strong>
                  </div>
                )}
                {acc.swiftCode && (
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>SWIFT Code:</span>
                    <strong className="text-slate-800">{acc.swiftCode}</strong>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SETTINGS MENU SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Account Settings</h3>
          <p className="text-xs text-slate-500">Manage security credentials, preferences, and biometrics.</p>
        </div>

        <div className="divide-y divide-slate-100">
          
          {/* Preferred Currency Selector */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-orange-50 text-[#F26522] rounded-xl">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-slate-900">Preferred Display Currency</p>
                <p className="text-xs text-slate-500">Default wallet currency for balance preview</p>
              </div>
            </div>

            <select
              value={user.preferredCurrency || countryInfo.currency}
              onChange={(e) => handleSelectPreferredCurrency(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
            >
              <option value="GHS">GHS (₵ Ghana Cedi)</option>
              <option value="NGN">NGN (₦ Nigerian Naira)</option>
              <option value="KES">KES (KSh Kenyan Shilling)</option>
              <option value="ZAR">ZAR (R South African Rand)</option>
              <option value="USD">USD ($ US Dollar)</option>
            </select>
          </div>

          {/* Email & Personal Info */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 text-[#00796B] rounded-xl">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-slate-900">Email & Personal Information</p>
                <p className="text-xs text-slate-500">{user.email} • {user.phone}</p>
              </div>
            </div>

            <button
              onClick={() => setShowPersonalInfoModal(true)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          {/* Change Password */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-slate-900">Change Account Password</p>
                <p className="text-xs text-slate-500">Update password for account sign-in</p>
              </div>
            </div>

            <button
              onClick={() => setShowChangePasswordModal(true)}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <span>Update</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4-Digit Transaction PIN setup */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-slate-900">4-Digit Transaction PIN</p>
                <p className="text-xs text-slate-500">
                  Protected 256-Bit Transaction Authorization PIN
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPinModal(true)}
              className="px-3.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <span>Change PIN</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Biometric Toggle (Face ID/Fingerprint) */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-slate-900">Biometric Verification</p>
                <p className="text-xs text-slate-500">Use Face ID / Touch ID for quick payout authorization</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleBiometric}
              className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center cursor-pointer ${
                (user.biometricEnabled ?? true) ? 'bg-[#00796B] justify-end' : 'bg-slate-300 justify-start'
              }`}
            >
              <div className="w-4 h-4 rounded-full bg-white shadow-md" />
            </button>
          </div>

          {/* Sign Out */}
          <div className="py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-red-50 text-red-600 rounded-xl">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs sm:text-sm text-slate-900">Sign Out</p>
                <p className="text-xs text-slate-500">Log out of active session</p>
              </div>
            </div>

            <button
              onClick={onSignOut}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
            >
              Sign Out
            </button>
          </div>

        </div>
      </div>

      {/* EDIT PERSONAL INFO MODAL */}
      {showPersonalInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 relative">
            <button
              onClick={() => setShowPersonalInfoModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900">Edit Personal Information</h3>

            <form onSubmit={handleSavePersonalInfo} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                  <span>Full Name</span>
                  {isVerified && (
                    <span className="text-[10px] text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
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
                    Strict KYC Policy: Name automatically matches and locks to official {countryInfo.kycDocName} document verification.
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

      {/* CHANGE PASSWORD MODAL */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 relative">
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
              <form onSubmit={handleChangePassword} className="space-y-4 text-left">
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Confirm New Password</label>
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

      {/* 4-DIGIT PIN SETUP MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 relative">
            <button
              onClick={() => setShowPinModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900">Set 4-Digit Transaction PIN</h3>
            <p className="text-xs text-slate-500">
              This PIN will be required to authorize outgoing transfers, virtual card issuance, and sensitive actions.
            </p>

            {pinSuccess ? (
              <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-200 text-center font-bold text-xs flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Transaction PIN updated successfully!</span>
              </div>
            ) : (
              <form onSubmit={handleSavePin} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">New 4-Digit PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    placeholder="e.g. 8821"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xl font-bold font-mono tracking-widest focus:ring-2 focus:ring-[#F26522] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#00796B] hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  Save Transaction PIN
                </button>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
