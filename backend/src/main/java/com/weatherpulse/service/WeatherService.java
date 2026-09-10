package com.weatherpulse.service;

import com.weatherpulse.client.dto.WeatherData;
import com.weatherpulse.service.dto.WeatherResult;

/**
 * Service contract for weather domain operations and cache-aside orchestration.
 */
public interface WeatherService {

    /**
     * Retrieves current meteorological data for a city using the cache-aside pattern:
     * 1. Checks Redis cache first.
     * 2. If present, returns immediately as a cache HIT.
     * 3. If absent (cache MISS), validates the city in PostgreSQL, queries the external client,
     *    populates Redis with a 10-minute TTL, and returns as a cache MISS.
     *
     * @param cityName City name to inspect (case-insensitive)
     * @return WeatherResult containing data and telemetry status
     */
    WeatherResult getWeatherForCity(String cityName);

    /**
     * Stores weather data in Redis with the configured TTL (10 minutes).
     * Used by reactive cache-miss population and proactive background scheduler.
     *
     * @param cityName    Canonical city name
     * @param weatherData WeatherData payload
     */
    void cacheWeather(String cityName, WeatherData weatherData);

    /**
     * Evicts the cached entry for a specific city from Redis.
     * Used when an administrator deletes or deactivates a city.
     *
     * @param cityName City name whose cache entry should be purged
     */
    void evictCityCache(String cityName);
}
