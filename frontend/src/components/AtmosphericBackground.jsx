import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * AtmosphericBackground: Ultra-vibrant, interactive, and playful living atmospheric canvas.
 * Features:
 * 1. Interactive cursor glow that follows mouse movement and illuminates the glass surfaces.
 * 2. Drifting volumetric background cloud silhouettes creating atmospheric depth.
 * 3. Multi-layer floating aurora orbs with interactive parallax tilt.
 * 4. Dynamic HTML5 Canvas particle physics (golden sun-dust bokeh, rain streaks, crystalline snow, lightning bloom).
 */
export default function AtmosphericBackground({ condition = 'Clear' }) {
  const canvasRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, rawX: 0, rawY: 0 });

  const condLower = (condition || '').toLowerCase();
  const isRain = condLower.includes('rain') || condLower.includes('drizzle');
  const isThunder = condLower.includes('thunder');
  const isSnow = condLower.includes('snow');
  const isCloudy = condLower.includes('cloud') || condLower.includes('overcast');
  const isClear = !isRain && !isThunder && !isSnow && !isCloudy;

  // Interactive mouse tracking for parallax & cursor glow spotlight
  useEffect(() => {
    const handleMouseMove = (e) => {
      const { innerWidth, innerHeight } = window;
      const nx = (e.clientX / innerWidth - 0.5) * 50;
      const ny = (e.clientY / innerHeight - 0.5) * 50;
      setMousePos({ x: nx, y: ny, rawX: e.clientX, rawY: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Live Canvas Particle System
  useEffect(() => {
    if (shouldReduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle Setup based on condition
    const particleCount = isRain ? 75 : isSnow ? 60 : isThunder ? 80 : 45;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: isSnow ? Math.random() * 3.5 + 1.5 : Math.random() * 2.5 + 1,
        length: isRain || isThunder ? Math.random() * 24 + 14 : 0,
        vx: isRain || isThunder ? -1.8 - Math.random() : (Math.random() - 0.5) * 0.8,
        vy: isRain || isThunder ? Math.random() * 12 + 14 : isSnow ? Math.random() * 1.8 + 0.8 : -Math.random() * 0.8 - 0.4,
        opacity: Math.random() * 0.7 + 0.25,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.04 + 0.02,
      });
    }

    let flashCounter = 0;
    let isFlashing = false;
    let animationFrameId;

    const render = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Thunderstorm Ambient Electric Flash
      if (isThunder) {
        flashCounter++;
        if (flashCounter > 160 && Math.random() < 0.04) {
          isFlashing = true;
          flashCounter = 0;
          setTimeout(() => {
            isFlashing = false;
          }, 110);
        }

        if (isFlashing) {
          ctx.fillStyle = 'rgba(233, 213, 255, 0.22)';
          ctx.fillRect(0, 0, width, height);
        }
      }

      // Draw and update particles
      for (let p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;

        // Wrap around boundaries
        if (p.y > height + 20) {
          p.y = -15;
          p.x = Math.random() * width;
        } else if (p.y < -20) {
          p.y = height + 15;
          p.x = Math.random() * width;
        }

        if (p.x < -30) p.x = width + 30;
        else if (p.x > width + 30) p.x = -30;

        ctx.save();

        if (isRain || isThunder) {
          // Luminous rain streaks
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + p.vx * 2.2, p.y + p.length);
          ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity * 0.85})`;
          ctx.lineWidth = 1.6;
          ctx.lineCap = 'round';
          ctx.stroke();
        } else if (isSnow) {
          // Soft crystalline snowflakes with glow
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.9})`;
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(186, 230, 253, 0.9)';
          ctx.fill();
        } else {
          // Clear / Cloudy: Warm shimmering golden sun-dust / luminous ambient motes
          const dynamicOpacity = Math.sin(p.pulse) * 0.3 + p.opacity;
          const currentRadius = p.radius * (1 + Math.sin(p.pulse) * 0.25);
          ctx.beginPath();
          ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = isClear
            ? `rgba(254, 240, 138, ${Math.max(0.15, dynamicOpacity * 0.65)})`
            : `rgba(224, 242, 254, ${Math.max(0.12, dynamicOpacity * 0.55)})`;
          ctx.shadowBlur = 12;
          ctx.shadowColor = isClear ? 'rgba(245, 158, 11, 0.75)' : 'rgba(56, 189, 248, 0.5)';
          ctx.fill();
        }

        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [condition, isRain, isThunder, isSnow, isClear, shouldReduceMotion]);

  // Dynamic Aurora Orb Palettes (Vibrant, high-contrast, saturated tones)
  const orbConfig = isThunder
    ? {
        c1: 'rgba(147, 51, 234, 0.45)', // Vivid Electric Purple
        c2: 'rgba(217, 70, 239, 0.38)', // Magenta Flare
        c3: 'rgba(250, 204, 21, 0.32)', // Radiant Amber Bolt Glow
        c4: 'rgba(59, 130, 246, 0.35)', // Sapphire Flash
        glowSpot: 'rgba(192, 132, 252, 0.25)',
      }
    : isRain
    ? {
        c1: 'rgba(6, 182, 212, 0.48)',  // Vibrant Cyan
        c2: 'rgba(37, 99, 235, 0.45)',  // Vivid Royal Azure
        c3: 'rgba(56, 189, 248, 0.40)', // Sky Electric Blue
        c4: 'rgba(20, 184, 166, 0.32)', // Oceanic Emerald Teal
        glowSpot: 'rgba(56, 189, 248, 0.25)',
      }
    : isSnow
    ? {
        c1: 'rgba(56, 189, 248, 0.45)', // Frost Azure
        c2: 'rgba(167, 139, 250, 0.38)',// Alpine Violet
        c3: 'rgba(125, 211, 252, 0.40)',// Ice Cyan
        c4: 'rgba(224, 242, 254, 0.30)',// Polar White
        glowSpot: 'rgba(186, 230, 253, 0.25)',
      }
    : isCloudy
    ? {
        c1: 'rgba(96, 165, 250, 0.45)', // Bright Sky Blue
        c2: 'rgba(168, 85, 247, 0.35)', // Twilight Lavender
        c3: 'rgba(251, 146, 60, 0.30)', // Peeking Sunbeam Coral
        c4: 'rgba(14, 165, 233, 0.38)', // Cerulean
        glowSpot: 'rgba(147, 197, 253, 0.25)',
      }
    : {
        // Clear / Sunny (Ultra-Vibrant Golden Sunburst + Azure Sky)
        c1: 'rgba(245, 158, 11, 0.52)', // Radiant Warm Amber Sun
        c2: 'rgba(14, 165, 233, 0.48)', // Electric Azure
        c3: 'rgba(249, 115, 22, 0.40)', // Sunset Coral Flare
        c4: 'rgba(99, 102, 241, 0.38)', // Twilight Indigo
        glowSpot: 'rgba(253, 224, 71, 0.28)',
      };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* 1. Interactive Cursor Glow Spotlight (Follows user's mouse for a fun tactile feel) */}
      {mousePos.rawX > 0 && (
        <div
          style={{
            position: 'absolute',
            top: mousePos.rawY - 250,
            left: mousePos.rawX - 250,
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${orbConfig.glowSpot} 0%, transparent 70%)`,
            filter: 'blur(50px)',
            pointerEvents: 'none',
            transition: 'top 0.12s ease-out, left 0.12s ease-out',
            zIndex: 1,
          }}
        />
      )}

      {/* 2. Soft Drifting Volumetric Cloud Silhouettes in Background (Adds depth & parallax) */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: [-120, window.innerWidth + 120],
              }
        }
        transition={{ duration: 75, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          top: '12%',
          left: 0,
          opacity: 0.16,
          filter: 'blur(20px)',
        }}
      >
        <svg width="420" height="180" viewBox="0 0 420 180" fill="none">
          <path
            d="M60 140 C40 140 20 120 30 100 C25 80 45 60 70 65 C85 40 125 35 150 55 C175 30 220 30 245 55 C270 45 310 55 320 80 C345 80 365 100 355 125 C370 140 350 160 330 160 Z"
            fill="#ffffff"
          />
        </svg>
      </motion.div>

      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: [window.innerWidth + 80, -200],
              }
        }
        transition={{ duration: 95, repeat: Infinity, ease: 'linear', delay: 15 }}
        style={{
          position: 'absolute',
          top: '38%',
          right: 0,
          opacity: 0.12,
          filter: 'blur(30px)',
        }}
      >
        <svg width="500" height="200" viewBox="0 0 500 200" fill="none">
          <path
            d="M80 150 C50 150 30 130 40 105 C35 80 65 60 95 68 C115 40 165 35 195 58 C225 30 280 30 310 58 C340 48 390 60 400 90 C430 90 455 110 445 138 C465 155 440 175 415 175 Z"
            fill="#ffffff"
          />
        </svg>
      </motion.div>

      {/* 3. Floating Aurora Liquid Orbs (High-saturation, mouse parallax tilt) */}
      {/* Orb 1: Top Left Radiant Halo */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: [-40, 50, -40],
                y: [0, 60, 0],
                scale: [1, 1.2, 1],
              }
        }
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '-12%',
          left: '8%',
          width: '620px',
          height: '620px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orbConfig.c1} 0%, transparent 68%)`,
          filter: 'blur(80px)',
          transform: `translate(${mousePos.x * 1.1}px, ${mousePos.y * 1.1}px)`,
          transition: 'transform 0.25s ease-out',
        }}
      />

      {/* Orb 2: Top Right Warm Sunburst / Flare Glow */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: [30, -50, 30],
                y: [0, -40, 0],
                scale: [1.15, 0.95, 1.15],
              }
        }
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: '3%',
          right: '3%',
          width: '580px',
          height: '580px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orbConfig.c2} 0%, transparent 68%)`,
          filter: 'blur(75px)',
          transform: `translate(${-mousePos.x * 0.9}px, ${-mousePos.y * 0.9}px)`,
          transition: 'transform 0.25s ease-out',
        }}
      />

      {/* Orb 3: Bottom Center Deep Vibrant Glow */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                x: [-25, 40, -25],
                y: [25, -45, 25],
                scale: [0.95, 1.25, 0.95],
              }
        }
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: '2%',
          left: '25%',
          width: '680px',
          height: '680px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orbConfig.c3} 0%, transparent 68%)`,
          filter: 'blur(90px)',
          transform: `translate(${mousePos.x * 0.6}px, ${mousePos.y * 0.6}px)`,
          transition: 'transform 0.25s ease-out',
        }}
      />

      {/* Orb 4: Bottom Right Ambient Glow */}
      <motion.div
        animate={
          shouldReduceMotion
            ? {}
            : {
                scale: [1, 1.3, 1],
                opacity: [0.65, 0.95, 0.65],
              }
        }
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orbConfig.c4} 0%, transparent 68%)`,
          filter: 'blur(75px)',
        }}
      />

      {/* 4. Dynamic Weather Particle Canvas (Sun-dust bokeh, rain, snow, thunder) */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}
