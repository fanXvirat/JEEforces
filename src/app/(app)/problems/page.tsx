'use client';

import { useSession } from 'next-auth/react';
import React, { useState, useEffect, useCallback } from 'react';
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
import {
    Loader2,
    PlusCircle,
    ListChecks,
    Filter,
    Search,
    Sparkles,
    BrainCircuit, // New icon for the Revise Portal
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Problem {
    _id: string;
    title: string;
    difficulty: number;
    score: number;
    tags: string[];
    subject: string;
}

export default function ProblemsPage() {
    const { data: session } = useSession();
    const [problems, setProblems] = useState<Problem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        difficulty: '',
        subject: '',
        search: '',
    });

    const fetchProblems = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.difficulty) params.append('difficulty', filters.difficulty);
            if (filters.subject) params.append('subject', filters.subject);
            if (filters.search) params.append('search', filters.search.trim());

            const response = await fetch(`/api/problems?${params.toString()}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setProblems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching problems:', error);
            toast.error("Failed to fetch problems. Please try again.");
            setProblems([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchProblems();
    }, [fetchProblems]);

    const handleDifficultyChange = (value: string) => {
        setFilters(prev => ({ ...prev, difficulty: value === 'all' ? '' : value }));
    };

    const handleSubjectChange = (value: string) => {
        setFilters(prev => ({ ...prev, subject: value === 'all' ? '' : value }));
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: event.target.value }));
    };

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

            {/* Grid for Practice and Revise Portals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Practice Dimension Card */}
                <Card className="bg-gradient-to-br from-primary/80 via-primary to-secondary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <Sparkles className="h-6 w-6" />
                            Problem Practice Dimension
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-primary-foreground/90">
                            Enter a continuous solving streak. Solve a random problem, then pick your next challenge from three choices.
                        </p>
                        <Link href="/practice">
                            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                                Start Practice Session
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Revise Portal Card */}
                <Card className="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-primary-foreground shadow-lg hover:shadow-xl transition-shadow">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3">
                            <BrainCircuit className="h-6 w-6" />
                            AI-Powered Revision Portal
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="mb-4 text-primary-foreground/90">
                            Input a topic and our AI will generate an infinite feed of memes, flashcards, and quizzes to make revision fun and effective.
                        </p>
                        <Link href="/revise">
                            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                                Start Revising
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filter Problems
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    type="search"
                                    placeholder="Search by title or tags..."
                                    className="pl-8"
                                    value={filters.search}
                                    onChange={handleSearchChange}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                            Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={`skel-${i}`}>
                                    <TableCell><Skeleton className="h-5 w-3/4 rounded" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-20 rounded" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-5 w-8 mx-auto rounded" /></TableCell>
                                    <TableCell className="hidden md:table-cell">
                                         <div className="flex flex-wrap gap-1">
                                            <Skeleton className="h-5 w-16 rounded-full" />
                                            <Skeleton className="h-5 w-20 rounded-full" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : problems.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No problems found matching your criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            problems.map(problem => {
                                const difficultyProps = getDifficultyProps(problem.difficulty);
                                return (
                                    <TableRow key={problem._id} className="hover:bg-muted/50">
                                        <TableCell className="font-medium">
                                            <Link href={`/problems/${problem._id}`} className="hover:text-primary transition-colors">
                                                {problem.title}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">{problem.subject}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className={cn("border font-semibold", difficultyProps.className)}>
                                                {difficultyProps.text}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center text-sm font-medium">{problem.score}</TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <div className="flex flex-wrap gap-1">
                                                {problem.tags?.slice(0, 3).map(tag => (
                                                    <Badge variant="secondary" key={tag} className="text-xs">{tag}</Badge>
                                                ))}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}