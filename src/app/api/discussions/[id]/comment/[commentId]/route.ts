import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { DiscussionModel,CommentModel,RepliesModel} from "@/backend/models/Discussion.model";
import { User } from "@/backend/models/User.model";

export async function POST(request: Request, { params }: { params: { discussionId: string; commentId: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { text } = await request.json();
        if (!text) {
            return Response.json({ error: "Reply text is required" }, { status: 400 });
        }

        // Find the discussion
        const discussion = await DiscussionModel.findById(params.discussionId);
        if (!discussion) {
            return Response.json({ error: "Discussion not found" }, { status: 404 });
        }

        // Find the comment inside the discussion
        const comment = discussion.comments.find((c: any) => c._id.toString() === params.commentId);
        if (!comment) {
            return Response.json({ error: "Comment not found" }, { status: 404 });
        }

        // Add the reply to the comment's replies array
        const newReply = new RepliesModel({
            text,
            author: session.user._id,
            CreatedAt: new Date(),
        });
        comment.replies.push(newReply);

        // Save the updated discussion
        await discussion.save();

        return Response.json({ message: "Reply added successfully", comment }, { status: 201 });
    } catch (error) {
        console.error("Add Reply Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
export async function DELETE(request: Request, { params }: { params: { id: string; commentId: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user = session?.user as User;
    const {id} = await params;
    const { commentId } = await params;
    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const discussion = await DiscussionModel.findById(id);

        if (!discussion) {
            return Response.json({ error: "Discussion not found" }, { status: 404 });
        }

        const comment = discussion.comments.find((c: any) => c._id.toString() === commentId);
        if (!comment) {
            return Response.json({ error: "Comment not found" }, { status: 404 });
        }

        // Check if the user is the author of the comment or an admin
        if (comment.author.toString() !== user._id && user.role !== 'admin') {
            return Response.json({ error: "Forbidden: You are not authorized to delete this comment." }, { status: 403 });
        }

        await DiscussionModel.updateOne(
            { _id: id },
            { $pull: { comments: { _id: commentId } } }
        );

        return Response.json({ message: "Comment deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Delete Comment Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}