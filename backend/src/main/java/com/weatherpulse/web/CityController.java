package com.weatherpulse.web;

import com.weatherpulse.entity.City;
import com.weatherpulse.repository.CityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public REST Controller providing access to active tracked cities.
 * Consumed by the React frontend to populate city selection dropdowns.
 */
@RestController
@RequestMapping("/api/cities")
@RequiredArgsConstructor
@Slf4j
public class CityController {

    private final CityRepository cityRepository;

    @GetMapping
    public ResponseEntity<List<City>> getTrackedCities() {
        log.debug("GET /api/cities requested");
        List<City> cities = cityRepository.findByIsActiveTrueOrderByNameAsc();
        return ResponseEntity.ok(cities);
    }
}
