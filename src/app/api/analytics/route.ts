import { NextResponse } from 'next/server';
import { getFallbackAnalytics, queryMySQL } from '@/lib/db';

export async function GET() {
  try {
    // Attempt MySQL query first if configured
    const sql = `
      SELECT 
        SUM(quantity_prepared) AS total_prep,
        SUM(quantity_sold) AS total_sold,
        SUM(quantity_wasted) AS total_wasted,
        ROUND((SUM(quantity_wasted) / SUM(quantity_prepared)) * 100, 2) AS waste_rate
      FROM daily_batches
    `;
    const liveKpis = await queryMySQL(sql);

    if (liveKpis && liveKpis.length > 0 && liveKpis[0].total_prep !== null) {
      // Fetch live views
      const dayTrends = await queryMySQL(`SELECT * FROM vw_DayOfWeekTrends ORDER BY day_index ASC`);
      const highWaste = await queryMySQL(`SELECT * FROM vw_HighWasteItems LIMIT 10`);
      const categories = await queryMySQL(`SELECT * FROM vw_CategoryWasteSummary`);
      const alerts = await queryMySQL(`
        SELECT a.*, f.food_name 
        FROM waste_alerts a 
        JOIN food_items f ON a.food_id = f.food_id 
        ORDER BY a.alert_id DESC LIMIT 5
      `);

      return NextResponse.json({
        source: 'MySQL 8.0 Live Database',
        kpis: {
          totalPrepared: liveKpis[0].total_prep,
          totalSold: liveKpis[0].total_sold,
          totalWasted: liveKpis[0].total_wasted,
          wasteRate: Number(liveKpis[0].waste_rate),
          financialLossINR: Math.round(liveKpis[0].total_wasted * 35),
          carbonFootprintKg: Math.round(liveKpis[0].total_wasted * 2.1),
          ecoRating: Number(liveKpis[0].waste_rate) <= 12 ? 'A+ (Zero Waste Hero)' : 'B (Action Required)',
        },
        dayOfWeekTrends: dayTrends,
        highWasteItems: highWaste,
        categorySummary: categories,
        alerts,
      });
    }

    // Default to in-memory fallback analytics
    const fallback = getFallbackAnalytics();
    return NextResponse.json({
      source: 'EcoBite Hybrid Storage Engine',
      ...fallback,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch analytics', message: (error as Error).message },
      { status: 500 }
    );
  }
}
