// src/components/revise/cards/QuizCard.tsx
import { useState } from 'react';
import { Card as ShadCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardContent as CardContentType } from '@/lib/ai/types';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export const QuizCard = ({ card }: { card: CardContentType }) => {
    const { question, options, correctAnswerIndex } = card.content as any;
    const [selected, setSelected] = useState<number | null>(null);
    const [submitted, setSubmitted] = useState(false);

    const handleSelect = (index: number) => {
        if (submitted) return;
        setSelected(index);
        setSubmitted(true);
    };
    
    return (
        <ShadCard className="w-full h-full flex flex-col shadow-xl border-secondary/20 bg-card/80 backdrop-blur-lg">
            <CardHeader className="flex-grow flex items-center">
                <CardTitle className="text-2xl md:text-3xl text-center font-bold">{question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
                {options.map((option: string, index: number) => {
                    const isCorrect = index === correctAnswerIndex;
                    const isSelected = index === selected;
                    
                    return (
                        <motion.div whileTap={submitted ? {} : { scale: 0.98 }} key={index}>
                            <Button
                                onClick={() => handleSelect(index)}
                                disabled={submitted}
                                className={cn(
                                    "w-full h-auto py-4 text-base justify-start whitespace-normal",
                                    submitted && isCorrect && "bg-green-500 hover:bg-green-500",
                                    submitted && isSelected && !isCorrect && "bg-destructive hover:bg-destructive"
                                )}
                                variant={submitted && !isSelected && !isCorrect ? "outline" : "default"}
                            >
                                <span className="font-bold mr-3">{String.fromCharCode(65 + index)}.</span>
                                {option}
                            </Button>
                        </motion.div>
                    );
                })}
            </CardContent>
        </ShadCard>
    );
};