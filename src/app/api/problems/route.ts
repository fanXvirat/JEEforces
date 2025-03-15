import dbConnect from "@/lib/dbConnect";
import ProblemModel from "@/backend/models/Problem.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

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
