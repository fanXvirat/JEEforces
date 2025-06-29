import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { DiscussionModel } from "@/backend/models/Discussion.model";
import { User } from "next-auth";
import mongoose from "mongoose";

export async function DELETE(
    request: Request,
    { params }: { params: { id: string; commentId: string; replyId: string } }
) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user = session?.user as User;
    const { id, commentId, replyId } = await params;
    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId)) {
        return Response.json({ error: "Invalid ID format" }, { status: 400 });
    }

    try {
        const discussion = await DiscussionModel.findById(id);

        if (!discussion) {
            return Response.json({ error: "Discussion not found" }, { status: 404 });
        }

        const comment = discussion.comments.find(
            (c: any) => c._id.toString() === commentId
        );
        if (!comment) {
            return Response.json({ error: "Comment not found" }, { status: 404 });
        }

        const reply = comment.replies.find(
            (r: any) => r._id.toString() === replyId
        );
        if (!reply) {
            return Response.json({ error: "Reply not found" }, { status: 404 });
        }

        // Check if the user is the author of the reply or an admin
        if (reply.author.toString() !== user._id && user.role !== 'admin') {
            return Response.json({ error: "Forbidden: You are not authorized to delete this reply." }, { status: 403 });
        }
        
        // Remove the reply from the comment's replies array
        comment.replies = comment.replies.filter(
            (r: any) => r._id.toString() !== replyId
        );
        await discussion.save();

        return Response.json({ message: "Reply deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Delete Reply Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}