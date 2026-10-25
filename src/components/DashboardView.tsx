import React, { useMemo } from 'react';
import { CreditCard, Transaction } from '../types';
import { calculateCardCycleSummary, formatCurrency, formatThaiDate } from '../utils/billingEngine';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard as CardIcon,
  Plus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
  Cloud,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface DashboardViewProps {
  cards: CreditCard[];
  transactions: Transaction[];
  onOpenAddModal: (defaultType?: 'ซื้อ' | 'เงินคืน' | 'จ่ายบิล') => void;
  onOpenCardDetails: (card: CreditCard) => void;
  onSelectTab: (tab: 'dashboard' | 'transactions' | 'cards' | 'settings') => void;
  onLockApp: () => void;
  isOnline: boolean;
  syncStatus?: 'synced' | 'syncing' | 'offline' | 'idle';
  onTriggerManualSync?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  cards,
  transactions,
  onOpenAddModal,
  onOpenCardDetails,
  onSelectTab,
  onLockApp,
  isOnline,
  syncStatus = 'synced',
  onTriggerManualSync,
}) => {
  // Dynamic date reference: anchors to latest transaction date if present, or current date if empty
  const referenceDate = useMemo(() => {
    if (transactions.length > 0) {
      const dates = transactions.map((t) => t.date).filter(Boolean).sort();
      if (dates.length > 0) {
        const latest = dates[dates.length - 1];
        return new Date(`${latest}T12:00:00`);
      }
    }
    return new Date();
  }, [transactions]);

  // Calculate billing cycle for all cards
  const summaries = useMemo(() => {
    return cards.map((card) => ({
      card,
      summary: calculateCardCycleSummary(card, transactions, referenceDate),
    }));
  }, [cards, transactions, referenceDate]);

  // Aggregate monthly totals for current cycles
  const totalSpend = useMemo(() => {
    return summaries.reduce((acc, curr) => acc + curr.summary.totalSpend, 0);
  }, [summaries]);

  const totalRefund = useMemo(() => {
    return summaries.reduce((acc, curr) => acc + curr.summary.totalRefund, 0);
  }, [summaries]);

  const totalPaid = useMemo(() => {
    return summaries.reduce((acc, curr) => acc + curr.summary.totalPaid, 0);
  }, [summaries]);

  const totalNetDue = useMemo(() => {
    return summaries.reduce((acc, curr) => acc + curr.summary.netDue, 0);
  }, [summaries]);

  // Upcoming due dates (ordered by days remaining)
  const urgentBills = useMemo(() => {
    return summaries
      .filter((s) => s.summary.netDue > 0)
      .sort((a, b) => a.summary.daysUntilDue - b.summary.daysUntilDue);
  }, [summaries]);

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <CardIcon className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">PaeCard Wallet</h1>
              {syncStatus === 'syncing' && (
                <span className="flex items-center gap-1 text-[10px] text-sky-300 bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-500/25 animate-pulse">
                  <RefreshCw className="w-3 h-3 animate-spin" /> กำลังซิ้งค์...
                </span>
              )}
              {!isOnline && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <WifiOff className="w-3 h-3" /> ออฟไลน์
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              รอบบิลปัจจุบัน • {referenceDate.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <button
            onClick={onLockApp}
            title="ล็อคแอพทันที"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 active:scale-95 transition"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </button>
        </div>
      </div>

      {/* Bill Due Alerts / Reminders Banner */}
      {urgentBills.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-purple-500/15 border border-amber-500/30 p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>แจ้งเตือนวันครบกำหนดชำระ</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
              ค้างชำระ {urgentBills.length} บัตร
            </span>
          </div>

          <div className="space-y-2 mt-2">
            {urgentBills.slice(0, 2).map(({ card, summary }) => (
              <div
                key={card.id}
                onClick={() => onOpenCardDetails(card)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 cursor-pointer hover:border-slate-700 transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{card.name}</span>
                    <span className="text-xs text-slate-400">ตัดรอบวันที่ {card.cutoffDay}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>ครบกำหนด: <strong className="text-slate-200">{formatThaiDate(summary.dueDate)}</strong></span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold font-num text-amber-300">
                    {formatCurrency(summary.netDue)}
                  </div>
                  <span
                    className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      summary.daysUntilDue <= 3
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {summary.daysUntilDue <= 0
                      ? 'ครบกำหนดแล้ววันนี้'
                      : `อีก ${summary.daysUntilDue} วัน`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Net Due Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-5 border border-indigo-500/30 shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs text-indigo-300 font-medium mb-1">
          <span>ยอดค้างชำระสุทธิรอบนี้ (Net Due)</span>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-[10px] text-indigo-200">
            คำนวณอัตโนมัติ
          </span>
        </div>

        <div className="text-3xl font-extrabold font-num text-white tracking-tight my-2">
          {formatCurrency(totalNetDue)}
        </div>

        {/* 3 mini metric cards */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <TrendingUp className="w-3 h-3 text-rose-400" />
              <span>ยอดใช้จ่าย</span>
            </div>
            <div className="text-xs font-bold font-num text-slate-200 mt-1 truncate">
              {formatCurrency(totalSpend)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <TrendingDown className="w-3 h-3 text-emerald-400" />
              <span>เงินคืน</span>
            </div>
            <div className="text-xs font-bold font-num text-emerald-400 mt-1 truncate">
              +{formatCurrency(totalRefund)}
            </div>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <CheckCircle2 className="w-3 h-3 text-sky-400" />
              <span>ชำระแล้ว</span>
            </div>
            <div className="text-xs font-bold font-num text-sky-400 mt-1 truncate">
              {formatCurrency(totalPaid)}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onOpenAddModal('ซื้อ')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-850 active:scale-95 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium text-slate-300">ใช้บัตร</span>
        </button>

        <button
          onClick={() => onOpenAddModal('จ่ายบิล')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 hover:bg-slate-850 active:scale-95 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium text-slate-300">จ่ายบิล</span>
        </button>

        <button
          onClick={() => onOpenAddModal('เงินคืน')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 active:scale-95 transition group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1 group-hover:scale-110 transition">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium text-slate-300">เงินคืน</span>
        </button>
      </div>

      {/* Credit Cards Slider / List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
            <CardIcon className="w-4 h-4 text-indigo-400" />
            บัตรเครดิต & รอบบิล ({cards.length})
          </h2>
          <button
            onClick={() => onSelectTab('cards')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
          >
            จัดการบัตร →
          </button>
        </div>

        {cards.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-indigo-400">
              <CardIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">ยังไม่มีบัตรเครดิต</div>
              <p className="text-xs text-slate-400 mt-0.5">เพิ่มบัตรเครดิตของคุณเพื่อเริ่มติดตามรอบบิลและวันชำระ</p>
            </div>
            <button
              onClick={() => onSelectTab('cards')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ เพิ่มบัตรเครดิต</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {summaries.map(({ card, summary }) => (
              <div
                key={card.id}
                onClick={() => onOpenCardDetails(card)}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-md group relative overflow-hidden"
              >
                {/* Left colored accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5"
                  style={{ backgroundColor: card.accentColor }}
                />

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base group-hover:text-indigo-300 transition">
                        {card.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                        •• {card.last4}
                      </span>
                      <span className="text-[11px] text-slate-400">{card.networkName}</span>
                    </div>

                    {/* Cutoff & Due date labels */}
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">ตัดรอบ:</span>
                        <span className="font-medium text-slate-300">ทุกวันที่ {card.cutoffDay}</span>
                      </div>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">ครบกำหนด:</span>
                        <span className="font-medium text-slate-300">{formatThaiDate(summary.dueDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-slate-400">ยอดต้องชำระ</div>
                    <div
                      className={`text-base font-extrabold font-num mt-0.5 ${
                        summary.netDue > 0 ? 'text-white' : 'text-emerald-400'
                      }`}
                    >
                      {summary.netDue > 0 ? formatCurrency(summary.netDue) : 'ชำระครบแล้ว ✓'}
                    </div>
                    {summary.netDue > 0 && (
                      <span
                        className={`inline-block text-[10px] px-2 py-0.5 rounded-full mt-1 ${
                          summary.daysUntilDue <= 3
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-indigo-500/20 text-indigo-300'
                        }`}
                      >
                        เหลืออีก {summary.daysUntilDue} วัน
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

