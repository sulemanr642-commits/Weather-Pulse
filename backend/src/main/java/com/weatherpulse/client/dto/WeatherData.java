package com.weatherpulse.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.Instant;

/**
 * Standardized internal Data Transfer Object for current meteorological data.
 * Decouples internal layers and Redis caching from external vendor JSON schemas.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeatherData implements Serializable {

    private static final long serialVersionUID = 1L;

    private String cityName;
    private String countryCode;
    private Double temperatureCelsius;
    private Double feelsLikeCelsius;
    private Double tempMinCelsius;
    private Double tempMaxCelsius;
    private Integer humidityPercent;
    private Double windSpeedKmh;
    private Integer windDirectionDegrees;
    private String weatherCondition;
    private String weatherDescription;
    private String weatherIconCode;
    private Instant externalObservedAt;
    private Instant fetchedAt;
}
