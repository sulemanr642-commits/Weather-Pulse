/**
 * WeatherPulse Motion Design System
 * Defines reusable Framer Motion variants, standardized duration scales,
 * and the shared "calm" easing curve used everywhere across the application.
 */
import type { Variants, Transition } from 'framer-motion';

/**
 * Shared "Calm" Easing Curve
 * Inspired by visionOS / Apple Weather natural deceleration physics.
 */
export const CALM_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Standardized Motion Duration Scale
 * Semantic hierarchy to prevent arbitrary, improvised timings.
 */
export const durations = {
  instant: 0,
  fast: 0.2,        // Micro-interactions, hover highlights, tooltips, tags
  normal: 0.35,     // Card transitions, standard entrances, dropdowns
  deliberate: 0.6,  // Staggered section reveals, animated numeric counters
  scene: 1.2,       // Atmospheric 3D background crossfades
} as const;

/**
 * Standardized Semantic Loop Timings for Ambient Weather Symbols & Micro-interactions
 */
export const symbolMotion = {
  floatDuration: 3.5,
  floatCloudDuration: 4.0,
  rainDropDuration: 0.9,
  sunRayRotationDuration: 35.0,
  starTwinkleDuration: 2.0,
  stormPulseDuration: 1.2,
  fogDriftDuration: 8.0,
} as const;

/* ==============================================================================
   Transition Presets
   ============================================================================== */

export const calmFastTransition: Transition = {
  duration: durations.fast,
  ease: CALM_EASE,
};

export const calmTransition: Transition = {
  duration: durations.normal,
  ease: CALM_EASE,
};

export const calmDeliberateTransition: Transition = {
  duration: durations.deliberate,
  ease: CALM_EASE,
};

export const calmSceneTransition: Transition = {
  duration: durations.scene,
  ease: CALM_EASE,
};

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 28,
};

// Backward-compatible alias for Phase 10
export const smoothTransition = calmTransition;

/* ==============================================================================
   Reusable Motion Variants
   ============================================================================== */

/**
 * Standard entrance for cards and panels: soft fade + subtle upward glide
 */
export const entranceVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: calmTransition,
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: durations.fast, ease: 'easeIn' },
  },
};

/**
 * Interactive card hover and tap physics
 */
export const cardHoverTapVariants = {
  hover: {
    y: -2,
    scale: 1.008,
    transition: { duration: durations.fast, ease: CALM_EASE },
  },
  tap: {
    scale: 0.992,
    transition: { duration: 0.1 },
  },
};

/**
 * Top-level page entrance orchestrator: sequences Header -> Quick-Pills -> WeatherCard
 */
export const pageStaggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

/**
 * Child item in the page entrance hierarchy
 */
export const pageStaggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: calmTransition,
  },
};

/**
 * Viewport-aware scroll reveal: triggers only once when content enters view
 */
export const scrollRevealVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: calmDeliberateTransition,
  },
};

/**
 * Staggered container for lists (e.g. 5-day forecast cards)
 */
export const forecastListVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.1,
    },
  },
};

/**
 * Staggered list item
 */
export const forecastItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: calmTransition,
  },
};

/* ==============================================================================
   Legacy & Modal Variants
   ============================================================================== */

export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: calmTransition },
  exit: { opacity: 0, transition: { duration: durations.fast } },
};

export const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: calmTransition },
  exit: { opacity: 0, scale: 0.95, transition: { duration: durations.fast } },
};

export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: calmTransition },
  exit: { opacity: 0, y: -14, transition: { duration: durations.fast } },
};

export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: 16,
    transition: { duration: durations.fast, ease: 'easeOut' },
  },
};

export const staggerContainer: Variants = pageStaggerContainer;
