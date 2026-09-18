import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from './utils';
import WeatherCard from '@components/weather/WeatherCard';
import type { WeatherData } from '@types';

const mockWeatherData: WeatherData = {
  cityName: 'Tokyo',
  countryCode: 'JP',
  temperatureCelsius: 22.4,
  feelsLikeCelsius: 21.8,
  tempMinCelsius: 18.0,
  tempMaxCelsius: 25.0,
  humidityPercent: 55,
  windSpeedKmh: 12.5,
  windDirectionDegrees: 140,
  weatherCondition: 'Clear',
  weatherDescription: 'clear sky',
  weatherIconCode: '01d',
  externalObservedAt: '2026-09-19T00:00:00Z',
  fetchedAt: '2026-09-19T00:05:00Z',
};

describe('WeatherCard Component', () => {
  describe('Loading State', () => {
    it('renders the loading shimmer skeleton when isLoading is true', () => {
      renderWithProviders(<WeatherCard isLoading={true} />);

      const loadingContainer = screen.getByTestId('weather-loading-state');
      expect(loadingContainer).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.queryByText('Tokyo')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('renders error banner and handles retry trigger when isError is true', () => {
      const handleRetry = vi.fn();
      renderWithProviders(
        <WeatherCard
          isError={true}
          errorMessage="Meteorological service unavailable."
          onRetry={handleRetry}
        />
      );

      const errorContainer = screen.getByTestId('weather-error-state');
      expect(errorContainer).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Meteorological service unavailable.')).toBeInTheDocument();

      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      fireEvent.click(retryButton);
      expect(handleRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success / Weather Data State', () => {
    it('renders complete meteorological observation and forecast accurately', () => {
      renderWithProviders(
        <WeatherCard
          weatherData={mockWeatherData}
          lastUpdatedText="Updated just now"
          cacheStatus="HIT"
        />
      );

      // Section region & city identity
      expect(screen.getByRole('region')).toHaveAttribute(
        'aria-label',
        'Current weather observation for Tokyo, JP'
      );
      expect(screen.getByText('Tokyo')).toBeInTheDocument();
      expect(screen.getByText('JP')).toBeInTheDocument();
      expect(screen.getByText('clear sky')).toBeInTheDocument();

      // Atmospheric Metrics
      expect(screen.getAllByText(/Humidity/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('55%')).toBeInTheDocument();
      expect(screen.getByText(/Wind Speed/i)).toBeInTheDocument();
      expect(screen.getByText(/km\/h/i)).toBeInTheDocument();
      expect(screen.getByText(/Low \/ High/i)).toBeInTheDocument();

      // Cache telemetry
      expect(screen.getByText('CACHE HIT')).toBeInTheDocument();
      expect(screen.getByText('Updated just now')).toBeInTheDocument();

      // 5-Day forecast items
      expect(screen.getByText('5-Day Forecast')).toBeInTheDocument();
      expect(screen.getByText('Tomorrow')).toBeInTheDocument();
    });

    it('contains ARIA live announcement for screen readers', () => {
      renderWithProviders(<WeatherCard weatherData={mockWeatherData} />);

      const ariaLiveEl = screen.getByTestId('weather-aria-announcement');
      expect(ariaLiveEl).toHaveAttribute('aria-live', 'polite');
      expect(ariaLiveEl).toHaveAttribute('aria-atomic', 'true');
      expect(ariaLiveEl.textContent).toContain('Current weather in Tokyo: 22 degrees Celsius, Clear');
      expect(ariaLiveEl.textContent).toContain('humidity 55 percent');
    });

    it('returns null when neither weatherData nor loading/error are present', () => {
      const { container } = renderWithProviders(<WeatherCard weatherData={null} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
