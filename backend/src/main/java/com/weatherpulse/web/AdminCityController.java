package com.weatherpulse.web;

import com.weatherpulse.entity.City;
import com.weatherpulse.repository.CityRepository;
import com.weatherpulse.service.WeatherService;
import com.weatherpulse.service.exception.CityAlreadyExistsException;
import com.weatherpulse.service.exception.CityNotFoundException;
import com.weatherpulse.web.dto.CreateCityRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Secured Administrative Controller for managing the tracked city list.
 * All endpoints require a cryptographically valid JWT bearing ROLE_ADMIN authority.
 */
@RestController
@RequestMapping("/api/admin/cities")
@RequiredArgsConstructor
@Slf4j
public class AdminCityController {

    private final CityRepository cityRepository;
    private final WeatherService weatherService;

    /**
     * Adds a new tracked city to PostgreSQL.
     *
     * @param request Validated payload containing name, countryCode, and coordinates
     * @return 201 Created with the persisted City entity
     */
    @PostMapping
    public ResponseEntity<City> addCity(@Valid @RequestBody CreateCityRequest request) {
        String canonicalName = request.name().trim();
        log.info("Admin request to register new tracked city='{}' ({})", canonicalName, request.countryCode());

        if (cityRepository.existsByNameIgnoreCase(canonicalName)) {
            log.warn("Registration rejected: City '{}' is already tracked in database.", canonicalName);
            throw new CityAlreadyExistsException("City '" + canonicalName + "' is already being tracked.");
        }

        City newCity = City.builder()
                .name(canonicalName)
                .countryCode(request.countryCode().trim().toUpperCase())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .isActive(true)
                .build();

        City saved = cityRepository.save(newCity);
        log.info("Successfully registered city '{}' with ID={}", saved.getName(), saved.getId());

        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    /**
     * Removes a tracked city from PostgreSQL and evicts its cached observations from Redis.
     *
     * @param id Surrogate primary key ID of the city
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeCity(@PathVariable Long id) {
        log.info("Admin request to remove tracked city with ID={}", id);

        City city = cityRepository.findById(id)
                .orElseThrow(() -> new CityNotFoundException("No tracked city exists with ID: " + id));

        // Evict corresponding cache entry from Redis
        weatherService.evictCityCache(city.getName());

        // Remove from PostgreSQL
        cityRepository.delete(city);
        log.info("Successfully deleted city '{}' (ID={}) and evicted Redis cache.", city.getName(), id);

        return ResponseEntity.noContent().build();
    }
}
