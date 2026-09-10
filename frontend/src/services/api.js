/**
 * WeatherPulse Thin REST Client Service Layer
 * Interfaces with backend endpoints per docs/api-contract.md
 */
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 8000,
});

/**
 * Public Endpoint: Fetches active tracked cities for the UI selector.
 * @returns {Promise<Array<{id: number, name: string, countryCode: string}>>}
 */
export async function getCities() {
  const response = await apiClient.get('/cities');
  return response.data;
}

/**
 * Public Endpoint: Fetches current weather for a city (cache-first).
 * Extracts telemetry header 'X-Cache' ('HIT' | 'MISS').
 * @param {string} cityName
 * @returns {Promise<{data: object, cacheStatus: string}>}
 */
export async function getWeather(cityName) {
  const response = await apiClient.get(`/weather/${encodeURIComponent(cityName)}`);
  const cacheStatus = response.headers['x-cache'] || 'UNKNOWN';
  return {
    data: response.data,
    cacheStatus,
  };
}

/**
 * Public Auth: Validates administrator credentials and retrieves JWT token.
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{token: string, tokenType: string, expiresIn: number}>}
 */
export async function loginAdmin(username, password) {
  const response = await apiClient.post('/auth/login', { username, password });
  return response.data;
}

/**
 * Secured Admin Endpoint: Adds a new tracked city (Requires Bearer JWT).
 * @param {{name: string, countryCode: string, latitude: number, longitude: number}} cityData
 * @param {string} token
 * @returns {Promise<object>}
 */
export async function addAdminCity(cityData, token) {
  const response = await apiClient.post('/admin/cities', cityData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

/**
 * Secured Admin Endpoint: Deletes a tracked city by ID (Requires Bearer JWT).
 * @param {number} cityId
 * @param {string} token
 * @returns {Promise<void>}
 */
export async function deleteAdminCity(cityId, token) {
  await apiClient.delete(`/admin/cities/${cityId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export default apiClient;
