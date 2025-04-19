'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { VoteButtons } from '@/components/Upvote';
import { toast } from 'sonner';
import { Star} from 'lucide-react';
import { getTitleColor } from '@/lib/utils';

interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: { username: string 
    title: string; avatar: string; };
  upvotes: string[];
  downvotes: string[];
  comments: any[];
  CreatedAt: string;
  isFeatured: boolean;
}


export default function DiscussionsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        const response = await axios.get('/api/discussions');
        setDiscussions(response.data.discussions);
      } catch (error) {
        console.error('Error fetching discussions:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscussions();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  const toggleFeatured = async (discussionId: string) => {
    try {
      const response = await axios.put(`/api/discussions/${discussionId}/toggle-feature`);
      setDiscussions(prev => 
        prev.map(d => 
          d._id === discussionId ? { ...d, isFeatured: response.data.discussion.isFeatured } : d
        )
      );
      toast.success(`Discussion ${response.data.discussion.isFeatured ? 'pinned' : 'unpinned'}`);
    } catch (error) {
      toast.error('Failed to update feature status');
      console.error('Toggle feature error:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Discussions</h1>
        {session?.user && (
          <Link href="/discussions/create">
            <Button>Create New Discussion</Button>
          </Link>
        )}
      </div>

      <div className="space-y-4">
        {discussions.map((discussion) => (
          <Card key={discussion._id} className="hover:shadow-lg transition-shadow">
            {session?.user?.role === 'admin' && (
              <div className="relative top-2 right-2">
                <Button
                  size="sm"
                  variant={discussion.isFeatured ? 'default' : 'outline'}
                  onClick={() => toggleFeatured(discussion._id)}
                  className="gap-1"
                >
                  {discussion.isFeatured ? (
                    <>
                      <Star className="h-4 w-4" />
                      <span className="ml-1">Pinned</span>
                    </>
                  ) : (
                    'Pin'
                  )}
                </Button>
              </div>
            )}
            <CardHeader>
              <CardTitle>{discussion.title}</CardTitle>
              <div className="flex items-center text-sm text-gray-500">
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
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3">{discussion.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="flex gap-4">
                <Button
                  variant="ghost"
                  onClick={() => router.push(`/discussions/${discussion._id}`)}
                >
                  View Discussion
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <VoteButtons
                    upvotes={discussion.upvotes}
                    downvotes={discussion.downvotes}
                    discussionId={discussion._id}
                />
                <span className="text-sm">
                  {discussion.comments.length} comments
                </span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}