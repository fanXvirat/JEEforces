import mongoose,{Schema,Document} from "mongoose";
export interface Problem extends Document{
    title:string;
    description:string;
    difficulty:number;
    score:number;
    tags:string[];
    author:mongoose.Schema.Types.ObjectId;
    subject:string;
    solution:string;
    options:string[];
    correctOption:string;
    imageUrl?: string;
}
const ProblemSchema: Schema<Problem> = new Schema({
    title:{
        type:String,
        required:[true,"Title is required"],
        trim:true
    },
    description:{
        type:String,
        required:[true,"Description is required"]
    },
    difficulty:{
        type:Number,
        required:true
    },
    score:{
        type:Number,
        required:true
    },
    tags:[{
        type:String,
    }],
    author:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
    },
    subject:{
        type:String,
        required:true
    },
    solution:{
        type:String,
    },
    options:[{
        type:String,
        required:true
    }],
    correctOption:{
        type:String,
        required:true
    },
    imageUrl: {         
        type: String,
        required: false 
    }
});
const ProblemModel = (mongoose.models.Problem as mongoose.Model<Problem>) || mongoose.model<Problem>("Problem",ProblemSchema);
export default ProblemModel;
