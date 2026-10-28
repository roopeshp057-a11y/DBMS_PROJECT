-- ============================================================================
-- DATABASE SCHEMA: College Canteen Food Waste Intelligence Platform (EcoBite)
-- Course: DBMS Experiential Learning - Level 3 Project (CSE Department)
-- Target RDBMS: MySQL 8.0+ / MariaDB / PostgreSQL compatible
-- ============================================================================

-- Step 1: Database Initialization
DROP DATABASE IF EXISTS ecobite_db;
CREATE DATABASE ecobite_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE ecobite_db;

-- ============================================================================
-- 1. DDL: RELATIONAL TABLES & CONSTRAINTS
-- ============================================================================

-- Table 1: USERS (Role-Based Access Control: Admin, Staff, Student)
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'STAFF', 'STUDENT') NOT NULL DEFAULT 'STAFF',
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_email CHECK (email LIKE '%@%.%')
) ENGINE=InnoDB;

-- Table 2: CANTEENS (Campus dining facilities)
DROP TABLE IF EXISTS canteens;
CREATE TABLE canteens (
    canteen_id INT AUTO_INCREMENT PRIMARY KEY,
    canteen_name VARCHAR(120) NOT NULL,
    campus_block VARCHAR(80) NOT NULL,
    operating_hours VARCHAR(100) DEFAULT '07:30 AM - 08:30 PM',
    seating_capacity INT NOT NULL DEFAULT 150,
    manager_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_canteen_manager FOREIGN KEY (manager_id) 
        REFERENCES users(user_id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT chk_canteen_capacity CHECK (seating_capacity > 0)
) ENGINE=InnoDB;

-- Table 3: FOOD_ITEMS (Menu catalog with cost economics)
DROP TABLE IF EXISTS food_items;
CREATE TABLE food_items (
    food_id INT AUTO_INCREMENT PRIMARY KEY,
    canteen_id INT NOT NULL,
    food_name VARCHAR(120) NOT NULL,
    category ENUM('Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Beverages') NOT NULL,
    unit_cost DECIMAL(10, 2) NOT NULL,      -- Cost to produce (INR)
    selling_price DECIMAL(10, 2) NOT NULL,  -- Menu price (INR)
    shelf_life_hours INT DEFAULT 4,         -- Perishable limit
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_food_canteen FOREIGN KEY (canteen_id) 
        REFERENCES canteens(canteen_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT chk_pricing CHECK (selling_price >= unit_cost AND unit_cost > 0)
) ENGINE=InnoDB;

-- Table 4: DAILY_BATCHES (Core tracking of preparation, sales & waste)
DROP TABLE IF EXISTS daily_batches;
CREATE TABLE daily_batches (
    batch_id INT AUTO_INCREMENT PRIMARY KEY,
    food_id INT NOT NULL,
    canteen_id INT NOT NULL,
    record_date DATE NOT NULL,
    meal_type ENUM('BREAKFAST', 'LUNCH', 'SNACKS', 'DINNER') NOT NULL,
    quantity_prepared INT NOT NULL,
    quantity_sold INT NOT NULL DEFAULT 0,
    quantity_wasted INT NOT NULL DEFAULT 0,
    waste_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    batch_status ENUM('PREPARED', 'SERVING', 'COMPLETED', 'SURPLUS_ALERT') DEFAULT 'COMPLETED',
    logged_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_batch_food FOREIGN KEY (food_id) 
        REFERENCES food_items(food_id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE,
    CONSTRAINT fk_batch_canteen FOREIGN KEY (canteen_id) 
        REFERENCES canteens(canteen_id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT fk_batch_user FOREIGN KEY (logged_by) 
        REFERENCES users(user_id) 
        ON DELETE SET NULL,
    CONSTRAINT chk_prep_qty CHECK (quantity_prepared >= 0),
    CONSTRAINT chk_sold_qty CHECK (quantity_sold >= 0),
    CONSTRAINT chk_sold_vs_prep CHECK (quantity_sold <= quantity_prepared)
) ENGINE=InnoDB;

-- Table 5: WASTE_ALERTS (Automated alerts generated when waste threshold exceeded)
DROP TABLE IF EXISTS waste_alerts;
CREATE TABLE waste_alerts (
    alert_id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    food_id INT NOT NULL,
    waste_percentage DECIMAL(5, 2) NOT NULL,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    alert_message VARCHAR(255) NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_alert_batch FOREIGN KEY (batch_id) 
        REFERENCES daily_batches(batch_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_alert_food FOREIGN KEY (food_id) 
        REFERENCES food_items(food_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table 6: SURPLUS_FLASH_DEALS (Dynamic redistribution to minimize waste)
DROP TABLE IF EXISTS surplus_flash_deals;
CREATE TABLE surplus_flash_deals (
    deal_id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    food_id INT NOT NULL,
    surplus_qty INT NOT NULL,
    discount_percent DECIMAL(5, 2) DEFAULT 50.00,
    flash_price DECIMAL(10, 2) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_deal_batch FOREIGN KEY (batch_id) 
        REFERENCES daily_batches(batch_id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_deal_food FOREIGN KEY (food_id) 
        REFERENCES food_items(food_id) 
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- Table 7: AUDIT_LOGS (Transaction history & compliance log)
DROP TABLE IF EXISTS audit_logs;
CREATE TABLE audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NOT NULL,
    performed_by INT NULL,
    details JSON NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- 2. PERFORMANCE INDEXING (DDL)
-- ============================================================================
-- Composite Index for temporal search by date and meal
CREATE INDEX idx_batch_date_meal ON daily_batches (record_date, meal_type);

-- Composite Index for food-level historical analytics
CREATE INDEX idx_batch_food_date ON daily_batches (food_id, record_date);

-- B-Tree Index for categorization filters
CREATE INDEX idx_food_category ON food_items (category);

-- Index for rapid filtering of high-waste batches
CREATE INDEX idx_batch_waste_percent ON daily_batches (waste_percentage);

-- ============================================================================
-- 3. ADVANCED SQL: DATABASE TRIGGERS
-- ============================================================================

-- Trigger 1: Auto-Calculate Waste and Validate Quantities BEFORE INSERT
DELIMITER $$
CREATE TRIGGER trg_batches_before_insert
BEFORE INSERT ON daily_batches
FOR EACH ROW
BEGIN
    -- Guard condition: Quantity sold cannot exceed prepared
    IF NEW.quantity_sold > NEW.quantity_prepared THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Data Integrity Error: Quantity sold cannot exceed quantity prepared.';
    END IF;

    -- Compute wasted quantity
    SET NEW.quantity_wasted = NEW.quantity_prepared - NEW.quantity_sold;

    -- Compute waste percentage safely avoiding division by zero
    IF NEW.quantity_prepared > 0 THEN
        SET NEW.waste_percentage = ROUND((NEW.quantity_wasted / NEW.quantity_prepared) * 100.0, 2);
    ELSE
        SET NEW.waste_percentage = 0.00;
    END IF;
END$$

-- Trigger 2: Auto-Calculate Waste on Update BEFORE UPDATE
CREATE TRIGGER trg_batches_before_update
BEFORE UPDATE ON daily_batches
FOR EACH ROW
BEGIN
    IF NEW.quantity_sold > NEW.quantity_prepared THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Data Integrity Error: Quantity sold cannot exceed quantity prepared.';
    END IF;

    SET NEW.quantity_wasted = NEW.quantity_prepared - NEW.quantity_sold;

    IF NEW.quantity_prepared > 0 THEN
        SET NEW.waste_percentage = ROUND((NEW.quantity_wasted / NEW.quantity_prepared) * 100.0, 2);
    ELSE
        SET NEW.waste_percentage = 0.00;
    END IF;
END$$

-- Trigger 3: Automatically Generate Urgent Alert if Waste > 20% AFTER INSERT
CREATE TRIGGER trg_batches_after_insert_alert
AFTER INSERT ON daily_batches
FOR EACH ROW
BEGIN
    DECLARE v_food_name VARCHAR(120);
    DECLARE v_severity VARCHAR(10);
    
    -- Check threshold
    IF NEW.waste_percentage >= 20.00 THEN
        SELECT food_name INTO v_food_name FROM food_items WHERE food_id = NEW.food_id;
        
        IF NEW.waste_percentage >= 35.00 THEN
            SET v_severity = 'CRITICAL';
        ELSEIF NEW.waste_percentage >= 25.00 THEN
            SET v_severity = 'HIGH';
        ELSE
            SET v_severity = 'MEDIUM';
        END IF;

        INSERT INTO waste_alerts (batch_id, food_id, waste_percentage, severity, alert_message)
        VALUES (
            NEW.batch_id,
            NEW.food_id,
            NEW.waste_percentage,
            v_severity,
            CONCAT('High waste detected for ', v_food_name, ': ', NEW.quantity_wasted, ' units wasted (', NEW.waste_percentage, '%).')
        );
    END IF;
END$$
DELIMITER ;

-- ============================================================================
-- 4. ADVANCED SQL: STORED PROCEDURES & FUNCTIONS
-- ============================================================================

DELIMITER $$

-- Stored Function 1: Calculate Financial Loss in INR for a Given Batch
DROP FUNCTION IF EXISTS fn_CalculateCostLoss$$
CREATE FUNCTION fn_CalculateCostLoss(p_batch_id INT)
RETURNS DECIMAL(10, 2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_cost_loss DECIMAL(10, 2);
    
    SELECT (b.quantity_wasted * f.unit_cost)
    INTO v_cost_loss
    FROM daily_batches b
    JOIN food_items f ON b.food_id = f.food_id
    WHERE b.batch_id = p_batch_id;
    
    RETURN COALESCE(v_cost_loss, 0.00);
END$$

-- Stored Function 2: Eco-Rating Score for Canteen
DROP FUNCTION IF EXISTS fn_GetCanteenEcoRating$$
CREATE FUNCTION fn_GetCanteenEcoRating(p_avg_waste_pct DECIMAL(5,2))
RETURNS VARCHAR(20)
DETERMINISTIC
CONTAINS SQL
BEGIN
    IF p_avg_waste_pct <= 8.00 THEN
        RETURN 'A+ (Zero Waste Hero)';
    ELSEIF p_avg_waste_pct <= 15.00 THEN
        RETURN 'A (Eco Efficient)';
    ELSEIF p_avg_waste_pct <= 22.00 THEN
        RETURN 'B (Moderate Waste)';
    ELSE
        RETURN 'C (Urgent Action Req)';
    END IF;
END$$

-- Stored Procedure 1: Smart Preparation Recommendation Engine
-- Predicts recommended prep based on historical average sales for the given day of week
DROP PROCEDURE IF EXISTS sp_GetPrepRecommendation$$
CREATE PROCEDURE sp_GetPrepRecommendation(
    IN p_food_id INT,
    IN p_day_of_week VARCHAR(15), -- e.g. 'Monday', 'Friday'
    OUT p_recommended_qty INT,
    OUT p_avg_sold DECIMAL(10, 2),
    OUT p_potential_saving_inr DECIMAL(10, 2)
)
BEGIN
    DECLARE v_avg_sold DECIMAL(10, 2);
    DECLARE v_unit_cost DECIMAL(10, 2);
    DECLARE v_typical_prep INT;
    
    -- Calculate average sold quantity on the specified day of week
    SELECT 
        AVG(b.quantity_sold),
        MAX(b.quantity_prepared),
        MAX(f.unit_cost)
    INTO v_avg_sold, v_typical_prep, v_unit_cost
    FROM daily_batches b
    JOIN food_items f ON b.food_id = f.food_id
    WHERE b.food_id = p_food_id
      AND DAYNAME(b.record_date) = p_day_of_week;
      
    IF v_avg_sold IS NULL THEN
        -- Fallback to general historical average if no day match
        SELECT AVG(b.quantity_sold), MAX(b.quantity_prepared), MAX(f.unit_cost)
        INTO v_avg_sold, v_typical_prep, v_unit_cost
        FROM daily_batches b
        JOIN food_items f ON b.food_id = f.food_id
        WHERE b.food_id = p_food_id;
    END IF;
    
    SET p_avg_sold = COALESCE(v_avg_sold, 50.0);
    -- Recommendation = Average sold + 5% buffer for variance, rounded up
    SET p_recommended_qty = CEIL(p_avg_sold * 1.05);
    
    -- Potential savings if typical prep is higher than recommended
    IF v_typical_prep > p_recommended_qty THEN
        SET p_potential_saving_inr = (v_typical_prep - p_recommended_qty) * v_unit_cost;
    ELSE
        SET p_potential_saving_inr = 0.00;
    END IF;
END$$

-- Stored Procedure 2: ACID Transaction - Atomic Batch Logging with Audit Trail
DROP PROCEDURE IF EXISTS sp_RecordDailyBatchWithTransaction$$
CREATE PROCEDURE sp_RecordDailyBatchWithTransaction(
    IN p_food_id INT,
    IN p_canteen_id INT,
    IN p_record_date DATE,
    IN p_meal_type VARCHAR(20),
    IN p_qty_prepared INT,
    IN p_qty_sold INT,
    IN p_logged_by INT,
    OUT p_new_batch_id INT,
    OUT p_status_message VARCHAR(100)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback entire transaction if any error occurs
        ROLLBACK;
        SET p_new_batch_id = -1;
        SET p_status_message = 'TRANSACTION_FAILED: Rolled back due to database constraint or SQL error.';
    END;

    -- Start ACID Transaction
    START TRANSACTION;
        
        -- Insert new batch record
        INSERT INTO daily_batches (
            food_id, canteen_id, record_date, meal_type, 
            quantity_prepared, quantity_sold, logged_by
        ) VALUES (
            p_food_id, p_canteen_id, p_record_date, p_meal_type,
            p_qty_prepared, p_qty_sold, p_logged_by
        );
        
        SET p_new_batch_id = LAST_INSERT_ID();
        
        -- Write audit trail log
        INSERT INTO audit_logs (action_type, table_name, record_id, performed_by, details)
        VALUES (
            'INSERT_BATCH',
            'daily_batches',
            p_new_batch_id,
            p_logged_by,
            JSON_OBJECT(
                'food_id', p_food_id,
                'prepared', p_qty_prepared,
                'sold', p_qty_sold,
                'date', p_record_date
            )
        );
        
    -- Commit changes permanently
    COMMIT;
    SET p_status_message = 'SUCCESS: Transaction committed successfully.';
END$$

DELIMITER ;

-- ============================================================================
-- 5. ADVANCED SQL: DATABASE VIEWS
-- ============================================================================

-- View 1: Top High-Waste Food Items (Average waste > 15%)
DROP VIEW IF EXISTS vw_HighWasteItems;
CREATE VIEW vw_HighWasteItems AS
SELECT 
    f.food_id,
    f.food_name,
    f.category,
    c.canteen_name,
    COUNT(b.batch_id) AS total_batches_tracked,
    SUM(b.quantity_prepared) AS total_prepared,
    SUM(b.quantity_sold) AS total_sold,
    SUM(b.quantity_wasted) AS total_wasted,
    ROUND((SUM(b.quantity_wasted) / SUM(b.quantity_prepared)) * 100, 2) AS avg_waste_rate_pct,
    ROUND(SUM(b.quantity_wasted * f.unit_cost), 2) AS total_cost_loss_inr
FROM food_items f
JOIN daily_batches b ON f.food_id = b.food_id
JOIN canteens c ON f.canteen_id = c.canteen_id
GROUP BY f.food_id, f.food_name, f.category, c.canteen_name
HAVING avg_waste_rate_pct > 12.00
ORDER BY avg_waste_rate_pct DESC;

-- View 2: Day of the Week Wastage Patterns
DROP VIEW IF EXISTS vw_DayOfWeekTrends;
CREATE VIEW vw_DayOfWeekTrends AS
SELECT 
    DAYNAME(b.record_date) AS day_of_week,
    DAYOFWEEK(b.record_date) AS day_index,
    COUNT(b.batch_id) AS total_records,
    SUM(b.quantity_prepared) AS meals_prepared,
    SUM(b.quantity_sold) AS meals_sold,
    SUM(b.quantity_wasted) AS meals_wasted,
    ROUND((SUM(b.quantity_wasted) / SUM(b.quantity_prepared)) * 100, 2) AS waste_rate_pct,
    ROUND(SUM(b.quantity_wasted * f.unit_cost), 2) AS financial_loss_inr
FROM daily_batches b
JOIN food_items f ON b.food_id = f.food_id
GROUP BY DAYNAME(b.record_date), DAYOFWEEK(b.record_date)
ORDER BY day_index ASC;

-- View 3: Executive Category-Wise Performance
DROP VIEW IF EXISTS vw_CategoryWasteSummary;
CREATE VIEW vw_CategoryWasteSummary AS
SELECT 
    f.category,
    COUNT(DISTINCT f.food_id) AS total_menu_items,
    SUM(b.quantity_prepared) AS total_prepared,
    SUM(b.quantity_sold) AS total_sold,
    SUM(b.quantity_wasted) AS total_wasted,
    ROUND((SUM(b.quantity_wasted) / SUM(b.quantity_prepared)) * 100, 2) AS category_waste_pct,
    ROUND(SUM(b.quantity_wasted * f.unit_cost), 2) AS total_rupee_loss
FROM food_items f
LEFT JOIN daily_batches b ON f.food_id = b.food_id
GROUP BY f.category
ORDER BY total_rupee_loss DESC;
