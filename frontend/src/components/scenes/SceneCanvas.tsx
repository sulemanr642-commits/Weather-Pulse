import React, { Suspense, lazy } from 'react';
import { Canvas } from '@react-three/fiber';
import type { SceneType, SceneColorPalette } from '@design-system';

// Code-split 3D scene implementations
const ClearDayScene = lazy(() => import('./3d/ClearDayScene'));
const ClearNightScene = lazy(() => import('./3d/ClearNightScene'));
const CloudyScene = lazy(() => import('./3d/CloudyScene'));
const RainScene = lazy(() => import('./3d/RainScene'));
const SnowScene = lazy(() => import('./3d/SnowScene'));
const StormScene = lazy(() => import('./3d/StormScene'));
const FogScene = lazy(() => import('./3d/FogScene'));

export interface SceneCanvasProps {
  scene: SceneType;
  palette: SceneColorPalette;
  reducedMotion?: boolean;
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  scene,
  palette,
  reducedMotion = false,
}) => {
  const renderSceneContent = () => {
    switch (scene) {
      case 'clear-night':
        return <ClearNightScene palette={palette} reducedMotion={reducedMotion} />;
      case 'cloudy':
        return <CloudyScene palette={palette} reducedMotion={reducedMotion} />;
      case 'rain':
        return <RainScene palette={palette} reducedMotion={reducedMotion} />;
      case 'snow':
        return <SnowScene palette={palette} reducedMotion={reducedMotion} />;
      case 'storm':
        return <StormScene palette={palette} reducedMotion={reducedMotion} />;
      case 'fog':
        return <FogScene palette={palette} reducedMotion={reducedMotion} />;
      case 'clear-day':
      default:
        return <ClearDayScene palette={palette} reducedMotion={reducedMotion} />;
    }
  };

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 60 }}
      dpr={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 1.5)}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        depth: true,
        stencil: false,
      }}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        width: '100%',
        height: '100%',
      }}
    >
      <Suspense fallback={null}>
        {renderSceneContent()}
      </Suspense>
    </Canvas>
  );
};

export default SceneCanvas;
