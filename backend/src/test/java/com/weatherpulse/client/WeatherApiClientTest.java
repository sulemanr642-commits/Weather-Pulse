package com.weatherpulse.client;

import com.weatherpulse.client.dto.WeatherData;
import com.weatherpulse.client.exception.WeatherApiException;
import com.weatherpulse.client.exception.WeatherApiException.ErrorCategory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

/**
 * Unit test for WeatherApiClient using MockRestServiceServer.
 * Verifies request formatting, JSON parsing, metric conversions (m/s to km/h),
 * and custom exception translation across all error categories without requiring
 * live network connectivity or real API credentials.
 */
class WeatherApiClientTest {

    private static final String BASE_URL = "https://api.openweathermap.org/data/2.5";
    private static final String API_KEY = "test_api_key_123";

    private WeatherApiClient weatherApiClient;
    private MockRestServiceServer server;

    private static final String SAMPLE_TOKYO_JSON = """
        {
          "coord": { "lon": 139.6503, "lat": 35.6762 },
          "weather": [
            {
              "id": 800,
              "main": "Clear",
              "description": "clear sky",
              "icon": "01d"
            }
          ],
          "base": "stations",
          "main": {
            "temp": 22.4,
            "feels_like": 22.1,
            "temp_min": 20.8,
            "temp_max": 24.0,
            "pressure": 1013,
            "humidity": 58
          },
          "visibility": 10000,
          "wind": {
            "speed": 3.5,
            "deg": 180
          },
          "clouds": { "all": 0 },
          "dt": 1726000000,
          "sys": {
            "country": "JP",
            "sunrise": 1725999000,
            "sunset": 1726045000
          },
          "timezone": 32400,
          "id": 1850147,
          "name": "Tokyo",
          "cod": 200
        }
        """;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder().baseUrl(BASE_URL);
        server = MockRestServiceServer.bindTo(builder).build();
        RestClient restClient = builder.build();
        weatherApiClient = new WeatherApiClient(restClient, API_KEY);
        weatherApiClient.setProvider("open-weather-map");
    }

    @Test
    @DisplayName("Success Case: Successfully fetches and maps Tokyo weather with m/s to km/h wind conversion")
    void testFetchCurrentWeatherSuccess() {
        server.expect(requestTo("https://api.openweathermap.org/data/2.5/weather?q=Tokyo,JP&appid=" + API_KEY + "&units=metric"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess(SAMPLE_TOKYO_JSON, MediaType.APPLICATION_JSON));

        WeatherData data = weatherApiClient.fetchCurrentWeather("Tokyo", "JP");

        assertThat(data).isNotNull();
        assertThat(data.getCityName()).isEqualTo("Tokyo");
        assertThat(data.getCountryCode()).isEqualTo("JP");
        assertThat(data.getTemperatureCelsius()).isEqualTo(22.4);
        assertThat(data.getFeelsLikeCelsius()).isEqualTo(22.1);
        assertThat(data.getTempMinCelsius()).isEqualTo(20.8);
        assertThat(data.getTempMaxCelsius()).isEqualTo(24.0);
        assertThat(data.getHumidityPercent()).isEqualTo(58);
        // Wind speed conversion verification: 3.5 m/s * 3.6 = 12.6 km/h
        assertThat(data.getWindSpeedKmh()).isEqualTo(12.6);
        assertThat(data.getWindDirectionDegrees()).isEqualTo(180);
        assertThat(data.getWeatherCondition()).isEqualTo("Clear");
        assertThat(data.getWeatherDescription()).isEqualTo("clear sky");
        assertThat(data.getWeatherIconCode()).isEqualTo("01d");
        assertThat(data.getExternalObservedAt().getEpochSecond()).isEqualTo(1726000000L);
        assertThat(data.getFetchedAt()).isNotNull();

        server.verify();
    }

    @Test
    @DisplayName("Error Case 404: Upstream City Not Found throws WeatherApiException(CITY_NOT_FOUND)")
    void testFetchWeatherCityNotFound() {
        server.expect(requestTo("https://api.openweathermap.org/data/2.5/weather?q=Atlantis&appid=" + API_KEY + "&units=metric"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.NOT_FOUND)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"cod\":\"404\",\"message\":\"city not found\"}"));

        assertThatThrownBy(() -> weatherApiClient.fetchCurrentWeather("Atlantis", null))
                .isInstanceOf(WeatherApiException.class)
                .hasMessageContaining("was not found by upstream weather provider")
                .satisfies(ex -> {
                    WeatherApiException apiEx = (WeatherApiException) ex;
                    assertThat(apiEx.getCategory()).isEqualTo(ErrorCategory.CITY_NOT_FOUND);
                    assertThat(apiEx.getHttpStatus()).isEqualTo(HttpStatus.NOT_FOUND);
                });

        server.verify();
    }

    @Test
    @DisplayName("Error Case 401: Invalid API Key throws WeatherApiException(UNAUTHORIZED)")
    void testFetchWeatherUnauthorized() {
        server.expect(requestTo("https://api.openweathermap.org/data/2.5/weather?q=London,GB&appid=" + API_KEY + "&units=metric"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.UNAUTHORIZED)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"cod\":401,\"message\":\"Invalid API key\"}"));

        assertThatThrownBy(() -> weatherApiClient.fetchCurrentWeather("London", "GB"))
                .isInstanceOf(WeatherApiException.class)
                .hasMessageContaining("rejected authentication")
                .satisfies(ex -> {
                    WeatherApiException apiEx = (WeatherApiException) ex;
                    assertThat(apiEx.getCategory()).isEqualTo(ErrorCategory.UNAUTHORIZED);
                });

        server.verify();
    }

    @Test
    @DisplayName("Error Case 429: Rate Limit Exceeded throws WeatherApiException(RATE_LIMITED)")
    void testFetchWeatherRateLimited() {
        server.expect(requestTo("https://api.openweathermap.org/data/2.5/weather?q=Paris,FR&appid=" + API_KEY + "&units=metric"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.TOO_MANY_REQUESTS)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"cod\":429,\"message\":\"Rate limit exceeded\"}"));

        assertThatThrownBy(() -> weatherApiClient.fetchCurrentWeather("Paris", "FR"))
                .isInstanceOf(WeatherApiException.class)
                .hasMessageContaining("rate limit exceeded")
                .satisfies(ex -> {
                    WeatherApiException apiEx = (WeatherApiException) ex;
                    assertThat(apiEx.getCategory()).isEqualTo(ErrorCategory.RATE_LIMITED);
                });

        server.verify();
    }

    @Test
    @DisplayName("Error Case 503: Provider Outage throws WeatherApiException(UPSTREAM_SERVER_ERROR)")
    void testFetchWeatherUpstreamOutage() {
        server.expect(requestTo("https://api.openweathermap.org/data/2.5/weather?q=Berlin,DE&appid=" + API_KEY + "&units=metric"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"message\":\"Service unavailable\"}"));

        assertThatThrownBy(() -> weatherApiClient.fetchCurrentWeather("Berlin", "DE"))
                .isInstanceOf(WeatherApiException.class)
                .hasMessageContaining("Upstream weather provider outage")
                .satisfies(ex -> {
                    WeatherApiException apiEx = (WeatherApiException) ex;
                    assertThat(apiEx.getCategory()).isEqualTo(ErrorCategory.UPSTREAM_SERVER_ERROR);
                });

        server.verify();
    }

    @Test
    @DisplayName("Error Case Malformed: Empty body throws WeatherApiException(MALFORMED_RESPONSE)")
    void testFetchWeatherMalformedPayload() {
        server.expect(requestTo("https://api.openweathermap.org/data/2.5/weather?q=Sydney,AU&appid=" + API_KEY + "&units=metric"))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("{\"cod\":200}", MediaType.APPLICATION_JSON)); // Missing "main"

        assertThatThrownBy(() -> weatherApiClient.fetchCurrentWeather("Sydney", "AU"))
                .isInstanceOf(WeatherApiException.class)
                .hasMessageContaining("malformed or empty weather payload")
                .satisfies(ex -> {
                    WeatherApiException apiEx = (WeatherApiException) ex;
                    assertThat(apiEx.getCategory()).isEqualTo(ErrorCategory.MALFORMED_RESPONSE);
                });

        server.verify();
    }
}
