import React, { useState, useEffect } from 'react';
import { Lock, Delete, X, AlertCircle } from 'lucide-react';
import { Logo } from './Logo';
import { verifyPin as apiVerifyPin } from '../lib/mikpalApi';

interface PinVerificationModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  onSuccess: (pinToken: string) => void;
  onClose: () => void;
}

export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  isOpen,
  title = 'Transaction Authorization',
  subtitle = 'Enter your 4-digit Transaction PIN to complete this action',
  onSuccess,
  onClose,
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMsg(null);
      setIsVerifying(false);
      setIsShaking(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKeyPress(e.key);
      else if (e.key === 'Backspace') handleDelete();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, pinInput]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pinInput.length >= 4 || isVerifying) return;
    setErrorMsg(null);
    const newPin = pinInput + num;
    setPinInput(newPin);
    if (newPin.length === 4) verifyPinWithServer(newPin);
  };

  const handleDelete = () => {
    if (isVerifying) return;
    setErrorMsg(null);
    setPinInput((prev) => prev.slice(0, -1));
  };

  const verifyPinWithServer = async (enteredPin: string) => {
    setIsVerifying(true);
    try {
      // The server hashes-and-compares this PIN and, only on a real match, issues
      // a short-lived pinToken. Nothing about the real PIN is ever known client-side.
      const { pinToken } = await apiVerifyPin(enteredPin);
      setIsVerifying(false);
      onSuccess(pinToken);
    } catch (err) {
      setIsVerifying(false);
      setIsShaking(true);
      setErrorMsg(err instanceof Error ? err.message : 'Incorrect PIN. Please try again.');
      setTimeout(() => {
        setPinInput('');
        setIsShaking(false);
      }, 600);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className={`bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-6 relative ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition">
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center justify-center gap-1 mx-auto">
          <Logo size="md" />
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mt-1">
            <Lock className="w-3 h-3" />
            <span>Authorized Payment Checkout</span>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
        </div>

        <div className="flex items-center justify-center gap-4 my-2">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pinInput.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  isFilled ? 'bg-[#F26522] border-[#F26522] scale-110 shadow-sm' : 'bg-slate-100 border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-red-600 text-xs font-bold bg-red-50 py-1.5 px-3 rounded-xl border border-red-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isVerifying && (
          <div className="flex items-center justify-center gap-2 text-teal-700 text-xs font-bold bg-teal-50 py-2 px-3 rounded-xl border border-teal-200 animate-pulse">
            <span>Verifying with MIKPAL...</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              disabled={isVerifying}
              onClick={() => handleKeyPress(num)}
              className="py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold text-lg rounded-2xl border border-slate-200 active:scale-95 transition shadow-2xs disabled:opacity-50"
            >
              {num}
            </button>
          ))}

          <div />

          <button
            type="button"
            disabled={isVerifying}
            onClick={() => handleKeyPress('0')}
            className="py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold text-lg rounded-2xl border border-slate-200 active:scale-95 transition shadow-2xs disabled:opacity-50"
          >
            0
          </button>

          <button
            type="button"
            disabled={isVerifying}
            onClick={handleDelete}
            className="py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 flex items-center justify-center transition active:scale-95 disabled:opacity-50"
            title="Delete last digit"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
