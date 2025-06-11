import mongoose,{Schema,Document} from "mongoose";
export interface RatingHistory extends Document{
    contestid:mongoose.Schema.Types.ObjectId;
    oldrating:number;
    newrating:number;
    timestamp:Date;
}
const RatingHistorySchema: Schema<RatingHistory> = new Schema({
    contestid:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Contest",
    },
    oldrating:{
        type:Number,
    },
    newrating:{
        type:Number,
    },
    timestamp:{
        type:Date,
    }
});
export interface User extends Document{
    username:string;
    email:string;
    password:string;
    role:'user' | 'admin' | 'moderator';
    rating:number;
    title:string;
    institute:string;
    yearofstudy:number;
    problemsSolved:number;
    contestsParticipated:mongoose.Schema.Types.ObjectId[];
    ratingHistory:RatingHistory[];
    avatar:string;
    createdAt:Date;
    updatedAt:Date;
    isVerified:boolean;
    verifyToken?: string; // Optional for email verification
    verifyTokenExp?: Date; // Optional for email verification
}
const UserSchema: Schema<User> = new Schema(
    {
      username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true,
        unique: true,
      },
      email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        match: [/^([\w-\.]+@([\w-]+\.)+[\w-]{2,4})?$/, 'Invalid email'],
      },
      password: {
        type: String,
        required: true,
      },
      role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        default: 'user',
      },
      rating: {
        type: Number,
        default: 300,
      },
      title: {
        type: String,
        default: 'newbie',
      },
      institute: {
        type: String,
        default: 'self',
      },
      yearofstudy: {
        type: Number,
        default: 0,
      },
      problemsSolved: {
        type: Number,
        default: 0,
      },
      contestsParticipated: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Contest',
        default: [],
      },
      ratingHistory: {
        type: [RatingHistorySchema],
        default: [],
      },
      avatar: {
        type: String,
        default: '',
      },
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifyToken: {
        type: String,
        default: undefined, // Optional for email verification
      },
      verifyTokenExp: {
        type: Date,
        default: undefined, // Optional for email verification
      },
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt
  );
const UserModel = (mongoose.models.User as mongoose.Model<User>) || mongoose.model<User>("User",UserSchema);
export default UserModel;