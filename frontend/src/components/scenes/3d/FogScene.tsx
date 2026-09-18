import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Scene3DProps } from './ClearDayScene';

/**
 * FogScene: 3D Volumetric Vapor Veil
 * Visuals:
 * - Low-contrast, soft atmospheric depth with layered horizontal vapor sheets
 *
 * Restraint Choices (Performance Defense):
 * - ZERO particles: Completely eliminates particle buffer updates and ray intersections.
 * - 3 wide translucent billboard planes oscillating with sine-wave phase offsets.
 * - Negligible GPU draw time, making it the most energy-efficient scene in the engine.
 */
export const FogScene: React.FC<Scene3DProps> = ({ palette, reducedMotion = false }) => {
  const { viewport } = useThree();
  const band1Ref = useRef<THREE.Mesh>(null);
  const band2Ref = useRef<THREE.Mesh>(null);
  const band3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (reducedMotion) return;

    const time = state.clock.elapsedTime;

    // Gentle horizontal oscillation and vertical breathing
    if (band1Ref.current) {
      band1Ref.current.position.x = Math.sin(time * 0.15) * (viewport.width * 0.15);
      band1Ref.current.position.y = viewport.height * 0.05 + Math.cos(time * 0.2) * 0.3;
    }
    if (band2Ref.current) {
      band2Ref.current.position.x = Math.cos(time * 0.12) * (viewport.width * 0.2);
      band2Ref.current.position.y = -viewport.height * 0.1 + Math.sin(time * 0.18) * 0.4;
    }
    if (band3Ref.current) {
      band3Ref.current.position.x = Math.sin(time * 0.08) * (viewport.width * 0.25);
      band3Ref.current.position.y = viewport.height * 0.22 + Math.cos(time * 0.14) * 0.3;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.6} />

      {/* Layer 1: Mid-Depth Fog Band */}
      <mesh ref={band1Ref} position={[0, viewport.height * 0.05, -3]}>
        <planeGeometry args={[viewport.width * 1.6, viewport.height * 0.7]} />
        <meshBasicMaterial
          color={palette.cloudTint}
          transparent
          opacity={0.32}
        />
      </mesh>

      {/* Layer 2: Deep Lower Fog Bank */}
      <mesh ref={band2Ref} position={[0, -viewport.height * 0.1, -6]}>
        <planeGeometry args={[viewport.width * 1.8, viewport.height * 0.9]} />
        <meshBasicMaterial
          color={palette.cloudTint}
          transparent
          opacity={0.25}
        />
      </mesh>

      {/* Layer 3: Upper Distant Vapor Sheet */}
      <mesh ref={band3Ref} position={[0, viewport.height * 0.22, -9]}>
        <planeGeometry args={[viewport.width * 2.0, viewport.height * 0.8]} />
        <meshBasicMaterial
          color={palette.cloudTint}
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  );
};

export default FogScene;
