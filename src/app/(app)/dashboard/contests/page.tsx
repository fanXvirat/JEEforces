'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface Contest {
  _id: string;
  name: string;
  date: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}

interface UserResponse {
  contestsParticipated: Contest[];
}

const ContestsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user) return;

    const fetchUserData = async () => {
      try {
        const response = await axios.get<UserResponse>('/api/user');
        setContests(response.data.contestsParticipated);
      } catch (error) {
        const axiosError = error as AxiosError<{ message: string }>;
        toast.error(axiosError.response?.data?.message || 'Failed to fetch contests');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [session]);

  if (status === 'loading') return <div>Loading...</div>;
  if (!session?.user) return <div>Unauthorized</div>;

  return (
    <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
      <h1 className="text-4xl font-bold mb-4">Your Contests</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Contests You Participated In</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : contests.length === 0 ? (
            <p className="text-gray-500 text-center">No contests participated yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contests.map((contest) => (
                  <TableRow key={contest._id}>
                    <TableCell>{contest.name}</TableCell>
                    <TableCell>{new Date(contest.date).toLocaleDateString()}</TableCell>
                    <TableCell>{contest.status}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/contests/${contest._id}`)}
                      >
                        View Contest
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContestsPage;
