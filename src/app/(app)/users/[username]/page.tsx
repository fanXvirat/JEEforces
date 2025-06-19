'use client';
import { Flag, BrainCircuit } from 'lucide-react'; // Added BrainCircuit for the new component
import { useEffect, useState } from 'react';
import axios from 'axios';
import { UserType } from '@/types/User';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RatingChart } from '@/components/rating-chart';
import Link from 'next/link';
import { Loader2, Building, CalendarDays, BarChart3, CheckSquare, History, Trophy, ArrowRight, Home, UserX } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getTitleColor } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format } from 'date-fns';
import { use } from 'react';

// --- NEW COMPONENT FOR DIFFICULTY BREAKDOWN ---
const ProblemBreakdownCard = ({ counts }: { counts?: { easy: number; medium: number; hard: number } }) => {
    // If there's no data or total is zero, don't render the card.
    if (!counts || (counts.easy === 0 && counts.medium === 0 && counts.hard === 0)) {
        return null; 
    }

    const total = counts.easy + counts.medium + counts.hard;
    const easyPercent = (counts.easy / total) * 100;
    const mediumPercent = (counts.medium / total) * 100;
    const hardPercent = (counts.hard / total) * 100;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BrainCircuit className="h-5 w-5 text-purple-500" />
                    Problem Solving Breakdown
                </CardTitle>
                <CardDescription>Distribution of solved problems by difficulty.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
                <div className="space-y-2">
                    <div className="flex w-full h-3 rounded-full overflow-hidden bg-muted">
                        <div className="bg-green-500" style={{ width: `${easyPercent}%` }} title={`Easy: ${counts.easy}`} />
                        <div className="bg-yellow-500" style={{ width: `${mediumPercent}%` }} title={`Medium: ${counts.medium}`} />
                        <div className="bg-red-500" style={{ width: `${hardPercent}%` }} title={`Hard: ${counts.hard}`} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-green-500 mr-1.5" />
                            <div><span className="font-semibold text-foreground">{counts.easy}</span> Easy</div>
                        </div>
                        <div className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-yellow-500 mr-1.5" />
                            <div><span className="font-semibold text-foreground">{counts.medium}</span> Medium</div>
                        </div>
                        <div className="flex items-center">
                            <span className="h-2 w-2 rounded-full bg-red-500 mr-1.5" />
                            <div><span className="font-semibold text-foreground">{counts.hard}</span> Hard</div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// --- HELPER AND SKELETON COMPONENTS (No changes here) ---
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

// --- MAIN PAGE COMPONENT ---
export default function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);

    // --- UPDATED STATS INTERFACE ---
    interface PublicStats {
        ratingHistory: Array<{ newrating: number; timestamp: string; contestTitle: string; }>;
        contestsJoined: Array<{ _id: string; title: string; startTime: string; }>;
        problemsSolved: number;
        totalAttempted: number;
        accuracy: number;
        difficultyCounts: {
            easy: number;
            medium: number;
            hard: number;
        };
    }

    const [user, setUser] = useState<UserType | null>(null);
    const [stats, setStats] = useState<PublicStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [userRes, statsRes] = await Promise.all([
                    axios.get(`/api/users/${username}`),
                    axios.get(`/api/users/${username}/stats`)
                ]);
                setUser(userRes.data);
                setStats(statsRes.data);
            } catch (error) {
                console.error('Failed to load profile:', error);
                setUser(null);
                setStats(null);
            } finally {
                setLoading(false);
            }
        };
        if (username) {
             fetchData();
        } else {
            setLoading(false);
            setUser(null);
        }
    }, [username]);

    if (loading) {
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

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <UserX className="mx-auto h-16 w-16 text-destructive mb-6" />
                <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
                <p className="text-muted-foreground mb-8">The user profile for "{username}" could not be found.</p>
                <Link href="/"><Button variant="outline"><Home className="mr-2 h-4 w-4" />Return to Homepage</Button></Link>
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={100}>
            <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
                {/* Grid for Profile Info + Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
                    {/* Profile Info Card */}
                    <Card className="md:col-span-1">
                        <CardHeader className="relative flex flex-col items-center text-center pt-6 pb-4">
                            <div className="absolute top-2 right-2">
                                <Tooltip>
                                    <TooltipTrigger asChild><Link href={`/feedback?reportedUserId=${user._id}`}><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600"><Flag className="h-4 w-4" /></Button></Link></TooltipTrigger>
                                    <TooltipContent><p>Report this user</p></TooltipContent>
                                </Tooltip>
                            </div>
                            <Avatar className="h-20 w-20 mb-3 border-2 border-primary/50">
                                <AvatarImage src={user.avatar} alt={user.username} />
                                <AvatarFallback className="text-2xl bg-muted">{getInitials(user.username)}</AvatarFallback>
                            </Avatar>
                            <h1 className="text-2xl font-bold tracking-tight" style={{ color: getTitleColor(user.title || 'newbie') }}>{user.username}</h1>
                            <p className="text-sm font-medium capitalize" style={{ color: getTitleColor(user.title || 'newbie') }}>{user.title || 'Newbie'}</p>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm pt-0 pb-6">
                            <Separator className="mb-4"/>
                            <div className="flex items-center justify-center gap-2 text-muted-foreground"><Building className="h-4 w-4" /><span>{user.institute || <span className="italic">Institute not provided</span>}</span></div>
                            <div className="flex items-center justify-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" /><span>Year: {user.yearofstudy || <span className="italic">N/A</span>}</span></div>
                        </CardContent>
                    </Card>

                    {/* Statistics Card (with fixes applied) */}
                    <Card className="md:col-span-2">
                        <CardHeader><CardTitle className="text-lg">Statistics</CardTitle><CardDescription>User performance overview.</CardDescription></CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                            <div className="flex items-center gap-3 p-4 border rounded-lg"><BarChart3 className="h-8 w-8 text-blue-500 flex-shrink-0" /><div><p className="text-sm font-medium text-muted-foreground">Current Rating</p><p className="text-2xl font-bold">{user.rating ?? 'N/A'}</p></div></div>
                            <div className="flex items-center gap-3 p-4 border rounded-lg"><CheckSquare className="h-8 w-8 text-green-500 flex-shrink-0" /><div><p className="text-sm font-medium text-muted-foreground">Problems Solved</p><p className="text-2xl font-bold">{stats?.problemsSolved ?? 0}</p></div></div>
                            <div className="sm:col-span-2 mt-2">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Overall Accuracy</p>
                                <Progress value={stats?.accuracy || 0} className="h-2" aria-label="Overall user accuracy"/>
                                <p className="text-xs text-muted-foreground mt-1">{stats?.accuracy?.toFixed(1) || '0.0'}% from {stats?.totalAttempted || 0} final attempts.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* PLACEMENT OF THE NEW CARD */}
                <div className="mb-6 md:mb-8">
                    <ProblemBreakdownCard counts={stats?.difficultyCounts} />
                </div>

                {/* Rating History Card */}
                <Card className="mb-6 md:mb-8">
                    <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />Rating History</CardTitle><CardDescription>Rating changes based on contest performance.</CardDescription></CardHeader>
                    <CardContent>
                        {stats?.ratingHistory?.length ? (<div className="h-64 md:h-80"><RatingChart data={stats.ratingHistory} /></div>) : (<div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg"><p>No rating history available for this user.</p></div>)}
                    </CardContent>
                </Card>

                {/* Contests Participated Card */}
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" />Contests Participated</CardTitle><CardDescription>List of contests this user joined.</CardDescription></CardHeader>
                    <CardContent>
                        {stats?.contestsJoined?.length ? (<div className="space-y-2">{stats.contestsJoined.map(contest => (<Link key={contest._id} href={`/contests/${contest._id}`} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors duration-150 group border"><div><div className="text-sm font-medium text-primary group-hover:underline underline-offset-2">{contest.title}</div><div className="text-xs text-muted-foreground mt-0.5">{format(new Date(contest.startTime), 'MMM dd, yyyy')}</div></div><ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150" /></Link>))}</div>) : (<div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg"><p>This user hasn't participated in any contests yet.</p></div>)}
                    </CardContent>
                </Card>
            </div>
        </TooltipProvider>
    );
}