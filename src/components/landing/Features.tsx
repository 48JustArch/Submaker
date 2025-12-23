'use client';

import { motion } from 'framer-motion';
import { Waves, Zap, Mic2 } from 'lucide-react';

const features = [
    {
        title: "Subliminal Layer",
        desc: "Silent affirmations masked at -22dB. Bypasses critical logic filters.",
        icon: <Mic2 className="w-8 h-8 text-white" />,
        color: "bg-blue-500"
    },
    {
        title: "Morphic Resonance",
        desc: "Bio-electric field patterns that align with your specific intention.",
        icon: <Waves className="w-8 h-8 text-white" />,
        color: "bg-purple-500"
    },
    {
        title: "Scalar Waves",
        desc: "Zero-point energy modulation for instant information transfer.",
        icon: <Zap className="w-8 h-8 text-white" />,
        color: "bg-emerald-500"
    }
];

export default function Features() {
    return (
        <section className="py-32 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-20 max-w-2xl">
                    <h2 className="heading-xl mb-4 text-white">The Stack</h2>
                    <p className="text-body text-xl">
                        We don't just layer audio. We engineer consciousness.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="card-clean group relative overflow-hidden min-h-[400px] flex flex-col justify-between"
                        >
                            {/* Background Gradient on Hover */}
                            <div className={`absolute top-0 right-0 w-64 h-64 ${f.color} rounded-full blur-[100px] opacity-0 group-hover:opacity-20 transition-opacity duration-500`} />

                            <div className="relative z-10 p-4 border border-white/10 rounded-2xl w-fit mb-8 bg-white/5">
                                {f.icon}
                            </div>

                            <div className="relative z-10">
                                <h3 className="heading-lg mb-3 text-white">{f.title}</h3>
                                <p className="text-body">{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
