/**
 * usePlayback - Custom hook for audio/video playback control
 * 
 * Handles:
 * - Play/pause state
 * - Current time tracking
 * - Seeking
 * - Playback timer with animation frame
 * - Mute/Solo logic
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Track } from '@/components/studio/types';
import type { AudioNodes } from './useAudioEngine';

interface UsePlaybackOptions {
    tracks: Track[];
    audioContextRef: React.MutableRefObject<AudioContext | null>;
    audioNodesRef: React.MutableRefObject<Map<string, AudioNodes>>;
    initAudioContext: () => void;
}

interface UsePlaybackReturn {
    isPlaying: boolean;
    currentTime: number;
    setCurrentTime: (time: number) => void;
    play: () => void;
    pause: () => void;
    togglePlayPause: () => void;
    stop: () => void;
    seek: (time: number) => void;
}

export function usePlayback(options: UsePlaybackOptions): UsePlaybackReturn {
    const { tracks, audioContextRef, audioNodesRef, initAudioContext } = options;

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const animationRef = useRef<number | null>(null);

    // Play handler
    const play = useCallback(() => {
        initAudioContext();
        setIsPlaying(true);
    }, [initAudioContext]);

    // Pause handler
    const pause = useCallback(() => {
        setIsPlaying(false);
        audioNodesRef.current.forEach(nodes => nodes.audio.pause());
    }, [audioNodesRef]);

    // Toggle play/pause
    const togglePlayPause = useCallback(() => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    }, [isPlaying, play, pause]);

    // Stop handler (pause and reset to beginning)
    const stop = useCallback(() => {
        setIsPlaying(false);
        setCurrentTime(0);
        audioNodesRef.current.forEach(nodes => {
            nodes.audio.pause();
            nodes.audio.currentTime = 0;
        });
    }, [audioNodesRef]);

    // Seek to specific time
    const seek = useCallback((time: number) => {
        setCurrentTime(time);
        audioNodesRef.current.forEach(nodes => {
            const trackId = Array.from(audioNodesRef.current.entries())
                .find(([_, n]) => n === nodes)?.[0];

            if (trackId) {
                const track = tracks.find(t => t.id === trackId);
                if (track) {
                    const trackStart = track.startTime || 0;
                    const trackEnd = trackStart + (track.outPoint ? track.outPoint - (track.inPoint || 0) : track.duration);

                    if (time >= trackStart && time < trackEnd) {
                        const relativeTime = time - trackStart + (track.inPoint || 0);
                        nodes.audio.currentTime = relativeTime;
                    }
                }
            }
        });
    }, [audioNodesRef, tracks]);

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
                            const trackStart = track.startTime || 0;
                            const trackDuration = track.outPoint
                                ? track.outPoint - (track.inPoint || 0)
                                : track.duration;
                            const trackEnd = trackStart + trackDuration;

                            // Check if playhead is within this clip's range
                            if (currentTime >= trackStart && currentTime < trackEnd) {
                                const relativeTime = currentTime - trackStart + (track.inPoint || 0);

                                if (Math.abs(nodes.audio.currentTime - relativeTime) > 0.2 || nodes.audio.paused) {
                                    nodes.audio.currentTime = relativeTime;
                                }

                                // Sync volume and pan
                                nodes.gain.gain.value = track.volume / 100;
                                nodes.panner.pan.value = track.pan || 0;

                                const playPromise = nodes.audio.play();
                                if (playPromise !== undefined) {
                                    playPromise.catch(error => {
                                        if (error.name !== 'AbortError') {
                                            console.warn("Audio play failed:", error);
                                        }
                                    });
                                }
                            } else {
                                nodes.audio.pause();
                            }
                        } else {
                            nodes.audio.pause();
                        }
                    }
                }
            });
        } else {
            audioNodesRef.current.forEach(nodes => nodes.audio.pause());
        }
    }, [isPlaying, tracks, currentTime, audioContextRef, audioNodesRef]);

    // Playback Timer using animation frames
    useEffect(() => {
        let lastTimestamp: number | null = null;

        const tick = (timestamp: number) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const delta = (timestamp - lastTimestamp) / 1000;
            lastTimestamp = timestamp;

            const audioEntries = Array.from(audioNodesRef.current.entries());
            const playingEntry = audioEntries.find(([_, n]) =>
                !n.audio.paused && !isNaN(n.audio.currentTime) && n.audio.currentTime > 0
            );

            if (playingEntry) {
                const [id, nodes] = playingEntry;
                const track = tracks.find(t => t.id === id);
                if (track) {
                    const calculatedTime = nodes.audio.currentTime - (track.inPoint || 0) + (track.startTime || 0);
                    setCurrentTime(calculatedTime);
                } else {
                    setCurrentTime(prev => prev + delta);
                }
            } else {
                setCurrentTime(prev => prev + delta);
            }

            if (isPlaying) {
                animationRef.current = requestAnimationFrame(tick);
            }
        };

        if (isPlaying) {
            lastTimestamp = null;
            animationRef.current = requestAnimationFrame(tick);
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isPlaying, tracks, audioNodesRef]);

    return {
        isPlaying,
        currentTime,
        setCurrentTime,
        play,
        pause,
        togglePlayPause,
        stop,
        seek
    };
}
