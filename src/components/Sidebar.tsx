'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PanelLeftClose, PanelRightClose, CalendarClock, Trophy, MessagesSquare, ExternalLink } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { Duration, intervalToDuration } from 'date-fns'; // formatDistanceToNow is only used for discussions, might be small enough
import { usePathname, useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';
import { getTitleColor, cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns'; // Only used for discussions, can be optimized later

// Import useQuery from TanStack Query
import { useQuery } from '@tanstack/react-query';

// Updated Interfaces to reflect optimized API responses
interface Contest {
    _id: string;
    title: string;
    startTime: string;
    endTime: string;
    ispublished: boolean;
    isRegistered?: boolean; // New field from backend
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

type SessionUser = {
    _id?: string;
    name?: string | null | undefined;
    email?: string | null | undefined;
    image?: string | null | undefined;
    role?: string;
};

// Helper function for contest status (kept as is, it's efficient)
const getStatus = (contest: Contest): 'upcoming' | 'active' | 'finished' => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    if (now < start) return 'upcoming';
    if (now >= end) return 'finished';
    return 'active';
};

// --- Contest Timer Component --- (No changes needed, already memoized and efficient)
const ContestTimer = React.memo(({ contest }: { contest: Contest }) => {
    const [timeLeft, setTimeLeft] = useState<Duration | null>(null);
    const [statusInfo, setStatusInfo] = useState<{ status: 'upcoming' | 'active' | 'finished'; prefix: string }>({ status: 'finished', prefix: 'Contest Ended' });

    // getStatus (local to timer)
    const getContestStatus = (contest: Contest): 'upcoming' | 'active' | 'finished' => {
        const now = new Date();
        const start = new Date(contest.startTime);
        const end = new Date(contest.endTime);
        if (now < start) return 'upcoming';
        if (now > end) return 'finished';
        return 'active';
    };

    React.useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        const updateTimer = () => {
            const currentStatus = getContestStatus(contest);
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
                setTimeLeft(null);
                if (intervalId) clearInterval(intervalId);
            }
        };

        updateTimer();
        if (getContestStatus(contest) !== 'finished') {
            intervalId = setInterval(updateTimer, 1000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [contest]);

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
ContestTimer.displayName = 'ContestTimer';

// --- Main Sidebar Component ---
export function Sidebar() {
    const { data: session } = useSession();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const user = session?.user as SessionUser | undefined;

    const isContestPage = (contestId: string) => {
      return pathname === `/contests/${contestId}`;
    };

    // Fetcher functions for useQuery
    const fetchContests = async () => {
        const res = await axios.get<Contest[]>('/api/contests?forSidebar=true'); // Use new param
        return res.data;
    };

    const fetchDiscussions = async () => {
        // Backend will implement limit & sort
        const res = await axios.get<{ discussions: Discussion[] }>('/api/discussions?limit=5&sort=CreatedAt:desc');
        return res.data.discussions;
    };

    const fetchLeaderboard = async () => {
        // Backend will implement limit & forSidebar
        const res = await axios.get<{ leaderboard: LeaderboardUser[] }>('/api/leaderboard?limit=5&forSidebar=true');
        return res.data.leaderboard;
    };

    // TanStack Query hooks
    const { data: contests = [], isLoading: isLoadingContests, isFetching: isFetchingContests } = useQuery<Contest[]>({
        queryKey: ['sidebarContests'],
        queryFn: fetchContests,
        refetchInterval: 60000, // Refetch every 60 seconds
        staleTime: 30000, // Data is fresh for 30s, then refetch in background on re-mount/window focus
        select: (data) => data.filter(c => c.ispublished && getStatus(c) !== 'finished')
                              .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    });

    const { data: discussions = [], isLoading: isLoadingDiscussions, isFetching: isFetchingDiscussions } = useQuery<Discussion[]>({
        queryKey: ['sidebarDiscussions'],
        queryFn: fetchDiscussions,
        refetchInterval: 60000,
        staleTime: 30000,
    });

    const { data: leaderboard = [], isLoading: isLoadingLeaderboard, isFetching: isFetchingLeaderboard } = useQuery<LeaderboardUser[]>({
        queryKey: ['sidebarLeaderboard'],
        queryFn: fetchLeaderboard,
        refetchInterval: 60000,
        staleTime: 30000,
    });

    // Combine loading states for skeleton display
    const loading = isLoadingContests || isLoadingDiscussions || isLoadingLeaderboard;
    // You can also use isFetching for a more "active" loading indicator during background refreshes

    const handleContestClick = (contest: Contest) => {
        const now = new Date();
        const startTime = new Date(contest.startTime);
        const endTime = new Date(contest.endTime);

        // Use the new `isRegistered` flag from backend if available
        const isRegistered = contest.isRegistered ?? false;

        if (!user?._id) {
             if (now < startTime) {
                toast.info('Contest has not started yet.');
             } else if (now >= startTime && now < endTime) {
                toast.error('Please sign in to register and participate.');
             }
             // Always allow viewing finished contests or upcoming contests even if not logged in
             router.push(`/contests/${contest._id}`);
             return;
        }

        if (now < startTime) {
            toast.info('Contest has not started yet. Registration might be open.');
            router.push(`/contests/${contest._id}`);
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

    return (
        <TooltipProvider delayDuration={100}>
            <aside
                className={cn(
                    "sticky top-16 h-[calc(100vh-4rem)] border-r bg-background transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-[60px]" : "w-[280px] lg:w-[320px]"
                )}
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "absolute top-3 z-10 h-7 w-7 rounded-full",
                                isCollapsed ? "right-1/2 translate-x-1/2" : "right-3"
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

                <div className={cn(
                    "h-full overflow-y-auto overflow-x-hidden pt-12",
                    isCollapsed ? "opacity-0 pointer-events-none" : "opacity-100 p-3"
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
                                {loading ? ( // Use combined loading state
                                    Array(3).fill(0).map((_, i) => (
                                        <Skeleton key={i} className="h-[50px] w-full rounded-md" />
                                    ))
                                ) : contests.length > 0 ? (
                                    contests.map(contest => {
                                        const status = getStatus(contest);
                                        const isActivePage = isContestPage(contest._id);
                                        return (
                                            <div
                                                key={contest._id}
                                                onClick={() => handleContestClick(contest)}
                                                className={cn(
                                                    `p-2 rounded-md border hover:bg-muted cursor-pointer transition-colors`,
                                                    isActivePage && 'border-primary bg-muted'
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
                                                        title={lbUser.username}
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