'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Folder, Sliders } from 'lucide-react';
import StudioHeader from '@/components/studio/StudioHeader';
import MediaLibrary from '@/components/studio/MediaLibrary';
import AffirmationGenerator from '@/components/studio/AffirmationGenerator';
import VideoPreview from '@/components/studio/VideoPreview';
import Timeline from '@/components/studio/Timeline';
import PropertiesPanel from '@/components/studio/PropertiesPanel';
import UploadedAssets, { UploadedAsset } from '@/components/studio/UploadedAssets';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, INITIAL_TRACKS, formatTime } from '@/components/studio/types';
import ExportModal from '@/components/studio/ExportModal';
import SettingsModal from '@/components/studio/SettingsModal';
import { createClient } from '@/lib/supabase/client';
import { createSession, canCreateSession } from '@/lib/supabase/sessions';
import { useRouter, useSearchParams } from 'next/navigation';

// Session storage key
const SESSION_STORAGE_KEY = 'subliminal-studio-session';

interface SessionData {
    sessionName: string;
    mode: 'audio' | 'video';
    zoom: number;
    tracks: Array<Omit<Track, 'file'> & { hasFile: boolean }>;
    savedAt: string;
}

export default function StudioPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [mode, setMode] = useState<'audio' | 'video'>('audio');
    const [showAffirmations, setShowAffirmations] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [rightPanelTab, setRightPanelTab] = useState<'uploads' | 'properties'>('uploads');

    // User and Session State
    const [userId, setUserId] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null);

    // Session State
    const [sessionName, setSessionName] = useState('Untitled Session');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Studio State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [tracks, setTracks] = useState<Track[]>(INITIAL_TRACKS);
    const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
    const [zoom, setZoom] = useState(5); // pixels per second (5 = ~60s visible at once)

    // Undo/Redo History
    const [tracksHistory, setTracksHistory] = useState<Track[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const MAX_HISTORY = 50;

    // Helper to save state to history
    const saveToHistory = useCallback((newTracks: Track[]) => {
        setTracksHistory(prev => {
            // Remove any future states if we're not at the end
            const trimmed = prev.slice(0, historyIndex + 1);
            // Add current state
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
    const handleUndo = useCallback(() => {
        if (historyIndex >= 0 && tracksHistory.length > 0) {
            const previousState = tracksHistory[historyIndex];
            setHistoryIndex(prev => prev - 1);
            setTracks(previousState);
        }
    }, [historyIndex, tracksHistory]);

    // Redo handler  
    const handleRedo = useCallback(() => {
        if (historyIndex < tracksHistory.length - 1) {
            const nextState = tracksHistory[historyIndex + 1];
            setHistoryIndex(prev => prev + 1);
            setTracks(nextState);
        }
    }, [historyIndex, tracksHistory]);

    const canUndo = historyIndex >= 0;
    const canRedo = historyIndex < tracksHistory.length - 1;

    // Uploaded Assets State
    const [uploadedAssets, setUploadedAssets] = useState<UploadedAsset[]>([]);

    // Initialize user and create session
    useEffect(() => {
        async function initSession() {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            setUserId(user.id);

            // IMPORTANT: Ensure user profile exists in database first
            // (audio_generations has a foreign key to users)
            const { ensureUserProfile } = await import('@/lib/supabase/sessions');
            const profile = await ensureUserProfile(
                user.id,
                user.email || '',
                user.user_metadata?.full_name,
                user.user_metadata?.avatar_url
            );

            if (!profile) {
                console.error('Failed to create user profile');
                alert('Failed to initialize user profile. Please try again.');
                return;
            }

            // Check URL for existing session
            const existingSessionId = searchParams.get('session');

            if (existingSessionId) {
                // Load existing session logic would go here
                setSessionId(existingSessionId);
                console.log("Loading existing session:", existingSessionId);
                // For now, we reuse local storage or DB loading logic if implemented
            } else {
                // Check if user can create a new session
                const canCreate = await canCreateSession(user.id);
                if (!canCreate) {
                    alert('You have reached your draft limit (3 active drafts). Please finish or delete an existing draft.');
                    router.push('/dashboard');
                    return;
                }

                // Clear previous session data for a fresh start
                localStorage.removeItem(SESSION_STORAGE_KEY);
                setTracks([]);
                setUploadedAssets([]);
                setSessionName('Untitled Session');

                // Create a new session in the database
                const newSession = await createSession(user.id, 'Untitled Session');
                if (newSession) {
                    setSessionId(newSession.id);
                    // Update URL without reload to persist ID
                    window.history.replaceState(null, '', `?session=${newSession.id}`);
                } else {
                    console.error('Failed to create session in database');
                }
            }
        }

        initSession();
    }, []); // Run once on mount

    // Audio playback refs - stores Audio elements for each track
    const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());

    // Sync audio elements when tracks change
    useEffect(() => {
        tracks.forEach(track => {
            if (track.type === 'audio' && track.url && !audioRefs.current.has(track.id)) {
                const audio = new Audio(track.url);
                audio.volume = track.volume / 100;
                audioRefs.current.set(track.id, audio);
            }
        });

        // Clean up removed tracks
        audioRefs.current.forEach((audio, id) => {
            if (!tracks.find(t => t.id === id)) {
                audio.pause();
                audio.src = '';
                audioRefs.current.delete(id);
            }
        });
    }, [tracks]);

    // Handle play/pause with Mute/Solo logic
    useEffect(() => {
        // Check if any track is in Solo mode
        const hasSoloTrack = tracks.some(t => t.isSolo);

        if (isPlaying) {
            // Start audio tracks from current position
            tracks.forEach(track => {
                if (track.type === 'audio') {
                    const audio = audioRefs.current.get(track.id);
                    if (audio) {
                        // Determine if this track should play:
                        // - If any track is solo'd, only play solo'd tracks
                        // - Otherwise, play all non-muted tracks
                        const shouldPlay = hasSoloTrack ? track.isSolo : !track.isMuted;

                        if (shouldPlay) {
                            audio.currentTime = currentTime;
                            audio.volume = track.volume / 100;
                            audio.play().catch(() => { }); // Ignore autoplay errors
                        } else {
                            audio.pause();
                        }
                    }
                }
            });
        } else {
            // Pause all audio
            audioRefs.current.forEach(audio => audio.pause());
        }
    }, [isPlaying, tracks]);

    // Update volume when track volume changes
    const syncTrackVolume = useCallback((trackId: string, volume: number) => {
        const audio = audioRefs.current.get(trackId);
        if (audio) {
            audio.volume = volume / 100;
        }
    }, []);

    // Playback Timer - driven by first audio track or interval
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying) {
            interval = setInterval(() => {
                // Try to sync with first playing audio
                const firstAudio = Array.from(audioRefs.current.values())[0];
                if (firstAudio && !firstAudio.paused) {
                    setCurrentTime(firstAudio.currentTime);
                } else {
                    setCurrentTime(prev => prev + 0.1);
                }
            }, 100);
        }
        return () => clearInterval(interval);
    }, [isPlaying]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in input fields
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return;
            }

            // Undo/Redo shortcuts
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
                e.preventDefault();
                if (e.shiftKey) {
                    // Redo: Ctrl+Shift+Z
                    handleRedo();
                } else {
                    // Undo: Ctrl+Z
                    handleUndo();
                }
                return;
            }

            switch (e.code) {
                case 'Space':
                    e.preventDefault();
                    setIsPlaying(prev => !prev);
                    break;
                case 'Delete':
                case 'Backspace':
                    if (selectedTrackId) {
                        e.preventDefault();
                        handleDeleteTrack(selectedTrackId);
                    }
                    break;
                case 'Escape':
                    setSelectedTrackId(null);
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedTrackId]);

    // Seek handler
    const handleSeek = useCallback((time: number) => {
        setCurrentTime(time);
        audioRefs.current.forEach(audio => {
            audio.currentTime = time;
        });
    }, []);

    // Stop handler
    const handleStop = useCallback(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        audioRefs.current.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
    }, []);



    // Helper to format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // Handle file upload - adds to uploaded assets library
    const handleAddTrack = async (file: File) => {
        // Create object URL for the file
        const url = URL.createObjectURL(file);

        // Determine file type
        const fileType = file.type.startsWith('video/') ? 'video'
            : file.type.startsWith('image/') ? 'image'
                : 'audio';

        // Get duration for audio/video files
        let duration = 60; // Default 1 minute for images
        let thumbnail: string | undefined;

        if (fileType === 'audio' || fileType === 'video') {
            try {
                const media = fileType === 'audio' ? new Audio(url) : document.createElement('video');
                if (fileType === 'video') (media as HTMLVideoElement).src = url;

                await new Promise<void>((resolve) => {
                    media.onloadedmetadata = () => resolve();
                    media.onerror = () => resolve();
                    setTimeout(resolve, 3000); // Timeout fallback
                });

                duration = media.duration && isFinite(media.duration) ? media.duration : 60;

                // Check 5-minute limit for audio files
                if (fileType === 'audio' && duration > 300) {
                    alert('Audio files must be 5 minutes or less. Please trim your audio and try again.');
                    URL.revokeObjectURL(url);
                    return;
                }

                // Generate thumbnail for video
                if (fileType === 'video') {
                    const videoEl = media as HTMLVideoElement;
                    try {
                        await new Promise<void>((resolve) => {
                            videoEl.currentTime = 1;
                            videoEl.onseeked = () => resolve();
                            setTimeout(resolve, 1000);
                        });
                        const canvas = document.createElement('canvas');
                        canvas.width = 160;
                        canvas.height = 90;
                        const ctx = canvas.getContext('2d');
                        if (ctx) {
                            ctx.drawImage(videoEl, 0, 0, 160, 90);
                            thumbnail = canvas.toDataURL('image/jpeg', 0.7);
                        }
                    } catch { }
                }
            } catch {
                duration = 60;
            }
        }

        // Generate thumbnail for images
        if (fileType === 'image') {
            thumbnail = url;
        }

        // Create uploaded asset
        const newAsset: UploadedAsset = {
            id: Date.now().toString(),
            name: file.name.replace(/\.[^/.]+$/, "") || "New Asset",
            type: fileType,
            file: file,
            url: url,
            duration: fileType !== 'image' ? duration : undefined,
            size: formatFileSize(file.size),
            uploadedAt: new Date(),
            thumbnail: thumbnail
        };

        // Add to uploaded assets
        setUploadedAssets(prev => [...prev, newAsset]);

        // Auto-switch to uploads tab to show the new asset
        setRightPanelTab('uploads');
    };

    // Add asset from library to timeline
    const handleAddAssetToTimeline = async (asset: UploadedAsset) => {
        const newTrack: Track = {
            id: Date.now().toString(),
            name: (asset.name && !asset.name.includes('-')) ? asset.name : (asset.type === 'audio' ? 'Audio Track' : 'Visual Track'),
            type: asset.type,
            duration: asset.duration || 60,
            volume: 75,
            isMuted: false,
            isSolo: false,
            color: ['bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500'][Math.floor(Math.random() * 4)],
            url: asset.url,
            file: asset.file
        };
        setTracks(prev => [...prev, newTrack]);
        setSelectedTrackId(newTrack.id);
        setRightPanelTab('properties');
    };

    // Delete asset from library
    const handleDeleteAsset = (id: string) => {
        setUploadedAssets(prev => prev.filter(a => a.id !== id));
    };

    // Handle drop on timeline - parses JSON asset data and adds to timeline
    const handleDropAsset = (assetData: string) => {
        try {
            const asset = JSON.parse(assetData) as UploadedAsset;
            handleAddAssetToTimeline(asset);
        } catch (e) {
            console.error('Failed to parse dropped asset:', e);
        }
    };

    const handleUpdateTrack = (id: string, updates: Partial<Track>) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        // Sync volume if it changed
        if (updates.volume !== undefined) {
            syncTrackVolume(id, updates.volume);
        }
    };

    const handleDeleteTrack = (id: string) => {
        // Clean up audio element
        const audio = audioRefs.current.get(id);
        if (audio) {
            audio.pause();
            audio.src = '';
            audioRefs.current.delete(id);
        }
        setTracks(prev => prev.filter(t => t.id !== id));
        if (selectedTrackId === id) setSelectedTrackId(null);
    };

    const selectedTrack = tracks.find(t => t.id === selectedTrackId);

    // Find active visual track for preview (first video/image track with a URL)
    const previewTrack = tracks.find(t => (t.type === 'video' || t.type === 'image') && t.url);

    // --- Session Persistence ---
    // Note: Sessions now always start fresh. localStorage is only used for auto-save during the session.
    // It gets cleared when opening a new session from the dashboard.

    // Auto-save session with debounce
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        // Clear previous timeout
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        // Debounce save by 1 second
        saveTimeoutRef.current = setTimeout(() => {
            setIsSaving(true);
            try {
                const sessionData: SessionData = {
                    sessionName,
                    mode,
                    zoom,
                    tracks: tracks.map(t => ({
                        ...t,
                        file: undefined, // Can't serialize File objects
                        hasFile: !!t.file || !!t.url
                    })),
                    savedAt: new Date().toISOString()
                };
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
                setLastSaved(new Date());
            } catch (e) {
                console.error('Failed to save session:', e);
            } finally {
                setIsSaving(false);
            }
        }, 1000);

        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [sessionName, mode, zoom, tracks]);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-screen w-full bg-[#050505] text-white overflow-hidden flex flex-col font-sans"
        >
            <StudioHeader
                mode={mode}
                setMode={setMode}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                currentTime={formatTime(currentTime)}
                onStop={handleStop}
                onExport={() => setShowExportModal(true)}
                onSettings={() => setShowSettingsModal(true)}
                sessionName={sessionName}
                onSessionNameChange={setSessionName}
                lastSaved={lastSaved}
                isSaving={isSaving}
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
            />

            <main className="flex-1 flex overflow-hidden">
                {/* Left Panel */}
                <aside className="w-[260px] bg-[var(--bg-panel)] border-r border-[var(--border-subtle)] flex flex-col flex-shrink-0 z-20 transition-all">
                    <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-500 tracking-widest uppercase">ASSETS LIBRARY</span>
                    </div>
                    <MediaLibrary
                        onOpenAffirmations={() => setShowAffirmations(true)}
                        onAddTrack={handleAddTrack}
                    />
                </aside>

                {/* Center Workspace */}
                <section className="flex-1 flex flex-col relative bg-[var(--bg-dark)] min-w-0">
                    {/* Top Workspace (Preview - Video Mode Only) */}
                    {/* Top Workspace (Preview - Video Mode Only) */}
                    {mode === 'video' && (
                        <div className="flex-1 flex items-center justify-center relative group overflow-hidden bg-[#0a0a0a]">
                            <VideoPreview
                                timestamp={formatTime(currentTime)}
                                track={previewTrack}
                                onUpdate={handleUpdateTrack}
                                isPlaying={isPlaying}
                                currentTime={currentTime}
                            />
                        </div>
                    )}

                    {/* Bottom Workspace (Timeline) */}
                    <div className="h-[340px] bg-[var(--bg-elevated)] border-t border-[var(--border-subtle)] relative flex flex-col z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.3)]">
                        <Timeline
                            tracks={tracks}
                            currentTime={currentTime}
                            selectedTrackId={selectedTrackId}
                            onSelectTrack={setSelectedTrackId}
                            onUpdateTrack={handleUpdateTrack}
                            zoom={zoom}
                            setZoom={setZoom}
                            onDropAsset={handleDropAsset}
                            onSeek={handleSeek}
                        />
                    </div>
                </section>

                {/* Right Panel - Tabbed: Uploads / Properties */}
                <aside className="w-[280px] bg-[var(--bg-panel)] border-l border-[var(--border-subtle)] flex flex-col flex-shrink-0 z-20">

                    {/* Tab Header */}
                    <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-dark)]">
                        <button
                            onClick={() => setRightPanelTab('uploads')}
                            className={`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest relative transition-all group ${rightPanelTab === 'uploads'
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <span className={`p-0.5 rounded ${rightPanelTab === 'uploads' ? 'text-[var(--accent-primary)]' : 'group-hover:text-white'}`}>
                                    <Folder className="w-3.5 h-3.5 fill-current" />
                                </span>
                                Uploads
                                {uploadedAssets.length > 0 && (
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${rightPanelTab === 'uploads'
                                        ? 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)]'
                                        : 'bg-white/10'
                                        }`}>
                                        {uploadedAssets.length}
                                    </span>
                                )}
                            </span>
                            {rightPanelTab === 'uploads' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-primary)] shadow-[0_-2px_8px_rgba(10,132,255,0.5)]" />
                            )}
                        </button>
                        <button
                            onClick={() => setRightPanelTab('properties')}
                            className={`flex-1 py-3.5 text-[11px] font-bold uppercase tracking-widest relative transition-all group ${rightPanelTab === 'properties'
                                ? 'text-white'
                                : 'text-gray-500 hover:text-gray-300'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <span className={`p-0.5 rounded ${rightPanelTab === 'properties' ? 'text-[var(--accent-secondary)]' : 'group-hover:text-white'}`}>
                                    <Sliders className="w-3.5 h-3.5" />
                                </span>
                                Properties
                                {selectedTrack && (
                                    <span className="w-2 h-2 rounded-full bg-[var(--accent-secondary)] animate-pulse" />
                                )}
                            </span>
                            {rightPanelTab === 'properties' && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-secondary)] shadow-[0_-2px_8px_rgba(191,90,242,0.5)]" />
                            )}
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            {rightPanelTab === 'uploads' ? (
                                <motion.div
                                    key="uploads"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="absolute inset-0"
                                >
                                    <UploadedAssets
                                        assets={uploadedAssets}
                                        onDragStart={() => { }}
                                        onDelete={handleDeleteAsset}
                                        onAddToTimeline={handleAddAssetToTimeline}
                                    />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="properties"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="absolute inset-0"
                                >
                                    <PropertiesPanel
                                        selectedTrack={selectedTrack}
                                        onUpdateTrack={handleUpdateTrack}
                                        onDeleteTrack={handleDeleteTrack}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </aside>
            </main>

            {/* Modals */}
            {showAffirmations && (
                <AffirmationGenerator
                    onClose={() => setShowAffirmations(false)}
                    onAddTrack={handleAddTrack}
                />
            )}

            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                tracks={tracks}
                sessionId={sessionId || undefined}
                userId={userId || undefined}
            />

            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />
        </motion.div>
    );
}
