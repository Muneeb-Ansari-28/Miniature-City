import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { VehicleType } from '@/sim/types';

export interface VehicleGeometryPack {
  body: THREE.BufferGeometry;
  glass: THREE.BufferGeometry;
  chrome: THREE.BufferGeometry;
  roofSign?: THREE.BufferGeometry;
}

/**
 * Creates high-detail wheel geometries: outer dark rubber tire and inner recessed silver hubcap.
 */
export function createWheelGeometries(): {
  tire: THREE.BufferGeometry;
  hubcap: THREE.BufferGeometry;
} {
  // Outer rubber tire
  const tireGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.14, 14);
  tireGeo.rotateZ(Math.PI / 2);

  // Outer silver hubcap disc on the outer rim
  const hubGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.04, 12);
  hubGeo.rotateZ(Math.PI / 2);
  hubGeo.translate(0.065, 0, 0);

  const lugNut = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 6);
  lugNut.rotateZ(Math.PI / 2);
  lugNut.translate(0.08, 0, 0);

  const hubcap = mergeGeometries([hubGeo, lugNut], false)!;
  hubcap.computeVertexNormals();

  tireGeo.computeVertexNormals();
  return { tire: tireGeo, hubcap };
}

/**
 * Builds the classic 3-box Sedan geometries (Hood, sculpted fenders, stepped trunk, raked windshield, chrome bumpers).
 */
export function createSedanGeometries(): VehicleGeometryPack {
  const bodyGeos: THREE.BufferGeometry[] = [];
  const glassGeos: THREE.BufferGeometry[] = [];
  const chromeGeos: THREE.BufferGeometry[] = [];

  // --- BODY (Car Paint) ---
  // Lower chassis slab
  const lowerChassis = new THREE.BoxGeometry(1.02, 0.22, 2.12);
  lowerChassis.translate(0, 0.27, 0);
  bodyGeos.push(lowerChassis);

  // Front hood (bonnet) sloping forward
  const hood = new THREE.BoxGeometry(0.96, 0.14, 0.82);
  hood.translate(0, 0.44, 0.62);
  bodyGeos.push(hood);

  // Hood center power bulge
  const bulge = new THREE.BoxGeometry(0.36, 0.04, 0.72);
  bulge.translate(0, 0.52, 0.62);
  bodyGeos.push(bulge);

  // Rear trunk (boot) stepping down from cabin
  const trunk = new THREE.BoxGeometry(0.96, 0.15, 0.64);
  trunk.translate(0, 0.43, -0.72);
  bodyGeos.push(trunk);

  // Cabin roof panel
  const roof = new THREE.BoxGeometry(0.86, 0.06, 0.88);
  roof.translate(0, 0.81, -0.06);
  bodyGeos.push(roof);

  // Windshield frame / A-pillars (left & right)
  for (const sx of [-0.42, 0.42]) {
    const aPillar = new THREE.BoxGeometry(0.06, 0.38, 0.06);
    aPillar.rotateX(-0.48);
    aPillar.translate(sx, 0.62, 0.21);
    bodyGeos.push(aPillar);
  }

  // C-pillars / rear window frame (left & right)
  for (const sx of [-0.42, 0.42]) {
    const cPillar = new THREE.BoxGeometry(0.06, 0.36, 0.08);
    cPin: cPillar.rotateX(0.46);
    cPillar.translate(sx, 0.62, -0.34);
    bodyGeos.push(cPillar);
  }

  // B-pillars (center window dividers)
  for (const sx of [-0.43, 0.43]) {
    const bPillar = new THREE.BoxGeometry(0.05, 0.32, 0.06);
    bPillar.translate(sx, 0.62, -0.06);
    bodyGeos.push(bPillar);
  }

  // --- GLASS (Tinted Glossy Glass) ---
  // Raked front windshield
  const windshield = new THREE.BoxGeometry(0.82, 0.38, 0.04);
  windshield.rotateX(-0.52);
  windshield.translate(0, 0.63, 0.22);
  glassGeos.push(windshield);

  // Raked rear window
  const rearWindow = new THREE.BoxGeometry(0.80, 0.36, 0.04);
  rearWindow.rotateX(0.48);
  rearWindow.translate(0, 0.63, -0.35);
  glassGeos.push(rearWindow);

  // Side windows (recessed left & right glass block)
  const sideGlass = new THREE.BoxGeometry(0.85, 0.29, 0.78);
  sideGlass.translate(0, 0.62, -0.06);
  glassGeos.push(sideGlass);

  // --- CHROME & DETAILS ---
  // Front chrome bumper
  const frontBumper = new THREE.BoxGeometry(1.06, 0.09, 0.09);
  frontBumper.translate(0, 0.25, 1.09);
  chromeGeos.push(frontBumper);

  // Front bumper guards
  for (const sx of [-0.28, 0.28]) {
    const guard = new THREE.BoxGeometry(0.04, 0.14, 0.06);
    guard.translate(sx, 0.27, 1.12);
    chromeGeos.push(guard);
  }

  // Rear chrome bumper
  const rearBumper = new THREE.BoxGeometry(1.06, 0.09, 0.09);
  rearBumper.translate(0, 0.25, -1.08);
  chromeGeos.push(rearBumper);

  // Front radiator grille frame + slats
  const grille = new THREE.BoxGeometry(0.52, 0.14, 0.03);
  grille.translate(0, 0.36, 1.07);
  chromeGeos.push(grille);

  // Side mirrors (left & right)
  for (const sx of [-0.52, 0.52]) {
    const mirrorStem = new THREE.BoxGeometry(0.08, 0.03, 0.03);
    mirrorStem.translate(sx, 0.54, 0.24);
    const mirrorCap = new THREE.BoxGeometry(0.06, 0.08, 0.12);
    mirrorCap.translate(sx > 0 ? sx + 0.04 : sx - 0.04, 0.54, 0.24);
    chromeGeos.push(mirrorStem, mirrorCap);
  }

  // Polished exhaust pipe
  const exhaust = new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8);
  exhaust.rotateX(Math.PI / 2);
  exhaust.translate(-0.32, 0.19, -1.09);
  chromeGeos.push(exhaust);

  const body = mergeGeometries(bodyGeos, false)!;
  const glass = mergeGeometries(glassGeos, false)!;
  const chrome = mergeGeometries(chromeGeos, false)!;

  body.computeVertexNormals();
  glass.computeVertexNormals();
  chrome.computeVertexNormals();

  return { body, glass, chrome };
}

/**
 * Builds the Taxi geometries (NYC style yellow cab with illuminated roof sign & checker trim).
 */
export function createTaxiGeometries(): VehicleGeometryPack {
  const pack = createSedanGeometries();

  // Roof sign geometry (bracket base + illuminated taxi wedge)
  const signGeos: THREE.BufferGeometry[] = [];
  const base = new THREE.BoxGeometry(0.38, 0.04, 0.18);
  base.translate(0, 0.85, -0.06);
  const signBody = new THREE.BoxGeometry(0.34, 0.14, 0.16);
  signBody.translate(0, 0.93, -0.06);
  signGeos.push(base, signBody);

  const roofSign = mergeGeometries(signGeos, false)!;
  roofSign.computeVertexNormals();

  return {
    ...pack,
    roofSign,
  };
}

/**
 * Builds the Compact / Retro Hatchback geometries (rounded cute Mini style, steep hatch, rear spoiler).
 */
export function createCompactGeometries(): VehicleGeometryPack {
  const bodyGeos: THREE.BufferGeometry[] = [];
  const glassGeos: THREE.BufferGeometry[] = [];
  const chromeGeos: THREE.BufferGeometry[] = [];

  // --- BODY ---
  // Lower rounded chassis
  const chassis = new THREE.BoxGeometry(0.96, 0.22, 1.76);
  chassis.translate(0, 0.26, 0);
  bodyGeos.push(chassis);

  // Short sloping hood
  const hood = new THREE.BoxGeometry(0.90, 0.15, 0.62);
  hood.translate(0, 0.44, 0.54);
  bodyGeos.push(hood);

  // Steep rear hatch slope
  const hatch = new THREE.BoxGeometry(0.88, 0.18, 0.42);
  hatch.rotateX(0.32);
  hatch.translate(0, 0.46, -0.64);
  bodyGeos.push(hatch);

  // Rounded roof
  const roof = new THREE.BoxGeometry(0.82, 0.06, 0.82);
  roof.translate(0, 0.80, -0.05);
  bodyGeos.push(roof);

  // Roof spoiler lip over rear hatch
  const spoiler = new THREE.BoxGeometry(0.84, 0.04, 0.12);
  spoiler.translate(0, 0.82, -0.48);
  bodyGeos.push(spoiler);

  // A-pillars
  for (const sx of [-0.40, 0.40]) {
    const aPillar = new THREE.BoxGeometry(0.05, 0.36, 0.06);
    aPillar.rotateX(-0.42);
    aPillar.translate(sx, 0.61, 0.22);
    bodyGeos.push(aPillar);
  }

  // --- GLASS ---
  const windshield = new THREE.BoxGeometry(0.78, 0.36, 0.04);
  windshield.rotateX(-0.46);
  windshield.translate(0, 0.62, 0.22);
  glassGeos.push(windshield);

  const rearGlass = new THREE.BoxGeometry(0.76, 0.34, 0.04);
  rearGlass.rotateX(0.48);
  rearGlass.translate(0, 0.63, -0.44);
  glassGeos.push(rearGlass);

  const sideGlass = new THREE.BoxGeometry(0.80, 0.28, 0.74);
  sideGlass.translate(0, 0.61, -0.08);
  glassGeos.push(sideGlass);

  // --- CHROME ---
  const frontBumper = new THREE.BoxGeometry(1.00, 0.08, 0.08);
  frontBumper.translate(0, 0.24, 0.90);
  const rearBumper = new THREE.BoxGeometry(1.00, 0.08, 0.08);
  rearBumper.translate(0, 0.24, -0.90);
  const grille = new THREE.BoxGeometry(0.46, 0.12, 0.03);
  grille.translate(0, 0.35, 0.89);

  for (const sx of [-0.49, 0.49]) {
    const mirror = new THREE.BoxGeometry(0.05, 0.07, 0.09);
    mirror.translate(sx, 0.52, 0.22);
    chromeGeos.push(mirror);
  }
  chromeGeos.push(frontBumper, rearBumper, grille);

  const body = mergeGeometries(bodyGeos, false)!;
  const glass = mergeGeometries(glassGeos, false)!;
  const chrome = mergeGeometries(chromeGeos, false)!;

  body.computeVertexNormals();
  glass.computeVertexNormals();
  chrome.computeVertexNormals();

  return { body, glass, chrome };
}

/**
 * Builds the Delivery Van geometries (high cargo box, rear split doors, roof rack, utility bumpers).
 */
export function createVanGeometries(): VehicleGeometryPack {
  const bodyGeos: THREE.BufferGeometry[] = [];
  const glassGeos: THREE.BufferGeometry[] = [];
  const chromeGeos: THREE.BufferGeometry[] = [];

  // --- BODY ---
  // Lower chassis
  const chassis = new THREE.BoxGeometry(1.12, 0.24, 2.48);
  chassis.translate(0, 0.26, 0);
  bodyGeos.push(chassis);

  // High rear cargo compartment
  const cargoBox = new THREE.BoxGeometry(1.10, 0.78, 1.48);
  cargoBox.translate(0, 0.74, -0.46);
  bodyGeos.push(cargoBox);

  // Front cabin roof
  const cabRoof = new THREE.BoxGeometry(1.06, 0.08, 0.72);
  cabRoof.translate(0, 1.10, 0.44);
  bodyGeos.push(cabRoof);

  // Front sloping hood
  const hood = new THREE.BoxGeometry(1.04, 0.22, 0.74);
  hood.translate(0, 0.46, 0.86);
  bodyGeos.push(hood);

  // Split rear doors divider line (recessed black groove simulated)
  const rearFrame = new THREE.BoxGeometry(1.08, 0.74, 0.04);
  rearFrame.translate(0, 0.74, -1.21);
  bodyGeos.push(rearFrame);

  // --- GLASS ---
  // High upright front windshield
  const windshield = new THREE.BoxGeometry(0.96, 0.44, 0.04);
  windshield.rotateX(-0.35);
  windshield.translate(0, 0.84, 0.58);
  glassGeos.push(windshield);

  // Cab side windows
  const sideGlass = new THREE.BoxGeometry(1.04, 0.36, 0.56);
  sideGlass.translate(0, 0.82, 0.38);
  glassGeos.push(sideGlass);

  // --- CHROME & UTILITY ---
  const frontBumper = new THREE.BoxGeometry(1.16, 0.12, 0.10);
  frontBumper.translate(0, 0.25, 1.25);
  const rearStepBumper = new THREE.BoxGeometry(1.16, 0.10, 0.14);
  rearStepBumper.translate(0, 0.22, -1.26);

  // Large truck-style side mirrors
  for (const sx of [-0.59, 0.59]) {
    const arm = new THREE.BoxGeometry(0.08, 0.03, 0.03);
    arm.translate(sx, 0.78, 0.56);
    const mirror = new THREE.BoxGeometry(0.06, 0.16, 0.10);
    mirror.translate(sx > 0 ? sx + 0.04 : sx - 0.04, 0.78, 0.56);
    chromeGeos.push(arm, mirror);
  }

  // Rooftop utility ladder rack rails
  for (const sx of [-0.44, 0.44]) {
    const rail = new THREE.BoxGeometry(0.04, 0.05, 1.34);
    rail.translate(sx, 1.15, -0.44);
    chromeGeos.push(rail);
  }
  for (const sz of [-0.9, -0.4, 0.1]) {
    const crossbar = new THREE.BoxGeometry(0.92, 0.03, 0.04);
    crossbar.translate(0, 1.15, sz);
    chromeGeos.push(crossbar);
  }

  chromeGeos.push(frontBumper, rearStepBumper);

  const body = mergeGeometries(bodyGeos, false)!;
  const glass = mergeGeometries(glassGeos, false)!;
  const chrome = mergeGeometries(chromeGeos, false)!;

  body.computeVertexNormals();
  glass.computeVertexNormals();
  chrome.computeVertexNormals();

  return { body, glass, chrome };
}

/**
 * Builds the City Transit Bus geometries (wrap-around panoramic windows, roof AC units, destination display).
 */
export function createBusGeometries(): VehicleGeometryPack {
  const bodyGeos: THREE.BufferGeometry[] = [];
  const glassGeos: THREE.BufferGeometry[] = [];
  const chromeGeos: THREE.BufferGeometry[] = [];

  // --- BODY ---
  // Lower bus body chassis
  const chassis = new THREE.BoxGeometry(1.22, 0.48, 3.36);
  chassis.translate(0, 0.38, 0);
  bodyGeos.push(chassis);

  // Upper white roof cap
  const roof = new THREE.BoxGeometry(1.20, 0.12, 3.34);
  roof.translate(0, 1.38, 0);
  bodyGeos.push(roof);

  // Corner pillars framing the bus
  for (const sx of [-0.58, 0.58]) {
    for (const sz of [-1.64, 1.64]) {
      const corner = new THREE.BoxGeometry(0.08, 0.76, 0.08);
      corner.translate(sx, 0.94, sz);
      bodyGeos.push(corner);
    }
  }

  // --- GLASS (Panoramic wrap-around window ribbon) ---
  const windowRibbon = new THREE.BoxGeometry(1.18, 0.62, 3.28);
  windowRibbon.translate(0, 0.96, 0);
  glassGeos.push(windowRibbon);

  // --- CHROME & DETAILS ---
  // Heavy transit bumpers
  const frontBumper = new THREE.BoxGeometry(1.26, 0.14, 0.12);
  frontBumper.translate(0, 0.24, 1.70);
  const rearBumper = new THREE.BoxGeometry(1.26, 0.14, 0.12);
  rearBumper.translate(0, 0.24, -1.70);
  chromeGeos.push(frontBumper, rearBumper);

  // Rooftop AC pods (2 units on roof)
  for (const sz of [-0.6, 0.6]) {
    const acPod = new THREE.BoxGeometry(0.68, 0.14, 0.72);
    acPod.translate(0, 1.48, sz);
    chromeGeos.push(acPod);
  }

  // Big side mirrors
  for (const sx of [-0.66, 0.66]) {
    const mirrorStem = new THREE.BoxGeometry(0.12, 0.04, 0.04);
    mirrorStem.translate(sx, 1.05, 1.62);
    const mirror = new THREE.BoxGeometry(0.06, 0.24, 0.12);
    mirror.translate(sx > 0 ? sx + 0.06 : sx - 0.06, 1.05, 1.62);
    chromeGeos.push(mirrorStem, mirror);
  }

  // Destination board banner above windshield
  const destBoard = new THREE.BoxGeometry(0.82, 0.14, 0.06);
  destBoard.translate(0, 1.32, 1.68);
  chromeGeos.push(destBoard);

  const body = mergeGeometries(bodyGeos, false)!;
  const glass = mergeGeometries(glassGeos, false)!;
  const chrome = mergeGeometries(chromeGeos, false)!;

  body.computeVertexNormals();
  glass.computeVertexNormals();
  chrome.computeVertexNormals();

  return { body, glass, chrome };
}

/**
 * Creates and caches geometry packs for all vehicle types.
 */
export function buildAllVehicleGeometries(): {
  packs: Record<VehicleType, VehicleGeometryPack>;
  wheel: { tire: THREE.BufferGeometry; hubcap: THREE.BufferGeometry };
} {
  return {
    packs: {
      sedan: createSedanGeometries(),
      taxi: createTaxiGeometries(),
      compact: createCompactGeometries(),
      van: createVanGeometries(),
      bus: createBusGeometries(),
    },
    wheel: createWheelGeometries(),
  };
}
