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

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

/**
 * Data seeder executed at application startup.
 * Idempotently populates baseline tracked cities, the default administrator account,
 * and primes initial Redis cache snapshots for immediate browser viewing.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final CityRepository cityRepository;
    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, WeatherData> redisTemplate;

    @Value("${weatherpulse.admin.default-username:admin}")
    private String defaultAdminUsername;

    @Value("${weatherpulse.admin.default-password:AdminSecret123!}")
    private String defaultAdminPassword;

    @Override
    @Transactional
    public void run(String... args) {
        seedTrackedCitiesIfEmpty();
        seedDefaultAdminUserIfEmpty();
        seedInitialWeatherCacheIfEmpty();
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
