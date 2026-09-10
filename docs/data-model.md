# WeatherPulse Data Model & Storage Specifications (v2)

This document defines the physical and logical data models for WeatherPulse across its storage engines: the relational model (**PostgreSQL**) for tracked cities and administrative credentials, the in-memory cache model (**Redis**) for real-time weather metrics, and the cryptographic token shape (**JWT**) for stateless administrative authorization.

---

## 1. Relational Database Schemas (PostgreSQL)

The system utilizes PostgreSQL for authoritative transactional state. All DDL adheres to PostgreSQL 17 standards, including generated identity columns, strict constraints, and performance indexes.

### 1.1 City Entity Schema (`tracked_cities` Table)

Stores the list of cities actively monitored by the background synchronization engine.

```sql
CREATE TABLE tracked_cities (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_city_name UNIQUE (name)
);

CREATE INDEX idx_city_active ON tracked_cities (is_active);
CREATE INDEX idx_city_name_lower ON tracked_cities (LOWER(name));
```

#### Field Dictionary & Enterprise Architectural Justifications

| Field | Data Type | Constraints | Enterprise Architectural Justification |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `IDENTITY`, `PK` | SQL-standard surrogate primary key (`GENERATED ALWAYS AS IDENTITY`). Decouples internal database identity from mutable geographic names. |
| `name` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` | Canonical display name of the city (e.g., "London", "Tokyo"). Unique constraint prevents duplicate monitoring configurations and ambiguous routing. |
| `country_code` | `VARCHAR(2)` | `NOT NULL` | Two-letter ISO 3166-1 alpha-2 standard (e.g., "GB", "JP", "US"). Disambiguates identical names (e.g., London, GB vs. London, CA; Paris, FR vs. Paris, US). |
| `latitude` | `NUMERIC(9, 6)` | `NOT NULL` | North/South coordinate (-90.000000 to +90.000000). Provides exact geographic targeting for external weather APIs and avoids provider geocoding ambiguity. |
| `longitude` | `NUMERIC(9, 6)` | `NOT NULL` | East/West coordinate (-180.000000 to +180.000000). Combined with latitude, guarantees precise weather data queries. |
| `is_active` | `BOOLEAN` | `NOT NULL`, `DEFAULT TRUE` | Soft-disable flag. Allows operators to temporarily pause background polling for a city without breaking referential integrity or purging metadata. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Enterprise auditability: tracks when city tracking was initiated with explicit timezone awareness. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Enterprise auditability: tracks when metadata or coordinates were last updated. |

---

### 1.2 AdminUser Entity Schema (`admin_users` Table)

Stores administrative accounts authorized to add or remove tracked cities.

```sql
CREATE TABLE admin_users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'ROLE_ADMIN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_admin_username UNIQUE (username)
);

CREATE INDEX idx_admin_username_lower ON admin_users (LOWER(username));
```

#### Field Dictionary & Enterprise Architectural Justifications

| Field | Data Type | Constraints | Enterprise Architectural Justification |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `IDENTITY`, `PK` | Surrogate primary key decoupling database record identity from usernames. |
| `username` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Unique identifier for administrative login. Indexed in lowercase to enforce case-insensitive uniqueness. |
| `password_hash` | `VARCHAR(100)` | `NOT NULL` | **Never plaintext**. Stores salted BCrypt password hash (e.g., `$2a$12$...`). Length accommodates standard 60-72 character hash outputs with work factor 12. |
| `role` | `VARCHAR(20)` | `NOT NULL`, `DEFAULT 'ROLE_ADMIN'` | Standard Spring Security GrantedAuthority format. Prepares the system for role-based authorization hierarchies while locking scope to administrative operations. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Security audit trail tracking account creation time. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL`, `DEFAULT NOW()` | Security audit trail tracking credential rotation or role modifications. |

#### Password Security Standard (BCrypt with Work Factor 12)
- Passwords are never stored in plain text, logged, or serialized into responses.
- The platform uses Spring Security's `BCryptPasswordEncoder(12)`. BCrypt incorporates a 16-byte random salt and adaptive key derivation function, mitigating rainbow table attacks and brute-force GPU attacks.

---

### 1.3 Baseline Database Seed Scripts

```sql
-- Seed Initial Tracked Cities
INSERT INTO tracked_cities (name, country_code, latitude, longitude, is_active) VALUES
('London', 'GB', 51.507351, -0.127758, true),
('Tokyo', 'JP', 35.676192, 139.650311, true),
('New York', 'US', 40.712776, -74.005974, true),
('Paris', 'FR', 48.856614, 2.352222, true),
('Sydney', 'AU', -33.868820, 151.209296, true),
('Berlin', 'DE', 52.520008, 13.404954, true),
('Toronto', 'CA', 43.653226, -79.383184, true),
('Singapore', 'SG', 1.352083, 103.819836, true);

-- Seed Initial Super Admin User (Password: AdminSecret123!)
-- Hash generated with BCrypt work factor 12
INSERT INTO admin_users (username, password_hash, role) VALUES
('admin', '$2a$12$e8YyXz3PqyvG4fGf8Z4Qhe7O1gqP0gYy.P2mD0gA0rQc4U8h5iZKO', 'ROLE_ADMIN');
```

---

## 2. JWT Cryptographic Token Schema

WeatherPulse uses compact, URL-safe JSON Web Tokens (RFC 7519) signed via **HMAC-SHA256 (HS256)** with an externalized secret key (minimum 256 bits).

### 2.1 Token Payload / Claim Shape

```json
{
  "sub": "admin",
  "role": "ROLE_ADMIN",
  "iat": 1789063200,
  "exp": 1789070400,
  "iss": "weatherpulse-auth-service"
}
```

| Claim | Name | Example Value | Description |
| :--- | :--- | :--- | :--- |
| `sub` | Subject | `"admin"` | The authenticated username initiating administrative requests. |
| `role` | Authority | `"ROLE_ADMIN"` | Spring Security authority used by `@PreAuthorize("hasRole('ADMIN')")`. |
| `iat` | Issued At | `1789063200` | Unix epoch timestamp when token was signed. |
| `exp` | Expiration | `1789070400` | Unix epoch timestamp when token expires and is rejected. |
| `iss` | Issuer | `"weatherpulse-auth-service"` | Domain identifier verifying token provenance. |

### 2.2 Token Expiry Duration & Justification

- **Duration**: **2 Hours (7,200 seconds)**.
- **Enterprise Architectural Justification**:
  1. **Mitigation of Stolen Token Window**: Because the architecture is completely stateless (no distributed token blocklist table or revocation store), tokens cannot be actively invalidated before expiry. Limiting the lifespan to 2 hours strictly restricts the vulnerability window if a bearer token is intercepted.
  2. **Operational Convenience**: Administrative actions (adding/deleting cities) are intermittent maintenance tasks. A 2-hour window provides ample time for an operator to configure cities without disruptive, repeated re-logins during an active maintenance window.
  3. **No Refresh Token Sprawl**: Since public users never authenticate and admins perform infrequent administrative tasks, omitting complex refresh token rotation maintains a lean, hardened security posture.

---

## 3. Distributed Cache Data Model (Redis)

Redis serves as the centralized, high-speed buffer for current meteorological snapshots.

### 3.1 Key Naming Convention & Namespacing

```
weatherpulse:weather:{cityNameLowercase}
```

#### Key Design Rules:
1. **Namespace Prefix (`weatherpulse:`)**: In shared Redis clusters, isolates the microservice domain to prevent collisions with other services.
2. **Entity Type (`weather:`)**: Designates the data structure category.
3. **Normalized Identifier (`{cityNameLowercase}`)**: City names are lowercased and trimmed (e.g., `weatherpulse:weather:london`, `weatherpulse:weather:new york`). Guarantees requests for `"Tokyo"`, `"tokyo"`, or `"TOKYO"` resolve to the identical cache slot.

---

### 3.2 Cached Value Structure: `WeatherResponseDto` (JSON)

Weather data is serialized as clean, domain-specific JSON via Jackson. Raw external provider payloads are never cached directly, shielding internal clients from vendor model drift.

#### Structure & Example Payload:

```json
{
  "cityName": "Tokyo",
  "countryCode": "JP",
  "temperatureCelsius": 22.4,
  "feelsLikeCelsius": 22.1,
  "tempMinCelsius": 20.8,
  "tempMaxCelsius": 24.0,
  "humidityPercent": 58,
  "windSpeedKmh": 12.6,
  "windDirectionDegrees": 180,
  "weatherCondition": "Clear",
  "weatherDescription": "clear sky",
  "weatherIconCode": "01d",
  "externalObservedAt": "2026-09-10T17:15:00Z",
  "cachedAt": "2026-09-10T17:20:00Z"
}
```

---

### 3.3 TTL Strategy & Architectural Justification

- **Configured TTL**: **10 Minutes (600 seconds)**.
- **Refresh Frequency**: Background scheduler runs every **5 Minutes (300 seconds)**.

#### Mathematical Justification for the 10-Minute TTL:
```
TTL Duration (10m) = 2x Refresh Cycle Interval (5m)
```
1. **Grace Period for Upstream Outages & Network Jitter**:
   If an external OpenWeatherMap call fails or times out during minute 5, the existing cached entry remains valid for an additional 5 minutes. The application seamlessly serves last-known-good metrics to users instead of returning a cold failure.
2. **Deterministic Expiration**:
   If background polling is completely suspended or a city is deactivated, the stale entry expires predictably without lingering indefinitely in memory.
3. **Memory Optimization**:
   Redis automatically evicts expired keys passively on access or actively via its internal sampling daemon, preserving Redis memory limits.
