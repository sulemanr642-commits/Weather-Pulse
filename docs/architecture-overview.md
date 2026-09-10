# WeatherPulse Architecture Overview (v2)

## 1. System Mission & Architectural Vision

**WeatherPulse** is an enterprise-grade weather monitoring platform designed for high read availability, predictable API consumption, graceful degradation, and secure administrative controls. The platform periodically ingests real-time meteorological data for a curated set of tracked cities from an external weather provider (OpenWeatherMap), caches it in an enterprise distributed cache (Redis), and exposes clean, read-only REST endpoints consumed by a reactive, glassmorphism-styled React front-end. Administrative operations (adding/removing tracked cities) are strictly segregated and protected via stateless JSON Web Token (JWT) authentication.

### Core Architectural Principles
1. **API Politeness & Cost Predictability**: External API calls are strictly bounded and predictable via proactive background synchronization, preventing external rate-limit exhaustion or billing spikes.
2. **High Read Availability via Resilience**: Public user requests are served directly from cache; failures or outages in external weather providers do not disrupt user read paths.
3. **Zero-Trust Administrative Boundary**: Public observation paths require zero authentication and retain zero session state, while administrative mutations (`/api/admin/**`) are safeguarded by cryptographic JWT verification and role-based access control (RBAC).

---

## 2. Component Architecture & Layered Boundaries

The backend strictly adheres to a **Layered (N-Tier) Hexagonal-inspired Architecture**, guaranteeing separation of concerns, testability, and clear boundary contracts across the application lifecycle:

```
+-----------------------------------------------------------------------------------+
|                                 React Web UI                                      |
|          (Vite / React 18 / Framer Motion / iOS Glassmorphism / 3D Icons)         |
+-----------------------------------------------------------------------------------+
                                         |
                                    HTTP / JSON
                                         v
+-----------------------------------------------------------------------------------+
|                                Controller Layer                                   |
|   +---------------------------------------+  +--------------------------------+   |
|   |         Public Controllers            |  |       Admin Controllers        |   |
|   | - CityController (GET /api/cities)    |  | - AdminCityController          |   |
|   | - WeatherController                   |  |   (POST /api/admin/cities,     |   |
|   |   (GET /api/weather/{city})           |  |    DELETE /api/admin/cities/{})|   |
|   | - AuthController (POST /api/auth/login|  |                                |   |
|   +---------------------------------------+  +--------------------------------+   |
|                                                               ^                   |
|                                                    [JwtAuthenticationFilter]      |
|                                                    (Spring Security Filter Chain) |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                 Service Layer                                     |
|   - CityService (Domain logic for tracked cities)                                 |
|   - WeatherService (Cache-aside orchestration, business rules)                    |
|   - WeatherRefreshScheduler (@Scheduled proactive synchronization)                |
|   - AdminUserService / AuthService (User validation, BCrypt password matching)    |
|   - JwtTokenService (HMAC-SHA256 signing, claims extraction, validation)          |
+------------------------+-------------------------------+--------------------------+
                         |                               |
                         v                               v
+--------------------------------+  +-----------------------------------------------+
|      Repository Layer (JPA)    |  |        Infrastructure / Client Layer          |
|   - CityRepository             |  |   - WeatherClient (External API HTTP Client)  |
|   - AdminUserRepository        |  |   - RedisTemplate / Cache Manager             |
|   - PostgreSQL Relational DB   |  |   - OpenWeatherMap REST API                   |
|     (tracked_cities,           |  |                                               |
|      admin_users)              |  |                                               |
+--------------------------------+  +-----------------------------------------------+
```

### Component Roles & Responsibilities

1. **React Web UI (Presentation Tier)**:
   - Built with modern React (Vite bundler) using an iOS-inspired frosted glassmorphism visual language.
   - Purely decoupled from backend persistence; consumes REST endpoints via standard asynchronous `fetch`/`axios`.
   - Incorporates a city selection dropdown, weather card, last-updated badge, auto-refresh polling (every 60s), and a discrete modal for administrative authentication.
   - Employs Framer Motion for smooth UI transitions and restrained 3D iconography for weather states.

2. **Controller Layer (`web` & `security` packages)**:
   - **Public Controllers**:
     - `CityController` (`GET /api/cities`): Publicly returns all active tracked cities.
     - `WeatherController` (`GET /api/weather/{city}`): Publicly serves current meteorological observations.
     - `AuthController` (`POST /api/auth/login`): Validates administrative credentials and generates a signed JWT.
   - **Admin Controllers**:
     - `AdminCityController` (`POST /api/admin/cities`, `DELETE /api/admin/cities/{id}`): Handles protected administrative mutations.
   - **Security Filter Chain**:
     - `JwtAuthenticationFilter`: Intercepts inbound HTTP requests. For protected `/api/admin/**` paths, it parses the `Authorization: Bearer <token>` header, verifies the cryptographic signature and expiration, extracts claims, and populates Spring's `SecurityContextHolder`. Rejects invalid or expired tokens with HTTP 401 Unauthorized before reaching the controller.
   - **Global Exception Handler (`@RestControllerAdvice`)**:
     - Translates unhandled domain exceptions and Spring Security rejections into standardized **RFC 7807 Problem Details** JSON payloads.

3. **Service Layer (`service` package)**:
   - Encapsulates domain invariants, transaction boundaries, and orchestration.
   - `CityService`: Manages retrieval and administrative additions/deletions of tracked cities.
   - `WeatherService`: Implements the **Cache-Aside pattern** for reactive reads, orchestrating cache lookups and fallbacks.
   - `WeatherRefreshScheduler`: Autonomous cron/fixed-rate background worker keeping Redis warm.
   - `AuthService` & `JwtTokenService`: Coordinates BCrypt password verification and issues cryptographically signed JWTs with structured claims.

4. **Repository Layer (`repository` package)**:
   - Built on Spring Data JPA backed by **PostgreSQL**.
   - Manages relational entities: `City` (`tracked_cities` table) and `AdminUser` (`admin_users` table).

5. **External Client Layer (`client` package)**:
   - Encapsulates external OpenWeatherMap HTTP communication with strict timeouts, structured error decoders, and circuit protection.
   - Maps vendor JSON models into clean internal domain Data Transfer Objects (DTOs).

6. **Distributed Cache Layer (`cache` package / Redis)**:
   - In-memory key-value store acting as a high-performance buffer between user requests and external rate-limited APIs.
   - Enforces key namespacing (`weatherpulse:weather:{city}`) and Time-To-Live (TTL) expiration.

---

## 3. The Three Core System Flows

### Flow (a): Scheduler-Triggered Proactive Refresh Flow (Warm Cache)

The system does not rely on user visits to populate the cache. An automated background worker keeps the cache constantly primed for all active cities:

```
[Timer @Scheduled (Every 5 mins)]
               |
               v
      CityRepository.findByIsActiveTrue()
               |
               v
     +----------------------------------------------------------+
     | For Each Active City:                                    |
     |   1. Log scheduled fetch attempt                         |
     |   2. Invoke WeatherClient.fetchCurrentWeather(city)      |
     |   3. IF Success:                                         |
     |        - Transform vendor payload to WeatherResponseDto  |
     |        - Redis.set(key, dto, TTL=10 min)                 |
     |        - Log success & cache refresh                     |
     |      ELSE Failure:                                       |
     |        - Log external API failure with context           |
     |        - Retain existing Redis key (stale fallback)      |
     |        - Continue loop for remaining cities (Bulkhead)   |
     +----------------------------------------------------------+
```

- **Trigger**: `@Scheduled(fixedRateString = "${weatherpulse.refresh-interval-ms:300000}")`.
- **Fault Isolation**: If the external API fails for city $N$, an error is logged. The existing Redis entry for that city is **retained**, ensuring user reads can still fall back to last-known-good metrics. The loop continues uninterrupted for remaining cities.

---

### Flow (b): User-Triggered Reactive Read Flow (Cache-First Read)

When an end-user visits the application or the React client polls for updates:

```
Browser (React Client)
   |
   | GET /api/weather/{city} (Public, Unauthenticated)
   v
WeatherController
   |
   | Sanitize & validate cityName parameter
   v
WeatherService.getWeatherForCity(cityName)
   |
   +---> 1. Query Redis (Key: weatherpulse:weather:{cityNameLowercase})
   |
   |---[HIT]---> Direct Cache Hit!
   |               - Log cache hit
   |               - Return WeatherResponseDto (Headers: X-Cache=HIT)
   |
   +---[MISS]--> Cache Miss (Cold start or TTL elapsed):
                   - Query CityRepository to confirm city is tracked
                   - IF not tracked: Throw CityNotFoundException (404)
                   - IF tracked:
                       - Call WeatherClient.fetchCurrentWeather(city)
                       - Store result in Redis with 10-minute TTL
                       - Return WeatherResponseDto (Headers: X-Cache=MISS)
                   - IF External Call Fails:
                       - Return stale cached data if present
                       - Otherwise throw ExternalServiceException (502/503)
```

- **Cache Hit Path (Optimal, >99% of requests)**: Data is returned in <5ms directly from Redis without hitting PostgreSQL or OpenWeatherMap.
- **Cache Miss Path**: Handled gracefully with database validation and fallback error mapping.

---

### Flow (c): Admin Authentication & City Management Flow

Administrative operations require authentication and cryptographic authorization:

```
Admin (React Admin Modal)
   |
   | 1. POST /api/auth/login { "username": "...", "password": "..." }
   v
AuthController -> AuthService -> AuthenticationManager
   |
   | Match username in admin_users table
   | Verify password using BCryptPasswordEncoder.matches()
   +---[Invalid]---> Throw BadCredentialsException -> 401 Unauthorized
   |
   +---[Valid]-----> JwtTokenService generates signed JWT (HMAC-SHA256, 2h TTL)
                     Return 200 OK { "token": "...", "expiresIn": 7200 }

-----------------------------------------------------------------------------------

Admin (Authenticated Client)
   |
   | 2. POST /api/admin/cities { "name": "Madrid", "countryCode": "ES", ... }
   |    Headers: Authorization: Bearer <jwt_token>
   v
JwtAuthenticationFilter (Spring Security Filter Chain)
   |
   | Extract Bearer token & validate HMAC signature & expiration date
   +---[Invalid/Expired/Missing]---> Abort filter chain -> 401 Unauthorized (RFC 7807)
   |
   +---[Valid Token]
          |
          | Set Authentication in SecurityContextHolder (Role: ROLE_ADMIN)
          v
   AdminCityController
          |
          | Validate payload constraints (@Valid @NotBlank)
          v
   CityService.createTrackedCity(cityDto)
          |
          | 1. Check duplicate city name in PostgreSQL -> 409 Conflict if exists
          | 2. Persist new City entity to tracked_cities table
          | 3. Proactively trigger WeatherClient to seed Redis cache immediately
          v
   Return 201 Created { "id": 9, "name": "Madrid", ... }
```

---

## 4. Architectural Decision Justifications

### 4.1 Redis vs. In-Memory Map (e.g., ConcurrentHashMap / Caffeine)

| Decision Driver | Local In-Memory Map | Distributed Cache (Redis) | Architectural Justification for WeatherPulse |
| :--- | :--- | :--- | :--- |
| **Stateless Horizontal Scaling** | **Fails**. Multiple backend instances maintain disjoint caches. City refreshes on Instance A leave B and C stale, causing client jitter and duplicate API costs. | **Passes**. Centralized cache guarantees all backend instances share an identical, synchronized weather state. | High enterprise readiness; enables zero-friction horizontal scaling behind load balancers. |
| **Process Restarts & Rolling Deploys** | **Fails**. Restarting the Spring Boot process wipes the cache, triggering a cold cache stampede against external API limits. | **Passes**. Redis runs out-of-process. Application redeployments do not purge the cache; restarted pods serve warm cache instantly. | Preserves external API rate limits during deployments and crash recoveries. |
| **TTL & Eviction Management** | **Manual / Complex**. Requires custom background eviction threads or third-party eviction algorithms consuming JVM heap memory. | **Built-in**. Native key-level TTLs with high-performance passive/active eviction (`volatile-ttl`). | Native TTL enforcement guarantees data expiry without manual housekeeping code. |
| **JVM Garbage Collection Impact** | Large objects residing in heap promote to Old Generation, increasing GC pause times. | External to JVM heap. Zero impact on backend JVM GC cycles and memory footprint. | Guarantees predictable p99 backend latency under heavy read load. |

---

### 4.2 Stateless JWT vs. Server-Side Session Authentication

| Decision Driver | Server-Side Sessions (JSESSIONID / Cookies) | Stateless JWT (Bearer Tokens) | Architectural Justification for WeatherPulse |
| :--- | :--- | :--- | :--- |
| **Session State Storage** | Requires server-side storage (JVM memory or Spring Session Redis repository) to track session IDs. | **Zero Server Storage**. The token itself contains all necessary claims, cryptographically signed with HMAC-SHA256. | Eliminates state storage overhead for an application that only has administrative operations. |
| **Scope of Authentication** | Over-engineered for a platform where 99.9% of user traffic is public and read-only. | **Strictly Scoped**. Public endpoints bypass security checks entirely; only `/api/admin/**` triggers token evaluation. | Preserves zero-overhead public performance while isolating admin operations. |
| **Horizontal Autoscaling** | Requires sticky sessions on the reverse proxy or clustered session replication across backend instances. | **Inherently Scalable**. Any backend instance with the shared secret key can validate incoming admin tokens without inter-node chatter. | Simplifies deployment topologies; supports zero-downtime rolling upgrades. |
| **Mobile & Cross-Client Portability** | Cookie management across disparate frontend environments (browsers, mobile apps, curl, automation scripts) can encounter CORS/SameSite complexities. | Simple HTTP header `Authorization: Bearer <token>`, universally compatible across clients and API test tools. | Clean separation between the React frontend and Spring Boot REST API. |
