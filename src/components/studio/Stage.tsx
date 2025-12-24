import { useEffect, useRef, useState } from 'react';
import { Track, VideoTrack, ImageTrack } from '@/types/studio';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Lock, Unlock, Grid, Copy, Maximize } from 'lucide-react';

interface StageProps {
    tracks: Track[];
    activeTrackId: string | null;
    currentTime: number;
    isPlaying: boolean;
    onUpdateTrack: (id: string, updates: Partial<Track>) => void;
    onSelectTrack: (id: string) => void;
}

export default function Stage({ tracks, activeTrackId, currentTime, isPlaying, onUpdateTrack, onSelectTrack }: StageProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [showGrid, setShowGrid] = useState(false);
    const [interaction, setInteraction] = useState<{
        type: 'move' | 'resize';
        id: string;
        startX: number;
        startY: number;
        initialX?: number;
        initialY?: number;
        initialWidth?: number;
    } | null>(null);

    // Filter for visual tracks that are currently active
    const visualTracks = tracks
        .filter((t): t is VideoTrack | ImageTrack =>
            (t.type === 'video' || t.type === 'image') &&
            !t.hidden &&
            currentTime >= t.start &&
            currentTime < (t.start + t.duration)
        )
        .sort((a, b) => a.layer - b.layer || a.zIndex - b.zIndex);

    const handleMouseDown = (e: React.MouseEvent, track: VideoTrack | ImageTrack, type: 'move' | 'resize') => {
        e.preventDefault();
        e.stopPropagation();

        if (track.locked) return;

        onSelectTrack(track.id);

        setInteraction({
            type,
            id: track.id,
            startX: e.clientX,
            startY: e.clientY,
            initialX: track.x,
            initialY: track.y,
            initialWidth: track.width
        });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!interaction || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();

        if (interaction.type === 'move') {
            const deltaX = e.clientX - interaction.startX;
            const deltaY = e.clientY - interaction.startY;
            const deltaPercentX = (deltaX / containerRect.width) * 100;
            const deltaPercentY = (deltaY / containerRect.height) * 100;

            onUpdateTrack(interaction.id, {
                x: (interaction.initialX || 0) + deltaPercentX,
                y: (interaction.initialY || 0) + deltaPercentY
            });
        } else if (interaction.type === 'resize') {
            const track = tracks.find(t => t.id === interaction.id) as VideoTrack | ImageTrack;
            if (!track) return;

            const centerX = (track.x / 100) * containerRect.width + containerRect.left;
            const distFromCenter = Math.abs(e.clientX - centerX);
            const newWidthPx = distFromCenter * 2;
            const newWidthPercent = (newWidthPx / containerRect.width) * 100;

            onUpdateTrack(interaction.id, {
                width: Math.max(5, newWidthPercent) // Min 5% width
            });
        }
    };

    const handleMouseUp = () => {
        setInteraction(null);
    };

    const activeTrack = tracks.find(t => t.id === activeTrackId) as VideoTrack | ImageTrack | undefined;

    return (
        <div
            ref={containerRef}
            className={`w-full aspect-video bg-black relative overflow-hidden shadow-2xl rounded-xl border border-white/10 select-none group/stage
                ${isPlaying ? 'shadow-[0_0_40px_rgba(124,58,237,0.1)] border-purple-500/30' : ''} transition-all duration-500`}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
                backgroundImage: showGrid
                    ? 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)'
                    : 'none',
                backgroundSize: '10% 10%'
            }}
        >
            {/* Grid Toggle (Top Right) */}
            <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute top-4 right-4 z-50 p-2 bg-black/50 backdrop-blur-md rounded-lg text-gray-400 hover:text-white border border-white/5"
                onClick={() => setShowGrid(!showGrid)}
            >
                <Grid className={`w-4 h-4 ${showGrid ? 'text-blue-400' : ''}`} />
            </motion.button>

            {/* Render Tracks */}
            <AnimatePresence>
                {visualTracks.map(track => (
                    <VisualElement
                        key={track.id}
                        track={track}
                        isActive={activeTrackId === track.id}
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                        onMouseDown={(e) => handleMouseDown(e, track, 'move')}
                        onResizeStart={(e) => handleMouseDown(e, track, 'resize')}
                    />
                ))}
            </AnimatePresence>

            {/* Floating Toolbar (Bottom Center when Active) */}
            <AnimatePresence>
                {activeTrack && activeTrackId && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-1.5 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl"
                    >
                        <ToolbarButton
                            icon={activeTrack.locked ? Lock : Unlock}
                            active={activeTrack.locked}
                            onClick={() => onUpdateTrack(activeTrack.id, { locked: !activeTrack.locked })}
                        />
                        <div className="w-px h-4 bg-white/10 mx-1" />
                        <ToolbarButton
                            icon={Trash2}
                            danger
                            onClick={() => { /* Delete logic needs parent callback or just hide */ onUpdateTrack(activeTrack.id, { hidden: true }); }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Empty State */}
            {visualTracks.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 pointer-events-none">
                    <Maximize className="w-12 h-12 mb-4 opacity-20" />
                    <p className="font-mono text-sm opacity-50">Preview Stage</p>
                </div>
            )}
        </div>
    );
}

function ToolbarButton({ icon: Icon, onClick, active, danger }: { icon: any, onClick: () => void, active?: boolean, danger?: boolean }) {
    return (
        <button
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className={`p-2 rounded-full transition-all ${active ? 'bg-white text-black' :
                    danger ? 'hover:bg-red-500/20 hover:text-red-400 text-gray-400' :
                        'hover:bg-white/10 text-gray-400 hover:text-white'
                }`}
        >
            <Icon className="w-4 h-4" />
        </button>
    )
}

function VisualElement({
    track,
    isActive,
    currentTime,
    isPlaying,
    onMouseDown,
    onResizeStart
}: {
    track: VideoTrack | ImageTrack;
    isActive: boolean;
    currentTime: number;
    isPlaying: boolean;
    onMouseDown: (e: React.MouseEvent) => void;
    onResizeStart: (e: React.MouseEvent) => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const localTime = currentTime - track.start;

    // Sync video
    useEffect(() => {
        if (track.type === 'video' && videoRef.current) {
            const video = videoRef.current;
            if (Math.abs(video.currentTime - localTime) > 0.3) {
                video.currentTime = localTime;
            }
            if (isPlaying) {
                video.play().catch(() => { });
            } else {
                video.pause();
            }
        }
    }, [currentTime, isPlaying, localTime, track.type]);

    const style: React.CSSProperties = {
        position: 'absolute',
        left: `${track.x}%`,
        top: `${track.y}%`,
        width: `${track.width}%`,
        height: 'auto',
        transform: `translate(-50%, -50%) scale(${track.scale})`,
        opacity: track.opacity,
        zIndex: track.zIndex,
        maxWidth: '100%',
        cursor: track.locked ? 'default' : 'grab'
    };

    const handleStyle: React.CSSProperties = {
        width: '12px',
        height: '12px',
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.1)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
        borderRadius: '50%',
        position: 'absolute',
        zIndex: 50,
        pointerEvents: 'auto'
    };

    const renderHandle = (cursor: string, pos: React.CSSProperties) => (
        <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            style={{ ...handleStyle, ...pos, cursor }}
            onMouseDown={(e) => {
                e.stopPropagation();
                onResizeStart(e);
            }}
            whileHover={{ scale: 1.2 }}
        />
    );

    return (
        <motion.div
            style={style}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: track.opacity, scale: track.scale }}
            className={`group ${isActive ? 'z-50' : 'z-auto'}`}
            onMouseDown={onMouseDown}
        >
            {/* Selection Border */}
            <div className={`absolute -inset-1 border-2 border-blue-500 rounded-lg pointer-events-none transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-30'}`} />

            {track.type === 'image' && (
                <img src={track.url} alt={track.name} className="pointer-events-none select-none w-full h-full object-contain" />
            )}
            {track.type === 'video' && (
                <video
                    ref={videoRef}
                    src={track.url}
                    muted={track.muted}
                    className="pointer-events-none select-none w-full h-full object-contain"
                    playsInline
                />
            )}

            {/* Resize Handles */}
            <AnimatePresence>
                {isActive && !track.locked && (
                    <>
                        {renderHandle('nw-resize', { top: '-6px', left: '-6px' })}
                        {renderHandle('ne-resize', { top: '-6px', right: '-6px' })}
                        {renderHandle('sw-resize', { bottom: '-6px', left: '-6px' })}
                        {renderHandle('se-resize', { bottom: '-6px', right: '-6px' })}
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
