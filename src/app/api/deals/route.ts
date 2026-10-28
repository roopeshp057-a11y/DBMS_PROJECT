import { NextResponse } from 'next/server';
import { inMemoryData } from '@/lib/db';

export async function GET() {
  return NextResponse.json({
    deals: inMemoryData.surplus_deals,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { food_id, surplus_qty, discount_percent = 50 } = body;

    const food = inMemoryData.food_items.find(f => f.food_id === parseInt(food_id, 10));
    if (!food) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 });
    }

    const discount = parseFloat(discount_percent) / 100;
    const flashPrice = Number((food.selling_price * (1 - discount)).toFixed(2));

    const newDeal = {
      deal_id: inMemoryData.surplus_deals.length + 1,
      batch_id: inMemoryData.daily_batches.length,
      food_id: food.food_id,
      food_name: food.food_name,
      surplus_qty: parseInt(surplus_qty, 10) || 15,
      original_price: food.selling_price,
      discount_percent: parseFloat(discount_percent),
      flash_price: flashPrice,
      expires_at: '04:00 PM (Hostel Clearance)',
      is_claimed: false,
    };

    inMemoryData.surplus_deals.unshift(newDeal);

    return NextResponse.json({
      success: true,
      message: 'Surplus Flash Deal published successfully to campus kiosk!',
      deal: newDeal,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
