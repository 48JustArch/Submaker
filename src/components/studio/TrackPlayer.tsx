'use client';

import { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface TrackPlayerProps {
    id: string;
    url: string;
    name: string;
    color: string;
    volume: number; // 0-1
    speed: number; // 0.5-2
    muted: boolean;
    solo: boolean;
    isPlaying: boolean;
    widthPercent?: number; // 0-100, for relative sizing
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

    // Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current) return;

        // Create instance
        // Get waveform color based on track color
        const baseColor = color.includes('blue') ? 'rgba(59, 130, 246, 0.6)' :
            color.includes('purple') ? 'rgba(168, 85, 247, 0.6)' :
                'rgba(6, 182, 212, 0.6)';

        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: baseColor,
            progressColor: 'transparent', // Hide progress to avoid blue line - we use global playhead
            cursorColor: 'transparent',
            barWidth: 2,
            barGap: 2,
            barRadius: 2,
            height: 80,
            normalize: true,
            url: url,
            interact: false,
            // Performance optimizations
            backend: 'MediaElement', // Much faster loading than WebAudio
            mediaControls: false,
            minPxPerSec: 1, // Lower resolution for faster rendering
        });

        // Event listeners
        ws.on('ready', () => {
            setIsReady(true);
            const duration = ws.getDuration();
            if (onReady) onReady(duration);
        });

        ws.on('audioprocess', (currentTime) => {
            if (onProgress) onProgress(currentTime);
        });

        ws.on('finish', () => {
            // Optional: Handle finish
        });

        wavesurferRef.current = ws;

        return () => {
            ws.destroy();
        };
    }, [url, color]); // Keep deps minimal to avoid re-init

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
            {/* We use a hidden container for the initial load if needed, but here we just show it */}
            <div ref={containerRef} className="w-full" />
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500 bg-black/50 backdrop-blur-sm z-10">
                    <div className="animate-pulse">Loading...</div>
                </div>
            )}
        </div>
    );
}
