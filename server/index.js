const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { calculateAllPlatforms, calculateStandardSalePrice } = require('./calculations');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
// SQLite init
const dbFile = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbFile);
db.serialize(() => {
  db.run(
    'CREATE TABLE IF NOT EXISTS saved_calculations (id TEXT PRIMARY KEY, name TEXT NOT NULL, createdAt INTEGER NOT NULL, results TEXT NOT NULL)'
  );
});


app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/calculate', (req, res) => {
  try {
    const { productInfo, goldInfo, expenses, platforms } = req.body || {};
    if (!productInfo || !goldInfo || !expenses || !platforms) {
      return res.status(400).json({ error: 'Missing body fields' });
    }
    const results = calculateAllPlatforms(productInfo, goldInfo, expenses, platforms);
    res.json({ results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/standard-sale-price', (req, res) => {
  try {
    const { productInfo, goldInfo, expenses, commissionRate, targetProfitRate } = req.body || {};
    if (!productInfo || !goldInfo || !expenses) {
      return res.status(400).json({ error: 'Missing body fields' });
    }
    const salePrice = calculateStandardSalePrice(productInfo, goldInfo, expenses, commissionRate, targetProfitRate);
    res.json({ salePrice });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Receive client state snapshot (no persistence here; just acknowledge)
app.post('/sync', (req, res) => {
  try {
    const snapshot = req.body || {};
    console.log('[SYNC] snapshot received at', new Date().toISOString());
    // Optionally validate shape here
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Proxy XAUUSD to bypass CORS in browser
app.get('/xauusd', async (req, res) => {
  try {
    // Primary: metalpriceapi.com
    try {
      const key = '2ade4ac5b99bea363bdb2bb795af36c0'
      const url = `https://api.metalpriceapi.com/v1/latest?api_key=${key}&base=USD&currencies=XAU`
      const mp = await fetch(url)
      if (mp.ok) {
        const jd = await mp.json()
        const xauRate = jd?.rates?.XAU // units of XAU per USD
        if (typeof xauRate === 'number' && xauRate > 0) {
          const price = 1 / xauRate // USD per XAU (ounce)
          return res.json({ price })
        }
      }
    } catch (e) {
      // fall through to other sources
    }

    // Try Yahoo first
    const yahoo = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X?range=1d&interval=1d');
    if (yahoo.ok) {
      const yd = await yahoo.json();
      const yr = yd?.chart?.result?.[0];
      const yp = yr?.meta?.regularMarketPrice || yr?.meta?.previousClose || yr?.indicators?.quote?.[0]?.close?.[0];
      if (typeof yp === 'number') return res.json({ price: yp });
    }

    // Fallback: Stooq CSV (XAUUSD) -> last column
    const stooq = await fetch('https://stooq.com/q/l/?s=xauusd&i=d');
    if (stooq.ok) {
      const csv = await stooq.text();
      // format: symbol,date,time,open,high,low,close,volume
      const parts = csv.trim().split(',');
      const close = parseFloat(parts[7] || parts[6]);
      if (!isNaN(close)) return res.json({ price: close });
    }

    return res.status(502).json({ error: 'Price not found' });
  } catch (e) {
    console.error('xauusd proxy error', e);
    res.status(500).json({ error: 'Proxy error' });
  }
});

// Saved calculations CRUD
app.get('/saved-calculations', (req, res) => {
  db.all('SELECT id, name, createdAt, results FROM saved_calculations ORDER BY createdAt DESC', (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }
    const data = rows.map(r => ({ id: r.id, name: r.name, createdAt: r.createdAt, results: JSON.parse(r.results) }));
    res.json({ items: data });
  });
});

app.post('/saved-calculations', (req, res) => {
  const { id, name, createdAt, results } = req.body || {};
  if (!name || !Array.isArray(results)) return res.status(400).json({ error: 'Invalid body' });
  const finalId = id && String(id).trim().length > 0 ? String(id) : String(Date.now());
  const ts = Number(createdAt) || Date.now();
  const resultsJson = JSON.stringify(results);
  db.run(
    'INSERT OR REPLACE INTO saved_calculations (id, name, createdAt, results) VALUES (?, ?, ?, ?)',
    [finalId, name, ts, resultsJson],
    function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'DB error' });
      }
      res.json({ ok: true, id: finalId });
    }
  );
});

app.delete('/saved-calculations/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM saved_calculations WHERE id = ?', [id], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'DB error' });
    }
    res.json({ ok: true, deleted: this.changes });
  });
});

// Rates cache (in-memory, 15 minutes)
let ratesCache = { ts: 0, usdtry: null, xauusd: null };
const FIFTEEN_MIN = 15 * 60 * 1000;

async function fetchUsdTry() {
  const key = '955af145bf3c2926aa413512';
  const url = `https://v6.exchangerate-api.com/v6/${key}/latest/USD`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('exchangerate-api');
  const d = await r.json();
  if (typeof d?.conversion_rates?.TRY !== 'number') throw new Error('usdtry missing');
  return d.conversion_rates.TRY;
}

async function fetchXauUsdPrimary() {
  const key = '2ade4ac5b99bea363bdb2bb795af36c0';
  const url = `https://api.metalpriceapi.com/v1/latest?api_key=${key}&base=USD&currencies=XAU`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('metalpriceapi');
  const d = await r.json();
  const rate = d?.rates?.XAU; // XAU per USD
  if (typeof rate !== 'number' || rate <= 0) throw new Error('metalpriceapi invalid');
  return 1 / rate; // USD per XAU (ounce)
}

async function fetchXauUsdFallback() {
  const yahoo = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X?range=1d&interval=1d');
  if (yahoo.ok) {
    const yd = await yahoo.json();
    const yr = yd?.chart?.result?.[0];
    const yp = yr?.meta?.regularMarketPrice || yr?.meta?.previousClose || yr?.indicators?.quote?.[0]?.close?.[0];
    if (typeof yp === 'number') return yp;
  }
  const stooq = await fetch('https://stooq.com/q/l/?s=xauusd&i=d');
  if (stooq.ok) {
    const csv = await stooq.text();
    const parts = csv.trim().split(',');
    const close = parseFloat(parts[7] || parts[6]);
    if (!isNaN(close)) return close;
  }
  throw new Error('xau not found');
}

app.get('/rates', async (req, res) => {
  try {
    const now = Date.now();
    if (now - ratesCache.ts < FIFTEEN_MIN && ratesCache.usdtry && ratesCache.xauusd) {
      return res.json({ cached: true, usdtry: ratesCache.usdtry, xauusd: ratesCache.xauusd, ts: ratesCache.ts });
    }
    const [usdtry, xauusd] = await Promise.all([
      fetchUsdTry(),
      fetchXauUsdPrimary().catch(() => fetchXauUsdFallback()),
    ]);
    ratesCache = { ts: now, usdtry, xauusd };
    res.json({ cached: false, usdtry, xauusd, ts: now });
  } catch (e) {
    console.error('rates error', e);
    if (ratesCache.usdtry && ratesCache.xauusd) {
      return res.json({ cached: true, usdtry: ratesCache.usdtry, xauusd: ratesCache.xauusd, ts: ratesCache.ts });
    }
    res.status(502).json({ error: 'Rates unavailable' });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Server listening on', PORT);
});


