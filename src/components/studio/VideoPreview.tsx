'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Track } from './types';
import { Move, Maximize2, RotateCw } from 'lucide-react';

interface VideoPreviewProps {
    timestamp: string;
    track?: Track; // The active visual track
    onUpdate?: (id: string, updates: Partial<Track>) => void;
    isPlaying?: boolean;
    currentTime?: number;
}

// Virtual Canvas Size (Export Resolution)
const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

export default function VideoPreview({ timestamp, track, onUpdate, isPlaying, currentTime }: VideoPreviewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0, scale: 1 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialTransform, setInitialTransform] = useState({ x: 0, y: 0, scale: 1, rotation: 0 });
    const [activeHandle, setActiveHandle] = useState<string | null>(null);

    // Initial transform defaults
    const transform = track?.transform || { x: 0, y: 0, scale: 1, rotation: 0 };

    // Update container size on resize - mapping virtual 1920x1080 to screen
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                const targetRatio = CANVAS_WIDTH / CANVAS_HEIGHT;
                const containerRatio = clientWidth / clientHeight;

                let width, height, scale;

                if (containerRatio > targetRatio) {
                    // Height is limiter
                    height = clientHeight;
                    width = height * targetRatio;
                    scale = height / CANVAS_HEIGHT;
                } else {
                    // Width is limiter
                    width = clientWidth;
                    height = width / targetRatio;
                    scale = width / CANVAS_WIDTH;
                }
                setContainerSize({ width, height, scale });
            }
        };

        window.addEventListener('resize', updateSize);
        updateSize();
        // small delay to ensure layout
        setTimeout(updateSize, 100);

        return () => window.removeEventListener('resize', updateSize);
    }, []);

    // Sync video playback
    useEffect(() => {
        if (videoRef.current && track?.type === 'video') {
            if (isPlaying) videoRef.current.play().catch(() => { });
            else videoRef.current.pause();
        }
    }, [isPlaying, track]);

    // Sync video time
    useEffect(() => {
        if (videoRef.current && track?.type === 'video' && currentTime !== undefined) {
            if (Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
                videoRef.current.currentTime = currentTime;
            }
        }
    }, [currentTime, track]);

    // --- Interaction Handlers ---

    // 1. Mouse Down on Content (Move)
    const handleMouseDown = (e: React.MouseEvent) => {
        if (!track || !onUpdate) return;
        e.preventDefault();
        setIsDragging(true);
        setActiveHandle(null);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialTransform({ ...transform });
    };

    // 2. Mouse Down on Handle (Scale)
    const handleHandleDown = (e: React.MouseEvent, handle: string) => {
        if (!track || !onUpdate) return;
        e.stopPropagation();
        e.preventDefault();
        setIsDragging(true);
        setActiveHandle(handle);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialTransform({ ...transform });
    };

    // 3. Global Mouse Move / Up
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging || !track || !onUpdate) return;

            const deltaXScreen = e.clientX - dragStart.x;
            const deltaYScreen = e.clientY - dragStart.y;

            // Convert screen delta to CANVAS delta (so movements match 1:1 with cursor on canvas)
            const deltaX = deltaXScreen / containerSize.scale;
            const deltaY = deltaYScreen / containerSize.scale;

            if (activeHandle) {
                // Resize Logic
                // If dragging Right handles, +X increases scale
                // If dragging Left handles, -X increases scale
                // Sensitivity is approximate since we are doing uniform scale from center
                const sensitivity = 0.001;
                let scaleDelta = deltaX * sensitivity;

                if (activeHandle === 'tl' || activeHandle === 'bl') {
                    scaleDelta = -scaleDelta;
                }

                const newScale = Math.max(0.1, initialTransform.scale + scaleDelta);

                onUpdate(track.id, {
                    transform: {
                        ...initialTransform,
                        scale: newScale
                    }
                });

            } else {
                // Move Logic
                onUpdate(track.id, {
                    transform: {
                        ...initialTransform,
                        x: initialTransform.x + deltaX,
                        y: initialTransform.y + deltaY
                    }
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setActiveHandle(null);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragStart, initialTransform, track, onUpdate, containerSize, activeHandle]);


    // If no visual track
    if (!track) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a]">
                <div className="flex flex-col items-center gap-4 opacity-40">
                    <div className="w-20 h-16 border-2 border-[var(--text-tertiary)] border-dashed rounded-xl flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-[var(--text-tertiary)]" />
                    </div>
                    <div className="text-[var(--text-tertiary)] font-mono text-xs tracking-widest uppercase">
                        No Visual Selected
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="w-full h-full bg-[#111] flex items-center justify-center overflow-hidden relative select-none"
        >
            {/* The "Stage" - Represents the 1920x1080 export area */}
            <div
                className="relative bg-black shadow-2xl overflow-hidden ring-1 ring-white/10"
                style={{
                    width: containerSize.width,
                    height: containerSize.height,
                    backgroundColor: '#000000',
                    boxShadow: '0 0 50px rgba(0,0,0,0.5)'
                }}
            >
                {/* Content Container */}
                <div
                    className="absolute origin-center cursor-move group touch-none"
                    style={{
                        left: '50%',
                        top: '50%',
                        width: CANVAS_WIDTH,
                        height: CANVAS_HEIGHT,
                        transform: `
                            translate(-50%, -50%) 
                            translate(${transform.x * containerSize.scale}px, ${transform.y * containerSize.scale}px) 
                            scale(${transform.scale}) 
                            rotate(${transform.rotation}deg)
                        `,
                    }}
                    onMouseDown={handleMouseDown}
                >
                    {track.type === 'video' ? (
                        <video
                            ref={videoRef}
                            src={track.url}
                            className="w-full h-full object-contain pointer-events-none"
                            muted
                            loop
                            playsInline
                        />
                    ) : (
                        <img
                            src={track.url}
                            alt="Preview"
                            className="w-full h-full object-contain pointer-events-none"
                        />
                    )}

                    {/* Selection Overlay & Handles */}
                    <div className="absolute inset-0 border-2 border-[var(--accent-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Corners */}
                        {['tl', 'tr', 'bl', 'br'].map(corner => (
                            <div
                                key={corner}
                                onMouseDown={(e) => handleHandleDown(e, corner)}
                                className={`absolute w-4 h-4 bg-white border-2 border-[var(--accent-primary)] rounded-full hover:scale-125 transition-transform z-10 
                                    ${corner.includes('t') ? '-top-2' : '-bottom-2'}
                                    ${corner.includes('l') ? '-left-2' : '-right-2'}
                                    cursor-${corner === 'tl' || corner === 'br' ? 'nwse' : 'nesw'}-resize
                                `}
                                style={{
                                    // Inverse scale to keep handles constant visual size regardless of media scale
                                    transform: `scale(${1 / Math.max(0.1, transform.scale)})`
                                }}
                            />
                        ))}
                        {/* Center */}
                        <div
                            className="absolute top-1/2 left-1/2 w-3 h-3 -ml-1.5 -mt-1.5 bg-[var(--accent-primary)] rounded-full shadow-sm"
                            style={{
                                transform: `scale(${1 / Math.max(0.1, transform.scale)})`
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Info Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-1 pointer-events-none">
                <div className="bg-black/60 backdrop-blur text-white/50 text-[10px] font-mono px-2 py-1 rounded border border-white/5">
                    1920x1080 Preview
                </div>
                {track && (
                    <div className="bg-black/60 backdrop-blur text-[var(--accent-primary)] text-[10px] font-mono px-2 py-1 rounded border border-white/5">
                        X: {transform.x.toFixed(0)} Y: {transform.y.toFixed(0)} S: {transform.scale.toFixed(2)}
                    </div>
                )}
            </div>

            {/* Bottom Time Overlay */}
            <div className="absolute bottom-6 font-mono text-sm text-[var(--text-primary)] tabular-nums px-3 py-1 bg-black/50 rounded-full border border-white/10 backdrop-blur-md pointer-events-none">
                {timestamp}
            </div>
        </div>
    );
}
