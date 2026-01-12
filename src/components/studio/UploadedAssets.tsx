import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Music,
    Image as ImageIcon,
    Film,
    Trash2,
    GripVertical,
    FolderOpen,
    FileAudio,
    FileVideo,
    FileImage,
    MousePointerClick,
    Search
} from 'lucide-react';

export interface UploadedAsset {
    id: string;
    name: string;
    type: 'audio' | 'video' | 'image';
    file: File;
    url: string;
    duration?: number;
    size: string;
    uploadedAt: Date;
    thumbnail?: string;
}

interface UploadedAssetsProps {
    assets: UploadedAsset[];
    onDragStart: (asset: UploadedAsset) => void;
    onDelete: (id: string) => void;
    onAddToTimeline: (asset: UploadedAsset) => void;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export default function UploadedAssets({ assets, onDragStart, onDelete, onAddToTimeline }: UploadedAssetsProps) {
    const [filter, setFilter] = useState<'all' | 'audio' | 'video' | 'image'>('all');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredAssets = assets.filter(asset =>
        (filter === 'all' || asset.type === filter) &&
        asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (assets.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col h-full items-center justify-center text-center p-6 bg-[#0a0a0a]"
            >
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] flex items-center justify-center mb-4 border border-white/[0.06] shadow-sm">
                    <FolderOpen className="w-8 h-8 text-gray-600 stroke-1" />
                </div>
                <h3 className="text-sm font-semibold text-gray-300 mb-1">No Uploads Yet</h3>
                <p className="text-xs text-gray-500 leading-relaxed max-w-[200px]">
                    Import media using the button above.<br />
                    Your files will appear here safe and sound.
                </p>
            </motion.div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] overflow-hidden font-sans">
            {/* Filter Tabs & Search */}
            <div className="px-4 py-3 space-y-3 bg-[#0a0a0a]/80 backdrop-blur-xl border-b border-white/[0.04] sticky top-0 z-10">
                {/* Search Bar */}
                <div className="relative group">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-gray-300 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search uploads..."
                        className="w-full bg-[#141414] border border-white/[0.06] rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.06]">
                    {(['all', 'audio', 'video', 'image'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilter(type)}
                            className={`flex-1 py-1.5 px-2 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${filter === type
                                ? 'bg-white/[0.08] text-white shadow-sm border border-white/5'
                                : 'text-gray-600 hover:text-gray-400 hover:bg-white/[0.02]'
                                }`}
                        >
                            {type === 'audio' && <Music className="w-3 h-3" />}
                            {type === 'video' && <Film className="w-3 h-3" />}
                            {type === 'image' && <ImageIcon className="w-3 h-3" />}
                            <span>{type}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Assets Grid */}
            <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                <motion.div
                    layout
                    className="grid grid-cols-2 gap-3"
                >
                    <AnimatePresence mode="popLayout">
                        {filteredAssets.map((asset, index) => (
                            <motion.div
                                key={asset.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                                transition={{ delay: index * 0.03 }}
                                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                                onMouseEnter={() => setHoveredId(asset.id)}
                                onMouseLeave={() => setHoveredId(null)}
                                onDoubleClick={() => onAddToTimeline(asset)}
                                className="group relative aspect-square bg-[#141414] rounded-xl border border-white/[0.06] hover:border-purple-500/30 transition-all overflow-hidden cursor-grab active:cursor-grabbing hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                            >
                                {/* Native Drag Layer & Interaction */}
                                <div
                                    draggable
                                    onDragStart={(e: React.DragEvent) => {
                                        // Create a custom drag image
                                        const dragEl = e.currentTarget.parentElement;
                                        if (dragEl) {
                                            e.dataTransfer.setDragImage(dragEl, 50, 50);
                                        }

                                        // Only pass the asset ID - File objects can't be serialized to JSON
                                        e.dataTransfer.setData('application/json', JSON.stringify({
                                            id: asset.id,
                                            name: asset.name,
                                            type: asset.type,
                                            url: asset.url,
                                            duration: asset.duration,
                                            size: asset.size,
                                            thumbnail: asset.thumbnail
                                            // Note: 'file' is intentionally excluded as it can't be serialized
                                        }));
                                        e.dataTransfer.effectAllowed = 'copy';
                                        onDragStart(asset);
                                    }}
                                    onDragEnd={() => {
                                        // Reset any drag state if needed
                                    }}
                                    onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        onAddToTimeline(asset);
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
                                />

                                {/* Drag Handle - Always visible on hover */}
                                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
                                    <div className="w-6 h-6 rounded-md bg-black/60 backdrop-blur-md flex items-center justify-center text-gray-400 border border-white/10">
                                        <GripVertical className="w-3.5 h-3.5" />
                                    </div>
                                </div>

                                {/* Delete Button */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(asset.id);
                                    }}
                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all z-20 w-6 h-6 rounded-md bg-red-500/10 backdrop-blur-md flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>

                                {/* Thumbnail / Icon Container */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 pb-10">
                                    <div className="w-full h-full relative flex items-center justify-center overflow-hidden rounded-lg bg-black/20">
                                        {asset.thumbnail ? (
                                            <img
                                                src={asset.thumbnail}
                                                alt={asset.name}
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                {asset.type === 'audio' && <FileAudio className="w-8 h-8 text-blue-500/50" />}
                                                {asset.type === 'video' && <FileVideo className="w-8 h-8 text-purple-500/50" />}
                                                {asset.type === 'image' && <FileImage className="w-8 h-8 text-green-500/50" />}
                                            </div>
                                        )}

                                        {/* Type Indicator Line */}
                                        <div className={`absolute bottom-0 left-0 right-0 h-0.5 opacity-50 ${asset.type === 'audio' ? 'bg-blue-500' :
                                            asset.type === 'video' ? 'bg-purple-500' :
                                                'bg-green-500'
                                            }`} />
                                    </div>
                                </div>

                                {/* Info Overlay */}
                                <div className="absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black via-black/90 to-transparent">
                                    <div className="text-[10px] font-medium text-gray-200 truncate mb-0.5">{asset.name}</div>
                                    <div className="flex items-center justify-between text-[9px] text-gray-500 font-mono">
                                        <span>{asset.size}</span>
                                        {asset.duration && (
                                            <span className="bg-white/5 px-1 rounded flex items-center gap-1">
                                                {formatDuration(asset.duration)}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Selection Border / Glow */}
                                <div className={`absolute inset-0 rounded-xl border-2 transition-colors pointer-events-none z-10 ${hoveredId === asset.id ? 'border-purple-500/20' : 'border-transparent'
                                    }`} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Help Text */}
                {filteredAssets.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.6 }}
                        className="mt-6 p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] text-center"
                    >
                        <p className="text-[9px] text-gray-500 flex items-center justify-center gap-1.5 font-medium">
                            <MousePointerClick className="w-3 h-3 text-purple-400" />
                            Double-click to add to timeline
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
