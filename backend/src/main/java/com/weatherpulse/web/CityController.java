package com.weatherpulse.web;

import com.weatherpulse.entity.City;
import com.weatherpulse.repository.CityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public REST Controller providing high-capacity, scalable access to active tracked cities.
 * Supports unpaginated list mode (for dropdowns/initial state) and paginated/search mode
 * (for high-volume search combobox and virtualized lists).
 */
@RestController
@RequestMapping("/api/cities")
@RequiredArgsConstructor
@Slf4j
public class CityController {

    private final CityRepository cityRepository;

    @GetMapping
    public ResponseEntity<?> getTrackedCities(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {

        log.debug("GET /api/cities requested: search='{}', page={}, size={}", search, page, size);

        // If pagination parameters are supplied, return Page<City>
        if (page != null || size != null) {
            int pageIndex = (page != null && page >= 0) ? page : 0;
            int pageSize = (size != null && size > 0 && size <= 200) ? size : 50;
            Pageable pageable = PageRequest.of(pageIndex, pageSize);

            Page<City> pagedResult;
            if (search != null && !search.isBlank()) {
                pagedResult = cityRepository.findByIsActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(search.trim(), pageable);
            } else {
                pagedResult = cityRepository.findByIsActiveTrueOrderByNameAsc(pageable);
            }
            return ResponseEntity.ok(pagedResult);
        }

        // Backward-compatible unpaginated list (with optional search filter)
        List<City> cities;
        if (search != null && !search.isBlank()) {
            cities = cityRepository.findByIsActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(search.trim());
        } else {
            cities = cityRepository.findByIsActiveTrueOrderByNameAsc();
        }
        return ResponseEntity.ok(cities);
    }
}
