'use client';

import { X, User, Sliders, Volume2, Monitor, Check, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsModalProps {
    onClose: () => void;
    isOpen: boolean;
}

export default function SettingsModal({ onClose, isOpen }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'audio' | 'account'>('general');

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-[720px] h-[520px] bg-[#0a0a0a] rounded-2xl border border-white/[0.08] shadow-2xl overflow-hidden flex font-sans"
                    >
                        {/* Sidebar */}
                        <div className="w-60 bg-[#0f0f0f] border-r border-white/[0.06] p-4 flex flex-col gap-1">
                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-4 px-2 mt-2">Preferences</div>
                            <SidebarButton
                                active={activeTab === 'general'}
                                icon={Sliders}
                                label="General"
                                onClick={() => setActiveTab('general')}
                            />
                            <SidebarButton
                                active={activeTab === 'audio'}
                                icon={Volume2}
                                label="Audio & Video"
                                onClick={() => setActiveTab('audio')}
                            />
                            <div className="h-px bg-white/[0.04] my-2 mx-2" />
                            <SidebarButton
                                active={activeTab === 'account'}
                                icon={User}
                                label="Account"
                                onClick={() => setActiveTab('account')}
                            />
                        </div>

                        {/* Content */}
                        <div className="flex-1 flex flex-col bg-[#0a0a0a]">
                            <div className="h-20 border-b border-white/[0.06] flex items-center justify-between px-8 shrink-0 bg-[#0a0a0a]">
                                <div>
                                    <h2 className="text-lg font-bold text-white tracking-tight">
                                        {activeTab === 'general' && 'General Preferences'}
                                        {activeTab === 'audio' && 'Audio Configuration'}
                                        {activeTab === 'account' && 'Account Settings'}
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Customize your studio experience</p>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 space-y-8">
                                {activeTab === 'general' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Interface Theme</label>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-[#141414] p-4 rounded-xl border-2 border-blue-500 relative cursor-default cursor-pointer group">
                                                    <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                                    </div>
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-8 h-8 rounded-full bg-black border border-white/10" />
                                                        <span className="text-sm font-bold text-white">Dark Mode</span>
                                                    </div>
                                                    <div className="h-16 bg-[#0a0a0a] rounded-lg border border-white/5 opacity-50" />
                                                </div>
                                                <div className="bg-[#141414] p-4 rounded-xl border border-white/[0.04] opacity-50 cursor-not-allowed grayscale">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-8 h-8 rounded-full bg-white border border-gray-200" />
                                                        <span className="text-sm font-bold text-gray-400">Light Mode</span>
                                                    </div>
                                                    <div className="h-16 bg-white rounded-lg border border-gray-200 opacity-50" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Timeline Behavior</label>
                                            <div className="space-y-2">
                                                <ToggleItem label="Auto-scroll during playback" checked={true} />
                                                <ToggleItem label="Snap to grid when moving clips" checked={true} />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'audio' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Output Device</label>
                                            <select className="w-full bg-[#141414] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white focus:border-blue-500 outline-none transition-colors appearance-none cursor-pointer hover:border-white/10">
                                                <option>Default Output (System)</option>
                                                <option>Headphones (External)</option>
                                            </select>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Quality Settings</label>
                                            <div className="bg-[#141414] rounded-xl border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
                                                <div className="p-4 flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-medium text-white">Sample Rate</div>
                                                        <div className="text-xs text-gray-500">Audio playback resolution</div>
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">48 kHz</span>
                                                </div>
                                                <div className="p-4 flex items-center justify-between">
                                                    <div>
                                                        <div className="text-sm font-medium text-white">Buffer Size</div>
                                                        <div className="text-xs text-gray-500">Lower latency vs stability</div>
                                                    </div>
                                                    <span className="text-xs font-mono font-bold text-gray-400 bg-white/5 px-2 py-1 rounded">512 smp</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'account' && (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-full py-8 text-center space-y-6">
                                        <div className="relative">
                                            <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-white/10">
                                                <User className="w-10 h-10 text-white" />
                                            </div>
                                            <div className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full border-4 border-[#0a0a0a] flex items-center justify-center">
                                                <Check className="w-4 h-4 text-white" strokeWidth={3} />
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold text-white">Current User</h3>
                                            <p className="text-sm text-blue-400 font-medium">Pro Plan Active</p>
                                        </div>

                                        <button className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2 text-sm">
                                            Manage Subscription <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            <div className="p-6 border-t border-white/[0.06] flex justify-end gap-3 bg-[#0a0a0a]">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-3 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onClose}
                                    className="px-8 py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20 hover:shadow-blue-900/40 active:scale-[0.98]"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function SidebarButton({ active, icon: Icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`w-full text-left px-4 py-3 rounded-xl text-[13px] font-bold flex items-center gap-3 transition-all ${active
                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                : 'text-gray-500 hover:text-gray-200 hover:bg-white/[0.04] border border-transparent'
                }`}
        >
            <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-gray-500'}`} />
            {label}
        </button>
    )
}

function ToggleItem({ label, checked }: { label: string, checked: boolean }) {
    const [isOn, setIsOn] = useState(checked);
    return (
        <div
            onClick={() => setIsOn(!isOn)}
            className="flex items-center justify-between p-3 bg-[#141414] rounded-xl border border-white/[0.06] cursor-pointer hover:border-white/10 transition-colors"
        >
            <span className="text-sm font-medium text-gray-300">{label}</span>
            <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${isOn ? 'bg-blue-500' : 'bg-gray-700'}`}>
                <motion.div
                    animate={{ x: isOn ? 22 : 2 }}
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                />
            </div>
        </div>
    )
}
