import React, { useState, useMemo } from 'react';
import { CreditCard, Transaction } from '../types';
import { groupInstallments, InstallmentGroup, formatCurrency, formatThaiDate } from '../utils/billingEngine';
import {
  CalendarClock,
  CheckCircle,
  Clock,
  Plus,
  ChevronDown,
  ChevronUp,
  CreditCard as CardIcon,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface InstallmentsViewProps {
  transactions: Transaction[];
  cards: CreditCard[];
  onOpenAddModal: (defaultType?: 'ซื้อ') => void;
}

export const InstallmentsView: React.FC<InstallmentsViewProps> = ({
  transactions,
  cards,
  onOpenAddModal,
}) => {
  const [filter, setFilter] = useState<'ACTIVE' | 'COMPLETED' | 'ALL'>('ACTIVE');
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);

  // Group installments automatically from transactions
  const installmentGroups = useMemo(() => {
    return groupInstallments(transactions);
  }, [transactions]);

  // Totals
  const { totalRemainingDebt, monthlyCommitment, activeCount, completedCount } = useMemo(() => {
    let debt = 0;
    let monthly = 0;
    let active = 0;
    let completed = 0;

    for (const group of installmentGroups) {
      if (group.isCompleted) {
        completed += 1;
      } else {
        active += 1;
        debt += group.remainingAmount;
        monthly += group.monthlyAmount;
      }
    }
    return {
      totalRemainingDebt: debt,
      monthlyCommitment: monthly,
      activeCount: active,
      completedCount: completed,
    };
  }, [installmentGroups]);

  const filteredGroups = useMemo(() => {
    return installmentGroups.filter((g) => {
      if (filter === 'ACTIVE') return !g.isCompleted;
      if (filter === 'COMPLETED') return g.isCompleted;
      return true;
    });
  }, [installmentGroups, filter]);

  const toggleExpand = (id: string) => {
    setExpandedPlanId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-indigo-400" />
            จัดการการผ่อนชำระ
          </h1>
          <p className="text-xs text-slate-400">
            ติดตามยอดผ่อนรายงวด งวดคงเหลือ และกำหนดสิ้นสุด
          </p>
        </div>

        <button
          onClick={() => onOpenAddModal('ซื้อ')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>ผ่อนใหม่</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/70 to-slate-900 border border-indigo-500/30 shadow-lg">
          <div className="text-[11px] text-indigo-300 font-medium">หนี้ผ่อนคงเหลือรวม</div>
          <div className="text-xl font-extrabold font-num text-white mt-1">
            {formatCurrency(totalRemainingDebt)}
          </div>
          <div className="text-[10px] text-indigo-400/80 mt-1">
            กำลังผ่อนอยู่ {activeCount} รายการ
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md">
          <div className="text-[11px] text-slate-400 font-medium">ภาระค่างวดต่อเดือน</div>
          <div className="text-xl font-extrabold font-num text-sky-400 mt-1">
            {formatCurrency(monthlyCommitment)}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            ผ่อนหมดแล้ว {completedCount} รายการ
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
        <button
          onClick={() => setFilter('ACTIVE')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition ${
            filter === 'ACTIVE'
              ? 'bg-indigo-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          กำลังผ่อน ({activeCount})
        </button>
        <button
          onClick={() => setFilter('COMPLETED')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition ${
            filter === 'COMPLETED'
              ? 'bg-emerald-600 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ผ่อนหมดแล้ว ({completedCount})
        </button>
        <button
          onClick={() => setFilter('ALL')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition ${
            filter === 'ALL'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          ทั้งหมด ({installmentGroups.length})
        </button>
      </div>

      {/* Installment Plans List */}
      <div className="space-y-3">
        {filteredGroups.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            ไม่พบรายการผ่อนชำระในหมวดนี้
          </div>
        ) : (
          filteredGroups.map((group) => {
            const progress = Math.min(
              100,
              Math.round((group.completedInstallments / group.totalInstallments) * 100)
            );
            const isExpanded = expandedPlanId === group.id;

            return (
              <div
                key={group.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition overflow-hidden shadow-md"
              >
                {/* Header */}
                <div
                  onClick={() => toggleExpand(group.id)}
                  className="p-4 cursor-pointer hover:bg-slate-850/50 transition"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-base">{group.planName}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-xs">
                          {group.card}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        งวดละ <strong className="text-white font-num">{formatCurrency(group.monthlyAmount)}</strong>
                        <span className="mx-1">•</span>
                        ยอดรวม {formatCurrency(group.totalAmount)}
                      </div>
                    </div>

                    <div className="text-right">
                      {group.isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                          <CheckCircle className="w-3.5 h-3.5" />
                          ผ่อนครบแล้ว
                        </span>
                      ) : (
                        <div>
                          <div className="text-xs text-slate-400">คงเหลือ</div>
                          <div className="text-sm font-bold font-num text-amber-300">
                            {formatCurrency(group.remainingAmount)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-indigo-300 font-medium">
                        งวดที่ {group.completedInstallments} / {group.totalInstallments}
                      </span>
                      <span className="text-slate-400 font-num">{progress}%</span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          group.isCompleted
                            ? 'bg-emerald-500'
                            : 'bg-gradient-to-r from-indigo-500 to-sky-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer accordion toggle */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 pt-2 border-t border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      ล่าสุด: {formatThaiDate(group.latestDate)}
                    </span>
                    <button className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                      <span>{isExpanded ? 'ซ่อนงวดที่บันทึก' : `ดูประวัติงวด (${group.transactions.length})`}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Timeline of Installments */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-slate-950/60 border-t border-slate-800/80 space-y-2">
                    <div className="text-xs font-semibold text-slate-300 mb-2">ไทม์ไลน์งวดที่บันทึกไว้ในระบบ:</div>
                    <div className="space-y-1.5">
                      {group.transactions.map((tx, idx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800/60 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 flex items-center justify-center font-bold text-[10px]">
                              {tx.installment?.current || idx + 1}
                            </span>
                            <span className="text-slate-200">{formatThaiDate(tx.date)}</span>
                            {tx.note && <span className="text-slate-400 text-[11px]">({tx.note})</span>}
                          </div>
                          <div className="font-num font-bold text-slate-100">
                            {formatCurrency(tx.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
