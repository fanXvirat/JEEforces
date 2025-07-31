import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CardContent as CardContentType, FlashcardContent } from '@/lib/ai/types';

interface FlashcardProps {
    card: CardContentType;
    onCorrect: () => void;
}

export const FlashcardCard: React.FC<FlashcardProps> = ({ card, onCorrect }) => {
    const { question, answer } = card.content as FlashcardContent;
    const [isFlipped, setIsFlipped] = useState(false);
    const [hasAwardedXp, setHasAwardedXp] = useState(false);

    const handleFlip = () => {
        if (!hasAwardedXp) {
            onCorrect(); // Award points on the first reveal
            setHasAwardedXp(true);
        }
        setIsFlipped(!isFlipped);
    };

    const CardFace = ({ children, isBack = false }: { children: React.ReactNode, isBack?: boolean }) => (
        <div
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: isBack ? 'rotateY(180deg)' : '' }}
            className="absolute w-full h-full bg-card/80 backdrop-blur-lg border rounded-xl flex flex-col items-center justify-center p-6 text-center"
        >
            {children}
        </div>
    );

    return (
        <div
            className="w-full h-full cursor-pointer"
            onClick={handleFlip}
            style={{ perspective: '1200px' }}
        >
            <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
            >
                {/* Front of the card */}
                <CardFace>
                    <p className="text-sm text-muted-foreground mb-4">Question</p>
                    <p className="text-2xl lg:text-3xl font-bold">{question}</p>
                    <span className="absolute bottom-6 text-xs text-muted-foreground opacity-70">Tap to reveal answer</span>
                </CardFace>

                {/* Back of the card */}
                <CardFace isBack>
                    <p className="text-sm text-primary mb-4">Answer</p>
                    <p className="text-xl lg:text-2xl font-semibold">{answer}</p>
                    <span className="absolute bottom-6 text-xs text-muted-foreground opacity-70">Tap to see question</span>
                </CardFace>
            </motion.div>
        </div>
    );
};