// src/components/ContestTimer.tsx
'use client';

import { useState, useEffect } from 'react';
import { AlarmClock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContestTimerProps {
    // The timestamp (in ms) when the timer should end
    expiryTimestamp: number;
    // A function to call when the timer reaches zero
    onExpire: () => void;
    // Optional additional class names
    className?: string;
}

export const ContestTimer = ({ expiryTimestamp, onExpire, className }: ContestTimerProps) => {
    const [timeLeft, setTimeLeft] = useState(expiryTimestamp - Date.now());

    useEffect(() => {
        // Calculate initial time left
        const initialTimeLeft = expiryTimestamp - Date.now();
        if (initialTimeLeft <= 0) {
            setTimeLeft(0);
            onExpire();
            return;
        }

        setTimeLeft(initialTimeLeft);

        const interval = setInterval(() => {
            const newTimeLeft = expiryTimestamp - Date.now();

            if (newTimeLeft <= 0) {
                clearInterval(interval);
                setTimeLeft(0);
                onExpire(); // Trigger the callback
            } else {
                setTimeLeft(newTimeLeft);
            }
        }, 1000);

        // Cleanup function to clear the interval when the component unmounts
        // or when expiryTimestamp changes.
        return () => clearInterval(interval);
    }, [expiryTimestamp, onExpire]);

    const isUrgent = timeLeft < 5 * 60 * 1000; // Less than 5 minutes

    const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
    const seconds = Math.floor((timeLeft / 1000) % 60);

    return (
        <div className={cn(
            "flex items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium",
            isUrgent ? 'text-destructive border-destructive/50 bg-destructive/10' : 'text-muted-foreground',
            className
        )}>
            <AlarmClock className="h-4 w-4" />
            <span>
                {hours > 0 && `${String(hours).padStart(2, '0')}:`}
                {String(minutes).padStart(2, '0')}:
                {String(seconds).padStart(2, '0')}
            </span>
        </div>
    );
};