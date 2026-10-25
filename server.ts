import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { INITIAL_CARDS, parseCSVData, RAW_CSV_DATA } from './src/data/seedData.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const STORE_FILE = path.join(DATA_DIR, 'paecard_store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial state builder (Clean fresh app without pre-loaded data)
function getInitialStore() {
  return {
    transactions: [],
    cards: [],
    budget: { monthlyBudget: 25000 },
    security: {
      pin: '1234',
      isBiometricAvailable: false,
      biometricEnabled: false,
      autoLockMinutes: 5,
      lastUnlockedAt: Date.now(),
      isLocked: false,
    },
    updatedAt: Date.now(),
  };
}

// Load or initialize store from disk
function loadStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (parsed && Array.isArray(parsed.transactions)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to read store file, reinitializing:', err);
  }

  const initial = getInitialStore();
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write initial store:', err);
  }
  return initial;
}

// Save store to disk
function saveStore(data: any) {
  try {
    const updated = {
      ...data,
      updatedAt: Date.now(),
    };
    fs.writeFileSync(STORE_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  } catch (err) {
    console.error('Failed to save store file:', err);
    throw err;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // In-memory store cache
  let currentStore = loadStore();

  // API Endpoints for personal cross-device auto-sync
  app.get('/api/sync', (req, res) => {
    try {
      res.json({
        success: true,
        data: currentStore,
        updatedAt: currentStore.updatedAt || Date.now(),
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to fetch sync state' });
    }
  });

  app.post('/api/sync', (req, res) => {
    try {
      const { transactions, cards, budget, security } = req.body;

      if (transactions && Array.isArray(transactions)) {
        currentStore.transactions = transactions.map((t: any) => {
          if (t && t.title && (t.title.includes('GMT+') || t.title.includes('Indochina Time'))) {
            let cleanTitle = '';
            if (t.note) cleanTitle = String(t.note).split('(')[0].trim();
            if (!cleanTitle) cleanTitle = t.type === 'จ่ายบิล' ? 'ชำระบิลบัตร' : t.type === 'เงินคืน' ? 'เงินคืน/Cashback' : 'รายการทั่วไป';
            return { ...t, title: cleanTitle };
          }
          return t;
        });
      }
      if (cards && Array.isArray(cards)) {
        currentStore.cards = cards;
      }
      if (budget) {
        currentStore.budget = budget;
      }
      if (security && security.pin) {
        currentStore.security = {
          ...currentStore.security,
          pin: security.pin,
          biometricEnabled: security.biometricEnabled,
        };
      }

      currentStore = saveStore(currentStore);

      res.json({
        success: true,
        updatedAt: currentStore.updatedAt,
        count: currentStore.transactions.length,
      });
    } catch (err) {
      console.error('Error saving sync data:', err);
      res.status(500).json({ success: false, error: 'Failed to save sync state' });
    }
  });

  // Reset all data and settings to factory default
  app.post('/api/reset', (req, res) => {
    try {
      currentStore = getInitialStore();
      saveStore(currentStore);
      res.json({
        success: true,
        message: 'All data and settings reset successfully',
        updatedAt: currentStore.updatedAt,
        data: currentStore,
      });
    } catch (err) {
      console.error('Failed to reset store:', err);
      res.status(500).json({ success: false, error: 'Failed to reset store' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', serverTime: Date.now(), items: currentStore.transactions.length });
  });

  // Check NODE_ENV for Vite middleware vs static dist
  const isProd = process.env.NODE_ENV === 'production';
  const distPath = path.join(__dirname, 'dist');

  if (isProd && fs.existsSync(distPath)) {
    // Serve static files in production
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Dev mode with Vite middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
