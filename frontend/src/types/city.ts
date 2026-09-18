/**
 * Tracked City Domain Types
 * Exactly synchronized with backend contracts:
 * - com.weatherpulse.entity.City
 * - com.weatherpulse.web.dto.CreateCityRequest
 */

export interface City {
  id: number;
  name: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCityRequest {
  name: string;
  countryCode: string;
  latitude: number;
  longitude: number;
}

export interface PagedCityResponse {
  content: City[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
