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

import java.math.BigDecimal;
import java.util.List;

/**
 * Data seeder executed at application startup.
 * Idempotently populates baseline tracked cities and the default administrator account
 * if the persistence tables are empty.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final CityRepository cityRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${weatherpulse.admin.default-username:admin}")
    private String defaultAdminUsername;

    @Value("${weatherpulse.admin.default-password:AdminSecret123!}")
    private String defaultAdminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        seedTrackedCitiesIfEmpty();
        seedDefaultAdminUserIfEmpty();
    }

    private void seedTrackedCitiesIfEmpty() {
        if (cityRepository.count() == 0) {
            log.info("Database contains zero tracked cities. Initializing baseline city dataset...");

            List<City> initialCities = List.of(
                City.builder().name("London").countryCode("GB").latitude(new BigDecimal("51.507351")).longitude(new BigDecimal("-0.127758")).isActive(true).build(),
                City.builder().name("Tokyo").countryCode("JP").latitude(new BigDecimal("35.676192")).longitude(new BigDecimal("139.650311")).isActive(true).build(),
                City.builder().name("New York").countryCode("US").latitude(new BigDecimal("40.712776")).longitude(new BigDecimal("-74.005974")).isActive(true).build(),
                City.builder().name("Paris").countryCode("FR").latitude(new BigDecimal("48.856614")).longitude(new BigDecimal("2.352222")).isActive(true).build(),
                City.builder().name("Sydney").countryCode("AU").latitude(new BigDecimal("-33.868820")).longitude(new BigDecimal("151.209296")).isActive(true).build(),
                City.builder().name("Berlin").countryCode("DE").latitude(new BigDecimal("52.520008")).longitude(new BigDecimal("13.404954")).isActive(true).build(),
                City.builder().name("Toronto").countryCode("CA").latitude(new BigDecimal("43.653226")).longitude(new BigDecimal("-79.383184")).isActive(true).build(),
                City.builder().name("Singapore").countryCode("SG").latitude(new BigDecimal("1.352083")).longitude(new BigDecimal("103.819836")).isActive(true).build()
            );

            cityRepository.saveAll(initialCities);
            log.info("Successfully seeded {} baseline tracked cities into PostgreSQL.", initialCities.size());
        } else {
            log.info("Database already contains {} tracked cities. Skipping city seeding.", cityRepository.count());
        }
    }

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
