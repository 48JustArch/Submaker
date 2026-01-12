'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, PlayCircle, X, Sparkles, Music, Layers, Download } from 'lucide-react';
import Link from 'next/link';
import NeuralBackground from './NeuralBackground';

// How It Works Modal Component
function HowItWorksModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const steps = [
        {
            icon: <Sparkles className="w-6 h-6" />,
            title: "Write Your Affirmations",
            description: "Use our AI-powered writer to craft powerful subliminal messages tailored to your goals."
        },
        {
            icon: <Music className="w-6 h-6" />,
            title: "Choose Your Audio",
            description: "Select from binaural beats, ambient sounds, or import your own background music."
        },
        {
            icon: <Layers className="w-6 h-6" />,
            title: "Layer & Mix",
            description: "Our studio blends your affirmations beneath the audio—completely undetectable to the conscious mind."
        },
        {
            icon: <Download className="w-6 h-6" />,
            title: "Export & Listen",
            description: "Download your custom subliminal track and listen daily for transformative results."
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5">
                            <div>
                                <h2 className="text-2xl font-bold text-white">How Submaker Works</h2>
                                <p className="text-sm text-gray-400 mt-1">Create powerful subliminal audio in 4 simple steps</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Steps */}
                        <div className="p-6 space-y-4">
                            {steps.map((step, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="flex gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
                                >
                                    <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                        {step.icon}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-cyan-400">STEP {index + 1}</span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-white mt-0.5">{step.title}</h3>
                                        <p className="text-sm text-gray-400 mt-1">{step.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* CTA */}
                        <div className="p-6 border-t border-white/5 bg-white/[0.02]">
                            <Link
                                href="/signup"
                                className="w-full py-3 px-6 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                                onClick={onClose}
                            >
                                Start Creating Free
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default function Hero() {
    const [showHowItWorks, setShowHowItWorks] = useState(false);

    return (
        <section className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden px-6 bg-[#030303]">
            <NeuralBackground />

            {/* Apple-style Consciousness Orb - Clean white/silver fluid animation */}
            {/* Hidden on small mobile, scaled down on tablet */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
                {/* Rotating outer gradient ring */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute w-[300px] h-[300px] md:w-[600px] md:h-[600px] -translate-x-1/2 -translate-y-1/2"
                >
                    <div className="absolute inset-0 rounded-full bg-gradient-conic from-white/20 via-gray-400/10 via-50% to-white/20 blur-[60px] md:blur-[100px] opacity-60" />
                </motion.div>

                {/* Primary morphing blob */}
                <motion.div
                    animate={{
                        scale: [1, 1.15, 1.05, 1.2, 1],
                        borderRadius: ["60% 40% 30% 70%", "30% 60% 70% 40%", "60% 40% 60% 40%", "40% 60% 30% 70%", "60% 40% 30% 70%"]
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute w-[200px] h-[200px] md:w-[400px] md:h-[400px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-br from-white/30 via-gray-300/25 to-white/30 blur-[40px] md:blur-[80px]"
                />

                {/* Secondary floating blob */}
                <motion.div
                    animate={{
                        scale: [1.1, 1, 1.15, 1.05, 1.1],
                        x: [-20, 20, -10, 15, -20],
                        y: [10, -20, 15, -10, 10],
                        borderRadius: ["40% 60% 60% 40%", "60% 40% 40% 60%", "50% 50% 40% 60%", "40% 60% 50% 50%", "40% 60% 60% 40%"]
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute w-[150px] h-[150px] md:w-[300px] md:h-[300px] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-tr from-gray-200/40 via-white/35 to-gray-300/40 blur-[30px] md:blur-[60px]"
                />

                {/* Bright pulsing core */}
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.5, 0.9, 0.5]
                    }}
                    transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute w-[90px] h-[90px] md:w-[180px] md:h-[180px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-white/50 via-gray-100/60 to-white/50 blur-[25px] md:blur-[50px]"
                />

                {/* Super bright center spark */}
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.7, 1, 0.7]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="absolute w-[40px] h-[40px] md:w-[80px] md:h-[80px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 blur-[15px] md:blur-[30px]"
                />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto text-center space-y-6 sm:space-y-10 pt-20 sm:pt-0">

                {/* Minimal Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-md"
                >
                    <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-white animate-pulse shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                    <span className="text-[9px] sm:text-[10px] font-medium text-white/70 tracking-widest uppercase">Unlock Your Mind</span>
                </motion.div>

                {/* Massive Type */}
                <motion.h1
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-4xl sm:text-6xl md:text-8xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50 leading-[1.1]"
                >
                    Design your <br />
                    subconscious.
                </motion.h1>

                {/* Clean Subtext */}
                <motion.p
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="max-w-xl mx-auto text-base sm:text-lg md:text-xl text-gray-400 font-light leading-relaxed px-4 sm:px-0"
                >
                    Create subliminal audio that bypasses the conscious mind. <br className="hidden md:block" />
                    Layer affirmations beneath music for effortless transformation.
                </motion.p>

                {/* Action Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0"
                >
                    <Link
                        href="/signup"
                        className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-full bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Start Creating
                        <ArrowRight className="w-4 sm:w-5 h-4 sm:h-5" />
                    </Link>
                    <button
                        onClick={() => setShowHowItWorks(true)}
                        className="w-full sm:w-auto px-6 py-3.5 sm:py-4 rounded-full border border-white/10 bg-white/5 text-white font-medium text-sm flex items-center justify-center gap-3 hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                        <PlayCircle className="w-4 sm:w-5 h-4 sm:h-5 text-white/60" />
                        <span>How it works</span>
                    </button>
                </motion.div>

            </div>

            {/* Bottom fade */}
            <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-[#030303] to-transparent" />

            {/* How It Works Modal */}
            <HowItWorksModal isOpen={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
        </section>
    );
}
