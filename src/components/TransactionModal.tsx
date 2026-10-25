import React, { useState, useEffect } from 'react';
import { CreditCard, Transaction, TransactionType } from '../types';
import { inferCategory, extractInstallmentMeta } from '../data/seedData';
import { X, Calendar, DollarSign, Tag, CreditCard as CardIcon, FileText, CheckCircle2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<Transaction>, isInstallmentPlan?: boolean, planMonths?: number) => void;
  onDelete?: (id: string) => void;
  initialTransaction?: Transaction | null;
  defaultType?: TransactionType;
  cards: CreditCard[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTransaction,
  defaultType = 'ซื้อ',
  cards,
}) => {
  const isEditing = Boolean(initialTransaction);

  const [date, setDate] = useState(
    initialTransaction?.date || new Date().toISOString().split('T')[0]
  );
  const [card, setCard] = useState(
    initialTransaction?.card || (cards.length > 0 ? cards[0].name : 'KTC')
  );
  const [type, setType] = useState<TransactionType>(
    initialTransaction?.type || defaultType
  );
  const [title, setTitle] = useState(initialTransaction?.title || '');
  const [amount, setAmount] = useState<string>(
    initialTransaction ? initialTransaction.amount.toString() : ''
  );
  const [note, setNote] = useState(initialTransaction?.note || '');
  const [category, setCategory] = useState(
    initialTransaction?.category || 'ช้อปปิ้งทั่วไป'
  );

  // Installment plan options for new transactions
  const [isInstallmentPlan, setIsInstallmentPlan] = useState(false);
  const [planMonths, setPlanMonths] = useState(10);
  const [monthlyOrTotal, setMonthlyOrTotal] = useState<'monthly' | 'total'>('monthly');

  useEffect(() => {
    if (initialTransaction) {
      setDate(initialTransaction.date);
      setCard(initialTransaction.card);
      setType(initialTransaction.type);
      setTitle(initialTransaction.title);
      setAmount(initialTransaction.amount.toString());
      setNote(initialTransaction.note);
      setCategory(initialTransaction.category);
      setIsInstallmentPlan(false);
    } else {
      setDate(new Date().toISOString().split('T')[0]);
      setType(defaultType);
      setTitle('');
      setAmount('');
      setNote('');
      setCategory(defaultType === 'จ่ายบิล' ? 'ชำระบิลบัตร' : defaultType === 'เงินคืน' ? 'เงินคืน/Cashback' : 'ช้อปปิ้งทั่วไป');
      setIsInstallmentPlan(false);
      if (cards.length > 0) setCard(cards[0].name);
    }
  }, [initialTransaction, defaultType, cards, isOpen]);

  // Auto infer category on title change
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing || category === 'ช้อปปิ้งทั่วไป') {
      const inferred = inferCategory(val, note, type);
      setCategory(inferred);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('กรุณากรอกจำนวนเงินให้ถูกต้อง');
      return;
    }
    if (!title.trim()) {
      alert('กรุณากรอกชื่อรายการ/ร้านค้า');
      return;
    }

    let calculatedAmount = numAmount;
    if (!isEditing && isInstallmentPlan && monthlyOrTotal === 'total') {
      calculatedAmount = Number((numAmount / planMonths).toFixed(2));
    }

    const payload: Partial<Transaction> = {
      ...(initialTransaction || {}),
      date,
      card,
      type,
      title: title.trim(),
      amount: calculatedAmount,
      note: note.trim(),
      category: category.trim() || 'ช้อปปิ้งทั่วไป',
      updatedAt: Date.now(),
    };

    if (!isEditing && isInstallmentPlan) {
      payload.installment = {
        current: 1,
        total: planMonths,
        planName: title.trim(),
      };
      payload.note = `${note ? note + ' ' : ''}(ผ่อน 1/${planMonths})`;
      onSave(payload, true, planMonths);
    } else {
      const meta = extractInstallmentMeta(note, title);
      if (meta) {
        payload.installment = meta;
      }
      onSave(payload, false);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                type === 'ซื้อ'
                  ? 'bg-rose-500/20 text-rose-400'
                  : type === 'เงินคืน'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-sky-500/20 text-sky-400'
              }`}
            >
              {type === 'ซื้อ' ? 'ซื้อ' : type === 'เงินคืน' ? 'คืน' : 'บิล'}
            </div>
            <h3 className="font-bold text-white text-base">
              {isEditing ? 'แก้ไขรายการ' : 'บันทึกรายการใหม่'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Type Toggle */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">ประเภทรายการ</label>
            <div className="grid grid-cols-3 gap-2">
              {(['ซื้อ', 'เงินคืน', 'จ่ายบิล'] as TransactionType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    if (t === 'จ่ายบิล') setCategory('ชำระบิลบัตร');
                    else if (t === 'เงินคืน') setCategory('เงินคืน/Cashback');
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold border transition ${
                    type === t
                      ? t === 'ซื้อ'
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : t === 'เงินคืน'
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-sky-500/20 border-sky-500/40 text-sky-300'
                      : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {t === 'ซื้อ' ? '💳 บันทึกใช้จ่าย' : t === 'เงินคืน' ? '🎁 เงินคืน/Cashback' : '🧾 ชำระบิลบัตร'}
                </button>
              ))}
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">จำนวนเงิน (บาท)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white font-num font-bold text-lg focus:outline-none focus:border-indigo-500"
                />
                <span className="absolute right-3 top-3 text-xs text-slate-400 font-num">฿</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">วันที่ทำรายการ</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Card Selection */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1.5 block">บัตรเครดิตที่ใช้</label>
            {cards.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {cards.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCard(c.name)}
                    className={`p-2 rounded-xl text-xs font-medium border text-left flex items-center justify-between transition ${
                      card.toLowerCase() === c.name.toLowerCase()
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[10px] opacity-60">••{c.last4}</span>
                  </button>
                ))}
              </div>
            ) : (
              <input
                type="text"
                placeholder="ระบุชื่อบัตร (เช่น KTC, BBL, KBANK...)"
                value={card}
                onChange={(e) => setCard(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
              />
            )}
          </div>

          {/* Item / Merchant Title */}
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">รายการ / ร้านค้า</label>
            <input
              type="text"
              required
              placeholder="เช่น เติมน้ำมันบางจาก, Youtube Premium, เครื่องซักผ้า..."
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category & Note */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">หมวดหมู่ค่าใช้จ่าย</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value="ช้อปปิ้งทั่วไป">ช้อปปิ้งทั่วไป</option>
                <option value="ยานยนต์และน้ำมัน">ยานยนต์และน้ำมัน</option>
                <option value="สาธารณูปโภค & สื่อสาร">สาธารณูปโภค & สื่อสาร</option>
                <option value="อาหารและเครื่องดื่ม">อาหารและเครื่องดื่ม</option>
                <option value="ความบันเทิง & บริการดิจิทัล">ความบันเทิง & สตรีมมิ่ง</option>
                <option value="เครื่องใช้ไฟฟ้า & ของแต่งบ้าน">เครื่องใช้ไฟฟ้า & บ้าน</option>
                <option value="ไอที & อุปกรณ์เสริม">ไอที & อุปกรณ์เสริม</option>
                <option value="สัตว์เลี้ยงแสนรัก">สัตว์เลี้ยงแสนรัก</option>
                <option value="ทองคำ & ทรัพย์สิน">ทองคำ & ทรัพย์สิน</option>
                <option value="สุขภาพ & สกินแคร์">สุขภาพ & สกินแคร์</option>
                <option value="ประกันภัย">ประกันภัย</option>
                <option value="ชำระบิลบัตร">ชำระบิลบัตร</option>
                <option value="เงินคืน/Cashback">เงินคืน/Cashback</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">หมายเหตุ (ถ้ามี)</label>
              <input
                type="text"
                placeholder="เช่น Shopee, 8/10, ผ่อน 0%..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* New Installment Plan Toggle (Only for new purchase items) */}
          {!isEditing && type === 'ซื้อ' && (
            <div className="p-3 rounded-2xl bg-indigo-950/40 border border-indigo-900/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">ต้องการสร้างเป็นตารางผ่อนชำระ?</span>
                </div>
                <input
                  type="checkbox"
                  checked={isInstallmentPlan}
                  onChange={(e) => setIsInstallmentPlan(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-500 cursor-pointer"
                />
              </div>

              {isInstallmentPlan && (
                <div className="space-y-2 pt-2 border-t border-indigo-900/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-indigo-200">จำนวนงวดผ่อนชำระ:</span>
                    <select
                      value={planMonths}
                      onChange={(e) => setPlanMonths(Number(e.target.value))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs text-white border border-slate-700 font-num"
                    >
                      {[3, 4, 5, 6, 10, 12, 18, 24, 36].map((m) => (
                        <option key={m} value={m}>
                          {m} งวด ({m} เดือน)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="planType"
                        checked={monthlyOrTotal === 'monthly'}
                        onChange={() => setMonthlyOrTotal('monthly')}
                        className="accent-indigo-500"
                      />
                      <span>ยอดที่ระบุคืองวดละ</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="planType"
                        checked={monthlyOrTotal === 'total'}
                        onChange={() => setMonthlyOrTotal('total')}
                        className="accent-indigo-500"
                      />
                      <span>ยอดที่ระบุคือยอดเต็มทั้งหมด</span>
                    </label>
                  </div>
                  <p className="text-[11px] text-indigo-300">
                    *ระบบจะสร้างรายการผ่อนงวดที่ 1 และเพิ่มเข้าสู่ระบบติดตามแผนผ่อนชำระให้อัตโนมัติ
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2 pt-2">
            {isEditing && onDelete && initialTransaction && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
                    onDelete(initialTransaction.id);
                    onClose();
                  }
                }}
                className="px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition"
              >
                ลบรายการ
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 active:scale-95 transition"
            >
              {isEditing ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
