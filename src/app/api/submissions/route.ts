import dbConnect from "@/lib/dbConnect";
import SubmissionModel from "@/backend/models/Submission.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function GET(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const userId = session.user._id;
        const { searchParams } = new URL(request.url);
        const contestId = searchParams.get('contestId');

        // Build query with contest filter if provided
        const query: Record<string, any> = { user: userId };
        if (contestId) query.contest = contestId;
        if (searchParams.get('IsFinal')) query.IsFinal = true;

        const submissions = await SubmissionModel.find(query)
            .populate("problem", "title")
            .populate("contest", "name")
            .sort({ submissionTime: -1 });

        return Response.json(submissions, { status: 200 });

    } catch (error) {
        console.error("Error fetching submissions:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}