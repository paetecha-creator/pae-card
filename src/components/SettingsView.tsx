import React from 'react';
import { CreditCard, FirebaseSyncSettings, SecuritySettings, Transaction } from '../types';
import { Shield, RefreshCw } from 'lucide-react';

interface SettingsViewProps {
  security?: SecuritySettings;
  onUpdateSecurity?: (settings: Partial<SecuritySettings>) => void;
  firebaseSettings?: FirebaseSyncSettings;
  onUpdateFirebase?: (settings: FirebaseSyncSettings) => void;
  transactions?: Transaction[];
  cards?: CreditCard[];
  onReloadData?: (txs: Transaction[], cards: CreditCard[]) => void;
  onFactoryReset?: () => Promise<void> | void;
  onLockApp?: () => void;
  isOnline: boolean;
  isBiometricSupported?: boolean;
  syncStatus?: 'synced' | 'syncing' | 'offline' | 'idle';
  onTriggerManualSync?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isOnline,
  syncStatus = 'synced',
  onTriggerManualSync,
}) => {
  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          ตั้งค่า & การเชื่อมต่อ
        </h1>
      </div>

      {/* Personal Cross-Device Auto-Sync Section */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/30 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 text-indigo-400 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            <h2 className="text-xs font-bold text-white uppercase tracking-wider">
              ซิ้งค์ข้อมูลข้ามทุกอุปกรณ์อัตโนมัติ (เปิดใช้งานตลอดเวลา)
            </h2>
          </div>

          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              syncStatus === 'syncing'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 animate-pulse'
                : isOnline
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {syncStatus === 'syncing' ? 'กำลังซิ้งค์...' : isOnline ? 'ซิ้งค์เรียบร้อย' : 'ออฟไลน์'}
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          💡 <strong>ใช้ส่วนตัวคนเดียว:</strong> ข้อมูลจะถูกเชื่อมต่อและซิ้งค์ตรงกันแบบเรียลไทม์ระหว่างมือถือ แท็บเล็ต และคอมพิวเตอร์ทุกเครื่องโดยอัตโนมัติ เมื่อมีการเพิ่ม แก้ไข หรือนำเข้าข้อมูลจากเครื่องใด เครื่องอื่นๆ จะได้รับการอัปเดตต่อเนื่องทันที
        </p>

        <button
          onClick={onTriggerManualSync}
          disabled={syncStatus === 'syncing'}
          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5 active:scale-95"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          <span>กดเพื่อซิ้งค์ข้อมูลล่าสุดทันที</span>
        </button>
      </div>
    </div>
  );
};
