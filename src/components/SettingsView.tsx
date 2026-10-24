import React, { useState } from 'react';
import { CreditCard, FirebaseSyncSettings, SecuritySettings, Transaction } from '../types';
import { syncToFirebase } from '../utils/firebaseSync';
import { exportFullBackup, importFullBackup, exportTransactionsToCSV, resetDataToDefault } from '../utils/storage';
import {
  Shield,
  Fingerprint,
  KeyRound,
  Cloud,
  RefreshCw,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Smartphone,
  ExternalLink,
} from 'lucide-react';

interface SettingsViewProps {
  security: SecuritySettings;
  onUpdateSecurity: (settings: Partial<SecuritySettings>) => void;
  firebaseSettings: FirebaseSyncSettings;
  onUpdateFirebase: (settings: FirebaseSyncSettings) => void;
  transactions: Transaction[];
  cards: CreditCard[];
  onReloadData: (txs: Transaction[], cards: CreditCard[]) => void;
  onLockApp: () => void;
  isOnline: boolean;
  isBiometricSupported: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  security,
  onUpdateSecurity,
  firebaseSettings,
  onUpdateFirebase,
  transactions,
  cards,
  onReloadData,
  onLockApp,
  isOnline,
  isBiometricSupported,
}) => {
  const [pinInput, setPinInput] = useState(security.pin);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);

  // Firebase sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Handle PIN update
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinMessage('รหัส PIN ต้องเป็นตัวเลข 4 หลัก');
      return;
    }
    if (newPin !== confirmPin) {
      setPinMessage('รหัส PIN ไม่ตรงกัน');
      return;
    }

    onUpdateSecurity({ pin: newPin });
    setIsChangingPin(false);
    setNewPin('');
    setConfirmPin('');
    setPinMessage('เปลี่ยนรหัส PIN สำเร็จแล้ว');
    setTimeout(() => setPinMessage(null), 3000);
  };

  // Trigger Cloud Backup
  const handleCloudSync = async () => {
    setIsSyncing(true);
    setSyncMessage(null);
    try {
      const result = await syncToFirebase(transactions, cards, firebaseSettings);
      setSyncMessage(result.message);
      if (result.success) {
        onUpdateFirebase({
          ...firebaseSettings,
          lastSyncedAt: result.timestamp,
          status: 'synced',
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Export JSON Backup
  const handleDownloadBackup = () => {
    const jsonStr = exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PaeCard_Backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON Backup
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importFullBackup(content);
      if (res.success) {
        alert(res.message);
        window.location.reload();
      } else {
        alert('เกิดข้อผิดพลาด: ' + res.message);
      }
    };
    reader.readAsText(file);
  };

  // Reset to default sheets seed
  const handleReset = () => {
    if (confirm('คุณต้องการรีเซ็ตฐานข้อมูลกลับเป็นข้อมูลตั้งต้นจาก Google Sheets (178 รายการ) ใช่หรือไม่?')) {
      const { transactions: defaultTxs, cards: defaultCards } = resetDataToDefault();
      onReloadData(defaultTxs, defaultCards);
      alert('รีเซ็ตข้อมูลเรียบร้อยแล้ว');
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          ตั้งค่า & ความปลอดภัย
        </h1>
        <p className="text-xs text-slate-400">
          ความปลอดภัยชีวมิติ การสำรองข้อมูล Firebase Cloud และโหมดออฟไลน์
        </p>
      </div>

      {/* Security Section */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-indigo-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              การรักษาความปลอดภัย (Biometric & PIN)
            </h2>
          </div>
          <button
            onClick={onLockApp}
            className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white transition"
          >
            ทดสอบล็อคหน้าจอ
          </button>
        </div>

        {/* Biometrics Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">สแกนลายนิ้วมือ / ใบหน้า (Biometrics)</div>
              <div className="text-[11px] text-slate-400">
                {isBiometricSupported
                  ? 'รองรับ Touch ID / Face ID / WebAuthn บนอุปกรณ์นี้'
                  : 'รองรับการยืนยันตัวตนชีวมิติแบบจำลอง'}
              </div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={security.biometricEnabled}
            onChange={(e) => onUpdateSecurity({ biometricEnabled: e.target.checked })}
            className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
          />
        </div>

        {/* PIN Code Settings */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-200">
                รหัสผ่าน PIN (ปัจจุบัน: ••••)
              </span>
            </div>
            <button
              onClick={() => setIsChangingPin(!isChangingPin)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
            >
              {isChangingPin ? 'ยกเลิก' : 'เปลี่ยนรหัส PIN'}
            </button>
          </div>

          {pinMessage && (
            <div className="text-xs p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
              {pinMessage}
            </div>
          )}

          {isChangingPin && (
            <form onSubmit={handleSavePin} className="space-y-2 pt-2 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="PIN ใหม่ (4 หลัก)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-center text-sm focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="ยืนยัน PIN ใหม่"
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono text-center text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
              >
                บันทึกรหัส PIN ใหม่
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Firebase Cloud Sync Section */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-sky-400" />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              คลาวด์ Firebase & การสำรองข้อมูล
            </h2>
          </div>

          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              isOnline
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {isOnline ? 'ออนไลน์' : 'ออฟไลน์'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Firebase Domain:</span>
            <span className="font-mono text-indigo-300 font-semibold">{firebaseSettings.authDomain}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Project ID:</span>
            <span className="font-mono text-slate-300">{firebaseSettings.projectId}</span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400">สำรองข้อมูลล่าสุด:</span>
            <span className="font-num text-slate-200">
              {firebaseSettings.lastSyncedAt
                ? new Date(firebaseSettings.lastSyncedAt).toLocaleString('th-TH')
                : 'ยังไม่เคยสำรอง'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-300 font-medium">สำรองข้อมูลอัตโนมัติบนคลาวด์:</span>
            <input
              type="checkbox"
              checked={firebaseSettings.autoSync}
              onChange={(e) => onUpdateFirebase({ ...firebaseSettings, autoSync: e.target.checked })}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
            />
          </div>

          {syncMessage && (
            <div className="text-xs p-2.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" />
              <span>{syncMessage}</span>
            </div>
          )}

          <button
            onClick={handleCloudSync}
            disabled={isSyncing}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-sky-600/20 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'กำลังซิงค์ขึ้น Cloud...' : 'สำรองข้อมูลขึ้น Firebase Cloud ทันที'}</span>
          </button>
        </div>
      </div>

      {/* Offline Storage & Backup Management */}
      <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
        <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Smartphone className="w-4 h-4 text-emerald-400" />
          การจัดการฐานข้อมูล & ออฟไลน์
        </h2>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handleDownloadBackup}
            className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 flex flex-col items-center justify-center gap-1 transition"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold">ดาวน์โหลดไฟล์สำรอง</span>
            <span className="text-[10px] text-slate-400">JSON Backup</span>
          </button>

          <label className="p-3 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 flex flex-col items-center justify-center gap-1 transition cursor-pointer">
            <Upload className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold">กู้คืนจากไฟล์</span>
            <span className="text-[10px] text-slate-400">นำเข้า JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* Reset to Seed */}
        <div className="pt-2">
          <button
            onClick={handleReset}
            className="w-full py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>รีเซ็ตกลับเป็นข้อมูลเริ่มต้นจาก Google Sheets (178 รายการ)</span>
          </button>
        </div>
      </div>

      {/* App Version Info */}
      <div className="text-center text-[11px] text-slate-500 pt-2 space-y-1">
        <p>PaeCard Wallet v1.0 • PWA Enabled • Offline Capable</p>
        <p>เชื่อมต่อ Firebase: pae-card.firebaseapp.com</p>
      </div>
    </div>
  );
};
