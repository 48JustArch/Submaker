'use client';

import { motion } from 'framer-motion';
import { ArrowRight, PlayCircle } from 'lucide-react';
import Link from 'next/link';
import NeuralBackground from './NeuralBackground';

export default function Hero() {
    return (
        <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden px-6">
            <NeuralBackground />

            {/* Glow Effect */}
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto text-center space-y-10">

                {/* Minimal Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
                >
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                    <span className="text-sm font-medium text-cyan-100/70 tracking-widest uppercase text-[10px]">Architect Your Reality</span>
                </motion.div>

                {/* Massive Type */}
                <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 leading-[1.1]"
                >
                    Design your <br />
                    subconscious.
                </motion.h1>

                {/* Clean Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-xl mx-auto text-lg md:text-xl text-gray-400 font-light leading-relaxed"
                >
                    Rewrite the source code of your existence. <br className="hidden md:block" />
                    A precision instrument for the awakened mind.
                </motion.p>

                {/* Minimal Action Area */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link href="/signup" className="btn-new btn-primary-new group">
                        Start Creating
                        <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <button className="btn-new btn-ghost-new gap-3 group">
                        <PlayCircle className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                        <span>How it works</span>
                    </button>
                </motion.div>

            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[var(--bg-page)] to-transparent" />
        </section>
    );
}
