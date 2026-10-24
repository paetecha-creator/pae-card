import React, { useState } from 'react';
import { Fingerprint, Lock, Delete, ShieldCheck, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SecurityLockProps {
  onUnlockWithPin: (pin: string) => boolean;
  onTriggerBiometric: () => Promise<boolean>;
  isBiometricAvailable: boolean;
  biometricEnabled: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

export const SecurityLock: React.FC<SecurityLockProps> = ({
  onUnlockWithPin,
  onTriggerBiometric,
  isBiometricAvailable,
  biometricEnabled,
  authError,
  setAuthError,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isVerifyingBio, setIsVerifyingBio] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 4) {
      const next = pinInput + num;
      setPinInput(next);
      setAuthError(null);

      if (next.length === 4) {
        setTimeout(() => {
          const success = onUnlockWithPin(next);
          if (!success) {
            setPinInput('');
          }
        }, 80);
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setAuthError(null);
  };

  const handleBiometricClick = async () => {
    setIsVerifyingBio(true);
    try {
      await onTriggerBiometric();
    } finally {
      setIsVerifyingBio(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950/80 p-6 text-white select-none">
      {/* Top Brand & Status */}
      <div className="flex flex-col items-center pt-8 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4"
        >
          <Lock className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold tracking-tight text-white">PaeCard Wallet</h1>
        <p className="text-sm text-slate-400 mt-1">ระบบรักษาความปลอดภัยบัญชีบัตร</p>
      </div>

      {/* PIN Dots Display & Biometric Status */}
      <div className="flex flex-col items-center w-full max-w-xs">
        <p className="text-xs uppercase tracking-widest text-indigo-300 font-semibold mb-6 flex items-center gap-1.5">
          <KeyRound className="w-4 h-4" /> ป้อนรหัส PIN 4 หลัก
        </p>

        {/* 4 Dots */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {[0, 1, 2, 3].map((idx) => {
            const filled = pinInput.length > idx;
            return (
              <motion.div
                key={idx}
                animate={{
                  scale: filled ? 1.2 : 1,
                  backgroundColor: filled ? '#38bdf8' : 'rgba(51, 65, 85, 0.4)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`w-4 h-4 rounded-full border border-slate-700 ${
                  filled ? 'shadow-md shadow-sky-500/50' : ''
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {authError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-rose-400 font-medium bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg text-center mt-1"
            >
              {authError}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-[11px] text-slate-500 mt-2">
          รหัส PIN เริ่มต้น: <span className="text-slate-300 font-mono font-bold">1234</span>
        </p>
      </div>

      {/* Keypad */}
      <div className="w-full max-w-xs pb-6">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700/80 active:bg-indigo-600/60 active:scale-95 border border-slate-800 text-2xl font-bold font-num text-slate-100 transition flex items-center justify-center backdrop-blur-sm"
            >
              {num}
            </button>
          ))}

          {/* Biometric Button */}
          <button
            onClick={handleBiometricClick}
            disabled={isVerifyingBio}
            title="สแกนลายนิ้วมือหรือใบหน้า"
            className={`h-16 rounded-2xl border transition flex flex-col items-center justify-center active:scale-95 ${
              isBiometricAvailable || biometricEnabled
                ? 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300 hover:bg-indigo-900/60 shadow-lg shadow-indigo-950/40'
                : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Fingerprint className={`w-6 h-6 ${isVerifyingBio ? 'animate-pulse text-sky-400' : ''}`} />
            <span className="text-[10px] mt-0.5">สแกนนิ้ว/หน้า</span>
          </button>

          {/* Zero */}
          <button
            onClick={() => handleKeyPress('0')}
            className="h-16 rounded-2xl bg-slate-800/60 hover:bg-slate-700/80 active:bg-indigo-600/60 active:scale-95 border border-slate-800 text-2xl font-bold font-num text-slate-100 transition flex items-center justify-center backdrop-blur-sm"
          >
            0
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-slate-800/40 hover:bg-slate-800/80 active:scale-95 border border-slate-800 text-slate-400 hover:text-slate-200 transition flex items-center justify-center"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        {/* Footer info */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>เข้ารหัสและปกป้องข้อมูลส่วนบุคคลในเครื่องคุณ</span>
        </div>
      </div>
    </div>
  );
};
