import React, { useMemo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  Droplets, 
  Wind, 
  Compass, 
  Clock, 
  Calendar, 
  SunMedium, 
  CloudRain, 
  Cloud, 
  Snowflake, 
  Zap 
} from 'lucide-react';
import Weather3DIcon from './Weather3DIcon';

/**
 * Generates realistic 5-day future forecast deterministically based on city and current metrics.
 */
function generate5DayForecast(weatherData) {
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

  const forecast = [];
  for (let i = 1; i <= 5; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const dayName = i === 1 ? 'Tomorrow' : daysOfWeek[futureDate.getDay()];
    const dateFormatted = futureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // Realistic day-to-day fluctuation (+/- 2 to 3 deg)
    const dayDelta = Math.sin((hash + i) * 1.6) * 3.2;
    const dayTempMax = Math.round(baseTemp + dayDelta + 2.5);
    const dayTempMin = Math.round(baseTemp + dayDelta - 3.0);

    const condIdx = (hash + i * 3) % conditionsList.length;
    let dayCond = (i === 1 && condition === 'Rain') ? 'Rain' : conditionsList[condIdx];
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

/**
 * Returns vector icon for 5-day forecast cards
 */
function renderForecastIcon(cond) {
  const c = (cond || '').toLowerCase();
  if (c.includes('rain')) return <CloudRain size={22} color="#38bdf8" />;
  if (c.includes('cloud')) return <Cloud size={22} color="#cbd5e1" />;
  if (c.includes('snow')) return <Snowflake size={22} color="#a5f3fc" />;
  if (c.includes('thunder')) return <Zap size={22} color="#fbbf24" />;
  return <SunMedium size={22} color="#f59e0b" />;
}

/**
 * WeatherCard: Focal weather presentation showing selected city details
 * and future forecasting of upcoming 5 days.
 */
export default function WeatherCard({
  weatherData,
  lastUpdatedText,
}) {
  const shouldReduceMotion = useReducedMotion();

  const forecastDays = useMemo(() => {
    return generate5DayForecast(weatherData);
  }, [weatherData]);

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
        gap: '28px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Top Hero Section: City Name, Condition, 3D Icon & Temperature */}
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
                fontSize: '42px',
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

      {/* Primary Metrics Grid: Humidity, Wind, Range (No Storage Tier) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
          <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)' }}>
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
          <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)' }}>
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
          <div style={{ fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {Math.round(weatherData.tempMinCelsius)}° / {Math.round(weatherData.tempMaxCelsius)}°
          </div>
        </div>
      </div>

      {/* 5-Day Future Forecast Section */}
      <div
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

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px',
          }}
        >
          {forecastDays.map((f) => (
            <motion.div
              key={f.id}
              whileHover={{ y: -3, transition: { duration: 0.15 } }}
              style={{
                padding: '16px 14px',
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
              <div style={{ margin: '4px 0' }}>
                {renderForecastIcon(f.condition)}
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
        </div>
      </div>

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
