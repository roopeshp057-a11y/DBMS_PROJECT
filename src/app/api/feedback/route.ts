import { NextResponse } from 'next/server';
import { getFallbackNoSQLAggregation, inMemoryData, runMongoAggregation } from '@/lib/db';

export async function GET() {
  try {
    const pipeline = [
      { $match: { rating: { $lte: 3 } } },
      { $unwind: '$sensory_tags' },
      {
        $group: {
          _id: '$sensory_tags',
          complaint_count: { $sum: 1 },
          dishes: { $addToSet: '$food_name' },
          avg_rating: { $avg: '$rating' },
        },
      },
      {
        $project: {
          _id: 0,
          reason: '$_id',
          count: '$complaint_count',
          dishes: '$dishes',
          avg_rating: { $round: ['$avg_rating', 1] },
        },
      },
      { $sort: { count: -1 } },
    ];

    const liveAggregation = await runMongoAggregation(pipeline);
    if (liveAggregation && liveAggregation.length > 0) {
      return NextResponse.json({
        source: 'MongoDB Live Aggregation Pipeline',
        rootCauses: liveAggregation,
        feedbacks: inMemoryData.feedback,
      });
    }

    const fallbackAgg = getFallbackNoSQLAggregation();
    return NextResponse.json({
      source: 'MongoDB Emulated Aggregation Pipeline',
      rootCauses: fallbackAgg,
      feedbacks: inMemoryData.feedback,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { food_id, food_name, student_id, rating, sensory_tags, comment } = body;

    const newFeedback = {
      id: String(inMemoryData.feedback.length + 1),
      food_id: parseInt(food_id, 10),
      food_name: food_name || 'Selected Dish',
      student_id: student_id || 'PES1UG24CS999',
      rating: parseInt(rating, 10) || 3,
      sensory_tags: Array.isArray(sensory_tags) ? sensory_tags : ['general_feedback'],
      comment: comment || '',
      date: new Date().toISOString().split('T')[0],
    };

    inMemoryData.feedback.unshift(newFeedback);

    return NextResponse.json({
      success: true,
      message: 'Sensory feedback recorded in NoSQL document collection.',
      feedback: newFeedback,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
