// api/leaderboard/route.ts
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { User } from "next-auth";
import mongoose from "mongoose";
import redis from '@/lib/redis'; // Import your Redis client

// Define a TTL (Time-To-Live) for the leaderboard cache.
// Since it changes "rarely" (after contests), we can set a longer TTL.
// 300 seconds (5 minutes) is a good starting point. You can increase it to 600 (10 mins) or 900 (15 mins) if needed.
const LEADERBOARD_TTL = 600; // Cache for 10 minutes

export async function GET(request: Request) {
  await dbConnect();

  // Session validation
  const session = await getServerSession(authOptions);
  const user: User | undefined = session?.user; // Allow user to be undefined

  // IMPORTANT: If you want the full leaderboard to be public, remove this check.
  // Otherwise, it remains restricted to logged-in users.
  

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const minRating = parseInt(searchParams.get("minRating") || "0");
    const maxRating = parseInt(searchParams.get("maxRating") || "3000");

    // Construct a unique cache key based on all relevant query parameters
    // This ensures that different pages/limits/filters get their own cached data.
    const cacheKey = `leaderboard_page_${page}_limit_${limit}_search_${search || 'none'}_min_${minRating}_max_${maxRating}`;

    let cachedDataString;
    try {
        cachedDataString = await redis.get(cacheKey);
        if (cachedDataString) {
            console.log(`Serving leaderboard for key "${cacheKey}" from Redis cache.`);
            return Response.json(JSON.parse(cachedDataString));
        }
    } catch (redisError) {
        console.error(`Redis GET error for key "${cacheKey}":`, redisError);
        // Fallback to fetching from DB if Redis read fails
    }

    // If not in cache, proceed to fetch from MongoDB
    const query: any = {
      rating: { $gte: minRating, $lte: maxRating }
    };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { institute: { $regex: search, $options: "i" } }
      ];
    }

    // Aggregation pipeline (your existing logic)
    const leaderboard = await UserModel.aggregate([
  { $match: query }, // Your existing match logic for search and rating is correct
  { $sort: { rating: -1 } },
  { $skip: (page - 1) * limit },
  { $limit: limit },
  {
    $lookup: {
      from: "submissions",
      localField: "_id",
      foreignField: "user",
      as: "submissions",
      // We only need the verdict and IsFinal fields for this calculation
      pipeline: [{ $project: { verdict: 1, IsFinal: 1 } }]
    }
  },
  {
    $addFields: {
      // Correctly count problems solved where verdict is "Accepted" and submission is final
      problemsSolved: {
        $size: {
          $filter: {
            input: "$submissions",
            as: "s",
            cond: {
              $and: [
                { $eq: ["$$s.verdict", "Accepted"] },
                { $eq: ["$$s.IsFinal", true] }
              ]
            }
          }
        }
      },
      // Count total final attempts
      totalFinalSubmissions: {
        $size: {
          $filter: {
            input: "$submissions",
            as: "s",
            cond: { $eq: ["$$s.IsFinal", true] }
          }
        }
      }
    }
  },
  {
    $addFields: {
      // Calculate accuracy based on the new, correct fields
      accuracy: {
        $cond: [
          { $eq: ["$totalFinalSubmissions", 0] },
          0, // Avoid division by zero
          { $divide: ["$problemsSolved", "$totalFinalSubmissions"] } // Note: this is a ratio (e.g., 0.75), not a percentage
        ]
      }
    }
  },
  {
    // Project the final fields and remove the temporary ones
    $project: {
      username: 1,
      avatar: 1,
      rating: 1,
      title: 1,
      institute: 1,
      problemsSolved: 1,
      accuracy: 1
    }
  }
]);

    const totalCount = await UserModel.countDocuments(query); // This is also an expensive operation

    const responseData = {
      success: true,
      leaderboard,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    };

    // Store the data in Redis cache
    try {
        await redis.setex(cacheKey, LEADERBOARD_TTL, JSON.stringify(responseData));
        console.log(`Cached leaderboard for key "${cacheKey}" in Redis.`);
    } catch (redisError) {
        console.error(`Redis SETEX error for key "${cacheKey}":`, redisError);
        // Don't fail the request if Redis write fails
    }

    return Response.json(responseData);

  } catch (error) {
    console.error("Leaderboard error:", error);
    return Response.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}