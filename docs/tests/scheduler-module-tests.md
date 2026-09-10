# Test & Edge Case Specifications: Background Refresh Scheduler Module

This document defines the test matrix, automated test cases, and edge cases for the **Scheduler Module** (`WeatherRefreshScheduler`, `@Scheduled` background worker).

---

## 1. Module Scope & Responsibilities
- Proactively synchronize weather data for all active tracked cities every 5 minutes (300,000 ms).
- Execute asynchronously on a dedicated task execution thread pool without blocking HTTP request threads.
- Implement **Fault Isolation (Bulkheading)**: Failure to refresh City $N$ must never abort processing for City $N+1$.
- Preserve existing cached data when upstream calls fail, ensuring uninterrupted read availability.
- Record structured audit and telemetry logs for each run (cities processed, successes, failures, elapsed time).

---

## 2. Test Cases (Unit & Integration)

### 2.1 Functional Test Cases (Happy Path)
| Test ID | Test Scenario | Input / Preconditions | Expected Behavior | Verification Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `TC-SCHED-01` | Full batch synchronization | 5 active cities in database | Iterates through all 5 cities, invokes `WeatherClient` for each, updates Redis with fresh 10-minute TTL. Logs run summary: 5 processed, 5 succeeded, 0 failed. | Unit test verifying invocation count and Redis writes. |
| `TC-SCHED-02` | Inactive cities skipped | 5 cities in DB (3 active, 2 inactive) | Scheduler only calls `findByIsActiveTrue()`; processes exactly 3 active cities. Inactive cities are completely ignored. | Assert `weatherClient.fetchCurrentWeather()` called exactly 3 times. |
| `TC-SCHED-03` | Non-blocking execution | Scheduled task running | User HTTP requests (`GET /api/weather/{city}`) continue executing concurrently without thread starvation. | Integration test invoking HTTP endpoint during active scheduled cycle. |

---

## 3. Edge Cases & Boundary Conditions

| Edge Case ID | Scenario / Condition | Invariant / Failure Mode | Expected System Behavior | Test Implementation |
| :--- | :--- | :--- | :--- | :--- |
| `EC-SCHED-01` | **Partial Upstream Failure (Fault Isolation)** | 3 cities: London, Paris, Tokyo. External call fails *only* for Paris (e.g. 500 error) | 1. London succeeds and updates Redis.<br>2. Paris fails; error logged with context; existing Redis key for Paris is **not deleted**.<br>3. Tokyo proceeds and succeeds.<br>Batch completes with 2 successes, 1 failure. | Mock `weatherClient` throwing on 2nd invocation; assert 3rd invocation still executed and Paris cache intact. |
| `EC-SCHED-02` | **Empty Tracked Cities Table** | DB contains 0 active cities | Scheduler queries DB, receives empty list, logs `INFO: No active cities configured for refresh`, and exits cleanly without errors or NPEs. | Empty DB integration test. |
| `EC-SCHED-03` | **Database Down at Scheduled Run Time** | PostgreSQL unreachable when scheduler triggers | Database query throws exception. Scheduler catches `DataAccessException`, logs `ERROR: Scheduled refresh failed to load tracked cities from DB`, and terminates cycle safely until the next 5-minute trigger. | Mock `cityRepository` throwing `CannotCreateTransactionException`. |
| `EC-SCHED-04` | **Slow Upstream Network / Execution Exceeds Interval** | Upstream latency causes batch to take >5 minutes | Configured with `fixedDelay` (or execution locking) to prevent overlapping concurrent executions of the same batch. Next run waits until current run completes. | Test configuring artificial latency; verify no concurrent thread executions. |
| `EC-SCHED-05` | **Mid-Batch Upstream Rate Limiting (HTTP 429)** | Upstream returns 429 on 3rd city | Scheduler logs rate-limit alert, gracefully pauses or aborts remaining batch items to respect upstream provider policy, without crashing application. | WireMock returning 429 on 3rd request. |
| `EC-SCHED-06` | **Application Shutdown During Active Scheduled Run** | Spring context receives `SIGTERM` while scheduler is iterating | Graceful shutdown allows in-flight city request to finish or abort cleanly without leaving corrupted state in Redis. | Spring lifecycle context stop test. |
