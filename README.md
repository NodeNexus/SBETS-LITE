<div align="center">

<h1>💡 SBETS-LITE</h1>
<h3>Smart Budget & Expense Tracking System — Lite Edition</h3>

<p>
  <img src="https://img.shields.io/badge/version-1.0.0-brightgreen?style=for-the-badge" alt="version" />
  <img src="https://img.shields.io/badge/Node.js-%3E%3D18.0.0-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Storage-lowdb%20JSON-f7df1e?style=for-the-badge" alt="lowdb" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="license" />
</p>

<p><em>A sleek, full-stack personal finance tracker with a REST API backend and a beautiful single-page frontend — no database setup required.</em></p>

</div>

---

## 📸 Overview

SBETS-LITE is a lightweight but powerful **expense tracking web application** built with Node.js, Express, and a zero-config JSON file database (`lowdb`). It features a modern fintech-styled UI with real-time analytics, category budgeting, and intelligent merchant-to-category suggestions.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Dashboard Analytics** | Monthly spend summary, daily 7-day trend chart, and category breakdown |
| 💳 **Transaction Management** | Add, edit, and delete transactions with full CRUD support |
| 🎯 **Budget Tracking** | Set per-category monthly budgets with live progress bars |
| 🔍 **Smart Suggestions** | Auto-detects category from merchant name (e.g. "Swiggy" → Food) |
| 💾 **Zero-Config Storage** | Uses `lowdb` — data persists in a local JSON file, no database needed |
| 🌐 **REST API** | Clean, JSON-based REST endpoints ready for integration or frontend swaps |
| 🌱 **Demo Seed Data** | Auto-seeds 15 realistic transactions on first run |
| 📱 **Responsive Design** | Premium dark-mode UI that works across desktop and mobile |

---

## 🗂️ Project Structure

```
SBETS-LITE/
├── server.js          # Express REST API (routes, middleware, server)
├── db.js              # lowdb setup, schema defaults & seed data
├── index.html         # Single-page frontend (HTML structure)
├── styles.css         # Premium dark-mode fintech CSS styling
├── script.js          # Frontend JS — API calls, charts, UI logic
├── package.json       # Project metadata & dependencies
├── .gitignore         # Ignores node_modules, .env, log files
└── SBETS-LITE-data.json  # Auto-generated data file (git-ignored)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) `>= 18.0.0`
- npm (comes with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/NodeNexus/SBETS-LITE.git
cd SBETS-LITE

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Then open your browser and visit **[http://localhost:3000](http://localhost:3000)**.

> 💡 On first run, the app auto-seeds **15 demo transactions** so you can explore all features immediately.

### Scripts

| Command | Description |
|---|---|
| `npm start` | Start the production server |
| `npm run dev` | Start with `nodemon` (auto-restarts on file change) |

---

## 🔌 REST API Reference

Base URL: `http://localhost:3000`

### Transactions

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/transactions` | List all transactions (newest first) |
| `GET` | `/api/transactions/:id` | Get a single transaction by ID |
| `POST` | `/api/transactions` | Create a new transaction |
| `PUT` | `/api/transactions/:id` | Update an existing transaction |
| `DELETE` | `/api/transactions/:id` | Delete a transaction |

**POST / PUT Body:**
```json
{
  "merchant": "Swiggy",
  "amount": 340,
  "category": "Food",
  "note": "Dinner order",
  "date": "2026-03-22"
}
```

### Budgets

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/budgets` | List all category budgets |
| `PUT` | `/api/budgets/:category` | Set budget for a category |

**PUT Body:**
```json
{ "amount": 5000 }
```

### Analytics & Utilities

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics` | Full analytics summary (monthly, daily, by category, budget progress) |
| `GET` | `/api/suggest?merchant=Uber` | Suggest a category from a merchant name |

### Response Format

All responses follow this consistent envelope:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Error message here" }
```

---

## 🏷️ Supported Categories

```
Food  |  Transport  |  Shopping  |  Health  |  Entertainment  |  Other
```

---

## 🤖 Merchant Auto-Suggest Map

The `/api/suggest` endpoint automatically maps popular Indian & global merchants to their categories:

| Merchants | Category |
|---|---|
| Swiggy, Zomato, Dominos, KFC, Blinkit, Zepto | 🍔 Food |
| Uber, Ola, Rapido, Lyft | 🚗 Transport |
| Amazon, Flipkart, Myntra, Nykaa, Meesho, Ajio | 🛍️ Shopping |
| Apollo, Medplus, PharmEasy, 1mg, Netmeds | 💊 Health |
| Netflix, Spotify, Hotstar, BookMyShow, PVR | 🎬 Entertainment |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js ≥ 18 |
| **Framework** | Express.js 4.x |
| **Database** | lowdb v1 (JSON file via FileSync adapter) |
| **CORS** | cors middleware |
| **Dev Tool** | nodemon |
| **Frontend** | Vanilla HTML / CSS / JavaScript (no framework) |

---

## 📦 Deployment

You can deploy SBETS-LITE to platforms like **Render**, **Railway**, or **Fly.io**.

**Build Command:**
```bash
npm install
```

**Start Command:**
```bash
npm start
```

> ⚠️ Note: Since `lowdb` writes to a local JSON file, the data file (`SBETS-LITE-data.json`) will reset on each deploy on ephemeral platforms. For persistent storage, consider replacing `lowdb` with a hosted database like MongoDB Atlas or PostgreSQL.

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/NodeNexus">NodeNexus</a></sub>
</div>