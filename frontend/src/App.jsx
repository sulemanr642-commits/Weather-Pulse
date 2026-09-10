import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { getCities, getWeather } from './services/api';
import {
  CityDropdown,
  WeatherCard,
  LoadingState,
  ErrorState,
  AdminPanelModal,
  AtmosphericBackground,
} from './components';
import { CloudSun, ShieldCheck, RefreshCw } from 'lucide-react';
import './styles/design-tokens.css';

export default function App() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('Tokyo');
  const [weatherData, setWeatherData] = useState(null);
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
        if (data.length > 0 && !selectedCity) {
          setSelectedCity(data[0].name);
        }
      } catch (err) {
        console.error('Failed to load tracked cities:', err);
        setError('Could not connect to backend service. Please verify network connectivity.');
      }
    }
    loadCities();
  }, [selectedCity]);

  // 2. Fetch weather for a given city
  const fetchWeather = useCallback(async (cityName, isExplicit = false) => {
    if (!cityName) return;
    if (isExplicit) setLoading(true);
    setError(null);

    try {
      const result = await getWeather(cityName);
      setWeatherData(result.data);
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

    const refreshTimer = setInterval(() => {
      fetchWeather(selectedCity, false);
    }, 300000);

    return () => clearInterval(refreshTimer);
  }, [selectedCity, fetchWeather]);

  // Dynamic atmospheric gradient based on current condition (ultra-vibrant & luminous)
  const atmosphericBackground = useMemo(() => {
    if (!weatherData) return 'radial-gradient(circle at 50% -10%, #38bdf8 0%, #1d4ed8 35%, #312e81 75%, #0f172a 100%)';
    const cond = (weatherData.weatherCondition || '').toLowerCase();
    if (cond.includes('rain')) return 'radial-gradient(circle at 50% -10%, #0ea5e9 0%, #0284c7 35%, #0f375a 70%, #090d16 100%)';
    if (cond.includes('cloud')) return 'radial-gradient(circle at 50% -10%, #60a5fa 0%, #4f46e5 35%, #334155 75%, #0f172a 100%)';
    if (cond.includes('snow')) return 'radial-gradient(circle at 50% -10%, #7dd3fc 0%, #2563eb 35%, #1e293b 75%, #0b1120 100%)';
    if (cond.includes('thunder')) return 'radial-gradient(circle at 50% -10%, #9333ea 0%, #581c87 40%, #1e1b4b 80%, #090817 100%)';
    return 'radial-gradient(circle at 50% -10%, #0284c7 0%, #1d4ed8 35%, #312e81 75%, #0f172a 100%)';
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
        padding: '24px 16px 40px',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-sans)',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Living Atmospheric Particle & Aurora Canvas */}
      <AtmosphericBackground condition={weatherData?.weatherCondition || 'Clear'} />

      {/* Main Container */}
      <main
        style={{
          maxWidth: '880px',
          width: '100%',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Slim iOS-Inspired Header with Top-Right City Dropdown & Controls */}
        <header
          className="glass-panel"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderRadius: 'var(--radius-lg)',
            position: 'relative',
            zIndex: 50,
          }}
        >
          {/* Brand Wordmark (no subtitles) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '11px',
                background: 'linear-gradient(135deg, #38bdf8 0%, #1e3a8a 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(56, 189, 248, 0.35)',
              }}
            >
              <CloudSun size={22} color="#fff" />
            </div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: '800',
                letterSpacing: '-0.5px',
                margin: 0,
                color: 'var(--text-primary)',
              }}
            >
              WeatherPulse
            </h1>
          </div>

          {/* Top-Right Controls: City Dropdown, Refresh, Admin Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* City Dropdown positioned at top right so it drops down along the right gutter */}
            <CityDropdown
              cities={cities}
              selectedCity={selectedCity}
              onSelectCity={(city) => setSelectedCity(city)}
              featuredCities={featuredCities}
              loading={loading}
              align="right"
            />

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => fetchWeather(selectedCity, true)}
              disabled={loading}
              title="Refresh meteorological observations"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-primary)',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
              }}
              onMouseLeave={(e) => {
                if (!loading) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Admin Surface Trigger Button */}
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              title="Open Administrative Console"
              style={{
                fontSize: '12px',
                fontWeight: '600',
                padding: '8px 14px',
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
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <ShieldCheck size={14} />
              <span>{adminToken ? `Admin: ${adminUsername || 'Active'}` : 'Admin'}</span>
            </button>
          </div>
        </header>

        {/* Featured Global Cities Quick-Pill Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            padding: '2px 0',
          }}
        >
          {featuredCities.map((hub) => {
            const isActive = selectedCity.toLowerCase() === hub.toLowerCase();
            return (
              <button
                key={hub}
                type="button"
                onClick={() => setSelectedCity(hub)}
                disabled={loading}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.35) 0%, rgba(30, 58, 138, 0.45) 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  border: isActive
                    ? '1px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.14)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '5px 12px',
                  fontSize: '12px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive && !loading) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.14)';
                  }
                }}
              >
                {hub}
              </button>
            );
          })}
        </div>

        {/* Calm Error Banner (if error occurred) */}
        <AnimatePresence>
          {error && (
            <ErrorState
              message={error}
              onRetry={() => fetchWeather(selectedCity, true)}
            />
          )}
        </AnimatePresence>

        {/* Middle of Screen: Selected City Details & Future 5-Day Forecasting */}
        <div style={{ position: 'relative', width: '100%' }}>
          <AnimatePresence mode="wait">
            {loading || !weatherData ? (
              <LoadingState key="skeleton-loader" />
            ) : (
              <WeatherCard
                key={weatherData.cityName}
                weatherData={weatherData}
                lastUpdatedText={relativeTime}
              />
            )}
          </AnimatePresence>
        </div>

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
