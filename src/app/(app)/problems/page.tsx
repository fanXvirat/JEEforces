'use client';
import { useSession } from 'next-auth/react';
import React, { useState, useEffect, useCallback } from 'react'; // Added React and useCallback
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, PlusCircle, ListChecks, Filter, Search } from 'lucide-react'; // Added icons
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'; // Shadcn Select
import { Input } from '@/components/ui/input'; // Shadcn Input
import { Label } from '@/components/ui/label'; // Shadcn Label
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'; // Shadcn Card
import { Skeleton } from '@/components/ui/skeleton'; // Shadcn Skeleton
import { cn } from '@/lib/utils'; // Import cn
import { toast } from 'sonner'; // For potential error feedback

interface Problem {
    _id: string;
    title: string;
    difficulty: number; // Assuming 1: Easy, 2: Medium, 3: Hard
    score: number;
    tags: string[];
    subject: string;
}

// Optional: Debounce function (if you want to add it later)
// function debounce(func, wait) { ... implementation ... }

export default function ProblemsPage() {
    const { data: session } = useSession();
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        difficulty: '',
        subject: '',
        search: '',
    });

    // Fetching logic remains the same, added useCallback for stability if needed elsewhere
    const fetchProblems = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.difficulty) params.append('difficulty', filters.difficulty);
            if (filters.subject) params.append('subject', filters.subject);
            if (filters.search) params.append('search', filters.search.trim()); // Trim search term

            const response = await fetch(`/api/problems?${params.toString()}`);
             if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Ensure data is always an array (or handle potential API error structure)
            setProblems(Array.isArray(data) ? data : []);

        } catch (error) {
            console.error('Error fetching problems:', error);
            toast.error("Failed to fetch problems. Please try again.");
            setProblems([]); // Reset problems on error
        } finally {
            setLoading(false);
        }
    }, [filters]); // Dependency array includes filters

    useEffect(() => {
        // Consider debouncing the fetch call if filters.search changes frequently
        // For now, fetching immediately on any filter change as per original logic
        fetchProblems();
    }, [fetchProblems]); // fetchProblems is memoized by useCallback

    // Handlers for Shadcn Select components
    const handleDifficultyChange = (value: string) => {
        setFilters(prev => ({ ...prev, difficulty: value === 'all' ? '' : value }));
    };

    const handleSubjectChange = (value: string) => {
        setFilters(prev => ({ ...prev, subject: value === 'all' ? '' : value }));
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: event.target.value }));
        // If implementing debounce, you'd trigger the debounced fetch here
    };

    // Map difficulty number to text and color
    const getDifficultyProps = (level: number): { text: string; className: string } => {
        switch (level) {
            case 1: return { text: 'Easy', className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700' };
            case 2: return { text: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-700' };
            case 3: return { text: 'Hard', className: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700' };
            default: return { text: 'Unknown', className: 'bg-gray-100 text-gray-800 border-gray-300' };
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
                    <ListChecks className="h-8 w-8 text-primary" />
                    JEE Problems
                </h1>
                {session?.user?.role === 'admin' && (
                    <Link href="/problems/create">
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Problem
                        </Button>
                    </Link>
                )}
            </div>

            {/* Filters Card */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter Problems
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Difficulty Select */}
                        <div className="space-y-1.5">
                            <Label htmlFor="difficulty">Difficulty</Label>
                            <Select value={filters.difficulty} onValueChange={handleDifficultyChange}>
                                <SelectTrigger id="difficulty">
                                    <SelectValue placeholder="All Difficulties" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Difficulties</SelectItem>
                                    <SelectItem value="1">Easy</SelectItem>
                                    <SelectItem value="2">Medium</SelectItem>
                                    <SelectItem value="3">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Subject Select */}
                        <div className="space-y-1.5">
                             <Label htmlFor="subject">Subject</Label>
                            <Select value={filters.subject} onValueChange={handleSubjectChange}>
                                <SelectTrigger id="subject">
                                    <SelectValue placeholder="All Subjects" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Subjects</SelectItem>
                                    <SelectItem value="Physics">Physics</SelectItem>
                                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                                    {/* Add more subjects if needed */}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search Input */}
                        <div className="space-y-1.5">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    type="search" // Use type="search" for potential browser features
                                    placeholder="Search by title or tags..."
                                    className="pl-8" // Add padding for icon
                                    value={filters.search}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Problems Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Problem</TableHead>
                            <TableHead className="w-[120px]">Subject</TableHead>
                            <TableHead className="w-[100px] text-center">Difficulty</TableHead>
                            <TableHead className="w-[80px] text-center">Score</TableHead>
                            <TableHead className="hidden md:table-cell">Tags</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            // Skeleton Loading State
                            Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={`skel-${i}`}>
                                    <TableCell>
                                        <Skeleton className="h-5 w-3/4 rounded" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-5 w-20 rounded" />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Skeleton className="h-6 w-16 mx-auto rounded-full" />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Skeleton className="h-5 w-8 mx-auto rounded" />
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                         <div className="flex flex-wrap gap-1">
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                            <Skeleton className="h-5 w-20 rounded-full" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : problems.length === 0 ? (
                            // Empty State
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No problems found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            // Data Rows
                            problems.map(problem => {
                                const difficultyProps = getDifficultyProps(problem.difficulty);
                                return (
                                    <TableRow key={problem._id} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            <Link
                                                href={`/problems/${problem._id}`}
                                                className="hover:text-primary transition-colors"
                                            >
                                                {problem.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{problem.subject}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant="outline" // Use outline and add specific bg/text/border colors
                                                className={cn("border font-semibold", difficultyProps.className)}
                                            >
                                                {difficultyProps.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-sm font-medium">{problem.score}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {problem.tags?.slice(0, 3).map(tag => ( // Limit visible tags initially if needed
                                                    <Badge variant="secondary" key={tag} className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                                {/* Optionally add a "+X more" indicator if tags are truncated */}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
            {/* Optional: Add Pagination controls here if your API supports it and you have many problems */}
        </div>
    );
}