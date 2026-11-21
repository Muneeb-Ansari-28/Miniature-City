import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { computeCityPropLayout, type PropPlacement } from '@/scene/procedural/propFactory';
import {
  createTreeSpeciesGeometries,
  TREE_SPECIES_PALETTES,
  type TreeSpecies,
} from '@/scene/procedural/treeFactory';
import type { GeneratedCity } from '@/sim/types';
import type { WorldEngine } from '@/sim/worldEngine';

interface InstancedPropsComponentProps {
  city: GeneratedCity;
  engine: WorldEngine;
}

const scratchObj = new THREE.Object3D();
const scratchColor = new THREE.Color();

/**
 * Builds a detailed telephone / utility pole geometry (wooden mast, crossarm, insulators, transformer).
 */
function createTelephonePoleGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Main vertical wooden mast
  const mast = new THREE.CylinderGeometry(0.09, 0.13, 5.2, 8);
  mast.translate(0, 2.6, 0);
  geos.push(mast);

  // Upper horizontal crossarm
  const arm = new THREE.BoxGeometry(0.1, 0.12, 1.45);
  arm.translate(0, 4.85, 0);
  geos.push(arm);

  // Lower secondary crossarm
  const arm2 = new THREE.BoxGeometry(0.09, 0.1, 1.15);
  arm2.translate(0, 4.35, 0);
  geos.push(arm2);

  // Ceramic insulators on crossarms
  for (const z of [-0.6, -0.2, 0.2, 0.6]) {
    const ins = new THREE.CylinderGeometry(0.03, 0.04, 0.14, 6);
    ins.translate(0, 4.96, z);
    geos.push(ins);
  }

  // Cylindrical electrical transformer drum on side
  const trans = new THREE.CylinderGeometry(0.2, 0.2, 0.58, 8);
  trans.translate(0.22, 3.8, 0);
  geos.push(trans);

  return mergeGeometries(geos, false)!;
}

/**
 * Builds a classic red fire hydrant geometry.
 */
function createHydrantGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  const base = new THREE.CylinderGeometry(0.12, 0.14, 0.42, 8);
  base.translate(0, 0.21, 0);
  const cap = new THREE.SphereGeometry(0.12, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  cap.translate(0, 0.42, 0);
  const nozzleA = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 6);
  nozzleA.rotateZ(Math.PI / 2);
  nozzleA.translate(-0.12, 0.28, 0);
  const nozzleB = new THREE.CylinderGeometry(0.05, 0.05, 0.12, 6);
  nozzleB.rotateZ(Math.PI / 2);
  nozzleB.translate(0.12, 0.28, 0);
  geos.push(base, cap, nozzleA, nozzleB);
  return mergeGeometries(geos, false)!;
}

/**
 * Builds street trash can / recycling bin geometry.
 */
function createTrashCanGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  const body = new THREE.CylinderGeometry(0.18, 0.15, 0.52, 8);
  body.translate(0, 0.26, 0);
  const dome = new THREE.SphereGeometry(0.19, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.translate(0, 0.52, 0);
  geos.push(body, dome);
  return mergeGeometries(geos, false)!;
}

/**
 * Builds orange and white traffic cone geometry.
 */
function createTrafficConeGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  const base = new THREE.BoxGeometry(0.28, 0.04, 0.28);
  base.translate(0, 0.02, 0);
  const cone = new THREE.ConeGeometry(0.12, 0.42, 8);
  cone.translate(0, 0.23, 0);
  geos.push(base, cone);
  return mergeGeometries(geos, false)!;
}

/**
 * Renders all repeated city props via THREE.InstancedMesh:
 * - Wind-swaying multi-cluster trees
 * - Wooden utility/telephone poles with realistic crossarms & transformers
 * - Catenary sagging overhead power cables
 * - Streetlamps (with night emissive globes + additive light cones)
 * - Park benches, outdoor cafe tables & umbrellas
 * - Fire hydrants, trash cans, traffic cones, and sidewalk bollards
 */
export function InstancedProps({ city, engine }: InstancedPropsComponentProps) {
  const layout = useMemo(() => computeCityPropLayout(city), [city]);

  const treeSpeciesGeos = useMemo(() => createTreeSpeciesGeometries(), []);

  const treesBySpecies = useMemo(() => {
    const res: Record<TreeSpecies, PropPlacement[]> = {
      oak: [],
      pine: [],
      sakura: [],
      willow: [],
    };
    for (const tree of layout.trees) {
      const sp = tree.species ?? 'oak';
      res[sp].push(tree);
    }
    return res;
  }, [layout.trees]);

  const treeRefs = {
    oak: { trunk: useRef<THREE.InstancedMesh>(null), canopy: useRef<THREE.InstancedMesh>(null) },
    pine: { trunk: useRef<THREE.InstancedMesh>(null), canopy: useRef<THREE.InstancedMesh>(null) },
    sakura: { trunk: useRef<THREE.InstancedMesh>(null), canopy: useRef<THREE.InstancedMesh>(null) },
    willow: { trunk: useRef<THREE.InstancedMesh>(null), canopy: useRef<THREE.InstancedMesh>(null) },
  };

  const lampPostRef = useRef<THREE.InstancedMesh>(null);
  const lampGlobeRef = useRef<THREE.InstancedMesh>(null);
  const lampConeRef = useRef<THREE.InstancedMesh>(null);
  const benchRef = useRef<THREE.InstancedMesh>(null);
  const tableRef = useRef<THREE.InstancedMesh>(null);
  const umbrellaRef = useRef<THREE.InstancedMesh>(null);
  const bollardRef = useRef<THREE.InstancedMesh>(null);
  const telephonePoleRef = useRef<THREE.InstancedMesh>(null);
  const hydrantRef = useRef<THREE.InstancedMesh>(null);
  const trashCanRef = useRef<THREE.InstancedMesh>(null);
  const coneRef = useRef<THREE.InstancedMesh>(null);

  const lampGlobeMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lampConeMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Pre-compiled combined geometries
  const poleGeo = useMemo(() => createTelephonePoleGeometry(), []);
  const hydrantGeo = useMemo(() => createHydrantGeometry(), []);
  const trashGeo = useMemo(() => createTrashCanGeometry(), []);
  const coneGeo = useMemo(() => createTrafficConeGeometry(), []);

  // Construct 3D catenary power cable line segments
  const cableLineObject = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segmentsPerCable = 12;

    layout.cables.forEach((c) => {
      const curve = new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(c.p0.x, c.p0.y, c.p0.z),
        new THREE.Vector3(c.p1.x, c.p1.y, c.p1.z),
        new THREE.Vector3(c.p2.x, c.p2.y, c.p2.z),
      );
      const pts = curve.getPoints(segmentsPerCable);
      for (let i = 0; i < pts.length - 1; i++) {
        points.push(pts[i]!, pts[i + 1]!);
      }
    });

    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: '#1e2026',
      linewidth: 1,
      transparent: true,
      opacity: 0.85,
    });
    return new THREE.LineSegments(geo, mat);
  }, [layout.cables]);

  useEffect(() => {
    return () => {
      (Object.keys(treeSpeciesGeos) as TreeSpecies[]).forEach((s) => {
        treeSpeciesGeos[s].trunkGeometry.dispose();
        treeSpeciesGeos[s].canopyGeometry.dispose();
      });
      poleGeo.dispose();
      hydrantGeo.dispose();
      trashGeo.dispose();
      coneGeo.dispose();
      cableLineObject.geometry.dispose();
      (cableLineObject.material as THREE.Material).dispose();
    };
  }, [treeSpeciesGeos, poleGeo, hydrantGeo, trashGeo, coneGeo, cableLineObject]);

  // Initial placement of all props
  useEffect(() => {
    // 1. Species-specific trees
    const speciesList: TreeSpecies[] = ['oak', 'pine', 'sakura', 'willow'];
    for (const sp of speciesList) {
      const list = treesBySpecies[sp];
      const trunkMesh = treeRefs[sp].trunk.current;
      const canopyMesh = treeRefs[sp].canopy.current;

      list.forEach((t, i) => {
        scratchObj.position.set(t.position.x, t.position.y, t.position.z);
        scratchObj.rotation.set(0, t.rotationY, 0);
        scratchObj.scale.set(t.scale, t.scale, t.scale);
        scratchObj.updateMatrix();

        if (trunkMesh) trunkMesh.setMatrixAt(i, scratchObj.matrix);
        if (canopyMesh) {
          canopyMesh.setMatrixAt(i, scratchObj.matrix);
          scratchColor.set(t.color ?? TREE_SPECIES_PALETTES[sp].canopyColors[0]!);
          canopyMesh.setColorAt(i, scratchColor);
        }
      });

      if (trunkMesh) trunkMesh.instanceMatrix.needsUpdate = true;
      if (canopyMesh) {
        canopyMesh.instanceMatrix.needsUpdate = true;
        if (canopyMesh.instanceColor) canopyMesh.instanceColor.needsUpdate = true;
      }
    }

    // 3. Streetlamps
    if (lampPostRef.current && lampGlobeRef.current && lampConeRef.current) {
      layout.lamps.forEach((l, i) => {
        scratchObj.position.set(l.position.x, l.position.y + 1.25, l.position.z);
        scratchObj.rotation.set(0, l.rotationY, 0);
        scratchObj.scale.set(1, 1, 1);
        scratchObj.updateMatrix();
        lampPostRef.current!.setMatrixAt(i, scratchObj.matrix);

        scratchObj.position.set(l.position.x, l.position.y + 2.52, l.position.z);
        scratchObj.updateMatrix();
        lampGlobeRef.current!.setMatrixAt(i, scratchObj.matrix);

        scratchObj.position.set(l.position.x, l.position.y + 1.25, l.position.z);
        scratchObj.updateMatrix();
        lampConeRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      lampPostRef.current.instanceMatrix.needsUpdate = true;
      lampGlobeRef.current.instanceMatrix.needsUpdate = true;
      lampConeRef.current.instanceMatrix.needsUpdate = true;
    }

    // 4. Park benches
    if (benchRef.current) {
      layout.benches.forEach((b, i) => {
        scratchObj.position.set(b.position.x, b.position.y + 0.25, b.position.z);
        scratchObj.rotation.set(0, b.rotationY, 0);
        scratchObj.scale.set(1, 1, 1);
        scratchObj.updateMatrix();
        benchRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      benchRef.current.instanceMatrix.needsUpdate = true;
    }

    // 5. Patio tables
    if (tableRef.current) {
      layout.tables.forEach((t, i) => {
        scratchObj.position.set(t.position.x, t.position.y + 0.36, t.position.z);
        scratchObj.rotation.set(0, t.rotationY, 0);
        scratchObj.scale.set(1, 1, 1);
        scratchObj.updateMatrix();
        tableRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      tableRef.current.instanceMatrix.needsUpdate = true;
    }

    // 6. Patio umbrellas
    if (umbrellaRef.current) {
      layout.umbrellas.forEach((u, i) => {
        scratchObj.position.set(u.position.x, u.position.y + 1.35, u.position.z);
        scratchObj.rotation.set(0, u.rotationY, 0);
        scratchObj.scale.set(1, 1, 1);
        scratchObj.updateMatrix();
        umbrellaRef.current!.setMatrixAt(i, scratchObj.matrix);
        scratchColor.set(u.color ?? '#f4ede1');
        umbrellaRef.current!.setColorAt(i, scratchColor);
      });
      umbrellaRef.current.instanceMatrix.needsUpdate = true;
      if (umbrellaRef.current.instanceColor) umbrellaRef.current.instanceColor.needsUpdate = true;
    }

    // 7. Sidewalk bollards
    if (bollardRef.current) {
      layout.bollards.forEach((b, i) => {
        scratchObj.position.set(b.position.x, b.position.y + 0.24, b.position.z);
        scratchObj.rotation.set(0, 0, 0);
        scratchObj.scale.set(1, 1, 1);
        scratchObj.updateMatrix();
        bollardRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      bollardRef.current.instanceMatrix.needsUpdate = true;
    }

    // 8. Telephone / Utility poles
    if (telephonePoleRef.current) {
      layout.telephonePoles.forEach((p, i) => {
        scratchObj.position.set(p.position.x, p.position.y, p.position.z);
        scratchObj.rotation.set(0, p.rotationY, 0);
        scratchObj.scale.set(1, 1, 1);
        scratchObj.updateMatrix();
        telephonePoleRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      telephonePoleRef.current.instanceMatrix.needsUpdate = true;
    }

    // 9. Fire hydrants
    if (hydrantRef.current) {
      layout.hydrants.forEach((h, i) => {
        scratchObj.position.set(h.position.x, h.position.y, h.position.z);
        scratchObj.rotation.set(0, h.rotationY, 0);
        scratchObj.scale.set(1, 1, 1);
        scratchObj.updateMatrix();
        hydrantRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      hydrantRef.current.instanceMatrix.needsUpdate = true;
    }

    // 10. Street trash cans
    if (trashCanRef.current) {
      layout.trashCans.forEach((c, i) => {
        scratchObj.position.set(c.position.x, c.position.y, c.position.z);
        scratchObj.rotation.set(0, c.rotationY, 0);
        scratchObj.scale.set(1, 1, 1);
        scratchObj.updateMatrix();
        trashCanRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      trashCanRef.current.instanceMatrix.needsUpdate = true;
    }

    // 11. Traffic cones
    if (coneRef.current) {
      layout.trafficCones.forEach((c, i) => {
        scratchObj.position.set(c.position.x, c.position.y, c.position.z);
        scratchObj.rotation.set(0, c.rotationY, 0);
        scratchObj.scale.set(1, 1, 1);
        scratchObj.updateMatrix();
        coneRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      coneRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [layout, poleGeo, hydrantGeo, trashGeo, coneGeo]);

  // Gentle wind sway on tree crowns + night streetlamp emissive modulation
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const emissive = engine.atmosphere.emissiveStrength;

    if (lampGlobeMatRef.current) {
      lampGlobeMatRef.current.emissiveIntensity = 0.4 + emissive * 3.2;
    }
    if (lampConeMatRef.current) {
      lampConeMatRef.current.opacity = emissive * 0.16;
    }

    // Species-specific wind sway
    const speciesList: TreeSpecies[] = ['oak', 'pine', 'sakura', 'willow'];
    for (const sp of speciesList) {
      const list = treesBySpecies[sp];
      const canopyMesh = treeRefs[sp].canopy.current;
      if (!canopyMesh || list.length === 0) continue;

      for (let i = 0; i < list.length; i++) {
        const tree = list[i]!;
        const swayAmp = sp === 'willow' ? 0.08 : sp === 'sakura' ? 0.05 : 0.038;
        const swayX = Math.sin(t * 1.6 + i * 0.9) * swayAmp * tree.scale;
        const swayZ = Math.cos(t * 1.3 + i * 1.2) * swayAmp * 0.8 * tree.scale;

        scratchObj.position.set(tree.position.x + swayX, tree.position.y, tree.position.z + swayZ);
        scratchObj.rotation.set(swayZ * 0.4, tree.rotationY, -swayX * 0.4);
        scratchObj.scale.set(tree.scale, tree.scale, tree.scale);
        scratchObj.updateMatrix();
        canopyMesh.setMatrixAt(i, scratchObj.matrix);
      }
      canopyMesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group name="instanced-props">
      {/* 3D Catenary Overhead Power Cables */}
      <primitive object={cableLineObject} />

      {/* Wooden Telephone / Utility Poles */}
      <instancedMesh
        ref={telephonePoleRef}
        args={[poleGeo, undefined, layout.telephonePoles.length]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color="#473121" roughness={0.88} />
      </instancedMesh>

      {/* Species-Specific Trees: Oak, Pine, Sakura, Willow */}
      {treesBySpecies.oak.length > 0 && (
        <>
          <instancedMesh
            ref={treeRefs.oak.trunk}
            args={[treeSpeciesGeos.oak.trunkGeometry, undefined, treesBySpecies.oak.length]}
            castShadow
          >
            <meshStandardMaterial color={TREE_SPECIES_PALETTES.oak.trunkColor} roughness={0.9} />
          </instancedMesh>
          <instancedMesh
            ref={treeRefs.oak.canopy}
            args={[treeSpeciesGeos.oak.canopyGeometry, undefined, treesBySpecies.oak.length]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial roughness={0.82} flatShading />
          </instancedMesh>
        </>
      )}

      {treesBySpecies.pine.length > 0 && (
        <>
          <instancedMesh
            ref={treeRefs.pine.trunk}
            args={[treeSpeciesGeos.pine.trunkGeometry, undefined, treesBySpecies.pine.length]}
            castShadow
          >
            <meshStandardMaterial color={TREE_SPECIES_PALETTES.pine.trunkColor} roughness={0.9} />
          </instancedMesh>
          <instancedMesh
            ref={treeRefs.pine.canopy}
            args={[treeSpeciesGeos.pine.canopyGeometry, undefined, treesBySpecies.pine.length]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial roughness={0.85} flatShading />
          </instancedMesh>
        </>
      )}

      {treesBySpecies.sakura.length > 0 && (
        <>
          <instancedMesh
            ref={treeRefs.sakura.trunk}
            args={[treeSpeciesGeos.sakura.trunkGeometry, undefined, treesBySpecies.sakura.length]}
            castShadow
          >
            <meshStandardMaterial color={TREE_SPECIES_PALETTES.sakura.trunkColor} roughness={0.92} />
          </instancedMesh>
          <instancedMesh
            ref={treeRefs.sakura.canopy}
            args={[treeSpeciesGeos.sakura.canopyGeometry, undefined, treesBySpecies.sakura.length]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial roughness={0.75} flatShading />
          </instancedMesh>
        </>
      )}

      {treesBySpecies.willow.length > 0 && (
        <>
          <instancedMesh
            ref={treeRefs.willow.trunk}
            args={[treeSpeciesGeos.willow.trunkGeometry, undefined, treesBySpecies.willow.length]}
            castShadow
          >
            <meshStandardMaterial color={TREE_SPECIES_PALETTES.willow.trunkColor} roughness={0.88} />
          </instancedMesh>
          <instancedMesh
            ref={treeRefs.willow.canopy}
            args={[treeSpeciesGeos.willow.canopyGeometry, undefined, treesBySpecies.willow.length]}
            castShadow
            receiveShadow
          >
            <meshStandardMaterial roughness={0.8} flatShading />
          </instancedMesh>
        </>
      )}

      {/* Streetlamps */}
      <instancedMesh ref={lampPostRef} args={[undefined, undefined, layout.lamps.length]} castShadow>
        <cylinderGeometry args={[0.055, 0.08, 2.5, 6]} />
        <meshStandardMaterial color="#2d323c" roughness={0.55} metalness={0.4} />
      </instancedMesh>
      <instancedMesh ref={lampGlobeRef} args={[undefined, undefined, layout.lamps.length]}>
        <sphereGeometry args={[0.18, 8, 8]} />
        <meshStandardMaterial
          ref={lampGlobeMatRef}
          color="#fff5d1"
          emissive="#ffca6b"
          emissiveIntensity={2.2}
          toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh ref={lampConeRef} args={[undefined, undefined, layout.lamps.length]}>
        <coneGeometry args={[1.25, 2.6, 10, 1, true]} />
        <meshBasicMaterial
          ref={lampConeMatRef}
          color="#ffd685"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* Park Benches */}
      <instancedMesh ref={benchRef} args={[undefined, undefined, layout.benches.length]} castShadow>
        <boxGeometry args={[1.1, 0.36, 0.44]} />
        <meshStandardMaterial color="#7a4c33" roughness={0.85} />
      </instancedMesh>

      {/* Cafe Patio Tables */}
      <instancedMesh ref={tableRef} args={[undefined, undefined, layout.tables.length]} castShadow>
        <cylinderGeometry args={[0.45, 0.16, 0.72, 8]} />
        <meshStandardMaterial color="#b38155" roughness={0.78} />
      </instancedMesh>

      {/* Colorful Patio Umbrellas */}
      <instancedMesh ref={umbrellaRef} args={[undefined, undefined, layout.umbrellas.length]} castShadow>
        <coneGeometry args={[0.88, 0.36, 8]} />
        <meshStandardMaterial roughness={0.7} flatShading />
      </instancedMesh>

      {/* Fire Hydrants */}
      <instancedMesh ref={hydrantRef} args={[hydrantGeo, undefined, layout.hydrants.length]} castShadow>
        <meshStandardMaterial color="#d4372a" roughness={0.55} metalness={0.2} />
      </instancedMesh>

      {/* Street Trash Cans */}
      <instancedMesh ref={trashCanRef} args={[trashGeo, undefined, layout.trashCans.length]} castShadow>
        <meshStandardMaterial color="#3b6947" roughness={0.75} />
      </instancedMesh>

      {/* Traffic Cones */}
      <instancedMesh ref={coneRef} args={[coneGeo, undefined, layout.trafficCones.length]} castShadow>
        <meshStandardMaterial color="#f06124" roughness={0.65} />
      </instancedMesh>

      {/* Sidewalk Bollards */}
      <instancedMesh ref={bollardRef} args={[undefined, undefined, layout.bollards.length]}>
        <cylinderGeometry args={[0.07, 0.08, 0.48, 6]} />
        <meshStandardMaterial color="#424752" roughness={0.7} />
      </instancedMesh>
    </group>
  );
}
