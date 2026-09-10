package com.weatherpulse.service.exception;

/**
 * Thrown when attempting to register a tracked city that already exists in PostgreSQL.
 * Mapped to RFC 7807 409 Conflict.
 */
public class CityAlreadyExistsException extends RuntimeException {
    public CityAlreadyExistsException(String message) {
        super(message);
    }
}
