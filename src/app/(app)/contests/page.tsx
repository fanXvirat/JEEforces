'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import axios, { AxiosError } from 'axios';
import { Loader2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Link from 'next/link';

interface Contest {
  _id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  ispublished: boolean;
  participants: string[];
}

const ContestListPage = () => {
  const { data: session, status } = useSession();
  const [contests, setContests] = useState<Contest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch contests from API
  const fetchContests = useCallback(async () => {
    if (!session?.user) return; // Ensure user is logged in

    setIsLoading(true);
    try {
      const response = await axios.get<Contest[]>('/api/contests');
      setContests(response.data);
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(axiosError.response?.data?.message || 'Failed to fetch contests');
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (session?.user) fetchContests();
  }, [session, fetchContests]);

  if (status === 'loading') return <div>Loading...</div>;
  if (!session?.user) return <div>Unauthorized</div>;

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">All Contests</h1>

      {/* Create Contest Button (Admin Only) */}
      {session.user.role === 'admin' && (
        <Link href="/contests/create">
          <Button className="mb-6">Create New Contest</Button>
        </Link>
      )}

      {/* Contest Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {contests.map((contest) => (
          <Card key={contest._id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{contest.title}</CardTitle>
              <CardDescription>
                {new Date(contest.startTime).toLocaleDateString()} - 
                {new Date(contest.endTime).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <span className={`badge ${contest.ispublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'} px-2 py-1 rounded-full text-sm`}>
                  {contest.ispublished ? 'Published' : 'Draft'}
                </span>
                {session.user.role === 'admin' && (
                  <span className="text-sm text-muted-foreground">
                    {contest.participants.length} participants
                  </span>
                )}
              </div>

              {/* Register Button for Active Contests */}
              {new Date(contest.startTime) <= new Date() && new Date(contest.endTime) >= new Date() && (
                <Button
                  className="w-full mt-4"
                  onClick={async () => {
                    try {
                      await axios.post(`/api/contests/${contest._id}`);
                      toast.success('Registered successfully!');
                      fetchContests(); // Refresh the list
                    } catch (error) {
                      const axiosError = error as AxiosError<{ message: string }>;
                      toast.error(axiosError.response?.data?.message || 'Failed to register');
                    }
                  }}
                >
                  Register Now
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Refresh Button */}
      <Button
        className="mt-6"
        variant="outline"
        onClick={(e) => {
          e.preventDefault();
          fetchContests();
        }}
      >
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default ContestListPage;