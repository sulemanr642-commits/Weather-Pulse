import React, { useState } from 'react';
import { 
  Button, 
  GlassPanel, 
  Badge, 
  Skeleton, 
  AnimatedNumber 
} from '@components/ui';
import ForecastBadge from '@components/weather/ForecastBadge';
import WeatherSymbol from '@components/weather/WeatherSymbol';
import { 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Layers, 
  Plus, 
  Minus,
  RotateCcw
} from 'lucide-react';
import tokens from '@design-system/tokens';

export const ComponentGallery: React.FC = () => {
  // Interactive state for AnimatedNumber demonstration
  const [counterValue, setCounterValue] = useState(24.5);
  const [buttonLoading, setButtonLoading] = useState(false);

  const triggerButtonLoading = () => {
    setButtonLoading(true);
    setTimeout(() => setButtonLoading(false), 1800);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: 'var(--text-primary)' }}>
      {/* Introduction Header */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
          Core UI Primitives Library (<code style={{ color: '#38bdf8' }}>src/components/ui/</code>)
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
          Production design tokens and reusable atomic components built on glassmorphism principles, high-contrast WCAG AA standards, and fluid physics.
        </p>
      </div>

      {/* 1. Button Primitive Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#38bdf8' }}>1. Button Component</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Variants: primary, glass, ghost, danger | Sizes: sm, md, lg</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Button variant="primary" size="md" leftIcon={<Sparkles size={14} />}>
            Primary Action
          </Button>

          <Button variant="glass" size="md" leftIcon={<Layers size={14} />}>
            Glass Default
          </Button>

          <Button variant="ghost" size="md">
            Ghost Minimal
          </Button>

          <Button variant="danger" size="md" leftIcon={<AlertTriangle size={14} />}>
            Danger State
          </Button>

          <Button 
            variant="glass" 
            size="md" 
            isLoading={buttonLoading} 
            onClick={triggerButtonLoading}
            leftIcon={<RotateCcw size={14} />}
          >
            {buttonLoading ? 'Synchronizing...' : 'Click for Loading State'}
          </Button>
        </div>

        {/* Size scale */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginTop: '4px' }}>
          <Button variant="glass" size="sm">Small (sm)</Button>
          <Button variant="glass" size="md">Medium (md)</Button>
          <Button variant="glass" size="lg">Large (lg)</Button>
          <Button variant="glass" size="md" disabled>Disabled State</Button>
        </div>
      </div>

      {/* 2. GlassPanel Primitive Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#38bdf8' }}>2. GlassPanel Component</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Variants: subtle, elevated, prominent</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
          <GlassPanel variant="subtle" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', marginBottom: '6px' }}>
              variant="subtle"
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Used for standard structural layout wrappers and card containers.
            </p>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Blur: 16px | Alpha: 0.60
            </div>
          </GlassPanel>

          <GlassPanel variant="elevated" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#34d399', marginBottom: '6px' }}>
              variant="elevated"
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Used for highlighted focal items, featured widgets, and dropdown menus.
            </p>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Blur: 28px | Alpha: 0.72
            </div>
          </GlassPanel>

          <GlassPanel variant="prominent" style={{ padding: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b', marginBottom: '6px' }}>
              variant="prominent"
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
              Used for foreground modal dialogs, sheets, and critical administrative overlays.
            </p>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Blur: 36px | Alpha: 0.85
            </div>
          </GlassPanel>
        </div>
      </div>

      {/* 3. Badge Primitive Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#38bdf8' }}>3. Badge Component</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Telemetry & Status Pills</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <Badge variant="hit" icon={<CheckCircle size={12} />}>
            CACHE HIT (Redis L2)
          </Badge>

          <Badge variant="miss" icon={<AlertTriangle size={12} />}>
            CACHE MISS (Origin Fetch)
          </Badge>

          <Badge variant="info" icon={<Sparkles size={12} />}>
            Real-Time Live (WebSocket)
          </Badge>

          <Badge variant="neutral">
            Version 1.0.0
          </Badge>
        </div>
      </div>

      {/* 4. AnimatedNumber Primitive Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#38bdf8' }}>4. AnimatedNumber Component</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Continuous Spring Interpolation & Tabular Numerals</span>
        </div>

        <GlassPanel variant="subtle" style={{ padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              INTERACTIVE VALUE TESTER (CALM_EASE physics)
            </div>
            <div style={{ fontSize: '38px', fontWeight: '800', letterSpacing: '-1px', color: '#38bdf8' }}>
              <AnimatedNumber value={counterValue} decimals={1} suffix="°C" />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Button variant="glass" size="sm" onClick={() => setCounterValue((v) => Number((v - 5).toFixed(1)))} leftIcon={<Minus size={13} />}>
              -5°
            </Button>
            <Button variant="glass" size="sm" onClick={() => setCounterValue((v) => Number((v - 1).toFixed(1)))} leftIcon={<Minus size={13} />}>
              -1°
            </Button>
            <Button variant="glass" size="sm" onClick={() => setCounterValue(24.5)} leftIcon={<RotateCcw size={13} />}>
              Reset
            </Button>
            <Button variant="glass" size="sm" onClick={() => setCounterValue((v) => Number((v + 1).toFixed(1)))} leftIcon={<Plus size={13} />}>
              +1°
            </Button>
            <Button variant="glass" size="sm" onClick={() => setCounterValue((v) => Number((v + 5).toFixed(1)))} leftIcon={<Plus size={13} />}>
              +5°
            </Button>
          </div>
        </GlassPanel>
      </div>

      {/* 5. Skeleton Primitive Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#38bdf8' }}>5. Skeleton Loading State</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Accessible Shimmer Sweep (<code style={{ color: '#fff' }}>role="status"</code>)</span>
        </div>

        <GlassPanel variant="subtle" style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Skeleton width="48px" height="48px" borderRadius="14px" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
              <Skeleton width="40%" height="18px" borderRadius="6px" />
              <Skeleton width="25%" height="12px" borderRadius="4px" />
            </div>
          </div>
          <Skeleton width="100%" height="40px" borderRadius="10px" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <Skeleton width="100%" height="32px" borderRadius="8px" />
            <Skeleton width="100%" height="32px" borderRadius="8px" />
            <Skeleton width="100%" height="32px" borderRadius="8px" />
          </div>
        </GlassPanel>
      </div>

      {/* 6. Forecast & Symbol Visuals */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '8px' }}>
          <span style={{ fontSize: '14px', fontWeight: '600', color: '#38bdf8' }}>6. Weather Symbols & Forecast Badge</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Animated SVG Micro-interactions</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '10px' }}>
          <ForecastBadge
            day={{
              id: 1,
              dayName: 'Sunny',
              dateFormatted: 'Tomorrow',
              condition: 'Clear',
              tempMin: 18,
              tempMax: 29,
              pop: 5,
            }}
            isToday={true}
          />
          <ForecastBadge
            day={{
              id: 2,
              dayName: 'Rainy',
              dateFormatted: 'Wed, 22',
              condition: 'Rain',
              tempMin: 14,
              tempMax: 19,
              pop: 85,
            }}
          />
          <ForecastBadge
            day={{
              id: 3,
              dayName: 'Storm',
              dateFormatted: 'Thu, 23',
              condition: 'Thunderstorm',
              tempMin: 16,
              tempMax: 21,
              pop: 90,
            }}
          />
          <ForecastBadge
            day={{
              id: 4,
              dayName: 'Snow',
              dateFormatted: 'Fri, 24',
              condition: 'Snow',
              tempMin: -2,
              tempMax: 2,
              pop: 60,
            }}
          />
          <ForecastBadge
            day={{
              id: 5,
              dayName: 'Cloudy',
              dateFormatted: 'Sat, 25',
              condition: 'Clouds',
              tempMin: 15,
              tempMax: 22,
              pop: 20,
            }}
          />
        </div>

        {/* Weather Symbol Matrix */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-around', padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <WeatherSymbol condition="Clear" size={44} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Clear / Sun</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <WeatherSymbol condition="Rain" size={44} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Rain</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <WeatherSymbol condition="Thunderstorm" size={44} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Thunderstorm</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <WeatherSymbol condition="Snow" size={44} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Snow</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <WeatherSymbol condition="Clouds" size={44} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Clouds</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <WeatherSymbol condition="Fog" size={44} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Fog</span>
          </div>
        </div>
      </div>

      {/* Design System Token Quick Reference */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>Design Token Scale Summary</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <div><code>--radius-sm</code>: {tokens.radii.sm}</div>
          <div><code>--radius-md</code>: {tokens.radii.md}</div>
          <div><code>--radius-lg</code>: {tokens.radii.lg}</div>
          <div><code>--radius-pill</code>: {tokens.radii.pill}</div>
          <div><code>colors.skyPrimary</code>: {tokens.colors.skyPrimary}</div>
          <div><code>colors.success</code>: {tokens.colors.success}</div>
        </div>
      </div>
    </div>
  );
};

export default ComponentGallery;
