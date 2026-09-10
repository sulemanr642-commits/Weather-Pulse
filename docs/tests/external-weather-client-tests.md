# Test & Edge Case Specifications: External Weather API Client Module

This document defines the test matrix, automated test cases, and edge cases for the **External Weather Client Module** (`WeatherClient`, `OpenWeatherMapClient`, `WeatherMapper`).

---

## 1. Module Scope & Responsibilities
- Execute authenticated HTTP requests against OpenWeatherMap REST API (`/data/2.5/weather`).
- Externalize API key via Spring configuration (`weatherpulse.external-api.key`), never hardcoded.
- Enforce strict HTTP timeouts (e.g., connect timeout = 3s, read timeout = 5s).
- Translate vendor-specific response payloads into internal domain DTO (`WeatherResponseDto`).
- Translate HTTP errors (4xx, 5xx) into strongly-typed domain exceptions (`ExternalWeatherApiException`, `WeatherRateLimitExceededException`, `UpstreamAuthenticationException`).

---

## 2. Test Cases (Unit & MockWebServer / WireMock)

### 2.1 Functional Test Cases (Happy Path)
| Test ID | Test Scenario | Input / Preconditions | Expected Behavior | Verification Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `TC-CLIENT-01` | Successful weather fetch | City: `"London"`, Country: `"GB"`, valid API key | Sends `GET /data/2.5/weather?q=London,GB&units=metric&appid={key}`. Deserializes into `WeatherResponseDto` with accurate temperature, humidity, wind, and conditions. | WireMock server returning standard OpenWeatherMap 200 OK JSON. |
| `TC-CLIENT-02` | Geographic coordinates fallback | City with lat/lon: `51.507351, -0.127758` | Sends `GET /data/2.5/weather?lat=51.5073&lon=-0.1277&units=metric&appid={key}`. Accurately maps response. | WireMock mock endpoint. |
| `TC-CLIENT-03` | Metric unit conversion | OpenWeatherMap returns wind speed in m/s (e.g., `4.0 m/s`) | Client maps/converts wind speed accurately to km/h (`14.4 km/h`). | Unit test verifying conversion math and rounding. |

---

## 3. Edge Cases & Boundary Conditions

| Edge Case ID | Scenario / Condition | Invariant / Failure Mode | Expected System Behavior | Test Implementation |
| :--- | :--- | :--- | :--- | :--- |
| `EC-CLIENT-01` | **Upstream HTTP 401 Unauthorized** | Missing, revoked, or invalid OpenWeatherMap API key | Throws `UpstreamAuthenticationException`. Logs `CRITICAL` error highlighting configuration failure without leaking the API key in logs. | WireMock returning 401 with `{"cod":401, "message":"Invalid API key"}`. |
| `EC-CLIENT-02` | **Upstream HTTP 429 Too Many Requests** | Exceeded OpenWeatherMap free-tier rate limit (60 calls/min) | Throws `WeatherRateLimitExceededException`. Logs `WARN` with rate-limit details. Caller falls back to cached data or returns 503. | WireMock returning 429 with retry-after header. |
| `EC-CLIENT-03` | **Upstream HTTP 404 City Not Found** | Upstream weather provider has no records for the given query | Throws `ExternalCityNotFoundException`. Logs `INFO/WARN`. | WireMock returning 404 `{"cod":"404","message":"city not found"}`. |
| `EC-CLIENT-04` | **Upstream HTTP 500 / 502 / 503 Outage** | External weather service down or encountering internal crash | Throws `ExternalWeatherApiException`. Does not leak external HTML/stack trace to frontend. | WireMock returning 500 / 503 server error. |
| `EC-CLIENT-05` | **HTTP Connect or Read Timeout** | Network packet loss; provider response takes >5000ms | Client aborts request after configured timeout limit; throws `ResourceAccessException` / `TimeoutException`. Prevents thread exhaustion. | WireMock with fixed delay of 7000ms; verify timeout triggered at 5000ms. |
| `EC-CLIENT-06` | **Partial / Missing Fields in JSON** | Upstream response omits `wind.deg`, `main.feels_like`, or empty `weather[]` array | Mapper handles nullable values with safe default fallbacks without throwing `NullPointerException` or `IndexOutOfBoundsException`. | Unit test passing JSON with missing optional fields. |
| `EC-CLIENT-07` | **Extreme Meteorological Values** | Sub-zero temperatures (`-45.2°C`), 0% humidity, or 100% humidity | Mapper correctly handles negative floating-point numbers and boundary percentages without arithmetic errors. | Unit test passing extreme numeric values. |
