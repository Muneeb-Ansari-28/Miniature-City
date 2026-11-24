import * as THREE from 'three';
import type { GeneratedCity, Vec3 } from '@/sim/types';
import { SIDEWALK_HEIGHT } from '@/config/constants';
import type { TreeSpecies } from '@/scene/procedural/treeFactory';
import { TREE_SPECIES_PALETTES } from '@/scene/procedural/treeFactory';

export interface PropPlacement {
  position: Vec3;
  rotationY: number;
  scale: number;
  color?: string;
  species?: TreeSpecies;
}

export interface CableCurve {
  p0: Vec3;
  p1: Vec3; // Droop / sag control point
  p2: Vec3;
}

export interface CityPropLayout {
  trees: PropPlacement[];
  lamps: PropPlacement[];
  benches: PropPlacement[];
  umbrellas: PropPlacement[];
  tables: PropPlacement[];
  bollards: PropPlacement[];
  telephonePoles: PropPlacement[];
  hydrants: PropPlacement[];
  trashCans: PropPlacement[];
  trafficCones: PropPlacement[];
  cables: CableCurve[];
  manholes: PropPlacement[];
  stormDrains: PropPlacement[];
  newspaperBoxes: PropPlacement[];
  wallAcUnits: PropPlacement[];
  waterTowers: PropPlacement[];
  clotheslines: PropPlacement[];
}

/**
 * Computes deterministic instanced prop placements across parks, sidewalks, restaurant patios,
 * and street edges — including authentic wooden telephone poles and catenary power cables.
 */
export function computeCityPropLayout(city: GeneratedCity): CityPropLayout {
  const trees: PropPlacement[] = [];
  const lamps: PropPlacement[] = [];
  const benches: PropPlacement[] = [];
  const umbrellas: PropPlacement[] = [];
  const tables: PropPlacement[] = [];
  const bollards: PropPlacement[] = [];
  const telephonePoles: PropPlacement[] = [];
  const hydrants: PropPlacement[] = [];
  const trashCans: PropPlacement[] = [];
  const trafficCones: PropPlacement[] = [];
  const cables: CableCurve[] = [];

  const half = city.tileSize * 0.5;
  const umbrellaPalette = ['#d14334', '#f7efe1', '#f0a82b', '#3b827e', '#e65c40'];
  let umbrellaIdx = 0;

  for (const lot of city.lots) {
    const { x, z } = lot.worldPos;

    // A. PARK LOTS
    if (lot.type === 'park') {
      const isWestPlayground = lot.assetId === 'park_pocket' || lot.col === 3;
      if (isWestPlayground) {
        // West Lot: Playground with lush Oaks and weeping Willows around perimeter
        const westTrees: [number, number, number, TreeSpecies, string][] = [
          [-1.9, -1.85, 0.78, 'oak', TREE_SPECIES_PALETTES.oak.canopyColors[0]!],
          [1.85, -1.85, 0.76, 'oak', TREE_SPECIES_PALETTES.oak.canopyColors[1]!],
          [-1.9, 1.85, 0.74, 'willow', TREE_SPECIES_PALETTES.willow.canopyColors[0]!],
          [1.85, 1.85, 0.72, 'willow', TREE_SPECIES_PALETTES.willow.canopyColors[1]!],
        ];
        for (const [dx, dz, scale, species, col] of westTrees) {
          trees.push({
            position: { x: x + dx, y: SIDEWALK_HEIGHT + 0.14, z: z + dz },
            rotationY: (dx * 1.7 + dz * 2.3),
            scale,
            species,
            color: col,
          });
        }
      } else {
        // East Lot: Botanical Garden with Flowering Sakura & Conifer Pines
        const eastTrees: [number, number, number, TreeSpecies, string][] = [
          [-1.85, -1.75, 0.76, 'sakura', TREE_SPECIES_PALETTES.sakura.canopyColors[0]!],
          [1.75, -1.75, 0.74, 'sakura', TREE_SPECIES_PALETTES.sakura.canopyColors[1]!],
          [-1.8, 1.75, 0.74, 'pine', TREE_SPECIES_PALETTES.pine.canopyColors[0]!],
          [1.8, 1.75, 0.76, 'pine', TREE_SPECIES_PALETTES.pine.canopyColors[1]!],
          [0.0, 1.9, 0.7, 'sakura', TREE_SPECIES_PALETTES.sakura.canopyColors[2]!],
        ];
        for (const [dx, dz, scale, species, col] of eastTrees) {
          trees.push({
            position: { x: x + dx, y: SIDEWALK_HEIGHT + 0.14, z: z + dz },
            rotationY: (dx * 1.7 + dz * 2.3),
            scale,
            species,
            color: col,
          });
        }
      }

      benches.push(
        { position: { x: x - 1.1, y: SIDEWALK_HEIGHT + 0.14, z: z + 0.75 }, rotationY: 0, scale: 1 },
        { position: { x: x + 1.1, y: SIDEWALK_HEIGHT + 0.14, z: z - 0.75 }, rotationY: Math.PI, scale: 1 },
        { position: { x: x - 0.75, y: SIDEWALK_HEIGHT + 0.14, z: z - 1.1 }, rotationY: Math.PI / 2, scale: 1 },
      );
      trashCans.push({
        position: { x: x + 2.1, y: SIDEWALK_HEIGHT + 0.14, z: z + 0.5 },
        rotationY: 0,
        scale: 1,
      });
    }

    // B. PLAZA LOT
    if (lot.type === 'plaza') {
      benches.push(
        { position: { x: x - 2.1, y: SIDEWALK_HEIGHT + 0.12, z: z }, rotationY: Math.PI / 2, scale: 1 },
        { position: { x: x + 2.1, y: SIDEWALK_HEIGHT + 0.12, z: z }, rotationY: -Math.PI / 2, scale: 1 },
      );
      trees.push(
        {
          position: { x: x - 2.2, y: SIDEWALK_HEIGHT + 0.12, z: z - 2.2 },
          rotationY: 0.4,
          scale: 0.95,
          species: 'pine',
          color: TREE_SPECIES_PALETTES.pine.canopyColors[0],
        },
        {
          position: { x: x + 2.2, y: SIDEWALK_HEIGHT + 0.12, z: z + 2.2 },
          rotationY: 1.9,
          scale: 0.95,
          species: 'sakura',
          color: TREE_SPECIES_PALETTES.sakura.canopyColors[1],
        },
      );
      trashCans.push({
        position: { x: x + 2.2, y: SIDEWALK_HEIGHT + 0.12, z: z - 1.2 },
        rotationY: 0,
        scale: 1,
      });
    }

    // C. RESTAURANTS & CAFES (Bustling patio tables + umbrellas)
    if (lot.type === 'restaurant') {
      const isRamen = lot.style === 'ramen_corner' || lot.poiId === 'sakura-ramen-corner';
      const count = isRamen ? 4 : 2;
      const xOffsets = isRamen ? [-1.6, -0.55, 0.55, 1.6] : [-1.3, 1.3];

      for (let i = 0; i < count; i++) {
        const tx = x + xOffsets[i]!;
        const tz = z + half - (isRamen ? 0.95 : 0.8);
        tables.push({
          position: { x: tx, y: SIDEWALK_HEIGHT, z: tz },
          rotationY: 0,
          scale: 1,
        });
        umbrellas.push({
          position: { x: tx, y: SIDEWALK_HEIGHT, z: tz },
          rotationY: umbrellaIdx * 0.72 + i * 0.4,
          scale: 1,
          color: umbrellaPalette[umbrellaIdx % umbrellaPalette.length],
        });
        umbrellaIdx++;
      }

      trashCans.push({
        position: { x: x - half + 0.65, y: SIDEWALK_HEIGHT, z: z + half - 0.45 },
        rotationY: 0,
        scale: 1,
      });
    }

    // D. INTERSECTION EDGES (Streetlamps, hydrants, bollards, traffic cones)
    // Placed strictly on the raised sidewalk curb corners of adjacent lots (curbOffset = half + 0.35)
    if (lot.type === 'road_intersection') {
      const curbOffset = half + 0.35;

      lamps.push(
        {
          position: { x: x - curbOffset, y: SIDEWALK_HEIGHT, z: z - curbOffset },
          rotationY: Math.PI / 4,
          scale: 1,
        },
        {
          position: { x: x + curbOffset, y: SIDEWALK_HEIGHT, z: z + curbOffset },
          rotationY: -Math.PI * 0.75,
          scale: 1,
        },
      );

      bollards.push(
        { position: { x: x + curbOffset, y: SIDEWALK_HEIGHT, z: z - curbOffset }, rotationY: 0, scale: 1 },
        { position: { x: x - curbOffset, y: SIDEWALK_HEIGHT, z: z + curbOffset }, rotationY: 0, scale: 1 },
      );

      // Hydrant at the sidewalk curb corner overlooking crosswalk
      hydrants.push({
        position: { x: x + curbOffset + 0.1, y: SIDEWALK_HEIGHT, z: z - curbOffset + 0.35 },
        rotationY: Math.PI / 4,
        scale: 1,
      });

      // Traffic cones near crosswalk edges
      trafficCones.push(
        { position: { x: x - curbOffset + 0.1, y: 0.04, z: z - half + 0.7 }, rotationY: 0, scale: 1 },
        { position: { x: x - curbOffset + 0.1, y: 0.04, z: z - half + 1.1 }, rotationY: 0.5, scale: 1 },
      );
    }
  }

  // E. AUTHENTIC TELEPHONE / UTILITY POLES (matching reference screenshot left and back edge)
  const poleLocations: Vec3[] = [
    { x: -15.5, y: SIDEWALK_HEIGHT, z: 8.5 }, // Front-left corner near Sakura Ramen
    { x: -15.5, y: SIDEWALK_HEIGHT, z: -3.5 }, // Mid-left near Balcony Apartments
    { x: -15.5, y: SIDEWALK_HEIGHT, z: -15.5 }, // Back-left corner
    { x: -3.5, y: SIDEWALK_HEIGHT, z: -15.5 }, // Back-mid near crossroad
    { x: 8.5, y: SIDEWALK_HEIGHT, z: -15.5 }, // Back-right near commercial
  ];

  poleLocations.forEach((pos) => {
    telephonePoles.push({
      position: pos,
      rotationY: 0,
      scale: 1,
    });
  });

  // F. OVERHEAD CATENARY POWER CABLES RUNNING BETWEEN POLES
  for (let i = 0; i < poleLocations.length - 1; i++) {
    const pA = poleLocations[i]!;
    const pB = poleLocations[i + 1]!;
    const poleTopA: Vec3 = { x: pA.x, y: pA.y + 4.8, z: pA.z };
    const poleTopB: Vec3 = { x: pB.x, y: pB.y + 4.8, z: pB.z };
    const midX = (poleTopA.x + poleTopB.x) * 0.5;
    const midZ = (poleTopA.z + poleTopB.z) * 0.5;
    const sagY = Math.min(poleTopA.y, poleTopB.y) - 0.75; // Natural catenary dip

    cables.push({
      p0: poleTopA,
      p1: { x: midX, y: sagY, z: midZ },
      p2: poleTopB,
    });

    // Second slightly offset lower wire
    cables.push({
      p0: { x: poleTopA.x + 0.25, y: poleTopA.y - 0.45, z: poleTopA.z + 0.25 },
      p1: { x: midX + 0.25, y: sagY - 0.45, z: midZ + 0.25 },
      p2: { x: poleTopB.x + 0.25, y: poleTopB.y - 0.45, z: poleTopB.z + 0.25 },
    });
  }

  // Branch wire drop down to Ramen shop rooftop
  cables.push({
    p0: { x: -15.5, y: SIDEWALK_HEIGHT + 4.8, z: 8.5 },
    p1: { x: -11.0, y: SIDEWALK_HEIGHT + 3.8, z: 7.2 },
    p2: { x: -6.5, y: SIDEWALK_HEIGHT + 3.9, z: 6.2 },
  });

  // E. ARCHITECTURAL & STREET MICRO-DETAILS
  const manholes: PropPlacement[] = [];
  const stormDrains: PropPlacement[] = [];
  const newspaperBoxes: PropPlacement[] = [];
  const wallAcUnits: PropPlacement[] = [];
  const waterTowers: PropPlacement[] = [];
  const clotheslines: PropPlacement[] = [];

  // 1. Sewer manhole covers at road intersections and plaza
  for (const inter of city.intersections) {
    manholes.push({
      position: { x: inter.worldPos.x + 0.15, y: 0.015, z: inter.worldPos.z - 0.15 },
      rotationY: 0.35,
      scale: 1,
    });
  }
  manholes.push({
    position: { x: 5.2, y: SIDEWALK_HEIGHT + 0.12, z: -4.8 },
    rotationY: 0.8,
    scale: 0.95,
  });

  // 2. Curb storm drain grates at road gutters near crosswalks
  const drainOffsets = [
    [-1.85, 2.15, 0],
    [1.85, 2.15, 0],
    [-2.15, -1.85, Math.PI * 0.5],
    [2.15, -1.85, Math.PI * 0.5],
  ];
  for (const inter of city.intersections) {
    for (const [dx, dz, rot] of drainOffsets) {
      stormDrains.push({
        position: { x: inter.worldPos.x + dx!, y: 0.02, z: inter.worldPos.z + dz! },
        rotationY: rot!,
        scale: 1,
      });
    }
  }

  // 3. Street newspaper vending boxes and mail post on sidewalk corners (firmly on sidewalk slabs)
  newspaperBoxes.push(
    {
      position: { x: -3.35, y: SIDEWALK_HEIGHT, z: 3.45 },
      rotationY: Math.PI * 0.25,
      scale: 0.9,
      color: '#e63946', // Classic Red mail/news post box on Sakura Ramen sidewalk
    },
    {
      position: { x: 3.45, y: SIDEWALK_HEIGHT, z: -3.35 },
      rotationY: -Math.PI * 0.75,
      scale: 0.9,
      color: '#1d3557', // Navy box on Harbor Plaza sidewalk
    },
    {
      position: { x: -3.35, y: SIDEWALK_HEIGHT, z: -3.45 },
      rotationY: -Math.PI * 0.25,
      scale: 0.9,
      color: '#e9c46a', // Yellow box near Bistro Lumiere sidewalk
    },
  );

  // 4. Wall-mounted HVAC compressor units (mounted flush with building exterior walls)
  wallAcUnits.push(
    // Apartment Balcony (x: -12, z: -12), east brick facade at x = -9.68
    { position: { x: -9.54, y: SIDEWALK_HEIGHT + 2.4, z: -11.2 }, rotationY: Math.PI * 0.5, scale: 0.9 },
    { position: { x: -9.54, y: SIDEWALK_HEIGHT + 3.8, z: -12.8 }, rotationY: Math.PI * 0.5, scale: 0.9 },
    // Apartment Warm (x: -12, z: -6, rotY: PI/2), east wall at x = -9.78
    { position: { x: -9.64, y: SIDEWALK_HEIGHT + 2.5, z: -6.9 }, rotationY: Math.PI * 0.5, scale: 0.9 },
    { position: { x: -9.64, y: SIDEWALK_HEIGHT + 3.9, z: -5.1 }, rotationY: Math.PI * 0.5, scale: 0.9 },
    // Commercial Tower (x: 6, z: -12), west wall at x = 3.68
    { position: { x: 3.82, y: SIDEWALK_HEIGHT + 3.2, z: -11.3 }, rotationY: -Math.PI * 0.5, scale: 0.9 },
    { position: { x: 3.82, y: SIDEWALK_HEIGHT + 4.8, z: -12.7 }, rotationY: -Math.PI * 0.5, scale: 0.9 },
    // South Apartment (x: -12, z: 12, rotY: PI), north wall at z = 9.78
    { position: { x: -11.2, y: SIDEWALK_HEIGHT + 2.8, z: 9.64 }, rotationY: Math.PI, scale: 0.9 },
  );

  // 5. Rooftop water towers (stilt feet resting squarely on flat gravel roofs: y = SIDEWALK_HEIGHT + height + 0.10)
  waterTowers.push(
    // Commercial Tower (x: 6, z: -12, height: 7.4) -> roof gravel at y = 0.18 + 7.4 + 0.10 = 7.68
    { position: { x: 7.1, y: 7.68, z: -12.8 }, rotationY: 0.3, scale: 0.95 },
    // South Commercial (x: 12, z: 12, height: 5.8) -> roof gravel at y = 0.18 + 5.8 + 0.10 = 6.08
    { position: { x: 11.2, y: 6.08, z: 12.8 }, rotationY: -0.4, scale: 0.9 },
  );

  // 6. Rooftop clotheslines with laundry (posts anchored firmly into rooftop gravel: y = SIDEWALK_HEIGHT + height + 0.10)
  clotheslines.push({
    // Apartment Warm (x: -12, z: -6, height: 5.0) -> roof gravel at y = 0.18 + 5.0 + 0.10 = 5.28
    position: { x: -12.0, y: 5.28, z: -6.0 },
    rotationY: 0.2,
    scale: 0.95,
  });

  return {
    trees,
    lamps,
    benches,
    umbrellas,
    tables,
    bollards,
    telephonePoles,
    hydrants,
    trashCans,
    trafficCones,
    cables,
    manholes,
    stormDrains,
    newspaperBoxes,
    wallAcUnits,
    waterTowers,
    clotheslines,
  };
}

export function createTreeCrownGeometry(): THREE.BufferGeometry {
  return new THREE.DodecahedronGeometry(0.85, 0);
}
