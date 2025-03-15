import dbConnect from "@/lib/dbConnect";
import ContestModel from "@/backend/models/Contest.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { User } from "next-auth";
import mongoose, { mongo } from "mongoose";
export async function POST(request: Request){
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User=session?.user;
    if(!session || !user.role || user.role!="admin"){
        return Response.json({error:"Unauthorized"},{status:401});
    }
    const data=await request.json();
    try {
        const newContest=await ContestModel.create({
            name:data.name,
            description:data.description,
            startTime:data.startTime,
            endTime:data.endTime,
            participants:[],
            problems:data.problems,
            ispublished:false,
            leaderboard:[],
        });
        return Response.json(newContest,{status:201});
    } catch (error) {
        console.log(error);
        return Response.json({error:"Internal Server Error"},{status:500});
        
    }
}