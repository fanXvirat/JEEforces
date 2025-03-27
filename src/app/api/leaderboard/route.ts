import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { User } from "next-auth";
import mongoose from "mongoose";

export async function GET(request: Request) {
  await dbConnect();

  // Session validation
  const session = await getServerSession(authOptions);
  const user: User = session?.user;

  if (!session || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const minRating = parseInt(searchParams.get("minRating") || "0");
    const maxRating = parseInt(searchParams.get("maxRating") || "3000");

    // Build query
    const query: any = { 
      rating: { $gte: minRating, $lte: maxRating } 
    };
    
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { institute: { $regex: search, $options: "i" } }
      ];
    }

    // Aggregation pipeline
    const leaderboard = await UserModel.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "submissions",
          localField: "_id",
          foreignField: "user",
          as: "submissions"
        }
      },
      {
        $addFields: {
          problemsSolved: { $size: "$submissions" },
          accuracy: {
            $cond: [
              { $eq: [{ $size: "$submissions" }, 0] },
              0,
              {
                $divide: [
                  { $size: { $filter: { input: "$submissions", as: "s", cond: { $eq: ["$$s.correct", true] } } } },
                  { $size: "$submissions" }
                ]
              }
            ]
          }
        }
      },
      {
        $project: {
          password: 0,
          email: 0,
          __v: 0,
          submissions: 0
        }
      },
      { $sort: { rating: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit }
    ]);

    const totalCount = await UserModel.countDocuments(query);

    return Response.json({
      success: true,
      leaderboard,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error("Leaderboard error:", error);
    return Response.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}