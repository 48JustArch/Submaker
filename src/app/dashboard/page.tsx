'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Mic2, Waves, Zap, Clock, PlayCircle, Download } from 'lucide-react';
import Link from 'next/link';

// Mock Data
const recentGenerations = [
    { id: 1, title: 'Confidence Booster V1', type: 'Subliminal', date: '2h ago', status: 'Ready' },
    { id: 2, title: 'Deep Sleep 432Hz', type: 'Morphic', date: '1d ago', status: 'Ready' },
    { id: 3, title: 'Focus Flow', type: 'Supraliminal', date: '3d ago', status: 'Ready' },
];

export default function Dashboard() {
    const [generationsLeft] = useState(2);

    return (
        <div className="min-h-screen bg-[#050505] text-white">
            {/* Top Navigation */}
            <nav className="border-b border-white/10 px-8 py-4 flex items-center justify-between sticky top-0 bg-[#050505]/80 backdrop-blur-md z-20">
                <div className="flex items-center gap-3 font-bold text-xl tracking-tighter">
                    <div className="w-3 h-3 bg-white rounded-full" />
                    Submaker
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
                        <span>Free Plan</span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                        <span>{generationsLeft}/3 Generations</span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 border border-white/10" />
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-8 space-y-12">
                {/* Welcome Section */}
                <section>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl font-bold mb-2"
                    >
                        Good evening, Creator.
                    </motion.h1>
                    <p className="text-gray-500">Ready to engineer your reality?</p>
                </section>

                {/* Quick Actions */}
                <section className="grid md:grid-cols-2 gap-6">
                    <Link href="/studio" className="group relative overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/10 p-8 hover:border-white/20 transition-all">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Plus className="w-32 h-32 text-white" />
                        </div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 text-black">
                                <Plus className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">New Session</h2>
                            <p className="text-gray-500">Start a new audio engineering project from scratch.</p>
                        </div>
                    </Link>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Quick Templates */}
                        <button className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 hover:bg-white/5 transition-colors text-left flex flex-col justify-between group">
                            <Mic2 className="w-8 h-8 text-blue-500 mb-4" />
                            <div>
                                <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">Subliminal</h3>
                                <p className="text-sm text-gray-500">Silent masking</p>
                            </div>
                        </button>
                        <button className="bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 hover:bg-white/5 transition-colors text-left flex flex-col justify-between group">
                            <Waves className="w-8 h-8 text-purple-500 mb-4" />
                            <div>
                                <h3 className="font-bold text-lg group-hover:text-purple-400 transition-colors">Morphic</h3>
                                <p className="text-sm text-gray-500">Field resonance</p>
                            </div>
                        </button>
                    </div>
                </section>

                {/* Recent Projects */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">Recent Projects</h2>
                        <button className="text-sm text-gray-500 hover:text-white transition-colors">View All</button>
                    </div>

                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden">
                        {recentGenerations.map((gen, i) => (
                            <div
                                key={gen.id}
                                className="flex items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                        <PlayCircle className="w-5 h-5 text-gray-400 group-hover:text-white" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-white">{gen.title}</h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            <span>{gen.date}</span>
                                            <span className="w-1 h-1 bg-gray-700 rounded-full" />
                                            <span>{gen.type}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1 bg-green-500/10 text-green-500 text-xs font-medium rounded-full">
                                        {gen.status}
                                    </span>
                                    <button className="p-2 hover:bg-white/10 rounded-lg text-gray-500 hover:text-white transition-colors">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
