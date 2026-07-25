import React from 'react';
import mikpalLogo from '../assets/images/mikpal_logo_clean_1784945515719.jpg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'image' | 'combined' | 'symbol';
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '', variant = 'combined' }) => {
  const imgHeight = size === 'sm' ? 'h-7' : size === 'lg' ? 'h-11' : size === 'xl' ? 'h-16' : 'h-9';
  const textSizes = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl font-black' : size === 'xl' ? 'text-3xl font-black' : 'text-xl font-extrabold';

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official MIKPAL Handshake Logo Image */}
      <img
        src={mikpalLogo}
        alt="MIKPAL Official Logo"
        referrerPolicy="no-referrer"
        className={`${imgHeight} w-auto object-contain rounded-xl bg-white shadow-xs p-0.5 border border-slate-100 shrink-0`}
      />

      {showText && variant !== 'symbol' && (
        <span className={`tracking-tight font-sans ${textSizes}`}>
          <span className="text-[#F26522]">MIK</span>
          <span className="text-[#0F4C5C]">PAL</span>
        </span>
      )}
    </div>
  );
};

