'use client';
import { useSession } from 'next-auth/react';
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import axios, { AxiosError } from 'axios';
import { Loader2, RefreshCcw, Trophy, PlusCircle, Users, BarChartHorizontal, LogIn, CheckCheck, CalendarClock, Eye, EyeOff } from 'lucide-react'; // Added Eye, EyeOff icons
import { toast } from 'sonner';
import {
    Card, 
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


type SessionUser = {
    _id?: string;
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
    role?: string;
};

interface Contest {
    _id: string;
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    ispublished: boolean;
    participants: Array<{ _id: string }>;
}

const getContestStatus = (startTimeStr: string, endTimeStr: string): { status: 'upcoming' | 'running' | 'ended'; variant: 'default' | 'secondary' | 'outline'; className: string; text: string } => {
    const now = new Date();
    const startTime = new Date(startTimeStr);
    const endTime = new Date(endTimeStr);

    if (now < startTime) {
        return { status: 'upcoming', variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-700', text: 'Upcoming' };
    } else if (now >= startTime && now < endTime) {
        return { status: 'running', variant: 'default', className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700', text: 'Running' };
    } else {
        return { status: 'ended', variant: 'outline', className: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600', text: 'Ended' };
    }
};

const ContestCardSkeleton = () => (
    <Card className="flex flex-col justify-between">
        <div>
            <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2 rounded" />
                <Skeleton className="h-4 w-1/2 mb-1 rounded" />
                <Skeleton className="h-4 w-1/2 rounded" />
            </CardHeader>
            <CardContent>
                 <div className="flex justify-between items-center mb-3">
                     <Skeleton className="h-5 w-20 rounded-full" />
                     <Skeleton className="h-4 w-16 rounded" />
                 </div>
                 <Skeleton className="h-4 w-full mb-1 rounded" />
                 <Skeleton className="h-4 w-5/6 rounded" />
            </CardContent>
        </div>
        <CardFooter>
            <Skeleton className="h-10 w-full rounded" />
        </CardFooter>
    </Card>
);

export default function ContestListPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [contests, setContests] = useState<Contest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRegistering, setIsRegistering] = useState<string | null>(null);
    const [isUpdatingRatings, setIsUpdatingRatings] = useState<string | null>(null);
    const [isTogglingPublish, setIsTogglingPublish] = useState<string | null>(null);
    const [isReleasingProblems, setIsReleasingProblems] = useState<string | null>(null); // RENAMED state

    const user = session?.user as SessionUser | undefined;

    const fetchContests = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const response = await axios.get<Contest[]>('/api/contests');
            setContests(response.data);
        } catch (error) {
            console.error("Fetch contests error:", error);
            const axiosError = error as AxiosError<{ message: string }>;
            toast.error(axiosError.response?.data?.message || 'Failed to fetch contests');
            setContests([]);
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (status === 'authenticated') {
            fetchContests();
        } else if (status === 'unauthenticated') {
            setIsLoading(false);
        }
    }, [status, fetchContests]);

    const handleRegister = async (contestId: string) => {
        if (!user?._id || isRegistering) return;
        setIsRegistering(contestId);
        try {
            const response = await axios.post(`/api/contests/${contestId}/register`);
            toast.success(response.data.message || 'Registered successfully!');
            setContests(prevContests =>
                prevContests.map(contest =>
                    contest._id === contestId
                        ? { ...contest, participants: [...contest.participants, { _id: user._id! }] }
                        : contest
                )
            );
        } catch (error) {
            console.error("Registration error:", error);
            const axiosError = error as AxiosError<{ error: string }>;
            toast.error(axiosError.response?.data?.error || 'Registration failed. Already registered or contest unavailable.');
        } finally {
            setIsRegistering(null);
        }
    };

    const handleUpdateRatings = async (contestId: string) => {
        if (!user?._id || user.role !== 'admin' || isUpdatingRatings) return;
        setIsUpdatingRatings(contestId);
        try {
            const res = await axios.post(`/api/contests/${contestId}/update-ratings`);
            toast.success(res.data.message || 'Ratings updated successfully');
        } catch (error) {
            console.error("Update ratings error:", error);
            const axiosError = error as AxiosError<{ error: string }>;
            toast.error(axiosError.response?.data?.error || 'Failed to update ratings');
        } finally {
            setIsUpdatingRatings(null);
        }
    };

    const handleTogglePublish = async (contestId: string, currentStatus: boolean) => {
        if (user?.role !== 'admin' || isTogglingPublish) return;

        setIsTogglingPublish(contestId);
        try {
            const response = await axios.patch(`/api/contests/${contestId}/toggle-publish`);
            const newStatus = response.data.ispublished;
            toast.success(response.data.message);

            setContests(prevContests =>
                prevContests.map(contest =>
                    contest._id === contestId
                        ? { ...contest, ispublished: newStatus }
                        : contest
                )
            );
        } catch (error) {
            console.error("Toggle publish error:", error);
            const axiosError = error as AxiosError<{ error: string }>;
            toast.error(axiosError.response?.data?.error || 'Failed to toggle contest publicity.');
        } finally {
            setIsTogglingPublish(null);
        }
    };

    // NEW: Handler for releasing problems after contest ends
    const handleReleaseProblems = async (contestId: string) => {
        if (!user?._id || user.role !== 'admin' || isReleasingProblems) return;

        setIsReleasingProblems(contestId);
        try {
            // Call the new API endpoint
            const response = await axios.patch(`/api/contests/${contestId}/release-problems`);
            toast.success(response.data.message);
            // Optionally, re-fetch contests if their state needs to reflect
            // that problems have been released (e.g., if Contest model tracked this)
            // Or just rely on toast and the fact that problem list will now show them.
            // fetchContests(false); // Can trigger a soft refresh if needed
        } catch (error) {
            console.error("Release problems error:", error);
            const axiosError = error as AxiosError<{ error: string }>;
            toast.error(axiosError.response?.data?.error || 'Failed to release problems.');
        } finally {
            setIsReleasingProblems(null);
        }
    };


    const renderContestButton = (contest: Contest) => {
        if (!user?._id) return null;

        const { status } = getContestStatus(contest.startTime, contest.endTime);
        const userIdString = user._id.toString();
        const isRegistered = contest.participants.some(p => p._id.toString() === userIdString);
        const isRegistrationLoading = isRegistering === contest._id;

        switch (status) {
            case 'upcoming':
                return isRegistered ? (
                    <Button className="w-full" disabled variant="outline">
                        <CheckCheck className="mr-2 h-4 w-4" /> Registered
                    </Button>
                ) : (
                    <Button
                        className="w-full"
                        onClick={() => handleRegister(contest._id)}
                        disabled={isRegistrationLoading}
                    >
                        {isRegistrationLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CalendarClock className="mr-2 h-4 w-4" />}
                        Register Now
                    </Button>
                );
            case 'running':
                if (isRegistered) {
                    return (
                        <Button className="w-full" onClick={() => router.push(`/contests/${contest._id}`)}>
                            <LogIn className="mr-2 h-4 w-4" /> Enter Contest
                        </Button>
                    );
                } else {
                    return (
                        <Button className="w-full" disabled variant="secondary">
                            Registration Closed
                        </Button>
                    );
                }
            case 'ended':
                return (
                    <Button
                        className="w-full"
                        variant="secondary"
                        onClick={() => router.push(`/contests/${contest._id}/standings`)}
                    >
                        <BarChartHorizontal className="mr-2 h-4 w-4" /> View Results
                    </Button>
                );
            default:
                return null;
        }
    };

    if (status === 'loading' || (status === 'authenticated' && isLoading)) {
        return (
            <div className="container mx-auto px-4 py-8 md:py-12">
                 <div className="flex justify-between items-center mb-8">
                    <Skeleton className="h-10 w-64 rounded" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                 </div>
                 {session?.user?.role === 'admin' && <Skeleton className="h-10 w-40 mb-8 rounded" />}
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => <ContestCardSkeleton key={i} />)}
                </div>
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <div className="container mx-auto px-4 py-8 md:py-12 text-center mt-10">
                <p className="text-lg mb-4">Please <Link href="/sign-in" className="text-primary font-semibold hover:underline">Sign In</Link> to view and participate in contests.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
                    <Trophy className="h-8 w-8 text-primary" />
                    Contests
                </h1>
                <div className="flex items-center gap-2">
                    {user?.role === 'admin' && (
                        <Link href="/contests/create">
                            <Button variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Contest
                            </Button>
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => fetchContests(true)}
                        disabled={isLoading}
                        title="Refresh Contests"
                    >
                        <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {contests.length === 0 && !isLoading ? (
                <div className="text-center py-16 text-muted-foreground">
                    <Trophy className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg">No contests available at the moment.</p>
                    {user?.role === 'admin' && <p className="mt-2">You can create a new one!</p>}
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {contests.map((contest) => {
                        const { status, variant, className: badgeClassName, text: statusText } = getContestStatus(contest.startTime, contest.endTime);
                        const isEnded = status === 'ended';
                        const toggleLoading = isTogglingPublish === contest._id;
                        const releaseProblemsLoading = isReleasingProblems === contest._id; // NEW loading state variable

                        return (
                            <Card key={contest._id} className="hover:shadow-md transition-shadow duration-200 flex flex-col justify-between border">
                                <div>
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start gap-2 mb-1">
                                            <CardTitle className="text-lg leading-tight">{contest.title}</CardTitle>
                                            <Badge variant={variant} className={cn("text-xs whitespace-nowrap mt-0.5", badgeClassName)}>
                                                {statusText}
                                            </Badge>
                                        </div>
                                        <CardDescription className="text-xs">
                                            {new Date(contest.startTime).toLocaleDateString()} {new Date(contest.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            {' - '}
                                            {new Date(contest.endTime).toLocaleDateString()} {new Date(contest.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0 pb-4">
                                        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{contest.description || "No description provided."}</p>
                                          {user?.role === 'admin' && (
                                              <div className="text-xs text-muted-foreground flex items-center justify-between gap-1 mt-2">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    <span>{contest.participants.length} registered</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Label htmlFor={`publish-toggle-${contest._id}`} className="flex items-center text-xs gap-1 cursor-pointer">
                                                        {contest.ispublished ? <Eye className="h-3 w-3 text-green-600" /> : <EyeOff className="h-3 w-3 text-red-600" />}
                                                        <span>{contest.ispublished ? 'Published' : 'Draft'}</span>
                                                    </Label>
                                                    <Switch
                                                        id={`publish-toggle-${contest._id}`}
                                                        checked={contest.ispublished}
                                                        onCheckedChange={() => handleTogglePublish(contest._id, contest.ispublished)}
                                                        disabled={toggleLoading}
                                                        aria-label={`Toggle publication for ${contest.title}`}
                                                    />
                                                </div>
                                              </div>
                                          )}
                                    </CardContent>
                                </div>

                                <CardFooter className="flex flex-col gap-2 pt-4 border-t">
                                     {renderContestButton(contest)}

                                    {user?.role === 'admin' && isEnded && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-xs text-muted-foreground"
                                                onClick={() => handleUpdateRatings(contest._id)}
                                                disabled={isUpdatingRatings === contest._id}
                                            >
                                                {isUpdatingRatings === contest._id && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                                                Update Ratings
                                            </Button>
                                            {/* NEW: Release Problems Globally Button */}
                                            <Button
                                                variant="secondary" // Use a distinct variant
                                                size="sm"
                                                className="w-full text-xs"
                                                onClick={() => handleReleaseProblems(contest._id)} // Call the new handler
                                                disabled={releaseProblemsLoading} // Use the new loading state
                                            >
                                                {releaseProblemsLoading && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
                                                Release Problems Globally
                                            </Button>
                                            {/* END NEW */}
                                        </>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}