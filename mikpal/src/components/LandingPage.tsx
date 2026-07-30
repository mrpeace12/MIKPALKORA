import React, { useState } from 'react';
import { Logo } from './Logo';
import { CodeViewerModal } from './CodeViewerModal';
import { COUNTRIES, MOCK_USER_PROFILES, FX_RATES_TO_USD } from '../data/mockData';
import { CountryCode } from '../types';
import {
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Send,
  Building2,
  Globe,
  Zap,
  Lock,
  Code,
  Calculator,
  CheckCircle2,
  Star,
  Users,
  Sparkles,
  ChevronRight,
  RefreshCw,
  PhoneCall,
  ChevronDown,
  Download,
  FileText
} from 'lucide-react';

interface LandingPageProps {
  onOpenSignUp: () => void;
  onOpenSignIn: () => void;
  onSelectDemoUser: (country: CountryCode) => void;
  onOpenFxCalc: () => void;
  onOpenAdminPortal: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenSignUp,
  onOpenSignIn,
  onSelectDemoUser,
  onOpenFxCalc,
  onOpenAdminPortal,
}) => {
  // Code Viewer Modal State
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);

  // Live FX rate calculator snippet state
  const [sendAmount, setSendAmount] = useState<string>('100');
  const [fromCurr, setFromCurr] = useState<string>('USD');
  const [toCurr, setToCurr] = useState<string>('GHS');

  const supportedCurrencies = [
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'GHS', name: 'Ghana Cedi', flag: '🇬🇭' },
    { code: 'NGN', name: 'Nigerian Naira', flag: '🇳🇬' },
    { code: 'KES', name: 'Kenyan Shilling', flag: '🇰🇪' },
    { code: 'XOF', name: 'CFA Franc (BCEAO)', flag: '🇨🇮' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
    { code: 'ZAR', name: 'South African Rand', flag: '🇿🇦' },
  ];

  // Calculate live conversion
  const calcConversion = () => {
    const num = parseFloat(sendAmount) || 0;
    const usdEquivalent = fromCurr === 'USD' ? num : num / (FX_RATES_TO_USD[fromCurr] || 1);
    const converted = toCurr === 'USD' ? usdEquivalent : usdEquivalent * (FX_RATES_TO_USD[toCurr] || 1);
    return converted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-[#F26522] selection:text-white flex flex-col relative overflow-hidden">
      
      {/* Background ambient lighting gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#F26522]/15 via-[#00796B]/10 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* 1. PUBLIC TOP HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase tracking-widest bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700">
              Global Fintech Engine
            </span>
          </div>

          {/* Navigation Items (Desktop) */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
            <a href="#about" className="hover:text-white transition">About Us</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <a href="#fx-rates" className="hover:text-white transition">Live FX Rates</a>
            <a href="#cards" className="hover:text-white transition">Virtual Cards</a>
            <a href="#demo-accounts" className="hover:text-white transition">Instant Demo</a>
            <button
              onClick={() => setIsCodeViewerOpen(true)}
              className="text-teal-400 hover:text-teal-300 transition flex items-center gap-1 text-[11px] font-bold cursor-pointer"
              title="View & Download full project codebase in single document"
            >
              <FileText className="w-3.5 h-3.5 text-teal-400" />
              <span>View & Download Code</span>
            </button>
            <button
              onClick={onOpenAdminPortal}
              className="text-slate-400 hover:text-emerald-400 transition flex items-center gap-1 text-[11px] cursor-pointer"
              title="Operational Admin Portal"
            >
              <Lock className="w-3 h-3 text-emerald-500" />
              <span>HQ Admin</span>
            </button>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenSignIn}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-600 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              Sign In
            </button>

            <button
              onClick={onOpenSignUp}
              className="px-5 py-2.5 bg-gradient-to-r from-[#F26522] to-[#E85D04] hover:opacity-95 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition cursor-pointer flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section id="about" className="relative pt-12 pb-20 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Value Proposition & Copy */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-300 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400 font-extrabold">Instant Global Settlement</span>
              <span className="text-slate-600">•</span>
              <span>Zero-Markup FX Gateway</span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1]">
              The Borderless Financial Gateway for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F26522] via-orange-400 to-amber-300">Global Africa</span> & Beyond.
            </h1>

            {/* Description */}
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl font-normal">
              MIKPAL powers seamless cross-border transfers, multi-currency virtual accounts, instant Mobile Money payouts, and USD virtual debit card issuance across Ghana, Nigeria, Kenya, Côte d'Ivoire, UK, USA, and South Africa.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <button
                onClick={onOpenSignUp}
                className="px-7 py-4 bg-gradient-to-r from-[#F26522] to-[#E85D04] hover:opacity-95 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-orange-500/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Open Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <a
                href="#demo-accounts"
                className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-bold text-sm rounded-2xl border border-slate-800 hover:border-slate-700 transition flex items-center justify-center gap-2 text-center cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-orange-400" />
                <span>1-Click Live Demo</span>
              </a>

              <button
                onClick={() => setIsCodeViewerOpen(true)}
                className="px-6 py-4 bg-teal-950/80 hover:bg-teal-900 text-teal-300 hover:text-white font-bold text-sm rounded-2xl border border-teal-800/80 hover:border-teal-700 transition flex items-center justify-center gap-2 text-center cursor-pointer shadow-lg shadow-teal-950/50"
                title="View & Download entire project codebase in a single document"
              >
                <FileText className="w-4 h-4 text-teal-400" />
                <span>View & Download Code Document</span>
              </button>
            </div>

            {/* Regional Markets Pills */}
            <div className="pt-4 border-t border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Supported Regional Markets & Settlement Rails:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {Object.values(COUNTRIES).map((c) => (
                  <span
                    key={c.code}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-xl text-xs font-bold text-slate-200"
                  >
                    <span>{c.flag}</span>
                    <span>{c.name} ({c.currency})</span>
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Card & Live Rate Widget Showcase */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Photorealistic Virtual Card */}
            <div className="relative group perspective-1000">
              <div className="w-full aspect-[1.586/1] rounded-3xl p-6 sm:p-7 text-white shadow-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 via-[#1E293B] to-[#F26522]/90 border border-white/20 flex flex-col justify-between">
                
                {/* Ambient lights */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#F26522]/30 rounded-full blur-2xl pointer-events-none" />

                <div className="flex items-center justify-between z-10">
                  <Logo size="sm" showText={false} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                    USD VIRTUAL DEBIT
                  </span>
                </div>

                <div className="flex items-center gap-3 my-2 z-10">
                  {/* Metallic Chip */}
                  <div className="w-10 h-8 rounded-lg bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-500 border border-amber-400/80 shadow-md relative overflow-hidden flex items-center justify-center">
                    <div className="w-full h-[1px] bg-amber-600/40" />
                    <div className="h-full w-[1px] bg-amber-600/40 absolute" />
                  </div>
                  <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8.5 14.5A4.5 4.5 0 0 1 8.5 9.5" />
                    <path d="M12 17A8 8 0 0 0 12 7" />
                    <path d="M15.5 19.5A11.5 11.5 0 0 0 15.5 4.5" />
                  </svg>
                </div>

                <div className="z-10 font-mono font-bold text-lg sm:text-xl tracking-widest text-white">
                  •••• •••• •••• 5220
                </div>

                <div className="flex items-end justify-between z-10 pt-2 border-t border-white/10">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-white/70 block font-bold">CARDHOLDER</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-white">KWAME MENSAH</span>
                  </div>
                  <span className="text-xl font-black italic tracking-tighter text-white">VISA</span>
                </div>
              </div>
            </div>

            {/* Quick Live FX Converter Widget */}
            <div id="fx-rates" className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800 shadow-2xl space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#F26522]" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
                    Live FX Converter (0% Markup)
                  </h3>
                </div>
                <button
                  onClick={onOpenFxCalc}
                  className="text-[11px] font-bold text-[#F26522] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <span>Full Table</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Send Input */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">You Send</span>
                  <div className="flex items-center justify-between gap-1">
                    <input
                      type="number"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      className="w-full bg-transparent text-sm font-bold text-white outline-hidden font-mono"
                      min="1"
                    />
                    <select
                      value={fromCurr}
                      onChange={(e) => setFromCurr(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white px-1.5 py-1 outline-hidden cursor-pointer"
                    >
                      {supportedCurrencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Receive Output */}
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Recipient Gets</span>
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <span className="text-xs sm:text-sm font-extrabold text-emerald-400 font-mono tracking-tight shrink min-w-0 truncate">
                      {calcConversion()}
                    </span>
                    <select
                      value={toCurr}
                      onChange={(e) => setToCurr(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-white px-1.5 py-1 outline-hidden cursor-pointer shrink-0"
                    >
                      {supportedCurrencies.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Guaranteed Real-Time Interbank Rate</span>
                </span>
                <span className="font-mono">Fee: $0.00</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. CORE FEATURES GRID */}
      <section id="features" className="py-16 bg-slate-900/60 border-y border-slate-800/80 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-[#F26522]">
              Why Choose MIKPAL Fintech
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Engineered for Modern Cross-Border Business & Personal Banking
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Eliminate delays, hidden exchange markups, and restrictive local banking limits with our unified financial rails.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-3 text-left">
              <div className="p-3 bg-orange-500/10 text-[#F26522] rounded-2xl w-fit border border-orange-500/20">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-white text-base">Zero-Markup Payouts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Send instantly to MTN, Vodafone, Telecel, M-Pesa, and commercial bank accounts in GHS, NGN, KES, XOF at interbank exchange rates.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-3 text-left">
              <div className="p-3 bg-teal-500/10 text-[#00796B] rounded-2xl w-fit border border-teal-500/20">
                <CreditCard className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="font-extrabold text-white text-base">Virtual Debit Cards</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Issue USD Visa and Mastercard virtual cards in under 10 seconds for Apple Pay, AWS, Google Ads, and international shopping.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-3 text-left">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl w-fit border border-purple-500/20">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-white text-base">Virtual Bank Accounts</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dedicated virtual accounts with US bank routing numbers and local account numbers for receiving wire payments.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition space-y-3 text-left">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl w-fit border border-emerald-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-white text-base">Instant Settlement & Logs</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Real-time transaction tracking, automated digital receipts, and downloadable activity statements for complete financial transparency.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. INSTANT DEMO ACCOUNT SELECTOR */}
      <section id="demo-accounts" className="py-16 px-4 sm:px-6 max-w-7xl mx-auto w-full">
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 sm:p-10 rounded-3xl border border-slate-800 shadow-2xl space-y-8 text-left relative overflow-hidden">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-xs font-black uppercase tracking-widest text-[#00796B]">
                Instant 1-Click Demo Profiles
              </span>
              <h2 className="text-2xl font-extrabold text-white tracking-tight mt-1">
                Explore Regional MIKPAL User Profiles
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Test how MIKPAL isolates user country profiles, local bank accounts, and wallet balances in real time.
              </p>
            </div>

            <button
              onClick={onOpenSignUp}
              className="px-5 py-3 bg-[#F26522] hover:bg-orange-600 text-white font-extrabold text-xs rounded-xl shadow transition cursor-pointer shrink-0"
            >
              Create New Custom Profile
            </button>
          </div>

          {/* Demo User Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(MOCK_USER_PROFILES).map(([countryCode, profile]) => {
              const country = COUNTRIES[countryCode as CountryCode];
              return (
                <div
                  key={countryCode}
                  onClick={() => onSelectDemoUser(countryCode as CountryCode)}
                  className="bg-slate-900 hover:bg-slate-800/90 p-5 rounded-2xl border border-slate-800 hover:border-[#F26522]/50 transition cursor-pointer group space-y-3 relative flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xl">{country.flag}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {country.currency} Market
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={profile.avatar}
                        alt={profile.fullName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-orange-500/30"
                      />
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-xs text-white truncate group-hover:text-[#F26522] transition">
                          {profile.fullName}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono truncate">@{profile.username}</p>
                      </div>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] space-y-1">
                      <div className="flex justify-between text-slate-400">
                        <span>Local Wallet:</span>
                        <span className="font-bold text-slate-200">
                          {country.currencySymbol}{profile.wallets[country.currency]?.available?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>USD Wallet:</span>
                        <span className="font-bold text-emerald-400">
                          ${profile.wallets['USD']?.available?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="w-full py-2 bg-slate-800 group-hover:bg-[#F26522] text-slate-200 group-hover:text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 mt-2">
                    <span>Enter {country.name} Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* 5. TRUST, SECURITY & COMPLIANCE */}
      <section className="py-12 border-t border-slate-800/80 bg-slate-950 px-4 sm:px-6 text-center">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-slate-400 text-xs font-bold">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Secure Data Encryption</span>
            </span>
            <span className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-teal-400" />
              <span>Bank-Grade Security Vault</span>
            </span>
            <span className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>US Partner Bank USD Clearing</span>
            </span>
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-400" />
              <span>Tier-2 KYC Biometric Verification</span>
            </span>
          </div>
        </div>
      </section>

      {/* 6. PUBLIC FOOTER */}
      <footer className="mt-auto bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
          
          <div className="space-y-3">
            <Logo size="sm" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              MIKPAL is a next-generation regional financial infrastructure providing multi-currency accounts, zero-markup cross-border payouts, and virtual card issuance via certified payment partner rails.
            </p>
            <p className="text-[10px] text-slate-400 flex items-center gap-2">
              <span>MIKPAL © 2026</span>
              <span>•</span>
              <button
                onClick={onOpenAdminPortal}
                className="text-slate-500 hover:text-emerald-400 underline cursor-pointer"
              >
                Admin HQ Command
              </button>
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Products</h4>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#about" className="hover:text-white">Multi-Currency Accounts</a></li>
              <li><a href="#about" className="hover:text-white">Cross-Border Transfers</a></li>
              <li><a href="#cards" className="hover:text-white">USD Virtual Cards</a></li>
              <li><a href="#fx-rates" className="hover:text-white">Live FX Converter</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Compliance & Legal</h4>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#about" className="hover:text-white">Privacy Policy</a></li>
              <li><a href="#about" className="hover:text-white">Terms of Service</a></li>
              <li><a href="#about" className="hover:text-white">Data Security & Privacy</a></li>
              <li><a href="#about" className="hover:text-white">KYC & AML Framework</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-3">Support Desk</h4>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center gap-2 text-slate-300">
                <PhoneCall className="w-3.5 h-3.5 text-[#F26522]" />
                <span>24/7 Regional Dispute Support</span>
              </li>
              <li>Email: support@mikpal.com</li>
              <li>Location: Accra • Lagos • Nairobi • London</li>
            </ul>
          </div>

        </div>
      </footer>

      {/* Code Viewer & Downloader Modal */}
      <CodeViewerModal
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />

    </div>
  );
};

