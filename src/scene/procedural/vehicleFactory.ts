import * as THREE from 'three';
import { VEHICLE_SPECS } from '@/config/constants';
import type { VehicleType } from '@/sim/types';

export interface ProceduralVehicleRig {
  group: THREE.Group;
  headlightMat: THREE.MeshStandardMaterial;
  brakeLightMat: THREE.MeshStandardMaterial;
  headlightCone: THREE.Mesh;
}

/**
 * Builds a charming stylized miniature vehicle (taxi, bus, van, sedan, compact)
 * with controllable headlight/brake-light emissives and nighttime headlight beam cone.
 */
export function createProceduralVehicle(
  type: VehicleType,
  bodyColor: string,
): ProceduralVehicleRig {
  const spec = VEHICLE_SPECS[type];
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor,
    roughness: 0.45,
    metalness: 0.15,
  });
  const cabinMat = new THREE.MeshStandardMaterial({
    color: type === 'bus' ? '#f5efe6' : bodyColor,
    roughness: 0.42,
    metalness: 0.12,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: '#2b394d',
    emissive: type === 'bus' ? '#ffcf86' : '#1a2433',
    emissiveIntensity: type === 'bus' ? 0.55 : 0.15,
    roughness: 0.15,
    metalness: 0.35,
  });
  const wheelMat = new THREE.MeshStandardMaterial({
    color: '#24252b',
    roughness: 0.9,
  });

  const headlightMat = new THREE.MeshStandardMaterial({
    color: '#fff6d6',
    emissive: '#ffe9a8',
    emissiveIntensity: 0.35,
    toneMapped: false,
  });
  const brakeLightMat = new THREE.MeshStandardMaterial({
    color: '#8f2424',
    emissive: '#ff2b2b',
    emissiveIntensity: 0.15,
    toneMapped: false,
  });

  const w = spec.width;
  const l = spec.length;
  const h = spec.height;

  // Lower chassis
  const chassisH = type === 'bus' ? h * 0.78 : h * 0.46;
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(w, chassisH, l), bodyMat);
  chassis.position.y = 0.22 + chassisH * 0.5;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);

  // Upper cabin
  if (type === 'bus') {
    const glassBand = new THREE.Mesh(new THREE.BoxGeometry(w + 0.03, h * 0.32, l * 0.86), glassMat);
    glassBand.position.y = 0.22 + h * 0.58;
    const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.96, 0.12, l * 0.96), cabinMat);
    roof.position.y = 0.22 + chassisH + 0.05;
    group.add(glassBand, roof);
  } else {
    const cabinL = type === 'van' ? l * 0.72 : l * 0.54;
    const cabinH = h * 0.44;
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, cabinH, cabinL), cabinMat);
    cabin.position.set(0, 0.22 + chassisH + cabinH * 0.46, type === 'van' ? -l * 0.08 : -l * 0.04);
    cabin.castShadow = true;
    const windows = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.89, cabinH * 0.64, cabinL * 0.84),
      glassMat,
    );
    windows.position.copy(cabin.position);
    group.add(cabin, windows);

    // Glowing yellow TAXI roof sign
    if (type === 'taxi') {
      const signMat = new THREE.MeshStandardMaterial({
        color: '#fff2a6',
        emissive: '#ffcf40',
        emissiveIntensity: 1.6,
        toneMapped: false,
      });
      const taxiSign = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.14, 0.2), signMat);
      taxiSign.position.set(0, 0.22 + chassisH + cabinH + 0.06, -l * 0.04);
      group.add(taxiSign);
    }
  }

  // 4 Wheels
  const wheelGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.16, 10);
  wheelGeo.rotateZ(Math.PI / 2);
  const wheelOffsets: [number, number][] = [
    [-w * 0.48, l * 0.3],
    [w * 0.48, l * 0.3],
    [-w * 0.48, -l * 0.3],
    [w * 0.48, -l * 0.3],
  ];
  for (const [wx, wz] of wheelOffsets) {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat);
    wheel.position.set(wx, 0.2, wz);
    group.add(wheel);
  }

  // Front Headlights (+Z is forward in our yaw = atan2(dx, dz) convention)
  const lightGeo = new THREE.BoxGeometry(0.2, 0.12, 0.06);
  const hlLeft = new THREE.Mesh(lightGeo, headlightMat);
  hlLeft.position.set(-w * 0.32, 0.4, l * 0.5 + 0.01);
  const hlRight = new THREE.Mesh(lightGeo, headlightMat);
  hlRight.position.set(w * 0.32, 0.4, l * 0.5 + 0.01);
  group.add(hlLeft, hlRight);

  // Rear Brake Lights (-Z)
  const blLeft = new THREE.Mesh(lightGeo, brakeLightMat);
  blLeft.position.set(-w * 0.32, 0.42, -l * 0.5 - 0.01);
  const blRight = new THREE.Mesh(lightGeo, brakeLightMat);
  blRight.position.set(w * 0.32, 0.42, -l * 0.5 - 0.01);
  group.add(blLeft, blRight);

  // Lightweight additive headlight beam cone on the asphalt at night
  const coneGeo = new THREE.ConeGeometry(0.85, 2.6, 10, 1, true);
  coneGeo.rotateX(-Math.PI / 2);
  const coneMat = new THREE.MeshBasicMaterial({
    color: '#ffe8a3',
    transparent: true,
    opacity: 0.16,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const headlightCone = new THREE.Mesh(coneGeo, coneMat);
  headlightCone.position.set(0, 0.28, l * 0.5 + 1.3);
  headlightCone.visible = false;
  group.add(headlightCone);

  return {
    group,
    headlightMat,
    brakeLightMat,
    headlightCone,
  };
}
