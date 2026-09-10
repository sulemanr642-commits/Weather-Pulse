import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * WeatherSymbol: Ultra-vibrant, high-fidelity animated meteorological illustration system.
 * Designed with visionOS / Apple Weather aesthetic:
 * - Multi-layered volumetric 3D shading with specular glass highlights.
 * - Organic breathing animations (no robotic spinning tick-marks).
 * - Multi-puff volumetric sculpted clouds with rim lighting and sun god-rays.
 * - Glassy liquid rain drops with ripple impacts.
 * - Multi-segmented neon electric lightning bolt with internal cloud illumination.
 * - Crystalline geometric snowflakes with gentle swaying drift.
 */
export default function WeatherSymbol({ condition = 'Clear', size = 120 }) {
  const shouldReduceMotion = useReducedMotion();
  const condLower = (condition || '').toLowerCase();

  // Condition classification
  const isRain = condLower.includes('rain') || condLower.includes('drizzle');
  const isThunder = condLower.includes('thunder');
  const isSnow = condLower.includes('snow');
  const isCloudy = condLower.includes('cloud') || condLower.includes('overcast');
  const isPartlyCloudy = isCloudy && (condLower.includes('few') || condLower.includes('scattered') || condLower.includes('partly'));
  const isClear = !isRain && !isThunder && !isSnow && !isCloudy;

  const s = size;

  // =========================================================================
  // 1. RAIN SYMBOL: Glassy volumetric dark cloud + liquid teardrops + ripples
  // =========================================================================
  if (isRain) {
    return (
      <div
        style={{
          width: s,
          height: s,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 14px 28px rgba(14, 165, 233, 0.45))',
        }}
      >
        <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
          <defs>
            {/* Moody oceanic rain cloud gradient */}
            <linearGradient id="rainCloudMain" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="35%" stopColor="#475569" />
              <stop offset="85%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="rainCloudHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="0.2" />
            </linearGradient>

            {/* Glowing liquid drop gradient */}
            <linearGradient id="dropGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <filter id="rainGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Back-Cloud Puff */}
          <motion.ellipse
            cx="48"
            cy="46"
            rx="24"
            ry="20"
            fill="#334155"
            opacity="0.6"
            animate={shouldReduceMotion ? {} : { y: [-1, 2, -1], x: [-1, 1, -1] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Main Volumetric Cloud Formation (Multiple billowy intersecting lobes) */}
          <motion.g
            animate={shouldReduceMotion ? {} : { y: [-2, 2, -2] }}
            transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Bottom cloud bed */}
            <rect x="28" y="52" width="64" height="20" rx="10" fill="url(#rainCloudMain)" />

            {/* Left puff */}
            <circle cx="42" cy="54" r="18" fill="url(#rainCloudMain)" />
            {/* Center main puffy peak */}
            <circle cx="60" cy="42" r="22" fill="url(#rainCloudMain)" />
            {/* Right puff */}
            <circle cx="78" cy="52" r="16" fill="url(#rainCloudMain)" />

            {/* Rim highlight curve on top of cloud */}
            <path
              d="M32 54 C34 40 50 36 58 32 C68 28 80 34 86 48 C92 50 94 62 86 66"
              stroke="url(#rainCloudHighlight)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.85"
            />
          </motion.g>

          {/* Falling Liquid Rain Drops */}
          {[
            { cx: 38, cyBase: 76, delay: 0 },
            { cx: 52, cyBase: 76, delay: 0.35 },
            { cx: 66, cyBase: 76, delay: 0.15 },
            { cx: 80, cyBase: 76, delay: 0.5 },
          ].map((drop, idx) => (
            <motion.g
              key={idx}
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      y: [0, 24],
                      opacity: [0, 1, 0.9, 0],
                    }
              }
              transition={{
                duration: 0.95,
                repeat: Infinity,
                delay: drop.delay,
                ease: 'easeIn',
              }}
            >
              {/* Teardrop shape */}
              <path
                d={`M${drop.cx} 74 C${drop.cx - 2.5} 80 ${drop.cx - 3} 84 ${drop.cx} 87 C${drop.cx + 3} 84 ${drop.cx + 2.5} 80 ${drop.cx} 74 Z`}
                fill="url(#dropGrad)"
                filter="url(#rainGlow)"
              />
              {/* Tiny specular dot */}
              <circle cx={drop.cx - 0.8} cy="83" r="0.8" fill="#fff" opacity="0.8" />
            </motion.g>
          ))}

          {/* Ground Splash Ripples */}
          {[
            { cx: 40, delay: 0.6 },
            { cx: 64, delay: 0.8 },
            { cx: 78, delay: 1.1 },
          ].map((ripple, idx) => (
            <motion.ellipse
              key={`ripple-${idx}`}
              cx={ripple.cx}
              cy="104"
              rx="6"
              ry="2"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.2"
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      rx: [2, 8],
                      ry: [0.5, 2.5],
                      opacity: [0.8, 0],
                    }
              }
              transition={{
                duration: 0.7,
                repeat: Infinity,
                delay: ripple.delay,
                ease: 'easeOut',
              }}
            />
          ))}
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 2. THUNDERSTORM SYMBOL: Brooding stormhead + ambient flash + electric bolt
  // =========================================================================
  if (isThunder) {
    return (
      <div
        style={{
          width: s,
          height: s,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 16px 32px rgba(168, 85, 247, 0.5))',
        }}
      >
        <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
          <defs>
            <linearGradient id="stormCloudMain" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="40%" stopColor="#334155" />
              <stop offset="85%" stopColor="#1e1b4b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id="electricBoltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#fef08a" />
              <stop offset="60%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#eab308" />
            </linearGradient>

            <filter id="boltNeonBloom" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Internal Storm Cloud Lightning Flash Glow */}
          <motion.circle
            cx="60"
            cy="52"
            r="38"
            fill="radial-gradient(circle, rgba(234, 179, 8, 0.45) 0%, rgba(168, 85, 247, 0.25) 50%, transparent 80%)"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    opacity: [0, 0, 0.85, 0.1, 0.95, 0, 0],
                    scale: [0.9, 0.9, 1.15, 1.0, 1.2, 0.9, 0.9],
                  }
            }
            transition={{
              duration: 2.8,
              repeat: Infinity,
              times: [0, 0.65, 0.7, 0.74, 0.82, 0.88, 1],
            }}
          />

          {/* Volumetric Storm Cloud Formation */}
          <motion.g
            animate={shouldReduceMotion ? {} : { y: [-2, 2, -2] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {/* Storm cloud bed */}
            <rect x="26" y="50" width="68" height="22" rx="11" fill="url(#stormCloudMain)" />
            <circle cx="42" cy="52" r="19" fill="url(#stormCloudMain)" />
            <circle cx="62" cy="40" r="23" fill="url(#stormCloudMain)" />
            <circle cx="82" cy="50" r="17" fill="url(#stormCloudMain)" />

            {/* Glowing violet rim on top */}
            <path
              d="M30 52 C32 38 48 34 58 30 C70 26 84 32 90 46"
              stroke="rgba(216, 180, 254, 0.75)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </motion.g>

          {/* Sharp High-Energy Jagged Lightning Bolt with Branch */}
          <motion.g
            filter="url(#boltNeonBloom)"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    opacity: [0.1, 0.1, 1, 0.25, 1, 0.1, 0.1],
                    scale: [0.96, 0.96, 1.08, 0.98, 1.06, 0.96, 0.96],
                  }
            }
            transition={{
              duration: 2.8,
              repeat: Infinity,
              times: [0, 0.65, 0.7, 0.74, 0.82, 0.88, 1],
            }}
            style={{ transformOrigin: '64px 60px' }}
          >
            {/* Main Zap Bolt */}
            <polygon
              points="66,48 54,68 64,68 56,98 78,64 67,64"
              fill="url(#electricBoltGrad)"
              stroke="#ffffff"
              strokeWidth="1"
            />
            {/* Mini subsidiary branching fork */}
            <polygon
              points="58,74 50,84 55,84 52,94 60,80 56,80"
              fill="url(#electricBoltGrad)"
              opacity="0.8"
            />
          </motion.g>
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 3. SNOW SYMBOL: Frost cloud + crystalline geometric snowflakes swaying
  // =========================================================================
  if (isSnow) {
    return (
      <div
        style={{
          width: s,
          height: s,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 14px 28px rgba(56, 189, 248, 0.45))',
        }}
      >
        <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
          <defs>
            <linearGradient id="snowCloudMain" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#e2e8f0" />
              <stop offset="85%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <filter id="frostGlow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Winter Cloud Formation */}
          <motion.g
            animate={shouldReduceMotion ? {} : { y: [-2, 2, -2] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="28" y="48" width="64" height="20" rx="10" fill="url(#snowCloudMain)" />
            <circle cx="44" cy="50" r="18" fill="url(#snowCloudMain)" />
            <circle cx="62" cy="38" r="22" fill="url(#snowCloudMain)" />
            <circle cx="80" cy="48" r="16" fill="url(#snowCloudMain)" />

            {/* Glacial icy specular highlight */}
            <path
              d="M34 50 C36 36 52 32 60 28 C72 24 84 30 88 44"
              stroke="#ffffff"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
          </motion.g>

          {/* Intricate 6-Fold Crystalline Snowflakes with Swaying Physics */}
          {[
            { cx: 40, cyBase: 78, delay: 0, scale: 1.1 },
            { cx: 62, cyBase: 86, delay: 0.4, scale: 1.3 },
            { cx: 82, cyBase: 80, delay: 0.2, scale: 0.95 },
          ].map((flake, idx) => (
            <motion.g
              key={idx}
              transform={`translate(${flake.cx}, ${flake.cyBase})`}
              filter="url(#frostGlow)"
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      rotate: [0, 360],
                      x: [-3, 3, -3],
                      y: [-2, 8, -2],
                      opacity: [0.75, 1, 0.75],
                    }
              }
              transition={{
                rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
                x: { duration: 3, repeat: Infinity, delay: flake.delay, ease: 'easeInOut' },
                y: { duration: 3, repeat: Infinity, delay: flake.delay, ease: 'easeInOut' },
                opacity: { duration: 3, repeat: Infinity, delay: flake.delay },
              }}
              style={{ transformOrigin: '0 0' }}
            >
              {/* 6 radiating crystal branches */}
              {[0, 60, 120, 180, 240, 300].map((angle, bIdx) => (
                <g key={bIdx} transform={`rotate(${angle}) scale(${flake.scale})`}>
                  <line x1="0" y1="0" x2="0" y2="-9" stroke="#bae6fd" strokeWidth="1.6" strokeLinecap="round" />
                  <line x1="0" y1="-5" x2="-2.5" y2="-7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                  <line x1="0" y1="-5" x2="2.5" y2="-7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                </g>
              ))}
              <circle cx="0" cy="0" r="2" fill="#ffffff" />
            </motion.g>
          ))}
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 4. CLOUDY & PARTLY CLOUDY: Volumetric billowy cloud lobes + golden sun god-rays
  // =========================================================================
  if (isCloudy) {
    return (
      <div
        style={{
          width: s,
          height: s,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 16px 36px rgba(56, 189, 248, 0.45))',
        }}
      >
        <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
          <defs>
            {/* Luminous Warm Sun behind clouds */}
            <radialGradient id="behindSun" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>

            <radialGradient id="behindSunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(253, 224, 71, 0.85)" />
              <stop offset="55%" stopColor="rgba(245, 158, 11, 0.35)" />
              <stop offset="100%" stopColor="rgba(217, 119, 6, 0)" />
            </radialGradient>

            {/* Volumetric Soft Silver Cloud */}
            <linearGradient id="cloudLobe1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#f1f5f9" />
              <stop offset="85%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            <linearGradient id="cloudUnderbody" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            <filter id="softHalo" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Luminous Golden Sun Peeking Dramatically from behind Top-Right */}
          <motion.g
            animate={
              shouldReduceMotion
                ? {}
                : {
                    scale: [1, 1.08, 1],
                    rotate: [0, 45, 0],
                  }
            }
            transition={{
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 16, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{ transformOrigin: '76px 36px' }}
          >
            {/* Radiant Sun Halo */}
            <circle cx="76" cy="36" r="28" fill="url(#behindSunGlow)" />

            {/* Diagonal Warm God-Rays bursting behind cloud */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, rIdx) => (
              <line
                key={rIdx}
                x1="76"
                y1="14"
                x2="76"
                y2="20"
                stroke="#fde047"
                strokeWidth="2.5"
                strokeLinecap="round"
                transform={`rotate(${angle} 76 36)`}
                opacity="0.8"
              />
            ))}

            {/* Glowing Golden Sun Disc */}
            <circle cx="76" cy="36" r="16" fill="url(#behindSun)" filter="url(#softHalo)" />
            {/* Glossy highlight */}
            <ellipse cx="72" cy="32" rx="4" ry="2.5" fill="#ffffff" opacity="0.75" />
          </motion.g>

          {/* Foreground Volumetric Sculpted Cloud Group */}
          <motion.g
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [-3, 3, -3],
                    x: [-2, 2, -2],
                    scaleY: [1, 0.98, 1],
                    scaleX: [1, 1.02, 1],
                  }
            }
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '54px 62px' }}
          >
            {/* Cloud shadow underbody */}
            <rect x="22" y="56" width="66" height="22" rx="11" fill="url(#cloudUnderbody)" />

            {/* Left billow puff */}
            <circle cx="38" cy="56" r="20" fill="url(#cloudLobe1)" />
            {/* Main center high peak */}
            <circle cx="58" cy="42" r="24" fill="url(#cloudLobe1)" />
            {/* Right overlapping puff */}
            <circle cx="78" cy="54" r="17" fill="url(#cloudLobe1)" />

            {/* Specular curved rim lights where the sun rays strike */}
            <path
              d="M26 56 C28 40 44 36 54 30 C66 24 82 30 88 46"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
              opacity="0.95"
            />
            <path
              d="M62 38 C72 36 82 42 86 52"
              stroke="rgba(253, 224, 71, 0.65)"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
            />
          </motion.g>
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 5. CLEAR / SUNNY SYMBOL: Ultra-vibrant 3D molten golden solar orb
  //    (Replaces crude spinning tick-rays with breathing solar flares & corona)
  // =========================================================================
  return (
    <div
      style={{
        width: s,
        height: s,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(0 18px 42px rgba(245, 158, 11, 0.65))',
      }}
    >
      <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
        <defs>
          {/* Deep Molten 3D Solar Core Gradient */}
          <radialGradient id="sun3DCore" cx="35%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="55%" stopColor="#facc15" />
            <stop offset="78%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </radialGradient>

          {/* Organic Pulsing Outer Corona */}
          <radialGradient id="outerCorona" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(254, 240, 138, 0.95)" />
            <stop offset="45%" stopColor="rgba(245, 158, 11, 0.5)" />
            <stop offset="75%" stopColor="rgba(249, 115, 22, 0.2)" />
            <stop offset="100%" stopColor="rgba(217, 119, 6, 0)" />
          </radialGradient>

          {/* Soft solar flare bloom */}
          <filter id="solarBloom" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Pulsing Corona Atmosphere */}
        <motion.circle
          cx="60"
          cy="60"
          r="52"
          fill="url(#outerCorona)"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [0.95, 1.14, 0.95],
                  opacity: [0.75, 1, 0.75],
                }
          }
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Volumetric Layered Solar Ray Petals (Soft, tapered organic light flares) */}
        <motion.g
          animate={shouldReduceMotion ? {} : { rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '60px 60px' }}
        >
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, idx) => {
            const isLong = idx % 2 === 0;
            return (
              <motion.path
                key={idx}
                d={
                  isLong
                    ? 'M58 20 C58 12 60 8 60 8 C60 8 62 12 62 20 Z'
                    : 'M58.5 24 C58.5 17 60 14 60 14 C60 14 61.5 17 61.5 24 Z'
                }
                fill="#fde047"
                transform={`rotate(${angle} 60 60)`}
                opacity={isLong ? 0.9 : 0.6}
                animate={
                  shouldReduceMotion
                    ? {}
                    : {
                        scaleY: isLong ? [1, 1.25, 1] : [1, 1.15, 1],
                        opacity: isLong ? [0.7, 1, 0.7] : [0.5, 0.8, 0.5],
                      }
                }
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: (idx * 0.15) % 1,
                  ease: 'easeInOut',
                }}
                style={{ transformOrigin: '60px 60px' }}
              />
            );
          })}
        </motion.g>

        {/* Secondary Inner Solar Halo */}
        <motion.circle
          cx="60"
          cy="60"
          r="34"
          fill="rgba(253, 224, 71, 0.45)"
          filter="url(#solarBloom)"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.08, 1],
                }
          }
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* 3D Molten Golden Sun Core Sphere */}
        <motion.circle
          cx="60"
          cy="60"
          r="26"
          fill="url(#sun3DCore)"
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth="1.8"
          animate={
            shouldReduceMotion
              ? {}
              : {
                  scale: [1, 1.05, 1],
                }
          }
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Top-Left Glossy Specular Reflection Arc */}
        <path
          d="M46 44 A18 18 0 0 1 72 44 A24 24 0 0 0 46 44 Z"
          fill="#ffffff"
          opacity="0.8"
        />
        {/* Secondary subtle crescent glow */}
        <ellipse cx="52" cy="46" rx="6" ry="3.5" fill="#ffffff" opacity="0.9" />

        {/* Micro Solar Sparkles / Fireflies */}
        {[
          { cx: 34, cy: 38, delay: 0 },
          { cx: 86, cy: 42, delay: 0.8 },
          { cx: 78, cy: 84, delay: 0.4 },
        ].map((sparkle, sIdx) => (
          <motion.circle
            key={sIdx}
            cx={sparkle.cx}
            cy={sparkle.cy}
            r="1.8"
            fill="#ffffff"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    scale: [0, 1.4, 0],
                    opacity: [0, 1, 0],
                  }
            }
            transition={{
              duration: 2.2,
              repeat: Infinity,
              delay: sparkle.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </svg>
    </div>
  );
}
