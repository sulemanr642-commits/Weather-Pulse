# WeatherPulse UI Design System & Component Architecture

This document defines the frontend architecture, visual design language, motion choreography, and component hierarchy for WeatherPulse's React client. The interface is engineered as an **iOS-inspired Glassmorphism Experience**, combining frosted glass translucency, high-legibility typography, fluid Framer Motion transitions, and restrained 3D weather accents.

---

## 1. React Component Hierarchy & Architecture

The client is built on **React 18 + Vite** with a modular, atomic component hierarchy separated into state containers, presentational modules, layout wrappers, and administrative modals:

```
[App Container]
  │
  ├── [BackgroundMeshCanvas] (Dynamic atmospheric gradient backdrop)
  │
  ├── [AppHeader]
  │     ├── [BrandLogo] (WeatherPulse wordmark + status beacon)
  │     └── [AdminAuthTrigger] (Discrete glass button triggering Admin modal)
  │
  ├── [MainLayout] (Max-width container, responsive flex/grid)
  │     │
  │     ├── [ControlBarPanel] (Glassmorphism card)
  │     │     ├── [CityDropdown] (Custom accessible select with keyboard nav)
  │     │     ├── [AutoRefreshCountdown] (Circular progress / 60s pulse indicator)
  │     │     └── [LastUpdatedBadge] (ISO-8601 relative time formatter e.g., "Updated 2m ago")
  │     │
  │     ├── [WeatherDisplayRegion] (Animated layout switcher)
  │     │     ├── [LoadingState] (Shimmering frosted glass skeletons)
  │     │     ├── [ErrorState] (RFC 7807 error banner with retry trigger)
  │     │     └── [WeatherCard] (Hero weather presentation)
  │     │           ├── [WeatherHero]
  │     │           │     ├── [Weather3DIconCanvas] (WebGL / Canvas rotating icon)
  │     │           │     │     └── [WeatherIconFallback] (Vector SVG fallback)
  │     │           │     ├── [TemperatureDisplay] (Large metric hero e.g., 22.4°C)
  │     │           │     └── [ConditionSubtitle] (Condition text + feels-like)
  │     │           └── [MetricsGrid] (Multi-card breakdown)
  │     │                 ├── [MetricCard: Humidity] (e.g., 58%)
  │     │                 ├── [MetricCard: Wind] (e.g., 12.6 km/h SSW)
  │     │                 ├── [MetricCard: Range] (Min/Max range bar)
  │     │                 └── [MetricCard: CacheStatus] (HIT vs MISS telemetry badge)
  │     │
  │     └── [AppFooter] (System health & attribution)
  │
  └── [AdminModalOverlay] (AnimatePresence modal portal)
        ├── [AdminLoginView] (Username/password inputs, auth error alert)
        └── [AdminCityManagerView] (Tracked cities list, add-city form, delete triggers)
```

---

## 2. iOS-Inspired Glassmorphism Design Tokens

The visual styling adheres to Apple's Human Interface Guidelines for visionOS/iOS material surfaces: frosted panels that take color and luminance from background ambient gradients while preserving sharp contrast and readability.

### 2.1 Core CSS Tokens

```css
:root {
  /* Surface Glassmorphism Tokens */
  --glass-bg-primary: rgba(255, 255, 255, 0.12);
  --glass-bg-secondary: rgba(255, 255, 255, 0.06);
  --glass-bg-elevated: rgba(255, 255, 255, 0.18);
  --glass-blur-radius: 20px;
  --glass-blur-subtle: 10px;
  --glass-saturate: 180%;
  
  /* Borders & Highlight Specularity */
  --glass-border-light: 1px solid rgba(255, 255, 255, 0.22);
  --glass-border-subtle: 1px solid rgba(255, 255, 255, 0.12);
  --glass-border-inner: inset 0 1px 0 rgba(255, 255, 255, 0.35); /* Top specular bevel */

  /* Shadows (iOS Ambient Occlusion & Soft Elevation) */
  --glass-shadow-sm: 0 4px 12px rgba(0, 0, 0, 0.08);
  --glass-shadow-md: 0 8px 32px rgba(0, 0, 0, 0.16);
  --glass-shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.28);
  --glass-shadow-glow: 0 0 30px rgba(96, 165, 250, 0.25);

  /* Geometry & Radii */
  --radius-xs: 8px;
  --radius-sm: 14px;
  --radius-md: 20px;
  --radius-lg: 28px;
  --radius-pill: 9999px;

  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", sans-serif;
  --text-primary: rgba(255, 255, 255, 0.95);
  --text-secondary: rgba(255, 255, 255, 0.70);
  --text-muted: rgba(255, 255, 255, 0.45);

  /* Dynamic Weather Ambient Palettes (Backdrop Meshes) */
  --weather-clear-sky: radial-gradient(circle at 20% 20%, #38bdf8 0%, #1e3a8a 70%, #0f172a 100%);
  --weather-clouds: radial-gradient(circle at 30% 30%, #94a3b8 0%, #334155 70%, #0f172a 100%);
  --weather-rain: radial-gradient(circle at 40% 20%, #0284c7 0%, #1e293b 70%, #090d16 100%);
  --weather-thunder: radial-gradient(circle at 50% 10%, #6366f1 0%, #311042 60%, #05050c 100%);
  --weather-snow: radial-gradient(circle at 25% 25%, #cbd5e1 0%, #475569 65%, #0f172a 100%);
}
```

### 2.2 Glass Panel Specification

Every card is styled using the `glass-panel` utility class:

```css
.glass-panel {
  background: var(--glass-bg-primary);
  backdrop-filter: blur(var(--glass-blur-radius)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur-radius)) saturate(var(--glass-saturate));
  border: var(--glass-border-light);
  box-shadow: var(--glass-shadow-md), var(--glass-border-inner);
  border-radius: var(--radius-md);
  color: var(--text-primary);
}
```

---

## 3. Motion & Animation System (Framer Motion)

Animations are tuned to feel **calm, physical, and responsive** rather than jarring or playful. They reflect Apple's spring physics and fluid spatial gestures.

### 3.1 Animation Primitives & Timing Tokens

| Element | Interaction / Trigger | Motion Specs | Easing Curve |
| :--- | :--- | :--- | :--- |
| **Page / Shell Entrance** | Initial Mount | Fade in (`opacity: 0 -> 1`) + vertical drift (`y: 20 -> 0`) | `duration: 0.6s, ease: [0.16, 1, 0.3, 1]` (iOS Decel) |
| **WeatherCard Transition** | City Switch | Crossfade (`opacity: 0 -> 1`) + scale (`0.97 -> 1.0`) | `duration: 0.35s, ease: [0.16, 1, 0.3, 1]` |
| **Metric Cards** | Layout Update | Staggered entrance (`staggerChildren: 0.05s`) | `duration: 0.3s, spring: { stiffness: 350, damping: 28 }` |
| **Button / Dropdown Tap** | Active / Hover | Scale hover (`scale: 1.02`), Tap (`scale: 0.98`) | `duration: 0.15s, ease: "easeOut"` |
| **Admin Modal** | Open / Dismiss | Scale pop (`0.92 -> 1.0`) + Backdrop blur fade | `duration: 0.25s, spring: { stiffness: 400, damping: 30 }` |

### 3.2 Accessibility: `prefers-reduced-motion`

To respect users with vestibular disorders, all Framer Motion components wrap variants in `useReducedMotion()`. If reduced motion is requested by the OS:
- Transforms (`translate`, `scale`, `rotate`) are neutralized (`y: 0`, `scale: 1`).
- Transitions collapse to instantaneous or gentle opacity-only crossfades (`duration: 0.1s`).

```javascript
const shouldReduceMotion = useReducedMotion();
const cardVariants = {
  initial: { opacity: 0, y: shouldReduceMotion ? 0 : 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, y: shouldReduceMotion ? 0 : -16, transition: { duration: 0.2 } }
};
```

---

## 4. 3D Weather Iconography: Scope & Fallback Strategy

### 4.1 Strict Scope Limitation

To maintain high performance and prevent visual gimmicks:
- 3D rendering is **strictly isolated** to the main weather condition icon inside `WeatherHero` (e.g., a gently rotating stylized sun, drifting translucent cloud, or low-poly raindrops).
- **Zero 3D on UI layout elements**: Buttons, dropdowns, and modal dialogs remain pure HTML/CSS glassmorphic elements.
- The 3D canvas is capped at a fixed dimension (e.g., $180 \times 180\text{ px}$) rendered at device pixel ratio capped at 2.

### 4.2 Implementation & Resource Footprint

- **Engine**: Lightweight Three.js canvas or procedural React Three Fiber component using basic geometric meshes (spheres, toruses, discs) with soft metallic/matcap shaders.
- **Ambient Animation**: Subtle, low-velocity idle animation (e.g., $\Delta \theta = 0.005\text{ rad/frame}$). Rendering automatically pauses (`cancelAnimationFrame`) when `document.visibilityState === "hidden"`.

### 4.3 Resilience & Fallback Matrix

The 3D component is wrapped in an enterprise **Error Boundary and Feature Detector**:

```
[WeatherIconContainer]
         │
         ├── WebGL Supported & Model Loaded?
         │         ├── YES ──> Render [Weather3DIconCanvas]
         │         └── NO  ──> Render [WeatherVectorIcon] (High-res SVG / CSS Glow)
         │
         └── Browser Tab Hidden / CPU Throttled?
                   └── Freeze 3D render loop (0% GPU utilization)
```

1. **WebGL Failure / Context Loss**: If WebGL is disabled, unsupported, or crashes (`webglcontextlost`), the error boundary catches the exception and renders an animated SVG icon with an identical color palette.
2. **Slow Network / Asset Load Failure**: Procedural primitives are generated in code—no large `.gltf` / `.bin` binary models require downloading over the wire.
