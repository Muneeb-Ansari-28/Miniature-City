# Miniature 3D Living City

An interactive, browser-based stylized 3D miniature city diorama built with **React 19**, **Three.js**, **React Three Fiber**, **TypeScript**, and **Tailwind CSS v4** — featuring autonomous traffic, signalized intersections, sidewalk pedestrians, bustling outdoor restaurant patios, a continuous 24-hour Day / Sunset / Night atmosphere, rain weather, and a Ride-Along chase camera.

> **Live Demo:** _Deploy directly to Vercel, Cloudflare Pages, or GitHub Pages via `npm run build` (`dist/`)._

## Highlights

- **Living 4x4 City Neighborhood:** Continuous perimeter road loop + central crossroad with 9 intersections, named restaurants & cafes (*Sakura Ramen Corner*, *Bean & Steam Cafe*, *Bistro Lumiere*, *Sunset Café & Grill*), pocket park, and fountain plaza.
- **Autonomous Traffic & Signals:** Right-hand-drive directed road graph with Bezier intersection turns, phased NS/EW traffic lights, safe bumper-to-bumper following headway, automatic headlights at dusk/night, and reactive brake lights.
- **Pedestrians & Restaurant Dining:** 32 citizens navigating sidewalks and signal-aware crosswalks, claiming patio seats (respecting capacity), and vacating cleanly.
- **Micro-Details ("Juice"):** Rising kitchen/cafe steam puffs, rotating rooftop landmarks (coffee cup, burger, ramen bowl), gently swaying trees, and gliding birds.
- **Interactive HUD & Cameras:** Floating glassmorphic controls for Morning/Noon/Sunset/Night + 24h scrubber, Clear/Rain weather, Pause/1x/2x speed, opt-in Web Audio ambience, POI inspection cards, and click-to-follow Ride-Along Chase Cam.
- **Asset-Agnostic Design:** Runs out-of-the-box with zero external assets via procedural low-poly Three.js geometry factories, and hot-swaps compressed CC0 `.glb` files placed in `public/models/` via `src/config/assetManifest.ts`.

## Performance Engineering

- **< 100 Draw Calls & < 150k Triangles:** Repeated props (trees, streetlamps, patio tables, umbrellas, bollards, lane markings, crosswalks), all vehicles, all traffic lights, all pedestrians, steam puffs, birds, and rain streaks are batched with `THREE.InstancedMesh`; procedural buildings merge geometry per material.
- **Zero Per-Frame React State Updates:** The headless `WorldEngine` (`src/sim/`) steps inside `useFrame` and mutates Three.js instance matrices and shader uniforms directly via refs.
- **Zero Per-Frame Heap Allocations:** Scratch `Object3D`, `Vector3`, and `Color` instances are pre-allocated at module scope.
- **Automated Telemetry Hook:** `window.__CITY_STATS__` exposes `{ fps, drawCalls, triangles, geometries, textures, activeVehicles, activePedestrians, timeOfDay }`.

## Quick Start

```bash
# 1. Install dependencies (Node.js >= 20)
npm install

# 2. Start local dev server
npm run dev

# 3. Typecheck, lint, and build production bundle
npm run typecheck
npm run lint
npm run build
```

## Testing

```bash
# Run deterministic unit (TC-U01..U08) and integration (TC-I01..I03) tests
npm run test:unit

# Run Playwright WebGL E2E, visual, responsive & perf tests (TC-E01..E06)
npx playwright install chromium
npm run test:e2e
```

## Dropping In CC0 `.glb` Models

1. Place raw CC0 `.glb` files (e.g., from Kenney or KayKit) in `./raw-models/`.
2. Run `npm run optimize:assets` to Draco-compress meshes and resize textures to 1024px WebP inside `public/models/`.
3. Update paths/scales in `src/config/assetManifest.ts`. Any missing model automatically falls back to its procedural factory.

## Keyboard Shortcuts

| Key | Action |
| :--- | :--- |
| `Space` | Play / Pause simulation |
| `1` – `4` | Switch camera presets (Overview, Ramen Plaza, Downtown, Top-Down) |
| `N` | Toggle Night / Noon |
| `R` | Toggle Rain / Clear weather |
| `P` | Toggle extended FPS / Draw Calls telemetry |
| `Esc` | Close Inspector Card / Exit Ride-Along Follow Mode |
