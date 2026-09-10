package com.weatherpulse.config;

import com.weatherpulse.client.dto.WeatherData;
import com.weatherpulse.entity.AdminUser;
import com.weatherpulse.entity.City;
import com.weatherpulse.repository.AdminUserRepository;
import com.weatherpulse.repository.CityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
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
    private final RedisTemplate<String, WeatherData> redisTemplate;
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
        seedInitialWeatherCacheIfEmpty();
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

    private void seedInitialWeatherCacheIfEmpty() {
        String testKey = "weatherpulse:weather:tokyo";
        try {
            if (redisTemplate.opsForValue().get(testKey) == null) {
                log.info("Priming initial weather snapshots into Redis for fast browser demonstration...");

                Instant now = Instant.now();
                Duration ttl = Duration.ofMinutes(10);

                var tokyo = WeatherData.builder()
                        .cityName("Tokyo").countryCode("JP")
                        .temperatureCelsius(22.4).feelsLikeCelsius(22.1)
                        .tempMinCelsius(20.8).tempMaxCelsius(24.0)
                        .humidityPercent(58).windSpeedKmh(12.6).windDirectionDegrees(180)
                        .weatherCondition("Clear").weatherDescription("clear sky").weatherIconCode("01d")
                        .externalObservedAt(now).fetchedAt(now).build();

                var london = WeatherData.builder()
                        .cityName("London").countryCode("GB")
                        .temperatureCelsius(17.8).feelsLikeCelsius(17.2)
                        .tempMinCelsius(15.5).tempMaxCelsius(19.3)
                        .humidityPercent(72).windSpeedKmh(14.4).windDirectionDegrees(210)
                        .weatherCondition("Rain").weatherDescription("light rain").weatherIconCode("10d")
                        .externalObservedAt(now).fetchedAt(now).build();

                var newyork = WeatherData.builder()
                        .cityName("New York").countryCode("US")
                        .temperatureCelsius(24.1).feelsLikeCelsius(24.6)
                        .tempMinCelsius(21.0).tempMaxCelsius(26.5)
                        .humidityPercent(63).windSpeedKmh(11.2).windDirectionDegrees(90)
                        .weatherCondition("Clouds").weatherDescription("few clouds").weatherIconCode("02d")
                        .externalObservedAt(now).fetchedAt(now).build();

                var paris = WeatherData.builder()
                        .cityName("Paris").countryCode("FR")
                        .temperatureCelsius(19.5).feelsLikeCelsius(19.0)
                        .tempMinCelsius(17.2).tempMaxCelsius(21.8)
                        .humidityPercent(60).windSpeedKmh(9.7).windDirectionDegrees(160)
                        .weatherCondition("Clear").weatherDescription("clear sky").weatherIconCode("01d")
                        .externalObservedAt(now).fetchedAt(now).build();

                redisTemplate.opsForValue().set("weatherpulse:weather:tokyo", tokyo, ttl);
                redisTemplate.opsForValue().set("weatherpulse:weather:london", london, ttl);
                redisTemplate.opsForValue().set("weatherpulse:weather:new york", newyork, ttl);
                redisTemplate.opsForValue().set("weatherpulse:weather:paris", paris, ttl);

                log.info("Primed Redis cache with baseline weather snapshots.");
            }
        } catch (Exception ex) {
            log.warn("Could not prime initial Redis cache: {}. Will fetch on demand.", ex.getMessage());
        }
    }
}
