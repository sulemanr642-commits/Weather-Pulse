package com.weatherpulse.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.weatherpulse.client.WeatherApiClient;
import com.weatherpulse.client.dto.WeatherData;
import com.weatherpulse.entity.City;
import com.weatherpulse.repository.CityRepository;
import com.weatherpulse.web.dto.CreateCityRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc // Filters enabled by default
@TestPropertySource(properties = {
        "weatherpulse.scheduler.enabled=false"
})
class AdminSecurityIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private WeatherApiClient weatherApiClient;

    @Test
    @DisplayName("Public Endpoint: GET /api/cities requires NO authentication (200 OK)")
    void testPublicGetCities_PermitAll() throws Exception {
        mockMvc.perform(get("/api/cities").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Public Endpoint: GET /api/weather/{city} requires NO authentication (200 OK)")
    void testPublicGetWeather_PermitAll() throws Exception {
        WeatherData mockData = WeatherData.builder()
                .cityName("Tokyo")
                .countryCode("JP")
                .temperatureCelsius(20.0)
                .feelsLikeCelsius(19.5)
                .tempMinCelsius(18.0)
                .tempMaxCelsius(22.0)
                .humidityPercent(50)
                .windSpeedKmh(10.0)
                .windDirectionDegrees(180)
                .weatherCondition("Clear")
                .weatherDescription("Clear sky")
                .weatherIconCode("01d")
                .externalObservedAt(Instant.now())
                .fetchedAt(Instant.now())
                .build();

        when(weatherApiClient.fetchCurrentWeather("Tokyo", "JP")).thenReturn(mockData);

        mockMvc.perform(get("/api/weather/Tokyo").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Security: POST /api/admin/cities without Authorization header returns 401 Unauthorized")
    void testAddCity_MissingToken_Returns401() throws Exception {
        CreateCityRequest request = new CreateCityRequest(
                "Zurich", "CH", new BigDecimal("47.3769"), new BigDecimal("8.5417")
        );

        mockMvc.perform(post("/api/admin/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Full Authentication Required"));
    }

    @Test
    @DisplayName("Security: POST /api/admin/cities with tampered/invalid token returns 401 Unauthorized")
    void testAddCity_InvalidToken_Returns401() throws Exception {
        CreateCityRequest request = new CreateCityRequest(
                "Zurich", "CH", new BigDecimal("47.3769"), new BigDecimal("8.5417")
        );

        mockMvc.perform(post("/api/admin/cities")
                        .header("Authorization", "Bearer eyJhbGciOiJIUzI1NiJ9.invalid.signature")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").value("Full Authentication Required"));
    }

    @Test
    @DisplayName("Security: POST /api/admin/cities with non-admin role returns 403 Forbidden")
    void testAddCity_NonAdminRole_Returns403() throws Exception {
        String userToken = jwtTokenProvider.generateToken("regularUser", "ROLE_USER");

        CreateCityRequest request = new CreateCityRequest(
                "Zurich", "CH", new BigDecimal("47.3769"), new BigDecimal("8.5417")
        );

        mockMvc.perform(post("/api/admin/cities")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").value("Forbidden"));
    }

    @Test
    @DisplayName("Security: POST /api/admin/cities with valid ROLE_ADMIN token succeeds (201 Created)")
    void testAddCity_ValidAdminToken_Returns201() throws Exception {
        String adminToken = jwtTokenProvider.generateToken("admin", "ROLE_ADMIN");

        String uniqueCityName = "TestZurich-" + System.currentTimeMillis();
        CreateCityRequest request = new CreateCityRequest(
                uniqueCityName, "CH", new BigDecimal("47.3769"), new BigDecimal("8.5417")
        );

        mockMvc.perform(post("/api/admin/cities")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value(uniqueCityName))
                .andExpect(jsonPath("$.countryCode").value("CH"));
    }

    @Test
    @DisplayName("Security: DELETE /api/admin/cities/{id} without token returns 401 Unauthorized")
    void testDeleteCity_MissingToken_Returns401() throws Exception {
        mockMvc.perform(delete("/api/admin/cities/1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401));
    }
}
