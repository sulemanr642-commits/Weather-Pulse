/**
 * Server State Hook: Meteorological Data
 * Queries GET /api/weather/{cityName} via TanStack Query.
 * Features:
 * - 5-minute silent background refetch interval matching backend synchronization cadence
 * - 60-second staleTime to prevent redundant refetches on quick re-renders
 * - Extracts both meteorological payload and telemetry cache status ('HIT' | 'MISS')
 */
import { useQuery } from '@tanstack/react-query';
import { getWeather } from '@services/api';
import type { WeatherResponse } from '@types';

export const WEATHER_QUERY_KEY = (cityName: string) => ['weather', cityName.toLowerCase()] as const;

export function useWeather(cityName: string) {
  const normalizedCity = cityName?.trim() || '';

  return useQuery<WeatherResponse, Error>({
    queryKey: WEATHER_QUERY_KEY(normalizedCity),
    queryFn: () => getWeather(normalizedCity),
    enabled: normalizedCity.length > 0,
    staleTime: 60 * 1000,          // 1 minute stale threshold
    refetchInterval: 5 * 60 * 1000, // 5-minute silent auto-refresh
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export default useWeather;
