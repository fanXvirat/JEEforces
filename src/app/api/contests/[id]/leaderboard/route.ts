import dbConnect from "@/lib/dbConnect";
import SubmissionModel from "@/backend/models/Submission.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function GET(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const contestId = params.id;

    // Validate contestId
    if (!mongoose.Types.ObjectId.isValid(contestId)) {
        return new Response(JSON.stringify({ error: "Invalid contest ID" }), { status: 400 });
    }

    try {
        const leaderboard = await SubmissionModel.aggregate([
            { $match: { contest: new mongoose.Types.ObjectId(contestId) } },
            { $group: { _id: "$user", totalscore: { $sum: "$score" } } },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userDetails" } },
            { $unwind: "$userDetails" },
            { 
                $project: { 
                    username: "$userDetails.username",
                    totalscore: 1 // Fix: Now correctly references the summed score
                } 
            },
            { $sort: { totalscore: -1 } } // Fix: Now correctly sorts by totalscore
        ]);

        return new Response(JSON.stringify(leaderboard), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}
