import React, { useState } from 'react';
import { CountryCode, UserProfile, BankAccount, WalletBalance } from '../types';
import { COUNTRIES } from '../data/mockData';
import { X, CheckCircle2, ShieldCheck, Camera, ArrowRight, ArrowLeft, Lock, Building2, Sparkles, Mail, KeyRound, User, Globe, AlertTriangle } from 'lucide-react';
import { Logo } from './Logo';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteOnboarding: (newProfile: UserProfile) => void;
  initialMode?: 'SIGN_UP' | 'LOGIN' | 'KYC_ONLY';
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onCompleteOnboarding,
  initialMode = 'SIGN_UP',
}) => {
  // Flow view modes:
  // 1. AUTH_SIGN_UP
  // 2. AUTH_LOGIN
  // 3. OTP_VERIFY
  // 4. PROFILE_SETUP (Choose Handle + Region)
  // 5. REGIONAL_KYC (Document details)
  // 6. BIOMETRIC_LIVENESS
  // 7. KYC_COMPLETE
  const [flowStage, setFlowStage] = useState<
    'AUTH_SIGN_UP' | 'AUTH_LOGIN' | 'OTP_VERIFY' | 'PROFILE_SETUP' | 'REGIONAL_KYC' | 'BIOMETRIC_LIVENESS' | 'KYC_COMPLETE'
  >(initialMode === 'LOGIN' ? 'AUTH_LOGIN' : initialMode === 'KYC_ONLY' ? 'REGIONAL_KYC' : 'AUTH_SIGN_UP');

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [otpCode, setOtpCode] = useState('849201');

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>('GH');

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [livenessStatus, setLivenessStatus] = useState<'IDLE' | 'SCANNING' | 'SUCCESS'>('IDLE');
  const [livenessTask, setLivenessTask] = useState<string>('Center your face in the oval frame');

  if (!isOpen) return null;

  const currentCountryInfo = COUNTRIES[selectedCountry];

  const handleCountrySelect = (code: CountryCode) => {
    setSelectedCountry(code);
  };

  const handleInputChange = (fieldKey: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      alert('Please enter a valid email and password');
      return;
    }
    setFlowStage('OTP_VERIFY');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      alert('Please enter your email and password');
      return;
    }
    // Simulate login -> go to profile setup or complete
    setFlowStage('PROFILE_SETUP');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setFlowStage('PROFILE_SETUP');
  };

  const handleCompleteProfileSetup = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = username.replace(/^@/, '').trim() || 'user_' + Math.floor(Math.random() * 900 + 100);
    const userFullName = fullName.trim() || 'MIKPAL Member';

    const initialWallets: Record<string, WalletBalance> = {};
    initialWallets[currentCountryInfo.currency] = {
      currency: currentCountryInfo.currency,
      currencySymbol: currentCountryInfo.currencySymbol,
      available: 0.0,
      pending: 0.0,
      flag: currentCountryInfo.flag,
    };
    initialWallets['USD'] = {
      currency: 'USD',
      currencySymbol: '$',
      available: 0.0,
      pending: 0.0,
      flag: '🇺🇸',
    };

    // Low-friction Tier 0 account (UNVERIFIED initially)
    const newProfile: UserProfile = {
      id: `usr_${selectedCountry.toLowerCase()}_${Date.now()}`,
      username: tag,
      email: authEmail || `${tag}@mikpal.io`,
      fullName: userFullName,
      country: selectedCountry,
      phone: `${currentCountryInfo.phoneCode} 20 123 4567`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      kycStatus: 'UNVERIFIED',
      kycDocuments: [],
      wallets: initialWallets,
      bankAccounts: [],
      cards: [],
      transactions: [],
      securityPin: '1234',
    };

    onCompleteOnboarding(newProfile);
    onClose();
  };

  const startLivenessScan = () => {
    setLivenessStatus('SCANNING');
    setLivenessTask('Slowly blink your eyes...');
    setTimeout(() => {
      setLivenessTask('Turn head slightly to the right...');
      setTimeout(() => {
        setLivenessTask('Verifying 3D micro-expressions...');
        setTimeout(() => {
          setLivenessStatus('SUCCESS');
        }, 1200);
      }, 1200);
    }, 1200);
  };

  const handleKycFinalSubmit = () => {
    const isLocalVBASupported = currentCountryInfo.supportsLocalVBA;
    const initialWallets: Record<string, WalletBalance> = {};

    initialWallets[currentCountryInfo.currency] = {
      currency: currentCountryInfo.currency,
      currencySymbol: currentCountryInfo.currencySymbol,
      available: 500.0, // Verification welcome credit
      pending: 0,
      flag: currentCountryInfo.flag,
    };

    initialWallets['USD'] = {
      currency: 'USD',
      currencySymbol: '$',
      available: 10.0,
      pending: 0,
      flag: '🇺🇸',
    };

    const generatedBankAccounts: BankAccount[] = [];

    if (isLocalVBASupported && currentCountryInfo.localBankName) {
      generatedBankAccounts.push({
        id: `vba_local_${Date.now()}`,
        type: 'LOCAL',
        accountName: `${fullName || 'Verified User'} / MIKPAL`,
        accountNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        bankName: currentCountryInfo.localBankName,
        currency: currentCountryInfo.currency,
        status: 'ACTIVE',
        isDefault: true,
      });
    } else {
      generatedBankAccounts.push({
        id: `vba_usd_free_${Date.now()}`,
        type: 'USD_GLOBAL',
        accountName: fullName || 'Verified User',
        accountNumber: `579${Math.floor(100000000 + Math.random() * 900000000)}`,
        bankName: 'Bank of the Lakes',
        routingNumber: '021001208',
        swiftCode: 'LAKEUS41',
        currency: 'USD',
        status: 'ACTIVE',
        isDefault: true,
        detailsBanner: 'Your primary global account is ready. Add local mobile money or card methods to deposit.',
      });
    }

    const verifiedProfile: UserProfile = {
      id: `usr_${selectedCountry.toLowerCase()}_${Date.now()}`,
      username: username || 'user_' + Math.floor(Math.random() * 99),
      email: authEmail || `user@mikpal.io`,
      fullName: fullName || 'Verified MIKPAL User',
      country: selectedCountry,
      phone: formData['phone'] || `${currentCountryInfo.phoneCode} 20 123 4567`,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
      kycStatus: 'VERIFIED',
      kycDocuments: [
        {
          docType: currentCountryInfo.kycDocName,
          docNumber: formData[currentCountryInfo.kycFields[0]?.key] || 'VERIFIED-ID-901',
          verifiedAt: new Date().toISOString().split('T')[0],
          status: 'VERIFIED',
        },
      ],
      wallets: initialWallets,
      bankAccounts: generatedBankAccounts,
      cards: [],
      transactions: [
        {
          id: `txn_welcome_${Date.now()}`,
          reference: `MP-WLCM-${Math.floor(Math.random() * 900000 + 100000)}`,
          title: 'Identity Verification Bonus',
          subtitle: `Instant MIKPAL ${currentCountryInfo.currency} Virtual Banking Activated`,
          type: 'DEPOSIT',
          amount: 500,
          currency: currentCountryInfo.currency,
          currencySymbol: currentCountryInfo.currencySymbol,
          fee: 0,
          status: 'SUCCESS',
          date: 'Just now',
        },
      ],
      securityPin: '1234',
    };

    onCompleteOnboarding(verifiedProfile);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white p-6 relative flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div className="h-5 w-[1px] bg-slate-700 mx-1"></div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-500/20 text-[#F26522] border border-orange-500/30">
              Low-Friction Onboarding
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 flex-1 space-y-6">

          {/* 1. INITIAL SIGN-UP FORM */}
          {flowStage === 'AUTH_SIGN_UP' && (
            <div className="space-y-6">
              {/* Prominent MIKPAL Logo Banner */}
              <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-800 flex items-center gap-4 shadow-md">
                <div className="bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-sm shrink-0">
                  <Logo size="lg" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">Welcome to MIKPAL</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Your Global Multi-Currency Bank Accounts & Payouts</p>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">Create your MIKPAL Account</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Start in seconds. No lengthy forms required upfront.
                </p>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#F26522]" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#F26522] focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#F26522]" />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#F26522] focus:bg-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-[#F26522] to-[#E85D04] hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2"
                >
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Already have a MIKPAL account?{' '}
                  <button
                    onClick={() => setFlowStage('AUTH_LOGIN')}
                    className="font-bold text-[#F26522] hover:underline"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* 2. INITIAL LOGIN FORM */}
          {flowStage === 'AUTH_LOGIN' && (
            <div className="space-y-6">
              {/* Prominent MIKPAL Logo Banner */}
              <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl border border-slate-800 flex items-center gap-4 shadow-md">
                <div className="bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-sm shrink-0">
                  <Logo size="lg" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-white">MIKPAL Sign In</h4>
                  <p className="text-xs text-slate-300 mt-0.5">Secure Multi-Currency Banking & Instant Transfers</p>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-900">Sign in to MIKPAL</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Access your multi-currency balances, virtual cards, and payouts.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#F26522]" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#F26522] focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#F26522]" />
                    <span>Password</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#F26522] focus:bg-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Don&apos;t have an account yet?{' '}
                  <button
                    onClick={() => setFlowStage('AUTH_SIGN_UP')}
                    className="font-bold text-[#F26522] hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* 3. EMAIL OTP VERIFICATION */}
          {flowStage === 'OTP_VERIFY' && (
            <div className="space-y-6 text-center">
              <div className="w-12 h-12 bg-orange-100 text-[#F26522] rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900">Verify your Email Address</h3>
                <p className="text-slate-500 text-xs mt-1">
                  We sent a 6-digit confirmation code to <strong className="text-slate-800">{authEmail || 'your email'}</strong>
                </p>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4 max-w-xs mx-auto">
                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full text-center tracking-[0.5em] font-mono text-2xl font-black py-3 bg-slate-50 border-2 border-slate-300 rounded-xl focus:border-[#F26522] outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow transition"
                >
                  Confirm & Continue
                </button>
              </form>
            </div>
          )}

          {/* 4. POST-REGISTRATION SETUP (Choose Username & Operating Region) */}
          {flowStage === 'PROFILE_SETUP' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Profile & Regional Setup</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Choose your unique P2P MIKPAL tag and operating region.
                </p>
              </div>

              <form onSubmit={handleCompleteProfileSetup} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#F26522]" />
                    <span>Full Name</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#F26522] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#F26522]" />
                    <span>MIKPAL Username (`$tag` / `@handle`)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">@</span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                      placeholder="kwame"
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#F26522] outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Used for instant zero-fee MIKPAL-to-MIKPAL P2P transfers.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-[#F26522]" />
                    <span>Operating Region / Country</span>
                  </label>

                  <div className="grid grid-cols-2 gap-2.5">
                    {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => {
                      const country = COUNTRIES[code];
                      const isSelected = selectedCountry === code;
                      return (
                        <div
                          key={code}
                          onClick={() => handleCountrySelect(code)}
                          className={`p-3 rounded-2xl border cursor-pointer transition flex items-center gap-3 ${
                            isSelected
                              ? 'border-[#F26522] bg-orange-50/50 ring-2 ring-orange-500/20'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <span className="text-2xl">{country.flag}</span>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 block truncate">{country.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{country.currency} ({country.currencySymbol})</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Initial account created as <strong>Tier 0 (Unverified)</strong>. You can verify identity later in the KYC Vault to unlock virtual banking.
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-gradient-to-r from-[#F26522] to-[#E85D04] hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2"
                >
                  <span>Launch MIKPAL Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}

          {/* 5. REGIONAL KYC (Document details) */}
          {flowStage === 'REGIONAL_KYC' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{currentCountryInfo.flag}</span>
                    <h3 className="text-xl font-bold text-slate-900">Regional Identity Verification ({currentCountryInfo.name})</h3>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    Providing {currentCountryInfo.kycDocName} details matching official government database.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center gap-2.5 text-xs text-amber-900">
                <Lock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  <strong>Isolated Session ({currentCountryInfo.code}):</strong> Only {currentCountryInfo.name} compliance fields are required.
                </span>
              </div>

              <div className="space-y-4">
                {currentCountryInfo.kycFields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>{field.label}</span>
                      <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {currentCountryInfo.code} Mandatory
                      </span>
                    </label>
                    <input
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#F26522] outline-none"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  onClick={() => setFlowStage('BIOMETRIC_LIVENESS')}
                  className="flex items-center gap-2 px-6 py-3 bg-[#F26522] hover:bg-orange-600 text-white font-bold text-sm rounded-xl shadow transition"
                >
                  <span>Proceed to Biometric Check</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* 6. BIOMETRIC LIVENESS */}
          {flowStage === 'BIOMETRIC_LIVENESS' && (
            <div className="space-y-6 text-center py-2">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Biometric Liveness Check</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Ensure you are in a well-lit room. Our AI Liveness SDK checks micro-expressions to prevent fraud.
                </p>
              </div>

              <div className="relative w-56 h-56 mx-auto rounded-full bg-slate-900 border-4 border-dashed border-teal-500/50 flex flex-col items-center justify-center overflow-hidden shadow-inner p-4">
                {livenessStatus === 'IDLE' && (
                  <div className="flex flex-col items-center gap-3 text-slate-300">
                    <Camera className="w-10 h-10 text-teal-400 animate-bounce" />
                    <p className="text-xs font-medium text-slate-200">{livenessTask}</p>
                    <button
                      onClick={startLivenessScan}
                      className="px-4 py-2 bg-[#00796B] hover:bg-teal-700 text-white font-bold text-xs rounded-full shadow"
                    >
                      Start Scan
                    </button>
                  </div>
                )}

                {livenessStatus === 'SCANNING' && (
                  <div className="flex flex-col items-center gap-3 text-white">
                    <div className="w-10 h-10 rounded-full border-4 border-teal-400 border-t-transparent animate-spin"></div>
                    <p className="text-xs font-semibold text-teal-300 animate-pulse">{livenessTask}</p>
                  </div>
                )}

                {livenessStatus === 'SUCCESS' && (
                  <div className="flex flex-col items-center gap-2 text-emerald-400 animate-in zoom-in-90">
                    <CheckCircle2 className="w-14 h-14 text-emerald-400" />
                    <span className="text-sm font-bold text-white">Liveness Verified!</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4">
                <button
                  onClick={() => setFlowStage('REGIONAL_KYC')}
                  className="flex items-center gap-1.5 px-4 py-2 text-slate-600 text-sm font-semibold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handleKycFinalSubmit}
                  disabled={livenessStatus !== 'SUCCESS'}
                  className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-xl transition ${
                    livenessStatus === 'SUCCESS'
                      ? 'bg-[#F26522] hover:bg-orange-600 text-white shadow'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <span>Complete Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

