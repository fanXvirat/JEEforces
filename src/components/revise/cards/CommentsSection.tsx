import React from 'react';
import { CardFooter } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { Comment } from '@/lib/ai/types';

interface CommentsSectionProps {
    comments?: Comment[];
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({ comments }) => {
    if (!comments || comments.length === 0) return null;

    return (
        <CardFooter className="flex-col items-start gap-2 p-4 border-t max-h-40 overflow-y-auto">
             <h4 className="font-semibold text-sm flex items-center gap-2 mb-1 text-muted-foreground">
                <MessageCircle className="h-4 w-4"/>
                Community Chatter
             </h4>
            {comments.map((comment, index) => (
                <div key={index} className="text-xs">
                    <span className="font-bold text-primary/90">{comment.username}: </span>
                    <span className="text-muted-foreground">{comment.text}</span>
                </div>
            ))}
        </CardFooter>
    );
};