import dbConnect from "@/lib/dbConnect";
import UserModel from "@/backend/models/User.model";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    await dbConnect();

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    try {
        const leaderboard = await UserModel.find({}, { username: 1, avatar: 1, rating: 1, institute: 1 })
            .sort({ rating: -1 }) // Sort by rating (descending)
            .skip((page - 1) * limit)
            .limit(limit);

        return new Response(JSON.stringify({ leaderboard, page, limit }), { status: 200 });
    } catch (error) {
        console.error(error);
        return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }
}
