# Admin Authentication & Security Module Test Specifications

This document defines the comprehensive unit, integration, and security edge-case testing matrix for the administrative authentication and city mutation subsystem (`AuthController`, `JwtAuthenticationFilter`, `JwtTokenService`, `AdminCityController`, and `AdminUserService`).

---

## 1. Test Matrix Overview

| Test ID | Test Category | Target Component | Description | Expected Outcome |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Happy Path | `AuthController` | Valid admin credentials supplied | Returns `200 OK` with signed JWT and `expiresIn: 7200` |
| **SEC-02** | Security | `AuthController` | Unknown admin username supplied | Returns `401 Unauthorized` with generic RFC 7807 error |
| **SEC-03** | Security | `AuthController` | Valid username, wrong password | Returns `401 Unauthorized` (no credential timing leaks) |
| **SEC-04** | Security | `AuthController` | Empty username or password string | Returns `400 Bad Request` with field validation errors |
| **SEC-05** | Happy Path | `JwtTokenService` | Token generation and claims extraction | Valid claims: `sub`, `role=ROLE_ADMIN`, `iat`, `exp` |
| **SEC-06** | Edge Case | `JwtTokenService` | Token tampered with (altered payload/signature) | Throws `SignatureException`, token rejected |
| **SEC-07** | Edge Case | `JwtTokenService` | Expired token passed to validator | Throws `ExpiredJwtException`, token rejected |
| **SEC-08** | Happy Path | `AdminCityController` | Valid JWT, valid new city payload | Persists city, returns `201 Created` with entity ID |
| **SEC-09** | Edge Case | `AdminCityController` | Duplicate city name submitted | Returns `409 Conflict` (database unique constraint) |
| **SEC-10** | Edge Case | `AdminCityController` | Out-of-range coordinates (`lat=95.0`) | Returns `400 Bad Request` with constraint violations |
| **SEC-11** | Security | `JwtFilter` | Unauthenticated request to `/api/admin/**` | Intercepted at filter level, returns `401 Unauthorized` |
| **SEC-12** | Security | `JwtFilter` | Malformed header (missing `Bearer ` prefix) | Returns `401 Unauthorized`, controller not invoked |
| **SEC-13** | Happy Path | `AdminCityController` | Admin deletes existing tracked city | Returns `204 No Content`, evicts Redis cache key |
| **SEC-14** | Edge Case | `AdminCityController` | Admin deletes non-existent city ID | Returns `404 Not Found` with problem details |

---

## 2. In-Depth Edge-Case Specifications

### 2.1 Timing Attack Defense (Constant-Time Password Comparison)
- **Vulnerability**: Attackers can determine valid usernames if authentication fails faster on non-existent users than on valid users with wrong passwords.
- **Verification**: `AdminUserService` and `BCryptPasswordEncoder` must ensure execution time consistency to prevent user enumeration via timing attacks.

### 2.2 Replay & Expiration Boundary Conditions
- **Verification**: A token evaluated at $T_{\text{expiry}} - 1\text{s}$ must be accepted; a token evaluated at $T_{\text{expiry}} + 1\text{s}$ must immediately throw `ExpiredJwtException` and be rejected with HTTP 401.

### 2.3 Secret Key Entropy & Tampering Verification
- **Verification**: If a client attempts to sign a token with a weak key or a different algorithm (e.g. `none` algorithm vulnerability), the `JwtTokenService` parser must reject it immediately.
