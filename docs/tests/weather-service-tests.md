# Test & Edge Case Specifications: Weather Service & Cache-Aside Orchestration Module

This document defines the test matrix, automated test cases, and edge cases for the **Weather Service Module** (`WeatherService`, `WeatherServiceImpl`).

---

## 1. Module Scope & Responsibilities
- Implement the **Cache-Aside pattern** for reactive reads.
- Orchestrate cache lookup via `WeatherCacheService`.
- On cache miss, validate city presence via `CityRepository`, fetch fresh weather via `WeatherClient`, populate Redis, and return response.
- Execute fallback resilience rules: when upstream fails, inspect if stale cache is retainable; otherwise return structured exception.
- Tag responses with telemetry metadata (`X-Cache: HIT` vs `X-Cache: MISS`).

---

## 2. Test Cases (Unit & Integration)

### 2.1 Functional Test Cases (Happy Path)
| Test ID | Test Scenario | Input / Preconditions | Expected Behavior | Verification Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `TC-SVC-01` | Pure Cache Hit | Redis contains valid `WeatherResponseDto` for "London" | Returns cached DTO directly. `CityRepository` and `WeatherClient` are **never invoked** (zero external calls, zero DB queries). Cache hit logged. | Mockito: verify `cacheService.get()` called, `weatherClient` zero interactions. |
| `TC-SVC-02` | Cache Miss with Successful Upstream Fetch | Redis returns empty; DB contains "Paris" | 1. Queries DB to confirm "Paris" is tracked.<br>2. Calls `WeatherClient.fetchCurrentWeather()`.<br>3. Saves result to Redis with 10-minute TTL.<br>4. Returns DTO marked as cache miss. | Mockito: verify sequential execution and Redis write. |
| `TC-SVC-03` | Untracked City Validation | Requested city: `"Atlantis"` (not in DB) | Redis misses. DB returns `Optional.empty()`. Service aborts immediately **without** calling external API. Throws `CityNotFoundException`. | Assert throws `CityNotFoundException`; verify `weatherClient` zero interactions. |

---

## 3. Edge Cases & Boundary Conditions

| Edge Case ID | Scenario / Condition | Invariant / Failure Mode | Expected System Behavior | Test Implementation |
| :--- | :--- | :--- | :--- | :--- |
| `EC-SVC-01` | **Cache Miss + Upstream Failure (No Stale Data)** | Cache empty; external API throws `ExternalWeatherApiException` | Service logs failure context. Translates to `ExternalServiceUnavailableException` (HTTP 502/503). Zero partial corrupted data returned. | Mock `weatherClient` throwing exception on miss; verify clean exception propagation. |
| `EC-SVC-02` | **Cache Write Fails After Successful External Call** | External API succeeds, but Redis write throws `RedisConnectionException` | **Resilience**: Service logs cache write failure as `ERROR`, but still successfully returns the fetched weather data to the user. User request does not fail just because cache storage had an error. | Mock `cacheService.set()` throwing exception; assert method still returns DTO. |
| `EC-SVC-03` | **Case Insensitivity & Canonicalization** | Requests for `"tokyo"`, `"Tokyo"`, `"TOKYO"` | Canonicalizes string to lowercase; queries key `weatherpulse:weather:tokyo`. Prevents duplicate cache misses for casing variations. | Parameterized unit test asserting identical key lookup. |
| `EC-SVC-04` | **Simultaneous Concurrent Requests for Cold Key (Thundering Herd)** | Multiple threads request same un-cached city simultaneously | All threads complete successfully. Idempotent Redis writes ensure final consistent state without deadlocks. | Concurrency test with `ExecutorService` (10 concurrent threads). |
| `EC-SVC-05` | **Soft-Deleted / Inactive City Requested** | City exists in DB but `is_active = false` | Service treats inactive city as untracked. Throws `CityNotFoundException`. Prevents weather access for deactivated locations. | DB seed with inactive city; assert 404. |
