'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: { username: string };
  upvotes: string[];
  downvotes: string[];
  comments: any[];
  CreatedAt: string;
  isFeatured: boolean;
}

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [featuredDiscussions, setFeaturedDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    contests: 0,
    problems: 0,
    users: 0
  });
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, contestsRes, problemsRes, usersRes] = await Promise.all([
          axios.get('/api/discussions?featured=true'),
          axios.get('/api/contests'),
          axios.get('/api/problems'),
          axios.get('/api/user/count')
        ]);

        setFeaturedDiscussions(featuredRes.data.discussions);
        setStats({
          contests: contestsRes.data.length,
          problems: problemsRes.data.length,
          users: usersRes.data.count
        });
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFeature = async (id: string) => {
    try {
      await axios.put(`/api/discussions/${id}/toggle-feature`);
      setFeaturedDiscussions(prev => 
        prev.map(d => d._id === id ? {...d, isFeatured: !d.isFeatured} : d)
      );
      toast.success('Discussion feature status updated');
    } catch (error) {
      toast.error('Failed to update feature status');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      {/* Hero Section */}
      <section className="text-center py-16 mb-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Master JEE with Peer Power
        </h1>
        <p className="text-xl mb-8 opacity-90">
          Join India's largest community for JEE preparation - Solve, Discuss, Conquer!
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/problems">
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            Start Practicing
          </Button>
          </Link>
          <Link href="/sign-up">
          <Button size="lg" variant="outline" className="text-black border-white">
            Join Community
          </Button>
          </Link>
        </div>
      </section>

      {/* Featured Discussions Grid */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">
            Announcements
          </h2>
          {session?.user?.role === 'admin' && (
            <Link href="/discussions">
              <Button variant="ghost" className="text-blue-600">
                Manage Curations
              </Button>
            </Link>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredDiscussions.map((discussion) => (
            <Card key={discussion._id} className="relative group hover:shadow-xl transition-all">
              {session?.user?.role === 'admin' && (
                <div className="absolute top-2 right-2">
                  <Button
                    size="sm"
                    variant={discussion.isFeatured ? 'default' : 'outline'}
                    onClick={() => toggleFeature(discussion._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {discussion.isFeatured ? 'Pinned' : 'Pin'}
                  </Button>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-xl">{discussion.title}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>By {discussion.author.username}</span>
                  <span className="mx-2">•</span>
                  <span>{format(new Date(discussion.CreatedAt), 'MMM dd')}</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-3 text-gray-600 dark:text-gray-300">
                  {discussion.content}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <Button
                  variant="link"
                  className="text-blue-600 p-0"
                  onClick={() => router.push(`/discussions/${discussion._id}`)}
                >
                  Continue Reading →
                </Button>
                <VoteButtons
                  upvotes={discussion.upvotes}
                  downvotes={discussion.downvotes}
                  discussionId={discussion._id}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid md:grid-cols-3 gap-6 mb-16">
        <div className="border p-6 rounded-xl text-center">
          <div className="text-4xl font-bold mb-2">{stats.contests}</div>
          <div className="text-muted-foreground">Contests</div>
        </div>
        <div className="border p-6 rounded-xl text-center">
          <div className="text-4xl font-bold mb-2">{stats.problems}</div>
          <div className="text-muted-foreground">Practice Problems</div>
        </div>
        <div className="border p-6 rounded-xl text-center">
          <div className="text-4xl font-bold mb-2">{stats.users}</div>
          <div className="text-muted-foreground">Users</div>
        </div>
    </section>
    </div>
  );
}