package com.weatherpulse.web;

import com.weatherpulse.entity.AdminUser;
import com.weatherpulse.repository.AdminUserRepository;
import com.weatherpulse.security.JwtTokenProvider;
import com.weatherpulse.service.exception.InvalidCredentialsException;
import com.weatherpulse.web.dto.AuthResponse;
import com.weatherpulse.web.dto.LoginRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public authentication controller issuing signed JWT bearer tokens
 * for administrative access.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        log.info("Received administrator login attempt for username='{}'", request.username());

        AdminUser user = adminUserRepository.findByUsernameIgnoreCase(request.username().trim())
                .orElseThrow(() -> {
                    log.warn("Login failed: Username '{}' not found in database.", request.username());
                    return new InvalidCredentialsException("Invalid username or password provided.");
                });

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            log.warn("Login failed: Password mismatch for username '{}'.", request.username());
            throw new InvalidCredentialsException("Invalid username or password provided.");
        }

        String token = jwtTokenProvider.generateToken(user.getUsername(), user.getRole());
        long expiresInSeconds = jwtTokenProvider.getExpirationDurationSeconds();

        log.info("Successfully authenticated administrator '{}'. Issued JWT valid for {} seconds.",
                user.getUsername(), expiresInSeconds);

        return ResponseEntity.ok(new AuthResponse(
                token,
                "Bearer",
                expiresInSeconds,
                user.getUsername(),
                user.getRole()
        ));
    }
}
