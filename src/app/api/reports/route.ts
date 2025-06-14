// /app/api/reports/route.ts (Corrected Version)

import dbConnect from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { User } from "next-auth";
import ReportModel from "@/backend/models/Report.model";

export async function POST(request: Request) {
    await dbConnect();
    const session = await getServerSession(authOptions);
    const user: User = session?.user;

    // A user must be logged in to submit a report
    if (!session || !user) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { type, description, reportedUserId } = await request.json();

        if (!type || !description) {
            return Response.json({ error: "Type and description are required." }, { status: 400 });
        }

        const newReport = new ReportModel({
            type,
            description,
            reportedUserId: reportedUserId || null,
            
            reporterId: user._id, 
            status: 'Open',
        });

        await newReport.save();

        return Response.json({ message: "Report submitted successfully." }, { status: 201 });

    } catch (error) {
        console.error("Error submitting report:", error);
        return Response.json({ error: "Internal Server Error" }, { status: 500 });
    }
}