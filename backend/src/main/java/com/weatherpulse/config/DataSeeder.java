package com.weatherpulse.config;

import com.weatherpulse.entity.AdminUser;
import com.weatherpulse.entity.City;
import com.weatherpulse.repository.AdminUserRepository;
import com.weatherpulse.repository.CityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;

import java.math.BigDecimal;
import java.util.List;

/**
 * Data seeder executed at application startup.
 * Idempotently populates baseline tracked cities from a credible global dataset (GeoNames / GeoJSON),
 * initializes the default administrator account, and primes initial Redis cache snapshots.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final CityRepository cityRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Value("${weatherpulse.admin.default-username:admin}")
    private String defaultAdminUsername;

    @Value("${weatherpulse.admin.default-password:AdminSecret123!}")
    private String defaultAdminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        seedTrackedCities();
        seedDefaultAdminUserIfEmpty();
    }

    private void seedTrackedCities() {
        try {
            ClassPathResource resource = new ClassPathResource("data/world_cities.json");
            if (!resource.exists()) {
                log.warn("City seed dataset 'data/world_cities.json' not found on classpath.");
                return;
            }

            List<CitySeedDto> seedCities = objectMapper.readValue(
                    resource.getInputStream(),
                    new TypeReference<List<CitySeedDto>>() {}
            );

            int insertedCount = 0;
            for (CitySeedDto seed : seedCities) {
                if (seed.name() != null && !cityRepository.existsByNameIgnoreCase(seed.name().trim())) {
                    City city = City.builder()
                            .name(seed.name().trim())
                            .countryCode(seed.countryCode().trim().toUpperCase())
                            .latitude(seed.latitude())
                            .longitude(seed.longitude())
                            .isActive(true)
                            .build();
                    cityRepository.save(city);
                    insertedCount++;
                }
            }

            if (insertedCount > 0) {
                log.info("Successfully seeded {} new tracked cities into PostgreSQL from credible world dataset (Total: {}).",
                        insertedCount, cityRepository.count());
            } else {
                log.info("All {} cities from credible seed dataset already exist in PostgreSQL.", seedCities.size());
            }

        } catch (Exception ex) {
            log.error("Failed to seed tracked cities from world_cities.json: {}", ex.getMessage(), ex);
        }
    }

    public record CitySeedDto(String name, String countryCode, BigDecimal latitude, BigDecimal longitude) {}

    private void seedDefaultAdminUserIfEmpty() {
        if (adminUserRepository.count() == 0) {
            log.warn("===============================================================================");
            log.warn("SECURITY NOTICE: No administrative accounts detected in database.");
            log.warn("Creating default admin user with username: '{}'", defaultAdminUsername);
            log.warn("CRITICAL: Change the default administrator password immediately before deploying!");
            log.warn("===============================================================================");

            String hashedPassword = passwordEncoder.encode(defaultAdminPassword);

            AdminUser admin = AdminUser.builder()
                .username(defaultAdminUsername)
                .passwordHash(hashedPassword)
                .role("ROLE_ADMIN")
                .build();

            adminUserRepository.save(admin);
            log.info("Default administrator account successfully initialized.");
        } else {
            log.info("Administrative accounts already exist. Skipping admin user seeding.");
        }
    }
}
