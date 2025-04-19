'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { UserType } from '@/types/User';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RatingChart } from '@/components/rating-chart';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getTitleColor } from '@/lib/utils';
import { use } from 'react';

interface PublicStats {
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

export default function PublicProfile({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const [user, setUser] = useState<UserType | null>(null);
    const [stats, setStats] = useState<PublicStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [userRes, statsRes] = await Promise.all([
                    axios.get(`/api/users/${username}`),
                    axios.get(`/api/users/${username}/stats`)
                ]);
                
                setUser(userRes.data);
                setStats(statsRes.data);
            } catch (error) {
                console.error('Failed to load profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [username]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-8">
                <h1 className="text-2xl font-bold">User not found</h1>
                <Link href="/" className="text-primary hover:underline mt-4 inline-block">
                    Return to homepage
                </Link>
            </div>
        );
    }

    return (
        <div className="my-8 mx-4 md:mx-8 lg:mx-auto p-6 bg-white rounded w-full max-w-6xl">
            <div className="flex items-center space-x-4 mb-6">
                <img
                    src={user.avatar || '/default-avatar.png'}
                    alt="Avatar"
                    className="w-20 h-20 rounded-full"
                />
                <div>
                    <h1 
                        className="text-3xl font-bold"
                        style={{ color: getTitleColor(user.title || 'newbie') }}
                    >
                        {user.username}
                    </h1>
                    <p className="text-gray-600">{user.institute || 'No institute provided'}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Year of Study</p>
                                <p className="text-xl font-bold">{user.yearofstudy || 'Not provided'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Title</p>
                                <p className="text-xl font-bold">{user.title}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">Rating</p>
                                <p className="text-2xl font-bold">{user.rating}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Problems Solved</p>
                                <p className="text-2xl font-bold">{user.problemsSolved}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Accuracy</p>
                                <Progress value={75} className="h-2" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Rating History</CardTitle>
                </CardHeader>
                <CardContent>
                    {stats?.ratingHistory?.length ? (
                        <RatingChart data={stats.ratingHistory} />
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            No rating history available
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card className="mb-4">
                <CardHeader>
                    <CardTitle>Contests Participated</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {stats?.contestsJoined?.length ? (
                            stats.contestsJoined.map(contest => (
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
}