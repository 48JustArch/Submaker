'use client';

import { motion } from 'framer-motion';
import { Star, Users, Headphones, TrendingUp } from 'lucide-react';

const stats = [
    { icon: <Users className="w-5 h-5" />, value: '10,000+', label: 'Active Creators' },
    { icon: <Headphones className="w-5 h-5" />, value: '250,000+', label: 'Audio Hours Created' },
    { icon: <Star className="w-5 h-5" />, value: '4.9', label: 'App Store Rating' },
    { icon: <TrendingUp className="w-5 h-5" />, value: '93%', label: 'Report Results' },
];

const testimonials = [
    {
        quote: "Submaker changed my morning routine. I listen to my custom affirmations during my commute and the results have been incredible.",
        author: "Sarah K.",
        role: "Entrepreneur",
        avatar: "S"
    },
    {
        quote: "As a therapist, I recommend this to clients for reinforcing positive self-talk. The audio quality is professional grade.",
        author: "Dr. Michael R.",
        role: "Clinical Psychologist",
        avatar: "M"
    },
    {
        quote: "The binaural beat options combined with my own affirmations... it's like having a personal hypnotherapist in my pocket.",
        author: "James T.",
        role: "Performance Coach",
        avatar: "J"
    }
];

export default function SocialProof() {
    return (
        <section className="py-16 md:py-24 px-4 md:px-6 border-t border-white/5 relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Stats Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mb-12 md:mb-20 p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/5"
                >
                    {stats.map((stat, i) => (
                        <div key={i} className="text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 mb-3">
                                {stat.icon}
                            </div>
                            <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                            <div className="text-sm text-gray-500">{stat.label}</div>
                        </div>
                    ))}
                </motion.div>

                {/* Section Header */}
                <div className="text-center mb-12 md:mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40">
                        Trusted by Creators
                    </h2>
                    <p className="text-lg text-gray-400 font-light max-w-xl mx-auto">
                        Join thousands who are transforming their mindset with Submaker.
                    </p>
                </div>

                {/* Testimonials Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {testimonials.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 rounded-2xl bg-[#0a0a0a] border border-white/5 hover:border-white/10 transition-colors"
                        >
                            {/* Stars */}
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, j) => (
                                    <Star key={j} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                ))}
                            </div>

                            {/* Quote */}
                            <p className="text-gray-300 leading-relaxed mb-6 text-sm">
                                "{t.quote}"
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                                    {t.avatar}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-white">{t.author}</div>
                                    <div className="text-xs text-gray-500">{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
