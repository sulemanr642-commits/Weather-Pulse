/**
 * WeatherPulse Design System Tokens
 * Defines core typography, color scales, glassmorphic opacities, and z-index layers.
 */

export const tokens = {
  colors: {
    // Primary Weather Gradients
    skyPrimary: '#38bdf8',
    skyDeep: '#1d4ed8',
    indigoNight: '#312e81',
    slateObsidian: '#0f172a',

    // Status Accents
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    info: '#60a5fa',

    // Telemetry Badges
    cacheHit: 'rgba(52, 211, 153, 0.2)',
    cacheHitBorder: 'rgba(52, 211, 153, 0.4)',
    cacheHitText: '#34d399',

    cacheMiss: 'rgba(251, 191, 36, 0.2)',
    cacheMissBorder: 'rgba(251, 191, 36, 0.4)',
    cacheMissText: '#fbbf24',
  },
  glass: {
    subtle: {
      background: 'rgba(255, 255, 255, 0.08)',
      border: '1px solid rgba(255, 255, 255, 0.14)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
    },
    elevated: {
      background: 'rgba(255, 255, 255, 0.12)',
      border: '1px solid rgba(255, 255, 255, 0.22)',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.25)',
      backdropFilter: 'blur(28px)',
      WebkitBackdropFilter: 'blur(28px)',
    },
    modal: {
      background: 'rgba(15, 23, 42, 0.85)',
      border: '1px solid rgba(255, 255, 255, 0.18)',
      boxShadow: '0 25px 60px rgba(0, 0, 0, 0.55)',
      backdropFilter: 'blur(36px)',
      WebkitBackdropFilter: 'blur(36px)',
    },
  },
  radii: {
    sm: '8px',
    md: '14px',
    lg: '20px',
    xl: '28px',
    pill: '9999px',
  },
  zIndex: {
    background: 0,
    particles: 1,
    content: 10,
    header: 50,
    dropdown: 100,
    modalBackdrop: 200,
    modalContent: 210,
    toast: 300,
  },
} as const;

export default tokens;
