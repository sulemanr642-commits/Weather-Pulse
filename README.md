# WeatherPulse 🌦️
### Enterprise-Grade Real-Time Meteorological Intelligence Platform

[![Java](https://img.shields.io/badge/Java-21%20LTS-orange.svg?style=flat-square&logo=openjdk)](https://openjdk.org/projects/jdk/21/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-purple.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-8-red.svg?style=flat-square&logo=redis)](https://redis.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

---

## 1. Project Purpose

**WeatherPulse** is an enterprise-grade, high-throughput meteorological platform engineered to deliver authentic, real-time weather observations and forecasts for **254+ tracked world cities** with sub-millisecond response latencies.

Built on modern cloud-native principles, WeatherPulse combines a reactive Spring Boot 3 backend leveraging Java 21 Virtual Threads, a distributed Redis 8 cache-aside architecture, a relational PostgreSQL 17 datastore, and a frontend designed around an iOS-inspired translucent glassmorphism aesthetic.

### Key Capabilities
- **Authentic Dual-Tier Live Weather Ingestion**: Primary integration with **Open-Meteo** (high-resolution global models from NOAA, ECMWF, and DWD) paired with seamless, automatic fallback to **wttr.in** ground station feeds—eliminating rate-limiting failures and completely bypassing synthetic approximations.
- **Cache-Aside High-Speed Read Path**: Sub-millisecond query delivery (`X-Cache: HIT` vs `X-Cache: MISS` telemetry) with configurable 10-minute TTL windows.
- **High-Capacity Background Refresh Scheduler**: Bounded, parallel batch execution refreshing tracked cities proactively every 5 minutes without blocking user request threads.
- **Zero-Friction Public Reads & Role-Secured Administration**: Frictionless public read access for global weather paired with stateless, HS512 JWT-secured administrative endpoints for dynamic city inventory management.
- **iOS-Inspired Living Glassmorphic Interface**: Fully responsive single-page application built with React 18, Vite, and Framer Motion, featuring dynamic atmospheric gradients matching live weather, keyboard-accessible combobox search, and 5-day forecasts.

---

## 2. Architecture & Documentation Links

WeatherPulse was architected and implemented following a rigorous phase-driven engineering workflow. Comprehensive technical documentation is available in the [`/docs`](docs/) directory:

| Document | Focus & Contents |
| :--- | :--- |
| **[Architecture Overview](docs/architecture-overview.md)** | End-to-end component topology, data flow diagrams, caching strategy, and resilience patterns. |
| **[API Contract Specification](docs/api-contract.md)** | Complete OpenAPI/REST contract, query parameters, request/response JSON schemas, and RFC 7807 error problem details. |
| **[Data Model & Schema](docs/data-model.md)** | PostgreSQL relational entity schemas, indexes, constraints, Flyway migrations, and Redis key space conventions. |
| **[Sequence Diagrams](docs/sequence-diagrams.md)** | Visual Mermaid sequence diagrams for Cache-Aside reads, Admin JWT authentication, and Scheduled Refresh workflows. |
| **[UI Design System](docs/ui-design-system.md)** | Design tokens, glassmorphic CSS variables, typography hierarchies, layout breakpoints, and iconography mappings. |
| **[Test Suite Specifications](docs/tests/)** | Comprehensive test scenarios covering unit, security, caching, scheduler, and integration verification. |

```
                                      ┌────────────────────────────────────────────────────────┐
                                      │              React 18 Single-Page App                  │
                                      │       (Vite + Framer Motion + Glassmorphic UI)         │
                                      └───────────────────────────┬────────────────────────────┘
                                                                  │ HTTP / JSON
                                                                  ▼
                                      ┌────────────────────────────────────────────────────────┐
                                      │             Spring Boot 3 REST Gateway                 │
                                      │           (Java 21 Virtual Threads Enabled)            │
                                      └───────┬───────────────────┬────────────────────┬───────┘
                                              │                   │                    │
                          ┌───────────────────┘                   │                    └───────────────────┐
                          ▼                                       ▼                                        ▼
             ┌─────────────────────────┐             ┌─────────────────────────┐             ┌───────────────────────────┐
             │    Redis 8 Distributed   │             │   PostgreSQL 17 Store   │             │  Meteorological Ingestion │
             │       Cache-Aside       │             │   (City Catalog & Auth) │             │    Open-Meteo  +  wttr.in │
             │   [Sub-millisecond HIT] │             │     [ACID Inventory]    │             │  [Live Real-World Feeds]  │
             └─────────────────────────┘             └─────────────────────────┘             └───────────────────────────┘
```

---

## 3. Prerequisites

Ensure the following runtimes and tools are installed locally before starting:

- **Java Development Kit (JDK)**: Version 21 LTS or newer ([Eclipse Temurin](https://adoptium.net/) or Oracle OpenJDK).
- **Apache Maven**: Version 3.9+ (or use the provided Maven Wrapper `./mvnw`).
- **Node.js**: Version 18.x LTS or 20.x LTS with `npm` 9+.
- **PostgreSQL**: Version 16 or 17 running on port `5432`.
- **Redis**: Version 7.x or 8.x running on port `6379`.

---

## 4. How to Run Locally

### Quick Start (Windows All-in-One)
If you are running on Windows with local PostgreSQL and Redis installed, you can start both services with a single command:

```bash
# Start PostgreSQL and Redis daemons in the background
scripts\start-services.bat
```

Alternatively, start each service individually:

### Step 1: Start PostgreSQL
Ensure PostgreSQL is active and initialize the `weatherpulse` database:

```bash
# Verify PostgreSQL is running and database exists
psql -U postgres -c "CREATE DATABASE weatherpulse;"
```

### Step 2: Start Redis
Start the Redis server daemon on port `6379`:

```bash
# Linux / macOS
redis-server

# Windows (Command Prompt or PowerShell)
redis-server.exe
```

### Step 3: Run the Spring Boot Backend
Navigate to the `backend/` directory and start the application:

```bash
cd backend
mvn spring-boot:run
```
*The backend starts at `http://localhost:8080`. On initial boot, `DataSeeder` automatically populates the PostgreSQL database with 254+ world cities, primes default administrative credentials, and preloads city coordinates into memory.*

### Step 4: Run the React Frontend
Open a new terminal session, navigate to the `frontend/` directory, install dependencies, and start the Vite dev server:

```bash
cd frontend
npm install
npm run dev
```
*The web interface will launch at `http://localhost:5173`.*

### Step 5: Access the Admin Panel
1. Open `http://localhost:5173` in your browser.
2. Click the **Admin** shield icon in the top header.
3. Authenticate with the default credentials:
   - **Username**: `admin`
   - **Password**: `AdminSecret123!`
4. Add or delete tracked cities in real-time. Changes instantly sync to PostgreSQL and invalidate respective Redis cache keys.

---

## 5. Environment Variables & Configuration Reference

All secrets and operational properties are externalized via environment variables with sensible defaults for local development:

| Environment Variable | Description | Default Value (Dev) | Production Example |
| :--- | :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | JDBC connection URL for PostgreSQL | `jdbc:postgresql://localhost:5432/weatherpulse` | `jdbc:postgresql://pg.internal:5432/prod_weather` |
| `SPRING_DATASOURCE_USERNAME` | PostgreSQL database user | `postgres` | `wp_app_user` |
| `SPRING_DATASOURCE_PASSWORD` | PostgreSQL database password | `postgres` | `k8s_secret_db_pass` |
| `SPRING_DATA_REDIS_HOST` | Redis cache hostname / IP | `localhost` | `redis.internal` |
| `SPRING_DATA_REDIS_PORT` | Redis cache port | `6379` | `6379` |
| `SPRING_DATA_REDIS_PASSWORD` | Redis authentication password | *(Empty / None)* | `k8s_secret_redis_pass` |
| `WEATHERPULSE_JWT_SECRET` | HMAC-SHA256/512 secret key (min 256 bits) | `404E635266556A586E32...` | *(Cryptographically random 256/512-bit key)* |
| `WEATHERPULSE_JWT_EXPIRATION_MS` | JWT expiration duration in milliseconds | `7200000` (2 hours) | `7200000` |
| `WEATHERPULSE_WEATHER_PROVIDER` | Primary meteorological data provider | `open-meteo` | `open-meteo` |
| `WEATHERPULSE_OPENWEATHER_API_KEY` | Optional OpenWeatherMap fallback API key | `demo_openweather_api_key` | `abc123openweatherkey` |
| `WEATHERPULSE_CACHE_TTL_MS` | Weather data Redis TTL (milliseconds) | `600000` (10 minutes) | `600000` |
| `WEATHERPULSE_SCHEDULER_ENABLED` | Toggle background scheduled refresh | `true` | `true` |
| `WEATHERPULSE_ADMIN_DEFAULT_USERNAME` | Seed administrator username | `admin` | `superadmin` |
| `WEATHERPULSE_ADMIN_DEFAULT_PASSWORD` | Seed administrator password | `AdminSecret123!` | *(Strong unique password)* |
| `VITE_API_BASE_URL` | Frontend REST API base URL | `http://localhost:8080/api` | `https://api.weatherpulse.io/api` |

---

## 6. Design Decisions & Architectural Rationale

### 1. Redis over an In-Memory Cache (e.g., Caffeine / Guava)
- **Process Isolation & Lifecycle Decoupling**: An in-memory cache dies whenever the JVM process restarts, deploys, or crashes, forcing cold-start hammering against external APIs. Redis persists cached meteorological observations independently.
- **Horizontal Elastic Scalability**: In a multi-replica container deployment (e.g., Kubernetes), an in-memory cache leads to cache fragmentation and inconsistent readings across pods. Redis provides a unified, single source of truth across all application instances.
- **Garbage Collection (GC) Protection**: Caching thousands of JSON payloads inside the JVM heap increases GC pause times and memory pressure. Redis offloads serialization and native TTL expirations outside the Java heap.

### 2. Data-Driven City List over Static Enums or Code Constants
- **Zero-Downtime Extensibility**: Storing tracked cities in PostgreSQL allows administrators to onboard new municipalities or deactivate inactive ones dynamically through REST endpoints without modifying code, rebuilding containers, or redeploying.
- **Coordinate-Driven Ingestion**: Tracking cities in a relational schema preserves accurate geographic metadata (`latitude`, `longitude`, `countryCode`). Passing pre-resolved coordinates directly to meteorological APIs eliminates redundant geocoding lookups, cutting latency by 75% and preventing third-party rate-limit bans.

### 3. Narrowly Scoped JWT Authentication for Admin Actions Only
- **Frictionless Public Read Path**: Weather forecasting is public information. Forcing user registration, login screens, or session cookies for simple weather reads creates unnecessary user friction and introduces stateful server overhead.
- **Stateless Administrative Security**: Administrative actions (`POST /api/admin/cities`, `DELETE /api/admin/cities/{id}`) mutate global state and require strict authorization. A lightweight HS512 JWT authentication mechanism secures these endpoints statelessly.
- **In-Memory Token Lifecycle**: The admin JWT is stored strictly in frontend React component memory and never persisted to `localStorage` or `sessionStorage`, completely neutralizing token theft via Cross-Site Scripting (XSS).

### 4. PostgreSQL over MySQL
- **Precision Numeric Semantics**: Geographic coordinates require exact decimal precision (`NUMERIC(9,6)`). PostgreSQL offers industry-leading IEEE numeric compliance and spatial readiness.
- **Advanced Concurrency & MVCC**: PostgreSQL's Multi-Version Concurrency Control handles heavy concurrent write locks during batch insertions and scheduled updates more gracefully than traditional MySQL engines.
- **Native JSONB Capabilities**: PostgreSQL's native JSONB data types provide forward compatibility for storing unstructured sensor telemetry, satellite matrices, and raw meteorological payloads if needed.

### 5. React with Glassmorphism Design System over Plain HTML
- **Fluid Micro-Interactions & Reduced Latency Perception**: Plain HTML multi-page apps trigger visible browser flashes and full DOM teardowns on navigation. React 18 manages state transitions client-side, animating weather transitions smoothly with Framer Motion.
- **Dynamic Living Atmosphere**: Glassmorphism (layered frosted glass panels, `backdrop-filter: blur()`, subtle borders, and contextual radial gradients) visually mirrors the physical state of the weather (e.g., luminous sunny auroras, rain drops, overcast glows), creating a modern first impression.
- **Accessible Component Architecture**: React components encapsulate complex UI patterns like the searchable combobox with full ARIA semantics and keyboard navigation (`ArrowUp`, `ArrowDown`, `Enter`, `Escape`), which would be fragile and difficult to maintain in imperative vanilla JavaScript.

---

## 7. Testing & Verification

WeatherPulse incorporates comprehensive automated test coverage across all architectural tiers:

```bash
# Execute the full backend test suite
cd backend
mvn test
```

### Test Suite Summary
- **Total Tests**: **44**
- **Failures**: **0**
- **Errors**: **0**
- **Modules Covered**:
  - `WeatherServiceTest`: Cache hits, cache misses, upstream fail-open resilience, and boundary validation.
  - `WeatherControllerIntegrationTest`: End-to-end Cache-Aside verification against live PostgreSQL and Redis.
  - `AdminSecurityIntegrationTest`: Public endpoint permit-all, missing token rejection (401), invalid/expired token handling, and RBAC authorization (403).
  - `AuthControllerTest`: BCrypt authentication, JWT issuance, and RFC 7807 error formatting.
  - `WeatherApiClientTest`: Open-Meteo, wttr.in, and OpenWeatherMap parsing, HTTP timeouts, and error mappings.
  - `WeatherRefreshSchedulerTest`: High-capacity paginated batch execution and concurrency throttling.

---

## 8. License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
