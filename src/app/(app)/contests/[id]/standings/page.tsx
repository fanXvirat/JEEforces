'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getTitleColor } from '@/lib/utils';

interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  totalScore: number;
  lastSubmission: string;
  rank: number;
  title: string;
}

export default function Leaderboard() {
  const params = useParams();
  const contestId = params?.id as string;
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!contestId) return;

    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`/api/contests/${contestId}/leaderboard`);
        setLeaderboard(res.data);
      } catch (error) {
        toast.error('Failed to fetch leaderboard');
        console.error('Leaderboard error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [contestId]);

  if (!contestId) {
    return <div className="text-center mt-8">Contest ID not found</div>;
  }

  if (isLoading) {
    return (
      <div className="flex justify-center mt-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mt-8 container mx-auto px-4">
      <h2 className="text-2xl font-bold mb-6">Leaderboard</h2>
      <Link href={`/contests/${contestId}`}>
      <Button variant="outline" className="mb-4">
        Problems
      </Button>
      </Link>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Rank</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Last Submission</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.length > 0 ? (
              leaderboard.map((entry) => (
                <TableRow key={entry.userId}>
                  <TableCell>{entry.rank}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    {entry.avatar && (
                      <img 
                        src={entry.avatar} 
                        alt={entry.username} 
                        className="h-8 w-8 rounded-full"
                      />
                    )}
                    <span><Link 
                      href={`/users/${entry.username}`}
                      style={{ color: getTitleColor(entry.title) }}
                      className="font-medium hover:underline"
                    >
                      {entry.username}
                    </Link>
                    </span>
                  </TableCell>
                  <TableCell>{entry.totalScore}</TableCell>
                  <TableCell>
                    {new Date(entry.lastSubmission).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">
                  No submissions yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}