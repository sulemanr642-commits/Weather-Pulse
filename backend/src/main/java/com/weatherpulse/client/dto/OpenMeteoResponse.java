package com.weatherpulse.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Maps live meteorological payload from the credible Open-Meteo API.
 * Sourced directly from NOAA, ECMWF, and DWD national weather services.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OpenMeteoResponse {

    private Double latitude;
    private Double longitude;
    private String timezone;

    @JsonProperty("current")
    private CurrentWeather current;

    @JsonProperty("daily")
    private DailyWeather daily;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CurrentWeather {
        private String time;

        @JsonProperty("temperature_2m")
        private Double temperature2m;

        @JsonProperty("relative_humidity_2m")
        private Integer relativeHumidity2m;

        @JsonProperty("apparent_temperature")
        private Double apparentTemperature;

        @JsonProperty("weather_code")
        private Integer weatherCode;

        @JsonProperty("wind_speed_10m")
        private Double windSpeed10m;

        @JsonProperty("wind_direction_10m")
        private Integer windDirection10m;

        @JsonProperty("is_day")
        private Integer isDay;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DailyWeather {
        private List<String> time;

        @JsonProperty("weather_code")
        private List<Integer> weatherCode;

        @JsonProperty("temperature_2m_max")
        private List<Double> temperature2mMax;

        @JsonProperty("temperature_2m_min")
        private List<Double> temperature2mMin;
    }
}
