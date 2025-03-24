import mongoose,{Schema,Document} from "mongoose";
export interface Leaderboard extends Document{
    user:mongoose.Schema.Types.ObjectId;
    score:number;
    rank:number;
}
const LeaderboardSchema: Schema<Leaderboard> = new Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    score:{
        type:Number,
        required:true
    },
    rank:{
        type:Number,
        required:true
    }
});
export interface Contest extends Document{
    title:string;
    description:string;
    startTime:Date;
    endTime:Date;
    problems:mongoose.Schema.Types.ObjectId[];
    participants:mongoose.Schema.Types.ObjectId[];
    leaderboard:Leaderboard[];
    ispublished:boolean;
}
const ContestSchema: Schema<Contest> = new Schema({
    title:{
        type:String,
        required:[true,"Title is required"],
        trim:true
    },
    description:{
        type:String,
        required:[true,"Description is required"]
    },
    startTime:{
        type:Date,
        required:true
    },
    endTime:{
        type:Date,
        required:true
    },
    problems:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Problem",
        required:false
    }],
    participants:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    }],
    leaderboard:[LeaderboardSchema],
    ispublished:{
        type:Boolean,
        required:true
    }
});
const ContestModel = (mongoose.models.Contest as mongoose.Model<Contest>) || mongoose.model<Contest>("Contest",ContestSchema);
export default ContestModel;