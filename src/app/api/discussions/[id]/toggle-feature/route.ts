import dbConnect from "@/lib/dbConnect";
import { DiscussionModel } from "@/backend/models/Discussion.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../auth/[...nextauth]/options";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== 'admin') {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const discussion = await DiscussionModel.findById(params.id);
    if (!discussion) return Response.json({ error: "Discussion not found" }, { status: 404 });

    discussion.isFeatured = !discussion.isFeatured;
    await discussion.save();
    return Response.json({ message: "Feature status updated", discussion });
  } catch (error) {
    console.error("Toggle feature error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}