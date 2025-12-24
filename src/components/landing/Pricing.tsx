'use client';

import { motion } from 'framer-motion';
import { Check, Sparkles } from 'lucide-react';

const plans = [
    {
        name: 'Starter',
        price: '0',
        desc: 'For personal experimentation',
        features: ['3 AI Generations / mo', 'Standard MP3 Quality', 'Basic Subliminal Layer'],
        action: 'Start Free',
        popular: false
    },
    {
        name: 'Pro',
        price: '29',
        desc: 'For serious rewriting',
        features: ['Unlimited Generations', 'Lossless WAV & FLAC', 'All 3 Neuro-Layers', 'Priority Generation Queue'],
        action: 'Get Started',
        popular: true
    },
    {
        name: 'Scale',
        price: '99',
        desc: 'For commercial creators',
        features: ['Unlimited', 'Commercial License', 'API Access', 'Custom Frequencies'],
        action: 'Contact Sales',
        popular: false
    }
];

export default function Pricing() {
    return (
        <section id="pricing" className="py-32 px-6 border-t border-white/5 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="mb-24 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">Access the Source</h2>
                    <p className="text-xl text-gray-400 font-light">
                        Three pathways to master your reality.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8 items-start">
                    {plans.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className={`
                                relative p-8 rounded-3xl flex flex-col min-h-[500px]
                                backdrop-blur-md transition-all duration-300
                                ${p.popular
                                    ? 'bg-white/10 border border-cyan-500/30 shadow-[0_0_50px_-20px_rgba(6,182,212,0.3)]'
                                    : 'bg-black/40 border border-white/5 hover:bg-white/5'
                                }
                            `}
                        >
                            {p.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className="text-lg font-medium text-white mb-2">{p.name}</h3>
                                <div className="flex items-baseline gap-0.5 mb-2">
                                    <span className="text-4xl font-bold text-white tracking-tight">${p.price}</span>
                                    {p.price !== '0' && <span className="text-gray-500 font-light">/mo</span>}
                                </div>
                                <p className="text-sm text-gray-400">{p.desc}</p>
                            </div>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {p.features.map((f) => (
                                    <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                                        <div className={`mt-0.5 p-0.5 rounded-full ${p.popular ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/10 text-gray-400'}`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <button className={`
                                w-full py-4 rounded-xl font-semibold transition-all duration-300
                                ${p.popular
                                    ? 'bg-white text-black hover:scale-[1.02] active:scale-[0.98]'
                                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
                                }
                            `}>
                                {p.action}
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
