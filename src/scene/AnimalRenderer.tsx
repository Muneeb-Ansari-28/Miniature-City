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
/**
 * Helper to assign RGB vertex colors to a sub-geometry prior to merging.
 */
function applyVertexColor(geo: THREE.BufferGeometry, hex: string): THREE.BufferGeometry {
  const color = new THREE.Color(hex);
  const count = geo.getAttribute('position').count;
  const colors = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

/**
 * Builds a cozy woven bird nest with contrasting Robin's egg blue & speckled cream eggs inside.
 */
function createBirdNestGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];

  // Woven twig outer bowl in bark brown
  const bowl = new THREE.TorusGeometry(0.19, 0.075, 6, 10);
  bowl.rotateX(Math.PI * 0.5);
  bowl.translate(0, 0.075, 0);
  geos.push(applyVertexColor(ensureIndexed(bowl), '#543d2b'));

  // Nest base floor
  const floor = new THREE.CylinderGeometry(0.15, 0.15, 0.04, 8);
  floor.translate(0, 0.02, 0);
  geos.push(applyVertexColor(ensureIndexed(floor), '#3d2b1d'));

  // 3 distinct pastel bird eggs nestled snugly inside
  const eggCoords: [number, number, number, string][] = [
    [-0.055, 0.08, -0.035, '#88d8d4'], // Robin's egg turquoise
    [0.055, 0.08, -0.025, '#f4eee1'], // Speckled porcelain cream
    [0.005, 0.085, 0.055, '#a2e4e0'], // Soft pastel cyan
  ];

  for (const [ex, ey, ez, col] of eggCoords) {
    const egg = new THREE.SphereGeometry(0.052, 7, 7);
    egg.scale(0.9, 1.25, 0.9);
    egg.translate(ex, ey, ez);
    geos.push(applyVertexColor(ensureIndexed(egg), col));
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
    // Nests use embedded geometry vertex colors (twig brown bowl + pastel blue/cream eggs)
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
        const bounce = isWalking ? Math.abs(Math.sin(t * 9 + i * 2)) * 0.045 : Math.sin(t * 2 + i) * 0.008;
        const roll = isWalking ? Math.sin(t * 9 + i * 2) * 0.06 : 0;

        scratchObj.position.set(d.position.x, d.position.y + bounce, d.position.z);
        scratchObj.rotation.set(0, d.rotationY, roll);
        scratchObj.scale.set(d.scale, d.scale, d.scale);
        scratchObj.updateMatrix();
        dogMeshRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      // Zero out unused instances so ghost white dogs never sit at (0, 0, 0)
      for (let i = dogs.length; i < 6; i++) {
        scratchObj.position.set(0, -999, 0);
        scratchObj.scale.set(0, 0, 0);
        scratchObj.updateMatrix();
        dogMeshRef.current!.setMatrixAt(i, scratchObj.matrix);
      }
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
      for (let i = cats.length; i < 6; i++) {
        scratchObj.position.set(0, -999, 0);
        scratchObj.scale.set(0, 0, 0);
        scratchObj.updateMatrix();
        catMeshRef.current!.setMatrixAt(i, scratchObj.matrix);
      }
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
      for (let i = pigeons.length; i < 12; i++) {
        scratchObj.position.set(0, -999, 0);
        scratchObj.scale.set(0, 0, 0);
        scratchObj.updateMatrix();
        pigeonMeshRef.current!.setMatrixAt(i, scratchObj.matrix);
      }
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
      for (let i = nests.length; i < 6; i++) {
        scratchObj.position.set(0, -999, 0);
        scratchObj.scale.set(0, 0, 0);
        scratchObj.updateMatrix();
        nestMeshRef.current!.setMatrixAt(i, scratchObj.matrix);
      }
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

      {/* Low-poly Bird Nests with colorful eggs */}
      <instancedMesh ref={nestMeshRef} args={[nestGeo, undefined, 6]} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.7} />
      </instancedMesh>
    </group>
  );
}
