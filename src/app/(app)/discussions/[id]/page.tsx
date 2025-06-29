'use client';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, formatDistanceToNow } from 'date-fns';
import axios, { AxiosError } from 'axios';
// --- START: MODIFIED IMPORTS ---
import { Loader2, MessagesSquare, SendHorizonal, RefreshCw, Trash2, Flag } from 'lucide-react';
// --- END: MODIFIED IMPORTS ---
import { toast } from 'sonner';
import { VoteButtons } from '@/components/Upvote';
import { VoteButtonsComment } from '@/components/Upvotecomment';
import Link from 'next/link';
import { getTitleColor, cn } from '@/lib/utils';

// --- Interfaces (no changes) ---
interface Author {
    username: string;
    title?: string;
    avatar?: string;
    _id: string;
}

interface Comment {
    _id: string;
    text: string;
    author: Author;
    upvotes: string[];
    downvotes: string[];
    CreatedAt: string;
    replies?: Comment[];
}

interface Discussion {
    _id: string;
    title: string;
    content: string;
    author: Author;
    upvotes: string[];
    downvotes: string[];
    comments: Comment[];
    CreatedAt: string;
}

// --- Helper Functions (no changes) ---
const getInitials = (name: string = '') => {
    return name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';
};
const getSafeTitleColor = (title?: string) => {
    if (!title) return 'inherit';
    return getTitleColor(title);
};

// --- Skeleton Components (no changes) ---
const DiscussionPostSkeleton = () => (
    <article className="mb-8 pb-8 border-b">
         <div className="flex justify-between items-start mb-4">
            <Skeleton className="h-8 w-3/4 rounded" />
             <div className="flex items-center gap-1">
                 <Skeleton className="h-8 w-8 rounded" />
                 <Skeleton className="h-4 w-6 rounded" />
                 <Skeleton className="h-8 w-8 rounded" />
             </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
            <Skeleton className="h-8 w-8 rounded-full" />
             <Skeleton className="h-4 w-24 rounded" />
             <span className="mx-1">•</span>
             <Skeleton className="h-4 w-32 rounded" />
         </div>
         <div className="space-y-2">
             <Skeleton className="h-4 w-full rounded" />
             <Skeleton className="h-4 w-full rounded" />
             <Skeleton className="h-4 w-5/6 rounded" />
             <Skeleton className="h-4 w-full rounded" />
             <Skeleton className="h-4 w-3/4 rounded" />
         </div>
    </article>
);

const CommentSkeleton = () => (
    <div className="border-b pb-6">
         <div className="flex justify-between items-start mb-3">
             <div className="flex items-center gap-2 text-sm">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 w-20 rounded" />
                <span className="mx-1 text-muted-foreground">•</span>
                <Skeleton className="h-4 w-16 rounded" />
            </div>
            <div className="flex items-center gap-1">
                 <Skeleton className="h-6 w-6 rounded" />
                 <Skeleton className="h-3 w-4 rounded" />
                 <Skeleton className="h-6 w-6 rounded" />
             </div>
        </div>
         <Skeleton className="h-4 w-full rounded" />
         <Skeleton className="h-4 w-5/6 rounded mt-1" />
     </div>
);


export default function DiscussionPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [discussion, setDiscussion] = useState<Discussion | null>(null);
    const [commentText, setCommentText] = useState('');
    const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isSubmittingReply, setIsSubmittingReply] = useState<{ [key: string]: boolean }>({});
    const [refreshing, setRefreshing] = useState(false);
    // --- START: ADDED STATE ---
    const [isDeleting, setIsDeleting] = useState<{ [key: string]: boolean }>({});
    // --- END: ADDED STATE ---

    const fetchDiscussion = useCallback(async () => {
        try {
            const response = await axios.get<{ discussion: Discussion }>(`/api/discussions/${id}`);
            setDiscussion(response.data.discussion);
        } catch (error) {
            console.error('Error fetching discussion:', error);
            toast.error("Discussion not found or failed to load.");
            setDiscussion(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            setLoading(true);
            fetchDiscussion();
        }
    }, [id, fetchDiscussion]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchDiscussion();
    };

    // --- START: ADDED DELETE HANDLERS ---
    const handleDeleteDiscussion = async () => {
        if (!discussion) return;
        if (!window.confirm("Are you sure you want to delete this entire discussion? This action cannot be undone.")) return;

        try {
            await axios.delete(`/api/discussions/${id}`);
            toast.success("Discussion deleted.");
            router.push('/discussions');
        } catch (error) {
            const axiosError = error as AxiosError<{ error: string }>;
            toast.error(axiosError.response?.data?.error || "Failed to delete discussion.");
            console.error(error);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!discussion) return;
        if (!window.confirm("Are you sure you want to delete this comment? All replies will also be removed.")) return;
        
        setIsDeleting(prev => ({ ...prev, [commentId]: true }));
        try {
            await axios.delete(`/api/discussions/${id}/comment/${commentId}`);
            toast.success("Comment deleted.");
            fetchDiscussion(); // Refresh data
        } catch (error) {
            const axiosError = error as AxiosError<{ error: string }>;
            toast.error(axiosError.response?.data?.error || "Failed to delete comment.");
            console.error(error);
        } finally {
            setIsDeleting(prev => ({ ...prev, [commentId]: false }));
        }
    };

    const handleDeleteReply = async (commentId: string, replyId: string) => {
        if (!discussion) return;
        if (!window.confirm("Are you sure you want to delete this reply?")) return;

        setIsDeleting(prev => ({ ...prev, [replyId]: true }));
        try {
            await axios.delete(`/api/discussions/${id}/comment/${commentId}/reply/${replyId}`);
            toast.success("Reply deleted.");
            fetchDiscussion(); // Refresh data
        } catch (error) {
            const axiosError = error as AxiosError<{ error: string }>;
            toast.error(axiosError.response?.data?.error || "Failed to delete reply.");
            console.error(error);
        } finally {
            setIsDeleting(prev => ({ ...prev, [replyId]: false }));
        }
    };
    // --- END: ADDED DELETE HANDLERS ---

    const handleCommentSubmit = async () => {
        if (!commentText.trim() || isSubmittingComment) return;
        if (status !== 'authenticated') {
             toast.error("Please sign in to comment.");
             return;
        }

        setIsSubmittingComment(true);
        try {
            await axios.post<{ discussion: Discussion }>(`/api/discussions/${id}/comment`, {
                text: commentText,
            });
            setCommentText('');
            toast.success('Comment added successfully!');
            await fetchDiscussion();
            
        } catch (error) {
            console.error("Comment submission error:", error);
            const axiosError = error as AxiosError<{ error: string }>;
            toast.error(axiosError.response?.data?.error || 'Failed to add comment. Please try again.');
        } finally {
            setIsSubmittingComment(false);
        }
    };

    const handleReplySubmit = async (commentId: string) => {
        const replyText = replyTexts[commentId]?.trim();
        if (!replyText || isSubmittingReply[commentId]) return;
        if (status !== 'authenticated') {
            toast.error("Please sign in to reply.");
            return;
        }

        setIsSubmittingReply(prev => ({ ...prev, [commentId]: true }));
        try {
            await axios.post<{ discussion: Discussion }>(
                `/api/discussions/${id}/comment/${commentId}/reply`,
                { text: replyText }
            );
            
            setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
            toast.success('Reply added successfully!');
            await fetchDiscussion();
            
        } catch (error) {
            console.error("Reply submission error:", error);
            const axiosError = error as AxiosError<{ error: string }>;
            toast.error(axiosError.response?.data?.error || 'Failed to add reply. Please try again.');
        } finally {
            setIsSubmittingReply(prev => ({ ...prev, [commentId]: false }));
        }
    };

    // --- START: MODIFIED RENDER FUNCTION ---
    const renderComment = (comment: Comment, isReply = false, parentCommentId: string | null = null) => {
        const currentReplyText = replyTexts[comment._id] || '';
        const isReplying = isSubmittingReply[comment._id] || false;
        const isAuthor = session?.user?._id === comment.author._id;
        const isAdmin = session?.user?.role === 'admin';
        const canDelete = isAuthor || isAdmin;

        return (
            <div key={comment._id} className={cn(!isReply && "border-b pb-6", isReply && "pb-4")}>
                 <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2 text-sm flex-wrap">
                         <Link href={`/users/${comment.author.username}`} className="flex-shrink-0">
                             <Avatar className={cn("h-6 w-6", isReply && "h-5 w-5")}>
                                 <AvatarImage src={comment.author.avatar} alt={comment.author.username} />
                                 <AvatarFallback className={cn("text-xs", isReply && "text-[10px]")}>
                                    {getInitials(comment.author.username)}
                                 </AvatarFallback>
                             </Avatar>
                         </Link>
                         <Link
                             href={`/users/${comment.author.username}`}
                             style={{ color: getSafeTitleColor(comment.author.title) }}
                             className="font-medium hover:underline text-xs sm:text-sm"
                         >
                             {comment.author.username}
                         </Link>
                         <span className="text-muted-foreground text-xs">•</span>
                         <Tooltip>
                             <TooltipTrigger asChild>
                                 <span className="text-muted-foreground text-xs cursor-default whitespace-nowrap">
                                    {formatDistanceToNow(new Date(comment.CreatedAt), { addSuffix: true })}
                                 </span>
                             </TooltipTrigger>
                             <TooltipContent>
                                 <p>{format(new Date(comment.CreatedAt), 'MMM dd, yyyy HH:mm')}</p>
                             </TooltipContent>
                         </Tooltip>
                     </div>
                     <div className="flex items-center flex-shrink-0 ml-2">
                         <VoteButtonsComment
                             upvotes={comment.upvotes || []}
                             downvotes={comment.downvotes || []}
                             commentId={comment._id}
                             discussionId={discussion!._id}
                             isReply={isReply}
                         />
                         {session?.user && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href={`/feedback?reportedUserId=${comment.author._id}`}>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-600">
                                            <Flag className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Report this {isReply ? 'reply' : 'comment'}</p>
                                </TooltipContent>
                            </Tooltip>
                         )}
                         {canDelete && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-muted-foreground hover:text-red-600"
                                        disabled={isDeleting[comment._id]}
                                        onClick={() => {
                                            if (isReply && parentCommentId) {
                                                handleDeleteReply(parentCommentId, comment._id);
                                            } else {
                                                handleDeleteComment(comment._id);
                                            }
                                        }}
                                    >
                                        {isDeleting[comment._id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Delete {isReply ? 'reply' : 'comment'}</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                     </div>
                 </div>

                 <p className={cn("text-sm leading-relaxed", isReply ? "pl-[34px]" : "pl-[32px]")}>
                    {comment.text}
                 </p>

                 {!isReply && session?.user && (
                    <div className={cn("mt-3", "pl-[32px]")}>
                         <form onSubmit={(e) => { e.preventDefault(); handleReplySubmit(comment._id); }}>
                            <div className="flex items-start gap-2">
                                <Textarea
                                    value={currentReplyText}
                                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment._id]: e.target.value }))}
                                    placeholder="Write a reply..."
                                    className="h-auto text-sm"
                                    rows={1}
                                    required
                                />
                                <Button type="submit" size="sm" disabled={!currentReplyText || isReplying}>
                                    {isReplying ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
                                    <span className="sr-only">Post Reply</span>
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                 {!isReply && comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 pl-6 border-l-2 border-border/50 space-y-4">
                        {comment.replies.map(reply => renderComment(reply, true, comment._id))}
                    </div>
                 )}
            </div>
        );
    };
    // --- END: MODIFIED RENDER FUNCTION ---

    if (loading) {
        return (
            <div className="container mx-auto p-4 py-8 md:py-12 max-w-4xl">
                <DiscussionPostSkeleton />
                <section className="mt-10">
                     <Skeleton className="h-8 w-40 mb-6 rounded" />
                    <div className="mb-8">
                        <Skeleton className="h-20 w-full rounded mb-2" />
                        <Skeleton className="h-9 w-32 rounded" />
                    </div>
                    <div className="space-y-6">
                         <CommentSkeleton />
                         <CommentSkeleton />
                         <CommentSkeleton />
                    </div>
                </section>
            </div>
        );
    }

    if (!discussion) {
        return <div className="container mx-auto p-4 py-12 text-center text-muted-foreground">Discussion not found.</div>;
    }

    return (
        <TooltipProvider delayDuration={100}>
            <div className="container mx-auto p-4 py-8 md:py-12 max-w-4xl">
                <div className="flex justify-end mb-4">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh} 
                        disabled={refreshing}
                        className="flex items-center gap-1"
                    >
                        <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
                
                <article className="mb-10 pb-8 border-b">
                    {/* --- Block 1: Title and Author Info --- */}
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">{discussion.title}</h1>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                            <Link href={`/users/${discussion.author.username}`}>
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={discussion.author.avatar} alt={discussion.author.username} />
                                    <AvatarFallback>{getInitials(discussion.author.username)}</AvatarFallback>
                                </Avatar>
                            </Link>
                            <span>By{' '}
                                <Link
                                    href={`/users/${discussion.author.username}`}
                                    style={{ color: getSafeTitleColor(discussion.author.title) }}
                                    className="font-medium hover:underline"
                                >
                                    {discussion.author.username}
                                </Link>
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="cursor-default">{formatDistanceToNow(new Date(discussion.CreatedAt), { addSuffix: true })}</span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{format(new Date(discussion.CreatedAt), 'MMM dd, yyyy HH:mm')}</p>
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    </div>

                    {/* --- Block 2: Main Content --- */}
                    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                        <p>{discussion.content}</p>
                    </div>

                    {/* --- Block 3: Action Buttons (Votes & Delete) --- */}
                    <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t">
                        <VoteButtons
                            upvotes={discussion.upvotes}
                            downvotes={discussion.downvotes}
                            discussionId={discussion._id}
                        />
                        {(session?.user?._id === discussion.author._id || session?.user?.role === 'admin') && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={handleDeleteDiscussion}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Delete Discussion</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </article>

                <section>
                    <h2 className="text-xl md:text-2xl font-bold mb-6 flex items-center gap-2">
                        <MessagesSquare className="h-6 w-6 text-primary" />
                        Comments ({discussion.comments?.length ?? 0})
                    </h2>

                     {status === 'authenticated' && session?.user && (
                        <form onSubmit={(e) => { e.preventDefault(); handleCommentSubmit(); }} className="mb-8 flex items-start gap-3">
                            <Avatar className="h-8 w-8 mt-1.5 flex-shrink-0">
                                <AvatarImage src={session.user.image || undefined} alt={session.user.name || "User"}/>
                                <AvatarFallback>{getInitials(session.user.name || session.user.email || '')}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <Label htmlFor="comment-input" className="sr-only">Write your comment</Label>
                                <Textarea
                                    id="comment-input"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Add a comment..."
                                    className="mb-2 min-h-[60px]"
                                    rows={2}
                                    required
                                />
                                <Button type="submit" size="sm" disabled={!commentText.trim() || isSubmittingComment}>
                                    {isSubmittingComment ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SendHorizonal className="mr-2 h-4 w-4" />}
                                    Post Comment
                                </Button>
                            </div>
                        </form>
                    )}
                     {status === 'unauthenticated' && (
                         <p className="mb-8 text-center text-muted-foreground">
                             <Link href="/sign-in" className="text-primary hover:underline">Sign in</Link> to post comments and replies.
                         </p>
                     )}

                    <div className="space-y-6">
                        {discussion.comments && discussion.comments.length > 0 ? (
                            discussion.comments.map(comment => renderComment(comment))
                        ) : (
                             <p className="text-center text-muted-foreground py-8">No comments yet.</p>
                        )}
                    </div>
                </section>
            </div>
        </TooltipProvider>
    );
}