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
    onReady?: () => void;
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
    onReady
}: TrackPlayerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Initialize WaveSurfer
    useEffect(() => {
        if (!containerRef.current) return;

        // Create instance
        const ws = WaveSurfer.create({
            container: containerRef.current,
            waveColor: color.replace('bg-', '').replace('-500', '') === 'blue' ? 'rgba(59, 130, 246, 0.5)' :
                color.replace('bg-', '').replace('-500', '') === 'purple' ? 'rgba(168, 85, 247, 0.5)' :
                    'rgba(6, 182, 212, 0.5)', // Simplified color mapping
            progressColor: color.replace('bg-', '').replace('-500', '') === 'blue' ? 'rgba(59, 130, 246, 1)' :
                color.replace('bg-', '').replace('-500', '') === 'purple' ? 'rgba(168, 85, 247, 1)' :
                    'rgba(6, 182, 212, 1)',
            cursorColor: '#fff',
            barWidth: 2,
            barGap: 3,
            height: 64, // roughly h-16
            normalize: true,
            url: url,
        });

        // Event listeners
        ws.on('ready', () => {
            setIsReady(true);
            if (onReady) onReady();
        });

        ws.on('finish', () => {
            // Optional: Handle finish
        });

        wavesurferRef.current = ws;

        return () => {
            ws.destroy();
        };
    }, [url, color, onReady]);

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
        <div className="w-full h-full flex flex-col justify-center">
            {/* We use a hidden container for the initial load if needed, but here we just show it */}
            <div ref={containerRef} className="w-full" />
            {!isReady && (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
                    Loading Waveform...
                </div>
            )}
        </div>
    );
}
