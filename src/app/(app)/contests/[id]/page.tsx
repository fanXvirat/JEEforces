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
import Image from 'next/image'; // Import Next.js Image for potential optimization

interface Problem {
    _id: string;
    title: string;
    description: string;
    options: string[];
    subject: string;
    score: number; // Keep score if needed elsewhere, though not displayed here
    imageUrl?: string; // Already included, good!
}

interface Contest {
    _id: string;
    title: string;
    startTime: string;
    endTime: string;
    problems: Problem[];
}

// Component Props Type
interface ContestPageProps {
     params: Promise<{ id: string }>; // Using Promise for params as per original code
}

export default function ContestPage({ params }: ContestPageProps) {
    const { data: session, status: authStatus } = useSession(); // Get auth status
    const router = useRouter();
    const unwrappedParams = use(params); // Unwrap the promise
    const contestId = unwrappedParams.id; // Get the ID

    const [contest, setContest] = useState<Contest | null>(null);
    const [submissions, setSubmissions] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasFinalSubmission, setHasFinalSubmission] = useState(false);

    const now = new Date();
    const startTime = contest ? new Date(contest.startTime) : null;
    const endTime = contest ? new Date(contest.endTime) : null;
    const isActive = contest && startTime && endTime && now >= startTime && now <= endTime;
    const isEnded = contest && endTime && now > endTime; // Added for clarity

    // Group problems by subject (case-insensitive)
    const groupedProblems = contest?.problems.reduce((acc, problem) => {
        const subject = problem.subject?.toLowerCase() || 'other'; // Handle potential missing subject
        if (!acc[subject]) acc[subject] = [];
        acc[subject].push(problem);
        return acc;
    }, {} as Record<string, Problem[]>);

    // Filter subjects based on available problems
    const availableSubjects = groupedProblems ? Object.keys(groupedProblems) : [];

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true); // Ensure loading starts
            try {
                // Ensure contestId is available before fetching
                if (!contestId) {
                    toast.error('Contest ID not found.');
                    setIsLoading(false);
                    return;
                }

                // Fetch contest details first
                const contestRes = await axios.get(`/api/contests/${contestId}`);
                setContest(contestRes.data);

                // Fetch final submissions only after ensuring user session exists
                if (session?.user?._id) {
                    try {
                        const submissionsRes = await axios.get(`/api/submissions?contestId=${contestId}&userId=${session.user._id}&IsFinal=true`);
                        if (submissionsRes.data && submissionsRes.data.length > 0) {
                            setHasFinalSubmission(true);
                            // Load existing final answers if needed for display (though maybe not needed if inputs are disabled)
                            const subs = submissionsRes.data.reduce((acc: Record<string, string>, sub: any) => {
                                acc[sub.problem._id] = sub.selectedOptions[0]; // Assuming single option selection
                                return acc;
                            }, {});
                            setSubmissions(subs);
                        } else {
                            setHasFinalSubmission(false); // Explicitly set to false if no final subs found
                        }
                    } catch (subError) {
                        console.error("Error fetching submissions:", subError);
                        // Decide how to handle submission fetch error - maybe allow attempt?
                        // toast.warning('Could not load previous submission status.');
                        setHasFinalSubmission(false); // Assume no final submission on error
                    }
                } else {
                    // No session, cannot check for final submissions
                    setHasFinalSubmission(false);
                }

            } catch (error) {
                console.error("Error fetching contest data:", error);
                toast.error('Failed to load contest data.');
                setContest(null); // Reset contest on error
            } finally {
                setIsLoading(false);
            }
        };

        // Trigger fetch only when contestId is available and auth status is not loading
        if (contestId && authStatus !== 'loading') {
            fetchData();
        } else if (authStatus !== 'loading' && !contestId) {
            setIsLoading(false); // No ID, stop loading
        }

    }, [contestId, session, authStatus]); // Add dependencies

    const handleOptionSelect = (problemId: string, option: string) => {
        // Only allow selection if contest is active and no final submission made
        if (isActive && !hasFinalSubmission) {
            setSubmissions(prev => ({ ...prev, [problemId]: option }));
        }
    };

    const handleFinalSubmit = async () => {
        if (!contest || isSubmitting || hasFinalSubmission || !isActive) return;

        // Confirmation dialog
        const confirmed = window.confirm("Are you sure you want to submit? You cannot change your answers after this.");
        if (!confirmed) return;


        setIsSubmitting(true);
        try {
            const submissionData = Object.entries(submissions).map(([problemId, option]) => ({
                problemId,
                contestId: contest._id,
                selectedOptions: [option], // Ensure it's an array
            }));

            // Make sure user ID is included if required by the backend endpoint
            await axios.post('/api/submissions/final', {
                userId: session?.user?._id, // Pass userId if needed
                submissions: submissionData
            });

            setHasFinalSubmission(true);
            toast.success('Final submission successful!');
            router.push(`/contests/${contest._id}/standings`);

        } catch (error: any) {
             console.error("Final Submission Error:", error.response?.data || error.message);
            if (error.response?.data?.error === "You have already made a final submission") {
                setHasFinalSubmission(true); // Sync state if server says already submitted
                toast.error(error.response.data.error);
            } else {
                toast.error(`Submission failed: ${error.response?.data?.message || 'Please try again.'}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Loading States
    if (authStatus === 'loading' || isLoading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>;
    }
     // No Session
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

    // Contest Fetch Failed
    if (!contest) {
        return <div className="text-center mt-10 text-red-500 font-semibold">Contest not found or failed to load.</div>;
    }

    // Contest Not Started Yet
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
            {/* Header */}
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
                    {/* Show submit button only if active */}
                    {isActive && (
                        <Button
                            onClick={handleFinalSubmit}
                            disabled={isSubmitting || hasFinalSubmission || !isActive} // Redundant isActive check, but safe
                            className={hasFinalSubmission ? 'bg-gray-400 hover:bg-gray-400' : ''} // Style disabled button
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

            {/* Final Submission Notice */}
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


            {/* Tabs for Subjects */}
            {availableSubjects.length > 0 ? (
                <Tabs defaultValue={availableSubjects[0]} className="w-full">
                    <TabsList className={` w-full grid-cols-${availableSubjects.length} mb-8 bg-muted`}>
                        {availableSubjects.includes('physics') && <TabsTrigger value="physics">Physics</TabsTrigger>}
                        {availableSubjects.includes('chemistry') && <TabsTrigger value="chemistry">Chemistry</TabsTrigger>}
                        {availableSubjects.includes('mathematics') && <TabsTrigger value="mathematics">Mathematics</TabsTrigger>}
                        {/* Add other potential subjects if needed */}
                        {availableSubjects.filter(s => !['physics', 'chemistry', 'mathematics'].includes(s)).map(subject => (
                             <TabsTrigger key={subject} value={subject} className="capitalize">{subject}</TabsTrigger>
                        ))}
                    </TabsList>

                    {Object.entries(groupedProblems || {}).map(([subject, problems]) => (
                        <TabsContent key={subject} value={subject}>
                            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"> {/* Adjusted grid for potentially wider cards */}
                                {problems.map((problem, index) => (
                                    <Card key={problem._id} className="flex flex-col"> {/* Added flex flex-col */}
                                        <CardHeader>
                                            {/* Added Problem Number */}
                                            <CardTitle className="text-lg">
                                                {`Problem ${index + 1}: ${problem.title}`}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-4"> {/* Added flex-grow and space-y */}
                                            {/* Problem Image */}
                                            {problem.imageUrl && (
                                                <div className="mb-4 border rounded-md bg-muted/40 flex justify-center">
                                                    <Image // Using Next.js Image
                                                        src={problem.imageUrl}
                                                        alt={`Illustration for ${problem.title}`}
                                                        width={400} // Provide appropriate width
                                                        height={300} // Provide appropriate height
                                                        className="object-contain max-h-[300px] rounded"
                                                        priority={index < 3} // Prioritize loading first few images
                                                    />
                                                </div>
                                            )}

                                            {/* Problem Description */}
                                            {/* Use prose for potential markdown/html, limit lines */}
                                            <div className="prose prose-sm max-w-none text-muted-foreground">
                                                <p>{problem.description}</p> {/* Render description safely */}
                                            </div>

                                            {/* Options */}
                                            <div className="space-y-2 pt-2">
                                                {problem.options.map((option, optIndex) => (
                                                    <Button
                                                        key={optIndex}
                                                        variant={submissions[problem._id] === option ? 'default' : 'outline'}
                                                        className="w-full text-left justify-start h-auto py-2 whitespace-normal border" // Allow text wrapping
                                                        onClick={() => handleOptionSelect(problem._id, option)}
                                                        disabled={!isActive || hasFinalSubmission} // Disable options based on state
                                                        aria-pressed={submissions[problem._id] === option}
                                                    >
                                                        <span className="font-medium mr-2 text-foreground">{String.fromCharCode(65 + optIndex)}.</span>
                                                        {/* Render option text safely */}
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