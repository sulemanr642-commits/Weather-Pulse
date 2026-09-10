# Test & Edge Case Specifications: Web Frontend UI Module

This document defines the test matrix, automated verification checks, and edge cases for the **Web Frontend UI Module** (Vanilla HTML5, CSS3, Vanilla ES6+ JavaScript).

---

## 1. Module Scope & Responsibilities
- Render modern, responsive user interface without heavy SPA frameworks.
- Asynchronously load tracked cities from `GET /api/cities` into selection dropdown.
- On city selection, invoke `GET /api/weather/{city}` via `fetch()` and update weather cards.
- Display real-time telemetry: Temperature (°C), Feels Like (°C), Humidity (%), Wind Speed (km/h), Condition, Icon, and "Last Updated" timestamp.
- Automatically refresh weather observation every 60 seconds without triggering a full-page reload.
- Handle all network, 4xx, and 5xx errors with graceful in-page user notifications.

---

## 2. Test Cases (Functional & E2E)

### 2.1 Functional Test Cases (Happy Path)
| Test ID | Test Scenario | Input / Preconditions | Expected Behavior | Verification Strategy |
| :--- | :--- | :--- | :--- | :--- |
| `TC-UI-01` | Initial Page Load & Dropdown Population | User opens `index.html` in browser | Page loads; executes `fetch('/api/cities')`; populates `<select id="citySelect">` with sorted city list. Initial placeholder "Select a City..." shown. | Browser automated test asserting `<option>` count matches API response. |
| `TC-UI-02` | City Weather Selection & Display | User selects "Tokyo" from dropdown | UI enters loading state (spinner/skeleton); fetches `GET /api/weather/Tokyo`; renders temperature, humidity, wind, and updates "Last updated: HH:mm:ss". | Assert DOM elements `#temperature`, `#humidity`, `#windSpeed` contain expected formatted values. |
| `TC-UI-03` | Background Auto-Refresh | User remains on page with "Tokyo" selected for 60 seconds | Timer fires; transparent background fetch updates DOM silently without scroll jumping or full-page flash. "Last updated" timestamp refreshes. | Mock timer tick and assert updated timestamp. |
| `TC-UI-04` | Visual Caching Indicator | Server returns `X-Cache: HIT` vs `X-Cache: MISS` | UI displays subtle cache status badge ("Served from Cache" vs "Freshly Synchronized"). | Assert badge DOM element reflects header state. |

---

## 3. Edge Cases & Boundary Conditions

| Edge Case ID | Scenario / Condition | Invariant / Failure Mode | Expected System Behavior | Test Implementation |
| :--- | :--- | :--- | :--- | :--- |
| `EC-UI-01` | **Backend Unreachable on Initial Load** | Server is down when user opens page (`fetch('/api/cities')` fails) | Shows user-friendly error banner: *"Unable to connect to WeatherPulse server. Please check your connection."* with a "Retry" button. Dropdown shows disabled state. | Mock network failure on `/api/cities`; assert error banner visibility. |
| `EC-UI-02` | **Rapid City Selection (Asynchronous Race Condition)** | User quickly clicks "London", then immediately clicks "Paris" before London returns | Uses `AbortController` to cancel in-flight London request, or uses request sequence tokens. Guarantees that slow response from London **never overwrites** the newer Paris view. | Simulate 2000ms delay on first request and 200ms on second; assert final UI state displays Paris. |
| `EC-UI-03` | **Upstream Provider Error (502/503) for Selected City** | Server returns HTTP 502/503 Problem Details | Displays clear non-intrusive alert: *"Weather data temporarily unavailable for this city. Retrying shortly."* Preserves previously selected city in dropdown. | Mock 502 response; assert error container displays message. |
| `EC-UI-04` | **Browser Tab Inactive / Backgrounded** | User switches to another browser tab for 2 hours | Listens to `visibilitychange` event. Suspends active 60s polling while tab is hidden to save battery and network bandwidth; immediately triggers a refresh upon tab focus. | Trigger `document.visibilityState = 'hidden'` / `'visible'` events. |
| `EC-UI-05` | **Offline / Network Disconnection** | User loses internet connection while viewing weather | Listens to `window.addEventListener('offline')`. Displays offline status badge. Automatically retries when `'online'` event fires. | Trigger browser offline mode; assert offline banner. |
| `EC-UI-06` | **Zero Cities Returned by Server** | Backend returns `[]` from `/api/cities` | Dropdown displays *"No cities currently tracked"*. Does not crash script or throw uncaught JS errors. | Mock empty array from `/api/cities`. |
