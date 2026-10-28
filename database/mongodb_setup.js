/**
 * ============================================================================
 * MONGODB SETUP & AGGREGATION PIPELINES (NoSQL Paradigm)
 * Project: EcoBite - College Canteen Food Waste Intelligence Platform
 * Course: DBMS Experiential Learning - Level 3 Project (CSE Department)
 * ============================================================================
 *
 * JUSTIFICATION FOR MONGODB (NoSQL):
 * Student and diner feedback on food quality, sensory attributes (spiciness,
 * saltiness, temperature, portion sizing), and unformatted comments are
 * inherently polymorphic, subjective, and evolve without a rigid schema.
 * MongoDB allows nested arrays of tags, unstructured text, and flexible sentiment
 * scoring without requiring schema migrations on every survey iteration.
 */

// Connection string default (Local or MongoDB Atlas)
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ecobite_nosql";

// Collection Name
const COLLECTION_NAME = "food_feedback";

/**
 * 1. Sample Realistic Documents (JSON Array for MongoDB)
 */
const sampleFeedbackData = [
  {
    food_id: 1,
    food_name: "Vegetable Dum Biryani",
    student_id: "PES1UG23CS042",
    rating: 2,
    sensory_tags: ["too_spicy", "portion_too_large"],
    comment: "The biryani on Friday was excessively spicy with green chillies. Left half the plate.",
    canteen_id: 1,
    meal_type: "LUNCH",
    timestamp: new Date("2026-10-09T13:45:00Z"),
    resolved_by_chef: false
  },
  {
    food_id: 1,
    food_name: "Vegetable Dum Biryani",
    student_id: "PES1UG23CS108",
    rating: 2,
    sensory_tags: ["too_spicy", "oily"],
    comment: "Way too much whole garam masala and chili powder. Difficult to eat.",
    canteen_id: 1,
    meal_type: "LUNCH",
    timestamp: new Date("2026-10-16T13:50:00Z"),
    resolved_by_chef: false
  },
  {
    food_id: 1,
    food_name: "Vegetable Dum Biryani",
    student_id: "PES1UG22EC019",
    rating: 3,
    sensory_tags: ["portion_too_large"],
    comment: "Quantity was too much for one person. Half of it went into the bin.",
    canteen_id: 1,
    meal_type: "LUNCH",
    timestamp: new Date("2026-10-23T14:10:00Z"),
    resolved_by_chef: true
  },
  {
    food_id: 2,
    food_name: "South Indian Full Meals",
    student_id: "PES1UG24CS301",
    rating: 2,
    sensory_tags: ["cold", "sambar_watery"],
    comment: "Rice and rasam were cold by 1:30 PM. Sambar lacked thickness.",
    canteen_id: 1,
    meal_type: "LUNCH",
    timestamp: new Date("2026-10-09T13:30:00Z"),
    resolved_by_chef: false
  },
  {
    food_id: 2,
    food_name: "South Indian Full Meals",
    student_id: "PES1UG23AI088",
    rating: 2,
    sensory_tags: ["cold", "portion_too_large"],
    comment: "Rice heap is too huge. Please allow half-meal option.",
    canteen_id: 1,
    meal_type: "LUNCH",
    timestamp: new Date("2026-10-16T13:20:00Z"),
    resolved_by_chef: true
  },
  {
    food_id: 3,
    food_name: "Paneer Butter Masala Combo",
    student_id: "PES1UG23ME014",
    rating: 3,
    sensory_tags: ["too_sweet", "oily"],
    comment: "Gravy was unusually sweet today. Paneer cubes were good though.",
    canteen_id: 1,
    meal_type: "DINNER",
    timestamp: new Date("2026-10-09T20:15:00Z"),
    resolved_by_chef: false
  },
  {
    food_id: 6,
    food_name: "Veg Fried Rice & Manchurian",
    student_id: "PES1UG23CS205",
    rating: 2,
    sensory_tags: ["salty", "cold"],
    comment: "Manchurian gravy was too salty on Friday.",
    canteen_id: 1,
    meal_type: "LUNCH",
    timestamp: new Date("2026-10-16T13:40:00Z"),
    resolved_by_chef: false
  },
  {
    food_id: 4,
    food_name: "Masala Dosa with Sambar",
    student_id: "PES1UG24CS002",
    rating: 5,
    sensory_tags: ["crispy", "delicious"],
    comment: "Excellent crispy dosa and hot coconut chutney! Zero waste.",
    canteen_id: 1,
    meal_type: "BREAKFAST",
    timestamp: new Date("2026-10-12T08:45:00Z"),
    resolved_by_chef: true
  }
];

/**
 * ============================================================================
 * 2. ADVANCED NoSQL CONCEPT: MULTI-STAGE AGGREGATION PIPELINES
 * ============================================================================
 */

/**
 * Pipeline 1: Root Cause Analysis of Food Wastage
 * Purpose: Unwinds student sensory complaint tags, groups by complaint type,
 * calculates frequency and average rating, and ranks why food is being discarded.
 */
const rootCauseAggregationPipeline = [
  // Stage 1: $match - Filter for dishes with sub-optimal ratings (<= 3 stars)
  {
    $match: {
      rating: { $lte: 3 }
    }
  },
  // Stage 2: $unwind - Deconstruct the sensory_tags array into individual records
  {
    $unwind: "$sensory_tags"
  },
  // Stage 3: $group - Aggregate complaints by specific sensory attribute
  {
    $group: {
      _id: "$sensory_tags",
      complaint_count: { $sum: 1 },
      affected_items: { $addToSet: "$food_name" },
      avg_rating: { $avg: "$rating" }
    }
  },
  // Stage 4: $project - Reshape fields for API response & UI visualization
  {
    $project: {
      _id: 0,
      reason: "$_id",
      count: "$complaint_count",
      dishes: "$affected_items",
      average_rating: { $round: ["$avg_rating", 2] }
    }
  },
  // Stage 5: $sort - Rank the most severe waste driver at the top
  {
    $sort: { count: -1 }
  }
];

/**
 * Pipeline 2: Food-Specific Sentiment Summary
 * Purpose: Provides a breakdown per food item with total feedback, avg rating,
 * and list of recurring feedback tags.
 */
const foodSentimentPipeline = [
  {
    $group: {
      _id: "$food_name",
      food_id: { $first: "$food_id" },
      total_feedbacks: { $sum: 1 },
      average_rating: { $avg: "$rating" },
      all_tags: { $push: "$sensory_tags" }
    }
  },
  {
    $project: {
      food_name: "$_id",
      food_id: 1,
      total_feedbacks: 1,
      average_rating: { $round: ["$average_rating", 1] },
      tags: {
        $reduce: {
          input: "$all_tags",
          initialValue: [],
          in: { $setUnion: ["$$value", "$$this"] }
        }
      }
    }
  },
  {
    $sort: { average_rating: 1 } // Lowest rated first
  }
];

module.exports = {
  sampleFeedbackData,
  rootCauseAggregationPipeline,
  foodSentimentPipeline
};
