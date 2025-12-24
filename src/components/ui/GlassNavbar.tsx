'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu, X, Zap, Brain, Mic2, Waves, Activity, Sparkles, AudioWaveform, Network } from 'lucide-react';

export default function GlassNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Icons with custom animations or glowing styles
    const products = [
        {
            name: 'Subliminal Engine',
            desc: 'Audio masking tech',
            icon: <AudioWaveform className="w-5 h-5 text-cyan-400 animate-pulse" />,
            href: '#engine'
        },
        {
            name: 'Scalar Field',
            desc: 'Frequency modulation',
            icon: <Activity className="w-5 h-5 text-blue-400 animate-[spin_3s_linear_infinite]" />,
            href: '#scalar'
        },
        {
            name: 'Neural Reshaper',
            desc: 'Plasticity tools',
            icon: <Network className="w-5 h-5 text-purple-400" />,
            href: '#neural'
        },
        {
            name: 'Morphic Sync',
            desc: 'Bio-resonance',
            icon: <Waves className="w-5 h-5 text-indigo-400" />,
            href: '#morphic'
        },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled
                    ? 'bg-[#000000]/80 backdrop-blur-xl border-b border-white/5 py-3'
                    : 'bg-transparent py-5'
                }`}
            onMouseLeave={() => setActiveDropdown(null)}
        >
            <div className="w-full px-6 md:px-10 flex items-center justify-between font-mono relative">

                {/* Left: Brand */}
                <Link href="/" className="flex items-center gap-3 group relative z-50">
                    <div className="grid grid-cols-2 gap-0.5 group-hover:gap-1 transition-all duration-300">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 bg-white rounded-full opacity-80" />
                        ))}
                    </div>
                    <span className="text-xl font-medium tracking-tight text-white group-hover:text-gray-300 transition-colors sans-serif">
                        Submaker
                    </span>
                </Link>

                {/* Center: Links */}
                <div className="hidden md:flex items-center gap-10">

                    {/* Products Dropdown Trigger */}
                    <div
                        className="relative group cursor-pointer h-full py-2"
                        onMouseEnter={() => setActiveDropdown('products')}
                    >
                        <div className="flex items-center gap-1 text-xs font-semibold tracking-widest text-gray-400 hover:text-white transition-colors uppercase">
                            Products
                            <ChevronDown className={`w-3 h-3 opacity-50 transition-transform duration-300 ${activeDropdown === 'products' ? 'rotate-180' : ''}`} />
                        </div>
                        <span className={`absolute -bottom-1 left-0 h-[1px] bg-white transition-all duration-300 ${activeDropdown === 'products' ? 'w-full' : 'w-0'}`} />
                    </div>

                    {['Research', 'Pricing', 'Manifesto'].map((item) => (
                        <Link
                            key={item}
                            href={item === 'Pricing' ? '#pricing' : '#'}
                            className="relative group cursor-pointer py-2"
                            onMouseEnter={() => setActiveDropdown(null)}
                        >
                            <div className="flex items-center gap-1 text-xs font-semibold tracking-widest text-gray-400 hover:text-white transition-colors uppercase">
                                {item}
                            </div>
                            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-white transition-all duration-300 group-hover:w-full" />
                        </Link>
                    ))}
                </div>

                {/* Right: Actions */}
                <div className="hidden md:flex items-center gap-3 relative z-50">
                    <Link
                        href="/contact"
                        className="px-5 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-bold tracking-wider text-gray-300 hover:bg-white/10 hover:text-white transition-all uppercase"
                    >
                        Contact Sales
                    </Link>
                    <Link
                        href="/login"
                        className="px-6 py-2 rounded-full bg-white text-black text-xs font-bold tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-transform uppercase"
                    >
                        Login
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white z-50"
                    onClick={() => setMobileOpen(!mobileOpen)}
                >
                    {mobileOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Megamenu Dropdowns */}
            <AnimatePresence>
                {activeDropdown === 'products' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 w-full bg-[#050505]/95 backdrop-blur-3xl border-b border-white/5 shadow-2xl z-40"
                        onMouseEnter={() => setActiveDropdown('products')}
                        onMouseLeave={() => setActiveDropdown(null)}
                    >
                        <div className="max-w-7xl mx-auto px-10 py-12 grid grid-cols-4 gap-8">
                            {products.map((p, i) => (
                                <Link
                                    key={p.name}
                                    href={p.href}
                                    className="group flex flex-col gap-3 p-4 rounded-xl hover:bg-white/5 transition-colors relative overflow-hidden"
                                >
                                    {/* Icon Box with Dynamic Glow */}
                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-[0_0_20px_rgba(255,255,255,0.05)] group-hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] group-hover:border-white/20">
                                        {/* Animated inner icon */}
                                        <motion.div
                                            animate={i === 1 ? { rotate: 360 } : {}}
                                            transition={i === 1 ? { duration: 4, repeat: Infinity, ease: "linear" } : {}}
                                        >
                                            {p.icon}
                                        </motion.div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors uppercase tracking-wide flex items-center gap-2">
                                            {p.name}
                                        </h4>
                                        <p className="text-xs text-gray-400 group-hover:text-gray-300 transition-colors font-light">
                                            {p.desc}
                                        </p>
                                    </div>

                                    {/* Hover Sparkle Effect */}
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <Sparkles className="w-3 h-3 text-cyan-400" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
