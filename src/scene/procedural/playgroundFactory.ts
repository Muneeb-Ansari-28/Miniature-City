import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function ensureIndexed(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  if (!geo.index) {
    const pos = geo.getAttribute('position');
    const indices: number[] = [];
    for (let i = 0; i < pos.count; i++) indices.push(i);
    geo.setIndex(indices);
  }
  return geo;
}

export interface SlideGeometries {
  wood: THREE.BufferGeometry;
  chute: THREE.BufferGeometry;
  roof: THREE.BufferGeometry;
}

export interface SwingGeometries {
  frame: THREE.BufferGeometry;
  seats: THREE.BufferGeometry;
}

export interface SandboxGeometries {
  rim: THREE.BufferGeometry;
  sand: THREE.BufferGeometry;
  toys: THREE.BufferGeometry;
}

export interface SeesawGeometries {
  fulcrum: THREE.BufferGeometry;
  plank: THREE.BufferGeometry;
}

export interface GardenAmenitiesGeometries {
  birdbath: THREE.BufferGeometry;
  water: THREE.BufferGeometry;
  fountain: THREE.BufferGeometry;
  steppingStones: THREE.BufferGeometry;
}

/**
 * Creates high-quality children's playground slide geometries:
 * - Sturdy timber platform tower with 4 stilts, safety railings, ladder rungs
 * - Smooth, glossy curved slide chute with raised safety lips and landing apron
 * - Peaked colorful fabric canopy roof atop tower
 */
export function createPlaygroundSlideGeometries(): SlideGeometries {
  const woodGeos: THREE.BufferGeometry[] = [];
  const chuteGeos: THREE.BufferGeometry[] = [];
  const roofGeos: THREE.BufferGeometry[] = [];

  const platformH = 0.95;
  const platformW = 0.84;
  const platformD = 0.84;

  // 1. Four vertical wooden stilts
  const stiltR = 0.045;
  const stiltH = platformH + 0.95;
  const corners = [
    [-platformW * 0.5, -platformD * 0.5],
    [platformW * 0.5, -platformD * 0.5],
    [platformW * 0.5, platformD * 0.5],
    [-platformW * 0.5, platformD * 0.5],
  ];
  for (const [cx, cz] of corners) {
    const stilt = new THREE.CylinderGeometry(stiltR, stiltR, stiltH, 6);
    stilt.translate(cx!, stiltH * 0.5, cz!);
    woodGeos.push(ensureIndexed(stilt));
  }

  // 2. Wooden deck floor
  const deck = new THREE.BoxGeometry(platformW + 0.08, 0.06, platformD + 0.08);
  deck.translate(0, platformH, 0);
  woodGeos.push(ensureIndexed(deck));

  // 3. Safety railings around 3 sides (except slide exit and ladder entry)
  const railH = 0.42;
  const railT = 0.035;

  // Back railing
  const backRail = new THREE.BoxGeometry(platformW, railT, railT);
  backRail.translate(0, platformH + railH, -platformD * 0.5);
  woodGeos.push(ensureIndexed(backRail));

  // Left railing
  const leftRail = new THREE.BoxGeometry(railT, railT, platformD);
  leftRail.translate(-platformW * 0.5, platformH + railH, 0);
  woodGeos.push(ensureIndexed(leftRail));

  // Right railing
  const rightRail = new THREE.BoxGeometry(railT, railT, platformD);
  rightRail.translate(platformW * 0.5, platformH + railH, 0);
  woodGeos.push(ensureIndexed(rightRail));

  // Vertical balusters
  for (const z of [-0.25, 0, 0.25]) {
    const balLeft = new THREE.CylinderGeometry(0.018, 0.018, railH, 5);
    balLeft.translate(-platformW * 0.5, platformH + railH * 0.5, z);
    woodGeos.push(ensureIndexed(balLeft));

    const balRight = new THREE.CylinderGeometry(0.018, 0.018, railH, 5);
    balRight.translate(platformW * 0.5, platformH + railH * 0.5, z);
    woodGeos.push(ensureIndexed(balRight));
  }

  // 4. Ladder on the back (z = -platformD * 0.5)
  const ladderAngle = 0.22;
  for (const lx of [-0.22, 0.22]) {
    const rail = new THREE.CylinderGeometry(0.03, 0.03, platformH * 1.08, 6);
    rail.rotateX(ladderAngle);
    rail.translate(lx, platformH * 0.5, -platformD * 0.5 - 0.18);
    woodGeos.push(ensureIndexed(rail));
  }
  for (let step = 1; step <= 4; step++) {
    const rungY = (platformH / 5) * step;
    const rungZ = -platformD * 0.5 - Math.tan(ladderAngle) * (platformH - rungY) - 0.05;
    const rung = new THREE.CylinderGeometry(0.02, 0.02, 0.42, 6);
    rung.rotateZ(Math.PI * 0.5);
    rung.translate(0, rungY, rungZ);
    woodGeos.push(ensureIndexed(rung));
  }

  // 5. Curved slide chute exiting front (+z)
  const chuteLen = 1.65;
  const chuteAngle = 0.58; // ~33 degrees descent

  // Chute bed
  const bed = new THREE.BoxGeometry(0.52, 0.045, chuteLen);
  bed.rotateX(chuteAngle);
  bed.translate(0, platformH * 0.5, platformD * 0.5 + Math.cos(chuteAngle) * chuteLen * 0.5 - 0.08);
  chuteGeos.push(ensureIndexed(bed));

  // Raised safety rims on both sides of chute
  for (const rx of [-0.26, 0.26]) {
    const rim = new THREE.CylinderGeometry(0.035, 0.035, chuteLen, 6);
    rim.rotateX(chuteAngle);
    rim.translate(rx, platformH * 0.5 + 0.045, platformD * 0.5 + Math.cos(chuteAngle) * chuteLen * 0.5 - 0.08);
    chuteGeos.push(ensureIndexed(rim));
  }

  // Landing apron at base
  const landing = new THREE.BoxGeometry(0.54, 0.04, 0.35);
  landing.translate(0, 0.04, platformD * 0.5 + Math.cos(chuteAngle) * chuteLen + 0.06);
  chuteGeos.push(ensureIndexed(landing));

  // 6. Peaked canopy roof over tower
  const roof = new THREE.ConeGeometry(platformW * 0.85, 0.45, 4);
  roof.rotateY(Math.PI * 0.25);
  roof.translate(0, stiltH + 0.2, 0);
  roofGeos.push(ensureIndexed(roof));

  return {
    wood: mergeGeometries(woodGeos, false)!,
    chute: mergeGeometries(chuteGeos, false)!,
    roof: mergeGeometries(roofGeos, false)!,
  };
}

/**
 * Creates classic playground swing set geometries:
 * - Sturdy A-frame timber legs with top spreader beam and steel bracing plates
 * - 2 swing bays with suspended chains and rubber sling seats
 */
export function createSwingSetGeometries(): SwingGeometries {
  const frameGeos: THREE.BufferGeometry[] = [];
  const seatGeos: THREE.BufferGeometry[] = [];

  const swingH = 1.95;
  const swingSpan = 2.4;
  const legR = 0.055;
  const legSpreadAngle = 0.32;

  // Horizontal top crossbeam
  const topBeam = new THREE.BoxGeometry(swingSpan + 0.3, 0.11, 0.11);
  topBeam.translate(0, swingH, 0);
  frameGeos.push(ensureIndexed(topBeam));

  // A-frame end legs
  for (const endX of [-swingSpan * 0.5, swingSpan * 0.5]) {
    // Front leg
    const legF = new THREE.CylinderGeometry(legR, legR, swingH / Math.cos(legSpreadAngle), 6);
    legF.rotateX(legSpreadAngle);
    legF.translate(endX, swingH * 0.5, Math.tan(legSpreadAngle) * swingH * 0.5);
    frameGeos.push(ensureIndexed(legF));

    // Back leg
    const legB = new THREE.CylinderGeometry(legR, legR, swingH / Math.cos(legSpreadAngle), 6);
    legB.rotateX(-legSpreadAngle);
    legB.translate(endX, swingH * 0.5, -Math.tan(legSpreadAngle) * swingH * 0.5);
    frameGeos.push(ensureIndexed(legB));

    // Horizontal A-brace strut
    const strut = new THREE.BoxGeometry(0.08, 0.05, Math.tan(legSpreadAngle) * swingH * 0.8);
    strut.translate(endX, swingH * 0.38, 0);
    frameGeos.push(ensureIndexed(strut));
  }

  // 2 Swing bays
  const bayXs = [-0.62, 0.62];
  for (const bx of bayXs) {
    const seatW = 0.42;
    const seatY = 0.35;
    const chainH = swingH - seatY - 0.08;

    // Left and right hanging suspension chains
    for (const cx of [bx - seatW * 0.45, bx + seatW * 0.45]) {
      const chain = new THREE.CylinderGeometry(0.012, 0.012, chainH, 5);
      chain.translate(cx, seatY + chainH * 0.5, 0);
      seatGeos.push(ensureIndexed(chain));
    }

    // Flexible curved rubber swing seat
    const seat = new THREE.BoxGeometry(seatW, 0.035, 0.2);
    seat.translate(bx, seatY, 0);
    seatGeos.push(ensureIndexed(seat));
  }

  return {
    frame: mergeGeometries(frameGeos, false)!,
    seats: mergeGeometries(seatGeos, false)!,
  };
}

/**
 * Creates an octagonal wooden sandbox with sand mound and toy bucket/shovel/sandcastle:
 */
export function createSandboxGeometries(): SandboxGeometries {
  const rimGeos: THREE.BufferGeometry[] = [];
  const sandGeos: THREE.BufferGeometry[] = [];
  const toyGeos: THREE.BufferGeometry[] = [];

  const radius = 0.88;
  const height = 0.2;

  // 1. Octagonal timber perimeter rim
  const rimOuter = new THREE.CylinderGeometry(radius, radius, height, 8, 1, true);
  rimOuter.translate(0, height * 0.5, 0);
  rimGeos.push(ensureIndexed(rimOuter));

  // Flat seating ledge on rim top
  const rimLedge = new THREE.CylinderGeometry(radius + 0.06, radius - 0.08, 0.035, 8, 1, true);
  rimLedge.translate(0, height, 0);
  rimGeos.push(ensureIndexed(rimLedge));

  // 2. Sand mound
  const sand = new THREE.CylinderGeometry(radius - 0.06, radius - 0.06, height * 0.85, 8);
  sand.translate(0, height * 0.45, 0);
  sandGeos.push(ensureIndexed(sand));

  // Little central sandcastle
  const castleBase = new THREE.CylinderGeometry(0.14, 0.18, 0.16, 6);
  castleBase.translate(0.25, height + 0.08, 0.15);
  sandGeos.push(ensureIndexed(castleBase));

  const castleTurret = new THREE.ConeGeometry(0.1, 0.12, 6);
  castleTurret.translate(0.25, height + 0.22, 0.15);
  sandGeos.push(ensureIndexed(castleTurret));

  // 3. Bright toy bucket & shovel
  const bucket = new THREE.CylinderGeometry(0.085, 0.06, 0.12, 8);
  bucket.translate(-0.35, height + 0.06, -0.2);
  toyGeos.push(ensureIndexed(bucket));

  const shovel = new THREE.BoxGeometry(0.04, 0.16, 0.015);
  shovel.rotateZ(0.35);
  shovel.translate(-0.48, height + 0.07, -0.22);
  toyGeos.push(ensureIndexed(shovel));

  return {
    rim: mergeGeometries(rimGeos, false)!,
    sand: mergeGeometries(sandGeos, false)!,
    toys: mergeGeometries(toyGeos, false)!,
  };
}

/**
 * Creates dynamic seesaw (teeter-totter) geometry with fulcrum bracket and tilted beam:
 */
export function createSeesawGeometries(): SeesawGeometries {
  const fulcrumGeos: THREE.BufferGeometry[] = [];
  const plankGeos: THREE.BufferGeometry[] = [];

  const fulcrumH = 0.42;
  const plankLen = 2.1;
  const tiltAngle = 0.19; // ~11 degrees

  // 1. Triangular pivot fulcrum base
  const fulcrumL = new THREE.ConeGeometry(0.18, fulcrumH, 3);
  fulcrumL.translate(-0.14, fulcrumH * 0.5, 0);
  fulcrumGeos.push(ensureIndexed(fulcrumL));

  const fulcrumR = new THREE.ConeGeometry(0.18, fulcrumH, 3);
  fulcrumR.translate(0.14, fulcrumH * 0.5, 0);
  fulcrumGeos.push(ensureIndexed(fulcrumR));

  const pivotPin = new THREE.CylinderGeometry(0.035, 0.035, 0.38, 6);
  pivotPin.rotateZ(Math.PI * 0.5);
  pivotPin.translate(0, fulcrumH, 0);
  fulcrumGeos.push(ensureIndexed(pivotPin));

  // 2. Tilted balance plank
  const plank = new THREE.BoxGeometry(plankLen, 0.05, 0.22);
  plank.rotateZ(tiltAngle);
  plank.translate(0, fulcrumH + 0.03, 0);
  plankGeos.push(ensureIndexed(plank));

  // Molded seats on both ends
  for (const endSign of [-1, 1]) {
    const endX = endSign * (plankLen * 0.5 - 0.18);
    const endY = fulcrumH + 0.03 + Math.sin(tiltAngle) * endX;

    const seat = new THREE.BoxGeometry(0.28, 0.04, 0.24);
    seat.rotateZ(tiltAngle);
    seat.translate(endX, endY + 0.03, 0);
    plankGeos.push(ensureIndexed(seat));

    // Handlebar
    const handlePost = new THREE.CylinderGeometry(0.015, 0.015, 0.16, 5);
    handlePost.rotateZ(tiltAngle);
    handlePost.translate(endX + endSign * 0.12, endY + 0.1, 0);
    plankGeos.push(ensureIndexed(handlePost));

    const handleGrip = new THREE.CylinderGeometry(0.014, 0.014, 0.18, 5);
    handleGrip.translate(endX + endSign * 0.12, endY + 0.18, 0);
    plankGeos.push(ensureIndexed(handleGrip));
  }

  return {
    fulcrum: mergeGeometries(fulcrumGeos, false)!,
    plank: mergeGeometries(plankGeos, false)!,
  };
}

/**
 * Creates botanical garden amenities for park_pocket_east:
 * - Carved stone birdbath basin on fluted pedestal with water pool
 * - Modern stone drinking fountain with chrome bubbler
 * - Flagstone garden stepping stones
 */
export function createGardenAmenitiesGeometries(): GardenAmenitiesGeometries {
  const birdbathGeos: THREE.BufferGeometry[] = [];
  const waterGeos: THREE.BufferGeometry[] = [];
  const fountainGeos: THREE.BufferGeometry[] = [];
  const stonesGeos: THREE.BufferGeometry[] = [];

  // 1. Birdbath
  const pedestal = new THREE.CylinderGeometry(0.09, 0.15, 0.72, 8);
  pedestal.translate(0, 0.36, 0);
  birdbathGeos.push(ensureIndexed(pedestal));

  const basinBase = new THREE.CylinderGeometry(0.38, 0.15, 0.12, 8);
  basinBase.translate(0, 0.78, 0);
  birdbathGeos.push(ensureIndexed(basinBase));

  const basinRim = new THREE.CylinderGeometry(0.38, 0.36, 0.08, 8, 1, true);
  basinRim.translate(0, 0.88, 0);
  birdbathGeos.push(ensureIndexed(basinRim));

  // Birdbath water disc
  const waterDisc = new THREE.CircleGeometry(0.34, 12);
  waterDisc.rotateX(-Math.PI * 0.5);
  waterDisc.translate(0, 0.85, 0);
  waterGeos.push(ensureIndexed(waterDisc));

  // 2. Drinking fountain
  const fountainBody = new THREE.BoxGeometry(0.32, 0.78, 0.32);
  fountainBody.translate(0, 0.39, 0);
  fountainGeos.push(ensureIndexed(fountainBody));

  const catchBasin = new THREE.CylinderGeometry(0.14, 0.11, 0.06, 8);
  catchBasin.translate(0, 0.81, 0);
  fountainGeos.push(ensureIndexed(catchBasin));

  const bubbler = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 6);
  bubbler.rotateZ(0.25);
  bubbler.translate(-0.06, 0.87, 0);
  fountainGeos.push(ensureIndexed(bubbler));

  // 3. Stepping stones
  const stoneCoords = [
    [-0.8, -0.6, 0.28],
    [-0.5, -0.2, 0.32],
    [-0.1, 0.1, 0.29],
    [0.3, 0.4, 0.34],
    [0.7, 0.7, 0.31],
  ];
  for (const [sx, sz, r] of stoneCoords) {
    const stone = new THREE.CylinderGeometry(r!, r! * 1.05, 0.05, 7);
    stone.translate(sx!, 0.025, sz!);
    stonesGeos.push(ensureIndexed(stone));
  }

  return {
    birdbath: mergeGeometries(birdbathGeos, false)!,
    water: mergeGeometries(waterGeos, false)!,
    fountain: mergeGeometries(fountainGeos, false)!,
    steppingStones: mergeGeometries(stonesGeos, false)!,
  };
}
