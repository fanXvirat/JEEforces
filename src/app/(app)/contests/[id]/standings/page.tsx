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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
    if (!contestId) {
      setIsLoading(false);
      return;
    }

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
    return (
      <div className="container mx-auto px-4 py-8 text-center text-muted-foreground">
        <p className="text-lg">Contest ID not found.</p>
        <p className="text-sm mt-2">Please navigate from a valid contest page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  // Helper to get initials from username (if AvatarFallback is used)
  const getInitials = (name: string = '') => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('');
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Leaderboard</h2>
        <Link href={`/contests/${contestId}`} className="w-full sm:w-auto">
          <Button variant="outline" className="w-full">
            View Problems
          </Button>
        </Link>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {/* FIX: Ensure no whitespace between <TableRow> and its <TableHead> children */}
            <TableRow><TableHead className="w-[80px] sm:w-[100px]">Rank</TableHead><TableHead className="min-w-[120px]">User</TableHead><TableHead className="min-w-[80px] text-right">Score</TableHead><TableHead className="min-w-[150px] text-right">Last Submission</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.length > 0 ? (
              leaderboard.map((entry) => (
                // FIX: Ensure no whitespace between <TableRow> and its <TableCell> children
                <TableRow key={entry.userId}><TableCell className="font-semibold">{entry.rank}</TableCell><TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={entry.avatar} alt={entry.username} />
                        <AvatarFallback className="text-xs">{getInitials(entry.username)}</AvatarFallback>
                      </Avatar>
                      <Link
                        href={`/users/${entry.username}`}
                        style={{ color: getTitleColor(entry.title) }}
                        className="font-medium hover:underline whitespace-nowrap"
                      >
                        {entry.username}
                      </Link>
                    </div>
                  </TableCell><TableCell className="text-right font-mono">{entry.totalScore}</TableCell><TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(entry.lastSubmission).toLocaleString()}
                  </TableCell></TableRow>
              ))
            ) : (
              // FIX: Ensure no whitespace between <TableRow> and its <TableCell> children
              <TableRow><TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                  <p className="mb-2">No submissions yet for this contest.</p>
                  <p className="text-sm">Be the first to submit!</p>
                </TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}