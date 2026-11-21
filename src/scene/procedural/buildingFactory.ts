import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { CityLot } from '@/sim/types';

export interface BuildingSharedMaterials {
  litWindowWarm: THREE.MeshStandardMaterial;
  litWindowAmber: THREE.MeshStandardMaterial;
  litWindowPeach: THREE.MeshStandardMaterial;
  dimWindow: THREE.MeshStandardMaterial;
  roofDark: THREE.MeshStandardMaterial;
  concreteTrim: THREE.MeshStandardMaterial;
  concreteDark: THREE.MeshStandardMaterial;
  woodTrim: THREE.MeshStandardMaterial;
  woodDeck: THREE.MeshStandardMaterial;
  metalDark: THREE.MeshStandardMaterial;
  brickWarm: THREE.MeshStandardMaterial;
  brickDark: THREE.MeshStandardMaterial;
  awningStripeA: THREE.MeshStandardMaterial;
  awningStripeB: THREE.MeshStandardMaterial;
  awningYellowA: THREE.MeshStandardMaterial;
  awningYellowB: THREE.MeshStandardMaterial;
  lanternRed: THREE.MeshStandardMaterial;
  lanternAmber: THREE.MeshStandardMaterial;
  waterMat: THREE.MeshStandardMaterial;
  grassMat: THREE.MeshStandardMaterial;
  coffeeCupMat: THREE.MeshStandardMaterial;
  coffeeLiquidMat: THREE.MeshStandardMaterial;
  burgerBunMat: THREE.MeshStandardMaterial;
  burgerPattyMat: THREE.MeshStandardMaterial;
  burgerCheeseMat: THREE.MeshStandardMaterial;
  burgerLettuceMat: THREE.MeshStandardMaterial;
  vendingRed: THREE.MeshStandardMaterial;
  vendingBlue: THREE.MeshStandardMaterial;
  vendingDisplay: THREE.MeshStandardMaterial;
  waterFoam: THREE.MeshStandardMaterial;
  waterFlow: THREE.MeshStandardMaterial;
  ketchupRed: THREE.MeshStandardMaterial;
  mustardYellow: THREE.MeshStandardMaterial;
  kraftBox: THREE.MeshStandardMaterial;
}

export function createBuildingSharedMaterials(): BuildingSharedMaterials {
  return {
    litWindowWarm: new THREE.MeshStandardMaterial({
      color: '#ffe099',
      emissive: '#ff9e24',
      emissiveIntensity: 2.6,
      roughness: 0.2,
      toneMapped: false,
    }),
    litWindowAmber: new THREE.MeshStandardMaterial({
      color: '#ffd078',
      emissive: '#ff8418',
      emissiveIntensity: 2.4,
      roughness: 0.25,
      toneMapped: false,
    }),
    litWindowPeach: new THREE.MeshStandardMaterial({
      color: '#ffbe94',
      emissive: '#ff703d',
      emissiveIntensity: 2.2,
      roughness: 0.25,
      toneMapped: false,
    }),
    dimWindow: new THREE.MeshStandardMaterial({
      color: '#2a3342',
      emissive: '#161c26',
      emissiveIntensity: 0.1,
      roughness: 0.35,
      metalness: 0.3,
    }),
    roofDark: new THREE.MeshStandardMaterial({
      color: '#34333d',
      roughness: 0.9,
    }),
    concreteTrim: new THREE.MeshStandardMaterial({
      color: '#d6cdbd',
      roughness: 0.78,
    }),
    concreteDark: new THREE.MeshStandardMaterial({
      color: '#55545e',
      roughness: 0.85,
    }),
    woodTrim: new THREE.MeshStandardMaterial({
      color: '#42281a',
      roughness: 0.85,
    }),
    woodDeck: new THREE.MeshStandardMaterial({
      color: '#805638',
      roughness: 0.8,
    }),
    metalDark: new THREE.MeshStandardMaterial({
      color: '#232429',
      roughness: 0.65,
      metalness: 0.45,
    }),
    brickWarm: new THREE.MeshStandardMaterial({
      color: '#a85842',
      roughness: 0.82,
    }),
    brickDark: new THREE.MeshStandardMaterial({
      color: '#824334',
      roughness: 0.85,
    }),
    awningStripeA: new THREE.MeshStandardMaterial({
      color: '#c93828',
      roughness: 0.65,
    }),
    awningStripeB: new THREE.MeshStandardMaterial({
      color: '#f7efe1',
      roughness: 0.65,
    }),
    awningYellowA: new THREE.MeshStandardMaterial({
      color: '#e6a427',
      roughness: 0.65,
    }),
    awningYellowB: new THREE.MeshStandardMaterial({
      color: '#2b3345',
      roughness: 0.65,
    }),
    lanternRed: new THREE.MeshStandardMaterial({
      color: '#ff4a38',
      emissive: '#ff2814',
      emissiveIntensity: 2.8,
      roughness: 0.3,
      toneMapped: false,
    }),
    lanternAmber: new THREE.MeshStandardMaterial({
      color: '#ffbe42',
      emissive: '#ffa014',
      emissiveIntensity: 2.4,
      roughness: 0.3,
      toneMapped: false,
    }),
    waterMat: (() => {
      const mat = new THREE.MeshStandardMaterial({
        color: '#18bcd8',
        emissive: '#0b5668',
        emissiveIntensity: 0.35,
        roughness: 0.04,
        metalness: 0.15,
        transparent: true,
        opacity: 0.85,
      });
      mat.userData = { uTime: { value: 0 } };
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uTime = mat.userData.uTime;
        shader.vertexShader = `
          uniform float uTime;
          ${shader.vertexShader}
        `.replace(
          '#include <begin_vertex>',
          `
          #include <begin_vertex>
          float dist = length(position.xz);
          float ripple = sin(dist * 18.0 - uTime * 4.6) * 0.016 * smoothstep(1.75, 0.25, dist);
          transformed.y += ripple;
          `,
        );
      };
      return mat;
    })(),
    grassMat: new THREE.MeshStandardMaterial({
      color: '#659648',
      roughness: 0.92,
    }),
    coffeeCupMat: new THREE.MeshStandardMaterial({
      color: '#faf6f0',
      roughness: 0.3,
      metalness: 0.05,
    }),
    coffeeLiquidMat: new THREE.MeshStandardMaterial({
      color: '#3d2012',
      roughness: 0.15,
      metalness: 0.1,
    }),
    burgerBunMat: new THREE.MeshStandardMaterial({
      color: '#df9c40',
      roughness: 0.6,
    }),
    burgerPattyMat: new THREE.MeshStandardMaterial({
      color: '#5c2c1a',
      roughness: 0.85,
    }),
    burgerCheeseMat: new THREE.MeshStandardMaterial({
      color: '#ffb71b',
      emissive: '#ff9800',
      emissiveIntensity: 0.4,
      roughness: 0.5,
    }),
    burgerLettuceMat: new THREE.MeshStandardMaterial({
      color: '#59a836',
      roughness: 0.75,
    }),
    vendingRed: new THREE.MeshStandardMaterial({
      color: '#d02b2b',
      roughness: 0.32,
      metalness: 0.28,
    }),
    vendingBlue: new THREE.MeshStandardMaterial({
      color: '#1971c2',
      roughness: 0.32,
      metalness: 0.28,
    }),
    vendingDisplay: new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#d6f0fd',
      emissiveIntensity: 1.8,
      roughness: 0.15,
      toneMapped: false,
    }),
    waterFoam: new THREE.MeshStandardMaterial({
      color: '#f0fcfc',
      roughness: 0.45,
      transparent: true,
      opacity: 0.88,
    }),
    waterFlow: new THREE.MeshStandardMaterial({
      color: '#45c8e0',
      roughness: 0.05,
      metalness: 0.1,
      transparent: true,
      opacity: 0.75,
    }),
    ketchupRed: new THREE.MeshStandardMaterial({
      color: '#c92a2a',
      roughness: 0.25,
    }),
    mustardYellow: new THREE.MeshStandardMaterial({
      color: '#f59f00',
      roughness: 0.25,
    }),
    kraftBox: new THREE.MeshStandardMaterial({
      color: '#b58450',
      roughness: 0.85,
    }),
  };
}

function windowHash(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function makeBox(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  rotX = 0,
  rotY = 0,
  rotZ = 0,
): THREE.BufferGeometry {
  const geo = new THREE.BoxGeometry(w, h, d);
  if (rotX !== 0) geo.rotateX(rotX);
  if (rotY !== 0) geo.rotateY(rotY);
  if (rotZ !== 0) geo.rotateZ(rotZ);
  geo.translate(x, y, z);
  return geo;
}

function makeCyl(
  rt: number,
  rb: number,
  h: number,
  seg: number,
  x: number,
  y: number,
  z: number,
  rotX = 0,
  rotZ = 0,
): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(rt, rb, h, seg);
  if (rotX !== 0) geo.rotateX(rotX);
  if (rotZ !== 0) geo.rotateZ(rotZ);
  geo.translate(x, y, z);
  return geo;
}

function addMergedBucket(
  group: THREE.Group,
  geos: THREE.BufferGeometry[],
  material: THREE.Material,
  castShadow: boolean,
  receiveShadow: boolean,
): void {
  if (geos.length === 0) return;
  const merged = geos.length === 1 ? geos[0]! : mergeGeometries(geos, false);
  if (geos.length > 1) {
    for (const g of geos) g.dispose();
  }
  if (!merged) return;
  const mesh = new THREE.Mesh(merged, material);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  group.add(mesh);
}

/**
 * Builds high-craft procedural buildings matching the reference miniature diorama concept:
 * - Recessed multi-pane windows with architectural lintels and stone sills
 * - Traditional Sakura Ramen noodle house with striped fabric awnings & glowing lanterns
 * - 4-story Balcony Apartment with black iron fire escapes, ladders, and giant 3D Coffee Cup
 * - Sunset Café & Grill with 3D Cheeseburger billboard, tile trim & glowing channel letters
 * - Commercial towers with rooftop wooden water tower on stilt frame & glowing neon blade signs
 * Merges geometries per-material bucket for ultra-fast <100 draw-call performance.
 */
export function buildProceduralLotMesh(
  lot: CityLot,
  mats: BuildingSharedMaterials,
): THREE.Group {
  const group = new THREE.Group();
  group.name = `procedural_${lot.id}`;

  const isRamen = lot.style === 'ramen_corner' || lot.poiId === 'sakura-ramen-corner';
  const isAptBalcony = lot.style === 'apartment_balcony';
  const isBurgerDiner = lot.style === 'burger_diner';
  const isCommercialTower = lot.style === 'commercial_tower';

  // 1. PARK LOT
  if (lot.type === 'park') {
    const lawn = new THREE.Mesh(makeBox(5.3, 0.16, 5.3, 0, 0.24, 0), mats.grassMat);
    lawn.receiveShadow = true;
    group.add(lawn);

    // Diagonal stone paver paths + low concrete border wall
    addMergedBucket(
      group,
      [
        makeBox(1.2, 0.18, 5.35, 0, 0.25, 0),
        makeBox(5.35, 0.18, 1.2, 0, 0.25, 0),
        makeBox(0.3, 0.32, 5.35, -2.5, 0.3, 0),
        makeBox(0.3, 0.32, 5.35, 2.5, 0.3, 0),
        makeBox(5.35, 0.32, 0.3, 0, 0.3, -2.5),
      ],
      mats.concreteTrim,
      true,
      true,
    );
    return group;
  }

  // 2. PLAZA FOUNTAIN LOT (Stepped fountain with realistic cascading water, 2 vending machines & burger kiosk)
  if (lot.type === 'plaza') {
    const concreteTrimGeos: THREE.BufferGeometry[] = [];
    const concreteDarkGeos: THREE.BufferGeometry[] = [];
    const metalDarkGeos: THREE.BufferGeometry[] = [];
    const waterGeos: THREE.BufferGeometry[] = [];
    const waterFlowGeos: THREE.BufferGeometry[] = [];
    const waterFoamGeos: THREE.BufferGeometry[] = [];
    const vendingRedGeos: THREE.BufferGeometry[] = [];
    const vendingBlueGeos: THREE.BufferGeometry[] = [];
    const vendingDisplayGeos: THREE.BufferGeometry[] = [];
    const lanternAmberGeos: THREE.BufferGeometry[] = [];
    const woodDeckGeos: THREE.BufferGeometry[] = [];
    const awningAGeos: THREE.BufferGeometry[] = [];
    const awningBGeos: THREE.BufferGeometry[] = [];
    const burgerBunGeos: THREE.BufferGeometry[] = [];
    const burgerPattyGeos: THREE.BufferGeometry[] = [];
    const burgerCheeseGeos: THREE.BufferGeometry[] = [];
    const burgerLettuceGeos: THREE.BufferGeometry[] = [];
    const ketchupGeos: THREE.BufferGeometry[] = [];
    const mustardGeos: THREE.BufferGeometry[] = [];
    const kraftBoxGeos: THREE.BufferGeometry[] = [];
    const grassMatGeos: THREE.BufferGeometry[] = [];

    // --- A. PLAZA FLOOR & INLAY MEDALLION ---
    concreteTrimGeos.push(makeBox(5.3, 0.14, 5.3, 0, 0.24, 0));
    concreteDarkGeos.push(makeCyl(2.55, 2.55, 0.04, 8, 0, 0.32, 0, 0, Math.PI / 8));

    // --- B. DETAILED STEPPED ORNATE FOUNTAIN ---
    // Two-tier stepped outer plinth
    concreteTrimGeos.push(makeCyl(2.15, 2.22, 0.12, 24, 0, 0.38, 0));
    concreteTrimGeos.push(makeCyl(1.95, 2.02, 0.12, 24, 0, 0.50, 0));

    // Lower reservoir basin wall with moulded outer rim
    concreteTrimGeos.push(makeCyl(1.80, 1.85, 0.40, 24, 0, 0.70, 0));
    concreteTrimGeos.push(makeCyl(1.88, 1.80, 0.10, 24, 0, 0.90, 0));

    // 4 decorative carved stone relief blocks on outer rim
    for (const [bx, bz] of [
      [1.84, 0],
      [-1.84, 0],
      [0, 1.84],
      [0, -1.84],
    ]) {
      concreteTrimGeos.push(makeBox(0.18, 0.20, 0.18, bx, 0.68, bz));
    }

    // Central fluted pedestal column
    concreteTrimGeos.push(makeCyl(0.56, 0.66, 0.42, 16, 0, 0.58, 0));
    concreteTrimGeos.push(makeCyl(0.36, 0.44, 0.72, 16, 0, 1.05, 0));
    concreteTrimGeos.push(makeCyl(0.52, 0.40, 0.14, 16, 0, 1.41, 0));

    // 4 brass lion water spout nozzles projecting from pedestal collar
    for (const [nx, nz, rx, rz] of [
      [0.44, 0, 0, Math.PI / 2],
      [-0.44, 0, 0, -Math.PI / 2],
      [0, 0.44, -Math.PI / 2, 0],
      [0, -0.44, Math.PI / 2, 0],
    ]) {
      metalDarkGeos.push(makeCyl(0.04, 0.05, 0.16, 8, nx, 1.38, nz, rx, rz));
    }

    // Middle fluted basin bowl & scalloped rim
    concreteTrimGeos.push(makeCyl(1.02, 0.48, 0.28, 16, 0, 1.55, 0));
    concreteTrimGeos.push(makeCyl(1.08, 1.02, 0.10, 16, 0, 1.70, 0));

    // Upper tier column & carved finial
    concreteTrimGeos.push(makeCyl(0.24, 0.32, 0.44, 12, 0, 1.94, 0));
    concreteTrimGeos.push(makeCyl(0.38, 0.18, 0.24, 12, 0, 2.22, 0));
    metalDarkGeos.push(makeCyl(0.08, 0.10, 0.14, 8, 0, 2.36, 0));

    // --- C. REALISTIC FOUNTAIN WATER & JETS ---
    // Lower pool water depth
    waterGeos.push(makeCyl(1.72, 1.72, 0.28, 24, 0, 0.66, 0));

    // Lower pool surface ring (subdivided for vertex wave ripples)
    const waterRing = new THREE.RingGeometry(0.38, 1.74, 32, 8);
    waterRing.rotateX(-Math.PI / 2);
    waterRing.translate(0, 0.79, 0);
    waterGeos.push(waterRing);

    // Upper basin water pool
    waterGeos.push(makeCyl(0.96, 0.96, 0.08, 16, 0, 1.66, 0));

    // 4 cascading waterfall sheets pouring from upper basin into lower pool
    for (const [wx, wz] of [
      [0.94, 0],
      [-0.94, 0],
      [0, 0.94],
      [0, -0.94],
    ]) {
      const isX = Math.abs(wx) > 0.1;
      const fall = new THREE.BoxGeometry(isX ? 0.08 : 0.26, 0.88, isX ? 0.26 : 0.08);
      fall.translate(wx * 0.92, 1.22, wz * 0.92);
      waterFlowGeos.push(fall);
    }

    // Central vertical sparkling water jet plume
    waterFlowGeos.push(makeCyl(0.06, 0.14, 0.52, 10, 0, 2.62, 0));

    // 4 shimmering apex water droplets
    for (const [dx, dz] of [
      [0.08, 0],
      [-0.08, 0],
      [0, 0.08],
      [0, -0.08],
    ]) {
      const drop = new THREE.SphereGeometry(0.045, 6, 6);
      drop.translate(dx, 2.88, dz);
      waterFlowGeos.push(drop);
    }

    // Frothy white splash foam ring around central pedestal
    waterFoamGeos.push(makeCyl(0.50, 0.50, 0.02, 16, 0, 0.80, 0));

    // 4 splash foam patches beneath waterfalls
    for (const [fx, fz] of [
      [0.92, 0],
      [-0.92, 0],
      [0, 0.92],
      [0, -0.92],
    ]) {
      waterFoamGeos.push(makeCyl(0.18, 0.18, 0.02, 8, fx, 0.80, fz));
    }

    // --- D. TWO STREET VENDING MACHINES (Attached to North Building Wall) ---
    const vmZ = -3.50; // Aligns flush against the Commercial Tower wall plinth at z = -3.725
    const binZ = -3.50;

    // Concrete equipment foundation pad extending right to the building plinth
    concreteDarkGeos.push(makeBox(2.26, 0.05, 0.60, 0.14, 0.18 + 0.025, vmZ));

    // Steel wall anchor brackets securing top rear of machines directly into the building wall
    metalDarkGeos.push(
      makeBox(0.14, 0.04, 0.10, -0.55, 0.18 + 1.30, vmZ - 0.20),
      makeBox(0.14, 0.04, 0.10, 0.25, 0.18 + 1.30, vmZ - 0.20),
    );

    // Weatherproof electrical utility conduit & wall junction box on building facade
    metalDarkGeos.push(
      makeBox(0.12, 0.16, 0.06, -0.96, 0.18 + 1.55, -3.72),
      makeCyl(0.012, 0.012, 0.65, 6, -0.96, 0.18 + 1.25, -3.71),
      makeCyl(0.010, 0.010, 0.18, 6, -0.90, 0.18 + 0.95, -3.65, 0, Math.PI / 2),
    );

    // Machine 1: Red Coca-Cola / Hot & Cold Drinks (-0.55, vmZ)
    vendingRedGeos.push(makeBox(0.66, 1.32, 0.44, -0.55, 0.18 + 0.66, vmZ));
    metalDarkGeos.push(makeBox(0.68, 0.08, 0.46, -0.55, 0.18 + 0.04, vmZ));
    lanternAmberGeos.push(makeBox(0.58, 0.13, 0.04, -0.55, 0.18 + 1.22, vmZ + 0.23));
    vendingDisplayGeos.push(makeBox(0.56, 0.54, 0.04, -0.55, 0.18 + 0.82, vmZ + 0.23));

    // Miniature drink cans on 3 display shelves
    for (let c = 0; c < 5; c++) {
      const cx = -0.55 + (c - 2) * 0.105;
      vendingRedGeos.push(makeCyl(0.025, 0.025, 0.08, 6, cx, 0.18 + 0.98, vmZ + 0.25));
      metalDarkGeos.push(makeCyl(0.025, 0.025, 0.08, 6, cx, 0.18 + 0.82, vmZ + 0.25));
      grassMatGeos.push(makeCyl(0.022, 0.022, 0.09, 6, cx, 0.18 + 0.66, vmZ + 0.25));
    }
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const bx = -0.55 + (c - 2) * 0.105;
        const by = 0.18 + 0.58 + r * 0.16;
        lanternAmberGeos.push(makeBox(0.035, 0.02, 0.02, bx, by, vmZ + 0.24));
      }
    }
    metalDarkGeos.push(makeBox(0.06, 0.14, 0.02, -0.32, 0.18 + 0.54, vmZ + 0.24));
    metalDarkGeos.push(makeBox(0.48, 0.18, 0.03, -0.55, 0.18 + 0.24, vmZ + 0.24));
    concreteTrimGeos.push(makeBox(0.38, 0.03, 0.03, -0.55, 0.18 + 0.28, vmZ + 0.26));

    // Machine 2: Blue Cold Energy & Sports Drinks (+0.25, vmZ)
    vendingBlueGeos.push(makeBox(0.66, 1.32, 0.44, 0.25, 0.18 + 0.66, vmZ));
    metalDarkGeos.push(makeBox(0.68, 0.08, 0.46, 0.25, 0.18 + 0.04, vmZ));
    lanternAmberGeos.push(makeBox(0.58, 0.13, 0.04, 0.25, 0.18 + 1.22, vmZ + 0.23));
    vendingDisplayGeos.push(makeBox(0.56, 0.54, 0.04, 0.25, 0.18 + 0.82, vmZ + 0.23));

    for (let c = 0; c < 5; c++) {
      const cx = 0.25 + (c - 2) * 0.105;
      vendingBlueGeos.push(makeCyl(0.025, 0.025, 0.08, 6, cx, 0.18 + 0.98, vmZ + 0.25));
      waterFlowGeos.push(makeCyl(0.023, 0.023, 0.09, 6, cx, 0.18 + 0.82, vmZ + 0.25));
      vendingDisplayGeos.push(makeCyl(0.024, 0.024, 0.08, 6, cx, 0.18 + 0.66, vmZ + 0.25));
    }
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        const bx = 0.25 + (c - 2) * 0.105;
        const by = 0.18 + 0.58 + r * 0.16;
        lanternAmberGeos.push(makeBox(0.035, 0.02, 0.02, bx, by, vmZ + 0.24));
      }
    }
    metalDarkGeos.push(makeBox(0.06, 0.14, 0.02, 0.48, 0.18 + 0.54, vmZ + 0.24));
    metalDarkGeos.push(makeBox(0.48, 0.18, 0.03, 0.25, 0.18 + 0.24, vmZ + 0.24));
    concreteTrimGeos.push(makeBox(0.38, 0.03, 0.03, 0.25, 0.18 + 0.28, vmZ + 0.26));

    // Can & Bottle Recycling Receptacle (+0.82, binZ)
    grassMatGeos.push(makeBox(0.28, 0.64, 0.40, 0.82, 0.18 + 0.32, binZ));
    metalDarkGeos.push(makeBox(0.30, 0.06, 0.42, 0.82, 0.18 + 0.65, binZ));
    metalDarkGeos.push(makeCyl(0.045, 0.045, 0.02, 8, 0.76, 0.18 + 0.68, binZ + 0.06));
    metalDarkGeos.push(makeCyl(0.045, 0.045, 0.02, 8, 0.88, 0.18 + 0.68, binZ - 0.06));

    // --- E. DETAILED GOURMET BURGER KIOSK (-1.65, 1.35) ---
    const kx = -1.65;
    const kz = 1.35;

    // Wooden Cart Body & Counter
    woodDeckGeos.push(makeBox(1.50, 0.72, 0.95, kx, 0.18 + 0.36, kz));
    metalDarkGeos.push(makeBox(1.54, 0.08, 0.98, kx, 0.18 + 0.04, kz));
    concreteTrimGeos.push(makeBox(1.58, 0.06, 0.34, kx, 0.18 + 0.74, kz + 0.36));

    // 4 Black steel canopy poles
    metalDarkGeos.push(makeCyl(0.025, 0.025, 1.15, 8, kx - 0.68, 0.18 + 1.28, kz - 0.42));
    metalDarkGeos.push(makeCyl(0.025, 0.025, 1.15, 8, kx + 0.68, 0.18 + 1.28, kz - 0.42));
    metalDarkGeos.push(makeCyl(0.025, 0.025, 1.15, 8, kx - 0.68, 0.18 + 1.28, kz + 0.42));
    metalDarkGeos.push(makeCyl(0.025, 0.025, 1.15, 8, kx + 0.68, 0.18 + 1.28, kz + 0.42));

    // Striped Canopy Awning (alternating red and cream stripes)
    const stripeCount = 8;
    const stripeW = 1.64 / stripeCount;
    for (let st = 0; st < stripeCount; st++) {
      const stX = kx - 0.82 + (st + 0.5) * stripeW;
      const targetGeos = st % 2 === 0 ? awningAGeos : awningBGeos;
      const stripeMesh = new THREE.BoxGeometry(stripeW, 0.06, 1.24);
      stripeMesh.rotateX(0.18);
      stripeMesh.translate(stX, 0.18 + 1.84, kz + 0.05);
      targetGeos.push(stripeMesh);

      const valence = makeBox(stripeW * 0.95, 0.12, 0.02, stX, 0.18 + 1.70, kz + 0.66);
      targetGeos.push(valence);
    }

    // 3D Giant Cheeseburger Roof Emblem
    burgerBunGeos.push(makeCyl(0.38, 0.40, 0.15, 12, kx, 0.18 + 2.22, kz));
    for (let s = 0; s < 8; s++) {
      const sa = (s / 8) * Math.PI * 2;
      const seed = new THREE.BoxGeometry(0.02, 0.015, 0.03);
      seed.translate(kx + Math.cos(sa) * 0.22, 0.18 + 2.30, kz + Math.sin(sa) * 0.22);
      awningBGeos.push(seed);
    }
    burgerLettuceGeos.push(makeBox(0.78, 0.04, 0.78, kx, 0.18 + 2.14, kz, 0, Math.PI / 4));
    burgerCheeseGeos.push(makeBox(0.74, 0.035, 0.74, kx, 0.18 + 2.10, kz));
    burgerPattyGeos.push(makeCyl(0.39, 0.39, 0.09, 12, kx, 0.18 + 2.04, kz));
    burgerBunGeos.push(makeCyl(0.38, 0.36, 0.09, 12, kx, 0.18 + 1.95, kz));
    metalDarkGeos.push(makeCyl(0.02, 0.02, 0.18, 6, kx - 0.18, 0.18 + 1.88, kz));
    metalDarkGeos.push(makeCyl(0.02, 0.02, 0.18, 6, kx + 0.18, 0.18 + 1.88, kz));

    // Chalkboard menu sign on front of cart
    metalDarkGeos.push(makeBox(0.68, 0.34, 0.03, kx, 0.18 + 0.42, kz + 0.49));
    concreteTrimGeos.push(makeBox(0.48, 0.02, 0.04, kx, 0.18 + 0.48, kz + 0.495));
    concreteTrimGeos.push(makeBox(0.36, 0.015, 0.04, kx, 0.18 + 0.42, kz + 0.495));
    concreteTrimGeos.push(makeBox(0.42, 0.015, 0.04, kx, 0.18 + 0.36, kz + 0.495));

    // Ketchup and mustard squeeze bottles on counter
    ketchupGeos.push(makeCyl(0.035, 0.035, 0.13, 8, kx - 0.62, 0.18 + 0.83, kz + 0.36));
    ketchupGeos.push(makeCyl(0.01, 0.02, 0.05, 8, kx - 0.62, 0.18 + 0.91, kz + 0.36));
    mustardGeos.push(makeCyl(0.035, 0.035, 0.13, 8, kx - 0.52, 0.18 + 0.83, kz + 0.36));
    mustardGeos.push(makeCyl(0.01, 0.02, 0.05, 8, kx - 0.52, 0.18 + 0.91, kz + 0.36));

    // Burger takeout boxes & chrome order bell
    kraftBoxGeos.push(makeBox(0.18, 0.07, 0.18, kx - 0.28, 0.18 + 0.80, kz + 0.36));
    kraftBoxGeos.push(makeBox(0.17, 0.07, 0.17, kx - 0.28, 0.18 + 0.87, kz + 0.36));
    concreteTrimGeos.push(makeCyl(0.03, 0.045, 0.04, 8, kx - 0.05, 0.18 + 0.79, kz + 0.38));

    // Griddle & warm hanging Edison light
    concreteTrimGeos.push(makeBox(0.55, 0.04, 0.45, kx + 0.35, 0.18 + 0.74, kz - 0.10));
    lanternAmberGeos.push(makeCyl(0.045, 0.045, 0.08, 8, kx, 0.18 + 1.62, kz + 0.20));
    metalDarkGeos.push(makeCyl(0.008, 0.008, 0.22, 6, kx, 0.18 + 1.76, kz + 0.20));

    // --- MERGE ALL BUCKETS INTO DRAW CALLS ---
    addMergedBucket(group, concreteTrimGeos, mats.concreteTrim, true, true);
    addMergedBucket(group, concreteDarkGeos, mats.concreteDark, true, true);
    addMergedBucket(group, metalDarkGeos, mats.metalDark, true, true);
    addMergedBucket(group, waterGeos, mats.waterMat, false, true);
    addMergedBucket(group, waterFlowGeos, mats.waterFlow, false, false);
    addMergedBucket(group, waterFoamGeos, mats.waterFoam, false, false);
    addMergedBucket(group, vendingRedGeos, mats.vendingRed, true, true);
    addMergedBucket(group, vendingBlueGeos, mats.vendingBlue, true, true);
    addMergedBucket(group, vendingDisplayGeos, mats.vendingDisplay, false, false);
    addMergedBucket(group, lanternAmberGeos, mats.lanternAmber, false, false);
    addMergedBucket(group, woodDeckGeos, mats.woodDeck, true, true);
    addMergedBucket(group, awningAGeos, mats.awningStripeA, true, true);
    addMergedBucket(group, awningBGeos, mats.awningStripeB, true, true);
    addMergedBucket(group, burgerBunGeos, mats.burgerBunMat, true, true);
    addMergedBucket(group, burgerPattyGeos, mats.burgerPattyMat, true, true);
    addMergedBucket(group, burgerCheeseGeos, mats.burgerCheeseMat, false, false);
    addMergedBucket(group, burgerLettuceGeos, mats.burgerLettuceMat, true, true);
    addMergedBucket(group, ketchupGeos, mats.ketchupRed, true, true);
    addMergedBucket(group, mustardGeos, mats.mustardYellow, true, true);
    addMergedBucket(group, kraftBoxGeos, mats.kraftBox, true, true);
    addMergedBucket(group, grassMatGeos, mats.grassMat, true, true);

    return group;
  }

  // BUILDING PARAMETERS
  const height = lot.height ?? 4.2;
  const isRestaurant = lot.type === 'restaurant';
  const width = isRamen ? 4.1 : isRestaurant ? 4.3 : 4.65;
  const depth = isRamen ? 3.3 : isRestaurant ? 3.6 : 4.45;
  const zOffset = isRestaurant ? -0.55 : 0;

  const facadeMat = isAptBalcony
    ? mats.brickWarm
    : new THREE.MeshStandardMaterial({
        color: lot.baseColor ?? '#d6bca2',
        roughness: 0.76,
      });

  const accentMat = new THREE.MeshStandardMaterial({
    color: lot.accentColor ?? '#543b2e',
    roughness: 0.72,
  });

  // Geometry buckets for single-draw-call merging per material
  const facadeGeos: THREE.BufferGeometry[] = [];
  const accentGeos: THREE.BufferGeometry[] = [];
  const trimGeos: THREE.BufferGeometry[] = [];
  const metalGeos: THREE.BufferGeometry[] = [];
  const woodTrimGeos: THREE.BufferGeometry[] = [];
  const litWindowGeos: THREE.BufferGeometry[] = [];
  const dimWindowGeos: THREE.BufferGeometry[] = [];
  const awningAGeos: THREE.BufferGeometry[] = [];
  const awningBGeos: THREE.BufferGeometry[] = [];
  const lanternGeos: THREE.BufferGeometry[] = [];

  // 1. BASE BUILDING MASS
  facadeGeos.push(makeBox(width, height, depth, 0, 0.18 + height / 2, zOffset));

  // Storefront base plinth
  accentGeos.push(makeBox(width + 0.1, 1.25, depth + 0.1, 0, 0.18 + 0.625, zOffset));

  // Roof parapet rim & dark gravel deck
  trimGeos.push(
    makeBox(width + 0.22, 0.28, depth + 0.22, 0, 0.18 + height + 0.12, zOffset),
    makeBox(width + 0.12, 0.42, 0.18, 0, 0.18 + height + 0.28, zOffset + depth / 2),
    makeBox(width + 0.12, 0.42, 0.18, 0, 0.18 + height + 0.28, zOffset - depth / 2),
    makeBox(0.18, 0.42, depth + 0.12, width / 2, 0.18 + height + 0.28, zOffset),
    makeBox(0.18, 0.42, depth + 0.12, -width / 2, 0.18 + height + 0.28, zOffset),
  );
  trimGeos.push(makeBox(width - 0.2, 0.08, depth - 0.2, 0, 0.18 + height + 0.06, zOffset));

  // 2. DETAILED WINDOWS WITH RECESSED FRAMES & SILLS
  const floors = Math.max(1, Math.floor((height - 1.2) / 1.15));
  const cols = isRamen ? 2 : 3;
  const seedBase = lot.row * 37 + lot.col * 23;

  for (let f = 0; f < floors; f++) {
    const wy = 0.18 + 1.45 + f * 1.18;
    for (let c = 0; c < cols; c++) {
      const wx = -((cols - 1) * 1.2) / 2 + c * 1.2;
      const isLit = windowHash(seedBase + f * 7 + c * 13) > 0.32;
      const windowTarget = isLit ? litWindowGeos : dimWindowGeos;

      // Front facade windows (+Z)
      const fz = zOffset + depth / 2 + 0.02;
      windowTarget.push(makeBox(0.68, 0.64, 0.06, wx, wy, fz));
      trimGeos.push(
        makeBox(0.8, 0.08, 0.14, wx, wy - 0.36, fz + 0.04), // Window sill
        makeBox(0.8, 0.08, 0.1, wx, wy + 0.36, fz + 0.02), // Lintel
      );
      metalGeos.push(
        makeBox(0.72, 0.03, 0.04, wx, wy, fz + 0.04), // Horizontal muntin bar
        makeBox(0.03, 0.66, 0.04, wx, wy, fz + 0.04), // Vertical muntin bar
      );

      // Back facade windows (-Z)
      const bz = zOffset - depth / 2 - 0.02;
      windowTarget.push(makeBox(0.68, 0.64, 0.06, wx, wy, bz));
      trimGeos.push(
        makeBox(0.8, 0.08, 0.14, wx, wy - 0.36, bz - 0.04),
        makeBox(0.8, 0.08, 0.1, wx, wy + 0.36, bz - 0.02),
      );
    }
  }

  // 3. STOREFRONT LEVEL DISPLAY WINDOWS & ENTRANCES
  if (isRestaurant || isBurgerDiner || lot.style === 'corner_shop') {
    // Warm glowing main storefront display window
    litWindowGeos.push(
      makeBox(width * 0.74, 0.88, 0.08, 0, 0.18 + 0.68, zOffset + depth / 2 + 0.08),
    );
    trimGeos.push(
      makeBox(width * 0.78, 0.08, 0.16, 0, 0.18 + 0.22, zOffset + depth / 2 + 0.12),
      makeBox(width * 0.78, 0.1, 0.16, 0, 0.18 + 1.15, zOffset + depth / 2 + 0.12),
    );
  }

  // 4. FIRE ESCAPES & BALCONIES (Balcony Apartment & Commercial)
  if (isAptBalcony) {
    const balconyFloors = Math.max(1, Math.floor((height - 1.4) / 1.25));
    for (let b = 0; b < balconyFloors; b++) {
      const by = 0.18 + 1.4 + b * 1.25;
      const bz = zOffset + depth / 2 + 0.42;
      const bw = width * 0.82;

      // Platform grating + structural support beams
      metalGeos.push(
        makeBox(bw, 0.06, 0.75, 0, by, bz),
        makeBox(0.06, 0.45, 0.72, -bw * 0.45, by - 0.24, bz, 0.35),
        makeBox(0.06, 0.45, 0.72, bw * 0.45, by - 0.24, bz, 0.35),
      );

      // Front & side safety railings
      metalGeos.push(
        makeBox(bw, 0.04, 0.04, 0, by + 0.42, bz + 0.36),
        makeBox(bw, 0.04, 0.04, 0, by + 0.22, bz + 0.36),
        makeBox(0.04, 0.42, 0.74, -bw / 2, by + 0.21, bz),
        makeBox(0.04, 0.42, 0.74, bw / 2, by + 0.21, bz),
      );

      // Vertical balusters
      for (let p = -4; p <= 4; p++) {
        metalGeos.push(makeBox(0.03, 0.42, 0.03, (p / 4) * (bw * 0.46), by + 0.21, bz + 0.36));
      }

      // Connecting angled ladder / stairs between floors
      if (b < balconyFloors - 1) {
        metalGeos.push(
          makeBox(0.04, 1.4, 0.04, bw * 0.38, by + 0.65, bz - 0.05, 0.35),
          makeBox(0.04, 1.4, 0.04, bw * 0.22, by + 0.65, bz - 0.05, 0.35),
        );
      }
    }
  }

  // 5. SAKURA RAMEN CORNER SPECIFIC CRAFT
  if (isRamen) {
    // Wooden facade framing & front entrance lattice
    woodTrimGeos.push(
      makeBox(width + 0.15, 0.12, 0.15, 0, 0.18 + 1.38, zOffset + depth / 2 + 0.08),
      makeBox(0.12, 1.4, 0.12, -width / 2 + 0.06, 0.18 + 0.7, zOffset + depth / 2 + 0.08),
      makeBox(0.12, 1.4, 0.12, width / 2 - 0.06, 0.18 + 0.7, zOffset + depth / 2 + 0.08),
    );

    // Front outdoor wooden patio deck
    woodTrimGeos.push(makeBox(width + 1.2, 0.12, 1.8, 0, 0.22, zOffset + depth / 2 + 1.05));

    // Scalloped striped fabric awning angled over the front
    const stripeCount = 8;
    const stripeW = (width * 0.94) / stripeCount;
    for (let s = 0; s < stripeCount; s++) {
      const sx = -((stripeCount - 1) * stripeW) / 2 + s * stripeW;
      const geo = makeBox(stripeW - 0.015, 0.08, 1.1, sx, 0.18 + 1.32, zOffset + depth / 2 + 0.55, 0.32);
      if (s % 2 === 0) awningAGeos.push(geo);
      else awningBGeos.push(geo);
    }

    // Glowing Japanese paper lanterns under the awning eaves
    for (const lx of [-1.35, -0.45, 0.45, 1.35]) {
      lanternGeos.push(
        makeCyl(0.12, 0.14, 0.32, 8, lx, 0.18 + 1.12, zOffset + depth / 2 + 0.95),
      );
    }

    // Rooftop kitchen exhaust vents & AC units
    metalGeos.push(
      makeCyl(0.18, 0.22, 0.95, 10, 1.1, 0.18 + height + 0.58, zOffset + 0.2),
      makeCyl(0.15, 0.18, 0.85, 10, 0.65, 0.18 + height + 0.52, zOffset + 0.35),
      makeBox(0.9, 0.52, 0.7, -0.9, 0.18 + height + 0.42, zOffset - 0.3),
    );
  }

  // 6. SUNSET CAFÉ & GRILL SPECIFIC CRAFT
  if (isBurgerDiner) {
    const stripeCount = 7;
    const stripeW = (width * 0.9) / stripeCount;
    for (let s = 0; s < stripeCount; s++) {
      const sx = -((stripeCount - 1) * stripeW) / 2 + s * stripeW;
      const geo = makeBox(stripeW - 0.015, 0.08, 1.0, sx, 0.18 + 1.32, zOffset + depth / 2 + 0.5, 0.3);
      if (s % 2 === 0) awningAGeos.push(geo);
      else awningBGeos.push(geo);
    }
  }

  // 7. ROOFTOP PROPS & HERO BILBOARDS

  // A. Giant 3D Ceramic Coffee Cup (on Balcony Apartment)
  if (lot.rooftopProp === 'coffee_cup' || isAptBalcony) {
    const cx = -0.9;
    const cy = 0.18 + height + 0.68;
    const cz = zOffset + 0.35;

    // Saucer
    const saucer = new THREE.Mesh(makeCyl(0.85, 0.68, 0.12, 16, cx, cy - 0.28, cz), mats.coffeeCupMat);
    saucer.castShadow = true;
    group.add(saucer);

    // Cup body
    const cup = new THREE.Mesh(makeCyl(0.62, 0.44, 0.75, 16, cx, cy + 0.14, cz), mats.coffeeCupMat);
    cup.castShadow = true;
    group.add(cup);

    // Dark liquid inside
    const coffee = new THREE.Mesh(makeCyl(0.55, 0.55, 0.08, 16, cx, cy + 0.44, cz), mats.coffeeLiquidMat);
    group.add(coffee);

    // Handle
    const handle = new THREE.Mesh(makeBox(0.12, 0.42, 0.28, cx + 0.62, cy + 0.12, cz), mats.coffeeCupMat);
    group.add(handle);
  }

  // B. Giant 3D Cheeseburger Billboard (on Sunset Café Diner)
  if (lot.rooftopProp === 'burger' || isBurgerDiner) {
    const bx = 0;
    const by = 0.18 + height + 0.72;
    const bz = zOffset;

    // Mounting stilt frame
    metalGeos.push(
      makeBox(0.08, 0.6, 0.08, -0.6, by - 0.35, bz),
      makeBox(0.08, 0.6, 0.08, 0.6, by - 0.35, bz),
      makeBox(1.3, 0.06, 0.08, 0, by - 0.12, bz),
    );

    // Bottom bun
    const bottomBun = new THREE.Mesh(makeCyl(0.72, 0.68, 0.22, 16, bx, by, bz), mats.burgerBunMat);
    bottomBun.castShadow = true;
    group.add(bottomBun);

    // Beef patty
    const patty = new THREE.Mesh(makeCyl(0.76, 0.76, 0.18, 16, bx, by + 0.18, bz), mats.burgerPattyMat);
    patty.castShadow = true;
    group.add(patty);

    // Melted yellow cheese (turned box)
    const cheese = new THREE.Mesh(makeBox(1.05, 0.06, 1.05, bx, by + 0.28, bz, 0, Math.PI / 4), mats.burgerCheeseMat);
    group.add(cheese);

    // Crisp lettuce
    const lettuce = new THREE.Mesh(makeCyl(0.8, 0.8, 0.08, 16, bx, by + 0.34, bz), mats.burgerLettuceMat);
    group.add(lettuce);

    // Top sesame bun
    const topBunGeo = new THREE.SphereGeometry(0.72, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    topBunGeo.translate(bx, by + 0.38, bz);
    const topBun = new THREE.Mesh(topBunGeo, mats.burgerBunMat);
    topBun.castShadow = true;
    group.add(topBun);
  }

  // C. Rooftop Wooden Water Tower on Stilt Frame (on Commercial Tower)
  if (isCommercialTower) {
    const wx = 0.85;
    const wy = 0.18 + height + 0.95;
    const wz = zOffset - 0.35;

    // 4-legged metal stilt frame with cross braces
    metalGeos.push(
      makeBox(0.08, 0.95, 0.08, wx - 0.5, wy - 0.45, wz - 0.5),
      makeBox(0.08, 0.95, 0.08, wx + 0.5, wy - 0.45, wz - 0.5),
      makeBox(0.08, 0.95, 0.08, wx - 0.5, wy - 0.45, wz + 0.5),
      makeBox(0.08, 0.95, 0.08, wx + 0.5, wy - 0.45, wz + 0.5),
      makeBox(1.15, 0.08, 1.15, wx, wy + 0.04, wz),
    );

    // Wooden barrel
    const barrel = new THREE.Mesh(makeCyl(0.68, 0.68, 1.05, 14, wx, wy + 0.58, wz), mats.woodTrim);
    barrel.castShadow = true;
    group.add(barrel);

    // Conical metal roof
    const coneRoof = new THREE.Mesh(new THREE.ConeGeometry(0.78, 0.52, 14), mats.roofDark);
    coneRoof.position.set(wx, wy + 1.35, wz);
    coneRoof.castShadow = true;
    group.add(coneRoof);
  }

  // D. General AC Units & Rooftop Antennas
  if (lot.rooftopProp === 'ac_units' || lot.rooftopProp === 'antenna' || (!isBurgerDiner && !isAptBalcony && !isRamen)) {
    metalGeos.push(
      makeBox(0.9, 0.5, 0.68, -0.85, 0.18 + height + 0.42, zOffset - 0.4),
      makeBox(0.75, 0.44, 0.62, 0.8, 0.18 + height + 0.39, zOffset - 0.45),
    );
  }
  if (lot.rooftopProp === 'antenna' || isAptBalcony) {
    metalGeos.push(
      makeCyl(0.03, 0.04, 1.6, 6, -1.2, 0.18 + height + 0.95, zOffset - 0.8),
      makeBox(0.6, 0.03, 0.03, -1.2, 0.18 + height + 1.45, zOffset - 0.8),
      makeBox(0.4, 0.03, 0.03, -1.2, 0.18 + height + 1.25, zOffset - 0.8),
    );
  }

  // E. Chimney Stacks with Steam Pipes
  if (lot.hasSteam) {
    trimGeos.push(
      makeBox(0.55, 0.95, 0.55, 1.05, 0.18 + height + 0.48, zOffset + 0.3),
    );
    metalGeos.push(
      makeCyl(0.12, 0.14, 0.85, 8, 1.05, 0.18 + height + 0.85, zOffset + 0.3),
    );
  }

  // MERGE ALL BUCKETS INTO CLEAN COMPONENT MESHES
  addMergedBucket(group, facadeGeos, facadeMat, true, true);
  addMergedBucket(group, accentGeos, accentMat, true, true);
  addMergedBucket(group, trimGeos, mats.concreteTrim, true, true);
  addMergedBucket(group, metalGeos, mats.metalDark, true, true);
  addMergedBucket(group, woodTrimGeos, mats.woodTrim, true, true);
  addMergedBucket(group, litWindowGeos, mats.litWindowWarm, false, false);
  addMergedBucket(group, dimWindowGeos, mats.dimWindow, false, false);
  addMergedBucket(group, awningAGeos, mats.awningStripeA, true, true);
  addMergedBucket(group, awningBGeos, mats.awningStripeB, true, true);
  addMergedBucket(group, lanternGeos, mats.lanternRed, false, false);

  // 8. GLOWING NEON SIGNS & ILLUMINATED STOREFRONT FASCIA
  if (lot.neonSign) {
    const isVertical = isCommercialTower || lot.style === 'commercial_mid';
    const neonMat = new THREE.MeshStandardMaterial({
      color: lot.neonSign.color,
      emissive: lot.neonSign.color,
      emissiveIntensity: 3.5,
      roughness: 0.15,
      toneMapped: false,
    });

    if (isVertical) {
      // Vertical blade sign projecting outward from corner
      const signBack = new THREE.Mesh(
        makeBox(0.12, 2.4, 0.6, width / 2 + 0.32, 0.18 + height * 0.6, zOffset + depth / 2 - 0.4),
        mats.metalDark,
      );
      const signFace = new THREE.Mesh(
        makeBox(0.16, 2.2, 0.52, width / 2 + 0.32, 0.18 + height * 0.6, zOffset + depth / 2 - 0.4),
        neonMat,
      );
      group.add(signBack, signFace);
    } else {
      // Horizontal fascia sign mounted above awning/entrance
      const signBack = new THREE.Mesh(
        makeBox(2.2, 0.46, 0.14, 0, Math.min(height - 0.2, 2.38), zOffset + depth / 2 + 0.22),
        mats.metalDark,
      );
      const signFace = new THREE.Mesh(
        makeBox(2.05, 0.38, 0.18, 0, Math.min(height - 0.2, 2.38), zOffset + depth / 2 + 0.23),
        neonMat,
      );
      group.add(signBack, signFace);
    }
  }

  return group;
}
