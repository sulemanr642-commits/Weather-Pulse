package com.weatherpulse.web;

import com.weatherpulse.client.WeatherApiClient;
import com.weatherpulse.client.dto.WeatherData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * End-to-End integration test demonstrating the Cache-Aside lifecycle with live Redis & PostgreSQL:
 * 1. Initial request triggers cache MISS + external API call + Redis storage.
 * 2. Subsequent request within 10-minute TTL triggers cache HIT with ZERO external API calls.
 * 3. Non-tracked city returns 404 RFC 7807 without hitting upstream API.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = "weatherpulse.scheduler.enabled=false")
class WeatherControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private WeatherApiClient weatherApiClient;

    @Autowired
    private RedisTemplate<String, WeatherData> redisTemplate;

    private static final String CACHE_KEY_TOKYO = "weatherpulse:weather:tokyo";

    private WeatherData mockTokyoWeather;

    @BeforeEach
    void setup() {
        // Clear Redis cache key before test to ensure deterministic clean state
        redisTemplate.delete(CACHE_KEY_TOKYO);

        mockTokyoWeather = WeatherData.builder()
                .cityName("Tokyo")
                .countryCode("JP")
                .temperatureCelsius(22.4)
                .feelsLikeCelsius(22.1)
                .tempMinCelsius(20.8)
                .tempMaxCelsius(24.0)
                .humidityPercent(58)
                .windSpeedKmh(12.6)
                .windDirectionDegrees(180)
                .weatherCondition("Clear")
                .weatherDescription("clear sky")
                .weatherIconCode("01d")
                .externalObservedAt(Instant.parse("2026-09-10T17:15:00Z"))
                .fetchedAt(Instant.now())
                .build();
    }

    @Test
    @DisplayName("End-to-End Cache-Aside Flow: Request 1 is MISS (calls client), Request 2 is HIT (direct Redis)")
    void testEndToEndCacheAsideFlow() throws Exception {
        // Configure mock client return
        when(weatherApiClient.fetchCurrentWeather(eq("Tokyo"), eq("JP")))
                .thenReturn(mockTokyoWeather);

        // --- REQUEST 1: Cold Cache (Expect MISS) ---
        mockMvc.perform(get("/api/weather/Tokyo")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Cache", "MISS"))
                .andExpect(jsonPath("$.cityName").value("Tokyo"))
                .andExpect(jsonPath("$.temperatureCelsius").value(22.4))
                .andExpect(jsonPath("$.humidityPercent").value(58))
                .andExpect(jsonPath("$.windSpeedKmh").value(12.6));

        // Verify external client was invoked exactly once
        verify(weatherApiClient, times(1)).fetchCurrentWeather(eq("Tokyo"), eq("JP"));

        // Verify Redis now contains the cached key
        WeatherData cachedData = redisTemplate.opsForValue().get(CACHE_KEY_TOKYO);
        assertThat(cachedData).isNotNull();
        assertThat(cachedData.getCityName()).isEqualTo("Tokyo");
        assertThat(cachedData.getTemperatureCelsius()).isEqualTo(22.4);

        // --- REQUEST 2: Warm Cache within TTL (Expect HIT) ---
        mockMvc.perform(get("/api/weather/Tokyo")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Cache", "HIT"))
                .andExpect(jsonPath("$.cityName").value("Tokyo"))
                .andExpect(jsonPath("$.temperatureCelsius").value(22.4));

        // CRITICAL CHECK: Verify external client call count did NOT increase (still exactly 1)
        verify(weatherApiClient, times(1)).fetchCurrentWeather(eq("Tokyo"), eq("JP"));
    }

    @Test
    @DisplayName("Untracked City: Returns 404 ProblemDetail without calling external API")
    void testUntrackedCityReturns404() throws Exception {
        mockMvc.perform(get("/api/weather/Atlantis")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title").value("City Not Found"))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.detail").value("The city 'Atlantis' is not currently tracked by WeatherPulse."));

        // Verify external client was never invoked
        verifyNoInteractions(weatherApiClient);
    }

    @Test
    @DisplayName("Cache Eviction: When cache is evicted, subsequent request is a MISS")
    void testCacheEvictionTriggersMiss() throws Exception {
        when(weatherApiClient.fetchCurrentWeather(eq("Tokyo"), eq("JP")))
                .thenReturn(mockTokyoWeather);

        // Pre-populate Redis
        redisTemplate.opsForValue().set(CACHE_KEY_TOKYO, mockTokyoWeather);

        // Request 1: Warm cache HIT
        mockMvc.perform(get("/api/weather/Tokyo"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Cache", "HIT"));

        // Evict key
        redisTemplate.delete(CACHE_KEY_TOKYO);

        // Request 2: After eviction, request is a MISS
        mockMvc.perform(get("/api/weather/Tokyo"))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Cache", "MISS"));

        verify(weatherApiClient, times(1)).fetchCurrentWeather(eq("Tokyo"), eq("JP"));
    }
}
