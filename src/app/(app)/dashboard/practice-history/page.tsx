'use client';

import React from 'react'; // No longer need useState or useEffect
import Link from 'next/link';
import axios, { AxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query'; // Import the hook
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, BrainCircuit, Check, X } from 'lucide-react';

// Interface for the submission history items (unchanged)
interface SubmissionHistoryItem {
    _id: string;
    problem: {
        _id: string;
        title: string;
        difficulty: number;
        subject: string;
    };
    verdict: 'Correct' | 'Incorrect';
    submissionTime: string;
}

// Helper to format difficulty (unchanged)
const getDifficultyProps = (level: number): { text: string; className: string } => {
    switch (level) {
        case 1: return { text: 'Easy', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' };
        case 2: return { text: 'Medium', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' };
        case 3: return { text: 'Hard', className: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' };
        default: return { text: 'Unknown', className: 'bg-gray-100 text-gray-800' };
    }
};

export default function PracticeHistoryPage() {
    // --- REPLACED useState/useEffect with a single useQuery hook ---
    const { 
        data: history = [], // Provide a default empty array to prevent errors
        isLoading,
        isError,
        error
    } = useQuery<SubmissionHistoryItem[], AxiosError>({
        queryKey: ['practiceHistory'], // Unique key for this data
        queryFn: async () => {
            const response = await axios.get('/api/submissions/history');
            return response.data;
        },
        staleTime: 5 * 60 * 1000, // Optional: Cache results for 5 minutes
    });

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center min-h-[300px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            );
        }

        if (isError) {
            const errorMessage = error?.response?.data || error.message || "Could not load your practice history.";
            return <div className="text-center py-10 text-red-500">{String(errorMessage)}</div>;
        }

        if (history.length === 0) {
            return (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">No Practice History Found</h3>
                    <p className="text-muted-foreground mt-2">
                        You haven't completed any practice problems yet.
                    </p>
                    <Link href="/practice">
                        <Button className="mt-4">Start a Practice Session</Button>
                    </Link>
                </div>
            );
        }

        return (
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Problem Title</TableHead>
                            <TableHead className="w-[120px]">Subject</TableHead>
                            <TableHead className="w-[100px] text-center">Difficulty</TableHead>
                            <TableHead className="w-[120px] text-center">Verdict</TableHead>
                            <TableHead className="w-[180px] text-right">Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map((item) => {
                            const difficulty = getDifficultyProps(item.problem.difficulty);
                            const isCorrect = item.verdict === 'Correct';
                            return (
                                <TableRow key={item._id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/problems/${item.problem._id}`} className="hover:underline hover:text-primary">
                                            {item.problem.title}
                                        </Link>
                                    </TableCell>
                                    <TableCell>{item.problem.subject}</TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="outline" className={difficulty.className}>{difficulty.text}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={isCorrect ? 'default' : 'destructive'} className={`font-semibold ${isCorrect ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                                            {isCorrect ? <Check className="h-3 w-3 mr-1.5"/> : <X className="h-3 w-3 mr-1.5"/>}
                                            {item.verdict}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right text-muted-foreground text-xs">
                                        {new Date(item.submissionTime).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/dashboard">
                    <Button variant="outline" size="icon" aria-label="Back to Dashboard">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <BrainCircuit className="h-7 w-7 text-primary" />
                        Practice History
                    </h1>
                    <p className="text-muted-foreground">A log of all your practice submissions.</p>
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {renderContent()}
                </CardContent>
            </Card>
        </div>
    );
}