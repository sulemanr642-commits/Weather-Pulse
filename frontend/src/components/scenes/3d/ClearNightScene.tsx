import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Scene3DProps } from './ClearDayScene';

import { createPRNG } from './prng';

/**
 * ClearNightScene: 3D Nocturnal Atmosphere
 * Visuals:
 * - Serene crescent/lunar disc with soft radial glow
 * - Field of gently twinkling celestial stars using instanced geometry
 *
 * Restraint Choices (Performance Defense):
 * - THREE.InstancedMesh: All 200 stars render in ONE single draw call.
 * - Single buffer attribute updates twinkle phases; no individual component re-renders.
 * - Particle density automatically halves on mobile devices.
 */
export const ClearNightScene: React.FC<Scene3DProps> = ({ palette, reducedMotion = false }) => {
  const { viewport } = useThree();
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const moonRef = useRef<THREE.Group>(null);

  const isMobile = viewport.width < 7;
  const starCount = isMobile ? 100 : 220;

  // Pre-generate star positions and twinkle phase offsets using deterministic PRNG
  const starData = useMemo(() => {
    const prng = createPRNG(1337);
    const data = [];
    const spreadX = viewport.width * 1.8;
    const spreadY = viewport.height * 1.6;

    for (let i = 0; i < starCount; i++) {
      data.push({
        x: (prng() - 0.5) * spreadX,
        y: (prng() - 0.5) * spreadY,
        z: -5 - prng() * 8,
        scale: prng() * 0.07 + 0.03,
        twinkleSpeed: prng() * 2.5 + 1.0,
        phase: prng() * Math.PI * 2,
      });
    }
    return data;
  }, [viewport, starCount]);

  // Set initial instance matrices
  useEffect(() => {
    if (!instancedMeshRef.current) return;
    const dummy = new THREE.Object3D();

    starData.forEach((star, i) => {
      dummy.position.set(star.x, star.y, star.z);
      dummy.scale.set(star.scale, star.scale, star.scale);
      dummy.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [starData]);

  // Gentle twinkle animation via instance scale / color
  useFrame((state) => {
    if (reducedMotion || !instancedMeshRef.current) return;

    const dummy = new THREE.Object3D();
    const time = state.clock.elapsedTime;

    starData.forEach((star, i) => {
      const twinkle = 0.6 + Math.sin(time * star.twinkleSpeed + star.phase) * 0.4;
      const s = star.scale * twinkle;
      dummy.position.set(star.x, star.y, star.z);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <ambientLight intensity={0.4} />

      {/* Instanced Twinkling Starfield (Single Draw Call) */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, starCount]}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={palette.particleColor} />
      </instancedMesh>

      {/* Radiant Moon */}
      <group ref={moonRef} position={[viewport.width * 0.25, viewport.height * 0.28, -4]}>
        {/* Moon Disc */}
        <mesh>
          <sphereGeometry args={[0.9, 32, 32]} />
          <meshBasicMaterial color={palette.primaryLight} />
        </mesh>

        {/* Soft Inner Lunar Halo */}
        <mesh position={[0, 0, -0.05]}>
          <circleGeometry args={[1.5, 32]} />
          <meshBasicMaterial
            color={palette.primaryLight}
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Diffuse Outer Celestial Glow */}
        <mesh position={[0, 0, -0.1]}>
          <circleGeometry args={[2.8, 32]} />
          <meshBasicMaterial
            color={palette.secondaryLight}
            transparent
            opacity={0.12}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
};

export default ClearNightScene;
