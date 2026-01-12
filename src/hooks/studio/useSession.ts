/**
 * useSession - Custom hook for Studio session management
 * 
 * Handles:
 * - User authentication check
 * - Session creation and loading
 * - Auto-save functionality
 * - Session metadata persistence
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/components/ui/Toast';
import {
    createSession,
    getSessionById,
    updateSessionData,
    canCreateSession,
    ensureUserProfile
} from '@/lib/supabase/sessions';
import type { Track } from '@/components/studio/types';

// Session storage key for local backup
const SESSION_STORAGE_KEY = 'subliminal-studio-session';

// Session data structure for metadata
export interface SessionData {
    sessionName: string;
    mode: 'audio' | 'video';
    zoom: number;
    tracks: Array<Omit<Track, 'file'> & { hasFile: boolean }>;
    savedAt: string;
}

interface UseSessionOptions {
    tracks: Track[];
    mode: 'audio' | 'video';
    zoom: number;
    setTracks: (tracks: Track[]) => void;
    setMode: (mode: 'audio' | 'video') => void;
    setZoom: (zoom: number) => void;
    clearAssets: () => void;
}

interface UseSessionReturn {
    userId: string | null;
    sessionId: string | null;
    sessionName: string;
    setSessionName: (name: string) => void;
    lastSaved: Date | null;
    isSaving: boolean;
    isLoading: boolean;
    saveSession: () => Promise<void>;
}

export function useSession(options: UseSessionOptions): UseSessionReturn {
    const { tracks, mode, zoom, setTracks, setMode, setZoom, clearAssets } = options;

    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const { showToast } = useToast();

    const [userId, setUserId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [sessionName, setSessionName] = useState('Untitled Session');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const sessionInitialized = useRef(false);

    // Initialize user and session
    useEffect(() => {
        async function initSession() {
            if (sessionInitialized.current) return;

            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            setUserId(user.id);

            // Ensure user profile exists
            const profile = await ensureUserProfile(
                user.id,
                user.email || '',
                user.user_metadata?.full_name,
                user.user_metadata?.avatar_url
            );

            if (!profile) {
                console.error('Failed to create user profile');
                showToast('error', 'Failed to initialize user profile. Please try again.');
                setIsLoading(false);
                return;
            }

            // Check URL for existing session
            const existingSessionId = searchParams.get('session');

            if (existingSessionId) {
                // Load existing session
                setSessionId(existingSessionId);
                sessionInitialized.current = true;

                try {
                    const sessionData = await getSessionById(existingSessionId);
                    if (sessionData) {
                        setSessionName(sessionData.title);

                        // Restore state from metadata
                        if (sessionData.metadata) {
                            const meta = sessionData.metadata as unknown as SessionData;
                            if (meta.mode) setMode(meta.mode);
                            if (meta.zoom) setZoom(meta.zoom);
                            if (meta.tracks) {
                                setTracks(meta.tracks.map(t => ({
                                    ...t,
                                    file: undefined
                                } as Track)));
                            }
                        }
                    } else {
                        showToast('error', 'Session not found.');
                        router.push('/dashboard');
                    }
                } catch (e) {
                    console.error("Failed to load session:", e);
                    showToast('error', 'Failed to load session.');
                }
            } else {
                // Check if user can create a new session
                const canCreate = await canCreateSession(user.id);
                if (!canCreate.allowed) {
                    showToast('warning', canCreate.reason || 'Cannot create new session.');
                    router.push('/dashboard');
                    return;
                }

                // Clear previous session data
                localStorage.removeItem(SESSION_STORAGE_KEY);
                setTracks([]);
                clearAssets();
                setSessionName('Untitled Session');

                // Create a new session
                const newSession = await createSession(user.id, 'Untitled Session');
                if (newSession) {
                    setSessionId(newSession.id);
                    sessionInitialized.current = true;
                    window.history.replaceState(null, '', `?session=${newSession.id}`);
                } else {
                    console.error('Failed to create session in database');
                    showToast('error', 'Failed to create session. Please try again.');
                }
            }

            setIsLoading(false);
        }

        initSession();
        // Only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Save session to database
    const saveSession = useCallback(async () => {
        if (!sessionId || isSaving) return;

        setIsSaving(true);

        // Prepare metadata
        const metadata: SessionData = {
            sessionName,
            mode,
            zoom,
            tracks: tracks.map(t => ({
                ...t,
                file: undefined,
                hasFile: !!t.file
            })),
            savedAt: new Date().toISOString()
        };

        try {
            await updateSessionData(sessionId, sessionName, metadata);
            setLastSaved(new Date());
        } catch (error) {
            console.error('Error saving session:', error);
            showToast('error', 'Failed to save session.');
        } finally {
            setIsSaving(false);
        }
    }, [sessionId, sessionName, mode, zoom, tracks, isSaving, showToast]);

    // Auto-save every 30 seconds when there are changes
    useEffect(() => {
        if (!sessionId || isLoading) return;

        const intervalId = setInterval(() => {
            if (tracks.length > 0) {
                saveSession();
            }
        }, 30000);

        return () => clearInterval(intervalId);
    }, [sessionId, isLoading, tracks.length, saveSession]);

    // Save to localStorage as backup
    useEffect(() => {
        if (!sessionId || isLoading) return;

        const data: SessionData = {
            sessionName,
            mode,
            zoom,
            tracks: tracks.map(t => ({
                ...t,
                file: undefined,
                hasFile: !!t.file
            })),
            savedAt: new Date().toISOString()
        };

        try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }, [sessionId, sessionName, mode, zoom, tracks, isLoading]);

    return {
        userId,
        sessionId,
        sessionName,
        setSessionName,
        lastSaved,
        isSaving,
        isLoading,
        saveSession
    };
}
