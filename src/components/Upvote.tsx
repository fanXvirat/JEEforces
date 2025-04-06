'use client';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';

export function VoteButtons({
  upvotes,
  downvotes,
  discussionId,
}: {
  upvotes: string[];
  downvotes: string[];
  discussionId: string;
}) {
  const { data: session } = useSession();
  const userId = session?.user?._id;
  const [optimisticUpvotes, setOptimisticUpvotes] = useState(upvotes);
  const [optimisticDownvotes, setOptimisticDownvotes] = useState(downvotes);
  const [isLoading, setIsLoading] = useState(false);

  const handleVote = async (action: 'upvote' | 'downvote') => {
    if (!userId) {
      toast.error('Please sign in to vote');
      return;
    }

    setIsLoading(true);
    // Declare previous votes outside the try block
    const previousUpvotes = [...optimisticUpvotes];
    const previousDownvotes = [...optimisticDownvotes];
    try {
      // Optimistic update

      if (action === 'upvote') {
        setOptimisticUpvotes(prev => 
          prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
        setOptimisticDownvotes(prev => prev.filter(id => id !== userId));
      } else {
        setOptimisticDownvotes(prev => 
          prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
        setOptimisticUpvotes(prev => prev.filter(id => id !== userId));
      }

      // API call
      await axios.put(`/api/discussions/${discussionId}/upvote`, { action });

    } catch (error) {
      // Revert on error
      setOptimisticUpvotes(previousUpvotes);
      setOptimisticDownvotes(previousDownvotes);
      toast.error('Failed to update vote');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('upvote')}
        disabled={isLoading}
        className={cn(
          optimisticUpvotes.includes(userId!) && 'text-green-600',
          isLoading && 'opacity-50'
        )}
      >
        ↑ {optimisticUpvotes.length}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleVote('downvote')}
        disabled={isLoading}
        className={cn(
          optimisticDownvotes.includes(userId!) && 'text-red-600',
          isLoading && 'opacity-50'
        )}
      >
        ↓ {optimisticDownvotes.length}
      </Button>
    </div>
  );
}