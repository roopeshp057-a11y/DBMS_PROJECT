// ==============================================================================
// Database Bridge: MySQL 8.0 (SQL) + MongoDB (NoSQL) + Fallback Simulator
// EcoBite - College Canteen Food Waste Intelligence Platform
// ==============================================================================

import mysql from 'mysql2/promise';
import { MongoClient } from 'mongodb';

// Configuration
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'root',
  database: process.env.MYSQL_DATABASE || 'ecobite_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecobite_nosql';

// Connection Singletons
let mysqlPool: mysql.Pool | null = null;
let mongoClient: MongoClient | null = null;

// ==============================================================================
// 1. IN-MEMORY HIGH-FIDELITY FALLBACK DATASET (Ensures 100% demo resilience)
// ==============================================================================
export const inMemoryData = {
  canteens: [
    { canteen_id: 1, canteen_name: 'Central Campus Food Court', campus_block: 'GJBC Ground Floor', seating_capacity: 350 },
    { canteen_id: 2, canteen_name: 'B-Block South Mess', campus_block: 'BE Block Basement', seating_capacity: 220 },
    { canteen_id: 3, canteen_name: 'Tech-Square Snack Hub', campus_block: 'MRD Auditorium Concourse', seating_capacity: 100 },
  ],
  food_items: [
    { food_id: 1, canteen_id: 1, food_name: 'Vegetable Dum Biryani', category: 'Lunch', unit_cost: 38.00, selling_price: 75.00 },
    { food_id: 2, canteen_id: 1, food_name: 'South Indian Full Meals', category: 'Lunch', unit_cost: 45.00, selling_price: 85.00 },
    { food_id: 3, canteen_id: 1, food_name: 'Paneer Butter Masala Combo', category: 'Dinner', unit_cost: 52.00, selling_price: 95.00 },
    { food_id: 4, canteen_id: 1, food_name: 'Masala Dosa with Sambar', category: 'Breakfast', unit_cost: 22.00, selling_price: 45.00 },
    { food_id: 5, canteen_id: 1, food_name: 'Idli Vada Platter (2+1)', category: 'Breakfast', unit_cost: 18.00, selling_price: 40.00 },
    { food_id: 6, canteen_id: 1, food_name: 'Veg Fried Rice & Manchurian', category: 'Lunch', unit_cost: 35.00, selling_price: 70.00 },
    { food_id: 7, canteen_id: 1, food_name: 'Chapati with Mixed Veg Curry', category: 'Lunch', unit_cost: 25.00, selling_price: 50.00 },
    { food_id: 8, canteen_id: 2, food_name: 'Crispy Onion Samosa (2 pcs)', category: 'Snacks', unit_cost: 12.00, selling_price: 25.00 },
    { food_id: 9, canteen_id: 2, food_name: 'Curd Rice with Pomegranate', category: 'Lunch', unit_cost: 20.00, selling_price: 40.00 },
    { food_id: 10, canteen_id: 3, food_name: 'Fresh Filter Coffee & Cold Shake', category: 'Beverages', unit_cost: 10.00, selling_price: 25.00 },
  ],
  daily_batches: [
    { batch_id: 1, food_id: 1, canteen_id: 1, record_date: '2026-10-05', meal_type: 'LUNCH', quantity_prepared: 120, quantity_sold: 114, quantity_wasted: 6, waste_percentage: 5.00 },
    { batch_id: 2, food_id: 2, canteen_id: 1, record_date: '2026-10-05', meal_type: 'LUNCH', quantity_prepared: 100, quantity_sold: 96, quantity_wasted: 4, waste_percentage: 4.00 },
    { batch_id: 3, food_id: 4, canteen_id: 1, record_date: '2026-10-05', meal_type: 'BREAKFAST', quantity_prepared: 90, quantity_sold: 88, quantity_wasted: 2, waste_percentage: 2.22 },
    { batch_id: 4, food_id: 1, canteen_id: 1, record_date: '2026-10-06', meal_type: 'LUNCH', quantity_prepared: 120, quantity_sold: 110, quantity_wasted: 10, waste_percentage: 8.33 },
    { batch_id: 5, food_id: 3, canteen_id: 1, record_date: '2026-10-06', meal_type: 'DINNER', quantity_prepared: 70, quantity_sold: 63, quantity_wasted: 7, waste_percentage: 10.00 },
    { batch_id: 6, food_id: 1, canteen_id: 1, record_date: '2026-10-07', meal_type: 'LUNCH', quantity_prepared: 125, quantity_sold: 112, quantity_wasted: 13, waste_percentage: 10.40 },
    { batch_id: 7, food_id: 8, canteen_id: 2, record_date: '2026-10-07', meal_type: 'SNACKS', quantity_prepared: 150, quantity_sold: 138, quantity_wasted: 12, waste_percentage: 8.00 },
    { batch_id: 8, food_id: 1, canteen_id: 1, record_date: '2026-10-08', meal_type: 'LUNCH', quantity_prepared: 120, quantity_sold: 102, quantity_wasted: 18, waste_percentage: 15.00 },
    // Friday Surge (Pattern highlighted in project requirement)
    { batch_id: 9, food_id: 1, canteen_id: 1, record_date: '2026-10-09', meal_type: 'LUNCH', quantity_prepared: 120, quantity_sold: 78, quantity_wasted: 42, waste_percentage: 35.00 },
    { batch_id: 10, food_id: 2, canteen_id: 1, record_date: '2026-10-09', meal_type: 'LUNCH', quantity_prepared: 100, quantity_sold: 68, quantity_wasted: 32, waste_percentage: 32.00 },
    { batch_id: 11, food_id: 6, canteen_id: 1, record_date: '2026-10-09', meal_type: 'LUNCH', quantity_prepared: 90, quantity_sold: 62, quantity_wasted: 28, waste_percentage: 31.11 },
    { batch_id: 12, food_id: 3, canteen_id: 1, record_date: '2026-10-09', meal_type: 'DINNER', quantity_prepared: 60, quantity_sold: 42, quantity_wasted: 18, waste_percentage: 30.00 },
    // Week 2
    { batch_id: 13, food_id: 1, canteen_id: 1, record_date: '2026-10-12', meal_type: 'LUNCH', quantity_prepared: 115, quantity_sold: 108, quantity_wasted: 7, waste_percentage: 6.09 },
    { batch_id: 14, food_id: 2, canteen_id: 1, record_date: '2026-10-12', meal_type: 'LUNCH', quantity_prepared: 105, quantity_sold: 99, quantity_wasted: 6, waste_percentage: 5.71 },
    { batch_id: 15, food_id: 1, canteen_id: 1, record_date: '2026-10-16', meal_type: 'LUNCH', quantity_prepared: 120, quantity_sold: 81, quantity_wasted: 39, waste_percentage: 32.50 },
    { batch_id: 16, food_id: 2, canteen_id: 1, record_date: '2026-10-16', meal_type: 'LUNCH', quantity_prepared: 95, quantity_sold: 65, quantity_wasted: 30, waste_percentage: 31.58 },
    // Week 3
    { batch_id: 17, food_id: 1, canteen_id: 1, record_date: '2026-10-19', meal_type: 'LUNCH', quantity_prepared: 110, quantity_sold: 105, quantity_wasted: 5, waste_percentage: 4.55 },
    { batch_id: 18, food_id: 1, canteen_id: 1, record_date: '2026-10-23', meal_type: 'LUNCH', quantity_prepared: 120, quantity_sold: 75, quantity_wasted: 45, waste_percentage: 37.50 },
    { batch_id: 19, food_id: 2, canteen_id: 1, record_date: '2026-10-23', meal_type: 'LUNCH', quantity_prepared: 90, quantity_sold: 60, quantity_wasted: 30, waste_percentage: 33.33 },
    // Today
    { batch_id: 20, food_id: 1, canteen_id: 1, record_date: '2026-10-28', meal_type: 'LUNCH', quantity_prepared: 110, quantity_sold: 88, quantity_wasted: 22, waste_percentage: 20.00 },
    { batch_id: 21, food_id: 2, canteen_id: 1, record_date: '2026-10-28', meal_type: 'LUNCH', quantity_prepared: 90, quantity_sold: 76, quantity_wasted: 14, waste_percentage: 15.56 },
    { batch_id: 22, food_id: 4, canteen_id: 1, record_date: '2026-10-28', meal_type: 'BREAKFAST', quantity_prepared: 85, quantity_sold: 82, quantity_wasted: 3, waste_percentage: 3.53 },
  ],
  waste_alerts: [
    { alert_id: 1, batch_id: 9, food_id: 1, food_name: 'Vegetable Dum Biryani', waste_percentage: 35.00, severity: 'CRITICAL', message: 'Critical Friday waste: 42 units wasted (35.00%). Early weekend exodus detected.', created_at: '2026-10-09' },
    { alert_id: 2, batch_id: 10, food_id: 2, food_name: 'South Indian Full Meals', waste_percentage: 32.00, severity: 'HIGH', message: 'High waste detected: 32 units wasted (32.00%). Recommend reducing sambar/rice prep on Fridays.', created_at: '2026-10-09' },
    { alert_id: 3, batch_id: 18, food_id: 1, food_name: 'Vegetable Dum Biryani', waste_percentage: 37.50, severity: 'CRITICAL', message: 'Persistent Friday waste pattern: 45 units discarded (37.50%).', created_at: '2026-10-23' },
  ],
  surplus_deals: [
    { deal_id: 1, batch_id: 20, food_id: 1, food_name: 'Vegetable Dum Biryani', surplus_qty: 22, original_price: 75.00, discount_percent: 50.00, flash_price: 37.50, expires_at: '03:30 PM', is_claimed: false },
    { deal_id: 2, batch_id: 21, food_id: 2, food_name: 'South Indian Full Meals', surplus_qty: 14, original_price: 85.00, discount_percent: 40.00, flash_price: 51.00, expires_at: '03:45 PM', is_claimed: false },
  ],
  feedback: [
    { id: '1', food_id: 1, food_name: 'Vegetable Dum Biryani', student_id: 'PES1UG23CS042', rating: 2, sensory_tags: ['too_spicy', 'portion_too_large'], comment: 'The biryani on Friday was excessively spicy with green chillies. Left half the plate.', date: '2026-10-09' },
    { id: '2', food_id: 1, food_name: 'Vegetable Dum Biryani', student_id: 'PES1UG23CS108', rating: 2, sensory_tags: ['too_spicy', 'oily'], comment: 'Way too much whole garam masala and chili powder. Difficult to eat.', date: '2026-10-16' },
    { id: '3', food_id: 1, food_name: 'Vegetable Dum Biryani', student_id: 'PES1UG22EC019', rating: 3, sensory_tags: ['portion_too_large'], comment: 'Quantity was too much for one person. Half of it went into the bin.', date: '2026-10-23' },
    { id: '4', food_id: 2, food_name: 'South Indian Full Meals', student_id: 'PES1UG24CS301', rating: 2, sensory_tags: ['cold', 'sambar_watery'], comment: 'Rice and rasam were cold by 1:30 PM. Sambar lacked thickness.', date: '2026-10-09' },
    { id: '5', food_id: 2, food_name: 'South Indian Full Meals', student_id: 'PES1UG23AI088', rating: 2, sensory_tags: ['cold', 'portion_too_large'], comment: 'Rice heap is too huge. Please allow half-meal option.', date: '2026-10-16' },
    { id: '6', food_id: 3, food_name: 'Paneer Butter Masala Combo', student_id: 'PES1UG23ME014', rating: 3, sensory_tags: ['too_sweet', 'oily'], comment: 'Gravy was unusually sweet today. Paneer cubes were good though.', date: '2026-10-09' },
    { id: '7', food_id: 6, food_name: 'Veg Fried Rice & Manchurian', student_id: 'PES1UG23CS205', rating: 2, sensory_tags: ['salty', 'cold'], comment: 'Manchurian gravy was too salty on Friday.', date: '2026-10-16' },
    { id: '8', food_id: 4, food_name: 'Masala Dosa with Sambar', student_id: 'PES1UG24CS002', rating: 5, sensory_tags: ['crispy', 'delicious'], comment: 'Excellent crispy dosa and hot coconut chutney! Zero waste.', date: '2026-10-12' },
  ]
};

// ==============================================================================
// 2. MYSQL QUERY EXECUTION HELPER
// ==============================================================================
export async function queryMySQL(sql: string, params: any[] = []): Promise<any> {
  if (process.env.USE_MOCK_FALLBACK === 'true') {
    return null; // Signals to use fallback calculation
  }

  try {
    if (!mysqlPool) {
      mysqlPool = mysql.createPool(MYSQL_CONFIG);
    }
    const [rows] = await mysqlPool.execute(sql, params);
    return rows;
  } catch (error) {
    console.warn('[MySQL Warning] Live connection failed, using fallback engine:', (error as Error).message);
    return null;
  }
}

// ==============================================================================
// 3. MONGODB AGGREGATION EXECUTION HELPER
// ==============================================================================
export async function runMongoAggregation(pipeline: any[]): Promise<any> {
  if (process.env.USE_MOCK_FALLBACK === 'true') {
    return null; // Signals to run in-memory pipeline simulator
  }

  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
      await mongoClient.connect();
    }
    const db = mongoClient.db('ecobite_nosql');
    const collection = db.collection('food_feedback');
    return await collection.aggregate(pipeline).toArray();
  } catch (error) {
    console.warn('[MongoDB Warning] Live connection failed, using fallback aggregation:', (error as Error).message);
    return null;
  }
}

// ==============================================================================
// 4. IN-MEMORY AGGREGATION & ANALYTICS ENGINE
// ==============================================================================
export function getFallbackAnalytics() {
  const batches = inMemoryData.daily_batches;
  const foodMap = new Map(inMemoryData.food_items.map(f => [f.food_id, f]));

  let totalPrep = 0;
  let totalSold = 0;
  let totalWasted = 0;
  let totalRupeeLoss = 0;

  batches.forEach(b => {
    totalPrep += b.quantity_prepared;
    totalSold += b.quantity_sold;
    totalWasted += b.quantity_wasted;
    const food = foodMap.get(b.food_id);
    if (food) {
      totalRupeeLoss += b.quantity_wasted * food.unit_cost;
    }
  });

  const wasteRatePct = totalPrep > 0 ? (totalWasted / totalPrep) * 100 : 0;
  // Standard environmental metric: ~2.5 kg CO2 avoided per kg/plate of food rescued
  const carbonFootprintKg = totalWasted * 2.1;
  const ecoRating = wasteRatePct <= 10 ? 'A+ (Zero Waste Hero)' : wasteRatePct <= 18 ? 'A (Eco-Efficient)' : 'B (Action Required)';

  // Day of Week Trends (emulates vw_DayOfWeekTrends)
  const dayBuckets: Record<string, { prep: number; sold: number; wasted: number; loss: number }> = {
    Monday: { prep: 0, sold: 0, wasted: 0, loss: 0 },
    Tuesday: { prep: 0, sold: 0, wasted: 0, loss: 0 },
    Wednesday: { prep: 0, sold: 0, wasted: 0, loss: 0 },
    Thursday: { prep: 0, sold: 0, wasted: 0, loss: 0 },
    Friday: { prep: 0, sold: 0, wasted: 0, loss: 0 },
  };

  batches.forEach(b => {
    const d = new Date(b.record_date);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
    if (dayBuckets[dayName]) {
      dayBuckets[dayName].prep += b.quantity_prepared;
      dayBuckets[dayName].sold += b.quantity_sold;
      dayBuckets[dayName].wasted += b.quantity_wasted;
      const f = foodMap.get(b.food_id);
      if (f) dayBuckets[dayName].loss += b.quantity_wasted * f.unit_cost;
    }
  });

  const dayOfWeekTrends = Object.entries(dayBuckets).map(([day, stats]) => ({
    day,
    prepared: stats.prep,
    sold: stats.sold,
    wasted: stats.wasted,
    waste_rate: stats.prep > 0 ? Number(((stats.wasted / stats.prep) * 100).toFixed(1)) : 0,
    loss_inr: Math.round(stats.loss),
  }));

  // Top Wasted Foods (emulates vw_HighWasteItems)
  const foodStats: Record<number, { prep: number; sold: number; wasted: number }> = {};
  batches.forEach(b => {
    if (!foodStats[b.food_id]) foodStats[b.food_id] = { prep: 0, sold: 0, wasted: 0 };
    foodStats[b.food_id].prep += b.quantity_prepared;
    foodStats[b.food_id].sold += b.quantity_sold;
    foodStats[b.food_id].wasted += b.quantity_wasted;
  });

  const highWasteItems = Object.entries(foodStats)
    .map(([idStr, stats]) => {
      const id = parseInt(idStr, 10);
      const food = foodMap.get(id);
      const wastePct = stats.prep > 0 ? Number(((stats.wasted / stats.prep) * 100).toFixed(1)) : 0;
      return {
        food_id: id,
        food_name: food?.food_name || 'Unknown',
        category: food?.category || 'General',
        prepared: stats.prep,
        sold: stats.sold,
        wasted: stats.wasted,
        waste_rate_pct: wastePct,
        loss_inr: Math.round(stats.wasted * (food?.unit_cost || 0)),
      };
    })
    .sort((a, b) => b.waste_rate_pct - a.waste_rate_pct);

  // Category summary
  const catStats: Record<string, { prep: number; sold: number; wasted: number; loss: number }> = {};
  highWasteItems.forEach(item => {
    if (!catStats[item.category]) catStats[item.category] = { prep: 0, sold: 0, wasted: 0, loss: 0 };
    catStats[item.category].prep += item.prepared;
    catStats[item.category].sold += item.sold;
    catStats[item.category].wasted += item.wasted;
    catStats[item.category].loss += item.loss_inr;
  });

  const categorySummary = Object.entries(catStats).map(([category, stats]) => ({
    category,
    total_prep: stats.prep,
    total_wasted: stats.wasted,
    waste_rate: stats.prep > 0 ? Number(((stats.wasted / stats.prep) * 100).toFixed(1)) : 0,
    loss_inr: stats.loss,
  }));

  return {
    kpis: {
      totalPrepared: totalPrep,
      totalSold: totalSold,
      totalWasted: totalWasted,
      wasteRate: Number(wasteRatePct.toFixed(1)),
      financialLossINR: Math.round(totalRupeeLoss),
      carbonFootprintKg: Math.round(carbonFootprintKg),
      ecoRating,
    },
    dayOfWeekTrends,
    highWasteItems,
    categorySummary,
    alerts: inMemoryData.waste_alerts,
    activeFlashDeals: inMemoryData.surplus_deals,
  };
}

// In-Memory MongoDB Aggregation Pipeline Simulator
export function getFallbackNoSQLAggregation() {
  const feedbacks = inMemoryData.feedback;
  const tagCounts: Record<string, { count: number; ratings: number[]; dishes: Set<string> }> = {};

  feedbacks.forEach(fb => {
    if (fb.rating <= 3) {
      fb.sensory_tags.forEach(tag => {
        if (!tagCounts[tag]) {
          tagCounts[tag] = { count: 0, ratings: [], dishes: new Set() };
        }
        tagCounts[tag].count += 1;
        tagCounts[tag].ratings.push(fb.rating);
        tagCounts[tag].dishes.add(fb.food_name);
      });
    }
  });

  return Object.entries(tagCounts)
    .map(([tag, data]) => ({
      reason: tag.replace(/_/g, ' ').toUpperCase(),
      count: data.count,
      dishes: Array.from(data.dishes),
      avg_rating: Number((data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length).toFixed(1)),
    }))
    .sort((a, b) => b.count - a.count);
}
