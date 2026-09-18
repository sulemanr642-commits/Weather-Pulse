import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { mapConditionToScene, getSceneTheme, SceneType, durations, CALM_EASE } from '@design-system';
import { useUIStore } from '@store';
import { useReducedMotion } from '@hooks';

// Code-split 3D Canvas stage (Three.js and R3F bundle isolated from initial public load)
const SceneCanvas = lazy(() => import('./SceneCanvas'));

export interface WeatherSceneProps {
  condition?: string;
  iconCode?: string;
}

function checkWebGLSupport(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

/**
 * WeatherScene: Master 3D Weather Reactive Background Orchestrator
 *
 * Architecture:
 * 1. Single-scene mounting: Mounts exactly ONE 3D scene at a time behind the glass UI.
 * 2. Crossfade orchestration: Outgoing and incoming scenes crossfade seamlessly via
 *    AnimatePresence without blocking UI updates.
 * 3. Theme awareness: Reads active theme from UI store and provides coherent palettes.
 * 4. Graceful degradation: If WebGL is unavailable, degrades automatically to CSS atmospheric gradients.
 * 5. Reduced motion: Respects accessibility preferences with static, serene compositions.
 */
export const WeatherScene: React.FC<WeatherSceneProps> = ({
  condition = 'Clear',
  iconCode = '01d',
}) => {
  const canonicalScene: SceneType = mapConditionToScene(condition, iconCode);
  const activeTheme = useUIStore((s) => s.activeTheme);
  const shouldReduceMotion = useReducedMotion();

  const [hasWebGL] = useState(() => checkWebGLSupport());
  const [mouseGlow, setMouseGlow] = useState({ x: 0, y: 0 });

  // Subtle interactive cursor ambient illumination
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseGlow({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const palette = getSceneTheme(canonicalScene, activeTheme);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
        background: palette.cssGradient,
        transition: `background ${durations.scene}s cubic-bezier(${CALM_EASE.join(', ')})`,
      }}
    >
      {/* Interactive Cursor Spotlight Glow */}
      <div
        style={{
          position: 'absolute',
          top: mouseGlow.y - 250,
          left: mouseGlow.x - 250,
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, rgba(56, 189, 248, 0.03) 40%, transparent 70%)',
          transition: 'top 0.1s ease-out, left 0.1s ease-out',
          filter: 'blur(32px)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* 3D Scene Layer with Framer Motion Crossfade */}
      <AnimatePresence mode="sync">
        <motion.div
          key={canonicalScene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: shouldReduceMotion ? durations.fast : durations.scene,
            ease: CALM_EASE,
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
          }}
        >
          {hasWebGL ? (
            <Suspense fallback={<div style={{ position: 'absolute', inset: 0 }} />}>
              <SceneCanvas
                scene={canonicalScene}
                palette={palette}
                reducedMotion={shouldReduceMotion}
              />
            </Suspense>
          ) : (
            // Graceful Degradation: Atmospheric CSS Gradient Canvas
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: palette.cssGradient,
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default WeatherScene;
