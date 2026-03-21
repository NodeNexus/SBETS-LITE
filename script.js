/**
 * SBETS-LITE – script.js
 * Frontend logic — all data sourced from the Express REST API backend.
 */

'use strict';

// ============================
// API LAYER
// ============================
const API_BASE = window.location.origin;

async function api(method, path, body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'API Error');
  return json.data;
}

const API = {
  getTransactions:  ()           => api('GET',    '/api/transactions'),
  createTransaction:(data)       => api('POST',   '/api/transactions', data),
  updateTransaction:(id, data)   => api('PUT',    `/api/transactions/${id}`, data),
  deleteTransaction:(id)         => api('DELETE', `/api/transactions/${id}`),
  getBudgets:       ()           => api('GET',    '/api/budgets'),
  updateBudget:     (cat, amt)   => api('PUT',    `/api/budgets/${cat}`, { amount: amt }),
  getAnalytics:     ()           => api('GET',    '/api/analytics'),
  suggest:          (merchant)   => api('GET',    `/api/suggest?merchant=${encodeURIComponent(merchant)}`),
};

// ============================
// CONSTANTS
// ============================
const CATEGORY_ICONS = {
  Food: '🍕', Transport: '🚗', Shopping: '🛒',
  Health: '💊', Entertainment: '🎬', Other: '📦',
};
const CATEGORY_COLORS = {
  Food: '#f59e0b', Transport: '#6366f1', Shopping: '#06b6d4',
  Health: '#22c55e', Entertainment: '#f472b6', Other: '#94a3b8',
};
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// ============================
// STATE
// ============================
let state = {
  transactions: [],
  budgets: [],
  analytics: null,
  loading: false,
};

// ============================
// NAVBAR
// ============================
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 40);
});
hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => navLinks.classList.remove('open')));

// ============================
// SCROLL REVEAL
// ============================
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(el => { if (el.isIntersecting) el.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.step-card, .feature-card, .sugg-example, .privacy-point, .kpi-card').forEach(el => {
  el.classList.add('reveal');
  revealObserver.observe(el);
});

// ============================
// SMOOTH SCROLL
// ============================
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href === '#') return;
    const target = document.querySelector(href);
    if (target) { e.preventDefault(); window.scrollTo({ top: target.offsetTop - 72, behavior: 'smooth' }); }
  });
});

// ============================
// HERO PHONE CAT BUTTONS
// ============================
document.querySelectorAll('.phone-screen .cat-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    this.closest('.popup-categories').querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
  });
});

// ============================
// UTILS
// ============================
function formatCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}
function formatDate(d) {
  const date = new Date(d);
  return date.getDate() + ' ' + MONTHS[date.getMonth()];
}
function spinLoader(el, on) {
  if (on) el.classList.add('loading');
  else el.classList.remove('loading');
}

// ============================
// RENDER HELPERS
// ============================

// --- KPI Cards ---
function renderKPIs() {
  const { analytics } = state;
  if (!analytics) return;
  const { monthly, categoryTotals } = analytics;
  document.getElementById('totalSpend').textContent = formatCurrency(monthly.total);
  document.getElementById('totalTxns').textContent  = monthly.count;

  const top = categoryTotals[0];
  if (top) {
    document.getElementById('topCat').textContent = `${CATEGORY_ICONS[top.category] || '📦'} ${top.category}`;
  }

  const totalBudget  = state.budgets.reduce((s, b) => s + b.amount, 0);
  const budgetPct    = totalBudget > 0 ? Math.round((monthly.total / totalBudget) * 100) : 0;
  document.getElementById('budgetStatus').textContent = budgetPct + '%';

  // KPI colors
  const bEl = document.querySelector('.kpi-card:last-child .kpi-change');
  if (bEl) {
    bEl.textContent = budgetPct >= 90 ? '🔴 Over-limit warning!' : budgetPct >= 70 ? '⚠️ Near limit' : '✅ On track';
    bEl.className = 'kpi-change ' + (budgetPct >= 70 ? 'negative' : 'positive');
  }
}

// --- Pie Chart ---
let pieChart;
function renderPieChart() {
  const { analytics } = state;
  if (!analytics) return;
  const labels = analytics.categoryTotals.map(c => `${CATEGORY_ICONS[c.category] || '📦'} ${c.category}`);
  const data   = analytics.categoryTotals.map(c => c.total);
  const colors = analytics.categoryTotals.map(c => CATEGORY_COLORS[c.category] || '#94a3b8');

  if (pieChart) pieChart.destroy();
  const ctx = document.getElementById('pieChart').getContext('2d');
  pieChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderColor: 'rgba(255,255,255,0.05)', borderWidth: 2, hoverOffset: 8 }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } },
        tooltip: { callbacks: { label: ctx => ' ' + formatCurrency(ctx.parsed) } },
      },
    },
  });
}

// --- Category Bars ---
function renderCategoryBars() {
  const { analytics } = state;
  if (!analytics) return;
  const max = Math.max(...analytics.categoryTotals.map(c => c.total), 1);
  const container = document.getElementById('categoryBars');
  container.innerHTML = '';
  analytics.categoryTotals.forEach(({ category, total }) => {
    const pct = Math.round((total / max) * 100);
    const color = CATEGORY_COLORS[category] || '#94a3b8';
    container.innerHTML += `
      <div class="cat-bar-row">
        <div class="cat-bar-label">
          <span class="cat-bar-name">${CATEGORY_ICONS[category] || '📦'} ${category}</span>
          <span class="cat-bar-amount">${formatCurrency(total)}</span>
        </div>
        <div class="cat-bar-track">
          <div class="cat-bar-fill" style="width:0%;background:${color}" data-width="${pct}%"></div>
        </div>
      </div>`;
  });
  setTimeout(() => {
    container.querySelectorAll('.cat-bar-fill').forEach(b => { b.style.width = b.dataset.width; });
  }, 100);
}

// --- Recent Transactions ---
function renderRecentTransactions() {
  const el   = document.getElementById('recentTxns');
  const list = state.transactions.slice(0, 5);
  el.innerHTML = list.length ? list.map(txnHTML).join('') : '<div class="empty-state">No transactions yet</div>';
}

// --- Full Transactions List ---
function renderFullTransactions(filterText = '', filterCat = '') {
  const el = document.getElementById('fullTxnList');
  let list = [...state.transactions];
  if (filterText) list = list.filter(t => t.merchant.toLowerCase().includes(filterText.toLowerCase()));
  if (filterCat) list = list.filter(t => t.category === filterCat);
  el.innerHTML = list.length
    ? list.map(t => txnHTML(t, true)).join('')
    : '<div style="text-align:center;padding:40px;color:#64748b">No transactions found</div>';

  // Bind delete buttons
  el.querySelectorAll('.txn-delete-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const id = Number(this.dataset.id);
      if (!confirm('Delete this transaction?')) return;
      try {
        await API.deleteTransaction(id);
        await loadAll();
        showToast('🗑 Transaction deleted');
      } catch (e) {
        showToast('❌ ' + e.message);
      }
    });
  });
}

function txnHTML(t, withDelete = false) {
  const icon = CATEGORY_ICONS[t.category] || '📦';
  return `
    <div class="txn-item" data-id="${t.id}">
      <div class="txn-left">
        <div class="txn-avatar">${icon}</div>
        <div>
          <div class="txn-merchant">${t.merchant}</div>
          <div class="txn-cat">${t.category}${withDelete ? ' · ' + formatDate(t.date) : ''}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <div style="text-align:right">
          <div class="txn-amount">-${formatCurrency(t.amount)}</div>
          ${!withDelete ? `<div class="txn-date">${formatDate(t.date)}</div>` : ''}
        </div>
        ${withDelete ? `<button class="txn-delete-btn" data-id="${t.id}" title="Delete">🗑</button>` : ''}
      </div>
    </div>`;
}

// --- Line Chart ---
let lineChart;
function renderLineChart() {
  const { analytics } = state;
  if (!analytics) return;
  const labels = analytics.dailySpend.map(d => {
    const dt = new Date(d.date);
    return DAYS_SHORT[dt.getDay() === 0 ? 6 : dt.getDay() - 1];
  });
  const data = analytics.dailySpend.map(d => d.total);

  if (lineChart) lineChart.destroy();
  const ctx = document.getElementById('lineChart').getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 0, 240);
  gradient.addColorStop(0, 'rgba(99,102,241,0.45)');
  gradient.addColorStop(1, 'rgba(99,102,241,0)');

  lineChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Spending',
        data,
        borderColor: '#6366f1',
        backgroundColor: gradient,
        borderWidth: 2.5,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointRadius: 5,
        pointHoverRadius: 8,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ' ' + formatCurrency(ctx.parsed.y) } },
      },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#64748b', callback: v => '₹' + v }, grid: { color: 'rgba(255,255,255,0.04)' }, beginAtZero: true },
      },
    },
  });
}

// --- Budget Progress ---
function renderBudgetProgress() {
  const { analytics } = state;
  if (!analytics) return;
  const el = document.getElementById('budgetProgressList');
  el.innerHTML = '';
  analytics.budgetProgress.forEach(({ category, budget, spent, percent }) => {
    const color = percent >= 90 ? '#ef4444' : percent >= 70 ? '#f59e0b' : '#22c55e';
    el.innerHTML += `
      <div class="budget-row" data-category="${category}">
        <div class="budget-cat-name">${CATEGORY_ICONS[category] || '📦'} ${category}</div>
        <div class="budget-track">
          <div class="budget-fill" style="width:0%;background:${color}" data-width="${percent}%"></div>
        </div>
        <div class="budget-pct-wrap">
          <div class="budget-pct">${formatCurrency(spent)} / ${formatCurrency(budget)}</div>
          <button class="edit-budget-btn" data-category="${category}" data-budget="${budget}">✏️</button>
        </div>
      </div>`;
  });
  setTimeout(() => {
    el.querySelectorAll('.budget-fill').forEach(b => { b.style.width = b.dataset.width; });
  }, 100);

  // Edit budget inline
  el.querySelectorAll('.edit-budget-btn').forEach(btn => {
    btn.addEventListener('click', async function () {
      const cat = this.dataset.category;
      const cur = this.dataset.budget;
      const val = prompt(`Set monthly budget for ${cat} (current: ₹${cur}):`, cur);
      if (val === null) return;
      const num = parseFloat(val);
      if (isNaN(num) || num < 0) { showToast('❌ Enter a valid amount'); return; }
      try {
        await API.updateBudget(cat, num);
        showToast(`✅ Budget for ${cat} set to ${formatCurrency(num)}`);
        await loadAll();
      } catch (e) {
        showToast('❌ ' + e.message);
      }
    });
  });
}

// ============================
// DASHBOARD TABS
// ============================
document.querySelectorAll('.demo-nav-item').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.demo-nav-item').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    const tab = this.dataset.tab;
    document.querySelectorAll('.demo-tab').forEach(t => t.classList.remove('active'));
    const tabEl = document.getElementById('tabContent' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (tabEl) tabEl.classList.add('active');
    if (tab === 'analytics') {
      renderLineChart();
      renderBudgetProgress();
    }
    if (tab === 'transactions') {
      renderFullTransactions(
        document.getElementById('txnSearch').value,
        document.getElementById('txnFilter').value
      );
    }
  });
});

document.getElementById('seeAllBtn').addEventListener('click', () => {
  document.querySelectorAll('.demo-nav-item').forEach(b => b.classList.remove('active'));
  document.querySelector('[data-tab="transactions"]').classList.add('active');
  document.querySelectorAll('.demo-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('tabContentTransactions').classList.add('active');
  renderFullTransactions();
});

document.getElementById('txnSearch').addEventListener('input', function () {
  renderFullTransactions(this.value, document.getElementById('txnFilter').value);
});
document.getElementById('txnFilter').addEventListener('change', function () {
  renderFullTransactions(document.getElementById('txnSearch').value, this.value);
});

// ============================
// ADD TRANSACTION MODAL
// ============================
const modal         = document.getElementById('txnModal');
const addBtn        = document.getElementById('addTransactionBtn');
const modalClose    = document.getElementById('modalClose');
const confirmBtn    = document.getElementById('confirmTxnBtn');
const amountInput   = document.getElementById('txnAmount');
const merchantInput = document.getElementById('txnMerchant');
let selectedCategory = '';

function openModal() {
  amountInput.value  = '';
  merchantInput.value = '';
  selectedCategory   = '';
  document.getElementById('modalSuggestion').style.display = 'none';
  document.querySelectorAll('#modalCategories .cat-btn').forEach(b => b.classList.remove('active'));
  updateSMSPreview();
  modal.classList.add('open');
  amountInput.focus();
}

addBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });

// SMS Live Preview
function updateSMSPreview() {
  const amt   = amountInput.value  || '0';
  const merch = merchantInput.value || '--';
  const d     = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  document.getElementById('smsAmount').textContent   = amt;
  document.getElementById('smsMerchant').textContent = merch;
  document.getElementById('smsDate').textContent     = d;
}
amountInput.addEventListener('input', updateSMSPreview);

// Merchant → auto-suggest via API
let suggestTimeout;
merchantInput.addEventListener('input', async function () {
  updateSMSPreview();
  clearTimeout(suggestTimeout);
  const val = this.value.trim();
  if (val.length < 2) {
    document.getElementById('modalSuggestion').style.display = 'none';
    return;
  }
  suggestTimeout = setTimeout(async () => {
    try {
      const { suggestion } = await API.suggest(val);
      if (suggestion) {
        document.getElementById('modalSuggestion').style.display = 'block';
        document.getElementById('suggestionText').textContent    = `${CATEGORY_ICONS[suggestion]} ${suggestion}`;
        document.querySelectorAll('#modalCategories .cat-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.cat === suggestion);
        });
        selectedCategory = suggestion;
      } else {
        document.getElementById('modalSuggestion').style.display = 'none';
      }
    } catch (_) {}
  }, 300);
});

// Category selection
document.querySelectorAll('#modalCategories .cat-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    document.querySelectorAll('#modalCategories .cat-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    selectedCategory = this.dataset.cat;
  });
});

// Confirm & Save to backend
confirmBtn.addEventListener('click', async () => {
  const amount   = parseFloat(amountInput.value);
  const merchant = merchantInput.value.trim();

  if (!amount || amount <= 0) { shake(amountInput); return; }
  if (!merchant)              { shake(merchantInput); return; }
  if (!selectedCategory)     { shake(document.getElementById('modalCategories')); return; }

  const originalText = confirmBtn.textContent;
  confirmBtn.disabled   = true;
  confirmBtn.textContent = 'Saving…';

  try {
    const today = new Date().toISOString().slice(0, 10);
    await API.createTransaction({ merchant, amount, category: selectedCategory, date: today });
    modal.classList.remove('open');
    await loadAll();
    showToast(`✅ ₹${amount} from ${merchant} → ${CATEGORY_ICONS[selectedCategory]} ${selectedCategory}`);
  } catch (e) {
    showToast('❌ ' + e.message);
  } finally {
    confirmBtn.disabled   = false;
    confirmBtn.textContent = originalText;
  }
});

// ============================
// LOAD ALL DATA FROM API
// ============================
async function loadAll() {
  try {
    const [transactions, analytics] = await Promise.all([
      API.getTransactions(),
      API.getAnalytics(),
    ]);
    state.transactions = transactions;
    state.analytics    = analytics;
    state.budgets      = analytics.budgetProgress.map(b => ({ category: b.category, amount: b.budget }));

    renderKPIs();
    renderPieChart();
    renderCategoryBars();
    renderRecentTransactions();

    // Refresh visible tab
    const activeTab = document.querySelector('.demo-nav-item.active')?.dataset?.tab;
    if (activeTab === 'transactions') renderFullTransactions(document.getElementById('txnSearch').value, document.getElementById('txnFilter').value);
    if (activeTab === 'analytics')    { renderLineChart(); renderBudgetProgress(); }
  } catch (e) {
    console.error('Failed to load data:', e);
    showError('Could not connect to SBETS-LITE backend. Make sure the server is running.');
  }
}

// ============================
// TOAST & ERROR
// ============================
function showToast(msg, duration = 3500) {
  const t = document.createElement('div');
  t.className = 'sbets-toast';
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, duration);
}

function showError(msg) {
  const existing = document.getElementById('apiErrorBanner');
  if (existing) return;
  const banner = document.createElement('div');
  banner.id = 'apiErrorBanner';
  banner.innerHTML = `
    <div style="position:fixed;bottom:0;left:0;right:0;background:#1a1a35;border-top:1px solid #ef4444;
    padding:16px 24px;display:flex;align-items:center;justify-content:space-between;z-index:9999;font-family:'Inter',sans-serif">
      <span style="color:#fca5a5;font-size:14px">⚠️ ${msg}</span>
      <button onclick="this.closest('#apiErrorBanner').remove()" style="background:#ef4444;color:#fff;border:none;border-radius:8px;padding:6px 12px;cursor:pointer;font-size:13px">Dismiss</button>
    </div>`;
  document.body.appendChild(banner);
}

function shake(el) {
  el.style.animation = 'none';
  void el.offsetHeight;
  el.style.animation = 'shake 0.4s ease';
  el.style.borderColor = '#ef4444';
  setTimeout(() => { el.style.borderColor = ''; el.style.animation = ''; }, 500);
}

// ============================
// CAROUSEL
// ============================
const slides = document.querySelectorAll('.carousel-slide');
const dots   = document.querySelectorAll('.cdot');
let currentSlide = 0;

function goToSlide(n) {
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = (n + slides.length) % slides.length;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

document.getElementById('prevSlide').addEventListener('click', () => goToSlide(currentSlide - 1));
document.getElementById('nextSlide').addEventListener('click', () => goToSlide(currentSlide + 1));
dots.forEach((d, i) => d.addEventListener('click', () => goToSlide(i)));

let autoplay = setInterval(() => goToSlide(currentSlide + 1), 4000);
const cWrap  = document.querySelector('.carousel-wrapper');
cWrap.addEventListener('mouseenter', () => clearInterval(autoplay));
cWrap.addEventListener('mouseleave', () => { autoplay = setInterval(() => goToSlide(currentSlide + 1), 4000); });

// ============================
// INJECT EXTRA CSS
// ============================
const extraStyle = document.createElement('style');
extraStyle.textContent = `
  @keyframes shake {
    0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
  }

  .sbets-toast {
    position:fixed; bottom:32px; right:32px; z-index:9999;
    background:linear-gradient(135deg,#16162a,#1a1a35);
    border:1px solid rgba(99,102,241,0.4); color:#f1f5f9;
    border-radius:14px; padding:14px 20px; font-size:14px;
    font-weight:500; box-shadow:0 8px 32px rgba(0,0,0,0.4);
    max-width:380px; line-height:1.5; font-family:'Inter',sans-serif;
    transform:translateY(20px); opacity:0; transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
  }
  .sbets-toast.show { transform:translateY(0); opacity:1; }

  .txn-delete-btn {
    background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.2);
    border-radius:8px; padding:6px 10px; cursor:pointer; font-size:14px;
    transition:all 0.2s; color:#ef4444; flex-shrink:0;
  }
  .txn-delete-btn:hover { background:rgba(239,68,68,0.25); }

  .budget-pct-wrap { display:flex; align-items:center; gap:8px; }
  .edit-budget-btn {
    background:none; border:none; cursor:pointer; font-size:14px;
    opacity:0.5; transition:opacity 0.2s; padding:2px;
  }
  .edit-budget-btn:hover { opacity:1; }

  .loading { opacity:0.5; pointer-events:none; }
  .empty-state { text-align:center; padding:40px; color:#64748b; font-size:14px; }
`;
document.head.appendChild(extraStyle);

// ============================
// INIT
// ============================
loadAll();
