import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as ShadCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, BookCheck } from 'lucide-react';
import { CardContent as CardContentType, ProblemContent } from '@/lib/ai/types';
import { CommentsSection } from './CommentsSection';

interface ProblemCardProps {
    card: CardContentType;
    onCorrect: () => void; // Assuming viewing the solution counts as learning/correct
    onAnswer?: (isCorrect: boolean) => void; // Accept optional prop to satisfy the parent
}

export const ProblemCard: React.FC<ProblemCardProps> = ({ card, onCorrect }) => {
    const { problemStatement, hint, solution } = card.content as ProblemContent;
    const [viewState, setViewState] = useState<'problem' | 'hint' | 'solution'>('problem');
    const [hasAwardedXp, setHasAwardedXp] = useState(false);

    const handleRevealSolution = () => {
        if (!hasAwardedXp) {
            onCorrect();
            setHasAwardedXp(true);
        }
        setViewState('solution');
    };

    return (
        <ShadCard className="w-full h-full flex flex-col shadow-xl border-destructive/20 bg-card/80 backdrop-blur-lg">
            <CardHeader className="flex-shrink-0">
                <CardTitle className="text-xl md:text-2xl text-center font-bold text-destructive">
                    Problem Challenge
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center text-center p-4 overflow-y-auto min-h-0">
                <p className="text-lg md:text-xl whitespace-pre-wrap">{problemStatement}</p>
            </CardContent>
            <div className="p-4 flex-shrink-0">
                <AnimatePresence mode="wait">
                    {viewState === 'solution' ? (
                        <motion.div
                            key="solution"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-accent/50 rounded-lg max-h-48 overflow-y-auto text-left"
                        >
                            <h4 className="font-bold text-primary mb-2">Solution:</h4>
                            <p className="text-sm whitespace-pre-wrap">{solution}</p>
                        </motion.div>
                    ) : viewState === 'hint' ? (
                        <motion.div
                            key="hint"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3 bg-yellow-500/10 border-l-4 border-yellow-500 rounded text-left"
                        >
                            <p className="font-semibold text-yellow-600 dark:text-yellow-400">Hint:</p>
                            <p className="italic text-muted-foreground">"{hint}"</p>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                {viewState !== 'solution' && (
                    <div className="flex gap-3 mt-4">
                        <Button variant="outline" className="flex-1" onClick={() => setViewState('hint')}>
                            <Lightbulb className="mr-2 h-4 w-4" /> Get a Hint
                        </Button>
                        <Button className="flex-1" onClick={handleRevealSolution}>
                            <BookCheck className="mr-2 h-4 w-4" /> Show Solution
                        </Button>
                    </div>
                )}

            </div>
             {card.comments && <CommentsSection comments={card.comments} />}
        </ShadCard>
    );
};