import React, { useState } from 'react';
import { Card as ShadCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CardContent as CardContentType, FillInTheBlankContent } from '@/lib/ai/types';
import { toast } from 'sonner';

interface FillInTheBlankProps {
    card: CardContentType;
    onAnswer: (isCorrect: boolean) => void;
    onCorrect: () => void;
}

export const FillInTheBlankCard: React.FC<FillInTheBlankProps> = ({ card, onAnswer, onCorrect }) => {
    const { sentence, answers } = card.content as FillInTheBlankContent;
    const [userInput, setUserInput] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    const sentenceParts = sentence.split('[BLANK]');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (submitted) return;
        const correct = answers.some(ans => ans.toLowerCase().trim() === userInput.toLowerCase().trim());
        setIsCorrect(correct);
        setSubmitted(true);
        onAnswer(correct);
        if (correct) {
            onCorrect();
            toast.success("Correct!", { description: `+10 XP` });
        } else {
            toast.error("Not quite!", { description: `The correct answer is: ${answers[0]}` });
        }
    };

    return (
        <ShadCard className="w-full h-full flex flex-col justify-center text-center shadow-xl bg-card/80 backdrop-blur-lg">
            <CardHeader>
                <CardTitle className="text-xl md:text-2xl">Fill in the Blank</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <p className="text-2xl md:text-3xl font-semibold leading-relaxed">
                    {sentenceParts[0]}
                    <span className="font-bold text-primary mx-2 underline decoration-dashed">__________</span>
                    {sentenceParts[1]}
                </p>
                <form onSubmit={handleSubmit} className="flex w-full max-w-sm mx-auto items-center space-x-2">
                    <Input
                        type="text"
                        placeholder="Your answer..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={submitted}
                        className={`text-lg h-12 ${submitted && (isCorrect ? 'border-green-500' : 'border-destructive')}`}
                    />
                    <Button type="submit" disabled={submitted || !userInput}>Check</Button>
                </form>
            </CardContent>
        </ShadCard>
    );
};