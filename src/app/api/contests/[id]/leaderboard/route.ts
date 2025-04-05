import dbConnect from "@/lib/dbConnect";
import SubmissionModel from "@/backend/models/Submission.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function GET(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Extract contestId from URL
        const url = new URL(request.url);
        const pathSegments = url.pathname.split('/');
        const contestId = pathSegments[pathSegments.indexOf('contests') + 1];

        // Validate contestId
        if (!mongoose.Types.ObjectId.isValid(contestId)) {
            return Response.json({ error: "Invalid contest ID" }, { status: 400 });
        }

        const leaderboard = await SubmissionModel.aggregate([
            // Match submissions for this contest
            { 
                $match: { 
                    contest: new mongoose.Types.ObjectId(contestId) 
                } 
            },
            
            // Sort by submission time (earlier submissions first for tie-breaker)
            { $sort: { submissionTime: 1 } },
            
            // Group by user and get best submission per problem
            {
                $group: {
                    _id: {
                        user: "$user",
                        problem: "$problem"
                    },
                    maxScore: { $max: "$score" },
                    earliestSubmission: { $first: "$submissionTime" }
                }
            },
            
            // Now group by user to calculate total score
            {
                $group: {
                    _id: "$_id.user",
                    totalScore: { $sum: "$maxScore" },
                    lastSubmission: { $max: "$earliestSubmission" } // For tie-breaker
                }
            },
            
            // Lookup user details
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userDetails"
                }
            },
            { $unwind: "$userDetails" },
            
            // Project final fields
            {
                $project: {
                    _id: 0,
                    userId: "$_id",
                    username: "$userDetails.username",
                    avatar: "$userDetails.avatar",
                    totalScore: 1,
                    lastSubmission: 1
                }
            },
            
            // Final sort by score (descending) and submission time (ascending)
            { 
                $sort: { 
                    totalScore: -1,
                    lastSubmission: 1 
                } 
            },
            
            // Add rank using a simple approach
            {
                $group: {
                    _id: null,
                    entries: { $push: "$$ROOT" }
                }
            },
            {
                $unwind: {
                    path: "$entries",
                    includeArrayIndex: "rank"
                }
            },
            {
                $replaceRoot: {
                    newRoot: {
                        $mergeObjects: [
                            "$entries",
                            { rank: { $add: ["$rank", 1] } }
                        ]
                    }
                }
            }
        ]);

        return Response.json(leaderboard, { status: 200 });
    } catch (error) {
        console.error("Leaderboard error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}