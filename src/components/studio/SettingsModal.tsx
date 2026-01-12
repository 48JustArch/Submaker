import { X, User, Sliders, Volume2, Check } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SidebarButton } from './settings/SidebarButton';
import AccountSettings from './settings/AccountSettings';
import GeneralSettings from './settings/GeneralSettings';
import AudioSettings from './settings/AudioSettings';

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
                                    <GeneralSettings />
                                )}

                                {activeTab === 'audio' && (
                                    <AudioSettings />
                                )}

                                {activeTab === 'account' && (
                                    <AccountSettings />
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


