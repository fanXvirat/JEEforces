import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { DiscussionModel, CommentModel } from "@/backend/models/Discussion.model";

export async function POST(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').slice(-2, -1)[0]; // Extract the `id` from the URL

        const { text } = await request.json();
        if (!text) {
            return Response.json({ error: "Comment text is required" }, { status: 400 });
        }

        const discussion = await DiscussionModel.findById(id);
        if (!discussion) {
            return Response.json({ error: "Discussion not found" }, { status: 404 });
        }

        const newComment = new CommentModel({
            text,
            author: session.user._id,
            CreatedAt: new Date(),
            replies: [],
        });

        discussion.comments.push(newComment);

        await discussion.save();
        return Response.json({ message: "Comment added", discussion }, { status: 201 });
    } catch (error) {
        console.error("Add Comment Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
