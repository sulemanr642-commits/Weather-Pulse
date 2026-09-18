import React from 'react';
import WeatherIcon from './WeatherIcon';
import type { ForecastDay } from '@types';

export interface ForecastBadgeProps {
  day: ForecastDay;
  isToday?: boolean;
}

export const ForecastBadge: React.FC<ForecastBadgeProps> = ({ day, isToday = false }) => {
  return (
    <div
      style={{
        padding: '14px 10px',
        borderRadius: 'var(--radius-md, 14px)',
        background: isToday
          ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.22) 0%, rgba(30, 58, 138, 0.3) 100%)'
          : 'rgba(255, 255, 255, 0.04)',
        border: isToday
          ? '1px solid rgba(56, 189, 248, 0.45)'
          : '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isToday ? '0 4px 20px rgba(56, 189, 248, 0.2)' : 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.28)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = isToday
          ? 'rgba(56, 189, 248, 0.45)'
          : 'rgba(255, 255, 255, 0.1)';
      }}
    >
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
        {day.dayName}
      </span>
      <span style={{ fontSize: '10px', color: 'var(--text-muted, rgba(255, 255, 255, 0.5))' }}>
        {day.dateFormatted}
      </span>

      <div style={{ margin: '2px 0' }}>
        <WeatherIcon condition={day.condition} size={34} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}>
        <span style={{ color: '#fff' }}>{day.tempMax}°</span>
        <span style={{ color: 'var(--text-muted, rgba(255, 255, 255, 0.45))', fontSize: '11px' }}>
          {day.tempMin}°
        </span>
      </div>

      {day.pop > 15 && (
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: '#38bdf8',
            background: 'rgba(56, 189, 248, 0.15)',
            padding: '2px 6px',
            borderRadius: 'var(--radius-pill, 9999px)',
          }}
        >
          {day.pop}%
        </span>
      )}
    </div>
  );
};

export default ForecastBadge;
