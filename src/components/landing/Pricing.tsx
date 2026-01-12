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
    return (
        <section id="pricing" className="py-16 md:py-32 px-4 md:px-6 border-t border-white/5 relative overflow-hidden">
            {/* Ambient Background Glow - Silver/White */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <div className="mb-12 md:mb-24 text-center">
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white via-gray-200 to-gray-500">Access the Source</h2>
                    <p className="text-lg md:text-xl text-gray-400 font-light">
                        Three pathways to master your reality.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-start">
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
                                    ? 'bg-white/10 border border-white/50 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]'
                                    : 'bg-black/40 border border-white/5 hover:bg-white/5 hover:border-white/20'
                                }
                            `}
                        >
                            {p.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-white via-gray-200 to-gray-400 rounded-full text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1 shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                                    <Sparkles className="w-3 h-3" /> Most Popular
                                </div>
                            )}

                            <div className="mb-8">
                                <h3 className={`text-lg font-medium mb-2 ${p.popular ? 'text-white' : 'text-gray-300'}`}>{p.name}</h3>
                                <div className="flex items-baseline gap-0.5 mb-2">
                                    <span className="text-4xl font-bold text-white tracking-tight">${p.price}</span>
                                    {p.price !== '0' && <span className="text-gray-500 font-light">/mo</span>}
                                </div>
                                <p className="text-sm text-gray-400">{p.desc}</p>
                            </div>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {p.features.map((f) => (
                                    <li key={f} className="flex items-start gap-3 text-sm text-gray-300">
                                        <div className={`mt-0.5 p-0.5 rounded-full ${p.popular ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/10 text-gray-400'}`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className={p.popular ? 'text-white' : 'text-gray-400'}>{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <button className={`
                                w-full py-4 rounded-xl font-semibold transition-all duration-300
                                ${p.popular
                                    ? 'bg-white text-black hover:scale-[1.05] shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.6)]'
                                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/30'
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
