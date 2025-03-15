import mongoose,{Schema,Document} from "mongoose";
export interface AdminLog extends Document{
    user:mongoose.Schema.Types.ObjectId;
    action:string;
    targetuser:mongoose.Schema.Types.ObjectId;
    targetproblem:mongoose.Schema.Types.ObjectId;
    targetcontest:mongoose.Schema.Types.ObjectId;
    createdAt:Date;
}
const AdminLogSchema: Schema<AdminLog> = new Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    action:{
        type:String,
        required:true
    },
    targetuser:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
    targetproblem:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Problem"
    },
    targetcontest:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Contest"
    },
    createdAt:{
        type:Date,
        required:true
    }
});
const AdminLogModel = (mongoose.models.AdminLog as mongoose.Model<AdminLog>) || mongoose.model<AdminLog>("AdminLog",AdminLogSchema);
export default AdminLogModel;