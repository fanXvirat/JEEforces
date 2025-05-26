import dbConnect from "@/lib/dbConnect";
import ProblemModel from "@/backend/models/Problem.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { User } from "next-auth";
import mongoose from "mongoose";
export async function POST(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user?.role !== "admin") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const data = await request.json();

        const newProblem = await ProblemModel.create({
            title: data.title,
            description: data.description,
            difficulty: data.difficulty,
            score: data.score,
            tags: data.tags || [],
            author: session.user._id, // Assigning the admin user as the author
            subject: data.subject,
            solution: data.solution,
            options: data.options,
            correctOption: data.correctOption,
            imageUrl: data.imageUrl || null,
            ispublished: false
        });

        return Response.json(newProblem, { status: 201 });

    } catch (error) {
        console.error("Error creating problem:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
export async function GET(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User | undefined = session?.user;
    try {
      const { searchParams } = new URL(request.url);
      const query: any = {};
      const forContestCreation = searchParams.get('forContestCreation') === 'true';
      if (user?.role !== 'admin') {
            // Non-admins only see published problems, unless specifically for a published contest (handled by /api/contests/[id])
            query.ispublished = true;
        } else {
            // Admins can see all problems. No `ispublished` filter here.
        }
      // Add filters if needed
      const difficulty = searchParams.get('difficulty');
      const subject = searchParams.get('subject');
      const searchTerm = searchParams.get('search');
      
      if (difficulty) query.difficulty = parseInt(difficulty);
      if (subject) query.subject = subject;
  
      // Fetch problems with the required fields only
      if (searchTerm) {
        const searchRegex = new RegExp(searchTerm.trim(), 'i'); // Case-insensitive regex
        query.$or = [
            { title: { $regex: searchRegex } },
            { tags: { $regex: searchRegex } }
        ];
    }
      let selectFields: string;
      if (forContestCreation) {
            // For contest creation problem selection, only _id and title are needed
            selectFields = "_id title";
      } 
      else {
            // For general problems list, return common details (including ispublished for admins)
            selectFields = "_id title difficulty score tags subject ispublished";
      }
      const problems = await ProblemModel.find(query, selectFields)
        .sort({ createdAt: -1 }); // Newest first
  
      return Response.json(problems); // Return direct array
    } catch (error) {
      console.error("Error fetching problems:", error);
      return Response.json([], { status: 500 }); // Return empty array on error
    }
  }