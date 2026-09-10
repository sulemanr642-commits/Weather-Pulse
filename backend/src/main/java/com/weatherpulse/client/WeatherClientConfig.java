package com.weatherpulse.client;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.time.Duration;

/**
 * Configuration for the external OpenWeatherMap HTTP client.
 * Configures RestClient with bounded connection and read timeouts to prevent thread starvation.
 */
@Configuration
public class WeatherClientConfig {

    @Value("${weatherpulse.external-api.base-url:https://api.openweathermap.org/data/2.5}")
    private String baseUrl;

    @Value("${weatherpulse.external-api.connect-timeout-ms:3000}")
    private int connectTimeoutMs;

    @Value("${weatherpulse.external-api.read-timeout-ms:5000}")
    private int readTimeoutMs;

    @Bean
    public RestClient weatherRestClient(RestClient.Builder builder) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        requestFactory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        return builder
                .baseUrl(baseUrl)
                .requestFactory(requestFactory)
                .build();
    }
}
