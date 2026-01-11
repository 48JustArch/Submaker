'use client';

import { motion } from 'framer-motion';

export default function AudioVisualizer() {
    return (
        <div className="w-full h-[60%] flex items-center justify-center">
            <div className="flex gap-1.5 items-end h-40 w-[600px] justify-center opacity-70">
                {[...Array(40)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ height: '20%' }}
                        animate={{
                            height: [`20%`, `${30 + (i % 5) * 10}%`, `20%`]
                        }}
                        transition={{
                            duration: 0.8 + (i % 3) * 0.2,
                            repeat: Infinity,
                            repeatType: "reverse",
                            ease: "easeInOut",
                            delay: i * 0.05
                        }}
                        className="w-2 bg-gradient-to-t from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full"
                        style={{
                            opacity: 0.5 + (i % 2) * 0.3
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
