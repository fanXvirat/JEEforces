import dbConnect from "@/lib/dbConnect";
import ContestModel from "@/backend/models/Contest.model";
import UserModel from "@/backend/models/User.model";
import SubmissionModel from "@/backend/models/Submission.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

// Calculate title based on updated rating thresholds
function calculateTitle(rating: number): string {
    if (rating >= 2100) return 'Candidate Master';
    else if (rating >= 1900) return 'Expert';
    else if (rating >= 1000) return 'Pupil';
    else return 'Newbie';
}

// Dynamic K-factor based on rating and participant count
function getKFactor(rating: number, participantCount: number): number {
    // Base K by rating tier
    if (rating < 1200) return 40;
    if (rating < 2000) return 32;
    if (rating < 2400) return 24;
    return 16;
}

export async function POST(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    // Admin check
    // @ts-ignore
    if (session?.user?.role !== 'admin') {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/');
    const contestId = pathSegments[pathSegments.indexOf('contests') + 1];

    if (!mongoose.Types.ObjectId.isValid(contestId)) {
        return Response.json({ error: "Invalid contest ID" }, { status: 400 });
    }

    try {
        const contest = await ContestModel.findById(contestId);
        if (!contest) return Response.json({ error: "Contest not found" }, { status: 404 });
        if (contest.ratingsUpdated) return Response.json({ error: "Ratings already updated" }, { status: 400 });
        if (contest.endTime > new Date()) return Response.json({ error: "Contest hasn't ended" }, { status: 400 });

        // Fetch leaderboard (best score + earliest time per problem)
        const leaderboard = await SubmissionModel.aggregate([
            { $match: { contest: new mongoose.Types.ObjectId(contestId) } },
            { $sort: { submissionTime: 1 } },
            { $group: {
                _id: { user: "$user", problem: "$problem" },
                maxScore: { $max: "$score" },
                earliestSubmission: { $first: "$submissionTime" }
            }},
            { $group: {
                _id: "$_id.user",
                totalScore: { $sum: "$maxScore" },
                lastSubmission: { $max: "$earliestSubmission" }
            }},
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "userDetails" }},
            { $unwind: "$userDetails" },
            { $project: {
                _id: 0,
                userId: "$_id",
                username: "$userDetails.username",
                totalScore: 1,
                lastSubmission: 1
            }},
            { $sort: { totalScore: -1, lastSubmission: 1 } },
            { $group: { _id: null, entries: { $push: "$$ROOT" } } },
            { $unwind: { path: "$entries", includeArrayIndex: "rank" } },
            { $replaceRoot: { newRoot: { $mergeObjects: [ "$entries", { rank: { $add: ["$rank", 1] } } ] } } }
        ]);

        if (leaderboard.length === 0) return Response.json({ error: "No participants" }, { status: 400 });

        // Ensure no zero ratings
        const userIds = leaderboard.map(e => new mongoose.Types.ObjectId(e.userId));
        await UserModel.updateMany(
            { _id: { $in: userIds }, rating: 0 },
            { $set: { rating: 1000 } }
        );

        // Fetch current ratings
        const users = await UserModel.find({ _id: { $in: userIds } })
            .select('rating')
            .lean<{ _id: mongoose.Types.ObjectId; rating: number }[]>();
        const userRatings = new Map(users.map(u => [u._id.toString(), u.rating]));

        const N = leaderboard.length;
        // Build participants array with expected score
        const participants = leaderboard.map(entry => ({
            userId: entry.userId.toString(),
            actualRank: entry.rank,
            currentRating: userRatings.get(entry.userId.toString()) || 1000,
            expectedScore: 0,
        }));

        // Calculate expected scores via Elo formula
        for (const p of participants) {
            let sumE = 0;
            for (const other of participants) {
                if (p.userId === other.userId) continue;
                const diff = other.currentRating - p.currentRating;
                sumE += 1 / (1 + Math.pow(10, diff / 400));
            }
            p.expectedScore = sumE;
        }

        // Prepare bulk rating updates
        const bulkOps = participants.map(p => {
            const actualScore = N - p.actualRank;            
            const K = getKFactor(p.currentRating, N);
            const delta = Math.round(K * (actualScore - p.expectedScore));
            const newRating = p.currentRating + delta;

            return {
                updateOne: {
                    filter: { _id: new mongoose.Types.ObjectId(p.userId) },
                    update: {
                        $set: { 
                            rating: newRating,
                            title: calculateTitle(newRating),
                        },
                        $push: {
                            ratingHistory: {
                                contestid: contestId,
                                oldrating: p.currentRating,
                                newrating: newRating,
                                timestamp: new Date(),
                            }
                        }
                    }
                }
            };
        });

        await UserModel.bulkWrite(bulkOps);
        contest.ratingsUpdated = true;
        await contest.save();

        return Response.json({ message: "Ratings updated successfully" });
    } catch (error) {
        console.error("Rating update error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
