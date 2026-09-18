import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Scene3DProps } from './ClearDayScene';

/**
 * SnowScene: 3D Crystalline Snowdrift Atmosphere
 * Visuals:
 * - Gently drifting snowflakes with lateral sinusoidal sway
 * - Crisp arctic diffuse lighting and soft snow clouds
 *
 * Restraint Choices (Performance Defense):
 * - THREE.InstancedMesh: All 120 snowflakes rendered in a SINGLE draw call.
 * - Procedural trigonometric lateral sway calculated directly in memory.
 * - Simple disc geometry (args: [0.08, 12]), eliminating complex snowflake meshes.
 */
import { createPRNG } from './prng';

export const SnowScene: React.FC<Scene3DProps> = ({ palette, reducedMotion = false }) => {
  const { viewport } = useThree();
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);

  const isMobile = viewport.width < 7;
  const count = isMobile ? 60 : 120;

  // Pre-generate flake kinematics using deterministic PRNG
  const snowData = useMemo(() => {
    const prng = createPRNG(777);
    const data = [];
    const spreadX = viewport.width * 1.5;
    const spreadY = viewport.height * 1.5;

    for (let i = 0; i < count; i++) {
      data.push({
        x: (prng() - 0.5) * spreadX,
        y: (prng() - 0.5) * spreadY,
        z: -1 - prng() * 6,
        baseX: 0,
        scale: prng() * 0.08 + 0.04,
        speedY: prng() * 1.2 + 0.6,
        swaySpeed: prng() * 2.0 + 1.0,
        swayAmount: prng() * 0.8 + 0.3,
        phase: prng() * Math.PI * 2,
      });
    }
    return data;
  }, [viewport, count]);

  useEffect(() => {
    if (!instancedMeshRef.current) return;
    const dummy = new THREE.Object3D();

    snowData.forEach((flake, i) => {
      flake.baseX = flake.x;
      dummy.position.set(flake.x, flake.y, flake.z);
      dummy.scale.set(flake.scale, flake.scale, flake.scale);
      dummy.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [snowData]);

  useFrame((state, delta) => {
    if (reducedMotion || !instancedMeshRef.current) return;

    const dummy = new THREE.Object3D();
    const halfH = viewport.height * 0.8;
    const time = state.clock.elapsedTime;

    snowData.forEach((flake, i) => {
      flake.y -= flake.speedY * delta;
      flake.x = flake.baseX + Math.sin(time * flake.swaySpeed + flake.phase) * flake.swayAmount;

      // Wrap around top
      if (flake.y < -halfH) {
        flake.y = halfH;
        flake.baseX = (Math.random() - 0.5) * viewport.width * 1.5;
      }

      dummy.position.set(flake.x, flake.y, flake.z);
      dummy.scale.set(flake.scale, flake.scale, flake.scale);
      dummy.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <ambientLight intensity={0.8} />

      {/* Atmospheric Soft Light Aura */}
      <mesh position={[0, viewport.height * 0.25, -4]}>
        <circleGeometry args={[viewport.width * 0.55, 32]} />
        <meshBasicMaterial
          color={palette.secondaryLight}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Instanced Snowflakes */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, count]}
      >
        <circleGeometry args={[1, 12]} />
        <meshBasicMaterial
          color={palette.particleColor}
          transparent
          opacity={0.75}
        />
      </instancedMesh>
    </group>
  );
};

export default SnowScene;
