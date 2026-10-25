import React, { useState, useMemo } from 'react';
import { CreditCard, Transaction } from '../types';
import { calculateCardCycleSummary, formatCurrency, formatThaiDate } from '../utils/billingEngine';
import { CardEditModal } from './CardEditModal';
import {
  CreditCard as CardIcon,
  Plus,
  Edit2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Wifi,
  Sparkles,
} from 'lucide-react';

interface CardsViewProps {
  cards: CreditCard[];
  transactions: Transaction[];
  onSaveCard: (card: CreditCard) => void;
  onDeleteCard?: (cardId: string) => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const CardsView: React.FC<CardsViewProps> = ({
  cards,
  transactions,
  onSaveCard,
  onDeleteCard,
  onSelectTransaction,
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const activeCard = useMemo(() => {
    return cards.find((c) => c.id === selectedCardId) || cards[0];
  }, [cards, selectedCardId]);

  // Calculate cycle summary for active card
  const activeSummary = useMemo(() => {
    if (!activeCard) return null;
    return calculateCardCycleSummary(activeCard, transactions, new Date('2026-10-24T12:00:00'));
  }, [activeCard, transactions]);

  // Card transactions
  const cardTransactions = useMemo(() => {
    if (!activeCard) return [];
    return transactions.filter(
      (t) => t.card.toLowerCase() === activeCard.name.toLowerCase()
    );
  }, [activeCard, transactions]);

  const handleEditClick = (c: CreditCard) => {
    setEditingCard(c);
    setIsEditModalOpen(true);
  };

  const handleAddNewCard = () => {
    setEditingCard(null);
    setIsEditModalOpen(true);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-indigo-400" />
            บัตรเครดิตของฉัน ({cards.length})
          </h1>
          <p className="text-xs text-slate-400">กำหนดวันตัดรอบบิลและรอบชำระอัตโนมัติ</p>
        </div>

        <button
          onClick={handleAddNewCard}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มบัตร</span>
        </button>
      </div>

      {/* Empty State when no cards exist */}
      {cards.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-4 my-4">
          <div className="w-16 h-16 rounded-3xl bg-slate-800/80 mx-auto flex items-center justify-center text-indigo-400 shadow-inner">
            <CardIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white">ยังไม่มีข้อมูลบัตรเครดิต</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              เพิ่มบัตรเครดิตของคุณ เช่น KTC, BBL, KBANK หรือบัตรอื่นๆ พร้อมกำหนดวันตัดรอบบิลและวันครบกำหนดชำระ
            </p>
          </div>
          <button
            onClick={handleAddNewCard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ เพิ่มบัตรเครดิตใบแรก</span>
          </button>
        </div>
      ) : (
        <>
          {/* Card Selection Horizontal Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            {cards.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCardId(c.id)}
                className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 transition shrink-0 ${
                  selectedCardId === c.id
                    ? 'bg-slate-800 text-white border border-indigo-500 shadow-md'
                    : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.accentColor }} />
                <span>{c.name}</span>
                <span className="text-[10px] opacity-60 font-mono">••{c.last4}</span>
              </button>
            ))}
          </div>

          {/* Premium Metallic Card Display */}
          {activeCard && (
            <div className="relative">
          <div
            className={`relative rounded-3xl p-6 bg-gradient-to-br ${activeCard.colorGradient} border border-slate-700/60 shadow-2xl text-white overflow-hidden`}
          >
            {/* Background glow effects */}
            <div
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
              style={{ backgroundColor: activeCard.accentColor }}
            />

            {/* Top row: Brand & Edit button */}
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-xs tracking-widest text-slate-300 font-semibold uppercase">
                  {activeCard.networkName}
                </span>
                <h3 className="text-2xl font-extrabold text-white tracking-wide mt-0.5">
                  {activeCard.name}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEditClick(activeCard)}
                  className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/50 backdrop-blur-md transition active:scale-95"
                  title="แก้ไขข้อมูลบัตรและรอบบิล"
                >
                  <Edit2 className="w-4 h-4 text-indigo-300" />
                </button>
              </div>
            </div>

            {/* Chip & Contactless */}
            <div className="my-6 flex items-center gap-4 relative z-10">
              <div className="w-12 h-9 rounded-lg bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 border border-amber-200/50 flex items-center justify-center shadow-md">
                <div className="w-7 h-5 border border-amber-800/40 rounded-sm" />
              </div>
              <Wifi className="w-5 h-5 text-slate-400 rotate-90" />
            </div>

            {/* Masked Card Number */}
            <div className="font-mono text-lg font-bold tracking-widest text-slate-100 relative z-10 mb-4">
              •••• •••• •••• {activeCard.last4}
            </div>

            {/* Bottom Row: Holder & Billing Cycles */}
            <div className="flex items-end justify-between relative z-10 pt-2 border-t border-slate-700/40 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">ผู้ถือบัตร</span>
                <span className="font-semibold text-slate-200 tracking-wide">{activeCard.cardHolder}</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">ตัดรอบ / ครบกำหนด</span>
                <span className="font-bold text-sky-300 font-num">
                  วันที่ {activeCard.cutoffDay} / วันที่ {activeCard.dueDay}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Card Statement Cycle Information */}
      {activeCard && activeSummary && (
        <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              รอบบิลปัจจุบันของ {activeCard.name}
            </h3>

            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                activeSummary.netDue <= 0
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : activeSummary.daysUntilDue <= 3
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {activeSummary.netDue <= 0 ? 'ชำระแล้ว ✓' : `เหลืออีก ${activeSummary.daysUntilDue} วัน`}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">วันตัดรอบบิล</span>
              <span className="text-sm font-bold text-slate-200 font-num">
                {formatThaiDate(activeSummary.cutoffDate)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
              <span className="text-[11px] text-slate-400 block">วันครบกำหนดชำระ</span>
              <span className="text-sm font-bold text-amber-300 font-num">
                {formatThaiDate(activeSummary.dueDate)}
              </span>
            </div>
          </div>

          {/* Balance breakdown */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span>ยอดใช้จ่ายในรอบนี้:</span>
              <span className="font-bold font-num text-white">{formatCurrency(activeSummary.totalSpend)}</span>
            </div>
            {activeSummary.totalRefund > 0 && (
              <div className="flex items-center justify-between text-emerald-400">
                <span>หักยอดเงินคืน:</span>
                <span className="font-bold font-num">-{formatCurrency(activeSummary.totalRefund)}</span>
              </div>
            )}
            {activeSummary.totalPaid > 0 && (
              <div className="flex items-center justify-between text-sky-400">
                <span>ยอดชำระแล้ว:</span>
                <span className="font-bold font-num">-{formatCurrency(activeSummary.totalPaid)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-slate-800/60">
              <span className="text-slate-100">ยอดสุทธิที่ต้องชำระ:</span>
              <span className="text-base font-extrabold font-num text-indigo-300">
                {formatCurrency(activeSummary.netDue)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Card's Transactions History */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-bold text-white">
            ประวัติการใช้บัตร {activeCard?.name} ({cardTransactions.length} รายการ)
          </h3>
        </div>

        <div className="space-y-2">
          {cardTransactions.slice(0, 10).map((tx) => (
            <div
              key={tx.id}
              onClick={() => onSelectTransaction(tx)}
              className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 cursor-pointer transition"
            >
              <div>
                <div className="text-sm font-semibold text-slate-100">{tx.title}</div>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <span>{formatThaiDate(tx.date)}</span>
                  {tx.note && <span className="text-indigo-300">• {tx.note}</span>}
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-sm font-bold font-num ${
                    tx.type === 'ซื้อ'
                      ? 'text-slate-100'
                      : tx.type === 'เงินคืน'
                      ? 'text-emerald-400'
                      : 'text-sky-400'
                  }`}
                >
                  {tx.type === 'เงินคืน' ? '+' : tx.type === 'จ่ายบิล' ? '-' : ''}
                  {formatCurrency(tx.amount)}
                </span>
                <div className="text-[10px] text-slate-500">{tx.category}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {/* Edit modal */}
      <CardEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={onSaveCard}
        onDelete={onDeleteCard}
        card={editingCard}
      />
    </div>
  );
};
