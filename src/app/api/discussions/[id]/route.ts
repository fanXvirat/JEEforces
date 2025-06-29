import dbConnect from "@/lib/dbConnect";
import { DiscussionModel } from "@/backend/models/Discussion.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { User } from "@/backend/models/User.model";
export async function GET(request: Request) {
    await dbConnect();

    const { pathname } = new URL(request.url);
    const id = pathname.split("/").pop(); // Extract the id from the URL path

    try {
        const discussion = await DiscussionModel.findById(id)
            .populate("author", "username title")
            .populate("comments.author", "username title")
            .populate("comments.replies.author", "username title");

        if (!discussion) {
            return Response.json({ error: "Discussion not found" }, { status: 404 });
        }

        return Response.json({ discussion }, { status: 200 });
    } catch (error) {
        console.error("Fetch Discussion Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user = session?.user as User;
    const { id } = await params;
    if (!user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const discussion = await DiscussionModel.findById(id);

        if (!discussion) {
            return Response.json({ error: "Discussion not found" }, { status: 404 });
        }

        // Check if the user is the author or an admin
        if (discussion.author.toString() !== user._id && user.role !== 'admin') {
            return Response.json({ error: "Forbidden: You are not authorized to delete this discussion." }, { status: 403 });
        }

        await DiscussionModel.findByIdAndDelete(id);

        return Response.json({ message: "Discussion deleted successfully" }, { status: 200 });

    } catch (error) {
        console.error("Delete Discussion Error:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}