import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card as ShadCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardContent as CardContentType, TrueOrFalseContent } from '@/lib/ai/types';
import { cn } from '@/lib/utils';

interface TrueOrFalseCardProps {
    card: CardContentType;
    onAnswer: (isCorrect: boolean) => void;
    onCorrect: () => void;
}

export const TrueOrFalseCard: React.FC<TrueOrFalseCardProps> = ({ card, onAnswer, onCorrect }) => {
    const { statement, isTrue } = card.content as TrueOrFalseContent;
    const [selection, setSelection] = useState<'true' | 'false' | null>(null);

    const handleSelect = (choice: 'true' | 'false') => {
        if (selection) return;
        setSelection(choice);
        const correct = (choice === 'true' && isTrue) || (choice === 'false' && !isTrue);
        onAnswer(correct);
        if (correct) {
            onCorrect();
        }
    };

    const getButtonClass = (buttonType: 'true' | 'false') => {
        if (!selection) return "bg-background hover:bg-accent text-foreground";
        const isButtonCorrect = (buttonType === 'true' && isTrue) || (buttonType === 'false' && !isTrue);
        if (isButtonCorrect) return "bg-green-500 hover:bg-green-500 text-white";
        if (selection === buttonType) return "bg-destructive hover:bg-destructive text-white animate-shake";
        return "bg-background opacity-50 text-foreground/50";
    };

    return (
        <ShadCard className="w-full h-full flex flex-col shadow-xl bg-card/80 backdrop-blur-lg">
            <CardHeader className="flex-grow flex items-center justify-center p-6">
                <CardTitle className="text-2xl md:text-3xl text-center font-bold">"{statement}"</CardTitle>
            </CardHeader>
            <CardContent className="flex-shrink-0 grid grid-cols-2 gap-4 p-6">
                <motion.div whileTap={selection ? {} : { scale: 0.97 }}>
                    <Button
                        onClick={() => handleSelect('true')}
                        disabled={!!selection}
                        className={cn("w-full h-24 text-2xl font-black", getButtonClass('true'))}
                    >
                        True
                    </Button>
                </motion.div>
                <motion.div whileTap={selection ? {} : { scale: 0.97 }}>
                    <Button
                        onClick={() => handleSelect('false')}
                        disabled={!!selection}
                        className={cn("w-full h-24 text-2xl font-black", getButtonClass('false'))}
                    >
                        False
                    </Button>
                </motion.div>
            </CardContent>
            <style>{`@keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } } .animate-shake { animation: shake 0.3s ease-in-out; }`}</style>
        </ShadCard>
    );
};