package com.weatherpulse.client;

import com.weatherpulse.client.dto.OpenWeatherResponse;
import com.weatherpulse.client.dto.WeatherData;
import com.weatherpulse.client.exception.WeatherApiException;
import com.weatherpulse.client.exception.WeatherApiException.ErrorCategory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Instant;

/**
 * Isolated HTTP client component responsible solely for communicating with the
 * OpenWeatherMap REST API, mapping raw responses, and handling external failures.
 */
@Component
@Slf4j
public class WeatherApiClient {

    private final RestClient restClient;
    private final String apiKey;

    public WeatherApiClient(RestClient weatherRestClient,
                            @Value("${weatherpulse.external-api.api-key}") String apiKey) {
        this.restClient = weatherRestClient;
        this.apiKey = apiKey;
    }

    /**
     * Fetches current meteorological observations for a tracked city.
     *
     * @param cityName    Name of the city (e.g., "London", "Tokyo")
     * @param countryCode Optional 2-letter ISO country code (e.g., "GB", "JP")
     * @return Standardized WeatherData domain DTO
     * @throws WeatherApiException if the API call fails, times out, or returns a non-200 status
     */
    public WeatherData fetchCurrentWeather(String cityName, String countryCode) {
        if (cityName == null || cityName.isBlank()) {
            throw new IllegalArgumentException("City name must not be blank");
        }

        String queryParam = (countryCode != null && !countryCode.isBlank())
                ? cityName.trim() + "," + countryCode.trim()
                : cityName.trim();

        long startTime = System.currentTimeMillis();
        log.info("Dispatching external weather fetch for city='{}' (query='{}')", cityName, queryParam);

        try {
            OpenWeatherResponse response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/weather")
                            .queryParam("q", queryParam)
                            .queryParam("appid", apiKey)
                            .queryParam("units", "metric")
                            .build())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, resp) -> {
                        HttpStatusCode status = resp.getStatusCode();
                        if (status == HttpStatus.NOT_FOUND) {
                            throw new WeatherApiException(
                                    "City '" + cityName + "' was not found by upstream weather provider",
                                    ErrorCategory.CITY_NOT_FOUND, status, cityName);
                        } else if (status == HttpStatus.UNAUTHORIZED) {
                            throw new WeatherApiException(
                                    "Upstream weather provider rejected authentication (invalid or missing API key)",
                                    ErrorCategory.UNAUTHORIZED, status, cityName);
                        } else if (status.value() == 429) {
                            throw new WeatherApiException(
                                    "Upstream weather API rate limit exceeded",
                                    ErrorCategory.RATE_LIMITED, status, cityName);
                        } else {
                            throw new WeatherApiException(
                                    "Upstream client error: HTTP " + status.value(),
                                    ErrorCategory.GENERIC_FAILURE, status, cityName);
                        }
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                        throw new WeatherApiException(
                                "Upstream weather provider outage: HTTP " + resp.getStatusCode().value(),
                                ErrorCategory.UPSTREAM_SERVER_ERROR, resp.getStatusCode(), cityName);
                    })
                    .body(OpenWeatherResponse.class);

            long duration = System.currentTimeMillis() - startTime;
            log.info("Successfully received weather data for city='{}' in {}ms", cityName, duration);

            return mapToWeatherData(response, cityName, countryCode);

        } catch (WeatherApiException ex) {
            // Already structured, rethrow directly
            log.warn("External weather API failure for city='{}': category={}, message={}",
                    cityName, ex.getCategory(), ex.getMessage());
            throw ex;

        } catch (ResourceAccessException ex) {
            // Network failure, connect timeout, or socket read timeout
            long duration = System.currentTimeMillis() - startTime;
            log.error("Network I/O timeout or connection failure for city='{}' after {}ms: {}",
                    cityName, duration, ex.getMessage());
            throw new WeatherApiException(
                    "Connection or read timeout communicating with upstream weather provider",
                    ErrorCategory.TIMEOUT, cityName, ex);

        } catch (RestClientException ex) {
            log.error("Unexpected error executing REST call for city='{}': {}", cityName, ex.getMessage());
            throw new WeatherApiException(
                    "Unexpected failure communicating with weather provider: " + ex.getMessage(),
                    ErrorCategory.GENERIC_FAILURE, cityName, ex);
        }
    }

    /**
     * Transforms the vendor OpenWeatherMap wire response into our domain WeatherData DTO.
     */
    private WeatherData mapToWeatherData(OpenWeatherResponse raw, String requestedCity, String requestedCountry) {
        if (raw == null || raw.getMain() == null) {
            throw new WeatherApiException(
                    "Received malformed or empty weather payload from provider",
                    ErrorCategory.MALFORMED_RESPONSE, HttpStatus.UNPROCESSABLE_ENTITY, requestedCity);
        }

        OpenWeatherResponse.WeatherDescription desc = (raw.getWeather() != null && !raw.getWeather().isEmpty())
                ? raw.getWeather().get(0)
                : null;

        // Convert wind speed from m/s to km/h (1 m/s = 3.6 km/h)
        Double windSpeedKmh = null;
        if (raw.getWind() != null && raw.getWind().getSpeed() != null) {
            windSpeedKmh = Math.round(raw.getWind().getSpeed() * 3.6 * 10.0) / 10.0;
        }

        String resolvedCityName = (raw.getName() != null && !raw.getName().isBlank())
                ? raw.getName()
                : requestedCity;

        String resolvedCountry = (raw.getSys() != null && raw.getSys().getCountry() != null)
                ? raw.getSys().getCountry()
                : requestedCountry;

        Instant observedAt = raw.getDt() > 0
                ? Instant.ofEpochSecond(raw.getDt())
                : Instant.now();

        return WeatherData.builder()
                .cityName(resolvedCityName)
                .countryCode(resolvedCountry)
                .temperatureCelsius(raw.getMain().getTemp())
                .feelsLikeCelsius(raw.getMain().getFeelsLike())
                .tempMinCelsius(raw.getMain().getTempMin())
                .tempMaxCelsius(raw.getMain().getTempMax())
                .humidityPercent(raw.getMain().getHumidity())
                .windSpeedKmh(windSpeedKmh)
                .windDirectionDegrees(raw.getWind() != null ? raw.getWind().getDeg() : null)
                .weatherCondition(desc != null ? desc.getMain() : "Unknown")
                .weatherDescription(desc != null ? desc.getDescription() : "Unknown")
                .weatherIconCode(desc != null ? desc.getIcon() : "01d")
                .externalObservedAt(observedAt)
                .fetchedAt(Instant.now())
                .build();
    }
}
