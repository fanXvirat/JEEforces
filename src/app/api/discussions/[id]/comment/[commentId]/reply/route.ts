import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { DiscussionModel } from "@/backend/models/Discussion.model";
import mongoose from "mongoose";
import { Replies } from "@/backend/models/Discussion.model";

export async function POST(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { text } = await request.json();
    const discussion = await DiscussionModel.findById(params.id);
    
    if (!discussion) return Response.json({ error: "Discussion not found" }, { status: 404 });

    const comment = discussion.comments.find((c: any) => c._id.toString() === params.commentId);
    if (!comment) return Response.json({ error: "Comment not found" }, { status: 404 });

    const newReply = {
      _id: new mongoose.Types.ObjectId(), // Add an _id field
      text,
      author: new mongoose.Types.ObjectId(session.user._id),
      CreatedAt: new Date(),
      upvotes: [],
      downvotes: []
    };

    comment.replies.push(newReply as unknown as Replies); // Explicitly cast to Replies type
    await discussion.save();

    return Response.json({ message: "Reply added", discussion }, { status: 201 });
  } catch (error) {
    console.error("Add Reply Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; commentId: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session?.user?._id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action,replyId } = await request.json();
    const userId = new mongoose.Types.ObjectId(session.user._id);
    const arrayFilters = [
        { "comment._id": new mongoose.Types.ObjectId(params.commentId) },
        { "reply._id": new mongoose.Types.ObjectId(replyId) }
      ];
    const updateOperations = {
      upvote: {
        $addToSet: { "comments.$[comment].replies.$[reply].upvotes": userId },
        $pull: { "comments.$[comment].replies.$[reply].downvotes": userId }
      },
      downvote: {
        $addToSet: { "comments.$[comment].replies.$[reply].downvotes": userId },
        $pull: { "comments.$[comment].replies.$[reply].upvotes": userId }
      }
    };

    const updatedDiscussion = await DiscussionModel.findOneAndUpdate(
        { _id: params.id },
        updateOperations[action as keyof typeof updateOperations],
        { new: true, arrayFilters }
      );

    if (!updatedDiscussion) {
      return Response.json({ error: "Discussion not found" }, { status: 404 });
    }

    return Response.json({ discussion: updatedDiscussion }, { status: 200 });
  } catch (error) {
    console.error("Reply Vote Error:", error);
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}