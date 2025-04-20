'use client';
import { useSession } from 'next-auth/react';
import React, { useEffect, useState, useMemo } from 'react'; // Added React and useMemo
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription, // Added
    CardContent,
    CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; // Added Avatar
import { Skeleton } from '@/components/ui/skeleton'; // Added Skeleton
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Added Tooltip
import { Loader2, Star, Pin, MessagesSquare, PlusCircle, ArrowRight, MessageSquare } from 'lucide-react'; // Added/Updated Icons
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns'; // Added formatDistanceToNow
import { VoteButtons } from '@/components/Upvote';
import { toast } from 'sonner';
import { getTitleColor, cn } from '@/lib/utils'; // Added cn

interface Discussion {
    _id: string;
    title: string;
    content: string;
    author: {
        username: string;
        title: string;
        avatar?: string; // Make avatar optional
    };
    upvotes: string[];
    downvotes: string[];
    comments: any[]; // Consider defining a Comment type if needed
    CreatedAt: string;
    isFeatured: boolean;
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

// --- Skeleton Component ---
const DiscussionCardSkeleton = () => (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-3/4 rounded" /> {/* Title */}
                {/* Optional: Skeleton for Pin button */}
            </div>
            <div className="flex items-center space-x-2 pt-2">
                <Skeleton className="h-6 w-6 rounded-full" /> {/* Avatar */}
                <Skeleton className="h-4 w-1/4 rounded" /> {/* Author */}
                <Skeleton className="h-4 w-1/3 rounded" /> {/* Date */}
            </div>
        </CardHeader>
        <CardContent>
            <Skeleton className="h-4 w-full rounded mb-1" />
            <Skeleton className="h-4 w-full rounded mb-1" />
            <Skeleton className="h-4 w-5/6 rounded" />
        </CardContent>
        <CardFooter className="flex justify-between items-center">
            <Skeleton className="h-8 w-24 rounded" /> {/* View Button */}
            <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-16 rounded" /> {/* Vote Buttons */}
                <Skeleton className="h-4 w-16 rounded" /> {/* Comments */}
            </div>
        </CardFooter>
    </Card>
);


// --- Main Page Component ---
export default function DiscussionsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [discussions, setDiscussions] = useState<Discussion[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const fetchDiscussions = async () => {
            try {
                // Optionally add sorting/pagination parameters here if API supports it
                // e.g., /api/discussions?sort=CreatedAt:desc
                const response = await axios.get<{ discussions: Discussion[] }>('/api/discussions');
                setDiscussions(response.data.discussions || []); // Ensure it's an array
            } catch (error) {
                console.error('Error fetching discussions:', error);
                toast.error("Failed to load discussions.");
                 setDiscussions([]); // Reset on error
            } finally {
                setLoading(false);
            }
        };
        fetchDiscussions();
    }, []);

    const toggleFeatured = async (discussionId: string, currentState: boolean) => {
        // Optimistic UI Update
        setDiscussions(prev =>
            prev.map(d =>
                d._id === discussionId ? { ...d, isFeatured: !currentState } : d
            )
        );

        try {
            const response = await axios.put(`/api/discussions/${discussionId}/toggle-feature`);
            // Update with actual state from server response (though likely same as optimistic)
             setDiscussions(prev =>
                prev.map(d =>
                    d._id === discussionId ? { ...d, isFeatured: response.data.discussion.isFeatured } : d
                )
            );
            toast.success(`Discussion ${response.data.discussion.isFeatured ? 'pinned' : 'unpinned'}.`);
        } catch (error) {
            // Revert optimistic update on error
            setDiscussions(prev =>
                prev.map(d =>
                    d._id === discussionId ? { ...d, isFeatured: currentState } : d // Revert to original state
                )
            );
            toast.error('Failed to update pin status. Please try again.');
            console.error('Toggle feature error:', error);
        }
    };

    // Memoize sorted discussions to prevent re-sorting on every render
    const sortedDiscussions = useMemo(() => {
        return [...discussions].sort((a, b) => {
            // Pinned posts first, then sort by creation date (newest first)
            if (a.isFeatured !== b.isFeatured) {
                return b.isFeatured ? 1 : -1;
            }
            return new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime();
        });
    }, [discussions]);

    return (
        <TooltipProvider delayDuration={100}>
            <div className="container mx-auto px-4 py-8 md:py-12">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2">
                        <MessagesSquare className="h-8 w-8 text-primary" />
                        Discussions
                    </h1>
                    {/* Show create button only if logged in */}
                    {session?.user && (
                        <Link href="/discussions/create">
                            <Button>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Discussion
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Discussions List */}
                <div className="space-y-4">
                    {loading ? (
                        // Loading State
                        Array.from({ length: 5 }).map((_, i) => <DiscussionCardSkeleton key={`skel-${i}`} />)
                    ) : sortedDiscussions.length === 0 ? (
                        // Empty State
                        <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg">
                            <MessagesSquare className="mx-auto h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No discussions yet.</p>
                             {session?.user && <p className="mt-2">Be the first to start a conversation!</p>}
                             {!session?.user && <p className="mt-2">Log in to create or view discussions.</p>}
                        </div>
                    ) : (
                        // Data Rows
                        sortedDiscussions.map((discussion) => (
                            <Card key={discussion._id} className={cn("transition-shadow hover:shadow-md", discussion.isFeatured && "border-primary/50 bg-primary/5")}>
                                <CardHeader className="relative"> {/* Added relative for absolute positioning context */}
                                    {/* Admin Pin Button */}
                                    {session?.user?.role === 'admin' && (
                                         <div className="absolute top-3 right-3">
                                             <Tooltip>
                                                 <TooltipTrigger asChild>
                                                     <Button
                                                         size="icon"
                                                         variant="ghost"
                                                         className="h-7 w-7 text-muted-foreground hover:text-primary"
                                                         onClick={(e) => {
                                                             e.stopPropagation(); // Prevent card navigation if title is link
                                                             toggleFeatured(discussion._id, discussion.isFeatured);
                                                         }}
                                                     >
                                                         <Pin className={cn("h-4 w-4", discussion.isFeatured && "fill-primary text-primary")} />
                                                         <span className="sr-only">{discussion.isFeatured ? 'Unpin' : 'Pin'} Discussion</span>
                                                     </Button>
                                                 </TooltipTrigger>
                                                 <TooltipContent>
                                                     <p>{discussion.isFeatured ? 'Unpin Discussion' : 'Pin Discussion'}</p>
                                                 </TooltipContent>
                                             </Tooltip>
                                         </div>
                                    )}
                                     {/* Title */}
                                    <CardTitle className="text-lg font-semibold leading-snug pr-10"> {/* Padding right for pin button */}
                                         <Link href={`/discussions/${discussion._id}`} className="hover:text-primary transition-colors duration-200 line-clamp-2">
                                             {discussion.title}
                                         </Link>
                                    </CardTitle>
                                    {/* Author/Date Info */}
                                    <CardDescription className="flex items-center text-xs pt-1">
                                        <Avatar className="h-5 w-5 mr-1.5">
                                            <AvatarImage src={discussion.author.avatar} alt={discussion.author.username} />
                                            <AvatarFallback className="text-xs">{getInitials(discussion.author.username)}</AvatarFallback>
                                        </Avatar>
                                        <span>By{' '}
                                            <Link
                                                href={`/users/${discussion.author.username}`}
                                                style={{ color: getTitleColor(discussion.author.title) }}
                                                className="font-medium hover:underline"
                                                onClick={(e) => e.stopPropagation()} // Prevent card navigation
                                            >
                                                {discussion.author.username}
                                            </Link>
                                        </span>
                                        <span className="mx-1.5">•</span>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="cursor-default">{formatDistanceToNow(new Date(discussion.CreatedAt), { addSuffix: true })}</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>{format(new Date(discussion.CreatedAt), 'MMM dd, yyyy HH:mm')}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0 pb-4">
                                    {/* Use 'prose' class if content can have basic markdown/html for better styling */}
                                    <p className="text-sm line-clamp-3 text-muted-foreground">
                                        {discussion.content}
                                    </p>
                                </CardContent>
                                <CardFooter className="flex justify-between items-center pt-3 pb-4 border-t">
                                    {/* View Button */}
                                     <Button
                                        variant="link"
                                        size="sm"
                                        className="text-primary p-0 h-auto text-sm"
                                        onClick={() => router.push(`/discussions/${discussion._id}`)}
                                    >
                                        View Discussion <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                    {/* Votes & Comments */}
                                    <div className="flex items-center gap-4">
                                        <VoteButtons
                                            upvotes={discussion.upvotes}
                                            downvotes={discussion.downvotes}
                                            discussionId={discussion._id}
                                        />
                                        <div className="flex items-center text-sm text-muted-foreground gap-1">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>{discussion.comments?.length ?? 0}</span>
                                            <span className="sr-only">comments</span>
                                        </div>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))
                    )}
                </div>
                {/* Optional: Add Pagination if needed */}
            </div>
        </TooltipProvider>
    );
}