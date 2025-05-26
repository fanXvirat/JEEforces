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
import { use } from 'react'; // Assuming 'use' hook is correctly implemented/imported
import Link from 'next/link';
import Image from 'next/image';

interface Problem {
    _id: string;
    title: string;
    description: string;
    options: string[];
    subject: string;
    score: number;
    imageUrl?: string;
}

interface Contest {
    _id: string;
    title: string;
    startTime: string;
    endTime: string;
    problems: Problem[];
}

interface ContestPageProps {
     params: Promise<{ id: string }>;
}

export default function ContestPage({ params }: ContestPageProps) {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const unwrappedParams = use(params);
    const contestId = unwrappedParams.id;

    const [contest, setContest] = useState<Contest | null>(null);
    const [submissions, setSubmissions] = useState<Record<string, string>>({}); // This holds the selected options
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasFinalSubmission, setHasFinalSubmission] = useState(false);

    const now = new Date();
    const startTime = contest ? new Date(contest.startTime) : null;
    const endTime = contest ? new Date(contest.endTime) : null;
    const isActive = contest && startTime && endTime && now >= startTime && now <= endTime;
    const isEnded = contest && endTime && now > endTime;

    // Group problems by subject (case-insensitive)
    const groupedProblems = contest?.problems.reduce((acc, problem) => {
        const subject = problem.subject?.toLowerCase() || 'other';
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(problem);
        return acc;
    }, {} as Record<string, Problem[]>);

    // Filter subjects based on available problems
    const availableSubjects = groupedProblems ? Object.keys(groupedProblems) : [];

    // Derive localStorage key
    const localStorageKey = session?.user?._id && contestId
        ? `contest-${contestId}-${session.user._id}-draftSubmissions`
        : null;

    // Effect to fetch data and load draft submissions
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (!contestId) {
                    toast.error('Contest ID not found.');
                    setIsLoading(false);
                    return;
                }

                // 1. Fetch contest details
                const contestRes = await axios.get(`/api/contests/${contestId}`);
                setContest(contestRes.data);

                // Ensure session user ID is available for localStorage key and API calls
                if (!session?.user?._id) {
                    // If no session user, we can't load/save drafts specific to them
                    // and cannot check for final submissions.
                    setHasFinalSubmission(false); // No user, no final submission check
                    setIsLoading(false);
                    return;
                }

                // 2. Try to load existing draft submissions from localStorage
                if (localStorageKey) {
                    const savedDrafts = localStorage.getItem(localStorageKey);
                    if (savedDrafts) {
                        try {
                            const parsedDrafts = JSON.parse(savedDrafts);
                            // Only set if valid object
                            if (typeof parsedDrafts === 'object' && parsedDrafts !== null) {
                                setSubmissions(parsedDrafts);
                            }
                        } catch (e) {
                            console.error("Error parsing saved drafts from localStorage:", e);
                            localStorage.removeItem(localStorageKey); // Clear corrupted data
                        }
                    }
                }

                // 3. Fetch final submissions (will overwrite drafts if a final one exists)
                try {
                    const submissionsRes = await axios.get(`/api/submissions?contestId=${contestId}&userId=${session.user._id}&IsFinal=true`);
                    if (submissionsRes.data && submissionsRes.data.length > 0) {
                        setHasFinalSubmission(true);
                        // If a final submission exists, its values *should* overwrite any drafts
                        const finalSubs = submissionsRes.data.reduce((acc: Record<string, string>, sub: any) => {
                            acc[sub.problem._id] = sub.selectedOptions[0]; // Assuming single option selection
                            return acc;
                        }, {});
                        setSubmissions(finalSubs); // Final submission takes precedence
                    } else {
                        setHasFinalSubmission(false); // Explicitly set to false if no final subs found
                    }
                } catch (subError) {
                    console.error("Error fetching submissions:", subError);
                    toast.warning('Could not load previous submission status.');
                    setHasFinalSubmission(false); // Assume no final submission on error
                }

            } catch (error) {
                console.error("Error fetching contest data:", error);
                toast.error('Failed to load contest data.');
                setContest(null);
            } finally {
                setIsLoading(false);
            }
        };

        // Trigger fetch only when contestId is available and auth status is not loading
        if (contestId && authStatus !== 'loading') {
            fetchData();
        } else if (authStatus !== 'loading' && !contestId) {
            setIsLoading(false);
        }

    }, [contestId, session, authStatus]); // Add dependencies

    // Effect to save draft submissions to localStorage whenever `submissions` state changes
    useEffect(() => {
        if (localStorageKey && isActive && !hasFinalSubmission && Object.keys(submissions).length > 0) {
            // Only save if contest is active and no final submission has been made
            localStorage.setItem(localStorageKey, JSON.stringify(submissions));
            // console.log("Drafts saved to localStorage:", submissions); // For debugging
        }
    }, [submissions, isActive, hasFinalSubmission, localStorageKey]); // Add all dependencies

    const handleOptionSelect = (problemId: string, option: string) => {
        // Only allow selection if contest is active and no final submission made
        if (isActive && !hasFinalSubmission) {
            setSubmissions(prev => ({ ...prev, [problemId]: option }));
        }
    };

    const handleFinalSubmit = async () => {
        if (!contest || isSubmitting || hasFinalSubmission || !isActive) return;

        const confirmed = window.confirm("Are you sure you want to submit? You cannot change your answers after this.");
        if (!confirmed) return;

        setIsSubmitting(true);
        try {
            const submissionData = Object.entries(submissions).map(([problemId, option]) => ({
                problemId,
                contestId: contest._id,
                selectedOptions: [option],
            }));

            await axios.post('/api/submissions/final', {
                userId: session?.user?._id,
                submissions: submissionData
            });

            setHasFinalSubmission(true);
            toast.success('Final submission successful!');

            // Clear draft submissions from localStorage after successful final submission
            if (localStorageKey) {
                localStorage.removeItem(localStorageKey);
            }

            router.push(`/contests/${contest._id}/standings`);

        } catch (error: any) {
             console.error("Final Submission Error:", error.response?.data || error.message);
            if (error.response?.data?.error === "You have already made a final submission") {
                setHasFinalSubmission(true);
                toast.error(error.response.data.error);
                // If backend confirms final submission, also clear local drafts
                if (localStorageKey) {
                    localStorage.removeItem(localStorageKey);
                }
            } else {
                toast.error(`Submission failed: ${error.response?.data?.message || 'Please try again.'}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (authStatus === 'loading' || isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>;
    }
     if (!session) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-xl text-red-500 mb-4">Please log in to view the contest.</p>
                <Link href="/sign-in">
                    <Button>Login</Button>
                </Link>
            </div>
        );
    }
    if (!contest) {
        return <div className="text-center mt-10 text-red-500 font-semibold">Contest not found or failed to load.</div>;
    }
    if (startTime && now < startTime) {
        return (
            <div className="container mx-auto p-6 text-center">
                <h1 className="text-3xl font-bold mb-4">{contest.title}</h1>
                <p className="text-xl text-gray-700">This contest has not started yet.</p>
                <p className="text-gray-500">Starts at: {startTime.toLocaleString()}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{contest.title}</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {startTime?.toLocaleString()} - {endTime?.toLocaleString()}
                        {!isActive && isEnded && <span className="ml-2 font-semibold text-destructive">(Ended)</span>}
                        {isActive && <span className="ml-2 font-semibold text-green-600">(Active)</span>}
                    </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <Link href={`/contests/${contest._id}/standings`}>
                       <Button variant="outline">View Standings</Button>
                    </Link>
                    {isActive && (
                        <Button
                            onClick={handleFinalSubmit}
                            disabled={isSubmitting || hasFinalSubmission || !isActive}
                            className={hasFinalSubmission ? 'bg-gray-400 hover:bg-gray-400' : ''}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {hasFinalSubmission ? 'Submitted' : 'Final Submit'}
                        </Button>
                    )}
                     {isEnded && !hasFinalSubmission && (
                         <span className="text-sm text-orange-600 p-2">Contest ended. Final submission missed.</span>
                     )}
                     {isEnded && hasFinalSubmission && (
                         <span className="text-sm text-green-600 p-2">Contest ended. Submission recorded.</span>
                     )}
                </div>
            </div>

            {hasFinalSubmission && isActive && (
                <div className="mb-6 p-3 bg-accent text-accent-foreground rounded-md text-sm border">
                    You have already made your final submission. Changes are no longer saved. View standings after the contest ends.
                </div>
            )}
             {hasFinalSubmission && isEnded && (
                <div className="mb-6 p-3 bg-green-500/10 text-green-600 rounded-md text-sm border border-green-500/20">
                    Your final submission was recorded for this contest.
                </div>
            )}

            {availableSubjects.length > 0 ? (
                <Tabs defaultValue={availableSubjects[0]} className="w-full">
                    <TabsList className={` w-full grid-cols-${availableSubjects.length} mb-8 bg-muted`}>
                        {availableSubjects.includes('physics') && <TabsTrigger value="physics">Physics</TabsTrigger>}
                        {availableSubjects.includes('chemistry') && <TabsTrigger value="chemistry">Chemistry</TabsTrigger>}
                        {availableSubjects.includes('mathematics') && <TabsTrigger value="mathematics">Mathematics</TabsTrigger>}
                        {availableSubjects.filter(s => !['physics', 'chemistry', 'mathematics'].includes(s)).map(subject => (
                             <TabsTrigger key={subject} value={subject} className="capitalize">{subject}</TabsTrigger>
                        ))}
                    </TabsList>

                    {Object.entries(groupedProblems || {}).map(([subject, problems]) => (
                        <TabsContent key={subject} value={subject}>
                            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                                {problems.map((problem, index) => (
                                    <Card key={problem._id} className="flex flex-col">
                                        <CardHeader>
                                            <CardTitle className="text-lg">
                                                {`Problem ${index + 1}: ${problem.title}`}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-4">
                                            {problem.imageUrl && (
                                                <div className="mb-4 border rounded-md bg-muted/40 flex justify-center">
                                                    <Image
                                                        src={problem.imageUrl}
                                                        alt={`Illustration for ${problem.title}`}
                                                        width={400}
                                                        height={300}
                                                        className="object-contain max-h-[300px] rounded"
                                                        priority={index < 3}
                                                    />
                                                </div>
                                            )}
                                            <div className="prose prose-sm max-w-none text-muted-foreground">
                                                <p>{problem.description}</p>
                                            </div>
                                            <div className="space-y-2 pt-2">
                                                {problem.options.map((option, optIndex) => (
                                                    <Button
                                                        key={optIndex}
                                                        variant={submissions[problem._id] === option ? 'default' : 'outline'}
                                                        className="w-full text-left justify-start h-auto py-2 whitespace-normal border"
                                                        onClick={() => handleOptionSelect(problem._id, option)}
                                                        disabled={!isActive || hasFinalSubmission}
                                                        aria-pressed={submissions[problem._id] === option}
                                                    >
                                                        <span className="font-medium mr-2 text-foreground">{String.fromCharCode(65 + optIndex)}.</span>
                                                        <span>{option}</span>
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
             ) : (
                  <div className="text-center text-muted-foreground mt-10">No problems found for this contest.</div>
             )}
        </div>
    );
}