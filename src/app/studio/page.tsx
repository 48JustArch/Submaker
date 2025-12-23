'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, Pause, Square, Download, Plus,
    Volume2, Mic2, Music, CloudRain, Settings,
    ChevronLeft, Layers, Sliders, Activity,
    Maximize2, MoreVertical, Scissors, Copy
} from 'lucide-react';
import Link from 'next/link';

interface Track {
    id: string;
    name: string;
    type: 'subliminal' | 'music' | 'atmosphere';
    volume: number;
    pan: number; // -100 to 100
    muted: boolean;
    solo: boolean;
    color: string;
    icon: any;
    effects: {
        reverb: number;
        delay: number;
        eq: { low: number; mid: number; high: number; };
    };
}

export default function StudioPage() {
    const [activeTrackId, setActiveTrackId] = useState<string | null>('1');
    const [isPlaying, setIsPlaying] = useState(false);

    const [tracks, setTracks] = useState<Track[]>([
        {
            id: '1', name: 'Subliminal Voice', type: 'subliminal',
            volume: 80, pan: 0, muted: false, solo: false,
            color: 'bg-blue-500', icon: Mic2,
            effects: { reverb: 20, delay: 0, eq: { low: 0, mid: 2, high: 5 } }
        },
        {
            id: '2', name: 'Background Music', type: 'music',
            volume: 60, pan: -20, muted: false, solo: false,
            color: 'bg-purple-500', icon: Music,
            effects: { reverb: 40, delay: 10, eq: { low: 4, mid: 0, high: 0 } }
        },
        {
            id: '3', name: 'Rain Ambience', type: 'atmosphere',
            volume: 40, pan: 20, muted: false, solo: false,
            color: 'bg-cyan-500', icon: CloudRain,
            effects: { reverb: 60, delay: 0, eq: { low: 2, mid: 0, high: -2 } }
        },
    ]);

    const activeTrack = tracks.find(t => t.id === activeTrackId);

    return (
        <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden font-sans">

            {/* Top Transport Bar */}
            <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#0a0a0a]">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-mono">PROJECT</span>
                        <span className="font-bold text-sm tracking-tight">Sleep Programming Mix</span>
                    </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#111] rounded-xl p-1 border border-white/5">
                    <div className="flex items-center gap-1">
                        <button onClick={() => setIsPlaying(!isPlaying)} className={`w-10 h-10 flex items-center justify-center rounded-lg ${isPlaying ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-gray-300'}`}>
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                        </button>
                        <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-300">
                            <Square className="w-4 h-4 fill-current" />
                        </button>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div className="font-mono text-xl text-blue-400 tracking-widest px-2">
                        00:00:00
                    </div>
                </div>

                <button className="flex items-center gap-2 px-4 py-1.5 bg-white text-black hover:bg-gray-200 rounded-full text-sm font-bold transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Export</span>
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden">

                {/* Left Sidebar: Assets */}
                <aside className="w-16 lg:w-64 border-r border-white/10 bg-[#0a0a0a] flex flex-col pt-4">
                    {/* Mobile/Collapsed view icons would go here, assume expanded for now */}
                    <div className="px-4 mb-6">
                        <h3 className="hidden lg:block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Browser</h3>
                        <div className="space-y-1">
                            {['Uploads', 'Subliminals', 'Music', 'Ambience', 'Presets'].map((item) => (
                                <button key={item} className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white text-sm transition-colors">
                                    <span className="w-4 h-4 bg-gray-800 rounded mx-1" />
                                    <span className="hidden lg:block">{item}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </aside>

                {/* Center: Timeline / Mixer */}
                <main className="flex-1 flex flex-col min-w-0 bg-[#080808]">

                    {/* Timeline Header/Ruler */}
                    <div className="h-8 border-b border-white/5 bg-[#0a0a0a] flex items-end px-4">
                        <div className="w-full h-4 flex justify-between text-[10px] text-gray-600 font-mono">
                            <span>0:00</span><span>1:00</span><span>2:00</span><span>3:00</span><span>4:00</span><span>5:00</span>
                        </div>
                    </div>

                    {/* Tracks Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {tracks.map((track) => (
                            <div
                                key={track.id}
                                onClick={() => setActiveTrackId(track.id)}
                                className={`
                       relative h-32 rounded-xl border transition-all duration-200 flex overflow-hidden group
                       ${activeTrackId === track.id ? 'bg-[#111] border-blue-500/30 ring-1 ring-blue-500/20' : 'bg-[#0e0e0e] border-white/5 hover:border-white/10'}
                    `}
                            >
                                {/* Track Header (Left) */}
                                <div className="w-48 bg-[#151515] border-r border-white/5 p-3 flex flex-col justify-between shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-8 rounded-full ${track.color}`} />
                                        <div className="truncate font-semibold text-sm text-gray-200">{track.name}</div>
                                    </div>

                                    <div className="space-y-2">
                                        {/* Vol / Pan */}
                                        <div className="flex items-center gap-2">
                                            <Volume2 className="w-3 h-3 text-gray-500" />
                                            <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-gray-400" style={{ width: `${track.volume}%` }} />
                                            </div>
                                        </div>

                                        {/* Mute / Solo Buttons */}
                                        <div className="flex gap-1">
                                            <button className={`flex-1 text-[10px] py-0.5 rounded ${track.muted ? 'bg-red-900/50 text-red-400' : 'bg-[#222] text-gray-500 hover:text-gray-300'}`}>M</button>
                                            <button className={`flex-1 text-[10px] py-0.5 rounded ${track.solo ? 'bg-yellow-900/50 text-yellow-400' : 'bg-[#222] text-gray-500 hover:text-gray-300'}`}>S</button>
                                            <button className="flex-1 text-[10px] py-0.5 rounded bg-[#222] text-gray-500 hover:text-gray-300">R</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Timeline / Waveform Area */}
                                <div className="flex-1 relative cursor-crosshair">
                                    {/* Grid lines */}
                                    <div className="absolute inset-0 flex">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="flex-1 border-r border-white/5" />
                                        ))}
                                    </div>

                                    {/* Waveform Visualization */}
                                    <div className="absolute inset-0 flex items-center px-4 opacity-50">
                                        {Array.from({ length: 60 }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`flex-1 mx-[1px] rounded-full ${track.color}`}
                                                style={{
                                                    height: `${30 + Math.random() * 50}%`,
                                                    opacity: 0.3 + Math.random() * 0.7
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button className="w-full h-12 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-600 hover:text-gray-400 hover:border-white/20 transition-all">
                            <Plus className="w-4 h-4" />
                            <span>Add Track</span>
                        </button>
                    </div>
                </main>

                {/* Right Sidebar: Inspector / Effects Rack */}
                <aside className="w-72 border-l border-white/10 bg-[#0a0a0a] flex flex-col">
                    {activeTrack ? (
                        <>
                            <div className="p-4 border-b border-white/10 bg-[#0f0f0f]">
                                <div className="flex items-center gap-3 mb-1">
                                    <activeTrack.icon className="w-5 h-5 text-gray-400" />
                                    <h2 className="font-bold text-sm tracking-wide">Track Inspector</h2>
                                </div>
                                <p className="text-xs text-blue-400">{activeTrack.name}</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                                {/* EQ Section */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <span>Parametric EQ</span>
                                        <Activity className="w-3 h-3" />
                                    </div>
                                    <div className="h-24 bg-[#111] rounded-lg border border-white/5 relative overflow-hidden">
                                        {/* Fake EQ Curve */}
                                        <svg viewBox="0 0 100 40" className="w-full h-full stroke-blue-500 fill-blue-500/10" preserveAspectRatio="none">
                                            <path d="M0,35 Q20,35 30,20 T60,20 T100,5 V40 H0 Z" />
                                        </svg>
                                    </div>
                                    <div className="flex gap-2">
                                        {['Low', 'Mid', 'High'].map((band) => (
                                            <div key={band} className="flex-1 bg-[#111] p-2 rounded text-center">
                                                <div className="text-[10px] text-gray-500 mb-1">{band}</div>
                                                <div className="w-8 h-8 rounded-full border-2 border-white/10 mx-auto" />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Effects Rack */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <span>Effects Rack</span>
                                        <Sliders className="w-3 h-3" />
                                    </div>

                                    <div className="bg-[#111] rounded-lg border border-white/5 p-3 space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-300">Reverb Space</span>
                                            <span className="text-blue-400">{activeTrack.effects.reverb}%</span>
                                        </div>
                                        <input type="range" className="w-full h-1 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full" value={activeTrack.effects.reverb} readOnly />
                                    </div>

                                    <div className="bg-[#111] rounded-lg border border-white/5 p-3 space-y-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-300">Stereo Delay</span>
                                            <span className="text-blue-400">{activeTrack.effects.delay}ms</span>
                                        </div>
                                        <input type="range" className="w-full h-1 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full" value={activeTrack.effects.delay} readOnly />
                                    </div>
                                </div>

                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">
                            Select a track to edit
                        </div>
                    )}
                </aside>

            </div>
        </div>
    );
}
