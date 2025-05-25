// app/api/user/stats/route.ts
import dbConnect from "@/lib/dbConnect";
import SubmissionModel from "@/backend/models/Submission.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function GET(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = new mongoose.Types.ObjectId(session.user._id);

    // Get submission statistics
    const stats = await SubmissionModel.aggregate([
      {
        $match: {
          user: userId,
          IsFinal: true
        }
      },
      {
        $group: {
          _id: null,
          totalProblems: { $sum: 1 },
          correctProblems: {
            $sum: {
              $cond: [{ $eq: ["$verdict", "Accepted"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalProblems: 0,
      correctProblems: 0
    };

    const accuracy = result.totalProblems > 0 
      ? (result.correctProblems / result.totalProblems) * 100
      : 0;

    return Response.json({
      problemsSolved: result.correctProblems,
      totalAttempted: result.totalProblems,
      accuracy: Number(accuracy.toFixed(2)) // Round to 2 decimal places
    });

  } catch (error) {
    console.error("Error fetching user stats:", error);
    return Response.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}