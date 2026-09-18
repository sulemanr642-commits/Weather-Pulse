/**
 * WeatherPulse Typed REST Client Service Layer
 * Interfaces strictly with backend Spring Boot endpoints per docs/api-contract.md
 */
import axios, { AxiosInstance } from 'axios';
import type { 
  City, 
  WeatherData, 
  WeatherResponse, 
  CacheStatus, 
  LoginRequest, 
  LoginResponse, 
  CreateCityRequest 
} from '@types';

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 8000,
});

/**
 * Public Endpoint: Fetches active tracked cities for the UI selector.
 * GET /api/cities
 */
export async function getCities(): Promise<City[]> {
  const response = await apiClient.get<City[]>('/cities');
  return response.data;
}

/**
 * Public Endpoint: Fetches current weather for a city (cache-first).
 * Extracts telemetry header 'X-Cache' ('HIT' | 'MISS' | 'UNKNOWN').
 * GET /api/weather/{cityName}
 */
export async function getWeather(cityName: string): Promise<WeatherResponse> {
  const response = await apiClient.get<WeatherData>(`/weather/${encodeURIComponent(cityName)}`);
  const rawCache = response.headers['x-cache'];
  const cacheStatus: CacheStatus =
    rawCache === 'HIT' || rawCache === 'MISS' ? rawCache : 'UNKNOWN';

  return {
    data: response.data,
    cacheStatus,
  };
}

/**
 * Public Auth: Validates administrator credentials and retrieves JWT token.
 * POST /api/auth/login
 */
export async function loginAdmin(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
  return response.data;
}

/**
 * Secured Admin Endpoint: Adds a new tracked city (Requires Bearer JWT).
 * POST /api/admin/cities
 */
export async function addAdminCity(cityData: CreateCityRequest, token: string): Promise<City> {
  const response = await apiClient.post<City>('/admin/cities', cityData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

/**
 * Secured Admin Endpoint: Deletes a tracked city by ID (Requires Bearer JWT).
 * DELETE /api/admin/cities/{cityId}
 */
export async function deleteAdminCity(cityId: number, token: string): Promise<void> {
  await apiClient.delete(`/admin/cities/${cityId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export default apiClient;
