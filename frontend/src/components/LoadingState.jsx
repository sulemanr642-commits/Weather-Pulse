import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * LoadingState: Premium frosted glass skeleton / shimmer card.
 * Replaces crude spinners to maintain the sleek iOS glassmorphic aesthetic.
 */
export default function LoadingState() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: shouldReduceMotion ? 0.1 : 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel-elevated"
      style={{
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '28px',
        width: '100%',
        boxSizing: 'border-box'
      }}
    >
      {/* Header Section: City Title & Main Temperature Shimmer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="shimmer-skeleton" style={{ width: '220px', height: '42px', borderRadius: '12px' }} />
          <div className="shimmer-skeleton" style={{ width: '130px', height: '20px', borderRadius: '6px' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* 3D Icon Skeleton */}
          <div className="shimmer-skeleton" style={{ width: '100px', height: '100px', borderRadius: '50%' }} />

          {/* Large Temperature Display Skeleton */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div className="shimmer-skeleton" style={{ width: '110px', height: '64px', borderRadius: '14px' }} />
            <div className="shimmer-skeleton" style={{ width: '90px', height: '16px', borderRadius: '6px' }} />
          </div>
        </div>
      </div>

      {/* Metrics Grid: 3 Glass Cards Shimmer */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px'
      }}>
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            style={{
              padding: '18px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div className="shimmer-skeleton" style={{ width: '70px', height: '16px', borderRadius: '4px' }} />
            <div className="shimmer-skeleton" style={{ width: '110px', height: '28px', borderRadius: '6px' }} />
          </div>
        ))}
      </div>

      {/* 5-Day Forecast Shimmer */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="shimmer-skeleton" style={{ width: '130px', height: '18px', borderRadius: '6px' }} />
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px'
        }}>
          {[1, 2, 3, 4, 5].map((item) => (
            <div
              key={item}
              style={{
                padding: '16px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div className="shimmer-skeleton" style={{ width: '60px', height: '14px', borderRadius: '4px' }} />
              <div className="shimmer-skeleton" style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
              <div className="shimmer-skeleton" style={{ width: '50px', height: '14px', borderRadius: '4px' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Footer Timestamp Skeleton */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div className="shimmer-skeleton" style={{ width: '140px', height: '14px', borderRadius: '4px' }} />
        <div className="shimmer-skeleton" style={{ width: '120px', height: '14px', borderRadius: '4px' }} />
      </div>
    </motion.div>
  );
}
