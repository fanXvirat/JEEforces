import dbConnect from "@/lib/dbConnect";
import SubmissionModel from "@/backend/models/Submission.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const submissionId = params.id;
        
        if (!mongoose.Types.ObjectId.isValid(submissionId)) {
            return Response.json({ error: "Invalid submission ID" }, { status: 400 });
        }

        const submission = await SubmissionModel.findById(submissionId)
            .populate("user", "username")   // Fetch username
            .populate("problem", "title description") // Fetch problem details
            .populate("contest", "name")    // Fetch contest name

        if (!submission) {
            return Response.json({ error: "Submission not found" }, { status: 404 });
        }

        return Response.json(submission, { status: 200 });

    } catch (error) {
        console.error("Error fetching submission details:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
