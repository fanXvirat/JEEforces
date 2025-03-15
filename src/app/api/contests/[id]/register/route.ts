import dbConnect from "@/lib/dbConnect";
import ContestModel from "@/backend/models/Contest.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options"; 
import { User } from "next-auth";

export async function POST(request: Request,{ params }: { params: { id: string } }){
    await dbConnect();
    const session = await getServerSession(authOptions)
    const user: User=session?.user;
    if(!session || !user){
        return Response.json({error:"Unauthorized"},{status:401});
    }
    const userId=session.user._id;
    const contestId=params.id;
    try {
        const contest = await ContestModel.findById(contestId);
        if (!contest) {
            return Response.json({ error: "Contest not found" }, { status: 404 });
        }

        // Check if user is already registered
        if (contest.participants.includes(userId)) {
            return Response.json({ error: "Already registered" }, { status: 400 });
        }

        // Register the user
        contest.participants.push(userId);
        await contest.save();

        return Response.json({ message: "Registered successfully" });
    } catch (error) {
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}