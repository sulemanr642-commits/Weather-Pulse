package com.weatherpulse.web;

import com.weatherpulse.entity.City;
import com.weatherpulse.repository.CityRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CityController.class)
@AutoConfigureMockMvc(addFilters = false)
class CityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CityRepository cityRepository;

    @MockBean
    private com.weatherpulse.security.JwtTokenProvider jwtTokenProvider;

    @Test
    @DisplayName("GET /api/cities: Returns unpaginated list for backward compatibility")
    void testGetTrackedCities_Unpaginated() throws Exception {
        City tokyo = City.builder().id(1L).name("Tokyo").countryCode("JP").latitude(BigDecimal.valueOf(35.68)).longitude(BigDecimal.valueOf(139.69)).isActive(true).build();
        City london = City.builder().id(2L).name("London").countryCode("GB").latitude(BigDecimal.valueOf(51.51)).longitude(BigDecimal.valueOf(-0.13)).isActive(true).build();

        when(cityRepository.findByIsActiveTrueOrderByNameAsc()).thenReturn(List.of(london, tokyo));

        mockMvc.perform(get("/api/cities").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].name").value("London"))
                .andExpect(jsonPath("$[1].name").value("Tokyo"));

        verify(cityRepository).findByIsActiveTrueOrderByNameAsc();
    }

    @Test
    @DisplayName("GET /api/cities?search=lon: Filters cities by case-insensitive substring")
    void testGetTrackedCities_SearchFilter() throws Exception {
        City london = City.builder().id(2L).name("London").countryCode("GB").latitude(BigDecimal.valueOf(51.51)).longitude(BigDecimal.valueOf(-0.13)).isActive(true).build();

        when(cityRepository.findByIsActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc("lon")).thenReturn(List.of(london));

        mockMvc.perform(get("/api/cities?search=lon").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("London"));

        verify(cityRepository).findByIsActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc("lon");
    }

    @Test
    @DisplayName("GET /api/cities?page=0&size=10: Returns Page<City> with pagination slice and metadata")
    void testGetTrackedCities_Paginated() throws Exception {
        City tokyo = City.builder().id(1L).name("Tokyo").countryCode("JP").latitude(BigDecimal.valueOf(35.68)).longitude(BigDecimal.valueOf(139.69)).isActive(true).build();
        Page<City> page = new PageImpl<>(List.of(tokyo));

        when(cityRepository.findByIsActiveTrueOrderByNameAsc(any(Pageable.class))).thenReturn(page);

        mockMvc.perform(get("/api/cities?page=0&size=10").accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Tokyo"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(cityRepository).findByIsActiveTrueOrderByNameAsc(any(Pageable.class));
    }
}
