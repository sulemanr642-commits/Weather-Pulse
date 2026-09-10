package com.weatherpulse.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

/**
 * Component responsible for generating, signing, parsing, and cryptographically
 * verifying JSON Web Tokens (JWT) for stateless administrative authorization.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${weatherpulse.jwt.secret}")
    private String jwtSecret;

    @Value("${weatherpulse.jwt.expiration-ms:7200000}")
    private long expirationMs;

    @Value("${weatherpulse.jwt.issuer:weatherpulse-auth-service}")
    private String issuer;

    private SecretKey signingKey;

    @PostConstruct
    public void init() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalArgumentException("JWT secret must be at least 256 bits (32 bytes) long.");
        }
        this.signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Generates a signed JWT for an authenticated administrator.
     *
     * @param username The administrator's username (subject)
     * @param role     The granted authority (e.g., "ROLE_ADMIN")
     * @return Compact serialized JWT
     */
    public String generateToken(String username, String role) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(expirationMs);

        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .issuer(issuer)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(signingKey)
                .compact();
    }

    /**
     * Cryptographically verifies the signature and validates expiration of a token.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("Invalid JWT token rejected: {}", ex.getMessage());
            return false;
        }
    }

    /**
     * Extracts all claims from a validated token payload.
     */
    public Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public String getUsernameFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public String getRoleFromToken(String token) {
        return getClaims(token).get("role", String.class);
    }

    public long getExpirationDurationSeconds() {
        return expirationMs / 1000;
    }
}
