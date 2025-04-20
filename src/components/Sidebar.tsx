'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelRightClose, CalendarClock, Trophy, MessagesSquare, ExternalLink } from 'lucide-react'; // Updated icons
import axios from 'axios';
import Link from 'next/link';
import { Duration, formatDistanceToNow, intervalToDuration } from 'date-fns';
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { getTitleColor, cn } from '@/lib/utils'; // Import cn
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Import Tooltip components

// Interfaces (assuming SessionUser is correctly defined elsewhere or inline if simple)
interface Contest {
    _id: string;
    title: string;
    startTime: string;
    endTime: string;
    ispublished: boolean;
    participants: Array<{ _id: string }>;
}

interface Discussion {
    _id: string;
    title: string;
    CreatedAt: string;
}

interface LeaderboardUser {
    _id: string;
    username: string;
    rating: number;
    title: string;
}

// Assuming SessionUser type from next-auth + potential custom fields
type SessionUser = {
    _id?: string;
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
    role?: string;
    // Add other custom fields if they exist on your session user object
};

// --- Contest Timer Component ---
const ContestTimer = React.memo(({ contest }: { contest: Contest }) => {
    const [timeLeft, setTimeLeft] = useState<Duration | null>(null);
    const [statusInfo, setStatusInfo] = useState<{ status: 'upcoming' | 'active' | 'finished'; prefix: string }>({ status: 'finished', prefix: 'Contest Ended' });

    const getStatus = (contest: Contest): 'upcoming' | 'active' | 'finished' => {
      const now = new Date();
      const start = new Date(contest.startTime);
      const end = new Date(contest.endTime);
      
      if (now < start) return 'upcoming';
      if (now > end) return 'finished';
      return 'active';
    };

    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;

        const updateTimer = () => {
            const currentStatus = getStatus(contest);
            const now = new Date();
            let targetDate: Date | null = null;
            let prefix = 'Contest Ended';

            if (currentStatus === 'upcoming') {
                targetDate = new Date(contest.startTime);
                prefix = 'Starts in';
            } else if (currentStatus === 'active') {
                targetDate = new Date(contest.endTime);
                prefix = 'Ends in';
            }

            setStatusInfo({ status: currentStatus, prefix });

            if (targetDate && now < targetDate) {
                setTimeLeft(intervalToDuration({ start: now, end: targetDate }));
            } else {
                setTimeLeft(null); // Contest ended or calculation not needed
                if (intervalId) clearInterval(intervalId); // Clear interval if ended
            }
        };

        updateTimer(); // Initial call

        // Set up interval only if the contest is not finished
        if (getStatus(contest) !== 'finished') {
            intervalId = setInterval(updateTimer, 1000); // Update every second
        }

        // Cleanup interval on component unmount or when contest changes
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [contest]); // Rerun effect if contest prop changes

    return (
        <div className="text-right text-xs flex-shrink-0 ml-2">
            <div className="font-medium">{statusInfo.prefix}</div>
            {statusInfo.status !== 'finished' && timeLeft && (
                <div className="text-muted-foreground tabular-nums">
                    {timeLeft.days ? `${timeLeft.days}d ` : ''}
                    {`${String(timeLeft.hours || 0).padStart(2, '0')}:`}
                    {`${String(timeLeft.minutes || 0).padStart(2, '0')}:`}
                    {`${String(timeLeft.seconds || 0).padStart(2, '0')}`}
                </div>
            )}
            {statusInfo.status === 'finished' && (
                 <div className="text-muted-foreground">-</div>
            )}
        </div>
    );
});
ContestTimer.displayName = 'ContestTimer'; // Add display name for React DevTools

// --- Main Sidebar Component ---
export function Sidebar() {
    const { data: session } = useSession();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [contests, setContests] = useState<Contest[]>([]);
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const pathname = usePathname();
    const router = useRouter();
    const user = session?.user as SessionUser | undefined;

    const isContestPage = (contestId: string) => {
      return pathname === `/contests/${contestId}`; // Exact match
    };

    useEffect(() => {
        let isMounted = true; // Flag to prevent state updates on unmounted component
        setLoading(true); // Set loading true on initial fetch or re-fetch trigger

        const fetchData = async () => {
            try {
                const [contestsRes, discussionsRes, leaderboardRes] = await Promise.all([
                    axios.get<Contest[]>('/api/contests'), // Assume API returns { contests: [...] } and can filter published
                    axios.get<{ discussions: Discussion[] }>('/api/discussions?limit=5&sort=CreatedAt:desc'), // Assume API returns { discussions: [...] } and can limit/sort
                    axios.get<{ leaderboard: LeaderboardUser[] }>('/api/leaderboard?limit=5') // Assume API returns { leaderboard: [...] }
                ]);

                if (isMounted) {
                    setContests(contestsRes.data || []); // Access the contests property
                    setDiscussions(discussionsRes.data.discussions || []);
                    setLeaderboard(leaderboardRes.data.leaderboard || []);
                }
            } catch (error) {
                console.error('Sidebar data fetch error:', error);
                if (isMounted) {
                     // Optionally show toast, but maybe avoid for background refresh
                     // toast.error("Failed to refresh sidebar data");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchData(); // Initial fetch

        // Set up interval for refreshing data (e.g., every minute)
        const intervalId = setInterval(fetchData, 60000);

        // Cleanup function
        return () => {
            isMounted = false; // Set flag to false when component unmounts
            clearInterval(intervalId); // Clear the interval
        };
    }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

    const handleContestClick = (contest: Contest) => {
        const now = new Date();
        const startTime = new Date(contest.startTime);
        const endTime = new Date(contest.endTime);

        // Check if user is authenticated for registration check
        if (!user?._id) {
             if (now < startTime) {
                toast.info('Contest has not started yet.');
             } else if (now >= startTime && now < endTime) {
                toast.error('Please sign in to register and participate.');
             } else {
                 router.push(`/contests/${contest._id}`); // Allow viewing finished contests even if not logged in
             }
             return;
        }

        const isRegistered = contest.participants?.some(p => p._id === user._id) ?? false;

        if (now < startTime) {
            toast.info('Contest has not started yet. Registration might be open.');
            // Optionally redirect to contest page anyway if registration happens there
            router.push(`/contests/${contest._id}`); // Let contest page handle registration display
            return;
        }

        if (now >= startTime && now < endTime && !isRegistered) {
            toast.error('You must register first to participate.', {
                description: 'Visit the contest page to register.',
                action: {
                    label: 'Go to Contest',
                    onClick: () => router.push(`/contests/${contest._id}`),
                },
            });
            return;
        }

        // If active and registered, or finished, navigate
        router.push(`/contests/${contest._id}`);
    };

    // Memoize filtered contests to avoid re-filtering on every render
    const getStatus = (contest: Contest): 'upcoming' | 'active' | 'finished' => {
      const now = new Date();
      const start = new Date(contest.startTime);
      const end = new Date(contest.endTime);
      if (now < start) return 'upcoming';
      if (now >= end) return 'finished'; // Use >= for end time check
      return 'active';
  };
    const upcomingOrActiveContests = useMemo(() => {
      return contests
        .filter(c => c.ispublished && getStatus(c) !== 'finished')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [contests]);



    return (
        <TooltipProvider delayDuration={100}>
            <aside
                className={cn(
                    "sticky top-16 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300 ease-in-out", // Use sticky positioning relative to viewport
                    isCollapsed ? "w-[60px]" : "w-[280px] lg:w-[320px]" // Slightly wider on larger screens
                )}
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute top-3 z-10 h-7 w-7 rounded-full",
                                isCollapsed ? "right-1/2 translate-x-1/2" : "right-3" // Center when collapsed, top-right when expanded
                            )}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                            <span className="sr-only">{isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                        {isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                    </TooltipContent>
                </Tooltip>

                 {/* Content Area */}
                <div className={cn(
                    "h-full overflow-y-auto overflow-x-hidden pt-12", // Add padding top to avoid content overlapping button
                    isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100 p-3" // Hide content visually and from interaction when collapsed
                    )}
                >
                    <div className="space-y-4">
                        {/* Contests Card */}
                        <Card className={cn(isCollapsed ? "hidden" : "block")}>
                            <CardHeader className="px-3 pt-3 pb-2">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <CalendarClock className="h-4 w-4 text-primary" />
                                    Contests
                                </CardTitle>
                                <CardDescription className="text-xs">Upcoming & Active</CardDescription>
                            </CardHeader>
                            <CardContent className="px-3 pb-3 space-y-2">
                                {loading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <Skeleton key={i} className="h-[50px] w-full rounded-md" />
                                    ))
                                ) : upcomingOrActiveContests.length > 0 ? (
                                    upcomingOrActiveContests.map(contest => {
                                        const status = getStatus(contest);
                                        const isActivePage = isContestPage(contest._id);
                                        return (
                                            <div
                                                key={contest._id}
                                                onClick={() => handleContestClick(contest)}
                                                className={cn(
                                                    `p-2 rounded-md border hover:bg-muted cursor-pointer transition-colors`,
                                                    isActivePage && 'border-primary bg-muted' // Simplified active style
                                                )}
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 mr-2">
                                                        <div className="text-sm font-medium leading-snug line-clamp-2">{contest.title}</div>
                                                        <Badge
                                                            variant={status === 'active' ? 'default' : 'secondary'}
                                                            className={cn(
                                                                "mt-1 text-xs px-1.5 py-0.5 h-auto",
                                                                status === 'active' && 'bg-green-600 text-white',
                                                                status === 'upcoming' && 'bg-blue-600 text-white'
                                                            )}
                                                        >
                                                            {status.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <ContestTimer contest={contest} />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No upcoming or active contests.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Leaderboard Card */}
                        <Card className={cn(isCollapsed ? "hidden" : "block")}>
                             <CardHeader className="px-3 pt-3 pb-2">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                    Top Performers
                                </CardTitle>
                            </CardHeader>
                             <CardContent className="px-3 pb-3">
                                {loading ? (
                                    <div className="space-y-2">
                                        {Array(5).fill(0).map((_, i) => (
                                            <div key={i} className="flex items-center justify-between h-6">
                                                <Skeleton className="h-4 w-4 rounded-full" />
                                                <Skeleton className="h-4 w-3/5 rounded" />
                                                <Skeleton className="h-4 w-1/5 rounded" />
                                            </div>
                                        ))}
                                    </div>
                                ) : leaderboard.length > 0 ? (
                                    <ol className="space-y-2 list-none pl-0">
                                        {leaderboard.map((lbUser, index) => (
                                            <li key={lbUser._id} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center space-x-2 overflow-hidden">
                                                    <span className="text-xs w-4 text-center text-muted-foreground">{index + 1}.</span>
                                                    <Link
                                                        href={`/users/${lbUser.username}`}
                                                        style={{ color: getTitleColor(lbUser.title) }}
                                                        className="font-medium hover:underline truncate"
                                                        title={lbUser.username} // Tooltip for potentially truncated names
                                                    >
                                                        {lbUser.username}
                                                    </Link>
                                                </div>
                                                <span className="text-xs font-semibold text-muted-foreground">{lbUser.rating}</span>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">Leaderboard is empty.</p>
                                )}
                                {!loading && leaderboard.length > 0 && (
                                     <Link href="/leaderboard" className="block mt-2">
                                         <Button variant="link" size="sm" className="text-xs p-0 h-auto w-full justify-center">
                                            View Full Leaderboard <ExternalLink className="h-3 w-3 ml-1" />
                                         </Button>
                                     </Link>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Discussions Card */}
                        <Card className={cn(isCollapsed ? "hidden" : "block")}>
                             <CardHeader className="px-3 pt-3 pb-2">
                                <CardTitle className="text-base font-semibold flex items-center gap-2">
                                    <MessagesSquare className="h-4 w-4 text-blue-500" />
                                    Recent Discussions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="px-3 pb-3 space-y-2">
                                {loading ? (
                                    Array(3).fill(0).map((_, i) => (
                                         <div key={i} className="space-y-1">
                                            <Skeleton className="h-4 w-4/5 rounded" />
                                            <Skeleton className="h-3 w-1/2 rounded" />
                                         </div>
                                    ))
                                ) : discussions.length > 0 ? (
                                    discussions.map(discussion => (
                                        <Link
                                            key={discussion._id}
                                            href={`/discussions/${discussion._id}`}
                                            className="block p-1.5 rounded hover:bg-muted"
                                        >
                                            <div className="text-sm font-medium leading-snug truncate">{discussion.title}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(discussion.CreatedAt), { addSuffix: true })}
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                     <p className="text-sm text-muted-foreground text-center py-4">No recent discussions.</p>
                                )}
                                {!loading && discussions.length > 0 && (
                                    <Link href="/discussions" className="block mt-2">
                                         <Button variant="link" size="sm" className="text-xs p-0 h-auto w-full justify-center">
                                            View All Discussions <ExternalLink className="h-3 w-3 ml-1" />
                                         </Button>
                                     </Link>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </aside>
        </TooltipProvider>
    );
}