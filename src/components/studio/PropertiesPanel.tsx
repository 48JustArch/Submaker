import {
    Settings2,
    Volume2,
    Zap,
    Trash2,
    Mic2,
    Sliders,
    Layers,
    Activity,
    Maximize2
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Track, formatTime } from '@/components/studio/types';

interface PropertiesPanelProps {
    selectedTrack?: Track;
    onUpdateTrack?: (id: string, updates: Partial<Track>) => void;
    onDeleteTrack?: (id: string) => void;
}

export default function PropertiesPanel({ selectedTrack, onUpdateTrack, onDeleteTrack }: PropertiesPanelProps) {
    const [activeTab, setActiveTab] = useState<'track' | 'master'>('track');

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a] font-sans border-l border-white/[0.04]">
            {/* Tab Switcher */}
            <div className="flex border-b border-white/[0.04] bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-10">
                <button
                    onClick={() => setActiveTab('track')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest relative transition-all ${activeTab === 'track' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Track Properties
                    {activeTab === 'track' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_-2px_8px_rgba(59,130,246,0.5)]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('master')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest relative transition-all ${activeTab === 'master' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Master Output
                    {activeTab === 'master' && (
                        <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 shadow-[0_-2px_8px_rgba(99,102,241,0.5)]" />
                    )}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 relative">
                <AnimatePresence mode="wait">
                    {activeTab === 'track' ? (
                        <motion.div
                            key="track"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-8"
                        >
                            {selectedTrack ? (
                                <>
                                    {/* Track Header Info */}
                                    <div className="space-y-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-lg border border-white/5 ${selectedTrack.type === 'audio' ? 'bg-blue-500/10 text-blue-400' : 'bg-indigo-500/10 text-indigo-400'
                                                    }`}>
                                                    {selectedTrack.type === 'audio' ? <Mic2 className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-white truncate max-w-[140px] leading-tight mb-1" title={selectedTrack.name}>
                                                        {selectedTrack.name}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400 uppercase font-mono tracking-wider">
                                                            {selectedTrack.type}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 font-mono">
                                                            ID: {selectedTrack.id.slice(0, 4)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => onDeleteTrack?.(selectedTrack.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors border border-transparent hover:border-red-500/20"
                                                    title="Delete Track"
                                                >
                                                    <Trash2 className="w-4 h-4 text-inherit" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Time Stats */}
                                        <div className="grid grid-cols-2 gap-3 text-[10px] font-mono">
                                            <div className="bg-[#141414] p-3 rounded-lg border border-white/[0.04] hover:border-white/[0.1] transition-colors">
                                                <div className="text-gray-500 mb-1 flex items-center gap-1.5"><Activity className="w-3 h-3" /> START</div>
                                                <div className="text-white text-sm font-medium">{formatTime(selectedTrack.startTime || 0)}</div>
                                            </div>
                                            <div className="bg-[#141414] p-3 rounded-lg border border-white/[0.04] hover:border-white/[0.1] transition-colors">
                                                <div className="text-gray-500 mb-1 flex items-center gap-1.5"><Maximize2 className="w-3 h-3" /> DURATION</div>
                                                <div className="text-white text-sm font-medium">{formatTime(selectedTrack.duration || 0)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-white/[0.04]" />

                                    {/* Mixer Controls */}
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 uppercase tracking-wide">
                                                <Sliders className="w-3.5 h-3.5" />
                                                <span>Mixer Channel</span>
                                            </div>
                                            <motion.div
                                                key={selectedTrack.volume}
                                                initial={{ scale: 1.2, color: '#fff' }}
                                                animate={{ scale: 1, color: '#3b82f6' }}
                                                className="text-[10px] font-mono font-bold"
                                            >
                                                {Math.round(selectedTrack.volume * 100)}%
                                            </motion.div>
                                        </div>

                                        <div className="bg-[#141414] p-4 rounded-xl border border-white/[0.04] space-y-4">
                                            {/* Volume Slider - Vertical Feel */}
                                            <div className="space-y-3">
                                                <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                                                    <span>-inf</span>
                                                    <span>0dB</span>
                                                    <span>+6dB</span>
                                                </div>
                                                <div className="relative h-8 flex items-center group">
                                                    <div className="absolute inset-0 bg-[#0a0a0a] rounded-md border border-white/5 overflow-hidden">
                                                        <motion.div
                                                            layout
                                                            className="h-full bg-gradient-to-r from-blue-900/50 to-blue-500"
                                                            style={{ width: `${selectedTrack.volume * 100}%` }}
                                                        />
                                                    </div>
                                                    <input
                                                        type="range"
                                                        min="0"
                                                        max="1"
                                                        step="0.01"
                                                        value={selectedTrack.volume}
                                                        onChange={(e) => onUpdateTrack?.(selectedTrack.id, { volume: Number(e.target.value) })}
                                                        className="w-full absolute opacity-0 cursor-pointer h-full z-10"
                                                    />

                                                    {/* Knob */}
                                                    <div className="pointer-events-none absolute h-5 w-1.5 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all group-hover:h-6 group-hover:w-2"
                                                        style={{ left: `calc(${selectedTrack.volume * 100}% - 3px)` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Pan Control (Mock) */}
                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-[10px] text-gray-500 font-medium">PAN L/R</span>
                                                <div className="w-32 h-1 bg-white/10 rounded-full relative">
                                                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full hover:bg-white hover:scale-125 transition-all cursor-pointer" />
                                                </div>
                                                <span className="text-[10px] text-gray-500 font-medium font-mono">C</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="h-px bg-white/[0.04]" />

                                    {/* Effects Stack */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                                                <Zap className="w-3.5 h-3.5 text-amber-400" /> Effects Chain
                                            </span>

                                            <div className="relative group/add">
                                                <button className="text-[10px] bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-lg transition-all text-gray-300 hover:text-white font-medium flex items-center gap-1.5">
                                                    + Add Effect
                                                </button>

                                                <div className="absolute right-0 top-full mt-2 w-40 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden hidden group-hover/add:block z-30 ring-1 ring-black">
                                                    <div className="py-1">
                                                        {['Reverb', 'Delay', 'Echo', 'Chorus', 'Subliminal Mask'].map((effectName) => (
                                                            <button
                                                                key={effectName}
                                                                onClick={() => {
                                                                    const newEffect = { id: Date.now().toString(), name: effectName, active: true };
                                                                    const updatedEffects = [...(selectedTrack.effects || []), newEffect];
                                                                    onUpdateTrack?.(selectedTrack.id, { effects: updatedEffects });
                                                                }}
                                                                className="w-full text-left px-4 py-2 text-[11px] text-gray-400 hover:bg-blue-500 hover:text-white transition-colors flex items-center justify-between group/item"
                                                            >
                                                                {effectName}
                                                                <span className="opacity-0 group-hover/item:opacity-100">+</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2.5">
                                            <AnimatePresence>
                                                {(selectedTrack.effects && selectedTrack.effects.length > 0) ? (
                                                    selectedTrack.effects.map((effect, index) => (
                                                        <motion.div
                                                            key={effect.id}
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                        >
                                                            <EffectItem
                                                                name={effect.name}
                                                                active={effect.active}
                                                                onToggle={() => {
                                                                    const updatedEffects = [...(selectedTrack.effects || [])];
                                                                    updatedEffects[index] = { ...effect, active: !effect.active };
                                                                    onUpdateTrack?.(selectedTrack.id, { effects: updatedEffects });
                                                                }}
                                                                onDelete={() => {
                                                                    const updatedEffects = selectedTrack.effects?.filter(e => e.id !== effect.id);
                                                                    onUpdateTrack?.(selectedTrack.id, { effects: updatedEffects });
                                                                }}
                                                            />
                                                        </motion.div>
                                                    ))
                                                ) : (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="flex flex-col items-center justify-center py-8 border border-dashed border-white/5 rounded-xl bg-white/[0.01]"
                                                    >
                                                        <span className="text-[10px] text-gray-600 mb-1">No effects applied</span>
                                                        <span className="text-[9px] text-gray-700">Add an effect to shape the sound</span>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4 px-6">
                                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-white/[0.03] to-transparent flex items-center justify-center border border-white/[0.04] shadow-inner">
                                        <Settings2 className="w-8 h-8 text-gray-700 stroke-1" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-400">No Selection</h3>
                                        <p className="text-xs text-gray-600 mt-1">Select a track to view properties</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="master"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-6"
                        >
                            <div className="p-5 bg-gradient-to-b from-[#141414] to-[#0a0a0a] rounded-2xl border border-white/[0.06] shadow-xl text-center space-y-6 relative overflow-hidden">
                                <Activity className="w-96 h-96 absolute -top-20 -right-20 text-white/[0.02]" />

                                <div className="relative z-10 flex items-center justify-between">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Master Level</div>
                                    <div className="text-[10px] font-mono text-indigo-400">-3.2 dB</div>
                                </div>

                                <div className="flex justify-center gap-3 h-40 relative z-10">
                                    {['L', 'R'].map((channel, i) => (
                                        <div key={channel} className="flex flex-col items-center gap-2">
                                            <div className="w-6 bg-[#050505] rounded-full relative overflow-hidden border border-white/[0.1] h-full shadow-inner">
                                                {/* Grid Lines */}
                                                <div className="absolute inset-0 flex flex-col justify-between p-1 opacity-20 pointer-events-none z-20">
                                                    {[...Array(10)].map((_, i) => <div key={i} className="h-px bg-white w-full" />)}
                                                </div>

                                                <motion.div
                                                    animate={{ height: `${60 + Math.random() * 25}%` }}
                                                    transition={{ type: 'spring', bounce: 0.5 }}
                                                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-emerald-500 via-yellow-500 to-red-500 opacity-90 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                                                />
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-600">{channel}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">Export Configuration</h4>
                                <div className="bg-[#141414] p-4 rounded-xl border border-white/[0.06] space-y-3 hover:border-white/[0.1] transition-colors group">
                                    <div className="flex justify-between text-xs items-center border-b border-white/[0.04] pb-2">
                                        <span className="text-gray-500">Format</span>
                                        <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded">WAV 24-bit</span>
                                    </div>
                                    <div className="flex justify-between text-xs items-center">
                                        <span className="text-gray-500">Sample Rate</span>
                                        <span className="text-white font-medium bg-white/5 px-2 py-0.5 rounded">48 kHz</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function EffectItem({ name, active, onToggle, onDelete }: { name: string, active: boolean, onToggle: () => void, onDelete: () => void }) {
    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 group ${active
            ? 'bg-[#141414] border-blue-500/30'
            : 'bg-[#0a0a0a] border-white/[0.04] opacity-70 grayscale'
            }`}>
            <div className="flex items-center gap-3 cursor-pointer select-none flex-1" onClick={onToggle}>
                {/* Custom Toggle Switch */}
                <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${active ? 'bg-blue-500' : 'bg-gray-700'}`}>
                    <motion.div
                        className="absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
                        animate={{ left: active ? 'calc(100% - 14px)' : '2px' }}
                    />
                </div>
                <span className={`text-xs font-medium ${active ? 'text-white' : 'text-gray-500'}`}>{name}</span>
            </div>

            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                <button
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                >
                    <Settings2 className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    )
}
