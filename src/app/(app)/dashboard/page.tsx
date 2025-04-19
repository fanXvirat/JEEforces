'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback, JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from 'react';
import { Button } from '@/components/ui/button';
import axios, { AxiosError } from 'axios';
import { Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { UserType } from '@/types/User';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { RatingChart } from '@/components/rating-chart';
import { getTitleColor } from '@/lib/utils';
interface UserStats {
  ratingHistory: Array<{
    newrating: number;
    timestamp: string;
    contestTitle: string;
  }>;
  contestsJoined: Array<{
    _id: string;
    title: string;
    startTime: string;
  }>;
}

const Page = () => {
  const { data: session, status } = useSession();

  // Define userDetails state with correct type
  const [userDetails, setUserDetails] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null); // Adjust type as needed

  // Fetch user details from API
  const fetchUserDetails = useCallback(async () => {
    if (!session?.user) return;

    setIsLoading(true);
    try {
      // Fetch basic user details
      const userResponse = await axios.get<UserType>('/api/user');
      setUserDetails(userResponse.data);

      // Fetch rating history and contests participated
      const statsResponse = await axios.get<UserStats>('/api/user/stats');
      setStats(statsResponse.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  }, [session]);
  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get('/api/user/stats');
      setStats(res.data);
    } catch (error) {
      toast.error('Failed to fetch user stats');
    }
  }, []);

  useEffect(() => {
    if (session?.user) fetchUserDetails();
  }, [session, fetchUserDetails]);

  if (status === 'loading') return <div>Loading...</div>;
  if (!session?.user) return <div>Unauthorized</div>;

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">User Dashboard</h1>
      <Link href="/dashboard/settings">
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      

      {/* Profile Section */}
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={userDetails?.avatar || '/default-avatar.png'}
          alt="User Avatar"
          className="w-16 h-16 rounded-full"
        />
        <div>
          <h2 className="text-xl font-semibold" style={{ color: getTitleColor(userDetails?.title || 'newbie') }}>{userDetails?.username || 'Guest'}</h2>
          <p className="text-sm font-semibold" style={{ color: getTitleColor(userDetails?.title || 'newbie') }}>{userDetails?.title || 'newbie'}</p>
          <p className="text-gray-600">{userDetails?.email || 'No email provided'}</p>
        </div>
      </div>

      {/* User Details */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>User Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Institute</p>
              <p className="text-xl font-bold">{userDetails?.institute || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Year of Study</p>
              <p className="text-xl font-bold">{userDetails?.yearofstudy || 'Not provided'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Stats */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Your Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Rating</p>
              <p className="text-2xl font-bold">{userDetails?.rating || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Problems Solved</p>
              <p className="text-2xl font-bold">{userDetails?.problemsSolved || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Accuracy</p>
              <Progress value={75} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>
      
  <Card className="mb-4">
        <CardHeader>
          <CardTitle>Rating History</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.ratingHistory?.length ? (
            <RatingChart 
              data={stats.ratingHistory.map((rh: { newrating: any; timestamp: any; contestTitle: any; }) => ({
                newrating: rh.newrating,
                timestamp: rh.timestamp,
                contestTitle: rh.contestTitle
              }))}
            />
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No rating history available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Contests Participated Card */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Contests Participated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {stats?.contestsJoined?.length ? (
              stats.contestsJoined.map((contest: { _id: Key | null | undefined; title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; startTime: string | number | Date; }) => (
                <Link 
                  key={contest._id} 
                  href={`/contests/${contest._id}`}
                  className="block p-2 hover:bg-gray-50 rounded transition-colors"
                >
                  <div className="text-sm font-medium text-primary">
                    {contest.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(contest.startTime).toLocaleDateString()}
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No contests participated yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>     
        


      <Separator />
    </div>
  );
};

export default Page;