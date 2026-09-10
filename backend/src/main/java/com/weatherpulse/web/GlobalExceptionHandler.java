package com.weatherpulse.web;

import com.weatherpulse.client.exception.WeatherApiException;
import com.weatherpulse.service.exception.CityNotFoundException;
import com.weatherpulse.service.exception.ExternalServiceException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;

/**
 * Global Exception Handler converting domain exceptions and validation errors
 * into standardized RFC 7807 Problem Details payloads.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(CityNotFoundException.class)
    public ResponseEntity<ProblemDetail> handleCityNotFound(CityNotFoundException ex, HttpServletRequest request) {
        log.warn("City not found error: path='{}', message='{}'", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("City Not Found");
        problem.setType(URI.create("https://weatherpulse.internal/errors/city-not-found"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(problem);
    }

    @ExceptionHandler(ExternalServiceException.class)
    public ResponseEntity<ProblemDetail> handleExternalServiceException(ExternalServiceException ex, HttpServletRequest request) {
        log.error("External service failure: path='{}', message='{}'", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_GATEWAY, ex.getMessage());
        problem.setTitle("Upstream Weather Provider Error");
        problem.setType(URI.create("https://weatherpulse.internal/errors/upstream-error"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(problem);
    }

    @ExceptionHandler(WeatherApiException.class)
    public ResponseEntity<ProblemDetail> handleWeatherApiException(WeatherApiException ex, HttpServletRequest request) {
        log.error("Weather API exception: path='{}', category='{}', message='{}'",
                request.getRequestURI(), ex.getCategory(), ex.getMessage());

        HttpStatus status = (ex.getHttpStatus() != null)
                ? HttpStatus.resolve(ex.getHttpStatus().value()) != null
                    ? HttpStatus.resolve(ex.getHttpStatus().value())
                    : HttpStatus.BAD_GATEWAY
                : HttpStatus.BAD_GATEWAY;

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, ex.getMessage());
        problem.setTitle("Weather API Provider Exception");
        problem.setType(URI.create("https://weatherpulse.internal/errors/provider-exception"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("category", ex.getCategory().name());
        problem.setProperty("city", ex.getCity());
        problem.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(status).body(problem);
    }

    @ExceptionHandler({ConstraintViolationException.class, MethodArgumentNotValidException.class})
    public ResponseEntity<ProblemDetail> handleValidationException(Exception ex, HttpServletRequest request) {
        log.warn("Validation error on path '{}': {}", request.getRequestURI(), ex.getMessage());

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST,
                "Request parameter or payload failed validation constraints.");
        problem.setTitle("Bad Request Validation Error");
        problem.setType(URI.create("https://weatherpulse.internal/errors/validation-error"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(problem);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled internal server error on path '{}'", request.getRequestURI(), ex);

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected internal error occurred.");
        problem.setTitle("Internal Server Error");
        problem.setType(URI.create("https://weatherpulse.internal/errors/internal-server-error"));
        problem.setInstance(URI.create(request.getRequestURI()));
        problem.setProperty("timestamp", Instant.now());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(problem);
    }
}
