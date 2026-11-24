import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { ISLAND_BASE_DEPTH, ROAD_WIDTH, SIDEWALK_HEIGHT } from '@/config/constants';
import type { GeneratedCity } from '@/sim/types';
import { useCityStore } from '@/store/useCityStore';

interface CityTerrainProps {
  city: GeneratedCity;
}

const dummy = new THREE.Object3D();

/**
 * Renders the floating stylized diorama island slab (beveled layered earth underside + concrete rim),
 * asphalt roadway grid, raised sidewalk blocks, instanced lane dashes, white crosswalk zebra stripes,
 * and intersection stop bars matching the reference concept art.
 */
export function CityTerrain({ city }: CityTerrainProps) {
  const weather = useCityStore((s) => s.weather);
  const dashRef = useRef<THREE.InstancedMesh>(null);
  const crosswalkRef = useRef<THREE.InstancedMesh>(null);
  const stopBarRef = useRef<THREE.InstancedMesh>(null);
  const sidewalkRef = useRef<THREE.InstancedMesh>(null);
  const sidewalkSeamRef = useRef<THREE.InstancedMesh>(null);

  const islandSize = city.islandSize;
  const blockFootprint = city.tileSize + (city.tileSize - ROAD_WIDTH) * 0.2;

  const { dashes, crosswalks, stopBars, sidewalkLots, sidewalkSeams } = useMemo(() => {
    const dashTransforms: { x: number; z: number; rotY: number }[] = [];
    const cwTransforms: { x: number; z: number; rotY: number }[] = [];
    const stopTransforms: { x: number; z: number; rotY: number }[] = [];
    const swLots: { x: number; z: number }[] = [];
    const seamTransforms: { x: number; z: number; rotY: number }[] = [];

    const halfTile = city.tileSize * 0.5;
    const isRoad = (r: number, c: number) => {
      if (r < 0 || c < 0 || r >= city.gridRows || c >= city.gridCols) return false;
      const lot = city.lots[r * city.gridCols + c];
      return lot?.type === 'road_straight' || lot?.type === 'road_intersection';
    };

    for (const lot of city.lots) {
      const { x, z } = lot.worldPos;
      if (lot.type === 'road_straight') {
        const horiz = isRoad(lot.row, lot.col - 1) || isRoad(lot.row, lot.col + 1);
        for (const offset of [-1.5, 1.5]) {
          dashTransforms.push({
            x: horiz ? x + offset : x,
            z: horiz ? z : z + offset,
            rotY: horiz ? 0 : Math.PI / 2,
          });
        }
      } else if (lot.type === 'road_intersection') {
        // Zebra crosswalk stripes + solid stop line on each connected arm
        const stripeOffsets = [-1.4, -0.7, 0, 0.7, 1.4];

        if (isRoad(lot.row - 1, lot.col)) {
          for (const s of stripeOffsets) {
            cwTransforms.push({ x: x + s, z: z - halfTile + 0.55, rotY: 0 });
          }
          stopTransforms.push({ x: x - 1.05, z: z - halfTile - 0.22, rotY: 0 });
        }
        if (isRoad(lot.row + 1, lot.col)) {
          for (const s of stripeOffsets) {
            cwTransforms.push({ x: x + s, z: z + halfTile - 0.55, rotY: 0 });
          }
          stopTransforms.push({ x: x + 1.05, z: z + halfTile + 0.22, rotY: 0 });
        }
        if (isRoad(lot.row, lot.col - 1)) {
          for (const s of stripeOffsets) {
            cwTransforms.push({ x: x - halfTile + 0.55, z: z + s, rotY: Math.PI / 2 });
          }
          stopTransforms.push({ x: x - halfTile - 0.22, z: z + 1.05, rotY: Math.PI / 2 });
        }
        if (isRoad(lot.row, lot.col + 1)) {
          for (const s of stripeOffsets) {
            cwTransforms.push({ x: x + halfTile - 0.55, z: z + s, rotY: Math.PI / 2 });
          }
          stopTransforms.push({ x: x + halfTile + 0.22, z: z - 1.05, rotY: Math.PI / 2 });
        }
      } else {
        swLots.push({ x, z });
        for (const offset of [-1.35, 0, 1.35]) {
          seamTransforms.push(
            { x: x + offset, z, rotY: Math.PI / 2 },
            { x, z: z + offset, rotY: 0 },
          );
        }
      }
    }

    return {
      dashes: dashTransforms,
      crosswalks: cwTransforms,
      stopBars: stopTransforms,
      sidewalkLots: swLots,
      sidewalkSeams: seamTransforms,
    };
  }, [city, blockFootprint]);

  useEffect(() => {
    if (dashRef.current) {
      dashes.forEach((d, i) => {
        dummy.position.set(d.x, 0.035, d.z);
        dummy.rotation.set(0, d.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        dashRef.current!.setMatrixAt(i, dummy.matrix);
      });
      dashRef.current.instanceMatrix.needsUpdate = true;
    }

    if (crosswalkRef.current) {
      crosswalks.forEach((c, i) => {
        dummy.position.set(c.x, 0.038, c.z);
        dummy.rotation.set(0, c.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        crosswalkRef.current!.setMatrixAt(i, dummy.matrix);
      });
      crosswalkRef.current.instanceMatrix.needsUpdate = true;
    }

    if (stopBarRef.current) {
      stopBars.forEach((sb, i) => {
        dummy.position.set(sb.x, 0.038, sb.z);
        dummy.rotation.set(0, sb.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        stopBarRef.current!.setMatrixAt(i, dummy.matrix);
      });
      stopBarRef.current.instanceMatrix.needsUpdate = true;
    }

    if (sidewalkRef.current) {
      sidewalkLots.forEach((s, i) => {
        dummy.position.set(s.x, SIDEWALK_HEIGHT * 0.5, s.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        sidewalkRef.current!.setMatrixAt(i, dummy.matrix);
      });
      sidewalkRef.current.instanceMatrix.needsUpdate = true;
    }
    if (sidewalkSeamRef.current) {
      sidewalkSeams.forEach((seam, i) => {
        dummy.position.set(seam.x, SIDEWALK_HEIGHT + 0.003, seam.z);
        dummy.rotation.set(0, seam.rotY, 0);
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        sidewalkSeamRef.current!.setMatrixAt(i, dummy.matrix);
      });
      sidewalkSeamRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dashes, crosswalks, stopBars, sidewalkLots, sidewalkSeams]);

  // Wet asphalt sheen when rain is active
  const asphaltRoughness = weather === 'rain' ? 0.24 : 0.78;
  const asphaltMetalness = weather === 'rain' ? 0.28 : 0.06;

  return (
    <group name="city-terrain">
      {/* Outer Concrete Perimeter Curb / Rim */}
      <mesh position={[0, -0.25, 0]} receiveShadow castShadow>
        <boxGeometry args={[islandSize + 0.6, 0.5, islandSize + 0.6]} />
        <meshStandardMaterial color="#42414a" roughness={0.88} />
      </mesh>

      {/* Layer 1: Upper dark rock underbelly band */}
      <mesh position={[0, -0.5 - ISLAND_BASE_DEPTH * 0.28, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry
          args={[
            islandSize * 0.708,
            islandSize * 0.58,
            ISLAND_BASE_DEPTH * 0.56,
            4,
          ]}
        />
        <meshStandardMaterial color="#7a4833" roughness={0.92} flatShading />
      </mesh>

      {/* Layer 2: Lower faceted sedimentary rock underbelly tapering inward */}
      <mesh position={[0, -0.5 - ISLAND_BASE_DEPTH * 0.74, 0]} rotation={[0, Math.PI / 4 + 0.12, 0]}>
        <cylinderGeometry
          args={[
            islandSize * 0.58,
            islandSize * 0.38,
            ISLAND_BASE_DEPTH * 0.5,
            4,
          ]}
        />
        <meshStandardMaterial color="#5e3422" roughness={0.95} flatShading />
      </mesh>

      {/* Rich dark asphalt road deck */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[islandSize - 0.6, 0.04, islandSize - 0.6]} />
        <meshStandardMaterial
          color="#373941"
          roughness={asphaltRoughness}
          metalness={asphaltMetalness}
        />
      </mesh>

      {/* Raised sidewalk blocks with clean curb edge under buildable lots */}
      <instancedMesh
        ref={sidewalkRef}
        args={[undefined, undefined, sidewalkLots.length]}
        receiveShadow
        castShadow
      >
        <boxGeometry args={[blockFootprint, SIDEWALK_HEIGHT, blockFootprint]} />
        <meshStandardMaterial color="#ccc4b7" roughness={0.82} />
      </instancedMesh>

      {/* Quiet paver joints break up broad sidewalk slabs without adding individual draw calls. */}
      <instancedMesh
        ref={sidewalkSeamRef}
        args={[undefined, undefined, sidewalkSeams.length]}
        receiveShadow
      >
        <boxGeometry args={[blockFootprint - 0.16, 0.005, 0.018]} />
        <meshStandardMaterial color="#c4bcae" roughness={0.9} />
      </instancedMesh>

      {/* Instanced dashed lane center markings */}
      <instancedMesh ref={dashRef} args={[undefined, undefined, dashes.length]}>
        <boxGeometry args={[1.2, 0.015, 0.12]} />
        <meshStandardMaterial color="#f0eae1" roughness={0.65} />
      </instancedMesh>

      {/* Instanced white crosswalk zebra stripes */}
      <instancedMesh ref={crosswalkRef} args={[undefined, undefined, crosswalks.length]}>
        <boxGeometry args={[0.36, 0.018, 0.95]} />
        <meshStandardMaterial color="#faf6ed" roughness={0.6} />
      </instancedMesh>

      {/* Instanced white stop lines */}
      <instancedMesh ref={stopBarRef} args={[undefined, undefined, stopBars.length]}>
        <boxGeometry args={[2.0, 0.018, 0.24]} />
        <meshStandardMaterial color="#faf6ed" roughness={0.6} />
      </instancedMesh>
    </group>
  );
}
