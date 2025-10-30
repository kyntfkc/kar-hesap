const express = require('express');
const cors = require('cors');
const { calculateAllPlatforms, calculateStandardSalePrice } = require('./calculations');

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log('Server listening on', PORT);
});


