import React, { useState, Suspense, lazy } from 'react';
import { 
  SceneType, 
  SCENE_METADATA, 
  getSceneTheme 
} from '@design-system';
import { Button, GlassPanel, Badge } from '@components/ui';

// Code-split 3D SceneCanvas stage to prevent static bundling into initial shell
const SceneCanvas = lazy(() => import('@components/scenes/SceneCanvas'));
import { 
  Sun, 
  Moon, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  CloudFog,
  Eye,
  Sliders,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const SCENE_ICONS: Record<SceneType, React.ReactNode> = {
  'clear-day': <Sun size={15} color="#fbbf24" />,
  'clear-night': <Moon size={15} color="#93c5fd" />,
  'cloudy': <Cloud size={15} color="#cbd5e1" />,
  'rain': <CloudRain size={15} color="#38bdf8" />,
  'snow': <CloudSnow size={15} color="#e0f2fe" />,
  'storm': <CloudLightning size={15} color="#c084fc" />,
  'fog': <CloudFog size={15} color="#94a3b8" />,
};

const SCENE_DESCRIPTIONS: Record<SceneType, string> = {
  'clear-day': 'Solar glare flares, drifting solar radiance particles, and high warm lighting highlights.',
  'clear-night': 'Deep sapphire void, twinkling procedural starfield, and serene lunar illumination.',
  'cloudy': 'Multi-layered volumetric cloud billows, atmospheric silver depth, and diffused sun occlusion.',
  'rain': 'High-velocity precipitation streaks with dynamic ground splash ripples and oceanic slate tones.',
  'snow': 'Crystalline fluttering snowflakes with gentle lateral wind drift and arctic frost illumination.',
  'storm': 'Violent indigo atmosphere with electric lightning flash illuminates and high-intensity rainfall.',
  'fog': 'Dense horizontal vapor veil with slow laminar drift and low-visibility atmospheric scattering.',
};

export const SceneGallery: React.FC = () => {
  const [selectedScene, setSelectedScene] = useState<SceneType>('clear-day');
  const [reducedMotionPreview, setReducedMotionPreview] = useState(false);

  const meta = SCENE_METADATA[selectedScene];
  const palette = getSceneTheme(selectedScene, 'dark');

  const allSceneKeys: SceneType[] = [
    'clear-day',
    'clear-night',
    'cloudy',
    'rain',
    'snow',
    'storm',
    'fog',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Sparkles size={18} color="#38bdf8" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            Phase 11 3D Background Scenes Gallery (<code style={{ color: '#38bdf8' }}>src/components/scenes/3d/</code>)
          </h3>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Preview each weather-reactive Three.js / React Three Fiber scene in complete isolation without live weather API data or network latency.
        </p>
      </div>

      {/* Condition Selector Tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        {allSceneKeys.map((key) => {
          const isSelected = selectedScene === key;
          const info = SCENE_METADATA[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedScene(key)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-pill)',
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.35) 0%, rgba(30, 58, 138, 0.45) 100%)'
                  : 'rgba(255, 255, 255, 0.08)',
                border: isSelected
                  ? '1px solid #38bdf8'
                  : '1px solid rgba(255, 255, 255, 0.14)',
                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '12px',
                fontWeight: isSelected ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: isSelected ? '0 0 14px rgba(56, 189, 248, 0.3)' : 'none',
              }}
            >
              {SCENE_ICONS[key]}
              <span>{info.displayName}</span>
            </button>
          );
        })}
      </div>

      {/* Main Viewport & Inspector Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Isolated Canvas Stage */}
        <div
          style={{
            position: 'relative',
            height: '380px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            background: palette.cssGradient,
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          }}
        >
          {/* Active Canvas */}
          <Suspense fallback={null}>
            <SceneCanvas
              scene={selectedScene}
              palette={palette}
              reducedMotion={reducedMotionPreview}
            />
          </Suspense>

          {/* Viewport Overlay Controls */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              zIndex: 10,
            }}
          >
            <Badge variant="info" icon={<Eye size={12} />}>
              ISOLATED 3D STAGE
            </Badge>
            {reducedMotionPreview && (
              <Badge variant="miss" icon={<ShieldCheck size={12} />}>
                REDUCED MOTION ACTIVE
              </Badge>
            )}
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              zIndex: 10,
            }}
          >
            <Button
              variant="glass"
              size="sm"
              onClick={() => setReducedMotionPreview((prev) => !prev)}
              leftIcon={<Sliders size={13} />}
            >
              {reducedMotionPreview ? 'Enable Full Particles' : 'Simulate Reduced Motion'}
            </Button>
          </div>
        </div>

        {/* Scene Specification & Metadata Card */}
        <GlassPanel variant="elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '0.05em', color: '#38bdf8' }}>
                SCENE SPECIFICATION
              </span>
              <span style={{ fontSize: '11px', color: meta.isNight ? '#93c5fd' : '#fbbf24', fontWeight: '600' }}>
                {meta.isNight ? '🌙 Nocturnal Mode' : '☀️ Diurnal Mode'}
              </span>
            </div>
            <h4 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              {meta.displayName}
            </h4>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Canonical Key: <code style={{ color: '#38bdf8' }}>'{meta.key}'</code>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            {SCENE_DESCRIPTIONS[selectedScene]}
          </p>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Base Atmosphere:</span>
              <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{meta.baseAtmosphere}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Primary Lighting:</span>
              <span style={{ fontFamily: 'monospace', color: palette.primaryLight }}>{palette.primaryLight}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Secondary Lighting:</span>
              <span style={{ fontFamily: 'monospace', color: palette.secondaryLight }}>{palette.secondaryLight}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Particle Color:</span>
              <span style={{ fontFamily: 'monospace', color: palette.particleColor }}>{palette.particleColor}</span>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-primary)', display: 'block', marginBottom: '4px' }}>
              Weather Condition Triggers
            </span>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {selectedScene === 'storm' && 'Includes: thunderstorm, storm, lightning, squall, electric tempest.'}
              {selectedScene === 'snow' && 'Includes: snow, blizzard, sleet, flurries, ice.'}
              {selectedScene === 'rain' && 'Includes: rain, drizzle, heavy rain, showers, precipitation.'}
              {selectedScene === 'fog' && 'Includes: fog, mist, haze, smoke, dust, obscuration.'}
              {selectedScene === 'cloudy' && 'Includes: clouds, overcast, partly cloudy, broken clouds.'}
              {selectedScene === 'clear-night' && 'Includes: clear sky, fine night, nocturnal icon code ("*n").'}
              {selectedScene === 'clear-day' && 'Includes: clear sky, sunny, diurnal default ("*d").'}
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default SceneGallery;
