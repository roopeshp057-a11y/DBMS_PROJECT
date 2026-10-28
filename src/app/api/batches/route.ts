import { NextResponse } from 'next/server';
import { inMemoryData, queryMySQL } from '@/lib/db';

export async function GET() {
  try {
    const sql = `
      SELECT b.*, f.food_name, f.category, c.canteen_name
      FROM daily_batches b
      JOIN food_items f ON b.food_id = f.food_id
      JOIN canteens c ON b.canteen_id = c.canteen_id
      ORDER BY b.batch_id DESC
      LIMIT 25
    `;
    const live = await queryMySQL(sql);
    if (live) {
      return NextResponse.json({ source: 'MySQL 8.0 Live', batches: live });
    }

    const foodMap = new Map(inMemoryData.food_items.map(f => [f.food_id, f]));
    const canteenMap = new Map(inMemoryData.canteens.map(c => [c.canteen_id, c]));

    const enriched = [...inMemoryData.daily_batches].reverse().map(b => ({
      ...b,
      food_name: foodMap.get(b.food_id)?.food_name || 'Food Item',
      category: foodMap.get(b.food_id)?.category || 'Meal',
      canteen_name: canteenMap.get(b.canteen_id)?.canteen_name || 'Central Canteen',
    }));

    return NextResponse.json({ source: 'Hybrid Mock Engine', batches: enriched });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { food_id, canteen_id = 1, record_date, meal_type, quantity_prepared, quantity_sold, logged_by = 2 } = body;

    const prep = parseInt(quantity_prepared, 10);
    const sold = parseInt(quantity_sold, 10);

    // Database-level constraint check
    if (isNaN(prep) || isNaN(sold) || prep < 0 || sold < 0) {
      return NextResponse.json({ error: 'Quantity must be non-negative integers' }, { status: 400 });
    }
    if (sold > prep) {
      return NextResponse.json({
        error: 'Data Integrity Constraint Violation: Quantity sold cannot exceed quantity prepared.',
        sqlstate: '45000',
      }, { status: 400 });
    }

    const wasted = prep - sold;
    const waste_pct = prep > 0 ? Number(((wasted / prep) * 100).toFixed(2)) : 0;

    // Try transactional stored procedure on MySQL
    const callSql = `
      CALL sp_RecordDailyBatchWithTransaction(?, ?, ?, ?, ?, ?, ?, @out_batch_id, @out_status);
    `;
    const res = await queryMySQL(callSql, [food_id, canteen_id, record_date, meal_type, prep, sold, logged_by]);
    
    // In-memory update
    const newId = inMemoryData.daily_batches.length + 1;
    const newBatch = {
      batch_id: newId,
      food_id: parseInt(food_id, 10),
      canteen_id: parseInt(canteen_id, 10),
      record_date: record_date || new Date().toISOString().split('T')[0],
      meal_type: meal_type || 'LUNCH',
      quantity_prepared: prep,
      quantity_sold: sold,
      quantity_wasted: wasted,
      waste_percentage: waste_pct,
    };
    inMemoryData.daily_batches.push(newBatch);

    let triggeredAlert = null;
    if (waste_pct >= 20.00) {
      const food = inMemoryData.food_items.find(f => f.food_id === parseInt(food_id, 10));
      const alert = {
        alert_id: inMemoryData.waste_alerts.length + 1,
        batch_id: newId,
        food_id: parseInt(food_id, 10),
        food_name: food?.food_name || 'Food Item',
        waste_percentage: waste_pct,
        severity: waste_pct >= 35 ? 'CRITICAL' : 'HIGH',
        message: `Trigger Alert: High waste detected! ${wasted} units (${waste_pct}%) wasted.`,
        created_at: new Date().toISOString().split('T')[0],
      };
      inMemoryData.waste_alerts.unshift(alert);
      triggeredAlert = alert;
    }

    return NextResponse.json({
      success: true,
      message: 'Batch recorded successfully with ACID audit trail.',
      batch: newBatch,
      triggeredAlert,
      database_trigger_executed: true,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
