package com.weatherpulse.scheduler;

import com.weatherpulse.client.WeatherApiClient;
import com.weatherpulse.client.dto.WeatherData;
import com.weatherpulse.entity.City;
import com.weatherpulse.repository.CityRepository;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * High-Capacity, Scalable Background Refresh Scheduler.
 * Proactively refreshes meteorological data for all active tracked cities.
 *
 * Scalability Architecture:
 * 1. Constant Heap Memory O(1): Loads cities in paginated batches (e.g., 50 at a time),
 *    preventing memory exhaustion when managing 1,000 to 100,000+ cities.
 * 2. Bounded Concurrency: Dispatches calls to a controlled worker pool with configurable
 *    concurrency (default: 8 parallel workers), eliminating single-thread stalls.
 * 3. Rate-Limit Throttling: Configurable inter-batch delay to stay strictly within upstream
 *    OpenWeatherMap quota limits.
 * 4. Fault Isolation: Thread-safe metrics collection ensuring single city failures never abort the batch.
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

    @Value("${weatherpulse.scheduler.batch-size:50}")
    private int batchSize;

    @Value("${weatherpulse.scheduler.concurrency:8}")
    private int concurrency;

    @Value("${weatherpulse.scheduler.throttle-ms:50}")
    private long throttleMs;

    private ExecutorService workerExecutor;

    @PostConstruct
    public void initExecutor() {
        this.workerExecutor = Executors.newFixedThreadPool(concurrency, r -> {
            Thread t = new Thread(r, "weather-refresh-worker");
            t.setDaemon(true);
            return t;
        });
        log.info("Initialized WeatherRefreshScheduler worker pool (concurrency={}, batchSize={}, throttleMs={})",
                concurrency, batchSize, throttleMs);
    }

    @PreDestroy
    public void shutdownExecutor() {
        if (workerExecutor != null && !workerExecutor.isShutdown()) {
            workerExecutor.shutdown();
            log.info("Shut down WeatherRefreshScheduler worker pool.");
        }
    }

    /**
     * Proactively refreshes meteorological data for all active tracked cities every 5 minutes.
     * Executes concurrently across bounded worker threads without blocking incoming HTTP request threads.
     */
    @Scheduled(fixedRate = 300000)
    public void refreshTrackedCitiesWeather() {
        long cycleStartTime = System.currentTimeMillis();
        log.info("Starting high-capacity scheduled weather refresh cycle for active tracked cities...");

        int pageIndex = 0;
        int totalProcessed = 0;
        AtomicInteger successCount = new AtomicInteger(0);
        ConcurrentLinkedQueue<String> failedCities = new ConcurrentLinkedQueue<>();

        while (true) {
            Page<City> cityPage = cityRepository.findByIsActiveTrueOrderByNameAsc(PageRequest.of(pageIndex, batchSize));

            if (cityPage == null || cityPage.isEmpty()) {
                if (pageIndex == 0) {
                    log.warn("No active tracked cities found in database. Scheduled refresh skipped.");
                }
                break;
            }

            List<City> currentBatch = cityPage.getContent();
            totalProcessed += currentBatch.size();

            // Submit current batch to bounded worker executor
            List<CompletableFuture<Void>> futures = new ArrayList<>(currentBatch.size());
            for (City city : currentBatch) {
                futures.add(CompletableFuture.runAsync(() -> refreshSingleCity(city, successCount, failedCities), workerExecutor));
            }

            // Await completion of current batch before advancing
            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

            // Inter-batch rate limit throttle pause (if more pages remain)
            if (cityPage.hasNext() && throttleMs > 0) {
                try {
                    Thread.sleep(throttleMs);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    log.warn("Refresh batch throttling interrupted: {}", e.getMessage());
                    break;
                }
            }

            if (!cityPage.hasNext()) {
                break;
            }
            pageIndex++;
        }

        if (totalProcessed > 0) {
            long durationMs = Math.max(1, System.currentTimeMillis() - cycleStartTime);
            double throughput = Math.round((totalProcessed / (durationMs / 1000.0)) * 10.0) / 10.0;

            if (failedCities.isEmpty()) {
                log.info("WeatherRefreshScheduler run completed: Successfully refreshed {}/{} cities (0 failed) in {}ms ({} cities/sec).",
                        successCount.get(), totalProcessed, durationMs, throughput);
            } else {
                log.warn("WeatherRefreshScheduler run completed: Refreshed {}/{} cities successfully, {} failed in {}ms: {}",
                        successCount.get(), totalProcessed, failedCities.size(), durationMs, String.join(", ", failedCities));
            }
        }
    }

    private void refreshSingleCity(City city, AtomicInteger successCount, ConcurrentLinkedQueue<String> failedCities) {
        String cityName = city.getName();
        String countryCode = city.getCountryCode();

        try {
            WeatherData freshData = weatherApiClient.fetchCurrentWeather(cityName, countryCode);
            String cacheKey = CACHE_KEY_PREFIX + cityName.trim().toLowerCase();
            redisTemplate.opsForValue().set(cacheKey, freshData, Duration.ofMillis(cacheTtlMs));
            successCount.incrementAndGet();

            log.debug("Proactively updated Redis cache for city='{}' [key='{}']", cityName, cacheKey);

        } catch (Exception ex) {
            log.error("Scheduled refresh failed for city='{}' ({}): {}", cityName, countryCode, ex.getMessage());
            failedCities.add(cityName);
        }
    }
}
