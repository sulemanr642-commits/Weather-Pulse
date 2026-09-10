import React, { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import * as THREE from 'three';
import { SunMedium, CloudRain, Cloud, Snowflake, Zap } from 'lucide-react';

/**
 * Weather3DIcon: Procedural 3D WebGL Canvas for weather conditions.
 * Strictly scoped to the condition focal area in the hero card.
 * Gracefully degrades to vector SVG icons if WebGL fails or if prefers-reduced-motion is active.
 */
export default function Weather3DIcon({ condition = 'Clear', size = 130 }) {
  const mountRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const [webGlSupported, setWebGlSupported] = useState(true);

  // Fallback vector icon renderer
  const renderFallbackIcon = () => {
    const c = (condition || '').toLowerCase();
    if (c.includes('rain')) return <CloudRain size={size * 0.55} className="text-blue-300" />;
    if (c.includes('cloud')) return <Cloud size={size * 0.55} className="text-slate-200" />;
    if (c.includes('snow')) return <Snowflake size={size * 0.55} className="text-cyan-200" />;
    if (c.includes('thunder')) return <Zap size={size * 0.55} className="text-amber-300" />;
    return <SunMedium size={size * 0.55} className="text-amber-400" />;
  };

  useEffect(() => {
    if (shouldReduceMotion || !mountRef.current) return;

    // Check WebGL availability
    try {
      const testCanvas = document.createElement('canvas');
      const gl = testCanvas.getContext('webgl') || testCanvas.getContext('experimental-webgl');
      if (!gl) {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    const container = mountRef.current;
    const width = size;
    const height = size;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.5;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);
    } catch {
      setWebGlSupported(false);
      return;
    }

    // Ambient & Directional Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(3, 4, 5);
    scene.add(dirLight);

    const group = new THREE.Group();
    scene.add(group);

    const condLower = (condition || '').toLowerCase();

    // Procedural 3D Mesh Generation based on condition
    if (condLower.includes('rain')) {
      // Cloud cluster + raindrops
      const cloudMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.4, metalness: 0.1 });
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16), cloudMat);
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), cloudMat);
      c2.position.set(0.6, -0.1, 0);
      const c3 = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), cloudMat);
      c3.position.set(-0.5, -0.15, 0.1);
      group.add(c1, c2, c3);

      // Rain drops
      const dropGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
      const dropMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      for (let i = 0; i < 6; i++) {
        const drop = new THREE.Mesh(dropGeo, dropMat);
        drop.position.set((i - 2.5) * 0.25, -1.0 - (i % 2) * 0.2, (i % 3) * 0.1);
        drop.rotation.z = -0.15;
        group.add(drop);
      }

    } else if (condLower.includes('cloud')) {
      // Soft stylized cloud spheres
      const cloudMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, metalness: 0.1 });
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 16), cloudMat);
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 16), cloudMat);
      c2.position.set(0.65, -0.05, 0);
      const c3 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), cloudMat);
      c3.position.set(-0.6, -0.1, 0.1);
      group.add(c1, c2, c3);

    } else if (condLower.includes('snow')) {
      // Icy cluster with crystalline ring
      const snowMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.2, metalness: 0.2 });
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), snowMat);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.04, 12, 32), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      ring.rotation.x = Math.PI / 3;
      group.add(sphere, ring);

    } else if (condLower.includes('thunder')) {
      // Dark cloud with emissive amber core
      const thunderMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 16), thunderMat);
      const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), thunderMat);
      c2.position.set(0.6, 0, 0);
      const glowSphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
      );
      glowSphere.position.set(0, -0.7, 0.2);
      group.add(c1, c2, glowSphere);

    } else {
      // Golden Sun sphere + luminous outer ring
      const sunMat = new THREE.MeshStandardMaterial({
        color: 0xfbbf24,
        roughness: 0.2,
        metalness: 0.3,
        emissive: 0xd97706,
        emissiveIntensity: 0.3
      });
      const sunSphere = new THREE.Mesh(new THREE.SphereGeometry(0.85, 24, 24), sunMat);
      const coronaRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.25, 0.035, 16, 48),
        new THREE.MeshBasicMaterial({ color: 0xfde047 })
      );
      coronaRing.rotation.x = Math.PI / 4;
      group.add(sunSphere, coronaRing);
    }

    // Animation Loop with Visibility API pausing
    let animationFrameId;
    const animate = () => {
      if (!document.hidden) {
        group.rotation.y += 0.007;
        group.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
        renderer.render(scene, camera);
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Clean up
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
      scene.clear();
    };
  }, [condition, size, shouldReduceMotion]);

  if (shouldReduceMotion || !webGlSupported) {
    return (
      <div 
        style={{ 
          width: size, 
          height: size, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.3))'
        }}
      >
        {renderFallbackIcon()}
      </div>
    );
  }

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: size, 
        height: size, 
        position: 'relative',
        filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.35))'
      }}
    />
  );
}
