import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import { getServerSession } from "next-auth";
import { User } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";

export async function GET() {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const loggedInUser: User = session?.user; // Rename to avoid conflicts

    if (!session || !loggedInUser?.role || loggedInUser.role !== "admin") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    try {
        const users = await UserModel.find({}, "-password"); // Exclude passwords
        return Response.json(users, { status: 200 });
    } catch (error) {
        console.error("Error fetching users:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
