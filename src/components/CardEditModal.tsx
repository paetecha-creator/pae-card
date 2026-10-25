import React, { useState } from 'react';
import { CreditCard } from '../types';
import { X, CreditCard as CardIcon, Calendar, DollarSign, Shield, Trash2 } from 'lucide-react';

interface CardEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: CreditCard) => void;
  onDelete?: (cardId: string) => void;
  card?: CreditCard | null;
}

export const CardEditModal: React.FC<CardEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  card,
}) => {
  const isEditing = Boolean(card);

  const [name, setName] = useState(card?.name || '');
  const [networkName, setNetworkName] = useState(card?.networkName || 'Visa Platinum');
  const [last4, setLast4] = useState(card?.last4 || '1234');
  const [creditLimit, setCreditLimit] = useState(card?.creditLimit?.toString() || '100000');
  const [cutoffDay, setCutoffDay] = useState(card?.cutoffDay || 10);
  const [dueDay, setDueDay] = useState(card?.dueDay || 28);
  const [accentColor, setAccentColor] = useState(card?.accentColor || '#38bdf8');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('กรุณากรอกชื่อบัตร');
      return;
    }

    const payload: CreditCard = {
      id: card?.id || `card-${Date.now().toString(36)}`,
      name: name.trim(),
      cardHolder: card?.cardHolder || 'PAE TECHAPAT',
      last4: last4.trim() || '8888',
      creditLimit: parseFloat(creditLimit) || 100000,
      cutoffDay: Number(cutoffDay) || 10,
      dueDay: Number(dueDay) || 28,
      colorGradient: card?.colorGradient || 'from-indigo-950 via-slate-900 to-blue-950',
      accentColor,
      brand: card?.brand || 'visa',
      networkName: networkName.trim() || 'Credit Card',
    };

    onSave(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">
              {isEditing ? `แก้ไขบัตร ${card?.name}` : 'เพิ่มบัตรเครดิตใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">ชื่อบัตร (เช่น KTC, Lotus, SCB...)</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น KTC, TTB, Bangkok Bank"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">ชื่อทางการของบัตร</label>
            <input
              type="text"
              value={networkName}
              onChange={(e) => setNetworkName(e.target.value)}
              placeholder="เช่น Visa Platinum, World Rewards Mastercard"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">เลขท้าย 4 หลัก</label>
              <input
                type="text"
                maxLength={4}
                value={last4}
                onChange={(e) => setLast4(e.target.value)}
                placeholder="4892"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-mono text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">วงเงินบัตร (บาท)</label>
              <input
                type="number"
                value={creditLimit}
                onChange={(e) => setCreditLimit(e.target.value)}
                placeholder="100000"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-num text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Billing cycle days settings */}
          <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 space-y-3">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span>การตัดรอบบิล & กำหนดชำระอัตโนมัติ</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-indigo-200 mb-1 block">วันตัดรอบบิลของทุกเดือน</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">วันที่</span>
                  <select
                    value={cutoffDay}
                    onChange={(e) => setCutoffDay(Number(e.target.value))}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-sm text-white font-num font-bold border border-slate-700 focus:outline-none"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-indigo-200 mb-1 block">วันครบกำหนดชำระ</label>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">วันที่</span>
                  <select
                    value={dueDay}
                    onChange={(e) => setDueDay(Number(e.target.value))}
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-800 text-sm text-white font-num font-bold border border-slate-700 focus:outline-none"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              *ระบบจะตัดยอดใช้จ่ายที่เกิดขึ้นก่อน/ในวันที่ {cutoffDay} เข้าบิลนี้ และจะแจ้งเตือนเมื่อใกล้ถึงวันที่ {dueDay}
            </p>
          </div>

          {/* Color theme */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">สีธีมบัตร</label>
            <div className="flex items-center gap-3">
              {['#38bdf8', '#34d399', '#0ea5e9', '#60a5fa', '#f97316', '#c084fc', '#f43f5e', '#fbbf24'].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setAccentColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition ${
                      accentColor === c ? 'border-white scale-110 shadow-lg' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                )
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-95 transition mt-2"
          >
            {isEditing ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูลบัตร'}
          </button>

          {isEditing && onDelete && card && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`ต้องการลบบัตร "${card.name}" ออกจากระบบใช่หรือไม่?`)) {
                  onDelete(card.id);
                  onClose();
                }
              }}
              className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>ลบบัตรนี้</span>
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
