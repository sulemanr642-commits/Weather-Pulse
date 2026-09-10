package com.weatherpulse;

import com.weatherpulse.entity.AdminUser;
import com.weatherpulse.entity.City;
import com.weatherpulse.repository.AdminUserRepository;
import com.weatherpulse.repository.CityRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that the Spring Boot ApplicationContext loads cleanly,
 * JPA entities are registered, and initial data seeding occurs as expected.
 */
@SpringBootTest
@TestPropertySource(properties = "weatherpulse.scheduler.enabled=false")
class WeatherPulseApplicationTests {

    @Autowired
    private CityRepository cityRepository;

    @Autowired
    private AdminUserRepository adminUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    @DisplayName("Context Loads: Verifies all beans and persistence layer initialize")
    void contextLoads() {
        assertThat(cityRepository).isNotNull();
        assertThat(adminUserRepository).isNotNull();
        assertThat(passwordEncoder).isNotNull();
    }

    @Test
    @DisplayName("Data Seeding: Verifies baseline tracked cities are seeded into PostgreSQL")
    void verifyTrackedCitiesSeeded() {
        List<City> cities = cityRepository.findByIsActiveTrueOrderByNameAsc();
        assertThat(cities)
                .isNotEmpty()
                .hasSizeGreaterThanOrEqualTo(8);

        Optional<City> london = cityRepository.findByNameIgnoreCaseAndIsActiveTrue("London");
        assertThat(london).isPresent();
        assertThat(london.get().getCountryCode()).isEqualTo("GB");
    }

    @Test
    @DisplayName("Data Seeding: Verifies default admin user is seeded with BCrypt password hash")
    void verifyDefaultAdminUserSeeded() {
        Optional<AdminUser> adminOpt = adminUserRepository.findByUsernameIgnoreCase("admin");
        assertThat(adminOpt).isPresent();

        AdminUser admin = adminOpt.get();
        assertThat(admin.getRole()).isEqualTo("ROLE_ADMIN");
        // Verify password is NOT plain text
        assertThat(admin.getPasswordHash()).doesNotContain("AdminSecret123!");
        // Verify BCrypt hash matches default password
        assertThat(passwordEncoder.matches("AdminSecret123!", admin.getPasswordHash())).isTrue();
    }
}
