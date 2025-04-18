'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import axios, { AxiosError } from 'axios';
import { Loader2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface SessionUser {
  _id?: string;
  name?: string | null | undefined;
  email?: string | null | undefined;
  image?: string | null | undefined;
  role?: string;
}

interface Contest {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  ispublished: boolean;
  participants: Array<{ _id: string }>;
}

const ContestListPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState<string | null>(null);
  const [isUpdatingRatings, setIsUpdatingRatings] = useState<string | null>(null);

  const user = session?.user as SessionUser | undefined;

  const fetchContests = useCallback(async (showLoading = true) => {
    if (status !== 'authenticated' || !user) {
        if (showLoading) setIsLoading(false);
        return;
    }

    if (showLoading) setIsLoading(true);
    try {
      const response = await axios.get<Contest[]>('/api/contests');
      setContests(response.data.filter(c => c.ispublished || user?.role === 'admin'));
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to fetch contests');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [status, user]);

  useEffect(() => {
      if (status === 'authenticated' && user) {
          fetchContests();
      } else if (status !== 'loading') {
          setIsLoading(false);
      }
  }, [status, user, fetchContests]);

  const handleRegister = async (contestId: string) => {
    if (!user?._id || isRegistering) return;
  
    setIsRegistering(contestId);
    try {
      const response = await axios.post(`/api/contests/${contestId}/register`);
      toast.success(response.data.message || 'Registered successfully!');
      
      // Update the contests state to reflect the registration
      setContests(prevContests => 
        prevContests.map(contest => {
          if (contest._id === contestId) {
            return {
              ...contest,
              participants: [...contest.participants, { _id: user._id! }], // Add the user's ID (non-null assertion)
            };
          }
          return contest;
        })
      );
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      toast.error(axiosError.response?.data?.error || 'Failed to register');
    } finally {
      setIsRegistering(null);
    }
  };
  const handleUpdateRatings = async (contestId: string) => {
    if (!user?._id || isUpdatingRatings) return;
  
    setIsUpdatingRatings(contestId);
    try {
      const res = await axios.post(`/api/contests/${contestId}/update-ratings`);
      toast.success(res.data.message || 'Ratings updated successfully');
    } catch (error) {
      const axiosError = error as AxiosError<{ error: string }>;
      toast.error(axiosError.response?.data?.error || 'Failed to update ratings');
    } finally {
      setIsUpdatingRatings(null);
    }
  };
  const renderContestButton = (contest: Contest) => {
    if (!user?._id) return null;
  
    const now = new Date();
    const startTime = new Date(contest.startTime);
    const endTime = new Date(contest.endTime);
    
    // Convert both to strings for reliable comparison
    const userIdString = user._id.toString();
    const isRegistered = contest.participants.some(p => p._id.toString() === userIdString);
  
    const isUpcoming = now < startTime;
    const isRunning = now >= startTime && now < endTime;
    const isEnded = now >= endTime;
  
    if (isUpcoming) {
      if (isRegistered) {
        return <Button className="w-full mt-4" disabled variant="outline">Registered</Button>;
      } else {
        return (
          <Button
            className="w-full mt-4"
            onClick={() => handleRegister(contest._id)}
            disabled={isRegistering === contest._id}
          >
            {isRegistering === contest._id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Register
          </Button>
        );
      }
    } else if (isRunning) {
      if (isRegistered) {
        return (
          <Button
            className="w-full mt-4"
            onClick={() => router.push(`/contests/${contest._id}`)}
          >
            Enter Contest
          </Button>
        );
      } else {
         return <Button className="w-full mt-4" disabled variant="secondary">Registration Closed</Button>;
      }
    } else if (isEnded) {
      return (
         <Button
            className="w-full mt-4"
            variant="secondary"
            onClick={() => router.push(`/contests/${contest._id}/standings`)}
          >
            View Results
          </Button>
      );
    }
    return null;
  };

  if (status === 'loading' || (status === 'authenticated' && isLoading && contests.length === 0)) {
      return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (status === 'unauthenticated') {
      return <div className="text-center mt-10">Please <Link href="/sign-in" className="text-blue-600 hover:underline">Sign In</Link> to view contests.</div>;
  }

  if (!user) {
      return <div className="text-center mt-10">Could not load user data. Please try refreshing.</div>;
  }

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold">All Contests</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchContests()}
            disabled={isLoading}
            title="Refresh Contests"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
      </div>

      {user.role === 'admin' && (
        <Link href="/contests/create">
          <Button className="mb-6">Create New Contest</Button>
        </Link>
      )}

      {contests.length === 0 && !isLoading ? (
           <p className="text-center text-gray-500 mt-10">No contests found.</p>
        ) : (
           <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {contests.map((contest) =>{
              const now = new Date();
              const startTime = new Date(contest.startTime);
              const endTime = new Date(contest.endTime);
              const isEnded = now >= endTime;
              return (
              <Card key={contest._id} className="hover:shadow-lg transition-shadow flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <CardTitle>{contest.title}</CardTitle>
                    <CardDescription>
                      Starts: {new Date(contest.startTime).toLocaleString()} <br/>
                      Ends: {new Date(contest.endTime).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent >
                    <div className="flex justify-between items-center mb-4">
                       <span className={`badge ${
                            new Date() < new Date(contest.startTime) ? 'bg-blue-100 text-blue-800' :
                            new Date() >= new Date(contest.startTime) && new Date() < new Date(contest.endTime) ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                        } px-2 py-1 rounded-full text-xs font-medium`}>
                            {
                                new Date() < new Date(contest.startTime) ? 'Upcoming' :
                                new Date() >= new Date(contest.startTime) && new Date() < new Date(contest.endTime) ? 'Running' :
                                'Ended'
                            }
                        </span>

                      {user.role === 'admin' && (
                        <span className="text-sm text-muted-foreground">
                          {contest.participants.length} registered
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-3">{contest.description}</p>

                  </CardContent>
                </div>
                <CardContent>
                     {renderContestButton(contest)}
                </CardContent>
                <CardContent className="flex flex-col gap-2">
                
            
                {user?.role === 'admin' && isEnded && (
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateRatings(contest._id)}
                    disabled={isUpdatingRatings === contest._id}
                  >
                    {isUpdatingRatings === contest._id && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Ratings
                  </Button>
                )}
              </CardContent>
              </Card>
            )})}
          </div>
        )
      }
    </div>
  );
};

export default ContestListPage;