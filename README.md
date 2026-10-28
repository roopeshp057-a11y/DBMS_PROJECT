# 🍱 EcoBite — College Canteen Food Waste Intelligence Platform
### DBMS Experiential Learning — Level 3 Project | Department of CSE, PES University

![DBMS Level 3](https://img.shields.io/badge/PES_University-CSE_DBMS_Level_3-emerald?style=for-the-badge)
![MySQL](https://img.shields.io/badge/SQL-MySQL_8.0-blue?style=for-the-badge&logo=mysql)
![MongoDB](https://img.shields.io/badge/NoSQL-MongoDB_6.0-green?style=for-the-badge&logo=mongodb)
![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black?style=for-the-badge&logo=next.js)

---

## 🌟 Executive Overview
**EcoBite** is a dual-paradigm database application designed for college campus dining halls. It solves the critical problem of food overproduction and waste by tracking daily preparation, sales, and discarded quantities, automatically identifying behavioral consumption patterns (e.g., student attendance drop-offs on Fridays), and generating predictive preparation targets via database stored procedures.

---

## 🚀 Key Features Beyond Simple CRUD
1. **🤖 Smart Prep Advisor (Stored Procedure):** Runs `sp_GetPrepRecommendation()` to forecast meal demand using historical day-of-week moving averages with a 5% variance buffer.
2. **⚡ Flash Surplus Clearance (Dynamic Redistribution):** Allows canteen staff to publish 50% flash clearance vouchers at the end of lunch service before surplus food turns into waste.
3. **🔍 MongoDB Root-Cause Sensory Intelligence:** Runs a 5-stage NoSQL Aggregation Pipeline (`$match` $\to$ `$unwind` $\to$ `$group`) on student complaint tags (`too_spicy`, `cold`, `portion_too_large`) to explain *why* food is discarded.
4. **💰 Financial & Carbon Impact Analytics:** Auto-computes real-time monetary rupee loss and estimated carbon emissions (kg CO₂).
5. **🎓 Examiner Viva Verification Hub:** Built-in interactive dashboard tab that executes all complex SQL queries (JOINs, HAVING, Subqueries, Triggers, Transactions) live with 1-click for faculty evaluation.

---

## 🗄️ Database Architecture & Concepts Demonstrated

### 1. Mandatory SQL: MySQL 8.0
- **Tables & DDL:** `users`, `canteens`, `food_items`, `daily_batches`, `waste_alerts`, `surplus_flash_deals`, `audit_logs`.
- **Triggers:**
  - `trg_batches_before_insert`: Validates quantities and auto-computes `quantity_wasted` and `waste_percentage`.
  - `trg_batches_after_insert_alert`: Dispatches urgent notifications to `waste_alerts` when waste $\ge 20\%$.
- **ACID Transactions:** `sp_RecordDailyBatchWithTransaction` with automatic `ROLLBACK` on constraint violations.
- **Stored Procedures & Functions:**
  - `sp_GetPrepRecommendation`: Computes demand targets and potential savings in INR.
  - `fn_CalculateCostLoss`: Computes financial loss in ₹ (`wasted_qty * unit_cost`).
  - `fn_GetCanteenEcoRating`: Computes campus green grade ('A+' to 'C').
- **Views:** `vw_HighWasteItems`, `vw_DayOfWeekTrends`, `vw_CategoryWasteSummary`.
- **Composite Indexes:** `idx_batch_date_meal`, `idx_batch_food_date`, `idx_food_category`.

### 2. NoSQL: MongoDB
- **Collection:** `food_feedback`
- **Aggregation Pipeline:** Multistage statistical analysis linking unstructured sensory tags to high-waste dishes.

---

## ⚙️ Quick Start & Execution Instructions

### Prerequisites
- Node.js (v18.0 or higher)
- MySQL 8.0 (or higher)
- MongoDB (Local instance or MongoDB Atlas connection string)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/roopeshp057-a11y/DBMS_PROJECT.git
cd DBMS_PROJECT
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and configure your credentials:
```bash
cp .env.example .env.local
```

### 3. Initialize MySQL Database
Open **MySQL Workbench** or your terminal:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed_data.sql
```

### 4. Run the Next.js Application
```bash
npm run dev
```
Open your browser at: **`http://localhost:3000`**

---

## 📂 Repository Structure
```
DBMS_PROJECT/
├── database/
│   ├── schema.sql           # Complete MySQL DDL, Tables, Triggers, Procs, Views
│   ├── seed_data.sql        # Realistic multi-week campus dataset
│   ├── mongodb_setup.js     # NoSQL collection, feedback docs, aggregation pipeline
│   └── queries.sql          # Viva demo queries (JOIN, GROUP BY, HAVING, Subqueries)
├── docs/
│   ├── DBMS_PROJECT_REPORT.md  # Soft-copy report fulfilling all 17 syllabus sections
│   └── VIVA_CHEAT_SHEET.md     # Examiner questions and model answers
├── src/
│   ├── app/
│   │   ├── api/             # Next.js API Routes (analytics, batches, viva, etc)
│   │   ├── globals.css      # Modern Plus Jakarta Sans & Glassmorphism styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Master interactive multi-role dashboard
│   └── lib/
│       └── db.ts            # Dual MySQL + MongoDB bridge & fallback engine
├── package.json
└── README.md
```

---

## 🎓 Evaluation & Demonstration Guide
During your project review, navigate to the **"Examiner Viva Hub"** tab in the top navigation bar. You can execute:
1. Multi-Table `JOIN` with Aggregation (Top 5 Wasted Foods)
2. `GROUP BY` with `HAVING` (Dishes with waste $> 15\%$)
3. Correlated Subquery (Batches exceeding campus average)
4. Trigger Auto-Calculation Verification
5. ACID Transaction Rollback Test
6. MongoDB Multi-Stage Aggregation Pipeline
