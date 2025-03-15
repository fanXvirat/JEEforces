import dbConnect from "@/lib/dbConnect";
import ContestModel from "@/backend/models/Contest.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options"; 
import { User } from "next-auth";
export async function PUT(request: Request){
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User=session?.user;
    if(!session || !user.role || user.role!="admin"){
        return Response.json({error:"Unauthorized"},{status:401});
    }
    const data=await request.json();
    try {
        const updatedContest=await ContestModel.findByIdAndUpdate(data._id,data,{new:true});
        return Response.json(updatedContest,{status:200});
    } catch (error) {
        return Response.json({error:"Internal Server Error"},{status:500});
        
    }
}
