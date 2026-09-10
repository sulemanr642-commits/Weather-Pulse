package com.weatherpulse.scheduler;

import com.weatherpulse.client.WeatherApiClient;
import com.weatherpulse.client.dto.WeatherData;
import com.weatherpulse.client.exception.WeatherApiException;
import com.weatherpulse.entity.City;
import com.weatherpulse.repository.CityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WeatherRefreshSchedulerTest {

    @Mock
    private CityRepository cityRepository;

    @Mock
    private WeatherApiClient weatherApiClient;

    @Mock
    private RedisTemplate<String, WeatherData> redisTemplate;

    @Mock
    private ValueOperations<String, WeatherData> valueOperations;

    @InjectMocks
    private WeatherRefreshScheduler scheduler;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(scheduler, "cacheTtlMs", 600000L);
    }

    @Test
    @DisplayName("Scheduler: Proactively refreshes all active cities and writes directly to Redis")
    void testRefreshTrackedCitiesWeather_AllSuccess() {
        City tokyo = City.builder().id(1L).name("Tokyo").countryCode("JP").isActive(true).build();
        City london = City.builder().id(2L).name("London").countryCode("GB").isActive(true).build();

        WeatherData tokyoWeather = WeatherData.builder()
                .cityName("Tokyo")
                .countryCode("JP")
                .temperatureCelsius(22.0)
                .weatherCondition("Clear")
                .fetchedAt(Instant.now())
                .build();

        WeatherData londonWeather = WeatherData.builder()
                .cityName("London")
                .countryCode("GB")
                .temperatureCelsius(15.5)
                .weatherCondition("Clouds")
                .fetchedAt(Instant.now())
                .build();

        when(cityRepository.findByIsActiveTrueOrderByNameAsc()).thenReturn(List.of(tokyo, london));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        when(weatherApiClient.fetchCurrentWeather("Tokyo", "JP")).thenReturn(tokyoWeather);
        when(weatherApiClient.fetchCurrentWeather("London", "GB")).thenReturn(londonWeather);

        scheduler.refreshTrackedCitiesWeather();

        verify(cityRepository).findByIsActiveTrueOrderByNameAsc();
        verify(weatherApiClient).fetchCurrentWeather("Tokyo", "JP");
        verify(weatherApiClient).fetchCurrentWeather("London", "GB");

        verify(valueOperations).set(eq("weatherpulse:weather:tokyo"), eq(tokyoWeather), eq(Duration.ofMillis(600000L)));
        verify(valueOperations).set(eq("weatherpulse:weather:london"), eq(londonWeather), eq(Duration.ofMillis(600000L)));
    }

    @Test
    @DisplayName("Scheduler: Handles per-city failure gracefully and continues batch without aborting")
    void testRefreshTrackedCitiesWeather_HandlesPerCityFailureGracefully() {
        City tokyo = City.builder().id(1L).name("Tokyo").countryCode("JP").isActive(true).build();
        City brokenCity = City.builder().id(2L).name("Atlantis").countryCode("ZZ").isActive(true).build();
        City london = City.builder().id(3L).name("London").countryCode("GB").isActive(true).build();

        WeatherData tokyoWeather = WeatherData.builder().cityName("Tokyo").build();
        WeatherData londonWeather = WeatherData.builder().cityName("London").build();

        when(cityRepository.findByIsActiveTrueOrderByNameAsc()).thenReturn(List.of(tokyo, brokenCity, london));
        when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        when(weatherApiClient.fetchCurrentWeather("Tokyo", "JP")).thenReturn(tokyoWeather);
        when(weatherApiClient.fetchCurrentWeather("Atlantis", "ZZ"))
                .thenThrow(new WeatherApiException("City 'Atlantis' not found",
                        WeatherApiException.ErrorCategory.CITY_NOT_FOUND, org.springframework.http.HttpStatus.NOT_FOUND, "Atlantis"));
        when(weatherApiClient.fetchCurrentWeather("London", "GB")).thenReturn(londonWeather);

        // Should not throw exception despite failure on Atlantis
        scheduler.refreshTrackedCitiesWeather();

        verify(weatherApiClient).fetchCurrentWeather("Tokyo", "JP");
        verify(weatherApiClient).fetchCurrentWeather("Atlantis", "ZZ");
        verify(weatherApiClient).fetchCurrentWeather("London", "GB");

        verify(valueOperations).set(eq("weatherpulse:weather:tokyo"), eq(tokyoWeather), any(Duration.class));
        verify(valueOperations).set(eq("weatherpulse:weather:london"), eq(londonWeather), any(Duration.class));
        verify(valueOperations, never()).set(eq("weatherpulse:weather:atlantis"), any(), any());
    }

    @Test
    @DisplayName("Scheduler: Skips processing when no active cities exist")
    void testRefreshTrackedCitiesWeather_EmptyList() {
        when(cityRepository.findByIsActiveTrueOrderByNameAsc()).thenReturn(Collections.emptyList());

        scheduler.refreshTrackedCitiesWeather();

        verify(cityRepository).findByIsActiveTrueOrderByNameAsc();
        verifyNoInteractions(weatherApiClient);
        verifyNoInteractions(redisTemplate);
    }
}
