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

/**
 * Creates a circular embossed cast-iron sewer manhole cover.
 */
export function createManholeGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Main cast-iron disc
  const disc = new THREE.CylinderGeometry(0.34, 0.35, 0.035, 14);
  disc.translate(0, 0.018, 0);
  geos.push(ensureIndexed(disc));

  // Concentric embossed ring
  const ring = new THREE.TorusGeometry(0.24, 0.015, 4, 14);
  ring.rotateX(Math.PI * 0.5);
  ring.translate(0, 0.035, 0);
  geos.push(ensureIndexed(ring));

  // Center hub
  const hub = new THREE.CylinderGeometry(0.08, 0.08, 0.012, 10);
  hub.translate(0, 0.036, 0);
  geos.push(ensureIndexed(hub));

  return mergeGeometries(geos, false)!;
}

/**
 * Creates a slotted rectangular cast-iron storm drain curb grate.
 */
export function createStormDrainGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  const w = 0.68;
  const d = 0.34;
  const h = 0.03;

  // Outer frame
  const frameL = new THREE.BoxGeometry(0.04, h, d);
  frameL.translate(-w * 0.5 + 0.02, h * 0.5, 0);
  geos.push(ensureIndexed(frameL));

  const frameR = new THREE.BoxGeometry(0.04, h, d);
  frameR.translate(w * 0.5 - 0.02, h * 0.5, 0);
  geos.push(ensureIndexed(frameR));

  const frameT = new THREE.BoxGeometry(w, h, 0.04);
  frameT.translate(0, h * 0.5, -d * 0.5 + 0.02);
  geos.push(ensureIndexed(frameT));

  const frameB = new THREE.BoxGeometry(w, h, 0.04);
  frameB.translate(0, h * 0.5, d * 0.5 - 0.02);
  geos.push(ensureIndexed(frameB));

  // 5 parallel slotted steel bars
  const barCount = 5;
  const spacing = (w - 0.12) / (barCount + 1);
  for (let i = 1; i <= barCount; i++) {
    const bar = new THREE.BoxGeometry(0.024, h * 0.85, d - 0.08);
    bar.translate(-w * 0.5 + 0.06 + i * spacing, h * 0.45, 0);
    geos.push(ensureIndexed(bar));
  }

  return mergeGeometries(geos, false)!;
}

/**
 * Creates a classic street newspaper vending box (coin-op steel cabinet on pedestal).
 */
export function createNewspaperBoxGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Steel pedestal foot & leg
  const foot = new THREE.BoxGeometry(0.28, 0.03, 0.28);
  foot.translate(0, 0.015, 0);
  geos.push(ensureIndexed(foot));

  const leg = new THREE.CylinderGeometry(0.04, 0.04, 0.32, 6);
  leg.translate(0, 0.18, 0);
  geos.push(ensureIndexed(leg));

  // Main cabinet housing
  const boxW = 0.44;
  const boxH = 0.52;
  const boxD = 0.38;
  const boxY = 0.34 + boxH * 0.5;

  const body = new THREE.BoxGeometry(boxW, boxH, boxD);
  body.translate(0, boxY, 0);
  geos.push(ensureIndexed(body));

  // Front display door frame
  const door = new THREE.BoxGeometry(boxW * 0.82, boxH * 0.65, 0.035);
  door.translate(0, boxY - 0.04, boxD * 0.5 + 0.01);
  geos.push(ensureIndexed(door));

  // Coin mechanism hood on top
  const hood = new THREE.BoxGeometry(boxW * 0.5, 0.08, 0.14);
  hood.translate(0, boxY + boxH * 0.5 + 0.04, 0.08);
  geos.push(ensureIndexed(hood));

  // Pull handle
  const handle = new THREE.CylinderGeometry(0.015, 0.015, 0.24, 5);
  handle.rotateZ(Math.PI * 0.5);
  handle.translate(0, boxY + 0.12, boxD * 0.5 + 0.04);
  geos.push(ensureIndexed(handle));

  return mergeGeometries(geos, false)!;
}

/**
 * Creates an exterior wall-mounted HVAC compressor unit with louvered fan and pipes.
 */
export function createWallAcUnitGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  const w = 0.58;
  const h = 0.42;
  const d = 0.28;

  // Compressor cabinet
  const body = new THREE.BoxGeometry(w, h, d);
  body.translate(0, h * 0.5, 0);
  geos.push(ensureIndexed(body));

  // Circular fan grille on front (+Z)
  const fanGrille = new THREE.CylinderGeometry(0.14, 0.14, 0.02, 12);
  fanGrille.rotateX(Math.PI * 0.5);
  fanGrille.translate(-0.08, h * 0.5, d * 0.5 + 0.01);
  geos.push(ensureIndexed(fanGrille));

  // Side service valve cover
  const valve = new THREE.BoxGeometry(0.08, 0.14, 0.06);
  valve.translate(w * 0.5 - 0.08, h * 0.5, d * 0.5 + 0.01);
  geos.push(ensureIndexed(valve));

  // 2 Wall mounting angle brackets (-Z)
  for (const bx of [-w * 0.38, w * 0.38]) {
    const bracketH = new THREE.BoxGeometry(0.035, 0.035, d + 0.08);
    bracketH.translate(bx, 0.02, -0.04);
    geos.push(ensureIndexed(bracketH));

    const bracketV = new THREE.BoxGeometry(0.035, h * 0.7, 0.035);
    bracketV.translate(bx, -h * 0.35 + 0.02, -d * 0.5 - 0.04);
    geos.push(ensureIndexed(bracketV));
  }

  return mergeGeometries(geos, false)!;
}

/**
 * Creates a classic rooftop timber water tower on a 4-legged steel stilt frame.
 */
export function createRooftopWaterTowerGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  const stiltH = 1.05;
  const stiltW = 1.1;
  const stiltD = 1.1;
  const legR = 0.045;

  // 4 Angled steel stilt legs
  const corners = [
    [-stiltW * 0.5, -stiltD * 0.5],
    [stiltW * 0.5, -stiltD * 0.5],
    [stiltW * 0.5, stiltD * 0.5],
    [-stiltW * 0.5, stiltD * 0.5],
  ];
  for (const [cx, cz] of corners) {
    const leg = new THREE.CylinderGeometry(legR, legR, stiltH, 6);
    leg.translate(cx!, stiltH * 0.5, cz!);
    geos.push(ensureIndexed(leg));
  }

  // Horizontal platform base for the tank
  const platform = new THREE.BoxGeometry(stiltW + 0.12, 0.08, stiltD + 0.12);
  platform.translate(0, stiltH + 0.04, 0);
  geos.push(ensureIndexed(platform));

  // Cylindrical wooden slatted water tank
  const tankR = 0.72;
  const tankH = 1.15;
  const tankY = stiltH + 0.08 + tankH * 0.5;

  const tank = new THREE.CylinderGeometry(tankR, tankR, tankH, 12);
  tank.translate(0, tankY, 0);
  geos.push(ensureIndexed(tank));

  // Steel hoop bands around tank
  for (const hy of [-0.35, 0, 0.35]) {
    const hoop = new THREE.TorusGeometry(tankR + 0.015, 0.018, 4, 12);
    hoop.rotateX(Math.PI * 0.5);
    hoop.translate(0, tankY + hy, 0);
    geos.push(ensureIndexed(hoop));
  }

  // Conical tin roof cap
  const roofH = 0.45;
  const roof = new THREE.ConeGeometry(tankR + 0.08, roofH, 12);
  roof.translate(0, tankY + tankH * 0.5 + roofH * 0.5, 0);
  geos.push(ensureIndexed(roof));

  // Maintenance ladder on side
  const ladderX = tankR + 0.06;
  for (let r = 0; r <= 8; r++) {
    const rungY = stiltH * 0.5 + (r / 8) * (stiltH * 0.5 + tankH * 0.8);
    const rung = new THREE.CylinderGeometry(0.015, 0.015, 0.28, 5);
    rung.rotateX(Math.PI * 0.5);
    rung.translate(ladderX, rungY, 0);
    geos.push(ensureIndexed(rung));
  }

  return mergeGeometries(geos, false)!;
}

/**
 * Creates rooftop clothesline posts with fluttering laundry.
 */
export function createClotheslineGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  const postH = 0.95;
  const postSpan = 2.4;
  const armW = 0.82;

  // 2 Wooden T-posts
  for (const px of [-postSpan * 0.5, postSpan * 0.5]) {
    const mast = new THREE.CylinderGeometry(0.035, 0.04, postH, 6);
    mast.translate(px, postH * 0.5, 0);
    geos.push(ensureIndexed(mast));

    const arm = new THREE.BoxGeometry(0.05, 0.05, armW);
    arm.translate(px, postH, 0);
    geos.push(ensureIndexed(arm));
  }

  // 4 Fluttering laundry towels / shirts hanging on lines
  const clothes = [
    { x: -0.65, z: -0.22, w: 0.28, h: 0.38, rotY: 0.15, rotZ: 0.12 },
    { x: -0.15, z: -0.22, w: 0.25, h: 0.32, rotY: -0.12, rotZ: 0.08 },
    { x: 0.35, z: 0.22, w: 0.3, h: 0.42, rotY: 0.18, rotZ: -0.1 },
    { x: 0.82, z: 0.22, w: 0.24, h: 0.3, rotY: -0.15, rotZ: -0.06 },
  ];

  for (const c of clothes) {
    const cloth = new THREE.BoxGeometry(c.w, c.h, 0.02);
    cloth.rotateY(c.rotY);
    cloth.rotateZ(c.rotZ);
    cloth.translate(c.x, postH - c.h * 0.5 - 0.02, c.z);
    geos.push(ensureIndexed(cloth));
  }

  return mergeGeometries(geos, false)!;
}
