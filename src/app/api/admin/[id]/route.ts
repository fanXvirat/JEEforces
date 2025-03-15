import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import { getServerSession } from "next-auth";
import { User } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const loggedInUser: User = session?.user;  // Rename to avoid conflict

    if (!session || !loggedInUser.role || loggedInUser.role !== "admin") {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const deletedUser = await UserModel.findByIdAndDelete(params.id); // Use a different variable name
        if (!deletedUser) {
            return Response.json({ error: "User not found" }, { status: 404 });
        }

        return Response.json({ message: "User deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting user:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
