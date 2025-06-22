import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/options";
import { User } from "next-auth";

export async function POST(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User | undefined = session?.user;

    if (!user) {
        return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    try {
        const { streak } = await request.json();

        if (typeof streak !== 'number' || streak < 0) {
            return Response.json({ success: false, message: "Invalid streak value" }, { status: 400 });
        }

        const currentUser = await UserModel.findById(user._id);
        if (!currentUser) {
            return Response.json({ success: false, message: "User not found" }, { status: 404 });
        }

        // Update maxStreak only if the new streak is greater
        if (streak > currentUser.maxStreak) {
            currentUser.maxStreak = streak;
            await currentUser.save();
            return Response.json({ success: true, message: "Max streak updated successfully.", newMaxStreak: streak });
        }

        return Response.json({ success: true, message: "Streak was not higher than the current max.", newMaxStreak: currentUser.maxStreak });

    } catch (error) {
        console.error("Error updating max streak:", error);
        return Response.json({ success: false, message: "Internal Server Error" }, { status: 500 });
    }
}