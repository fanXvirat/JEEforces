'use client';

import React, { useEffect, useState, useCallback, Key } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import axios, { AxiosError } from 'axios';
import { Loader2, Settings, Mail, Building, CalendarDays, BarChart3, CheckSquare, History, Trophy, ArrowRight,Flame,BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import { RatingChart } from '@/components/rating-chart';
import { getTitleColor } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQueries } from '@tanstack/react-query';
// Define interfaces for each API's expected response
interface UserProfileResponse {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  rating: number;
  title: string;
  institute?: string;
  yearofstudy?: string;
  maxStreak: number;
}

interface UserStatsResponse {
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

interface UserStattsResponse { // Note the 'statts' endpoint name
  problemsSolved: number;
  totalAttempted: number;
  accuracy: number;
}

const getInitials = (name: string = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
};

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const queries = useQueries({
    queries: [
      {
        queryKey: ['userProfile', session?.user?._id],
        queryFn: async () => {
          const res = await axios.get<UserProfileResponse>('/api/user');
          return res.data;
        },
        enabled: status === 'authenticated' && !!session?.user?._id,
        staleTime: 60 * 60 * 1000, // 1 hour, matches backend TTL
      },
      {
        queryKey: ['userStats', session?.user?._id],
        queryFn: async () => {
          const res = await axios.get<UserStatsResponse>('/api/user/stats');
          return res.data;
        },
        enabled: status === 'authenticated' && !!session?.user?._id,
        staleTime: 5 * 60 * 1000, // 5 minutes, matches backend TTL
      },
      {
        queryKey: ['userStatts', session?.user?._id],
        queryFn: async () => {
          const res = await axios.get<UserStattsResponse>('/api/user/statts');
          return res.data;
        },
        enabled: status === 'authenticated' && !!session?.user?._id,
        staleTime: 5 * 60 * 1000, // 5 minutes, matches backend TTL
      },
    ],
  });

  const userProfileQuery = queries[0];
  const userStatsQuery = queries[1];
  const userStattsQuery = queries[2];

  const isLoadingAny = userProfileQuery.isLoading || userStatsQuery.isLoading || userStattsQuery.isLoading;
  const isFetchingAny = userProfileQuery.isFetching || userStatsQuery.isFetching || userStattsQuery.isFetching;
  const isErrorAny = userProfileQuery.isError || userStatsQuery.isError || userStattsQuery.isError;

  const refetchAll = useCallback(() => {
    userProfileQuery.refetch();
    userStatsQuery.refetch();
    userStattsQuery.refetch();
  }, [userProfileQuery.refetch, userStatsQuery.refetch, userStattsQuery.refetch]);

  useEffect(() => {
    if (isErrorAny) {
      const errorMessage =
        (userProfileQuery.error as AxiosError)?.response?.data ||
        (userStatsQuery.error as AxiosError)?.response?.data ||
        (userStattsQuery.error as AxiosError)?.response?.data ||
        'An unexpected error occurred while loading dashboard data.';
      console.error("Dashboard fetch error:", errorMessage, userProfileQuery.error, userStatsQuery.error, userStattsQuery.error);
      toast.error(`Failed to load dashboard: ${errorMessage}`);
    }
  }, [isErrorAny, userProfileQuery.error, userStatsQuery.error, userStattsQuery.error]);

  if (status === 'loading' || (status === 'authenticated' && isLoadingAny && (!userProfileQuery.data && !userStatsQuery.data && !userStattsQuery.data))) {
      return (
        <div className="flex justify-center items-center min-h-[calc(100vh-150px)]">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-150px)] text-center px-4">
        <h2 className="text-2xl font-semibold mb-4">Unauthorized Access</h2>
        <p className="text-muted-foreground mb-6">Please sign in to view your dashboard.</p>
        <Link href="/sign-in">
            <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

   if (isErrorAny && (!userProfileQuery.data && !userStatsQuery.data && !userStattsQuery.data)) {
     return (
       <div className="flex flex-col justify-center items-center min-h-[calc(100vh-150px)] text-center px-4">
         <h2 className="text-2xl font-semibold mb-4 text-destructive">Error Loading Dashboard</h2>
         <p className="text-muted-foreground mb-6">Could not fetch your details. Please try again later.</p>
         <Button onClick={refetchAll} variant="outline">Retry</Button>
       </div>
     );
   }

  if (!userProfileQuery.data) {
      return null;
  }

  const userDetails = userProfileQuery.data;
  const userStats = userStatsQuery.data;
  const userAccuracyStats = userStattsQuery.data;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Header - Remains flex-col on mobile, flex-row on sm and up */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Your Dashboard</h1>
        <Link href="/dashboard/settings">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </Link>
      </div>

      {/* Main Content Grid - Stacks on mobile, 3-column on md and above */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

        {/* Left Column (Profile & Details) - Always takes full width on mobile, then scales */}
        <div className="md:col-span-1 space-y-6 md:space-y-8">
          {/* Profile Card */}
          <Card className="overflow-hidden">
            {/* Card Header - Profile image and basic info */}
            <CardHeader className="flex flex-row items-center space-x-4 p-4 sm:p-6 bg-muted/30 border-b">
              <Avatar className="h-16 w-16 border-2 border-primary/50">
                 <AvatarImage src={userDetails.avatar} alt={userDetails.username} />
                 <AvatarFallback className="text-xl bg-background">{getInitials(userDetails.username)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                 <h2 className="text-xl sm:text-xl font-bold tracking-tight truncate" style={{ color: getTitleColor(userDetails.title) }}>
                    {userDetails.username}
                 </h2>
                 <p className="text-sm font-medium capitalize truncate" style={{ color: getTitleColor(userDetails.title) }}>
                    {userDetails.title}
                 </p>
                 <p className="text-xs text-muted-foreground flex items-center mt-1">
                    <Mail className="h-3 w-3 mr-1.5 flex-shrink-0"/>
                    <span className="truncate">{userDetails.email}</span>
                 </p>
              </div>
            </CardHeader>
             <CardContent className="p-4 sm:p-6 space-y-3 text-sm">
                <div className="flex items-center">
                    <Building className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground mr-2">Institute:</span>
                    <span className="font-medium flex-1 text-right sm:text-left">{userDetails.institute || <span className="text-muted-foreground italic">Not provided</span>}</span>
                </div>
                <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground mr-2">Year of Study:</span>
                    <span className="font-medium flex-1 text-right sm:text-left">{userDetails.yearofstudy || <span className="text-muted-foreground italic">Not provided</span>}</span>
                </div>
            </CardContent>
          </Card>

           {/* Your Stats Card */}
           <Card>
             <CardHeader>
               <CardTitle className="text-lg">Your Stats</CardTitle>
             </CardHeader>
             <CardContent className="space-y-5">
               <div className="flex items-center justify-between">
                 <div className="flex items-center">
                    <BarChart3 className="h-5 w-5 mr-3 text-blue-500" />
                    <p className="text-sm font-medium">Current Rating</p>
                 </div>
                 <p className="text-lg sm:text-xl font-bold">{userDetails.rating ?? 'N/A'}</p>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center">
                     <CheckSquare className="h-5 w-5 mr-3 text-green-500" />
                     <p className="text-sm font-medium">Problems Solved</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold">{userAccuracyStats?.problemsSolved || 0}</p>
               </div>
               <div className="flex items-center justify-between">
                  <div className="flex items-center"><Flame className="h-5 w-5 mr-3 text-orange-500" /><p>Max Practice Streak</p></div>
                  <p className="text-lg sm:text-xl font-bold">{userDetails.maxStreak || 0}</p>
               </div>
               <div>
                  <div className="flex items-center justify-between mb-1">
                     <p className="text-sm font-medium text-muted-foreground">Overall Accuracy</p>
                     <p className="text-sm font-semibold text-muted-foreground">{userAccuracyStats?.accuracy?.toFixed(1) || 0}%</p>
                  </div>
                  <Progress value={userAccuracyStats?.accuracy || 0} className="h-2" aria-label="Overall Accuracy Progress"/>
               </div>
             </CardContent>
           </Card>
           <Card className="bg-gradient-to-br from-primary/10 to-background">
                         <CardHeader>
                           <CardTitle className="flex items-center gap-2">
                              <BrainCircuit className="h-5 w-5 text-primary" />
                              Practice Dimension
                           </CardTitle>
                           <CardDescription>Hone your skills outside of contests.</CardDescription>
                         </CardHeader>
                         <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">Review your practice attempts and see how you've improved over time.</p>
                            <Link href="/dashboard/practice-history">
                                <Button className="w-full">
                                    View Practice History <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                         </CardContent>
                    </Card>
        </div>

        {/* Right Column (History & Contests) - Takes full width on mobile, 2/3 on md */}
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
            <CardContent className="overflow-x-auto"> {/* KEY FIX: Added overflow-x-auto here */}
              {userStatsQuery.isLoading || userStatsQuery.isFetching ? (
                 <div className="h-64 flex items-center justify-center bg-muted/50 rounded-md w-full"> {/* Added w-full */}
                     <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                 </div>
              ) : userStats?.ratingHistory?.length ? (
                <div className="h-64 md:h-80 w-full"> {/* Added w-full */}
                  <RatingChart
                    data={userStats.ratingHistory.map((rh) => ({
                      newrating: rh.newrating,
                      timestamp: rh.timestamp,
                      contestTitle: rh.contestTitle
                    }))}
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-10 border border-dashed rounded-lg w-full"> {/* Added w-full */}
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
              {userStatsQuery.isLoading || userStatsQuery.isFetching ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
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
    </div>
  );
}