package com.weatherpulse.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Raw DTO mapping the wire JSON response from OpenWeatherMap API:
 * GET /data/2.5/weather?q={city}&appid={key}&units=metric
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenWeatherResponse {

    private String name;
    private long dt;
    private int cod;
    private List<WeatherDescription> weather;
    private MainMetrics main;
    private WindMetrics wind;
    private SysInfo sys;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WeatherDescription {
        private int id;
        private String main;
        private String description;
        private String icon;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class MainMetrics {
        private Double temp;

        @JsonProperty("feels_like")
        private Double feelsLike;

        @JsonProperty("temp_min")
        private Double tempMin;

        @JsonProperty("temp_max")
        private Double tempMax;

        private Integer humidity;
        private Integer pressure;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class WindMetrics {
        private Double speed; // Metric: meters/second
        private Integer deg;   // Direction in degrees
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SysInfo {
        private String country;
    }
}
