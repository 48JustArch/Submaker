/**
 * useTracks - Custom hook for track management with undo/redo
 * 
 * Handles:
 * - Track state management
 * - Add, update, delete tracks
 * - Undo/redo history
 * - Track selection
 */

import { useState, useCallback, useRef } from 'react';
import type { Track, Effect, DEFAULT_EFFECTS } from '@/components/studio/types';

const MAX_HISTORY = 50;

interface UseTracksOptions {
    initialTracks?: Track[];
}

interface UseTracksReturn {
    tracks: Track[];
    setTracks: React.Dispatch<React.SetStateAction<Track[]>>;
    selectedTrackId: string | null;
    selectedTrack: Track | undefined;
    selectTrack: (id: string | null) => void;
    addTrack: (track: Track) => void;
    updateTrack: (id: string, updates: Partial<Track>) => void;
    deleteTrack: (id: string) => void;
    duplicateTrack: (id: string) => void;
    moveTrackUp: (id: string) => void;
    moveTrackDown: (id: string) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    saveToHistory: (newTracks: Track[]) => void;
}

export function useTracks(options: UseTracksOptions = {}): UseTracksReturn {
    const { initialTracks = [] } = options;

    const [tracks, setTracks] = useState<Track[]>(initialTracks);
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

    // Undo/Redo History
    const [tracksHistory, setTracksHistory] = useState<Track[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Get selected track
    const selectedTrack = tracks.find(t => t.id === selectedTrackId);

    // Save current state to history before making changes
    const saveToHistory = useCallback((newTracks: Track[]) => {
        setTracksHistory(prev => {
            // Remove any future states if we're not at the end
            const trimmed = prev.slice(0, historyIndex + 1);
            // Add current state (before change)
            const updated = [...trimmed, tracks];
            // Limit history size
            if (updated.length > MAX_HISTORY) {
                updated.shift();
            }
            return updated;
        });
        setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
        setTracks(newTracks);
    }, [tracks, historyIndex]);

    // Undo handler
    const undo = useCallback(() => {
        if (historyIndex >= 0 && tracksHistory.length > 0) {
            const previousState = tracksHistory[historyIndex];
            setHistoryIndex(prev => prev - 1);
            setTracks(previousState);
        }
    }, [historyIndex, tracksHistory]);

    // Redo handler
    const redo = useCallback(() => {
        if (historyIndex < tracksHistory.length - 1) {
            const nextState = tracksHistory[historyIndex + 1];
            setHistoryIndex(prev => prev + 1);
            setTracks(nextState);
        }
    }, [historyIndex, tracksHistory]);

    const canUndo = historyIndex >= 0;
    const canRedo = historyIndex < tracksHistory.length - 1;

    // Select track
    const selectTrack = useCallback((id: string | null) => {
        setSelectedTrackId(id);
    }, []);

    // Add a new track
    const addTrack = useCallback((track: Track) => {
        const newTracks = [...tracks, track];
        saveToHistory(newTracks);
        setSelectedTrackId(track.id);
    }, [tracks, saveToHistory]);

    // Update a track
    const updateTrack = useCallback((id: string, updates: Partial<Track>) => {
        const newTracks = tracks.map(t =>
            t.id === id ? { ...t, ...updates } : t
        );
        // Don't save to history for minor updates like volume changes
        // Only save for significant changes
        if (
            updates.name !== undefined ||
            updates.effects !== undefined ||
            updates.startTime !== undefined ||
            updates.inPoint !== undefined ||
            updates.outPoint !== undefined
        ) {
            saveToHistory(newTracks);
        } else {
            setTracks(newTracks);
        }
    }, [tracks, saveToHistory]);

    // Delete a track
    const deleteTrack = useCallback((id: string) => {
        const newTracks = tracks.filter(t => t.id !== id);
        saveToHistory(newTracks);

        // Clear selection if deleted track was selected
        if (selectedTrackId === id) {
            setSelectedTrackId(null);
        }
    }, [tracks, selectedTrackId, saveToHistory]);

    // Duplicate a track
    const duplicateTrack = useCallback((id: string) => {
        const trackToDuplicate = tracks.find(t => t.id === id);
        if (!trackToDuplicate) return;

        const newTrack: Track = {
            ...trackToDuplicate,
            id: `track-${Date.now()}`,
            name: `${trackToDuplicate.name} (Copy)`,
            // Offset the duplicate slightly
            startTime: (trackToDuplicate.startTime || 0) + 1
        };

        const index = tracks.findIndex(t => t.id === id);
        const newTracks = [
            ...tracks.slice(0, index + 1),
            newTrack,
            ...tracks.slice(index + 1)
        ];

        saveToHistory(newTracks);
        setSelectedTrackId(newTrack.id);
    }, [tracks, saveToHistory]);

    // Move track up in the list
    const moveTrackUp = useCallback((id: string) => {
        const index = tracks.findIndex(t => t.id === id);
        if (index <= 0) return;

        const newTracks = [...tracks];
        [newTracks[index - 1], newTracks[index]] = [newTracks[index], newTracks[index - 1]];
        saveToHistory(newTracks);
    }, [tracks, saveToHistory]);

    // Move track down in the list
    const moveTrackDown = useCallback((id: string) => {
        const index = tracks.findIndex(t => t.id === id);
        if (index === -1 || index >= tracks.length - 1) return;

        const newTracks = [...tracks];
        [newTracks[index], newTracks[index + 1]] = [newTracks[index + 1], newTracks[index]];
        saveToHistory(newTracks);
    }, [tracks, saveToHistory]);

    return {
        tracks,
        setTracks,
        selectedTrackId,
        selectedTrack,
        selectTrack,
        addTrack,
        updateTrack,
        deleteTrack,
        duplicateTrack,
        moveTrackUp,
        moveTrackDown,
        undo,
        redo,
        canUndo,
        canRedo,
        saveToHistory
    };
}
