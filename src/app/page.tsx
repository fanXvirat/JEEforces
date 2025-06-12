'use client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Loader2, ArrowRight, Rocket, Users, Megaphone, Trophy, BookOpenCheck, Pin } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { VoteButtons } from '@/components/Upvote';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from 'next/link';
import { getTitleColor } from '@/lib/utils';
import { Balancer } from 'react-wrap-balancer';
import { CoolerHeroSection } from '@/components/HeroSection';
interface Discussion {
  _id: string;
  title: string;
  content: string;
  author: {
    username: string;
    title: string;
    avatar?: string;
  };
  upvotes: string[];
  downvotes: string[];
  comments: any[];
  CreatedAt: string;
  isFeatured: boolean;
}

const getInitials = (name: string = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');
};

// --- NEW: Phrases for the animated hero title ---
const heroTitles = [
    "Master JEE with Peer Power",
    "Compete in Rated Contests",
    "Solve Story-Based Problems",
    "From Mains to Olympiads",
    "Conquer Physics, Chem & Maths"
];

export default function HomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [featuredDiscussions, setFeaturedDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    contests: 0,
    problems: 0,
    users: 0,
  });

  // --- NEW: State for the animation ---
  const [currentTitleIndex, setCurrentTitleIndex] = useState(0);

  // --- NEW: useEffect hook to handle the title animation ---
  useEffect(() => {
    const interval = setInterval(() => {
        setCurrentTitleIndex(prevIndex => (prevIndex + 1) % heroTitles.length);
    }, 3000); // Switch text every 3 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [featuredRes, contestsRes, problemsRes, usersRes] = await Promise.all([
          axios.get('/api/discussions?featured=true'),
          axios.get('/api/contests'),
          axios.get('/api/problems'),
          axios.get('/api/user/count'),
        ]);

        setFeaturedDiscussions(featuredRes.data.discussions || []);
        setStats({
          contests: contestsRes.data?.length ?? 0,
          problems: problemsRes.data?.length ?? 0,
          users: usersRes.data?.count ?? 0,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load page data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleFeature = async (id: string) => {
    // ... (This function remains unchanged)
    try {
      const originalDiscussions = [...featuredDiscussions];
      setFeaturedDiscussions(prev =>
        prev.map(d => d._id === id ? { ...d, isFeatured: !d.isFeatured } : d)
      );

      await axios.put(`/api/discussions/${id}/toggle-feature`);
      toast.success('Discussion feature status updated successfully!');
    } catch (error) {
      console.error('Failed to update feature status:', error);
      toast.error('Failed to update feature status. Please try again.');
      setFeaturedDiscussions(prev =>
        prev.map(d => d._id === id ? { ...d, isFeatured: !d.isFeatured } : d)
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main>
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* --- MODIFIED: Hero Section with Animated Title --- */}
      <CoolerHeroSection />

      {/* --- The rest of your page remains unchanged --- */}
      <section className="mb-16 md:mb-24">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 px-4 sm:px-0">
          <div className="flex items-center gap-3 mb-4 sm:mb-0">
             <Megaphone className="h-8 w-8 text-primary" />
             <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Announcements & Pinned Posts
             </h2>
          </div>
          {session?.user?.role === 'admin' && (
            <Link href="/discussions">
              <Button variant="outline" size="sm">
                Manage Curations
              </Button>
            </Link>
          )}
        </div>

        {featuredDiscussions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDiscussions.map((discussion) => (
              <Card key={discussion._id} className="relative group hover:shadow-lg hover:border-primary/50 transition-all duration-200 flex flex-col">
                {session?.user?.role === 'admin' && (
                  <div className="absolute top-3 right-3 z-10">
                    <Button
                      size="icon"
                      variant={discussion.isFeatured ? 'secondary' : 'outline'}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFeature(discussion._id);
                      }}
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      aria-label={discussion.isFeatured ? 'Unpin Post' : 'Pin Post'}
                    >
                      <Pin className={`h-4 w-4 ${discussion.isFeatured ? 'text-primary' : ''}`} />
                    </Button>
                  </div>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-base sm:text-lg font-semibold leading-snug mb-2 pr-10">
                      <Link href={`/discussions/${discussion._id}`} className="hover:text-primary transition-colors duration-200 line-clamp-2">
                        {discussion.title}
                      </Link>
                  </CardTitle>
                  <CardDescription className="flex items-center text-xs text-muted-foreground">
                    <Avatar className="h-5 w-5 mr-2">
                      <AvatarImage src={discussion.author.avatar} alt={discussion.author.username} />
                      <AvatarFallback className="text-xs">{getInitials(discussion.author.username)}</AvatarFallback>
                    </Avatar>
                    <span>By{' '}
                       <Link
                          href={`/users/${discussion.author.username}`}
                          style={{ color: getTitleColor(discussion.author.title) }}
                          className="font-medium hover:underline transition-colors duration-200"
                          >
                          {discussion.author.username}
                       </Link>
                    </span>
                    <span className="mx-1.5">•</span>
                    <span>{format(new Date(discussion.CreatedAt), 'MMM dd, yyyy')}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow pb-4">
                  <p className="text-sm line-clamp-3 text-muted-foreground">
                    {discussion.content}
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between items-center pt-4 border-t">
                   <Button
                      variant="ghost"
                      size="sm"
                      className="text-primary hover:text-primary/80 p-0 h-auto"
                      onClick={() => router.push(`/discussions/${discussion._id}`)}
                      >
                      Continue Reading <ArrowRight className="ml-1 h-4 w-4" />
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
        ) : (
            <div className="text-center text-muted-foreground py-10 border rounded-lg mx-4 sm:mx-0">
                No announcements or pinned posts found.
            </div>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <Card className="text-center hover:shadow-md transition-shadow duration-200">
          <CardHeader className="items-center pb-2">
             <Trophy className="h-8 w-8 mb-2 text-yellow-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Contests Hosted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl font-bold">{stats.contests}</div>
          </CardContent>
        </Card>
        <Card className="text-center hover:shadow-md transition-shadow duration-200">
          <CardHeader className="items-center pb-2">
            <BookOpenCheck className="h-8 w-8 mb-2 text-blue-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Practice Problems</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl font-bold">{stats.problems}</div>
          </CardContent>
        </Card>
        <Card className="text-center hover:shadow-md transition-shadow duration-200">
          <CardHeader className="items-center pb-2">
            <Users className="h-8 w-8 mb-2 text-green-500" />
            <CardTitle className="text-sm font-medium text-muted-foreground">Registered Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl sm:text-4xl font-bold">{stats.users}</div>
          </CardContent>
        </Card>
      </section>
    </div>
    </main>
  );
}