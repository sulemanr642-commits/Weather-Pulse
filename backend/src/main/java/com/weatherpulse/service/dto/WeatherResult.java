package com.weatherpulse.service.dto;

import com.weatherpulse.client.dto.WeatherData;
import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Encapsulates the weather payload along with cache telemetry status (HIT or MISS).
 * Enables the controller to set the 'X-Cache' header accurately.
 */
@Getter
@AllArgsConstructor
public class WeatherResult {

    private final WeatherData data;
    private final boolean cacheHit;

    public String getCacheHeaderValue() {
        return cacheHit ? "HIT" : "MISS";
    }
}
