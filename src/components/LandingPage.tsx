import React from 'react';
import { COUNTRIES } from '../data/mockData';
import { Shield, Lock, Globe, Building2, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F26522]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-300">Live on Cloudflare Workers</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-6">
            Digital Finance<br /><span className="text-[#F26522]">for Africa</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Send money, hold multi-currency wallets, and pay anyone across Africa. Powered by Korapay, secured by Cloudflare.
          </p>
          <button onClick={onGetStarted} className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#F26522] to-[#E85D04] text-white font-bold text-sm rounded-2xl hover:opacity-95 transition cursor-pointer shadow-2xl shadow-orange-500/30">
            Get Started <ArrowRight className="w-4 h-4" />
          </button>
          {/* Country flags */}
          <div className="flex items-center justify-center gap-3 mt-12 flex-wrap">
            {Object.values(COUNTRIES).map(c => (
              <div key={c.currency} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                <span className="text-lg">{c.flag}</span>
                <span className="text-xs text-slate-300">{c.currency}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="w-12 h-12 bg-[#F26522]/20 rounded-xl flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-[#F26522]" />
            </div>
            <h3 className="text-lg font-bold mb-2">Bank-Grade Security</h3>
            <p className="text-sm text-slate-400">PIN-protected transactions, KYC verification, idempotency keys, and audit logging on every action.</p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
              <Globe className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Multi-Currency</h3>
            <p className="text-sm text-slate-400">Hold wallets in GHS, NGN, KES, USD, ZAR and more. P2P transfers between users instantly.</p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold mb-2">Korapay Powered</h3>
            <p className="text-sm text-slate-400">Deposit via mobile money, card, or bank. Payouts to any bank account or MoMo wallet.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-5xl mx-auto px-6 pb-20 text-center">
        <div className="p-10 bg-gradient-to-br from-[#F26522]/10 to-purple-500/10 border border-white/10 rounded-3xl">
          <h2 className="text-3xl font-black mb-4">Ready to start?</h2>
          <p className="text-slate-400 mb-6">Create your free MIKPAL account in seconds.</p>
          <button onClick={onGetStarted} className="inline-flex items-center gap-2 px-8 py-4 bg-white text-slate-900 font-bold text-sm rounded-2xl hover:bg-slate-100 transition cursor-pointer">
            Create Account <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-500">
        <p>MIKPAL &copy; 2026 — Built on Cloudflare Workers + D1 + Korapay</p>
      </footer>
    </div>
  );
};
