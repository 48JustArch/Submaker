'use client';

import { motion } from 'framer-motion';

/**
 * Premium loading skeleton for the Studio page
 * Shows animated placeholders while content loads
 */
export default function StudioSkeleton() {
    return (
        <div className="h-screen flex flex-col bg-[#050505] overflow-hidden">
            {/* Header Skeleton */}
            <div className="h-14 border-b border-white/[0.06] bg-[#0a0a0a] flex items-center px-4 gap-4">
                <div className="w-32 h-6 bg-white/5 rounded-lg animate-pulse" />
                <div className="flex-1" />
                <div className="flex gap-2">
                    <div className="w-10 h-10 bg-white/5 rounded-lg animate-pulse" />
                    <div className="w-10 h-10 bg-white/5 rounded-lg animate-pulse" />
                    <div className="w-10 h-10 bg-white/5 rounded-lg animate-pulse" />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel Skeleton */}
                <div className="w-[280px] border-r border-white/[0.06] bg-[#0a0a0a] p-4 space-y-4">
                    {/* Tabs */}
                    <div className="flex gap-2">
                        <div className="w-20 h-8 bg-white/5 rounded-lg animate-pulse" />
                        <div className="w-20 h-8 bg-white/5 rounded-lg animate-pulse" />
                    </div>
                    {/* Library Items */}
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="h-16 bg-white/[0.03] rounded-xl border border-white/5 animate-pulse"
                            />
                        ))}
                    </div>
                </div>

                {/* Center Content */}
                <div className="flex-1 flex flex-col">
                    {/* Preview Area */}
                    <div className="flex-1 flex items-center justify-center bg-[#080808] p-8">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="w-96 h-56 bg-white/[0.02] rounded-2xl border border-white/5 flex items-center justify-center"
                        >
                            <div className="flex flex-col items-center gap-3">
                                <div className="w-16 h-16 bg-white/5 rounded-full animate-pulse" />
                                <div className="w-32 h-4 bg-white/5 rounded animate-pulse" />
                                <div className="w-24 h-3 bg-white/5 rounded animate-pulse" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Timeline Skeleton */}
                    <div className="h-[200px] border-t border-white/[0.06] bg-[#0a0a0a] p-4">
                        {/* Timeline Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex gap-2">
                                <div className="w-8 h-8 bg-white/5 rounded animate-pulse" />
                                <div className="w-8 h-8 bg-white/5 rounded animate-pulse" />
                            </div>
                            <div className="w-32 h-3 bg-white/5 rounded animate-pulse" />
                            <div className="w-24 h-6 bg-white/5 rounded animate-pulse" />
                        </div>
                        {/* Track Rows */}
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + i * 0.1 }}
                                    className="flex gap-2"
                                >
                                    <div className="w-24 h-12 bg-white/[0.03] rounded-lg border border-white/5 animate-pulse" />
                                    <div className="flex-1 h-12 bg-white/[0.02] rounded-lg border border-white/5 animate-pulse" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Panel Skeleton */}
                <div className="w-[300px] border-l border-white/[0.06] bg-[#0a0a0a] p-4 space-y-4">
                    <div className="w-24 h-4 bg-white/5 rounded animate-pulse" />
                    <div className="h-40 bg-white/[0.03] rounded-xl border border-white/5 animate-pulse" />
                    <div className="space-y-2">
                        <div className="h-10 bg-white/[0.03] rounded-lg animate-pulse" />
                        <div className="h-10 bg-white/[0.03] rounded-lg animate-pulse" />
                        <div className="h-10 bg-white/[0.03] rounded-lg animate-pulse" />
                    </div>
                </div>
            </div>

            {/* Loading Overlay */}
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#050505]/50 backdrop-blur-sm z-50"
            >
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
                    className="flex flex-col items-center gap-4"
                >
                    <div className="w-12 h-12 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                    <span className="text-sm text-gray-400 font-medium">Loading Studio...</span>
                </motion.div>
            </motion.div>
        </div>
    );
}
