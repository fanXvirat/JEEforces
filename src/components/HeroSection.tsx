'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Balancer } from 'react-wrap-balancer';
import { Button } from '@/components/ui/button';
import { Rocket, Users } from 'lucide-react';
import Link from 'next/link';

// --- TYPE DEFINITIONS ---
type Point = { x: number; y: number };
type GhostTrail = {
    points: Point[];
    vx: number;
    vy: number;
    color: string;
};

// --- COMPONENT LOGIC ---
const heroTitles: string[] = ["Master JEE with Peer Power", "Compete in Rated Contests", "Solve Story-Based Problems", "From Mains to Olympiads"];

const textContainerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.025 } },
};

const textLetterVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 15, stiffness: 200 } },
};

export const CoolerHeroSection: React.FC = () => {
    const [currentTitleIndex, setCurrentTitleIndex] = useState<number>(0);
    const [isMobile, setIsMobile] = useState<boolean>(false);

    // SVG Trail State
    const [liveTrail, setLiveTrail] = useState<Point[]>([]);
    const [fadingTrails, setFadingTrails] = useState<{ id: number; points: Point[] }[]>([]);
    
    // Mobile Ghost Trail State
    const [ghostTrails, setGhostTrails] = useState<GhostTrail[]>([]);
    
    const trailTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // --- HOOKS ---
    useEffect(() => {
        // Detect if we're on a mobile device once on mount
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        // Cycle through the hero titles
        const intervalId = setInterval(() => {
            setCurrentTitleIndex(prev => (prev + 1) % heroTitles.length);
        }, 4000);
        return () => clearInterval(intervalId);
    }, []);
    
    // Main effect for handling interactions
    useEffect(() => {
        if (isMobile) {
            // --- MOBILE LOGIC: Animated Ghost Trails ---
            let animationFrameId: number;
            const primaryColor = `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()})`;
            
            const initialTrails: GhostTrail[] = Array.from({ length: 3 }, () => ({
                points: [{ x: Math.random() * window.innerWidth, y: Math.random() * 500 }],
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                color: primaryColor,
            }));
            setGhostTrails(initialTrails);

            const animateGhosts = () => {
                setGhostTrails(currentTrails => 
                    currentTrails.map(trail => {
                        let { x, y } = trail.points[trail.points.length - 1];
                        let { vx, vy } = trail;

                        x += vx;
                        y += vy;

                        if (x <= 0 || x >= window.innerWidth) vx *= -1;
                        if (y <= 0 || y >= 500) vy *= -1;
                        
                        const newPoints = [...trail.points, { x, y }].slice(-50); // Keep trail length limited
                        return { ...trail, points: newPoints, vx, vy };
                    })
                );
                animationFrameId = requestAnimationFrame(animateGhosts);
            };
            
            animationFrameId = requestAnimationFrame(animateGhosts);
            return () => cancelAnimationFrame(animationFrameId);

        } else {
            // --- DESKTOP LOGIC: Interactive Mouse Trail ---
            const handleMouseMove = (e: MouseEvent) => {
                setLiveTrail(prev => [...prev, { x: e.clientX, y: e.clientY }]);
                
                if (trailTimeoutRef.current) {
                    clearTimeout(trailTimeoutRef.current);
                }

                trailTimeoutRef.current = setTimeout(() => {
                    if (liveTrail.length > 1) {
                        const newTrail = { id: Date.now(), points: liveTrail };
                        setFadingTrails(prev => [...prev, newTrail]);
                        setTimeout(() => {
                            setFadingTrails(prev => prev.filter(t => t.id !== newTrail.id));
                        }, 2000); // Trail fades after 2 seconds
                    }
                    setLiveTrail([]);
                }, 200); // A 200ms pause creates a new trail
            };

            window.addEventListener('mousemove', handleMouseMove);
            return () => window.removeEventListener('mousemove', handleMouseMove);
        }
    }, [isMobile, liveTrail]); // Rerun effect if mobile status changes


    // --- RENDER ---
    return (
        <section className="relative h-[500px] md:h-[600px] flex items-center justify-center bg-background overflow-hidden">
            {/* SVG Canvas Layer */}
            <svg className="absolute inset-0 z-0 w-full h-full" style={{ stroke: 'hsl(var(--primary))' }}>
                {isMobile 
                    ? ghostTrails.map((trail, i) => (
                        <polyline key={i} fill="none" strokeWidth="1" strokeOpacity="0.3" points={trail.points.map(p => `${p.x},${p.y}`).join(' ')} />
                    ))
                    : <>
                        {fadingTrails.map(trail => (
                            <polyline key={trail.id} fill="none" strokeWidth="1" className="transition-opacity duration-[2000ms]" strokeOpacity="0.3" points={trail.points.map(p => `${p.x},${p.y}`).join(' ')} />
                        ))}
                        <polyline fill="none" strokeWidth="1" strokeOpacity="0.5" points={liveTrail.map(p => `${p.x},${p.y}`).join(' ')} />
                    </>
                }
            </svg>
            
            {/* Content Layer */}
            <div className="relative z-10 text-center px-4">
                <div className="h-[90px] md:h-[150px] relative mb-6 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                        <motion.h1
                            key={currentTitleIndex}
                            variants={textContainerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground"
                        >
                            <Balancer>
                                {heroTitles[currentTitleIndex].split('').map((char, i) => (
                                    <motion.span key={i} variants={textLetterVariants} className="inline-block">{char === ' ' ? '\u00A0' : char}</motion.span>
                                ))}
                            </Balancer>
                        </motion.h1>
                    </AnimatePresence>
                </div>

                <p className="text-lg md:text-xl mb-10 max-w-3xl mx-auto text-muted-foreground">
                    <Balancer>Join India's largest community for JEE preparation - Solve challenging problems, engage in discussions, and conquer the exam together.</Balancer>
                </p>

                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <Link href="/problems"><Button size="lg" className="w-full sm:w-auto transition-transform duration-200 hover:scale-105 shadow-lg"><Rocket className="mr-2 h-5 w-5" />Start Practicing</Button></Link>
                    <Link href="/sign-up"><Button size="lg" variant="secondary" className="w-full sm:w-auto transition-transform duration-200 hover:scale-105 shadow-lg"><Users className="mr-2 h-5 w-5" />Join the Community</Button></Link>
                </motion.div>
            </div>
        </section>
    );
};