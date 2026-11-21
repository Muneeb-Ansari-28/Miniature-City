# Miniature City Living Diorama Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the miniature 3D city diorama into a vibrant, living scene with multi-species trees, an engaging children's playground and botanical park, lively urban animals (dogs, cats, pigeons, flying birds, and nests), architectural and street micro-details, and guaranteed spatial collision clearance.

**Architecture:**
- **Diverse Procedural Flora:** Standalone `treeFactory.ts` generating 4 distinct botanical archetypes (Conifer/Pine, Leafy Oak, Flowering Cherry Blossom/Sakura, and Weeping Willow) with species-tailored canopy geometries, wind-sway animation, and ground petal decals.
- **Children's Playground & Botanical Garden:** Procedural `playgroundFactory.ts` building a multi-element playground (laddered slide chute, A-frame double swing set, sand-filled octagonal sandbox, balanced seesaw, drinking fountain, and stone birdbath) zoned cleanly across the double-lot park.
- **Urban Fauna Simulation & Rendering:** Lightweight `animalSim.ts` and `AnimalRenderer.tsx` simulating low-poly dogs walking on leashes with pedestrians or resting at cafes, cats curled on benches/windowsills, pigeons pecking at plaza pavers with head-bobbing animations, articulated flapping aerial birds, and twig bird nests in tree forks.
- **Architectural & Street Life Micro-Details:** Instanced sidewalk props (sewer manholes, storm drain grates, newspaper vending boxes, protective bollards) and building accessories (wall HVAC compressor units, fire escapes, rooftop water cooling towers, access bulkhead doors, laundry lines) rendered with zero draw-call bloat.
- **Spatial Clearance & Collision Gate:** Systematic spatial clearance verification in `pedestrianSim.ts` and `propFactory.ts` backed by automated pairwise bounding-sphere collision tests preventing any mesh interpenetrations.

**Tech Stack:** Three.js 0.174, React 19, @react-three/fiber 9.1, @react-three/drei 10.0, Zustand 5.0, Tailwind CSS 4.0, Vite 6.2, TypeScript 5.8, Vitest, Playwright.

**Spec:** User feature request for 3D miniature city enrichment covering:
1. Extra micro-details (sidewalks, rooftops, building facades).
2. Animals (dogs, cats, pigeons, birds, bird nests).
3. Park overhaul (playground slides, swings, sandbox, seesaw, and multi-species trees).
4. Object overlap resolution and collision clearance.

---

## Global Constraints

- **Draw Call Budget:** Total draw calls must remain strictly $\le 100$ (target $\le 55$ with instancing and merged geometries).
- **Geometry Budget:** Total scene triangle count must remain $\le 150{,}000$ (target $\le 75{,}000$ triangles).
- **Target Frame Rate:** 60 FPS on desktop WebGL (fluid simulation delta cap $0.05\text{s}$).
- **Directory Isolation:** The `Implementation/` folder is strictly ignored in `.gitignore` and must never be staged or committed.
- **Code Quality:** Zero TypeScript compilation errors (`tsc --noEmit`), zero ESLint warnings (`eslint .`), all tests passing.

---

## Review Focus

1. **Draw Call Escalation from Animals & Details:** Instancing or merged geometry buckets must be used for repeated props; no uninstanced loose meshes in render loops. (Verified in Task 3 & 4 tests).
2. **Pedestrian & Vehicle Collision at Crosswalks:** Pedestrians waiting at red lights must remain $\ge 0.45\text{m}$ behind the curb to avoid clipping into vehicle hoods. (Verified in Task 5 tests).
3. **Tree & Playground Interpenetration in Park Lots:** Play equipment, trees, pathways, and benches must have non-overlapping circular bounding envelopes ($d \ge r_1 + r_2 + 0.2\text{m}$). (Verified in Task 2 & 5 tests).
4. **Camera Line of Sight Obstruction on POI Focus:** Focusing on `central-pocket-park` must frame the park clearly from an elevated isometric angle without foreground building roofs blocking the view. (Verified in Task 5 & 6 tests).
5. **Species Aesthetic Distinctiveness:** Conifer, Oak, Sakura, and Willow must be instantly distinguishable in silhouette, geometry structure, and leaf/petal color. (Verified in Task 1 tests).

---

## Tasks

### Task 1: Diverse Multi-Species Tree Generation System

**Files:**
- Create: `src/scene/procedural/treeFactory.ts`
- Modify: `src/scene/procedural/propFactory.ts:50-105`
- Modify: `src/scene/InstancedProps.tsx:100-220`
- Test: `tests/unit/treeFactory.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export type TreeSpecies = 'oak' | 'pine' | 'sakura' | 'willow';
  export interface TreeMeshData {
    trunkGeometry: THREE.BufferGeometry;
    canopyGeometry: THREE.BufferGeometry;
    species: TreeSpecies;
  }
  export function createTreeSpeciesGeometries(): Record<TreeSpecies, TreeMeshData>;
  ```
- Consumes: `Vec3`, `PropPlacement`, `computeCityPropLayout` from `propFactory.ts`.

- [ ] **Step 1: Write the failing unit test for tree species geometries**
  Create `tests/unit/treeFactory.spec.ts` asserting that `createTreeSpeciesGeometries()` returns valid, indexed `BufferGeometry` instances for all 4 species (`oak`, `pine`, `sakura`, `willow`), with positive vertex counts, valid normal attributes, and distinct bounding box aspect ratios.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/unit/treeFactory.spec.ts`
  Expected: FAIL with "Cannot find module treeFactory".
- [ ] **Step 3: Implement `treeFactory.ts`**
  - Implement `createOakTreeGeometry()`: robust gnarly trunk (`CylinderGeometry`), layered multi-sphere cloud canopy (`IcosahedronGeometry` with 3 clustered offset lobes).
  - Implement `createPineTreeGeometry()`: straight tapered trunk, 4 stacked concentric conical foliage tiers (`ConeGeometry`) stepping down in radius from bottom to apex.
  - Implement `createSakuraTreeGeometry()`: graceful spreading dark bark trunk, horizontal blooming cloud canopy clusters, and fallen petal decal rings on the ground.
  - Implement `createWillowTreeGeometry()`: slender pale birch trunk with cascading hanging vertical foliage strands (`CylinderGeometry` with droop offset).
  - Normalize all geometries to indexed `BufferGeometry` with unified attributes (`position`, `normal`, `uv`).
- [ ] **Step 4: Update `propFactory.ts` and `InstancedProps.tsx`**
  - Update `PropPlacement` to include optional `species?: TreeSpecies`.
  - Distribute species naturally:
    - Park West (Playground): leafy oaks and weeping willows.
    - Park East (Garden): flowering cherry blossoms (sakura) with pink ground petal decals and majestic conifers.
    - Commercial Plaza & Sidewalks: manicured pyramidal pines and flowering sakuras.
  - In `InstancedProps.tsx`, allocate dedicated `InstancedMesh` slots per tree species with wind-sway shaders and species-specific color palettes.
- [ ] **Step 5: Run unit tests and typecheck**
  Run: `npx vitest run tests/unit/treeFactory.spec.ts && npm run typecheck`
  Expected: PASS with 0 errors.
- [ ] **Step 6: Commit**
  ```bash
  git add src/scene/procedural/treeFactory.ts src/scene/procedural/propFactory.ts src/scene/InstancedProps.tsx tests/unit/treeFactory.spec.ts
  git commit -m "feat: add multi-species procedural trees (oak, pine, sakura, willow)"
  ```

---

### Task 2: Park Playground Equipment & Botanical Garden Overhaul

**Files:**
- Create: `src/scene/procedural/playgroundFactory.ts`
- Modify: `src/scene/procedural/buildingFactory.ts:320-370`
- Modify: `src/scene/CityBuildings.tsx`
- Test: `tests/unit/playgroundFactory.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface PlaygroundLayout {
    slide: { position: Vec3; rotationY: number };
    swingSet: { position: Vec3; rotationY: number };
    sandbox: { position: Vec3; rotationY: number; radius: number };
    seesaw: { position: Vec3; rotationY: number };
    birdbath: { position: Vec3 };
    fountain: { position: Vec3 };
  }
  export function createPlaygroundMergedMesh(): THREE.Group;
  export function createBotanicalGardenMesh(): THREE.Group;
  ```
- Consumes: `buildingFactory.ts` merged geometry pipeline.

- [ ] **Step 1: Write the failing unit test for playground geometries**
  Create `tests/unit/playgroundFactory.spec.ts` verifying that each playground component (slide chute, swing A-frame with seats, octagonal sandbox with sand surface, pivoting seesaw, birdbath) generates non-empty merged buffer geometries and non-overlapping bounding spheres.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/unit/playgroundFactory.spec.ts`
  Expected: FAIL with "Cannot find module playgroundFactory".
- [ ] **Step 3: Implement `playgroundFactory.ts`**
  - **Slide Model:** 4 timber ladder rungs, safety handrails, raised observation deck ($0.95\text{m}$ elevated), smooth curved slide chute ($1.4\text{m}$ span, red/yellow glossy finish), and landing pad.
  - **Swing Set Model:** Dual A-frame timber legs ($1.8\text{m}$ high), crossbeam with top brackets, suspension chain links, and two rubber sling swing seats tilted slightly.
  - **Sandbox Model:** Octagonal wooden border ($1.6\text{m}$ wide, $0.16\text{m}$ high), warm sand mound, bright red toy bucket, miniature shovel, and sandcastles.
  - **Seesaw Model:** Triangular central fulcrum bracket, $2.2\text{m}$ wooden balance plank at a $12^\circ$ dynamic tilt with rounded handles and safety stopper blocks.
  - **Garden Amenities:** Carved stone birdbath pedestal with reflective water bowl, drinking water fountain with chrome bubbler, curved flagstone garden paths with low stone border edging.
- [ ] **Step 4: Update `buildingFactory.ts` to zone the double-lot park**
  - Lot `park_pocket` (West): Dedicated Children's Playground zone featuring the slide, swing set, sandbox, seesaw, benches, and perimeter oak/willow trees.
  - Lot `park_pocket_east` (East): Serene Botanical Garden zone featuring blooming cherry blossoms, stone birdbath, drinking fountain, curving flagstone paths, and garden benches.
- [ ] **Step 5: Run tests and typecheck**
  Run: `npx vitest run tests/unit/playgroundFactory.spec.ts && npm run typecheck`
  Expected: PASS with 0 errors.
- [ ] **Step 6: Commit**
  ```bash
  git add src/scene/procedural/playgroundFactory.ts src/scene/procedural/buildingFactory.ts src/scene/CityBuildings.tsx tests/unit/playgroundFactory.spec.ts
  git commit -m "feat: add children's playground and botanical garden to pocket park"
  ```

---

### Task 3: Urban Animals & Wildlife System (Cats, Dogs, Pigeons, Birds & Nests)

**Files:**
- Create: `src/sim/animalSim.ts`
- Create: `src/scene/AnimalRenderer.tsx`
- Modify: `src/scene/CityCanvas.tsx:40-75`
- Modify: `src/scene/MicroDetails.tsx:85-115`
- Test: `tests/unit/animalSim.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export type AnimalType = 'dog' | 'cat' | 'pigeon' | 'flying_bird';
  export interface AnimalAgent {
    id: string;
    type: AnimalType;
    position: Vec3;
    rotationY: number;
    color: string;
    state: 'idle' | 'walking' | 'sleeping' | 'pecking';
    pedestrianOwnerId?: string; // For dogs on leashes
  }
  export function createAnimalRoster(city: GeneratedCity, pedestrians: PedestrianAgent[]): AnimalAgent[];
  export function updateAnimalSim(animals: AnimalAgent[], dt: number, pedestrians: PedestrianAgent[]): void;
  ```
- Consumes: `GeneratedCity`, `PedestrianAgent` from `sim/types.ts`.

- [ ] **Step 1: Write the failing unit test for animal simulation**
  Create `tests/unit/animalSim.spec.ts` verifying:
  - Animal roster generates at least 3 dogs, 3 cats, 8 plaza/park pigeons, and 3 bird nests.
  - Leashed dogs maintain tether distance $\le 1.1\text{m}$ behind their owner.
  - Sleeping cats remain strictly on bench or windowsill coordinates.
  - Pigeons remain within sidewalk/park bounding boundaries.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/unit/animalSim.spec.ts`
  Expected: FAIL with "Cannot find module animalSim".
- [ ] **Step 3: Implement `animalSim.ts`**
  - Implement `createAnimalRoster`: assign 2-3 dogs to walking pedestrians, 1-2 dogs resting near cafe patio tables, 3 cats (1 curled asleep on a park bench, 1 perched on an apartment windowsill, 1 on a low planter wall), and 8 pigeons scattered on plaza stones and park grass.
  - Implement `updateAnimalSim`: leashed dogs follow their pedestrian owner with smooth yaw heading; pigeons perform periodic head-bob pecks and short hops; resting cats flick their tail on an idle timer.
- [ ] **Step 4: Implement `AnimalRenderer.tsx`**
  - Low-poly Dog Geometry: Cute Shiba Inu / golden dog mesh with tapered body, 4 legs, perked ears, snout, and curled tail (`THREE.InstancedMesh`).
  - Low-poly Cat Geometry: Loafing/sleeping cat mesh (tucked paws, curved tail) and sitting cat mesh with pointed triangular ears (`THREE.InstancedMesh`).
  - Low-poly Pigeon Geometry: Compact plump body, grey wings with iridescent neck band, and orange beak (`THREE.InstancedMesh`) with `useFrame` animated head-bob.
  - Low-poly Bird Nest Geometry: Woven twig bowl geometry (`TorusGeometry` + noise) placed in tree forks and building eaves containing 2-3 pastel speckled eggs.
  - In `MicroDetails.tsx`, update the aerial flying birds with articulated low-poly wings that flap during flight loops.
- [ ] **Step 5: Integrate into `CityCanvas.tsx` and run verification**
  Run: `npx vitest run tests/unit/animalSim.spec.ts && npm run typecheck`
  Expected: PASS with 0 errors.
- [ ] **Step 6: Commit**
  ```bash
  git add src/sim/animalSim.ts src/scene/AnimalRenderer.tsx src/scene/CityCanvas.tsx src/scene/MicroDetails.tsx tests/unit/animalSim.spec.ts
  git commit -m "feat: add urban animals (dogs, cats, pigeons, flying birds, and nests)"
  ```

---

### Task 4: City Architectural & Street Micro-Details

**Files:**
- Create: `src/scene/procedural/microDetailFactory.ts`
- Modify: `src/scene/InstancedProps.tsx:220-380`
- Modify: `src/scene/MicroDetails.tsx:25-90`
- Test: `tests/unit/microDetails.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface MicroDetailGeometries {
    manhole: THREE.BufferGeometry;
    stormDrain: THREE.BufferGeometry;
    newspaperBox: THREE.BufferGeometry;
    wallAcUnit: THREE.BufferGeometry;
    rooftopWaterTower: THREE.BufferGeometry;
    fireEscape: THREE.BufferGeometry;
    laundryLine: THREE.BufferGeometry;
  }
  export function createMicroDetailGeometries(): MicroDetailGeometries;
  ```
- Consumes: `computeCityPropLayout` and `InstancedProps.tsx`.

- [ ] **Step 1: Write the failing unit test for micro-details**
  Create `tests/unit/microDetails.spec.ts` asserting that all micro-detail geometries (manholes, storm drains, news racks, AC units, water towers, fire escapes, clotheslines) produce valid merged geometries, correct bounds, and zero unindexed buffers.
- [ ] **Step 2: Run test to verify it fails**
  Run: `npx vitest run tests/unit/microDetails.spec.ts`
  Expected: FAIL with "Cannot find module microDetailFactory".
- [ ] **Step 3: Implement `microDetailFactory.ts`**
  - **Sewer Manhole Covers:** Circular embossed cast-iron discs ($0.68\text{m}$ diameter) with concentric ring relief and pick-hole notches embedded flush in road intersections and plaza.
  - **Curb Storm Drain Grates:** Slotted rectangular cast-iron grates ($0.72 \times 0.38\text{m}$) fitted in road gutters next to pedestrian crosswalks.
  - **Newspaper Vending Boxes:** Authentic street news boxes (blue and yellow metal housing with clear acrylic front window and coin slot) placed at sidewalk street corners.
  - **Wall-Mounted HVAC Compressors:** Exterior air conditioning units with louvered fan grilles, refrigerant piping, and wall bracket mountings mounted on residential apartment facades.
  - **Rooftop Water Towers:** Cylindrical timber-slatted water storage tanks on 4 angled steel stilt legs with conical tin roof, overflow pipe, and access ladder.
  - **Residential Fire Escapes:** Zig-zag iron fire escape platforms with safety railings, drop ladders, and window landings on apartment alley walls.
  - **Rooftop Clotheslines:** Twin wooden T-posts with suspension lines and colorful laundry towels/shirts swaying gently in the diorama breeze.
- [ ] **Step 4: Update `InstancedProps.tsx` and `MicroDetails.tsx`**
  - Add instanced mesh buffers for manholes, storm drains, news racks, bollards, wall AC units, and rooftop water towers.
  - Keep all instances strictly batched to prevent draw call inflation.
- [ ] **Step 5: Run tests and typecheck**
  Run: `npx vitest run tests/unit/microDetails.spec.ts && npm run typecheck`
  Expected: PASS with 0 errors.
- [ ] **Step 6: Commit**
  ```bash
  git add src/scene/procedural/microDetailFactory.ts src/scene/InstancedProps.tsx src/scene/MicroDetails.tsx tests/unit/microDetails.spec.ts
  git commit -m "feat: add sidewalk manholes, storm drains, news racks, wall ACs, and water towers"
  ```

---

### Task 5: Spatial Collision Clearance & Overlap Prevention Gate

**Files:**
- Modify: `src/sim/pedestrianSim.ts:90-195`
- Modify: `src/scene/procedural/propFactory.ts:55-125`
- Modify: `src/scene/CameraRig.tsx:45-55`
- Create: `tests/unit/spatialCollision.spec.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface CollisionBox {
    id: string;
    center: Vec3;
    radius: number;
    category: 'building' | 'prop' | 'tree' | 'kiosk' | 'playground' | 'pedestrian_path';
  }
  export function checkSpatialOverlaps(boxes: CollisionBox[]): { overlaps: string[]; minDistance: number };
  ```
- Consumes: `GeneratedCity`, `CityPropLayout`, `SidewalkGraph`.

- [ ] **Step 1: Write the spatial collision unit test**
  Create `tests/unit/spatialCollision.spec.ts` registering collision envelopes for all city props (trees, benches, playground items, vending machines, burger kiosk, lamps) and all pedestrian waypoint segments:
  - Assert that no prop intersects another prop ($d \ge r_1 + r_2$).
  - Assert that no pedestrian waypoint path segment clips through any tree trunk, bench, vending machine, or kiosk ($d_{\text{seg}} \ge r_{\text{prop}} + 0.35\text{m}$).
  - Assert that crosswalk waiting positions have $\ge 0.45\text{m}$ clearance from vehicle stop lines.
- [ ] **Step 2: Run test to check for any current collision violations**
  Run: `npx vitest run tests/unit/spatialCollision.spec.ts`
  Expected: Highlights any existing edge cases (e.g. crosswalk curb encroachment or park bench proximity).
- [ ] **Step 3: Resolve all collision clearances**
  - In `pedestrianSim.ts`:
    - Offset pedestrian waiting nodes back $0.45\text{m}$ from the street curb at all 9 intersections.
    - Route pedestrian paths smoothly around playground equipment zones with generous $0.6\text{m}$ buffers.
    - Confirm plaza fountain waypoint routes cleanly around the burger stall ($k_x = -1.5, k_z = 1.8$) and vending machines.
  - In `propFactory.ts`:
    - Enforce verified coordinates for all park playground equipment, trees, and benches ensuring zero bounding circle overlaps.
  - In `CameraRig.tsx`:
    - Refine `central-pocket-park` POI focus camera position to `(poi.worldPos.x + 8.5, 12.5, poi.worldPos.z + 10.5)` with target at `(poi.worldPos.x + 1.5, 0.8, poi.worldPos.z)`, providing an unobstructed, beautifully framed view of the playground and botanical garden.
- [ ] **Step 4: Run unit tests and typecheck**
  Run: `npx vitest run tests/unit/spatialCollision.spec.ts && npm run typecheck`
  Expected: PASS with 0 overlaps detected.
- [ ] **Step 5: Commit**
  ```bash
  git add src/sim/pedestrianSim.ts src/scene/procedural/propFactory.ts src/scene/CameraRig.tsx tests/unit/spatialCollision.spec.ts
  git commit -m "fix: resolve all object overlaps, crosswalk curb buffers, and park clearances"
  ```

---

### Task 6: E2E Playwright Visual Inspection & Performance Verification

**Files:**
- Modify: `tests/e2e/visualInspect.spec.ts`
- Modify: `tests/e2e/performance.spec.ts`

- [ ] **Step 1: Update `tests/e2e/visualInspect.spec.ts`**
  Configure Playwright to systematically snapshot:
  - 1. Overview of the enriched city.
  - 2. Central Playground (slide, swings, sandbox, seesaw, and oak/willow trees).
  - 3. Botanical Garden (sakura blossom trees, fallen petals, birdbath, and stone paths).
  - 4. Animals in the wild (dogs walking with NPCs, cats on benches/sills, pigeons on pavers).
  - 5. Harbor Plaza (fountain, burger stall, vending machines against wall).
  - 6. Street and rooftop micro-details (manholes, storm drains, wall ACs, water towers, fire escapes).
  - 7. Top-down layout verifying street traffic flow and pedestrian clearances.
  - Assert zero console errors and zero warnings.
- [ ] **Step 2: Run Playwright E2E visual inspection test**
  Run: `npx playwright test tests/e2e/visualInspect.spec.ts`
  Expected: PASS with 100% clean console and verified screenshot outputs in `test-results/inspection/`.
- [ ] **Step 3: Run full regression suite & performance check**
  Run: `npm run test:unit && npm run test:e2e && npm run build`
  Expected:
  - All unit and E2E tests pass.
  - Draw calls $\le 100$ (target $\le 55$).
  - Triangles $\le 150{,}000$ (target $\le 75{,}000$).
  - 60 FPS maintained.
- [ ] **Step 4: Commit**
  ```bash
  git add tests/e2e/visualInspect.spec.ts tests/e2e/performance.spec.ts
  git commit -m "test: verify visual quality, animal animations, playground, and 60 FPS budget"
  ```
