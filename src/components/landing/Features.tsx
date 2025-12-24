'use client';

import { motion } from 'framer-motion';
import { Layers, Activity, Radio, BrainCircuit } from 'lucide-react';
import CosmicCanvas from './CosmicCanvas';

const features = [
    {
        id: "ripple",
        title: "Subliminal Layering",
        desc: "Precision audio masking. Bypassing the critical faculty to imprint absolute truth directly onto the mind's canvas.",
        icon: <Layers className="w-6 h-6 text-white" fill="currentColor" />,
        // Using 'Layers' with fill for a solid, premium iOS app icon look
        className: "md:col-span-2",
        gradient: "from-cyan-500/20 to-blue-500/20"
    },
    {
        id: "helix",
        title: "Scalar Waves",
        desc: "Information beyond sound. Electromagnetic signatures that resonate with your cellular intent.",
        icon: <Activity className="w-6 h-6 text-white" strokeWidth={3} />,
        // Thicker stroke for 'Activity' to match Apple's bold iconography
        className: "",
        gradient: "from-blue-500/20 to-indigo-500/20"
    },
    {
        id: "constellation",
        title: "Morphic Resonance",
        desc: "Tap into the collective field. Align your bio-frequency with the reality you are choosing.",
        icon: <Radio className="w-6 h-6 text-white" strokeWidth={3} />,
        // 'Radio' looks like AirDrop/Field icons
        className: "",
        gradient: "from-indigo-500/20 to-violet-500/20"
    },
    {
        id: "synapse",
        title: "Neural Plasticity",
        desc: "Rewire the hardware. Physically restructure neural pathways for permanent cognitive shifts.",
        icon: <BrainCircuit className="w-6 h-6 text-white" />,
        // BrainCircuit is more technical/modern than generic Brain
        className: "md:col-span-2",
        gradient: "from-cyan-500/20 to-sky-500/20"
    }
];

export default function Features() {
    return (
        <section className="py-32 px-6 relative overflow-hidden">
            <div className="max-w-6xl mx-auto relative z-10">
                <div className="mb-24 max-w-3xl">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
                        Beyond <span className="text-cyan-400">Perception.</span>
                    </h2>
                    <p className="text-xl text-gray-400 leading-relaxed font-light">
                        The subconscious mind processes 11 million bits of information per second.
                        We built the language to speak to it directly. No filters. No resistance.
                        Just pure, targeted evolution.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <motion.div
                            key={f.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            whileHover={{ scale: 1.01 }}
                            className={`
                                group relative overflow-hidden rounded-3xl p-8 
                                border border-white/5 bg-[#080808]/80 backdrop-blur-xl
                                ${f.className}
                            `}
                        >
                            {/* Canvas-based Cosmic Animation */}
                            <CosmicCanvas type={f.id as 'ripple' | 'helix' | 'constellation' | 'synapse'} />

                            {/* Subtle Hover Gradient */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none`} />

                            {/* Apple-style Icon Container */}
                            <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-lg shadow-black/50 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                                {/* Inner glow for depth */}
                                <div className="absolute inset-0 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                {f.icon}
                            </div>

                            <div className="relative z-10 space-y-3">
                                <h3 className="text-2xl font-semibold text-white tracking-tight">{f.title}</h3>
                                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors font-light">
                                    {f.desc}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
