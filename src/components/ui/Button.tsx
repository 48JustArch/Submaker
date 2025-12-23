'use client';

import { motion, HTMLMotionProps } from 'framer-motion';
import { forwardRef } from 'react';
import type { ReactNode } from 'react';

// Use HTMLMotionProps to be compatible with motion.button
interface ButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'glass';
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
    isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ variant = 'primary', size = 'md', children, isLoading, className = '', ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-medium rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary: 'bg-[#0071e3] hover:bg-[#0077ed] text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30',
            secondary: 'bg-transparent border border-[var(--border-color)] text-[var(--foreground)] hover:bg-[var(--background-secondary)]',
            ghost: 'bg-transparent text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)]',
            glass: 'bg-[var(--glass-background)] backdrop-blur-xl border border-[var(--glass-border)] text-[var(--foreground)] hover:shadow-lg relative overflow-hidden',
        };

        const sizes = {
            sm: 'text-sm px-4 py-2',
            md: 'text-base px-6 py-3',
            lg: 'text-lg px-8 py-4',
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
                disabled={isLoading}
                {...props}
            >
                {variant === 'glass' && (
                    <span className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
                )}
                {isLoading ? (
                    <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                                fill="none"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        Loading...
                    </span>
                ) : (
                    children
                )}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
