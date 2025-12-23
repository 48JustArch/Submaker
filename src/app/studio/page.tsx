'use client';

import { useState, useRef, ChangeEvent } from 'react';
import {
    Play, Pause, Square, Download, Plus,
    Volume2, Music, Settings,
    ChevronLeft, Activity, Upload, Trash2, Sliders
} from 'lucide-react';
import Link from 'next/link';
import TrackPlayer from '@/components/studio/TrackPlayer';

interface Track {
    id: string;
    name: string;
    url: string;
    type: 'subliminal' | 'music' | 'atmosphere';
    volume: number; // 0-1 (mapped from 0-100 UI)
    speed: number;  // 0.5-2.0
    pan: number;    // -1 to 1 
    muted: boolean;
    solo: boolean;
    color: string;
    icon: any;
}

export default function StudioPage() {
    const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Empty State
    const [tracks, setTracks] = useState<Track[]>([]);

    const activeTrack = tracks.find(t => t.id === activeTrackId);

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        const newTrack: Track = {
            id: Date.now().toString(),
            name: file.name.replace(/\.[^/.]+$/, ""), // remove extension
            url: url,
            type: 'music', // Default to music, user can change
            volume: 0.8,
            speed: 1.0,
            pan: 0,
            muted: false,
            solo: false,
            color: 'bg-blue-500',
            icon: Music
        };

        setTracks(prev => [...prev, newTrack]);
        setActiveTrackId(newTrack.id);
    };

    const updateTrack = (id: string, updates: Partial<Track>) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteTrack = (id: string) => {
        setTracks(prev => prev.filter(t => t.id !== id));
        if (activeTrackId === id) setActiveTrackId(null);
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="h-screen bg-[#050505] text-white flex flex-col overflow-hidden font-sans">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="audio/*"
                className="hidden"
            />

            {/* Top Transport Bar */}
            <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 bg-[#0a0a0a]">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 font-mono">PROJECT</span>
                        <span className="font-bold text-sm tracking-tight">Untitled Session</span>
                    </div>
                </div>

                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4 bg-[#111] rounded-xl p-1 border border-white/5">
                    <div className="flex items-center gap-1">
                        <button onClick={togglePlay} className={`w-10 h-10 flex items-center justify-center rounded-lg ${isPlaying ? 'bg-blue-600 text-white' : 'hover:bg-white/10 text-gray-300'}`}>
                            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                        </button>
                        <button onClick={() => setIsPlaying(false)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-300">
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

                {/* Left Sidebar: Assets / Add */}
                <aside className="w-16 lg:w-64 border-r border-white/10 bg-[#0a0a0a] flex flex-col pt-4">
                    <div className="px-4 mb-6">
                        <h3 className="hidden lg:block text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Library</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center gap-3 p-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm transition-colors font-medium shadow-lg shadow-blue-900/20"
                            >
                                <Upload className="w-4 h-4" />
                                <span className="hidden lg:block">Upload Audio</span>
                            </button>

                            <div className="h-px bg-white/10 my-4" />

                            <p className="hidden lg:block text-[10px] text-gray-600 px-1">
                                Supported: MP3, WAV, M4A
                            </p>
                        </div>
                    </div>
                </aside>

                {/* Center: Timeline / Mixer */}
                <main className="flex-1 flex flex-col min-w-0 bg-[#080808]">

                    {/* Timeline Header/Ruler */}
                    <div className="h-8 border-b border-white/5 bg-[#0a0a0a] flex items-end px-4">
                        <div className="w-full h-4 flex justify-between text-[10px] text-gray-600 font-mono">
                            {/* Simplified ruler */}
                            <span>Start</span><span>End</span>
                        </div>
                    </div>

                    {/* Tracks Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {tracks.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 pb-20">
                                <Music className="w-12 h-12 mb-4 opacity-20" />
                                <p>No tracks yet.</p>
                                <button onClick={() => fileInputRef.current?.click()} className="text-blue-500 hover:underline mt-2">
                                    Upload an audio file
                                </button>
                            </div>
                        )}

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
                                        <div className="truncate font-semibold text-sm text-gray-200" title={track.name}>{track.name}</div>
                                    </div>

                                    <div className="space-y-2">
                                        {/* Vol Indicator */}
                                        <div className="flex items-center gap-2">
                                            <Volume2 className="w-3 h-3 text-gray-500" />
                                            <div className="h-1 flex-1 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-gray-400" style={{ width: `${track.volume * 100}%` }} />
                                            </div>
                                        </div>

                                        {/* Mute / Solo Controls */}
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { muted: !track.muted }); }}
                                                className={`flex-1 text-[10px] py-0.5 rounded ${track.muted ? 'bg-red-900/50 text-red-400' : 'bg-[#222] text-gray-500 hover:text-gray-300'}`}
                                            >
                                                M
                                            </button>
                                            <button className={`flex-1 text-[10px] py-0.5 rounded ${track.solo ? 'bg-yellow-900/50 text-yellow-400' : 'bg-[#222] text-gray-500 hover:text-gray-300'}`}>S</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Track Waveform */}
                                <div className="flex-1 relative bg-[#0a0a0a]">
                                    <TrackPlayer
                                        id={track.id}
                                        {...track}
                                        isPlaying={isPlaying}
                                    />

                                    {/* Delete Button (Hover) */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteTrack(track.id); }}
                                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                                        title="Delete Track"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {tracks.length > 0 && (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full h-12 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-gray-600 hover:text-gray-400 hover:border-white/20 transition-all font-medium text-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add another track</span>
                            </button>
                        )}
                    </div>
                </main>

                {/* Right Sidebar: Inspector */}
                <aside className="w-72 border-l border-white/10 bg-[#0a0a0a] flex flex-col">
                    {activeTrack ? (
                        <>
                            <div className="p-4 border-b border-white/10 bg-[#0f0f0f]">
                                <div className="flex items-center gap-3 mb-1">
                                    <Music className="w-5 h-5 text-gray-400" />
                                    <h2 className="font-bold text-sm tracking-wide">Track Settings</h2>
                                </div>
                                <p className="text-xs text-blue-400 truncate">{activeTrack.name}</p>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-8">

                                {/* Volume Control */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <span>Volume / Gain</span>
                                        <Volume2 className="w-3 h-3" />
                                    </div>
                                    <div className="bg-[#111] rounded-lg border border-white/5 p-4 space-y-4">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-300">Level</span>
                                            <span className="text-blue-400">{Math.round(activeTrack.volume * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0" max="100"
                                            value={activeTrack.volume * 100}
                                            onChange={(e) => updateTrack(activeTrack.id, { volume: parseInt(e.target.value) / 100 })}
                                            className="w-full h-1 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                                        />
                                    </div>
                                </div>

                                {/* Speed Control */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <span>Tempo / Speed</span>
                                        <Activity className="w-3 h-3" />
                                    </div>
                                    <div className="bg-[#111] rounded-lg border border-white/5 p-4 space-y-4">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-300">Playback Rate</span>
                                            <span className="text-blue-400">{activeTrack.speed.toFixed(2)}x</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50" max="200"
                                            value={activeTrack.speed * 100}
                                            onChange={(e) => updateTrack(activeTrack.id, { speed: parseInt(e.target.value) / 100 })}
                                            className="w-full h-1 bg-gray-700 rounded-full appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] text-gray-600 font-mono">
                                            <span>0.5x</span>
                                            <span className="cursor-pointer hover:text-blue-400" onClick={() => updateTrack(activeTrack.id, { speed: 1.0 })}>Reset</span>
                                            <span>2.0x</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-500/20 text-xs text-blue-200">
                                    <strong>Pro Tip:</strong> Use speed controls to create subliminal layers that are slightly faster or slower than normal speech.
                                </div>

                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-600 text-sm p-6 text-center">
                            <Sliders className="w-8 h-8 mb-3 opacity-20" />
                            <p>Select a track to adjust volume or speed.</p>
                        </div>
                    )}
                </aside>

            </div>
        </div>
    );
}
