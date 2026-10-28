-- ============================================================================
-- SEED DATA: Realistic Campus Canteen Food Waste Dataset
-- Course: DBMS Experiential Learning - Level 3 Project (CSE Department)
-- ============================================================================

USE ecobite_db;

-- 1. Insert Users (Admin, Staff, Student)
INSERT INTO users (user_id, name, email, password_hash, role, phone) VALUES
(1, 'Dr. Rajesh Rao (F&B Director)', 'admin@canteen.pes.edu', '$2b$10$w8T0MvK1z9VwQ6r0BvGzueL0K4ZtS0F6J1s7H2b8P3m4N5v6O7P8Q', 'ADMIN', '+91 98450 11223'),
(2, 'Ramesh Kumar (Canteen Lead)', 'staff.ramesh@canteen.pes.edu', '$2b$10$w8T0MvK1z9VwQ6r0BvGzueL0K4ZtS0F6J1s7H2b8P3m4N5v6O7P8Q', 'STAFF', '+91 98450 22334'),
(3, 'Priya Sundaram (Food Supervisor)', 'staff.priya@canteen.pes.edu', '$2b$10$w8T0MvK1z9VwQ6r0BvGzueL0K4ZtS0F6J1s7H2b8P3m4N5v6O7P8Q', 'STAFF', '+91 98450 33445'),
(4, 'Aarav Sharma (Student Rep)', 'aarav.sharma@pes.edu', '$2b$10$w8T0MvK1z9VwQ6r0BvGzueL0K4ZtS0F6J1s7H2b8P3m4N5v6O7P8Q', 'STUDENT', '+91 98450 44556')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 2. Insert Canteens
INSERT INTO canteens (canteen_id, canteen_name, campus_block, operating_hours, seating_capacity, manager_id) VALUES
(1, 'Central Campus Food Court', 'GJBC Ground Floor', '07:30 AM - 08:30 PM', 350, 2),
(2, 'B-Block South Mess', 'BE Block Basement', '07:00 AM - 09:00 PM', 220, 3),
(3, 'Tech-Square Snack Hub', 'MRD Auditorium Concourse', '09:00 AM - 06:30 PM', 100, 2)
ON DUPLICATE KEY UPDATE canteen_name=VALUES(canteen_name);

-- 3. Insert Food Items (Menu Catalog with Cost Economics)
INSERT INTO food_items (food_id, canteen_id, food_name, category, unit_cost, selling_price, shelf_life_hours) VALUES
(1, 1, 'Vegetable Dum Biryani', 'Lunch', 38.00, 75.00, 4),
(2, 1, 'South Indian Full Meals', 'Lunch', 45.00, 85.00, 4),
(3, 1, 'Paneer Butter Masala Combo', 'Dinner', 52.00, 95.00, 5),
(4, 1, 'Masala Dosa with Sambar', 'Breakfast', 22.00, 45.00, 3),
(5, 1, 'Idli Vada Platter (2+1)', 'Breakfast', 18.00, 40.00, 3),
(6, 1, 'Veg Fried Rice & Manchurian', 'Lunch', 35.00, 70.00, 4),
(7, 1, 'Chapati with Mixed Veg Curry', 'Lunch', 25.00, 50.00, 4),
(8, 2, 'Crispy Onion Samosa (2 pcs)', 'Snacks', 12.00, 25.00, 6),
(9, 2, 'Curd Rice with Pomegranate', 'Lunch', 20.00, 40.00, 5),
(10, 3, 'Fresh Filter Coffee & Cold Shake', 'Beverages', 10.00, 25.00, 8)
ON DUPLICATE KEY UPDATE food_name=VALUES(food_name);

-- 4. Insert Daily Batches (Historical multi-week tracking)
-- Notice that the TRIGGER 'trg_batches_before_insert' calculates quantity_wasted & waste_percentage automatically!
-- And 'trg_batches_after_insert_alert' generates alerts for batches exceeding 20% waste!

INSERT INTO daily_batches (food_id, canteen_id, record_date, meal_type, quantity_prepared, quantity_sold, logged_by, batch_status) VALUES
-- Week 1: Monday (High attendance, low waste)
(1, 1, '2026-10-05', 'LUNCH', 120, 114, 2, 'COMPLETED'),
(2, 1, '2026-10-05', 'LUNCH', 100, 96, 2, 'COMPLETED'),
(4, 1, '2026-10-05', 'BREAKFAST', 90, 88, 3, 'COMPLETED'),
(7, 1, '2026-10-05', 'DINNER', 80, 76, 3, 'COMPLETED'),

-- Week 1: Tuesday
(1, 1, '2026-10-06', 'LUNCH', 120, 110, 2, 'COMPLETED'),
(3, 1, '2026-10-06', 'DINNER', 70, 63, 2, 'COMPLETED'),
(5, 1, '2026-10-06', 'BREAKFAST', 85, 82, 3, 'COMPLETED'),
(6, 1, '2026-10-06', 'LUNCH', 90, 85, 3, 'COMPLETED'),

-- Week 1: Wednesday
(1, 1, '2026-10-07', 'LUNCH', 125, 112, 2, 'COMPLETED'),
(2, 1, '2026-10-07', 'LUNCH', 110, 101, 2, 'COMPLETED'),
(8, 2, '2026-10-07', 'SNACKS', 150, 138, 2, 'COMPLETED'),
(9, 2, '2026-10-07', 'LUNCH', 60, 56, 3, 'COMPLETED'),

-- Week 1: Thursday
(1, 1, '2026-10-08', 'LUNCH', 120, 102, 2, 'COMPLETED'),
(3, 1, '2026-10-08', 'DINNER', 75, 62, 3, 'COMPLETED'),
(7, 1, '2026-10-08', 'LUNCH', 85, 74, 2, 'COMPLETED'),

-- Week 1: Friday (CRITICAL PATTERN: Students leave campus early, Biryani and Meals waste jumps above 25%!)
(1, 1, '2026-10-09', 'LUNCH', 120, 78, 2, 'COMPLETED'),
(2, 1, '2026-10-09', 'LUNCH', 100, 68, 2, 'COMPLETED'),
(6, 1, '2026-10-09', 'LUNCH', 90, 62, 3, 'COMPLETED'),
(3, 1, '2026-10-09', 'DINNER', 60, 42, 3, 'COMPLETED'),

-- Week 2: Monday
(1, 1, '2026-10-12', 'LUNCH', 115, 108, 2, 'COMPLETED'),
(2, 1, '2026-10-12', 'LUNCH', 105, 99, 2, 'COMPLETED'),
(4, 1, '2026-10-12', 'BREAKFAST', 95, 91, 3, 'COMPLETED'),

-- Week 2: Tuesday
(1, 1, '2026-10-13', 'LUNCH', 110, 104, 2, 'COMPLETED'),
(6, 1, '2026-10-13', 'LUNCH', 85, 78, 2, 'COMPLETED'),
(3, 1, '2026-10-13', 'DINNER', 70, 64, 3, 'COMPLETED'),

-- Week 2: Wednesday
(1, 1, '2026-10-14', 'LUNCH', 120, 111, 2, 'COMPLETED'),
(2, 1, '2026-10-14', 'LUNCH', 100, 94, 2, 'COMPLETED'),
(7, 1, '2026-10-14', 'LUNCH', 80, 72, 3, 'COMPLETED'),

-- Week 2: Thursday
(1, 1, '2026-10-15', 'LUNCH', 115, 98, 2, 'COMPLETED'),
(3, 1, '2026-10-15', 'DINNER', 70, 58, 2, 'COMPLETED'),

-- Week 2: Friday (Friday pattern confirms: High wastage on Biryani & Fried Rice!)
(1, 1, '2026-10-16', 'LUNCH', 120, 81, 2, 'COMPLETED'),
(2, 1, '2026-10-16', 'LUNCH', 95, 65, 3, 'COMPLETED'),
(6, 1, '2026-10-16', 'LUNCH', 80, 54, 2, 'COMPLETED'),

-- Week 3: Monday
(1, 1, '2026-10-19', 'LUNCH', 110, 105, 2, 'COMPLETED'),
(4, 1, '2026-10-19', 'BREAKFAST', 90, 86, 3, 'COMPLETED'),

-- Week 3: Tuesday
(1, 1, '2026-10-20', 'LUNCH', 110, 102, 2, 'COMPLETED'),
(3, 1, '2026-10-20', 'DINNER', 65, 59, 2, 'COMPLETED'),

-- Week 3: Wednesday
(1, 1, '2026-10-21', 'LUNCH', 115, 106, 2, 'COMPLETED'),
(2, 1, '2026-10-21', 'LUNCH', 100, 93, 3, 'COMPLETED'),

-- Week 3: Thursday
(1, 1, '2026-10-22', 'LUNCH', 110, 94, 2, 'COMPLETED'),
(7, 1, '2026-10-22', 'LUNCH', 80, 70, 3, 'COMPLETED'),

-- Week 3: Friday (Week 3 Friday also high waste!)
(1, 1, '2026-10-23', 'LUNCH', 120, 75, 2, 'COMPLETED'),
(2, 1, '2026-10-23', 'LUNCH', 90, 60, 2, 'COMPLETED'),
(3, 1, '2026-10-23', 'DINNER', 60, 39, 3, 'COMPLETED'),

-- Week 4: Today (Active serving & Flash Deals)
(1, 1, '2026-10-28', 'LUNCH', 110, 88, 2, 'SURPLUS_ALERT'),
(2, 1, '2026-10-28', 'LUNCH', 90, 76, 2, 'COMPLETED'),
(4, 1, '2026-10-28', 'BREAKFAST', 85, 82, 3, 'COMPLETED');

-- 5. Insert Flash Surplus Deals (Dynamic redistribution)
INSERT INTO surplus_flash_deals (batch_id, food_id, surplus_qty, discount_percent, flash_price, expires_at, is_claimed) VALUES
(38, 1, 22, 50.00, 37.50, '2026-10-28 15:30:00', FALSE);

-- 6. Insert Initial Audit Logs
INSERT INTO audit_logs (action_type, table_name, record_id, performed_by, details) VALUES
('INITIAL_SEED', 'daily_batches', 1, 1, '{"status": "System initialized with baseline historical waste data"}');
