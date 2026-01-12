'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Folder, Sliders } from 'lucide-react';
import StudioHeader from '@/components/studio/StudioHeader';
import MediaLibrary from '@/components/studio/MediaLibrary';
import AudioGenerators from '@/components/studio/AudioGenerators';

import AffirmationGenerator from '@/components/studio/AffirmationGenerator';
import VideoPreview from '@/components/studio/VideoPreview';
import Timeline from '@/components/studio/Timeline';
import PropertiesPanel from '@/components/studio/PropertiesPanel';
import UploadedAssets, { UploadedAsset } from '@/components/studio/UploadedAssets';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, INITIAL_TRACKS, formatTime, Effect, EffectType, ReverbEffect, DelayEffect, ChorusEffect, SubliminalEffect } from '@/components/studio/types';
import ExportModal from '@/components/studio/ExportModal';
import SettingsModal from '@/components/studio/SettingsModal';
import { createClient } from '@/lib/supabase/client';
import { createSession, canCreateSession, updateSessionTitle, updateSessionData, getSessionById } from '@/lib/supabase/sessions';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import KeyboardShortcutsModal, { useKeyboardShortcuts } from '@/components/studio/KeyboardShortcutsModal';
import StudioSkeleton from '@/components/studio/StudioSkeleton';

// Session storage key
const SESSION_STORAGE_KEY = 'subliminal-studio-session';

interface SessionData {
    sessionName: string;
    mode: 'audio' | 'video';
    zoom: number;
    tracks: Array<Omit<Track, 'file'> & { hasFile: boolean }>;
    savedAt: string;
}

function StudioContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();
    const { showToast } = useToast();

    const [mode, setMode] = useState<'audio' | 'video'>('audio');
    const [showAffirmations, setShowAffirmations] = useState(false);
    const [showGenerators, setShowGenerators] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
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

    // Track if session has been initialized to prevent duplicates
    const sessionInitialized = useRef(false);

    // Initialize user and create session
    useEffect(() => {
        async function initSession() {
            // Prevent double initialization
            if (sessionInitialized.current) return;

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
                showToast('error', 'Failed to initialize user profile. Please try again.');
                return;
            }

            // Check URL for existing session
            const existingSessionId = searchParams.get('session');

            if (existingSessionId) {
                // Load existing session from Database
                setSessionId(existingSessionId);
                sessionInitialized.current = true;

                try {
                    const sessionData = await getSessionById(existingSessionId);
                    if (sessionData) {
                        setSessionName(sessionData.title);

                        // Restore state from metadata if available
                        if (sessionData.metadata) {
                            const meta = sessionData.metadata as unknown as SessionData;
                            if (meta.mode) setMode(meta.mode);
                            if (meta.zoom) setZoom(meta.zoom);
                            if (meta.tracks) {
                                // Restore tracks (note: files are lost, URL/Blob refs might need regeneration or external hosting)
                                // For now we assume URLs are accessible or invalid (placeholder)
                                setTracks(meta.tracks.map(t => ({
                                    ...t,
                                    file: undefined // Files cannot be restored from JSON
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

                // Clear previous session data for a fresh start
                localStorage.removeItem(SESSION_STORAGE_KEY);
                setTracks([]);
                setUploadedAssets([]);
                setSessionName('Untitled Session');

                // Create a new session in the database
                const newSession = await createSession(user.id, 'Untitled Session');
                if (newSession) {
                    setSessionId(newSession.id);
                    sessionInitialized.current = true;
                    // Update URL without reload to persist ID
                    window.history.replaceState(null, '', `?session=${newSession.id}`);
                } else {
                    console.error('Failed to create session in database');
                    showToast('error', 'Failed to create session. Please try again.');
                }
            }
        }

        initSession();
    }, []); // Run once on mount

    // Audio Engine Handlers
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioNodesRef = useRef<Map<string, {
        source: MediaElementAudioSourceNode;
        gain: GainNode;
        panner: StereoPannerNode;
        audio: HTMLAudioElement;
        effectNodes: Map<string, AudioNode[]>; // Keep track of nodes per effect for cleanup/param updates
        chainInput: AudioNode; // The start of the chain (usually source)
        chainOutput: AudioNode; // The end of the chain (usually panner input)
    }>>(new Map());

    // Initialize Audio Context on first interaction
    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    }, []);

    // Helper: Generate Impulse Response for Reverb
    const createImpulseResponse = (ctx: AudioContext, duration: number, decay: number) => {
        const rate = ctx.sampleRate;
        const length = rate * duration;
        const impulse = ctx.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const n = i / length; // Normalized progression
            // White noise with exponential decay
            const noise = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
            left[i] = noise;
            right[i] = noise;
        }
        return impulse;
    };

    // Helper: Build DSP nodes for a single effect
    const createEffectNodes = (ctx: AudioContext, effect: Effect, input: AudioNode, output: AudioNode): AudioNode => {
        if (!effect.active) return input; // Bypass

        switch (effect.type) {
            case 'reverb': {
                const { decay = 2.0, mix = 0.5, preDelay = 0.01 } = effect.params as ReverbEffect['params'];

                const inputGain = ctx.createGain();
                const reverbGain = ctx.createGain();
                reverbGain.gain.value = mix;

                const dryGain = ctx.createGain();
                dryGain.gain.value = 1 - mix;

                const convolver = ctx.createConvolver();
                convolver.buffer = createImpulseResponse(ctx, decay, decay); // Simple decay model

                const delayNode = ctx.createDelay();
                delayNode.delayTime.value = preDelay;

                // Graph: Input -> [Dry, Delay->Convolver->Wet] -> Output
                input.connect(inputGain);
                inputGain.connect(dryGain);
                inputGain.connect(delayNode);
                delayNode.connect(convolver);
                convolver.connect(reverbGain);

                dryGain.connect(output);
                reverbGain.connect(output);

                return output; // Return destination for next node? No, this architecture is tricky. 
                // Better approach: Return the INPUT node of this effect, and connect the OUTPUT of this effect to the 'next' node passed in?
                // Or standard chain: Input -> Effect -> Output. 
                // Let's refine: We need to return the 'Node to connect TO'.
            }
            default: return input;
        }
        return input;
    };

    // Re-implemented Graph Builder
    const updateAudioGraph = (track: Track) => {
        const ctx = audioContextRef.current;
        if (!ctx) return;

        let nodes = audioNodesRef.current.get(track.id);

        // 1. Create Base Nodes if missing
        if (!nodes) {
            const audio = new Audio(track.url);
            // audio.crossOrigin = "anonymous"; // Removed to prevent CORS errors on non-configured remote assets
            const source = ctx.createMediaElementSource(audio);
            const gain = ctx.createGain();
            const panner = ctx.createStereoPanner();

            // Initial simple connection to ensure flow
            // source.connect(gain); gain.connect(panner); panner.connect(ctx.destination);

            nodes = { source, gain, panner, audio, effectNodes: new Map(), chainInput: source, chainOutput: gain };
            audioNodesRef.current.set(track.id, nodes);

            // Events
            audio.onerror = (e) => console.error(`Audio playback error for track ${track.name}:`, audio.error);
        }

        // Disconnect all existing connections from the source and any previous effect chain
        nodes.gain.disconnect();
        nodes.panner.disconnect();

        // Disconnect and clear old effect nodes
        nodes.effectNodes.forEach(nodeArray => {
            nodeArray.forEach(node => {
                if (node instanceof AudioNode) {
                    try { node.disconnect(); } catch (e) { /* already disconnected */ }
                }
                if (node instanceof OscillatorNode) {
                    try { node.stop(); } catch (e) { /* already stopped */ }
                }
            });
        });
        nodes.effectNodes.clear();

        let currentNode: AudioNode = nodes.source;

        // Process Effects
        track.effects?.forEach(effect => {
            if (!effect.active) return;

            const effectNodeList: AudioNode[] = []; // To store nodes created for this effect

            if (effect.type === 'reverb') {
                const { decay, mix, preDelay } = effect.params as ReverbEffect['params'];
                const convolver = ctx.createConvolver();
                convolver.buffer = createImpulseResponse(ctx, decay, 2);

                const wet = ctx.createGain(); wet.gain.value = mix;
                const dry = ctx.createGain(); dry.gain.value = 1 - mix;

                const delayNode = ctx.createDelay();
                delayNode.delayTime.value = preDelay;

                currentNode.connect(delayNode);
                delayNode.connect(convolver);
                convolver.connect(wet);

                currentNode.connect(dry);

                const output = ctx.createGain(); // Sum dry and wet
                wet.connect(output);
                dry.connect(output);

                currentNode = output;
                effectNodeList.push(convolver, wet, dry, delayNode, output);
            }
            else if (effect.type === 'delay') {
                const { time, feedback, mix } = effect.params as DelayEffect['params'];
                const delay = ctx.createDelay(1.0);
                delay.delayTime.value = time;

                const fbGain = ctx.createGain();
                fbGain.gain.value = feedback;

                const wet = ctx.createGain(); wet.gain.value = mix;
                const dry = ctx.createGain(); dry.gain.value = 1 - mix;

                currentNode.connect(delay);
                delay.connect(fbGain);
                fbGain.connect(delay); // Feedback loop

                delay.connect(wet);
                currentNode.connect(dry);

                const output = ctx.createGain(); // Sum dry and wet
                wet.connect(output);
                dry.connect(output);
                currentNode = output;
                effectNodeList.push(delay, fbGain, wet, dry, output);
            }
            else if (effect.type === 'chorus') {
                // Chorus: Delay modulated by LFO
                const { rate, depth, mix } = effect.params as ChorusEffect['params'];
                const delay = ctx.createDelay();
                delay.delayTime.value = 0.03; // Base delay

                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = rate;

                const lfoGain = ctx.createGain();
                lfoGain.gain.value = depth * 0.005; // Scale depth for delay time modulation

                lfo.connect(lfoGain);
                lfoGain.connect(delay.delayTime);
                lfo.start(0); // Start immediately

                const wet = ctx.createGain(); wet.gain.value = mix;
                const dry = ctx.createGain(); dry.gain.value = 1 - mix;

                currentNode.connect(delay);
                delay.connect(wet);
                currentNode.connect(dry);

                const output = ctx.createGain(); // Sum dry and wet
                wet.connect(output);
                dry.connect(output);
                currentNode = output;
                effectNodeList.push(delay, lfo, lfoGain, wet, dry, output);
            }
            else if (effect.type === 'subliminal') {
                // DSB-SC Modulation (Ring Modulation)
                const { frequency, volume } = effect.params as SubliminalEffect['params'];

                const carrier = ctx.createOscillator();
                carrier.type = 'sine';
                carrier.frequency.value = frequency;
                carrier.start(0); // Start immediately

                const ringMod = ctx.createGain();
                ringMod.gain.value = 0; // Initial value 0, modulated by audio

                currentNode.connect(ringMod.gain); // Audio signal modulates the gain of the ringMod
                carrier.connect(ringMod); // Carrier signal passes through the ringMod

                // Apply output volume
                const outGain = ctx.createGain();
                outGain.gain.value = volume;

                ringMod.connect(outGain);
                currentNode = outGain;
                effectNodeList.push(carrier, ringMod, outGain);
            }
            nodes.effectNodes.set(effect.id, effectNodeList);
        });

        // Final Chain connections
        // CurrentNode (output of last effect or source) -> Gain (Volume) -> Panner -> Destination
        currentNode.connect(nodes.gain);
        nodes.gain.connect(nodes.panner);
        nodes.panner.connect(ctx.destination);

        // Update Static Props
        nodes.gain.gain.value = track.volume / 100;
        nodes.panner.pan.value = track.pan || 0;
    };

    // Sync audio graph when tracks/effects change
    useEffect(() => {
        if (!audioContextRef.current) return;

        tracks.forEach(track => {
            if (track.type === 'audio' && track.url) {
                updateAudioGraph(track);
            }
        });

        // Cleanup removed tracks
        audioNodesRef.current.forEach((nodes, id) => {
            if (!tracks.find(t => t.id === id)) {
                nodes.audio.pause();
                nodes.audio.src = '';
                // Disconnect nodes to free graph
                nodes.source.disconnect();
                nodes.gain.disconnect();
                nodes.panner.disconnect();
                nodes.effectNodes.forEach(nodeArray => {
                    nodeArray.forEach(node => {
                        if (node instanceof AudioNode) {
                            try { node.disconnect(); } catch (e) { /* already disconnected */ }
                        }
                        if (node instanceof OscillatorNode) {
                            try { node.stop(); } catch (e) { /* already stopped */ }
                        }
                    });
                });
                audioNodesRef.current.delete(id);
            }
        });
    }, [tracks]); // Re-run when tracks array changes (including effects within tracks)

    // Ensure AudioContext is ready on any playback attempt
    useEffect(() => {
        if (isPlaying || tracks.length > 0) {
            initAudioContext();
        }
    }, [isPlaying, tracks.length, initAudioContext]);

    // Handle play/pause with Mute/Solo logic
    useEffect(() => {
        const hasSoloTrack = tracks.some(t => t.isSolo);

        // Ensure context is running
        if (isPlaying && audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume();
        }

        if (isPlaying) {
            tracks.forEach(track => {
                if (track.type === 'audio') {
                    const nodes = audioNodesRef.current.get(track.id);
                    if (nodes) {
                        const shouldPlay = hasSoloTrack ? track.isSolo : !track.isMuted;

                        if (shouldPlay) {
                            // Calculate relative time within the audio file
                            const trackStart = track.startTime || 0;
                            const trackDuration = track.outPoint ? track.outPoint - (track.inPoint || 0) : track.duration;
                            const trackEnd = trackStart + trackDuration;

                            // Check if head is within this clip's range
                            if (currentTime >= trackStart && currentTime < trackEnd) {
                                const relativeTime = currentTime - trackStart + (track.inPoint || 0);

                                if (Math.abs(nodes.audio.currentTime - relativeTime) > 0.2 || nodes.audio.paused) {
                                    nodes.audio.currentTime = relativeTime;
                                }

                                // Re-sync properties just in case
                                nodes.gain.gain.value = track.volume / 100;
                                nodes.panner.pan.value = track.pan || 0;

                                const playPromise = nodes.audio.play();
                                if (playPromise !== undefined) {
                                    playPromise.catch(error => {
                                        // Ignore abort errors from rapid pausing/seeking
                                        if (error.name !== 'AbortError') {
                                            console.warn("Audio play failed:", error);
                                        }
                                    });
                                }
                            } else {
                                // Outside of clip range
                                nodes.audio.pause();
                            }
                        } else {
                            nodes.audio.pause();
                        }
                    }
                }
            });
        } else {
            // Pause all
            audioNodesRef.current.forEach(nodes => nodes.audio.pause());
        }
    }, [isPlaying, tracks, currentTime]);

    // Update volume/pan efficiently when props change
    const syncTrackProperties = useCallback((trackId: string, updates: Partial<Track>) => {
        const nodes = audioNodesRef.current.get(trackId);
        if (nodes) {
            if (updates.volume !== undefined) {
                nodes.gain.gain.setValueAtTime(updates.volume / 100, audioContextRef.current?.currentTime || 0);
            }
            if (updates.pan !== undefined) {
                nodes.panner.pan.setValueAtTime(updates.pan, audioContextRef.current?.currentTime || 0);
            }
        }
    }, []);

    // Playback Timer
    useEffect(() => {
        let animationId: number;
        let lastTimestamp: number | null = null;

        const tick = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const delta = (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;

            const audioEntries = Array.from(audioNodesRef.current.entries());
            // Find a track that is actually playing audio to use as the master clock
            const playingEntry = audioEntries.find(([id, n]) => !n.audio.paused && !isNaN(n.audio.currentTime) && n.audio.currentTime > 0);

            if (playingEntry) {
                const [id, nodes] = playingEntry;
                const track = tracks.find(t => t.id === id);
                if (track) {
                    // Sync global time to audio time + offset
                    // Global = AudioTime - InPoint + StartTime
                    const calculatedTime = nodes.audio.currentTime - (track.inPoint || 0) + (track.startTime || 0);
                    setCurrentTime(calculatedTime);
                } else {
                    // Fallback if track not found (shouldn't happen)
                    setCurrentTime(prev => prev + delta);
                }
            } else {
                setCurrentTime(prev => prev + delta);
            }

            if (isPlaying) {
                animationId = requestAnimationFrame(tick);
            }
        };

        if (isPlaying) {
            lastTimestamp = null;
            animationId = requestAnimationFrame(tick);
        }

        return () => {
            if (animationId) cancelAnimationFrame(animationId);
        };
    }, [isPlaying, tracks]);

    // Seek handler
    const handleSeek = useCallback((time: number) => {
        setCurrentTime(time);
        audioNodesRef.current.forEach(nodes => {
            nodes.audio.currentTime = time;
        });
    }, []);

    // Stop handler
    const handleStop = useCallback(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        audioNodesRef.current.forEach(nodes => {
            nodes.audio.pause();
            nodes.audio.currentTime = 0;
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
                    showToast('warning', 'Audio files must be 5 minutes or less. Please trim your audio.');
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
            const droppedAsset = JSON.parse(assetData) as Partial<UploadedAsset>;

            // Look up the full asset from our state (includes File reference)
            const fullAsset = uploadedAssets.find(a => a.id === droppedAsset.id);

            if (fullAsset) {
                // Use the full asset with File reference
                handleAddAssetToTimeline(fullAsset);
            } else if (droppedAsset.url) {
                // Fallback: use the serialized data (won't have File, but has URL)
                handleAddAssetToTimeline(droppedAsset as UploadedAsset);
            } else {
                console.error('Dropped asset not found in library:', droppedAsset.id);
            }
        } catch (e) {
            console.error('Failed to parse dropped asset:', e);
        }
    };

    const handleUpdateTrack = (id: string, updates: Partial<Track>) => {
        setTracks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
        // Sync properties efficiently
        syncTrackProperties(id, updates);
    };

    const handleDeleteTrack = (id: string) => {
        setTracks(prev => prev.filter(t => t.id !== id));
        if (selectedTrackId === id) setSelectedTrackId(null);
        // Audio cleanup is handled by the useEffect hook watching 'tracks'
    };

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

            // Export shortcut: Ctrl+E
            if ((e.ctrlKey || e.metaKey) && e.code === 'KeyE') {
                e.preventDefault();
                setShowExportModal(true);
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
                    setShowKeyboardShortcuts(false);
                    break;
            }

            // ? key to show keyboard shortcuts
            if (e.key === '?') {
                setShowKeyboardShortcuts(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedTrackId, handleUndo, handleRedo, handleDeleteTrack]);

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
        saveTimeoutRef.current = setTimeout(async () => {
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

                // Sync full session state to database
                if (sessionId) {
                    await updateSessionData(sessionId, sessionName, sessionData);
                }

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
    }, [sessionName, mode, zoom, tracks, sessionId]);

    // Global Drop Handler for file imports
    const handleGlobalDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleGlobalDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();

        // Handle file drops (External)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            Array.from(e.dataTransfer.files).forEach(file => {
                handleAddTrack(file);
            });
            return;
        }
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-screen w-full bg-[#050505] text-white overflow-hidden flex flex-col font-sans"
            onDragOver={handleGlobalDragOver}
            onDrop={handleGlobalDrop}
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
                        onOpenGenerators={() => setShowGenerators(true)}
                        onAddTrack={handleAddTrack}
                        onAddSampleToTimeline={(sample) => {
                            // Create a placeholder track for stock samples
                            // Parse duration from MM:SS format
                            let durationSeconds = 60;
                            if (sample.duration) {
                                const parts = sample.duration.split(':');
                                if (parts.length === 2) {
                                    durationSeconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
                                }
                            }

                            const newTrack = {
                                id: Date.now().toString(),
                                name: sample.name,
                                type: sample.type,
                                duration: durationSeconds,
                                volume: 75,
                                isMuted: false,
                                isSolo: false,
                                color: sample.type === 'audio'
                                    ? 'bg-blue-500'
                                    : sample.type === 'video'
                                        ? 'bg-indigo-500'
                                        : 'bg-purple-500',
                                // Note: Stock samples are placeholders, no actual file
                                url: undefined,
                                file: undefined
                            };
                            setTracks(prev => [...prev, newTrack as any]);
                            setSelectedTrackId(newTrack.id);
                            setRightPanelTab('properties');
                            showToast('success', `Added "${sample.name}" to timeline`);
                        }}
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

            {showGenerators && (
                <AudioGenerators
                    onClose={() => setShowGenerators(false)}
                    onAddTrack={handleAddTrack}
                />
            )}

            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                tracks={tracks}
                sessionId={sessionId || undefined}
                userId={userId || undefined}
                sessionName={sessionName}
            />

            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
            />

            <KeyboardShortcutsModal
                isOpen={showKeyboardShortcuts}
                onClose={() => setShowKeyboardShortcuts(false)}
            />
        </motion.div>
    );
}

export default function StudioPage() {
    return (
        <Suspense fallback={<StudioSkeleton />}>
            <StudioContent />
        </Suspense>
    );
}
