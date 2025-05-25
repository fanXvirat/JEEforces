'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, UserSearch } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { getTitleColor, cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useInfiniteQuery } from '@tanstack/react-query'; // Import useInfiniteQuery

interface LeaderboardUser {
    _id: string;
    username: string;
    avatar?: string;
    rating: number;
    title: string;
    institute?: string;
    problemsSolved: number;
    accuracy: number;
}

// Helper function for initials
const getInitials = (name: string = '') => {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';
};

const DEBOUNCE_DELAY = 500; // Increased debounce delay for better UX on filters

export default function LeaderboardPage() {
    const [filters, setFilters] = useState({
        search: '',
        ratingRange: [0, 3000] as [number, number],
    });
    // State to hold the filters that are actually applied to the query
    const [debouncedFilters, setDebouncedFilters] = useState(filters);

    // Debounce effect for filters
    useEffect(() => {
        const handler = setTimeout(() => {
            // Only update debouncedFilters if they are different from current filters
            if (JSON.stringify(debouncedFilters) !== JSON.stringify(filters)) {
                setDebouncedFilters(filters);
            }
        }, DEBOUNCE_DELAY);

        return () => {
            clearTimeout(handler);
        };
    }, [filters, debouncedFilters]); // Re-run when filters change, or debouncedFilters are updated

    // Fetching function for useInfiniteQuery
    const fetchLeaderboard = useCallback(async ({ pageParam = 1 }) => {
        const params = new URLSearchParams({
            page: pageParam.toString(),
            limit: '15',
            search: debouncedFilters.search,
            minRating: debouncedFilters.ratingRange[0].toString(),
            maxRating: debouncedFilters.ratingRange[1].toString(),
        });

        const response = await fetch(`/api/leaderboard?${params}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const { success, leaderboard: data, pagination } = await response.json();

        if (!success || !data) {
            throw new Error("API did not return successful data.");
        }

        return { data, pagination, nextPage: pagination.page < pagination.totalPages ? pagination.page + 1 : undefined };
    }, [debouncedFilters]); // Depend on debouncedFilters

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading, // Initial loading state
        isError,
        error,
        refetch, // Function to manually refetch when filters change or for retry
    } = useInfiniteQuery({
        queryKey: ['leaderboard', debouncedFilters], // Query key includes debounced filters
        queryFn: fetchLeaderboard,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
        staleTime: 5 * 60 * 1000, // Data is fresh for 5 minutes (matches backend cache TTL)
        gcTime: 10 * 60 * 1000, // Cached data garbage collected after 10 minutes of inactivity
        // Important: When debouncedFilters change, useInfiniteQuery will automatically
        // invalidate and refetch from page 1, effectively handling filter application.
    });

    // Flatten the data from all pages
    const leaderboard = data?.pages?.flatMap(page => page.data) || [];

    // Handle errors globally with toast
    useEffect(() => {
        if (isError) {
            console.error('Leaderboard fetch error:', error);
            toast.error("Failed to load leaderboard. Please try again later.", {
                description: error instanceof Error ? error.message : "An unknown error occurred.",
            });
        }
    }, [isError, error]);

    // Manually trigger a refresh when filter values change significantly (debounced)
    // useInfiniteQuery already handles this via `queryKey` dependency,
    // so this useEffect might not be strictly necessary, but helpful for explicit refresh logic.
    // useEffect(() => {
    //    if (!isLoading) { // Avoid refetching immediately on initial load
    //        refetch();
    //    }
    // }, [debouncedFilters, refetch, isLoading]);


    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters(prev => ({ ...prev, search: e.target.value }));
    };

    const handleSliderChange = (value: number[]) => {
        setFilters(prev => ({
            ...prev,
            ratingRange: value as [number, number],
        }));
    };

    // Determine total count from the last page's pagination if available
    const totalCount = data?.pages[0]?.pagination?.totalCount;

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center tracking-tight">
                JEEForces Leaderboard
            </h1>

            {/* Filters Section */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <UserSearch className="h-5 w-5" />
                        Filter Leaderboard
                    </CardTitle>
                    <CardDescription>Find users by name, institute, or rating range.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Search Input */}
                        <div className="space-y-2">
                            <Label htmlFor="search">User or Institute</Label>
                            <Input
                                id="search"
                                placeholder="Search by username or institute..."
                                value={filters.search} // Controlled by immediate filter state
                                onChange={handleSearchChange}
                            />
                        </div>

                        {/* Rating Slider */}
                        <div className="space-y-2">
                            <Label htmlFor="rating-slider">Rating Range</Label>
                            <Slider
                                id="rating-slider"
                                min={0}
                                max={3500}
                                step={50}
                                value={filters.ratingRange} // Controlled by immediate filter state
                                onValueChange={handleSliderChange}
                                className="py-2"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{filters.ratingRange[0]}</span>
                                <span>{filters.ratingRange[1]}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Leaderboard Table */}
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60px] text-center">Rank</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead className="hidden md:table-cell">Institute</TableHead>
                            <TableHead className="w-[100px] text-center">Rating</TableHead>
                            <TableHead className="w-[120px] hidden sm:table-cell text-center">Stats</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 10 }).map((_, i) => (
                                <TableRow key={`skel-${i}`}>
                                    <TableCell className="text-center tabular-nums">
                                        <Skeleton className="h-4 w-6 mx-auto" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-8 w-8 rounded-full" />
                                            <Skeleton className="h-4 w-32" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell">
                                        <Skeleton className="h-4 w-40" />
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Skeleton className="h-6 w-16 mx-auto" />
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <Skeleton className="h-3 w-20" />
                                            <Skeleton className="h-3 w-20" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : leaderboard.length > 0 ? (
                            leaderboard.map((user, index) => (
                                <TableRow key={user._id}>
                                    <TableCell className="text-center font-medium tabular-nums text-muted-foreground">
                                        {/* Calculate rank based on page structure from useInfiniteQuery */}
                                        #{index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar} alt={user.username} />
                                                <AvatarFallback>{getInitials(user.username)}</AvatarFallback>
                                            </Avatar>
                                            <Link
                                                href={`/users/${user.username}`}
                                                style={{ color: getTitleColor(user.title) }}
                                                className="font-medium hover:underline truncate"
                                                title={user.username}
                                            >
                                                {user.username}
                                            </Link>
                                        </div>
                                    </TableCell>
                                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground truncate">
                                        {user.institute || <span className="italic">N/A</span>}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant="secondary" className="font-semibold">
                                            {Math.round(user.rating)}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground text-center">
                                        <div>Solved: {user.problemsSolved}</div>
                                        <div>Acc: {(user.accuracy * 100).toFixed(1)}%</div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                 <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                     No users found matching your criteria.
                                 </TableCell>
                             </TableRow>
                        )}
                         {/* Row for Loading More Spinner */}
                         {isFetchingNextPage && (
                             <TableRow>
                                 <TableCell colSpan={5} className="py-4 text-center">
                                     <Loader2 className="h-5 w-5 animate-spin text-primary inline-block" />
                                 </TableCell>
                             </TableRow>
                         )}
                    </TableBody>
                </Table>
            </div>

            {/* Load More Button */}
            {hasNextPage && !isLoading && ( // isLoading covers initial load, !isFetchingNextPage covers subsequent
                <div className="mt-8 flex justify-center">
                    <Button
                        onClick={() => fetchNextPage()}
                        variant="outline"
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading More...
                            </>
                        ) : (
                            'Load More'
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}