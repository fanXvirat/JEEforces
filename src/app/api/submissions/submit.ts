import dbConnect from "@/lib/dbConnect";
import SubmissionModel from "@/backend/models/Submission.model";
import ProblemModel from "@/backend/models/Problem.model";
import ContestModel from "@/backend/models/Contest.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function POST(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = session.user._id;
        const { problemId, contestId, selectedOptions } = await request.json();

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(problemId) || !mongoose.Types.ObjectId.isValid(contestId)) {
            return Response.json({ error: "Invalid problem or contest ID" }, { status: 400 });
        }

        // Fetch problem details
        const problem = await ProblemModel.findById(problemId);
        if (!problem) {
            return Response.json({ error: "Problem not found" }, { status: 404 });
        }

        // Fetch contest details
        const contest = await ContestModel.findById(contestId);
        if (!contest) {
            return Response.json({ error: "Contest not found" }, { status: 404 });
        }

        const now = new Date();
        if (now < contest.startTime || now > contest.endTime) {
            return Response.json({ error: "Contest is not active" }, { status: 403 });
        }

        // Check if the problem belongs to the contest
        if (!contest.problems.includes(problemId)) {
            return Response.json({ error: "Problem does not belong to this contest" }, { status: 400 });
        }

        // **Evaluate submission**
        const isCorrect = Array.isArray(selectedOptions) && Array.isArray(problem.correctOption) &&
            selectedOptions.sort().toString() === problem.correctOption.sort().toString();
        const score = isCorrect ? problem.score : 0;
        const verdict = isCorrect ? "Accepted" : "Wrong Answer";

        // **Save submission**
        const submission = await SubmissionModel.create({
            user: new mongoose.Types.ObjectId(userId),
            problem: new mongoose.Types.ObjectId(problemId),
            contest: new mongoose.Types.ObjectId(contestId),
            selectedOptions,
            submissionTime: now,
            verdict,
            score
        });

        return Response.json({ message: "Submission recorded", submission }, { status: 201 });

    } catch (error) {
        console.error("Submission error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
