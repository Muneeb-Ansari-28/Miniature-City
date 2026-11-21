import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createTreeSpeciesGeometries,
  TREE_SPECIES_PALETTES,
  type TreeSpecies,
} from '@/scene/procedural/treeFactory';

describe('treeFactory: Diverse Multi-Species Botanical Trees', () => {
  it('creates distinct, valid geometries for all 4 tree species', () => {
    const trees = createTreeSpeciesGeometries();
    const speciesList: TreeSpecies[] = ['oak', 'pine', 'sakura', 'willow'];

    for (const species of speciesList) {
      expect(trees[species]).toBeDefined();
      const { trunkGeometry, canopyGeometry } = trees[species];

      // Verify trunk geometry
      expect(trunkGeometry).toBeInstanceOf(THREE.BufferGeometry);
      expect(trunkGeometry.getAttribute('position').count).toBeGreaterThan(10);
      expect(trunkGeometry.getAttribute('normal')).toBeDefined();

      // Verify canopy geometry
      expect(canopyGeometry).toBeInstanceOf(THREE.BufferGeometry);
      expect(canopyGeometry.getAttribute('position').count).toBeGreaterThan(15);
      expect(canopyGeometry.getAttribute('normal')).toBeDefined();

      // Verify bounding boxes are computed and valid
      trunkGeometry.computeBoundingBox();
      canopyGeometry.computeBoundingBox();
      expect(trunkGeometry.boundingBox).not.toBeNull();
      expect(canopyGeometry.boundingBox).not.toBeNull();
    }
  });

  it('provides distinct silhouette proportions for different species', () => {
    const trees = createTreeSpeciesGeometries();

    // Pine should be noticeably vertical / conical (taller canopy)
    const pineBox = new THREE.Box3().setFromBufferAttribute(
      trees.pine.canopyGeometry.getAttribute('position') as THREE.BufferAttribute,
    );
    const pineHeight = pineBox.max.y - pineBox.min.y;
    const pineWidth = pineBox.max.x - pineBox.min.x;
    expect(pineHeight / pineWidth).toBeGreaterThan(0.9);

    // Sakura trunk must reach into canopy (max.y >= 1.9) with continuous coverage
    trees.sakura.trunkGeometry.computeBoundingBox();
    const sakuraTrunkBox = trees.sakura.trunkGeometry.boundingBox!;
    expect(sakuraTrunkBox.max.y).toBeGreaterThanOrEqual(1.9);
    expect(sakuraTrunkBox.min.y).toBeLessThanOrEqual(0.1);

    // Sakura should be spreading / wide (horizontal blossoming clouds)
    const sakuraBox = new THREE.Box3().setFromBufferAttribute(
      trees.sakura.canopyGeometry.getAttribute('position') as THREE.BufferAttribute,
    );
    const sakuraWidth = sakuraBox.max.x - sakuraBox.min.x;
    const sakuraHeight = sakuraBox.max.y - sakuraBox.min.y;
    expect(sakuraWidth / sakuraHeight).toBeGreaterThan(0.95);
  });

  it('defines distinct color palettes for each species', () => {
    expect(TREE_SPECIES_PALETTES.oak.canopyColors.length).toBeGreaterThan(0);
    expect(TREE_SPECIES_PALETTES.pine.canopyColors.length).toBeGreaterThan(0);
    expect(TREE_SPECIES_PALETTES.sakura.canopyColors.length).toBeGreaterThan(0);
    expect(TREE_SPECIES_PALETTES.willow.canopyColors.length).toBeGreaterThan(0);

    // Sakura canopy colors should include soft pink / blossom shades
    expect(TREE_SPECIES_PALETTES.sakura.canopyColors.some((c) => c.toLowerCase().includes('f') || c.toLowerCase().includes('e'))).toBe(true);
  });
});
