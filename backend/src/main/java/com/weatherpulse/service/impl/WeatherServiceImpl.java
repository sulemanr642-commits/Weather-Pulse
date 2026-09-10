package com.weatherpulse.service.impl;

import com.weatherpulse.client.WeatherApiClient;
import com.weatherpulse.client.dto.WeatherData;
import com.weatherpulse.client.exception.WeatherApiException;
import com.weatherpulse.entity.City;
import com.weatherpulse.repository.CityRepository;
import com.weatherpulse.service.WeatherService;
import com.weatherpulse.service.dto.WeatherResult;
import com.weatherpulse.service.exception.CityNotFoundException;
import com.weatherpulse.service.exception.ExternalServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

/**
 * Implementation of WeatherService orchestrating the cache-aside pattern.
 * Interacts with RedisTemplate for sub-millisecond reads and coordinates with
 * PostgreSQL and WeatherApiClient on cache misses.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WeatherServiceImpl implements WeatherService {

    private static final String CACHE_KEY_PREFIX = "weatherpulse:weather:";

    private final RedisTemplate<String, WeatherData> redisTemplate;
    private final CityRepository cityRepository;
    private final WeatherApiClient weatherApiClient;

    @Value("${weatherpulse.cache.ttl-ms:600000}")
    private long cacheTtlMs;

    @Override
    public WeatherResult getWeatherForCity(String cityName) {
        if (cityName == null || cityName.isBlank()) {
            throw new IllegalArgumentException("City name must not be blank");
        }

        String canonicalCity = cityName.trim();
        String cacheKey = buildCacheKey(canonicalCity);

        // Step 1: Probe Redis cache
        WeatherData cachedData = readFromCacheSafe(cacheKey);
        if (cachedData != null) {
            log.info("Cache HIT: Serving weather for city='{}' directly from Redis [key='{}']", canonicalCity, cacheKey);
            return new WeatherResult(cachedData, true);
        }

        // Step 2: Cache MISS - Confirm city is monitored in PostgreSQL
        log.info("Cache MISS: Key '{}' not found in Redis. Validating city in PostgreSQL...", cacheKey);
        City city = cityRepository.findByNameIgnoreCaseAndIsActiveTrue(canonicalCity)
                .orElseThrow(() -> new CityNotFoundException(
                        "The city '" + canonicalCity + "' is not currently tracked by WeatherPulse."));

        // Step 3: Fetch on-demand from upstream OpenWeatherMap API
        try {
            WeatherData freshData = weatherApiClient.fetchCurrentWeather(city.getName(), city.getCountryCode());

            // Step 4: Populate Redis with standard 10-minute TTL
            cacheWeather(city.getName(), freshData);

            return new WeatherResult(freshData, false);

        } catch (WeatherApiException ex) {
            log.error("External weather API failure during cache-miss retrieval for city='{}': {}",
                    canonicalCity, ex.getMessage());

            // Resilience fallback: If Redis had stale data that somehow failed TTL or if cachedData was found
            if (cachedData != null) {
                log.warn("Resilience fallback activated: Serving stale cached metrics for city='{}'", canonicalCity);
                return new WeatherResult(cachedData, true);
            }

            // No cached data available: throw structured exception mapped to RFC 7807 502 Bad Gateway
            throw new ExternalServiceException(
                    "The upstream weather provider is temporarily unavailable for city '" + canonicalCity + "'.", ex);
        }
    }

    @Override
    public void cacheWeather(String cityName, WeatherData weatherData) {
        String cacheKey = buildCacheKey(cityName);
        try {
            redisTemplate.opsForValue().set(cacheKey, weatherData, Duration.ofMillis(cacheTtlMs));
            log.info("Successfully populated Redis cache: key='{}', TTL={}ms", cacheKey, cacheTtlMs);
        } catch (Exception ex) {
            // Fail open: log error but do not disrupt active request flow
            log.error("Failed to write weather data to Redis for key='{}': {}", cacheKey, ex.getMessage());
        }
    }

    @Override
    public void evictCityCache(String cityName) {
        String cacheKey = buildCacheKey(cityName);
        try {
            Boolean deleted = redisTemplate.delete(cacheKey);
            log.info("Evicted Redis cache key='{}' (deleted={})", cacheKey, deleted);
        } catch (Exception ex) {
            log.error("Failed to evict Redis cache key='{}': {}", cacheKey, ex.getMessage());
        }
    }

    private WeatherData readFromCacheSafe(String cacheKey) {
        try {
            return redisTemplate.opsForValue().get(cacheKey);
        } catch (Exception ex) {
            // Fail open: if Redis is temporarily unreachable, treat as cache miss rather than crashing
            log.warn("Redis read failure for key='{}': {}. Falling open to database/upstream.", cacheKey, ex.getMessage());
            return null;
        }
    }

    private String buildCacheKey(String cityName) {
        return CACHE_KEY_PREFIX + cityName.trim().toLowerCase();
    }
}
