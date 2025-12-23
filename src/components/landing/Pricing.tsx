'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const plans = [
    {
        name: 'Starter',
        price: '0',
        features: ['3 Generations', 'Standard MP3', 'Subliminal Layer'],
        action: 'Start Free'
    },
    {
        name: 'Pro',
        price: '29',
        features: ['50 Generations', 'High-Res WAV', 'All 3 Layers', 'Priority Queue'],
        action: 'Go Pro',
        highlight: true
    },
    {
        name: 'Scale',
        price: '99',
        features: ['Unlimited', 'Lossless FLAC', 'Commercial License', 'API Access'],
        action: 'Contact Sales'
    }
];

export default function Pricing() {
    return (
        <section className="py-32 px-6 border-t border-white/5">
            <div className="max-w-6xl mx-auto">
                <div className="mb-20 text-center">
                    <h2 className="heading-xl text-white mb-4">Pricing</h2>
                    <p className="text-body max-w-xl mx-auto">
                        Transparent pricing for consciousness engineering.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {plans.map((p, i) => (
                        <div
                            key={i}
                            className={`
                relative p-8 rounded-3xl border flex flex-col
                ${p.highlight
                                    ? 'bg-white/5 border-white/20'
                                    : 'bg-transparent border-white/10'
                                }
              `}
                        >
                            <div className="mb-8">
                                <h3 className="text-xl font-bold text-white mb-2">{p.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">${p.price}</span>
                                    <span className="text-gray-500">/mo</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-10 flex-grow">
                                {p.features.map((f) => (
                                    <li key={f} className="flex items-center gap-3 text-gray-300">
                                        <Check className="w-5 h-5 text-white" />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <button className={`
                w-full py-4 rounded-full font-bold transition-all
                ${p.highlight
                                    ? 'bg-white text-black hover:scale-[1.02]'
                                    : 'border border-white/20 text-white hover:bg-white/5'
                                }
              `}>
                                {p.action}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
