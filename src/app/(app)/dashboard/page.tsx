'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback, Key } from 'react';
import { Button } from '@/components/ui/button';
import axios, { AxiosError } from 'axios';
import { Loader2, Settings, User, Mail, Building, CalendarDays, BarChart3, CheckSquare, History, Trophy, ArrowRight } from 'lucide-react'; // Added icons
import { toast } from 'sonner';
import { UserType } from '@/types/User';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter // Added CardFooter if needed later
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { RatingChart } from '@/components/rating-chart';
import { getTitleColor } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Use Shadcn Avatar
// Removed CldImage import, using Shadcn Avatar which can handle URLs

interface RatingHistoryEntry {
  newrating: number;
  timestamp: string;
  contestTitle: string;
}

interface ContestEntry {
  _id: string;
  title: string;
  startTime: string;
}
interface UserStats {
  ratingHistory: Array<RatingHistoryEntry>;
  contestsJoined: Array<ContestEntry>;
  accuracy: number;
}

// Helper to get initials from username (if not already available globally)
const getInitials = (name: string = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');
};

export default function DashboardPage() { // Renamed component for clarity
  const { data: session, status } = useSession();

  const [userDetails, setUserDetails] = useState<UserType | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null); // Use specific type
  const [isLoading, setIsLoading] = useState(true);

  // Combined fetch function for better state management
  const fetchData = useCallback(async () => {
    if (!session?.user || status !== 'authenticated') return;

    setIsLoading(true);
    try {
      // Fetch both user details and stats concurrently
      const [userResponse, statsResponse,accuracyResponse] = await Promise.all([
        axios.get<UserType>('/api/user'),
        axios.get<UserStats>('/api/user/stats'),
        axios.get('/api/user/statts')
      ]);
      setUserDetails({
      ...userResponse.data,
      problemsSolved: accuracyResponse.data.problemsSolved
      });
    
      setUserStats({
        ...statsResponse.data,
        accuracy: accuracyResponse.data.accuracy
      });

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      const axiosError = error as AxiosError<{ message: string }>;
      const errorMessage = axiosError.response?.data?.message ||
                           (axiosError.isAxiosError ? `Network Error or Server Issue (${axiosError.code})` : 'An unexpected error occurred');
      toast.error(`Failed to load dashboard: ${errorMessage}`);
      // Optionally clear stale data on error
      // setUserDetails(null);
      // setUserStats(null);
    } finally {
      setIsLoading(false);
    }
  }, [session, status]); // Depend on session and status

  useEffect(() => {
    // Fetch data only when authenticated
    if (status === 'authenticated') {
      fetchData();
    } else if (status === 'unauthenticated') {
      // Handle unauthenticated state if needed (e.g., redirect or show message)
      setIsLoading(false); // Stop loading if unauthenticated
    }
    // 'loading' status is handled by the initial return below
  }, [status, fetchData]); // Trigger effect when status changes

  // --- Loading State ---
  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
      return (
        <div className="flex justify-center items-center min-h-[calc(100vh-200px)]">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // --- Unauthenticated State ---
  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-center">
        <h2 className="text-2xl font-semibold mb-4">Unauthorized Access</h2>
        <p className="text-muted-foreground mb-6">Please sign in to view your dashboard.</p>
        <Link href="/sign-in">
            <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  // --- Error State (Data failed to load) ---
   if (!isLoading && !userDetails) {
     return (
       <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] text-center">
         <h2 className="text-2xl font-semibold mb-4 text-destructive">Error Loading Dashboard</h2>
         <p className="text-muted-foreground mb-6">Could not fetch your details. Please try again later.</p>
         <Button onClick={fetchData} variant="outline">Retry</Button>
       </div>
     );
   }


  // --- Authenticated & Data Loaded State ---
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your Dashboard</h1>
        <Link href="/dashboard/settings">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

        {/* Left Column (Profile & Details) */}
        <div className="md:col-span-1 space-y-6 md:space-y-8">
          {/* Profile Card */}
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center space-x-4 p-4 sm:p-6 bg-muted/30 border-b">
              <Avatar className="h-16 w-16 border-2 border-primary/50">
                 <AvatarImage src={userDetails?.avatar} alt={userDetails?.username || 'User'} />
                 <AvatarFallback className="text-xl bg-background">{getInitials(userDetails?.username)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                 <h2 className="text-xl font-bold tracking-tight" style={{ color: getTitleColor(userDetails?.title || 'newbie') }}>
                    {userDetails?.username || 'User'}
                 </h2>
                 <p className="text-sm font-medium capitalize" style={{ color: getTitleColor(userDetails?.title || 'newbie') }}>
                    {userDetails?.title || 'Newbie'}
                 </p>
                 <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <Mail className="h-3 w-3 mr-1.5"/>
                    {userDetails?.email || 'No email'}
                 </p>
              </div>
            </CardHeader>
             <CardContent className="p-4 sm:p-6 space-y-3 text-sm">
                <div className="flex items-center">
                    <Building className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span className="text-muted-foreground mr-2">Institute:</span>
                    <span className="font-medium">{userDetails?.institute || <span className="text-muted-foreground italic">Not provided</span>}</span>
                </div>
                <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-3 text-muted-foreground" />
                    <span className="text-muted-foreground mr-2">Year:</span>
                    <span className="font-medium">{userDetails?.yearofstudy || <span className="text-muted-foreground italic">Not provided</span>}</span>
                </div>
            </CardContent>
          </Card>

           {/* Your Stats Card */}
           <Card>
             <CardHeader>
               <CardTitle className="text-lg">Your Stats</CardTitle>
               {/* Optional: Add CardDescription if needed */}
             </CardHeader>
             <CardContent className="space-y-5">
               <div className="flex items-center justify-between">
                 <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-3 text-blue-500" />
                    <p className="text-sm font-medium">Current Rating</p>
                 </div>
                 <p className="text-lg font-bold">{userDetails?.rating ?? 'N/A'}</p>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center">
                     <CheckSquare className="h-5 w-5 mr-3 text-green-500" />
                     <p className="text-sm font-medium">Problems Solved</p>
                  </div>
                  <p className="text-lg font-bold">{userDetails?.problemsSolved || 0}</p>
               </div>
                {/* Accuracy - Kept as requested, but maybe add context if it's not dynamic */}
               <div>
                  <div className="flex items-center justify-between mb-1">
                     <p className="text-sm font-medium text-muted-foreground">Overall Accuracy</p>
                     <p className="text-sm font-semibold text-muted-foreground">{userStats?.accuracy?.toFixed(1) || 0}%</p> {/* Hardcoded value */}
                  </div>
                  <Progress value={userStats?.accuracy || 0} className="h-2" aria-label="Overall Accuracy Progress"/>
                  {/* Consider adding a small note if this value isn't from the backend */}
                  {/* <p className="text-xs text-muted-foreground mt-1 italic">*Accuracy calculation based on mock data.</p> */}
               </div>
             </CardContent>
           </Card>
        </div>

        {/* Right Column (History & Contests) */}
        <div className="md:col-span-2 space-y-6 md:space-y-8">
          {/* Rating History Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <History className="h-5 w-5 text-primary" />
                 Rating History
              </CardTitle>
              <CardDescription>Your rating changes over time based on contest performance.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && !userStats ? ( // Show skeleton/loader if stats are still loading
                 <div className="h-64 flex items-center justify-center bg-muted/50 rounded-md">
                     <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 </div>
              ) : userStats?.ratingHistory?.length ? (
                <div className="h-64 md:h-80"> {/* Give chart a defined height */}
                  <RatingChart
                    data={userStats.ratingHistory.map((rh) => ({
                      newrating: rh.newrating,
                      timestamp: rh.timestamp,
                      contestTitle: rh.contestTitle
                    }))}
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                  <p>No rating history available yet.</p>
                  <p className="text-sm">Participate in contests to see your progress!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contests Participated Card */}
          <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Contests Joined
               </CardTitle>
               <CardDescription>A list of contests you have participated in.</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading && !userStats ? ( // Show skeleton/loader if stats are still loading
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => ( // Skeleton Loader for contests
                    <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-md animate-pulse">
                        <div className="h-4 bg-muted rounded w-3/5"></div>
                        <div className="h-3 bg-muted rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : userStats?.contestsJoined?.length ? (
                <div className="space-y-2">
                  {userStats.contestsJoined.map((contest) => (
                    <Link
                      key={contest._id}
                      href={`/contests/${contest._id}`}
                      className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors duration-150 group"
                    >
                      <div>
                         <div className="text-sm font-medium text-primary group-hover:underline underline-offset-2">
                            {contest.title}
                         </div>
                         <div className="text-xs text-muted-foreground mt-0.5">
                            {new Date(contest.startTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                         </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                    </Link>
                  ))}
                </div>
              ) : (
                 <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg">
                   <p>You haven't joined any contests yet.</p>
                   <Link href="/contests">
                      <Button variant="link" className="mt-2">Explore Contests</Button>
                   </Link>
                 </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Separator removed as the card structure provides enough separation */}
      {/* <Separator className="my-8" /> */}
    </div>
  );
}