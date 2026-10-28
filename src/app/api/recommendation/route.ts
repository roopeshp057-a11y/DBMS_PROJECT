import { NextResponse } from 'next/server';
import { inMemoryData, queryMySQL } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const food_id = parseInt(searchParams.get('food_id') || '1', 10);
  const day_of_week = searchParams.get('day_of_week') || 'Friday';

  try {
    // Try live MySQL Stored Procedure
    const spSql = `
      CALL sp_GetPrepRecommendation(?, ?, @out_rec, @out_avg, @out_savings);
      SELECT @out_rec AS recommended_qty, @out_avg AS avg_sold, @out_savings AS potential_savings;
    `;
    const live = await queryMySQL(spSql, [food_id, day_of_week]);
    if (live && live[1] && live[1][0]) {
      return NextResponse.json({
        source: 'MySQL 8.0 Stored Procedure',
        ...live[1][0],
      });
    }

    // In-memory simulation of stored procedure logic
    const food = inMemoryData.food_items.find(f => f.food_id === food_id) || inMemoryData.food_items[0];
    const matchingBatches = inMemoryData.daily_batches.filter(b => {
      const d = new Date(b.record_date);
      const dName = d.toLocaleDateString('en-US', { weekday: 'long' });
      return b.food_id === food_id && dName.toLowerCase() === day_of_week.toLowerCase();
    });

    let avgSold = 0;
    let typicalPrep = 120;
    if (matchingBatches.length > 0) {
      avgSold = matchingBatches.reduce((acc, b) => acc + b.quantity_sold, 0) / matchingBatches.length;
      typicalPrep = Math.max(...matchingBatches.map(b => b.quantity_prepared));
    } else {
      // General average
      const allForFood = inMemoryData.daily_batches.filter(b => b.food_id === food_id);
      avgSold = allForFood.reduce((acc, b) => acc + b.quantity_sold, 0) / (allForFood.length || 1);
    }

    // 5% variance safety buffer, rounded up
    const recommendedQty = Math.ceil(avgSold * 1.05);
    const estimatedSavingsINR = Math.max(0, (typicalPrep - recommendedQty) * food.unit_cost);

    return NextResponse.json({
      source: 'Stored Procedure Simulator (sp_GetPrepRecommendation)',
      food_name: food.food_name,
      day_of_week,
      historical_avg_sold: Number(avgSold.toFixed(1)),
      typical_canteen_prep: typicalPrep,
      recommended_qty: recommendedQty,
      potential_savings_inr: Math.round(estimatedSavingsINR),
      buffer_used: '5% Variance Cushion',
      formula: 'CEIL(historical_day_avg_sold * 1.05)',
      unit_cost: food.unit_cost,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
