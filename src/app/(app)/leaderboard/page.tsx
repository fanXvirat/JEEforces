'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, UserSearch, BarChart } from 'lucide-react'; // Added icons
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { getTitleColor, cn } from '@/lib/utils'; // Import cn
import {
    Table,
    TableBody,
    TableCaption,
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
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { toast } from 'sonner'; // Added for potential error feedback

interface LeaderboardUser {
    _id: string;
    username: string;
    avatar?: string;
    rating: number;
    title: string;
    institute?: string;
    problemsSolved: number;
    accuracy: number; // Assuming accuracy is a number between 0 and 1
}

// Helper function for initials (if not globally available)
const getInitials = (name: string = '') => {
    return name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?';
};

const DEBOUNCE_DELAY = 300; // Delay for search input debounce

export default function LeaderboardPage() {
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false); // Separate state for loading more
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        ratingRange: [0, 3000] as [number, number],
    });
    const [appliedFilters, setAppliedFilters] = useState(filters); // Store filters used for the current data

    // Debounced filter application (Optional but recommended UX improvement)
    // You would need a debounce utility or useEffect with setTimeout for this
    /*
    useEffect(() => {
      const handler = setTimeout(() => {
        setPage(1); // Reset page when filters change
        setAppliedFilters(filters);
      }, DEBOUNCE_DELAY);
      return () => clearTimeout(handler);
    }, [filters]); // Trigger effect when filters change
    */
    // --- Using immediate filter application as per original code ---
     useEffect(() => {
       // Reset page and apply filters immediately when they change in the UI
       setPage(1);
       setAppliedFilters(filters);
     }, [filters]);
    // --- End immediate filter application ---

    const loadData = useCallback(async (reset = false) => {
        if (reset) {
            setLoading(true); // Full loading state only on reset
            setLeaderboard([]); // Clear existing data on reset
        } else {
            setLoadingMore(true); // Use loadingMore state for subsequent pages
        }

        try {
            const currentFilters = reset ? filters : appliedFilters; // Use UI filters for reset, applied filters otherwise
            const currentPage = reset ? 1 : page;

            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: '15', // Increased limit slightly
                search: currentFilters.search,
                minRating: currentFilters.ratingRange[0].toString(),
                maxRating: currentFilters.ratingRange[1].toString(),
            });

            const response = await fetch(`/api/leaderboard?${params}`);
            if (!response.ok) {
                 throw new Error(`HTTP error! status: ${response.status}`);
            }
            const { success, leaderboard: data, pagination } = await response.json();

            if (success && data) {
                setLeaderboard(prev => (reset ? data : [...prev, ...data]));
                setHasMore(pagination?.page < pagination?.totalPages);
            } else {
                // Handle cases where success is false or data is missing
                setHasMore(false); // Assume no more data if API indicates failure or missing data
                if (!reset) setPage(prev => Math.max(1, prev - 1)); // Roll back page state if load more failed
                toast.error("Could not load leaderboard data.");
            }
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
            toast.error("Failed to load leaderboard. Please try again later.");
            if (!reset) setPage(prev => Math.max(1, prev - 1)); // Roll back page state on error
            setHasMore(false); // Assume no more data on error
        } finally {
             setLoading(false);
             setLoadingMore(false);
        }
    }, [page, appliedFilters, filters]); // Include filters here if using immediate update

    // Initial load and load on applied filter change
    useEffect(() => {
        loadData(true); // Pass true to reset and use appliedFilters
    }, [appliedFilters]); // Depend on appliedFilters

    // Load more data when page changes (and not on initial mount/filter change)
    useEffect(() => {
         // Only trigger loadData if page > 1 (to avoid double load on mount/filter change)
         // and if not currently loading the initial data
        if (page > 1 && !loading) {
             loadData(false); // Load more, don't reset
        }
    }, [page, loading]); // Depend on page and loading state


    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
         setFilters(prev => ({ ...prev, search: e.target.value }));
         // Debounce handled by useEffect above (if implemented)
    };

    const handleSliderChange = (value: number[]) => {
        setFilters(prev => ({
            ...prev,
            ratingRange: value as [number, number],
        }));
        // Debounce handled by useEffect above (if implemented)
    };

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
                                value={filters.search}
                                onChange={handleSearchChange}
                                // Consider adding a Search icon inside the input if desired
                            />
                        </div>

                        {/* Rating Slider */}
                        <div className="space-y-2">
                            <Label htmlFor="rating-slider">Rating Range</Label>
                            <Slider
                                id="rating-slider"
                                min={0}
                                max={3500} // Slightly increased max range
                                step={50}
                                value={filters.ratingRange}
                                onValueChange={handleSliderChange} // Use the specific handler
                                className="py-2" // Add padding for easier thumb interaction
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
                    {/* Optional: Add TableCaption if needed */}
                    {/* <TableCaption>A list of top users on JEEForces.</TableCaption> */}
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
                        {loading && leaderboard.length === 0 ? (
                            // Skeleton Loading State
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
                            // Data Rows
                            leaderboard.map((user, index) => (
                                <TableRow key={user._id}>
                                    <TableCell className="text-center font-medium tabular-nums text-muted-foreground">
                                        #{index + 1 + (page - 1) * 15} {/* Calculate rank based on page */}
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
                                            {Math.round(user.rating)} {/* Use Math.round */}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground text-center">
                                        <div>Solved: {user.problemsSolved}</div>
                                        <div>Acc: {(user.accuracy * 100).toFixed(1)}%</div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             // Empty State (when not loading)
                             <TableRow>
                                 <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                     No users found matching your criteria.
                                 </TableCell>
                             </TableRow>
                        )}
                         {/* Row for Loading More Spinner */}
                         {loadingMore && (
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
            {hasMore && !loading && !loadingMore && (
                <div className="mt-8 flex justify-center">
                    <Button
                        onClick={() => setPage(prev => prev + 1)}
                        variant="outline"
                        disabled={loadingMore} // Disable while loading more
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Loading...
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