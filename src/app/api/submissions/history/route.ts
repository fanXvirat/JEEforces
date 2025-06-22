import dbConnect from "@/lib/dbConnect";
import SubmissionModel from "@/backend/models/Submission.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { User } from "next-auth";

export async function GET(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user = session?.user as User;

    if (!user) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Find submissions, populate the 'problem' field with title and difficulty
        const submissions = await SubmissionModel.find({ 
            user: user._id, 
            contest: { $exists: false } // Practice submissions only
        })
        .populate('problem', 'title difficulty subject')
        .sort({ submissionTime: -1 });

        return Response.json(submissions, { status: 200 });

    } catch (error) {
        console.error("Error fetching submission history:", error);
        return Response.json({ message: "Internal Server Error" }, { status: 500 });
    }
}