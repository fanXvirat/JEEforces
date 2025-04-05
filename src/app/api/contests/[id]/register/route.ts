import dbConnect from "@/lib/dbConnect";
import ContestModel from "@/backend/models/Contest.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options"; 
import { User } from "next-auth";


import UserModel from "@/backend/models/User.model";
export async function POST(request: Request) { // Remove params from function parameters
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User = session?.user;
    if (!session || !user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user._id;
    const url = new URL(request.url);
    const contestId = url.pathname.split('/')[3];
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
        await UserModel.findByIdAndUpdate(user._id, {
            $push: { contestsParticipated: contestId }
        });
        await contest.save();

        return Response.json({ message: "Registered successfully" });
    } catch (error) {
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}