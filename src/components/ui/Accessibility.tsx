'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Skip Link - Allows keyboard users to skip navigation
 * 
 * Place at the top of your layout, before the main navigation
 * 
 * @example
 * <SkipLink href="#main-content">Skip to main content</SkipLink>
 * <nav>...</nav>
 * <main id="main-content">...</main>
 */
export function SkipLink({
    href,
    children = 'Skip to main content'
}: {
    href: string;
    children?: React.ReactNode;
}) {
    return (
        <a
            href={href}
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-white focus:text-black focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
        >
            {children}
        </a>
    );
}

/**
 * Live Region for Screen Reader Announcements
 * 
 * Updates to the message will be announced by screen readers
 * 
 * @example
 * const [announcement, setAnnouncement] = useState('');
 * // Trigger announcement
 * setAnnouncement('File saved successfully');
 * 
 * <Announcer message={announcement} />
 */
export function Announcer({
    message,
    mode = 'polite',
    clearAfter = 5000
}: {
    message: string;
    mode?: 'polite' | 'assertive';
    clearAfter?: number;
}) {
    const [currentMessage, setCurrentMessage] = useState('');

    useEffect(() => {
        if (message) {
            setCurrentMessage(message);

            // Clear after timeout to allow re-announcing same message
            if (clearAfter > 0) {
                const timer = setTimeout(() => setCurrentMessage(''), clearAfter);
                return () => clearTimeout(timer);
            }
        }
    }, [message, clearAfter]);

    return (
        <div
            role="status"
            aria-live={mode}
            aria-atomic="true"
            className="sr-only"
        >
            {currentMessage}
        </div>
    );
}

/**
 * Hook to manage focus - useful for modals and dialogs
 */
export function useFocusTrap(isActive: boolean) {
    const containerRef = useRef<HTMLDivElement>(null);
    const previousFocus = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (isActive && containerRef.current) {
            // Save current focus
            previousFocus.current = document.activeElement as HTMLElement;

            // Find all focusable elements
            const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length > 0) {
                // Focus first element
                focusableElements[0].focus();

                // Handle tab key
                const handleKeyDown = (e: KeyboardEvent) => {
                    if (e.key !== 'Tab') return;

                    const firstElement = focusableElements[0];
                    const lastElement = focusableElements[focusableElements.length - 1];

                    if (e.shiftKey && document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    } else if (!e.shiftKey && document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                };

                document.addEventListener('keydown', handleKeyDown);
                return () => document.removeEventListener('keydown', handleKeyDown);
            }
        } else if (!isActive && previousFocus.current) {
            // Restore focus when deactivated
            previousFocus.current.focus();
        }
    }, [isActive]);

    return containerRef;
}

/**
 * Visually Hidden - Hides content visually but keeps it accessible to screen readers
 * 
 * @example
 * <button>
 *   <Icon />
 *   <VisuallyHidden>Close dialog</VisuallyHidden>
 * </button>
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
    return (
        <span className="sr-only">
            {children}
        </span>
    );
}

/**
 * Focus Ring - Wrapper to add consistent focus styling
 */
export function FocusRing({
    children,
    className = '',
    as: Component = 'div'
}: {
    children: React.ReactNode;
    className?: string;
    as?: React.ElementType;
}) {
    return (
        <Component
            className={`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a] ${className}`}
        >
            {children}
        </Component>
    );
}

/**
 * Hook to detect keyboard navigation vs mouse
 * Useful for showing focus indicators only for keyboard users
 */
export function useKeyboardNavigation() {
    const [isKeyboardUser, setIsKeyboardUser] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                setIsKeyboardUser(true);
            }
        };

        const handleMouseDown = () => {
            setIsKeyboardUser(false);
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleMouseDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleMouseDown);
        };
    }, []);

    return isKeyboardUser;
}

/**
 * Accessible Icon Button
 * Ensures icon-only buttons have proper labels
 */
export function IconButton({
    icon,
    label,
    onClick,
    className = '',
    disabled = false,
    pressed,
}: {
    icon: React.ReactNode;
    label: string;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
    pressed?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            aria-pressed={pressed}
            className={`
                p-2 rounded-lg transition-colors
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}
            `}
        >
            <span aria-hidden="true">{icon}</span>
        </button>
    );
}
