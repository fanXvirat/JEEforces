// app/api/user/statts/route.ts
import dbConnect from "@/lib/dbConnect";
import SubmissionModel from "@/backend/models/Submission.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options"; // Adjust path if necessary
import mongoose from "mongoose";
import redis from '@/lib/redis'; // Import Redis client

const USER_STATTS_TTL = 300; // Cache for 5 minutes (changes with new submissions)

export async function GET(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = new mongoose.Types.ObjectId(session.user._id);
  const cacheKey = `user_statts_${userId.toString()}`;

  try {
    // 1. Check Redis Cache
    let cachedDataString;
    try {
      cachedDataString = await redis.get(cacheKey);
      if (cachedDataString) {
        console.log(`Serving user statts for ${userId} from Redis cache.`);
        return Response.json(JSON.parse(cachedDataString));
      }
    } catch (redisError) {
      console.error(`Redis GET error for user statts ${userId}:`, redisError);
    }

    // 2. Fetch from MongoDB if not in cache
    const stats = await SubmissionModel.aggregate([
      {
        $match: {
          user: userId,
          IsFinal: true // Assuming IsFinal is true for graded submissions
        }
      },
      {
        $group: {
          _id: null,
          totalProblemsAttempted: { $sum: 1 }, // Renamed from totalProblems for clarity
          problemsSolved: { // Correctly counts only accepted
            $sum: {
              $cond: [{ $eq: ["$verdict", "Accepted"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalProblemsAttempted: 0,
      problemsSolved: 0
    };

    const accuracy = result.totalProblemsAttempted > 0
      ? (result.problemsSolved / result.totalProblemsAttempted) * 100
      : 0;

    const responseData = {
      problemsSolved: result.problemsSolved,
      totalAttempted: result.totalProblemsAttempted,
      accuracy: Number(accuracy.toFixed(2)) // Round to 2 decimal places
    };

    // 3. Store in Redis Cache
    try {
      await redis.setex(cacheKey, USER_STATTS_TTL, JSON.stringify(responseData));
      console.log(`Cached user statts for ${userId} in Redis.`);
    } catch (redisError) {
      console.error(`Redis SETEX error for user statts ${userId}:`, redisError);
    }

    return Response.json(responseData);

  } catch (error) {
    console.error("Error fetching user statts:", error);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}