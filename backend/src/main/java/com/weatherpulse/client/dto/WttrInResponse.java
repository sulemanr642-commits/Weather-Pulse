package com.weatherpulse.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Data Transfer Object mapping real-time ground meteorological observations from wttr.in.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class WttrInResponse {

    @JsonProperty("current_condition")
    private List<CurrentCondition> currentCondition;

    @JsonProperty("weather")
    private List<DailyWeather> weather;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CurrentCondition {
        @JsonProperty("temp_C")
        private String tempC;

        @JsonProperty("FeelsLikeC")
        private String feelsLikeC;

        @JsonProperty("humidity")
        private String humidity;

        @JsonProperty("windspeedKmph")
        private String windspeedKmph;

        @JsonProperty("winddirDegree")
        private String winddirDegree;

        @JsonProperty("weatherCode")
        private String weatherCode;

        @JsonProperty("weatherDesc")
        private List<ValueHolder> weatherDesc;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class DailyWeather {
        @JsonProperty("maxtempC")
        private String maxtempC;

        @JsonProperty("mintempC")
        private String mintempC;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ValueHolder {
        private String value;
    }
}
