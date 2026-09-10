import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCities, getWeather } from './services/api';
import { 
  CloudSun, 
  Droplets, 
  Wind, 
  Compass, 
  RefreshCw, 
  Server, 
  Database, 
  ShieldCheck, 
  SunMedium,
  CloudRain,
  Cloud,
  Snowflake,
  Zap
} from 'lucide-react';
import './styles/design-tokens.css';

export default function App() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshCountdown, setRefreshCountdown] = useState(60);

  // 1. Fetch tracked cities on mount
  useEffect(() => {
    async function loadCities() {
      try {
        const data = await getCities();
        setCities(data);
        if (data.length > 0) {
          setSelectedCity(data[0].name);
        }
      } catch (err) {
        console.error('Failed to load cities:', err);
        setError('Could not connect to backend. Ensure Spring Boot is running on port 8080.');
      }
    }
    loadCities();
  }, []);

  // 2. Fetch weather whenever selectedCity changes
  const fetchWeather = useCallback(async (cityName, isManual = false) => {
    if (!cityName) return;
    if (isManual) setLoading(true);
    setError(null);

    try {
      const result = await getWeather(cityName);
      setWeatherData(result.data);
      setCacheStatus(result.cacheStatus);
      setLastUpdated(new Date());
      setRefreshCountdown(60);
    } catch (err) {
      console.error('Weather fetch error:', err);
      const detail = err.response?.data?.detail || 'Failed to fetch meteorological observations.';
      setError(detail);
    } finally {
      if (isManual) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCity) {
      fetchWeather(selectedCity, true);
    }
  }, [selectedCity, fetchWeather]);

  // 3. Silent auto-refresh every 60s
  useEffect(() => {
    const timer = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          if (selectedCity) fetchWeather(selectedCity, false);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedCity, fetchWeather]);

  // Dynamic atmospheric background depending on current condition
  const getAtmosphericBackdrop = () => {
    if (!weatherData) return 'var(--weather-clear)';
    const cond = weatherData.weatherCondition?.toLowerCase() || '';
    if (cond.includes('rain')) return 'var(--weather-rain)';
    if (cond.includes('cloud')) return 'var(--weather-clouds)';
    if (cond.includes('snow')) return 'var(--weather-snow)';
    if (cond.includes('thunder')) return 'var(--weather-thunder)';
    return 'var(--weather-clear)';
  };

  const getWeatherIcon = (cond) => {
    const c = (cond || '').toLowerCase();
    if (c.includes('rain')) return <CloudRain size={72} className="text-blue-300 animate-pulse" />;
    if (c.includes('cloud')) return <Cloud size={72} className="text-slate-200" />;
    if (c.includes('snow')) return <Snowflake size={72} className="text-cyan-200" />;
    if (c.includes('thunder')) return <Zap size={72} className="text-amber-300" />;
    return <SunMedium size={72} className="text-amber-400 animate-spin-slow" />;
  };

  return (
    <div 
      style={{
        background: getAtmosphericBackdrop(),
        minHeight: '100vh',
        transition: 'background 1.2s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 16px',
        color: '#fff',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Background ambient glow circles */}
      <div style={{
        position: 'fixed',
        top: '10%',
        left: '20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.25) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Container */}
      <main style={{ maxWidth: '840px', width: '100%', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Header Bar */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--glass-bg-primary)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: 'var(--glass-border-light)',
          boxShadow: 'var(--glass-shadow-md)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #38bdf8 0%, #1e3a8a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.4)'
            }}>
              <CloudSun size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px', margin: 0 }}>WeatherPulse</h1>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Enterprise Real-Time Meteorology</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
              Redis 8 & PG 17 Live
            </span>
          </div>
        </header>

        {/* City Selector & Telemetry Bar */}
        <section style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          padding: '16px 24px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--glass-bg-primary)',
          backdropFilter: 'blur(20px)',
          border: 'var(--glass-border-light)',
          boxShadow: 'var(--glass-shadow-sm)'
        }}>
          {/* City Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label htmlFor="city-select" style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              Select City:
            </label>
            <select
              id="city-select"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              style={{
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(15, 23, 42, 0.65)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                color: '#fff',
                fontSize: '15px',
                fontWeight: '600',
                outline: 'none',
                cursor: 'pointer',
                minWidth: '180px'
              }}
            >
              {cities.map((city) => (
                <option key={city.id} value={city.name} style={{ background: '#0f172a', color: '#fff' }}>
                  {city.name} ({city.countryCode})
                </option>
              ))}
            </select>
          </div>

          {/* Telemetry Status & Manual Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {cacheStatus && (
              <span style={{
                fontSize: '12px',
                fontWeight: '600',
                padding: '4px 12px',
                borderRadius: 'var(--radius-pill)',
                background: cacheStatus === 'HIT' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                border: cacheStatus === 'HIT' ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)',
                color: cacheStatus === 'HIT' ? '#34d399' : '#fbbf24',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Server size={12} />
                X-Cache: {cacheStatus}
              </span>
            )}

            <button
              onClick={() => fetchWeather(selectedCity, true)}
              disabled={loading}
              title="Click to force fresh read"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: 'var(--radius-sm)',
                color: '#fff',
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Fetching...' : `Auto in ${refreshCountdown}s`}
            </button>
          </div>
        </section>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '14px 20px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              color: '#fca5a5',
              fontSize: '14px'
            }}
          >
            {error}
          </motion.div>
        )}

        {/* Hero Weather Card */}
        <AnimatePresence mode="wait">
          {weatherData && (
            <motion.div
              key={weatherData.cityName}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{
                borderRadius: 'var(--radius-lg)',
                background: 'var(--glass-bg-primary)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                border: 'var(--glass-border-light)',
                boxShadow: 'var(--glass-shadow-lg), var(--glass-border-inner)',
                padding: '40px 32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '32px'
              }}
            >
              {/* City Name & Main Temperature */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                    <h2 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-1px', margin: 0 }}>
                      {weatherData.cityName}
                    </h2>
                    <span style={{ fontSize: '20px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {weatherData.countryCode}
                    </span>
                  </div>
                  <p style={{ fontSize: '18px', color: 'var(--text-secondary)', textTransform: 'capitalize', marginTop: '6px' }}>
                    {weatherData.weatherDescription}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))' }}>
                    {getWeatherIcon(weatherData.weatherCondition)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '64px', fontWeight: '800', lineHeight: 1, letterSpacing: '-2px' }}>
                      {Math.round(weatherData.temperatureCelsius)}°
                    </div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Feels like {Math.round(weatherData.feelsLikeCelsius)}°C
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '16px'
              }}>
                {/* Metric: Humidity */}
                <div style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <Droplets size={16} /> Humidity
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>
                    {weatherData.humidityPercent}%
                  </div>
                </div>

                {/* Metric: Wind Speed */}
                <div style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <Wind size={16} /> Wind Speed
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>
                    {weatherData.windSpeedKmh} <span style={{ fontSize: '14px', fontWeight: '400' }}>km/h</span>
                  </div>
                </div>

                {/* Metric: Range */}
                <div style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <Compass size={16} /> Low / High
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: '700' }}>
                    {Math.round(weatherData.tempMinCelsius)}° / {Math.round(weatherData.tempMaxCelsius)}°
                  </div>
                </div>

                {/* Metric: Cache Architecture */}
                <div style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                    <Database size={16} /> Storage Tier
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: cacheStatus === 'HIT' ? '#34d399' : '#fbbf24' }}>
                    {cacheStatus === 'HIT' ? 'Redis In-Memory' : 'Upstream API Fetch'}
                  </div>
                </div>
              </div>

              {/* Timestamp Footer */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--text-muted)',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <span>Observed at: {new Date(weatherData.externalObservedAt).toLocaleTimeString()}</span>
                <span>Last checked: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Architecture Status Footer */}
        <footer style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          padding: '12px 0'
        }}>
          <span>Spring Boot 3.3.4 (Port 8080)</span>
          <span>•</span>
          <span>PostgreSQL 17 (Port 5432)</span>
          <span>•</span>
          <span>Redis 8 (Port 6379)</span>
          <span>•</span>
          <span>React 18 + Vite (Port 5173)</span>
        </footer>

      </main>
    </div>
  );
}
