/**
 * WeatherPulse Breakpoint Scale & Responsive Utilities
 * Defines standardized breakpoint thresholds, media query strings,
 * and reactive viewport hooks to eliminate ad-hoc media queries.
 */
import { useState, useEffect } from 'react';

/**
 * Standard Breakpoint Thresholds (in pixels)
 */
export const breakpoints = {
  mobile: 480,   // Compact smartphones (e.g. iPhone SE, 375px)
  tablet: 768,   // Large smartphones landscape, tablets (e.g. iPad, 768px)
  desktop: 1024, // Standard laptops and desktops
  wide: 1280,    // Large desktop monitors (1440px+)
} as const;

export type BreakpointKey = keyof typeof breakpoints;

/**
 * Standard CSS Media Query Strings
 */
export const mediaQueries = {
  mobileOnly: `(max-width: ${breakpoints.mobile - 1}px)`,
  mobileAndDown: `(max-width: ${breakpoints.tablet - 1}px)`,
  tablet: `(min-width: ${breakpoints.mobile}px) and (max-width: ${breakpoints.desktop - 1}px)`,
  tabletAndUp: `(min-width: ${breakpoints.tablet}px)`,
  desktopAndUp: `(min-width: ${breakpoints.desktop}px)`,
  wideAndUp: `(min-width: ${breakpoints.wide}px)`,
} as const;

export interface ViewportState {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
}

/**
 * Reactive React hook tracking active breakpoint and viewport dimensions.
 * SSR-safe, passive resize listener with debounce-free synchronous initial frame.
 */
export function useBreakpoint(): ViewportState {
  const [viewport, setViewport] = useState<ViewportState>(() => {
    if (typeof window === 'undefined') {
      return {
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isWide: false,
      };
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      width: w,
      height: h,
      isMobile: w < breakpoints.tablet,
      isTablet: w >= breakpoints.tablet && w < breakpoints.desktop,
      isDesktop: w >= breakpoints.desktop && w < breakpoints.wide,
      isWide: w >= breakpoints.wide,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({
        width: w,
        height: h,
        isMobile: w < breakpoints.tablet,
        isTablet: w >= breakpoints.tablet && w < breakpoints.desktop,
        isDesktop: w >= breakpoints.desktop && w < breakpoints.wide,
        isWide: w >= breakpoints.wide,
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
}

export default useBreakpoint;
