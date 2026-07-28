import React, { useState } from 'react';
import { X, Mail, Lock, User, AtSign, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api';

interface OnboardingModalProps {
  mode: 'SIGN_UP' | 'LOGIN';
  onClose: () => void;
  onSignup: (email: string, password: string, fullName: string, username?: string) => Promise<void>;
  onSignin: (email: string, password: string) => Promise<void>;
  onGoogleAuth?: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ mode, onClose, onSignup, onSignin, onGoogleAuth }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [localMode, setLocalMode] = useState(mode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (localMode === 'SIGN_UP') {
        if (!email || !password || !fullName) { setError('All fields are required'); setLoading(false); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return; }
        await onSignup(email, password, fullName, username || undefined);
      } else {
        if (!email || !password) { setError('Email and password are required'); setLoading(false); return; }
        await onSignin(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="font-black text-xl text-[#F26522]">MIKPAL</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8">
          <h2 className="text-2xl font-black text-slate-900 mb-2">
            {localMode === 'SIGN_UP' ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-slate-500 mb-6">
            {localMode === 'SIGN_UP' ? 'Join MIKPAL — digital finance for Africa.' : 'Sign in to your MIKPAL account.'}
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" /><span>{error}</span>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {localMode === 'SIGN_UP' && (
              <>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] transition" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Username (optional)</label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="johndoe"
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] transition" />
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] transition" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={localMode === 'SIGN_UP' ? 'Min 8 characters' : '••••••••'}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] transition" />
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-[#F26522] to-[#E85D04] text-white font-bold text-sm rounded-xl hover:opacity-95 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{localMode === 'SIGN_UP' ? 'Create Account' : 'Sign In'}<ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
          <div className="mt-6 text-center">
            <button onClick={() => setLocalMode(localMode === 'SIGN_UP' ? 'LOGIN' : 'SIGN_UP')}
              className="text-sm text-slate-500 hover:text-[#F26522] transition cursor-pointer">
              {localMode === 'SIGN_UP' ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
