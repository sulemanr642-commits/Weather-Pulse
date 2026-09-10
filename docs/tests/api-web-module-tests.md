# Test & Edge Case Specifications: API Controllers & Exception Handling Module

This document defines the test matrix, automated test cases, and edge cases for the **Web Controller & Exception Handling Module** (`CityController`, `WeatherController`, `GlobalExceptionHandler`, `ProblemDetails`).

---

## 1. Module Scope & Responsibilities
- Expose REST endpoints: `GET /api/cities` and `GET /api/weather/{city}`.
- Perform strict syntactic validation on path variables and query parameters.
- Provide HTTP caching telemetry via response header `X-Cache: HIT` or `X-Cache: MISS`.
- Provide centralized, production-grade exception handling enforcing **RFC 7807 (Problem Details for HTTP APIs)** for all 4xx and 5xx errors.
- Prevent leakage of internal stack traces, database metadata, or environment credentials to API clients.

---

## 2. Test Cases (MockMvc / WebMvcTest)

### 2.1 Functional Test Cases (Happy Path)
| Test ID | Test Scenario | Input / Preconditions | Expected Behavior | Verification Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `TC-WEB-01` | GET /api/cities returns tracked list | Database contains active cities | Returns HTTP 200 OK with JSON array of cities (`id`, `name`, `countryCode`). `Content-Type: application/json`. | `MockMvc.perform(get("/api/cities"))` asserting status 200 and JSON path assertions. |
| `TC-WEB-02` | GET /api/weather/{city} cache hit | City "London" exists and is cached | Returns HTTP 200 OK with `WeatherResponseDto`. Header `X-Cache` equals `HIT`. | `MockMvc` asserting status 200, JSON fields, and header `X-Cache: HIT`. |
| `TC-WEB-03` | GET /api/weather/{city} cache miss | City "Tokyo" exists, not cached | Returns HTTP 200 OK with fresh weather DTO. Header `X-Cache` equals `MISS`. | `MockMvc` asserting status 200, JSON fields, and header `X-Cache: MISS`. |

---

## 3. Edge Cases & Boundary Conditions

| Edge Case ID | Scenario / Condition | Invariant / Failure Mode | Expected System Behavior | Test Implementation |
| :--- | :--- | :--- | :--- | :--- |
| `EC-WEB-01` | **City not found in database** | `GET /api/weather/NonExistentCity` | Returns HTTP 404 Not Found. Payload contains RFC 7807 Problem Details: `title: "City Not Tracked"`, `status: 404`. | `MockMvc` asserting 404 and `jsonPath("$.status").value(404)`. |
| `EC-WEB-02` | **Illegal characters / Injection in path variable** | `GET /api/weather/<script>alert(1)</script>` or `GET /api/weather/' OR 1=1--` | Validation regex rejects input before hitting service. Returns HTTP 400 Bad Request with RFC 7807 Problem Details. | `MockMvc` with malicious payload; assert 400 Bad Request. |
| `EC-WEB-03` | **Path variable length boundary violation** | Single character (`GET /api/weather/a`) or >100 characters | Returns HTTP 400 Bad Request: `"Path variable 'city' must be between 2 and 100 characters"`. | Parameterized tests for length boundary violations. |
| `EC-WEB-04` | **Unsupported HTTP Methods** | `POST /api/cities` or `DELETE /api/weather/London` | Returns HTTP 405 Method Not Allowed with standard RFC 7807 Problem Details. Rejects unauthorized mutations. | `MockMvc.perform(post("/api/cities"))` asserting 405. |
| `EC-WEB-05` | **Upstream external outage with no cache** | External service throws `ExternalServiceUnavailableException` | Returns HTTP 502 Bad Gateway / 503 Service Unavailable. Problem Details detail: `"External weather provider unreachable"`. | `MockMvc` simulating service failure; assert 502. |
| `EC-WEB-06` | **Database connection failure** | Database is unreachable during `/api/cities` | Returns HTTP 500 Internal Server Error with generic sanitized message. Raw SQL exceptions or database credentials are **never leaked** in payload. | Simulate `DataAccessResourceFailureException`; assert sanitized 500. |
| `EC-WEB-07` | **URL-encoded characters handling** | `GET /api/weather/New%20York` or `GET /api/weather/St.%20Louis` | Correctly decodes URL-encoded spaces and punctuation to `"New York"` and `"St. Louis"`. | `MockMvc` testing encoded spaces and periods. |
