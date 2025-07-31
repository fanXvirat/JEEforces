'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

// UI Components from Shadcn
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DifficultyBadge } from '@/components/ui/difficulty-badge';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Icons
import { Loader2, ArrowLeft, Trophy, BarChart2, CheckCircle, Swords, XCircle, Clock, Award } from 'lucide-react';

// --- Type Definitions ---

interface ProblemDetails {
    _id: string;
    title: string;
    description: string;
    difficulty: number;
    score: number;
    tags: string[];
    subject: string;
    options: string[];
    correctOption: string;
    solution?: string;
    imageUrl?: string;
}

interface DifficultyCounts {
    1: number; // Easy
    2: number; // Medium
    3: number; // Hard
}

interface Milestone {
    text: string;
    faceImage: string;
}
interface FailedProblemInfo {
    problem: ProblemDetails;
    userAnswer: string;
}
type GameState = 'loading' | 'selecting_subjects' | 'solving' | 'choosing' | 'finished';
const ALL_SUBJECTS = ['Physics', 'Chemistry', 'Mathematics'];

// --- The Main Practice Page Component ---

export default function PracticePage() {
    // Game flow state
    const [gameState, setGameState] = useState<GameState>('loading');
    const [failedProblem, setFailedProblem] = useState<FailedProblemInfo | null>(null);
    const [currentProblem, setCurrentProblem] = useState<ProblemDetails | null>(null);
    const [nextProblems, setNextProblems] = useState<ProblemDetails[]>([]);
    
    // Session tracking and analytics
    const [streak, setStreak] = useState(0);
    const [solvedProblems, setSolvedProblems] = useState<ProblemDetails[]>([]);
    const [difficultyCounts, setDifficultyCounts] = useState<DifficultyCounts>({ 1: 0, 2: 0, 3: 0 });
    const [selectedSubjects, setSelectedSubjects] = useState<string[]>(ALL_SUBJECTS);
    
    // User interaction state
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

    const [seconds, setSeconds] = useState(0);
    const [activeMilestone, setActiveMilestone] = useState<Milestone | null>(null);

    // --- Core Logic Functions ---

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (gameState === 'solving' || gameState === 'choosing') {
            interval = setInterval(() => {
                setSeconds(s => s + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [gameState]);

    useEffect(() => {
        if (streak === 0) return;

        let milestone: Milestone | null = null;
        switch (streak) {
            case 1:
                milestone = { text: "lets gooo !!", faceImage: "/faces/angry (1) (1).gif" };
                break;
            case 3:
                milestone = { text: "chaloo fod do aaj !!", faceImage: "/faces/gifgit (2).gif" };
                break;
            case 5:
                milestone = { text: "bow down to the king!", faceImage: "/faces/gifgit (1) (1).gif" };
                break;
            case 10:
                milestone = { text: "LEGEND!", faceImage: "/faces/physics-wallah-pw (1).gif" };
                break;
        }

        if (milestone) {
            setActiveMilestone(milestone);
            const timer = setTimeout(() => setActiveMilestone(null), 3500);
            return () => clearTimeout(timer);
        }
    }, [streak]);

    const fetchRandomProblems = useCallback(async (count: number, subjects: string[]) => {
        try {
            const params = new URLSearchParams({ count: count.toString() });
            if (subjects.length > 0) {
                params.append('subjects', subjects.join(','));
            }
            const { data } = await axios.get(`/api/problems/random?${params.toString()}`);
            return data;
        } catch (error) {
            toast.error("Failed to load new problems. You may have solved them all for the selected subjects!");
            throw error;
        }
    }, []);

    const startSession = useCallback(async () => {
        setGameState('selecting_subjects');
        setStreak(0);
        setSeconds(0);
        setSolvedProblems([]);
        setDifficultyCounts({ 1: 0, 2: 0, 3: 0 });
        setSelectedOption(null);
        setIsCorrect(null);
        setFailedProblem(null);
    }, []);

    useEffect(() => {
        startSession();
    }, [startSession]);

    const handleStartPractice = async () => {
        if (selectedSubjects.length === 0) {
            toast.error("Please select at least one subject to start.");
            return;
        }
        setGameState('loading');
        try {
            const problem = await fetchRandomProblems(1, selectedSubjects);
            setCurrentProblem(problem);
            setGameState('solving');
        } catch (e) {
            setGameState('finished');
        }
    };
    
    const handleCheckAnswer = async () => {
        if (!selectedOption || !currentProblem) return;

        try {
            const { data } = await axios.post('/api/submissions/practice', {
                problemId: currentProblem._id,
                selectedOption: selectedOption,
            });

            const wasCorrect = data.verdict === 'Correct';
            setIsCorrect(wasCorrect);

            if (wasCorrect) {
                setStreak(prev => prev + 1);

                setDifficultyCounts(prev => {
                    const difficultyKey = currentProblem.difficulty as keyof DifficultyCounts;
                    if (difficultyKey in prev) {
                        return { ...prev, [difficultyKey]: prev[difficultyKey] + 1 };
                    }
                    return prev;
                });

                setSolvedProblems(prev => [...prev, currentProblem]);

                setTimeout(() => {
                    setGameState('loading');
                    fetchRandomProblems(3, selectedSubjects).then(problems => {
                        setNextProblems(problems);
                        setGameState('choosing');
                    }).catch(() => setGameState('finished'));
                }, 1500);

            } else {
                setFailedProblem({
                    problem: currentProblem,
                    userAnswer: selectedOption,
                });
                axios.post('/api/user/update-streak', { streak });
                setTimeout(() => setGameState('finished'), 1500);
            }
        } catch (error) {
            toast.error("There was an error submitting your answer.");
            setIsCorrect(false);
        }
    };

    const handleChooseNext = (problem: ProblemDetails) => {
        setCurrentProblem(problem);
        setNextProblems([]);
        setSelectedOption(null);
        setIsCorrect(null);
        setGameState('solving');
    };
    
    const handleOptionSelect = (option: string) => {
        if (isCorrect === null) {
            setSelectedOption(option);
        }
    };

    const getOptionBorderColor = (optionText: string) => {
        if (isCorrect !== null && currentProblem) {
            if (optionText === currentProblem.correctOption) return 'border-green-500 bg-green-900/30 ring-2 ring-green-500';
            if (optionText === selectedOption) return 'border-red-500 bg-red-900/30';
        }
        if (selectedOption === optionText) return 'border-primary bg-accent ring-2 ring-primary';
        return 'border-border hover:border-muted-foreground/50';
    };

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const secondsLeft = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`;
    };

    const pageVariants = {
        initial: { opacity: 0, y: 20 },
        in: { opacity: 1, y: 0 },
        out: { opacity: 0, y: -20 },
    };
    const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5 };

    const renderSubjectSelection = () => (
        <motion.div key="selecting_subjects" variants={pageVariants} transition={pageTransition} initial="initial" animate="in" exit="out" className="container mx-auto px-4 py-8 max-w-lg">
            <Card className="text-center w-full shadow-lg border">
                <CardHeader>
                    <CardTitle className="text-3xl font-bold mt-4">Practice Dimension</CardTitle>
                    <CardDescription>Select the subjects you want to practice.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 text-left">
                        {ALL_SUBJECTS.map((subject) => (
                            <div key={subject} className="flex items-center space-x-2">
                                <Checkbox
                                    id={subject.toLowerCase()}
                                    checked={selectedSubjects.includes(subject)}
                                    onCheckedChange={(checked: any) => {
                                        setSelectedSubjects(prev => 
                                            checked 
                                            ? [...prev, subject]
                                            : prev.filter(s => s !== subject)
                                        )
                                    }}
                                />
                                <Label htmlFor={subject.toLowerCase()} className="text-lg font-medium cursor-pointer">
                                    {subject}
                                </Label>
                            </div>
                        ))}
                    </div>
                    <Button onClick={handleStartPractice} size="lg" className="w-full mt-4">
                        Start Practice Session
                    </Button>
                </CardContent>
            </Card>
        </motion.div>
    );

    // --- Render ---
    return (
        <>
            <AnimatePresence>
                {activeMilestone && (
                    <motion.div
                        initial={{ opacity: 0, y: -100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 20, scale: 1 }}
                        exit={{ opacity: 0, y: -100, scale: 0.8, transition: { duration: 0.3 } }}
                        className="fixed top-0 left-1/2 -translate-x-1/2 z-50 p-4 bg-background border-2 border-yellow-400 rounded-xl shadow-lg flex items-center gap-4"
                    >
                        <Image src={activeMilestone.faceImage} alt="Motivational Face" width={60} height={60} unoptimized={true} />
                        <p className="text-xl font-bold text-primary">{activeMilestone.text}</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
                {gameState === 'loading' && (
                    <motion.div key="loading" className="flex flex-col justify-center items-center min-h-[calc(100vh-100px)] gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="text-muted-foreground">Preparing your next challenge...</p>
                    </motion.div>
                )}
                {gameState === 'selecting_subjects' && renderSubjectSelection()}
                {gameState === 'finished' && (
                    <motion.div key="finished" variants={pageVariants} transition={pageTransition} initial="initial" animate="in" exit="out" className="container mx-auto px-4 py-8 max-w-2xl">
                        <Card className="text-center w-full shadow-lg border">
                            <CardHeader>
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1, transition: { delay: 0.2, type: 'spring' } }}>
                                    <Trophy className="h-16 w-16 mx-auto text-yellow-500" />
                                </motion.div>
                                <CardTitle className="text-3xl font-bold mt-4">Session Over!</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 px-4 sm:px-6">
                                <div className="flex justify-around items-center p-4 bg-muted rounded-lg">
                                    <div>
                                        <p className="text-lg text-muted-foreground">Final Streak</p>
                                        <p className="text-6xl font-bold text-primary">{streak}</p>
                                    </div>
                                    <div>
                                        <p className="text-lg text-muted-foreground">Total Time</p>
                                        <p className="text-4xl font-bold text-primary">{formatTime(seconds)}</p>
                                    </div>
                                </div>
                                
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-center gap-2 text-xl"><BarChart2 className="h-6 w-6" /> Session Analytics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex justify-around text-center">
                                        <div><p className="text-3xl font-bold text-green-500">{difficultyCounts[1]}</p><p className="text-sm text-muted-foreground">Easy</p></div>
                                        <div><p className="text-3xl font-bold text-yellow-500">{difficultyCounts[2]}</p><p className="text-sm text-muted-foreground">Medium</p></div>
                                        <div><p className="text-3xl font-bold text-red-500">{difficultyCounts[3]}</p><p className="text-sm text-muted-foreground">Hard</p></div>
                                    </CardContent>
                                </Card>

                                {streak >= 1 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-center gap-2 text-xl"><Award className="h-6 w-6" /> Badges Earned</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex justify-center gap-4 flex-wrap">
                                            {streak >= 1 && <motion.div initial={{opacity: 0, scale: 0.5}} animate={{opacity: 1, scale: 1, transition:{delay: 0.3}}}><Image src="/badges/streak-1.png" alt="1 Streak Badge" width={80} height={80} title="First Step!" /></motion.div>}
                                            {streak >= 3 && <motion.div initial={{opacity: 0, scale: 0.5}} animate={{opacity: 1, scale: 1, transition:{delay: 0.4}}}><Image src="/badges/streak-3.png" alt="3 Streak Badge" width={80} height={80} title="Triple Threat!" /></motion.div>}
                                            {streak >= 5 && <motion.div initial={{opacity: 0, scale: 0.5}} animate={{opacity: 1, scale: 1, transition:{delay: 0.5}}}><Image src="/badges/streak-5.png" alt="5 Streak Badge" width={80} height={80} title="High Five!" /></motion.div>}
                                            {streak >= 10 && <motion.div initial={{opacity: 0, scale: 0.5}} animate={{opacity: 1, scale: 1, transition:{delay: 0.6}}}><Image src="/badges/streak-10.png" alt="10 Streak Badge" width={80} height={80} title="Perfect Ten!" /></motion.div>}
                                        </CardContent>
                                    </Card>
                                )}
                                
                                {failedProblem && (
                                    <Card className="border-red-500/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center justify-center gap-2 text-xl text-red-500">
                                                <XCircle className="h-6 w-6" /> The One That Got Away
                                            </CardTitle>
                                            <CardDescription>
                                                Here's a review of the problem where the streak ended.
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="text-left space-y-4">
                                            <h4 className="font-semibold">{failedProblem.problem.title}</h4>
                                            
                                            <p className="text-sm">
                                                <span className="font-semibold">Your Answer: </span>
                                                <span className="font-bold p-1 bg-red-900/40 rounded" dangerouslySetInnerHTML={{ __html: failedProblem.userAnswer }} />
                                            </p>

                                            <p className="text-sm">
                                                <span className="font-semibold">Correct Answer: </span>
                                                <span className="font-bold p-1 bg-green-900/40 rounded" dangerouslySetInnerHTML={{ __html: failedProblem.problem.correctOption }} />
                                            </p>

                                            <Accordion type="single" collapsible className="w-full">
                                                <AccordionItem value="solution">
                                                    <AccordionTrigger>View Detailed Solution</AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: failedProblem.problem.solution || 'No detailed solution provided.' }} />
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>
                                        </CardContent>
                                    </Card>
                                )}

                                {solvedProblems.length > 0 && (
                                    <div className="text-left pt-4">
                                       <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                                           <CheckCircle className="text-green-500" /> Correctly Answered
                                       </h3>
                                       <Accordion type="single" collapsible className="w-full">
                                           {solvedProblems.map(p => (
                                               <AccordionItem value={p._id} key={p._id}>
                                                   <AccordionTrigger className='text-left'>{p.title}</AccordionTrigger>
                                                   <AccordionContent>
                                                        <h4 className="font-semibold text-md mb-2">Solution:</h4>
                                                        <div className="prose prose-sm dark:prose-invert max-w-none mb-4 p-2 bg-background rounded" dangerouslySetInnerHTML={{ __html: p.solution || 'No detailed solution provided.' }} />
                                                        <p className="text-sm font-semibold">Correct Answer: <span className="font-normal p-1 bg-green-900/30 rounded" dangerouslySetInnerHTML={{ __html: p.correctOption }} /></p>
                                                   </AccordionContent>
                                               </AccordionItem>
                                           ))}
                                       </Accordion>
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
                                   <Button onClick={startSession} className="w-full" size="lg">Play Again</Button>
                                   <Link href="/problems" className="w-full"><Button variant="outline" className="w-full" size="lg">Back to Problems</Button></Link>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
                
                {gameState === 'choosing' && (
                    <motion.div key="choosing" variants={pageVariants} transition={pageTransition} initial="initial" animate="in" exit="out" className="container mx-auto px-4 py-8">
                        <div className="text-center mb-8">
                            <motion.div initial={{scale:0}} animate={{scale:1}}><CheckCircle className="h-12 w-12 mx-auto text-green-500" /></motion.div>
                            <h1 className="text-3xl font-bold mt-4">Correct! Current Streak: {streak}</h1>
                            <p className="text-muted-foreground text-lg">Choose your next challenge.</p>
                        </div>
                        <motion.div 
                            className="grid grid-cols-1 md:grid-cols-3 gap-6"
                            initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                        >
                            {nextProblems.length > 0 ? nextProblems.map((p) => (
                                <motion.div key={p._id} variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
                                    <Card className="flex flex-col h-full justify-between hover:border-primary hover:shadow-xl transition-all cursor-pointer" onClick={() => handleChooseNext(p)}>
                                        <CardHeader><CardTitle>{p.title}</CardTitle><CardDescription>{p.subject}</CardDescription></CardHeader>
                                        <CardContent className="flex items-center gap-2"><DifficultyBadge difficulty={p.difficulty} /><Badge variant="secondary">Score: {p.score}</Badge></CardContent>
                                    </Card>
                                </motion.div>
                            )) : <p className="text-center md:col-span-3 text-muted-foreground">Searching for more problems...</p>}
                        </motion.div>
                    </motion.div>
                )}

                {gameState === 'solving' && currentProblem && (
                    <motion.div key="solving" variants={pageVariants} transition={pageTransition} initial="initial" animate="in" exit="out" className="container mx-auto px-4 py-8 max-w-4xl">
                        <div className="flex justify-between items-center mb-6">
                             <Link href="/problems" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"><ArrowLeft className="h-4 w-4 mr-1" />Exit Practice</Link>
                             <div className="flex items-center gap-4 p-2 bg-muted rounded-lg">
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Streak</p>
                                    <p className="text-2xl font-bold text-primary">{streak}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Time</p>
                                    <p className="text-2xl font-bold text-primary">{formatTime(seconds)}</p>
                                </div>
                             </div>
                        </div>

                        <Card className="border shadow-sm">
                            <CardHeader className="border-b pb-4">
                                 <h1 className="text-2xl font-bold">{currentProblem.title}</h1>
                                 <div className="flex flex-wrap items-center gap-2 text-sm mt-2">
                                    <DifficultyBadge difficulty={currentProblem.difficulty} /><Badge variant="outline">{currentProblem.subject}</Badge><Badge variant="secondary">Score: {currentProblem.score}</Badge>
                                 </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {currentProblem.imageUrl && <div className="my-4 flex justify-center"><Image src={currentProblem.imageUrl} alt={currentProblem.title} width={400} height={250} className="rounded-md object-contain max-h-[400px]" /></div>}
                                <div className="prose dark:prose-invert max-w-none text-card-foreground/80" dangerouslySetInnerHTML={{ __html: currentProblem.description }} />
                                
                                <div className="mt-8 space-y-3">
                                    <h3 className="text-lg font-semibold">Options</h3>
                                    {currentProblem.options.map((option) => (
                                        <motion.div key={option} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                            <div className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 ${getOptionBorderColor(option)}`} onClick={() => handleOptionSelect(option)}>
                                                 <span className="font-bold mr-3">{String.fromCharCode(65 + currentProblem.options.indexOf(option))}.</span>
                                                 <span dangerouslySetInnerHTML={{ __html: option }} />
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                                
                                <div className="mt-8 pt-6 border-t flex items-center gap-4">
                                    <Button size="lg" disabled={!selectedOption || isCorrect !== null} onClick={handleCheckAnswer}><Swords className='mr-2 h-4 w-4'/>{isCorrect === null ? "Submit Answer" : (isCorrect ? "Correct!" : "Incorrect!")}</Button>
                                    <AnimatePresence>
                                        {isCorrect !== null && (
                                            <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`flex items-center gap-2 font-bold ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                                {isCorrect ? <CheckCircle /> : <XCircle />}{isCorrect ? 'Correct!' : 'Incorrect!'}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}