import React, { useState, useEffect, useCallback } from 'react';
import { CountryCode, UserProfile, RecipientProfile, BankAccount, Transaction } from './types';
import { COUNTRIES, BANK_DESTINATIONS, BankDestination } from './data/mockData';
import { api } from './api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { SendMoneyView } from './components/SendMoneyView';
import { VirtualCardsView } from './components/VirtualCardsView';
import { KycVaultView } from './components/KycVaultView';
import { TransactionsView } from './components/TransactionsView';
import { ProfileView } from './components/ProfileView';
import { SideDrawer } from './components/SideDrawer';
import { BottomNav } from './components/BottomNav';
import { OnboardingModal } from './components/OnboardingModal';
import { FxCalculatorModal } from './components/FxCalculatorModal';
import { DepositModal } from './components/DepositModal';
import { DepositCallback } from './components/DepositCallback';
import { LandingPage } from './components/LandingPage';

function mapApiToProfile(dashboardData: any): UserProfile {
  const u = dashboardData.user;
  const countryMap: Record<string, CountryCode> = { Ghana:'GH',Nigeria:'NG',Kenya:'KE','South Africa':'ZA',Uganda:'UG',Tanzania:'TZ',Rwanda:'RW','United States':'US','United Kingdom':'GB',Canada:'CA' };
  const country = countryMap[u.country] || 'GH';
  const countryInfo = COUNTRIES[country];
  const wallets: Record<string, any> = {};
  (dashboardData.wallets || []).forEach((w: any) => {
    const meta = Object.values(COUNTRIES).find((c: any) => c.currency === w.currency);
    wallets[w.currency] = { currency: w.currency, currencySymbol: meta?.currencySymbol || '$', available: w.balance || 0, pending: w.locked_balance || 0, flag: meta?.flag || '🌐' };
  });
  const transactions: Transaction[] = (dashboardData.recent_transactions || []).map((t: any) => {
    const typeMap: Record<string, Transaction['type']> = { deposit:'DEPOSIT', transfer:'BANK_TRANSFER', payout:'BANK_TRANSFER', p2p_send:'P2P_SEND', p2p_receive:'P2P_RECEIVE', fee:'FEE' };
    return { id: t.id, reference: t.reference || '', title: t.description || t.type, type: typeMap[t.type] || 'CARD_PURCHASE', amount: t.amount, currency: t.currency, currencySymbol: countryInfo?.currencySymbol || '$', fee: t.fee || 0, status: t.status === 'success' ? 'SUCCESS' : t.status === 'pending' ? 'PROCESSING' : 'FAILED', date: t.created_at || 'Just now' };
  });
  return { id: u.id, username: u.username || '', email: u.email, fullName: u.full_name || u.display_name || '', country, phone: u.phone || '', avatar: u.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80', kycStatus: u.kyc_verified ? 'VERIFIED' : 'UNVERIFIED', kycDocuments: u.kyc_verified ? [{ docType:'Verified', docNumber:'', verifiedAt:'', status:'VERIFIED' }] : [], wallets, bankAccounts: [], cards: [], transactions, securityPin: '' };
}

export default function App() {
  const [currentCountry, setCurrentCountry] = useState<CountryCode>('GH');
  const [activeTab, setActiveTab] = useState<'OVERVIEW'|'SEND'|'CARDS'|'KYC'|'TRANSACTIONS'|'PROFILE'>('OVERVIEW');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authMode, setAuthMode] = useState<'SIGN_UP'|'LOGIN'>('SIGN_UP');
  const [showFxCalc, setShowFxCalc] = useState(false);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showSideDrawer, setShowSideDrawer] = useState(false);
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [depositCallbackRef, setDepositCallbackRef] = useState<string | null>(null);

  useEffect(() => {
    const token = api.getToken();
    const urlParams = new URLSearchParams(window.location.search);
    const depositRef = urlParams.get('reference');
    if (depositRef) { setDepositCallbackRef(depositRef); window.history.replaceState({}, document.title, window.location.pathname); }
    if (token) loadDashboard(); else setIsLoading(false);
  }, []);

  const loadDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      const profile = mapApiToProfile(data);
      setActiveUser(profile); setCurrentCountry(profile.country); setIsAuthenticated(true);
    } catch (err: any) {
      if (err.message.includes('Unauthorized') || err.message.includes('Invalid')) { api.clearToken(); setIsAuthenticated(false); }
    } finally { setIsLoading(false); }
  }, []);

  const handleSignup = async (email: string, password: string, fullName: string, username?: string) => {
    const data = await api.signup(email, password, fullName, username);
    api.setToken(data.token); await loadDashboard(); setShowOnboarding(false);
  };
  const handleSignin = async (email: string, password: string) => {
    const data = await api.signin(email, password);
    api.setToken(data.token); await loadDashboard(); setShowOnboarding(false);
  };
  const handleSignOut = async () => {
    try { await api.signout(); } catch {}
    api.clearToken(); setIsAuthenticated(false); setActiveUser(null); setShowOnboarding(false); setShowSideDrawer(false);
  };
  const handleDepositFunds = async (amount: number, currency: string, method: string) => {
    try {
      const data = await api.initiateDeposit(amount, currency, method);
      if (data.paymentUrl) window.location.href = data.paymentUrl;
      else if (data.reference) setDepositCallbackRef(data.reference);
      else alert('Deposit initiated: ' + JSON.stringify(data));
    } catch (err: any) { alert('Deposit failed: ' + err.message); }
  };
  const handleDepositCallbackClose = () => { setDepositCallbackRef(null); loadDashboard(); };
  const handleExecuteP2PTransfer = async (recipient: RecipientProfile, sendAmount: number, debitCurrency: string) => {
    try {
      const pin = prompt('Enter your 4-digit PIN:'); if (!pin) return;
      await api.p2pTransfer({ pin, recipient_username: recipient.username, amount: sendAmount, currency: debitCurrency });
      alert('Transfer successful!'); await loadDashboard();
    } catch (err: any) { alert('Transfer failed: ' + err.message); }
  };
  const handleExecuteBankPayout = async (debitSource: string, sendAmount: number, debitCurrency: string, destBank: BankDestination, accountNumber: string, accountName: string) => {
    try {
      const pin = prompt('Enter your 4-digit PIN:'); if (!pin) return;
      const channel = destBank.type === 'MOBILE_MONEY' ? 'momo' : 'ach';
      await api.payout({ pin, channel, amount: sendAmount, currency: debitCurrency, recipient_name: accountName, recipient_account: accountNumber, recipient_bank: destBank.code });
      alert('Payout successful!'); await loadDashboard();
    } catch (err: any) { alert('Payout failed: ' + err.message); }
  };
  const handleUpdateKycDoc = async (docName: string, docNum: string) => {
    try { await api.submitKyc(docName, docNum); alert('KYC successful!'); await loadDashboard(); }
    catch (err: any) { alert('KYC failed: ' + err.message); }
  };
  const handleUpdateUserProfile = async (updatedUser: UserProfile) => {
    try { await api.updateProfile({ display_name: updatedUser.fullName, phone: updatedUser.phone, country: updatedUser.country }); await loadDashboard(); }
    catch (err: any) { alert('Update failed: ' + err.message); }
  };
  const handleActivateUsdAccount = async () => {
    try { await api.createVirtualAccount(); alert('Virtual account created!'); await loadDashboard(); }
    catch (err: any) { alert('Failed: ' + err.message); }
  };
  const handleOrderCard = async (brand: 'VISA'|'MASTERCARD', cardHolderName: string) => {
    try {
      const last4 = Math.floor(1000 + Math.random() * 9000).toString();
      await api.addCard({ card_type: brand.toLowerCase(), last4, cardholder_name: cardHolderName });
      alert('Card ordered!'); await loadDashboard();
    } catch (err: any) { alert('Failed: ' + err.message); }
  };
  const handleDeleteCard = async (id: string) => { try { await api.removeCard(id); await loadDashboard(); } catch (err: any) { alert('Failed: ' + err.message); } };
  const handleToggleFreezeCard = (id: string) => {};
  const handleTopUpCard = (id: string, amount: number) => {};
  const handleUpdateLimit = (id: string, limit: number) => {};
  const handleSelectCountry = (code: CountryCode) => setCurrentCountry(code);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-400">Loading MIKPAL...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage onGetStarted={() => { setAuthMode('SIGN_UP'); setShowOnboarding(true); }} />
        {showOnboarding && (
          <OnboardingModal
            mode={authMode}
            onClose={() => setShowOnboarding(false)}
            onSignup={handleSignup}
            onSignin={handleSignin}
          />
        )}
      </>
    );
  }

  if (!activeUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-slate-400 mb-4">Failed to load profile</p>
          <button onClick={handleSignOut} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold">Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <Sidebar
        user={activeUser}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onSignOut={handleSignOut}
        onOpenDrawer={() => setShowSideDrawer(true)}
      />
      <SideDrawer
        user={activeUser}
        isOpen={showSideDrawer}
        onClose={() => setShowSideDrawer(false)}
        onSignOut={handleSignOut}
      />
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        <Header
          user={activeUser}
          onOpenDrawer={() => setShowSideDrawer(true)}
          onOpenFxCalc={() => setShowFxCalc(true)}
          onOpenDeposit={() => setShowDepositModal(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 max-w-6xl mx-auto w-full">
          {activeTab === 'OVERVIEW' && (
            <DashboardView
              user={activeUser}
              onNavigate={(tab) => setActiveTab(tab)}
              onDeposit={() => setShowDepositModal(true)}
              onSendMoney={() => setActiveTab('SEND')}
            />
          )}
          {activeTab === 'SEND' && (
            <SendMoneyView
              user={activeUser}
              onExecuteP2PTransfer={handleExecuteP2PTransfer}
              onExecuteBankPayout={handleExecuteBankPayout}
              bankDestinations={BANK_DESTINATIONS}
            />
          )}
          {activeTab === 'CARDS' && (
            <VirtualCardsView
              user={activeUser}
              onOrderCard={handleOrderCard}
              onToggleFreezeCard={handleToggleFreezeCard}
              onTopUpCard={handleTopUpCard}
              onUpdateLimit={handleUpdateLimit}
              onDeleteCard={handleDeleteCard}
            />
          )}
          {activeTab === 'KYC' && (
            <KycVaultView user={activeUser} onUpdateKycDoc={handleUpdateKycDoc} />
          )}
          {activeTab === 'TRANSACTIONS' && (
            <TransactionsView user={activeUser} />
          )}
          {activeTab === 'PROFILE' && (
            <ProfileView user={activeUser} onUpdateProfile={handleUpdateUserProfile} onSignOut={handleSignOut} />
          )}
        </main>
      </div>
      <BottomNav activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab)} onDeposit={() => setShowDepositModal(true)} />
      {showFxCalc && <FxCalculatorModal onClose={() => setShowFxCalc(false)} />}
      {showDepositModal && (
        <DepositModal
          user={activeUser}
          onClose={() => setShowDepositModal(false)}
          onDeposit={handleDepositFunds}
        />
      )}
      {depositCallbackRef && (
        <DepositCallback reference={depositCallbackRef} onClose={handleDepositCallbackClose} />
      )}
    </div>
  );
}
