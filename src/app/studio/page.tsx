'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import {
    Play, Pause, Square, Upload, Clock, Download, ChevronLeft,
    Volume2, Music, Video, Image as ImageIcon, Layers,
    Plus, Trash2, Sliders, Activity, ZoomIn, ZoomOut, Settings, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import WaveSurfer from 'wavesurfer.js';
import Link from 'next/link';
import TrackPlayer from '@/components/studio/TrackPlayer';
import Stage from '@/components/studio/Stage';
import { Track, AudioTrack, VideoTrack, ImageTrack, SessionMode } from '@/types/studio';
import AffirmationGenerator from '@/components/studio/AffirmationGenerator';

export default function StudioPage() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [zoomLevel, setZoomLevel] = useState<number | 'fit'>('fit');
    const [activeTrackId, setActiveTrackId] = useState<string | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [sessionMode, setSessionMode] = useState<SessionMode>('audio');
    const [activeCategory, setActiveCategory] = useState<'All' | 'Audio' | 'Visual'>('All');
    const [showAffirmationGenerator, setShowAffirmationGenerator] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Refs for high-performance UI updates without re-renders
    const playheadRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<HTMLDivElement>(null);
    const currentTimeRef = useRef(0);
    const [seekState, setSeekState] = useState<{ time: number; timestamp: number } | null>(null);

    const activeTrack = tracks.find(t => t.id === activeTrackId);

    // Calculate max track duration
    const maxTrackDuration = tracks.length > 0 ? Math.max(...tracks.map(t => t.duration || 0), 1) : 0;

    // Determine the visualization scale (total duration of the view)
    const viewDuration = zoomLevel === 'fit' ? Math.max(maxTrackDuration, 10) : zoomLevel;

    // Use a ref for viewDuration to avoid stale closures in the audio callback
    const viewDurationRef = useRef(viewDuration);

    useEffect(() => {
        viewDurationRef.current = viewDuration;

        // Also update playhead immediately when zoom changes
        const time = currentTimeRef.current;
        if (playheadRef.current) {
            const percent = (time / viewDuration) * 100;
            playheadRef.current.style.left = `${percent}%`;
        }
    }, [viewDuration]);

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        // Since we are clicking the timeline area which might be the ruler 
        // We'll attach this mainly to the ruler's "flex-1" container
        const x = e.clientX - rect.left;
        const width = rect.width;
        // Clamp 0 to 1
        const percent = Math.max(0, Math.min(1, x / width));
        const newTime = percent * viewDurationRef.current;

        setSeekState({ time: newTime, timestamp: Date.now() });
        handleTrackProgress(newTime);
    };

    // Original handleFileUpload replaced by generic addFileToTracks below


    const updateTrack = (id: string, updates: Partial<Track>) => {
        setTracks(prev => prev.map(t => (t.id === id ? { ...t, ...updates } as Track : t)));
    };

    const deleteTrack = (id: string) => {
        setTracks(prev => prev.filter(t => t.id !== id));
        if (activeTrackId === id) setActiveTrackId(null);
    };

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const formatTime = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const addFileToTracks = (file: File) => {
        const url = URL.createObjectURL(file);
        const baseTrack = {
            id: Date.now().toString(),
            name: file.name.replace(/\.[^/.]+$/, ""),
            url: url,
            start: 0,
            duration: 10,
            layer: 0,
            locked: false,
            hidden: false,
        };

        if (file.type.startsWith('video/')) {
            const newTrack: VideoTrack = {
                ...baseTrack,
                type: 'video',
                volume: 1,
                muted: false,
                speed: 1,
                x: 50, y: 50, width: 100, height: 100, scale: 1, opacity: 1, zIndex: 1, highlight: false
            };
            setTracks(prev => [...prev, newTrack]);
            setActiveTrackId(newTrack.id);
            setSessionMode('video');
        } else if (file.type.startsWith('image/')) {
            const newTrack: ImageTrack = {
                ...baseTrack,
                type: 'image',
                duration: 5,
                x: 50, y: 50, width: 50, height: 50, scale: 1, opacity: 1, zIndex: 2, highlight: false
            };
            setTracks(prev => [...prev, newTrack]);
            setActiveTrackId(newTrack.id);
        } else {
            const newTrack: AudioTrack = {
                ...baseTrack,
                duration: 0,
                type: 'audio',
                volume: 0.8,
                speed: 1.0,
                pan: 0,
                muted: false,
                solo: false,
                color: 'bg-blue-500',
                icon: Music,
            };
            setTracks((prev: Track[]) => [...prev, newTrack]);
            setActiveTrackId(newTrack.id);
        }
    };

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) addFileToTracks(file);
    };

    const formatTimeHighRes = (time: number) => {
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        const ms = Math.floor((time % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
    }

    // Callback when a track reports its duration
    const handleTrackReady = (id: string, duration: number) => {
        updateTrack(id, { duration });
    };

    // Callback when a track reports progress
    // We update the DOM directly to avoid react re-renders (which cause standard lag)
    const handleTrackProgress = (time: number) => {
        currentTimeRef.current = time;
        // setCurrentTime(time); // REMOVED to prevent re-renders

        if (playheadRef.current) {
            const currentViewDuration = viewDurationRef.current;
            const percent = (time / currentViewDuration) * 100;
            playheadRef.current.style.left = `${percent}%`;
        }
        if (timerRef.current) {
            timerRef.current.innerText = formatTimeHighRes(time);
        }
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
            <header className="h-16 glass-header flex items-center justify-between px-6 z-50 relative">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="studio-btn-icon group">
                        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </Link>

                    <div className="flex items-center gap-6">
                        {/* Session Badge */}
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-xs font-medium text-gray-300">Untitled Session</span>
                        </div>

                        {/* Animated Mode Switcher */}
                        <div className="flex bg-black/40 rounded-full p-1 border border-white/5 relative">
                            {(['audio', 'video'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setSessionMode(mode)}
                                    className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-colors z-10 ${sessionMode === mode ? 'text-white' : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    {sessionMode === mode && (
                                        <motion.div
                                            layoutId="activeMode"
                                            className={`absolute inset-0 rounded-full ${mode === 'audio' ? 'bg-blue-600' : 'bg-purple-600'
                                                } shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]`}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative capitalize">{mode}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Central Transport */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/40 rounded-2xl p-2 border border-white/5 backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-2">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => { setIsPlaying(false); handleTrackProgress(0); }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5"
                        >
                            <Square className="w-4 h-4 fill-current" />
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={togglePlay}
                            className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${isPlaying
                                ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.4)]'
                                : 'bg-white text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.25)]'
                                }`}
                        >
                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                        </motion.button>
                    </div>

                    <div className="h-8 w-px bg-white/10" />

                    <div
                        ref={timerRef}
                        className="font-mono text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500 w-32 text-center tracking-wider"
                    >
                        00:00:00
                    </div>
                </div>

                <div className="flex gap-4 items-center">
                    {/* Zoom Controls */}
                    <div className="hidden lg:flex items-center bg-black/40 rounded-lg p-1 border border-white/5">
                        <button
                            onClick={() => setZoomLevel('fit')}
                            className={`px-3 py-1 text-xs rounded-md transition-all ${zoomLevel === 'fit' ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'
                                }`}
                        >
                            Fit
                        </button>
                        <div className="w-px h-3 bg-white/10 mx-1" />
                        {[60, 300, 600].map(val => (
                            <button
                                key={val}
                                onClick={() => setZoomLevel(val)}
                                className={`px-3 py-1 text-xs rounded-md transition-all ${zoomLevel === val ? 'bg-white/20 text-white' : 'text-gray-500 hover:text-white'
                                    }`}
                            >
                                {val / 60}m
                            </button>
                        ))}
                    </div>

                    <button className="studio-btn studio-btn-primary">
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">

                {/* Left Sidebar: Assets / Add */}
                <aside className="w-16 lg:w-72 glass-panel border-y-0 border-l-0 rounded-r-3xl flex flex-col pt-6 z-40 bg-[#0a0a0a]/50">
                    <div className="px-5 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="hidden lg:block text-xs font-bold text-gray-500 uppercase tracking-widest">Library</h3>
                            <button className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                <Settings className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Upload Zone */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full relative group overflow-hidden p-[1px] rounded-xl bg-gradient-to-br from-white/10 to-transparent text-left"
                        >
                            <div className="relative flex flex-col items-center gap-3 p-6 rounded-xl bg-black/40 backdrop-blur-md transition-colors group-hover:bg-black/30">
                                <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                    <Plus className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors" />
                                </div>
                                <div className="hidden lg:block text-center whitespace-normal">
                                    <span className="block text-sm font-medium text-white mb-1">Add Media</span>
                                    <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Audio • Video • Image</span>
                                </div>
                            </div>
                        </motion.button>

                        {/* AI Generate Button */}
                        {/* AI Generate Button */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowAffirmationGenerator(true)}
                            className="mt-3 w-full group relative overflow-hidden flex items-center justify-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Sparkles className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors relative z-10" />
                            <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors relative z-10">AI Affirmations</span>
                        </motion.button>
                    </div>

                    {/* Categories */}
                    <div className="px-3 hidden lg:block">
                        <div className="flex gap-1 p-1 bg-black/20 rounded-lg mb-6 border border-white/5">
                            {['All', 'Audio', 'Visual'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveCategory(tab as 'All' | 'Audio' | 'Visual')}
                                    className={`flex-1 py-1.5 text-[10px] font-medium rounded-md transition-all ${activeCategory === tab ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recent Files List */}
                    <div className="px-5 hidden lg:block flex-1 overflow-auto custom-scrollbar">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-bold text-gray-600 uppercase tracking-wider">Recent Assets</h4>
                            <span className="text-[10px] text-gray-700 bg-white/5 px-1.5 py-0.5 rounded-full">
                                {tracks.filter(t => activeCategory === 'All' ? true : activeCategory === 'Visual' ? (t.type === 'video' || t.type === 'image') : t.type === 'audio').length}
                            </span>
                        </div>

                        {tracks.filter(t => activeCategory === 'All' ? true : activeCategory === 'Visual' ? (t.type === 'video' || t.type === 'image') : t.type === 'audio').length === 0 ? (
                            <div className="text-center py-8 opacity-50">
                                <Layers className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                                <p className="text-xs text-gray-500">No recent assets</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tracks
                                    .filter(t => activeCategory === 'All' ? true : activeCategory === 'Visual' ? (t.type === 'video' || t.type === 'image') : t.type === 'audio')
                                    .map(track => (
                                        <div
                                            key={track.id}
                                            onClick={() => setActiveTrackId(track.id)}
                                            className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${activeTrackId === track.id ? 'bg-white/10 border border-white/10' : 'hover:bg-white/5 border border-transparent'}`}
                                        >
                                            {/* Thumbnail / Icon */}
                                            <div className={`w-10 h-10 rounded-md flex items-center justify-center shrink-0 ${track.type === 'video' ? 'bg-purple-900/30 text-purple-400' : track.type === 'image' ? 'bg-pink-900/30 text-pink-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                                {track.type === 'video' ? <Video className="w-4 h-4" /> : track.type === 'image' ? <ImageIcon className="w-4 h-4" /> : <Music className="w-4 h-4" />}
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium truncate ${activeTrackId === track.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{track.name}</p>
                                                <p className="text-[10px] text-gray-600 truncate">{formatTime(track.duration)} • {track.type}</p>
                                            </div>

                                            {/* Actions (visible on hover) */}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteTrack(track.id); }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-gray-600 transition-all"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Center: Timeline / Mixer */}
                <main className="flex-1 flex flex-col min-w-0 bg-[#080808]">

                    {/* Timeline Header/Ruler */}
                    <div className="h-8 border-b border-white/5 bg-[#0a0a0a] flex items-end px-4">
                        <div className="w-full h-4 flex text-[10px] text-gray-600 font-mono relative">
                            {/* Spacer for Track Header (w-48 = 192px) */}
                            <div className="w-48 shrink-0 border-r border-white/5 mr-0"></div>

                            {/* Ruler Labels */}
                            <div
                                className="flex-1 relative cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={handleSeek}
                            >
                                <span className="absolute left-0 -translate-x-1/2">0:00</span>
                                <span className="absolute left-1/4 -translate-x-1/2">{formatTime(viewDuration * 0.25)}</span>
                                <span className="absolute left-2/4 -translate-x-1/2">{formatTime(viewDuration * 0.50)}</span>
                                <span className="absolute left-3/4 -translate-x-1/2">{formatTime(viewDuration * 0.75)}</span>
                                <span className="absolute right-0 translate-x-1/2">{formatTime(viewDuration)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tracks Area */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col">

                        {/* Video Mode Stage */}
                        {sessionMode === 'video' && (
                            <div className="mb-4 shrink-0 flex justify-center bg-[#050505] border-b border-white/5 pb-4">
                                <div className="w-3/4 max-w-4xl">
                                    <Stage
                                        tracks={tracks}
                                        activeTrackId={activeTrackId}
                                        currentTime={currentTime}
                                        isPlaying={isPlaying}
                                        onUpdateTrack={updateTrack}
                                        onSelectTrack={(id) => setActiveTrackId(id)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="relative space-y-2 pb-20">
                            {/* Global Playhead Line */}
                            {tracks.length > 0 && (
                                <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none z-30">
                                    <div className="absolute top-0 bottom-0 flex h-full w-full pl-48">
                                        <div
                                            ref={playheadRef}
                                            className="h-full w-px bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] transition-none relative z-30"
                                            style={{ left: '0%' }}
                                        >
                                            <div className="absolute top-0 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_red]" />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Visual Tracks Section */}
                            {tracks.filter(t => t.type !== 'audio').map((track) => (
                                <div
                                    key={track.id}
                                    onClick={() => setActiveTrackId(track.id)}
                                    className={`
                                        relative h-20 mb-2 rounded-xl border transition-all duration-200 flex overflow-hidden group shrink-0 z-20 backdrop-blur-md
                                        ${activeTrackId === track.id ? 'bg-white/10 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/10'}
                                    `}
                                >
                                    {/* Track Header (Left) */}
                                    <div className="w-48 bg-black/20 border-r border-white/5 p-3 flex flex-col justify-between shrink-0 relative z-20">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-8 rounded-full shadow-[0_0_10px_currentColor] ${track.type === 'video' ? 'bg-purple-500 text-purple-500' : 'bg-pink-500 text-pink-500'}`} />
                                            <div className="truncate font-medium text-sm text-gray-200" title={track.name}>{track.name}</div>
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                            {track.type === 'video' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                                            <span className="font-mono">{track.duration > 0 ? formatTime(track.duration) : '--:--'}</span>
                                        </div>
                                    </div>

                                    {/* Track Timeline Visualization */}
                                    <div className="flex-1 relative bg-black/20 overflow-hidden">
                                        <div className="relative h-full w-full">
                                            {/* Visual Block */}
                                            <div
                                                className="absolute top-1 bottom-1 bg-purple-900/30 border border-purple-500/30 rounded-lg flex items-center justify-center overflow-hidden backdrop-blur-sm"
                                                style={{
                                                    left: `${(track.start / viewDuration) * 100}%`,
                                                    width: `${(track.duration / viewDuration) * 100}%`
                                                }}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent" />
                                                <span className="relative text-[10px] text-purple-200 truncate px-2 font-medium">{track.name}</span>
                                            </div>
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteTrack(track.id); }}
                                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-20"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Divider if both exist */}
                            {tracks.some(t => t.type !== 'audio') && tracks.some(t => t.type === 'audio') && (
                                <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-6" />
                            )}

                            {/* Audio Tracks Section */}
                            {tracks.filter(t => t.type === 'audio').map((track) => (
                                <div
                                    key={track.id}
                                    onClick={() => setActiveTrackId(track.id)}
                                    className={`
                                        relative h-32 mb-2 rounded-xl border transition-all duration-200 flex overflow-hidden group shrink-0 z-20 backdrop-blur-md
                                        ${activeTrackId === track.id ? 'bg-white/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-black/40 border-white/5 hover:border-white/10'}
                                    `}
                                >
                                    {/* Track Header (Left) */}
                                    <div className="w-48 bg-black/20 border-r border-white/5 p-3 flex flex-col justify-between shrink-0 relative z-20">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-1 h-8 rounded-full shadow-[0_0_10px_currentColor] ${track.type === 'audio' && 'color' in track ? track.color.replace('bg-', 'text-').replace('-500', '-500') + ' ' + track.color : 'text-gray-500 bg-gray-500'}`} />
                                            <div className="truncate font-medium text-sm text-gray-200" title={track.name}>{track.name}</div>
                                        </div>

                                        <div className="flex items-center gap-1 text-[10px] text-gray-500">
                                            <Clock className="w-3 h-3" />
                                            <span className="font-mono">{track.duration > 0 ? formatTime(track.duration) : '--:--'}</span>
                                        </div>

                                        <div className="flex gap-2 mt-auto">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); updateTrack(track.id, { muted: !track.muted }); }}
                                                className={`flex-1 flex items-center justify-center p-1 rounded-md transition-colors ${track.muted ? 'bg-red-500/20 text-red-400' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                                title="Mute"
                                            >
                                                <span className="text-[10px] font-bold">M</span>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (track.type === 'audio') {
                                                        const audioT = track as AudioTrack;
                                                        updateTrack(track.id, { solo: !audioT.solo });
                                                    }
                                                }}
                                                className={`flex-1 flex items-center justify-center p-1 rounded-md transition-colors ${track.type === 'audio' && (track as AudioTrack).solo ? 'bg-yellow-500/20 text-yellow-400' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                                title="Solo"
                                            >
                                                <span className="text-[10px] font-bold">S</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Track Waveform */}
                                    <div className="flex-1 relative bg-black/20 overflow-hidden">
                                        <div className="relative h-full w-full">
                                            <TrackPlayer
                                                // Spread includes 'id', so we don't pass it explicitly to avoid duplicates
                                                {...track as AudioTrack}
                                                isPlaying={isPlaying}
                                                widthPercent={viewDuration > 0 ? (track.duration / viewDuration) * 100 : 100}
                                                isMaster={track.id === tracks.find(t => t.type === 'audio')?.id}
                                                seekState={seekState}
                                                onReady={(dur) => handleTrackReady(track.id, dur)}
                                                onProgress={handleTrackProgress}
                                            />

                                            {/* End Time Label */}
                                            {track.duration > 0 && (
                                                <div
                                                    className="absolute top-0 bottom-0 border-r border-blue-500/50 pointer-events-none flex items-end justify-end pb-1 pr-1 z-10"
                                                    style={{ left: `${(track.duration / viewDuration) * 100}%` }}
                                                >
                                                    <span className="text-[9px] font-mono text-blue-400 bg-black/80 px-1 rounded transform translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {formatTime(track.duration)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Delete Button */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteTrack(track.id); }}
                                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-20"
                                            title="Delete Track"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {tracks.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-600 pb-20">
                                <Music className="w-12 h-12 mb-4 opacity-20" />
                                <p>No tracks yet.</p>
                                <button onClick={() => fileInputRef.current?.click()} className="text-blue-500 hover:underline mt-2">
                                    Upload an audio file
                                </button>
                            </div>
                        )}

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
                <aside className="w-80 glass-panel border-y-0 border-r-0 rounded-l-3xl flex flex-col z-40 bg-[#0a0a0a]/50 backdrop-blur-xl">
                    <AnimatePresence mode="wait">
                        {activeTrack ? (
                            <motion.div
                                key={activeTrack.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2 }}
                                className="flex flex-col h-full"
                            >
                                {/* Header */}
                                <div className="p-6 border-b border-white/5">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-2.5 rounded-xl shadow-lg ${activeTrack.type === 'video' ? 'bg-purple-600/20 text-purple-400 shadow-purple-900/20' : 'bg-blue-600/20 text-blue-400 shadow-blue-900/20'}`}>
                                            {activeTrack.type === 'video' ? <Video className="w-5 h-5" /> : activeTrack.type === 'image' ? <ImageIcon className="w-5 h-5" /> : <Music className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-sm text-white tracking-wide">Track Settings</h2>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-medium">{activeTrack.type} Layer {activeTrack.layer}</p>
                                        </div>
                                    </div>
                                    <div className="group relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg blur opacity-50 group-hover:opacity-100 transition-opacity" />
                                        <div className="relative bg-black/40 rounded-lg p-3 border border-white/5 flex items-center justify-between">
                                            <span className="text-xs text-gray-300 font-medium truncate pr-4">{activeTrack.name}</span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                                    {/* Audio Properties */}
                                    {(activeTrack.type === 'audio' || activeTrack.type === 'video') && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest pb-2 border-b border-white/5">
                                                <Volume2 className="w-3 h-3" />
                                                <span>Audio Mix</span>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Volume */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-xs font-medium text-gray-400">
                                                        <span>Volume</span>
                                                        <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">{Math.round(activeTrack.volume * 100)}%</span>
                                                    </div>
                                                    <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden group">
                                                        <div
                                                            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full"
                                                            style={{ width: `${activeTrack.volume * 100}%` }}
                                                        />
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="1"
                                                            step="0.01"
                                                            value={activeTrack.volume}
                                                            onChange={(e) => updateTrack(activeTrack.id, { volume: parseFloat(e.target.value) })}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Speed */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-xs font-medium text-gray-400">
                                                        <span>Speed</span>
                                                        <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">{activeTrack.speed}x</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0.5"
                                                        max="2"
                                                        step="0.1"
                                                        value={activeTrack.speed}
                                                        onChange={(e) => updateTrack(activeTrack.id, { speed: parseFloat(e.target.value) })}
                                                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Visual Properties */}
                                    {(activeTrack.type === 'video' || activeTrack.type === 'image') && (
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest pb-2 border-b border-white/5">
                                                <Layers className="w-3 h-3" />
                                                <span>Transform</span>
                                            </div>

                                            <div className="space-y-6">
                                                {/* Opacity */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-xs font-medium text-gray-400">
                                                        <span>Opacity</span>
                                                        <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">{Math.round(activeTrack.opacity * 100)}%</span>
                                                    </div>
                                                    <div className="relative h-1.5 rounded-full bg-white/10 overflow-hidden">
                                                        <div
                                                            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-purple-600 to-pink-400 rounded-full"
                                                            style={{ width: `${activeTrack.opacity * 100}%` }}
                                                        />
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max="1"
                                                            step="0.01"
                                                            value={activeTrack.opacity}
                                                            onChange={(e) => updateTrack(activeTrack.id, { opacity: parseFloat(e.target.value) })}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Scale */}
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-xs font-medium text-gray-400">
                                                        <span>Scale</span>
                                                        <span className="text-white bg-white/10 px-1.5 py-0.5 rounded">{Math.round(activeTrack.scale * 100)}%</span>
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0.1"
                                                        max="3"
                                                        step="0.1"
                                                        value={activeTrack.scale}
                                                        onChange={(e) => updateTrack(activeTrack.id, { scale: parseFloat(e.target.value) })}
                                                        className="w-full h-1.5 bg-white/10 rounded-full appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                                                    />
                                                </div>

                                                {/* Position Grid */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] text-gray-500 uppercase font-bold">X Pos</span>
                                                        <input
                                                            type="number"
                                                            value={Math.round(activeTrack.x)}
                                                            onChange={(e) => updateTrack(activeTrack.id, { x: parseInt(e.target.value) })}
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <span className="text-[10px] text-gray-500 uppercase font-bold">Y Pos</span>
                                                        <input
                                                            type="number"
                                                            value={Math.round(activeTrack.y)}
                                                            onChange={(e) => updateTrack(activeTrack.id, { y: parseInt(e.target.value) })}
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 flex flex-col items-center justify-center text-gray-600 text-sm p-6 text-center"
                            >
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                                    <Sliders className="w-8 h-8 opacity-20" />
                                </div>
                                <p className="font-medium text-gray-400">No Selection</p>
                                <p className="text-xs text-gray-600 mt-2 max-w-[12rem]">Select a track from the timeline to adjust its properties.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </aside>

                {/* Modals */}
                <AnimatePresence>
                    {showAffirmationGenerator && (
                        <AffirmationGenerator
                            onClose={() => setShowAffirmationGenerator(false)}
                            onAddTrack={addFileToTracks}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
