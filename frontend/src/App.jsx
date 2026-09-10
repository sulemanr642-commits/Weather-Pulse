import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Zap,
  Search,
  MapPin,
  ChevronDown,
  X,
  Check
} from 'lucide-react';
import './styles/design-tokens.css';
import AdminPanelModal from './components/AdminPanelModal';

export default function App() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [weatherData, setWeatherData] = useState(null);
  const [cacheStatus, setCacheStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const featuredCities = ['Tokyo', 'London', 'New York', 'Paris', 'Dubai', 'Sydney', 'Singapore', 'Berlin'];

  // Handle click outside to dismiss combobox
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter cities in real-time
  const filteredCities = useMemo(() => {
    if (!searchTerm.trim()) return cities;
    const query = searchTerm.toLowerCase().trim();
    return cities.filter(
      (c) => c.name.toLowerCase().includes(query) || c.countryCode.toLowerCase().includes(query)
    );
  }, [cities, searchTerm]);

  const handleSelectCity = (cityName) => {
    setSelectedCity(cityName);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

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
        setError('Could not connect to backend service. Please verify network connectivity.');
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsAdminModalOpen(true)}
              title="Open Administrative Console to add or remove tracked cities"
              style={{
                fontSize: '13px',
                fontWeight: '600',
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(30, 58, 138, 0.4) 100%)',
                border: '1px solid rgba(56, 189, 248, 0.45)',
                color: '#38bdf8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 10px rgba(56, 189, 248, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(56, 189, 248, 0.35) 0%, rgba(30, 58, 138, 0.6) 100%)';
                e.currentTarget.style.borderColor = '#38bdf8';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(56, 189, 248, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(56, 189, 248, 0.2) 0%, rgba(30, 58, 138, 0.4) 100%)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.45)';
                e.currentTarget.style.boxShadow = '0 2px 10px rgba(56, 189, 248, 0.2)';
              }}
            >
              <ShieldCheck size={16} />
              <span>Admin Panel</span>
            </button>
          </div>
        </header>

        {/* City Selector & Telemetry Bar */}
        <section style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          padding: '20px 24px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--glass-bg-primary)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: 'var(--glass-border-light)',
          boxShadow: 'var(--glass-shadow-sm)',
          position: 'relative'
        }}>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            width: '100%'
          }}>
            {/* Searchable Combobox */}
            <div ref={dropdownRef} style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '420px' }}>
              <div 
                onClick={() => setIsDropdownOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(15, 23, 42, 0.75)',
                  border: isDropdownOpen ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.25)',
                  boxShadow: isDropdownOpen ? '0 0 12px rgba(56, 189, 248, 0.3)' : 'none',
                  transition: 'all 0.2s ease',
                  cursor: 'text'
                }}
              >
                <Search size={16} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder={selectedCity ? `${selectedCity} (Search all ${cities.length} cities)...` : `Search all ${cities.length} cities...`}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '500',
                    width: '100%'
                  }}
                />
                {searchTerm ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSearchTerm(''); }}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={14} />
                  </button>
                ) : (
                  <ChevronDown size={14} color="var(--text-muted)" style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
                )}
              </div>

              {/* Floating Dropdown Results */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 4 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      maxHeight: '380px',
                      background: 'rgba(15, 23, 42, 0.95)',
                      backdropFilter: 'blur(25px)',
                      WebkitBackdropFilter: 'blur(25px)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      boxShadow: '0 12px 30px rgba(0, 0, 0, 0.6)',
                      overflowY: 'auto',
                      zIndex: 100,
                      padding: '6px'
                    }}
                  >
                    <div style={{
                      padding: '8px 10px',
                      fontSize: '11px',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>All Tracked Cities ({filteredCities.length})</span>
                      <span>1-Click Weather</span>
                    </div>

                    {filteredCities.length === 0 ? (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No tracked cities matching "{searchTerm}"
                      </div>
                    ) : (
                      filteredCities.map((c) => {
                        const isSelected = selectedCity.toLowerCase() === c.name.toLowerCase();
                        return (
                          <div
                            key={c.id || c.name}
                            onClick={() => handleSelectCity(c.name)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: '6px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                              color: isSelected ? '#38bdf8' : '#e2e8f0',
                              transition: 'background 0.15s ease',
                              fontSize: '14px',
                              fontWeight: isSelected ? '600' : '400'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = isSelected ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = isSelected ? 'rgba(56, 189, 248, 0.2)' : 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <MapPin size={14} color={isSelected ? '#38bdf8' : 'var(--text-muted)'} />
                              <span>{c.name}</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{
                                fontSize: '11px',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: 'var(--text-secondary)'
                              }}>
                                {c.countryCode}
                              </span>
                              {isSelected && <Check size={14} color="#38bdf8" />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Telemetry Status & Manual Refresh */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {cacheStatus && (
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '6px 14px',
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
                title="Click to refresh weather data"
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
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Quick-Filter Featured City Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Featured:
            </span>
            {featuredCities.map((hub) => {
              const isActive = selectedCity.toLowerCase() === hub.toLowerCase();
              return (
                <button
                  key={hub}
                  onClick={() => handleSelectCity(hub)}
                  style={{
                    background: isActive ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.3) 0%, rgba(30, 58, 138, 0.4) 100%)' : 'rgba(255, 255, 255, 0.06)',
                    border: isActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.12)',
                    color: isActive ? '#fff' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-pill)',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: isActive ? '600' : '400',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 0 10px rgba(56, 189, 248, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  }}
                >
                  {hub}
                </button>
              );
            })}
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

        {/* Footer */}
        <footer style={{
          textAlign: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          padding: '16px 0'
        }}>
          <span>WeatherPulse Enterprise</span>
          <span>•</span>
          <span>Real-Time Meteorological Platform</span>
        </footer>

        {/* Admin Management Modal */}
        <AdminPanelModal
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          cities={cities}
          onCityAdded={(newCity) => {
            setCities((prev) => [newCity, ...prev]);
            setSelectedCity(newCity.name);
          }}
          onCityDeleted={(deletedId) => {
            setCities((prev) => {
              const updated = prev.filter((c) => c.id !== deletedId);
              if (selectedCity && !updated.some(c => c.name.toLowerCase() === selectedCity.toLowerCase())) {
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
