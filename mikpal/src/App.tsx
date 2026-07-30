import React, { useState, useEffect } from 'react';
import { CountryCode, UserProfile, VirtualCard, BankAccount, Transaction } from './types';
import { MOCK_USER_PROFILES, COUNTRIES, FX_RATES_TO_USD, BankDestination } from './data/mockData';
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
import { LandingPage } from './components/LandingPage';
import { AdminPortal } from './components/AdminPortal';
import { Shield, Lock, Globe, Building2 } from 'lucide-react';
import * as api from './lib/mikpalApi';

export default function App() {
  const [currentCountry, setCurrentCountry] = useState<CountryCode>('GH');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'SEND' | 'CARDS' | 'KYC' | 'TRANSACTIONS' | 'PROFILE'>('OVERVIEW');

  // Real session check — replaces the old localStorage flag that anyone could flip
  // in devtools. isAuthenticated now only ever reflects a verified httpOnly cookie.
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    api.getMe().then(async (me) => {
      if (me) {
        try {
          const { balances } = await api.getServerBalance();
          const countryInfo = COUNTRIES[(me.user.country as CountryCode) || 'GH'] || COUNTRIES.GH;
          const realProfile: UserProfile = {
            id: me.user.email,
            username: me.user.username,
            email: me.user.email,
            fullName: me.user.fullName || 'MIKPAL Member',
            country: (me.user.country as CountryCode) || 'GH',
            phone: '',
            avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80',
            kycStatus: 'UNVERIFIED',
            kycDocuments: [],
            wallets: api.buildWalletsFromBalances(balances, countryInfo) as UserProfile['wallets'],
            bankAccounts: [],
            cards: [],
            transactions: [],
            securityPin: '',
          };
          setUserProfiles((prev) => ({ ...prev, [realProfile.country]: realProfile }));
          setCurrentCountry(realProfile.country);
          setIsAuthenticated(true);
        } catch {
          setIsAuthenticated(false);
        }
      }
      setIsCheckingSession(false);
    });
  }, []);

  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'SIGN_UP' | 'LOGIN'>('SIGN_UP');
  const [showAdminPortal, setShowAdminPortal] = useState<boolean>(() => {
    return window.location.hash === '#admin' || window.location.search.includes('admin=true');
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin' || window.location.search.includes('admin=true')) {
        setShowAdminPortal(true);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [showFxCalc, setShowFxCalc] = useState<boolean>(false);
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [showSideDrawer, setShowSideDrawer] = useState<boolean>(false);
  const [depositStatus, setDepositStatus] = useState<'idle' | 'pending' | 'success' | 'failed'>('idle');

  // User Profiles State with local storage fallback
  const [userProfiles, setUserProfiles] = useState<Record<CountryCode, UserProfile>>(() => {
    const saved = localStorage.getItem('mikpal_profiles');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved profiles:', e);
      }
    }
    return MOCK_USER_PROFILES;
  });

  useEffect(() => {
    localStorage.setItem('mikpal_profiles', JSON.stringify(userProfiles));
  }, [userProfiles]);

  const activeUser = userProfiles[currentCountry] || userProfiles['GH'];

  // Switch country profile
  const handleSelectCountry = (code: CountryCode) => {
    setCurrentCountry(code);
  };

  // 1. Activate USD Global Account
  const handleActivateUsdAccount = () => {
    const countryInfo = COUNTRIES[activeUser.country];
    const feeInLocal = 0.50 * (FX_RATES_TO_USD[countryInfo.currency] || 1);

    const updatedUser = { ...activeUser };
    const localWallet = updatedUser.wallets[countryInfo.currency];

    if (localWallet && localWallet.available >= feeInLocal) {
      localWallet.available -= feeInLocal;
    }

    const newUsdAccount: BankAccount = {
      id: `vba_usd_expanded_${Date.now()}`,
      type: 'USD_GLOBAL',
      accountName: activeUser.fullName,
      accountNumber: `579${Math.floor(100000000 + Math.random() * 900000000)}`,
      bankName: 'US Partner Bank',
      routingNumber: '021001208',
      swiftCode: 'PNBKUS33',
      currency: 'USD',
      status: 'ACTIVE',
      isDefault: false,
      detailsBanner: 'USD Virtual Banking expansion activated via US banking routing.',
    };

    updatedUser.bankAccounts.push(newUsdAccount);

    // Also ensure USD Wallet exists
    if (!updatedUser.wallets['USD']) {
      updatedUser.wallets['USD'] = {
        currency: 'USD',
        currencySymbol: '$',
        available: 0,
        pending: 0,
        flag: '🇺🇸',
      };
    }

    const newTxn: Transaction = {
      id: `txn_usd_act_${Date.now()}`,
      reference: `MP-USD-EXP-${Math.floor(100000 + Math.random() * 900000)}`,
      title: 'USD Global Account Activation Fee',
      type: 'USD_ACTIVATION',
      amount: feeInLocal,
      currency: countryInfo.currency,
      currencySymbol: countryInfo.currencySymbol,
      fee: 0,
      status: 'SUCCESS',
      date: 'Just now',
    };

    updatedUser.transactions.unshift(newTxn);

    setUserProfiles((prev) => ({
      ...prev,
      [activeUser.country]: updatedUser,
    }));
  };

  // 2. Deposit Funds — real Korapay charge, confirmed server-side via webhook, balance read from D1
  const handleDepositFunds = async (amount: number, currency: string, method: string) => {
    if (isDemoMode) {
      alert('Demo accounts are a UI sandbox and are not connected to the real backend. Sign up for a real account to deposit funds.');
      return;
    }
    try {
      setDepositStatus('pending');

      const intent = await api.initiateDeposit(amount, currency);

      await api.openKorapayCheckout({
        publicKey: intent.publicKey,
        reference: intent.reference,
        amount: intent.amount,
        currency: intent.currency,
        customerEmail: activeUser.email,
        customerName: activeUser.fullName,
      });

      // The widget closing doesn't mean success — only the webhook does.
      const finalStatus = await api.waitForDepositConfirmation(intent.reference);

      if (finalStatus !== 'SUCCESS') {
        setDepositStatus(finalStatus === 'FAILED' ? 'failed' : 'idle');
        if (finalStatus === 'PENDING') {
          alert("We haven't received confirmation yet. Your balance will update automatically once the payment clears.");
        }
        return;
      }

      const { balances } = await api.getServerBalance();
      const updatedUser = { ...activeUser };
      for (const b of balances) {
        updatedUser.wallets[b.currency] = {
          ...(updatedUser.wallets[b.currency] || {
            currency: b.currency,
            currencySymbol: COUNTRIES[activeUser.country].currencySymbol,
            pending: 0,
            flag: COUNTRIES[activeUser.country].flag,
          }),
          available: b.amount,
        };
      }

      const newTxn: Transaction = {
        id: `txn_dep_${Date.now()}`,
        reference: intent.reference,
        title: `Deposit via ${method === 'momo' ? 'Mobile Money' : 'Card / Bank Transfer'}`,
        type: 'DEPOSIT',
        amount,
        currency,
        currencySymbol: updatedUser.wallets[currency]?.currencySymbol || COUNTRIES[activeUser.country].currencySymbol,
        fee: 0,
        status: 'SUCCESS',
        date: 'Just now',
      };
      updatedUser.transactions.unshift(newTxn);

      setUserProfiles((prev) => ({ ...prev, [activeUser.country]: updatedUser }));
      setDepositStatus('success');
    } catch (err) {
      console.error('[DEPOSIT ERROR]', err);
      setDepositStatus('failed');
      alert(err instanceof Error ? err.message : 'Deposit failed. Please try again.');
    }
  };

  // 3. Execute Universal P2P Transfer — recipient resolved server-side, real ledger movement
  const handleExecuteP2PTransfer = async (
    recipientIdentifier: string,
    sendAmount: number,
    currency: string,
    pinToken: string
  ): Promise<boolean> => {
    if (isDemoMode) {
      alert('Demo accounts are a UI sandbox and are not connected to the real backend.');
      return false;
    }
    try {
      const result = await api.sendP2PTransfer(recipientIdentifier, sendAmount, currency, pinToken);

      const { balances } = await api.getServerBalance();
      const updatedUser = { ...activeUser };
      for (const b of balances) {
        updatedUser.wallets[b.currency] = {
          ...(updatedUser.wallets[b.currency] || {
            currency: b.currency,
            currencySymbol: COUNTRIES[activeUser.country].currencySymbol,
            pending: 0,
            flag: COUNTRIES[activeUser.country].flag,
          }),
          available: b.amount,
        };
      }

      const senderTxn: Transaction = {
        id: `txn_p2p_${Date.now()}`,
        reference: result.reference,
        title: `P2P Transfer to ${result.recipient?.fullName || recipientIdentifier}`,
        subtitle: `Internal MIKPAL P2P`,
        type: 'P2P_SEND',
        amount: sendAmount,
        currency,
        currencySymbol: updatedUser.wallets[currency]?.currencySymbol || '$',
        fee: 0,
        status: 'SUCCESS',
        date: 'Just now',
        recipientUsername: `@${result.recipient?.username || recipientIdentifier}`,
      };
      updatedUser.transactions.unshift(senderTxn);

      setUserProfiles((prev) => ({ ...prev, [activeUser.country]: updatedUser }));
      return true;
    } catch (err) {
      console.error('[P2P TRANSFER ERROR]', err);
      alert(err instanceof Error ? err.message : 'Transfer failed. Please try again.');
      return false;
    }
  };

  // 4. Execute Bank / Mobile Money External Payout — real Korapay disbursement, PIN-gated
  const handleExecuteBankPayout = async (
    sendAmount: number,
    currency: string,
    destBank: BankDestination,
    accountNumber: string,
    accountName: string,
    pinToken: string
  ): Promise<boolean> => {
    if (isDemoMode) {
      alert('Demo accounts are a UI sandbox and are not connected to the real backend.');
      return false;
    }
    try {
      const result = await api.initiatePayout({
        amount: sendAmount,
        currency,
        customerName: accountName,
        pinToken,
        destination:
          destBank.type === 'MOBILE_MONEY'
            ? { type: 'mobile_money', narration: `MIKPAL payout to ${destBank.name}`, mobile_money: { operator: destBank.code, mobile_number: accountNumber } }
            : { type: 'bank_account', narration: `MIKPAL payout to ${destBank.name}`, bank_account: { bank: destBank.code, account: accountNumber } },
      });

      const finalStatus = await api.waitForPayoutConfirmation(result.reference);

      const { balances } = await api.getServerBalance();
      const updatedUser = { ...activeUser };
      for (const b of balances) {
        updatedUser.wallets[b.currency] = {
          ...(updatedUser.wallets[b.currency] || {
            currency: b.currency,
            currencySymbol: COUNTRIES[activeUser.country].currencySymbol,
            pending: 0,
            flag: COUNTRIES[activeUser.country].flag,
          }),
          available: b.amount,
        };
      }

      const newTxn: Transaction = {
        id: `txn_payout_${Date.now()}`,
        reference: result.reference,
        title: `Bank Transfer to ${destBank.name}`,
        subtitle: `${accountName} (${accountNumber})`,
        type: 'BANK_TRANSFER',
        amount: sendAmount,
        currency,
        currencySymbol: updatedUser.wallets[currency]?.currencySymbol || '$',
        fee: 0,
        status: finalStatus === 'SUCCESS' ? 'SUCCESS' : finalStatus === 'FAILED' ? 'FAILED' : 'PROCESSING',
        date: 'Just now',
        bankName: destBank.name,
      };
      updatedUser.transactions.unshift(newTxn);
      setUserProfiles((prev) => ({ ...prev, [activeUser.country]: updatedUser }));

      if (finalStatus === 'FAILED') {
        alert('The payout failed and your balance has been refunded.');
        return false;
      }
      if (finalStatus === 'PENDING') {
        alert("Payout is still processing — we'll update your transaction history once it's confirmed.");
        return false;
      }
      return true;
    } catch (err) {
      console.error('[PAYOUT ERROR]', err);
      alert(err instanceof Error ? err.message : 'Payout failed. Please try again.');
      return false;
    }
  };

  // 5. Order Virtual Card
  const handleOrderCard = (brand: 'VISA' | 'MASTERCARD', cardHolderName: string) => {
    const countryInfo = COUNTRIES[activeUser.country];
    const cardPriceLocal = countryInfo.cardPriceAmount;

    // Call backend API for virtual card creation
    fetch('/api/cards/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail: activeUser.email,
        brand,
        cardHolderName,
      }),
    }).catch((err) => console.log('Card issuing API notice:', err));

    const updatedUser = { ...activeUser };
    if (updatedUser.wallets[countryInfo.currency]) {
      updatedUser.wallets[countryInfo.currency].available = Math.max(
        0,
        updatedUser.wallets[countryInfo.currency].available - cardPriceLocal
      );
    }

    // Generate random 16 digit PAN
    const prefix = brand === 'VISA' ? '4218' : '5399';
    const pan = `${prefix} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;

    const newCard: VirtualCard = {
      id: `crd_${brand.toLowerCase()}_${Date.now()}`,
      brand,
      cardHolderName: cardHolderName.toUpperCase(),
      cardNumber: pan,
      expiryMonth: '08',
      expiryYear: '30',
      cvv: `${Math.floor(100 + Math.random() * 900)}`,
      balance: 10.0,
      currency: 'USD',
      status: 'ACTIVE',
      spendLimitMonthly: 1000,
      spentThisMonth: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    updatedUser.cards.unshift(newCard);

    const newTxn: Transaction = {
      id: `txn_card_order_${Date.now()}`,
      reference: `MP-CRD-ISSUE-${Math.floor(100000 + Math.random() * 900000)}`,
      title: `Issued Virtual ${brand} Card`,
      type: 'CARD_ISSUANCE',
      amount: cardPriceLocal,
      currency: countryInfo.currency,
      currencySymbol: countryInfo.currencySymbol,
      fee: 0,
      status: 'SUCCESS',
      date: 'Just now',
      cardLast4: pan.slice(-4),
    };

    updatedUser.transactions.unshift(newTxn);

    setUserProfiles((prev) => ({
      ...prev,
      [activeUser.country]: updatedUser,
    }));
  };

  // 6. Freeze / Unfreeze Card
  const handleToggleFreezeCard = (cardId: string) => {
    const updatedUser = { ...activeUser };
    const card = updatedUser.cards.find((c) => c.id === cardId);
    if (card) {
      card.status = card.status === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
      setUserProfiles((prev) => ({
        ...prev,
        [activeUser.country]: updatedUser,
      }));
    }
  };

  // 7. Top Up Virtual Card
  const handleTopUpCard = (cardId: string, amount: number) => {
    const updatedUser = { ...activeUser };
    const card = updatedUser.cards.find((c) => c.id === cardId);
    if (card && updatedUser.wallets['USD'] && updatedUser.wallets['USD'].available >= amount) {
      // Call backend API for virtual card top up
      fetch('/api/cards/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          amount,
          userEmail: activeUser.email,
        }),
      }).catch((err) => console.log('Card top-up API notice:', err));

      updatedUser.wallets['USD'].available -= amount;
      card.balance += amount;

      const newTxn: Transaction = {
        id: `txn_topup_${Date.now()}`,
        reference: `MP-CRD-TOP-${Math.floor(100000 + Math.random() * 900000)}`,
        title: `Card Balance Top-Up (•••• ${card.cardNumber.slice(-4)})`,
        type: 'CARD_PURCHASE',
        amount,
        currency: 'USD',
        currencySymbol: '$',
        fee: 0,
        status: 'SUCCESS',
        date: 'Just now',
      };
      updatedUser.transactions.unshift(newTxn);

      setUserProfiles((prev) => ({
        ...prev,
        [activeUser.country]: updatedUser,
      }));
    } else {
      alert('Insufficient USD Wallet balance to top up card.');
    }
  };

  // 8. Update Card Spend Limit
  const handleUpdateLimit = (cardId: string, limit: number) => {
    const updatedUser = { ...activeUser };
    const card = updatedUser.cards.find((c) => c.id === cardId);
    if (card) {
      card.spendLimitMonthly = limit;
      setUserProfiles((prev) => ({
        ...prev,
        [activeUser.country]: updatedUser,
      }));
    }
  };

  // 8b. Terminate / Delete Virtual Card
  const handleDeleteCard = (cardId: string) => {
    const updatedUser = { ...activeUser };
    const card = updatedUser.cards.find((c) => c.id === cardId);
    if (card) {
      // Refund remaining card balance back to USD wallet
      if (card.balance > 0) {
        if (!updatedUser.wallets['USD']) {
          updatedUser.wallets['USD'] = {
            currency: 'USD',
            currencySymbol: '$',
            available: 0,
            pending: 0,
            flag: '🇺🇸',
          };
        }
        updatedUser.wallets['USD'].available += card.balance;
      }
      updatedUser.cards = updatedUser.cards.filter((c) => c.id !== cardId);

      const newTxn: Transaction = {
        id: `txn_card_del_${Date.now()}`,
        reference: `MP-CRD-DEL-${Math.floor(100000 + Math.random() * 900000)}`,
        title: `Terminated Virtual Card (•••• ${card.cardNumber.slice(-4)})`,
        type: 'CARD_PURCHASE',
        amount: card.balance,
        currency: 'USD',
        currencySymbol: '$',
        fee: 0,
        status: 'SUCCESS',
        date: 'Just now',
      };
      updatedUser.transactions.unshift(newTxn);

      setUserProfiles((prev) => ({
        ...prev,
        [activeUser.country]: updatedUser,
      }));
    }
  };

  // 9. Update User Profile (from Profile & Settings)
  const handleUpdateUserProfile = (updatedUser: UserProfile) => {
    setUserProfiles((prev) => ({
      ...prev,
      [updatedUser.country]: updatedUser,
    }));
  };

  // 10. Onboarding Complete Callback
  const handleCompleteOnboarding = (newProfile: UserProfile) => {
    setUserProfiles((prev) => ({
      ...prev,
      [newProfile.country]: newProfile,
    }));
    setCurrentCountry(newProfile.country);
    setIsAuthenticated(true);
    setIsDemoMode(false);
    setShowOnboarding(false);
    setActiveTab('OVERVIEW');
  };

  const handleSignOut = () => {
    if (!isDemoMode) {
      api.logout().catch(() => {}); // best-effort — clearing local state below is what actually matters for the UI
    }
    setIsAuthenticated(false);
    setIsDemoMode(false);
    setShowOnboarding(false);
    setShowSideDrawer(false);
  };

  // 11. Update KYC Document & Verify Identity
  const handleUpdateKycDoc = (docName: string, docNum: string) => {
    const updatedUser: UserProfile = {
      ...activeUser,
      kycStatus: 'VERIFIED',
      kycDocuments: [
        {
          id: `KYC-${Date.now()}`,
          docType: docName,
          docNumber: docNum,
          verifiedAt: new Date().toISOString().split('T')[0],
          status: 'VERIFIED',
        },
        ...(activeUser.kycDocuments || []),
      ],
    };
    setUserProfiles((prev) => ({
      ...prev,
      [activeUser.country]: updatedUser,
    }));
  };

  // LOADING GUARD: checking for an existing real session before deciding what to show
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-700 border-t-[#F26522] rounded-full animate-spin" />
      </div>
    );
  }

  // ADMIN ROUTE GUARD: Show Master Operational Admin Portal
  if (showAdminPortal) {
    return (
      <AdminPortal
        onExitAdmin={() => {
          setShowAdminPortal(false);
          if (window.location.hash === '#admin') {
            window.history.pushState('', document.title, window.location.pathname + window.location.search);
          }
        }}
        userProfiles={userProfiles}
        onUpdateProfiles={setUserProfiles}
      />
    );
  }

  // UNAUTHENTICATED ROUTE GUARD: Show Public Landing Page
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <LandingPage
          onOpenSignUp={() => {
            setAuthMode('SIGN_UP');
            setShowOnboarding(true);
          }}
          onOpenSignIn={() => {
            setAuthMode('LOGIN');
            setShowOnboarding(true);
          }}
          onSelectDemoUser={(countryCode) => {
            // Demo mode is a UI sandbox only — it has no real session, so every
            // money-moving backend call correctly refuses it (401). Handlers also
            // check isDemoMode directly and explain this before even trying.
            setIsDemoMode(true);
            setCurrentCountry(countryCode);
            setIsAuthenticated(true);
            setActiveTab('OVERVIEW');
          }}
          onOpenFxCalc={() => setShowFxCalc(true)}
          onOpenAdminPortal={() => setShowAdminPortal(true)}
        />

        {/* Onboarding & Sign In Modal */}
        <OnboardingModal
          isOpen={showOnboarding}
          initialMode={authMode}
          onClose={() => setShowOnboarding(false)}
          onCompleteOnboarding={handleCompleteOnboarding}
        />

        {/* Real-Time FX Calculator Modal */}
        <FxCalculatorModal
          isOpen={showFxCalc}
          onClose={() => setShowFxCalc(false)}
        />
      </div>
    );
  }

  // AUTHENTICATED ROUTE: Show Protected Dashboard Workspace
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans flex antialiased selection:bg-[#F26522] selection:text-white">
      
      {/* 1. LEFT SIDEBAR NAVIGATION (Visible on Desktop / Laptop screens) */}
      <Sidebar
        user={activeUser}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenOnboarding={() => {
          setAuthMode('SIGN_UP');
          setShowOnboarding(true);
        }}
        onOpenFxCalc={() => setShowFxCalc(true)}
        onOpenAdminPortal={() => setShowAdminPortal(true)}
      />

      {/* 2. MAIN RIGHT CONTENT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        
        {/* Top Header Bar */}
        <Header
          user={activeUser}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onOpenOnboarding={() => {
            setAuthMode('SIGN_UP');
            setShowOnboarding(true);
          }}
          onOpenFxCalc={() => setShowFxCalc(true)}
          onOpenSideDrawer={() => setShowSideDrawer(true)}
        />

        {/* Main Workspace Canvas */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {activeTab === 'OVERVIEW' && (
            <DashboardView
              user={activeUser}
              onActivateUsdAccount={handleActivateUsdAccount}
              onDepositFunds={handleDepositFunds}
              onNavigateTab={setActiveTab}
              onOpenDepositModal={() => setShowDepositModal(true)}
            />
          )}

          {activeTab === 'SEND' && (
            <SendMoneyView
              user={activeUser}
              onExecuteP2PTransfer={handleExecuteP2PTransfer}
              onExecuteBankPayout={handleExecuteBankPayout}
              onNavigateTab={setActiveTab}
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

          {activeTab === 'PROFILE' && (
            <ProfileView
              user={activeUser}
              onUpdateUser={handleUpdateUserProfile}
              onActivateUsdAccount={handleActivateUsdAccount}
              onSignOut={handleSignOut}
            />
          )}

          {activeTab === 'KYC' && (
            <KycVaultView
              user={activeUser}
              onUpdateKycDoc={handleUpdateKycDoc}
            />
          )}

          {activeTab === 'TRANSACTIONS' && (
            <TransactionsView user={activeUser} />
          )}
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-8 px-4 sm:px-6 mt-12 hidden md:block">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-200">MIKPAL Fintech Ecosystem</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Effortless Regional Banking & Cards</span>
            </div>

            <div className="flex items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bank-Grade Encryption</span>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-teal-400" />
                <span>US Partner Bank USD Routing</span>
              </span>
            </div>
          </div>
        </footer>

      </div>

      {/* Sticky Bottom Navigation Bar across all views */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        user={activeUser}
        onOpenSideDrawer={() => setShowSideDrawer(true)}
      />

      {/* Onboarding & Auth Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        initialMode={authMode}
        onClose={() => setShowOnboarding(false)}
        onCompleteOnboarding={handleCompleteOnboarding}
      />

      {/* Real-Time FX Calculator Modal */}
      <FxCalculatorModal
        isOpen={showFxCalc}
        onClose={() => setShowFxCalc(false)}
      />

      {/* Deposit & Add Funds Modal */}
      <DepositModal
        isOpen={showDepositModal}
        user={activeUser}
        onClose={() => setShowDepositModal(false)}
        onDepositFunds={handleDepositFunds}
      />

      {/* Slide-Out Side Drawer Navigation & Settings Menu */}
      <SideDrawer
        isOpen={showSideDrawer}
        onClose={() => setShowSideDrawer(false)}
        user={activeUser}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onUpdateUser={handleUpdateUserProfile}
        onOpenOnboarding={() => {
          setAuthMode('SIGN_UP');
          setShowOnboarding(true);
        }}
        onOpenFxCalc={() => setShowFxCalc(true)}
        onSignOut={handleSignOut}
      />

    </div>
  );
}

