// src/components/revise/cards/MemeCard.tsx
import { Card as ShadCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CardContent as CardContentType } from '@/lib/ai/types';
import { motion } from 'framer-motion';

interface MemeCardProps {
    card: CardContentType;
    onAnswer?: (isCorrect: boolean) => void; // Optional prop
    onCorrect?: () => void; // Optional prop
}

export const MemeCard: React.FC<MemeCardProps> = ({ card }) => {

    const { title, imageUrl } = card.content as any;
    return (
        <ShadCard className="w-full h-full flex flex-col justify-between shadow-xl bg-black overflow-hidden">
            <CardHeader>
                <CardTitle className="text-lg md:text-xl font-bold text-center italic text-primary-foreground">
                    "{title}"
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center p-0">
                {imageUrl ? (
                    <motion.img
                        src={imageUrl}
                        alt={title}
                        className="object-contain w-full h-full"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                        <p className="text-muted-foreground animate-pulse">Generating Meme...</p>
                    </div>
                )}
            </CardContent>
        </ShadCard>
    );
};