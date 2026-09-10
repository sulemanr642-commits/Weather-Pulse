# WeatherPulse API Contract & Specifications (v2)

This document defines the formal HTTP REST interface for WeatherPulse backend services, covering public viewing endpoints and secured administrative endpoints. All representations comply with JSON standards and RFC 7807 problem details for errors.

---

## 1. Global Standards & Conventions

- **Content Type**: `application/json;charset=UTF-8`
- **Date/Time Standard**: ISO-8601 UTC string format (e.g., `2026-09-10T17:15:00Z`).
- **Telemetry Response Headers**:
  - `X-Cache`: `HIT` (served directly from Redis) or `MISS` (resolved upstream on demand).
  - `X-Correlation-ID`: UUID tracking request execution across application logs.
- **Error Standard**: Adheres strictly to **RFC 7807 (Problem Details for HTTP APIs)** for all 4xx and 5xx errors.
- **Authentication Header**: Administrative endpoints require `Authorization: Bearer <jwt_token>`.

---

## 2. Public Endpoints (No Authentication Required)

### 2.1 GET `/api/cities`

Retrieves all active tracked cities for the UI dropdown.

#### Request Specification
- **Method**: `GET`
- **Path**: `/api/cities`
- **Headers**: `Accept: application/json`

#### Response Specifications

##### Status 200 OK
Returns the list of active tracked cities ordered alphabetically by name.

```json
[
  {
    "id": 1,
    "name": "London",
    "countryCode": "GB"
  },
  {
    "id": 2,
    "name": "New York",
    "countryCode": "US"
  },
  {
    "id": 3,
    "name": "Paris",
    "countryCode": "FR"
  },
  {
    "id": 4,
    "name": "Tokyo",
    "countryCode": "JP"
  }
]
```

##### Status 500 Internal Server Error
```json
{
  "type": "https://weatherpulse.internal/errors/internal-server-error",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "Failed to retrieve tracked cities due to an unexpected database error.",
  "instance": "/api/cities",
  "timestamp": "2026-09-10T17:20:00Z"
}
```

---

### 2.2 GET `/api/weather/{city}`

Retrieves current meteorological observations for a specific tracked city. Implements the cache-first pattern.

#### Request Specification
- **Method**: `GET`
- **Path**: `/api/weather/{city}`
- **Path Parameter**:
  - `city` (string, required): Case-insensitive city name (e.g., `Tokyo`, `london`, `New York`).
  - **Validation Constraints**: Length 2 to 100 characters; regex `^[a-zA-Z\s\-\.\']+$`.
- **Headers**: `Accept: application/json`

#### Response Specifications

##### Status 200 OK
Weather observations successfully resolved.

**Headers**:
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Cache: HIT
X-Correlation-ID: 7b31e9c2-570a-4847-bcf9-53697a82b9ce
```

**Payload**:
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

##### Status 400 Bad Request
Returned when input validation fails (invalid characters or length boundary violations).
```json
{
  "type": "https://weatherpulse.internal/errors/bad-request",
  "title": "Bad Request",
  "status": 400,
  "detail": "City name must contain only alphabetic characters, spaces, hyphens, and apostrophes.",
  "instance": "/api/weather/London123!",
  "timestamp": "2026-09-10T17:20:01Z"
}
```

##### Status 404 Not Found
Returned when the requested city is not tracked in the system.
```json
{
  "type": "https://weatherpulse.internal/errors/city-not-found",
  "title": "City Not Found",
  "status": 404,
  "detail": "The city 'Atlantis' is not currently tracked by WeatherPulse.",
  "instance": "/api/weather/Atlantis",
  "timestamp": "2026-09-10T17:20:02Z"
}
```

##### Status 502 Bad Gateway
Returned when the cache has expired and the upstream OpenWeatherMap API returns an error or timeout.
```json
{
  "type": "https://weatherpulse.internal/errors/upstream-error",
  "title": "Upstream Weather Provider Unavailable",
  "status": 502,
  "detail": "The external weather service is temporarily unavailable. Please retry shortly.",
  "instance": "/api/weather/Tokyo",
  "timestamp": "2026-09-10T17:20:03Z"
}
```

---

## 3. Authentication Endpoint (Public)

### 3.1 POST `/api/auth/login`

Validates administrator credentials against the `admin_users` table using BCrypt password matching, and issues a signed JWT.

#### Request Specification
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Headers**:
  - `Content-Type: application/json`
  - `Accept: application/json`

**Request Body**:
```json
{
  "username": "admin",
  "password": "AdminSecret123!"
}
```

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `username` | String | Required, 3-50 chars | Registered administrative account username. |
| `password` | String | Required, 8-100 chars | Plaintext password to verify against stored BCrypt hash. |

#### Response Specifications

##### Status 200 OK
Authentication successful. Returns bearer token and expiry metadata.

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsInJvbGUiOiJST0xFX0FETUlOIiwiaWF0IjoxNzg5MDYzMjAwLCJleHAiOjE3ODkwNzA0MDB9.EXAMPLE_SIGNATURE",
  "tokenType": "Bearer",
  "expiresIn": 7200,
  "username": "admin",
  "role": "ROLE_ADMIN"
}
```

##### Status 400 Bad Request
Missing or malformed request body fields.
```json
{
  "type": "https://weatherpulse.internal/errors/validation-error",
  "title": "Validation Error",
  "status": 400,
  "detail": "Username and password must not be blank.",
  "instance": "/api/auth/login",
  "timestamp": "2026-09-10T17:20:04Z"
}
```

##### Status 401 Unauthorized
Invalid username or password mismatch.
```json
{
  "type": "https://weatherpulse.internal/errors/invalid-credentials",
  "title": "Unauthorized",
  "status": 401,
  "detail": "Invalid username or password provided.",
  "instance": "/api/auth/login",
  "timestamp": "2026-09-10T17:20:05Z"
}
```

---

## 4. Secured Administrative Endpoints (JWT Required)

All endpoints under `/api/admin/**` require the `Authorization: Bearer <token>` header.

### 4.1 POST `/api/admin/cities`

Registers a new city to be actively monitored by WeatherPulse.

#### Request Specification
- **Method**: `POST`
- **Path**: `/api/admin/cities`
- **Headers**:
  - `Authorization: Bearer <jwt_token>`
  - `Content-Type: application/json`
  - `Accept: application/json`

**Request Body**:
```json
{
  "name": "Madrid",
  "countryCode": "ES",
  "latitude": 40.416775,
  "longitude": -3.703790
}
```

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Required, 2-100 chars, unique | Canonical name of the city. |
| `countryCode` | String | Required, ISO 3166-1 alpha-2 (2 chars, uppercase) | Country identifier (e.g., `ES`, `US`). |
| `latitude` | Number | Required, range [-90.0, 90.0] | North/South geographic coordinate. |
| `longitude` | Number | Required, range [-180.0, 180.0] | East/West geographic coordinate. |

#### Response Specifications

##### Status 201 Created
City successfully persisted and registered for tracking. Immediately available in the city list.

```json
{
  "id": 9,
  "name": "Madrid",
  "countryCode": "ES",
  "latitude": 40.416775,
  "longitude": -3.703790,
  "isActive": true,
  "createdAt": "2026-09-10T17:20:06Z"
}
```

##### Status 401 Unauthorized
Token is missing, tampered with, or expired.
```json
{
  "type": "https://weatherpulse.internal/errors/unauthorized",
  "title": "Full Authentication Required",
  "status": 401,
  "detail": "The access token provided has expired or is invalid.",
  "instance": "/api/admin/cities",
  "timestamp": "2026-09-10T17:20:07Z"
}
```

##### Status 403 Forbidden
Token is cryptographically valid, but the user lacks the required `ROLE_ADMIN` authority.
```json
{
  "type": "https://weatherpulse.internal/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "You do not have permission to execute this administrative operation.",
  "instance": "/api/admin/cities",
  "timestamp": "2026-09-10T17:20:08Z"
}
```

##### Status 409 Conflict
A city with the identical name already exists in the system.
```json
{
  "type": "https://weatherpulse.internal/errors/duplicate-city",
  "title": "Conflict",
  "status": 409,
  "detail": "City 'Madrid' is already being tracked.",
  "instance": "/api/admin/cities",
  "timestamp": "2026-09-10T17:20:09Z"
}
```

---

### 4.2 DELETE `/api/admin/cities/{id}`

Removes or deactivates a tracked city by surrogate primary key ID.

#### Request Specification
- **Method**: `DELETE`
- **Path**: `/api/admin/cities/{id}`
- **Path Parameter**:
  - `id` (integer, required): The surrogate ID of the city to delete.
- **Headers**:
  - `Authorization: Bearer <jwt_token>`
  - `Accept: application/json`

#### Response Specifications

##### Status 204 No Content
City successfully removed from active tracking. The corresponding Redis cache key is evicted.

##### Status 401 Unauthorized
Missing or expired JWT bearer token.
```json
{
  "type": "https://weatherpulse.internal/errors/unauthorized",
  "title": "Full Authentication Required",
  "status": 401,
  "detail": "Full authentication is required to access this resource.",
  "instance": "/api/admin/cities/9",
  "timestamp": "2026-09-10T17:20:10Z"
}
```

##### Status 403 Forbidden
Token lacks administrative authority.
```json
{
  "type": "https://weatherpulse.internal/errors/forbidden",
  "title": "Forbidden",
  "status": 403,
  "detail": "Access is denied.",
  "instance": "/api/admin/cities/9",
  "timestamp": "2026-09-10T17:20:11Z"
}
```

##### Status 404 Not Found
City ID does not exist in the database.
```json
{
  "type": "https://weatherpulse.internal/errors/city-not-found",
  "title": "City Not Found",
  "status": 404,
  "detail": "No tracked city exists with ID: 99.",
  "instance": "/api/admin/cities/99",
  "timestamp": "2026-09-10T17:20:12Z"
}
```
