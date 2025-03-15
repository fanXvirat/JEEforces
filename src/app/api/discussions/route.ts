import dbConnect from "@/lib/dbConnect";
import {DiscussionModel} from "@/backend/models/Discussion.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function POST(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { title, content } = await request.json();
        if (!title || !content) {
            return Response.json({ error: "Title and content are required" }, { status: 400 });
        }

        const discussion = await DiscussionModel.create({
            title,
            content,
            author: session.user._id,
            upvotes: [],
            downvotes: [],
            comments: [],
            report: [],
            CreatedAt: new Date(),
        });

        return Response.json({ message: "Discussion created", discussion }, { status: 201 });
    } catch (error) {
        console.error("Create Discussion Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    await dbConnect();

    try {
        const discussions = await DiscussionModel.find()
            .populate("author", "name") // Fetch author details
            .sort({ CreatedAt: -1 });

        return Response.json({ discussions }, { status: 200 });
    } catch (error) {
        console.error("Fetch Discussions Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
