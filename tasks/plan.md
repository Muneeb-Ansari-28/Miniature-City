# Implementation Plan: Miniature City Visual Polish

## Overview

Improve the city’s readability and sense of finish while preserving its warm miniature-diorama style and existing day, night, and rain controls. The pass covers scene lighting, sidewalk surface detail, restrained ambient occlusion, a small set of rooftop details, and light cues that make the city feel inhabited.

## Current State

- The sunset palette and hemisphere light are already dynamic, but the default sunset view leaves asphalt and shaded facades very dark.
- Sidewalks are single instanced slabs with no surface joints; roads already have lane dashes, crosswalks, stop bars, drains, and manholes.
- High quality enables Bloom and tone mapping through `PostFX`; the installed postprocessing package includes N8AO.
- Building facades already have windows, trim, and selected hero props. Rooftop details need deliberate spacing around those props.
- The ambient sound manager is opt-in and already changes its sound for rain. Dogs and birds already animate, so new life cues should stay subtle.

## Design Decisions

- Keep the existing low-poly art direction and color palette; improve contrast through small lighting and material adjustments.
- Keep new geometry instanced or merged so draw calls remain bounded.
- Gate screen-space ambient occlusion behind the existing high-quality setting and use a low-cost configuration.
- Add rooftop details only to eligible roofs and leave the landmark roofs clear.
- Keep added ambience opt-in through the existing sound toggle.

## Task List

### Phase 1: Readability and grounding

#### Task 1: Lift shadow detail without flattening sunset lighting

**Description:** Adjust the dynamic hemisphere fill and asphalt/sidewalk material values so roads and building fronts remain legible at the default sunset setting and across other times of day.

**Acceptance criteria:**
- [x] The default sunset view retains warm color while dark road surfaces show their markings clearly.
- [x] Day, night, and rain still respond to their existing controls.

**Verification:**
- [x] Run `npm run build`.
- [x] Inspect the default sunset overview screenshot.

**Dependencies:** None.

**Files likely touched:** `src/scene/CityEnvironment.tsx`, `src/scene/CityTerrain.tsx`.

**Estimated scope:** Small.

#### Task 2: Add subtle sidewalk paving joints

**Description:** Add a restrained, low-contrast paver joint pattern to visible sidewalk slabs using instanced geometry.

**Acceptance criteria:**
- [x] Sidewalk surfaces read as pedestrian areas while retaining clear paths around buildings and parks.
- [x] Joint lines stay below adjacent props and do not cover road markings.
- [x] The pattern uses an instanced mesh rather than one mesh per joint.

**Verification:**
- [x] Run `npm run build`.
- [x] Inspect the overview screenshot for seams at block boundaries.

**Dependencies:** Task 1.

**Files likely touched:** `src/scene/CityTerrain.tsx`.

**Estimated scope:** Small.

### Checkpoint: Street readability

- [x] Build succeeds.
- [x] The default overview remains warm, with clear road and sidewalk separation.
- [x] Paver seams do not visibly overlap crosswalks or props.

### Phase 2: Miniature depth and architectural finish

#### Task 3: Add restrained ambient occlusion

**Description:** Use the installed N8AO pass at reduced resolution and performance quality when high-quality rendering is enabled.

**Acceptance criteria:**
- [x] Contact areas under buildings and street props gain subtle depth.
- [x] Bloom and time-of-day lighting continue to render.
- [x] Low-quality mode remains free of the postprocessing composer.

**Verification:**
- [x] Run `npm run build`.
- [x] Inspect the high-quality overview screenshot.

**Dependencies:** Task 1.

**Files likely touched:** `src/scene/PostFX.tsx`.

**Estimated scope:** Small.

#### Task 4: Add a few spaced rooftop service details

**Description:** Add small access hatches or vents to selected simple roofs, using deterministic placement and excluding roofs already occupied by landmark props.

**Acceptance criteria:**
- [x] New details sit on roof surfaces and fit within parapets.
- [x] Coffee, burger, water-tower, antenna, and ramen roofs keep clear space around their hero objects.
- [x] Detail selection is deterministic for each lot.

**Verification:**
- [x] Run `npm run build`.
- [x] Inspect the overview browser screenshot for roof collisions.

**Dependencies:** None.

**Files likely touched:** `src/scene/procedural/buildingFactory.ts`.

**Estimated scope:** Small.

### Checkpoint: Scene grounding

- [x] Build succeeds.
- [x] Roof details remain clear of landmark props.
- [x] AO is configured with low radius, intensity, and half-resolution sampling.

### Phase 3: Living-city cues

#### Task 5: Add a visible dog leash and optional bird ambience

**Description:** Render thin leashes between walking dogs and their owners, and add quiet, sparse bird chirps to the opt-in city soundscape.

**Acceptance criteria:**
- [x] Each walking dog leash tracks its current owner and remains hidden for the resting dog.
- [x] Bird chirps are quiet, spaced apart, and only play when audio is enabled.
- [x] Disabling audio silences the new ambience and clears its scheduled work.

**Verification:**
- [x] Run `npm run build`.
- [x] Inspect the overview screenshot and inspect leash transforms for walking dogs.
- [ ] Manually toggle audio on/off and listen for the ambient layer.

**Dependencies:** None.

**Files likely touched:** `src/scene/AnimalRenderer.tsx`, `src/utils/audioManager.ts`.

**Estimated scope:** Medium.

### Checkpoint: Complete

- [x] Build succeeds.
- [x] Browser screenshot shows readable roads, distinct sidewalks, grounded props, and uncluttered roofs.
- [x] The existing audio toggle gates the new ambience and clears scheduled chirps when disabled.
- [x] No tests were added or run.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| More ambient light can wash out the daytime palette | Medium | Make a small dynamic fill adjustment and inspect both daytime and sunset. |
| Screen-space AO can darken dense geometry or reduce frame rate | Medium | Gate it behind high quality and use half resolution/performance quality. |
| Surface joints can create visual noise | Low | Keep them thin and low contrast; inspect from overview and top-down cameras. |
| Extra roof objects can collide with existing props | Medium | Use deterministic eligibility and leave hero-prop roofs unchanged. |
| Audio chirps can become repetitive | Low | Use long randomized intervals, low gain, and the existing opt-in audio control. |

## Open Questions

- None. The existing warm low-poly style and high-quality toggle guide implementation choices.
