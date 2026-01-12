'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ghost, Zap, RotateCcw, Activity, Waves, Brain, Volume2, Music2, Sparkles } from 'lucide-react';

interface AudioGeneratorsProps {
    onClose: () => void;
    onAddTrack: (file: File) => void;
}

type GeneratorCategory = 'subliminal' | 'brainwave' | 'ambient' | 'healing';

interface GeneratorOption {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    apiType: string;
    preset?: string;
    frequency?: string;
    requiresText?: boolean;
}

const GENERATOR_CATEGORIES: { id: GeneratorCategory; name: string; icon: React.ReactNode; color: string }[] = [
    { id: 'subliminal', name: 'Subliminal', icon: <Ghost className="w-4 h-4" />, color: 'red' },
    { id: 'brainwave', name: 'Brainwave', icon: <Brain className="w-4 h-4" />, color: 'purple' },
    { id: 'ambient', name: 'Ambient', icon: <Volume2 className="w-4 h-4" />, color: 'cyan' },
    { id: 'healing', name: 'Healing', icon: <Sparkles className="w-4 h-4" />, color: 'amber' },
];

const GENERATORS: Record<GeneratorCategory, GeneratorOption[]> = {
    subliminal: [
        {
            id: 'spectral',
            name: 'Spectral Ghost',
            description: 'Encodes text into the visual spectrogram of audio. Hidden in frequencies.',
            icon: <Ghost className="w-5 h-5" />,
            apiType: 'spectral',
            requiresText: true,
        },
        {
            id: 'silent',
            name: 'Silent Subliminal',
            description: 'Ultrasonic modulation at 17.5kHz. Inaudible but perceived subconsciously.',
            icon: <Waves className="w-5 h-5" />,
            apiType: 'silent',
            requiresText: true,
        },
    ],
    brainwave: [
        {
            id: 'binaural_delta',
            name: 'Delta Waves',
            description: 'Deep sleep & healing (0.5-4 Hz). Use with headphones.',
            icon: <Brain className="w-5 h-5" />,
            apiType: 'binaural',
            preset: 'delta_sleep',
        },
        {
            id: 'binaural_theta',
            name: 'Theta Waves',
            description: 'Deep meditation & creativity (4-8 Hz). Use with headphones.',
            icon: <Brain className="w-5 h-5" />,
            apiType: 'binaural',
            preset: 'theta_meditation',
        },
        {
            id: 'binaural_alpha',
            name: 'Alpha Waves',
            description: 'Calm relaxation & focus (8-12 Hz). Use with headphones.',
            icon: <Brain className="w-5 h-5" />,
            apiType: 'binaural',
            preset: 'alpha_relaxation',
        },
        {
            id: 'binaural_beta',
            name: 'Beta Waves',
            description: 'Alertness & concentration (12-30 Hz). Use with headphones.',
            icon: <Brain className="w-5 h-5" />,
            apiType: 'binaural',
            preset: 'beta_focus',
        },
        {
            id: 'binaural_gamma',
            name: 'Gamma Waves',
            description: 'Peak performance & insight (30-100 Hz). Use with headphones.',
            icon: <Brain className="w-5 h-5" />,
            apiType: 'binaural',
            preset: 'gamma_insight',
        },
        {
            id: 'isochronic_alpha',
            name: 'Isochronic Alpha',
            description: 'Pulsating tones for alpha entrainment. Works without headphones.',
            icon: <Activity className="w-5 h-5" />,
            apiType: 'isochronic',
            preset: 'alpha_flow',
        },
    ],
    ambient: [
        {
            id: 'pink_noise',
            name: 'Pink Noise',
            description: 'Soothing, balanced noise. Great for focus and sleep.',
            icon: <Volume2 className="w-5 h-5" />,
            apiType: 'pink_noise',
        },
        {
            id: 'brown_noise',
            name: 'Brown Noise',
            description: 'Deep, rumbling noise like thunder. Deep relaxation.',
            icon: <Volume2 className="w-5 h-5" />,
            apiType: 'brown_noise',
        },
        {
            id: 'white_noise',
            name: 'White Noise',
            description: 'Equal energy at all frequencies. Classic masking sound.',
            icon: <Volume2 className="w-5 h-5" />,
            apiType: 'white_noise',
        },
    ],
    healing: [
        {
            id: 'solfeggio_528',
            name: '528 Hz - Love',
            description: 'DNA repair, miracles, transformation. "The Love Frequency".',
            icon: <Music2 className="w-5 h-5" />,
            apiType: 'solfeggio',
            frequency: '528',
        },
        {
            id: 'solfeggio_432',
            name: '432 Hz - Cosmic',
            description: 'Universal healing. Mathematically aligned with nature.',
            icon: <Music2 className="w-5 h-5" />,
            apiType: 'solfeggio',
            frequency: '432',
        },
        {
            id: 'solfeggio_396',
            name: '396 Hz - Liberation',
            description: 'Release guilt and fear. Root chakra activation.',
            icon: <Music2 className="w-5 h-5" />,
            apiType: 'solfeggio',
            frequency: '396',
        },
        {
            id: 'solfeggio_417',
            name: '417 Hz - Change',
            description: 'Facilitate change and cleansing. Sacral chakra.',
            icon: <Music2 className="w-5 h-5" />,
            apiType: 'solfeggio',
            frequency: '417',
        },
        {
            id: 'solfeggio_639',
            name: '639 Hz - Connection',
            description: 'Harmonizing relationships. Heart chakra.',
            icon: <Music2 className="w-5 h-5" />,
            apiType: 'solfeggio',
            frequency: '639',
        },
        {
            id: 'solfeggio_741',
            name: '741 Hz - Intuition',
            description: 'Awakening intuition. Throat chakra.',
            icon: <Music2 className="w-5 h-5" />,
            apiType: 'solfeggio',
            frequency: '741',
        },
        {
            id: 'solfeggio_852',
            name: '852 Hz - Spirit',
            description: 'Return to spiritual order. Third eye chakra.',
            icon: <Music2 className="w-5 h-5" />,
            apiType: 'solfeggio',
            frequency: '852',
        },
        {
            id: 'solfeggio_963',
            name: '963 Hz - Divine',
            description: 'Divine consciousness, pineal activation. Crown chakra.',
            icon: <Music2 className="w-5 h-5" />,
            apiType: 'solfeggio',
            frequency: '963',
        },
    ],
};

export default function AudioGenerators({ onClose, onAddTrack }: AudioGeneratorsProps) {
    const [category, setCategory] = useState<GeneratorCategory>('subliminal');
    const [selectedGenerator, setSelectedGenerator] = useState<GeneratorOption | null>(null);
    const [text, setText] = useState('');
    const [duration, setDuration] = useState(60);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!selectedGenerator) return;
        if (selectedGenerator.requiresText && !text.trim()) return;

        setIsGenerating(true);
        setError(null);

        // Rate Limit Check
        try {
            const rlRes = await fetch('/api/security/rate-limit', {
                method: 'POST',
                body: JSON.stringify({ action: 'generate' })
            });
            if (!rlRes.ok) {
                const data = await rlRes.json();
                throw new Error(data.error || 'Rate limit exceeded');
            }
        } catch (err: any) {
            setError(err.message);
            setIsGenerating(false);
            return;
        }

        try {
            const res = await fetch('/api/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: selectedGenerator.apiType,
                    text: selectedGenerator.requiresText ? text : undefined,
                    duration,
                    preset: selectedGenerator.preset,
                    frequency: selectedGenerator.frequency,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.details || 'Generation failed');
            }

            const blob = await res.blob();
            const file = new File([blob], `${selectedGenerator.name.replace(/\s+/g, '_')}.wav`, { type: 'audio/wav' });

            onAddTrack(file);
            onClose();

        } catch (e: any) {
            console.error(e);
            setError(e.message || 'Failed to generate audio');
        } finally {
            setIsGenerating(false);
        }
    };

    const getCategoryColor = (cat: GeneratorCategory) => {
        switch (cat) {
            case 'subliminal': return 'red';
            case 'brainwave': return 'purple';
            case 'ambient': return 'cyan';
            case 'healing': return 'amber';
            default: return 'gray';
        }
    };

    const color = getCategoryColor(category);

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
                    className="relative w-[700px] max-h-[85vh] overflow-hidden rounded-2xl bg-[#0a0a0a] shadow-2xl border border-white/[0.08] font-sans flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#0f0f0f]">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20`}>
                                <Activity className={`w-4 h-4 text-${color}-400`} />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Audio Engine</h2>
                                <p className="text-[10px] text-gray-500">Advanced Audio Generation</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Category Tabs */}
                    <div className="flex border-b border-white/[0.06] bg-[#0c0c0c]">
                        {GENERATOR_CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => {
                                    setCategory(cat.id);
                                    setSelectedGenerator(null);
                                }}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all border-b-2 ${category === cat.id
                                    ? `text-${cat.color}-400 border-${cat.color}-500`
                                    : 'text-gray-500 border-transparent hover:text-gray-300'
                                    }`}
                            >
                                {cat.icon}
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Generator Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            {GENERATORS[category].map(gen => (
                                <button
                                    key={gen.id}
                                    onClick={() => setSelectedGenerator(gen)}
                                    className={`p-4 rounded-xl border text-left transition-all ${selectedGenerator?.id === gen.id
                                        ? `border-${color}-500/50 bg-${color}-500/10`
                                        : 'border-white/[0.06] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]'
                                        }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-lg ${selectedGenerator?.id === gen.id ? `bg-${color}-500/20 text-${color}-400` : 'bg-white/5 text-gray-400'}`}>
                                            {gen.icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-white truncate">{gen.name}</div>
                                            <div className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{gen.description}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Selected Generator Options */}
                        <AnimatePresence mode="wait">
                            {selectedGenerator && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="space-y-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-white">{selectedGenerator.name}</h3>
                                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-${color}-500/20 text-${color}-400`}>
                                            {category.toUpperCase()}
                                        </div>
                                    </div>

                                    {/* Text Input (for subliminal types) */}
                                    {selectedGenerator.requiresText && (
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1.5 block">Intention / Text</label>
                                            <textarea
                                                value={text}
                                                onChange={(e) => setText(e.target.value)}
                                                placeholder="Enter your affirmation or intention..."
                                                className={`w-full h-24 bg-[#141414] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-${color}-500 transition-all resize-none`}
                                            />
                                        </div>
                                    )}

                                    {/* Duration Slider */}
                                    <div>
                                        <div className="flex justify-between mb-1.5">
                                            <label className="text-[10px] uppercase font-bold text-gray-500">Duration</label>
                                            <span className="text-[10px] font-mono text-gray-400">{duration}s ({Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')})</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="10"
                                            max="300"
                                            step="10"
                                            value={duration}
                                            onChange={(e) => setDuration(Number(e.target.value))}
                                            className={`w-full accent-${color}-500 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer`}
                                        />
                                        <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                                            <span>10s</span>
                                            <span>5 min</span>
                                        </div>
                                    </div>

                                    {/* Error */}
                                    {error && (
                                        <div className="p-3 bg-red-500/10 rounded-lg text-red-400 text-xs flex items-center gap-2 border border-red-500/20">
                                            <Zap className="w-3 h-3" /> {error}
                                        </div>
                                    )}

                                    {/* Generate Button */}
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isGenerating || (selectedGenerator.requiresText && !text.trim())}
                                        className={`w-full py-3.5 rounded-xl bg-${color}-600 hover:bg-${color}-500 disabled:bg-[#1a1a1a] disabled:text-gray-600 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg`}
                                    >
                                        {isGenerating ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                                        <span>{isGenerating ? 'Generating...' : 'Generate Audio'}</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {!selectedGenerator && (
                            <div className="text-center text-gray-500 text-sm py-8">
                                Select a generator to configure options
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
