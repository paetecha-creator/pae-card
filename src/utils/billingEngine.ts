import { CreditCard, Transaction, BillingCycleSummary } from '../types';

/**
 * Formats currency in Thai Baht (THB)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount).replace('THB', '฿');
}

export function formatShortNumber(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Thai date formatter: e.g. "10 ต.ค. 2026"
 */
export function formatThaiDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const thaiMonth = thaiMonths[m - 1] || '';
  return `${d} ${thaiMonth} ${y + 543}`;
}

export function formatThaiMonthYear(year: number, month: number): string {
  const thaiMonthsFull = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  return `${thaiMonthsFull[month - 1]} ${year + 543}`;
}

/**
 * Calculates cycle cut-off date and due date for a specific transaction date and card
 */
export function getCycleForDate(dateStr: string, card: CreditCard): { cutoffDate: string; dueDate: string } {
  const [txYear, txMonth, txDay] = dateStr.split('-').map(Number);
  const cutoffDay = card.cutoffDay || 10;
  const dueDay = card.dueDay || 25;

  let cycleYear = txYear;
  let cycleMonth = txMonth;

  // If transaction day is strictly after cutoffDay, it rolls into next month's statement
  if (txDay > cutoffDay) {
    cycleMonth += 1;
    if (cycleMonth > 12) {
      cycleMonth = 1;
      cycleYear += 1;
    }
  }

  // Adjust for max days in month
  const maxCutoffDay = new Date(cycleYear, cycleMonth, 0).getDate();
  const actualCutoffDay = Math.min(cutoffDay, maxCutoffDay);
  const cutoffDate = `${cycleYear}-${String(cycleMonth).padStart(2, '0')}-${String(actualCutoffDay).padStart(2, '0')}`;

  // Due date calculation:
  // If dueDay > cutoffDay, it's typically within the same cycle month.
  // If dueDay <= cutoffDay, it's in the following month.
  let dueYear = cycleYear;
  let dueMonth = cycleMonth;
  if (dueDay <= cutoffDay) {
    dueMonth += 1;
    if (dueMonth > 12) {
      dueMonth = 1;
      dueYear += 1;
    }
  }
  const maxDueDay = new Date(dueYear, dueMonth, 0).getDate();
  const actualDueDay = Math.min(dueDay, maxDueDay);
  const dueDate = `${dueYear}-${String(dueMonth).padStart(2, '0')}-${String(actualDueDay).padStart(2, '0')}`;

  return { cutoffDate, dueDate };
}

/**
 * Calculates billing cycle summary for each card for the current/selected cycle
 */
export function calculateCardCycleSummary(
  card: CreditCard,
  transactions: Transaction[],
  referenceDate: Date = new Date()
): BillingCycleSummary {
  // Determine reference cutoff and due date
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth() + 1;
  const refDay = referenceDate.getDate();
  const refDateStr = `${refYear}-${String(refMonth).padStart(2, '0')}-${String(refDay).padStart(2, '0')}`;

  const { cutoffDate, dueDate } = getCycleForDate(refDateStr, card);

  // Previous cycle cutoff date
  const [cYear, cMonth] = cutoffDate.split('-').map(Number);
  let prevMonth = cMonth - 1;
  let prevYear = cYear;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const prevMaxDay = new Date(prevYear, prevMonth, 0).getDate();
  const prevCutoffDay = Math.min(card.cutoffDay, prevMaxDay);
  const prevCutoffDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(prevCutoffDay).padStart(2, '0')}`;

  // Filter transactions for this card that fall in this billing cycle (after prevCutoffDate and <= cutoffDate)
  const cardTxs = transactions.filter((t) => {
    if (t.card.toLowerCase() !== card.name.toLowerCase()) return false;
    return t.date > prevCutoffDate && t.date <= cutoffDate;
  });

  let totalSpend = 0;
  let totalRefund = 0;
  let totalPaid = 0;

  for (const t of cardTxs) {
    if (t.type === 'ซื้อ') totalSpend += t.amount;
    else if (t.type === 'เงินคืน') totalRefund += t.amount;
    else if (t.type === 'จ่ายบิล') totalPaid += t.amount;
  }

  // Also check if any bill payment was made after cutoffDate up to dueDate for this card
  const paymentsAfterCutoff = transactions.filter((t) => {
    return (
      t.card.toLowerCase() === card.name.toLowerCase() &&
      t.type === 'จ่ายบิล' &&
      t.date > cutoffDate &&
      t.date <= dueDate
    );
  });
  for (const p of paymentsAfterCutoff) {
    totalPaid += p.amount;
  }

  const netDue = Math.max(0, totalSpend - totalRefund - totalPaid);

  // Calculate days until due relative to referenceDate
  const dueDateTime = new Date(dueDate).setHours(23, 59, 59, 999);
  const nowTime = referenceDate.getTime();
  const diffMs = dueDateTime - nowTime;
  const daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  let status: BillingCycleSummary['status'] = 'NORMAL';
  if (netDue <= 0 && totalSpend > 0) {
    status = 'PAID';
  } else if (daysUntilDue < 0) {
    status = 'OVERDUE';
  } else if (daysUntilDue === 0) {
    status = 'DUE_TODAY';
  } else if (daysUntilDue <= 5) {
    status = 'APPROACHING';
  }

  return {
    cardName: card.name,
    cutoffDate,
    dueDate,
    daysUntilDue,
    status,
    totalSpend,
    totalRefund,
    totalPaid,
    netDue,
    transactionsCount: cardTxs.length,
  };
}

/**
 * Group transactions by monthly installments and calculate installment progress
 */
export interface InstallmentGroup {
  id: string;
  planName: string;
  card: string;
  totalInstallments: number;
  completedInstallments: number;
  monthlyAmount: number;
  totalAmount: number;
  remainingAmount: number;
  paidAmount: number;
  startDate: string;
  latestDate: string;
  isCompleted: boolean;
  transactions: Transaction[];
}

export function groupInstallments(transactions: Transaction[]): InstallmentGroup[] {
  const groupsMap = new Map<string, InstallmentGroup>();

  // Only examine transactions that have installment meta or note with installment numbers
  for (const t of transactions) {
    if (!t.installment && !t.note.match(/\d+\/\d+/)) continue;

    const current = t.installment?.current || 1;
    const total = t.installment?.total || 1;
    // Derive a stable group key
    const cleanedTitle = t.title.replace(/\(ผ่อน\s*\d+\/\d+\)/g, '').trim();
    const groupKey = `${t.card}-${cleanedTitle}`.toLowerCase();

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, {
        id: `inst-${groupKey}`,
        planName: cleanedTitle || t.title,
        card: t.card,
        totalInstallments: total,
        completedInstallments: current,
        monthlyAmount: t.amount,
        totalAmount: t.amount * total,
        remainingAmount: 0,
        paidAmount: 0,
        startDate: t.date,
        latestDate: t.date,
        isCompleted: false,
        transactions: [],
      });
    }

    const group = groupsMap.get(groupKey)!;
    group.transactions.push(t);
    if (total > group.totalInstallments) {
      group.totalInstallments = total;
    }
    if (current > group.completedInstallments) {
      group.completedInstallments = current;
    }
    if (t.date < group.startDate) {
      group.startDate = t.date;
    }
    if (t.date > group.latestDate) {
      group.latestDate = t.date;
    }
  }

  // Post process sums & completion
  const result: InstallmentGroup[] = [];
  for (const group of groupsMap.values()) {
    group.totalAmount = group.monthlyAmount * group.totalInstallments;
    group.paidAmount = group.monthlyAmount * group.completedInstallments;
    group.remainingAmount = Math.max(0, group.totalAmount - group.paidAmount);
    group.isCompleted = group.completedInstallments >= group.totalInstallments;
    // Sort transactions within group by date ascending
    group.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    result.push(group);
  }

  // Sort by remaining amount descending (highest debt / active first)
  return result.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return b.remainingAmount - a.remainingAmount;
  });
}
