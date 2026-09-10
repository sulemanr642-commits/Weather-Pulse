import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { getCities, getWeather } from './services/api';
import {
  CityDropdown,
  WeatherCard,
  LoadingState,
  ErrorState,
  AdminPanelModal,
} from './components';
import { CloudSun, ShieldCheck, RefreshCw, Server } from 'lucide-react';
import './styles/design-tokens.css';

export default function App() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('Tokyo');
  const [weatherData, setWeatherData] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [relativeTime, setRelativeTime] = useState('Updated just now');

  // In-Memory Administrator Authentication (never stored in localStorage)
  const [adminToken, setAdminToken] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const featuredCities = ['Tokyo', 'London', 'New York', 'Paris', 'Dubai', 'Sydney', 'Singapore', 'Berlin'];

  // Relative time counter (updates every 10 seconds)
  useEffect(() => {
    if (!lastUpdated) return;

    const updateRelative = () => {
      const now = new Date();
      const diffMs = now - lastUpdated;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);

      if (diffSec < 45) {
        setRelativeTime('Updated just now');
      } else if (diffMin === 1) {
        setRelativeTime('Updated 1m ago');
      } else if (diffMin < 60) {
        setRelativeTime(`Updated ${diffMin}m ago`);
      } else {
        const diffHrs = Math.floor(diffMin / 60);
        setRelativeTime(`Updated ${diffHrs}h ago`);
      }
    };

    updateRelative();
    const interval = setInterval(updateRelative, 10000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

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
        console.error('Failed to load tracked cities:', err);
        setError('Could not connect to backend service. Please verify network connectivity.');
      }
    }
    loadCities();
  }, []);

  // 2. Fetch weather for a given city
  const fetchWeather = useCallback(async (cityName, isExplicit = false) => {
    if (!cityName) return;
    if (isExplicit) setLoading(true);
    setError(null);

    try {
      const result = await getWeather(cityName);
      setWeatherData(result.data);
      setCacheStatus(result.cacheStatus);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Weather fetch error:', err);
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        'Failed to retrieve real-time meteorological observations.';
      setError(detail);
    } finally {
      if (isExplicit) setLoading(false);
    }
  }, []);

  // Fetch when selected city changes
  useEffect(() => {
    if (selectedCity) {
      fetchWeather(selectedCity, true);
    }
  }, [selectedCity, fetchWeather]);

  // 3. 5-Minute Silent Auto-Refresh hook (mirroring backend refresh cadence)
  useEffect(() => {
    if (!selectedCity) return;

    // 5-minute background refresh interval (300,000ms)
    const refreshTimer = setInterval(() => {
      fetchWeather(selectedCity, false);
    }, 300000);

    return () => clearInterval(refreshTimer);
  }, [selectedCity, fetchWeather]);

  // Dynamic atmospheric gradient based on current condition
  const atmosphericBackground = useMemo(() => {
    if (!weatherData) return 'var(--weather-clear)';
    const cond = (weatherData.weatherCondition || '').toLowerCase();
    if (cond.includes('rain')) return 'var(--weather-rain)';
    if (cond.includes('cloud')) return 'var(--weather-clouds)';
    if (cond.includes('snow')) return 'var(--weather-snow)';
    if (cond.includes('thunder')) return 'var(--weather-thunder)';
    return 'var(--weather-clear)';
  }, [weatherData]);

  return (
    <div
      style={{
        background: atmosphericBackground,
        minHeight: '100vh',
        transition: 'background 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '36px 16px 48px',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        boxSizing: 'border-box',
      }}
    >
      {/* Background ambient lighting blur */}
      <div
        style={{
          position: 'fixed',
          top: '15%',
          left: '25%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Container */}
      <main
        style={{
          maxWidth: '840px',
          width: '100%',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Slim iOS-Inspired Header */}
        <header
          className="glass-panel"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #1e3a8a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.4)',
              }}
            >
              <CloudSun size={24} color="#fff" />
            </div>
            <div>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  letterSpacing: '-0.5px',
                  margin: 0,
                  color: 'var(--text-primary)',
                }}
              >
                WeatherPulse
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, fontWeight: '500' }}>
                Enterprise Real-Time Meteorology
              </p>
            </div>
          </div>

          {/* Admin Surface Trigger Button */}
          <button
            type="button"
            onClick={() => setIsAdminModalOpen(true)}
            title="Open Administrative Console"
            style={{
              fontSize: '13px',
              fontWeight: '600',
              padding: '8px 16px',
              borderRadius: 'var(--radius-pill)',
              background: adminToken
                ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)'
                : 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(30, 58, 138, 0.35) 100%)',
              border: adminToken
                ? '1px solid rgba(16, 185, 129, 0.5)'
                : '1px solid rgba(56, 189, 248, 0.4)',
              color: adminToken ? '#34d399' : '#38bdf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: adminToken
                ? '0 2px 10px rgba(16, 185, 129, 0.2)'
                : '0 2px 10px rgba(56, 189, 248, 0.2)',
            }}
          >
            <ShieldCheck size={16} />
            <span>{adminToken ? `Admin: ${adminUsername || 'Active'}` : 'Admin Panel'}</span>
          </button>
        </header>

        {/* Control Bar Panel: City Combobox & Telemetry Bar */}
        <section
          className="glass-panel"
          style={{
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              width: '100%',
            }}
          >
            {/* Accessible City Dropdown Combobox */}
            <div style={{ flex: '1', minWidth: '280px' }}>
              <CityDropdown
                cities={cities}
                selectedCity={selectedCity}
                onSelectCity={(city) => setSelectedCity(city)}
                featuredCities={featuredCities}
                loading={loading}
              />
            </div>

            {/* Cache Telemetry & Manual Refresh Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              {cacheStatus && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-pill)',
                    background:
                      cacheStatus === 'HIT'
                        ? 'rgba(16, 185, 129, 0.18)'
                        : 'rgba(245, 158, 11, 0.18)',
                    border:
                      cacheStatus === 'HIT'
                        ? '1px solid rgba(16, 185, 129, 0.45)'
                        : '1px solid rgba(245, 158, 11, 0.45)',
                    color: cacheStatus === 'HIT' ? '#34d399' : '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Server size={12} />
                  X-Cache: {cacheStatus}
                </span>
              )}

              <button
                type="button"
                onClick={() => fetchWeather(selectedCity, true)}
                disabled={loading}
                title="Manually refresh observations"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  padding: '9px 14px',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* Calm Error Banner (if error occurred) */}
        <AnimatePresence>
          {error && (
            <ErrorState
              message={error}
              onRetry={() => fetchWeather(selectedCity, true)}
            />
          )}
        </AnimatePresence>

        {/* Main Weather Region: Loading State or WeatherCard */}
        <div style={{ position: 'relative', width: '100%' }}>
          <AnimatePresence mode="wait">
            {loading || !weatherData ? (
              <LoadingState key="skeleton-loader" />
            ) : (
              <WeatherCard
                key={weatherData.cityName}
                weatherData={weatherData}
                cacheStatus={cacheStatus}
                lastUpdatedText={relativeTime}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <footer
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 0 8px',
          }}
        >
          <span>WeatherPulse Enterprise</span>
          <span>•</span>
          <span>High-Performance Meteorology</span>
        </footer>

        {/* Separate Glassmorphic Admin Modal (Secured with In-Memory JWT) */}
        <AdminPanelModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          cities={cities}
          token={adminToken}
          onTokenChange={(newToken, username) => {
            setAdminToken(newToken);
            setAdminUsername(username);
          }}
          onCityAdded={(newCity) => {
            setCities((prev) => [newCity, ...prev]);
            setSelectedCity(newCity.name);
          }}
          onCityDeleted={(deletedId) => {
            setCities((prev) => {
              const updated = prev.filter((c) => c.id !== deletedId);
              if (
                selectedCity &&
                !updated.some((c) => c.name.toLowerCase() === selectedCity.toLowerCase())
              ) {
                if (updated.length > 0) setSelectedCity(updated[0].name);
                else setSelectedCity('');
              }
              return updated;
            });
          }}
        />
      </main>
    </div>
  );
}
