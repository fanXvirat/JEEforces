import dbConnect from "@/lib/dbConnect";
import {DiscussionModel} from "@/backend/models/Discussion.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { PipelineStage } from "mongoose";
import { rateLimiter } from "@/lib/rate-limiter";
export async function POST(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const identifier = session.user._id || "anonymous";
    const { success } = await rateLimiter.limit(identifier);
    if (!success) {
        return Response.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
        );
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
            isFeatured: false,
        });

        return Response.json({ message: "Discussion created", discussion }, { status: 201 });
    } catch (error) {
        console.error("Create Discussion Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(request: Request) {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured');

    try {
        const pipeline: PipelineStage[] = [
            {
                $lookup: {
                    from: "users",
                    localField: "author",
                    foreignField: "_id",
                    as: "author"
                }
            },
            { $unwind: "$author" },
            {
                $match: featured === 'true' ? { isFeatured: true } : {}
            },
            {
                $project: {
                    title: 1,
                    content: 1,
                    upvotes: 1,
                    downvotes: 1,
                    comments: 1,
                    report: 1,
                    CreatedAt: 1,
                    isFeatured: 1,
                    "author._id": 1,
                    "author.username": 1,
                    "author.name": 1,
                    "author.email": 1,
                    "author.title": 1,
                }
            },
            { $sort: { CreatedAt: -1 } }
        ];

        const discussions = await DiscussionModel.aggregate(pipeline);
        return Response.json({ discussions }, { status: 200 });
    } catch (error) {
        console.error("Fetch Discussions Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
