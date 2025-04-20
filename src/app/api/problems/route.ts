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
        });

        return Response.json(newProblem, { status: 201 });

    } catch (error) {
        console.error("Error creating problem:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
export async function GET(request: Request) {
    await dbConnect();
  
    try {
      const { searchParams } = new URL(request.url);
      const query: any = {};
      
      // Add filters if needed
      const difficulty = searchParams.get('difficulty');
      const subject = searchParams.get('subject');
      
      if (difficulty) query.difficulty = parseInt(difficulty);
      if (subject) query.subject = subject;
  
      // Fetch problems with the required fields only
      const problems = await ProblemModel.find(query, "_id title difficulty score tags subject")
        .sort({ createdAt: -1 }); // Newest first
  
      return Response.json(problems); // Return direct array
    } catch (error) {
      console.error("Error fetching problems:", error);
      return Response.json([], { status: 500 }); // Return empty array on error
    }
  }