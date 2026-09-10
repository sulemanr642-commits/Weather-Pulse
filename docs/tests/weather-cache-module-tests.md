# Test & Edge Case Specifications: Redis Cache Module

This document defines the test matrix, automated test cases, and edge cases for the **Distributed Cache Module** (`WeatherCacheService`, `RedisTemplate`, Jackson Serializers).

---

## 1. Module Scope & Responsibilities
- Provide high-speed, key-value storage for `WeatherResponseDto` in Redis.
- Enforce namespaced key format: `weatherpulse:weather:{canonical_city_name}`.
- Enforce Time-To-Live (TTL) of 10 minutes (600 seconds) on every write operation.
- Provide clean deserialization from stored JSON back into immutable Java DTOs.
- Provide non-blocking fallback if Redis experiences connection or serialization failures.

---

## 2. Test Cases (Unit & Integration)

### 2.1 Functional Test Cases (Happy Path)
| Test ID | Test Scenario | Input / Preconditions | Expected Behavior | Verification Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `TC-CACHE-01` | Successful cache write with TTL | Valid `WeatherResponseDto` for "London" | Key `weatherpulse:weather:london` is written to Redis. TTL is between 590s and 600s. | `RedisTemplate` unit test + live Redis integration test inspecting `redis-cli ttl`. |
| `TC-CACHE-02` | Successful cache hit | Key `weatherpulse:weather:london` exists in Redis | `getWeather("london")` returns populated `Optional<WeatherResponseDto>`. | Mocked Redis / live Redis read assertion. |
| `TC-CACHE-03` | Cache miss on missing key | Key does not exist in Redis | `getWeather("tokyo")` returns `Optional.empty()`. Zero exceptions thrown. | Assert `Optional.isEmpty() == true`. |
| `TC-CACHE-04` | Key normalization | Input city: `"NeW YoRK"` | Resolves to canonical key `weatherpulse:weather:new york`. Case variations hit the exact same cache slot. | Verify generated key string argument. |

---

## 3. Edge Cases & Boundary Conditions

| Edge Case ID | Scenario / Condition | Invariant / Failure Mode | Expected System Behavior | Test Implementation |
| :--- | :--- | :--- | :--- | :--- |
| `EC-CACHE-01` | **Redis server unreachable / connection refused** | Redis crashed, network partition, or connection timeout | **Fail-open resilience**: Cache lookup logs `WARN` with exception, catches `RedisConnectionFailureException`, and returns `Optional.empty()` (treating it as a cache miss) rather than crashing user request. External API is invoked as fallback. | Integration test running with stopped Redis or bad port; assert controller still returns 200 OK. |
| `EC-CACHE-02` | **Corrupted / malformed JSON in cache** | Invalid or incompatible JSON stored under key | `SerializationException` caught, error logged with key context; cache entry is bypassed/evicted, treated as cache miss, and fresh data fetched. | Write `"{invalid-json` directly to Redis key and invoke `getWeather()`. |
| `EC-CACHE-03` | **Key expires concurrently during read** | Key hits TTL expiration mid-operation | Gracefully returns `Optional.empty()`, cleanly triggers cache miss flow without `NullPointerException`. | Test with 1-second test TTL and delayed read. |
| `EC-CACHE-04` | **Redis OOM (Out Of Memory)** | Redis memory limit reached (`maxmemory` hit) | Command returns `OOM command not allowed`. Cache service logs `ERROR`, fails gracefully to direct API fetch without crashing backend thread. | Configure Redis `maxmemory 1mb` and trigger writes. |
| `EC-CACHE-05` | **Special characters in city cache key** | City with hyphen or spaces (e.g., `"Winston-Salem"`) | Generates sanitized key `weatherpulse:weather:winston-salem` without Redis key syntax errors. | Test key generation with special strings. |
