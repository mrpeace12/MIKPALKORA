import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

// 1. VISA LOGO
export const VisaLogo: React.FC<LogoProps> = ({ className = 'h-5 w-auto' }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="40" rx="6" fill="#0E4595" />
    <path
      d="M48.2 28.5L52.5 11.5H57.5L53.2 28.5H48.2ZM73.8 11.8C72.8 11.4 71.3 11 69.4 11C64.6 11 61.2 13.5 61.2 17.1C61.2 19.8 63.6 21.3 65.4 22.2C67.3 23.1 67.9 23.7 67.9 24.5C67.9 25.7 66.5 26.3 65.1 26.3C63 26.3 61.7 25.9 60.5 25.3L59.8 28.6C61 29.1 63.1 29.5 65.4 29.5C70.5 29.5 73.8 27 73.8 23.1C73.8 20 71.9 18.5 69.1 17.2C67.4 16.3 66.8 15.8 66.8 14.9C66.8 14 67.9 13.2 69.3 13.2C70.8 13.2 72.1 13.5 73 13.9L73.8 11.8ZM87.8 28.5H92.2L88.3 11.5H84.3C83.4 11.5 82.6 12 82.3 12.8L75.5 28.5H80.5L81.5 25.7H87.3L87.8 28.5ZM82.9 22L85.3 15.5L86.7 22H82.9ZM42.5 11.5L37.8 23.2L36.2 12.3C35.9 11.7 35.3 11.5 34.6 11.5H27V12.2C29.6 12.8 31.8 13.8 33.5 15L38.2 28.5H43.3L51 11.5H42.5Z"
      fill="white"
    />
    <path d="M34.6 11.5H27V12.2C29.6 12.8 31.8 13.8 33.5 15L31.2 28.5H36.2L42.5 11.5H34.6Z" fill="#F7B600" />
  </svg>
);

// 2. MASTERCARD LOGO
export const MastercardLogo: React.FC<LogoProps> = ({ className = 'h-5 w-auto' }) => (
  <svg className={className} viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="40" rx="6" fill="#1A1F2C" />
    <circle cx="50" cy="20" r="12" fill="#EB001B" />
    <circle cx="70" cy="20" r="12" fill="#F79E1B" />
    <path
      d="M60 10.42C56.68 12.84 54.5 16.68 54.5 20C54.5 23.32 56.68 27.16 60 29.58C63.32 27.16 65.5 23.32 65.5 20C65.5 16.68 63.32 12.84 60 10.42Z"
      fill="#FF5F00"
    />
  </svg>
);

// 3. MTN MOBILE MONEY (MoMo) LOGO
export const MtnMoMoLogo: React.FC<LogoProps> = ({ className = 'h-6 w-auto' }) => (
  <svg className={className} viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="140" height="40" rx="8" fill="#FFCC00" />
    <ellipse cx="40" cy="20" rx="22" ry="13" fill="#002B49" />
    <text x="40" y="24" fill="#FFCC00" fontSize="12" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
      MTN
    </text>
    <text x="95" y="25" fill="#002B49" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
      MoMo
    </text>
  </svg>
);

// 4. TELECEL CASH (formerly Vodafone Cash)
export const TelecelLogo: React.FC<LogoProps> = ({ className = 'h-6 w-auto' }) => (
  <svg className={className} viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="140" height="40" rx="8" fill="#E2001A" />
    <circle cx="28" cy="20" r="10" fill="white" />
    <path d="M28 14C24.6863 14 22 16.6863 22 20C22 23.3137 24.6863 26 28 26" stroke="#E2001A" strokeWidth="3.5" strokeLinecap="round" />
    <text x="88" y="25" fill="white" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
      Telecel Cash
    </text>
  </svg>
);

// 5. M-PESA LOGO
export const MPesaLogo: React.FC<LogoProps> = ({ className = 'h-6 w-auto' }) => (
  <svg className={className} viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="140" height="40" rx="8" fill="#4B9B41" />
    <rect x="5" y="5" width="40" height="30" rx="5" fill="#E2001A" />
    <text x="25" y="25" fill="white" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
      M
    </text>
    <text x="90" y="25" fill="white" fontSize="14" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
      PESA
    </text>
  </svg>
);

// 6. MONIEPOINT / NIGERIAN BANK LOGO
export const MoniepointLogo: React.FC<LogoProps> = ({ className = 'h-6 w-auto' }) => (
  <svg className={className} viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="140" height="40" rx="8" fill="#003399" />
    <circle cx="25" cy="20" r="9" fill="#00D2FF" />
    <path d="M25 15L29 25H21L25 15Z" fill="white" />
    <text x="85" y="25" fill="white" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
      Moniepoint
    </text>
  </svg>
);

// 7. ECOBANK LOGO
export const EcobankLogo: React.FC<LogoProps> = ({ className = 'h-6 w-auto' }) => (
  <svg className={className} viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="140" height="40" rx="8" fill="#005B94" />
    <path d="M15 12H35V17H22V20H33V25H22V28H35V33H15V12Z" fill="#78B82A" />
    <text x="85" y="25" fill="white" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">
      Ecobank
    </text>
  </svg>
);

// 8. ZENITH BANK LOGO
export const ZenithLogo: React.FC<LogoProps> = ({ className = 'h-6 w-auto' }) => (
  <svg className={className} viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="140" height="40" rx="8" fill="#D2232A" />
    <text x="25" y="28" fill="white" fontSize="22" fontWeight="900" textAnchor="middle" fontFamily="serif">
      Z
    </text>
    <text x="85" y="25" fill="white" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
      Zenith Bank
    </text>
  </svg>
);

// 9. ACCESS BANK LOGO
export const AccessBankLogo: React.FC<LogoProps> = ({ className = 'h-6 w-auto' }) => (
  <svg className={className} viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="140" height="40" rx="8" fill="#002D62" />
    <path d="M18 28L28 12L38 28H18Z" fill="#F37021" />
    <text x="88" y="25" fill="white" fontSize="13" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
      Access Bank
    </text>
  </svg>
);

// 10. STANDARD CHARTERED LOGO
export const StanChartLogo: React.FC<LogoProps> = ({ className = 'h-6 w-auto' }) => (
  <svg className={className} viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="140" height="40" rx="8" fill="#0A3C60" />
    <circle cx="22" cy="20" r="8" fill="#009A44" />
    <circle cx="32" cy="20" r="8" fill="#0083C8" />
    <text x="90" y="25" fill="white" fontSize="11" fontWeight="800" textAnchor="middle" fontFamily="sans-serif">
      StanChart
    </text>
  </svg>
);

// Helper function to render logo by provider code / bank name
export const PaymentChannelBadge: React.FC<{ providerCode: string; name: string; type?: string }> = ({
  providerCode,
  name,
  type,
}) => {
  const codeLower = (providerCode || name || '').toLowerCase();

  if (codeLower.includes('momo') || codeLower.includes('mtn')) {
    return <MtnMoMoLogo className="h-6 w-auto shadow-2xs" />;
  }
  if (codeLower.includes('telecel') || codeLower.includes('vodafone')) {
    return <TelecelLogo className="h-6 w-auto shadow-2xs" />;
  }
  if (codeLower.includes('mpesa') || codeLower.includes('m-pesa') || codeLower.includes('safaricom')) {
    return <MPesaLogo className="h-6 w-auto shadow-2xs" />;
  }
  if (codeLower.includes('moniepoint') || codeLower.includes('kora')) {
    return <MoniepointLogo className="h-6 w-auto shadow-2xs" />;
  }
  if (codeLower.includes('ecobank')) {
    return <EcobankLogo className="h-6 w-auto shadow-2xs" />;
  }
  if (codeLower.includes('zenith')) {
    return <ZenithLogo className="h-6 w-auto shadow-2xs" />;
  }
  if (codeLower.includes('access')) {
    return <AccessBankLogo className="h-6 w-auto shadow-2xs" />;
  }
  if (codeLower.includes('standard') || codeLower.includes('stanchart')) {
    return <StanChartLogo className="h-6 w-auto shadow-2xs" />;
  }

  // Fallback badge
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 text-white text-[11px] font-black rounded-lg border border-slate-700">
      <span className="w-2 h-2 rounded-full bg-emerald-400" />
      <span className="truncate max-w-[100px]">{name}</span>
    </div>
  );
};
