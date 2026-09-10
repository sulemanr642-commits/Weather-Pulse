package com.weatherpulse.service.exception;

/**
 * Thrown when an administrative login fails due to unrecognized username or password mismatch.
 * Mapped to RFC 7807 401 Unauthorized.
 */
public class InvalidCredentialsException extends RuntimeException {
    public InvalidCredentialsException(String message) {
        super(message);
    }
}
