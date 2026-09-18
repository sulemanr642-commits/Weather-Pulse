/**
 * Server State Mutation Hooks: Administrative City Operations
 * Provides typed mutations for adding and deleting tracked cities,
 * with automatic cache invalidation of the cities query.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addAdminCity, deleteAdminCity, loginAdmin } from '@services/api';
import { CITIES_QUERY_KEY } from './useCities';
import type { City, CreateCityRequest, LoginRequest, LoginResponse } from '@types';

export function useAdminLogin() {
  return useMutation<LoginResponse, Error, LoginRequest>({
    mutationFn: (credentials: LoginRequest) => loginAdmin(credentials),
  });
}

export function useAddCityMutation() {
  const queryClient = useQueryClient();

  return useMutation<City, Error, { cityData: CreateCityRequest; token: string }>({
    mutationFn: ({ cityData, token }) => addAdminCity(cityData, token),
    onSuccess: () => {
      // Invalidate cities query so city dropdown and lists reflect the new city
      queryClient.invalidateQueries({ queryKey: CITIES_QUERY_KEY });
    },
  });
}

export function useDeleteCityMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { cityId: number; token: string }>({
    mutationFn: ({ cityId, token }) => deleteAdminCity(cityId, token),
    onSuccess: () => {
      // Invalidate cities query so removed city is immediately evicted
      queryClient.invalidateQueries({ queryKey: CITIES_QUERY_KEY });
    },
  });
}
