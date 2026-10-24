/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BudgetSettings, CreditCard, FirebaseSyncSettings, Transaction, TransactionType } from './types';
import {
  loadBudgetSettings,
  loadCards,
  loadFirebaseSettings,
  loadTransactions,
  saveBudgetSettings,
  saveCards,
  saveFirebaseSettings,
  saveTransactions,
} from './utils/storage';
import { calculateCardCycleSummary, groupInstallments } from './utils/billingEngine';
import { useBiometrics } from './hooks/useBiometrics';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { SecurityLock } from './components/SecurityLock';
import { Navbar, TabType } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';
import { InstallmentsView } from './components/InstallmentsView';
import { AnalyticsView } from './components/AnalyticsView';
import { CardsView } from './components/CardsView';
import { SettingsView } from './components/SettingsView';
import { TransactionModal } from './components/TransactionModal';
import { WifiOff, AlertTriangle } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [cards, setCards] = useState<CreditCard[]>(loadCards);
  const [firebaseSettings, setFirebaseSettings] = useState<FirebaseSyncSettings>(loadFirebaseSettings);
  const [budgetSettings, setBudgetSettings] = useState<BudgetSettings>(loadBudgetSettings);
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');

  // Security & Biometrics
  const {
    security,
    isBiometricSupported,
    authError,
    setAuthError,
    triggerBiometricAuth,
    unlockWithPin,
    lockApp,
    updateSecuritySettings,
  } = useBiometrics();

  // Online / Offline status
  const isOnline = useOnlineStatus();

  // Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<TransactionType>('ซื้อ');

  // Calculate urgent due dates count for Navbar badge
  const upcomingDueCount = useMemo(() => {
    let count = 0;
    const refDate = new Date('2026-10-24T12:00:00');
    for (const card of cards) {
      const summary = calculateCardCycleSummary(card, transactions, refDate);
      if (summary.netDue > 0 && summary.daysUntilDue <= 5) {
        count += 1;
      }
    }
    return count;
  }, [cards, transactions]);

  // Active installments count for Navbar badge
  const activeInstallmentsCount = useMemo(() => {
    const groups = groupInstallments(transactions);
    return groups.filter((g) => !g.isCompleted).length;
  }, [transactions]);

  // Handle Save Transaction (create, update, or generate multi-month installment plan)
  const handleSaveTransaction = useCallback(
    (txPayload: Partial<Transaction>, isInstallmentPlan?: boolean, planMonths?: number) => {
      setTransactions((prev) => {
        let updated: Transaction[];

        if (txPayload.id && prev.some((t) => t.id === txPayload.id)) {
          // Editing existing
          updated = prev.map((t) => (t.id === txPayload.id ? ({ ...t, ...txPayload } as Transaction) : t));
        } else if (isInstallmentPlan && planMonths && planMonths > 1) {
          // Generate full installment schedule across upcoming months!
          const generatedItems: Transaction[] = [];
          const startDate = new Date(txPayload.date || new Date().toISOString().slice(0, 10));
          const baseTitle = txPayload.title || 'ผ่อนชำระ';

          for (let m = 1; m <= planMonths; m++) {
            const installmentDate = new Date(startDate);
            installmentDate.setMonth(startDate.getMonth() + (m - 1));
            const dateStr = installmentDate.toISOString().slice(0, 10);

            generatedItems.push({
              id: `tx-${Date.now().toString(36)}-inst-${m}`,
              date: dateStr,
              card: txPayload.card || 'KTC',
              type: 'ซื้อ',
              title: baseTitle,
              amount: txPayload.amount || 0,
              note: `${txPayload.note ? txPayload.note + ' ' : ''}(ผ่อน ${m}/${planMonths})`,
              category: txPayload.category || 'เครื่องใช้ไฟฟ้า & ของแต่งบ้าน',
              installment: {
                current: m,
                total: planMonths,
                planName: baseTitle,
              },
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
          updated = [...generatedItems, ...prev];
        } else {
          // Regular new transaction
          const newTx: Transaction = {
            id: `tx-${Date.now().toString(36)}`,
            date: txPayload.date || new Date().toISOString().slice(0, 10),
            card: txPayload.card || 'KTC',
            type: txPayload.type || 'ซื้อ',
            title: txPayload.title || 'รายการทั่วไป',
            amount: txPayload.amount || 0,
            note: txPayload.note || '',
            category: txPayload.category || 'ช้อปปิ้งทั่วไป',
            installment: txPayload.installment,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          updated = [newTx, ...prev];
        }

        // Sort descending
        updated.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        saveTransactions(updated);
        return updated;
      });
    },
    []
  );

  // Handle Delete Transaction
  const handleDeleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const updated = prev.filter((t) => t.id !== id);
      saveTransactions(updated);
      return updated;
    });
  }, []);

  // Handle Save Card
  const handleSaveCard = useCallback((updatedCard: CreditCard) => {
    setCards((prev) => {
      let updated: CreditCard[];
      if (prev.some((c) => c.id === updatedCard.id)) {
        updated = prev.map((c) => (c.id === updatedCard.id ? updatedCard : c));
      } else {
        updated = [...prev, updatedCard];
      }
      saveCards(updated);
      return updated;
    });
  }, []);

  // Open modal handlers
  const handleOpenAddModal = useCallback((defaultType: TransactionType = 'ซื้อ') => {
    setEditingTx(null);
    setDefaultTxType(defaultType);
    setIsTxModalOpen(true);
  }, []);

  const handleEditTx = useCallback((tx: Transaction) => {
    setEditingTx(tx);
    setDefaultTxType(tx.type);
    setIsTxModalOpen(true);
  }, []);

  const handleOpenCardDetails = useCallback((card: CreditCard) => {
    setCurrentTab('cards');
  }, []);

  // Render Lock Screen if application is locked
  if (security.isLocked) {
    return (
      <SecurityLock
        onUnlockWithPin={unlockWithPin}
        onTriggerBiometric={triggerBiometricAuth}
        isBiometricAvailable={isBiometricSupported}
        biometricEnabled={security.biometricEnabled}
        authError={authError}
        setAuthError={setAuthError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Offline Toast Indicator */}
      {!isOnline && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/90 backdrop-blur-md text-slate-950 font-bold text-xs shadow-lg animate-pulse">
          <WifiOff className="w-3.5 h-3.5" />
          <span>โหมดออฟไลน์ — ข้อมูลจะถูกบันทึกในเครื่องอัตโนมัติ</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden">
        {currentTab === 'dashboard' && (
          <DashboardView
            cards={cards}
            transactions={transactions}
            onOpenAddModal={handleOpenAddModal}
            onOpenCardDetails={handleOpenCardDetails}
            onSelectTab={setCurrentTab}
            onLockApp={lockApp}
            isOnline={isOnline}
          />
        )}

        {currentTab === 'transactions' && (
          <TransactionsView
            transactions={transactions}
            cards={cards}
            onOpenAddModal={() => handleOpenAddModal('ซื้อ')}
            onEditTransaction={handleEditTx}
          />
        )}

        {currentTab === 'installments' && (
          <InstallmentsView
            transactions={transactions}
            cards={cards}
            onOpenAddModal={() => handleOpenAddModal('ซื้อ')}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            transactions={transactions}
            cards={cards}
            budgetSettings={budgetSettings}
            onUpdateBudget={(b) => {
              setBudgetSettings(b);
              saveBudgetSettings(b);
            }}
          />
        )}

        {currentTab === 'cards' && (
          <CardsView
            cards={cards}
            transactions={transactions}
            onSaveCard={handleSaveCard}
            onSelectTransaction={handleEditTx}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsView
            security={security}
            onUpdateSecurity={updateSecuritySettings}
            firebaseSettings={firebaseSettings}
            onUpdateFirebase={(s) => {
              setFirebaseSettings(s);
              saveFirebaseSettings(s);
            }}
            transactions={transactions}
            cards={cards}
            onReloadData={(txs, c) => {
              setTransactions(txs);
              setCards(c);
            }}
            onLockApp={lockApp}
            isOnline={isOnline}
            isBiometricSupported={isBiometricSupported}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeInstallmentsCount={activeInstallmentsCount}
        upcomingDueCount={upcomingDueCount}
      />

      {/* Transaction Add / Edit Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={handleSaveTransaction}
        onDelete={handleDeleteTransaction}
        initialTransaction={editingTx}
        defaultType={defaultTxType}
        cards={cards}
      />
    </div>
  );
}
