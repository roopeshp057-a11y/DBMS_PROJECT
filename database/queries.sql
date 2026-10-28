-- ============================================================================
-- IMPORTANT SQL QUERIES (Demonstration & Viva Verification)
-- Course: DBMS Experiential Learning - Level 3 Project (CSE Department)
-- Project: EcoBite - College Canteen Food Waste Intelligence Platform
-- ============================================================================

USE ecobite_db;

-- ============================================================================
-- QUERY 1: MULTI-TABLE INNER JOIN with AGGREGATE FUNCTIONS & ORDER BY
-- Purpose: Find the Top 5 Most Wasted Foods across all canteens
-- Concepts: INNER JOIN (3 tables), SUM(), ROUND(), GROUP BY, ORDER BY, LIMIT
-- ============================================================================
SELECT 
    f.food_name,
    f.category,
    c.canteen_name,
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

-- ============================================================================
-- QUERY 2: GROUP BY with HAVING CLAUSE & AGGREGATE FILTERING
-- Purpose: Identify high-risk food items where AVERAGE waste rate exceeds 15%
-- Concepts: GROUP BY, HAVING, AVG(), COUNT()
-- ============================================================================
SELECT 
    f.food_name,
    f.category,
    COUNT(b.batch_id) AS recorded_sessions,
    ROUND(AVG(b.waste_percentage), 2) AS average_waste_pct,
    MAX(b.waste_percentage) AS peak_waste_pct
FROM food_items f
INNER JOIN daily_batches b ON f.food_id = b.food_id
GROUP BY f.food_id, f.food_name, f.category
HAVING AVG(b.waste_percentage) > 15.00
ORDER BY average_waste_pct DESC;

-- ============================================================================
-- QUERY 3: CORRELATED SUBQUERY
-- Purpose: Find batches where waste exceeded the canteen's overall average waste
-- Concepts: Correlated Subquery, WHERE condition comparing against subquery result
-- ============================================================================
SELECT 
    b.batch_id,
    b.record_date,
    b.meal_type,
    f.food_name,
    b.quantity_prepared,
    b.quantity_wasted,
    b.waste_percentage
FROM daily_batches b
JOIN food_items f ON b.food_id = f.food_id
WHERE b.waste_percentage > (
    -- Subquery: Overall average waste percentage across all recorded batches
    SELECT AVG(waste_percentage) 
    FROM daily_batches
)
ORDER BY b.waste_percentage DESC;

-- ============================================================================
-- QUERY 4: NESTED SUBQUERY with AGGREGATION (Day-of-Week Anomaly Detection)
-- Purpose: Compare Friday average waste against non-Friday average waste
-- Concepts: Subquery in SELECT clause, CASE expression, DAYNAME()
-- ============================================================================
SELECT 
    CASE 
        WHEN DAYNAME(record_date) = 'Friday' THEN 'Friday (Campus Weekend Exodus)'
        ELSE 'Regular Weekdays (Mon-Thu)'
    END AS day_classification,
    COUNT(batch_id) AS total_batches,
    SUM(quantity_prepared) AS total_prep,
    SUM(quantity_sold) AS total_sold,
    SUM(quantity_wasted) AS total_wasted,
    ROUND((SUM(quantity_wasted) / SUM(quantity_prepared)) * 100, 2) AS group_waste_rate_pct
FROM daily_batches
GROUP BY 
    CASE 
        WHEN DAYNAME(record_date) = 'Friday' THEN 'Friday (Campus Weekend Exodus)'
        ELSE 'Regular Weekdays (Mon-Thu)'
    END;

-- ============================================================================
-- QUERY 5: LEFT OUTER JOIN (Catalog Items with Low or Zero Tracking)
-- Purpose: Audit food items that have not had active daily batches logged
-- Concepts: LEFT OUTER JOIN, IS NULL filter
-- ============================================================================
SELECT 
    f.food_id,
    f.food_name,
    f.category,
    f.selling_price,
    c.canteen_name,
    COUNT(b.batch_id) AS batch_count
FROM food_items f
JOIN canteens c ON f.canteen_id = c.canteen_id
LEFT JOIN daily_batches b ON f.food_id = b.food_id
GROUP BY f.food_id, f.food_name, f.category, f.selling_price, c.canteen_name
HAVING COUNT(b.batch_id) = 0 OR COUNT(b.batch_id) < 3;

-- ============================================================================
-- QUERY 6: CALLING STORED PROCEDURE
-- Purpose: Execute smart preparation recommendation for Vegetable Biryani on Friday
-- Concepts: CALL, Stored Procedure with OUT variables
-- ============================================================================
SET @rec_qty = 0;
SET @avg_sold = 0.0;
SET @pot_savings = 0.0;

CALL sp_GetPrepRecommendation(1, 'Friday', @rec_qty, @avg_sold, @pot_savings);

SELECT 
    'Vegetable Dum Biryani' AS target_food,
    'Friday' AS target_day,
    @avg_sold AS historical_avg_sold,
    @rec_qty AS recommended_prep_quantity,
    @pot_savings AS estimated_rupee_savings;

-- ============================================================================
-- QUERY 7: TESTING DATABASE TRIGGER (Trigger Verification)
-- Purpose: Insert a batch and verify that quantity_wasted & waste_percentage
--          are computed automatically by the trigger without manual input!
-- ============================================================================
INSERT INTO daily_batches (food_id, canteen_id, record_date, meal_type, quantity_prepared, quantity_sold, logged_by)
VALUES (1, 1, '2026-10-29', 'LUNCH', 100, 70, 2);

-- Check that trigger computed: quantity_wasted = 30 and waste_percentage = 30.00%
SELECT batch_id, food_id, quantity_prepared, quantity_sold, quantity_wasted, waste_percentage
FROM daily_batches
WHERE record_date = '2026-10-29' AND meal_type = 'LUNCH';

-- Check that trigger automatically created an entry in waste_alerts!
SELECT * FROM waste_alerts ORDER BY alert_id DESC LIMIT 1;
