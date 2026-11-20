import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { WorldEngine } from '@/sim/worldEngine';

interface PedestrianRendererProps {
  engine: WorldEngine;
}

const scratchObj = new THREE.Object3D();
const scratchColor = new THREE.Color();

const HAIR_CAP_COLORS = [
  '#1e1b18', // Espresso black
  '#4a3222', // Chestnut brown
  '#2b2d34', // Charcoal
  '#d49b43', // Golden blonde
  '#823c28', // Auburn red
  '#c93b2b', // Street cap red
  '#2a4b7c', // Denim blue cap
  '#2e5339', // Forest green beanie
] as const;

/**
 * Creates high-detail leg geometry with shoe foot base.
 * Pivot point is at the hip (y = 0) for natural swinging stride.
 */
function createLegGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Trouser leg extending downwards from hip
  const trouser = new THREE.BoxGeometry(0.075, 0.28, 0.08);
  trouser.translate(0, -0.14, 0);
  geos.push(trouser);

  // Dark shoe foot extending forward
  const shoe = new THREE.BoxGeometry(0.08, 0.055, 0.12);
  shoe.translate(0, -0.27, 0.02);
  geos.push(shoe);

  const merged = mergeGeometries(geos, false)!;
  merged.computeVertexNormals();
  return merged;
}

/**
 * Creates stylized arm with hand at the wrist.
 * Pivot point is at the shoulder (y = 0) for natural arm swing.
 */
function createArmGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Sleeve and arm extending downwards from shoulder
  const sleeve = new THREE.BoxGeometry(0.062, 0.22, 0.062);
  sleeve.translate(0, -0.11, 0);
  geos.push(sleeve);

  // Hand sphere at wrist
  const hand = new THREE.SphereGeometry(0.032, 6, 6);
  hand.translate(0, -0.23, 0);
  geos.push(hand);

  const merged = mergeGeometries(geos, false)!;
  merged.computeVertexNormals();
  return merged;
}

/**
 * Creates stylized torso with collar and mini backpack.
 */
function createTorsoGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Main shirt / jacket body
  const chest = new THREE.BoxGeometry(0.24, 0.26, 0.15);
  chest.translate(0, 0, 0);
  geos.push(chest);

  // Collar / neck base
  const collar = new THREE.CylinderGeometry(0.05, 0.055, 0.05, 8);
  collar.translate(0, 0.14, 0);
  geos.push(collar);

  // Cute backpack on the back
  const backpack = new THREE.BoxGeometry(0.18, 0.20, 0.08);
  backpack.translate(0, 0.01, -0.10);
  geos.push(backpack);

  const merged = mergeGeometries(geos, false)!;
  merged.computeVertexNormals();
  return merged;
}

/**
 * Creates rounded stylized head.
 */
function createHeadGeometry(): THREE.BufferGeometry {
  const head = new THREE.SphereGeometry(0.09, 10, 8);
  head.computeVertexNormals();
  return head;
}

/**
 * Creates stylized hair cap / baseball cap with visor brim.
 */
function createHairCapGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Hair dome covering top and sides
  const dome = new THREE.SphereGeometry(0.098, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58);
  dome.translate(0, 0.01, 0);
  geos.push(dome);

  // Hair volume / fringe on the sides & back
  const backFringe = new THREE.BoxGeometry(0.19, 0.08, 0.16);
  backFringe.translate(0, -0.01, -0.02);
  geos.push(backFringe);

  // Front visor brim giving that trendy street cap look
  const visor = new THREE.BoxGeometry(0.14, 0.02, 0.08);
  visor.translate(0, 0.01, 0.10);
  geos.push(visor);

  const merged = mergeGeometries(geos, false)!;
  merged.computeVertexNormals();
  return merged;
}

/**
 * High-detail stylized miniature diorama NPC renderer:
 * - Independent Left and Right articulated legs with shoes that stride naturally
 * - Swinging Left and Right arms with hands that swing in counter-sync
 * - Shaped torsos with collars and mini backpacks
 * - Stylized heads with molded hair caps & baseball caps in varied colors
 * - Realistic seated dining poses with forward leg bends at cafe patio tables
 * - 100% InstancedMesh rendered in only 7 draw calls
 */
export function PedestrianRenderer({ engine }: PedestrianRendererProps) {
  const count = engine.pedestrians.length;

  const legGeo = useMemo(() => createLegGeometry(), []);
  const armGeo = useMemo(() => createArmGeometry(), []);
  const torsoGeo = useMemo(() => createTorsoGeometry(), []);
  const headGeo = useMemo(() => createHeadGeometry(), []);
  const hairGeo = useMemo(() => createHairCapGeometry(), []);

  const leftLegRef = useRef<THREE.InstancedMesh>(null);
  const rightLegRef = useRef<THREE.InstancedMesh>(null);
  const torsoRef = useRef<THREE.InstancedMesh>(null);
  const leftArmRef = useRef<THREE.InstancedMesh>(null);
  const rightArmRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const hairRef = useRef<THREE.InstancedMesh>(null);

  // Initialize individual pedestrian colors
  useEffect(() => {
    if (
      !leftLegRef.current ||
      !rightLegRef.current ||
      !torsoRef.current ||
      !leftArmRef.current ||
      !rightArmRef.current ||
      !headRef.current ||
      !hairRef.current
    ) {
      return;
    }

    engine.pedestrians.forEach((p, i) => {
      // Pants on both legs
      scratchColor.set(p.pantsColor);
      leftLegRef.current!.setColorAt(i, scratchColor);
      rightLegRef.current!.setColorAt(i, scratchColor);

      // Shirt / jacket on torso and arms
      scratchColor.set(p.shirtColor);
      torsoRef.current!.setColorAt(i, scratchColor);
      leftArmRef.current!.setColorAt(i, scratchColor);
      rightArmRef.current!.setColorAt(i, scratchColor);

      // Skin tone on head
      scratchColor.set(p.skinTone);
      headRef.current!.setColorAt(i, scratchColor);

      // Varied hair / cap colors
      const hairColor = HAIR_CAP_COLORS[i % HAIR_CAP_COLORS.length]!;
      scratchColor.set(hairColor);
      hairRef.current!.setColorAt(i, scratchColor);
    });

    if (leftLegRef.current.instanceColor) leftLegRef.current.instanceColor.needsUpdate = true;
    if (rightLegRef.current.instanceColor) rightLegRef.current.instanceColor.needsUpdate = true;
    if (torsoRef.current.instanceColor) torsoRef.current.instanceColor.needsUpdate = true;
    if (leftArmRef.current.instanceColor) leftArmRef.current.instanceColor.needsUpdate = true;
    if (rightArmRef.current.instanceColor) rightArmRef.current.instanceColor.needsUpdate = true;
    if (headRef.current.instanceColor) headRef.current.instanceColor.needsUpdate = true;
    if (hairRef.current.instanceColor) hairRef.current.instanceColor.needsUpdate = true;
  }, [engine.pedestrians]);

  // Update animated pedestrian limb transforms per frame
  useFrame(() => {
    if (
      !leftLegRef.current ||
      !rightLegRef.current ||
      !torsoRef.current ||
      !leftArmRef.current ||
      !rightArmRef.current ||
      !headRef.current ||
      !hairRef.current
    ) {
      return;
    }

    const peds = engine.pedestrians;

    for (let i = 0; i < peds.length; i++) {
      const p = peds[i]!;
      const isDining = p.state === 'dining';
      const isWalking = p.state === 'walking';

      const cosY = Math.cos(p.yaw);
      const sinY = Math.sin(p.yaw);

      // Kinematic animation parameters
      let bob = 0;
      let tilt = 0;
      let sitDrop = 0;
      let strideL = 0;
      let strideR = 0;
      let armL = 0;
      let armR = 0;

      if (isDining) {
        // Seated dining pose: legs bent forward over seat, arms resting forward on table
        sitDrop = -0.15;
        strideL = Math.PI * 0.44;
        strideR = Math.PI * 0.44;
        armL = -Math.PI * 0.32;
        armR = -Math.PI * 0.32;
      } else if (isWalking) {
        // Active walking stride: counter-swinging arms and legs + rhythmic vertical bob
        bob = Math.abs(Math.sin(p.walkPhase)) * 0.04;
        tilt = Math.sin(p.walkPhase) * 0.05;
        const swing = Math.sin(p.walkPhase);
        strideL = swing * 0.44;
        strideR = -swing * 0.44;
        armL = -swing * 0.40;
        armR = swing * 0.40;
      } else {
        // Idling / waiting at traffic light: subtle breathing idle sway
        bob = Math.sin(p.walkPhase * 0.6) * 0.012;
      }

      // Base hip and torso height
      const hipY = p.position.y + 0.32 + bob + sitDrop;
      const legSpacing = 0.065;

      // 1. Left Leg (offset to left: -cos(yaw) * legSpacing, +sin(yaw) * legSpacing)
      const legLx = p.position.x - cosY * legSpacing;
      const legLz = p.position.z + sinY * legSpacing;
      scratchObj.position.set(legLx, hipY, legLz);
      scratchObj.rotation.set(strideL, p.yaw, 0);
      scratchObj.scale.set(1, 1, 1);
      scratchObj.updateMatrix();
      leftLegRef.current.setMatrixAt(i, scratchObj.matrix);

      // 2. Right Leg (offset to right: +cos(yaw) * legSpacing, -sin(yaw) * legSpacing)
      const legRx = p.position.x + cosY * legSpacing;
      const legRz = p.position.z - sinY * legSpacing;
      scratchObj.position.set(legRx, hipY, legRz);
      scratchObj.rotation.set(strideR, p.yaw, 0);
      scratchObj.scale.set(1, 1, 1);
      scratchObj.updateMatrix();
      rightLegRef.current.setMatrixAt(i, scratchObj.matrix);

      // 3. Torso (centered, subtle tilt sway)
      const torsoY = p.position.y + 0.46 + bob + sitDrop;
      scratchObj.position.set(p.position.x, torsoY, p.position.z);
      scratchObj.rotation.set(0, p.yaw, tilt);
      scratchObj.scale.set(1, 1, 1);
      scratchObj.updateMatrix();
      torsoRef.current.setMatrixAt(i, scratchObj.matrix);

      // 4. Left Arm (shoulder at left of torso)
      const armSpacing = 0.155;
      const shoulderY = p.position.y + 0.56 + bob + sitDrop;
      const armLx = p.position.x - cosY * armSpacing;
      const armLz = p.position.z + sinY * armSpacing;
      scratchObj.position.set(armLx, shoulderY, armLz);
      scratchObj.rotation.set(armL, p.yaw, tilt * 0.5);
      scratchObj.scale.set(1, 1, 1);
      scratchObj.updateMatrix();
      leftArmRef.current.setMatrixAt(i, scratchObj.matrix);

      // 5. Right Arm (shoulder at right of torso)
      const armRx = p.position.x + cosY * armSpacing;
      const armRz = p.position.z - sinY * armSpacing;
      scratchObj.position.set(armRx, shoulderY, armRz);
      scratchObj.rotation.set(armR, p.yaw, -tilt * 0.5);
      scratchObj.scale.set(1, 1, 1);
      scratchObj.updateMatrix();
      rightArmRef.current.setMatrixAt(i, scratchObj.matrix);

      // 6. Head
      const headY = p.position.y + 0.69 + bob + sitDrop;
      scratchObj.position.set(p.position.x, headY, p.position.z);
      scratchObj.rotation.set(0, p.yaw, 0);
      scratchObj.scale.set(1, 1, 1);
      scratchObj.updateMatrix();
      headRef.current.setMatrixAt(i, scratchObj.matrix);

      // 7. Hair / Cap
      const hairY = p.position.y + 0.70 + bob + sitDrop;
      scratchObj.position.set(p.position.x, hairY, p.position.z);
      scratchObj.rotation.set(0, p.yaw, 0);
      scratchObj.scale.set(1, 1, 1);
      scratchObj.updateMatrix();
      hairRef.current.setMatrixAt(i, scratchObj.matrix);
    }

    leftLegRef.current.instanceMatrix.needsUpdate = true;
    rightLegRef.current.instanceMatrix.needsUpdate = true;
    torsoRef.current.instanceMatrix.needsUpdate = true;
    leftArmRef.current.instanceMatrix.needsUpdate = true;
    rightArmRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
    hairRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="pedestrians">
      {/* Articulated Left & Right legs with shoes */}
      <instancedMesh ref={leftLegRef} args={[legGeo, undefined, count]} castShadow>
        <meshStandardMaterial roughness={0.82} />
      </instancedMesh>
      <instancedMesh ref={rightLegRef} args={[legGeo, undefined, count]} castShadow>
        <meshStandardMaterial roughness={0.82} />
      </instancedMesh>

      {/* Torso with collar and mini backpack */}
      <instancedMesh ref={torsoRef} args={[torsoGeo, undefined, count]} castShadow>
        <meshStandardMaterial roughness={0.75} />
      </instancedMesh>

      {/* Articulated swinging Left & Right arms with hands */}
      <instancedMesh ref={leftArmRef} args={[armGeo, undefined, count]} castShadow>
        <meshStandardMaterial roughness={0.78} />
      </instancedMesh>
      <instancedMesh ref={rightArmRef} args={[armGeo, undefined, count]} castShadow>
        <meshStandardMaterial roughness={0.78} />
      </instancedMesh>

      {/* Stylized rounded head */}
      <instancedMesh ref={headRef} args={[headGeo, undefined, count]} castShadow>
        <meshStandardMaterial roughness={0.68} />
      </instancedMesh>

      {/* Molded hair caps & baseball caps in varied colors */}
      <instancedMesh ref={hairRef} args={[hairGeo, undefined, count]} castShadow>
        <meshStandardMaterial roughness={0.72} />
      </instancedMesh>
    </group>
  );
}
