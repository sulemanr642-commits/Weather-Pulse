import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { mapConditionToScene, SceneType, symbolMotion } from '@design-system';

/**
 * WeatherSymbol: Refined secondary meteorological illustration system.
 * Acts as a focused, small-scale companion beside the primary temperature readout,
 * visually harmonizing with the full-screen 3D atmospheric background scene.
 *
 * Both the 3D scene and this emblem derive from the identical canonical mapping
 * in design-system/scenes.ts to guarantee visual and meteorological consistency.
 */
export interface WeatherSymbolProps {
  condition?: string;
  iconCode?: string;
  size?: number;
}

export const WeatherSymbol: React.FC<WeatherSymbolProps> = ({
  condition = 'Clear',
  iconCode = '01d',
  size = 60,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const canonicalScene: SceneType = mapConditionToScene(condition, iconCode);
  const s = size;

  // =========================================================================
  // 1. RAIN SYMBOL: Glassy volumetric dark cloud + liquid teardrops
  // =========================================================================
  if (canonicalScene === 'rain') {
    return (
      <div
        style={{
          width: s,
          height: s,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 6px 14px rgba(14, 165, 233, 0.35))',
        }}
      >
        <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
          <defs>
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
            <linearGradient id="dropGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="60%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>

          {/* Cloud Formation */}
          <motion.g
            animate={shouldReduceMotion ? {} : { y: [-1.5, 1.5, -1.5] }}
            transition={{ duration: symbolMotion.floatDuration, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="28" y="52" width="64" height="20" rx="10" fill="url(#rainCloudMain)" />
            <circle cx="42" cy="54" r="18" fill="url(#rainCloudMain)" />
            <circle cx="60" cy="42" r="22" fill="url(#rainCloudMain)" />
            <circle cx="78" cy="52" r="16" fill="url(#rainCloudMain)" />
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
            { cx: 40, delay: 0 },
            { cx: 54, delay: 0.35 },
            { cx: 68, delay: 0.15 },
            { cx: 80, delay: 0.5 },
          ].map((drop, idx) => (
            <motion.g
              key={idx}
              animate={shouldReduceMotion ? {} : { y: [0, 20], opacity: [0, 1, 0.9, 0] }}
              transition={{ duration: symbolMotion.rainDropDuration, repeat: Infinity, delay: drop.delay, ease: 'easeIn' }}
            >
              <path
                d={`M${drop.cx} 74 C${drop.cx - 2} 79 ${drop.cx - 2.5} 83 ${drop.cx} 86 C${drop.cx + 2.5} 83 ${drop.cx + 2} 79 ${drop.cx} 74 Z`}
                fill="url(#dropGrad)"
              />
            </motion.g>
          ))}
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 2. STORM SYMBOL: Dark cloud + crisp electric lightning bolt
  // =========================================================================
  if (canonicalScene === 'storm') {
    return (
      <div
        style={{
          width: s,
          height: s,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 6px 14px rgba(168, 85, 247, 0.4))',
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
          </defs>

          <motion.g
            animate={shouldReduceMotion ? {} : { y: [-1.5, 1.5, -1.5] }}
            transition={{ duration: symbolMotion.floatDuration, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="26" y="50" width="68" height="22" rx="11" fill="url(#stormCloudMain)" />
            <circle cx="42" cy="52" r="19" fill="url(#stormCloudMain)" />
            <circle cx="62" cy="40" r="23" fill="url(#stormCloudMain)" />
            <circle cx="82" cy="50" r="17" fill="url(#stormCloudMain)" />
          </motion.g>

          {/* Electric Bolt */}
          <motion.polygon
            points="65,48 53,68 63,68 55,96 77,64 66,64"
            fill="url(#electricBoltGrad)"
            stroke="#ffffff"
            strokeWidth="1"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    opacity: [0.15, 0.15, 1, 0.3, 1, 0.15, 0.15],
                    scale: [0.98, 0.98, 1.05, 0.99, 1.04, 0.98, 0.98],
                  }
            }
            transition={{
              duration: symbolMotion.stormPulseDuration,
              repeat: Infinity,
              times: [0, 0.65, 0.7, 0.74, 0.82, 0.88, 1],
            }}
            style={{ transformOrigin: '64px 60px' }}
          />
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 3. SNOW SYMBOL: Frost cloud + crystalline geometric snowflake
  // =========================================================================
  if (canonicalScene === 'snow') {
    return (
      <div
        style={{
          width: s,
          height: s,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 6px 14px rgba(56, 189, 248, 0.35))',
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
          </defs>

          <motion.g
            animate={shouldReduceMotion ? {} : { y: [-1.5, 1.5, -1.5] }}
            transition={{ duration: symbolMotion.floatCloudDuration, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="28" y="48" width="64" height="20" rx="10" fill="url(#snowCloudMain)" />
            <circle cx="44" cy="50" r="18" fill="url(#snowCloudMain)" />
            <circle cx="62" cy="38" r="22" fill="url(#snowCloudMain)" />
            <circle cx="80" cy="48" r="16" fill="url(#snowCloudMain)" />
          </motion.g>

          {/* Central 6-Fold Crystalline Snowflake */}
          <motion.g
            transform="translate(60, 84)"
            animate={shouldReduceMotion ? {} : { rotate: [0, 360], y: [-1, 3, -1] }}
            transition={{
              rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
              y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{ transformOrigin: '0 0' }}
          >
            {[0, 60, 120, 180, 240, 300].map((angle, bIdx) => (
              <g key={bIdx} transform={`rotate(${angle}) scale(1.15)`}>
                <line x1="0" y1="0" x2="0" y2="-9" stroke="#bae6fd" strokeWidth="1.6" strokeLinecap="round" />
                <line x1="0" y1="-5" x2="-2.5" y2="-7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
                <line x1="0" y1="-5" x2="2.5" y2="-7" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
              </g>
            ))}
            <circle cx="0" cy="0" r="2" fill="#ffffff" />
          </motion.g>
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 4. CLOUDY SYMBOL: Soft silver cloud lobes with warm sun peek
  // =========================================================================
  if (canonicalScene === 'cloudy') {
    return (
      <div
        style={{
          width: s,
          height: s,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 6px 14px rgba(56, 189, 248, 0.3))',
        }}
      >
        <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
          <defs>
            <radialGradient id="behindSun" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#fef08a" />
              <stop offset="70%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
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
          </defs>

          {/* Luminous Warm Sun Peeking from Top-Right */}
          <motion.g
            animate={shouldReduceMotion ? {} : { scale: [1, 1.05, 1], rotate: [0, 30, 0] }}
            transition={{
              scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
              rotate: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
            }}
            style={{ transformOrigin: '76px 36px' }}
          >
            <circle cx="76" cy="36" r="16" fill="url(#behindSun)" />
            <ellipse cx="72" cy="32" rx="4" ry="2.5" fill="#ffffff" opacity="0.75" />
          </motion.g>

          {/* Foreground Cloud */}
          <motion.g
            animate={shouldReduceMotion ? {} : { y: [-2, 2, -2] }}
            transition={{ duration: symbolMotion.floatCloudDuration, repeat: Infinity, ease: 'easeInOut' }}
          >
            <rect x="22" y="56" width="66" height="22" rx="11" fill="url(#cloudUnderbody)" />
            <circle cx="38" cy="56" r="20" fill="url(#cloudLobe1)" />
            <circle cx="58" cy="42" r="24" fill="url(#cloudLobe1)" />
            <circle cx="78" cy="54" r="17" fill="url(#cloudLobe1)" />
            <path
              d="M26 56 C28 40 44 36 54 30 C66 24 82 30 88 46"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
              fill="none"
              opacity="0.9"
            />
          </motion.g>
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 5. FOG SYMBOL: Soft horizontal vapor bands
  // =========================================================================
  if (canonicalScene === 'fog') {
    return (
      <div
        style={{
          width: s,
          height: s,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 6px 14px rgba(148, 163, 184, 0.3))',
        }}
      >
        <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
          <motion.line
            x1="26"
            y1="46"
            x2="94"
            y2="46"
            stroke="#cbd5e1"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.85"
            animate={shouldReduceMotion ? {} : { x: [-3, 3, -3] }}
            transition={{ duration: symbolMotion.floatCloudDuration, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.line
            x1="18"
            y1="60"
            x2="102"
            y2="60"
            stroke="#94a3b8"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.9"
            animate={shouldReduceMotion ? {} : { x: [3, -3, 3] }}
            transition={{ duration: symbolMotion.floatDuration, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.line
            x1="30"
            y1="74"
            x2="90"
            y2="74"
            stroke="#64748b"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.8"
            animate={shouldReduceMotion ? {} : { x: [-2, 2, -2] }}
            transition={{ duration: symbolMotion.floatCloudDuration, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 6. CLEAR NIGHT SYMBOL: Luminous crescent moon + celestial stars
  // =========================================================================
  if (canonicalScene === 'clear-night') {
    return (
      <div
        style={{
          width: s,
          height: s,
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          filter: 'drop-shadow(0 6px 14px rgba(129, 140, 248, 0.35))',
        }}
      >
        <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
          <defs>
            <linearGradient id="moonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e0e7ff" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Luminous Crescent Moon */}
          <motion.path
            d="M68 28 A32 32 0 1 1 36 74 A26 26 0 0 0 68 28 Z"
            fill="url(#moonGrad)"
            stroke="rgba(255, 255, 255, 0.8)"
            strokeWidth="1.5"
            animate={shouldReduceMotion ? {} : { scale: [1, 1.04, 1], rotate: [0, 4, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ transformOrigin: '55px 55px' }}
          />

          {/* Twinkling Star Sparks */}
          {[
            { cx: 86, cy: 38, delay: 0 },
            { cx: 80, cy: 72, delay: 0.6 },
            { cx: 34, cy: 40, delay: 1.2 },
          ].map((star, i) => (
            <motion.circle
              key={i}
              cx={star.cx}
              cy={star.cy}
              r="2"
              fill="#ffffff"
              animate={shouldReduceMotion ? {} : { scale: [0.6, 1.3, 0.6], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: symbolMotion.starTwinkleDuration, repeat: Infinity, delay: star.delay, ease: 'easeInOut' }}
            />
          ))}
        </svg>
      </div>
    );
  }

  // =========================================================================
  // 7. CLEAR DAY / SUNNY SYMBOL: Molten golden solar orb with corona
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
        filter: 'drop-shadow(0 6px 16px rgba(245, 158, 11, 0.45))',
      }}
    >
      <svg width={s} height={s} viewBox="0 0 120 120" fill="none">
        <defs>
          <radialGradient id="sun3DCore" cx="35%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="55%" stopColor="#facc15" />
            <stop offset="78%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </radialGradient>
          <radialGradient id="outerCorona" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(254, 240, 138, 0.9)" />
            <stop offset="50%" stopColor="rgba(245, 158, 11, 0.4)" />
            <stop offset="100%" stopColor="rgba(217, 119, 6, 0)" />
          </radialGradient>
        </defs>

        {/* Outer Corona */}
        <motion.circle
          cx="60"
          cy="60"
          r="48"
          fill="url(#outerCorona)"
          animate={shouldReduceMotion ? {} : { scale: [0.96, 1.1, 0.96], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: symbolMotion.floatDuration, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Rotating Flares */}
        <motion.g
          animate={shouldReduceMotion ? {} : { rotate: 360 }}
          transition={{ duration: symbolMotion.sunRayRotationDuration, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '60px 60px' }}
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => (
            <path
              key={idx}
              d="M58 24 C58 16 60 12 60 12 C60 12 62 16 62 24 Z"
              fill="#fde047"
              transform={`rotate(${angle} 60 60)`}
              opacity="0.75"
            />
          ))}
        </motion.g>

        {/* Central Sun Sphere */}
        <motion.circle
          cx="60"
          cy="60"
          r="26"
          fill="url(#sun3DCore)"
          stroke="rgba(255, 255, 255, 0.85)"
          strokeWidth="1.8"
          animate={shouldReduceMotion ? {} : { scale: [1, 1.04, 1] }}
          transition={{ duration: symbolMotion.floatDuration, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Specular Glint */}
        <ellipse cx="52" cy="46" rx="5" ry="3" fill="#ffffff" opacity="0.85" />
      </svg>
    </div>
  );
};

export default WeatherSymbol;
