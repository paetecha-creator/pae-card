export type TransactionType = 'ซื้อ' | 'เงินคืน' | 'จ่ายบิล';

export interface InstallmentMeta {
  current: number;
  total: number;
  planName?: string;
  monthlyAmount?: number;
  totalAmount?: number;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  card: string; // e.g. KTC, Lotus, Homepro, TTB, Shopee, SCB
  type: TransactionType;
  title: string; // Merchant / Item
  amount: number;
  note: string;
  category: string;
  installment?: InstallmentMeta;
  createdAt: number;
  updatedAt: number;
}

export interface CreditCard {
  id: string;
  name: string; // KTC, Lotus, Homepro, TTB, Shopee, SCB
  cardHolder: string;
  last4: string;
  creditLimit: number;
  cutoffDay: number; // Day of month for billing cut-off (1-31)
  dueDay: number; // Day of month for payment due (1-31)
  colorGradient: string; // CSS gradient class or style
  accentColor: string;
  brand: 'visa' | 'mastercard' | 'jcb' | 'other';
  networkName: string;
}

export interface BillingCycleSummary {
  cardName: string;
  cutoffDate: string;
  dueDate: string;
  daysUntilDue: number;
  status: 'DUE_TODAY' | 'APPROACHING' | 'NORMAL' | 'OVERDUE' | 'PAID';
  totalSpend: number;
  totalRefund: number;
  totalPaid: number;
  netDue: number;
  transactionsCount: number;
}

export interface SecuritySettings {
  pin: string;
  isBiometricAvailable: boolean;
  biometricEnabled: boolean;
  autoLockMinutes: number; // 0 for immediate, 1, 5, 15
  lastUnlockedAt: number;
  isLocked: boolean;
}

export interface FirebaseSyncSettings {
  enabled: boolean;
  projectId: string;
  authDomain: string;
  apiKey: string;
  autoSync: boolean;
  lastSyncedAt: number | null;
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  errorMessage?: string;
}

export interface BudgetSettings {
  monthlyBudget: number;
  categoryBudgets?: Record<string, number>;
}

