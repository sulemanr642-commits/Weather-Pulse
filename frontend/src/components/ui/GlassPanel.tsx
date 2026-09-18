import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

export interface GlassPanelProps extends HTMLMotionProps<'div'> {
  variant?: 'subtle' | 'elevated' | 'prominent';
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  variant = 'subtle',
  children,
  className = '',
  style = {},
  ...motionProps
}) => {
  const variantClass =
    variant === 'elevated'
      ? 'glass-panel-elevated'
      : variant === 'prominent'
      ? 'glass-panel-modal'
      : 'glass-panel';

  return (
    <motion.div
      className={`${variantClass} ${className}`}
      style={{
        borderRadius: 'var(--radius-lg, 20px)',
        position: 'relative',
        boxSizing: 'border-box',
        ...style,
      }}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

export default GlassPanel;
