// app/api/users/[username]/stats/route.ts

import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import SubmissionModel from "@/backend/models/Submission.model";
import { NextResponse } from 'next/server';
import mongoose from "mongoose";

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  await dbConnect();

  try {
    // === Step 1: Find the user and get their ID. This MUST happen first. ===
    const user = await UserModel.findOne({ username: params.username }).select('_id').lean();
    
    // If no user is found, stop immediately and return a 404.
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const userId = user._id;

    // === Step 2: Now that we have a valid userId, run all stat queries in parallel. ===
    const [
      userWithContests,
      accuracyStats,
      difficultyStats
    ] = await Promise.all([
      // Query 1: Get contest and rating history
      UserModel.aggregate([
        { $match: { _id: userId } },
        { $lookup: { from: "contests", localField: "ratingHistory.contestid", foreignField: "_id", as: "ratingContests" } },
        { $lookup: { from: "contests", localField: "contestsParticipated", foreignField: "_id", as: "contestsJoined" } },
        { $project: {
            _id: 1,
            ratingHistory: { $map: { input: "$ratingHistory", as: "rh", in: { newrating: "$$rh.newrating", timestamp: "$$rh.timestamp", contestTitle: { $arrayElemAt: [ "$ratingContests.title", { $indexOfArray: ["$ratingContests._id", "$$rh.contestid"] } ] } } } },
            contestsJoined: { $map: { input: "$contestsJoined", as: "cj", in: { _id: "$$cj._id", title: "$$cj.title", startTime: "$$cj.startTime" } } }
        }}
      ]),

      // Query 2: Get overall accuracy stats
      SubmissionModel.aggregate([
        { $match: { user: userId, IsFinal: true } },
        { $group: { _id: null, totalAttempted: { $sum: 1 }, problemsSolved: { $sum: { $cond: [{ $eq: ["$verdict", "Accepted"] }, 1, 0] } } } }
      ]),

      // Query 3: Get the breakdown by difficulty
      SubmissionModel.aggregate([
        { $match: { user: userId, IsFinal: true, verdict: "Accepted" } },
        { $lookup: { from: "problems", localField: "problem", foreignField: "_id", as: "problemDetails" } },
        { $unwind: "$problemDetails" },
        { $group: { _id: "$problemDetails.difficulty", count: { $sum: 1 } } }
      ])
    ]);

    // === Step 3: Process and combine all results. ===

    const userResult = userWithContests[0] || { ratingHistory: [], contestsJoined: [] };
    const problemStats = accuracyStats[0] || { totalAttempted: 0, problemsSolved: 0 };
    const accuracy = problemStats.totalAttempted > 0 ? (problemStats.problemsSolved / problemStats.totalAttempted) * 100 : 0;

    const difficultyCounts = { easy: 0, medium: 0, hard: 0 };
    difficultyStats.forEach(stat => {
      if (stat._id === 1) difficultyCounts.easy = stat.count;
      if (stat._id === 2) difficultyCounts.medium = stat.count;
      if (stat._id === 3) difficultyCounts.hard = stat.count;
    });

    // Return the final combined JSON object
    return NextResponse.json({
      ratingHistory: userResult.ratingHistory,
      contestsJoined: userResult.contestsJoined,
      problemsSolved: problemStats.problemsSolved,
      totalAttempted: problemStats.totalAttempted,
      accuracy: Number(accuracy.toFixed(2)),
      difficultyCounts: difficultyCounts,
    });

  } catch (error) {
    // This will catch any unexpected errors during the process
    console.error(`CRITICAL Error fetching stats for user ${params.username}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}