// app/contests/[id]/page.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useRouter, useSearchParams } from 'next/navigation';
import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { ContestTimer } from '@/components/ContestTimer'; // Make sure this path is correct

// Interfaces
interface Problem {
    _id: string;
    title: string;
    description: string;
    options: string[];
    subject: string;
    score: number;
    imageUrl?: string;
    correctOption?: string;
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

// Main Page Content Component
function ContestPageContent({ params }: ContestPageProps) {
    const { data: session, status: authStatus } = useSession();
    const router = useRouter();
    const unwrappedParams = use(params);
    const contestId = unwrappedParams.id;
    const searchParams = useSearchParams();
    const mode = searchParams.get('mode');

    // State
    const [contest, setContest] = useState<Contest | null>(null);
    const [submissions, setSubmissions] = useState<Record<string, string>>({});
    const [retakeSubmissions, setRetakeSubmissions] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasFinalSubmission, setHasFinalSubmission] = useState(false);
    const [isRetakeFinished, setIsRetakeFinished] = useState(false);
    const [retakeScore, setRetakeScore] = useState<{ score: number, total: number } | null>(null);
    const [retakeStartTime, setRetakeStartTime] = useState<number | null>(null);

    // Memos for derived state
    const now = new Date();
    const startTime = contest ? new Date(contest.startTime) : null;
    const endTime = contest ? new Date(contest.endTime) : null;
    const isActive = contest && startTime && endTime && now >= startTime && now <= endTime;
    const isEnded = contest && endTime && now > endTime;

    const totalPossibleScore = useMemo(() => {
        if (!contest) return 0;
        return contest.problems.reduce((sum, problem) => sum + (problem.score || 0), 0);
    }, [contest]);

    const contestDuration = useMemo(() => {
        if (!startTime || !endTime) return 0;
        return endTime.getTime() - startTime.getTime();
    }, [startTime, endTime]);
    
    const retakeExpiryTimestamp = useMemo(() => {
        if (!retakeStartTime || !contestDuration) return null;
        return retakeStartTime + contestDuration;
    }, [retakeStartTime, contestDuration]);

    const groupedProblems = contest?.problems.reduce((acc, problem) => {
        const subject = problem.subject?.toLowerCase() || 'other';
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(problem);
        return acc;
    }, {} as Record<string, Problem[]>);

    const availableSubjects = groupedProblems ? Object.keys(groupedProblems) : [];

    const draftLocalStorageKey = session?.user?._id && contestId ? `contest-${contestId}-${session.user._id}-draftSubmissions` : null;
    const retakeLocalStorageKey = session?.user?._id && contestId ? `contest-${contestId}-${session.user._id}-retakeSubmissions` : null;

    // Effects
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (!contestId) { toast.error('Contest ID not found.'); setIsLoading(false); return; }
                
                // Fetch contest data first, which is correct
                const contestRes = await axios.get(`/api/contests/${contestId}`);
                setContest(contestRes.data);

                if (!session?.user?._id) { 
                    setHasFinalSubmission(false); 
                    setIsLoading(false); 
                    return; 
                }
                
                // --- FIX STARTS HERE ---
                // The logical order has been corrected.

                // 1. First, check for a final submission. This is the highest priority.
                let finalSubmissionFound = false;
                try {
                    const submissionsRes = await axios.get(`/api/submissions?contestId=${contestId}&userId=${session.user._id}&IsFinal=true`);
                    if (submissionsRes.data && submissionsRes.data.length > 0) {
                        finalSubmissionFound = true; // Mark that we found one
                        setHasFinalSubmission(true);
                        const finalSubs = submissionsRes.data.reduce((acc: Record<string, string>, sub: any) => { acc[sub.problem._id] = sub.selectedOptions[0]; return acc; }, {});
                        setSubmissions(finalSubs);
                        if (draftLocalStorageKey) localStorage.removeItem(draftLocalStorageKey);
                    }
                } catch (subError) {
                    setHasFinalSubmission(false);
                }

                // 2. ONLY if a final submission was NOT found, try to load from localStorage.
                if (!finalSubmissionFound && draftLocalStorageKey) {
                    const savedDrafts = localStorage.getItem(draftLocalStorageKey);
                    if (savedDrafts) {
                        setSubmissions(JSON.parse(savedDrafts));
                    }
                }
                // --- FIX ENDS HERE ---

            } catch (error) { 
                toast.error('Failed to load contest data.'); 
            } finally { 
                setIsLoading(false); 
            }
        };

        if (contestId && authStatus !== 'loading') { 
            fetchData(); 
        }
    }, [contestId, session?.user?._id, authStatus, draftLocalStorageKey]);

    useEffect(() => {
        if (mode === 'retake' && !retakeStartTime && !isRetakeFinished) {
            setRetakeStartTime(Date.now());
        }
    }, [mode, retakeStartTime, isRetakeFinished]);

    useEffect(() => {
        if (draftLocalStorageKey && isActive && !hasFinalSubmission && Object.keys(submissions).length > 0) {
            localStorage.setItem(draftLocalStorageKey, JSON.stringify(submissions));
        }
    }, [submissions, isActive, hasFinalSubmission, draftLocalStorageKey]);
    
    useEffect(() => {
        if (retakeLocalStorageKey && mode === 'retake' && !isRetakeFinished) {
            localStorage.setItem(retakeLocalStorageKey, JSON.stringify(retakeSubmissions));
        }
    }, [retakeSubmissions, mode, isRetakeFinished, retakeLocalStorageKey]);


    // Handlers
    const handleOptionSelect = (problemId: string, option: string) => {
        if (mode === 'retake') {
            if (!isRetakeFinished) { setRetakeSubmissions(prev => ({ ...prev, [problemId]: option })); }
        } else if (isActive && !hasFinalSubmission) {
            setSubmissions(prev => ({ ...prev, [problemId]: option }));
        }
    };
    
    const handleFinalSubmit = useCallback(async (isAutoSubmit = false) => {
        if (!contest || isSubmitting || hasFinalSubmission || !isActive) return;

        if (!isAutoSubmit) {
            const confirmed = window.confirm("Are you sure you want to submit? You cannot change your answers after this.");
            if (!confirmed) return;
        } else {
             toast.info("Time's up! Submitting your answers automatically...");
        }

        setIsSubmitting(true);
        try {
            const submissionData = Object.entries(submissions).map(([problemId, option]) => ({
                problemId,
                contestId: contest._id,
                selectedOptions: [option],
            }));

            await axios.post('/api/submissions/final', { userId: session?.user?._id, submissions: submissionData });

            setHasFinalSubmission(true);
            toast.success('Final submission successful!');
            if (draftLocalStorageKey) localStorage.removeItem(draftLocalStorageKey);
            router.push(`/contests/${contest._id}/standings`);

        } catch (error: any) {
            console.error("Final Submission Error:", error.response?.data || error.message);
            if (error.response?.data?.error === "You have already made a final submission") {
                setHasFinalSubmission(true);
                toast.error(error.response.data.error);
            } else {
                toast.error(`Submission failed: ${error.response?.data?.message || 'Please try again.'}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    }, [contest, isSubmitting, hasFinalSubmission, isActive, submissions, session?.user?._id, draftLocalStorageKey, router]);


    const handleFinishRetake = useCallback(() => {
        if (!contest || isRetakeFinished) return;
        
        const score = contest.problems.reduce((currentScore, problem) => {
            const userAnswer = retakeSubmissions[problem._id];
            if (userAnswer && userAnswer === problem.correctOption) {
                return currentScore + (problem.score || 0);
            }
            return currentScore;
        }, 0);

        setRetakeScore({ score, total: totalPossibleScore });
        setIsRetakeFinished(true);
        if (retakeLocalStorageKey) localStorage.removeItem(retakeLocalStorageKey);
    }, [contest, retakeSubmissions, totalPossibleScore, retakeLocalStorageKey, isRetakeFinished]);


    const handleRestartRetake = () => {
        if (window.confirm("Are you sure you want to restart? Your current practice progress and score will be lost.")) {
             setIsRetakeFinished(false);
             setRetakeSubmissions({});
             setRetakeScore(null);
             setRetakeStartTime(Date.now());
             if (retakeLocalStorageKey) localStorage.removeItem(retakeLocalStorageKey);
        }
    };

    // Render Logic
    const renderProblemOption = (problem: Problem, option: string, optIndex: number) => {
        const isReviewMode = isEnded && !mode;
        const isRetakeReviewMode = mode === 'retake' && isRetakeFinished;

        let selectedOption: string | undefined;
        let isDisabled = !isActive || hasFinalSubmission;
        let variant: "default" | "outline" | "secondary" = "outline";
        let extraClasses = "";
        let icon = null;

        if (mode === 'retake') {
            selectedOption = retakeSubmissions[problem._id];
            isDisabled = isRetakeFinished;
        } else {
            selectedOption = submissions[problem._id];
        }

        if (selectedOption === option) {
            variant = "default";
        }
        
        if (isReviewMode || isRetakeReviewMode) {
            isDisabled = true;
            const correctOpt = problem.correctOption;
            const isCorrectAnswer = option === correctOpt;
            const isSelectedAnswer = option === selectedOption;

            if (isCorrectAnswer) {
                variant = "secondary";
                extraClasses = "border-2 border-green-500 bg-green-500/10 hover:bg-green-500/20";
                if(isSelectedAnswer) icon = <CheckCircle className="ml-auto h-5 w-5 text-green-600" />;
            } else if (isSelectedAnswer && !isCorrectAnswer) {
                variant = "secondary";
                extraClasses = "border-2 border-red-500 bg-red-500/10 hover:bg-red-500/20";
                icon = <XCircle className="ml-auto h-5 w-5 text-red-600" />;
            }
        }

        return (
             <Button
                key={optIndex}
                variant={variant}
                className={cn("w-full text-left justify-start h-auto py-2.5 sm:py-2 whitespace-normal border text-sm", extraClasses)}
                onClick={() => handleOptionSelect(problem._id, option)}
                disabled={isDisabled}
                aria-pressed={selectedOption === option}
            >
                <span className="font-medium mr-2 text-foreground">{String.fromCharCode(65 + optIndex)}.</span>
                <span className="flex-1">{option}</span>
                {icon}
            </Button>
        );
    };
    
    if (authStatus === 'loading' || isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
    }
     if (!session) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] px-4">
                <p className="text-xl text-destructive mb-4 text-center">Please log in to view the contest.</p>
                <Link href="/sign-in"><Button>Login</Button></Link>
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
        <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
                 <div className="w-full sm:w-auto">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
                        {mode === 'retake' && <span className="text-primary">Retake: </span>}
                        {contest.title}
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {startTime?.toLocaleString()} - {endTime?.toLocaleString()}
                        {!isActive && isEnded && <span className="ml-2 font-semibold text-destructive">(Ended)</span>}
                        {isActive && <span className="ml-2 font-semibold text-green-600">(Active)</span>}
                        {mode === 'retake' && <span className="ml-2 font-bold text-blue-500">(Practice Mode)</span>}
                    </p>
                </div>
                <div className="flex flex-col-reverse sm:flex-row items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-end sm:justify-normal">
                    <div className="flex gap-2 w-full sm:w-auto">
                        {mode !== 'retake' && <Link href={`/contests/${contest._id}/standings`} className="flex-1 sm:flex-initial"><Button variant="outline" className="w-full"><span className="hidden sm:inline">View </span>Standings</Button></Link>}
                        {isActive && <Button onClick={() => handleFinalSubmit(false)} disabled={isSubmitting || hasFinalSubmission} className={cn("flex-1 sm:flex-initial w-full", hasFinalSubmission ? 'bg-gray-400' : '')}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{hasFinalSubmission ? 'Submitted' : 'Final Submit'}</Button>}
                        {isEnded && mode !== 'retake' && <Link href={`?mode=retake`} className="flex-1 sm:flex-initial"><Button className="w-full bg-blue-600 hover:bg-blue-700"><RefreshCw className="mr-2 h-4 w-4" />Retake Contest</Button></Link>}
                        {mode === 'retake' && !isRetakeFinished && <Button onClick={() => handleFinishRetake()} className="flex-1 sm:flex-initial w-full">Finish Practice</Button>}
                        {mode === 'retake' && isRetakeFinished && <Button onClick={handleRestartRetake} variant="secondary" className="flex-1 sm:flex-initial w-full"><RefreshCw className="mr-2 h-4 w-4"/>Restart Practice</Button>}
                    </div>
                     {isActive && !hasFinalSubmission && endTime && (
                        <ContestTimer expiryTimestamp={endTime.getTime()} onExpire={() => handleFinalSubmit(true)} />
                    )}
                    {mode === 'retake' && !isRetakeFinished && retakeExpiryTimestamp && (
                        <ContestTimer expiryTimestamp={retakeExpiryTimestamp} onExpire={handleFinishRetake} />
                    )}
                </div>
            </div>

            {/* Banners */}
            {isEnded && !mode && hasFinalSubmission && <div className="mb-6 p-3 bg-accent text-accent-foreground rounded-md text-sm border">This is a review of your final submission. To practice again, click the "Retake Contest" button.</div>}
            {isEnded && !mode && !hasFinalSubmission && <div className="mb-6 p-3 bg-orange-500/10 text-orange-600 rounded-md text-sm border border-orange-500/20">You did not make a final submission for this contest. You can still retake it for practice.</div>}
            {mode === 'retake' && isRetakeFinished && (
                <div className="mb-6 p-3 bg-green-500/10 text-green-700 rounded-md text-sm border border-green-500/20 dark:text-green-300">
                    Practice finished! Here are your results.
                    {retakeScore !== null && (
                        <p className="font-semibold mt-1">
                            Your practice score:
                            <span className="text-lg ml-2 font-bold text-green-800 dark:text-green-200">
                                {retakeScore.score} / {retakeScore.total}
                            </span>
                        </p>
                    )}
                    <p className="text-xs mt-1">This does not affect your official score or standings.</p>
                </div>
            )}
            
            {availableSubjects.length > 0 ? (
                <Tabs defaultValue={availableSubjects[0]} className="w-full">
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
                            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
                                {problems.map((problem, index) => (
                                    <Card key={problem._id} className="flex flex-col">
                                        <CardHeader>
                                            <CardTitle className="text-base sm:text-lg leading-snug">{`Problem ${index + 1}: ${problem.title}`}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-4">
                                            {problem.imageUrl && (
                                                <div className="mb-4 border rounded-md bg-muted/40 flex justify-center p-2 sm:p-0">
                                                     <Image src={problem.imageUrl} alt={`Illustration for ${problem.title}`} width={400} height={300} className="object-contain max-h-[250px] sm:max-h-[300px] rounded" priority={index < 2}/>
                                                </div>
                                            )}
                                            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: problem.description }} />
                                            <div className="space-y-2 pt-2">
                                                {problem.options.map((option, optIndex) => renderProblemOption(problem, option, optIndex))}
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

// Export the page with Suspense boundary for useSearchParams
export default function ContestPage(props: ContestPageProps) {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <ContestPageContent {...props} />
        </Suspense>
    );
}