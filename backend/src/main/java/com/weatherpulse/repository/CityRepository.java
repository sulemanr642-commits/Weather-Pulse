package com.weatherpulse.repository;

import com.weatherpulse.entity.City;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
     * Used by the public GET /api/cities endpoint and legacy list readers.
     */
    List<City> findByIsActiveTrueOrderByNameAsc();

    /**
     * High-capacity paginated retrieval of active tracked cities.
     * Used by cursor-based batching in the scheduler and paginated UI endpoints.
     */
    Page<City> findByIsActiveTrueOrderByNameAsc(Pageable pageable);

    /**
     * Fast, index-accelerated case-insensitive search with pagination.
     */
    Page<City> findByIsActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(String name, Pageable pageable);

    /**
     * Case-insensitive substring search for active cities.
     */
    List<City> findByIsActiveTrueAndNameContainingIgnoreCaseOrderByNameAsc(String name);

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
