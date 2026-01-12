'use client';

import { useState } from 'react';
import {
    Plus,
    Sparkles,
    Music,
    Image as ImageIcon,
    Film,
    Search,
    FolderOpen,
    Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Stock sample info type
interface StockSample {
    type: 'audio' | 'video' | 'image';
    name: string;
    duration?: string;
    size?: string;
}

interface MediaLibraryProps {
    onOpenAffirmations: () => void;
    onOpenGenerators: () => void;
    onAddTrack: (file: File) => void;
    onAddSampleToTimeline?: (sample: StockSample) => void;
}

export default function MediaLibrary({ onOpenAffirmations, onOpenGenerators, onAddTrack, onAddSampleToTimeline }: MediaLibraryProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('Stock Samples');
    const [searchQuery, setSearchQuery] = useState('');
    const [addedSamples, setAddedSamples] = useState<Set<string>>(new Set());

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onAddTrack(e.target.files[0]);
        }
    };

    // Premium Mock Data
    const getAssetsForCategory = () => {
        // ... (data generation logic)
        switch (selectedCategory) {
            case 'Binaural Beats':
                return [
                    { type: 'audio', name: 'Theta 4Hz Deep', duration: '10:00', size: '14MB' },
                    { type: 'audio', name: 'Alpha 10Hz Flow', duration: '15:00', size: '21MB' },
                    { type: 'audio', name: 'Delta Sleep Aid', duration: '20:00', size: '28MB' },
                    { type: 'audio', name: 'Gamma Focus', duration: '08:00', size: '11MB' },
                ] as const;
            case 'Visuals':
                return [
                    { type: 'video', name: 'Nebula Loop 4K', duration: '00:15', size: '45MB' },
                    { type: 'video', name: 'Gold Particles', duration: '00:10', size: '32MB' },
                    { type: 'image', name: 'Sacred Geometry', size: '2.4MB' },
                    { type: 'image', name: 'Manifestation', size: '3.1MB' },
                ] as const;
            case 'Favorites':
                return [
                    { type: 'audio', name: 'Wealth Mantra', duration: '02:00', size: '3MB' },
                    { type: 'video', name: 'Luxury Lifestyle', duration: '00:30', size: '85MB' },
                ] as const;
            case 'Stock Samples':
            default:
                return [
                    { type: 'audio', name: 'Rain Ambience', duration: '05:12', size: '7MB' },
                    { type: 'audio', name: 'Theta Waves', duration: '15:00', size: '21MB' },
                    { type: 'image', name: 'Deep Space', size: '2.4MB' },
                    { type: 'image', name: 'Ocean Mist', size: '1.8MB' },
                ] as const;
        }
    };

    const currentAssets = getAssetsForCategory();

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] border-r border-white/[0.04] font-sans">
            <input
                type="file"
                id="file-upload"
                className="hidden"
                accept="audio/*,video/*,image/*"
                onChange={handleFileSelect}
            />

            {/* Header / Actions - Premium Complex UI */}
            <div className="p-4 space-y-4 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-20 border-b border-white/[0.04]">
                {/* Import Block */}
                <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="w-full h-9 bg-white/[0.03] hover:bg-white/[0.08] text-gray-400 hover:text-white rounded-xl flex items-center justify-center gap-2 transition-all border border-white/[0.05] text-xs font-medium group"
                >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Import Assets</span>
                </motion.button>

                {/* Engine & Writer - Highly Detailed Complex Design */}
                {/* Engine & Writer */}
                <div className="flex flex-col gap-3">
                    {/* AI Engine - Red Accent */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenGenerators}
                        className="relative group w-full h-20 rounded-xl overflow-hidden border border-red-500/30 bg-[#141414] hover:border-red-500/50 transition-all duration-300 shadow-lg shadow-black/30"
                    >
                        {/* Subtle Red Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-red-900/10 to-transparent opacity-50" />

                        <div className="relative h-full px-5 flex items-center gap-4">
                            {/* Icon Box */}
                            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-red-500/20 transition-colors">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                >
                                    <svg className="w-6 h-6 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
                                    </svg>
                                </motion.div>
                            </div>

                            <div className="flex-1 text-left">
                                <div className="text-base font-semibold text-white">Engine</div>
                                <div className="text-xs text-gray-500">Audio Synthesis</div>
                            </div>

                            <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                <Plus className="w-4 h-4 text-red-500" />
                            </div>
                        </div>
                    </motion.button>

                    {/* AI Writer - White Accent (Consistent Style) */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenAffirmations}
                        className="relative group w-full h-20 rounded-xl overflow-hidden border border-white/15 bg-[#141414] hover:border-white/40 transition-all duration-300 shadow-lg shadow-black/30"
                    >
                        {/* Subtle White Gradient Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-50" />

                        <div className="relative h-full px-5 flex items-center gap-4">
                            {/* Icon Box */}
                            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>

                            <div className="flex-1 text-left">
                                <div className="text-base font-semibold text-white">Writer</div>
                                <div className="text-xs text-gray-500">Scripting Unit</div>
                            </div>

                            <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10">
                                <Plus className="w-4 h-4 text-white" />
                            </div>
                        </div>
                    </motion.button>
                </div>
            </div>

            {/* Navigation & Search */}
            <div className="px-5 py-4 space-y-4">
                {/* Search Bar - Refined */}
                <div className="relative group">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-red-500/30 focus:ring-1 focus:ring-red-500/20 transition-all shadow-inner"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Categories */}
                <div className="space-y-0.5">
                    <CategoryItem
                        icon={FolderOpen}
                        name="Stock Samples"
                        isActive={selectedCategory === 'Stock Samples'}
                        onClick={() => setSelectedCategory('Stock Samples')}
                    />
                    <CategoryItem
                        icon={Star}
                        name="Favorites"
                        isActive={selectedCategory === 'Favorites'}
                        onClick={() => setSelectedCategory('Favorites')}
                    />
                    <CategoryItem
                        icon={Music}
                        name="Binaural Beats"
                        isActive={selectedCategory === 'Binaural Beats'}
                        onClick={() => setSelectedCategory('Binaural Beats')}
                    />
                    <CategoryItem
                        icon={Film}
                        name="Visuals"
                        isActive={selectedCategory === 'Visuals'}
                        onClick={() => setSelectedCategory('Visuals')}
                    />
                </div>
            </div>

            {/* Content Divider */}
            <div className="h-px bg-white/[0.04] mx-4 mb-2" />

            {/* Assets Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                <div className="flex items-center justify-between mb-3 sticky top-0 bg-[#0a0a0a]/95 backdrop-blur py-2 z-10 border-b border-transparent">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedCategory}</span>
                    <span className="text-[10px] text-gray-600">{currentAssets.length} items</span>
                </div>

                <motion.div
                    layout
                    className="grid grid-cols-2 gap-3"
                >
                    <AnimatePresence mode="popLayout">
                        {currentAssets.map((asset, i) => (
                            <AssetCard
                                key={`${selectedCategory}-${i}`}
                                type={asset.type}
                                name={asset.name}
                                duration={(asset as any).duration}
                                size={(asset as any).size}
                                index={i}
                                isAdded={addedSamples.has(`${selectedCategory}-${asset.name}`)}
                                onClick={() => {
                                    if (onAddSampleToTimeline) {
                                        onAddSampleToTimeline(asset as StockSample);
                                        setAddedSamples(prev => new Set(prev).add(`${selectedCategory}-${asset.name}`));
                                    }
                                }}
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div >
    );
}

function CategoryItem({ icon: Icon, name, isActive, onClick }: { icon: any, name: string, isActive: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${isActive
                ? 'bg-blue-500/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                }`}
        >
            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
            {name}
        </button>
    )
}

function AssetCard({ type, name, duration, size, index, isAdded, onClick }: {
    type: 'audio' | 'video' | 'image',
    name: string,
    duration?: string,
    size?: string,
    index: number,
    isAdded?: boolean,
    onClick?: () => void
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -2 }}
            onClick={onClick}
            className={`group relative aspect-square bg-[#141414] rounded-xl border overflow-hidden cursor-pointer hover:shadow-lg transition-all ${isAdded
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-white/[0.04] hover:border-white/10'
                }`}
        >
            {/* Background Gradient/Image Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />

            {/* Icon */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${isAdded ? 'text-green-500/30' : 'text-[#2a2a2a] group-hover:text-white/20'
                }`}>
                {type === 'audio' && <Music className="w-10 h-10 stroke-1" />}
                {type === 'image' && <ImageIcon className="w-10 h-10 stroke-1" />}
                {type === 'video' && <Film className="w-10 h-10 stroke-1" />}
            </div>

            {/* Hover Play/Add Overlay */}
            {!isAdded && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Plus className="w-4 h-4" />
                    </div>
                </div>
            )}

            {/* Added Indicator */}
            {isAdded && (
                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-green-500/20 rounded text-[8px] font-bold text-green-400 uppercase">
                    Added
                </div>
            )}

            {/* Info Badge */}
            <div className="absolute bottom-0 inset-x-0 p-3">
                <div className={`text-[10px] font-medium truncate transition-colors ${isAdded ? 'text-green-300' : 'text-gray-300 group-hover:text-white'
                    }`}>{name}</div>
                <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-gray-600 font-mono tracking-wide">{type.toUpperCase()}</span>
                    {(duration || size) && (
                        <span className="text-[9px] text-gray-600 font-mono">
                            {duration ? duration : size}
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
