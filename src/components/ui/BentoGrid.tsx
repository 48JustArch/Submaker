'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface BentoGridProps {
    children: ReactNode;
    className?: string;
}

interface BentoItemProps {
    children: ReactNode;
    className?: string;
    large?: boolean;
    tall?: boolean;
    icon?: ReactNode;
    title?: string;
    description?: string;
    gradient?: string;
}

export function BentoGrid({ children, className = '' }: BentoGridProps) {
    return (
        <div className={`bento-grid ${className}`}>
            {children}
        </div>
    );
}

export function BentoItem({
    children,
    className = '',
    large = false,
    tall = false,
    icon,
    title,
    description,
    gradient,
}: BentoItemProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className={`bento-item relative overflow-hidden ${large ? 'large' : ''} ${tall ? 'tall' : ''} ${className}`}
        >
            {/* Gradient Background Overlay */}
            {gradient && (
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ background: gradient }}
                />
            )}

            {/* Default Content Layout */}
            {(icon || title || description) ? (
                <div className="relative z-10 h-full flex flex-col">
                    {icon && (
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7928ca]/10 to-[#ff0080]/10 flex items-center justify-center mb-4">
                            {icon}
                        </div>
                    )}
                    {title && (
                        <h3 className="headline-small mb-2">{title}</h3>
                    )}
                    {description && (
                        <p className="text-[var(--foreground-secondary)] leading-relaxed flex-grow">{description}</p>
                    )}
                    {children}
                </div>
            ) : (
                children
            )}
        </motion.div>
    );
}
