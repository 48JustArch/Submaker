'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw, AudioLines, ArrowRight, CheckCircle2, Circle, Sparkles, Wand2, AlertTriangle, AlertCircle } from 'lucide-react';

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

    const TTS_CHAR_LIMIT = 300;
    const selectedText = useMemo(() => {
        return affirmations.filter((_, i) => selectedAffirmations.has(i)).join('. ');
    }, [affirmations, selectedAffirmations]);

    const charCount = selectedText.length;
    const isNearLimit = charCount > TTS_CHAR_LIMIT * 0.7 && charCount <= TTS_CHAR_LIMIT;
    const isOverLimit = charCount > TTS_CHAR_LIMIT;

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
                setSelectedAffirmations(new Set(data.affirmations.map((_: string, i: number) => i)));
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
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    className="relative w-[520px] overflow-hidden rounded-2xl bg-[#0a0a0a] shadow-2xl border border-white/[0.08] font-sans"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#0f0f0f]">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                                <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Magic Writer</h2>
                                <p className="text-[10px] text-gray-500">AI-Powered Affirmation Engine</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <AnimatePresence mode="wait">
                            {affirmations.length === 0 ? (
                                <motion.div
                                    key="input"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-8"
                                >
                                    <div className="text-center space-y-3 py-4">
                                        <div className="w-16 h-16 bg-gradient-to-tr from-white/10 to-gray-500/10 rounded-full flex items-center justify-center mx-auto border border-white/10 shadow-inner">
                                            <Wand2 className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-medium text-white">What do you want to manifest?</h3>
                                            <p className="text-xs text-gray-500">Our AI will craft personalized affirmations for your subliminal.</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={topic}
                                                onChange={(e) => setTopic(e.target.value)}
                                                placeholder="e.g. Unshakable Confidence, Wealth..."
                                                className="w-full bg-[#141414] border border-white/10 rounded-xl px-4 py-4 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-white transition-all shadow-sm focus:shadow-lg focus:shadow-white/10"
                                                onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                                                autoFocus
                                            />
                                            <button
                                                onClick={handleGenerate}
                                                disabled={!topic.trim() || isGenerating}
                                                className={`absolute right-2 top-2 bottom-2 aspect-square rounded-lg flex items-center justify-center transition-all ${topic.trim() ? 'bg-white text-black shadow-lg shadow-white/20 hover:scale-105 active:scale-95' : 'bg-transparent text-gray-600'
                                                    }`}
                                            >
                                                {isGenerating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                            </button>
                                        </div>

                                        <div className="flex flex-wrap justify-center gap-2">
                                            {['Lucid Dreaming', 'Deep Healing', 'Wealth Mindset', 'Charisma'].map(t => (
                                                <button
                                                    key={t}
                                                    onClick={() => setTopic(t)}
                                                    className="px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] font-medium text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="flex flex-col h-[400px]"
                                >
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            Generated Affirmations
                                        </span>
                                        <button
                                            onClick={handleGenerate}
                                            className="text-[11px] text-gray-400 hover:text-white flex items-center gap-1.5 transition-colors font-medium px-2 py-1 rounded hover:bg-white/10"
                                        >
                                            <RotateCcw className="w-3 h-3" /> Regenerate
                                        </button>
                                    </div>

                                    {/* List */}
                                    <div className="flex-1 bg-[#141414] rounded-xl overflow-hidden overflow-y-auto w-full border border-white/[0.06] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                                        {affirmations.map((text, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => toggleSelection(idx)}
                                                className={`w-full text-left flex items-start gap-4 p-4 hover:bg-white/[0.02] transition-colors border-b border-white/[0.04] last:border-0 group select-none ${selectedAffirmations.has(idx) ? 'bg-white/[0.05]' : ''
                                                    }`}
                                            >
                                                <div className={`mt-0.5 shrink-0 transition-transform duration-200 ${selectedAffirmations.has(idx) ? 'scale-110' : 'scale-100'}`}>
                                                    {selectedAffirmations.has(idx) ? (
                                                        <CheckCircle2 className="w-5 h-5 text-white fill-white/20" />
                                                    ) : (
                                                        <Circle className="w-5 h-5 text-gray-600 group-hover:text-gray-400" strokeWidth={1.5} />
                                                    )}
                                                </div>
                                                <span className={`text-sm leading-relaxed transition-colors ${selectedAffirmations.has(idx) ? 'text-white font-medium' : 'text-gray-400'}`}>
                                                    {text}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-4 space-y-4">
                                        {/* Warning */}
                                        <AnimatePresence>
                                            {(isNearLimit || isOverLimit) && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className={`px-3 py-2 rounded-lg text-[11px] flex items-center gap-2 border ${isOverLimit ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                                                        }`}
                                                >
                                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                                    {isOverLimit ? `Character limit exceeded (${charCount}/${TTS_CHAR_LIMIT}). Text will be truncated.` : `Approaching character limit (${charCount}/${TTS_CHAR_LIMIT}).`}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="flex gap-3">
                                            <div className="w-32 bg-[#141414] p-1 rounded-xl flex border border-white/[0.06]">
                                                {(['female', 'male'] as const).map((gender) => (
                                                    <button
                                                        key={gender}
                                                        onClick={() => setVoiceGender(gender)}
                                                        className={`flex-1 py-2 rounded-lg text-[10px] uppercase font-bold transition-all ${voiceGender === gender
                                                            ? 'bg-white/[0.08] text-white shadow-sm'
                                                            : 'text-gray-500 hover:text-gray-300'
                                                            }`}
                                                    >
                                                        {gender}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                onClick={handleConvertToAudio}
                                                disabled={selectedAffirmations.size === 0 || isProcessing}
                                                className="flex-1 rounded-xl bg-white hover:bg-gray-200 disabled:bg-[#1a1a1a] disabled:text-gray-600 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-white/10"
                                            >
                                                {isProcessing ? <RotateCcw className="w-4 h-4 animate-spin" /> : <AudioLines className="w-4 h-4" />}
                                                <span>Generate Audio Layer</span>
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {error && (
                            <div className="mt-4 p-3 bg-red-500/10 rounded-lg text-red-400 text-xs flex items-center gap-2 border border-red-500/20">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
