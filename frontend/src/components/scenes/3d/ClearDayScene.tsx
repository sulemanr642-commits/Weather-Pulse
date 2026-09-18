import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneColorPalette } from '@design-system';

export interface Scene3DProps {
  palette: SceneColorPalette;
  reducedMotion?: boolean;
}

/**
 * ClearDayScene: 3D Diurnal Atmosphere
 * Visuals:
 * - Radiant glowing solar sphere with pulsing corona and soft rotating light rays
 * - High-altitude translucent atmospheric clouds drifting along the upper horizon
 *
 * Restraint Choices (Performance Defense):
 * - Unlit MeshBasicMaterial with additive blending for rays (zero dynamic shadow calculations)
 * - Single sphere mesh (32x32 segments) and 3 billboard cloud planes
 * - Zero particle overhead, maintaining consistent 60 FPS on mobile chips
 */
export const ClearDayScene: React.FC<Scene3DProps> = ({ palette, reducedMotion = false }) => {
  const { viewport } = useThree();
  const sunRef = useRef<THREE.Mesh>(null);
  const raysRef = useRef<THREE.Group>(null);
  const cloudsRef = useRef<THREE.Group>(null);

  // Cloud position state
  const cloudOffsets = useMemo(() => [
    { x: -viewport.width * 0.35, y: viewport.height * 0.28, z: -4, speed: 0.12, scale: 2.4 },
    { x: viewport.width * 0.15, y: viewport.height * 0.36, z: -6, speed: 0.08, scale: 3.2 },
    { x: viewport.width * 0.55, y: viewport.height * 0.22, z: -8, speed: 0.05, scale: 4.0 },
  ], [viewport]);

  useFrame((state, delta) => {
    if (reducedMotion) return;

    // Gentle solar corona breathing
    if (sunRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.03;
      sunRef.current.scale.set(pulse, pulse, pulse);
    }

    // Slow rotating sun rays
    if (raysRef.current) {
      raysRef.current.rotation.z += delta * 0.04;
    }

    // Parallax cloud drifting with view frustum re-wrapping
    if (cloudsRef.current) {
      cloudsRef.current.children.forEach((cloud, idx) => {
        const offset = cloudOffsets[idx];
        if (!offset) return;
        cloud.position.x += delta * offset.speed;
        const bound = viewport.width * 0.8 + offset.scale;
        if (cloud.position.x > bound) {
          cloud.position.x = -bound;
        }
      });
    }
  });

  return (
    <group>
      <ambientLight intensity={1.2} />

      {/* Sun Core & Corona Glow */}
      <group position={[viewport.width * 0.22, viewport.height * 0.26, -3]}>
        {/* Sun Core Orb */}
        <mesh ref={sunRef}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshBasicMaterial color={palette.primaryLight} />
        </mesh>

        {/* Soft Corona Ring */}
        <mesh position={[0, 0, -0.1]}>
          <circleGeometry args={[2.2, 32]} />
          <meshBasicMaterial
            color={palette.primaryLight}
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Outer Radiant Glow */}
        <mesh position={[0, 0, -0.2]}>
          <circleGeometry args={[3.8, 32]} />
          <meshBasicMaterial
            color={palette.secondaryLight}
            transparent
            opacity={0.18}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Soft Rotating Solar Rays */}
        <group ref={raysRef}>
          {[0, 45, 90, 135].map((angle, i) => (
            <mesh key={i} rotation={[0, 0, (angle * Math.PI) / 180]}>
              <planeGeometry args={[0.25, 7.5]} />
              <meshBasicMaterial
                color={palette.primaryLight}
                transparent
                opacity={0.14}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          ))}
        </group>
      </group>

      {/* High-Altitude Drifting Clouds */}
      <group ref={cloudsRef}>
        {cloudOffsets.map((cloud, idx) => (
          <mesh key={idx} position={[cloud.x, cloud.y, cloud.z]}>
            <planeGeometry args={[cloud.scale * 2.2, cloud.scale * 0.9]} />
            <meshBasicMaterial
              color={palette.cloudTint}
              transparent
              opacity={0.35}
              blending={THREE.NormalBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};

export default ClearDayScene;
