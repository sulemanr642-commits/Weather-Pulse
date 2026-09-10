package com.weatherpulse.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Request payload for POST /api/admin/cities.
 */
public record CreateCityRequest(
        @NotBlank(message = "City name must not be blank")
        @Size(min = 2, max = 100, message = "City name must be between 2 and 100 characters")
        String name,

        @NotBlank(message = "Country code must not be blank")
        @Pattern(regexp = "^[A-Z]{2}$", message = "Country code must be a 2-letter uppercase ISO 3166-1 alpha-2 code")
        String countryCode,

        @NotNull(message = "Latitude is required")
        @DecimalMin(value = "-90.000000", message = "Latitude cannot be less than -90.0")
        @DecimalMax(value = "90.000000", message = "Latitude cannot be greater than 90.0")
        BigDecimal latitude,

        @NotNull(message = "Longitude is required")
        @DecimalMin(value = "-180.000000", message = "Longitude cannot be less than -180.0")
        @DecimalMax(value = "180.000000", message = "Longitude cannot be greater than 180.0")
        BigDecimal longitude
) {}
