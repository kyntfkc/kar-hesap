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
    const r = await fetch('https://query1.finance.yahoo.com/v8/finance/chart/XAUUSD=X?range=1d&interval=1d');
    if (!r.ok) return res.status(502).json({ error: 'Upstream error' });
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    const price = result?.meta?.regularMarketPrice || result?.meta?.previousClose || result?.indicators?.quote?.[0]?.close?.[0];
    if (typeof price !== 'number') return res.status(500).json({ error: 'Price not found' });
    res.json({ price });
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Server listening on', PORT);
});


