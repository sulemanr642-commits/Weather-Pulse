/**
 * Server State Hook: Tracked Cities
 * Queries GET /api/cities via TanStack Query.
 * Features:
 * - 10-minute staleTime (cities rarely change)
 * - Automatic background synchronization
 * - Invalidation when admin adds or deletes cities
 */
import { useQuery } from '@tanstack/react-query';
import { getCities } from '@services/api';
import type { City } from '@types';

export const CITIES_QUERY_KEY = ['cities'] as const;

export function useCities() {
  return useQuery<City[], Error>({
    queryKey: CITIES_QUERY_KEY,
    queryFn: getCities,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000,    // 30 minutes in memory cache
    refetchOnWindowFocus: false,
  });
}

export default useCities;
