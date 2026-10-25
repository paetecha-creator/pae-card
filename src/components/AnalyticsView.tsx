import React, { useState, useMemo } from 'react';
import { BudgetSettings, CreditCard, Transaction } from '../types';
import { formatCurrency } from '../utils/billingEngine';
import {
  PieChart as ChartIcon,
  TrendingUp,
  TrendingDown,
  CreditCard as CardIcon,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  GitCompare,
  Target,
  Lightbulb,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  DollarSign,
  ArrowRight,
  Sliders,
  Edit3,
} from 'lucide-react';

interface AnalyticsViewProps {
  transactions: Transaction[];
  cards: CreditCard[];
  budgetSettings: BudgetSettings;
  onUpdateBudget: (budget: BudgetSettings) => void;
}

type AnalyticsSubTab = 'COMPARISON' | 'BUDGET' | 'TRENDS';

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  transactions,
  cards,
  budgetSettings,
  onUpdateBudget,
}) => {
  const [activeTab, setActiveTab] = useState<AnalyticsSubTab>('COMPARISON');
  const [viewMode, setViewMode] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedYear, setSelectedYear] = useState<string>('2026');

  // Month-over-Month comparison selection
  const [baseMonth, setBaseMonth] = useState<string>('2026-10');
  const [compareMonth, setCompareMonth] = useState<string>('2026-09');

  // Year-over-Year comparison selection
  const [baseYear, setBaseYear] = useState<string>('2027');
  const [compareYear, setCompareYear] = useState<string>('2026');

  // Budget editing state
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudgetInput, setNewBudgetInput] = useState(budgetSettings.monthlyBudget.toString());

  // Available unique months in transactions sorted descending
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    for (const t of transactions) {
      if (t.date && t.date.length >= 7) {
        months.add(t.date.slice(0, 7));
      }
    }
    return Array.from(months).sort().reverse();
  }, [transactions]);

  // Available unique years in transactions sorted descending
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    for (const t of transactions) {
      if (t.date && t.date.length >= 4) {
        years.add(t.date.slice(0, 4));
      }
    }
    return Array.from(years).sort().reverse();
  }, [transactions]);

  // Monthly aggregation
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { spend: number; refund: number; bill: number; count: number }>();

    for (const t of transactions) {
      if (!t.date || t.date.length < 7) continue;
      const mKey = t.date.slice(0, 7);

      if (!monthMap.has(mKey)) {
        monthMap.set(mKey, { spend: 0, refund: 0, bill: 0, count: 0 });
      }
      const item = monthMap.get(mKey)!;
      if (t.type === 'ซื้อ') {
        item.spend += t.amount;
        item.count += 1;
      } else if (t.type === 'เงินคืน') {
        item.refund += t.amount;
      } else if (t.type === 'จ่ายบิล') {
        item.bill += t.amount;
      }
    }

    const sortedKeys = Array.from(monthMap.keys()).sort();
    return sortedKeys.map((key) => {
      const data = monthMap.get(key)!;
      return {
        month: key,
        ...data,
        net: data.spend - data.refund,
      };
    });
  }, [transactions]);

  // Calculate historical monthly average spend
  const historicalAvgSpend = useMemo(() => {
    const validMonths = monthlyData.filter((m) => m.spend > 0);
    if (validMonths.length === 0) return 0;
    const total = validMonths.reduce((acc, m) => acc + m.spend, 0);
    return Math.round(total / validMonths.length);
  }, [monthlyData]);

  // High & Low spend months
  const { highestMonth, lowestMonth } = useMemo(() => {
    const validMonths = monthlyData.filter((m) => m.spend > 0);
    if (validMonths.length === 0) return { highestMonth: null, lowestMonth: null };
    let high = validMonths[0];
    let low = validMonths[0];
    for (const m of validMonths) {
      if (m.spend > high.spend) high = m;
      if (m.spend < low.spend) low = m;
    }
    return { highestMonth: high, lowestMonth: low };
  }, [monthlyData]);

  // Data for base month & compare month in MoM
  const baseMonthData = useMemo(() => {
    const found = monthlyData.find((m) => m.month === baseMonth);
    return found || { month: baseMonth, spend: 0, refund: 0, bill: 0, net: 0, count: 0 };
  }, [monthlyData, baseMonth]);

  const compareMonthData = useMemo(() => {
    const found = monthlyData.find((m) => m.month === compareMonth);
    return found || { month: compareMonth, spend: 0, refund: 0, bill: 0, net: 0, count: 0 };
  }, [monthlyData, compareMonth]);

  // MoM Delta calculation
  const momDelta = useMemo(() => {
    const diff = baseMonthData.spend - compareMonthData.spend;
    const pct = compareMonthData.spend > 0 ? (diff / compareMonthData.spend) * 100 : 0;
    return {
      diff,
      percentage: pct,
      isIncrease: diff > 0,
      isDecrease: diff < 0,
      isEqual: diff === 0,
    };
  }, [baseMonthData, compareMonthData]);

  // Category breakdown for MoM Comparison
  const momCategoryComparison = useMemo(() => {
    const baseMap = new Map<string, number>();
    const compareMap = new Map<string, number>();
    const allCategories = new Set<string>();

    for (const t of transactions) {
      if (t.type !== 'ซื้อ') continue;
      const month = t.date.slice(0, 7);
      const cat = t.category || 'อื่นๆ';

      if (month === baseMonth) {
        baseMap.set(cat, (baseMap.get(cat) || 0) + t.amount);
        allCategories.add(cat);
      } else if (month === compareMonth) {
        compareMap.set(cat, (compareMap.get(cat) || 0) + t.amount);
        allCategories.add(cat);
      }
    }

    return Array.from(allCategories)
      .map((cat) => {
        const baseSpend = baseMap.get(cat) || 0;
        const compareSpend = compareMap.get(cat) || 0;
        const diff = baseSpend - compareSpend;
        const pct = compareSpend > 0 ? (diff / compareSpend) * 100 : baseSpend > 0 ? 100 : 0;
        return {
          category: cat,
          baseSpend,
          compareSpend,
          diff,
          percentage: pct,
        };
      })
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }, [transactions, baseMonth, compareMonth]);

  // Card breakdown for MoM Comparison
  const momCardComparison = useMemo(() => {
    const baseMap = new Map<string, number>();
    const compareMap = new Map<string, number>();
    const allCards = new Set<string>();

    for (const t of transactions) {
      if (t.type !== 'ซื้อ') continue;
      const month = t.date.slice(0, 7);
      const cardName = t.card;

      if (month === baseMonth) {
        baseMap.set(cardName, (baseMap.get(cardName) || 0) + t.amount);
        allCards.add(cardName);
      } else if (month === compareMonth) {
        compareMap.set(cardName, (compareMap.get(cardName) || 0) + t.amount);
        allCards.add(cardName);
      }
    }

    return Array.from(allCards)
      .map((cardName) => {
        const baseSpend = baseMap.get(cardName) || 0;
        const compareSpend = compareMap.get(cardName) || 0;
        const diff = baseSpend - compareSpend;
        const pct = compareSpend > 0 ? (diff / compareSpend) * 100 : baseSpend > 0 ? 100 : 0;
        const cardObj = cards.find((c) => c.name.toLowerCase() === cardName.toLowerCase());
        return {
          cardName,
          baseSpend,
          compareSpend,
          diff,
          percentage: pct,
          color: cardObj?.accentColor || '#6366f1',
        };
      })
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
  }, [transactions, baseMonth, compareMonth, cards]);

  // Year-over-Year comparison data
  const yoyData = useMemo(() => {
    const getYearData = (y: string) => {
      let spend = 0;
      let refund = 0;
      let bill = 0;
      let txCount = 0;
      for (const t of transactions) {
        if (t.date.startsWith(y)) {
          if (t.type === 'ซื้อ') {
            spend += t.amount;
            txCount += 1;
          } else if (t.type === 'เงินคืน') {
            refund += t.amount;
          } else if (t.type === 'จ่ายบิล') {
            bill += t.amount;
          }
        }
      }
      return { year: y, spend, refund, bill, count: txCount, net: spend - refund };
    };

    const base = getYearData(baseYear);
    const compare = getYearData(compareYear);
    const diff = base.spend - compare.spend;
    const pct = compare.spend > 0 ? (diff / compare.spend) * 100 : 0;

    return {
      base,
      compare,
      diff,
      percentage: pct,
    };
  }, [transactions, baseYear, compareYear]);

  // Budget Analysis for baseMonth
  const budgetAnalysis = useMemo(() => {
    const currentMonthSpend = baseMonthData.spend;
    const budget = budgetSettings.monthlyBudget;
    const diff = budget - currentMonthSpend;
    const percentUsed = budget > 0 ? (currentMonthSpend / budget) * 100 : 0;
    const isOver = diff < 0;

    // Compare with historical average
    const diffFromAvg = currentMonthSpend - historicalAvgSpend;
    const pctFromAvg = historicalAvgSpend > 0 ? (diffFromAvg / historicalAvgSpend) * 100 : 0;

    return {
      budget,
      spend: currentMonthSpend,
      remaining: Math.max(0, diff),
      overAmount: isOver ? Math.abs(diff) : 0,
      percentUsed,
      isOver,
      diffFromAvg,
      pctFromAvg,
      isHigherThanAvg: diffFromAvg > 0,
    };
  }, [baseMonthData, budgetSettings, historicalAvgSpend]);

  // Potential savings opportunities
  const savingsInsights = useMemo(() => {
    const list: { title: string; desc: string; type: 'saving' | 'warning' | 'info'; amount?: number }[] = [];

    // Check top category increase in baseMonth vs compareMonth
    const topIncrease = momCategoryComparison.find((c) => c.diff > 1000);
    if (topIncrease) {
      list.push({
        title: `ค่าใช้จ่ายหมวด "${topIncrease.category}" เพิ่มขึ้นสูงสุด`,
        desc: `เพิ่มขึ้น ${formatCurrency(topIncrease.diff)} (+${topIncrease.percentage.toFixed(0)}%) เมื่อเทียบกับเดือนก่อน ลองพิจารณาชะลอการซื้อในหมวดนี้`,
        type: 'warning',
        amount: topIncrease.diff,
      });
    }

    // Check category decrease (Savings achieved!)
    const topDecrease = momCategoryComparison.find((c) => c.diff < -500);
    if (topDecrease) {
      list.push({
        title: `ยอดเยี่ยม! ประหยัดค่าใช้จ่ายหมวด "${topDecrease.category}"`,
        desc: `ลดลงได้ ${formatCurrency(Math.abs(topDecrease.diff))} (-${Math.abs(topDecrease.percentage).toFixed(0)}%) เมื่อเทียบกับเดือนก่อน`,
        type: 'saving',
        amount: Math.abs(topDecrease.diff),
      });
    }

    // Fixed recurring bills in baseMonth
    const fixedBills = transactions.filter((t) => {
      return (
        t.date.startsWith(baseMonth) &&
        (t.title.toLowerCase().includes('youtube') ||
          t.title.toLowerCase().includes('3bb') ||
          t.title.toLowerCase().includes('ais') ||
          t.title.toLowerCase().includes('ทรู') ||
          t.title.toLowerCase().includes('ดีแทค') ||
          t.title.toLowerCase().includes('ค่าไฟ'))
      );
    });
    const totalFixed = fixedBills.reduce((acc, t) => acc + t.amount, 0);
    if (totalFixed > 0) {
      list.push({
        title: `ภาระค่าบริการคงที่รายเดือน (Subscriptions & Utilities)`,
        desc: `มียอดค่าบริการประจำรวม ${formatCurrency(totalFixed)} (${fixedBills.length} รายการ) เช่น สตรีมมิ่ง, ค่าเน็ต, ค่าไฟ`,
        type: 'info',
        amount: totalFixed,
      });
    }

    // Cashbacks efficiency
    if (baseMonthData.refund > 0) {
      const refundRate = (baseMonthData.refund / baseMonthData.spend) * 100;
      list.push({
        title: `ได้รับเงินคืน/Cashback รวม ${formatCurrency(baseMonthData.refund)}`,
        desc: `คิดเป็น ${refundRate.toFixed(1)}% ของยอดใช้จ่าย ช่วยลดภาระค่าใช้จ่ายสุทธิได้อย่างมีประสิทธิภาพ`,
        type: 'saving',
        amount: baseMonthData.refund,
      });
    }

    return list;
  }, [momCategoryComparison, transactions, baseMonth, baseMonthData]);

  // Handle Budget Save
  const handleSaveBudget = () => {
    const val = parseFloat(newBudgetInput);
    if (!isNaN(val) && val > 0) {
      onUpdateBudget({ ...budgetSettings, monthlyBudget: val });
      setIsEditingBudget(false);
    }
  };

  return (
    <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-4">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ChartIcon className="w-5 h-5 text-indigo-400" />
          วิเคราะห์และเปรียบเทียบค่าใช้จ่าย
        </h1>
        <p className="text-xs text-slate-400">
          เปรียบเทียบข้ามช่วงเวลา เดือนต่อเดือน ปีต่อปี และเทียบเป้าหมายงบประมาณ
        </p>
      </div>

      {/* Top Feature Mode Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('COMPARISON')}
          className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition ${
            activeTab === 'COMPARISON'
              ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          <span>เปรียบเทียบรอบ</span>
        </button>

        <button
          onClick={() => setActiveTab('BUDGET')}
          className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition ${
            activeTab === 'BUDGET'
              ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>งบ & ค่าเฉลี่ย</span>
        </button>

        <button
          onClick={() => setActiveTab('TRENDS')}
          className={`py-2 rounded-xl font-semibold flex items-center justify-center gap-1 transition ${
            activeTab === 'TRENDS'
              ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>ภาพรวมสัดส่วน</span>
        </button>
      </div>

      {/* Empty State Banner if no transactions recorded yet */}
      {transactions.length === 0 && (
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 text-center space-y-2.5 shadow-md">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <ChartIcon className="w-5 h-5" />
          </div>
          <div className="text-sm font-bold text-white">ยังไม่มีรายการสำหรับวิเคราะห์เปรียบเทียบ</div>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            เมื่อคุณเริ่มบันทึกรายการใช้จ่ายผ่านบัตร หรือนำเข้าไฟล์ Excel (.xlsx) ระบบจะประมวลผลการเปรียบเทียบ MoM, YoY, สัดส่วนหมวดหมู่ และติดตามงบประมาณให้อัตโนมัติทันที
          </p>
        </div>
      )}

      {/* TAB 1: PERIOD COMPARISON (MoM & YoY) */}
      {activeTab === 'COMPARISON' && (
        <div className="space-y-4">
          {/* Sub-toggle: MoM vs YoY */}
          <div className="flex items-center justify-between p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 pl-2 font-medium">รูปแบบการเปรียบเทียบ:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('MONTHLY')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  viewMode === 'MONTHLY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                เดือนต่อเดือน (MoM)
              </button>
              <button
                onClick={() => setViewMode('YEARLY')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  viewMode === 'YEARLY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                ปีต่อปี (YoY)
              </button>
            </div>
          </div>

          {/* Month-over-Month Mode */}
          {viewMode === 'MONTHLY' && (
            <div className="space-y-4">
              {/* Selectors for Base and Compare Month */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>เลือก 2 ช่วงเดือนที่ต้องการเปรียบเทียบ</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-indigo-300 block mb-1 font-medium">
                      เดือนหลัก (ปัจจุบัน)
                    </label>
                    <select
                      value={baseMonth}
                      onChange={(e) => setBaseMonth(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-num font-bold border border-indigo-500/50 focus:outline-none"
                    >
                      {availableMonths.length === 0 ? (
                        <option value="">- ยังไม่มีข้อมูล -</option>
                      ) : (
                        availableMonths.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-medium">
                      เดือนที่เปรียบเทียบ
                    </label>
                    <select
                      value={compareMonth}
                      onChange={(e) => setCompareMonth(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-num font-bold border border-slate-700 focus:outline-none"
                    >
                      {availableMonths.length === 0 ? (
                        <option value="">- ยังไม่มีข้อมูล -</option>
                      ) : (
                        availableMonths.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* MoM Delta Summary Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-300 font-medium">ผลต่างยอดใช้จ่าย (MoM Delta)</span>
                  <span className="text-[10px] text-slate-400 font-num">
                    {baseMonth} vs {compareMonth}
                  </span>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-num text-white">
                    {formatCurrency(Math.abs(momDelta.diff))}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      momDelta.isIncrease
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : momDelta.isDecrease
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {momDelta.isIncrease ? (
                      <>
                        <TrendingUp className="w-3.5 h-3.5" /> +{momDelta.percentage.toFixed(1)}% (จ่ายเพิ่มขึ้น)
                      </>
                    ) : momDelta.isDecrease ? (
                      <>
                        <TrendingDown className="w-3.5 h-3.5" /> {momDelta.percentage.toFixed(1)}% (ประหยัดได้)
                      </>
                    ) : (
                      'เท่ากัน'
                    )}
                  </span>
                </div>

                {/* Side-by-side Visual Bars */}
                <div className="space-y-3 pt-3 border-t border-slate-800/80">
                  {/* Base Month Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                        {baseMonth} (เดือนหลัก)
                      </span>
                      <span className="font-bold font-num text-white">
                        {formatCurrency(baseMonthData.spend)}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-sky-400 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (baseMonthData.spend / Math.max(baseMonthData.spend, compareMonthData.spend, 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Compare Month Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                        {compareMonth} (เดือนเปรียบเทียบ)
                      </span>
                      <span className="font-bold font-num text-slate-300">
                        {formatCurrency(compareMonthData.spend)}
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-slate-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            100,
                            (compareMonthData.spend / Math.max(baseMonthData.spend, compareMonthData.spend, 1)) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Cash flow comparison strip */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60 text-xs text-slate-400">
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] block">เงินคืน ({baseMonth}):</span>
                    <span className="font-bold font-num text-emerald-400">+{formatCurrency(baseMonthData.refund)}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] block">เงินคืน ({compareMonth}):</span>
                    <span className="font-bold font-num text-emerald-400">+{formatCurrency(compareMonthData.refund)}</span>
                  </div>
                </div>
              </div>

              {/* Category-by-Category MoM Shifts */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <span>การเปลี่ยนแปลงแยกตามหมวดหมู่</span>
                  </h3>
                  <span className="text-[10px] text-slate-400">เรียงตามยอดผลต่าง</span>
                </div>

                <div className="space-y-2.5">
                  {momCategoryComparison.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">ไม่มีข้อมูลเปรียบเทียบ</div>
                  ) : (
                    momCategoryComparison.map((item) => (
                      <div
                        key={item.category}
                        className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200">{item.category}</span>
                          <span
                            className={`font-bold font-num flex items-center gap-0.5 ${
                              item.diff > 0
                                ? 'text-rose-400'
                                : item.diff < 0
                                ? 'text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {item.diff > 0 ? '+' : ''}
                            {formatCurrency(item.diff)}
                            <span className="text-[10px] font-normal opacity-80">
                              ({item.diff > 0 ? '+' : ''}
                              {item.percentage.toFixed(0)}%)
                            </span>
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                          <span>
                            {baseMonth}: <strong className="text-slate-200 font-num">{formatCurrency(item.baseSpend)}</strong>
                          </span>
                          <span>
                            {compareMonth}: <strong className="text-slate-400 font-num">{formatCurrency(item.compareSpend)}</strong>
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Card-by-Card MoM Shifts */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <CardIcon className="w-4 h-4 text-indigo-400" />
                  <span>การเปลี่ยนแปลงแยกตามบัตรเครดิต</span>
                </h3>

                <div className="space-y-2">
                  {momCardComparison.map((item) => (
                    <div
                      key={item.cardName}
                      className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                        <div>
                          <span className="text-xs font-bold text-white">{item.cardName}</span>
                          <div className="text-[10px] text-slate-400">
                            {formatCurrency(item.baseSpend)} vs {formatCurrency(item.compareSpend)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-bold font-num ${
                            item.diff > 0 ? 'text-rose-400' : item.diff < 0 ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {item.diff > 0 ? '+' : ''}
                          {formatCurrency(item.diff)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Year-over-Year Mode */}
          {viewMode === 'YEARLY' && (
            <div className="space-y-4">
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>เลือก 2 ปีที่ต้องการเปรียบเทียบ (YoY)</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-indigo-300 block mb-1 font-medium">ปีหลัก</label>
                    <select
                      value={baseYear}
                      onChange={(e) => setBaseYear(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-num font-bold border border-indigo-500/50 focus:outline-none"
                    >
                      {availableYears.length === 0 ? (
                        <option value="">- ยังไม่มีข้อมูล -</option>
                      ) : (
                        availableYears.map((y) => (
                          <option key={y} value={y}>
                            ปี {y}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1 font-medium">ปีที่เปรียบเทียบ</label>
                    <select
                      value={compareYear}
                      onChange={(e) => setCompareYear(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-num font-bold border border-slate-700 focus:outline-none"
                    >
                      {availableYears.length === 0 ? (
                        <option value="">- ยังไม่มีข้อมูล -</option>
                      ) : (
                        availableYears.map((y) => (
                          <option key={y} value={y}>
                            ปี {y}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* YoY Comparison Result Card */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-slate-900 border border-indigo-500/30 shadow-xl space-y-3">
                <div className="text-xs text-indigo-300 font-medium">ผลต่างยอดใช้จ่ายรายปี (YoY Delta)</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold font-num text-white">
                    {formatCurrency(Math.abs(yoyData.diff))}
                  </span>
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      yoyData.diff > 0
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {yoyData.diff > 0 ? `+${yoyData.percentage.toFixed(1)}%` : `${yoyData.percentage.toFixed(1)}%`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">ปี {yoyData.base.year}</span>
                    <span className="text-sm font-bold font-num text-white">
                      {formatCurrency(yoyData.base.spend)}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {yoyData.base.count} รายการ • เงินคืน +{formatCurrency(yoyData.base.refund)}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">ปี {yoyData.compare.year}</span>
                    <span className="text-sm font-bold font-num text-slate-300">
                      {formatCurrency(yoyData.compare.spend)}
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {yoyData.compare.count} รายการ • เงินคืน +{formatCurrency(yoyData.compare.refund)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BUDGET GOALS & SPENDING AVERAGES */}
      {activeTab === 'BUDGET' && (
        <div className="space-y-4">
          {/* Target Month Selector */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-300 font-medium">เดือนที่ตรวจสอบงบ:</span>
            <select
              value={baseMonth}
              onChange={(e) => setBaseMonth(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-white text-xs font-num font-bold border border-slate-700 focus:outline-none"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Goal Card */}
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">เป้าหมายงบประมาณรายเดือน (Budget Goal)</h3>
              </div>

              <button
                onClick={() => setIsEditingBudget(!isEditingBudget)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{isEditingBudget ? 'ยกเลิก' : 'แก้ไขงบ'}</span>
              </button>
            </div>

            {/* Editable input */}
            {isEditingBudget ? (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                <input
                  type="number"
                  value={newBudgetInput}
                  onChange={(e) => setNewBudgetInput(e.target.value)}
                  placeholder="25000"
                  className="flex-1 bg-transparent text-white font-num font-bold text-base px-2 focus:outline-none"
                />
                <button
                  onClick={handleSaveBudget}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                >
                  บันทึก
                </button>
              </div>
            ) : (
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">งบที่ตั้งไว้ต่อเดือน:</span>
                  <span className="text-2xl font-extrabold font-num text-white">
                    {formatCurrency(budgetSettings.monthlyBudget)}
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`inline-block text-xs px-2.5 py-1 rounded-full font-bold ${
                      budgetAnalysis.isOver
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : budgetAnalysis.percentUsed > 80
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {budgetAnalysis.isOver
                      ? `เกินงบ ${formatCurrency(budgetAnalysis.overAmount)}`
                      : `เหลืองบอีก ${formatCurrency(budgetAnalysis.remaining)}`}
                  </span>
                </div>
              </div>
            )}

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-300">
                <span>ใช้ไปแล้ว {formatCurrency(budgetAnalysis.spend)}</span>
                <span className="font-bold font-num text-white">{budgetAnalysis.percentUsed.toFixed(1)}%</span>
              </div>

              <div className="w-full h-3.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetAnalysis.isOver
                      ? 'bg-rose-500'
                      : budgetAnalysis.percentUsed > 80
                      ? 'bg-amber-400'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${Math.min(100, budgetAnalysis.percentUsed)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Historical Spending Average Card */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>เปรียบเทียบกับค่าเฉลี่ยใช้จ่ายในอดีต (Spending Average)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">ค่าเฉลี่ยต่อเดือนในอดีต</span>
                <span className="text-base font-extrabold font-num text-sky-300">
                  {formatCurrency(historicalAvgSpend)}
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  คำนวณจาก {monthlyData.filter((m) => m.spend > 0).length} เดือนที่บันทึก
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">เดือน {baseMonth}</span>
                <span className="text-base font-extrabold font-num text-white">
                  {formatCurrency(baseMonthData.spend)}
                </span>
                <span
                  className={`text-[10px] font-bold block mt-0.5 ${
                    budgetAnalysis.isHigherThanAvg ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {budgetAnalysis.isHigherThanAvg ? '▲ สูงกว่าค่าเฉลี่ย ' : '▼ ต่ำกว่าค่าเฉลี่ย '}
                  {Math.abs(budgetAnalysis.pctFromAvg).toFixed(1)}%
                </span>
              </div>
            </div>

            {highestMonth && lowestMonth && (
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <span>เดือนที่จ่ายสูงสุด: <strong className="text-rose-400 font-num">{highestMonth.month} ({formatCurrency(highestMonth.spend)})</strong></span>
                <span>ต่ำสุด: <strong className="text-emerald-400 font-num">{lowestMonth.month} ({formatCurrency(lowestMonth.spend)})</strong></span>
              </div>
            )}
          </div>

          {/* Potential Savings & Insights */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>วิเคราะห์แนวโน้ม & โอกาสประหยัดค่าใช้จ่าย</span>
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300">
                คำแนะนำ AI
              </span>
            </div>

            <div className="space-y-2.5">
              {savingsInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border text-xs space-y-1 ${
                    insight.type === 'saving'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : insight.type === 'warning'
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      : 'bg-indigo-950/20 border-indigo-500/30 text-indigo-200'
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {insight.type === 'saving' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : insight.type === 'warning' ? (
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                    <span>{insight.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed pl-5.5">{insight.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GENERAL OVERVIEW & SPEND PROPORTIONS */}
      {activeTab === 'TRENDS' && (
        <div className="space-y-4">
          {/* Main Bar Chart Section */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span>กราฟยอดใช้จ่ายรายเดือน ปี {selectedYear}</span>
              </div>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2 py-1 rounded-lg bg-slate-800 text-xs text-indigo-300 border border-slate-700 focus:outline-none"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    ปี {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Visual Bar Chart */}
            <div className="pt-2 pb-2 space-y-3">
              {monthlyData.filter((d) => d.month.startsWith(selectedYear)).map((d) => {
                const maxVal = Math.max(
                  ...monthlyData.filter((x) => x.month.startsWith(selectedYear)).map((x) => x.spend),
                  1000
                );
                const heightPct = Math.max(8, Math.round((d.spend / maxVal) * 100));

                return (
                  <div key={d.month} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-300">{d.month}</span>
                      <span className="font-bold font-num text-white">{formatCurrency(d.spend)}</span>
                    </div>

                    <div className="w-full h-3 rounded-full bg-slate-800/80 overflow-hidden flex">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-sky-400 to-emerald-400 transition-all duration-500"
                        style={{ width: `${heightPct}%` }}
                      />
                    </div>

                    {d.refund > 0 && (
                      <div className="flex justify-end text-[10px] text-emerald-400 font-num">
                        (เงินคืน +{formatCurrency(d.refund)})
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
