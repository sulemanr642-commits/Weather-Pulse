import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { durations, CALM_EASE } from '@design-system';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
      transition={{ duration: shouldReduceMotion ? 0.1 : durations.fast, ease: CALM_EASE }}
      style={{
        padding: '16px 24px',
        borderRadius: 'var(--radius-md, 14px)',
        background: 'rgba(239, 68, 68, 0.15)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(239, 68, 68, 0.4)',
        boxShadow: '0 8px 24px rgba(239, 68, 68, 0.15)',
        color: '#fecaca',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={18} color="#f87171" />
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#fff' }}>
            Meteorological Data Temporarily Unavailable
          </h4>
          <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#fca5a5' }}>
            {message || 'Unable to retrieve real-time observations for this city.'}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: 'var(--radius-pill, 9999px)',
            color: '#fff',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)')}
        >
          <RefreshCw size={13} />
          <span>Retry</span>
        </button>
      )}
    </motion.div>
  );
};

export default ErrorState;
