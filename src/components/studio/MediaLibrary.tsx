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

interface MediaLibraryProps {
    onOpenAffirmations: () => void;
    onAddTrack: (file: File) => void;
}

export default function MediaLibrary({ onOpenAffirmations, onAddTrack }: MediaLibraryProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('Stock Samples');
    const [searchQuery, setSearchQuery] = useState('');

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onAddTrack(e.target.files[0]);
        }
    };

    // Premium Mock Data
    const getAssetsForCategory = () => {
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

            {/* Header / Actions */}
            <div className="p-4 space-y-3 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-10 border-b border-white/[0.04]">
                <div className="grid grid-cols-2 gap-2">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => document.getElementById('file-upload')?.click()}
                        className="h-9 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-lg flex items-center justify-center gap-2 transition-all border border-white/[0.06] text-xs font-medium"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Import</span>
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onOpenAffirmations}
                        className="h-9 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 hover:from-blue-600/20 hover:to-indigo-600/20 border border-blue-500/20 rounded-lg flex items-center justify-center gap-2 transition-all group"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 group-hover:rotate-12 transition-transform" />
                        <span className="text-xs font-medium text-blue-300">AI Writer</span>
                    </motion.button>
                </div>
            </div>

            {/* Navigation & Search */}
            <div className="px-4 py-3 space-y-4">
                {/* Search Bar */}
                <div className="relative group">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-gray-300 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search assets..."
                        className="w-full bg-[#141414] border border-white/[0.06] rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
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
                            />
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
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

function AssetCard({ type, name, duration, size, index }: { type: 'audio' | 'video' | 'image', name: string, duration?: string, size?: string, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -2 }}
            className="group relative aspect-square bg-[#141414] rounded-xl border border-white/[0.04] overflow-hidden cursor-pointer hover:border-white/10 hover:shadow-lg transition-all"
        >
            {/* Background Gradient/Image Placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent" />

            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center text-[#2a2a2a] group-hover:text-white/20 transition-all duration-300">
                {type === 'audio' && <Music className="w-10 h-10 stroke-1" />}
                {type === 'image' && <ImageIcon className="w-10 h-10 stroke-1" />}
                {type === 'video' && <Film className="w-10 h-10 stroke-1" />}
            </div>

            {/* Hover Play/Add Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                    <Plus className="w-4 h-4" />
                </div>
            </div>

            {/* Info Badge */}
            <div className="absolute bottom-0 inset-x-0 p-3">
                <div className="text-[10px] font-medium text-gray-300 truncate group-hover:text-white transition-colors">{name}</div>
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
