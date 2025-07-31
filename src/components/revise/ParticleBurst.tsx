// In ParticleBurst.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Particle = ({ id }: { id: number }) => {
    // Use fixed values based on id to ensure consistency
    const x = ((id * 73) % 120) - 60; // Deterministic pseudo-random
    const y = ((id * 37) % 120) - 60;
    const scale = ((id * 53) % 50) * 0.01 + 0.5;
    const duration = ((id * 97) % 50) * 0.01 + 0.4;
    const color = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#F91880', 'hsl(var(--foreground))'][id % 4];

    return (
        <motion.div
            style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: color,
                transform: 'translate(-50%, -50%)',
            }}
            initial={{ opacity: 1, scale: 0 }}
            animate={{ x, y, scale, opacity: [1, 1, 0] }}
            transition={{ duration, ease: "easeOut" }}
        />
    );
};

export const ParticleBurst = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null; // Don't render on server
    }

    return (
        <>
            {Array.from({ length: 15 }).map((_, i) => <Particle key={i} id={i} />)}
        </>
    );
};