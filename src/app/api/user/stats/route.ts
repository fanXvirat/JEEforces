import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function GET() {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = new mongoose.Types.ObjectId(session.user._id);

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

    return Response.json(stats[0]);
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}