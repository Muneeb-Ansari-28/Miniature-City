export interface AssetManifestEntry {
  /** Optional relative path inside public/models/ (e.g. '/models/restaurant_ramen.glb'). */
  glbPath?: string;
  /** Uniform scale multiplier when loading external CC0 GLB. */
  scale: [number, number, number];
  /** Local position offset [x, y, z] for grounding the GLB onto the lot. */
  offset: [number, number, number];
  /** Optional Y rotation override in radians. */
  rotationY?: number;
}

/**
 * Asset-agnostic manifest mapping logical entity IDs to optional Draco+WebP CC0 .glb models.
 * Leave `glbPath` pointing to `/models/<id>.glb` (or undefined) — `assetLoader.ts` automatically
 * checks availability and falls back to the procedural low-poly Three.js factory with zero errors.
 */
export const ASSET_MANIFEST: Record<string, AssetManifestEntry> = {
  restaurant_ramen: {
    glbPath: '/models/restaurant_ramen.glb',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  restaurant_bean_steam: {
    glbPath: '/models/restaurant_bean_steam.glb',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  restaurant_bistro_lumiere: {
    glbPath: '/models/restaurant_bistro_lumiere.glb',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  restaurant_burger_diner: {
    glbPath: '/models/restaurant_burger_diner.glb',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  building_commercial_tower: {
    glbPath: '/models/building_commercial_tower.glb',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  building_apartment_balcony: {
    glbPath: '/models/building_apartment_balcony.glb',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  vehicle_sedan: {
    glbPath: '/models/vehicle_sedan.glb',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  vehicle_taxi: {
    glbPath: '/models/vehicle_taxi.glb',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  vehicle_van: {
    glbPath: '/models/vehicle_van.glb',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  vehicle_bus: {
    glbPath: '/models/vehicle_bus.glb',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
  vehicle_compact: {
    glbPath: '/models/vehicle_compact.glb',
    scale: [1, 1, 1],
    offset: [0, 0, 0],
  },
};
