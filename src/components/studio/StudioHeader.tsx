'use client';

import { useState, useMemo } from 'react';
import { ChevronLeft, Settings, Download, Play, Pause, Square, Video, Music, Undo2, Redo2, Save, Check } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

interface StudioHeaderProps {
    mode: 'audio' | 'video';
    setMode: (mode: 'audio' | 'video') => void;
    isPlaying: boolean;
    setIsPlaying: (playing: boolean) => void;
    currentTime: string;
    onStop: () => void;
    onExport: () => void;
    onSettings: () => void;
    sessionName: string;
    onSessionNameChange: (name: string) => void;
    lastSaved: Date | null;
    isSaving?: boolean;
    onUndo?: () => void;
    onRedo?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
}

export default function StudioHeader({
    mode,
    setMode,
    isPlaying,
    setIsPlaying,
    currentTime,
    onStop,
    onExport,
    onSettings,
    sessionName,
    onSessionNameChange,
    lastSaved,
    isSaving = false,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
}: StudioHeaderProps) {
    const [isEditingName, setIsEditingName] = useState(false);

    const lastSavedText = useMemo(() => {
        if (!lastSaved) return 'Not saved';
        const now = new Date();
        const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
        if (diff < 10) return 'Saved';
        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        return `${Math.floor(diff / 3600)}h ago`;
    }, [lastSaved]);

    return (
        <motion.header
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-16 bg-[#050505]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-5 sticky top-0 z-50"
        >
            {/* ===== LEFT SECTION ===== */}
            <div className="flex items-center gap-4 w-auto flex-1 md:flex-none md:w-[280px]">
                {/* Back Button */}
                <Link href="/dashboard" aria-label="Back to dashboard">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-9 h-9 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.1] transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </motion.div>
                </Link>

                {/* Session Name & Status */}
                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        value={sessionName}
                        onChange={(e) => onSessionNameChange(e.target.value)}
                        onFocus={() => setIsEditingName(true)}
                        onBlur={() => setIsEditingName(false)}
                        aria-label="Session name"
                        className={`bg-transparent text-sm font-medium w-full truncate focus:outline-none transition-all px-2 py-1 -mx-2 rounded-lg ${isEditingName
                            ? 'text-white ring-1 ring-blue-500/50 bg-white/[0.03]'
                            : 'text-gray-200 hover:text-white hover:bg-white/[0.03]'
                            }`}
                    />
                    <div className="flex items-center gap-2 px-2 mt-0.5">
                        <AnimatePresence mode="wait">
                            {isSaving ? (
                                <motion.div
                                    key="saving"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-1.5 text-[10px] text-blue-400"
                                >
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Save className="w-2.5 h-2.5" />
                                    </motion.div>
                                    <span className="hidden sm:inline">Saving...</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="saved"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-1.5 text-[10px] text-gray-500"
                                >
                                    {lastSaved && <Check className="w-2.5 h-2.5 text-emerald-500" />}
                                    <span className="hidden sm:inline">{lastSavedText}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ===== CENTER SECTION ===== */}
            <div className="flex items-center gap-2 md:gap-6">
                {/* Mode Toggle - Clean Design (Hidden on Mobile) */}
                <div className="hidden md:block relative bg-[#1a1a1a] p-1 rounded-lg border border-white/[0.06]">
                    {/* Active Indicator */}
                    <motion.div
                        className="absolute top-1 bottom-1 rounded-[6px] bg-white/[0.1] border border-white/[0.06]"
                        initial={false}
                        animate={{
                            left: mode === 'audio' ? '4px' : 'calc(50%)',
                            width: 'calc(50% - 4px)',
                        }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />

                    <div className="relative flex">
                        <button
                            onClick={() => setMode('audio')}
                            className={`relative z-10 px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${mode === 'audio'
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <Music className={`w-3.5 h-3.5 ${mode === 'audio' ? 'text-blue-400' : ''}`} />
                            Audio
                        </button>
                        <button
                            onClick={() => setMode('video')}
                            className={`relative z-10 px-4 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${mode === 'video'
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <Video className={`w-3.5 h-3.5 ${mode === 'video' ? 'text-blue-400' : ''}`} />
                            Video
                        </button>
                    </div>
                </div>

                {/* Transport Controls */}
                <div className="flex items-center gap-3">
                    {/* Stop Button (Hidden on Mobile) */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onStop}
                        className="hidden md:flex w-9 h-9 rounded-md items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        title="Stop"
                        aria-label="Stop playback"
                    >
                        <Square className="w-4 h-4 fill-current" />
                    </motion.button>

                    {/* Play/Pause Button - Blue/White Glow */}
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsPlaying(!isPlaying)}
                        aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
                        aria-pressed={isPlaying}
                        className={`relative w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all ${isPlaying
                            ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                            : 'bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.4)] hover:bg-blue-500'
                            }`}
                    >
                        {/* Glow Ring */}
                        <motion.div
                            className="absolute inset-0 rounded-full"
                            animate={isPlaying ? {} : {
                                boxShadow: [
                                    '0 0 20px rgba(37,99,235,0.3)',
                                    '0 0 30px rgba(37,99,235,0.5)',
                                    '0 0 20px rgba(37,99,235,0.3)',
                                ]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={isPlaying ? 'pause' : 'play'}
                                initial={{ opacity: 0, scale: 0.5, rotate: -90 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.5, rotate: 90 }}
                                transition={{ duration: 0.15 }}
                                className="relative z-10"
                            >
                                {isPlaying ? (
                                    <Pause className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                                ) : (
                                    <Play className="w-4 h-4 md:w-5 md:h-5 fill-current ml-0.5" />
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </motion.button>

                    {/* Time Display (Hidden on Mobile) */}
                    <div
                        className="hidden md:block font-mono text-sm text-white tabular-nums tracking-wider bg-black/40 px-4 py-2 rounded-lg border border-white/[0.06] min-w-[90px] text-center"
                        aria-label="Current playback time"
                        role="timer"
                    >
                        {currentTime}
                    </div>
                </div>
            </div>

            {/* ===== RIGHT SECTION ===== */}
            <div className="flex items-center gap-2 w-auto md:w-[280px] justify-end">
                {/* Undo/Redo (Hidden on Mobile) */}
                <div className="hidden md:flex items-center gap-0.5 mr-2">
                    <motion.button
                        whileHover={canUndo ? { scale: 1.05 } : {}}
                        whileTap={canUndo ? { scale: 0.95 } : {}}
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${canUndo
                            ? 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                            : 'text-gray-700 cursor-not-allowed'
                            }`}
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        whileHover={canRedo ? { scale: 1.05 } : {}}
                        whileTap={canRedo ? { scale: 0.95 } : {}}
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${canRedo
                            ? 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
                            : 'text-gray-700 cursor-not-allowed'
                            }`}
                        title="Redo (Ctrl+Shift+Z)"
                    >
                        <Redo2 className="w-4 h-4" />
                    </motion.button>
                </div>

                {/* Divider (Hidden on Mobile) */}
                <div className="hidden md:block w-px h-6 bg-white/[0.06] mx-2" />

                {/* Export Button - Clean Blue/White */}
                <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onExport}
                    aria-label="Export project (Ctrl+E)"
                    className="px-3 md:px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-lg text-xs font-semibold flex items-center gap-2 border border-white/[0.06] transition-all"
                >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Export</span>
                </motion.button>

                {/* Settings Button (Hidden on Mobile) */}
                <motion.button
                    whileHover={{ scale: 1.05, rotate: 15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSettings}
                    aria-label="Open settings"
                    className="hidden md:flex w-9 h-9 rounded-md bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.1] transition-all"
                >
                    <Settings className="w-4 h-4" />
                </motion.button>

                {/* Keyboard Shortcuts Hint (Hidden on Mobile) */}
                <div className="hidden md:block relative group">
                    <div className="w-6 h-6 rounded bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-gray-500 hover:text-white transition-colors cursor-help">
                        ?
                    </div>
                    <div className="absolute right-0 top-full mt-2 px-3 py-2 bg-[#141414] border border-white/10 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                        <div className="text-[10px] text-gray-400">Press <span className="text-white font-mono bg-white/10 px-1 rounded">?</span> for shortcuts</div>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}
