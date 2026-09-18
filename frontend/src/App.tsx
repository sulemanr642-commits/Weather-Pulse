import { useMemo, useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { CloudSun, ShieldCheck, RefreshCw, Layers } from 'lucide-react';
import { useCities, useWeather, useAutoRefresh } from '@hooks';
import { useUIStore } from '@store';
import { CityDropdown, WeatherCard } from '@components/weather';
import { LoadingState, ErrorState } from '@components/feedback';
import { WeatherScene } from '@components/scenes';
import { pageStaggerContainer, pageStaggerItem, cardHoverTapVariants } from '@design-system';
import './styles/design-tokens.css';

// Code-split admin control plane: Only loaded on demand when operator opens admin modal
const AdminPanelModal = lazy(() => import('@components/admin/AdminPanelModal'));

// Code-split design system gallery: Only loaded on demand
const GalleryModal = lazy(() => import('@components/gallery/GalleryModal'));

const FEATURED_CITIES = [
  'Tokyo',
  'London',
  'New York',
  'Paris',
  'Dubai',
  'Sydney',
  'Singapore',
  'Berlin',
];

export default function App() {
  // Client UI State Layer (Zustand)
  const selectedCity = useUIStore((s) => s.selectedCity);
  const setSelectedCity = useUIStore((s) => s.setSelectedCity);
  const adminToken = useUIStore((s) => s.adminToken);
  const adminUsername = useUIStore((s) => s.adminUsername);
  const isAdminModalOpen = useUIStore((s) => s.isAdminModalOpen);
  const setIsAdminModalOpen = useUIStore((s) => s.setIsAdminModalOpen);
  const setCurrentWeatherCondition = useUIStore((s) => s.setCurrentWeatherCondition);

  // Server State Layer (TanStack Query)
  const {
    data: cities = [],
    error: citiesError,
  } = useCities();

  const {
    data: weatherResult,
    isLoading: weatherLoading,
    isFetching: weatherFetching,
    error: weatherError,
    refetch: refetchWeather,
  } = useWeather(selectedCity);

  // URL override support for testing specific scenes (e.g. ?condition=Storm or ?gallery=scenes)
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const forcedCondition = urlParams?.get('condition') || urlParams?.get('scene');
  const galleryParam = urlParams?.get('gallery') || (urlParams?.get('showcase') ? 'ui' : null);

  // Living Design System & Scene Gallery state initialized directly from URL
  const [isGalleryOpen, setIsGalleryOpen] = useState(() => Boolean(galleryParam));
  const [galleryTab, setGalleryTab] = useState<'ui' | 'scenes'>(() => (galleryParam === 'scenes' ? 'scenes' : 'ui'));

  // Synchronize active condition to client store to drive atmospheric scenes
  useEffect(() => {
    if (forcedCondition) {
      setCurrentWeatherCondition(forcedCondition);
    } else if (weatherResult?.data?.weatherCondition) {
      setCurrentWeatherCondition(weatherResult.data.weatherCondition);
    }
  }, [weatherResult, setCurrentWeatherCondition, forcedCondition]);

  // Relative timestamp calculation ("Updated just now", "Updated 2m ago")
  const relativeTime = useAutoRefresh(weatherResult?.data?.fetchedAt);

  // Dynamic atmospheric gradient matching meteorological conditions
  const atmosphericBackground = useMemo(() => {
    if (!weatherResult?.data) {
      return 'radial-gradient(circle at 50% -10%, #38bdf8 0%, #1d4ed8 35%, #312e81 75%, #0f172a 100%)';
    }
    const cond = (weatherResult.data.weatherCondition || '').toLowerCase();
    if (cond.includes('rain') || cond.includes('drizzle')) {
      return 'radial-gradient(circle at 50% -10%, #0ea5e9 0%, #0284c7 35%, #0f375a 70%, #090d16 100%)';
    }
    if (cond.includes('cloud') || cond.includes('overcast')) {
      return 'radial-gradient(circle at 50% -10%, #60a5fa 0%, #4f46e5 35%, #334155 75%, #0f172a 100%)';
    }
    if (cond.includes('snow') || cond.includes('blizzard')) {
      return 'radial-gradient(circle at 50% -10%, #7dd3fc 0%, #2563eb 35%, #1e293b 75%, #0b1120 100%)';
    }
    if (cond.includes('thunder') || cond.includes('storm')) {
      return 'radial-gradient(circle at 50% -10%, #9333ea 0%, #581c87 40%, #1e1b4b 80%, #090817 100%)';
    }
    return 'radial-gradient(circle at 50% -10%, #0284c7 0%, #1d4ed8 35%, #312e81 75%, #0f172a 100%)';
  }, [weatherResult]);

  const activeError = weatherError?.message || citiesError?.message;

  return (
    <MotionConfig reducedMotion="user">
      <div
        style={{
          background: atmosphericBackground,
          minHeight: '100vh',
          transition: 'background 1.2s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'var(--spacing-app-padding)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-sans)',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Weather-Reactive 3D Background Scene (Phase 11) */}
        <WeatherScene
          condition={forcedCondition || weatherResult?.data?.weatherCondition || 'Clear'}
          iconCode={forcedCondition?.toLowerCase().includes('storm') ? '11d' : (weatherResult?.data?.weatherIconCode || '01d')}
        />

        {/* Main Orchestrated Container */}
        <motion.main
          variants={pageStaggerContainer}
          initial="hidden"
          animate="visible"
          style={{
            maxWidth: '880px',
            width: '100%',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* iOS-Inspired Header: Step 1 of Sequence */}
          <motion.header
            variants={pageStaggerItem}
            className="glass-panel"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: 'clamp(10px, 1.5vw + 4px, 16px) clamp(12px, 2vw + 6px, 20px)',
              borderRadius: 'var(--radius-lg)',
              position: 'relative',
              zIndex: 50,
            }}
          >
          {/* Brand Wordmark */}
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

          {/* Top-Right Controls: City Dropdown, Manual Refresh, Admin Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CityDropdown
              cities={cities}
              selectedCity={selectedCity}
              onSelectCity={(city) => setSelectedCity(city)}
              featuredCities={FEATURED_CITIES}
              loading={weatherLoading}
              align="right"
            />

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => refetchWeather()}
              disabled={weatherLoading || weatherFetching}
              title="Refresh meteorological observations"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: 'var(--radius-pill)',
                color: 'var(--text-primary)',
                padding: '8px 12px',
                fontSize: '12px',
                fontWeight: '500',
                cursor: weatherLoading || weatherFetching ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.18s ease',
              }}
              onMouseEnter={(e) => {
                if (!weatherFetching) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
              }}
              onMouseLeave={(e) => {
                if (!weatherFetching) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <RefreshCw size={13} className={weatherFetching ? 'animate-spin' : ''} />
            </button>

            {/* Living Design System & Scene Showcase Trigger */}
            <button
              type="button"
              onClick={() => {
                setGalleryTab('ui');
                setIsGalleryOpen(true);
              }}
              title="Open Design System & 3D Scene Showcase"
              style={{
                fontSize: '12px',
                fontWeight: '600',
                padding: '8px 14px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.18)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <Layers size={14} color="#38bdf8" />
              <span>Gallery</span>
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
        </motion.header>

        {/* Featured Global Cities Quick-Pill Bar: Step 2 of Sequence */}
        <motion.div
          variants={pageStaggerItem}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'clamp(6px, 1.2vw, 10px)',
            flexWrap: 'wrap',
            padding: '2px 0',
          }}
        >
          {FEATURED_CITIES.map((hub) => {
            const isActive = selectedCity.toLowerCase() === hub.toLowerCase();
            return (
              <motion.button
                key={hub}
                type="button"
                whileHover={cardHoverTapVariants.hover}
                whileTap={cardHoverTapVariants.tap}
                onClick={() => setSelectedCity(hub)}
                disabled={weatherLoading}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.35) 0%, rgba(30, 58, 138, 0.45) 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  border: isActive
                    ? '1px solid #38bdf8'
                    : '1px solid rgba(255, 255, 255, 0.14)',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                  borderRadius: 'var(--radius-pill)',
                  padding: '6px 14px',
                  minHeight: '36px',
                  touchAction: 'manipulation',
                  fontSize: '12px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: weatherLoading ? 'not-allowed' : 'pointer',
                  boxShadow: isActive ? '0 0 12px rgba(56, 189, 248, 0.25)' : 'none',
                }}
              >
                {hub}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Error State Banner */}
        <AnimatePresence>
          {activeError && (
            <ErrorState
              message={activeError}
              onRetry={() => refetchWeather()}
            />
          )}
        </AnimatePresence>

        {/* Selected City Details & 5-Day Forecasting: Step 3 of Sequence */}
        <motion.div variants={pageStaggerItem} style={{ position: 'relative', width: '100%' }}>
          <AnimatePresence mode="wait">
            {weatherLoading && !weatherResult ? (
              <LoadingState key="skeleton-loader" />
            ) : weatherResult?.data ? (
              <WeatherCard
                key={weatherResult.data.cityName}
                weatherData={weatherResult.data}
                lastUpdatedText={relativeTime}
                cacheStatus={weatherResult.cacheStatus}
              />
            ) : null}
          </AnimatePresence>
        </motion.div>

        {/* Code-Split Admin Modal (Only mounted & fetched on demand) */}
        {isAdminModalOpen && (
          <Suspense fallback={null}>
            <AdminPanelModal
              isOpen={isAdminModalOpen}
              onClose={() => setIsAdminModalOpen(false)}
              cities={cities}
              onCityAdded={(newCity) => setSelectedCity(newCity.name)}
              onCityDeleted={(deletedId) => {
                const deletedCity = cities.find((c) => c.id === deletedId);
                if (deletedCity && deletedCity.name.toLowerCase() === selectedCity.toLowerCase()) {
                  const remaining = cities.filter((c) => c.id !== deletedId);
                  if (remaining.length > 0 && remaining[0]) {
                    setSelectedCity(remaining[0].name);
                  }
                }
              }}
            />
          </Suspense>
        )}

        {/* Code-Split Design System Showcase & Scene Gallery Modal */}
        {isGalleryOpen && (
          <Suspense fallback={null}>
            <GalleryModal
              isOpen={isGalleryOpen}
              onClose={() => setIsGalleryOpen(false)}
              initialTab={galleryTab}
            />
          </Suspense>
        )}
      </motion.main>
    </div>
  </MotionConfig>
);
}
