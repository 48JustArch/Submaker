import { useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, getEffectiveDuration, getTrackBounds } from './types';
import { ZoomIn, ZoomOut, Monitor, Volume2, VolumeX, Headphones, Move, Clock, MousePointerClick, GripVertical, Play, ChevronDown, ChevronRight } from 'lucide-react';

interface TimelineProps {
    tracks: Track[];
    currentTime: number;
    selectedTrackId: string | null;
    onSelectTrack: (id: string | null) => void;
    onUpdateTrack: (id: string, updates: Partial<Track>) => void;
    zoom: number;
    setZoom: (zoom: number) => void;
    onDropAsset: (assetData: string) => void;
    onSeek: (time: number) => void;
}

// Helper: Extract peaks from audio URL
async function extractPeaks(url: string, duration: number): Promise<number[]> {
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        // Use OfflineAudioContext for faster decoding without hardware limit issues
        const offlineCtx = new OfflineAudioContext(1, 44100 * duration, 44100);
        const audioBuffer = await offlineCtx.decodeAudioData(arrayBuffer);

        const rawData = audioBuffer.getChannelData(0);
        const samples = 500; // Fixed resolution for now
        const blockSize = Math.floor(rawData.length / samples);
        const peaks = [];

        for (let i = 0; i < samples; i++) {
            let max = 0;
            const start = i * blockSize;
            for (let j = 0; j < blockSize; j++) {
                if (Math.abs(rawData[start + j]) > max) max = Math.abs(rawData[start + j]);
            }
            peaks.push(max);
        }
        return peaks;
    } catch (e) {
        console.error("Waveform generation failed:", e);
        return [];
    }
}

export default function Timeline({
    tracks,
    currentTime,
    selectedTrackId,
    onSelectTrack,
    onUpdateTrack,
    zoom,
    setZoom,
    onDropAsset,
    onSeek
}: TimelineProps) {
    const [headerWidth, setHeaderWidth] = useState(260);
    const [isDraggingHeader, setIsDraggingHeader] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null); // Ruler
    const tracksContainerRef = useRef<HTMLDivElement>(null); // Tracks Area (Main Scroll)

    // Process Waveforms
    useEffect(() => {
        tracks.forEach(async (track) => {
            if (track.type === 'audio' && track.url && !track.waveform) {
                // Generate waveform
                console.log("Generating waveform for:", track.name);
                const peaks = await extractPeaks(track.url, track.duration);
                if (peaks.length > 0) {
                    onUpdateTrack(track.id, { waveform: peaks });
                }
            }
        });
    }, [tracks, onUpdateTrack]);

    // Trim handle dragging state
    const [trimDrag, setTrimDrag] = useState<{
        trackId: string;
        handle: 'left' | 'right';
        startX: number;
        initialInPoint: number;
        initialOutPoint: number;
        initialStartTime: number;
    } | null>(null);

    // Track drag state for reordering/moving
    const [trackDrag, setTrackDrag] = useState<{
        trackId: string;
        startX: number;
        initialStartTime: number;
    } | null>(null);

    // Group tracks by type
    const videoTracks = tracks.filter(t => t.type === 'video' || t.type === 'image');
    const audioTracks = tracks.filter(t => t.type === 'audio');

    // Generate waveform path from real data or placeholder
    const getWaveformPath = (trackId: string, duration: number, height: number, color: string) => {
        const track = tracks.find(t => t.id === trackId);

        // 1. Loading State (Animated Pulse)
        if (!track?.waveform) {
            const width = duration * zoom;
            // Simple placeholder line
            return <path d={`M0,${height / 2} L${width},${height / 2}`} stroke={color} strokeWidth="2" strokeDasharray="4 4" opacity="0.5" />;
        }

        // 2. Real Waveform Rendering
        const peaks = track.waveform;
        const width = duration * zoom;
        const step = width / peaks.length;

        // Construct a single continuous filled shape
        // Move to start-center
        let pathData = `M 0 ${height / 2} `;

        // Draw Top Envelope
        for (let i = 0; i < peaks.length; i++) {
            const x = i * step;
            const amplitude = peaks[i] * (height / 2) * 0.95; // 95% height
            const y = (height / 2) - amplitude;
            // Use quadratic curve for smoother look? slightly heavy. specific LineTo is safer/faster.
            pathData += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
        }

        // Draw Bottom Envelope (in reverse)
        for (let i = peaks.length - 1; i >= 0; i--) {
            const x = i * step;
            const amplitude = peaks[i] * (height / 2) * 0.95;
            const y = (height / 2) + amplitude;
            pathData += `L ${x.toFixed(1)} ${y.toFixed(1)} `;
        }

        // Close shape
        pathData += `Z`;

        return <path d={pathData} fill={color} fillOpacity="0.7" />;
    };

    // Calculate time markers for the ruler based on zoom
    const timeMarkers = useMemo(() => {
        const markers = [];
        const interval = zoom > 100 ? 1 : zoom > 50 ? 5 : zoom > 10 ? 10 : 30; // Seconds between major ticks
        const maxTime = Math.max(
            300,
            ...tracks.map(t => (t.startTime || 0) + getEffectiveDuration(t))
        ) + 60;

        for (let t = 0; t <= maxTime; t += interval) {
            markers.push({ time: t, x: t * zoom });
        }
        return markers;
    }, [zoom, tracks]);

    // Handle scroll synchronization between ruler and tracks
    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollLeft = e.currentTarget.scrollLeft;
        if (tracksContainerRef.current && tracksContainerRef.current !== e.currentTarget) {
            tracksContainerRef.current.scrollLeft = scrollLeft;
        }
        if (scrollContainerRef.current && scrollContainerRef.current !== e.currentTarget) {
            scrollContainerRef.current.scrollLeft = scrollLeft;
        }
    };

    // Handle Mouse Wheel Zoom
    // Plain scroll on timeline = zoom. Hold Shift = horizontal scroll.
    const handleWheel = (e: React.WheelEvent) => {
        // If Shift is held, allow normal horizontal scroll
        if (e.shiftKey) {
            return; // Let browser handle horizontal scroll  
        }

        // Otherwise, scroll = zoom
        e.preventDefault();
        const bgRect = tracksContainerRef.current?.getBoundingClientRect();
        if (!bgRect) return;

        const mouseX = e.clientX - bgRect.left + (tracksContainerRef.current?.scrollLeft || 0);
        const mouseTime = mouseX / zoom;

        const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87; // Slightly faster zoom
        const newZoom = Math.min(300, Math.max(2, zoom * zoomFactor));

        setZoom(newZoom);

        // Center zoom on mouse position
        setTimeout(() => {
            if (tracksContainerRef.current) {
                const newScrollLeft = (mouseTime * newZoom) - (e.clientX - bgRect.left);
                tracksContainerRef.current.scrollLeft = newScrollLeft;
            }
        }, 0);
    };

    // Click on ruler to seek
    const handleRulerClick = (e: React.MouseEvent) => {
        const rect = scrollContainerRef.current?.getBoundingClientRect();
        if (rect) {
            const clickX = e.clientX - rect.left + (scrollContainerRef.current?.scrollLeft || 0);
            const time = Math.max(0, clickX / zoom);
            onSeek(time);
        }
    };

    // --- Drag & Drop Handlers ---
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        try {
            const assetData = e.dataTransfer.getData('application/json');
            if (assetData) {
                // Calculate drop time based on mouse position
                const rect = tracksContainerRef.current?.getBoundingClientRect();
                const scrollLeft = tracksContainerRef.current?.scrollLeft || 0;
                let dropTime = 0;

                if (rect) {
                    const x = e.clientX - rect.left + scrollLeft;
                    dropTime = Math.max(0, x / zoom);
                }

                // Add drop time to assetData for higher level handling
                const dataObj = JSON.parse(assetData);
                dataObj.dropTime = dropTime;

                onDropAsset(JSON.stringify(dataObj));
            }
        } catch (error) {
            console.error("Drop failed:", error);
        }
    };

    // --- Track Item Dragging (Move & Trim) ---
    const handleTrimStart = (e: React.MouseEvent, trackId: string, handle: 'left' | 'right') => {
        e.stopPropagation();
        e.preventDefault();
        const track = tracks.find(t => t.id === trackId);
        if (!track) return;

        setTrimDrag({
            trackId,
            handle,
            startX: e.clientX,
            initialInPoint: track.inPoint || 0,
            initialOutPoint: track.outPoint || track.duration,
            initialStartTime: track.startTime || 0
        });
    };

    const handleTrackMoveStart = (e: React.MouseEvent, trackId: string) => {
        e.stopPropagation();
        e.preventDefault();
        const track = tracks.find(t => t.id === trackId);
        if (!track) return;

        onSelectTrack(trackId);

        setTrackDrag({
            trackId,
            startX: e.clientX,
            initialStartTime: track.startTime || 0
        });
    };

    // Global Mouse Listeners for Dragging
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (trimDrag) {
                const track = tracks.find(t => t.id === trimDrag.trackId);
                if (!track) return;

                const deltaPixels = e.clientX - trimDrag.startX;
                const deltaTime = deltaPixels / zoom;

                if (trimDrag.handle === 'left') {
                    const newStartTime = trimDrag.initialStartTime + deltaTime;
                    const newInPoint = trimDrag.initialInPoint + deltaTime;

                    if (newInPoint >= 0 && newInPoint < (track.outPoint ?? track.duration) - 0.1) {
                        onUpdateTrack(trimDrag.trackId, { startTime: newStartTime, inPoint: newInPoint });
                    }
                } else {
                    const newOutPoint = trimDrag.initialOutPoint + deltaTime;
                    if (newOutPoint > (track.inPoint ?? 0) + 0.1 && newOutPoint <= track.duration) {
                        onUpdateTrack(trimDrag.trackId, { outPoint: newOutPoint });
                    }
                }
            } else if (trackDrag) {
                const deltaPixels = e.clientX - trackDrag.startX;
                const deltaTime = deltaPixels / zoom;
                const newStartTime = Math.max(0, trackDrag.initialStartTime + deltaTime);
                onUpdateTrack(trackDrag.trackId, { startTime: newStartTime });
            }
        };

        const handleMouseUp = () => {
            setTrimDrag(null);
            setTrackDrag(null);
        };

        if (trimDrag || trackDrag) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [trimDrag, trackDrag, zoom, tracks, onUpdateTrack]);


    return (
        <div
            ref={containerRef}
            className="flex-1 flex flex-col h-full bg-[#0a0a0a] select-none text-[10px]"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {/* === Toolbar === */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.04] bg-[#0a0a0a]/80 backdrop-blur z-20 sticky top-0">
                <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">TIMELINE</span>

                    <div className="h-4 w-px bg-white/[0.08]" />

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <button onClick={() => setZoom(Math.max(2, zoom / 1.5))} className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors">
                            <ZoomOut className="w-3.5 h-3.5" />
                        </button>
                        <input
                            type="range"
                            min="2"
                            max="300"
                            step="1"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            className="w-24 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-lg"
                            title={`Visible: ${Math.round(1000 / zoom)}s`}
                        />
                        <button onClick={() => setZoom(Math.min(300, zoom * 1.5))} className="p-1 hover:bg-white/5 rounded text-gray-500 hover:text-white transition-colors">
                            <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-[9px] text-gray-600 font-mono ml-1 w-10 text-right">
                            {Math.round(zoom)}px/s
                        </span>
                    </div>
                </div>

                {/* Right Side Tools */}
                <div className="flex gap-2">
                    <div className="flex items-center gap-2 text-gray-600">
                        <GripVertical className="w-3.5 h-3.5" />
                        <span>Drag to move</span>
                    </div>
                </div>
            </div>

            {/* === Timeline Header (Ruler) === */}
            <div className="flex border-b border-white/[0.04] bg-[#0a0a0a] relative z-10">
                {/* Track Headers Column Header */}
                <div style={{ width: headerWidth }} className="flex-shrink-0 border-r border-white/[0.04] p-2 flex items-center bg-[#0a0a0a]">
                    <span className="text-[10px] font-bold text-gray-500 pl-2">TRACKS</span>
                </div>

                {/* Ruler Content */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-hidden relative h-8 cursor-pointer group"
                    onClick={handleRulerClick}
                >
                    <div
                        className="absolute top-0 bottom-0 pointer-events-none"
                        style={{ width: 3600 * zoom + headerWidth }}
                    >
                        {timeMarkers.map((marker) => (
                            <div
                                key={marker.time}
                                className="absolute top-0 bottom-0 border-l border-white/[0.1] text-[9px] text-gray-600 group-hover:text-gray-400 pl-1 pt-0.5 select-none transition-colors"
                                style={{ left: marker.x }}
                            >
                                {new Date(marker.time * 1000).toISOString().substr(14, 5)}
                            </div>
                        ))}
                    </div>

                    {/* Playhead in Ruler - Replaced Purple with White/Blue */}
                    <div
                        className="absolute top-0 h-full w-px bg-blue-500 z-20 pointer-events-none shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                        style={{ left: currentTime * zoom }}
                    >
                        <div className="absolute -top-1 -translate-x-1/2 text-blue-500">
                            <svg width="11" height="12" viewBox="0 0 11 12" fill="currentColor">
                                <path d="M0.5 0h10v6L5.5 12 0.5 6V0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>


            {/* === Tracks Area === */}
            <div className="flex-1 flex overflow-hidden relative bg-[#050505]">
                {/* Track Headers List */}
                <div style={{ width: headerWidth }} className="flex-shrink-0 border-r border-white/[0.04] bg-[#0a0a0a] z-10 flex flex-col shadow-lg">
                    <div className="pt-2" /> {/* Spacer */}
                    {[...videoTracks, ...audioTracks].map((track) => (
                        <div
                            key={track.id}
                            onClick={() => onSelectTrack(track.id)}
                            className={`${track.isCollapsed ? 'h-10' : 'h-24'} border-b border-white/[0.04] px-4 flex flex-col justify-center gap-1 transition-all duration-300 relative group
                                ${selectedTrackId === track.id ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'}`}
                        >
                            {/* Selection Indicator */}
                            {selectedTrackId === track.id && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                            )}

                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 text-gray-300 font-medium truncate max-w-[120px]">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpdateTrack(track.id, { isCollapsed: !track.isCollapsed });
                                        }}
                                        className="text-gray-500 hover:text-white transition-colors"
                                    >
                                        {track.isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                    </button>
                                    {track.type === 'video' || track.type === 'image' ? <Monitor className="w-3.5 h-3.5 text-indigo-400" /> : <Headphones className="w-3.5 h-3.5 text-blue-400" />}
                                    <span className="truncate">{track.name}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        className={`p-1 rounded hover:bg-white/10 ${track.isMuted ? 'text-red-400' : 'text-gray-500'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onUpdateTrack(track.id, { isMuted: !track.isMuted });
                                        }}
                                    >
                                        {track.isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Volume Slider - Small (Hidden when collapsed) */}
                            {!track.isCollapsed && (
                                <div className="w-full flex items-center gap-2 group/vol">
                                    <span className="text-[9px] text-gray-600 font-mono w-6">
                                        {Math.round(track.volume)}%
                                    </span>
                                    <div className="flex-1 h-1 bg-white/[0.1] rounded-full overflow-hidden relative">
                                        <div
                                            className="absolute h-full bg-gray-500 rounded-full group-hover/vol:bg-blue-500 transition-colors"
                                            style={{ width: `${track.volume}%` }}
                                        />
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            step="1"
                                            value={track.volume}
                                            onChange={(e) => onUpdateTrack(track.id, { volume: parseFloat(e.target.value) })}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Empty Space filler */}
                    <div className="flex-1 bg-[#0a0a0a]" />
                </div>

                {/* Tracks Content (Scrollable) */}
                <div
                    ref={tracksContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-auto relative bg-transparent scrollbar-thin scrollbar-track-[var(--bg-deep)] scrollbar-thumb-white/10"
                    onWheel={handleWheel}
                >
                    {/* Playhead in Tracks Area */}
                    <div
                        className="absolute top-0 bottom-0 w-px bg-blue-500 z-30 pointer-events-none shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                        style={{ left: currentTime * zoom, height: '100%' }}
                    />

                    {/* Grid Lines */}
                    <div className="absolute inset-0 pointer-events-none opacity-20" style={{ width: Math.max(headerWidth + 3600 * zoom, 5000) }}>
                        {timeMarkers.map(m => (
                            <div key={m.time} className="absolute top-0 bottom-0 border-l border-white/[0.2]" style={{ left: m.x }} />
                        ))}
                    </div>

                    {/* Drag Overlay */}
                    {isDragOver && (
                        <div className="absolute inset-0 bg-blue-500/10 z-50 flex items-center justify-center border-2 border-blue-500/30 backdrop-blur-[2px]">
                            <div className="bg-[#0f0f0f] border border-blue-500/20 px-6 py-4 rounded-xl shadow-2xl flex flex-col items-center animate-bounce">
                                <Monitor className="w-8 h-8 text-blue-400 mb-2" />
                                <span className="text-sm font-bold text-white">Drop Media Here</span>
                            </div>
                        </div>
                    )}

                    {/* Track Lanes */}
                    <div className="pt-2 min-w-full" style={{ width: Math.max(100, ...tracks.map(t => ((t.startTime || 0) + (t.duration || 0)) * zoom + 500)) }}>
                        {[...videoTracks, ...audioTracks].map((track) => {
                            const effectiveDuration = getEffectiveDuration(track);
                            return (
                                <div
                                    key={track.id}
                                    className={`${track.isCollapsed ? 'h-10' : 'h-24'} border-b border-white/[0.04] relative group transition-all duration-300`}
                                    onClick={() => onSelectTrack(track.id)}
                                >
                                    <div
                                        className="absolute top-2 bottom-2 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing border border-white/10 hover:border-white/20 transition-all select-none shadow-sm"
                                        style={{
                                            left: (track.startTime || 0) * zoom,
                                            width: Math.max(2, effectiveDuration * zoom),
                                            backgroundColor: selectedTrackId === track.id
                                                ? (track.type === 'audio' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(99, 102, 241, 0.2)')
                                                : (track.type === 'audio' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)'),
                                            borderColor: selectedTrackId === track.id
                                                ? (track.type === 'audio' ? '#3b82f6' : '#6366f1')
                                                : 'rgba(255,255,255,0.1)'
                                        }}
                                        onMouseDown={(e) => handleTrackMoveStart(e, track.id)}
                                    >
                                        {/* Audio Waveform */}
                                        {track.type === 'audio' && (
                                            <div className="absolute inset-0 flex items-center opacity-80 pointer-events-none">
                                                <svg
                                                    key={`waveform-${track.id}-${zoom}`}
                                                    className="w-full h-full text-blue-500/50"
                                                    viewBox={`0 0 ${Math.max(20, effectiveDuration * zoom)} ${track.isCollapsed ? 40 : 96}`}
                                                    preserveAspectRatio="none"
                                                >
                                                    {getWaveformPath(track.id, effectiveDuration, track.isCollapsed ? 40 : 96, selectedTrackId === track.id ? 'rgb(59, 130, 246)' : 'rgba(59, 130, 246, 0.5)')}
                                                </svg>
                                            </div>
                                        )}

                                        {/* Video Thumbnails */}
                                        {track.type !== 'audio' && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none bg-indigo-500/10">
                                                <div className="flex gap-2 overflow-hidden w-full px-2">
                                                    {Array.from({ length: Math.ceil(effectiveDuration * zoom / 100) }).map((_, i) => (
                                                        <div key={i} className={`${track.isCollapsed ? 'h-6 w-10' : 'h-12 w-20'} bg-white/10 rounded-md flex-shrink-0`} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Track Name Label */}
                                        <div className="absolute top-1 left-2 bg-black/50 px-2 py-0.5 rounded text-[9px] font-medium text-white/80 backdrop-blur-sm pointer-events-none truncate max-w-full">
                                            {track.name}
                                        </div>

                                        {/* Resize Handles */}
                                        <div
                                            className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            onMouseDown={(e) => handleTrimStart(e, track.id, 'left')}
                                        >
                                            <div className="w-1 h-4 bg-white/50 rounded-full" />
                                        </div>
                                        <div
                                            className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                            onMouseDown={(e) => handleTrimStart(e, track.id, 'right')}
                                        >
                                            <div className="w-1 h-4 bg-white/50 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Empty State Instruction in Timeline */}
                        {tracks.length === 0 && (
                            <div className="h-64 flex flex-col items-center justify-center opacity-30 pointer-events-none">
                                <p className="text-xl font-bold text-gray-500 mb-2">Drag & Drop Media Here</p>
                                <p className="text-sm text-gray-600">or double-click from library</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
