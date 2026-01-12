'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X } from 'lucide-react';

interface Shortcut {
    keys: string[];
    description: string;
    category: string;
}

const SHORTCUTS: Shortcut[] = [
    // Playback
    { keys: ['Space'], description: 'Play / Pause', category: 'Playback' },

    // Editing
    { keys: ['Ctrl', 'Z'], description: 'Undo', category: 'Editing' },
    { keys: ['Ctrl', 'Shift', 'Z'], description: 'Redo', category: 'Editing' },
    { keys: ['Delete'], description: 'Delete selected track', category: 'Editing' },
    { keys: ['Backspace'], description: 'Delete selected track', category: 'Editing' },
    { keys: ['Escape'], description: 'Deselect track', category: 'Editing' },

    // View
    { keys: ['Ctrl', '+'], description: 'Zoom in timeline', category: 'View' },
    { keys: ['Ctrl', '-'], description: 'Zoom out timeline', category: 'View' },

    // File
    { keys: ['Ctrl', 'S'], description: 'Save session', category: 'File' },
    { keys: ['Ctrl', 'E'], description: 'Export project', category: 'File' },
];

interface KeyboardShortcutsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
    // Close on escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const categories = [...new Set(SHORTCUTS.map(s => s.category))];

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-lg bg-[#0a0a0a] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 pb-4 flex items-center justify-between border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                    <Keyboard className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
                                    <p className="text-xs text-gray-500">Quick reference for power users</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
                                aria-label="Close keyboard shortcuts"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                            {categories.map(category => (
                                <div key={category}>
                                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                        {category}
                                    </h3>
                                    <div className="space-y-2">
                                        {SHORTCUTS.filter(s => s.category === category).map((shortcut, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"
                                            >
                                                <span className="text-sm text-gray-300">{shortcut.description}</span>
                                                <div className="flex items-center gap-1">
                                                    {shortcut.keys.map((key, kidx) => (
                                                        <span key={kidx} className="flex items-center gap-1">
                                                            <kbd className="px-2 py-1 text-xs font-mono font-bold bg-white/10 rounded border border-white/10 text-white">
                                                                {key}
                                                            </kbd>
                                                            {kidx < shortcut.keys.length - 1 && (
                                                                <span className="text-gray-600 text-xs">+</span>
                                                            )}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-white/[0.02] border-t border-white/[0.06] text-center">
                            <p className="text-xs text-gray-500">
                                Press <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white font-mono">?</kbd> to toggle this help
                            </p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Hook to trigger the modal and handle shortcuts
export interface UseKeyboardShortcutsProps {
    handleUndo?: () => void;
    handleRedo?: () => void;
    handleDelete?: () => void;
    handlePlayPause?: () => void;
    handleSave?: () => void;
    handleExport?: () => void;
    canUndo?: boolean; // Optional state for conditional logic inside hook if needed later
    canRedo?: boolean;
    isPlaying?: boolean;
}

export function useKeyboardShortcuts(props: UseKeyboardShortcutsProps = {}) {
    const {
        handleUndo,
        handleRedo,
        handleDelete,
        handlePlayPause,
        handleSave,
        handleExport
    } = props;

    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            // Help
            if (e.key === '?') {
                e.preventDefault();
                setIsOpen(prev => !prev);
                return;
            }

            // Play/Pause
            if (e.code === 'Space' && handlePlayPause) {
                e.preventDefault();
                handlePlayPause();
            }

            // Save
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && handleSave) {
                e.preventDefault();
                handleSave();
            }

            // Export
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e' && handleExport) {
                e.preventDefault();
                handleExport();
            }

            // Undo/Redo
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault();
                if (e.shiftKey && handleRedo) {
                    handleRedo();
                } else if (handleUndo) {
                    handleUndo();
                }
            }

            // Delete
            if ((e.key === 'Delete' || e.key === 'Backspace') && handleDelete) {
                // Only prevent default if we have a handler, to avoid blocking backspace navigation elsewhere 
                // (though strictly usually okay if not in input)
                e.preventDefault();
                handleDelete();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleUndo, handleRedo, handleDelete, handlePlayPause, handleSave, handleExport]);

    return { isOpen, setIsOpen, openHelp: () => setIsOpen(true), closeHelp: () => setIsOpen(false) };
}
