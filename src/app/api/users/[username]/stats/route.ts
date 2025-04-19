// app/api/users/[username]/stats/route.ts
import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import { NextResponse } from 'next/server';
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  await dbConnect();

  try {
    const user = await UserModel.aggregate([
      { $match: { username: params.username } },
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

    if (!user.length) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      ratingHistory: user[0].ratingHistory,
      contestsJoined: user[0].contestsJoined
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}