'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface TrackPlayerProps {
    id: string;
    url: string;
    name: string;
    color: string;
    volume: number;
    speed: number;
    muted: boolean;
    solo: boolean;
    isPlaying: boolean;
    widthPercent?: number;
    isMaster?: boolean;
    seekState?: { time: number; timestamp: number } | null;
    onReady?: (duration: number) => void;
    onProgress?: (time: number) => void;
}

export default function TrackPlayer({
    id,
    url,
    name,
    color,
    volume,
    speed,
    muted,
    isPlaying,
    widthPercent = 100,
    isMaster = false,
    seekState,
    onReady,
    onProgress
}: TrackPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);

    // Handle Seek
    useEffect(() => {
        if (!seekState || !audioRef.current) return;
        // Avoid redundant seeks if multiple updates fire or if close enough
        const diff = Math.abs(audioRef.current.currentTime - seekState.time);
        if (diff > 0.05) {
            audioRef.current.currentTime = seekState.time;
        }
    }, [seekState]);

    // Initialize WaveSurfer
    useEffect(() => {
        isMountedRef.current = true;
        setIsReady(false);
        setError(null);

        if (!containerRef.current || !audioRef.current) return;

        const baseColor = color.includes('blue') ? 'rgba(59, 130, 246, 0.6)' :
            color.includes('purple') ? 'rgba(168, 85, 247, 0.6)' :
                'rgba(6, 182, 212, 0.6)';

        let activeWs: WaveSurfer | null = null;

        try {
            activeWs = WaveSurfer.create({
                container: containerRef.current,
                media: audioRef.current, // Use HTML5 Audio element
                waveColor: baseColor,
                progressColor: 'rgba(255, 255, 255, 0.1)', // Subtle progress
                cursorColor: 'transparent',
                barWidth: 2,
                barGap: 2,
                barRadius: 2,
                height: 80,
                normalize: true,
                interact: false,
            });

            wavesurferRef.current = activeWs;

            // Event listeners
            activeWs.on('ready', () => {
                if (!isMountedRef.current) return;
                setIsReady(true);
                try {
                    const duration = activeWs?.getDuration() || 0;
                    if (onReady) onReady(duration);
                } catch (e) { }
            });

            activeWs.on('audioprocess', (currentTime) => {
                if (!isMountedRef.current || !activeWs) return;
                // Only report progress if this is the master track
                if (isMaster && onProgress) onProgress(currentTime);
            });

            activeWs.on('error', (err: unknown) => {
                if (!isMountedRef.current) return;
                console.warn('WaveSurfer warn:', err);

                const errorMessage = typeof err === 'string' ? err :
                    err instanceof Error ? err.message :
                        'Unknown error';

                // Ignore abort errors which happen frequently during hot reloads or fast switching
                if (errorMessage.toLowerCase().includes('aborted') ||
                    (err instanceof Error && err.name === 'AbortError')) return;

                // Ignore fetch errors for large files (waveform might not load but audio will play)
                if (errorMessage.toLowerCase().includes('fetch') || errorMessage.toLowerCase().includes('network')) {
                    console.warn('Waveform fetch failed (likely large file), falling back to audio-only');
                    setIsReady(true);
                    return;
                }

                setError(errorMessage);
                setIsReady(true); // Stop spinner
            });

            // Note: When using 'media' element, we don't strictly need to call .load(url)
            // if the audio element already has src. However, to re-trigger waveform gen
            // on url change, the useEffect dependency on 'url' handles the destroy/create cycle.

        } catch (e) {
            console.error("Failed to init WaveSurfer", e);
            setError("Initialization Failed");
            setIsReady(true);
        }

        return () => {
            isMountedRef.current = false;
            if (activeWs) {
                try {
                    activeWs.unAll();
                    activeWs.destroy();
                } catch (e) { }
                activeWs = null;
                wavesurferRef.current = null;
            }
        };
    }, [url, color, isMaster]);

    // Handle Play/Pause
    useEffect(() => {
        if (!wavesurferRef.current || !isReady) return;
        try {
            if (isPlaying) {
                wavesurferRef.current.play();
            } else {
                wavesurferRef.current.pause();
            }
        } catch (e) { console.warn("Play/Pause error", e); }
    }, [isPlaying, isReady]);

    // Handle Volume & Mute
    useEffect(() => {
        if (!wavesurferRef.current || !isReady) return;
        try {
            wavesurferRef.current.setVolume(muted ? 0 : volume);
        } catch (e) { }
    }, [volume, muted, isReady]);

    // Handle Speed
    useEffect(() => {
        if (!wavesurferRef.current || !isReady) return;
        try {
            wavesurferRef.current.setPlaybackRate(speed);
        } catch (e) { }
    }, [speed, isReady]);

    return (
        <div className="h-full flex flex-col justify-center relative bg-black/20" style={{ width: `${widthPercent}%` }}>
            <div ref={containerRef} className="w-full" />

            {/* Hidden Audio Element used by WaveSurfer */}
            <audio
                ref={audioRef}
                src={url}
                preload="auto"
                onLoadedMetadata={(e) => {
                    if (onReady) onReady(e.currentTarget.duration);
                    // Also ensure we set isReady to true if it was stuck
                    setIsReady(true);
                }}
                onError={(e) => {
                    console.error("Audio element error", e);
                    setError("Failed to load audio source");
                    setIsReady(true);
                }}
            />

            {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-10 px-4 rounded-xl">
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <span className="text-xs text-red-400 font-medium text-center truncate max-w-[200px]">
                            {error}
                        </span>
                    </div>
                </div>
            )}

            {!isReady && !error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/80 backdrop-blur-md z-10 transition-all duration-300">
                    <div className="relative w-8 h-8 mb-2">
                        <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-2 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-blue-400/80 font-medium">Processing</span>
                </div>
            )}
        </div>
    );
}
