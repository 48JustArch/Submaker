'use client';

import { motion } from 'framer-motion';
import { Link } from 'lucide-react';

export default function GlassNavbar() {
    return (
        <nav className="fixed top-0 w-full z-50 px-6 py-6 font-medium">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2 text-xl tracking-tighter text-white font-bold">
                    <div className="w-3 h-3 bg-white rounded-full" />
                    Submaker
                </div>

                {/* Center Menu */}
                <div className="hidden md:flex items-center gap-8 px-8 py-3 rounded-full bg-white/5 backdrop-blur-md border border-white/5">
                    {['Engine', 'Research', 'Manifesto'].map((item) => (
                        <a
                            key={item}
                            href="#"
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            {item}
                        </a>
                    ))}
                </div>

                {/* Right Action */}
                <div className="flex items-center gap-6">
                    <a href="#" className="hidden md:block text-sm text-white hover:text-gray-300">Log in</a>
                    <a href="#" className="px-5 py-2 bg-white text-black text-sm font-semibold rounded-full hover:scale-105 transition-transform">
                        Start Free
                    </a>
                </div>
            </div>
        </nav>
    );
}
