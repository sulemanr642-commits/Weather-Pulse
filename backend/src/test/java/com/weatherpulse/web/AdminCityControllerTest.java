package com.weatherpulse.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.weatherpulse.entity.City;
import com.weatherpulse.repository.CityRepository;
import com.weatherpulse.service.WeatherService;
import com.weatherpulse.web.dto.CreateCityRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminCityController.class)
@AutoConfigureMockMvc(addFilters = false)
class AdminCityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CityRepository cityRepository;

    @MockBean
    private WeatherService weatherService;

    @MockBean
    private com.weatherpulse.security.JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("POST /api/admin/cities: Creates new city and returns 201 Created")
    void testAddCity_Success() throws Exception {
        CreateCityRequest request = new CreateCityRequest(
                "Madrid",
                "ES",
                new BigDecimal("40.416775"),
                new BigDecimal("-3.703790")
        );

        City saved = City.builder()
                .id(10L)
                .name("Madrid")
                .countryCode("ES")
                .latitude(new BigDecimal("40.416775"))
                .longitude(new BigDecimal("-3.703790"))
                .isActive(true)
                .build();

        when(cityRepository.existsByNameIgnoreCase("Madrid")).thenReturn(false);
        when(cityRepository.save(any(City.class))).thenReturn(saved);

        mockMvc.perform(post("/api/admin/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.name").value("Madrid"))
                .andExpect(jsonPath("$.countryCode").value("ES"))
                .andExpect(jsonPath("$.isActive").value(true));

        verify(cityRepository).save(any(City.class));
    }

    @Test
    @DisplayName("POST /api/admin/cities: Returns 409 Conflict when city already exists")
    void testAddCity_DuplicateCityConflict() throws Exception {
        CreateCityRequest request = new CreateCityRequest(
                "Tokyo",
                "JP",
                new BigDecimal("35.68"),
                new BigDecimal("139.69")
        );

        when(cityRepository.existsByNameIgnoreCase("Tokyo")).thenReturn(true);

        mockMvc.perform(post("/api/admin/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.title").value("Conflict"))
                .andExpect(jsonPath("$.detail").value("City 'Tokyo' is already being tracked."));

        verify(cityRepository, never()).save(any());
    }

    @Test
    @DisplayName("POST /api/admin/cities: Returns 400 Bad Request on invalid coordinates")
    void testAddCity_InvalidCoordinates() throws Exception {
        CreateCityRequest request = new CreateCityRequest(
                "InvalidCity",
                "XX",
                new BigDecimal("95.000000"), // Latitude > 90.0
                new BigDecimal("-3.703790")
        );

        mockMvc.perform(post("/api/admin/cities")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @DisplayName("DELETE /api/admin/cities/{id}: Evicts Redis cache and deletes from DB, returning 204 No Content")
    void testRemoveCity_Success() throws Exception {
        City city = City.builder()
                .id(5L)
                .name("Sydney")
                .countryCode("AU")
                .build();

        when(cityRepository.findById(5L)).thenReturn(Optional.of(city));

        mockMvc.perform(delete("/api/admin/cities/5"))
                .andExpect(status().isNoContent());

        verify(weatherService).evictCityCache("Sydney");
        verify(cityRepository).delete(city);
    }

    @Test
    @DisplayName("DELETE /api/admin/cities/{id}: Returns 404 Not Found when ID does not exist")
    void testRemoveCity_NotFound() throws Exception {
        when(cityRepository.findById(999L)).thenReturn(Optional.empty());

        mockMvc.perform(delete("/api/admin/cities/999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        verify(cityRepository, never()).delete(any());
    }
}
