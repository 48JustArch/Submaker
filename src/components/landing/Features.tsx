'use client';

import { motion } from 'framer-motion';
import { Layers, Activity, Radio, BrainCircuit } from 'lucide-react';

const features = [
    {
        id: "ripple",
        title: "Subliminal Layering",
        desc: "Precision audio masking. Bypassing the critical faculty to imprint absolute truth directly onto the mind's canvas.",
        icon: <Layers className="w-6 h-6 text-white" />,
        className: "md:col-span-2",
    },
    {
        id: "helix",
        title: "Scalar Waves",
        desc: "Information beyond sound. Electromagnetic signatures that resonate with your cellular intent.",
        icon: <Activity className="w-6 h-6 text-white" />,
        className: "",
    },
    {
        id: "constellation",
        title: "Morphic Resonance",
        desc: "Tap into the collective field. Align your bio-frequency with the reality you are choosing.",
        icon: <Radio className="w-6 h-6 text-white" />,
        className: "",
    },
    {
        id: "synapse",
        title: "Neural Plasticity",
        desc: "Rewire the hardware. Physically restructure neural pathways for permanent cognitive shifts.",
        icon: <BrainCircuit className="w-6 h-6 text-white" />,
        className: "md:col-span-2",
    }
];

export default function Features() {
    return (
        <section className="py-32 px-6 relative overflow-hidden bg-[#030303]">
            <div className="max-w-6xl mx-auto relative z-10">
                <div className="mb-24 max-w-3xl">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-white">
                        Beyond <span className="text-gray-400">Perception.</span>
                    </h2>
                    <p className="text-xl text-gray-500 leading-relaxed font-light">
                        The subconscious mind processes 11 million bits of information per second.
                        We built the language to speak to it directly. No filters. No resistance.
                        Just pure, targeted evolution.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {features.map((f, i) => (
                        <motion.div
                            key={f.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className={`
                                group relative overflow-hidden rounded-2xl p-8 
                                border border-white/[0.08] bg-[#0a0a0a] 
                                hover:bg-[#0f0f0f] hover:border-white/[0.12] transition-all duration-300
                                ${f.className}
                            `}
                        >
                            {/* Simple icon container - Apple style */}
                            <div className="w-12 h-12 rounded-xl bg-white/[0.08] border border-white/[0.08] flex items-center justify-center mb-6">
                                {f.icon}
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-xl font-semibold text-white tracking-tight">{f.title}</h3>
                                <p className="text-gray-500 leading-relaxed text-sm">
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
