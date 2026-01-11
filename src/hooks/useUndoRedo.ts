'use client';

import { useCallback, useRef, useState } from 'react';

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

export interface UndoRedoActions<T> {
    state: T;
    setState: (newState: T | ((prev: T) => T)) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    reset: (initialState: T) => void;
    historyLength: number;
}

/**
 * Custom hook for managing undo/redo history
 * @param initialState - The initial state value
 * @param maxHistory - Maximum number of history entries to keep (default 50)
 */
export function useUndoRedo<T>(initialState: T, maxHistory: number = 50): UndoRedoActions<T> {
    const [history, setHistory] = useState<HistoryState<T>>({
        past: [],
        present: initialState,
        future: [],
    });

    // Track last action to avoid duplicate history entries
    const lastActionTime = useRef<number>(0);
    const DEBOUNCE_MS = 300; // Debounce rapid changes

    const canUndo = history.past.length > 0;
    const canRedo = history.future.length > 0;

    const setState = useCallback((newState: T | ((prev: T) => T)) => {
        const now = Date.now();
        const shouldDebounce = now - lastActionTime.current < DEBOUNCE_MS;

        setHistory(prev => {
            const actualNewState = typeof newState === 'function'
                ? (newState as (prev: T) => T)(prev.present)
                : newState;

            // Don't add to history if state hasn't changed
            if (JSON.stringify(actualNewState) === JSON.stringify(prev.present)) {
                return prev;
            }

            // If debouncing, update present without adding to history
            if (shouldDebounce && prev.past.length > 0) {
                return {
                    past: prev.past,
                    present: actualNewState,
                    future: [], // Clear future on new action
                };
            }

            // Add current state to past
            const newPast = [...prev.past, prev.present];

            // Limit history size
            if (newPast.length > maxHistory) {
                newPast.shift();
            }

            lastActionTime.current = now;

            return {
                past: newPast,
                present: actualNewState,
                future: [], // Clear future on new action
            };
        });
    }, [maxHistory]);

    const undo = useCallback(() => {
        setHistory(prev => {
            if (prev.past.length === 0) return prev;

            const newPast = [...prev.past];
            const previousState = newPast.pop()!;

            return {
                past: newPast,
                present: previousState,
                future: [prev.present, ...prev.future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory(prev => {
            if (prev.future.length === 0) return prev;

            const newFuture = [...prev.future];
            const nextState = newFuture.shift()!;

            return {
                past: [...prev.past, prev.present],
                present: nextState,
                future: newFuture,
            };
        });
    }, []);

    const reset = useCallback((initialState: T) => {
        setHistory({
            past: [],
            present: initialState,
            future: [],
        });
    }, []);

    return {
        state: history.present,
        setState,
        undo,
        redo,
        canUndo,
        canRedo,
        reset,
        historyLength: history.past.length,
    };
}

/**
 * Simplified wrapper for track-specific undo/redo
 */
export function createTracksHistory<T>(initialTracks: T[], maxHistory: number = 50) {
    return {
        hook: () => useUndoRedo<T[]>(initialTracks, maxHistory),
    };
}
