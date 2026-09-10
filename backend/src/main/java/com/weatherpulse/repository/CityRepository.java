package com.weatherpulse.repository;

import com.weatherpulse.entity.City;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for the City entity.
 * Provides data access operations against the 'tracked_cities' table.
 */
@Repository
public interface CityRepository extends JpaRepository<City, Long> {

    /**
     * Retrieves all active tracked cities ordered alphabetically by name.
     * Used by the public GET /api/cities endpoint and the scheduler.
     */
    List<City> findByIsActiveTrueOrderByNameAsc();

    /**
     * Looks up an active city by name (case-insensitive).
     * Used by the reactive read flow (GET /api/weather/{city}) on cache miss.
     */
    Optional<City> findByNameIgnoreCaseAndIsActiveTrue(String name);

    /**
     * Looks up any city by name (case-insensitive), regardless of active status.
     */
    Optional<City> findByNameIgnoreCase(String name);

    /**
     * Checks if a city with the specified name already exists (case-insensitive).
     * Used by admin POST /api/admin/cities to enforce uniqueness before insertion.
     */
    boolean existsByNameIgnoreCase(String name);
}
