import dbConnect from "@/lib/dbConnect";
import SubmissionModel from "@/backend/models/Submission.model";
import ProblemModel from "@/backend/models/Problem.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { User } from "next-auth";

export async function POST(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user = session?.user as User;

    if (!user) {
        return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { problemId, selectedOption } = await request.json();

        if (!problemId || !selectedOption) {
            return Response.json({ success: false, message: "Problem ID and selected option are required" }, { status: 400 });
        }

        const problem = await ProblemModel.findById(problemId);
        if (!problem) {
            return Response.json({ success: false, message: "Problem not found" }, { status: 404 });
        }

        const isCorrect = problem.correctOption === selectedOption;
        const verdict = isCorrect ? 'Correct' : 'Incorrect';
        const score = isCorrect ? problem.score : 0;

        // Create a new submission document
        await SubmissionModel.create({
            user: user._id,
            problem: problemId,
            // contest field is intentionally omitted for practice submissions
            selectedOptions: [selectedOption],
            submissionTime: new Date(),
            verdict: verdict,
            score: score,
            IsFinal: true, // Each practice attempt is final
        });
        
        // Return the verdict to the client
        return Response.json({ success: true, verdict: verdict, correctOption: problem.correctOption }, { status: 201 });

    } catch (error) {
        console.error("Error creating practice submission:", error);
        return Response.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}