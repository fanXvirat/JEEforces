import dbConnect from "@/lib/dbConnect";
import ContestModel from "@/backend/models/Contest.model";
import ProblemModel from "@/backend/models/Problem.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options"; 
import { User } from "next-auth";
import mongoose from "mongoose";
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
export async function GET(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User = session?.user;

    try {
        // Extract ID from URL path
        const url = new URL(request.url);
        const pathSegments = url.pathname.split('/');
        const contestId = pathSegments[pathSegments.indexOf('contests') + 1];

        // Validate contest ID
        if (!mongoose.Types.ObjectId.isValid(contestId)) {
            return Response.json({ error: "Invalid contest ID" }, { status: 400 });
        }

        // Find contest with problem details
        const contest = await ContestModel.findById(contestId)
            .populate({
                path: 'problems',
                model: ProblemModel, // Explicitly reference the model
                select: 'title description options correctOption score subject imageUrl'
            })
            .populate('participants', 'name email')
            .lean();

        if (!contest) {
            return Response.json({ error: "Contest not found" }, { status: 404 });
        }

        // For non-admins: hide unpublished contests and problem solutions
        if (user?.role !== 'admin') {
            if (!contest.ispublished) {
                return Response.json({ error: "Contest not found" }, { status: 404 });
            }
            
            // Sanitize problems for participants
            contest.problems = contest.problems.map(problem => ({
                ...problem,
                correctOption: undefined
            })) as any;
        }

        return Response.json(contest);

    } catch (error) {
        console.error("Error fetching contest:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
