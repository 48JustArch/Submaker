'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface GlowCardProps {
    children: ReactNode;
    className?: string;
    featured?: boolean;
}

export default function GlowCard({ children, className = '', featured = false }: GlowCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className={`relative ${featured ? 'card-glow' : 'card'} ${className}`}
        >
            {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-[#7928ca] to-[#ff0080] text-white text-xs font-semibold">
                    Most Popular
                </div>
            )}
            {children}
        </motion.div>
    );
}
