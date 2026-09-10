package com.weatherpulse.web.dto;

/**
 * Response payload for successful administrator authentication.
 */
public record AuthResponse(
        String token,
        String tokenType,
        long expiresIn,
        String username,
        String role
) {}
