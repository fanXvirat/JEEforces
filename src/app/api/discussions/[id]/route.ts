import dbConnect from "@/lib/dbConnect";
import {DiscussionModel} from "@/backend/models/Discussion.model";


export async function GET(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    try {
        const discussion = await DiscussionModel.findById(params.id)
            .populate("author", "name")
            .populate("comments.author", "name") 
            .populate("comments.replies.author", "name");

        if (!discussion) {
            return Response.json({ error: "Discussion not found" }, { status: 404 });
        }

        return Response.json({ discussion }, { status: 200 });
    } catch (error) {
        console.error("Fetch Discussion Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
