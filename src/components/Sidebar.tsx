'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { Duration,formatDistanceToNow, intervalToDuration } from 'date-fns';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { getTitleColor } from '@/lib/utils';

interface Contest {
  _id: string;
  title: string;
  startTime: string;
  endTime: string;
  ispublished: boolean;
  participants: Array<{ _id: string }>;
}

interface Discussion {
  _id: string;
  title: string;
  CreatedAt: string;
}

interface LeaderboardUser {
  _id: string;
  username: string;
  rating: number;
  title: string;
}

interface SessionUser {
  _id?: string;
  name?: string | null | undefined;
  email?: string | null | undefined;
  image?: string | null | undefined;
  role?: string;
}

export function Sidebar() {
  const { data: session, status } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [contests, setContests] = useState<Contest[]>([]);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();
  const user = session?.user as SessionUser | undefined;

  const isContestPage = (contestId: string) => {
    return pathname.includes(`/contests/${contestId}`);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contestsRes, discussionsRes, leaderboardRes] = await Promise.all([
          axios.get('/api/contests'),
          axios.get('/api/discussions'),
          axios.get('/api/leaderboard?limit=10')
        ]);
        
        setContests(contestsRes.data);
        setDiscussions(discussionsRes.data.discussions.slice(0, 5));
        setLeaderboard(leaderboardRes.data.leaderboard);
        setLoading(false);
      } catch (error) {
        console.error('Sidebar data fetch error:', error);
      }
    };
    
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getContestStatus = (contest: Contest) => {
    const now = new Date();
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    
    if (now < start) return 'upcoming';
    if (now > end) return 'finished';
    return 'active';
  };

  const handleContestClick = (contest: Contest) => {
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);
    const isRegistered = contest.participants.some(p => p._id.toString() === user?._id?.toString());

    if (now < startTime) {
      toast.error('Contest has not started yet');
      return;
    }

    if (now >= startTime && now < endTime && !isRegistered) {
      toast.error('You must register first to participate');
      return;
    }

    router.push(`/contests/${contest._id}`);
  };

  const ContestTimer = ({ contest }: { contest: Contest }) => {
    const [timeLeft, setTimeLeft] = useState<Duration>({});

    useEffect(() => {
      const updateTimer = () => {
        const now = new Date();
        const target = getContestStatus(contest) === 'upcoming' 
          ? new Date(contest.startTime)
          : new Date(contest.endTime);
          
        setTimeLeft(intervalToDuration({
          start: now,
          end: target
        }));
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }, [contest]);

    const status = getContestStatus(contest);
    const prefix = status === 'upcoming' ? 'Starts in' : 
                   status === 'active' ? 'Ends in' : 'Contest Ended';

    return (
      <div className="text-sm">
        <div className="font-medium">{prefix}</div>
        {status !== 'finished' && (
          <div className="text-muted-foreground">
            {`${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m`}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`relative h-full ${isCollapsed ? 'w-[50px]' : 'w-[300px]'} transition-all`}>
      <Button 
        variant="ghost" 
        size="sm" 
        className="absolute -right-4 top-4 rounded-full p-2"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
      </Button>

      {!isCollapsed && (
        <div className="space-y-4 p-2">
          {/* Contests Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Upcoming and Active Contests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-[60px] w-full rounded-lg" />
                ))
              ) : contests.filter(c => c.ispublished && getContestStatus(c) !== 'finished').map(contest => {
                const status = getContestStatus(contest);
                
                return (
                  <div 
                    key={contest._id}
                    onClick={() => handleContestClick(contest)}
                    className={`p-3 rounded-lg hover:bg-accent cursor-pointer ${
                      isContestPage(contest._id) ? 'border-2 border-primary' : 'border'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{contest.title}</div>
                        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
                          {status.toUpperCase()}
                        </Badge>
                      </div>
                      <ContestTimer contest={contest} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Leaderboard Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Top Performers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))
              ) : leaderboard.map((user, index) => (
                <div key={user._id} className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{index + 1}.</span>
                    <span><Link 
                  href={`/users/${user.username}`}
                  style={{ color: getTitleColor(user.title) }}
                  className="font-medium hover:underline"
                  >
                  {user.username}
                  </Link></span>
                  </div>
                  <Badge variant="outline">Rating: {user.rating}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Discussions Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Recent Discussions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full rounded" />
                ))
              ) : discussions.map(discussion => (
                <Link 
                  key={discussion._id} 
                  href={`/discussions/${discussion._id}`}
                  className="block text-sm hover:underline"
                >
                  <div className="truncate">{discussion.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(discussion.CreatedAt))} ago
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}