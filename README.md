# 🍱 EcoBite — College Canteen Food Waste Tracker

![MySQL](https://img.shields.io/badge/Database-MySQL_8.0-blue?style=for-the-badge&logo=mysql)
![MongoDB](https://img.shields.io/badge/NoSQL-MongoDB_6.0-green?style=for-the-badge&logo=mongodb)
![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-black?style=for-the-badge&logo=next.js)

---

## 🌟 Overview
**EcoBite** is a database-driven food waste tracker designed for college canteens. It tracks daily food preparation, student sales, and food wastage to identify patterns (such as higher wastage on Fridays) and help canteen management make better decisions about how much food to prepare.

---

## 🚀 Key Features
1. **Food Preparation Recommendation:** Recommends optimal preparation quantities using historical sales averages to prevent overproduction.
2. **Weekly Wastage Patterns:** Identifies which days of the week have the highest wastage so staff can adjust food preparation.
3. **Food Waste by Category:** Breaks down wastage across Lunch, Dinner, Breakfast, and Snacks.
4. **Staff Fast-Entry Portal:** Easy counters for staff to record daily food prepared and sold, with automated waste calculation.
5. **Surplus Clearance Deals:** Allows canteens to list remaining meals at discounted rates before closing.
6. **Student Feedback:** Collects student reviews and reasons for unfinished food (spiciness, cold food, large portions) in MongoDB.

---

## 🗄️ Database Architecture

### 1. SQL Database (MySQL 8.0)
- **Tables:** `users`, `canteens`, `food_items`, `daily_batches`, `waste_alerts`, `surplus_flash_deals`, `audit_logs`.
- **Triggers:**
  - `trg_batches_before_insert`: Automatically calculates `quantity_wasted` and `waste_percentage` from entered preparation and sales quantities.
  - `trg_batches_after_insert_alert`: Generates alerts when food waste exceeds 20%.
- **Stored Procedures & Functions:**
  - `sp_GetPrepRecommendation`: Computes demand recommendations based on historical day-of-week averages.
  - `fn_CalculateCostLoss`: Calculates financial rupee loss (`wasted_qty * unit_cost`).
- **Views:** `vw_HighWasteItems`, `vw_DayOfWeekTrends`, `vw_CategoryWasteSummary`.
- **Transactions:** Ensures all daily food records are logged with ACID integrity and automatic rollback on invalid entries.

### 2. NoSQL Database (MongoDB)
- **Collection:** `food_feedback`
- **Purpose:** Stores flexible student feedback, ratings, and sensory tags (`too_spicy`, `cold`, `portion_too_large`).

---

## ⚙️ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/roopeshp057-a11y/DBMS_PROJECT.git
cd DBMS_PROJECT
npm install
```

### 2. Set Up Environment
```bash
cp .env.example .env.local
```

### 3. Database Setup (Optional for Live MySQL)
Run the SQL scripts in your MySQL client:
```bash
mysql -u root -p < database/schema.sql
mysql -u root -p < database/seed_data.sql
```

### 4. Run the Application
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

## 📂 Project Structure
```
DBMS_PROJECT/
├── database/
│   ├── schema.sql           # MySQL tables, triggers, views, stored procedures
│   ├── seed_data.sql        # Sample multi-week canteen data
│   ├── mongodb_setup.js     # MongoDB collections and aggregation pipelines
│   └── queries.sql          # Sample SQL queries (JOIN, GROUP BY, HAVING)
├── docs/
│   └── DBMS_PROJECT_REPORT.md  # Detailed project documentation
├── src/
│   ├── app/
│   │   ├── api/             # API routes (analytics, batches, feedback, etc)
│   │   ├── globals.css      # Styling
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Dashboard, Staff Portal & Student Kiosk
│   └── lib/
│       └── db.ts            # Database connection & fallback engine
├── package.json
└── README.md
```
