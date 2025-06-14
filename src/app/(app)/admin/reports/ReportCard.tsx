'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
// Import useEffect to fix the hydration error
import { useState, useEffect } from "react";
import { Loader2, Trash2, User, AlertCircle } from "lucide-react";

// Define the shape of the report prop for TypeScript
interface Report {
    _id: string;
    type: string;
    description: string;
    status: string;
    createdAt: string;
    reportedUserId?: {
        _id: string;
        username: string;
        email: string;
        role: string;
    };
    reporterId: {
        _id: string;
        username: string;
        email: string;
    };
}

export default function ReportCard({ report }: { report: Report }) {
    const [isDeleting, setIsDeleting] = useState(false);
    
    // THE FIX:
    // 1. Create a state to hold the client-side formatted date.
    const [formattedDate, setFormattedDate] = useState<string>('');

    // 2. Use the useEffect hook to format the date only on the client.
    // This runs after hydration, preventing the server-client mismatch.
    useEffect(() => {
        setFormattedDate(new Date(report.createdAt).toLocaleString());
    }, [report.createdAt]); // Dependency array ensures this runs if the report prop changes.


    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm("Are you sure you want to permanently delete this user? This action cannot be undone.")) {
            return;
        }
        setIsDeleting(true);
        try {
            // Use your existing API endpoint
            const response = await fetch(`/api/admin/${userId}`, {
                method: 'DELETE',
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || "User deleted successfully!");
                // Optionally, you could also make an API call here to mark the report as "Closed"
            } else {
                toast.error(data.error || "Failed to delete user.");
            }
        } catch (error) {
            toast.error("An error occurred while deleting the user.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Card className={report.status === 'Open' ? 'border-yellow-400' : 'border-gray-200'}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {report.type === 'Report' ? <AlertCircle className="text-red-500" /> : <User />}
                            {report.type}
                        </CardTitle>
                        <CardDescription>
                            {/* THE FIX:
                                3. Render the stateful date. It will be empty on the server 
                                   and populate on the client, avoiding the mismatch.
                            */}
                            Received on: {formattedDate || '...'}
                        </CardDescription>
                    </div>
                    <Badge variant={report.status === 'Open' ? 'destructive' : 'secondary'}>
                        {report.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-md border">
                    <p className="text-sm text-gray-800">{report.description}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                        <h4 className="font-semibold">Reporter Details</h4>
                        <p>Username: {report.reporterId.username}</p>
                        <p>Email: {report.reporterId.email}</p>
                    </div>
                    {report.reportedUserId && (
                        <div>
                            <h4 className="font-semibold text-red-600">Reported User Details</h4>
                            <p>Username: {report.reportedUserId.username}</p>
                            <p>Email: {report.reportedUserId.email}</p>
                        </div>
                    )}
                </div>
            </CardContent>
            {report.reportedUserId && report.reportedUserId.role !== 'admin' && (
                <CardFooter className="flex justify-end bg-gray-50/50 p-4">
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteUser(report.reportedUserId!._id)}
                        disabled={isDeleting}
                    >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                        Delete Reported User
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}