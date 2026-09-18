import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Scene3DProps } from './ClearDayScene';

/**
 * CloudyScene: 3D Overcast Cloudscape
 * Visuals:
 * - Layered, semi-transparent cloud volumes drifting at different depths for authentic parallax depth
 *
 * Restraint Choices (Performance Defense):
 * - Avoids expensive 3D raymarched volumetric noise / marching cubes.
 * - Uses 3 depth tiers of soft billboard discs with precomputed alpha blending.
 * - Gentle horizontal translation with wrap-around boundaries; 0 GPU draw-call spikes.
 */
export const CloudyScene: React.FC<Scene3DProps> = ({ palette, reducedMotion = false }) => {
  const { viewport } = useThree();
  const layer1Ref = useRef<THREE.Group>(null);
  const layer2Ref = useRef<THREE.Group>(null);
  const layer3Ref = useRef<THREE.Group>(null);

  // 3 Layers with different depths and speeds for parallax
  const cloudLayers = useMemo(() => {
    return [
      {
        ref: layer1Ref,
        z: -3,
        speed: 0.18,
        opacity: 0.45,
        scale: 2.8,
        clouds: [
          { x: -viewport.width * 0.4, y: viewport.height * 0.15 },
          { x: viewport.width * 0.2, y: viewport.height * 0.25 },
        ],
      },
      {
        ref: layer2Ref,
        z: -6,
        speed: 0.11,
        opacity: 0.35,
        scale: 4.2,
        clouds: [
          { x: -viewport.width * 0.1, y: viewport.height * 0.05 },
          { x: viewport.width * 0.45, y: viewport.height * 0.2 },
        ],
      },
      {
        ref: layer3Ref,
        z: -10,
        speed: 0.06,
        opacity: 0.25,
        scale: 6.0,
        clouds: [
          { x: -viewport.width * 0.3, y: viewport.height * 0.3 },
          { x: viewport.width * 0.1, y: viewport.height * 0.1 },
        ],
      },
    ];
  }, [viewport]);

  useFrame((_, delta) => {
    if (reducedMotion) return;

    cloudLayers.forEach((layer) => {
      if (layer.ref.current) {
        layer.ref.current.children.forEach((cloud) => {
          cloud.position.x += delta * layer.speed;
          const bound = viewport.width * 0.9 + layer.scale;
          if (cloud.position.x > bound) {
            cloud.position.x = -bound;
          }
        });
      }
    });
  });

  return (
    <group>
      <ambientLight intensity={0.9} />

      {cloudLayers.map((layer, layerIdx) => (
        <group key={layerIdx} ref={layer.ref} position={[0, 0, layer.z]}>
          {layer.clouds.map((pos, i) => (
            <group key={i} position={[pos.x, pos.y, 0]}>
              {/* Overlapping puffs creating volumetric appearance */}
              <mesh position={[-0.5 * layer.scale * 0.2, 0, 0]}>
                <circleGeometry args={[layer.scale * 0.45, 24]} />
                <meshBasicMaterial
                  color={palette.cloudTint}
                  transparent
                  opacity={layer.opacity}
                />
              </mesh>
              <mesh position={[0, layer.scale * 0.1, 0]}>
                <circleGeometry args={[layer.scale * 0.55, 24]} />
                <meshBasicMaterial
                  color={palette.cloudTint}
                  transparent
                  opacity={layer.opacity * 1.1}
                />
              </mesh>
              <mesh position={[0.5 * layer.scale * 0.25, -layer.scale * 0.05, 0]}>
                <circleGeometry args={[layer.scale * 0.4, 24]} />
                <meshBasicMaterial
                  color={palette.cloudTint}
                  transparent
                  opacity={layer.opacity * 0.9}
                />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
};

export default CloudyScene;
