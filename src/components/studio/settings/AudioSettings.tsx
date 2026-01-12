'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Mic, FileAudio, Sliders, Activity } from 'lucide-react';

export default function AudioSettings() {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            {/* Playback Section */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Volume2 className="w-3 h-3" /> Playback & Monitoring
                </label>
                <div className="space-y-4 bg-[#141414] p-4 rounded-xl border border-white/[0.06]">
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400">Output Device</label>
                        <select className="w-full bg-black/50 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors">
                            <option>Default System Output</option>
                            <option>Headphones (External Audio)</option>
                            <option>Speakers (High Definition Audio)</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs text-gray-400">Master Volume</label>
                            <span className="text-xs text-blue-400 font-mono">100%</span>
                        </div>
                        <input type="range" className="w-full accent-blue-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    </div>

                    <ToggleItem label="Exclusive Mode" checked={false} description="Take exclusive control of audio device (Low Latency)" />
                </div>
            </div>

            {/* Recording Section */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Mic className="w-3 h-3" /> Recording
                </label>
                <div className="bg-[#141414] p-4 rounded-xl border border-white/[0.06] space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs text-gray-400">Input Device</label>
                        <select className="w-full bg-black/50 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-blue-500 transition-colors">
                            <option>Microphone (Realtek Audio)</option>
                            <option>Default System Input</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs text-gray-400">Input Gain</label>
                            <span className="text-xs text-blue-400 font-mono">+0 dB</span>
                        </div>
                        <input type="range" defaultValue={50} className="w-full accent-green-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <ToggleItem label="Echo Cancellation" checked={true} />
                        <ToggleItem label="Noise Suppression" checked={true} />
                    </div>
                </div>
            </div>

            {/* Export Defaults Section */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <FileAudio className="w-3 h-3" /> Export Defaults
                </label>
                <div className="bg-[#141414] rounded-xl border border-white/[0.06] divide-y divide-white/[0.04] overflow-hidden">
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-white">Default Format</div>
                            <div className="text-xs text-gray-500">Preferred file type for exports</div>
                        </div>
                        <div className="flex gap-1 bg-black/50 p-1 rounded-lg border border-white/5">
                            <button className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded shadow-sm">MP3</button>
                            <button className="px-3 py-1 text-gray-400 hover:text-white text-xs font-bold rounded hover:bg-white/5">WAV</button>
                            <button className="px-3 py-1 text-gray-400 hover:text-white text-xs font-bold rounded hover:bg-white/5">FLAC</button>
                        </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-white">Bitrate / Quality</div>
                            <div className="text-xs text-gray-500">Higher quality increases file size</div>
                        </div>
                        <select className="bg-black/50 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 outline-none focus:border-blue-500">
                            <option>320 kbps (High)</option>
                            <option>256 kbps (Medium)</option>
                            <option>128 kbps (Low)</option>
                        </select>
                    </div>
                    <div className="p-4">
                        <ToggleItem label="Normalize Audio" checked={true} description="Maximize volume without clipping" />
                    </div>
                </div>
            </div>

            {/* Latency / Advanced */}
            <div className="space-y-4">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3 h-3" /> Advanced
                </label>
                <div className="p-4 bg-[#141414] rounded-xl border border-white/[0.06] flex items-center justify-between">
                    <div>
                        <div className="text-sm font-medium text-white">Buffer Size</div>
                        <div className="text-xs text-gray-500">512 samples (11.6ms latency)</div>
                    </div>
                    <input type="range" min="64" max="2048" step="64" defaultValue="512" className="w-32 accent-purple-500 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer" />
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
            className="flex items-center justify-between py-2 cursor-pointer group"
        >
            <div>
                <span className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors block">{label}</span>
                {description && <span className="text-xs text-gray-500">{description}</span>}
            </div>
            <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 shrink-0 border border-transparent ${isOn ? 'bg-blue-600' : 'bg-gray-700 group-hover:bg-gray-600'}`}>
                <motion.div
                    animate={{ x: isOn ? 18 : 2 }}
                    className="absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow-sm"
                />
            </div>
        </div>
    )
}
