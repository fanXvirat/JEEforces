// src/app/api/contests/[id]/release-problems/route.ts
import dbConnect from "@/lib/dbConnect";
import ContestModel from "@/backend/models/Contest.model";
import ProblemModel from "@/backend/models/Problem.model"; // Import ProblemModel
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options"; // Adjust path
import { User } from "next-auth";
import mongoose from "mongoose";
import redis from "@/lib/redis"; // Import Redis client

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User = session?.user;

    // Authorization: Only admin can release problems
    if (!session || !user.role || user.role !== "admin") {
        return Response.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const contestId = params.id;

    // Validate contest ID
    if (!mongoose.Types.ObjectId.isValid(contestId)) {
        return Response.json({ error: "Invalid contest ID" }, { status: 400 });
    }

    try {
        const contest = await ContestModel.findById(contestId);

        if (!contest) {
            return Response.json({ error: "Contest not found" }, { status: 404 });
        }

        const now = new Date();
        const endTime = new Date(contest.endTime);

        // Crucial Check: Contest must have ended to release problems globally
        if (now < endTime) {
            return Response.json({ error: "Contest has not ended yet. Problems cannot be released globally." }, { status: 400 });
        }

        const problemIds = contest.problems;

        if (!problemIds || problemIds.length === 0) {
            return Response.json({ message: "No problems found in this contest to release." }, { status: 200 });
        }

        // Update `ispublished` to true for all problems in this contest that are currently false
        const updateResult = await ProblemModel.updateMany(
            { _id: { $in: problemIds }, ispublished: false }, // Only update if currently unpublished
            { $set: { ispublished: true } }
        );

        // Invalidate relevant Redis caches for problem lists
        // This is crucial because problem visibility changes on the /problems page.
        const cacheKeysToClear = [
            `problem_list_cache_public`, // Example: if you cache GET /api/problems for public
            // If you cache problem data on ContestPage, you might need to invalidate that too,
            // but the problems in a contest are usually fetched directly from the contest's `problems` array.
        ];
        if (redis) {
            await Promise.all(cacheKeysToClear.map(key => redis.del(key)));
            console.log(`Cleared Redis caches: ${cacheKeysToClear.join(', ')}`);
        }

        return Response.json(
            {
                message: `Successfully released ${updateResult.modifiedCount} problems from contest "${contest.title}" to public.`,
                releasedCount: updateResult.modifiedCount
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error releasing problems from contest:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}