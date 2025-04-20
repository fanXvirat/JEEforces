'use client';
// Keeping all your original data fetching logic and state management intact.
import { useEffect, useState } from 'react';
import axios from 'axios';
import { UserType } from '@/types/User'; // Assuming UserType includes all necessary fields
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription, // Added for context
    CardContent
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RatingChart } from '@/components/rating-chart'; // Assuming this component exists and works
import Link from 'next/link';
import { Loader2, Building, CalendarDays, BarChart3, CheckSquare, History, Trophy, ArrowRight, Home, UserX } from 'lucide-react'; // Added icons
import { Separator } from '@/components/ui/separator'; // Keep if needed
import { getTitleColor, cn } from '@/lib/utils'; // Added cn
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Use Shadcn Avatar
import { Badge } from '@/components/ui/badge'; // Added Badge
import { Button } from '@/components/ui/button'; // For linking back home
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // For potential tooltips
import { format } from 'date-fns'; // For contest list dates
import { use } from 'react'; // Keeping your usage of 'use' hook

interface PublicStats {
    ratingHistory: Array<{
        newrating: number;
        timestamp: string;
        contestTitle: string;
    }>;
    contestsJoined: Array<{
        _id: string;
        title: string;
        startTime: string;
    }>;
}

// Helper function for initials (if not globally available)
const getInitials = (name: string = '') => {
    return name
        ?.split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';
};

// --- Skeleton Components (for loading state) ---
const ProfileHeaderSkeleton = () => (
     <Card className="md:col-span-1">
         <CardHeader className="flex flex-col items-center text-center pt-6 pb-4">
             <Skeleton className="h-20 w-20 rounded-full mb-3" />
             <Skeleton className="h-7 w-48 rounded mb-1" /> {/* Username */}
             <Skeleton className="h-4 w-32 rounded" /> {/* Title */}
         </CardHeader>
         <CardContent className="space-y-2 text-sm pt-0 pb-6">
             <Separator className="mb-4"/>
             <div className="flex items-center justify-center gap-2">
                 <Skeleton className="h-4 w-4 rounded" />
                 <Skeleton className="h-4 w-40 rounded" />
             </div>
             <div className="flex items-center justify-center gap-2">
                 <Skeleton className="h-4 w-4 rounded" />
                 <Skeleton className="h-4 w-32 rounded" />
             </div>
         </CardContent>
     </Card>
);

const StatsCardSkeleton = () => (
    <Card className="md:col-span-2">
        <CardHeader>
             <Skeleton className="h-6 w-32 rounded mb-1" /> {/* Title */}
             <Skeleton className="h-4 w-48 rounded" /> {/* Description */}
         </CardHeader>
         <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded"/>
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-6 w-12 rounded" />
                </div>
            </div>
             <div className="flex items-center gap-3 p-4 border rounded-lg">
                <Skeleton className="h-8 w-8 rounded"/>
                <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-6 w-10 rounded" />
                </div>
            </div>
            <div className="sm:col-span-2 mt-2">
                <Skeleton className="h-4 w-24 mb-2 rounded" />
                 <Skeleton className="h-2 w-full rounded" />
                 <Skeleton className="h-3 w-48 mt-1 rounded" />
            </div>
         </CardContent>
    </Card>
);

const ChartCardSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-6 w-40 rounded mb-1" /> {/* Title */}
            <Skeleton className="h-4 w-64 rounded" /> {/* Description */}
        </CardHeader>
        <CardContent>
            <Skeleton className="h-64 w-full rounded-md" /> {/* Chart Area */}
        </CardContent>
    </Card>
);

const ListCardSkeleton = () => (
     <Card>
        <CardHeader>
            <Skeleton className="h-6 w-48 rounded mb-1" /> {/* Title */}
            <Skeleton className="h-4 w-56 rounded" /> {/* Description */}
        </CardHeader>
        <CardContent className="space-y-3">
            {[...Array(3)].map((_, i) => (
                 <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-md border">
                     <div className="space-y-1">
                         <Skeleton className="h-4 w-40 rounded" />
                         <Skeleton className="h-3 w-24 rounded" />
                     </div>
                     <Skeleton className="h-4 w-4 rounded" />
                 </div>
            ))}
        </CardContent>
    </Card>
);


// --- Main Component ---
export default function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
    // --- Keeping your original data fetching and state logic ---
    const { username } = use(params);
    const [user, setUser] = useState<UserType | null>(null);
    const [stats, setStats] = useState<PublicStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // Reset states only if needed, or rely on initial state
            // setUser(null);
            // setStats(null);
            setLoading(true); // Ensure loading is true at the start of fetch
            try {
                const [userRes, statsRes] = await Promise.all([
                    // Using your original API endpoints
                    axios.get(`/api/users/${username}`),
                    axios.get(`/api/users/${username}/stats`)
                ]);

                // Using your original way of setting state from response data
                setUser(userRes.data);
                setStats(statsRes.data);
            } catch (error) {
                console.error('Failed to load profile:', error);
                setUser(null); // Set user to null on error as per your logic
                setStats(null);
            } finally {
                setLoading(false);
            }
        };

        // Adding a check for username existence before fetching
        if (username) {
             fetchData();
        } else {
            // Handle case where username might not be ready immediately (if possible)
            setLoading(false);
            setUser(null);
        }
    }, [username]);
    // --- End of original data fetching logic ---

    // --- Loading State ---
    if (loading) {
         // Using the improved skeleton loading UI
         return (
             <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl animate-pulse">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
                     <ProfileHeaderSkeleton />
                     <StatsCardSkeleton />
                </div>
                 <div className="space-y-6 md:space-y-8">
                     <ChartCardSkeleton />
                     <ListCardSkeleton />
                 </div>
             </div>
         );
    }

    // --- Not Found State ---
    if (!user) {
        // Using the improved "Not Found" UI
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <UserX className="mx-auto h-16 w-16 text-destructive mb-6" />
                <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
                <p className="text-muted-foreground mb-8">The user profile for "{username}" could not be found.</p>
                <Link href="/">
                    <Button variant="outline">
                        <Home className="mr-2 h-4 w-4" />
                        Return to Homepage
                    </Button>
                </Link>
            </div>
        );
    }

    // --- Profile Found State (UI Redesign Applied) ---
    return (
        <TooltipProvider delayDuration={100}>
            {/* Removed the outer bg-white and rounded, relying on card styles */}
            <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
                {/* Grid for Profile Info + Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
                    {/* Profile Info Card */}
                    <Card className="md:col-span-1">
                        <CardHeader className="flex flex-col items-center text-center pt-6 pb-4">
                             <Avatar className="h-20 w-20 mb-3 border-2 border-primary/50">
                                <AvatarImage src={user.avatar} alt={user.username} />
                                {/* Using your getInitials logic (assumed available) */}
                                <AvatarFallback className="text-2xl bg-muted">{getInitials(user.username)}</AvatarFallback>
                            </Avatar>
                            <h1
                                className="text-2xl font-bold tracking-tight"
                                // Using your getTitleColor logic
                                style={{ color: getTitleColor(user.title || 'newbie') }}
                            >
                                {user.username}
                            </h1>
                            <p className="text-sm font-medium capitalize" style={{ color: getTitleColor(user.title || 'newbie') }}>
                                {user.title || 'Newbie'}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm pt-0 pb-6">
                             <Separator className="mb-4"/>
                             <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <Building className="h-4 w-4" />
                                <span>{user.institute || <span className="italic">Institute not provided</span>}</span>
                            </div>
                             <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                <CalendarDays className="h-4 w-4" />
                                <span>Year: {user.yearofstudy || <span className="italic">N/A</span>}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistics Card */}
                     <Card className="md:col-span-2">
                         <CardHeader>
                            <CardTitle className="text-lg">Statistics</CardTitle>
                             <CardDescription>User performance overview.</CardDescription>
                         </CardHeader>
                         <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                            {/* Rating */}
                            <div className="flex items-center gap-3 p-4 border rounded-lg">
                                <BarChart3 className="h-8 w-8 text-blue-500 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Current Rating</p>
                                    {/* Displaying user.rating from your state */}
                                    <p className="text-2xl font-bold">{user.rating ?? 'N/A'}</p>
                                </div>
                            </div>
                            {/* Problems Solved */}
                             <div className="flex items-center gap-3 p-4 border rounded-lg">
                                <CheckSquare className="h-8 w-8 text-green-500 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Problems Solved</p>
                                    {/* Displaying user.problemsSolved from your state */}
                                    <p className="text-2xl font-bold">{user.problemsSolved || 0}</p>
                                </div>
                            </div>
                            {/* Accuracy */}
                            <div className="sm:col-span-2 mt-2">
                                 <p className="text-sm font-medium text-muted-foreground mb-1">Overall Accuracy*</p>
                                 {/* Keeping your original hardcoded Progress bar */}
                                <Progress value={75} className="h-2" aria-label="Overall user accuracy"/>
                                <p className="text-xs text-muted-foreground mt-1 italic">*Note: Accuracy data may be indicative.</p>
                            </div>
                         </CardContent>
                     </Card>
                </div>

                {/* Rating History Card */}
                 <Card className="mb-6 md:mb-8">
                     <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                            <History className="h-5 w-5 text-primary" />
                            Rating History
                         </CardTitle>
                         <CardDescription>Rating changes based on contest performance.</CardDescription>
                    </CardHeader>
                     <CardContent>
                         {/* Using stats.ratingHistory from your state */}
                         {stats?.ratingHistory?.length ? (
                            <div className="h-64 md:h-80">
                                {/* Passing your stats.ratingHistory to the chart */}
                                <RatingChart data={stats.ratingHistory} />
                             </div>
                         ) : (
                             <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                                <p>No rating history available for this user.</p>
                            </div>
                         )}
                    </CardContent>
                 </Card>

                {/* Contests Participated Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                             Contests Participated
                        </CardTitle>
                         <CardDescription>List of contests this user joined.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Using stats.contestsJoined from your state */}
                         {stats?.contestsJoined?.length ? (
                            <div className="space-y-2">
                                {stats.contestsJoined.map(contest => (
                                    <Link
                                        key={contest._id}
                                        href={`/contests/${contest._id}`}
                                        // Using the improved list item styling
                                        className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors duration-150 group border"
                                    >
                                         <div>
                                            <div className="text-sm font-medium text-primary group-hover:underline underline-offset-2">
                                                {contest.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                 {/* Using date-fns for formatting */}
                                                 {format(new Date(contest.startTime), 'MMM dd, yyyy')}
                                            </div>
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                                    </Link>
                                ))}
                             </div>
                         ) : (
                            // Using the improved empty state message
                             <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                                <p>This user hasn't participated in any contests yet.</p>
                             </div>
                         )}
                    </CardContent>
                </Card>

                 {/* Removed the final Separator, using card margins instead */}
                 {/* <Separator className="my-8" /> */}
            </div>
        </TooltipProvider>
    );
}