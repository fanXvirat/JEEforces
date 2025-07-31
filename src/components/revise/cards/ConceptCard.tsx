// src/components/revise/cards/ConceptCard.tsx
import { Card as ShadCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { CardContent as CardContentType } from '@/lib/ai/types';
interface ConceptCardProps {
    card: CardContentType;
    onAnswer?: (isCorrect: boolean) => void; // Optional prop
    onCorrect?: () => void; // Optional prop
}
export const ConceptCard: React.FC<ConceptCardProps> = ({ card }) => {
    const { title, explanation, analogy } = card.content as any;
    return (
        <ShadCard className="w-full h-full flex flex-col shadow-xl border-primary/20 bg-card/80 backdrop-blur-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl md:text-2xl">
                    <BookOpen className="h-6 w-6 text-primary" />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center text-base space-y-4 overflow-y-auto px-6 py-4">
                <p className="text-muted-foreground">{explanation}</p>
                {analogy && (
                    <div className="p-3 bg-accent/50 border-l-4 border-accent rounded">
                        <p className="font-semibold text-sm">Analogy:</p>
                        <p className="italic text-muted-foreground">"{analogy}"</p>
                    </div>
                )}
            </CardContent>
        </ShadCard>
    );
};