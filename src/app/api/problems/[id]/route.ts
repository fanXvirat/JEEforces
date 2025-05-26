import dbConnect from "@/lib/dbConnect";
import ProblemModel from "@/backend/models/Problem.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { NextRequest } from "next/server";
import { User } from "next-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  const user: User | undefined = session?.user;

  try {
    // Properly access params after awaiting
    const problem = await ProblemModel.findById(params.id);
    
    if (!problem) {
      return new Response(
        JSON.stringify({ error: "Problem not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (user?.role !== 'admin' && !problem.ispublished) {
        return new Response(
            JSON.stringify({ error: "Problem not found or unauthorized access" }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(problem),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error fetching problem:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const data = await request.json();
    const updatedProblem = await ProblemModel.findByIdAndUpdate(
      params.id,
      { $set: data },
      { new: true }
    );

    if (!updatedProblem) {
      return new Response(
        JSON.stringify({ error: "Problem not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(updatedProblem),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error updating problem:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "admin") {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const deletedProblem = await ProblemModel.findByIdAndDelete(params.id);
    
    if (!deletedProblem) {
      return new Response(
        JSON.stringify({ error: "Problem not found" }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ message: "Problem deleted successfully" }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error("Error deleting problem:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}