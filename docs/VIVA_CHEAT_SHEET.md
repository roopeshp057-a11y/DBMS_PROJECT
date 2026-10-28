# 🎓 EcoBite: Examiner Viva & Evaluation Cheat Sheet
## PES University CSE Dept — DBMS Level 3 Experiential Learning

Use these exact answers during your viva with the professor/evaluator.

---

### Q1: "Why is this project more than simple CRUD?"
> **Answer:** "A simple CRUD app just records what food was added or eaten. EcoBite uses the database to actively solve the root cause of food waste:
> 1. It calculates dynamic waste rates using database **triggers** instead of application code.
> 2. It runs **Stored Procedures** (`sp_GetPrepRecommendation`) to forecast demand and recommend optimal prep quantities based on historical weekday patterns.
> 3. It uncovers temporal anomalies (e.g. Friday waste jumping to 34% vs 7% on weekdays due to early hostel departures).
> 4. It links structured SQL loss metrics with NoSQL sensory feedback to identify *why* food was rejected (e.g. spiciness or oversized portions)."

---

### Q2: "Why did you use BOTH SQL and NoSQL?"
> **Answer:**
> - **MySQL (SQL):** "We use MySQL for operational integrity. Food catalog, daily batch tracking, financial costs, and audit logs require strict ACID properties, foreign key cascade rules, and check constraints (`sold <= prepared`)."
> - **MongoDB (NoSQL):** "Student feedback is unstructured and polymorphic. One student complains about temperature ('cold'), another about portion size ('portion_too_large'), and another about spice. Storing this in MongoDB allows flexible document schemas and lets us run multi-stage aggregation pipelines (`$match` $\to$ `$unwind` $\to$ `$group`) without rigid schema migrations."

---

### Q3: "What are your 4+ Advanced SQL Concepts?"
> **Answer:**
> 1. **ACID Transactions (`sp_RecordDailyBatchWithTransaction`):** Ensures atomic insertion of batch records, audit trail logging, and constraint validation. If `sold > prepared`, it triggers an automatic `ROLLBACK` via SQL state 45000.
> 2. **Triggers (`trg_batches_before_insert`, `trg_batches_after_insert_alert`):** Auto-calculates `quantity_wasted` and `waste_percentage` *before* insertion, and dispatches urgent alerts into `waste_alerts` if waste exceeds 20%.
> 3. **Stored Procedures & Functions (`sp_GetPrepRecommendation`, `fn_CalculateCostLoss`):** Predicts preparation amounts using historical moving averages with a 5% variance cushion and computes financial losses in INR.
> 4. **Views (`vw_HighWasteItems`, `vw_DayOfWeekTrends`, `vw_CategoryWasteSummary`):** Pre-compiled multi-table join aggregations for dashboard queries.
> 5. **Composite Indexing:** B-Tree indexes on `(record_date, meal_type)` and `(food_id, record_date)` for fast temporal lookups.

---

### Q4: "Show me a complex SQL query with JOIN and GROUP BY/HAVING."
> **Answer:** "In our Examiner Viva tab inside the web app (and in `database/queries.sql`), we demonstrate:
> - **Query 1:** A 3-table `INNER JOIN` (`daily_batches`, `food_items`, `canteens`) with `SUM()`, `ROUND()`, `GROUP BY`, and `ORDER BY` to rank top wasted items.
> - **Query 2:** A `GROUP BY` with `HAVING AVG(waste_percentage) > 15.00` to isolate high-risk menu dishes.
> - **Query 3:** A correlated subquery comparing individual batches against the campus average waste benchmark."

---

### Q5: "How does your MongoDB Aggregation Pipeline work?"
> **Answer:**
> 1. `$match`: Filters reviews where student rating is $\le 3$ stars.
> 2. `$unwind: "$sensory_tags"`: Flattens the nested array of complaint tags.
> 3. `$group`: Groups by tag (e.g. `too_spicy`), counts occurrences, and calculates average rating.
> 4. `$project`: Formats fields for dashboard display.
> 5. `$sort`: Ranks the most severe waste driver at the top.

---

### Q6: "How did you ensure database credentials are not hard-coded?"
> **Answer:** "All database connections (MySQL host, port, credentials, and MongoDB connection strings) are loaded securely through `.env.local` using environment variables as mandated by Section 10 of the project specification."
