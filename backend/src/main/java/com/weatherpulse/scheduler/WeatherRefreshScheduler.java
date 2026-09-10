package com.weatherpulse.scheduler;

import com.weatherpulse.client.WeatherApiClient;
import com.weatherpulse.client.dto.WeatherData;
import com.weatherpulse.entity.City;
import com.weatherpulse.repository.CityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Background scheduler proactively refreshing weather data for all active tracked cities.
 * Runs on a dedicated background scheduling thread pool every 5 minutes (300,000 ms), completely
 * decoupling batch external API synchronization from Tomcat's HTTP worker threads.
 *
 * Direct write flow:
 * Loads tracked cities from PostgreSQL -> fetches fresh data from WeatherApiClient ->
 * writes directly to Redis cache with standard TTL (bypassing the reactive cache-miss read path).
 */
@Component
@ConditionalOnProperty(name = "weatherpulse.scheduler.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class WeatherRefreshScheduler {

    private static final String CACHE_KEY_PREFIX = "weatherpulse:weather:";

    private final CityRepository cityRepository;
    private final WeatherApiClient weatherApiClient;
    private final RedisTemplate<String, WeatherData> redisTemplate;

    @Value("${weatherpulse.cache.ttl-ms:600000}")
    private long cacheTtlMs;

    /**
     * Proactively refreshes meteorological data for all active tracked cities every 5 minutes.
     * Executes on Spring's background scheduling executor without blocking incoming HTTP request threads.
     */
    @Scheduled(fixedRate = 300000)
    public void refreshTrackedCitiesWeather() {
        log.info("Starting scheduled weather refresh cycle for all active tracked cities...");

        List<City> activeCities = cityRepository.findByIsActiveTrueOrderByNameAsc();
        if (activeCities == null || activeCities.isEmpty()) {
            log.warn("No active tracked cities found in database. Scheduled refresh skipped.");
            return;
        }

        int successCount = 0;
        List<String> failedCities = new ArrayList<>();

        for (City city : activeCities) {
            String cityName = city.getName();
            String countryCode = city.getCountryCode();

            try {
                log.debug("Proactively fetching weather for city='{}' ({})", cityName, countryCode);
                WeatherData freshData = weatherApiClient.fetchCurrentWeather(cityName, countryCode);

                String cacheKey = CACHE_KEY_PREFIX + cityName.trim().toLowerCase();
                redisTemplate.opsForValue().set(cacheKey, freshData, Duration.ofMillis(cacheTtlMs));
                successCount++;

                log.debug("Proactively updated Redis cache for city='{}' [key='{}', TTL={}ms]",
                        cityName, cacheKey, cacheTtlMs);

            } catch (Exception ex) {
                // Per-city fault tolerance: log error and continue to the next city without aborting the batch
                log.error("Scheduled refresh failed for city='{}' ({}): {}", cityName, countryCode, ex.getMessage());
                failedCities.add(cityName);
            }
        }

        // Output clear summary after each run
        if (failedCities.isEmpty()) {
            log.info("WeatherRefreshScheduler run completed: Successfully refreshed {}/{} cities (0 failed).",
                    successCount, activeCities.size());
        } else {
            log.warn("WeatherRefreshScheduler run completed: Refreshed {}/{} cities successfully, {} failed: {}",
                    successCount, activeCities.size(), failedCities.size(), String.join(", ", failedCities));
        }
    }
}
