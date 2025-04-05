'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { use } from 'react';

interface Problem {
    _id: string;
    title: string;
    description: string;
    options: string[];
    subject: string;
    score: number;
}

interface Contest {
    _id: string;
    title: string;
    startTime: string;
    endTime: string;
    problems: Problem[];
}

export default function ContestPage({ params }: { params: Promise<{ id: string }> }) {
    const { data: session } = useSession();
    const router = useRouter();
    const unwrappedParams = use(params);
    const [contest, setContest] = useState<Contest | null>(null);
    const [submissions, setSubmissions] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasFinalSubmission, setHasFinalSubmission] = useState(false);

    const now = new Date();
    const startTime = contest ? new Date(contest.startTime) : null;
    const endTime = contest ? new Date(contest.endTime) : null;
    const isActive = contest && startTime && endTime && now >= startTime && now <= endTime;
    const isEnded = contest && endTime && now > endTime;

    const groupedProblems = contest?.problems.reduce((acc, problem) => {
        const subject = problem.subject.toLowerCase();
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(problem);
        return acc;
    }, {} as Record<string, Problem[]>);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [contestRes, submissionsRes] = await Promise.all([
                    axios.get(`/api/contests/${unwrappedParams.id}`),
                    axios.get(`/api/submissions?contestId=${unwrappedParams.id}&isFinal=true`) // Only fetch final submissions
                ]);

                setContest(contestRes.data);
                
                // If we get any submissions back, they must be final (due to the query)
                if (submissionsRes.data.length > 0) {
                    setHasFinalSubmission(true);
                    const subs = submissionsRes.data.reduce((acc: Record<string, string>, sub: any) => {
                        acc[sub.problem._id] = sub.selectedOptions[0];
                        return acc;
                    }, {});
                    setSubmissions(subs);
                }

            } catch (error) {
                toast.error('Failed to load contest data');
            } finally {
                setIsLoading(false);
            }
        };

        if (session) fetchData();
    }, [unwrappedParams.id, session]);

    const handleOptionSelect = (problemId: string, option: string) => {
        if (!hasFinalSubmission) {
            setSubmissions(prev => ({ ...prev, [problemId]: option }));
        }
    };

    const handleFinalSubmit = async () => {
        // Early return if conditions aren't met
        if (!contest || isSubmitting || hasFinalSubmission) return;

        setIsSubmitting(true);
        try {
            const submissionData = Object.entries(submissions).map(([problemId, option]) => ({
                problemId,
                contestId: contest._id,
                selectedOptions: [option]
            }));

            await axios.post('/api/submissions/final', {
                submissions: submissionData
            });

            // Update state immediately on success
            setHasFinalSubmission(true);
            toast.success('Final submission successful!');
            router.push(`/contests/${contest._id}/standings`);

        } catch (error: any) {
            if (error.response?.data?.error === "You have already made a final submission") {
                setHasFinalSubmission(true);
                toast.error(error.response.data.error);
            } else {
                toast.error('Failed to submit answers');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center mt-20"><Loader2 className="h-12 w-12 animate-spin" /></div>;
    }

    if (!contest) {
        return <div className="text-center mt-10">Contest not found</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">{contest.title}</h1>
                <div className="space-x-4">
                    {isActive && (
                        <Button 
                            onClick={handleFinalSubmit} 
                            disabled={isSubmitting || hasFinalSubmission}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {hasFinalSubmission ? 'Already Submitted' : 'Final Submit'}
                        </Button>
                    )}
                </div>
            </div>

            {hasFinalSubmission && (
                <div className="mb-4 p-4 bg-green-100 text-green-800 rounded-md">
                    You have already made your final submission for this contest.
                </div>
            )}

            <Tabs defaultValue="physics" className="w-full">
                <TabsList className="grid grid-cols-3 w-[400px] mb-8">
                    <TabsTrigger value="physics">Physics</TabsTrigger>
                    <TabsTrigger value="chemistry">Chemistry</TabsTrigger>
                    <TabsTrigger value="mathematics">Maths</TabsTrigger>
                </TabsList>

                {Object.entries(groupedProblems || {}).map(([subject, problems]) => (
                    <TabsContent key={subject} value={subject}>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {problems.map(problem => (
                                <Card key={problem._id}>
                                    <CardHeader>
                                        <CardTitle>{problem.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="mb-4">{problem.description}</p>
                                        <div className="space-y-2">
                                            {problem.options.map((option, index) => (
                                                <Button
                                                    key={index}
                                                    variant={submissions[problem._id] === option ? 'default' : 'outline'}
                                                    className="w-full text-left justify-start"
                                                    onClick={() => handleOptionSelect(problem._id, option)}
                                                    disabled={!isActive || hasFinalSubmission}
                                                >
                                                    {String.fromCharCode(65 + index)}. {option}
                                                </Button>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}