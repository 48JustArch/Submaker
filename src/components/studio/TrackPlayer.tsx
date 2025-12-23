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
    onReady,
    onProgress
}: TrackPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isReady, setIsReady] = useState(false);
    const isMountedRef = useRef(true);

    // Initialize WaveSurfer
    useEffect(() => {
        isMountedRef.current = true;
        let activeWs: WaveSurfer | null = null;

        if (!containerRef.current) return;

        const baseColor = color.includes('blue') ? 'rgba(59, 130, 246, 0.6)' :
            color.includes('purple') ? 'rgba(168, 85, 247, 0.6)' :
                'rgba(6, 182, 212, 0.6)';

        try {
            activeWs = WaveSurfer.create({
                container: containerRef.current,
                waveColor: baseColor,
                progressColor: 'transparent',
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
                if (!isMountedRef.current || !activeWs) return;
                setIsReady(true);
                try {
                    const duration = activeWs.getDuration();
                    if (onReady) onReady(duration);
                } catch (e) {
                    // Ignore duration errors
                }
            });

            activeWs.on('audioprocess', (currentTime) => {
                if (!isMountedRef.current || !activeWs) return;
                if (onProgress) onProgress(currentTime);
            });

            activeWs.on('error', (err) => {
                if (!isMountedRef.current) return;
                console.warn('WaveSurfer warn:', err);
                // Recover from error state
                setIsReady(true);
            });

            // Load audio
            activeWs.load(url);

        } catch (e) {
            console.error("Failed to init WaveSurfer", e);
        }

        return () => {
            isMountedRef.current = false;

            if (activeWs) {
                try {
                    activeWs.unAll();
                    activeWs.destroy();
                } catch (e) {
                    console.debug("Cleanup ignore", e);
                }
                activeWs = null;
                wavesurferRef.current = null;
            }
        };
    }, [url, color]);

    // Handle Play/Pause
    useEffect(() => {
        if (!wavesurferRef.current || !isReady) return;

        if (isPlaying) {
            wavesurferRef.current.play();
        } else {
            wavesurferRef.current.pause();
        }
    }, [isPlaying, isReady]);

    // Handle Volume & Mute
    useEffect(() => {
        if (!wavesurferRef.current || !isReady) return;
        wavesurferRef.current.setVolume(muted ? 0 : volume);
    }, [volume, muted, isReady]);

    // Handle Speed
    useEffect(() => {
        if (!wavesurferRef.current || !isReady) return;
        wavesurferRef.current.setPlaybackRate(speed);
    }, [speed, isReady]);

    return (
        <div className="h-full flex flex-col justify-center relative bg-black/20" style={{ width: `${widthPercent}%` }}>
            <div ref={containerRef} className="w-full" />
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 bg-black/50 backdrop-blur-sm z-10">
                    <div className="animate-pulse">Loading...</div>
                </div>
            )}
        </div>
    );
}
