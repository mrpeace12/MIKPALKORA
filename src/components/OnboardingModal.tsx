import React, { useState } from 'react';
import { CountryCode, UserProfile, BankAccount, WalletBalance } from '../types';
import { COUNTRIES } from '../data/mockData';
import { X, CheckCircle2, ShieldCheck, Camera, ArrowRight, ArrowLeft, Lock, Building2, Sparkles, Mail, KeyRound, User, Globe, AlertTriangle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from './Logo';
import { api } from '../api';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteOnboarding: (newProfile: UserProfile) => void;
  initialMode?: 'SIGN_UP' | 'LOGIN' | 'KYC_ONLY';
}

function formatBackendUserToProfile(backendUser: any, defaultCountry: CountryCode = 'GH'): UserProfile {
  const country = (backendUser.country || defaultCountry) as CountryCode;
  const countryInfo = COUNTRIES[country] || COUNTRIES['GH'];

  const initialWallets: Record<string, WalletBalance> = {};
  if (Array.isArray(backendUser.wallets) && backendUser.wallets.length > 0) {
    backendUser.wallets.forEach((w: any) => {
      const c = w.currency;
      const info = COUNTRIES[c as CountryCode];
      initialWallets[c] = {
        currency: c,
        currencySymbol: info ? info.currencySymbol : (c === 'USD' ? '$' : c),
        available: Number(w.balance) || 0,
        pending: 0,
        flag: info ? info.flag : (c === 'USD' ? '🇺🇸' : '🌍'),
      };
    });
  } else {
    initialWallets[countryInfo.currency] = {
      currency: countryInfo.currency,
      currencySymbol: countryInfo.currencySymbol,
      available: 1250.0,
      pending: 0,
      flag: countryInfo.flag,
    };
    initialWallets['USD'] = {
      currency: 'USD',
      currencySymbol: '$',
      available: 250.0,
      pending: 0,
      flag: '🇺🇸',
    };
  }

  return {
    id: backendUser.id || `usr_${Date.now()}`,
    username: backendUser.username || backendUser.email?.split('@')[0] || 'member',
    email: backendUser.email || 'user@mikpal.io',
    fullName: backendUser.full_name || backendUser.email || 'MIKPAL Member',
    country: country,
    phone: backendUser.phone || `${countryInfo.phoneCode} 20 123 4567`,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
    kycStatus: (backendUser.kyc_status as any) || 'VERIFIED',
    kycDocuments: [
      {
        docType: countryInfo.kycDocName,
        docNumber: 'VERIFIED-ID-901',
        verifiedAt: new Date().toISOString().split('T')[0],
        status: 'VERIFIED',
      },
    ],
    wallets: initialWallets,
    bankAccounts: [
      {
        id: `vba_${country.toLowerCase()}_${Date.now()}`,
        type: countryInfo.supportsLocalVBA ? 'LOCAL' : 'USD_GLOBAL',
        accountName: backendUser.full_name || 'Verified Member',
        accountNumber: `${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        bankName: countryInfo.localBankName || 'US Partner Bank',
        currency: countryInfo.currency,
        status: 'ACTIVE',
        isDefault: true,
      },
    ],
    cards: [],
    transactions: [],
    securityPin: '1234',
  };
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

  React.useEffect(() => {
    if (isOpen) {
      setFlowStage(initialMode === 'LOGIN' ? 'AUTH_LOGIN' : initialMode === 'KYC_ONLY' ? 'REGIONAL_KYC' : 'AUTH_SIGN_UP');
    }
  }, [isOpen, initialMode]);

  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('849201');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

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

  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { label: '', score: 0, color: 'bg-slate-200' };
    if (pwd.length < 6) return { label: 'Weak', score: 1, color: 'bg-red-500', text: 'text-red-500' };
    if (pwd.length < 10) return { label: 'Medium', score: 2, color: 'bg-amber-500', text: 'text-amber-600' };
    return { label: 'Strong', score: 3, color: 'bg-emerald-500', text: 'text-emerald-600' };
  };

  const pwdStrength = getPasswordStrength(authPassword);

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Please enter a valid email and password');
      return;
    }
    setAuthError('');
    setFlowStage('OTP_VERIFY');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      setAuthError('Please enter your email and password');
      return;
    }
    setIsLoading(true);
    setAuthError('');
    try {
      const res = await api.signin(authEmail, authPassword);
      if (res.token) {
        api.setToken(res.token);
      }
      const profile = formatBackendUserToProfile(res.user);
      onCompleteOnboarding(profile);
      onClose();
    } catch (err: any) {
      setAuthError(err.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (email: string) => {
    setIsLoading(true);
    setAuthError('');
    setAuthEmail(email);
    setAuthPassword('password123');
    try {
      const res = await api.signin(email, 'password123');
      if (res.token) {
        api.setToken(res.token);
      }
      const profile = formatBackendUserToProfile(res.user);
      onCompleteOnboarding(profile);
      onClose();
    } catch (err: any) {
      setAuthError(err.message || 'Demo login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setAuthEmail('alex.mensah@gmail.com');
    setFullName('Alex Mensah');
    setAuthError('');
    setFlowStage('PROFILE_SETUP');
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setFlowStage('PROFILE_SETUP');
  };

  const handleCompleteProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const tag = username.replace(/^@/, '').trim() || 'user_' + Math.floor(Math.random() * 900 + 100);
    const userFullName = fullName.trim() || 'MIKPAL Member';

    setIsLoading(true);
    setAuthError('');
    try {
      const res = await api.signup({
        email: authEmail || `${tag}@mikpal.io`,
        password: authPassword || 'password123',
        full_name: userFullName,
        username: tag,
        country: selectedCountry,
        phone: `${currentCountryInfo.phoneCode} 20 123 4567`,
      });

      if (res.token) {
        api.setToken(res.token);
      }
      const profile = formatBackendUserToProfile(res.user, selectedCountry);
      onCompleteOnboarding(profile);
      onClose();
    } catch (err: any) {
      setAuthError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
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
        bankName: 'US Partner Bank',
        routingNumber: '021001208',
        swiftCode: 'PNBKUS33',
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
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Secure Connection</span>
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition cursor-pointer"
            title="Close and return to landing page"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 flex-1 space-y-6">

          {/* 1. INITIAL SIGN-UP FORM */}
          {flowStage === 'AUTH_SIGN_UP' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Create your MIKPAL Account</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Join thousands using MIKPAL for multi-currency accounts and cross-border transfers.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Google One-Tap Auth Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign up with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  or register with email
                </span>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                {/* Full Name Field */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#F26522]" />
                    <span>Full Name (As on ID)</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Kwame Mensah"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#F26522] focus:bg-white outline-none"
                  />
                </div>

                {/* Email Address */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#F26522]" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#F26522] focus:bg-white outline-none"
                  />
                </div>

                {/* Password Input with Eye Toggle & Password Strength */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#F26522]" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#F26522] focus:bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {authPassword.length > 0 && (
                    <div className="mt-1.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-400">Password Strength:</span>
                        <span className={pwdStrength.text}>{pwdStrength.label}</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex gap-1">
                        <div className={`h-full flex-1 transition-all ${pwdStrength.score >= 1 ? pwdStrength.color : 'bg-slate-200'}`} />
                        <div className={`h-full flex-1 transition-all ${pwdStrength.score >= 2 ? pwdStrength.color : 'bg-slate-200'}`} />
                        <div className={`h-full flex-1 transition-all ${pwdStrength.score >= 3 ? pwdStrength.color : 'bg-slate-200'}`} />
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-[#F26522] to-[#E85D04] hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Compliance & Terms Notice */}
                <p className="text-[10px] text-slate-400 text-center leading-relaxed pt-1">
                  By tapping <strong className="text-slate-600">Create Account</strong>, you agree to MIKPAL's{' '}
                  <span className="underline hover:text-slate-600 cursor-pointer">Terms of Service</span> &{' '}
                  <span className="underline hover:text-slate-600 cursor-pointer">Privacy Policy</span>.
                </p>
              </form>

              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Already have a MIKPAL account?{' '}
                  <button
                    onClick={() => { setAuthError(''); setFlowStage('AUTH_LOGIN'); }}
                    className="font-bold text-[#F26522] hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* 2. INITIAL LOGIN FORM */}
          {flowStage === 'AUTH_LOGIN' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-2xl font-black text-slate-900">Sign in to MIKPAL</h3>
                <p className="text-slate-500 text-xs mt-1">
                  Access your multi-currency balances, virtual cards, and payouts.
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Quick Demo Credentials */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <span className="font-bold text-slate-700 block mb-1.5">Instant 1-Click Demo Logins:</span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('kwame@mikpal.com')}
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-white hover:bg-orange-50 border border-slate-200 hover:border-[#F26522] rounded-lg text-[11px] font-semibold text-slate-800 transition cursor-pointer"
                  >
                    🇬🇭 Kwame (GHS)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('amina@mikpal.com')}
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 rounded-lg text-[11px] font-semibold text-slate-800 transition cursor-pointer"
                  >
                    🇳🇬 Amina (NGN)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoLogin('juma@mikpal.com')}
                    disabled={isLoading}
                    className="px-2.5 py-1 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-500 rounded-lg text-[11px] font-semibold text-slate-800 transition cursor-pointer"
                  >
                    🇰🇪 Juma (KES)
                  </button>
                </div>
              </div>

              {/* Google Quick Sign-In */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign in with Google</span>
              </button>

              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                <span className="relative bg-white px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  or sign in with email
                </span>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#F26522]" />
                    <span>Email Address</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#F26522] focus:bg-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#F26522]" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[#F26522] focus:bg-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-0.5 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Signing in...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Don&apos;t have an account yet?{' '}
                  <button
                    onClick={() => { setAuthError(''); setFlowStage('AUTH_SIGN_UP'); }}
                    className="font-bold text-[#F26522] hover:underline cursor-pointer"
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

