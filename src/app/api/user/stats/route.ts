// app/api/user/stats/route.ts
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options"; // Adjust path if necessary
import mongoose from "mongoose";
import redis from '@/lib/redis'; // Import Redis client

const USER_STATS_TTL = 300; // Cache for 5 minutes (stats change after contests)

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = new mongoose.Types.ObjectId(session.user._id);
  const cacheKey = `user_stats_${userId.toString()}`;

  try {
    // 1. Check Redis Cache
    let cachedDataString;
    try {
      cachedDataString = await redis.get(cacheKey);
      if (cachedDataString) {
        console.log(`Serving user stats for ${userId} from Redis cache.`);
        return Response.json(JSON.parse(cachedDataString));
      }
    } catch (redisError) {
      console.error(`Redis GET error for user stats ${userId}:`, redisError);
    }

    // 2. Fetch from MongoDB if not in cache
    const stats = await UserModel.aggregate([
      { $match: { _id: userId } },
      {
        $lookup: {
          from: "contests",
          localField: "ratingHistory.contestid",
          foreignField: "_id",
          as: "ratingContests",
        },
      },
      {
        $lookup: {
          from: "contests",
          localField: "contestsParticipated",
          foreignField: "_id",
          as: "contestsJoined",
        },
      },
      {
        $project: {
          ratingHistory: {
            $map: {
              input: "$ratingHistory",
              as: "rh",
              in: {
                newrating: "$$rh.newrating",
                timestamp: "$$rh.timestamp",
                contestTitle: {
                  $arrayElemAt: [
                    "$ratingContests.title",
                    { $indexOfArray: ["$ratingContests._id", "$$rh.contestid"] }
                  ]
                }
              }
            }
          },
          contestsJoined: {
            $map: {
              input: "$contestsJoined",
              as: "cj",
              in: {
                _id: "$$cj._id",
                title: "$$cj.title",
                startTime: "$$cj.startTime"
              }
            }
          }
        }
      }
    ]);

    if (!stats.length) {
      return Response.json({ error: "User stats not found" }, { status: 404 });
    }

    const result = stats[0];

    // 3. Store in Redis Cache
    try {
      await redis.setex(cacheKey, USER_STATS_TTL, JSON.stringify(result));
      console.log(`Cached user stats for ${userId} in Redis.`);
    } catch (redisError) {
      console.error(`Redis SETEX error for user stats ${userId}:`, redisError);
    }

    return Response.json(result);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}