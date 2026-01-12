'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Monitor, Clock, Zap, Layout, HelpCircle } from 'lucide-react';

export default function GeneralSettings() {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Interface Section */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Layout className="w-3 h-3" /> Interface
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#141414] p-4 rounded-xl border-2 border-blue-500 relative cursor-default cursor-pointer group">
                        <div className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-black border border-white/10" />
                            <span className="text-sm font-bold text-white">Dark Mode</span>
                        </div>
                        <div className="h-12 bg-[#0a0a0a] rounded-lg border border-white/5 opacity-50" />
                    </div>
                    <div className="bg-[#141414] p-4 rounded-xl border border-white/[0.04] opacity-50 cursor-not-allowed grayscale">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-white border border-gray-200" />
                            <span className="text-sm font-bold text-gray-400">Light Mode</span>
                        </div>
                        <div className="h-12 bg-white rounded-lg border border-gray-200 opacity-50" />
                    </div>
                </div>

                <div className="space-y-2 pt-2">
                    <ToggleItem label="Compact Mode" checked={false} description="Reduce padding for higher density" />
                    <ToggleItem label="Reduced Motion" checked={false} description="Minimize interface animations" />
                </div>
            </div>

            {/* Workflow Section */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Workflow
                </label>
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-[#141414] rounded-xl border border-white/[0.06]">
                        <div>
                            <div className="text-sm font-medium text-gray-300">Auto-Save Interval</div>
                            <div className="text-xs text-gray-500">How often to save your project</div>
                        </div>
                        <select className="bg-black/50 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 outline-none focus:border-blue-500">
                            <option>Every 5 minutes</option>
                            <option>Every 10 minutes</option>
                            <option>Every 15 minutes</option>
                            <option>Off</option>
                        </select>
                    </div>
                    <ToggleItem label="Show Tooltips" checked={true} description="Display helpful hints on hover" />
                    <ToggleItem label="Auto-scroll Timeline" checked={true} description="Follow playhead during playback" />
                    <ToggleItem label="Snap to Grid" checked={true} description="Align clips to measures/beats" />
                </div>
            </div>

            {/* System Section */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-3 h-3" /> System
                </label>
                <div className="space-y-2">
                    <ToggleItem label="Hardware Acceleration" checked={true} description="Use GPU for visual rendering" />

                    <div className="flex items-center justify-between p-3 bg-[#141414] rounded-xl border border-white/[0.06]">
                        <div>
                            <div className="text-sm font-medium text-gray-300">Cache Storage</div>
                            <div className="text-xs text-gray-500">Clear temporary files to free space</div>
                        </div>
                        <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/5 transition-colors">
                            Clear Cache
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

function ToggleItem({ label, checked, description }: { label: string, checked: boolean, description?: string }) {
    const [isOn, setIsOn] = useState(checked);
    return (
        <div
            onClick={() => setIsOn(!isOn)}
            className="flex items-center justify-between p-3 bg-[#141414] rounded-xl border border-white/[0.06] cursor-pointer hover:border-white/10 transition-colors"
        >
            <div>
                <span className="text-sm font-medium text-gray-300 block">{label}</span>
                {description && <span className="text-xs text-gray-500">{description}</span>}
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 shrink-0 ${isOn ? 'bg-blue-500' : 'bg-gray-700'}`}>
                <motion.div
                    animate={{ x: isOn ? 22 : 2 }}
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm"
                />
            </div>
        </div>
    )
}
