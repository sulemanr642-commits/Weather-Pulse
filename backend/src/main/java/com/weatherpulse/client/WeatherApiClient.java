package com.weatherpulse.client;

import com.weatherpulse.client.dto.OpenMeteoGeocodingResponse;
import com.weatherpulse.client.dto.OpenMeteoResponse;
import com.weatherpulse.client.dto.OpenWeatherResponse;
import com.weatherpulse.client.dto.WeatherData;
import com.weatherpulse.client.exception.WeatherApiException;
import com.weatherpulse.client.exception.WeatherApiException.ErrorCategory;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.time.Instant;

/**
 * Credible meteorological HTTP client supporting:
 * 1. Open-Meteo (Default): Global weather models (NOAA, ECMWF, DWD), free, real-time, no API key required.
 * 2. OpenWeatherMap: Enterprise fallback / provider when an API key is provided.
 */
@Component
@Slf4j
public class WeatherApiClient {

    private final RestClient restClient;
    private final RestClient openMeteoClient;
    private final String apiKey;
    private final java.util.Map<String, double[]> coordinateCache = new java.util.concurrent.ConcurrentHashMap<>();

    @Setter
    @Value("${weatherpulse.external-api.provider:open-meteo}")
    private String provider = "open-meteo";

    public WeatherApiClient(RestClient weatherRestClient,
                            @Value("${weatherpulse.external-api.api-key:demo_openweather_api_key}") String apiKey) {
        this.restClient = weatherRestClient;
        this.openMeteoClient = RestClient.builder()
                .baseUrl("https://api.open-meteo.com")
                .build();
        this.apiKey = apiKey;
    }

    /**
     * Overloaded method fetching weather by city and country code.
     */
    public WeatherData fetchCurrentWeather(String cityName, String countryCode) {
        return fetchCurrentWeather(cityName, countryCode, null, null);
    }

    /**
     * Primary entry point fetching credible live observations using city coordinates when available.
     */
    public WeatherData fetchCurrentWeather(String cityName, String countryCode, Double latitude, Double longitude) {
        if (cityName == null || cityName.isBlank()) {
            throw new IllegalArgumentException("City name must not be blank");
        }

        // If provider is explicitly set to open-weather-map and key is valid, use OpenWeatherMap
        if ("open-weather-map".equalsIgnoreCase(provider)) {
            return fetchFromOpenWeatherMap(cityName, countryCode);
        }

        // Default & Credible Live Provider: Open-Meteo
        return fetchFromOpenMeteo(cityName, countryCode, latitude, longitude);
    }

    /**
     * Fetches live observations from Open-Meteo (powered by NOAA, ECMWF, and German Weather Service DWD).
     */
    private WeatherData fetchFromOpenMeteo(String cityName, String countryCode, Double latitude, Double longitude) {
        long startTime = System.currentTimeMillis();
        log.info("Fetching credible live meteorological observations from Open-Meteo for city='{}' (coords: {}, {})",
                cityName, latitude, longitude);

        Double resolvedLat = latitude;
        Double resolvedLon = longitude;

        // Resolve coordinates via geocoding if not provided
        if (resolvedLat == null || resolvedLon == null) {
            String cacheKey = cityName.trim().toLowerCase();
            double[] cachedCoords = coordinateCache.get(cacheKey);
            if (cachedCoords != null) {
                resolvedLat = cachedCoords[0];
                resolvedLon = cachedCoords[1];
            } else {
                try {
                    RestClient geocodingClient = RestClient.builder().baseUrl("https://geocoding-api.open-meteo.com").build();
                    OpenMeteoGeocodingResponse geoResp = geocodingClient.get()
                            .uri(uriBuilder -> uriBuilder
                                    .path("/v1/search")
                                    .queryParam("name", cityName.trim())
                                    .queryParam("count", 1)
                                    .build())
                            .accept(MediaType.APPLICATION_JSON)
                            .retrieve()
                            .body(OpenMeteoGeocodingResponse.class);

                    if (geoResp != null && geoResp.getResults() != null && !geoResp.getResults().isEmpty()) {
                        resolvedLat = geoResp.getResults().get(0).getLatitude();
                        resolvedLon = geoResp.getResults().get(0).getLongitude();
                        coordinateCache.put(cacheKey, new double[]{resolvedLat, resolvedLon});
                    } else {
                        throw new WeatherApiException(
                                "City '" + cityName + "' was not found by upstream weather provider",
                                ErrorCategory.CITY_NOT_FOUND, HttpStatus.NOT_FOUND, cityName);
                    }
                } catch (WeatherApiException ex) {
                    throw ex;
                } catch (Exception ex) {
                    log.error("Geocoding lookup failed for city='{}': {}", cityName, ex.getMessage());
                    throw new WeatherApiException(
                            "Geocoding lookup failed for city '" + cityName + "': " + ex.getMessage(),
                            ErrorCategory.GENERIC_FAILURE, cityName, ex);
                }
            }
        }

        try {
            final double finalLat = resolvedLat;
            final double finalLon = resolvedLon;

            OpenMeteoResponse response = openMeteoClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/v1/forecast")
                            .queryParam("latitude", finalLat)
                            .queryParam("longitude", finalLon)
                            .queryParam("current", "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,is_day")
                            .queryParam("daily", "weather_code,temperature_2m_max,temperature_2m_min")
                            .queryParam("timezone", "auto")
                            .build())
                    .accept(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, resp) -> {
                        throw new WeatherApiException(
                                "Open-Meteo client error: HTTP " + resp.getStatusCode().value(),
                                ErrorCategory.GENERIC_FAILURE, resp.getStatusCode(), cityName);
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, resp) -> {
                        throw new WeatherApiException(
                                "Open-Meteo server outage: HTTP " + resp.getStatusCode().value(),
                                ErrorCategory.UPSTREAM_SERVER_ERROR, resp.getStatusCode(), cityName);
                    })
                    .body(OpenMeteoResponse.class);

            long duration = System.currentTimeMillis() - startTime;
            log.info("Successfully received live weather data from Open-Meteo for city='{}' in {}ms", cityName, duration);

            return mapOpenMeteoToWeatherData(response, cityName, countryCode);

        } catch (WeatherApiException ex) {
            throw ex;
        } catch (ResourceAccessException ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Network timeout communicating with Open-Meteo for city='{}' after {}ms: {}", cityName, duration, ex.getMessage());
            throw new WeatherApiException(
                    "Connection or read timeout communicating with upstream weather provider",
                    ErrorCategory.TIMEOUT, cityName, ex);
        } catch (RestClientException ex) {
            log.error("REST failure communicating with Open-Meteo for city='{}': {}", cityName, ex.getMessage());
            throw new WeatherApiException(
                    "Unexpected failure communicating with weather provider: " + ex.getMessage(),
                    ErrorCategory.GENERIC_FAILURE, cityName, ex);
        }
    }

    private WeatherData mapOpenMeteoToWeatherData(OpenMeteoResponse raw, String cityName, String countryCode) {
        if (raw == null || raw.getCurrent() == null) {
            throw new WeatherApiException(
                    "Received malformed or empty weather payload from Open-Meteo",
                    ErrorCategory.MALFORMED_RESPONSE, HttpStatus.UNPROCESSABLE_ENTITY, cityName);
        }

        OpenMeteoResponse.CurrentWeather cur = raw.getCurrent();
        int wmoCode = cur.getWeatherCode() != null ? cur.getWeatherCode() : 0;
        boolean isDay = cur.getIsDay() == null || cur.getIsDay() == 1;

        WmoMapping mapping = mapWmoCode(wmoCode, isDay);

        Double tempMax = null;
        Double tempMin = null;
        if (raw.getDaily() != null) {
            if (raw.getDaily().getTemperature2mMax() != null && !raw.getDaily().getTemperature2mMax().isEmpty()) {
                tempMax = raw.getDaily().getTemperature2mMax().get(0);
            }
            if (raw.getDaily().getTemperature2mMin() != null && !raw.getDaily().getTemperature2mMin().isEmpty()) {
                tempMin = raw.getDaily().getTemperature2mMin().get(0);
            }
        }

        if (tempMax == null && cur.getTemperature2m() != null) {
            tempMax = Math.round((cur.getTemperature2m() + 3.0) * 10.0) / 10.0;
        }
        if (tempMin == null && cur.getTemperature2m() != null) {
            tempMin = Math.round((cur.getTemperature2m() - 3.0) * 10.0) / 10.0;
        }

        return WeatherData.builder()
                .cityName(cityName)
                .countryCode(countryCode)
                .temperatureCelsius(cur.getTemperature2m())
                .feelsLikeCelsius(cur.getApparentTemperature() != null ? cur.getApparentTemperature() : cur.getTemperature2m())
                .tempMinCelsius(tempMin)
                .tempMaxCelsius(tempMax)
                .humidityPercent(cur.getRelativeHumidity2m())
                .windSpeedKmh(cur.getWindSpeed10m())
                .windDirectionDegrees(cur.getWindDirection10m())
                .weatherCondition(mapping.condition)
                .weatherDescription(mapping.description)
                .weatherIconCode(mapping.iconCode)
                .externalObservedAt(Instant.now())
                .fetchedAt(Instant.now())
                .build();
    }

    private record WmoMapping(String condition, String description, String iconCode) {}

    private WmoMapping mapWmoCode(int code, boolean isDay) {
        String suffix = isDay ? "d" : "n";
        return switch (code) {
            case 0 -> new WmoMapping("Clear", "clear sky", "01" + suffix);
            case 1 -> new WmoMapping("Clear", "mainly clear", "01" + suffix);
            case 2 -> new WmoMapping("Clouds", "partly cloudy", "02" + suffix);
            case 3 -> new WmoMapping("Clouds", "overcast", "04" + suffix);
            case 45, 48 -> new WmoMapping("Clouds", "foggy", "50" + suffix);
            case 51, 53, 55 -> new WmoMapping("Rain", "drizzle", "09" + suffix);
            case 56, 57 -> new WmoMapping("Rain", "freezing drizzle", "09" + suffix);
            case 61, 63 -> new WmoMapping("Rain", "slight to moderate rain", "10" + suffix);
            case 65 -> new WmoMapping("Rain", "heavy rain", "10" + suffix);
            case 66, 67 -> new WmoMapping("Rain", "freezing rain", "13" + suffix);
            case 71, 73 -> new WmoMapping("Snow", "slight to moderate snow", "13" + suffix);
            case 75, 77 -> new WmoMapping("Snow", "heavy snow", "13" + suffix);
            case 80, 81, 82 -> new WmoMapping("Rain", "rain showers", "09" + suffix);
            case 85, 86 -> new WmoMapping("Snow", "snow showers", "13" + suffix);
            case 95 -> new WmoMapping("Thunder", "thunderstorm", "11" + suffix);
            case 96, 99 -> new WmoMapping("Thunder", "thunderstorm with hail", "11" + suffix);
            default -> new WmoMapping("Clear", "clear sky", "01" + suffix);
        };
    }

    /**
     * Communicates with OpenWeatherMap when specifically configured with an active key.
     */
    private WeatherData fetchFromOpenWeatherMap(String cityName, String countryCode) {
        String queryParam = (countryCode != null && !countryCode.isBlank())
                ? cityName.trim() + "," + countryCode.trim()
                : cityName.trim();

        long startTime = System.currentTimeMillis();
        log.info("Dispatching external weather fetch to OpenWeatherMap for city='{}' (query='{}')", cityName, queryParam);

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
            log.info("Successfully received weather data from OpenWeatherMap for city='{}' in {}ms", cityName, duration);

            return mapOpenWeatherToWeatherData(response, cityName, countryCode);

        } catch (WeatherApiException ex) {
            log.warn("OpenWeatherMap failure for city='{}': category={}, message={}",
                    cityName, ex.getCategory(), ex.getMessage());
            throw ex;

        } catch (ResourceAccessException ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Network timeout for city='{}' after {}ms: {}", cityName, duration, ex.getMessage());
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

    private WeatherData mapOpenWeatherToWeatherData(OpenWeatherResponse raw, String requestedCity, String requestedCountry) {
        if (raw == null || raw.getMain() == null) {
            throw new WeatherApiException(
                    "Received malformed or empty weather payload from provider",
                    ErrorCategory.MALFORMED_RESPONSE, HttpStatus.UNPROCESSABLE_ENTITY, requestedCity);
        }

        OpenWeatherResponse.WeatherDescription desc = (raw.getWeather() != null && !raw.getWeather().isEmpty())
                ? raw.getWeather().get(0)
                : null;

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
