import dbConnect from "@/lib/dbConnect";
import { DiscussionModel } from "@/backend/models/Discussion.model";

export async function GET(request: Request) {
    await dbConnect();

    const { pathname } = new URL(request.url);
    const id = pathname.split("/").pop(); // Extract the id from the URL path

    try {
        const discussion = await DiscussionModel.findById(id)
            .populate("author", "username")
            .populate("comments.author", "username")
            .populate("comments.replies.author", "username");

        if (!discussion) {
            return Response.json({ error: "Discussion not found" }, { status: 404 });
        }

        return Response.json({ discussion }, { status: 200 });
    } catch (error) {
        console.error("Fetch Discussion Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
