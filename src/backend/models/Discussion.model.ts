import mongoose, { Schema, Document } from "mongoose";
import { unique } from "next/dist/build/utils";

export interface Replies extends Document {
    text: string;
    author: mongoose.Schema.Types.ObjectId;
    CreatedAt: Date;
}
const RepliesSchema: Schema<Replies> = new Schema({
    text: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    CreatedAt: {
        type: Date,
        required: true
    }
});

export interface Comment extends Document {
    text: string;
    author: mongoose.Schema.Types.ObjectId;
    CreatedAt: Date;
    upvotes: mongoose.Schema.Types.ObjectId[];
    downvotes: mongoose.Schema.Types.ObjectId[];
    replies: Replies[];
}
const CommentSchema: Schema<Comment> = new Schema({
    text: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    CreatedAt: {
        type: Date,
        required: true
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId, // ✅ Fixed type
        ref: "User",
        default: []
    }],
    downvotes: [{
        type: mongoose.Schema.Types.ObjectId, // ✅ Fixed type
        ref: "User",
        default: []
    }],
    replies: [RepliesSchema] // Embedded Replies
});

export interface Discussion extends Document {
    title: string;
    content: string;
    author: mongoose.Schema.Types.ObjectId;
    upvotes: mongoose.Schema.Types.ObjectId[];
    downvotes: mongoose.Schema.Types.ObjectId[];
    comments: Comment[];
    report: mongoose.Schema.Types.ObjectId[];
    CreatedAt: Date;
    isFeatured: boolean;
}
const DiscussionSchema: Schema<Discussion> = new Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId, // ✅ Fixed type
        ref: "User",
        default: []
    }],
    downvotes: [{
        type: mongoose.Schema.Types.ObjectId, // ✅ Fixed type
        ref: "User",
        default: []
    }],
    comments: [CommentSchema], // Embedded Comments
    report: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    CreatedAt: {
        type: Date,
        required: true
    },
    isFeatured: {
        type: Boolean,
        default: false
      }
});

const RepliesModel = mongoose.models.Replies as mongoose.Model<Replies> || mongoose.model<Replies>("Replies", RepliesSchema);
const CommentModel = mongoose.models.Comment as mongoose.Model<Comment> || mongoose.model<Comment>("Comment", CommentSchema);
const DiscussionModel = mongoose.models.Discussion as mongoose.Model<Discussion> || mongoose.model<Discussion>("Discussion", DiscussionSchema);

export { DiscussionModel, CommentModel, RepliesModel };
