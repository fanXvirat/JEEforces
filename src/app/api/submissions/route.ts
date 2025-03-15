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
        const userId = session.user._id; // Get logged-in user ID

        const submissions = await SubmissionModel.find({ user: userId })
            .populate("problem", "title") // Fetch problem titles
            .populate("contest", "name")  // Fetch contest names
            .sort({ submissionTime: -1 }); // Sort by latest submissions

        return Response.json(submissions, { status: 200 });

    } catch (error) {
        console.error("Error fetching submissions:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}