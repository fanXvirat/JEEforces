import dbConnect from "@/lib/dbConnect";
import ProblemModel from "@/backend/models/Problem.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";



export async function GET(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    try {
        const problem = await ProblemModel.findById(params.id);
        if (!problem) return Response.json({ error: "Problem not found" }, { status: 404 });

        return Response.json(problem);
    } catch (error) {
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const data = await request.json();
        const updatedProblem = await ProblemModel.findByIdAndUpdate(params.id, { $set: data }, { new: true });

        if (!updatedProblem) return Response.json({ error: "Problem not found" }, { status: 404 });

        return Response.json(updatedProblem);
    } catch (error) {
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        return Response.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const deletedProblem = await ProblemModel.findByIdAndDelete(params.id);
        if (!deletedProblem) return Response.json({ error: "Problem not found" }, { status: 404 });

        return Response.json({ message: "Problem deleted successfully" });
    } catch (error) {
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
