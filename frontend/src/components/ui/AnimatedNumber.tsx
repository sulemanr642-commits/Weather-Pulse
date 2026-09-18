import React, { useEffect, useState, useRef } from 'react';
import { useMotionValue, animate, useReducedMotion } from 'framer-motion';
import { CALM_EASE, durations } from '@design-system';

export interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * AnimatedNumber: Smoothly interpolates numeric transitions with natural deceleration physics.
 * Replaces jarring instant number swaps with fluid instrumentation instrumentation feel.
 * Respects app-wide reduced-motion preferences, snapping immediately when motion is restricted.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = durations.deliberate,
  className,
  style,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<string>(() => {
    return Number.isFinite(value) ? value.toFixed(decimals) : '0';
  });

  // Motion value tracks numeric trajectory
  const motionVal = useMotionValue(value);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (!Number.isFinite(value)) return;

    // Skip animation on first render or when user prefers reduced motion
    if (isFirstRender.current || shouldReduceMotion) {
      isFirstRender.current = false;
      motionVal.set(value);
      setDisplayValue(value.toFixed(decimals));
      return;
    }

    const controls = animate(motionVal, value, {
      duration,
      ease: CALM_EASE,
      onUpdate: (latest) => {
        setDisplayValue(latest.toFixed(decimals));
      },
    });

    return () => controls.stop();
  }, [value, decimals, duration, shouldReduceMotion, motionVal]);

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};

export default AnimatedNumber;
