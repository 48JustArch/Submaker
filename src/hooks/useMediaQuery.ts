/**
 * useMediaQuery - Custom hook for responsive design
 * 
 * Provides:
 * - Media query matching
 * - Mobile/tablet/desktop detection
 * - SSR-safe implementation
 */

import { useState, useEffect } from 'react';

/**
 * Hook to check if a media query matches
 */
export function useMediaQuery(query: string): boolean {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        // Check if window is available (SSR safety)
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(query);

        // Set initial value
        setMatches(mediaQuery.matches);

        // Handler for changes
        const handler = (event: MediaQueryListEvent) => {
            setMatches(event.matches);
        };

        // Modern browsers
        mediaQuery.addEventListener('change', handler);

        return () => {
            mediaQuery.removeEventListener('change', handler);
        };
    }, [query]);

    return matches;
}

/**
 * Common breakpoints matching Tailwind defaults
 */
export const breakpoints = {
    sm: '(min-width: 640px)',
    md: '(min-width: 768px)',
    lg: '(min-width: 1024px)',
    xl: '(min-width: 1280px)',
    '2xl': '(min-width: 1536px)',
} as const;

/**
 * Hook to detect if device is mobile (< 768px)
 */
export function useIsMobile(): boolean {
    return !useMediaQuery(breakpoints.md);
}

/**
 * Hook to detect if device is tablet (768px - 1024px)
 */
export function useIsTablet(): boolean {
    const isAboveMobile = useMediaQuery(breakpoints.md);
    const isBelowDesktop = !useMediaQuery(breakpoints.lg);
    return isAboveMobile && isBelowDesktop;
}

/**
 * Hook to detect if device is desktop (>= 1024px)
 */
export function useIsDesktop(): boolean {
    return useMediaQuery(breakpoints.lg);
}

/**
 * Hook that returns current breakpoint name
 */
export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
    const isMobile = useIsMobile();
    const isTablet = useIsTablet();

    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
}

/**
 * Hook to detect touch device
 */
export function useIsTouchDevice(): boolean {
    const [isTouch, setIsTouch] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkTouch = () => {
            setIsTouch(
                'ontouchstart' in window ||
                navigator.maxTouchPoints > 0
            );
        };

        checkTouch();
    }, []);

    return isTouch;
}

/**
 * Hook to detect reduced motion preference
 */
export function usePrefersReducedMotion(): boolean {
    return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook to detect dark mode preference
 */
export function usePrefersDarkMode(): boolean {
    return useMediaQuery('(prefers-color-scheme: dark)');
}
