import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { DiscussionModel } from "@/backend/models/Discussion.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function PUT(
  request: Request,
  { params }: { params: { discussionId: string; commentId: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action } = await request.json();
    const userId = new mongoose.Types.ObjectId(session.user._id);

    const updateOperations = {
      upvote: {
        $addToSet: { "comments.$[comment].upvotes": userId },
        $pull: { "comments.$[comment].downvotes": userId }
      },
      downvote: {
        $addToSet: { "comments.$[comment].downvotes": userId },
        $pull: { "comments.$[comment].upvotes": userId }
      }
    };

    const updatedDiscussion = await DiscussionModel.findOneAndUpdate(
      { _id: params.discussionId },
      updateOperations[action as keyof typeof updateOperations],
      {
        new: true,
        arrayFilters: [{ "comment._id": new mongoose.Types.ObjectId(params.commentId) }]
      }
    ).select("comments");

    if (!updatedDiscussion) {
      return Response.json({ error: "Discussion not found" }, { status: 404 });
    }

    return Response.json({
      comments: updatedDiscussion.comments.map(c => ({
        ...c.toObject(),
        upvotes: c.upvotes.map(id => id.toString()),
        downvotes: c.downvotes.map(id => id.toString())
      }))
    }, { status: 200 });

  } catch (error) {
    console.error("Comment Vote Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}