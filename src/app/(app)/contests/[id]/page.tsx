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
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils'; // Import cn for conditional class names

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
    _id:string;
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
        const subject = problem.subject?.toLowerCase() || 'other';
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(problem);
        return acc;
    }, {} as Record<string, Problem[]>);

    const availableSubjects = groupedProblems ? Object.keys(groupedProblems) : [];

    const localStorageKey = session?.user?._id && contestId
        ? `contest-${contestId}-${session.user._id}-draftSubmissions`
        : null;

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (!contestId) {
                    toast.error('Contest ID not found.');
                    setIsLoading(false);
                    return;
                }
                const contestRes = await axios.get(`/api/contests/${contestId}`);
                setContest(contestRes.data);

                if (!session?.user?._id) {
                    setHasFinalSubmission(false);
                    setIsLoading(false);
                    return;
                }

                if (localStorageKey) {
                    const savedDrafts = localStorage.getItem(localStorageKey);
                    if (savedDrafts) {
                        try {
                            const parsedDrafts = JSON.parse(savedDrafts);
                            if (typeof parsedDrafts === 'object' && parsedDrafts !== null) {
                                setSubmissions(parsedDrafts);
                            }
                        } catch (e) {
                            console.error("Error parsing saved drafts from localStorage:", e);
                            localStorage.removeItem(localStorageKey);
                        }
                    }
                }

                try {
                    const submissionsRes = await axios.get(`/api/submissions?contestId=${contestId}&userId=${session.user._id}&IsFinal=true`);
                    if (submissionsRes.data && submissionsRes.data.length > 0) {
                        setHasFinalSubmission(true);
                        const finalSubs = submissionsRes.data.reduce((acc: Record<string, string>, sub: any) => {
                            acc[sub.problem._id] = sub.selectedOptions[0];
                            return acc;
                        }, {});
                        setSubmissions(finalSubs);
                    } else {
                        setHasFinalSubmission(false);
                    }
                } catch (subError) {
                    console.error("Error fetching submissions:", subError);
                    toast.warning('Could not load previous submission status.');
                    setHasFinalSubmission(false);
                }

            } catch (error) {
                console.error("Error fetching contest data:", error);
                toast.error('Failed to load contest data.');
                setContest(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (contestId && authStatus !== 'loading') {
            fetchData();
        } else if (authStatus !== 'loading' && !contestId) {
            setIsLoading(false);
        }
    }, [contestId, session?.user?._id, authStatus, localStorageKey]); // Added session.user._id and localStorageKey

    useEffect(() => {
        if (localStorageKey && isActive && !hasFinalSubmission && Object.keys(submissions).length > 0) {
            localStorage.setItem(localStorageKey, JSON.stringify(submissions));
        }
    }, [submissions, isActive, hasFinalSubmission, localStorageKey]);

    const handleOptionSelect = (problemId: string, option: string) => {
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

            if (localStorageKey) {
                localStorage.removeItem(localStorageKey);
            }
            router.push(`/contests/${contest._id}/standings`);
        } catch (error: any) {
             console.error("Final Submission Error:", error.response?.data || error.message);
            if (error.response?.data?.error === "You have already made a final submission") {
                setHasFinalSubmission(true);
                toast.error(error.response.data.error);
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
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
     if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4">
                <p className="text-xl text-destructive mb-4 text-center">Please log in to view the contest.</p>
                <Link href="/sign-in">
                    <Button>Login</Button>
                </Link>
            </div>
        );
    }
    if (!contest) {
        return <div className="text-center mt-10 text-destructive font-semibold px-4">Contest not found or failed to load.</div>;
    }
    if (startTime && now < startTime) {
        return (
            <div className="container mx-auto p-6 text-center">
                <h1 className="text-2xl md:text-3xl font-bold mb-4">{contest.title}</h1>
                <p className="text-lg md:text-xl text-muted-foreground">This contest has not started yet.</p>
                <p className="text-muted-foreground">Starts at: {startTime.toLocaleString()}</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-6 sm:py-8"> {/* Adjusted padding for mobile */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                <div className="w-full sm:w-auto"> {/* Ensure title doesn't push buttons too far on mobile */}
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">{contest.title}</h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {startTime?.toLocaleString()} - {endTime?.toLocaleString()}
                        {!isActive && isEnded && <span className="ml-2 font-semibold text-destructive">(Ended)</span>}
                        {isActive && <span className="ml-2 font-semibold text-green-600">(Active)</span>}
                    </p>
                </div>
                <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-normal"> {/* Buttons take full width on mobile then auto */}
                    <Link href={`/contests/${contest._id}/standings`} className="flex-1 sm:flex-initial">
                       <Button variant="outline" className="w-full">
                           <span className="hidden sm:inline">View </span>Standings
                        </Button>
                    </Link>
                    {isActive && (
                        <Button
                            onClick={handleFinalSubmit}
                            disabled={isSubmitting || hasFinalSubmission || !isActive}
                            className={cn(
                                "flex-1 sm:flex-initial w-full",
                                hasFinalSubmission ? 'bg-gray-400 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-600' : ''
                            )}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {hasFinalSubmission ? 'Submitted' : 'Final Submit'}
                        </Button>
                    )}
                     {isEnded && !hasFinalSubmission && (
                         <span className="text-xs sm:text-sm text-orange-600 p-2 bg-orange-500/10 rounded-md w-full text-center sm:w-auto">Contest ended. Final submission missed.</span>
                     )}
                     {isEnded && hasFinalSubmission && (
                         <span className="text-xs sm:text-sm text-green-600 p-2 bg-green-500/10 rounded-md w-full text-center sm:w-auto">Contest ended. Submission recorded.</span>
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
                    {/* TabsList made scrollable on mobile and centered on larger screens */}
                    <TabsList className="mb-6 sm:mb-8 bg-muted p-1 rounded-md flex w-full overflow-x-auto whitespace-nowrap sm:justify-center">
                        {availableSubjects.includes('physics') && <TabsTrigger value="physics" className="flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm">Physics</TabsTrigger>}
                        {availableSubjects.includes('chemistry') && <TabsTrigger value="chemistry" className="flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm">Chemistry</TabsTrigger>}
                        {availableSubjects.includes('mathematics') && <TabsTrigger value="mathematics" className="flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm">Mathematics</TabsTrigger>}
                        {availableSubjects.filter(s => !['physics', 'chemistry', 'mathematics'].includes(s)).map(subject => (
                             <TabsTrigger key={subject} value={subject} className="capitalize flex-shrink-0 px-3 py-1.5 text-xs sm:text-sm">{subject}</TabsTrigger>
                        ))}
                    </TabsList>

                    {Object.entries(groupedProblems || {}).map(([subject, problems]) => (
                        <TabsContent key={subject} value={subject}>
                            {/* Grid remains single column on mobile, then adapts */}
                            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                                {problems.map((problem, index) => (
                                    <Card key={problem._id} className="flex flex-col">
                                        <CardHeader>
                                            {/* Adjusted problem title size */}
                                            <CardTitle className="text-base sm:text-lg leading-snug">
                                                {`Problem ${index + 1}: ${problem.title}`}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-4">
                                            {problem.imageUrl && (
                                                <div className="mb-4 border rounded-md bg-muted/40 flex justify-center p-2 sm:p-0">
                                                    <Image
                                                        src={problem.imageUrl}
                                                        alt={`Illustration for ${problem.title}`}
                                                        width={400}
                                                        height={300}
                                                        className="object-contain max-h-[250px] sm:max-h-[300px] rounded" // Slightly smaller max-height on mobile for image
                                                        priority={index < 2} // Prioritize loading for first few images
                                                    />
                                                </div>
                                            )}
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: problem.description }}>
                                                {/* Using dangerouslySetInnerHTML for HTML content if needed, or just <p> for plain text */}
                                                
                                            </div>
                                            <div className="space-y-2 pt-2">
                                                {problem.options.map((option, optIndex) => (
                                                    <Button
                                                        key={optIndex}
                                                        variant={submissions[problem._id] === option ? 'default' : 'outline'}
                                                        className="w-full text-left justify-start h-auto py-2.5 sm:py-2 whitespace-normal border text-sm" // Increased tap target size slightly
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
                  <div className="text-center text-muted-foreground mt-10 px-4">
                      <p className="text-lg">No problems found for this contest.</p>
                      <p className="text-sm mt-1">Please check back later or contact support if you believe this is an error.</p>
                  </div>
             )}
        </div>
    );
}