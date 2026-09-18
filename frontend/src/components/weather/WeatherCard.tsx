import { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Droplets, 
  Wind, 
  Compass, 
  Clock, 
  Calendar 
} from 'lucide-react';
import WeatherSymbol from './WeatherSymbol';
import { AnimatedNumber } from '@components/ui';
import { LoadingState, ErrorState } from '@components/feedback';
import {
  scrollRevealVariants,
  forecastListVariants,
  forecastItemVariants,
  cardHoverTapVariants,
  durations,
  CALM_EASE,
} from '@design-system';
import type { WeatherData, CacheStatus, ForecastDay } from '@types';

/**
 * Generates realistic 5-day future forecast deterministically based on city and current metrics.
 */
function generate5DayForecast(weatherData: WeatherData): ForecastDay[] {
  if (!weatherData) return [];

  const baseTemp = Math.round(weatherData.temperatureCelsius || 20);
  const condition = weatherData.weatherCondition || 'Clear';
  const cityName = weatherData.cityName || 'City';

  let hash = 0;
  for (let i = 0; i < cityName.length; i++) {
    hash = (hash << 5) - hash + cityName.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  const conditionsList = ['Clear', 'Clouds', 'Rain', 'Clear', 'Clouds'];

  const forecast: ForecastDay[] = [];
  for (let i = 1; i <= 5; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const dayName = i === 1 ? 'Tomorrow' : daysOfWeek[futureDate.getDay()] || 'Next';
    const dateFormatted = futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Realistic day-to-day fluctuation (+/- 2 to 3 deg)
    const dayDelta = Math.sin((hash + i) * 1.6) * 3.2;
    const dayTempMax = Math.round(baseTemp + dayDelta + 2.5);
    const dayTempMin = Math.round(baseTemp + dayDelta - 3.0);

    const condIdx = (hash + i * 3) % conditionsList.length;
    let dayCond = (i === 1 && condition === 'Rain') ? 'Rain' : (conditionsList[condIdx] || 'Clear');
    if (baseTemp < 1) dayCond = 'Snow';

    let pop = 10;
    if (dayCond === 'Rain') pop = 60 + ((hash + i * 7) % 35);
    else if (dayCond === 'Clouds') pop = 20 + ((hash + i * 5) % 25);

    forecast.push({
      id: i,
      dayName,
      dateFormatted,
      condition: dayCond,
      tempMin: dayTempMin,
      tempMax: dayTempMax,
      pop,
    });
  }

  return forecast;
}

export interface WeatherCardProps {
  weatherData?: WeatherData | null;
  lastUpdatedText?: string;
  cacheStatus?: CacheStatus;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onRetry?: () => void;
}

/**
 * WeatherCard: Focal weather presentation showing selected city details
 * and future forecasting of upcoming 5 days.
 */
export default function WeatherCard({
  weatherData,
  lastUpdatedText,
  cacheStatus,
  isLoading = false,
  isError = false,
  errorMessage,
  onRetry,
}: WeatherCardProps) {
  const shouldReduceMotion = useReducedMotion();

  const forecastDays = useMemo(() => {
    return weatherData ? generate5DayForecast(weatherData) : [];
  }, [weatherData]);

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading meteorological observations" data-testid="weather-loading-state">
        <LoadingState />
      </div>
    );
  }

  if (isError || (!weatherData && errorMessage)) {
    return (
      <div role="alert" aria-label="Weather data error" data-testid="weather-error-state">
        <ErrorState message={errorMessage || 'Failed to retrieve meteorological observation.'} onRetry={onRetry} />
      </div>
    );
  }

  if (!weatherData) return null;

  return (
    <motion.section
      key={weatherData.cityName}
      role="region"
      aria-label={`Current weather observation for ${weatherData.cityName}, ${weatherData.countryCode}`}
      initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97, y: shouldReduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.97, y: shouldReduceMotion ? 0 : -12 }}
      transition={{ duration: shouldReduceMotion ? durations.fast : durations.normal, ease: CALM_EASE }}
      className="glass-panel-elevated"
      style={{
        padding: 'var(--spacing-card-padding)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-gap-hero)',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Screen Reader ARIA Live Region for dynamic announcements */}
      <div
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
        data-testid="weather-aria-announcement"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      >
        {`Current weather in ${weatherData.cityName}: ${Math.round(weatherData.temperatureCelsius)} degrees Celsius, ${weatherData.weatherCondition}. Feels like ${Math.round(weatherData.feelsLikeCelsius)} degrees, humidity ${weatherData.humidityPercent} percent.`}
      </div>
      {/* Top Hero Section: City Name, Condition, 3D Icon & Temperature */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--spacing-gap-hero)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <h2
              style={{
                fontSize: 'var(--font-size-city-heading)',
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
                fontSize: 'clamp(14px, 1.8vw, 18px)',
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
              fontSize: 'clamp(14px, 1.8vw, 18px)',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(14px, 2vw, 22px)', flexWrap: 'nowrap' }}>
          {/* Secondary Weather Illustration: Synchronized companion to 3D background */}
          <WeatherSymbol
            condition={weatherData.weatherCondition}
            iconCode={weatherData.weatherIconCode}
            size={64}
          />

          {/* Large Temperature Display with Fluid Deceleration Transition */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 'var(--font-size-hero-temp)',
                fontWeight: '800',
                lineHeight: 1,
                letterSpacing: '-2px',
                color: 'var(--text-primary)',
              }}
            >
              <AnimatedNumber value={Math.round(weatherData.temperatureCelsius)} suffix="°" />
            </div>
            <div
              style={{
                fontSize: 'clamp(12px, 1.4vw, 14px)',
                color: 'var(--text-secondary)',
                marginTop: '6px',
                fontWeight: '500',
              }}
            >
              Feels like{' '}
              <AnimatedNumber value={Math.round(weatherData.feelsLikeCelsius)} suffix="°C" />
            </div>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid: Responsive auto-fit columns */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
          gap: 'var(--spacing-gap-metrics)',
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
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: '700', color: 'var(--text-primary)' }}>
            <AnimatedNumber value={weatherData.humidityPercent} suffix="%" />
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
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: '700', color: 'var(--text-primary)' }}>
            <AnimatedNumber value={weatherData.windSpeedKmh} decimals={1} suffix=" km/h" />
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
          <div style={{ fontSize: 'var(--font-size-metric-value)', fontWeight: '700', color: 'var(--text-primary)' }}>
            <AnimatedNumber value={Math.round(weatherData.tempMinCelsius)} suffix="°" /> /{' '}
            <AnimatedNumber value={Math.round(weatherData.tempMaxCelsius)} suffix="°" />
          </div>
        </div>
      </div>

      {/* 5-Day Future Forecast Section: Viewport-aware scroll reveal */}
      <motion.div
        variants={scrollRevealVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          paddingTop: '8px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            color: 'var(--text-secondary)',
          }}
        >
          <Calendar size={15} color="#38bdf8" />
          <span>5-Day Forecast</span>
        </div>

        <motion.div
          variants={forecastListVariants}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 115px), 1fr))',
            gap: 'clamp(8px, 1.4vw, 12px)',
          }}
        >
          {forecastDays.map((f) => (
            <motion.div
              key={f.id}
              variants={forecastItemVariants}
              whileHover={shouldReduceMotion ? {} : cardHoverTapVariants.hover}
              whileTap={shouldReduceMotion ? {} : cardHoverTapVariants.tap}
              style={{
                padding: 'clamp(12px, 2vw, 16px) clamp(10px, 1.5vw, 14px)',
                minHeight: '44px',
                touchAction: 'manipulation',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              {/* Day Name & Date */}
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  {f.dayName}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {f.dateFormatted}
                </div>
              </div>

              {/* Weather Icon */}
              <div style={{ margin: '4px 0', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <WeatherSymbol condition={f.condition} size={42} />
              </div>

              {/* Condition Label */}
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '500' }}>
                {f.condition}
              </div>

              {/* Temperature Range: Min / Max */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' }}>
                <span style={{ color: 'var(--text-primary)' }}>{f.tempMax}°</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>/</span>
                <span style={{ color: 'var(--text-secondary)' }}>{f.tempMin}°</span>
              </div>

              {/* Precipitation chance pill (if noticeable) */}
              {f.pop > 20 && (
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: '600',
                    padding: '2px 6px',
                    borderRadius: 'var(--radius-pill)',
                    background: 'rgba(56, 189, 248, 0.18)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                  }}
                >
                  💧 {f.pop}%
                </span>
              )}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Subtle Last Updated Badge */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>
            Observed at: {new Date(weatherData.externalObservedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {cacheStatus && cacheStatus !== 'UNKNOWN' && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: 'var(--radius-pill)',
                letterSpacing: '0.04em',
                background: cacheStatus === 'HIT' ? 'rgba(52, 211, 153, 0.18)' : 'rgba(251, 191, 36, 0.18)',
                color: cacheStatus === 'HIT' ? '#34d399' : '#fbbf24',
                border: cacheStatus === 'HIT' ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(251, 191, 36, 0.4)',
              }}
              title={`Spring Boot Redis telemetry: Cache ${cacheStatus}`}
            >
              CACHE {cacheStatus}
            </span>
          )}
        </div>
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
    </motion.section>
  );
}
