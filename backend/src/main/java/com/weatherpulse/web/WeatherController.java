package com.weatherpulse.web;

import com.weatherpulse.client.dto.WeatherData;
import com.weatherpulse.service.WeatherService;
import com.weatherpulse.service.dto.WeatherResult;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public REST Controller exposing current weather conditions for tracked cities.
 * Serves cache-first reads and provides telemetry headers (X-Cache: HIT | MISS).
 */
@RestController
@RequestMapping("/api/weather")
@RequiredArgsConstructor
@Validated
@Slf4j
public class WeatherController {

    private final WeatherService weatherService;

    /**
     * Public Endpoint: Retrieves current meteorological observations for a tracked city.
     *
     * @param city Name of the city (e.g., "Tokyo", "London")
     * @return 200 OK with WeatherData and X-Cache header
     */
    @GetMapping("/{city}")
    public ResponseEntity<WeatherData> getWeatherForCity(
            @PathVariable("city")
            @NotBlank(message = "City name must not be blank")
            @Size(min = 2, max = 100, message = "City name must be between 2 and 100 characters")
            @Pattern(
                regexp = "^[a-zA-Z\\s\\-\\.\\']+$",
                message = "City name must contain only alphabetic characters, spaces, hyphens, and apostrophes"
            )
            String city) {

        log.debug("Received request for GET /api/weather/{}", city);
        WeatherResult result = weatherService.getWeatherForCity(city);

        return ResponseEntity.ok()
                .header("X-Cache", result.getCacheHeaderValue())
                .body(result.getData());
    }
}
