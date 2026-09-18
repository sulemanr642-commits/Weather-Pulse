import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Skeleton } from '@components/ui';
import { durations, CALM_EASE } from '@design-system';

/**
 * LoadingState: Premium frosted glass skeleton / shimmer card.
 * Replaces crude spinners to maintain the sleek iOS glassmorphic aesthetic.
 */
export const LoadingState: React.FC = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: shouldReduceMotion ? durations.fast : durations.normal, ease: CALM_EASE }}
      className="glass-panel-elevated"
      style={{
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header Section: City Title & Main Temperature Shimmer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton width="220px" height="42px" borderRadius="12px" />
          <Skeleton width="130px" height="20px" borderRadius="6px" />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Skeleton width="90px" height="90px" borderRadius="50%" />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <Skeleton width="110px" height="64px" borderRadius="14px" />
            <Skeleton width="90px" height="16px" borderRadius="6px" />
          </div>
        </div>
      </div>

      {/* Metrics Grid: 3 Glass Cards Shimmer */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
        }}
      >
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            style={{
              padding: '18px 20px',
              borderRadius: 'var(--radius-md, 14px)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <Skeleton width="70px" height="16px" borderRadius="4px" />
            <Skeleton width="110px" height="28px" borderRadius="6px" />
          </div>
        ))}
      </div>

      {/* 5-Day Forecast Shimmer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <Skeleton width="130px" height="18px" borderRadius="6px" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px',
          }}
        >
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              style={{
                padding: '16px 14px',
                borderRadius: 'var(--radius-md, 14px)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Skeleton width="50px" height="14px" borderRadius="4px" />
              <Skeleton width="32px" height="32px" borderRadius="50%" />
              <Skeleton width="45px" height="14px" borderRadius="4px" />
            </div>
          ))}
        </div>
      </div>

      {/* Footer Timestamp Skeleton */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <Skeleton width="140px" height="14px" borderRadius="4px" />
        <Skeleton width="120px" height="14px" borderRadius="4px" />
      </div>
    </motion.div>
  );
};

export default LoadingState;
