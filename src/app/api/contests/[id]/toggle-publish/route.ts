// src/app/api/contests/[id]/toggle-publish/route.ts
import dbConnect from "@/lib/dbConnect";
import ContestModel from "@/backend/models/Contest.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options"; // Adjust path as necessary
import { User } from "next-auth";
import mongoose from "mongoose";
import redis from "@/lib/redis"; // Assuming you want to clear cache on update

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User = session?.user;

    // 1. Authorization: Only admin can toggle publicity
    if (!session || !user.role || user.role !== "admin") {
        return Response.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const contestId = params.id;

    // 2. Validate Contest ID
    if (!mongoose.Types.ObjectId.isValid(contestId)) {
        return Response.json({ error: "Invalid contest ID" }, { status: 400 });
    }

    try {
        // 3. Find the contest and toggle its 'ispublished' status
        const contest = await ContestModel.findById(contestId);

        if (!contest) {
            return Response.json({ error: "Contest not found" }, { status: 404 });
        }

        contest.ispublished = !contest.ispublished; // Toggle the boolean
        await contest.save();

        // 4. Invalidate relevant Redis caches
        // When a contest's publication status changes, it affects how it appears
        // on the main contest list and potentially sidebars for all users (public and logged-in).
        // It's safer to clear relevant caches to ensure immediate consistency.
        const cacheKeysToClear = [
            `sidebar_contests_public`, // For public users
            // You might have other cache keys for logged-in users or main contest list
            // For example, if your main GET /api/contests also uses Redis cache:
            // `all_contests_cache` (if it exists)
        ];
        // Iterate over user IDs if you cache per user for main list:
        // You might need a more sophisticated cache invalidation strategy if you have many users
        // For simplicity, for contest list page, it's often better to just invalidate general caches.
        // If sidebar is also cached per user, you might need to clear *all* user sidebar caches.
        // For now, let's assume `sidebar_contests_public` covers the main visibility change.
        // If `sidebar_contests_user_` is affected, you might need to iterate through existing user IDs.
        // A simple approach is to clear only the public cache, and logged-in users' caches will refresh after their TTL.
        // Or, for immediate consistency for all logged-in users, you'd need to fetch all user IDs and clear their caches.
        // For production, consider using Redis Pub/Sub for more efficient cache invalidation across services/instances.
        if (redis) { // Check if redis client is available
            await redis.del(...cacheKeysToClear);
            console.log(`Cleared Redis caches: ${cacheKeysToClear.join(', ')}`);
        }


        // 5. Respond with the updated status
        return Response.json(
            {
                message: `Contest "${contest.title}" ${contest.ispublished ? 'published' : 'unpublished'} successfully.`,
                ispublished: contest.ispublished
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error toggling contest publicity:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}