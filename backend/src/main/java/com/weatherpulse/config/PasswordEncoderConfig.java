package com.weatherpulse.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Security encoder configuration.
 * Defines the enterprise standard BCrypt password encoder with work factor 12.
 */
@Configuration
public class PasswordEncoderConfig {

    /**
     * Standard BCrypt password encoder bean with work factor 12.
     * Incorporates salt generation and adaptive computational cost.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
