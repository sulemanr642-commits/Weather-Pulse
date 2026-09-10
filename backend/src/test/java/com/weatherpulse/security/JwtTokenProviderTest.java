package com.weatherpulse.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    private final String testSecret = "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970";

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(jwtTokenProvider, "expirationMs", 3600000L); // 1 hour
        ReflectionTestUtils.setField(jwtTokenProvider, "issuer", "weatherpulse-test");
        jwtTokenProvider.init();
    }

    @Test
    @DisplayName("JWT: Generates valid token and accurately extracts subject and role claims")
    void testGenerateAndValidateToken() {
        String token = jwtTokenProvider.generateToken("admin", "ROLE_ADMIN");

        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();
        assertThat(jwtTokenProvider.getUsernameFromToken(token)).isEqualTo("admin");
        assertThat(jwtTokenProvider.getRoleFromToken(token)).isEqualTo("ROLE_ADMIN");
    }

    @Test
    @DisplayName("JWT: Rejects tampered tokens")
    void testTamperedTokenFailsValidation() {
        String token = jwtTokenProvider.generateToken("admin", "ROLE_ADMIN");
        String tampered = token + "corrupted";

        assertThat(jwtTokenProvider.validateToken(tampered)).isFalse();
    }

    @Test
    @DisplayName("JWT: Rejects expired tokens")
    void testExpiredTokenFailsValidation() {
        JwtTokenProvider expiredProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(expiredProvider, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(expiredProvider, "expirationMs", -1000L); // Expired in past
        ReflectionTestUtils.setField(expiredProvider, "issuer", "weatherpulse-test");
        expiredProvider.init();

        String expiredToken = expiredProvider.generateToken("admin", "ROLE_ADMIN");

        assertThat(jwtTokenProvider.validateToken(expiredToken)).isFalse();
    }
}
