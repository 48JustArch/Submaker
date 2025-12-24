'use client';

import { motion } from 'framer-motion';

export default function NeuralBackground() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
            {/* Core Energy */}
            <motion.div
                animate={{
                    scale: [0.8, 1.1, 0.8],
                    opacity: [0.4, 0.6, 0.4],
                    rotate: [0, 90, 0]
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-full blur-[100px] mix-blend-screen"
            />

            {/* Secondary Pulse */}
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                className="absolute w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-blue-600/10 rounded-full blur-[80px] mix-blend-screen"
            />

            {/* Subtle Aura */}
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-[#000000]/80 to-[#000000] z-0" />
        </div>
    );
}
