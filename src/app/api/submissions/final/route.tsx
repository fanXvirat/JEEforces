import dbConnect from "@/lib/dbConnect";
import SubmissionModel from "@/backend/models/Submission.model";
import ContestModel from "@/backend/models/Contest.model";
import ProblemModel from "@/backend/models/Problem.model";
import UserModel from "@/backend/models/User.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function POST(request: Request) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const userId = session.user._id;
    const { submissions } = await request.json();
    const submissionTime = new Date();

    // Validate contest
    const contestId = submissions[0]?.contestId;
    const contest = await ContestModel.findById(contestId);
    if (!contest || new Date() > new Date(contest.endTime)) {
      return Response.json({ error: "Contest has ended" }, { status: 400 });
    }

    // Check if user already made a final submission
    const existingFinal = await SubmissionModel.findOne({
      user: userId,
      contest: contestId,
      isFinal: true
    });

    if (existingFinal) {
      return Response.json({ error: "You have already made a final submission" }, { status: 400 });
    }

    // Save all submissions as final
    const submissionPromises = submissions.map(async (sub: any) => {
      const problem = await ProblemModel.findById(sub.problemId);
      const isCorrect = problem?.correctOption === sub.selectedOptions[0];
      
      return SubmissionModel.findOneAndUpdate(
        { user: userId, problem: sub.problemId, contest: contestId },
        {
          selectedOptions: sub.selectedOptions,
          submissionTime,
          verdict: isCorrect ? "Accepted" : "Wrong Answer",
          score: isCorrect ? problem?.score || 0 : 0,
          isFinal: true // Mark as final submission
        },
        { upsert: true, new: true }
      );
    });

    await Promise.all(submissionPromises);

    // Update leaderboard
    const totalScore = await SubmissionModel.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(userId), contest: new mongoose.Types.ObjectId(contestId) } },
      { $group: { _id: null, total: { $sum: "$score" } } }
    ]);

    await ContestModel.updateOne(
      { _id: contestId, "leaderboard.user": userId },
      { $set: { "leaderboard.$.score": totalScore[0]?.total || 0 } }
    );

    return Response.json({ message: "Final submissions saved successfully" });

  } catch (error) {
    console.error("Final submission error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}