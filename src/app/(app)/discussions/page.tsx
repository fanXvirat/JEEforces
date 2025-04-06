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

interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: { username: string };
  upvotes: string[];
  downvotes: string[];
  comments: any[];
  CreatedAt: string;
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
            <CardHeader>
              <CardTitle>{discussion.title}</CardTitle>
              <div className="flex items-center text-sm text-gray-500">
                <span>By {discussion.author.username}</span>
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