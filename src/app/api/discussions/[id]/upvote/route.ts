import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { DiscussionModel } from "@/backend/models/Discussion.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?._id) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { action } = await request.json();
        const userId = new mongoose.Types.ObjectId(session.user._id);

        const updateOperations = {
            upvote: {
                $addToSet: { upvotes: userId },
                $pull: { downvotes: userId }
            },
            downvote: {
                $addToSet: { downvotes: userId },
                $pull: { upvotes: userId }
            }
        };

        const updatedDiscussion = await DiscussionModel.findByIdAndUpdate(
            params.id,
            updateOperations[action as keyof typeof updateOperations],
            { new: true, lean: true }
        ).select("upvotes downvotes");

        if (!updatedDiscussion) {
            return Response.json({ error: "Discussion not found" }, { status: 404 });
        }

        // Convert ObjectIds to strings
        const responseData = {
            upvotes: updatedDiscussion.upvotes.map(id => id.toString()),
            downvotes: updatedDiscussion.downvotes.map(id => id.toString())
        };

        return Response.json(responseData, { status: 200 });
    } catch (error) {
        console.error("Vote Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}