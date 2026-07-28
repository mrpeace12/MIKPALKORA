import React from 'react';
import { CountryCode } from '../types';
import { COUNTRIES } from '../data/mockData';
import { UserPlus, Globe2, ShieldCheck, Sparkles } from 'lucide-react';

interface CountryContextSwitcherProps {
  currentCountry: CountryCode;
  onSelectCountry: (country: CountryCode) => void;
  onOpenOnboarding: () => void;
}

export const CountryContextSwitcher: React.FC<CountryContextSwitcherProps> = ({
  currentCountry,
  onSelectCountry,
  onOpenOnboarding,
}) => {
  return (
    <div className="bg-slate-900 text-slate-100 border-b border-slate-800 text-xs sm:text-sm py-2 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-4">
        
        {/* Left Label */}
        <div className="flex items-center gap-2 text-slate-300 shrink-0">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <Globe2 className="w-4 h-4 text-[#F26522]" />
          <span className="font-medium text-slate-200">
            Regional Market Switcher:
          </span>
          <span className="hidden sm:inline-block text-slate-400 text-xs">
            (Demonstrating strict country-isolated KYC & VBA routing)
          </span>
        </div>

        {/* Center: Country Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {(Object.keys(COUNTRIES) as CountryCode[]).map((code) => {
            const country = COUNTRIES[code];
            const isActive = currentCountry === code;
            return (
              <button
                key={code}
                id={`switcher-btn-${code}`}
                onClick={() => onSelectCountry(code)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#F26522] text-white shadow-md shadow-orange-950/40 font-semibold ring-1 ring-orange-400/50'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 hover:text-white border border-slate-700/60'
                }`}
              >
                <span className="text-sm">{country.flag}</span>
                <span>{country.name}</span>
                <span className={`text-[10px] opacity-80 px-1 rounded ${isActive ? 'bg-black/20' : 'bg-slate-900/60'}`}>
                  {country.currency}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            id="onboarding-setup-btn"
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#00796B] to-[#0F4C5C] hover:opacity-95 text-white text-xs font-semibold rounded-full shadow transition-all duration-150 border border-teal-500/30"
          >
            <UserPlus className="w-3.5 h-3.5 text-teal-200" />
            <span>Sign-Up & KYC</span>
          </button>
        </div>

      </div>
    </div>
  );
};
