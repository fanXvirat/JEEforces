import React from 'react';
import { Card as ShadCard, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { BrainCircuit } from 'lucide-react';
import { CardContent as CardContentType, MnemonicContent } from '@/lib/ai/types';
import { CommentsSection } from './CommentsSection';

interface MnemonicCardProps {
    card: CardContentType;
    onAnswer?: (isCorrect: boolean) => void; // Optional prop
    onCorrect?: () => void; // Optional prop
}

export const MnemonicCard: React.FC<MnemonicCardProps> = ({ card }) => {
    const { concept, mnemonic } = card.content as MnemonicContent;
    return (
        <ShadCard className="w-full h-full flex flex-col justify-center shadow-xl border-purple-500/20 bg-card/80 backdrop-blur-lg">
            <CardHeader className="items-center text-center">
                <BrainCircuit className="h-8 w-8 text-purple-400 mb-2" />
                <CardTitle className="text-2xl text-purple-400">Memory Hack!</CardTitle>
                <CardDescription>A mnemonic for: <span className="font-semibold text-foreground">{concept}</span></CardDescription>
            </CardHeader>
            <CardContent className="text-center p-6">
                <p className="text-2xl md:text-3xl font-medium leading-relaxed italic">"{mnemonic}"</p>
            </CardContent>
            {card.comments && <CommentsSection comments={card.comments} />}
        </ShadCard>
    );
};