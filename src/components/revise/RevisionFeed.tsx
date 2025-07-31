// src/components/revise/RevisionFeed.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Loader2, Zap } from 'lucide-react';

import { Topic, CardContent } from '@/lib/ai/types';
import { ActionSidebar } from './ActionSidebar';

/* ---------- card map ---------- */
import { ConceptCard } from './cards/ConceptCard';
import { MemeCard } from './cards/MemeCard';
import { QuizCard } from './cards/QuizCard';
import { ProblemCard } from './cards/ProblemCard';
import { FlashcardCard } from './cards/FlashcardCard';
import { MnemonicCard } from './cards/MnemonicCard';
import { TrueOrFalseCard } from './cards/TrueorFalseCard';
import { SequenceSortCard } from './cards/SequenceSortCard';
import { FillInTheBlankCard } from './cards/FillInTheBlankCard';

const cardComponentMap = {
  CONCEPT: ConceptCard,
  MEME: MemeCard,
  QUIZ: QuizCard,
  PROBLEM: ProblemCard,
  FLASHCARD: FlashcardCard,
  MNEMONIC: MnemonicCard,
  TRUE_OR_FALSE: TrueOrFalseCard,
  SEQUENCE_SORT: SequenceSortCard,
  FILL_IN_THE_BLANK: FillInTheBlankCard,
  DEFAULT: ({ card }: { card: CardContent }) => (
    <div className="p-4 bg-destructive/20 rounded-lg h-full w-full flex items-center justify-center">
      <p>Unsupported card type: {card.type}</p>
    </div>
  ),
};

/* ---------- feed ---------- */
export const RevisionFeed: React.FC<{
  initialTopic: Topic;
  apiKey: string;
}> = ({ initialTopic, apiKey }) => {
  const [feed, setFeed] = useState<CardContent[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set());
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const [isFetching, setIsFetching] = useState(false); // Prevent duplicate fetches
  const [ignoreInView, setIgnoreInView] = useState(false); // NEW: Temporarily ignore after load
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Single observer for the end of the list
  const [sentinelRef, sentinelInView] = useInView({ threshold: 0 }); // NEW: Stricter threshold (fully in view)

  /* ---- callbacks ---- */
  const handleAnswer = useCallback((correct: boolean) => {
    if (correct) {
      setXp((p) => p + 10);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  }, []);

  const handleCorrect = useCallback(() => setXp((p) => p + 10), []);

  const handleLike = useCallback((id: string) => {
    setLikedCards((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  /* ---- fetch ---- */
  const fetchCards = useCallback(async () => {
    if (isFetching) return;
    setIsFetching(true);
    setIsLoading(true);
    try {
      const res = await fetch('/api/revise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_feed',
          topic: initialTopic,
          history,
          apiKey,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');

      setFeed((prev) => [...prev, ...data]);
      setHistory((h) => [
        ...h,
        ...data
          .map((c: any) => c.content.title || c.content.concept || c.content.question)
          .filter(Boolean),
      ]);

      // NEW: Ignore inView for 300ms after load to prevent false triggers
      setIgnoreInView(true);
      setTimeout(() => setIgnoreInView(false), 300);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [initialTopic, history, apiKey, isFetching]);

  /* ---- initial fetch ---- */
  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  /* ---- force scroll to top after initial load ---- */
  useEffect(() => {
    if (!isLoading && feed.length > 0 && !initialLoadDone && scrollContainerRef.current) {
      // Use requestAnimationFrame for smoother timing after render
      requestAnimationFrame(() => {
        scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        setInitialLoadDone(true);
      });
    }
  }, [isLoading, feed.length, initialLoadDone]);

  /* ---- prefetch only when sentinel is in view (with debounce) ---- */
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout | null = null;

    const triggerFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (initialLoadDone && !isLoading && !isFetching && !ignoreInView && sentinelInView && feed.length > 0) {
          fetchCards();
        }
      }, 500); // Debounce by 500ms to prevent rapid calls
    };

    triggerFetch(); // Initial check

    // Cleanup on unmount
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
  }, [sentinelInView, initialLoadDone, isLoading, isFetching, ignoreInView, fetchCards]); // NEW: Added ignoreInView to deps

  /* ---- keyboard navigation (up/down arrows) ---- */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focused on an input field
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }
      e.preventDefault();
      if (scrollContainerRef.current) {
        const viewportHeight = window.innerHeight;
        const currentScroll = scrollContainerRef.current.scrollTop;

        if (e.key === 'ArrowDown') {
          scrollContainerRef.current.scrollTo({
            top: currentScroll + viewportHeight,
            behavior: 'smooth',
          });
        } else if (e.key === 'ArrowUp') {
          scrollContainerRef.current.scrollTo({
            top: currentScroll - viewportHeight,
            behavior: 'smooth',
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  /* ---- render ---- */
  return (
    <div className="w-full h-[calc(100vh-4rem)] fixed top-16 left-0 bg-background/80 backdrop-blur-sm touch-pan-y">
      <div
        ref={scrollContainerRef}
        className="w-full h-full overflow-y-auto snap-y snap-mandatory scroll-smooth hide-scrollbar pt-12" // Added pt-12 to prevent status bar overlap
        style={{ touchAction: 'pan-y' }} // Better touch scrolling
      >

        <AnimatePresence>
          {feed.map((card, idx) => {
            const CardComp =
              cardComponentMap[card.type as keyof typeof cardComponentMap] ||
              cardComponentMap.DEFAULT;

            return (
              <motion.div
                key={card.id || idx}
                className="w-full min-h-[calc(100vh-4rem)] snap-always snap-center flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/80"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                <div className="w-full max-w-md md:max-w-lg h-[90vh] relative rounded-xl shadow-2xl overflow-hidden bg-card">
                  <CardComp card={card} onAnswer={handleAnswer} onCorrect={handleCorrect} />
                  <ActionSidebar
                    xp={xp}
                    streak={streak}
                    isLiked={likedCards.has(card.id)}
                    onLike={() => handleLike(card.id)}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Sentinel for infinite scroll trigger (invisible, minimal height) */}
        <div ref={sentinelRef} className="h-1" /> {/* NEW: Smaller height to avoid early triggers */}

        {/* Bottom loader */}
        <div className="min-h-[50vh] flex flex-col items-center justify-center text-muted-foreground snap-center">
          {isLoading ? (
            <>
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-2 text-sm font-medium">Cooking more challenges… Please Wait 30-45 second for initial load</p>
            </>
          ) : (
            <div className="text-center animate-pulse">
              <Zap className="h-8 w-8 mx-auto text-green-500" />
              <p className="mt-2 text-sm font-medium">Scroll for more!</p>
            </div>
          )}
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .touch-pan-y {
          touch-action: pan-y;
        }
      `}</style>
    </div>
  );
};