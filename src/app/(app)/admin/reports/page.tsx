// /app/admin/reports/page.tsx (Corrected Version)

import dbConnect from "@/lib/dbConnect";
import ReportModel from "@/backend/models/Report.model";
import UserModel from "@/backend/models/User.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { redirect } from "next/navigation";
import ReportCard from "./ReportCard";


type PopulatedUser = {
    _id: string;
    username: string;
    email: string;
    role: string; // Role is always a string
};

// This is the main type for a single report object.
type ReportWithPopulatedUsers = {
    _id: string;
    type: 'Feedback' | 'Report';
    description: string;
    status: 'Open' | 'Closed';
    createdAt: string; // Dates become strings after JSON serialization
    reporterId: PopulatedUser;
    reportedUserId?: PopulatedUser; // The reported user is optional
};
// ====================================================================

async function getReports() {
    await dbConnect();
    // Fetch reports and populate user details for both reporter and reported user
    const reports = await ReportModel.find({})
      .sort({ createdAt: -1 })
      .populate('reporterId', 'username email')
      .populate('reportedUserId', 'username email role')
      .lean(); // Use .lean() for better performance with plain JS objects
    
    return JSON.parse(JSON.stringify(reports)); // Serialize for client component props
}

export default async function AdminReportsPage() {
    const session = await getServerSession(authOptions);

    if (session?.user.role !== 'admin') {
        redirect('/signin');
    }

    // ====================================================================
    // SOLUTION: Apply the type to the 'reports' variable.
    // Now, TypeScript knows the exact shape of each object in the array.
    // ====================================================================
    const reports: ReportWithPopulatedUsers[] = await getReports();

    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8">User Reports and Feedback</h1>
            <div className="space-y-6">
                {reports.length > 0 ? (
                    // The error is now gone because TypeScript knows 'report' is of type ReportWithPopulatedUsers
                    reports.map((report) => (
                        <ReportCard key={report._id} report={report} />
                    ))
                ) : (
                    <p>No reports found.</p>
                )}
            </div>
        </div>
    );
}