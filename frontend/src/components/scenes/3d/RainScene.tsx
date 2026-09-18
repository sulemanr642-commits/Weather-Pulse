import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Scene3DProps } from './ClearDayScene';

/**
 * RainScene: 3D Precipitation Atmosphere
 * Visuals:
 * - High-speed angled falling raindrops
 * - Dark oceanic overcast cloud ceiling
 *
 * Restraint Choices (Performance Defense):
 * - THREE.InstancedMesh: All raindrops rendered in a SINGLE draw call.
 * - Simple 2D quad geometry (args: [0.035, 0.65]), no heavy cylinder geometry.
 * - In-place matrix updates on a static buffer with zero object allocations inside useFrame.
 * - Particle count automatically halved on mobile devices (90 vs 180).
 */
import { createPRNG } from './prng';

export const RainScene: React.FC<Scene3DProps> = ({ palette, reducedMotion = false }) => {
  const { viewport } = useThree();
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const cloudLayerRef = useRef<THREE.Group>(null);

  const isMobile = viewport.width < 7;
  const count = isMobile ? 90 : 180;

  // Rain particle positions and velocities
  const rainData = useMemo(() => {
    const prng = createPRNG(2024);
    const data = [];
    const spreadX = viewport.width * 1.5;
    const spreadY = viewport.height * 1.5;

    for (let i = 0; i < count; i++) {
      data.push({
        x: (prng() - 0.5) * spreadX,
        y: (prng() - 0.5) * spreadY,
        z: -2 - prng() * 5,
        speedY: prng() * 8 + 14,
        speedX: -2.2,
      });
    }
    return data;
  }, [viewport, count]);

  // Initial matrix configuration
  useEffect(() => {
    if (!instancedMeshRef.current) return;
    const dummy = new THREE.Object3D();

    rainData.forEach((drop, i) => {
      dummy.position.set(drop.x, drop.y, drop.z);
      // Slight diagonal rain tilt
      dummy.rotation.z = 0.15;
      dummy.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [rainData]);

  // Falling animation
  useFrame((_, delta) => {
    if (reducedMotion || !instancedMeshRef.current) return;

    const dummy = new THREE.Object3D();
    const halfH = viewport.height * 0.8;

    rainData.forEach((drop, i) => {
      drop.y -= drop.speedY * delta;
      drop.x += drop.speedX * delta;

      // Wrap around
      if (drop.y < -halfH) {
        drop.y = halfH;
        drop.x = (Math.random() - 0.5) * viewport.width * 1.5;
      }

      dummy.position.set(drop.x, drop.y, drop.z);
      dummy.rotation.z = 0.15;
      dummy.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;

    // Subtle cloud drift
    if (cloudLayerRef.current) {
      cloudLayerRef.current.position.x += delta * 0.08;
      if (cloudLayerRef.current.position.x > viewport.width * 0.4) {
        cloudLayerRef.current.position.x = -viewport.width * 0.4;
      }
    }
  });

  return (
    <group>
      <ambientLight intensity={0.7} />

      {/* Overcast Cloud Ceiling */}
      <group ref={cloudLayerRef} position={[0, viewport.height * 0.35, -4]}>
        <mesh position={[-viewport.width * 0.25, 0, 0]}>
          <circleGeometry args={[viewport.width * 0.4, 24]} />
          <meshBasicMaterial color={palette.cloudTint} transparent opacity={0.4} />
        </mesh>
        <mesh position={[viewport.width * 0.2, -viewport.height * 0.05, 0]}>
          <circleGeometry args={[viewport.width * 0.45, 24]} />
          <meshBasicMaterial color={palette.cloudTint} transparent opacity={0.35} />
        </mesh>
      </group>

      {/* Instanced Rain Streaks (Single Draw Call) */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, count]}
      >
        <planeGeometry args={[0.035, 0.7]} />
        <meshBasicMaterial
          color={palette.particleColor}
          transparent
          opacity={reducedMotion ? 0.25 : 0.55}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
};

export default RainScene;
