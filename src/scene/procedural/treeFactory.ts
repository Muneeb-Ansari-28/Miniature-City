import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type TreeSpecies = 'oak' | 'pine' | 'sakura' | 'willow';

export interface TreeMeshData {
  trunkGeometry: THREE.BufferGeometry;
  canopyGeometry: THREE.BufferGeometry;
  species: TreeSpecies;
}

export interface SpeciesPalette {
  trunkColor: string;
  canopyColors: readonly string[];
}

export const TREE_SPECIES_PALETTES: Record<TreeSpecies, SpeciesPalette> = {
  oak: {
    trunkColor: '#5c432d',
    canopyColors: ['#4d7c32', '#598c3b', '#6ba347', '#416a2b'],
  },
  pine: {
    trunkColor: '#453526',
    canopyColors: ['#234a2e', '#2b5937', '#1c3d25', '#346640'],
  },
  sakura: {
    trunkColor: '#3d2e24',
    canopyColors: ['#f8b4cb', '#f48fb1', '#fbcfe8', '#f06292'],
  },
  willow: {
    trunkColor: '#6e6359',
    canopyColors: ['#7cb342', '#8bc34a', '#689f38', '#9ccc65'],
  },
};

/**
 * Ensures geometry is indexed before merging to prevent BufferGeometryUtils mismatches.
 */
function ensureIndexed(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geo.index) {
    const pos = geo.getAttribute('position');
    const indices: number[] = [];
    for (let i = 0; i < pos.count; i++) indices.push(i);
    geo.setIndex(indices);
  }
  return geo;
}

/**
 * Creates an organic Oak tree geometry (gnarly tapered trunk + multi-lobed deciduous foliage).
 */
function createOakTree(): TreeMeshData {
  const trunkGeos: THREE.BufferGeometry[] = [];
  const canopyGeos: THREE.BufferGeometry[] = [];

  // Main trunk
  const trunk = new THREE.CylinderGeometry(0.13, 0.2, 1.4, 7);
  trunk.translate(0, 0.7, 0);
  trunkGeos.push(ensureIndexed(trunk));

  // Root flares
  for (let i = 0; i < 3; i++) {
    const angle = (i * Math.PI * 2) / 3;
    const root = new THREE.CylinderGeometry(0.06, 0.11, 0.4, 5);
    root.rotateZ(0.35);
    root.rotateY(angle);
    root.translate(Math.cos(angle) * 0.18, 0.15, Math.sin(angle) * 0.18);
    trunkGeos.push(ensureIndexed(root));
  }

  // Branch boughs
  const branchL = new THREE.CylinderGeometry(0.07, 0.09, 0.65, 6);
  branchL.rotateZ(0.45);
  branchL.translate(-0.25, 1.3, 0);
  trunkGeos.push(ensureIndexed(branchL));

  const branchR = new THREE.CylinderGeometry(0.06, 0.08, 0.55, 6);
  branchR.rotateZ(-0.4);
  branchR.translate(0.22, 1.35, 0.1);
  trunkGeos.push(ensureIndexed(branchR));

  // Multi-lobed canopy clusters
  const lobeMain = new THREE.IcosahedronGeometry(0.95, 1);
  lobeMain.scale(1.1, 0.95, 1.1);
  lobeMain.translate(0, 2.05, 0);
  canopyGeos.push(ensureIndexed(lobeMain));

  const lobeLeft = new THREE.IcosahedronGeometry(0.68, 1);
  lobeLeft.translate(-0.45, 1.85, 0.1);
  canopyGeos.push(ensureIndexed(lobeLeft));

  const lobeRight = new THREE.IcosahedronGeometry(0.72, 1);
  lobeRight.translate(0.42, 1.9, -0.15);
  canopyGeos.push(ensureIndexed(lobeRight));

  const lobeTop = new THREE.IcosahedronGeometry(0.62, 1);
  lobeTop.translate(0.05, 2.45, -0.05);
  canopyGeos.push(ensureIndexed(lobeTop));

  return {
    trunkGeometry: mergeGeometries(trunkGeos, false)!,
    canopyGeometry: mergeGeometries(canopyGeos, false)!,
    species: 'oak',
  };
}

/**
 * Creates a conical Pine / Conifer tree geometry (straight trunk + 4 stacked evergreen conical tiers).
 */
function createPineTree(): TreeMeshData {
  const trunkGeos: THREE.BufferGeometry[] = [];
  const canopyGeos: THREE.BufferGeometry[] = [];

  // Straight tapered trunk
  const trunk = new THREE.CylinderGeometry(0.08, 0.14, 2.3, 7);
  trunk.translate(0, 1.15, 0);
  trunkGeos.push(ensureIndexed(trunk));

  // 4 tiered cones diminishing towards apex
  const tiers = [
    { y: 1.25, r: 0.98, h: 0.95 },
    { y: 1.85, r: 0.8, h: 0.85 },
    { y: 2.4, r: 0.62, h: 0.75 },
    { y: 2.9, r: 0.42, h: 0.65 },
  ];

  for (const tier of tiers) {
    const cone = new THREE.ConeGeometry(tier.r, tier.h, 8);
    cone.translate(0, tier.y + tier.h * 0.45, 0);
    canopyGeos.push(ensureIndexed(cone));
  }

  return {
    trunkGeometry: mergeGeometries(trunkGeos, false)!,
    canopyGeometry: mergeGeometries(canopyGeos, false)!,
    species: 'pine',
  };
}

/**
 * Creates a graceful flowering Cherry Blossom (Sakura) tree geometry (sculptural dark trunk + spreading cloud canopy).
 */
function createSakuraTree(): TreeMeshData {
  const trunkGeos: THREE.BufferGeometry[] = [];
  const canopyGeos: THREE.BufferGeometry[] = [];

  // Sculptural angled trunk
  const trunkBase = new THREE.CylinderGeometry(0.11, 0.17, 1.2, 7);
  trunkBase.rotateZ(0.12);
  trunkBase.translate(0.06, 0.6, 0);
  trunkGeos.push(ensureIndexed(trunkBase));

  const branchA = new THREE.CylinderGeometry(0.07, 0.1, 0.85, 6);
  branchA.rotateZ(-0.48);
  branchA.rotateY(0.3);
  branchA.translate(-0.32, 1.35, 0.1);
  trunkGeos.push(ensureIndexed(branchA));

  const branchB = new THREE.CylinderGeometry(0.06, 0.09, 0.95, 6);
  branchB.rotateZ(0.42);
  branchB.rotateY(-0.4);
  branchB.translate(0.35, 1.4, -0.1);
  trunkGeos.push(ensureIndexed(branchB));

  // Spreading horizontal floral clouds
  const cloudCenter = new THREE.IcosahedronGeometry(0.85, 1);
  cloudCenter.scale(1.25, 0.75, 1.2);
  cloudCenter.translate(0, 1.95, 0);
  canopyGeos.push(ensureIndexed(cloudCenter));

  const cloudLeft = new THREE.IcosahedronGeometry(0.72, 1);
  cloudLeft.scale(1.15, 0.7, 1.1);
  cloudLeft.translate(-0.65, 1.8, 0.2);
  canopyGeos.push(ensureIndexed(cloudLeft));

  const cloudRight = new THREE.IcosahedronGeometry(0.76, 1);
  cloudRight.scale(1.2, 0.7, 1.15);
  cloudRight.translate(0.68, 1.85, -0.15);
  canopyGeos.push(ensureIndexed(cloudRight));

  const cloudBack = new THREE.IcosahedronGeometry(0.65, 1);
  cloudBack.scale(1.05, 0.65, 1.05);
  cloudBack.translate(-0.1, 2.3, -0.25);
  canopyGeos.push(ensureIndexed(cloudBack));

  return {
    trunkGeometry: mergeGeometries(trunkGeos, false)!,
    canopyGeometry: mergeGeometries(canopyGeos, false)!,
    species: 'sakura',
  };
}

/**
 * Creates a graceful Weeping Willow tree geometry (slender birch trunk + cascading drooping strands).
 */
function createWillowTree(): TreeMeshData {
  const trunkGeos: THREE.BufferGeometry[] = [];
  const canopyGeos: THREE.BufferGeometry[] = [];

  // Slender trunk
  const trunk = new THREE.CylinderGeometry(0.1, 0.15, 1.6, 7);
  trunk.translate(0, 0.8, 0);
  trunkGeos.push(ensureIndexed(trunk));

  // Upper dome canopy
  const dome = new THREE.SphereGeometry(0.92, 8, 7, 0, Math.PI * 2, 0, Math.PI * 0.6);
  dome.translate(0, 2.05, 0);
  canopyGeos.push(ensureIndexed(dome));

  // 6 cascading drooping strands hanging towards lawn
  const strandCount = 6;
  for (let i = 0; i < strandCount; i++) {
    const angle = (i * Math.PI * 2) / strandCount + 0.2;
    const rad = 0.78;
    const strand = new THREE.CylinderGeometry(0.18, 0.08, 1.35, 6);
    strand.translate(Math.cos(angle) * rad, 1.45, Math.sin(angle) * rad);
    canopyGeos.push(ensureIndexed(strand));
  }

  return {
    trunkGeometry: mergeGeometries(trunkGeos, false)!,
    canopyGeometry: mergeGeometries(canopyGeos, false)!,
    species: 'willow',
  };
}

/**
 * Precomputes and caches the standard geometry pair for each of the 4 tree species.
 */
export function createTreeSpeciesGeometries(): Record<TreeSpecies, TreeMeshData> {
  return {
    oak: createOakTree(),
    pine: createPineTree(),
    sakura: createSakuraTree(),
    willow: createWillowTree(),
  };
}
