import React, { useState } from 'react';
import { UserProfile, CountryCode, VirtualCard, BankAccount, Transaction, AdminAuditLog, AdminChargeback, WebhookEventLog } from '../types';
import { COUNTRIES, MOCK_USER_PROFILES, FX_RATES_TO_USD, REGIONAL_BANKS } from '../data/mockData';
import { INITIAL_ADMIN_AUDIT_LOGS, INITIAL_CHARGEBACKS, INITIAL_WEBHOOK_LOGS, MASTER_LIQUIDITY_POOLS } from '../data/adminMockData';
import { Logo } from './Logo';
import {
  ShieldAlert,
  Lock,
  Unlock,
  Key,
  Database,
  Activity,
  Users,
  CreditCard,
  Send,
  Building2,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  FileCheck,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Globe,
  Sliders,
  Terminal,
  Zap,
  Layers,
  Server,
  Eye,
  EyeOff,
  Download,
  Filter,
  LogOut,
  Sparkles,
  ChevronRight,
  Clock,
  BadgeCheck,
  Radio,
  Menu,
  X,
  Smartphone,
  Laptop,
  Check,
  TrendingUp,
  Cpu,
  Repeat
} from 'lucide-react';

interface AdminPortalProps {
  onExitAdmin: () => void;
  userProfiles: Record<CountryCode, UserProfile>;
  onUpdateProfiles: (updated: Record<CountryCode, UserProfile>) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  onExitAdmin,
  userProfiles,
  onUpdateProfiles,
}) => {
  // Passcode / Auth state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(true);
  const [passcode, setPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');

  // Mobile Drawer State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'USERS' | 'CARDS' | 'PAYOUTS' | 'IDENTITY' | 'RISK' | 'WEBHOOKS'>('OVERVIEW');

  // Environment Mode State
  const [envMode, setEnvMode] = useState<'LIVE_PROD' | 'SANDBOX_SIM'>('LIVE_PROD');

  // Master State
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(INITIAL_ADMIN_AUDIT_LOGS);
  const [chargebacks, setChargebacks] = useState<AdminChargeback[]>(INITIAL_CHARGEBACKS);
  const [webhookLogs, setWebhookLogs] = useState<WebhookEventLog[]>(INITIAL_WEBHOOK_LOGS);
  const [masterPools, setMasterPools] = useState(MASTER_LIQUIDITY_POOLS);

  // User Management State
  const [selectedUserCountry, setSelectedUserCountry] = useState<CountryCode>('GH');
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [selectedUserModal, setSelectedUserModal] = useState<UserProfile | null>(null);

  // Ledger Injection State
  const [ledgerAmount, setLedgerAmount] = useState<string>('500');
  const [ledgerCurrency, setLedgerCurrency] = useState<string>('GHS');
  const [ledgerAction, setLedgerAmountAction] = useState<'CREDIT' | 'DEBIT'>('CREDIT');
  const [ledgerNarration, setLedgerNarration] = useState<string>('Admin Treasury Liquidity Adjustment');
  const [ledgerReasonRef, setLedgerReasonRef] = useState<string>('SUP-2026-HQ01');
  const [ledgerReasonError, setLedgerReasonError] = useState<string | null>(null);
  const [ledgerPinModalOpen, setLedgerPinModalOpen] = useState<boolean>(false);
  const [ledgerPinInput, setLedgerPinInput] = useState<string>('');
  const [ledgerPinError, setLedgerPinError] = useState<string | null>(null);

  // Identity Lookup Tool State
  const [idCountry, setIdCountry] = useState<'NG' | 'GH' | 'KE' | 'ZA'>('NG');
  const [idType, setIdType] = useState<string>('bvn');
  const [idNumberInput, setIdNumberInput] = useState<string>('22222222222');
  const [idLookupResult, setIdLookupResult] = useState<any | null>(null);
  const [idLookupLoading, setIdLookupLoading] = useState<boolean>(false);

  // Card Management Search & Unmask State
  const [cardSearch, setCardSearch] = useState<string>('');
  const [unmaskedCardId, setUnmaskedCardId] = useState<string | null>(null);
  const [issuingFloatAddAmount, setIssuingFloatAddAmount] = useState<string>('5000');

  // Bulk Payout Dispatcher State
  const [bulkRecipientText, setBulkPayoutText] = useState<string>(
    JSON.stringify([
      { name: "John Doe", email: "johndoe@example.com", amount: 120, currency: "NGN", bankCode: "044", accountNumber: "0123456789" },
      { name: "Sarah Mensah", email: "sarah@example.com", amount: 85, currency: "GHS", bankCode: "MTN", accountNumber: "+233240001122" }
    ], null, 2)
  );
  const [bulkPayoutStatus, setBulkPayoutStatus] = useState<string | null>(null);

  // Webhook Dispatcher State
  const [simEvent, setSimEvent] = useState<string>('charge.success');
  const [simPayloadRef, setSimPayloadRef] = useState<string>('KPY-PAY-DEMO-' + Date.now().toString().slice(-6));
  const [webhookToast, setWebhookToast] = useState<string | null>(null);

  // IP Whitelisting State
  const [whitelistedIps, setWhitelistedIps] = useState<string[]>(['197.210.22.44', '102.176.19.2', '10.0.4.12']);
  const [newIpInput, setNewIpInput] = useState<string>('');

  // Handle Passcode Submission
  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode === '2026' || passcode === 'admin88') {
      setIsAdminAuthenticated(true);
      setPasscodeError('');
    } else {
      setPasscodeError('Invalid Administrative Passcode. Try: 2026');
    }
  };

  // Helper to log admin activity
  const addAuditLog = (category: AdminAuditLog['category'], action: string, details: string) => {
    const newLog: AdminAuditLog = {
      id: `LOG-${Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      actor: 'Admin HQ (Master Key)',
      category,
      action,
      details,
      ipAddress: '197.210.22.44',
      status: 'SUCCESS',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // 1. User Ledger Balance Injection
  const handleInjectUserLedger = () => {
    if (!selectedUserModal) return;

    const amt = parseFloat(ledgerAmount) || 0;
    if (amt <= 0) return;

    const updatedUser = { ...selectedUserModal };
    const wallet = updatedUser.wallets[ledgerCurrency] || {
      currency: ledgerCurrency,
      currencySymbol: ledgerCurrency === 'GHS' ? '₵' : ledgerCurrency === 'NGN' ? '₦' : ledgerCurrency === 'KES' ? 'KSh' : '$',
      available: 0,
      pending: 0,
      flag: COUNTRIES[updatedUser.country]?.flag || '🌐',
    };

    if (ledgerAction === 'CREDIT') {
      wallet.available += amt;
    } else {
      wallet.available = Math.max(0, wallet.available - amt);
    }

    updatedUser.wallets[ledgerCurrency] = wallet;

    // Create Transaction Record
    const newTx: Transaction = {
      id: `tx_admin_${Date.now()}`,
      reference: `KPY-ADM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      title: `Treasury Ledger ${ledgerAction === 'CREDIT' ? 'Credit' : 'Debit'}`,
      subtitle: ledgerNarration,
      type: ledgerAction === 'CREDIT' ? 'DEPOSIT' : 'BANK_TRANSFER',
      amount: amt,
      currency: ledgerCurrency,
      currencySymbol: wallet.currencySymbol,
      fee: 0,
      status: 'SUCCESS',
      date: new Date().toISOString().split('T')[0],
    };

    updatedUser.transactions = [newTx, ...updatedUser.transactions];

    const newProfiles = {
      ...userProfiles,
      [updatedUser.country]: updatedUser,
    };

    onUpdateProfiles(newProfiles);
    setSelectedUserModal(updatedUser);

    addAuditLog(
      'SETTLEMENT',
      `Wallet Balance ${ledgerAction}`,
      `${ledgerAction} ${wallet.currencySymbol}${amt.toLocaleString()} ${ledgerCurrency} to ${updatedUser.fullName} (${updatedUser.country}).`
    );

    alert(`Successfully ${ledgerAction.toLowerCase()}ed ${ledgerCurrency} ${amt} to ${updatedUser.fullName}!`);
  };

  // 2. Override User KYC Status
  const handleOverrideUserKyc = (newStatus: 'VERIFIED' | 'PENDING' | 'UNVERIFIED') => {
    if (!selectedUserModal) return;

    const updatedUser = { ...selectedUserModal, kycStatus: newStatus };
    const newProfiles = {
      ...userProfiles,
      [updatedUser.country]: updatedUser,
    };

    onUpdateProfiles(newProfiles);
    setSelectedUserModal(updatedUser);

    addAuditLog(
      'KYC_OVERRIDE',
      `KYC Status Changed to ${newStatus}`,
      `Administrative override executed for ${updatedUser.fullName} (${updatedUser.email}).`
    );
  };

  // 3. Add Issuing Float
  const handleAddIssuingFloat = () => {
    const amt = parseFloat(issuingFloatAddAmount) || 0;
    if (amt <= 0) return;

    setMasterPools((prev) => ({
      ...prev,
      USD: {
        ...prev.USD,
        issuingFloat: prev.USD.issuingFloat + amt,
        total: prev.USD.total + amt,
      },
    }));

    addAuditLog(
      'CARD_MANAGEMENT',
      'Master Issuing Float Top-Up',
      `Injected $${amt.toLocaleString()} USD into Virtual Card Issuing Reserve.`
    );

    alert(`Injected $${amt.toLocaleString()} USD into Virtual Card Issuing Pool!`);
  };

  // 4. Perform eIDV Identity Lookup Simulation
  const handlePerformIdentityLookup = () => {
    setIdLookupLoading(true);
    setIdLookupResult(null);

    setTimeout(() => {
      setIdLookupLoading(false);

      if (idType === 'bvn') {
        setIdLookupResult({
          status: true,
          message: 'BVN verified successfully via NIMC/Korapay Gateway',
          data: {
            reference: 'VR-dSFV9EuR2WCcHXuqm',
            id: idNumberInput,
            id_type: 'ng_bvn',
            first_name: 'Trevor',
            last_name: 'Mandela',
            date_of_birth: '1989-07-08',
            phone_number: '08031234567',
            nin: '55555555555',
            registration_date: '2015-11-11',
            validation: {
              first_name: { value: 'Trevor', match: true },
              last_name: { value: 'Mandela', match: true },
              selfie: { match: true, confidence_rating: 98.4 },
            },
          },
        });
      } else if (idType === 'cac') {
        setIdLookupResult({
          status: true,
          message: 'CAC Business Certificate verified in Corporate Registry',
          data: {
            reference: 'VR-TCGSjd4tgYaquSE20',
            id: idNumberInput,
            id_type: 'ng_cac',
            name: 'MIKPAL Regional Fintech Inc',
            registration_number: idNumberInput,
            company_status: 'ACTIVE',
            type_of_entity: 'PRIVATE LIMITED BY SHARES',
            registration_date: '2019-06-09',
            address: '1st Floor, Sum House, Victoria Island, Lagos',
            key_personnel: [
              { name: 'Issah Best', designation: 'DIRECTOR', status: 'ACTIVE' },
              { name: 'Kwame Mensah', designation: 'SHAREHOLDER', status: 'ACTIVE' },
            ],
          },
        });
      } else if (idType === 'said') {
        setIdLookupResult({
          status: true,
          message: 'South African ID verified against Home Affairs Database',
          data: {
            reference: 'VR-zip9sGAOsoQlynmQ3',
            id: idNumberInput,
            id_type: 'za_said',
            first_name: 'Sipho',
            last_name: 'Zulu',
            deceased_status: 'alive',
            marital_status: 'SINGLE',
            country_of_birth: 'SOUTH AFRICA',
            on_hanis: 'yes',
          },
        });
      } else {
        setIdLookupResult({
          status: true,
          message: 'National Identity Document Verified',
          data: {
            reference: `VR-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            id: idNumberInput,
            id_type: idType,
            status: 'VERIFIED',
            confidence_score: 99.2,
            liveness_check: 'PASS_ACTIVE_NOD_BLINK',
            verified_at: new Date().toISOString(),
          },
        });
      }

      addAuditLog(
        'KYC_OVERRIDE',
        'eIDV Identity Search Executed',
        `Ran ${idType.toUpperCase()} search for ID: ${idNumberInput} (${idCountry}).`
      );
    }, 800);
  };

  // 5. Treat Chargeback Dispute
  const handleUpdateChargeback = (id: string, newStatus: AdminChargeback['status']) => {
    setChargebacks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
    );

    addAuditLog(
      'CHARGEBACK',
      `Chargeback Dispute ${newStatus}`,
      `Dispute ${id} marked as ${newStatus} by Master Admin.`
    );
  };

  // 6. Trigger Simulated Webhook Dispatch
  const handleDispatchWebhook = () => {
    const newLog: WebhookEventLog = {
      id: `WH-${Math.floor(1000 + Math.random() * 9000)}`,
      event: simEvent,
      reference: simPayloadRef,
      url: 'https://merchant-app.com/webhooks/korapay',
      httpStatus: 200,
      attempts: 1,
      status: 'DELIVERED',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      payload: {
        event: simEvent,
        data: {
          reference: simPayloadRef,
          status: 'success',
          timestamp: new Date().toISOString(),
          simulatedBy: 'Admin Portal HQ',
        },
      },
    };

    setWebhookLogs((prev) => [newLog, ...prev]);
    setWebhookToast(`Dispatched webhook ${simEvent} for reference ${simPayloadRef}`);
    setTimeout(() => setWebhookToast(null), 4000);

    addAuditLog('SETTINGS', 'Simulated Webhook Dispatched', `Fired ${simEvent} to registered endpoint.`);
  };

  // 7. Add Whitelisted IP
  const handleAddIp = () => {
    if (!newIpInput.trim()) return;
    setWhitelistedIps((prev) => [...prev, newIpInput.trim()]);
    setNewIpInput('');
    addAuditLog('SETTINGS', 'Payout Server IP Whitelisted', `Added IP ${newIpInput} to trusted server list.`);
  };

  // Collect all cards across all users
  const allSystemCards: { user: UserProfile; card: VirtualCard }[] = [];
  Object.values(userProfiles).forEach((u: UserProfile) => {
    u.cards?.forEach((c) => {
      allSystemCards.push({ user: u, card: c });
    });
  });

  const filteredCards = allSystemCards.filter(
    (item) =>
      item.user.fullName.toLowerCase().includes(cardSearch.toLowerCase()) ||
      item.card.cardNumber.includes(cardSearch) ||
      item.card.brand.toLowerCase().includes(cardSearch.toLowerCase())
  );

  const navigationItems = [
    { id: 'OVERVIEW', label: 'Telemetry & Vaults', icon: Activity },
    { id: 'USERS', label: 'User Governance', icon: Users },
    { id: 'CARDS', label: 'Virtual Card Issuing', icon: CreditCard },
    { id: 'PAYOUTS', label: 'Payouts & Remittance', icon: Send },
    { id: 'IDENTITY', label: 'eIDV & Liveness', icon: ShieldAlert },
    { id: 'RISK', label: 'Chargebacks & Risk', icon: AlertTriangle },
    { id: 'WEBHOOKS', label: 'Webhooks & Gateway', icon: Terminal },
  ];

  // PASSCODE LOCK SCREEN IF NOT AUTHENTICATED
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-mono">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-40 h-40 bg-[#F26522]/10 rounded-full blur-2xl"></div>
          <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl"></div>

          <div className="text-center space-y-3 mb-6 relative">
            <div className="inline-flex p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[#F26522]">
              <ShieldAlert className="w-8 h-8 animate-pulse" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase">
              MIKPAL HQ Terminal
            </h1>
            <p className="text-xs text-slate-400">
              Restricted Operational Portal. Master Key required.
            </p>
          </div>

          <form onSubmit={handleAuthenticate} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1.5">
                Passcode / Master Key
              </label>
              <input
                type="password"
                placeholder="Enter passcode (Default: 2026)"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] outline-none"
              />
              {passcodeError && (
                <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{passcodeError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-[#F26522] hover:bg-[#d95318] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#F26522]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Authenticate & Access HQ</span>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
            <span>Passcode: <code className="text-emerald-400 font-bold">2026</code></span>
            <button
              onClick={() => {
                setPasscode('2026');
                setIsAdminAuthenticated(true);
              }}
              className="text-[#F26522] hover:underline font-bold cursor-pointer"
            >
              Bypass for Demo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 font-sans flex flex-col lg:flex-row antialiased selection:bg-[#F26522] selection:text-white pb-16 lg:pb-0">
      
      {/* ================= DESKTOP & MOBILE SIDEBAR NAVIGATION ================= */}
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden lg:flex w-72 bg-slate-900/90 border-r border-slate-800/90 flex-col justify-between shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="p-5 space-y-6">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
              <span className="text-xs font-black tracking-widest text-emerald-400 uppercase block flex items-center gap-1">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                <span>HQ Command</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Master Infrastructure</span>
            </div>
          </div>

          {/* Environment Switcher */}
          <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-[11px] font-bold space-y-1">
            <div className="text-[10px] text-slate-500 uppercase px-2 py-0.5">Environment Mode</div>
            <div className="grid grid-cols-2 gap-1">
              <button
                onClick={() => setEnvMode('LIVE_PROD')}
                className={`py-1.5 rounded-xl transition-all text-center cursor-pointer ${
                  envMode === 'LIVE_PROD'
                    ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                PROD
              </button>
              <button
                onClick={() => setEnvMode('SANDBOX_SIM')}
                className={`py-1.5 rounded-xl transition-all text-center cursor-pointer ${
                  envMode === 'SANDBOX_SIM'
                    ? 'bg-[#F26522] text-white font-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                SANDBOX
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1 font-medium text-xs">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as any)}
                  className={`w-full px-3.5 py-3 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F26522] text-white font-extrabold shadow-lg shadow-[#F26522]/20'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90 text-white' : 'text-slate-600'}`} />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 space-y-3">
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
            <div className="text-[10px] text-slate-400 uppercase font-bold flex items-center gap-1">
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>System Health</span>
            </div>
            <div className="text-xs font-mono font-bold text-emerald-400">Korapay Rails: 99.98%</div>
            <div className="text-[10px] text-slate-500">Latency: 18ms • AWS US-East</div>
          </div>

          <button
            onClick={onExitAdmin}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>Exit Admin HQ</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top App Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Logo size="sm" />
          <div>
            <span className="text-xs font-black text-white uppercase block leading-tight">MIKPAL Admin HQ</span>
            <span className="text-[9px] text-emerald-400 font-mono">Live Control Terminal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEnvMode(envMode === 'LIVE_PROD' ? 'SANDBOX_SIM' : 'LIVE_PROD')}
            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
              envMode === 'LIVE_PROD' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-[#F26522]/20 text-[#F26522] border border-[#F26522]/30'
            }`}
          >
            {envMode === 'LIVE_PROD' ? 'PROD' : 'SANDBOX'}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-800 text-slate-200 rounded-xl border border-slate-700 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-6 space-y-6 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <Logo size="md" />
              <span className="font-bold text-sm text-white">HQ Navigation Menu</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 bg-slate-900 text-slate-400 hover:text-white rounded-full border border-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full p-3.5 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#F26522] text-white font-extrabold shadow-lg'
                      : 'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 text-sm">
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              );
            })}
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <button
              onClick={onExitAdmin}
              className="w-full py-3 rounded-2xl bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20 text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Exit Admin Portal</span>
            </button>
          </div>
        </div>
      )}

      {/* WEBHOOK TOAST NOTIFICATION */}
      {webhookToast && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 bg-emerald-500 text-slate-950 px-4 py-3 rounded-2xl font-mono text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{webhookToast}</span>
        </div>
      )}

      {/* ================= MAIN CONTENT WORKSPACE ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* ================= TAB 1: EXECUTIVE OVERVIEW ================= */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            
            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  <Activity className="w-6 h-6 text-[#F26522]" />
                  <span>Telemetry & Operational Treasury Vaults</span>
                </h1>
                <p className="text-xs text-slate-400">
                  Cross-border liquidity reserves, Korapay gateway status, and master audit trail.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-3.5 py-1.5 rounded-2xl border border-emerald-500/20 w-fit">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Active Liquidity: $18,240,900 USD</span>
              </div>
            </div>

            {/* Telemetry Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <span>Gross Volume 24H</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">$14,280,450.00</div>
                <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+18.4% vs previous cycle</span>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <span>Virtual Card Float</span>
                  <CreditCard className="w-4 h-4 text-[#F26522]" />
                </div>
                <div className="text-2xl font-black text-white font-mono">
                  ${masterPools.USD.issuingFloat.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <button
                  onClick={handleAddIssuingFloat}
                  className="text-[11px] text-[#F26522] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.3 h-3.3" />
                  <span>Inject Issuing Float</span>
                </button>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <span>Active Merchants</span>
                  <Users className="w-4 h-4 text-teal-400" />
                </div>
                <div className="text-2xl font-black text-white font-mono">84,290 Profiles</div>
                <div className="text-[11px] text-teal-400 font-bold">
                  GH, NG, KE, ZA Multi-Currency
                </div>
              </div>

              <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-3xl space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase">
                  <span>Disputes & Risk</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 font-mono">
                  {chargebacks.filter((c) => c.status === 'PENDING').length} Pending
                </div>
                <button
                  onClick={() => setActiveTab('RISK')}
                  className="text-[11px] text-amber-400 hover:underline font-bold cursor-pointer"
                >
                  Review Open Disputes →
                </button>
              </div>
            </div>

            {/* Master Liquidity Vaults Grid */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-400" />
                    <span>Master Regional Currency Liquidity Reserves</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time available float vs pending settlement across Korapay payment rails.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(masterPools).map(([curr, pool]: [string, any]) => (
                  <div key={curr} className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{pool.flag}</span>
                        <span>{curr} Treasury Pool</span>
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                        {curr}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Available Float:</span>
                        <span className="font-bold text-emerald-400">
                          {pool.available.toLocaleString()} {curr}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">Pending Settlement:</span>
                        <span className="font-bold text-amber-400">
                          {pool.pendingSettlement.toLocaleString()} {curr}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Log Feed */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#F26522]" />
                  <span>Master Operational Audit Trail</span>
                </h3>
                <span className="text-xs text-slate-400 font-mono">{auditLogs.length} events logged</span>
              </div>

              <div className="space-y-2 font-mono text-xs max-h-80 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-950 p-3 rounded-xl border border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-slate-300">
                        <span className="text-emerald-400 font-bold">[{log.category}]</span>
                        <span className="font-bold text-white">{log.action}</span>
                        <span className="text-[10px] text-slate-500">by {log.actor}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{log.details}</p>
                    </div>
                    <div className="text-left sm:text-right text-[10px] text-slate-500 shrink-0">
                      <div>{log.timestamp}</div>
                      <div>IP: {log.ipAddress}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: USER GOVERNANCE ================= */}
        {activeTab === 'USERS' && (
          <div className="space-y-6">
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-3xl border border-slate-800">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search user by name, email, username..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none w-full sm:w-64"
                />
              </div>

              {/* Country Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {(['GH', 'NG', 'KE', 'ZA'] as CountryCode[]).map((cCode) => (
                  <button
                    key={cCode}
                    onClick={() => setSelectedUserCountry(cCode)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedUserCountry === cCode
                        ? 'bg-[#F26522] text-white font-black'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {COUNTRIES[cCode].flag} {cCode}
                  </button>
                ))}
              </div>
            </div>

            {/* User List Cards for Responsive Display */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-400 uppercase tracking-wider">
                User Profiles ({selectedUserCountry})
              </div>

              <div className="divide-y divide-slate-800/80">
                {Object.values(userProfiles)
                  .filter((u: UserProfile) => u.country === selectedUserCountry)
                  .filter(
                    (u: UserProfile) =>
                      u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                      u.email.toLowerCase().includes(userSearchQuery.toLowerCase())
                  )
                  .map((profile: UserProfile) => {
                    const countryInfo = COUNTRIES[profile.country];
                    const localWallet = profile.wallets[countryInfo.currency];
                    const usdWallet = profile.wallets['USD'];

                    return (
                      <div
                        key={profile.id}
                        className="p-4 hover:bg-slate-800/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={profile.avatar}
                            alt={profile.fullName}
                            className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{profile.fullName}</span>
                              <span className="text-xs text-slate-400">@{profile.username}</span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                  profile.kycStatus === 'VERIFIED'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                }`}
                              >
                                {profile.kycStatus}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-0.5">
                              <span>{profile.email}</span>
                              <span>•</span>
                              <span>{profile.phone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Wallet Balances Overview */}
                        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 block uppercase">Local Balance</span>
                            <span className="font-bold text-white">
                              {localWallet?.currencySymbol || ''}{localWallet?.available.toLocaleString() || '0'} {countryInfo.currency}
                            </span>
                          </div>

                          <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                            <span className="text-[10px] text-slate-400 block uppercase">USD Global Balance</span>
                            <span className="font-bold text-emerald-400">
                              ${usdWallet?.available.toLocaleString() || '0.00'} USD
                            </span>
                          </div>

                          <button
                            onClick={() => setSelectedUserModal(profile)}
                            className="px-3.5 py-2 rounded-xl bg-[#F26522] hover:bg-[#d95318] text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Manage Profile</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* USER MANAGEMENT MODAL */}
            {selectedUserModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={selectedUserModal.avatar}
                        alt={selectedUserModal.fullName}
                        className="w-12 h-12 rounded-full border border-slate-700 object-cover"
                      />
                      <div>
                        <h3 className="text-lg font-bold text-white">{selectedUserModal.fullName}</h3>
                        <p className="text-xs text-slate-400">{selectedUserModal.email} • ID: {selectedUserModal.id}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedUserModal(null)}
                      className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-950 border border-slate-800 cursor-pointer"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>

                  {/* KYC Status Override Bar */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase">Compliance eIDV Override</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {(['VERIFIED', 'PENDING', 'UNVERIFIED'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleOverrideUserKyc(st)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            selectedUserModal.kycStatus === st
                              ? 'bg-emerald-500 text-slate-950 font-extrabold'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          Set {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ledger Balance Injection Form */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <span className="text-xs font-bold text-emerald-400 uppercase block">
                      Admin Treasury Ledger Injection
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Action</label>
                        <select
                          value={ledgerAction}
                          onChange={(e) => setLedgerAmountAction(e.target.value as any)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                        >
                          <option value="CREDIT">CREDIT (+)</option>
                          <option value="DEBIT">DEBIT (-)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Currency</label>
                        <select
                          value={ledgerCurrency}
                          onChange={(e) => setLedgerCurrency(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                        >
                          <option value="USD">USD ($)</option>
                          <option value="GHS">GHS (₵)</option>
                          <option value="NGN">NGN (₦)</option>
                          <option value="KES">KES (KSh)</option>
                          <option value="ZAR">ZAR (R)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Amount</label>
                        <input
                          type="number"
                          value={ledgerAmount}
                          onChange={(e) => setLedgerAmount(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Narration</label>
                      <input
                        type="text"
                        value={ledgerNarration}
                        onChange={(e) => setLedgerNarration(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      />
                    </div>

                    <button
                      onClick={handleInjectUserLedger}
                      className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider cursor-pointer transition-all"
                    >
                      Execute Ledger Adjustment
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= TAB 3: VIRTUAL CARD ISSUING ================= */}
        {activeTab === 'CARDS' && (
          <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#F26522]" />
                  <span>Master Card Issuing Pool ($245,850.00 USD Float)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visa & Mastercard BIN routing pool managed via certified issuing rails.
                </p>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Filter cards by name, PAN, brand..."
                  value={cardSearch}
                  onChange={(e) => setCardSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none w-full md:w-64"
                />
              </div>
            </div>

            {/* Issued Cards List */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>All System Virtual Cards ({filteredCards.length})</span>
                <span className="text-[10px] text-emerald-400 font-mono">Master BIN Switch: Active</span>
              </div>

              <div className="divide-y divide-slate-800">
                {filteredCards.map(({ user, card }) => {
                  const isUnmasked = unmaskedCardId === card.id;

                  return (
                    <div key={card.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/50 transition-all">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{card.cardHolderName}</span>
                          <span className="text-xs text-slate-400">({user.email})</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            card.brand === 'VISA' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {card.brand}
                          </span>
                        </div>

                        <div className="font-mono text-xs text-slate-300 flex flex-wrap items-center gap-3">
                          <span>
                            PAN:{' '}
                            <strong className="text-emerald-400 font-extrabold">
                              {isUnmasked ? card.cardNumber : `•••• •••• •••• ${card.cardNumber.slice(-4)}`}
                            </strong>
                          </span>
                          <span>EXP: {card.expiryMonth}/{card.expiryYear}</span>
                          <span>CVV: <strong className="text-emerald-400">{isUnmasked ? card.cvv : '•••'}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 font-mono text-xs">
                        <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                          <span className="text-[10px] text-slate-400 block uppercase">Card Balance</span>
                          <span className="font-bold text-emerald-400">${card.balance.toFixed(2)} USD</span>
                        </div>

                        <button
                          onClick={() => setUnmaskedCardId(isUnmasked ? null : card.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          {isUnmasked ? <EyeOff className="w-3.5 h-3.5 text-rose-400" /> : <Eye className="w-3.5 h-3.5 text-teal-400" />}
                          <span>{isUnmasked ? 'Mask' : 'Unmask'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 4: PAYOUTS & REMITTANCE ================= */}
        {activeTab === 'PAYOUTS' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Bulk Payout Dispatcher */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-[#F26522]" />
                  <span>Bulk Remittance Dispatcher (Korapay API Batch Engine)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Simulate executing batch payouts across GHS, NGN, KES, and ZAR payment rails.
                </p>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    Batch Recipients JSON (Max 50 per call)
                  </label>
                  <textarea
                    rows={7}
                    value={bulkRecipientText}
                    onChange={(e) => setBulkPayoutText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-emerald-400 outline-none"
                  />
                </div>

                <button
                  onClick={() => {
                    setBulkPayoutStatus('BATCH_DISPATCH_SUCCESS_200');
                    addAuditLog('DISBURSEMENT', 'Bulk Payout Batch Dispatched', 'Dispatched batch payouts to Korapay API Rail.');
                  }}
                  className="w-full py-3 rounded-xl bg-[#F26522] hover:bg-[#d95318] text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-lg transition-all"
                >
                  Dispatch Bulk Payout Batch
                </button>

                {bulkPayoutStatus && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono rounded-xl">
                    ✓ Status: {bulkPayoutStatus} - All 2 payouts accepted by clearing gateway.
                  </div>
                )}
              </div>

              {/* Network Availability & Account Resolve Tool */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-teal-400" />
                  <span>Destination Rail Availability Inspector</span>
                </h3>

                <div className="space-y-2 font-mono text-xs">
                  {[
                    { rail: 'Moniepoint NGN NUBAN', country: '🇳🇬 Nigeria', status: 'AVAILABLE', speed: 'Instant (< 2s)' },
                    { rail: 'Safaricom M-Pesa KES STK', country: '🇰🇪 Kenya', status: 'AVAILABLE', speed: 'Instant' },
                    { rail: 'MTN MoMo GHS Payout', country: '🇬🇭 Ghana', status: 'AVAILABLE', speed: 'Instant' },
                    { rail: 'ABSA ZAR Instant EFT', country: '🇿🇦 South Africa', status: 'AVAILABLE', speed: 'Same Day' },
                    { rail: 'Bank of the Lakes USD Routing', country: '🇺🇸 USA', status: 'AVAILABLE', speed: 'FEDWIRE / ACH' },
                  ].map((item, idx) => (
                    <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white">{item.rail}</div>
                        <div className="text-[10px] text-slate-400">{item.country} • {item.speed}</div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 5: IDENTITY & LIVENESS ================= */}
        {activeTab === 'IDENTITY' && (
          <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <span>Regional eIDV Identity & Liveness Inspection Console</span>
              </h3>
              <p className="text-xs text-slate-400">
                Perform live government database lookups for BVN, NIN, CAC, SAID, SSNIT, and Liveness video checks.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Target Country</label>
                  <select
                    value={idCountry}
                    onChange={(e) => setIdCountry(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                  >
                    <option value="NG">🇳🇬 Nigeria</option>
                    <option value="GH">🇬🇭 Ghana</option>
                    <option value="KE">🇰🇪 Kenya</option>
                    <option value="ZA">🇿🇦 South Africa</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ID Type</label>
                  <select
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                  >
                    <option value="bvn">BVN (Bank Verification Number)</option>
                    <option value="nin">NIN / vNIN</option>
                    <option value="cac">CAC Certificate of Incorporation</option>
                    <option value="said">South Africa SAID Number</option>
                    <option value="ssnit">Ghana SSNIT / Ghana Card</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">ID / Document Code</label>
                  <input
                    type="text"
                    value={idNumberInput}
                    onChange={(e) => setIdNumberInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handlePerformIdentityLookup}
                disabled={idLookupLoading}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {idLookupLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                <span>Execute eIDV Verification</span>
              </button>

              {idLookupResult && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                    <span>✓ {idLookupResult.message}</span>
                    <span>Ref: {idLookupResult.data?.reference}</span>
                  </div>
                  <pre className="font-mono text-xs text-slate-300 max-h-60 overflow-y-auto bg-slate-900 p-3 rounded-xl">
                    {JSON.stringify(idLookupResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ================= TAB 6: CHARGEBACKS & RISK ================= */}
        {activeTab === 'RISK' && (
          <div className="space-y-6">
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Dispute Chargebacks & Refund Management</span>
              </h3>
              <p className="text-xs text-slate-400">
                Review payment network chargeback notifications, upload rebuttal evidence, or process reversals.
              </p>

              <div className="divide-y divide-slate-800/80 font-mono text-xs">
                {chargebacks.map((chg) => (
                  <div key={chg.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{chg.customerName}</span>
                        <span className="text-slate-400">({chg.customerEmail})</span>
                        <span className="font-extrabold text-amber-400">
                          ${chg.amount.toFixed(2)} {chg.currency}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{chg.reason}</p>
                      <div className="text-[10px] text-slate-500">
                        Dispute Ref: {chg.reference} • Deadline: {chg.deadline}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        chg.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                        chg.status === 'ACCEPTED' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {chg.status}
                      </span>

                      {chg.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleUpdateChargeback(chg.id, 'ACCEPTED')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleUpdateChargeback(chg.id, 'DECLINED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Decline w/ Evidence
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 7: WEBHOOKS & API GATEWAY ================= */}
        {activeTab === 'WEBHOOKS' && (
          <div className="space-y-6">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Webhook Event Dispatcher */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-emerald-400" />
                  <span>Webhook Event Trigger Simulator</span>
                </h3>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Select Event Type</label>
                  <select
                    value={simEvent}
                    onChange={(e) => setSimEvent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none"
                  >
                    <option value="charge.success">charge.success (Pay-in Settled)</option>
                    <option value="payout.success">payout.success (Disbursement Cleared)</option>
                    <option value="direct_debit.auth">direct_debit.auth (NIBSS Mandate Active)</option>
                    <option value="issuing.card_funding.success">issuing.card_funding.success</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Transaction Reference</label>
                  <input
                    type="text"
                    value={simPayloadRef}
                    onChange={(e) => setSimPayloadRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white outline-none"
                  />
                </div>

                <button
                  onClick={handleDispatchWebhook}
                  className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs uppercase tracking-wider cursor-pointer transition-all"
                >
                  Fire Webhook to Merchant Endpoint
                </button>
              </div>

              {/* IP Whitelisting Manager */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-teal-400" />
                  <span>Payout Server IP Whitelisting</span>
                </h3>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter Server IPv4 address..."
                    value={newIpInput}
                    onChange={(e) => setNewIpInput(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white outline-none flex-1"
                  />
                  <button
                    onClick={handleAddIp}
                    className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Whitelist IP
                  </button>
                </div>

                <div className="space-y-1 font-mono text-xs">
                  {whitelistedIps.map((ip, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between text-slate-300">
                      <span>{ip}</span>
                      <span className="text-[10px] text-emerald-400 font-bold">Trusted Server</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Webhook Delivery Log Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 font-bold text-xs text-slate-400 uppercase tracking-wider">
                Recent Webhook Notifications Log
              </div>

              <div className="divide-y divide-slate-800 font-mono text-xs">
                {webhookLogs.map((log) => (
                  <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">{log.event}</span>
                        <span className="text-slate-400">[{log.reference}]</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{log.url}</div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className="text-emerald-400 font-bold">{log.httpStatus} OK</span>
                        <div className="text-[10px] text-slate-500">{log.timestamp}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FIXED MOBILE BOTTOM DOCK BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around">
        {[
          { id: 'OVERVIEW', label: 'Vaults', icon: Activity },
          { id: 'USERS', label: 'Users', icon: Users },
          { id: 'CARDS', label: 'Cards', icon: CreditCard },
          { id: 'RISK', label: 'Disputes', icon: AlertTriangle },
          { id: 'WEBHOOKS', label: 'Webhooks', icon: Terminal },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl text-[10px] font-bold cursor-pointer transition-all ${
                isActive ? 'text-[#F26522]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
};
