package com.weatherpulse.repository;

import com.weatherpulse.entity.AdminUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository for AdminUser entity.
 * Provides data access operations against the 'admin_users' table.
 */
@Repository
public interface AdminUserRepository extends JpaRepository<AdminUser, Long> {

    /**
     * Retrieves an administrative user by username (case-insensitive).
     * Used by Spring Security authentication to retrieve the stored BCrypt hash.
     */
    Optional<AdminUser> findByUsernameIgnoreCase(String username);

    /**
     * Checks if an admin account with the specified username already exists.
     */
    boolean existsByUsernameIgnoreCase(String username);
}
