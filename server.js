/**
 * SBETS-LITE – server.js
 * Express REST API backend using lowdb (JSON file storage).
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./db');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));   // serves index.html, styles.css, script.js

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const VALID_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Health', 'Entertainment', 'Other'];

const MERCHANT_MAP = {
  uber: 'Transport', ola: 'Transport', rapido: 'Transport', lyft: 'Transport',
  swiggy: 'Food', zomato: 'Food', dominos: 'Food', mcdonalds: 'Food', kfc: 'Food',
  blinkit: 'Food', 'big basket': 'Food', dunzo: 'Food', zepto: 'Food',
  amazon: 'Shopping', flipkart: 'Shopping', myntra: 'Shopping', nykaa: 'Shopping',
  meesho: 'Shopping', ajio: 'Shopping',
  apollo: 'Health', medplus: 'Health', pharmeasy: 'Health', '1mg': 'Health', netmeds: 'Health',
  netflix: 'Entertainment', spotify: 'Entertainment', hotstar: 'Entertainment',
  bookmyshow: 'Entertainment', pvr: 'Entertainment', youtube: 'Entertainment',
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}
function fail(res, message, status = 400) {
  return res.status(status).json({ success: false, error: message });
}
function nextId() {
  const id = db.get('_nextId').value();
  db.set('_nextId', id + 1).write();
  return id;
}

// ─── ROUTES: TRANSACTIONS ─────────────────────────────────────────────────────

// GET /api/transactions — all transactions (newest first)
app.get('/api/transactions', (_req, res) => {
  try {
    const rows = db.get('transactions')
      .orderBy(['date', 'id'], ['desc', 'desc'])
      .value();
    ok(res, rows);
  } catch (e) { fail(res, e.message, 500); }
});

// GET /api/transactions/:id — single transaction
app.get('/api/transactions/:id', (req, res) => {
  try {
    const row = db.get('transactions').find({ id: Number(req.params.id) }).value();
    if (!row) return fail(res, 'Transaction not found', 404);
    ok(res, row);
  } catch (e) { fail(res, e.message, 500); }
});

// POST /api/transactions — create transaction
// Body: { merchant, amount, category, note?, date? }
app.post('/api/transactions', (req, res) => {
  try {
    const { merchant, amount, category, note = '', date } = req.body;

    if (!merchant || !merchant.trim())                      return fail(res, 'merchant is required');
    if (!amount || isNaN(amount) || Number(amount) <= 0)   return fail(res, 'amount must be a positive number');
    if (!category || !VALID_CATEGORIES.includes(category)) return fail(res, `category must be one of: ${VALID_CATEGORIES.join(', ')}`);

    const newTxn = {
      id:         nextId(),
      merchant:   merchant.trim(),
      amount:     Number(amount),
      category,
      note:       note.trim(),
      date:       date || new Date().toISOString().slice(0, 10),
      created_at: new Date().toISOString(),
    };

    db.get('transactions').push(newTxn).write();
    ok(res, newTxn, 201);
  } catch (e) { fail(res, e.message, 500); }
});

// PUT /api/transactions/:id — update transaction
// Body: { merchant?, amount?, category?, note?, date? }
app.put('/api/transactions/:id', (req, res) => {
  try {
    const existing = db.get('transactions').find({ id: Number(req.params.id) }).value();
    if (!existing) return fail(res, 'Transaction not found', 404);

    const { merchant, amount, category, note, date } = req.body;

    if (amount !== undefined && (isNaN(amount) || Number(amount) <= 0))
      return fail(res, 'amount must be a positive number');
    if (category !== undefined && !VALID_CATEGORIES.includes(category))
      return fail(res, `category must be one of: ${VALID_CATEGORIES.join(', ')}`);

    const updated = {
      ...existing,
      merchant: merchant !== undefined ? merchant.trim() : existing.merchant,
      amount:   amount   !== undefined ? Number(amount)  : existing.amount,
      category: category !== undefined ? category        : existing.category,
      note:     note     !== undefined ? note.trim()     : existing.note,
      date:     date     !== undefined ? date            : existing.date,
    };

    db.get('transactions').find({ id: existing.id }).assign(updated).write();
    ok(res, updated);
  } catch (e) { fail(res, e.message, 500); }
});

// DELETE /api/transactions/:id — delete transaction
app.delete('/api/transactions/:id', (req, res) => {
  try {
    const id  = Number(req.params.id);
    const row = db.get('transactions').find({ id }).value();
    if (!row) return fail(res, 'Transaction not found', 404);
    db.get('transactions').remove({ id }).write();
    ok(res, { id, deleted: true });
  } catch (e) { fail(res, e.message, 500); }
});

// ─── ROUTES: BUDGETS ─────────────────────────────────────────────────────────

// GET /api/budgets — all budgets
app.get('/api/budgets', (_req, res) => {
  try {
    ok(res, db.get('budgets').value());
  } catch (e) { fail(res, e.message, 500); }
});

// PUT /api/budgets/:category — update a category budget
// Body: { amount }
app.put('/api/budgets/:category', (req, res) => {
  try {
    const { category } = req.params;
    if (!VALID_CATEGORIES.includes(category))
      return fail(res, `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`);

    const { amount } = req.body;
    if (amount === undefined || isNaN(amount) || Number(amount) < 0)
      return fail(res, 'amount must be a non-negative number');

    const existing = db.get('budgets').find({ category }).value();
    if (existing) {
      db.get('budgets').find({ category }).assign({ amount: Number(amount) }).write();
    } else {
      db.get('budgets').push({ category, amount: Number(amount) }).write();
    }
    ok(res, { category, amount: Number(amount) });
  } catch (e) { fail(res, e.message, 500); }
});

// ─── ROUTES: ANALYTICS ───────────────────────────────────────────────────────

// GET /api/analytics — full analytics summary
app.get('/api/analytics', (_req, res) => {
  try {
    const txns    = db.get('transactions').value();
    const budgets = db.get('budgets').value();

    // Monthly total (current month)
    const now   = new Date();
    const yearM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyTxns = txns.filter(t => t.date && t.date.startsWith(yearM));
    const monthlyTotal = monthlyTxns.reduce((s, t) => s + t.amount, 0);

    // Category totals (all time)
    const catMap = {};
    txns.forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const categoryTotals = Object.entries(catMap)
      .map(([category, total]) => ({ category, total, count: txns.filter(t => t.category === category).length }))
      .sort((a, b) => b.total - a.total);

    // Daily spend — last 7 days
    const dailySpend = [];
    for (let i = 6; i >= 0; i--) {
      const d    = new Date();
      d.setDate(d.getDate() - i);
      const key  = d.toISOString().slice(0, 10);
      const tot  = txns.filter(t => t.date === key).reduce((s, t) => s + t.amount, 0);
      dailySpend.push({ date: key, total: tot });
    }

    // Budget progress (monthly)
    const budgetProgress = budgets.map(b => {
      const spent = monthlyTxns.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
      return {
        category: b.category,
        budget:   b.amount,
        spent,
        percent:  b.amount > 0 ? Math.min(Math.round((spent / b.amount) * 100), 100) : 0,
      };
    });

    ok(res, {
      monthly: { total: monthlyTotal, count: monthlyTxns.length },
      categoryTotals,
      dailySpend,
      budgetProgress,
    });
  } catch (e) { fail(res, e.message, 500); }
});

// ─── ROUTES: SUGGEST ─────────────────────────────────────────────────────────

// GET /api/suggest?merchant=Swiggy
app.get('/api/suggest', (req, res) => {
  try {
    const merchant   = (req.query.merchant || '').toLowerCase();
    let suggestion   = null;
    for (const [key, cat] of Object.entries(MERCHANT_MAP)) {
      if (merchant.includes(key)) { suggestion = cat; break; }
    }
    ok(res, { merchant: req.query.merchant, suggestion });
  } catch (e) { fail(res, e.message, 500); }
});

// ─── CATCH-ALL: SPA fallback ─────────────────────────────────────────────────

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║   💡  SBETS-LITE Backend running!                 ║');
  console.log(`  ║   🌐  http://localhost:${PORT}                   ║`);
  console.log('  ║                                              ║');
  console.log('  ║   REST API:                                  ║');
  console.log('  ║   GET    /api/transactions                   ║');
  console.log('  ║   POST   /api/transactions                   ║');
  console.log('  ║   PUT    /api/transactions/:id               ║');
  console.log('  ║   DELETE /api/transactions/:id               ║');
  console.log('  ║   GET    /api/budgets                        ║');
  console.log('  ║   PUT    /api/budgets/:category              ║');
  console.log('  ║   GET    /api/analytics                      ║');
  console.log('  ║   GET    /api/suggest?merchant=...           ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');
});
