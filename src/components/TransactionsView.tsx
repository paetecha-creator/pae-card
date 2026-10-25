import React, { useState, useMemo, useRef } from 'react';
import { CreditCard, Transaction, TransactionType } from '../types';
import { formatCurrency, formatThaiDate } from '../utils/billingEngine';
import { exportTransactionsToExcel, parseTransactionsFromExcelFile } from '../utils/excelUtils';
import {
  Search,
  Filter,
  Plus,
  FileSpreadsheet,
  Upload,
  Edit2,
  Calendar,
  CreditCard as CardIcon,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  FileUp,
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  cards: CreditCard[];
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onImportTransactions: (imported: Transaction[]) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  cards,
  onOpenAddModal,
  onEditTransaction,
  onImportTransactions,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL'); // YYYY-MM or ALL

  // File upload input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Import states
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [importNotice, setImportNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    transactions: Transaction[];
    count: number;
    filename: string;
  } | null>(null);

  // Extract available months from data
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    for (const t of transactions) {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.slice(0, 7));
      }
    }
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesNote = t.note.toLowerCase().includes(q);
        const matchesCard = t.card.toLowerCase().includes(q);
        const matchesCategory = t.category.toLowerCase().includes(q);
        const matchesAmount = t.amount.toString().includes(q);
        if (!matchesTitle && !matchesNote && !matchesCard && !matchesCategory && !matchesAmount) {
          return false;
        }
      }

      // Card filter
      if (selectedCard !== 'ALL' && t.card.toLowerCase() !== selectedCard.toLowerCase()) {
        return false;
      }

      // Type filter
      if (selectedType === 'INSTALLMENT') {
        if (!t.installment && !t.note.match(/\d+\/\d+/)) return false;
      } else if (selectedType !== 'ALL' && t.type !== selectedType) {
        return false;
      }

      // Month filter
      if (selectedMonth !== 'ALL' && !t.date.startsWith(selectedMonth)) {
        return false;
      }

      return true;
    });
  }, [transactions, searchTerm, selectedCard, selectedType, selectedMonth]);

  // Totals for filtered view
  const { totalSpend, totalRefund, totalBill } = useMemo(() => {
    let spend = 0;
    let refund = 0;
    let bill = 0;
    for (const t of filteredTransactions) {
      if (t.type === 'ซื้อ') spend += t.amount;
      else if (t.type === 'เงินคืน') refund += t.amount;
      else if (t.type === 'จ่ายบิล') bill += t.amount;
    }
    return { totalSpend: spend, totalRefund: refund, totalBill: bill };
  }, [filteredTransactions]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    // Export either filtered transactions or all transactions
    const listToExport = filteredTransactions.length > 0 ? filteredTransactions : transactions;
    const today = new Date().toISOString().slice(0, 10);
    const fileName = `PaeCard_รายการ_${today}.xlsx`;
    exportTransactionsToExcel(listToExport, fileName);
  };

  // Trigger file input click
  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Handle Excel File Selected
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setImportNotice(null);

    try {
      const result = await parseTransactionsFromExcelFile(file);
      if (result.success && result.transactions) {
        // Show confirmation modal to overwrite
        setPendingImport({
          transactions: result.transactions,
          count: result.count || result.transactions.length,
          filename: file.name,
        });
      } else {
        setImportNotice({
          type: 'error',
          message: result.message || 'ไม่สามารถอ่านไฟล์ Excel ได้',
        });
      }
    } catch (err) {
      setImportNotice({
        type: 'error',
        message: 'เกิดข้อผิดพลาดในการประมวลผลไฟล์: ' + (err instanceof Error ? err.message : 'Unknown error'),
      });
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Confirm Import Overwrite
  const handleConfirmOverwrite = () => {
    if (!pendingImport) return;

    onImportTransactions(pendingImport.transactions);
    setImportNotice({
      type: 'success',
      message: `นำเข้าไฟล์ Excel สำเร็จ! บันทึกทับข้อมูลเดิมเรียบร้อยแล้ว (${pendingImport.count} รายการ)`,
    });
    setPendingImport(null);

    // Auto clear notification after 5 seconds
    setTimeout(() => {
      setImportNotice(null);
    }, 5000);
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Hidden File Input for Excel Import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        className="hidden"
      />

      {/* Top Title & Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">ประวัติรายการ</h1>
          <p className="text-xs text-slate-400">
            ทั้งหมด {transactions.length} รายการ (พบ {filteredTransactions.length} รายการ)
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มรายการ</span>
        </button>
      </div>


      {/* Import Notification Toast */}
      {importNotice && (
        <div
          className={`flex items-start justify-between p-3 rounded-2xl border text-xs transition ${
            importNotice.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-start gap-2">
            {importNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <span>{importNotice.message}</span>
          </div>
          <button
            onClick={() => setImportNotice(null)}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="ค้นหาตามร้านค้า, หมายเหตุ, หมวดหมู่, ยอด..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
          >
            ล้าง
          </button>
        )}
      </div>

      {/* Filter Chips: Card */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setSelectedCard('ALL')}
          className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
            selectedCard === 'ALL'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          บัตรทั้งหมด
        </button>
        {cards.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCard(c.name)}
            className={`px-3 py-1.5 rounded-full font-medium whitespace-nowrap transition ${
              selectedCard === c.name
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Filter Chips: Type */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {[
          { id: 'ALL', label: 'ทุกประเภท' },
          { id: 'ซื้อ', label: '💳 ยอดใช้จ่าย' },
          { id: 'INSTALLMENT', label: '⏱️ รายการผ่อน' },
          { id: 'เงินคืน', label: '🎁 เงินคืน' },
          { id: 'จ่ายบิล', label: '🧾 ชำระบิล' },
        ].map((typeItem) => (
          <button
            key={typeItem.id}
            onClick={() => setSelectedType(typeItem.id)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              selectedType === typeItem.id
                ? 'bg-slate-800 text-sky-300 border border-sky-500/40'
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80'
            }`}
          >
            {typeItem.label}
          </button>
        ))}

        {/* Month Dropdown selector */}
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="ml-auto px-2 py-1 rounded-lg bg-slate-900 text-xs text-slate-300 border border-slate-800 focus:outline-none"
        >
          <option value="ALL">ทุกเดือน</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Filter Summary Banner */}
      <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
        <div>
          <span className="text-slate-400 block text-[10px]">ใช้จ่ายรวม</span>
          <span className="font-bold font-num text-rose-400">{formatCurrency(totalSpend)}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">เงินคืนรวม</span>
          <span className="font-bold font-num text-emerald-400">+{formatCurrency(totalRefund)}</span>
        </div>
        <div>
          <span className="text-slate-400 block text-[10px]">ชำระบิลแล้ว</span>
          <span className="font-bold font-num text-sky-400">{formatCurrency(totalBill)}</span>
        </div>
      </div>

      {/* Transaction Items List */}
      <div className="space-y-2">
        {filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              onClick={() => onEditTransaction(tx)}
              className="group p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 cursor-pointer transition shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {/* Badge */}
                  <div
                    className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      tx.type === 'ซื้อ'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                        : tx.type === 'เงินคืน'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        : 'bg-sky-500/15 text-sky-400 border border-sky-500/20'
                    }`}
                  >
                    {tx.type === 'ซื้อ' ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : tx.type === 'เงินคืน' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                  </div>

                  {/* Title & Metadata */}
                  <div>
                    <div className="text-sm font-bold text-white group-hover:text-indigo-300 transition">
                      {tx.title}
                    </div>

                    <div className="flex items-center flex-wrap gap-1.5 mt-1 text-xs text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                        {tx.card}
                      </span>
                      <span>•</span>
                      <span>{formatThaiDate(tx.date)}</span>
                      {tx.category && (
                        <>
                          <span>•</span>
                          <span className="text-slate-400">{tx.category}</span>
                        </>
                      )}
                    </div>

                    {tx.note && (
                      <div className="text-xs text-indigo-300/90 mt-1 font-medium">
                        📝 {tx.note}
                      </div>
                    )}
                  </div>
                </div>

                {/* Amount & Edit Trigger */}
                <div className="text-right shrink-0">
                  <div
                    className={`text-base font-extrabold font-num ${
                      tx.type === 'ซื้อ'
                        ? 'text-slate-100'
                        : tx.type === 'เงินคืน'
                        ? 'text-emerald-400'
                        : 'text-sky-400'
                    }`}
                  >
                    {tx.type === 'เงินคืน' ? '+' : tx.type === 'จ่ายบิล' ? '-' : ''}
                    {formatCurrency(tx.amount)}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-[11px] text-slate-500 mt-1">
                    <Edit2 className="w-3 h-3 group-hover:text-indigo-400 transition" />
                    <span className="group-hover:text-slate-300 transition">แตะเพื่อแก้ไข</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Confirmation Modal: Import & Overwrite */}
      {pendingImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">ยืนยันนำเข้าทับข้อมูลเดิม</h3>
                <p className="text-xs text-slate-400">{pendingImport.filename}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">จำนวนรายการในไฟล์:</span>
                <span className="font-bold font-num text-white text-sm">
                  {pendingImport.count} รายการ
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">รายการเดิมในระบบ:</span>
                <span className="font-num text-slate-400">
                  {transactions.length} รายการ
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300/90 leading-relaxed">
                ⚠️ ข้อมูลรายการทั้งหมดในระบบจะถูก <strong>แทนที่/บันทึกทับ</strong> ด้วยข้อมูลจากไฟล์ Excel นี้
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setPendingImport(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                ยกเลิก
              </button>

              <button
                onClick={handleConfirmOverwrite}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 transition active:scale-95"
              >
                ยืนยันบันทึกทับ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
