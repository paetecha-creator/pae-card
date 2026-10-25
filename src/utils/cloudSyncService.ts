import { BudgetSettings, CreditCard, SecuritySettings, Transaction } from '../types';

export interface SyncPayload {
  transactions: Transaction[];
  cards: CreditCard[];
  budget?: BudgetSettings;
  security?: Partial<SecuritySettings>;
}

export interface ServerSyncResponse {
  success: boolean;
  data?: {
    transactions: Transaction[];
    cards: CreditCard[];
    budget: BudgetSettings;
    security: SecuritySettings;
    updatedAt: number;
  };
  updatedAt?: number;
  count?: number;
  error?: string;
}

/**
 * Fetches the latest global personal data from server
 */
export async function fetchServerState(): Promise<ServerSyncResponse | null> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }

  try {
    const res = await fetch('/api/sync', {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data: ServerSyncResponse = await res.json();
    return data;
  } catch (err) {
    console.warn('Could not reach auto-sync server:', err);
    return null;
  }
}

/**
 * Pushes updated state to server for cross-device sync
 */
export async function pushServerState(payload: SyncPayload): Promise<{ success: boolean; updatedAt?: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { success: false };
  }

  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const result = await res.json();
    return { success: true, updatedAt: result.updatedAt };
  } catch (err) {
    console.warn('Failed to push state to sync server:', err);
    return { success: false };
  }
}

/**
 * Resets personal server store to empty factory state
 */
export async function resetServerState(): Promise<ServerSyncResponse | null> {
  try {
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }
    const data: ServerSyncResponse = await res.json();
    return data;
  } catch (err) {
    console.warn('Failed to call reset on server:', err);
    return null;
  }
}
