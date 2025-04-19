'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { getTitleColor } from '@/lib/utils';


interface LeaderboardUser {
  _id: string;
  username: string;
  avatar?: string;
  rating: number;
  title: string;
  institute?: string;
  problemsSolved: number;
  accuracy: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    ratingRange: [0, 3000] as [number, number]
  });

  const loadData = async (reset = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        search: filters.search,
        minRating: filters.ratingRange[0].toString(),
        maxRating: filters.ratingRange[1].toString()
      });

      const response = await fetch(`/api/leaderboard?${params}`);
      const { success, leaderboard: data, pagination } = await response.json();

      if (success) {
        setLeaderboard(prev => reset ? data : [...prev, ...data]);
        setHasMore(pagination.page < pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(true);
  }, [filters]);

  useEffect(() => {
    if (page > 1) loadData();
  }, [page]);

  return (
    <div className="container mx-auto p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">JEEforces Leaderboard</h1>

      {/* Filters Section */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            placeholder="Search users or institutes..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />

          <div className="space-y-2">
            <Label className="block mb-2">Rating Range</Label>
            <Slider
              min={0}
              max={3000}
              step={100}
              value={filters.ratingRange}
              onValueChange={(value) => setFilters(prev => ({
                ...prev,
                ratingRange: value as [number, number]
              }))}
            />
            <div className="flex justify-between text-sm text-gray-600">
              <span>{filters.ratingRange[0]}</span>
              <span>{filters.ratingRange[1]}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 font-medium border-b">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">User</div>
          <div className="col-span-3">Institute</div>
          <div className="col-span-2 text-right">Rating</div>
          <div className="col-span-2">Stats</div>
        </div>

        {leaderboard.map((user, index) => (
          <div key={user._id} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-gray-50">
            <div className="col-span-1 font-medium">#{index + 1}</div>
            
            <div className="col-span-4 flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="font-medium">
                <Link 
                  href={`/users/${user.username}`}
                  style={{ color: getTitleColor(user.title) }}
                  className="font-medium hover:underline"
                  >
                  {user.username}
                  </Link>
                </span>
            </div>

            <div className="col-span-3 text-gray-600">
              {user.institute || 'N/A'}
            </div>

            <div className="col-span-2 text-right">
              <Badge variant="secondary" className="px-3 py-1">
                {user.rating.toFixed(0)}
              </Badge>
            </div>

            <div className="col-span-2 space-y-1">
              <div className="text-sm">
                Solved: <span className="font-medium">{user.problemsSolved}</span>
              </div>
              <div className="text-sm">
                Accuracy: <span className="font-medium">{(user.accuracy * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="p-6 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {!loading && leaderboard.length === 0 && (
          <div className="p-6 text-center text-gray-500">No users found</div>
        )}

        {hasMore && !loading && (
          <div className="p-4 flex justify-center">
            <Button 
              onClick={() => setPage(prev => prev + 1)}
              variant="outline"
              className="w-48"
            >
              Load More
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}