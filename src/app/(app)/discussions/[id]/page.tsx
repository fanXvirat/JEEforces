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
import Link from 'next/link';
import { getTitleColor } from '@/lib/utils';

interface Comment {
  _id: string;
  text: string;
  author: { username: string 
    title: string; avatar: string;  };
  upvotes: string[];
  downvotes: string[];
  CreatedAt: string;
  replies?: Comment[];
}

interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: { username: string 
    title: string; avatar: string; };
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
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  const isReply= false; // Assuming this is a discussion page, not a reply page

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
  const handleReplySubmit = async (commentId: string) => {
    try {
      const response = await axios.post(
        `/api/discussions/${id}/comment/${commentId}/reply`,
        { text: replyTexts[commentId] }
      );
      setDiscussion(response.data.discussion);
      setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
      toast.success('Reply added');
    } catch (error) {
      toast.error('Failed to add reply');
    }
  };

  const handleVote = async (action: 'upvote' | 'downvote', commentId?: string) => {
    if (!session?.user?._id) {
      toast.error('Please sign in to vote');
      return;
    }

    try {
      let updatedDiscussion;
      if (commentId) {
        // Update comment vote
        const response = await axios.put(`/api/discussions/${id}/comment/${commentId}${isReply ? '/reply' : 'upvote'}`, { action });
        setDiscussion(prev => ({
          ...prev!,
          comments: response.data.comments
        }));
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
          <span>By <Link 
                  href={`/users/${discussion.author.username}`}
                  style={{ color: getTitleColor(discussion.author.title) }}
                  className="font-medium hover:underline"
                  >
                  {discussion.author.username}
                  </Link></span>
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
                  <span> 
                  <Link 
                  href={`/users/${comment.author.username}`}
                  style={{ color: getTitleColor(comment.author.title) }}
                  className="font-medium hover:underline"
                  >
                  {comment.author.username}
                  </Link>
                    </span>
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
              <div className="ml-4 mt-4 space-y-2">
                {(comment.replies ?? []).map((reply) => (
                  <div key={reply._id} className="border-l-2 pl-4">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center text-sm text-gray-500">
                        <span>
                        <Link 
                  href={`/users/${reply.author.username}`}
                  style={{ color: getTitleColor(reply.author.title) }}
                  className="font-medium hover:underline"
                  >
                  {reply.author.username}
                  </Link>
                        </span>
                        <span className="mx-2">•</span>
                        <span>{format(new Date(reply.CreatedAt), 'MMM dd, HH:mm')}</span>
                      </div>
                      <VoteButtonsComment
                        upvotes={reply.upvotes}
                        downvotes={reply.downvotes}
                        commentId={reply._id}
                        discussionId={discussion._id}
                        isReply={true}
                      />
                    </div>
                    <p>{reply.text}</p>
                  </div>
                ))}

                {/* Reply Input */}
                {session?.user && (
                  <div className="mt-2">
                    <Textarea
                      value={replyTexts[comment._id] || ''}
                      onChange={(e) => setReplyTexts(prev => ({
                        ...prev,
                        [comment._id]: e.target.value
                      }))}
                      placeholder="Write a reply..."
                      className="mb-2"
                    />
                    <Button onClick={() => handleReplySubmit(comment._id)}>
                      Post Reply
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}