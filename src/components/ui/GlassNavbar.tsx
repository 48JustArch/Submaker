'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Menu, X, Zap, Brain, Mic2, Waves, Activity, Sparkles, AudioWaveform, Network, LogOut } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';

export default function GlassNavbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setMobileOpen(false);
        router.refresh();
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);

        // Check auth status
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('is_banned')
                    .eq('id', user.id)
                    .single();

                if (profile?.is_banned) {
                    await supabase.auth.signOut();
                    setUser(null);
                    window.location.href = '/banned';
                    return;
                }
            }
            setUser(user);
        };
        checkUser();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768) {
                setMobileOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [mobileOpen]);

    // Icons with custom animations or glowing styles
    const products = [
        {
            name: 'Subliminal Engine',
            desc: 'Audio masking tech',
            icon: <AudioWaveform className="w-5 h-5 text-cyan-400 animate-pulse" />,
            href: '/studio',
            isExternal: false
        },
        {
            name: 'Binaural Beats',
            desc: 'Frequency modulation',
            icon: <Activity className="w-5 h-5 text-blue-400 animate-[spin_3s_linear_infinite]" />,
            href: '/studio',
            isExternal: false
        },
        {
            name: 'AI Affirmations',
            desc: 'Smart text generation',
            icon: <Network className="w-5 h-5 text-purple-400" />,
            href: '/studio',
            isExternal: false
        },
        {
            name: 'Export Studio',
            desc: 'Multi-format output',
            icon: <Waves className="w-5 h-5 text-indigo-400" />,
            href: '/studio',
            isExternal: false
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

                {/* Center: Links - Desktop */}
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

                {/* Right: Actions - Desktop */}
                <div className="hidden md:flex items-center gap-3 relative z-50">
                    {user ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="px-6 py-2 rounded-full bg-white text-black text-xs font-bold tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-transform uppercase"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="px-6 py-2 rounded-full bg-white text-black text-xs font-bold tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-transform uppercase"
                        >
                            Login
                        </Link>
                    )}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden text-white z-50 p-2"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    aria-label={mobileOpen ? "Close menu" : "Open menu"}
                >
                    {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Megamenu Dropdowns - Desktop */}
            <AnimatePresence>
                {activeDropdown === 'products' && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 w-full bg-[#050505]/95 backdrop-blur-3xl border-b border-white/5 shadow-2xl z-40 hidden md:block"
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

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 top-0 z-40 md:hidden"
                    >
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                            onClick={() => setMobileOpen(false)}
                        />

                        {/* Menu Content */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#0a0a0a] border-l border-white/10 overflow-y-auto"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <span className="text-lg font-semibold text-white">Menu</span>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="p-2 rounded-lg hover:bg-white/10 text-gray-400"
                                    aria-label="Close menu"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Navigation Links */}
                            <div className="p-6 space-y-2">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Products</p>
                                {products.map((p) => (
                                    <Link
                                        key={p.name}
                                        href={p.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                                            {p.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-white">{p.name}</h4>
                                            <p className="text-xs text-gray-500">{p.desc}</p>
                                        </div>
                                    </Link>
                                ))}

                                <div className="border-t border-white/5 my-6" />

                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Navigation</p>
                                {['Research', 'Pricing', 'Manifesto'].map((item) => (
                                    <Link
                                        key={item}
                                        href={item === 'Pricing' ? '#pricing' : '#'}
                                        onClick={() => setMobileOpen(false)}
                                        className="block p-4 rounded-xl text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        {item}
                                    </Link>
                                ))}
                            </div>

                            {/* User Actions */}
                            <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/5 bg-[#0a0a0a]">
                                {user ? (
                                    <div className="space-y-3">
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setMobileOpen(false)}
                                            className="w-full py-3 px-6 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2"
                                        >
                                            Go to Dashboard
                                        </Link>
                                        <button
                                            onClick={handleSignOut}
                                            className="w-full py-3 px-6 bg-white/10 text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-white/20 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setMobileOpen(false)}
                                        className="w-full py-3 px-6 bg-white text-black font-semibold rounded-xl flex items-center justify-center gap-2"
                                    >
                                        Login
                                    </Link>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
