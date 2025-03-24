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
    const user: User = session?.user;

    if (!session || !user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const url = new URL(request.url);
        const problemId = url.searchParams.get("id");

        if (problemId) {
            // Fetch a specific problem by ID
            const problem = await ProblemModel.aggregate([
                { $match: { _id: new mongoose.Types.ObjectId(problemId) } },
                {
                    $lookup: {
                        from: "users",
                        localField: "author",
                        foreignField: "_id",
                        as: "author",
                    },
                },
                {
                    $addFields: {
                        author: { $arrayElemAt: ["$author", 0] }, // Extract author object
                    },
                },
                {
                    $project: {
                        "author.password": 0, // Exclude sensitive user data
                    },
                },
            ]);

            if (!problem || problem.length === 0) {
                return Response.json({ error: "Problem not found" }, { status: 404 });
            }

            return Response.json(problem[0]);
        } else {
            // Fetch all problems
            const problems = await ProblemModel.find({}, "_id title difficulty score tags subject");
            return Response.json(problems);
        }
    } catch (error) {
        console.error("Error fetching problems:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
