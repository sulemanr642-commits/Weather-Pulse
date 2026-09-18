/**
 * Meteorological Domain Types
 * Exactly synchronized with backend contracts:
 * - com.weatherpulse.client.dto.WeatherData
 * - com.weatherpulse.service.dto.WeatherResult
 */

export interface WeatherData {
  cityName: string;
  countryCode: string;
  temperatureCelsius: number;
  feelsLikeCelsius: number;
  tempMinCelsius: number;
  tempMaxCelsius: number;
  humidityPercent: number;
  windSpeedKmh: number;
  windDirectionDegrees: number;
  weatherCondition: string;
  weatherDescription: string;
  weatherIconCode: string;
  externalObservedAt: string; // ISO 8601 string
  fetchedAt: string;          // ISO 8601 string
}

export type CacheStatus = 'HIT' | 'MISS' | 'UNKNOWN';

export interface WeatherResponse {
  data: WeatherData;
  cacheStatus: CacheStatus;
}

export interface ForecastDay {
  id: number;
  dayName: string;
  dateFormatted: string;
  condition: string;
  tempMin: number;
  tempMax: number;
  pop: number; // Probability of precipitation (0-100%)
}
