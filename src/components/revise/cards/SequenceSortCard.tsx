import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card as ShadCard, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CardContent as CardContentType, SequenceSortContent } from '@/lib/ai/types';
import { CheckCircle, XCircle, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// You can keep this utility class here or move it to your globals.css
const scrollbarHideStyle = `
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
`;

export const SequenceSortCard: React.FC<{ card: CardContentType; onCorrect: () => void }> = ({ card, onCorrect }) => {
    const { instruction, items, sequenceSolution } = card.content as SequenceSortContent;
    const [unsorted, setUnsorted] = useState(items || []);
    const [sorted, setSorted] = useState<string[]>([]);
    const [isComplete, setIsComplete] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

    useEffect(() => {
        if (sorted.length === (items?.length || 0)) {
            const correct = sorted.join(',') === sequenceSolution.join(',');
            setIsCorrect(correct);
            setIsComplete(true);
            if (correct) onCorrect();
        }
    }, [sorted, items, sequenceSolution, onCorrect]);

    const handleSelect = (item: string) => {
        if (isComplete) return;
        setUnsorted(prev => prev.filter(i => i !== item));
        setSorted(prev => [...prev, item]);
    };

    const handleUndo = () => {
        if (sorted.length > 0) {
            const lastItem = sorted[sorted.length - 1];
            setSorted(prev => prev.slice(0, -1));
            setUnsorted(prev => [...prev, lastItem]);
            setIsComplete(false);
        }
    };

    return (
        <>
            <style>{scrollbarHideStyle}</style>
            <ShadCard className="w-full h-full flex flex-col shadow-xl bg-card/80 backdrop-blur-lg">
                <CardHeader className="flex-shrink-0">
                    <CardTitle className="text-xl md:text-2xl text-center">{instruction}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 grid grid-cols-2 gap-4 overflow-hidden p-4">
                    {/* Unsorted Items Column */}
                    <div className="bg-muted/50 p-3 rounded-lg flex flex-col min-h-0">
                        <h4 className="font-semibold text-center mb-2 flex-shrink-0">Unsorted Items</h4>
                        {/* *** THIS IS THE FIX *** */}
                        <div className="space-y-2 overflow-y-auto scrollbar-hide flex-grow">
                            <AnimatePresence>
                                {unsorted.map(item => (
                                    <motion.div layout key={item} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                                        <Button variant="secondary" className="w-full h-auto whitespace-normal" onClick={() => handleSelect(item)}>{item}</Button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                    {/* Sorted Items Column */}
                    <div className="bg-muted/50 p-3 rounded-lg flex flex-col min-h-0">
                        <h4 className="font-semibold text-center mb-2 flex-shrink-0">Your Sequence</h4>
                        {/* *** THIS IS THE FIX *** */}
                        <div className="space-y-2 overflow-y-auto scrollbar-hide flex-grow">
                            {sorted.map((item, index) => (
                                <motion.div layout key={index} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-background p-2 rounded-md text-left font-medium">
                                    <span className="font-bold mr-2 text-primary">{index + 1}.</span>{item}
                                </motion.div>
                            ))}
                            {sorted.length > 0 && !isComplete && (
                                <Button variant="ghost" size="sm" className="w-full mt-2" onClick={handleUndo}><Undo2 className="mr-2 h-4 w-4"/>Undo</Button>
                            )}
                        </div>
                    </div>
                </CardContent>
                {isComplete && (
                    <div className="p-4 text-center font-bold text-lg flex-shrink-0">
                        {isCorrect ? (
                            <Badge className="bg-green-500 p-2 text-base"><CheckCircle className="mr-2"/>Sequence Correct!</Badge>
                        ) : (
                            <>
                                <Badge variant="destructive" className="p-2 text-base"><XCircle className="mr-2"/>Sequence Incorrect!</Badge>
                                <div className="mt-4">
                                    <h5 className="font-semibold mb-2">Correct Sequence:</h5>
                                    <div className="space-y-1 text-left max-w-md mx-auto">
                                        {sequenceSolution.map((item, index) => (
                                            <div key={index} className="bg-background p-2 rounded-md font-medium">
                                                <span className="font-bold mr-2 text-primary">{index + 1}.</span>{item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </ShadCard>
        </>
    );
};