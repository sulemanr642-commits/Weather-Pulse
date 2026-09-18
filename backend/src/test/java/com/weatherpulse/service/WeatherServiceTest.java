package com.weatherpulse.service;

import com.weatherpulse.client.WeatherApiClient;
import com.weatherpulse.client.dto.WeatherData;
import com.weatherpulse.client.exception.WeatherApiException;
import com.weatherpulse.entity.City;
import com.weatherpulse.repository.CityRepository;
import com.weatherpulse.service.dto.WeatherResult;
import com.weatherpulse.service.exception.CityNotFoundException;
import com.weatherpulse.service.exception.ExternalServiceException;
import com.weatherpulse.service.impl.WeatherServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Pure Mockito Unit Tests for WeatherServiceImpl.
 * Verifies Cache-Aside orchestration, cache hits, cache misses, upstream API
 * integration,
 * error handling, and fallback resilience without any external network or
 * database dependencies.
 */
@ExtendWith(MockitoExtension.class)
class WeatherServiceTest {

        @Mock
        private RedisTemplate<String, WeatherData> redisTemplate;

        @Mock
        private ValueOperations<String, WeatherData> valueOperations;

        @Mock
        private CityRepository cityRepository;

        @Mock
        private WeatherApiClient weatherApiClient;

        private WeatherServiceImpl weatherService;

        private City tokyoCity;
        private WeatherData mockWeatherData;

        @BeforeEach
        void setUp() {
                org.mockito.Mockito.lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);

                weatherService = new WeatherServiceImpl(redisTemplate, cityRepository, weatherApiClient);
                weatherService.setCacheTtlMs(600000L);
                weatherService.setFallbackEnabled(true);

                tokyoCity = City.builder()
                                .id(1L)
                                .name("Tokyo")
                                .countryCode("JP")
                                .latitude(new BigDecimal("35.6762"))
                                .longitude(new BigDecimal("139.6503"))
                                .isActive(true)
                                .build();

                mockWeatherData = WeatherData.builder()
                                .cityName("Tokyo")
                                .countryCode("JP")
                                .temperatureCelsius(22.5)
                                .feelsLikeCelsius(23.0)
                                .tempMinCelsius(19.0)
                                .tempMaxCelsius(25.0)
                                .humidityPercent(55)
                                .windSpeedKmh(12.0)
                                .windDirectionDegrees(180)
                                .weatherCondition("Clear")
                                .weatherDescription("clear sky")
                                .weatherIconCode("01d")
                                .externalObservedAt(Instant.now())
                                .fetchedAt(Instant.now())
                                .build();
        }

        @Test
        @DisplayName("Cache HIT: Returns cached weather directly from Redis without calling database or external API")
        void testCacheHit_ReturnsCachedDataWithoutDatabaseOrClientCall() {
                String cacheKey = "weatherpulse:weather:tokyo";
                when(valueOperations.get(cacheKey)).thenReturn(mockWeatherData);

                WeatherResult result = weatherService.getWeatherForCity("Tokyo");

                assertThat(result).isNotNull();
                assertThat(result.isCacheHit()).isTrue();
                assertThat(result.getData().getCityName()).isEqualTo("Tokyo");
                assertThat(result.getData().getTemperatureCelsius()).isEqualTo(22.5);

                // Verification: Zero database queries and zero external API calls
                verify(valueOperations, times(1)).get(cacheKey);
                verifyNoInteractions(cityRepository);
                verifyNoInteractions(weatherApiClient);
        }

        @Test
        @DisplayName("Cache MISS + Successful API call: Validates city in DB, fetches fresh data, populates Redis, and returns result")
        void testCacheMiss_SuccessfulApiCall_CachesAndReturnsFreshData() {
                String cacheKey = "weatherpulse:weather:tokyo";
                when(valueOperations.get(cacheKey)).thenReturn(null);
                when(cityRepository.findByNameIgnoreCaseAndIsActiveTrue("Tokyo")).thenReturn(Optional.of(tokyoCity));
                when(weatherApiClient.fetchCurrentWeather("Tokyo", "JP")).thenReturn(mockWeatherData);

                WeatherResult result = weatherService.getWeatherForCity("Tokyo");

                assertThat(result).isNotNull();
                assertThat(result.isCacheHit()).isFalse();
                assertThat(result.getData().getCityName()).isEqualTo("Tokyo");
                assertThat(result.getData().getTemperatureCelsius()).isEqualTo(22.5);

                // Verify sequential orchestration:
                // 1. Probe cache
                verify(valueOperations, times(1)).get(cacheKey);
                // 2. Validate city in PostgreSQL
                verify(cityRepository, times(1)).findByNameIgnoreCaseAndIsActiveTrue("Tokyo");
                // 3. Fetch from OpenWeatherMap
                verify(weatherApiClient, times(1)).fetchCurrentWeather("Tokyo", "JP");
                // 4. Save to Redis with 10-minute TTL
                verify(valueOperations, times(1)).set(eq(cacheKey), eq(mockWeatherData),
                                eq(Duration.ofMillis(600000L)));
        }

        @Test
        @DisplayName("Cache MISS + API Failure with NO fallback available: Throws ExternalServiceException")
        void testCacheMiss_ApiFailure_NoFallback_ThrowsExternalServiceException() {
                String cacheKey = "weatherpulse:weather:tokyo";
                when(valueOperations.get(cacheKey)).thenReturn(null);
                when(cityRepository.findByNameIgnoreCaseAndIsActiveTrue("Tokyo")).thenReturn(Optional.of(tokyoCity));

                WeatherApiException upstreamError = new WeatherApiException(
                                "OpenWeatherMap service temporarily unavailable (HTTP 503)",
                                WeatherApiException.ErrorCategory.UPSTREAM_SERVER_ERROR,
                                HttpStatus.SERVICE_UNAVAILABLE,
                                "Tokyo");
                when(weatherApiClient.fetchCurrentWeather("Tokyo", "JP")).thenThrow(upstreamError);

                // Disable fallback simulation to test pure failure path
                weatherService.setFallbackEnabled(false);

                assertThatThrownBy(() -> weatherService.getWeatherForCity("Tokyo"))
                                .isInstanceOf(ExternalServiceException.class)
                                .hasMessageContaining("Upstream meteorological service is currently unavailable")
                                .hasCause(upstreamError);

                // Verify Redis was not written with corrupted data
                verify(valueOperations, never()).set(anyString(), any(), any());
        }

        @Test
        @DisplayName("Cache MISS + API Failure with fallback enabled: Synthesizes resilient observation and populates cache")
        void testCacheMiss_ApiFailure_WithFallback_ReturnsResilientData() {
                String cacheKey = "weatherpulse:weather:tokyo";
                when(valueOperations.get(cacheKey)).thenReturn(null);
                when(cityRepository.findByNameIgnoreCaseAndIsActiveTrue("Tokyo")).thenReturn(Optional.of(tokyoCity));

                WeatherApiException timeoutError = new WeatherApiException(
                                "Read timed out communicating with upstream API",
                                WeatherApiException.ErrorCategory.TIMEOUT,
                                "Tokyo",
                                null);
                when(weatherApiClient.fetchCurrentWeather("Tokyo", "JP")).thenThrow(timeoutError);

                weatherService.setFallbackEnabled(true);

                WeatherResult result = weatherService.getWeatherForCity("Tokyo");

                assertThat(result).isNotNull();
                assertThat(result.isCacheHit()).isFalse();
                assertThat(result.getData().getCityName()).isEqualTo("Tokyo");
                assertThat(result.getData().getCountryCode()).isEqualTo("JP");
                assertThat(result.getData().getTemperatureCelsius()).isNotNull();

                // Verify fallback was stored in Redis to protect upstream from further
                // hammering
                verify(valueOperations, times(1)).set(eq(cacheKey), any(WeatherData.class),
                                eq(Duration.ofMillis(600000L)));
        }

        @Test
        @DisplayName("Cache MISS on untracked city: Throws CityNotFoundException without invoking external API")
        void testCacheMiss_UntrackedCity_ThrowsCityNotFoundException() {
                String cacheKey = "weatherpulse:weather:atlantis";
                when(valueOperations.get(cacheKey)).thenReturn(null);
                when(cityRepository.findByNameIgnoreCaseAndIsActiveTrue("Atlantis")).thenReturn(Optional.empty());

                assertThatThrownBy(() -> weatherService.getWeatherForCity("Atlantis"))
                                .isInstanceOf(CityNotFoundException.class)
                                .hasMessageContaining("The city 'Atlantis' is not currently tracked");

                // Verification: Weather API client was never touched for an untracked city
                verifyNoInteractions(weatherApiClient);
                verify(valueOperations, never()).set(anyString(), any(), any());
        }

        @Test
        @DisplayName("Input Validation: Blank or null city name throws IllegalArgumentException immediately")
        void testBlankCityName_ThrowsIllegalArgumentException() {
                assertThatThrownBy(() -> weatherService.getWeatherForCity(""))
                                .isInstanceOf(IllegalArgumentException.class)
                                .hasMessageContaining("City name must not be blank");

                assertThatThrownBy(() -> weatherService.getWeatherForCity("   "))
                                .isInstanceOf(IllegalArgumentException.class);

                assertThatThrownBy(() -> weatherService.getWeatherForCity(null))
                                .isInstanceOf(IllegalArgumentException.class);

                verifyNoInteractions(cityRepository);
                verifyNoInteractions(weatherApiClient);
        }
}
