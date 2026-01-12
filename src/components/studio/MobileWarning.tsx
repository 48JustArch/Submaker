'use client';

import { motion } from 'framer-motion';
import { Monitor, Smartphone, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

interface MobileWarningProps {
    /**
     * Optional custom title
     */
    title?: string;
    /**
     * Optional custom message
     */
    message?: string;
    /**
     * Show "Continue anyway" option (not recommended for complex UIs)
     */
    allowContinue?: boolean;
    /**
     * Callback when user chooses to continue anyway
     */
    onContinue?: () => void;
}

/**
 * Full-screen warning for mobile users accessing desktop-only features
 * 
 * Use this in pages that require desktop (like Studio editor)
 */
export default function MobileWarning({
    title = "Desktop Recommended",
    message = "The Studio editor works best on desktop devices with a larger screen. For the best experience, please switch to a desktop computer.",
    allowContinue = false,
    onContinue
}: MobileWarningProps) {
    return (
        <div className="fixed inset-0 bg-[#050505] z-[100] flex items-center justify-center p-6">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm relative z-10 text-center"
            >
                {/* Icon Animation */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        {/* Mobile Icon (crossed out) */}
                        <motion.div
                            initial={{ scale: 0, rotate: -10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center"
                        >
                            <Smartphone className="w-8 h-8 text-red-400" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-14 h-0.5 bg-red-500 rotate-45 rounded-full" />
                            </div>
                        </motion.div>

                        {/* Arrow */}
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="absolute top-1/2 -right-12 -translate-y-1/2"
                        >
                            <ArrowRight className="w-6 h-6 text-gray-600" />
                        </motion.div>

                        {/* Desktop Icon (highlighted) */}
                        <motion.div
                            initial={{ scale: 0, rotate: 10 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.3, type: "spring" }}
                            className="absolute -right-24 top-0 w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10"
                        >
                            <Monitor className="w-8 h-8 text-blue-400" />
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute -top-1 -right-1"
                            >
                                <Sparkles className="w-4 h-4 text-blue-400" />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    <h2 className="text-2xl font-bold text-white mb-4">
                        {title}
                    </h2>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <Link
                            href="/dashboard"
                            className="w-full py-3.5 px-6 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors"
                        >
                            Go to Dashboard
                        </Link>

                        {allowContinue && (
                            <button
                                onClick={onContinue}
                                className="w-full py-3 px-6 text-gray-500 font-medium rounded-xl flex items-center justify-center gap-2 hover:text-gray-300 hover:bg-white/5 transition-colors"
                            >
                                Continue anyway (not recommended)
                            </button>
                        )}
                    </div>
                </motion.div>

                {/* Feature highlights */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="mt-10 pt-8 border-t border-white/5"
                >
                    <p className="text-xs text-gray-600 mb-4">Desktop features include:</p>
                    <div className="flex justify-center gap-6 text-xs text-gray-500">
                        <span>Timeline Editor</span>
                        <span>•</span>
                        <span>Audio Effects</span>
                        <span>•</span>
                        <span>Export</span>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
