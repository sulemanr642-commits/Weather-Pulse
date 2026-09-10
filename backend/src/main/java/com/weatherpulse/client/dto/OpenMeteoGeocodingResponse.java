package com.weatherpulse.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Maps geocoding coordinates from Open-Meteo Geocoding API when city coordinates
 * are not already provided.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenMeteoGeocodingResponse {

    @JsonProperty("results")
    private List<GeocodingResult> results;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeocodingResult {
        private String name;
        private Double latitude;
        private Double longitude;

        @JsonProperty("country_code")
        private String countryCode;
    }
}
