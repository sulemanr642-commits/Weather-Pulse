package com.weatherpulse.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Represents a geographical city actively monitored by the WeatherPulse synchronization engine.
 * Maps to the 'tracked_cities' table in PostgreSQL.
 */
@Entity
@Table(
    name = "tracked_cities",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_city_name", columnNames = {"name"})
    },
    indexes = {
        @Index(name = "idx_city_active", columnList = "is_active"),
        @Index(name = "idx_city_name_lower", columnList = "name"),
        @Index(name = "idx_city_active_name", columnList = "is_active, name")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class City {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "City name must not be blank")
    @Size(min = 2, max = 100, message = "City name must be between 2 and 100 characters")
    @Column(name = "name", nullable = false, length = 100, unique = true)
    private String name;

    @NotBlank(message = "Country code must not be blank")
    @Pattern(regexp = "^[A-Z]{2}$", message = "Country code must be a 2-letter uppercase ISO 3166-1 alpha-2 code")
    @Column(name = "country_code", nullable = false, length = 2)
    private String countryCode;

    @NotNull(message = "Latitude is required")
    @DecimalMin(value = "-90.000000", message = "Latitude cannot be less than -90.0")
    @DecimalMax(value = "90.000000", message = "Latitude cannot be greater than 90.0")
    @Column(name = "latitude", nullable = false, precision = 9, scale = 6)
    private BigDecimal latitude;

    @NotNull(message = "Longitude is required")
    @DecimalMin(value = "-180.000000", message = "Longitude cannot be less than -180.0")
    @DecimalMax(value = "180.000000", message = "Longitude cannot be greater than 180.0")
    @Column(name = "longitude", nullable = false, precision = 9, scale = 6)
    private BigDecimal longitude;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.isActive == null) {
            this.isActive = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
