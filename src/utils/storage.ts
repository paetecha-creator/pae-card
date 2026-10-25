import { BudgetSettings, CreditCard, FirebaseSyncSettings, SecuritySettings, Transaction } from '../types';
import { INITIAL_CARDS, parseCSVData, RAW_CSV_DATA } from '../data/seedData';

const STORAGE_KEYS = {
  TRANSACTIONS: 'paecard_transactions_v1',
  CARDS: 'paecard_cards_v1',
  SECURITY: 'paecard_security_v1',
  FIREBASE: 'paecard_firebase_v1',
  BUDGET: 'paecard_budget_v1',
  OFFLINE_QUEUE: 'paecard_offline_queue_v1',
};

export const DEFAULT_BUDGET: BudgetSettings = {
  monthlyBudget: 25000,
};

export const DEFAULT_SECURITY: SecuritySettings = {
  pin: '1234',
  isBiometricAvailable: false,
  biometricEnabled: false,
  autoLockMinutes: 5,
  lastUnlockedAt: Date.now(),
  isLocked: false,
};

export const DEFAULT_FIREBASE: FirebaseSyncSettings = {
  enabled: true,
  projectId: 'pae-card',
  authDomain: 'pae-card.firebaseapp.com',
  apiKey: '',
  autoSync: true,
  lastSyncedAt: Date.now() - 3600000,
  status: 'idle',
};

/**
 * Loads transactions from localStorage or initializes with empty list
 */
export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Sanitize any corrupt titles that accidentally became Date strings
        return parsed.map((t: Transaction) => {
          if (t.title && (t.title.includes('GMT+') || t.title.includes('Indochina Time'))) {
            let cleanTitle = '';
            if (t.note) cleanTitle = t.note.split('(')[0].trim();
            if (!cleanTitle) cleanTitle = t.type === 'จ่ายบิล' ? 'ชำระบิลบัตร' : t.type === 'เงินคืน' ? 'เงินคืน/Cashback' : 'รายการทั่วไป';
            return { ...t, title: cleanTitle };
          }
          return t;
        });
      }
    }
  } catch (err) {
    console.error('Failed to load transactions from localStorage:', err);
  }

  // Clean fresh start: empty transactions
  saveTransactions([]);
  return [];
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions:', err);
  }
}

/**
 * Loads credit cards from localStorage or initializes with empty list
 */
export function loadCards(): CreditCard[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARDS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load cards:', err);
  }

  saveCards([]);
  return [];
}

export function saveCards(cards: CreditCard[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (err) {
    console.error('Failed to save cards:', err);
  }
}

export function loadSecuritySettings(): SecuritySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SECURITY);
    if (raw) {
      return { ...DEFAULT_SECURITY, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load security settings:', err);
  }
  return DEFAULT_SECURITY;
}

export function saveSecuritySettings(settings: SecuritySettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SECURITY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save security settings:', err);
  }
}

export function loadFirebaseSettings(): FirebaseSyncSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FIREBASE);
    if (raw) {
      return { ...DEFAULT_FIREBASE, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load firebase settings:', err);
  }
  return DEFAULT_FIREBASE;
}

export function saveFirebaseSettings(settings: FirebaseSyncSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FIREBASE, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save firebase settings:', err);
  }
}

export function loadBudgetSettings(): BudgetSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGET);
    if (raw) {
      return { ...DEFAULT_BUDGET, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.error('Failed to load budget settings:', err);
  }
  return DEFAULT_BUDGET;
}

export function saveBudgetSettings(settings: BudgetSettings): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save budget settings:', err);
  }
}

/**
 * Resets all app data and settings to clean factory state
 */
export function resetToFactorySettings(): {
  transactions: Transaction[];
  cards: CreditCard[];
  budget: BudgetSettings;
  security: SecuritySettings;
  firebase: FirebaseSyncSettings;
} {
  saveTransactions([]);
  saveCards([]);
  saveBudgetSettings(DEFAULT_BUDGET);
  saveSecuritySettings(DEFAULT_SECURITY);
  saveFirebaseSettings(DEFAULT_FIREBASE);
  return {
    transactions: [],
    cards: [],
    budget: DEFAULT_BUDGET,
    security: DEFAULT_SECURITY,
    firebase: DEFAULT_FIREBASE,
  };
}

/**
 * Loads sample seed data from Google Sheets (178 items) on-demand
 */
export function loadSeedDataFromSheets(): { transactions: Transaction[]; cards: CreditCard[] } {
  const transactions = parseCSVData(RAW_CSV_DATA);
  saveTransactions(transactions);
  saveCards(INITIAL_CARDS);
  return { transactions, cards: INITIAL_CARDS };
}

/**
 * Resets local data back to original seed data
 */
export const resetDataToDefault = loadSeedDataFromSheets;

/**
 * Export transactions to CSV format matching user format
 */
export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const header = 'วันที่รายการ,ชื่อบัตรหรือช่องทางชำระ,สถานะการชำระ,รายการ/ร้านค้า,จำนวนเงิน,หมายเหตุ\n';
  const rows = transactions.map((t) => {
    const cleanTitle = `"${(t.title || '').replace(/"/g, '""')}"`;
    const cleanNote = `"${(t.note || '').replace(/"/g, '""')}"`;
    return `${t.date},${t.card},${t.type},${cleanTitle},${t.amount.toFixed(2)},${cleanNote}`;
  });
  return header + rows.join('\n');
}

/**
 * Export full JSON backup
 */
export function exportFullBackup(): string {
  const data = {
    app: 'PaeCard',
    version: '1.0',
    exportDate: new Date().toISOString(),
    transactions: loadTransactions(),
    cards: loadCards(),
    security: loadSecuritySettings(),
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Import full JSON backup
 */
export function importFullBackup(jsonString: string): { success: boolean; message: string; count?: number } {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed.transactions && Array.isArray(parsed.transactions)) {
      saveTransactions(parsed.transactions);
      if (parsed.cards && Array.isArray(parsed.cards)) {
        saveCards(parsed.cards);
      }
      return { success: true, message: `กู้คืนข้อมูลสำเร็จ ${parsed.transactions.length} รายการ`, count: parsed.transactions.length };
    }
    return { success: false, message: 'รูปแบบไฟล์สำรองไม่ถูกต้อง' };
  } catch (e) {
    return { success: false, message: 'ไม่สามารถอ่านไฟล์ JSON ได้: ' + (e instanceof Error ? e.message : 'Unknown error') };
  }
}
