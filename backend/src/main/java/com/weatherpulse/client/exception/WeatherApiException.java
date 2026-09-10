package com.weatherpulse.client.exception;

import lombok.Getter;
import org.springframework.http.HttpStatusCode;

/**
 * Custom exception thrown when external weather API communication fails.
 * Wraps low-level HTTP errors, timeouts, and deserialization faults into
 * structured domain exceptions, shielding internal layers from raw vendor errors.
 */
@Getter
public class WeatherApiException extends RuntimeException {

    public enum ErrorCategory {
        TIMEOUT,
        CITY_NOT_FOUND,
        UNAUTHORIZED,
        RATE_LIMITED,
        UPSTREAM_SERVER_ERROR,
        MALFORMED_RESPONSE,
        GENERIC_FAILURE
    }

    private final ErrorCategory category;
    private final HttpStatusCode httpStatus;
    private final String city;

    public WeatherApiException(String message, ErrorCategory category, HttpStatusCode httpStatus, String city) {
        super(message);
        this.category = category;
        this.httpStatus = httpStatus;
        this.city = city;
    }

    public WeatherApiException(String message, ErrorCategory category, String city, Throwable cause) {
        super(message, cause);
        this.category = category;
        this.httpStatus = null;
        this.city = city;
    }
}
