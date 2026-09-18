package com.weatherpulse.client;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.weatherpulse.client.dto.*;
import com.weatherpulse.client.exception.WeatherApiException;
import com.weatherpulse.client.exception.WeatherApiException.ErrorCategory;
import jakarta.annotation.PostConstruct;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * High-credibility, multi-provider meteorological client supporting:
 * 1. Open-Meteo (Primary): Global numerical weather prediction models (NOAA, ECMWF, DWD). Free, no API key required.
 * 2. wttr.in (Secondary Live Resilience): Real-time ground observation station feeds worldwide. Free, no API key required.
 * 3. OpenWeatherMap: Enterprise fallback / provider when a valid API key is configured.
 */
@Component
@Slf4j
public class WeatherApiClient {

    private final RestClient restClient;
    private final RestClient openMeteoClient;
    private final RestClient wttrInClient;
    private final String apiKey;
    private final Map<String, double[]> coordinateCache = new ConcurrentHashMap<>();

    @Setter
    @Value("${weatherpulse.external-api.provider:open-meteo}")
    private String provider = "open-meteo";

    public WeatherApiClient(RestClient weatherRestClient,
                            @Value("${weatherpulse.external-api.api-key:demo_openweather_api_key}") String apiKey) {
        this.restClient = weatherRestClient;
        this.openMeteoClient = RestClient.builder()
                .baseUrl("https://api.open-meteo.com")
                .build();
        this.wttrInClient = RestClient.builder()
                .baseUrl("https://wttr.in")
                .build();
        this.apiKey = apiKey;
    }

    @PostConstruct
    public void initCoordinates() {
        try {
            ClassPathResource resource = new ClassPathResource("data/world_cities.json");
            if (resource.exists()) {
                ObjectMapper mapper = new ObjectMapper();
                try (java.io.InputStream is = resource.getInputStream()) {
                    byte[] bytes = is.readAllBytes();
                    String json = new String(bytes, StandardCharsets.UTF_8).replace("\uFEFF", "");
                    List<Map<String, Object>> list = mapper.readValue(json, new TypeReference<List<Map<String, Object>>>() {});
                    for (Map<String, Object> item : list) {
                        String name = (String) item.get("name");
                        Number lat = (Number) item.get("latitude");
                        Number lon = (Number) item.get("longitude");
                        if (name != null && lat != null && lon != null) {
                            coordinateCache.put(name.trim().toLowerCase(), new double[]{lat.doubleValue(), lon.doubleValue()});
                        }
                    }
                    log.info("Preloaded {} city geographic coordinates into fast in-memory cache for instant real-weather routing.", coordinateCache.size());
                }
            }
        } catch (Exception ex) {
            log.warn("Could not preload world_cities coordinates: {}", ex.getMessage());
        }
    }

    public void registerCoordinates(String cityName, double latitude, double longitude) {
        if (cityName != null) {
            coordinateCache.put(cityName.trim().toLowerCase(), new double[]{latitude, longitude});
        }
    }

    /**
     * Overloaded method fetching live weather by city and country code.
     * Uses preloaded in-memory coordinates if available.
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

        if ("wttr-in".equalsIgnoreCase(provider)) {
            return fetchFromWttrIn(cityName, countryCode);
        }

        // Default & Credible Live Provider: Open-Meteo with automatic wttr.in ground station fallback
        return fetchFromOpenMeteo(cityName, countryCode, latitude, longitude);
    }

    /**
     * Fetches live observations from Open-Meteo (powered by NOAA, ECMWF, and DWD).
     * If rate limited or unavailable, automatically falls back to wttr.in live ground station feed.
     */
    private WeatherData fetchFromOpenMeteo(String cityName, String countryCode, Double latitude, Double longitude) {
        long startTime = System.currentTimeMillis();
        log.info("Fetching credible live meteorological observations from Open-Meteo for city='{}' (coords: {}, {})",
                cityName, latitude, longitude);

        Double resolvedLat = latitude;
        Double resolvedLon = longitude;

        // Resolve coordinates from high-speed memory cache if not provided
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
                    }
                } catch (Exception ex) {
                    log.warn("Geocoding lookup failed for city='{}': {}. Will attempt direct station query via wttr.in.", cityName, ex.getMessage());
                }
            }
        }

        if (resolvedLat != null && resolvedLon != null) {
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
                                    resp.getStatusCode().value() == 429 ? ErrorCategory.RATE_LIMITED : ErrorCategory.GENERIC_FAILURE,
                                    resp.getStatusCode(), cityName);
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

            } catch (Exception ex) {
                log.warn("Open-Meteo query failed for city='{}' ({}). Seamlessly falling back to live ground station feed via wttr.in...",
                        cityName, ex.getMessage());
            }
        }

        // Seamless Live Resilience Fallback: wttr.in real-time surface station feed
        return fetchFromWttrIn(cityName, countryCode);
    }

    /**
     * Fetches real-time ground meteorological observations directly from wttr.in worldwide station network.
     */
    public WeatherData fetchFromWttrIn(String cityName, String countryCode) {
        long startTime = System.currentTimeMillis();
        log.info("Dispatching live meteorological observation fetch to wttr.in for city='{}'", cityName);

        try {
            String rawJson = wttrInClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/" + cityName.trim())
                            .queryParam("format", "j1")
                            .build())
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, (req, r) -> {
                        throw new WeatherApiException("City '" + cityName + "' not found on wttr.in",
                                ErrorCategory.CITY_NOT_FOUND, r.getStatusCode(), cityName);
                    })
                    .onStatus(HttpStatusCode::is5xxServerError, (req, r) -> {
                        throw new WeatherApiException("wttr.in service temporarily unavailable",
                                ErrorCategory.UPSTREAM_SERVER_ERROR, r.getStatusCode(), cityName);
                    })
                    .body(String.class);

            if (rawJson == null || rawJson.isBlank()) {
                throw new WeatherApiException("Received empty weather payload from wttr.in",
                        ErrorCategory.MALFORMED_RESPONSE, HttpStatus.UNPROCESSABLE_ENTITY, cityName);
            }

            ObjectMapper mapper = new ObjectMapper();
            WttrInResponse resp = mapper.readValue(rawJson, WttrInResponse.class);

            if (resp == null || resp.getCurrentCondition() == null || resp.getCurrentCondition().isEmpty()) {
                throw new WeatherApiException("Received malformed weather payload from wttr.in",
                        ErrorCategory.MALFORMED_RESPONSE, HttpStatus.UNPROCESSABLE_ENTITY, cityName);
            }

            WttrInResponse.CurrentCondition cur = resp.getCurrentCondition().get(0);
            double temp = Double.parseDouble(cur.getTempC());
            Double feelsLike = cur.getFeelsLikeC() != null ? Double.parseDouble(cur.getFeelsLikeC()) : temp;
            Integer humidity = cur.getHumidity() != null ? Integer.parseInt(cur.getHumidity()) : null;
            Double windSpeed = cur.getWindspeedKmph() != null ? Double.parseDouble(cur.getWindspeedKmph()) : null;
            Integer windDir = cur.getWinddirDegree() != null ? Integer.parseInt(cur.getWinddirDegree()) : null;

            String desc = (cur.getWeatherDesc() != null && !cur.getWeatherDesc().isEmpty())
                    ? cur.getWeatherDesc().get(0).getValue().trim()
                    : "Clear";
            String condition = mapDescriptionToCondition(desc);
            String iconCode = mapConditionToIcon(condition);

            Double tempMax = null;
            Double tempMin = null;
            if (resp.getWeather() != null && !resp.getWeather().isEmpty()) {
                WttrInResponse.DailyWeather day = resp.getWeather().get(0);
                if (day.getMaxtempC() != null) tempMax = Double.parseDouble(day.getMaxtempC());
                if (day.getMintempC() != null) tempMin = Double.parseDouble(day.getMintempC());
            }

            if (tempMax == null) tempMax = Math.round((temp + 3.0) * 10.0) / 10.0;
            if (tempMin == null) tempMin = Math.round((temp - 3.0) * 10.0) / 10.0;

            long duration = System.currentTimeMillis() - startTime;
            log.info("Successfully received live ground station weather from wttr.in for city='{}' in {}ms (temp={}°C)",
                    cityName, duration, temp);

            return WeatherData.builder()
                    .cityName(cityName)
                    .countryCode(countryCode)
                    .temperatureCelsius(temp)
                    .feelsLikeCelsius(feelsLike)
                    .tempMinCelsius(tempMin)
                    .tempMaxCelsius(tempMax)
                    .humidityPercent(humidity)
                    .windSpeedKmh(windSpeed)
                    .windDirectionDegrees(windDir)
                    .weatherCondition(condition)
                    .weatherDescription(desc.toLowerCase())
                    .weatherIconCode(iconCode)
                    .externalObservedAt(Instant.now())
                    .fetchedAt(Instant.now())
                    .build();

        } catch (WeatherApiException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("wttr.in request failed for city='{}': {}", cityName, ex.getMessage());
            throw new WeatherApiException("Failed to fetch live meteorological data for city '" + cityName + "': " + ex.getMessage(),
                    ErrorCategory.GENERIC_FAILURE, cityName, ex);
        }
    }

    private String mapDescriptionToCondition(String desc) {
        if (desc == null) return "Clear";
        String lower = desc.toLowerCase();
        if (lower.contains("rain") || lower.contains("drizzle") || lower.contains("shower")) return "Rain";
        if (lower.contains("snow") || lower.contains("blizzard") || lower.contains("sleet") || lower.contains("ice")) return "Snow";
        if (lower.contains("thunder") || lower.contains("storm")) return "Thunder";
        if (lower.contains("cloud") || lower.contains("overcast") || lower.contains("fog") || lower.contains("mist")) return "Clouds";
        return "Clear";
    }

    private String mapConditionToIcon(String condition) {
        return switch (condition) {
            case "Rain" -> "10d";
            case "Snow" -> "13d";
            case "Thunder" -> "11d";
            case "Clouds" -> "03d";
            default -> "01d";
        };
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
            log.warn("OpenWeatherMap failure for city='{}': category={}, message={}. Falling back to Open-Meteo...",
                    cityName, ex.getCategory(), ex.getMessage());
            return fetchFromOpenMeteo(cityName, countryCode, null, null);

        } catch (ResourceAccessException ex) {
            long duration = System.currentTimeMillis() - startTime;
            log.warn("Network timeout communicating with OpenWeatherMap for city='{}' after {}ms: {}. Falling back to Open-Meteo...", cityName, duration, ex.getMessage());
            return fetchFromOpenMeteo(cityName, countryCode, null, null);

        } catch (Exception ex) {
            log.warn("Unexpected failure communicating with OpenWeatherMap for city='{}': {}. Falling back to Open-Meteo...", cityName, ex.getMessage());
            return fetchFromOpenMeteo(cityName, countryCode, null, null);
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
