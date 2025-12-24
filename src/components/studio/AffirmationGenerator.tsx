'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, RotateCcw, Check, AudioLines, ArrowRight, CheckCircle2, Circle } from 'lucide-react';

interface AffirmationGeneratorProps {
    onClose: () => void;
    onAddTrack: (file: File) => void;
}

export default function AffirmationGenerator({ onClose, onAddTrack }: AffirmationGeneratorProps) {
    const [topic, setTopic] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [affirmations, setAffirmations] = useState<string[]>([]);
    const [selectedAffirmations, setSelectedAffirmations] = useState<Set<number>>(new Set());
    const [voiceGender, setVoiceGender] = useState<'male' | 'female'>('female');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleSelection = (index: number) => {
        const newSet = new Set(selectedAffirmations);
        if (newSet.has(index)) newSet.delete(index);
        else newSet.add(index);
        setSelectedAffirmations(newSet);
    };

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setIsGenerating(true);
        setError(null);
        setAffirmations([]);
        setSelectedAffirmations(new Set());

        try {
            const res = await fetch('/api/affirmations/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic }),
            });
            const data = await res.json();
            if (data.affirmations) {
                setAffirmations(data.affirmations);
                setSelectedAffirmations(new Set(data.affirmations.map((_: any, i: number) => i)));
            } else {
                throw new Error('Failed to generate affirmations');
            }
        } catch (error) {
            console.error(error);
            setError('Could not generate text. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConvertToAudio = async () => {
        const selectedText = affirmations.filter((_, i) => selectedAffirmations.has(i)).join('. ');
        if (!selectedText) return;

        setIsProcessing(true);
        setError(null);

        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: selectedText,
                    voice: voiceGender
                })
            });

            if (!response.ok) throw new Error('TTS Generation Failed');

            const blob = await response.blob();
            const file = new File([blob], `${topic.replace(/\s+/g, '-')}-affirmations.mp3`, { type: 'audio/mpeg' });

            onAddTrack(file);
            onClose();

        } catch (e) {
            console.error(e);
            setError('Audio generation failed. Please try a shorter selection.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl"
            >
                {/* Main Card -- Simplified Apple Aesthetic */}
                <motion.div
                    initial={{ scale: 0.98, opacity: 0, y: 5 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.98, opacity: 0, y: 5 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                    className="relative w-full max-w-[500px] overflow-hidden rounded-[24px] bg-[#1e1e1e] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] border border-white/5 font-sans"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#2c2c2e] flex items-center justify-center">
                                <Bot className="w-4 h-4 text-white" strokeWidth={1.5} />
                            </div>
                            <h2 className="text-[15px] font-medium text-white tracking-tight">Affirmation Engine</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-full bg-[#2c2c2e] hover:bg-[#3a3a3c] flex items-center justify-center transition-colors"
                        >
                            <X className="w-3.5 h-3.5 text-gray-400 hover:text-white" strokeWidth={2} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        {affirmations.length === 0 ? (
                            // Input State
                            <div className="space-y-6 py-4">
                                <div className="space-y-3">
                                    <label className="text-[13px] font-medium text-gray-400 ml-1">
                                        What is your manifestation goal?
                                    </label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={topic}
                                            onChange={(e) => setTopic(e.target.value)}
                                            placeholder="e.g. Wealth, Confidence, Healing..."
                                            className="w-full bg-[#2c2c2e] border border-transparent focus:border-[#007AFF]/50 rounded-[14px] pl-4 pr-12 py-3.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-4 focus:ring-[#007AFF]/10 transition-all text-[15px]"
                                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                            autoFocus
                                        />
                                        <button
                                            onClick={handleGenerate}
                                            disabled={!topic.trim() || isGenerating}
                                            className={`absolute right-2 top-2 bottom-2 aspect-square rounded-[10px] flex items-center justify-center transition-all ${topic.trim() ? 'bg-[#007AFF] text-white hover:bg-[#0062cc]' : 'bg-transparent text-gray-600'
                                                }`}
                                        >
                                            {isGenerating ? (
                                                <RotateCcw className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <ArrowRight className="w-4 h-4" strokeWidth={2.5} />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Suggested Chips */}
                                <div className="flex flex-wrap gap-2">
                                    {['Lucid Dreaming', 'Attraction', 'Weight Loss'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTopic(t)}
                                            className="px-3 py-1.5 rounded-full bg-[#2c2c2e] hover:bg-[#3a3a3c] text-[13px] text-gray-300 transition-colors"
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            // Results State
                            <div className="flex flex-col gap-5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[13px] font-medium text-gray-400">
                                        {affirmations.length} Affirmations Generated
                                    </span>
                                    <button
                                        onClick={handleGenerate}
                                        className="text-[13px] text-[#007AFF] hover:text-[#409cff] flex items-center gap-1.5 transition-colors font-medium"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" /> Retry
                                    </button>
                                </div>

                                {/* List */}
                                <div className="bg-[#252525] rounded-[18px] overflow-hidden max-h-[280px] overflow-y-auto border border-white/[0.03]">
                                    {affirmations.map((text, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => toggleSelection(idx)}
                                            className="w-full text-left flex items-start gap-3.5 p-4 hover:bg-[#2c2c2e] transition-colors border-b border-white/[0.03] last:border-0 group"
                                        >
                                            <div className={`mt-0.5 shrink-0 ${selectedAffirmations.has(idx) ? 'text-[#007AFF]' : 'text-gray-600'}`}>
                                                {selectedAffirmations.has(idx) ? (
                                                    <CheckCircle2 className="w-5 h-5 fill-current" />
                                                ) : (
                                                    <Circle className="w-5 h-5 text-gray-600 group-hover:text-gray-500" />
                                                )}
                                            </div>
                                            <span className={`text-[14px] leading-relaxed transition-colors ${selectedAffirmations.has(idx) ? 'text-white' : 'text-gray-400'}`}>
                                                {text}
                                            </span>
                                        </button>
                                    ))}
                                </div>

                                {/* Voice Control */}
                                <div className="bg-[#252525] p-1 rounded-[12px] flex">
                                    {(['female', 'male'] as const).map((gender) => (
                                        <button
                                            key={gender}
                                            onClick={() => setVoiceGender(gender)}
                                            className={`flex-1 py-2 rounded-[10px] text-[13px] font-medium transition-all ${voiceGender === gender
                                                    ? 'bg-[#3a3a3c] text-white shadow-sm'
                                                    : 'text-gray-500 hover:text-gray-400'
                                                }`}
                                        >
                                            {gender.charAt(0).toUpperCase() + gender.slice(1)} Voice
                                        </button>
                                    ))}
                                </div>

                                {/* Main Action */}
                                <button
                                    onClick={handleConvertToAudio}
                                    disabled={selectedAffirmations.size === 0 || isProcessing}
                                    className="w-full py-3.5 rounded-[14px] bg-[#007AFF] hover:bg-[#0062cc] disabled:bg-[#2c2c2e] disabled:text-gray-500 text-white font-medium text-[15px] transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/10 active:scale-[0.98]"
                                >
                                    {isProcessing ? (
                                        <RotateCcw className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <AudioLines className="w-4 h-4" />
                                    )}
                                    <span>Generate Audio Layer</span>
                                </button>

                                {error && (
                                    <div className="text-center text-red-400 text-[13px] mt-2">
                                        {error}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
