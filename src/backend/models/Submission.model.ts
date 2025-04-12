import mongoose,{Schema,Document} from "mongoose";
export interface Submission extends Document{
    user:mongoose.Schema.Types.ObjectId;
    problem:mongoose.Schema.Types.ObjectId;
    contest:mongoose.Schema.Types.ObjectId;
    selectedOptions:string[];
    submissionTime:Date;
    verdict:string;
    score:number;
    IsFinal:boolean;
}
const SubmissionSchema: Schema<Submission> = new Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    problem:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Problem",
        required:true
    },
    contest:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Contest",
    },
    selectedOptions:[{
        type:String,
        required:true
    }],
    submissionTime:{
        type:Date,
        required:true
    },
    verdict:{
        type:String,
        required:true
    },
    score:{
        type:Number,
        required:true
    },
    IsFinal:{
        type:Boolean,
        required:true
    }
});
const SubmissionModel = (mongoose.models.Submission as mongoose.Model<Submission>) || mongoose.model<Submission>("Submission",SubmissionSchema);
export default SubmissionModel;
