import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, Delete, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Logo } from './Logo';

interface PinVerificationModalProps {
  isOpen: boolean;
  title?: string;
  subtitle?: string;
  userPin: string;
  biometricEnabled?: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinVerificationModal: React.FC<PinVerificationModalProps> = ({
  isOpen,
  title = 'Transaction Authorization',
  subtitle = 'Enter your 4-digit Transaction PIN to complete this action',
  userPin = '1234',
  biometricEnabled = true,
  onSuccess,
  onClose,
}) => {
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isBiometricAuthenticating, setIsBiometricAuthenticating] = useState<boolean>(false);
  const [biometricSuccess, setBiometricSuccess] = useState<boolean>(false);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPinInput('');
      setErrorMsg(null);
      setIsBiometricAuthenticating(false);
      setBiometricSuccess(false);
      setIsShaking(false);
    }
  }, [isOpen]);

  // Handle Physical Keyboard Input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pinInput, userPin]);

  if (!isOpen) return null;

  const handleKeyPress = (num: string) => {
    if (pinInput.length >= 4) return;
    setErrorMsg(null);

    const newPin = pinInput + num;
    setPinInput(newPin);

    // Auto verify when 4 digits reached
    if (newPin.length === 4) {
      verifyPin(newPin);
    }
  };

  const handleDelete = () => {
    setErrorMsg(null);
    setPinInput((prev) => prev.slice(0, -1));
  };

  const verifyPin = (enteredPin: string) => {
    const targetPin = userPin || '1234';
    if (enteredPin === targetPin) {
      setTimeout(() => {
        onSuccess();
      }, 200);
    } else {
      setIsShaking(true);
      setErrorMsg('Incorrect Transaction PIN. Please try again.');
      setTimeout(() => {
        setPinInput('');
        setIsShaking(false);
      }, 600);
    }
  };

  const handleSimulateBiometric = () => {
    setIsBiometricAuthenticating(true);
    setErrorMsg(null);
    setTimeout(() => {
      setIsBiometricAuthenticating(false);
      setBiometricSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 400);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div
        className={`bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-6 relative ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* Close Modal X */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* MIKPAL Official Logo & Security Badge */}
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

        {/* 4 PIN Dots */}
        <div className="flex items-center justify-center gap-4 my-2">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pinInput.length > index;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 border-2 ${
                  isFilled
                    ? 'bg-[#F26522] border-[#F26522] scale-110 shadow-sm'
                    : 'bg-slate-100 border-slate-300'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-red-600 text-xs font-bold bg-red-50 py-1.5 px-3 rounded-xl border border-red-200 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Biometric Scanning Feedback */}
        {isBiometricAuthenticating && (
          <div className="flex items-center justify-center gap-2 text-teal-700 text-xs font-bold bg-teal-50 py-2 px-3 rounded-xl border border-teal-200 animate-pulse">
            <Fingerprint className="w-5 h-5 text-teal-600 animate-spin" />
            <span>Scanning Face ID / Fingerprint...</span>
          </div>
        )}

        {biometricSuccess && (
          <div className="flex items-center justify-center gap-2 text-emerald-700 text-xs font-bold bg-emerald-50 py-2 px-3 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Biometric Authorization Verified!</span>
          </div>
        )}

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold text-lg rounded-2xl border border-slate-200 active:scale-95 transition shadow-2xs"
            >
              {num}
            </button>
          ))}

          {/* Biometric Trigger */}
          {biometricEnabled ? (
            <button
              type="button"
              onClick={handleSimulateBiometric}
              className="py-3.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-2xl border border-teal-200 flex flex-col items-center justify-center transition active:scale-95"
              title="Authenticate with Face ID / Fingerprint"
            >
              <Fingerprint className="w-5 h-5" />
              <span className="text-[9px] font-extrabold">Biometric</span>
            </button>
          ) : (
            <div />
          )}

          {/* Key 0 */}
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-900 font-extrabold text-lg rounded-2xl border border-slate-200 active:scale-95 transition shadow-2xs"
          >
            0
          </button>

          {/* Backspace Delete */}
          <button
            type="button"
            onClick={handleDelete}
            className="py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200 flex items-center justify-center transition active:scale-95"
            title="Delete last digit"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[10px] text-slate-400 font-mono pt-1">
          Default Demo PIN: <strong className="text-slate-700 font-bold">{userPin || '1234'}</strong> (Change in Settings)
        </p>
      </div>
    </div>
  );
};
