'use client';

import { LayoutGrid, Music, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

type MobileView = 'editor' | 'assets' | 'properties';

interface MobileNavBarProps {
    currentView: MobileView;
    onChangeView: (view: MobileView) => void;
}

export default function MobileNavBar({ currentView, onChangeView }: MobileNavBarProps) {
    const navItems = [
        { id: 'assets', label: 'Library', icon: LayoutGrid },
        { id: 'editor', label: 'Studio', icon: Music },
        { id: 'properties', label: 'Edit', icon: SlidersHorizontal },
    ] as const;

    return (
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm">
            <div className="bg-[#0f0f0f]/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 flex justify-between items-center">
                {navItems.map((item) => {
                    const isActive = currentView === item.id;
                    const Icon = item.icon;

                    return (
                        <button
                            key={item.id}
                            onClick={() => onChangeView(item.id as MobileView)}
                            className={`
                                relative flex-1 h-12 rounded-xl flex items-center justify-center gap-2 transition-all duration-300
                                ${isActive ? 'text-white' : 'text-gray-500 hover:text-gray-300'}
                            `}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="mobileNavHighlight"
                                    className="absolute inset-0 bg-white/10 rounded-xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon className={`w-5 h-5 relative z-10 ${isActive ? 'stroke-2' : 'stroke-[1.5]'}`} />
                            {isActive && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    className="text-sm font-medium relative z-10 whitespace-nowrap overflow-hidden"
                                >
                                    {item.label}
                                </motion.span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
