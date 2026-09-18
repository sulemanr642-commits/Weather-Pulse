import React, { useRef, useMemo, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Scene3DProps } from './ClearDayScene';

/**
 * StormScene: 3D Electric Storm & Violent Precipitation
 * Visuals:
 * - High-speed rain particle system against a saturated electric violet/indigo sky
 * - Occasional screen-space lightning flash via overlay opacity pulse
 *
 * Restraint Choices (Performance Defense):
 * - Reuses the single-draw-call InstancedMesh rain architecture.
 * - Lightning flash implemented as an in-scene translucent billboard plane opacity pulse
 *   (or screen-space overlay), completely avoiding costly dynamic shadow casting or
 *   scene rebuilds.
 * - Reduced-motion safety: lightning flashes automatically disabled to protect photosensitive users.
 */
import { createPRNG } from './prng';

export const StormScene: React.FC<Scene3DProps> = ({ palette, reducedMotion = false }) => {
  const { viewport } = useThree();
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const flashPlaneRef = useRef<THREE.Mesh>(null);
  const [flashOpacity, setFlashOpacity] = useState(0);

  const isMobile = viewport.width < 7;
  const count = isMobile ? 80 : 160;

  // Rain kinematics using deterministic PRNG
  const rainData = useMemo(() => {
    const prng = createPRNG(999);
    const data = [];
    const spreadX = viewport.width * 1.5;
    const spreadY = viewport.height * 1.5;

    for (let i = 0; i < count; i++) {
      data.push({
        x: (prng() - 0.5) * spreadX,
        y: (prng() - 0.5) * spreadY,
        z: -2 - prng() * 5,
        speedY: prng() * 10 + 16, // Faster in storm
        speedX: -3.0,
      });
    }
    return data;
  }, [viewport, count]);

  useEffect(() => {
    if (!instancedMeshRef.current) return;
    const dummy = new THREE.Object3D();

    rainData.forEach((drop, i) => {
      dummy.position.set(drop.x, drop.y, drop.z);
      dummy.rotation.z = 0.2;
      dummy.updateMatrix();
      instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    instancedMeshRef.current.instanceMatrix.needsUpdate = true;
  }, [rainData]);

  // Lightning pulse timer (safe intervals, disabled on reduced motion)
  useEffect(() => {
    if (reducedMotion) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const triggerLightning = () => {
      setFlashOpacity(0.65);
      setTimeout(() => setFlashOpacity(0), 140);

      // Random lightning interval: 4.5s to 12s
      const nextDelay = Math.random() * 7500 + 4500;
      timeoutId = setTimeout(triggerLightning, nextDelay);
    };

    timeoutId = setTimeout(triggerLightning, 3000);
    return () => clearTimeout(timeoutId);
  }, [reducedMotion]);

  useFrame((_, delta) => {
    if (!instancedMeshRef.current) return;

    if (!reducedMotion) {
      const dummy = new THREE.Object3D();
      const halfH = viewport.height * 0.8;

      rainData.forEach((drop, i) => {
        drop.y -= drop.speedY * delta;
        drop.x += drop.speedX * delta;

        if (drop.y < -halfH) {
          drop.y = halfH;
          drop.x = (Math.random() - 0.5) * viewport.width * 1.5;
        }

        dummy.position.set(drop.x, drop.y, drop.z);
        dummy.rotation.z = 0.2;
        dummy.updateMatrix();
        instancedMeshRef.current!.setMatrixAt(i, dummy.matrix);
      });

      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // Smooth flash fade
    if (flashPlaneRef.current) {
      flashPlaneRef.current.visible = flashOpacity > 0;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.5} />

      {/* Dramatic Ominous Backlight */}
      <mesh position={[0, viewport.height * 0.2, -6]}>
        <circleGeometry args={[viewport.width * 0.6, 32]} />
        <meshBasicMaterial
          color={palette.primaryLight}
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Screen-Space Lightning Flash Plane (Zero Dynamic Point Light Cost) */}
      <mesh
        ref={flashPlaneRef}
        position={[0, 0, -1]}
        visible={flashOpacity > 0}
      >
        <planeGeometry args={[viewport.width * 1.5, viewport.height * 1.5]} />
        <meshBasicMaterial
          color="#f3e8ff"
          transparent
          opacity={flashOpacity}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Instanced High-Speed Storm Rain */}
      <instancedMesh
        ref={instancedMeshRef}
        args={[undefined, undefined, count]}
      >
        <planeGeometry args={[0.04, 0.8]} />
        <meshBasicMaterial
          color={palette.particleColor}
          transparent
          opacity={reducedMotion ? 0.25 : 0.6}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>
    </group>
  );
};

export default StormScene;
