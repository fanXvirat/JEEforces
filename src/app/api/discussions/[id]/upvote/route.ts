import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { DiscussionModel } from "@/backend/models/Discussion.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { action } = await request.json(); // "upvote" or "downvote"
        const discussion = await DiscussionModel.findById(params.id);
        if (!discussion) {
            return Response.json({ error: "Discussion not found" }, { status: 404 });
        }

        if (action === "upvote") {
            if (!discussion.upvotes.includes(session.user._id)) {
                discussion.upvotes.push(session.user._id);
            }
            discussion.downvotes = discussion.downvotes.filter(id => id !== session.user._id);
        } else if (action === "downvote") {
            if (!discussion.downvotes.includes(session.user._id)) {
                discussion.downvotes.push(session.user._id);
            }
            discussion.upvotes = discussion.upvotes.filter(id => id !== session.user._id);
        }

        await discussion.save();
        return Response.json({ message: "Vote updated", discussion }, { status: 200 });
    } catch (error) {
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
