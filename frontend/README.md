# WeatherPulse Frontend 🌦️

A state-of-the-art, weather-reactive web application engineered with React 19, TypeScript, Vite, Tailwind CSS tokens, Framer Motion, and React Three Fiber (Three.js). WeatherPulse delivers real-time meteorological observations, five-day weather forecasting, and dynamic 3D atmospheric canvas backgrounds synchronized to live planetary conditions.

---

## Table of Contents

1. [Architecture & State Management (Phase 10)](#1-architecture--state-management-phase-10)
2. [Weather-Reactive 3D Scene System (Phase 11)](#2-weather-reactive-3d-scene-system-phase-11)
3. [Motion Design System (Phase 12)](#3-motion-design-system-phase-12)
4. [Responsive Breakpoint Architecture (Phase 13)](#4-responsive-breakpoint-architecture-phase-13)
5. [Testing, Auditing & Quality Assurance (Phase 14)](#5-testing-auditing--quality-assurance-phase-14)
6. [Living Component & Scene Showcase (Phase 15)](#6-living-component--scene-showcase-phase-15)
7. [Design Decisions & Architectural Rationale](#7-design-decisions--architectural-rationale)
8. [Getting Started & Verification Commands](#8-getting-started--verification-commands)

---

## 1. Architecture & State Management (Phase 10)

### Directory Structure

```
frontend/
├── src/
│   ├── assets/               # Static icons, svgs, and imagery
│   ├── components/
│   │   ├── admin/            # Administrative console (Login, City Manager, Modal)
│   │   ├── feedback/         # Loading skeletons (shimmer), Error banners
│   │   ├── gallery/          # Living Design System & Scene Showcase (Phase 15)
│   │   ├── scenes/           # Master 3D canvas stage orchestrator (WeatherScene)
│   │   │   └── 3d/           # Seven isolated Three.js condition implementations
│   │   ├── ui/               # Core atomic primitives (Button, GlassPanel, Badge, Skeleton, AnimatedNumber)
│   │   └── weather/          # Domain components (WeatherCard, CityDropdown, WeatherSymbol, ForecastBadge)
│   ├── design-system/        # Centralized tokens (colors, glass, motion, breakpoints, themes, scenes)
│   ├── hooks/                # Custom hooks (useWeather, useCities, useAutoRefresh, useReducedMotion)
│   ├── services/             # Axios REST clients and API endpoint abstractions
│   ├── store/                # Zustand client UI state stores (useUIStore)
│   ├── styles/               # Glassmorphism tokens and CSS custom variables (design-tokens.css)
│   ├── test/                 # Test setup, mocks, and Vitest component test suites
│   ├── types/                # Strict TypeScript domain interfaces and DTOs
│   ├── App.tsx               # Orchestrated application root shell
│   └── main.tsx              # Application bootstrap and React Query Provider mount
├── e2e/                      # Playwright end-to-end user journey tests
├── playwright.config.ts      # Multi-browser Playwright test configuration
├── vitest.config.ts          # Vitest and React Testing Library configuration
└── vite.config.ts            # Vite bundler, path aliases, chunking, and bundle visualizer
```

### Server State vs. Client UI State Boundary

WeatherPulse strictly separates asynchronous remote data from synchronous client interface state:

| State Dimension | Technology | Scope & Responsibilities |
| :--- | :--- | :--- |
| **Server State** | **TanStack Query v5** (`@tanstack/react-query`) | Handles remote meteorological observations and city lists. Provides automatic background refetching, deduping, exponential backoff retries, and a 60-second `staleTime` that mirrors backend Redis cache TTLs. Prevents cache thrashing and eliminates boilerplate `useEffect` fetch loops. |
| **Client UI State** | **Zustand** (`src/store/useUIStore.ts`) | Synchronous interface state only: active selected city (`selectedCity`), admin JWT authentication token (`adminToken`), admin username, modal open/close states, active theme, and transient user selections. Zero remote API payload caching in Zustand. |

---

## 2. Weather-Reactive 3D Scene System (Phase 11)

The atmospheric background dynamically renders real-time 3D particle systems and shaders matching the meteorological conditions of the selected hub.

### Canonical Condition Mapping Matrix

All disparate third-party vendor strings (OpenWeatherMap descriptions, WeatherAPI text, WMO weather codes) are normalized at a single boundary function: `mapConditionToScene(condition, iconCode)` in `src/design-system/scenes.ts`.

| Canonical Scene Key | Display Name | Nocturnal Shift | Typical Triggers | Three.js Implementation |
| :--- | :--- | :---: | :--- | :--- |
| `clear-day` | Sunny Atmosphere | No | "Clear", "Sunny", "01d" | `src/components/scenes/3d/ClearDayScene.tsx` |
| `clear-night` | Nocturnal Starfield | Yes | "Clear", "Fine Night", "*n" | `src/components/scenes/3d/ClearNightScene.tsx` |
| `cloudy` | Overcast Cloudscapes | No | "Clouds", "Overcast", "Partly Cloudy" | `src/components/scenes/3d/CloudyScene.tsx` |
| `rain` | Precipitation Atmosphere | No | "Rain", "Drizzle", "Showers" | `src/components/scenes/3d/RainScene.tsx` |
| `snow` | Crystalline Snowdrift | No | "Snow", "Blizzard", "Sleet", "Flurries" | `src/components/scenes/3d/SnowScene.tsx` |
| `storm` | Electric Stormbloom | Yes | "Thunderstorm", "Lightning", "Squall" | `src/components/scenes/3d/StormScene.tsx` |
| `fog` | Volumetric Vapor Veil | No | "Fog", "Mist", "Haze", "Smoke", "Dust" | `src/components/scenes/3d/FogScene.tsx` |

### How to Add a New 3D Scene

1. **Extend the Type Definition**:
   Add the new key to `SceneType` in `src/design-system/scenes.ts`.
2. **Configure Classification Rules**:
   Update `mapConditionToScene()` to detect the condition keywords and add entry in `SCENE_METADATA`.
3. **Define Color Palette Tokens**:
   Add corresponding light and dark theme palettes in `src/design-system/theme.ts`.
4. **Implement 3D Geometry**:
   Create `src/components/scenes/3d/<NewSceneName>.tsx` accepting `palette` and `reducedMotion` props.
5. **Register in Scene Canvas**:
   Add lazy import and case branch to `src/components/scenes/SceneCanvas.tsx`.

### Performance & Fallback Rules

- **Zero-CLS Guarantee**: The 3D canvas is mounted with `position: fixed; inset: 0` outside the document flow. Cards use predefined dimensions to ensure Cumulative Layout Shift is strictly **0.00**.
- **Automated WebGL Detection**: If WebGL is unavailable (e.g. disabled hardware acceleration or virtual machine), `checkWebGLSupport()` gracefully falls back to CSS atmospheric gradient backdrops (`palette.cssGradient`).
- **Code-Splitting**: Three.js and React Three Fiber (`three-vendor-*.js`, 237 kB gzipped) are lazy-loaded on demand. The initial application shell paints before Three.js starts parsing.

---

## 3. Motion Design System (Phase 12)

All animations in WeatherPulse adhere to a centralized motion hierarchy to avoid disjointed or jarring UI updates.

### Easing & Duration Scale (`src/design-system/motion.ts`)

- **Calm Physics Easing Curve**: `CALM_EASE = [0.16, 1, 0.3, 1]` — modeled after Apple visionOS / iOS deceleration curves.
- **Duration Scale**:
  - `instant`: `0s`
  - `fast`: `0.2s` (hover highlights, tooltips, badge flips)
  - `normal`: `0.35s` (card crossfades, dropdown openings)
  - `deliberate`: `0.6s` (staggered section reveals, numeric counter transitions)
  - `scene`: `1.2s` (atmospheric 3D background crossfades)
- **Symbol Loops** (`symbolMotion`):
  - `floatDuration`: `3.5s`
  - `floatCloudDuration`: `4.0s`
  - `rainDropDuration`: `0.9s`
  - `sunRayRotationDuration`: `35.0s`
  - `starTwinkleDuration`: `2.0s`
  - `stormPulseDuration`: `1.2s`

### Reusable Motion Variants

- `pageStaggerContainer` / `pageStaggerItem`: Sequences top Header → Quick-Pills → Main WeatherCard on initial load.
- `entranceVariants`: Soft fade + subtle upward glide (`y: 16 -> 0`).
- `cardHoverTapVariants`: Subtle elevation (`y: -2`, `scale: 1.008`) and tap feedback (`scale: 0.992`).
- `forecastListVariants` / `forecastItemVariants`: Staggered reveals for 5-day cards.
- `modalVariants`: Bounded spring popover (`stiffness: 380, damping: 28`).

### Accessibility & Reduced Motion

The app wraps root containers in `<MotionConfig reducedMotion="user">` and uses `useReducedMotion()`. When a user enables "Reduce Motion" in their operating system:
- 3D particle velocity stops or decelerates to static serene compositions.
- Transitions snap immediately (`instant: 0s` or `0.05s`).
- Lightning flashes and rapid rotation animations are disabled.

---

## 4. Responsive Breakpoint Architecture (Phase 13)

WeatherPulse is fully fluid and responsive from small mobile screens (375px) up to ultra-wide displays (1440px+).

### Breakpoint Scale (`src/design-system/breakpoints.ts`)

```ts
export const breakpoints = {
  mobile: 480,   // Compact smartphones (e.g. iPhone SE, 375px)
  tablet: 768,   // Tablets and large phones landscape
  desktop: 1024, // Standard laptops and desktops
  wide: 1280,    // Large desktop monitors (1440px+)
} as const;
```

### Fluid CSS Clamps & Adaptive Layout

- **Spacing & Padding**: Responsive fluid typography and container gaps defined with `clamp()` (e.g. `padding: clamp(12px, 2vw, 24px)`).
- **5-Day Forecast Grid**: Auto-fit CSS Grid (`repeat(auto-fit, minmax(min(100%, 115px), 1fr))`), automatically wrapping to two rows on tablet and stacked cards on narrow mobile.
- **Header Adaptive Controls**: Flex wrap layout ensures the search combobox, refresh button, gallery trigger, and admin controls wrap gracefully without overflowing viewport bounds.

---

## 5. Testing, Auditing & Quality Assurance (Phase 14)

### Automated Test Suites

- **Vitest & React Testing Library** (`npm run test`):
  - `src/test/scenes.test.ts` (10 tests): Validates mapping matrix, nocturnal shifts, and fallback behavior.
  - `src/test/WeatherCard.test.tsx` (5 tests): Validates loading skeleton, error banner with retry trigger, weather metric formatting, and ARIA live regions.
  - `src/test/CityDropdown.test.tsx` (5 tests): Validates combobox rendering, search filtering, keyboard navigation, and selection handlers.
  - `src/test/AdminLogin.test.tsx` (4 tests): Validates client-side validation errors, disabled states, login API submission, and token persistence.
  - **Result**: 24/24 tests passed (100%).

- **Playwright End-to-End Tests** (`npx playwright test`):
  - `e2e/public-path.spec.ts`: End-to-end critical public path (load app, pick city, verify temperature/metrics update and 3D WebGL canvas mounts).
  - `e2e/admin-path.spec.ts`: Administrative management journey (log in with credentials, register new tracked target, verify city appears in public dropdown).
  - **Result**: 2/2 tests passed (100%).

### Production Lighthouse Audit & Core Web Vitals

Audited against `vite preview` on port 4173:

| Metric | Desktop Baseline | Heavy Scene (`?condition=Storm`) | Target Budget | Result |
| :--- | :---: | :---: | :---: | :---: |
| **Accessibility** | **100 / 100** | **100 / 100** | $\ge 95$ | **PERFECT** |
| **Best Practices** | **100 / 100** | **100 / 100** | $\ge 95$ | **PERFECT** |
| **SEO** | **100 / 100** | **100 / 100** | $\ge 90$ | **PERFECT** |
| **Cumulative Layout Shift (CLS)** | **0.00** | **0.00** | $< 0.1$ | **PERFECT** |
| **Largest Contentful Paint (LCP)** | **0.9s** | **0.9s** | $< 2.5s$ | **PASSED** |
| **First Contentful Paint (FCP)** | **0.8s** | **0.7s** | $< 1.8s$ | **PASSED** |

### Bundle Splitting Breakdown (`dist/bundle-stats.html`)

- `three-vendor-*.js`: 896.40 kB (237 kB gzip) — code-split and lazy-loaded via `React.lazy()`.
- `motion-vendor-*.js`: 139.99 kB (46 kB gzip).
- `query-vendor-*.js`: 28.27 kB (8.6 kB gzip).
- `index-*.js` (App Shell): 295.10 kB (91 kB gzip).
- **Core Critical Path**: The HTML, CSS, and initial text render synchronously before 3D assets begin parsing.

---

## 6. Living Component & Scene Showcase (Phase 15)

WeatherPulse features an integrated in-app living design system and component showcase accessible via the **"Gallery"** button in the header or via URL parameter (`?gallery=ui` or `?gallery=scenes`).

### What It Contains:
1. **UI Primitives Gallery** (`src/components/gallery/ComponentGallery.tsx`):
   - Interactive `Button` matrix (variants, sizes, loading spinners).
   - `GlassPanel` hierarchy (subtle, elevated, prominent).
   - `Badge` status indicators (Redis L2 cache hits, origin misses, live websocket tags).
   - `AnimatedNumber` interactive numeric interpolation counter.
   - `Skeleton` shimmering loading placeholders.
   - `WeatherSymbol` and `ForecastBadge` SVG micro-interaction matrix.
2. **3D Weather Scenes Gallery** (`src/components/gallery/SceneGallery.tsx`):
   - Isolated preview of all 7 canonical Phase 11 scenes (`clear-day`, `clear-night`, `cloudy`, `rain`, `snow`, `storm`, `fog`).
   - Switch conditions instantly with zero backend or API dependencies.
   - Real-time inspector showing diurnal/nocturnal state, lighting colors, particle attributes, and atmospheric gradients.
   - Reduced-motion toggle to audit accessibility behavior.

---

## 7. Design Decisions & Architectural Rationale

### 1. TypeScript over Plain JavaScript
- **Rationale**: Meteorological data structures contain nested numeric metrics (wind speed, direction degrees, humidity percentages, temperature floats, Unix timestamps). Strict TypeScript interfaces (`WeatherData`, `City`, `SceneColorPalette`) eliminate runtime `undefined` property errors and guarantee type safety across API boundaries, Zustand stores, and component props.

### 2. TanStack Query over Hand-Rolled Fetch/useEffect
- **Rationale**: Hand-rolled `useEffect` state triggers race conditions, duplicate fetches on component remounts, and requires verbose boilerplate for loading/error/caching states. TanStack Query handles request deduplication, exponential backoff, background revalidation, and caching (`staleTime: 60s`) matching our backend Redis cache architecture.

### 3. Centralized Motion System over Inline Animation Props
- **Rationale**: Scattering ad-hoc `transition={{ duration: 0.3 }}` across dozens of components produces visual inconsistency. Defining standardized scales (`durations`, `CALM_EASE`, `symbolMotion`) in `src/design-system/motion.ts` guarantees harmonious, Apple-grade motion choreography across the entire app.

### 4. Scoped React Three Fiber (R3F) Background Scenes
- **Rationale**: Using Three.js freely across cards or buttons adds massive rendering overhead, complicates accessibility DOM trees, and drains mobile batteries. Scoping WebGL strictly to a fixed background stage (`WeatherScene`) lets the UI remain lightweight, semantic HTML/CSS while delivering immersive visual depth.

### 5. Automated CSS Gradient Fallback
- **Rationale**: Low-power mobile devices, virtualized environments, and privacy-hardened browsers frequently block WebGL. WeatherPulse implements automated fallback to rich CSS radial gradients (`palette.cssGradient`), ensuring 100% feature availability and high-contrast readability everywhere.

### 6. Living In-App Showcase vs. Heavy Storybook
- **Rationale**: Introducing Storybook adds >150MB of dependencies, introduces a secondary bundler configuration, and requires complex mocks for WebGL canvases. The in-app `GalleryModal` runs inside the real Vite application context with identical CSS tokens, zero dependency bloat, and is code-split so it never impacts public production performance.

---

## 8. Getting Started & Verification Commands

### Development Server
```bash
cd frontend
npm run dev
```

### Production Build & Preview
```bash
npm run build
npm run preview -- --port 4173
```

### Run Vitest Component Tests
```bash
npm run test
```

### Run Playwright E2E Tests
```bash
npx playwright test
```

### Linting
```bash
npm run lint
```
