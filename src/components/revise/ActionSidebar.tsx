'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Award, Flame, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Define the full set of props the sidebar will need
interface ActionSidebarProps {
  xp: number;
  streak: number;
  isLiked: boolean;
  onLike: () => void;
}

// A small component for the non-interactive stat displays
const StatDisplay = ({ children, tooltipText }: { children: React.ReactNode; tooltipText: string }) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className="w-12 h-12 rounded-full bg-card/10 backdrop-blur-sd border border-border flex flex-col items-center justify-center shadow-lg">
                {children}
            </div>
        </TooltipTrigger>
        <TooltipContent side="left">
            <p>{tooltipText}</p>
        </TooltipContent>
    </Tooltip>
);

export const ActionSidebar: React.FC<ActionSidebarProps> = ({ xp, streak, isLiked, onLike }) => {
  return (
    <TooltipProvider>
      <div className="absolute top-1/2 -translate-y-1/2 right-4 z-20 flex flex-col items-center gap-4">
        {/* XP Display */}
        <StatDisplay tooltipText={`${xp} XP Earned`}>
            <Award className="h-5 w-5 text-yellow-400" />
            <span className="text-xs font-bold">{xp}</span>
        </StatDisplay>

        {/* Streak Display */}
        <StatDisplay tooltipText={`${streak} Current Streak`}>
            <Flame className="h-5 w-5 text-orange-500" />
            <span className="text-xs font-bold">{streak}</span>
        </StatDisplay>

        {/* Like Button */}
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    className="w-12 h-12 rounded-full transition-transform hover:scale-110"
                    onClick={onLike}
                >
                    <Heart className={`w-6 h-6 transition-all ${isLiked ? 'text-red-500 fill-current' : 'text-foreground'}`} />
                </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
                <p>Like</p>
            </TooltipContent>
        </Tooltip>

      </div>
    </TooltipProvider>
  );
};