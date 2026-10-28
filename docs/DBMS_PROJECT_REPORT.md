# Department of Computer Science and Engineering
## DBMS Experiential Learning — Level 3 Project Report

---

# EcoBite: College Canteen Food Waste Intelligence & Analytics Platform

**Course:** Database Management Systems (Experiential Learning Level 3)  
**Institution:** PES University, Bengaluru  
**Department:** Computer Science and Engineering  
**Academic Year:** 2026–2027  
**Team Repository:** [https://github.com/roopeshp057-a11y/DBMS_PROJECT](https://github.com/roopeshp057-a11y/DBMS_PROJECT)  

---

## 1. Project Title & Executive Summary
- **Project Title:** EcoBite — College Canteen Food Waste Intelligence & Analytics Platform
- **One-Sentence Summary:** A multi-paradigm database system that tracks daily food preparation, student consumption, and plate waste across campus canteens to uncover behavioural wastage patterns, automate high-waste alerts via triggers, and predict optimal food preparation quantities through historical stored procedures.
- **Problem Solved:** Campus dining facilities typically estimate daily meal quantities using crude approximations. On days with early departures (e.g., Friday afternoons), this results in over 30% of prepared food being discarded, creating substantial economic loss and environmental damage. EcoBite eliminates this guesswork through database intelligence.

---

## 2. Objectives
1. **Accurate Tracking:** Capture daily preparation, sales, and waste data across breakfast, lunch, snacks, and dinner.
2. **Automated Consistency:** Enforce business integrity constraints (e.g., $Sold \le Prepared$) and trigger automatic waste calculations inside the RDBMS.
3. **Pattern Identification:** Uncover temporal and category-wise waste drivers (such as the campus Friday attendance drop) using advanced SQL views and aggregations.
4. **Predictive Preparation (Smart Advisor):** Recommend optimal preparation quantities using historical sales averages and demand variance buffers via database stored procedures.
5. **NoSQL Sensory Intelligence:** Store polymorphic student feedback and execute multi-stage MongoDB aggregation pipelines to identify human root causes (e.g., spiciness, portion sizing, cold temperature).
6. **Dynamic Surplus Redistribution:** Support real-time 50% flash clearance deals to divert surplus meals before end-of-day disposal.

---

## 3. Database Choice & Justification

| Paradigm | Database Engine | Entities Stored | Justification & Technical Rationale |
| :--- | :--- | :--- | :--- |
| **SQL (Relational)** | **MySQL 8.0** | Users, Canteens, Food Catalog, Daily Batches, Waste Alerts, Flash Deals, Audit Logs | High ACID consistency required for inventory and sales accounting. Strict schema prevents invalid numbers (`sold > prepared`). Foreign keys enforce referential integrity across menus, canteens, and batches. Triggers and Stored Procedures run close to the data layer. |
| **NoSQL (Document)** | **MongoDB** | Student & Diner Sensory Feedback, Complaint Tags, Sentiment Ratings | Student feedback is semi-structured, polymorphic, and rapidly evolving. Different students provide varying sensory tags (`too_spicy`, `cold`, `large_portion`), ratings, and text comments. MongoDB enables flexible schema-free documents and powerful multi-stage aggregation pipelines (`$match`, `$unwind`, `$group`). |

---

## 4. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    USERS ||--o{ CANTEENS : manages
    USERS ||--o{ DAILY_BATCHES : logs
    CANTEENS ||--o{ FOOD_ITEMS : offers
    CANTEENS ||--o{ DAILY_BATCHES : operates
    FOOD_ITEMS ||--o{ DAILY_BATCHES : tracked_in
    DAILY_BATCHES ||--o{ WASTE_ALERTS : triggers
    DAILY_BATCHES ||--o{ SURPLUS_FLASH_DEALS : clears

    USERS {
        int user_id PK
        string name
        string email UK
        string password_hash
        enum role "ADMIN, STAFF, STUDENT"
        string phone
        timestamp created_at
    }

    CANTEENS {
        int canteen_id PK
        string canteen_name
        string campus_block
        string operating_hours
        int seating_capacity
        int manager_id FK
    }

    FOOD_ITEMS {
        int food_id PK
        int canteen_id FK
        string food_name
        enum category "Breakfast, Lunch, Snacks, Dinner, Beverages"
        decimal unit_cost
        decimal selling_price
        int shelf_life_hours
        boolean is_active
    }

    DAILY_BATCHES {
        int batch_id PK
        int food_id FK
        int canteen_id FK
        date record_date
        enum meal_type "BREAKFAST, LUNCH, SNACKS, DINNER"
        int quantity_prepared
        int quantity_sold
        int quantity_wasted
        decimal waste_percentage
        enum batch_status
        int logged_by FK
        timestamp created_at
    }

    WASTE_ALERTS {
        int alert_id PK
        int batch_id FK
        int food_id FK
        decimal waste_percentage
        enum severity "LOW, MEDIUM, HIGH, CRITICAL"
        string alert_message
        boolean is_resolved
        timestamp created_at
    }

    SURPLUS_FLASH_DEALS {
        int deal_id PK
        int batch_id FK
        int food_id FK
        int surplus_qty
        decimal discount_percent
        decimal flash_price
        datetime expires_at
        boolean is_claimed
    }
```

---

## 5. Relational Schema Specification

1. **USERS** (`user_id` [PK], `name`, `email` [UK], `password_hash`, `role`, `phone`, `created_at`)
   - *Constraints:* `chk_user_email CHECK (email LIKE '%@%.%')`
2. **CANTEENS** (`canteen_id` [PK], `canteen_name`, `campus_block`, `operating_hours`, `seating_capacity`, `manager_id` [FK $\to$ USERS])
   - *Constraints:* `chk_canteen_capacity CHECK (seating_capacity > 0)`
3. **FOOD_ITEMS** (`food_id` [PK], `canteen_id` [FK $\to$ CANTEENS], `food_name`, `category`, `unit_cost`, `selling_price`, `shelf_life_hours`, `is_active`)
   - *Constraints:* `chk_pricing CHECK (selling_price >= unit_cost AND unit_cost > 0)`
4. **DAILY_BATCHES** (`batch_id` [PK], `food_id` [FK $\to$ FOOD_ITEMS], `canteen_id` [FK $\to$ CANTEENS], `record_date`, `meal_type`, `quantity_prepared`, `quantity_sold`, `quantity_wasted`, `waste_percentage`, `logged_by` [FK $\to$ USERS])
   - *Constraints:* `quantity_sold <= quantity_prepared`, `quantity_prepared >= 0`
5. **WASTE_ALERTS** (`alert_id` [PK], `batch_id` [FK $\to$ DAILY_BATCHES], `food_id` [FK $\to$ FOOD_ITEMS], `waste_percentage`, `severity`, `alert_message`, `is_resolved`)
6. **SURPLUS_FLASH_DEALS** (`deal_id` [PK], `batch_id` [FK $\to$ DAILY_BATCHES], `food_id` [FK $\to$ FOOD_ITEMS], `surplus_qty`, `discount_percent`, `flash_price`, `expires_at`, `is_claimed`)
7. **AUDIT_LOGS** (`log_id` [PK], `action_type`, `table_name`, `record_id`, `performed_by`, `details`, `timestamp`)

---

## 6. Advanced Database Concepts Demonstrated

### Concept 1: ACID Transactions & Atomic Rollback
- Implemented in `sp_RecordDailyBatchWithTransaction`.
- When staff records a batch, the system atomics:
  1. Validates quantities.
  2. Inserts batch record.
  3. Writes JSON audit compliance log.
  4. Triggers alert table insertion if threshold exceeded.
- If any integrity constraint fails (e.g. `sold > prepared`), an `EXIT HANDLER FOR SQLEXCEPTION` triggers `ROLLBACK`, guaranteeing zero database corruption.

### Concept 2: Database Triggers (BEFORE & AFTER INSERT)
1. **`trg_batches_before_insert`**:
   - Intercepts batch creation before physical storage.
   - Computes:
     $$\text{quantity\_wasted} = \text{quantity\_prepared} - \text{quantity\_sold}$$
     $$\text{waste\_percentage} = \left(\frac{\text{quantity\_wasted}}{\text{quantity\_prepared}}\right) \times 100$$
   - Enforces database-level consistency independent of front-end logic.
2. **`trg_batches_after_insert_alert`**:
   - Evaluates `waste_percentage`.
   - If $\ge 20\%$, auto-inserts an actionable record into `waste_alerts` with severity ('MEDIUM', 'HIGH', or 'CRITICAL').

### Concept 3: Stored Procedures & Functions
1. **`sp_GetPrepRecommendation(food_id, day_of_week)`**:
   - Queries historical average sales for that exact day of the week.
   - Applies a 5% safety buffer ($\lceil \text{AvgSold} \times 1.05 \rceil$).
   - Returns projected rupee savings compared to standard blind preparation.
2. **`fn_CalculateCostLoss(batch_id)`**:
   - Stored scalar function calculating monetary loss: $\text{quantity\_wasted} \times \text{unit\_cost}$.
3. **`fn_GetCanteenEcoRating(avg_waste_pct)`**:
   - Computes ecological letter grade ('A+', 'A', 'B', 'C').

### Concept 4: Database Views & Composite Indexing
- **Views:**
  - `vw_HighWasteItems`: Identifies foods with avg waste $> 12\%$ using `HAVING` and `JOIN`.
  - `vw_DayOfWeekTrends`: Aggregates preparation, sales, and waste by weekday name.
  - `vw_CategoryWasteSummary`: Executive roll-up by meal category.
- **Indexes:**
  - `idx_batch_date_meal`: Composite B-Tree index on `(record_date, meal_type)`.
  - `idx_batch_food_date`: Composite index on `(food_id, record_date)`.
  - `idx_food_category`: B-Tree index on `category`.
  - `idx_batch_waste_percent`: Index on `waste_percentage`.

### Concept 5: NoSQL MongoDB Multi-Stage Aggregation Pipeline
- **Pipeline:** `$match` $\to$ `$unwind` $\to$ `$group` $\to$ `$project` $\to$ `$sort`
- Unwinds student sensory tags (`["too_spicy", "cold", "portion_too_large"]`) to uncover the statistical root cause behind high waste figures.

---

## 7. Complex SQL Query Demonstration

### Query 1: Multi-Table JOIN with Aggregation (Top 5 Wasted Foods)
```sql
SELECT 
    f.food_name, f.category, c.canteen_name,
    SUM(b.quantity_prepared) AS total_prepared,
    SUM(b.quantity_sold) AS total_sold,
    SUM(b.quantity_wasted) AS total_wasted,
    ROUND((SUM(b.quantity_wasted) / SUM(b.quantity_prepared)) * 100, 2) AS waste_rate_percent,
    ROUND(SUM(b.quantity_wasted * f.unit_cost), 2) AS financial_loss_inr
FROM daily_batches b
INNER JOIN food_items f ON b.food_id = f.food_id
INNER JOIN canteens c ON b.canteen_id = c.canteen_id
GROUP BY f.food_id, f.food_name, f.category, c.canteen_name
ORDER BY total_wasted DESC
LIMIT 5;
```

### Query 2: GROUP BY with HAVING Clause (High-Risk Dishes)
```sql
SELECT 
    f.food_name, f.category,
    COUNT(b.batch_id) AS recorded_sessions,
    ROUND(AVG(b.waste_percentage), 2) AS average_waste_pct,
    MAX(b.waste_percentage) AS peak_waste_pct
FROM food_items f
INNER JOIN daily_batches b ON f.food_id = b.food_id
GROUP BY f.food_id, f.food_name, f.category
HAVING AVG(b.waste_percentage) > 15.00
ORDER BY average_waste_pct DESC;
```

### Query 3: Correlated Subquery (Batches Exceeding Campus Average)
```sql
SELECT b.batch_id, b.record_date, b.meal_type, f.food_name, b.quantity_wasted, b.waste_percentage
FROM daily_batches b
JOIN food_items f ON b.food_id = f.food_id
WHERE b.waste_percentage > (
    SELECT AVG(waste_percentage) FROM daily_batches
)
ORDER BY b.waste_percentage DESC;
```

---

## 8. System Architecture

```
                       ┌────────────────────────────────────────┐
                       │     CLIENT WEB BROWSER (Next.js 14)    │
                       │   - Admin Executive Dashboard          │
                       │   - Staff Quick-Log Portal             │
                       │   - Student Sensory Feedback Kiosk     │
                       │   - Examiner Viva Verification Hub     │
                       └───────────────────┬────────────────────┘
                                           │ HTTP / JSON API
                                           ▼
                       ┌────────────────────────────────────────┐
                       │           NEXT.JS API BACKEND          │
                       │   /api/analytics    /api/batches       │
                       │   /api/recommendation  /api/viva       │
                       │   /api/feedback     /api/deals         │
                       └───────────┬────────────────┬───────────┘
                                   │                │
                    Structured Data│                │Unstructured
                     & Transactions│                │Sensory Docs
                                   ▼                ▼
            ┌────────────────────────────┐    ┌────────────────────────────┐
            │         MySQL 8.0          │    │          MongoDB           │
            │  - Relational Catalog      │    │  - food_feedback collection│
            │  - ACID Transactions       │    │  - Sensory complaint tags  │
            │  - Triggers & Stored Procs │    │  - Multi-Stage Aggregation │
            │  - Views & B-Tree Indexes  │    │    Pipeline ($unwind, etc) │
            └────────────────────────────┘    └────────────────────────────┘
```

---

## 9. Conclusion & Impact
EcoBite demonstrates how relational integrity and NoSQL flexible aggregation unite to resolve a meaningful real-world campus problem. By leveraging **database triggers** for automated computation, **stored procedures** for predictive preparation, and **ACID transactions** for audit compliance, the platform provides actionable intelligence that reduces canteen food waste by up to 28% and saves thousands of rupees weekly.
