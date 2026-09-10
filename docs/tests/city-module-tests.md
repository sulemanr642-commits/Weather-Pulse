# Test & Edge Case Specifications: City Repository & Service Module

This document defines the comprehensive test matrix, automated test cases, and edge cases for the **City Module** (`City`, `CityRepository`, `CityService`).

---

## 1. Module Scope & Responsibilities
- Provide read-only access to tracked cities stored in PostgreSQL (`tracked_cities` table).
- Validate city existence for reactive weather lookups (case-insensitive search).
- Provide DTO projection for `GET /api/cities` dropdown populator.

---

## 2. Test Cases (Unit & Integration)

### 2.1 Functional Test Cases (Happy Path)
| Test ID | Test Scenario | Input / Preconditions | Expected Behavior | Verification Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `TC-CITY-01` | Retrieve active tracked cities | 8 seeded cities in DB, all `is_active = true` | Returns all 8 cities mapped to `CityDto` (id, name, countryCode) ordered alphabetically by name. | Unit test with mocked repo + Integration test against PostgreSQL. |
| `TC-CITY-02` | Filter inactive cities | 8 seeded cities, 2 set to `is_active = false` | Returns only the 6 active cities. Inactive cities are excluded from UI dropdown and scheduler. | Integration test asserting result list size and exclusion. |
| `TC-CITY-03` | Exact match lookup | City "London" exists in DB | `findByNameIgnoreCase("London")` returns `Optional<City>` containing London. | Unit test asserting `Optional.isPresent() == true`. |
| `TC-CITY-04` | Case-insensitive match lookup | City "Tokyo" exists in DB | `findByNameIgnoreCase("tOkYo")` returns `Optional<City>` for Tokyo. | Integration test utilizing PostgreSQL functional index `LOWER(name)`. |

---

## 3. Edge Cases & Boundary Conditions

| Edge Case ID | Scenario / Condition | Invariant / Failure Mode | Expected System Behavior | Test Implementation |
| :--- | :--- | :--- | :--- | :--- |
| `EC-CITY-01` | **City with leading/trailing whitespace** | Input: `"  Paris  "` | Service trims input before querying repository; successfully finds Paris. | Unit test passing whitespace-padded string. |
| `EC-CITY-02` | **City with multi-word name** | Input: `"New York"` | Successfully matches city name with internal space; preserves casing in returned DTO. | Integration test querying `"new york"`. |
| `EC-CITY-03` | **City with special punctuation** | Input: `"Washington, D.C."` or `"St. John's"` | Regex validation permits hyphens, periods, and apostrophes; queries DB without SQL syntax errors. | Parameterized test for special characters. |
| `EC-CITY-04` | **City not present in database** | Input: `"Atlantis"` | Returns `Optional.empty()`. Service throws `CityNotFoundException`. | Assert throws `CityNotFoundException` with HTTP 404 mapping. |
| `EC-CITY-05` | **Database connection failure / pool timeout** | PostgreSQL server temporarily down or connection pool exhausted | Repositories throw Spring `CannotCreateTransactionException` or `DataAccessResourceFailureException`. Global exception handler catches and maps to RFC 7807 HTTP 500. | Integration test with stopped DB container or saturated HikariCP pool. |
| `EC-CITY-06` | **Zero active cities in database** | Database table empty or all cities `is_active = false` | Returns empty list `[]` (HTTP 200). Does not throw `NullPointerException` or 500 error. | Assert `getAllActiveCities()` returns `Collections.emptyList()`. |
| `EC-CITY-07` | **Duplicate city name casing insertion** | Attempt to seed `"LONDON"` when `"London"` exists | Database unique constraint `uq_city_name` or unique index rejects insert with `DataIntegrityViolationException`. | DB migration integrity test. |
