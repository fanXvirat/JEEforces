import dbConnect from "@/lib/dbConnect";
import ProblemModel from "@/backend/models/Problem.model";
import SubmissionModel from "@/backend/models/Submission.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextRequest } from "next/server";
import mongoose from "mongoose";
import { User } from "next-auth";

export async function GET(request: NextRequest) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user = session?.user as User;

    if (!user) {
        return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const count = parseInt(searchParams.get('count') || '1');
        const subjectsParam = searchParams.get('subjects');
        const subjects = subjectsParam ? subjectsParam.split(',') : [];

        // 1. Find all problems this user has already submitted answers for (in practice)
        const userSubmissions = await SubmissionModel.find({ 
            user: user._id,
            contest: { $exists: false } // Filter for practice submissions only
        }).select('problem');

        const excludedIds = userSubmissions.map(sub => sub.problem);
        
        // 2. Build the match query
        const matchQuery: any = {
            ispublished: true,
            _id: { $nin: excludedIds }
        };

        if (subjects.length > 0) {
            matchQuery.subject = { $in: subjects };
        }
        
        // 3. Fetch random problems using the constructed query
        const problems = await ProblemModel.aggregate([
            { $match: matchQuery },
            { $sample: { size: count } }
        ]);

        if (!problems || problems.length === 0) {
            return Response.json({ message: "No more problems found. You've solved them all for the selected subjects!" }, { status: 404 });
        }
        
        return Response.json(count === 1 ? problems[0] : problems, { status: 200 });

    } catch (error) {
        console.error("Error fetching random problems:", error);
        return Response.json({ message: "Internal Server Error" }, { status: 500 });
    }
}