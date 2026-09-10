# WeatherPulse Sequence Diagrams (v2)

This document provides runtime interaction sequences for the three core operational flows in WeatherPulse. Both **PlantUML** source (for enterprise architectural rendering) and **Mermaid** diagrams (for immediate IDE and markdown rendering) are provided.

---

## 1. Flow (a): Scheduler-Triggered Proactive Refresh Flow

A dedicated background task (`@Scheduled`) wakes up every 5 minutes, iterates through all active cities in PostgreSQL, retrieves current conditions from OpenWeatherMap, updates Redis with a fresh 10-minute TTL, and isolates errors on a per-city basis without interrupting the loop.

### 1.1 PlantUML Specification

```plantuml
@startuml
autonumber
skinparam BoxPadding 10
skinparam ParticipantPadding 10

box "WeatherPulse Application" #LightCyan
participant "Scheduler\n[ThreadPoolTaskScheduler]" as Scheduler
participant "WeatherRefreshScheduler\n[@Scheduled Service]" as Job
participant "CityRepository\n[Spring Data JPA]" as CityRepo
participant "WeatherClient\n[HTTP RestClient]" as WeatherClient
participant "RedisCache\n[RedisTemplate]" as Redis
end box

database "PostgreSQL Database\n[tracked_cities]" as DB
boundary "OpenWeatherMap API\n[External Provider]" as ExternalAPI

== Scheduled Background Execution (Every 5 Minutes) ==

Scheduler -> Job : executeScheduledRefresh()
activate Job

Job -> CityRepo : findByIsActiveTrue()
activate CityRepo
CityRepo -> DB : SELECT * FROM tracked_cities WHERE is_active = true
DB --> CityRepo : List<City>
CityRepo --> Job : List<City>
deactivate CityRepo

loop for each City in List<City>
    Job -> WeatherClient : fetchCurrentWeather(city.getName(), city.getCountryCode())
    activate WeatherClient
    
    alt Successful External Fetch
        WeatherClient -> ExternalAPI : GET /data/2.5/weather?q={city},{country}&appid={apiKey}&units=metric
        activate ExternalAPI
        ExternalAPI --> WeatherClient : 200 OK (OpenWeatherJsonPayload)
        deactivate ExternalAPI
        
        WeatherClient --> Job : WeatherResponseDto
        deactivate WeatherClient
        
        Job -> Redis : set("weatherpulse:weather:" + city.getName().toLowerCase(), WeatherResponseDto, TTL=10m)
        activate Redis
        Redis --> Job : OK
        deactivate Redis
        
        Job -> Job : log.info("Successfully refreshed weather for city={}", city.getName())

    else Upstream Provider Outage / Timeout / Rate Limit
        activate WeatherClient
        WeatherClient -> ExternalAPI : GET /data/2.5/weather?...
        activate ExternalAPI
        ExternalAPI --> WeatherClient : 5xx / 429 / Connect Timeout
        deactivate ExternalAPI
        
        WeatherClient --> Job : throw ExternalWeatherApiException
        deactivate WeatherClient
        
        Job -> Job : log.error("Failed to refresh weather for city={}: {}. Retaining existing cache.", city.getName(), ex.getMessage())
        note right of Job
            Bulkhead / Fault Isolation:
            Failure for city N does NOT evict existing Redis cache
            and does NOT abort processing for subsequent cities.
        end note
    end
end

Job -> Job : log.info("Completed scheduled weather refresh cycle.")
deactivate Job

@enduml
```

### 1.2 Interactive Mermaid Preview

```mermaid
sequenceDiagram
    autonumber
    participant Scheduler as ThreadPool Scheduler
    participant Job as WeatherRefreshScheduler
    participant CityRepo as CityRepository
    participant DB as PostgreSQL DB
    participant WeatherClient as WeatherClient
    participant ExternalAPI as OpenWeatherMap API
    participant Redis as Redis Cache

    Note over Scheduler, Job: Triggered every 5 minutes (300,000 ms)
    Scheduler->>Job: executeScheduledRefresh()
    activate Job
    Job->>CityRepo: findByIsActiveTrue()
    activate CityRepo
    CityRepo->>DB: SELECT * FROM tracked_cities WHERE is_active = true
    DB-->>CityRepo: List<City>
    CityRepo-->>Job: List<City>
    deactivate CityRepo

    loop For Each Tracked City
        Job->>WeatherClient: fetchCurrentWeather(city, countryCode)
        activate WeatherClient
        alt HTTP 200 Success
            WeatherClient->>ExternalAPI: GET /data/2.5/weather?q={city}&appid={key}
            ExternalAPI-->>WeatherClient: 200 OK (JSON Payload)
            WeatherClient-->>Job: WeatherResponseDto
            deactivate WeatherClient
            Job->>Redis: SET weatherpulse:weather:{city} DTO (TTL=10m)
            Redis-->>Job: OK
            Job->>Job: Log success
        else HTTP 5xx / 429 / Timeout
            WeatherClient->>ExternalAPI: GET /data/2.5/weather...
            ExternalAPI-->>WeatherClient: 503 Service Unavailable / Timeout
            WeatherClient-->>Job: Throw ExternalWeatherApiException
            Job->>Job: Log error & preserve existing cache (Bulkhead)
        end
    end
    Job->>Job: Log completion of refresh cycle
    deactivate Job
```

---

## 2. Flow (b): User-Triggered Reactive Read Flow (Cache-First)

End-users browsing the public React UI trigger read requests. Requests check Redis first. A cache hit returns in <5ms with `X-Cache: HIT`. A cold cache miss validates the city against PostgreSQL, fetches from OpenWeatherMap, updates Redis, and returns with `X-Cache: MISS`.

### 2.1 PlantUML Specification

```plantuml
@startuml
autonumber
skinparam BoxPadding 10
skinparam ParticipantPadding 10

actor "End User" as User
participant "React Frontend\n[Browser]" as UI

box "WeatherPulse Application" #LightCyan
participant "WeatherController\n[REST Controller]" as Controller
participant "WeatherService\n[Service Layer]" as Service
participant "RedisCache\n[Distributed Cache]" as Redis
participant "CityRepository\n[Spring Data JPA]" as CityRepo
participant "WeatherClient\n[External Client]" as WeatherClient
end box

database "PostgreSQL DB" as DB
boundary "OpenWeatherMap API" as ExternalAPI

User -> UI : Selects City (e.g., "Tokyo")
activate UI
UI -> Controller : GET /api/weather/Tokyo
activate Controller

Controller -> Controller : Validate path variable (format, length)
Controller -> Service : getWeatherForCity("tokyo")
activate Service

Service -> Redis : get("weatherpulse:weather:tokyo")
activate Redis

alt Scenario B.1: Cache Hit (Common Case > 99%)
    Redis --> Service : Cached WeatherResponseDto
    deactivate Redis
    Service -> Service : log.debug("Cache hit for city: tokyo")
    Service --> Controller : WeatherResponseDto
    Controller --> UI : HTTP 200 OK [Header: X-Cache: HIT] (Weather JSON)
    UI -> UI : Render WeatherCard with Framer Motion transition

else Scenario B.2: Cache Miss (Cold Start or Key Expired)
    activate Redis
    Redis --> Service : null (Cache Miss)
    deactivate Redis
    Service -> Service : log.warn("Cache miss for city: tokyo. Resolving from upstream.")
    
    Service -> CityRepo : findByNameIgnoreCase("tokyo")
    activate CityRepo
    CityRepo -> DB : SELECT * FROM tracked_cities WHERE LOWER(name) = 'tokyo' AND is_active = true
    DB --> CityRepo : Optional<City>
    CityRepo --> Service : Optional<City>
    deactivate CityRepo
    
    alt City is NOT tracked in Database
        Service --> Controller : throw CityNotFoundException("City not tracked")
        Controller --> UI : HTTP 404 Not Found (RFC 7807 Problem Detail)
        UI -> UI : Display error banner
    else City is tracked in Database
        Service -> WeatherClient : fetchCurrentWeather("Tokyo", "JP")
        activate WeatherClient
        
        alt External API Call Succeeds
            WeatherClient -> ExternalAPI : GET /data/2.5/weather?q=Tokyo,JP&appid={key}
            activate ExternalAPI
            ExternalAPI --> WeatherClient : 200 OK (Payload)
            deactivate ExternalAPI
            WeatherClient --> Service : WeatherResponseDto
            deactivate WeatherClient
            
            Service -> Redis : set("weatherpulse:weather:tokyo", WeatherResponseDto, TTL=10m)
            activate Redis
            Redis --> Service : OK
            deactivate Redis
            
            Service --> Controller : WeatherResponseDto
            Controller --> UI : HTTP 200 OK [Header: X-Cache: MISS] (Weather JSON)
            UI -> UI : Render WeatherCard with Framer Motion transition
        else External API Outage / Failure
            activate WeatherClient
            WeatherClient -> ExternalAPI : GET /data/2.5/weather?...
            activate ExternalAPI
            ExternalAPI --> WeatherClient : 5xx Outage / Timeout
            deactivate ExternalAPI
            WeatherClient --> Service : throw ExternalWeatherApiException
            deactivate WeatherClient
            
            Service --> Controller : throw UpstreamProviderException
            Controller --> UI : HTTP 502 Bad Gateway (RFC 7807 Problem Detail)
            UI -> UI : Display graceful error fallback state
        end
    end
end

deactivate Service
deactivate Controller
deactivate UI

@enduml
```

### 2.2 Interactive Mermaid Preview

```mermaid
sequenceDiagram
    autonumber
    actor User as End User
    participant UI as React UI (Browser)
    participant Controller as WeatherController
    participant Service as WeatherService
    participant Redis as Redis Cache
    participant CityRepo as CityRepository
    participant Client as WeatherClient
    participant ExternalAPI as OpenWeatherMap

    User->>UI: Selects city "Tokyo"
    activate UI
    UI->>Controller: GET /api/weather/Tokyo
    activate Controller
    Controller->>Service: getWeatherForCity("tokyo")
    activate Service

    Service->>Redis: GET weatherpulse:weather:tokyo
    alt Cache Hit (>99% requests)
        Redis-->>Service: WeatherResponseDto
        Service-->>Controller: WeatherResponseDto
        Controller-->>UI: 200 OK (X-Cache: HIT) + Weather JSON
        UI->>UI: Animate WeatherCard view
    else Cache Miss
        Redis-->>Service: null (Key expired / cold start)
        Service->>CityRepo: findByNameIgnoreCase("tokyo")
        CityRepo-->>Service: City Found
        Service->>Client: fetchCurrentWeather("Tokyo", "JP")
        activate Client
        Client->>ExternalAPI: GET /data/2.5/weather?q=Tokyo,JP
        ExternalAPI-->>Client: 200 OK JSON
        Client-->>Service: WeatherResponseDto
        deactivate Client
        Service->>Redis: SET weatherpulse:weather:tokyo DTO (TTL=10m)
        Service-->>Controller: WeatherResponseDto
        Controller-->>UI: 200 OK (X-Cache: MISS) + Weather JSON
        UI->>UI: Animate WeatherCard view
    end
    deactivate Service
    deactivate Controller
    deactivate UI
```

---

## 3. Flow (c): Admin Authentication & City Management Flow

This flow illustrates administrative operations: authenticating via `POST /api/auth/login` to obtain a signed JWT, followed by a secured mutation `POST /api/admin/cities` with the `JwtAuthenticationFilter` verifying tokens along both acceptance and rejection execution branches.

### 3.1 PlantUML Specification

```plantuml
@startuml
autonumber
skinparam BoxPadding 10
skinparam ParticipantPadding 10

actor "Administrator" as Admin
participant "React Admin Modal" as AdminUI

box "WeatherPulse Security & Web Tier" #LightCyan
participant "AuthController\n[/api/auth/login]" as AuthController
participant "JwtAuthenticationFilter\n[OncePerRequestFilter]" as JwtFilter
participant "JwtTokenService\n[Token Operations]" as JwtService
participant "AdminCityController\n[/api/admin/cities]" as AdminController
end box

box "WeatherPulse Service & Data Tier" #Lavender
participant "AuthenticationManager\n[Spring Security]" as AuthManager
participant "AdminUserService\n[UserDetailsService]" as UserService
participant "CityService\n[City Domain Logic]" as CityService
participant "CityRepository\n[JPA Repository]" as CityRepo
participant "RedisCache\n[Cache Ingestion]" as Redis
end box

database "PostgreSQL Database\n[admin_users, tracked_cities]" as DB

== Step 1: Admin Login & JWT Issuance ==

Admin -> AdminUI : Enters username and password
activate AdminUI
AdminUI -> AuthController : POST /api/auth/login\n{"username": "admin", "password": "SuperSecretPassword123!"}
activate AuthController

AuthController -> AuthManager : authenticate(UsernamePasswordAuthenticationToken)
activate AuthManager
AuthManager -> UserService : loadUserByUsername("admin")
activate UserService
UserService -> DB : SELECT * FROM admin_users WHERE username = 'admin'
DB --> UserService : AdminUser (with BCrypt hash)
UserService --> AuthManager : UserDetails

AuthManager -> AuthManager : passwordEncoder.matches(rawPassword, storedHash)

alt Credentials Invalid
    AuthManager --> AuthController : throw BadCredentialsException
    AuthController --> AdminUI : HTTP 401 Unauthorized (RFC 7807: "Invalid credentials")
    AdminUI -> AdminUI : Show "Authentication Failed" error badge
else Credentials Valid
    AuthManager --> AuthController : Authentication (Authenticated = true, ROLE_ADMIN)
    deactivate UserService
    deactivate AuthManager
    
    AuthController -> JwtService : generateToken(authentication)
    activate JwtService
    JwtService -> JwtService : Sign JWT with HMAC-SHA256\nClaims: {sub: "admin", role: "ROLE_ADMIN", exp: +2h}
    JwtService --> AuthController : "<jwt_token_string>"
    deactivate JwtService
    
    AuthController --> AdminUI : HTTP 200 OK\n{"token": "<jwt_token_string>", "tokenType": "Bearer", "expiresIn": 7200}
    AdminUI -> AdminUI : Store token in secure memory/session state
end
deactivate AuthController

== Step 2: Secured Admin City Addition (POST /api/admin/cities) ==

Admin -> AdminUI : Submits new city: "Madrid", "ES", 40.4168, -3.7038
AdminUI -> JwtFilter : POST /api/admin/cities\nHeader: Authorization: Bearer <jwt_token_string>\nBody: {"name": "Madrid", "countryCode": "ES", ...}
activate JwtFilter

JwtFilter -> JwtFilter : Extract Bearer token from header

alt Rejection Branch: Missing / Expired / Tampered JWT
    JwtFilter -> JwtService : validateToken(token)
    activate JwtService
    JwtService --> JwtFilter : throw JwtException (SignatureInvalid / ExpiredJwtException)
    deactivate JwtService
    
    JwtFilter -> JwtFilter : log.warn("Rejected unauthorized admin attempt: {}", reason)
    JwtFilter --> AdminUI : HTTP 401 Unauthorized (RFC 7807: "Token has expired or is invalid")
    note right of JwtFilter
        Request is terminated immediately.
        AdminCityController is NEVER invoked.
    end note
    AdminUI -> AdminUI : Prompt user to re-login

else Acceptance Branch: Valid JWT
    JwtFilter -> JwtService : validateToken(token)
    activate JwtService
    JwtService --> JwtFilter : Valid (claims parsed)
    deactivate JwtService
    
    JwtFilter -> JwtFilter : Set SecurityContextHolder.setAuthentication(auth)
    JwtFilter -> AdminController : forward to POST /api/admin/cities
    activate AdminController
    
    AdminController -> CityService : addTrackedCity(cityDto)
    activate CityService
    
    CityService -> CityRepo : findByNameIgnoreCase("Madrid")
    activate CityRepo
    CityRepo -> DB : SELECT * FROM tracked_cities WHERE LOWER(name) = 'madrid'
    DB --> CityRepo : null (no collision)
    deactivate CityRepo
    
    CityService -> CityRepo : save(new City("Madrid", "ES", ...))
    activate CityRepo
    CityRepo -> DB : INSERT INTO tracked_cities ... RETURNING id
    DB --> CityRepo : City entity (id = 9)
    CityRepo --> CityService : City
    deactivate CityRepo
    
    CityService -> CityService : log.info("Admin created new tracked city: Madrid (id=9)")
    CityService --> AdminController : CityResponseDto
    deactivate CityService
    
    AdminController --> AdminUI : HTTP 201 Created\n{"id": 9, "name": "Madrid", "countryCode": "ES", ...}
    deactivate AdminController
    AdminUI -> AdminUI : Update city list and show success toast notification
end

deactivate JwtFilter
deactivate AdminUI

@enduml
```

### 3.2 Interactive Mermaid Preview

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Administrator
    participant UI as React Admin Modal
    participant Auth as AuthController (/api/auth/login)
    participant Filter as JwtAuthenticationFilter
    participant JwtService as JwtTokenService
    participant AdminCtrl as AdminCityController
    participant CitySvc as CityService
    participant DB as PostgreSQL DB

    Note over Admin, Auth: Step 1: Admin Login
    Admin->>UI: Enter credentials
    UI->>Auth: POST /api/auth/login (username, password)
    Auth->>DB: Fetch user & verify BCrypt hash
    alt Invalid Credentials
        Auth-->>UI: 401 Unauthorized (Invalid credentials)
    else Valid Credentials
        Auth->>JwtService: generateToken(username, role)
        JwtService-->>Auth: JWT String (HMAC-SHA256, 2h TTL)
        Auth-->>UI: 200 OK { token, expiresIn: 7200 }
        UI->>UI: Store token in application memory
    end

    Note over Admin, DB: Step 2: Secured Admin Action
    Admin->>UI: Submit new city "Madrid"
    UI->>Filter: POST /api/admin/cities + Bearer Token
    activate Filter
    alt Token Missing / Expired / Invalid
        Filter-->>UI: 401 Unauthorized (RFC 7807 Problem Detail)
        Note over Filter: Request rejected immediately before Controller
    else Token Valid
        Filter->>Filter: Set SecurityContextHolder (ROLE_ADMIN)
        Filter->>AdminCtrl: POST /api/admin/cities
        activate AdminCtrl
        AdminCtrl->>CitySvc: addTrackedCity(cityDto)
        CitySvc->>DB: INSERT INTO tracked_cities (Madrid, ES, ...)
        DB-->>CitySvc: City record (id=9)
        CitySvc-->>AdminCtrl: CityResponseDto
        AdminCtrl-->>UI: 201 Created { id: 9, name: "Madrid" }
        deactivate AdminCtrl
        UI->>UI: Update city dropdown & trigger toast
    end
    deactivate Filter
```
