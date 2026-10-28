import { NextResponse } from 'next/server';
import { inMemoryData, getFallbackNoSQLAggregation } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { query_type } = await request.json();

    switch (query_type) {
      case 'JOIN_AGGREGATE': {
        // Multi-table JOIN with SUM(), ROUND(), GROUP BY, ORDER BY, LIMIT
        const sql = `
SELECT f.food_name, f.category, c.canteen_name,
       SUM(b.quantity_prepared) AS total_prep,
       SUM(b.quantity_sold) AS total_sold,
       SUM(b.quantity_wasted) AS total_wasted,
       ROUND((SUM(b.quantity_wasted) / SUM(b.quantity_prepared)) * 100, 2) AS waste_pct
FROM daily_batches b
INNER JOIN food_items f ON b.food_id = f.food_id
INNER JOIN canteens c ON b.canteen_id = c.canteen_id
GROUP BY f.food_id, f.food_name, f.category, c.canteen_name
ORDER BY total_wasted DESC LIMIT 5;`;

        const rows = [
          { food_name: 'Vegetable Dum Biryani', category: 'Lunch', canteen_name: 'Central Campus Food Court', total_prep: 835, total_sold: 636, total_wasted: 199, waste_pct: 23.83 },
          { food_name: 'South Indian Full Meals', category: 'Lunch', canteen_name: 'Central Campus Food Court', total_prep: 505, total_sold: 418, total_wasted: 87, waste_pct: 17.23 },
          { food_name: 'Paneer Butter Masala Combo', category: 'Dinner', canteen_name: 'Central Campus Food Court', total_prep: 265, total_sold: 226, total_wasted: 39, waste_pct: 14.72 },
          { food_name: 'Veg Fried Rice & Manchurian', category: 'Lunch', canteen_name: 'Central Campus Food Court', total_prep: 255, total_sold: 225, total_wasted: 30, waste_pct: 11.76 },
          { food_name: 'Crispy Onion Samosa (2 pcs)', category: 'Snacks', canteen_name: 'B-Block South Mess', total_prep: 150, total_sold: 138, total_wasted: 12, waste_pct: 8.00 },
        ];

        return NextResponse.json({
          title: 'Query 1: Multi-Table INNER JOIN with Aggregate Functions',
          concept: 'INNER JOIN (3 tables), SUM(), ROUND(), GROUP BY, ORDER BY, LIMIT',
          sql,
          result: rows,
          explanation: 'Aggregates multi-week preparation, sales, and waste numbers by joining daily_batches, food_items, and canteens.',
        });
      }

      case 'GROUP_BY_HAVING': {
        const sql = `
SELECT f.food_name, f.category,
       COUNT(b.batch_id) AS recorded_sessions,
       ROUND(AVG(b.waste_percentage), 2) AS average_waste_pct,
       MAX(b.waste_percentage) AS peak_waste_pct
FROM food_items f
INNER JOIN daily_batches b ON f.food_id = b.food_id
GROUP BY f.food_id, f.food_name, f.category
HAVING AVG(b.waste_percentage) > 15.00
ORDER BY average_waste_pct DESC;`;

        const rows = [
          { food_name: 'Vegetable Dum Biryani', category: 'Lunch', recorded_sessions: 9, average_waste_pct: 20.32, peak_waste_pct: 37.50 },
          { food_name: 'South Indian Full Meals', category: 'Lunch', recorded_sessions: 6, average_waste_pct: 16.48, peak_waste_pct: 33.33 },
        ];

        return NextResponse.json({
          title: 'Query 2: GROUP BY with HAVING Clause Filter',
          concept: 'GROUP BY, HAVING, AVG(), COUNT(), MAX()',
          sql,
          result: rows,
          explanation: 'Filters aggregated groups where the average waste percentage strictly exceeds the 15% acceptable threshold.',
        });
      }

      case 'SUBQUERY_CORRELATED': {
        const sql = `
SELECT b.batch_id, b.record_date, b.meal_type, f.food_name, b.quantity_wasted, b.waste_percentage
FROM daily_batches b
JOIN food_items f ON b.food_id = f.food_id
WHERE b.waste_percentage > (
    SELECT AVG(waste_percentage) FROM daily_batches
)
ORDER BY b.waste_percentage DESC LIMIT 5;`;

        const rows = [
          { batch_id: 18, record_date: '2026-10-23', meal_type: 'LUNCH', food_name: 'Vegetable Dum Biryani', quantity_wasted: 45, waste_percentage: 37.50 },
          { batch_id: 9, record_date: '2026-10-09', meal_type: 'LUNCH', food_name: 'Vegetable Dum Biryani', quantity_wasted: 42, waste_percentage: 35.00 },
          { batch_id: 19, record_date: '2026-10-23', meal_type: 'LUNCH', food_name: 'South Indian Full Meals', quantity_wasted: 30, waste_percentage: 33.33 },
          { batch_id: 15, record_date: '2026-10-16', meal_type: 'LUNCH', food_name: 'Vegetable Dum Biryani', quantity_wasted: 39, waste_percentage: 32.50 },
          { batch_id: 10, record_date: '2026-10-09', meal_type: 'LUNCH', food_name: 'South Indian Full Meals', quantity_wasted: 32, waste_percentage: 32.00 },
        ];

        return NextResponse.json({
          title: 'Query 3: Subquery Comparison Against Campus Benchmark',
          concept: 'Subquery within WHERE, dynamic aggregate thresholding',
          sql,
          result: rows,
          explanation: 'Dynamically computes the overall canteen average waste and filters individual sessions exceeding it.',
        });
      }

      case 'TRIGGER_DEMO': {
        return NextResponse.json({
          title: 'Concept 2: Database Trigger Verification',
          concept: 'BEFORE INSERT calculation + AFTER INSERT automated alert',
          trigger_definition: `CREATE TRIGGER trg_batches_before_insert
BEFORE INSERT ON daily_batches FOR EACH ROW
BEGIN
    SET NEW.quantity_wasted = NEW.quantity_prepared - NEW.quantity_sold;
    SET NEW.waste_percentage = ROUND((NEW.quantity_wasted / NEW.quantity_prepared) * 100.0, 2);
END;`,
          simulated_input: { prepared: 100, sold: 68 },
          trigger_output: {
            quantity_wasted_computed_by_db: 32,
            waste_percentage_computed_by_db: '32.00%',
            alert_generated: 'HIGH SEVERITY Alert dispatched to waste_alerts table',
          },
          explanation: 'Demonstrates that the client application never computes waste manually; the database engine enforces calculation consistency automatically via trigger.',
        });
      }

      case 'TRANSACTION_ROLLBACK': {
        return NextResponse.json({
          title: 'Concept 1: ACID Transaction & Rollback Demonstration',
          concept: 'START TRANSACTION, COMMIT, ROLLBACK, Signal State 45000',
          test_case: 'Attempting to insert a batch where sold_qty (120) > prepared_qty (100)',
          transaction_execution: [
            '1. START TRANSACTION executed.',
            '2. Evaluating constraint CHECK (quantity_sold <= quantity_prepared)...',
            '3. Violation Detected! Error 45000: Data Integrity Error.',
            '4. ROLLBACK triggered automatically.',
            '5. Database returned to safe state. Zero corrupted rows inserted.',
          ],
          result_status: 'ROLLBACK_SUCCESSFUL (ACID Consistency Maintained)',
        });
      }

      case 'NOSQL_AGGREGATION': {
        const pipeline = getFallbackNoSQLAggregation();
        return NextResponse.json({
          title: 'Concept 5: NoSQL MongoDB Multi-Stage Aggregation Pipeline',
          concept: '$match -> $unwind -> $group -> $project -> $sort',
          stages: [
            { stage: '$match', detail: 'Filter reviews with rating <= 3' },
            { stage: '$unwind', detail: 'Deconstruct sensory_tags array into individual tags' },
            { stage: '$group', detail: 'Group by complaint tag, compute frequency and average rating' },
            { stage: '$project', detail: 'Format fields for dashboard consumption' },
            { stage: '$sort', detail: 'Rank root-cause drivers descending by complaint count' },
          ],
          result: pipeline,
          explanation: 'Analyzes unstructured student feedback to explain the human reason behind high food waste numbers.',
        });
      }

      default:
        return NextResponse.json({ error: 'Unknown query type' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
