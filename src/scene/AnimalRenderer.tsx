import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  createAnimalRoster,
  updateAnimalSim,
  type AnimalAgent,
} from '@/sim/animalSim';
import type { GeneratedCity } from '@/sim/types';
import type { WorldEngine } from '@/sim/worldEngine';

interface AnimalRendererProps {
  city: GeneratedCity;
  engine: WorldEngine;
}

const scratchObj = new THREE.Object3D();
const scratchColor = new THREE.Color();

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
 * Builds a charming low-poly dog model (Shiba Inu / Golden style).
 */
function createDogGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Torso
  const body = new THREE.BoxGeometry(0.22, 0.2, 0.44);
  body.translate(0, 0.22, 0);
  geos.push(ensureIndexed(body));

  // Chest / neck
  const neck = new THREE.BoxGeometry(0.18, 0.18, 0.18);
  neck.rotateX(0.25);
  neck.translate(0, 0.32, 0.18);
  geos.push(ensureIndexed(neck));

  // Head
  const head = new THREE.BoxGeometry(0.16, 0.15, 0.2);
  head.translate(0, 0.42, 0.26);
  geos.push(ensureIndexed(head));

  // Snout
  const snout = new THREE.BoxGeometry(0.1, 0.08, 0.12);
  snout.translate(0, 0.38, 0.38);
  geos.push(ensureIndexed(snout));

  // Black nose tip
  const nose = new THREE.BoxGeometry(0.04, 0.03, 0.04);
  nose.translate(0, 0.4, 0.44);
  geos.push(ensureIndexed(nose));

  // Pointed triangular ears
  for (const ex of [-0.07, 0.07]) {
    const ear = new THREE.ConeGeometry(0.038, 0.08, 4);
    ear.rotateZ(ex < 0 ? -0.2 : 0.2);
    ear.translate(ex, 0.52, 0.22);
    geos.push(ensureIndexed(ear));
  }

  // 4 Legs
  const legCoords = [
    [-0.08, 0.11, 0.14],
    [0.08, 0.11, 0.14],
    [-0.08, 0.11, -0.14],
    [0.08, 0.11, -0.14],
  ];
  for (const [lx, ly, lz] of legCoords) {
    const leg = new THREE.CylinderGeometry(0.032, 0.028, 0.22, 5);
    leg.translate(lx!, ly!, lz!);
    geos.push(ensureIndexed(leg));
  }

  // Curled up tail
  const tail = new THREE.TorusGeometry(0.07, 0.024, 4, 8, Math.PI * 0.85);
  tail.rotateY(Math.PI * 0.5);
  tail.rotateX(-0.3);
  tail.translate(0, 0.35, -0.24);
  geos.push(ensureIndexed(tail));

  return mergeGeometries(geos, false)!;
}

/**
 * Builds a charming low-poly sleeping / loafing cat model.
 */
function createCatGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Loaf body
  const body = new THREE.SphereGeometry(0.14, 7, 6);
  body.scale(1.15, 0.8, 1.35);
  body.translate(0, 0.1, 0);
  geos.push(ensureIndexed(body));

  // Tucked head
  const head = new THREE.SphereGeometry(0.1, 6, 6);
  head.translate(0, 0.14, 0.16);
  geos.push(ensureIndexed(head));

  // Pointed ears
  for (const ex of [-0.05, 0.05]) {
    const ear = new THREE.ConeGeometry(0.028, 0.06, 3);
    ear.rotateZ(ex < 0 ? -0.25 : 0.25);
    ear.translate(ex, 0.23, 0.14);
    geos.push(ensureIndexed(ear));
  }

  // Curled tail wrapped around side
  const tail = new THREE.TorusGeometry(0.11, 0.022, 4, 8, Math.PI * 0.7);
  tail.rotateX(Math.PI * 0.5);
  tail.translate(0.06, 0.03, -0.04);
  geos.push(ensureIndexed(tail));

  return mergeGeometries(geos, false)!;
}

/**
 * Builds a low-poly city pigeon model with head and beak.
 */
function createPigeonGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Plump body
  const body = new THREE.ConeGeometry(0.08, 0.2, 6);
  body.rotateX(Math.PI * 0.65);
  body.translate(0, 0.08, 0);
  geos.push(ensureIndexed(body));

  // Head
  const head = new THREE.SphereGeometry(0.052, 6, 5);
  head.translate(0, 0.15, 0.09);
  geos.push(ensureIndexed(head));

  // Orange beak
  const beak = new THREE.ConeGeometry(0.015, 0.05, 4);
  beak.rotateX(Math.PI * 0.5);
  beak.translate(0, 0.14, 0.15);
  geos.push(ensureIndexed(beak));

  // Tail feathers
  const tail = new THREE.BoxGeometry(0.08, 0.018, 0.1);
  tail.rotateX(-0.3);
  tail.translate(0, 0.06, -0.14);
  geos.push(ensureIndexed(tail));

  // Little orange legs
  for (const lx of [-0.03, 0.03]) {
    const leg = new THREE.CylinderGeometry(0.008, 0.008, 0.06, 4);
    leg.translate(lx, 0.03, 0);
    geos.push(ensureIndexed(leg));
  }

  return mergeGeometries(geos, false)!;
}

/**
 * Builds a cozy woven twig bird nest containing 3 speckled eggs.
 */
function createBirdNestGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Woven twig outer bowl
  const bowl = new THREE.TorusGeometry(0.18, 0.07, 6, 9);
  bowl.rotateX(Math.PI * 0.5);
  bowl.translate(0, 0.07, 0);
  geos.push(ensureIndexed(bowl));

  // Nest base floor
  const floor = new THREE.CylinderGeometry(0.14, 0.14, 0.04, 8);
  floor.translate(0, 0.02, 0);
  geos.push(ensureIndexed(floor));

  // 3 Tiny speckled eggs inside
  const eggCoords = [
    [-0.05, 0.06, -0.03],
    [0.05, 0.06, -0.02],
    [0.0, 0.06, 0.05],
  ];
  for (const [ex, ey, ez] of eggCoords) {
    const egg = new THREE.SphereGeometry(0.04, 6, 6);
    egg.scale(0.85, 1.15, 0.85);
    egg.translate(ex!, ey!, ez!);
    geos.push(ensureIndexed(egg));
  }

  return mergeGeometries(geos, false)!;
}

export function AnimalRenderer({ city, engine }: AnimalRendererProps) {
  const animalsRef = useRef<AnimalAgent[]>([]);

  const dogMeshRef = useRef<THREE.InstancedMesh>(null);
  const catMeshRef = useRef<THREE.InstancedMesh>(null);
  const pigeonMeshRef = useRef<THREE.InstancedMesh>(null);
  const nestMeshRef = useRef<THREE.InstancedMesh>(null);

  const dogGeo = useMemo(() => createDogGeometry(), []);
  const catGeo = useMemo(() => createCatGeometry(), []);
  const pigeonGeo = useMemo(() => createPigeonGeometry(), []);
  const nestGeo = useMemo(() => createBirdNestGeometry(), []);

  // Initialize animals roster once
  useEffect(() => {
    animalsRef.current = createAnimalRoster(city, engine.pedestrians);
  }, [city, engine.pedestrians]);

  useEffect(() => {
    return () => {
      dogGeo.dispose();
      catGeo.dispose();
      pigeonGeo.dispose();
      nestGeo.dispose();
    };
  }, [dogGeo, catGeo, pigeonGeo, nestGeo]);

  // Initial color application
  useEffect(() => {
    const animals = animalsRef.current;
    const dogs = animals.filter((a) => a.type === 'dog');
    const cats = animals.filter((a) => a.type === 'cat');
    const pigeons = animals.filter((a) => a.type === 'pigeon');
    const nests = animals.filter((a) => a.type === 'bird_nest');

    if (dogMeshRef.current) {
      dogs.forEach((d, i) => {
        scratchColor.set(d.color);
        dogMeshRef.current!.setColorAt(i, scratchColor);
      });
      if (dogMeshRef.current.instanceColor) dogMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (catMeshRef.current) {
      cats.forEach((c, i) => {
        scratchColor.set(c.color);
        catMeshRef.current!.setColorAt(i, scratchColor);
      });
      if (catMeshRef.current.instanceColor) catMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (pigeonMeshRef.current) {
      pigeons.forEach((p, i) => {
        scratchColor.set(p.color);
        pigeonMeshRef.current!.setColorAt(i, scratchColor);
      });
      if (pigeonMeshRef.current.instanceColor) pigeonMeshRef.current.instanceColor.needsUpdate = true;
    }

    if (nestMeshRef.current) {
      nests.forEach((n, i) => {
        scratchColor.set(n.color);
        nestMeshRef.current!.setColorAt(i, scratchColor);
      });
      if (nestMeshRef.current.instanceColor) nestMeshRef.current.instanceColor.needsUpdate = true;
    }
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    const dt = Math.min(delta, 0.05);
    const animals = animalsRef.current;
    if (animals.length === 0) return;

    // Update animal sim logic (leashed dogs follow owners, pigeons hop)
    updateAnimalSim(animals, dt, engine.pedestrians);

    const dogs = animals.filter((a) => a.type === 'dog');
    const cats = animals.filter((a) => a.type === 'cat');
    const pigeons = animals.filter((a) => a.type === 'pigeon');
    const nests = animals.filter((a) => a.type === 'bird_nest');

    // 1. Dogs: animate walking gait / gentle breathing & tail wag
    if (dogMeshRef.current) {
      dogs.forEach((d, i) => {
        const isWalking = d.state === 'walking';
        const bounce = isWalking ? Math.abs(Math.sin(t * 8 + i)) * 0.035 : Math.sin(t * 2 + i) * 0.008;
        const roll = isWalking ? Math.sin(t * 8 + i) * 0.04 : 0;

        scratchObj.position.set(d.position.x, d.position.y + bounce, d.position.z);
        scratchObj.rotation.set(0, d.rotationY, roll);
        scratchObj.scale.set(d.scale, d.scale, d.scale);
        scratchObj.updateMatrix();
        dogMeshRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      dogMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Cats: subtle resting breathing and occasional tail twitch
    if (catMeshRef.current) {
      cats.forEach((c, i) => {
        const breath = Math.sin(t * 1.8 + i * 1.5) * 0.006;
        scratchObj.position.set(c.position.x, c.position.y + breath, c.position.z);
        scratchObj.rotation.set(0, c.rotationY, 0);
        scratchObj.scale.set(c.scale, c.scale * (1 + breath * 2), c.scale);
        scratchObj.updateMatrix();
        catMeshRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      catMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Pigeons: head-bob and playful ground hops
    if (pigeonMeshRef.current) {
      pigeons.forEach((p, i) => {
        const hop = Math.sin(t * 6 + (p.hopPhase ?? 0));
        const hopY = hop > 0.8 ? (hop - 0.8) * 0.15 : 0;
        const bob = Math.sin(t * 9 + i * 0.7) * 0.08;

        scratchObj.position.set(p.position.x, p.position.y + hopY, p.position.z);
        scratchObj.rotation.set(bob, p.rotationY, 0);
        scratchObj.scale.set(p.scale, p.scale, p.scale);
        scratchObj.updateMatrix();
        pigeonMeshRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      pigeonMeshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 4. Bird Nests: static cozy nests
    if (nestMeshRef.current) {
      nests.forEach((n, i) => {
        scratchObj.position.set(n.position.x, n.position.y, n.position.z);
        scratchObj.rotation.set(0, n.rotationY, 0);
        scratchObj.scale.set(n.scale, n.scale, n.scale);
        scratchObj.updateMatrix();
        nestMeshRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      nestMeshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group name="urban-animals">
      {/* Low-poly Dogs */}
      <instancedMesh ref={dogMeshRef} args={[dogGeo, undefined, 6]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.75} />
      </instancedMesh>

      {/* Low-poly Cats */}
      <instancedMesh ref={catMeshRef} args={[catGeo, undefined, 6]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.8} />
      </instancedMesh>

      {/* Low-poly Ground Pigeons */}
      <instancedMesh ref={pigeonMeshRef} args={[pigeonGeo, undefined, 12]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.7} />
      </instancedMesh>

      {/* Low-poly Bird Nests */}
      <instancedMesh ref={nestMeshRef} args={[nestGeo, undefined, 6]} castShadow receiveShadow>
        <meshStandardMaterial roughness={0.9} />
      </instancedMesh>
    </group>
  );
}
