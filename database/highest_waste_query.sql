-- ============================================================================
-- Query: Food Item with Highest Total Wastage
-- Purpose: Identifies the food item with the highest cumulative quantity
--          wasted across all recorded daily batches.
-- Target RDBMS: MySQL 8.0+
-- Course: DBMS Experiential Learning - Level 3 Project (CSE Department)
-- Project: EcoBite - College Canteen Food Waste Intelligence Platform
-- ============================================================================

USE ecobite_db;

SELECT 
    f.food_id,
    f.food_name,
    f.category,
    SUM(b.quantity_wasted) AS total_wasted_quantity
FROM daily_batches b
INNER JOIN food_items f ON b.food_id = f.food_id
GROUP BY f.food_id, f.food_name, f.category
ORDER BY total_wasted_quantity DESC
LIMIT 1;

