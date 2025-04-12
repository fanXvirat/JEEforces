'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import axios, { AxiosError } from 'axios';
import { Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { UserType } from '@/types/User';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';

const Page = () => {
  const { data: session, status } = useSession();

  // Define userDetails state with correct type
  const [userDetails, setUserDetails] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user details from API
  const fetchUserDetails = useCallback(async () => {
    if (!session?.user) return; // Ensure user is logged in

    setIsLoading(true);
    try {
      const response = await axios.get<UserType>(`/api/user`);
      setUserDetails(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to fetch user details');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

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
          <h2 className="text-xl font-semibold">{userDetails?.username || 'Guest'}</h2>
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

      {/* Contests Participated */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Contests Participated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {userDetails?.contestsParticipated?.map((contestId) => (
              <div key={contestId} className="text-sm">
                Contest ID: {contestId}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />
    </div>
  );
};

export default Page;