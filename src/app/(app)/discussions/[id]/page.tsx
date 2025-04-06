'use client';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { VoteButtons } from '@/components/Upvote';
import { VoteButtonsComment } from '@/components/Upvotecomment';

interface Comment {
  _id: string;
  text: string;
  author: { username: string };
  upvotes: string[];
  downvotes: string[];
  CreatedAt: string;
  replies?: Comment[];
}

interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: { username: string };
  upvotes: string[];
  downvotes: string[];
  comments: Comment[];
  CreatedAt: string;
}

export default function DiscussionPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscussion = async () => {
      try {
        const response = await axios.get(`/api/discussions/${id}`);
        setDiscussion(response.data.discussion);
      } catch (error) {
        console.error('Error fetching discussion:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscussion();
  }, [id]);

  const handleVote = async (action: 'upvote' | 'downvote', commentId?: string) => {
    if (!session?.user?._id) {
      toast.error('Please sign in to vote');
      return;
    }

    try {
      let updatedDiscussion;
      if (commentId) {
        // Update comment vote
        const response = await axios.put(`/api/discussions/${id}/comment/${commentId}`, { action });
        updatedDiscussion = response.data.discussion;
      } else {
        // Update discussion vote
        const response = await axios.put(`/api/discussions/${id}`, { action });
        updatedDiscussion = response.data.discussion;
      }
      setDiscussion(updatedDiscussion);
    } catch (error) {
      toast.error('Failed to update vote');
      console.error('Voting error:', error);
    }
  };

  const handleCommentSubmit = async () => {
    try {
      const response = await axios.post(`/api/discussions/${id}/comment`, {
        text: commentText,
      });
      setDiscussion(response.data.discussion);
      setCommentText('');
      toast.success('Comment added');
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!discussion) {
    return <div className="container mx-auto p-4">Discussion not found</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <article className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold">{discussion.title}</h1>
          <VoteButtons
            upvotes={discussion.upvotes}
            downvotes={discussion.downvotes}
            discussionId={discussion._id}
          />
        </div>
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <span>By {discussion.author.username}</span>
          <span className="mx-2">•</span>
          <span>{format(new Date(discussion.CreatedAt), 'MMM dd, yyyy HH:mm')}</span>
        </div>
        <p className="whitespace-pre-wrap">{discussion.content}</p>
      </article>

      <section className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Comments</h2>
        {session?.user && (
          <div className="mb-6">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write your comment..."
              className="mb-2"
            />
            <Button onClick={handleCommentSubmit}>Post Comment</Button>
          </div>
        )}

        <div className="space-y-4">
          {discussion.comments.map((comment) => (
            <div key={comment._id} className="border rounded p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center text-sm text-gray-500">
                  <span>{comment.author.username}</span>
                  <span className="mx-2">•</span>
                  <span>{format(new Date(comment.CreatedAt), 'MMM dd, HH:mm')}</span>
                </div>
                <VoteButtonsComment
                          upvotes={comment.upvotes || []}
                          downvotes={comment.downvotes || []}
                          commentId={comment._id} discussionId={discussion._id}                          />
              </div>
              <p>{comment.text}</p>
              
              {/* Reply section would go here */}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}