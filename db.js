/**
 * SBETS-LITE – db.js
 * Pure-JS JSON database using lowdb v1 (no native compilation needed).
 * Data is persisted to SBETS-LITE-data.json in the project directory.
 */

const low      = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path     = require('path');

const adapter = new FileSync(path.join(__dirname, 'SBETS-LITE-data.json'));
const db      = low(adapter);

// ─── DEFAULT SCHEMA ──────────────────────────────────────────────────────────

db.defaults({
  transactions: [],
  budgets: [
    { category: 'Food',          amount: 5000 },
    { category: 'Transport',     amount: 3000 },
    { category: 'Shopping',      amount: 4000 },
    { category: 'Health',        amount: 2000 },
    { category: 'Entertainment', amount: 1500 },
    { category: 'Other',         amount: 1000 },
  ],
  _nextId: 1,
}).write();

// ─── SEED DEMO DATA (only if empty) ──────────────────────────────────────────

if (db.get('transactions').size().value() === 0) {
  const seed = [
    { merchant: 'Swiggy',          amount: 340,  category: 'Food',          note: '', date: '2026-03-22' },
    { merchant: 'Uber',            amount: 210,  category: 'Transport',     note: '', date: '2026-03-22' },
    { merchant: 'Amazon',          amount: 1299, category: 'Shopping',      note: '', date: '2026-03-21' },
    { merchant: 'Netflix',         amount: 399,  category: 'Entertainment', note: '', date: '2026-03-21' },
    { merchant: 'Apollo Pharmacy', amount: 580,  category: 'Health',        note: '', date: '2026-03-20' },
    { merchant: 'Zomato',          amount: 450,  category: 'Food',          note: '', date: '2026-03-20' },
    { merchant: 'Ola',             amount: 175,  category: 'Transport',     note: '', date: '2026-03-19' },
    { merchant: 'Flipkart',        amount: 1899, category: 'Shopping',      note: '', date: '2026-03-19' },
    { merchant: 'Spotify',         amount: 119,  category: 'Entertainment', note: '', date: '2026-03-18' },
    { merchant: 'Blinkit',         amount: 230,  category: 'Food',          note: '', date: '2026-03-18' },
    { merchant: 'Rapido',          amount: 95,   category: 'Transport',     note: '', date: '2026-03-17' },
    { merchant: 'Myntra',          amount: 799,  category: 'Shopping',      note: '', date: '2026-03-17' },
    { merchant: 'Medplus',         amount: 340,  category: 'Health',        note: '', date: '2026-03-16' },
    { merchant: 'Dominos',         amount: 420,  category: 'Food',          note: '', date: '2026-03-16' },
    { merchant: 'BookMyShow',      amount: 350,  category: 'Entertainment', note: '', date: '2026-03-15' },
  ];
  let nextId = db.get('_nextId').value();
  seed.forEach(t => {
    db.get('transactions').push({ id: nextId++, ...t, created_at: new Date().toISOString() }).write();
  });
  db.set('_nextId', nextId).write();
  console.log('[DB] Seeded demo transactions →', seed.length, 'records');
}

// ─── DB ACCESSOR (exported for server routes) ─────────────────────────────────

module.exports = db;
