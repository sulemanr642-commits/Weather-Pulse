import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Droplets, Wind, Compass, Database, Clock } from 'lucide-react';
import Weather3DIcon from './Weather3DIcon';

/**
 * WeatherCard: Glass panel hero card presenting meteorological observations.
 * Features 3D procedural weather icon, large typography, multi-metric grid,
 * cache telemetry badge, and subtle last updated badge.
 * Animates smoothly on city update using Framer Motion.
 */
export default function WeatherCard({
  weatherData,
  cacheStatus,
  lastUpdatedText,
}) {
  const shouldReduceMotion = useReducedMotion();

  if (!weatherData) return null;

  return (
    <motion.div
      key={weatherData.cityName}
      initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97, y: shouldReduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97, y: shouldReduceMotion ? 0 : -12 }}
      transition={{ duration: shouldReduceMotion ? 0.1 : 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel-elevated"
      style={{
        padding: '36px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Hero Section: City, Country, Condition, 3D Icon & Temperature */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h2
              style={{
                fontSize: '40px',
                fontWeight: '800',
                letterSpacing: '-1px',
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              {weatherData.cityName}
            </h2>
            <span
              style={{
                fontSize: '18px',
                color: 'var(--text-secondary)',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.1)',
              }}
            >
              {weatherData.countryCode}
            </span>
          </div>
          <p
            style={{
              fontSize: '18px',
              color: 'var(--text-secondary)',
              textTransform: 'capitalize',
              marginTop: '6px',
              marginBottom: 0,
              fontWeight: '500',
            }}
          >
            {weatherData.weatherDescription}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Isolated 3D Procedural Weather Icon */}
          <Weather3DIcon condition={weatherData.weatherCondition} size={110} />

          {/* Large Temperature Display */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '64px',
                fontWeight: '800',
                lineHeight: 1,
                letterSpacing: '-2px',
                color: 'var(--text-primary)',
              }}
            >
              {Math.round(weatherData.temperatureCelsius)}°
            </div>
            <div
              style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginTop: '6px',
                fontWeight: '500',
              }}
            >
              Feels like {Math.round(weatherData.feelsLikeCelsius)}°C
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid: Humidity, Wind, Range, Cache Telemetry */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
        }}
      >
        {/* Metric 1: Humidity */}
        <div
          style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.07)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            <Droplets size={16} color="#38bdf8" /> Humidity
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {weatherData.humidityPercent}%
          </div>
        </div>

        {/* Metric 2: Wind Speed */}
        <div
          style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.07)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            <Wind size={16} color="#38bdf8" /> Wind Speed
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {weatherData.windSpeedKmh}{' '}
            <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text-secondary)' }}>
              km/h
            </span>
          </div>
        </div>

        {/* Metric 3: Low / High Range */}
        <div
          style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.07)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            <Compass size={16} color="#38bdf8" /> Low / High
          </div>
          <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {Math.round(weatherData.tempMinCelsius)}° / {Math.round(weatherData.tempMaxCelsius)}°
          </div>
        </div>

        {/* Metric 4: Storage Tier / Cache Telemetry */}
        <div
          style={{
            padding: '18px 20px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.07)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: '500',
            }}
          >
            <Database size={16} color={cacheStatus === 'HIT' ? '#34d399' : '#fbbf24'} /> Storage Tier
          </div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: cacheStatus === 'HIT' ? '#34d399' : '#fbbf24',
              lineHeight: 1.5,
            }}
          >
            {cacheStatus === 'HIT' ? 'Redis In-Memory' : 'Upstream Fetch'}
          </div>
        </div>
      </div>

      {/* Timestamp & Last Updated Footer Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '12px',
          color: 'var(--text-muted)',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span>
          Observed at: {new Date(weatherData.externalObservedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.08)',
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'var(--text-secondary)',
            fontWeight: '500',
          }}
        >
          <Clock size={12} />
          <span>{lastUpdatedText || 'Updated just now'}</span>
        </div>
      </div>
    </motion.div>
  );
}
