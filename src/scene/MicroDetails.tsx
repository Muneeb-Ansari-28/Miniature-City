import { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { GeneratedCity, Vec3 } from '@/sim/types';

interface MicroDetailsProps {
  city: GeneratedCity;
}

const scratchObj = new THREE.Object3D();
const STEAM_PUFFS_PER_VENT = 6;
const BIRD_COUNT = 6;

function createFlyingBirdGeometry(): THREE.BufferGeometry {
  const geos: THREE.BufferGeometry[] = [];
  // Torso
  const body = new THREE.ConeGeometry(0.12, 0.45, 5);
  body.rotateX(Math.PI * 0.5);
  geos.push(body);

  // Wings (swept back)
  const wingL = new THREE.BoxGeometry(0.55, 0.025, 0.18);
  wingL.rotateY(0.2);
  wingL.rotateZ(-0.15);
  wingL.translate(-0.32, 0.04, 0);
  geos.push(wingL);

  const wingR = new THREE.BoxGeometry(0.55, 0.025, 0.18);
  wingR.rotateY(-0.2);
  wingR.rotateZ(0.15);
  wingR.translate(0.32, 0.04, 0);
  geos.push(wingR);

  // Tail
  const tail = new THREE.BoxGeometry(0.16, 0.015, 0.18);
  tail.translate(0, 0.02, -0.26);
  geos.push(tail);

  const indexed = geos.map((g) => {
    if (!g.index) {
      const pos = g.getAttribute('position');
      const idx: number[] = [];
      for (let i = 0; i < pos.count; i++) idx.push(i);
      g.setIndex(idx);
    }
    return g;
  });

  return mergeGeometries(indexed, false)!;
}

/**
 * Adds living diorama "juice" at minimal draw-call cost:
 * - Rising soft steam puffs above restaurant & cafe rooftop vents (1 InstancedMesh)
 * - Rotating stylized rooftop icons (coffee cup, burger, ramen bowl)
 * - 5 low-poly birds gliding in wide sinusoidal loops above the city (1 InstancedMesh)
 */
export function MicroDetails({ city }: MicroDetailsProps) {
  const steamRef = useRef<THREE.InstancedMesh>(null);
  const birdsRef = useRef<THREE.InstancedMesh>(null);
  const rooftopSignRefs = useRef<(THREE.Group | null)[]>([]);

  const { steamOrigins, rooftopProps } = useMemo(() => {
    const origins: Vec3[] = [];
    const props: { id: string; kind: 'coffee_cup' | 'burger' | 'ramen_bowl'; pos: Vec3 }[] = [];

    for (const lot of city.lots) {
      const h = lot.height ?? 4.2;
      if (lot.hasSteam) {
        origins.push({
          x: lot.worldPos.x + 0.95,
          y: 0.18 + h + 0.95,
          z: lot.worldPos.z - 0.15,
        });
      }
      if (
        lot.rooftopProp === 'coffee_cup' ||
        lot.rooftopProp === 'burger' ||
        lot.rooftopProp === 'ramen_bowl'
      ) {
        props.push({
          id: lot.id,
          kind: lot.rooftopProp,
          pos: { x: lot.worldPos.x, y: 0.18 + h + 0.72, z: lot.worldPos.z - 0.3 },
        });
      }
    }
    return { steamOrigins: origins, rooftopProps: props };
  }, [city.lots]);

  const totalPuffs = steamOrigins.length * STEAM_PUFFS_PER_VENT;
  const flyingBirdGeo = useMemo(() => createFlyingBirdGeometry(), []);

  useEffect(() => {
    return () => {
      flyingBirdGeo.dispose();
    };
  }, [flyingBirdGeo]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;

    // 1. Animate rising steam puffs
    if (steamRef.current && totalPuffs > 0) {
      let idx = 0;
      for (let v = 0; v < steamOrigins.length; v++) {
        const origin = steamOrigins[v]!;
        for (let p = 0; p < STEAM_PUFFS_PER_VENT; p++) {
          const phase = (t * 0.42 + p / STEAM_PUFFS_PER_VENT + v * 0.21) % 1;
          const y = origin.y + phase * 2.4;
          const driftX = Math.sin(phase * Math.PI * 2 + v) * 0.28 * phase;
          const driftZ = Math.cos(phase * Math.PI * 1.5 + p) * 0.22 * phase;
          const scale = Math.sin(phase * Math.PI) * 0.42 + 0.05;

          scratchObj.position.set(origin.x + driftX, y, origin.z + driftZ);
          scratchObj.rotation.set(phase * 1.2, phase * 1.8, 0);
          scratchObj.scale.set(scale, scale, scale);
          scratchObj.updateMatrix();
          steamRef.current.setMatrixAt(idx++, scratchObj.matrix);
        }
      }
      steamRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Rotate rooftop coffee cup / burger / ramen signs
    for (let i = 0; i < rooftopSignRefs.current.length; i++) {
      const grp = rooftopSignRefs.current[i];
      if (grp) {
        grp.rotation.y = t * 0.75 + i * 1.1;
      }
    }

    // 3. Glide birds in wide sinusoidal loops above rooftops
    if (birdsRef.current) {
      for (let i = 0; i < BIRD_COUNT; i++) {
        const angle = t * (0.28 + i * 0.04) + (i * Math.PI * 2) / BIRD_COUNT;
        const radius = 11.5 + (i % 3) * 3.8;
        const bx = Math.cos(angle) * radius;
        const bz = Math.sin(angle) * radius;
        const by = 11.2 + Math.sin(t * 1.6 + i * 1.4) * 0.9 + (i % 2) * 1.4;
        const yaw = Math.atan2(-Math.sin(angle), Math.cos(angle));

        const wingFlap = Math.sin(t * 8.5 + i * 1.8) * 0.18;
        scratchObj.position.set(bx, by, bz);
        scratchObj.rotation.set(wingFlap, yaw, Math.sin(t * 7 + i) * 0.22);
        scratchObj.scale.set(0.65, 0.65, 0.65);
        scratchObj.updateMatrix();
        birdsRef.current.setMatrixAt(i, scratchObj.matrix);
      }
      birdsRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group name="micro-details">
      {/* Rising kitchen/cafe steam puffs */}
      {totalPuffs > 0 && (
        <instancedMesh ref={steamRef} args={[undefined, undefined, totalPuffs]}>
          <dodecahedronGeometry args={[0.55, 0]} />
          <meshStandardMaterial
            color="#f5f1ea"
            transparent
            opacity={0.42}
            depthWrite={false}
            roughness={1}
          />
        </instancedMesh>
      )}

      {/* Gliding and flapping low-poly swallows/seagulls */}
      <instancedMesh ref={birdsRef} args={[flyingBirdGeo, undefined, BIRD_COUNT]} castShadow>
        <meshStandardMaterial color="#f2ece4" roughness={0.65} />
      </instancedMesh>

      {/* Spinning rooftop landmark signs (coffee cup, burger, ramen bowl) */}
      {rooftopProps.map((prop, index) => (
        <group
          key={prop.id}
          ref={(el) => {
            rooftopSignRefs.current[index] = el;
          }}
          position={[prop.pos.x, prop.pos.y, prop.pos.z]}
        >
          {prop.kind === 'coffee_cup' && (
            <group>
              <mesh position={[0, -0.25, 0]} castShadow>
                <cylinderGeometry args={[0.68, 0.52, 0.1, 12]} />
                <meshStandardMaterial color="#f5efe6" roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.16, 0]} castShadow>
                <cylinderGeometry args={[0.48, 0.36, 0.72, 12]} />
                <meshStandardMaterial color="#faf5ed" roughness={0.35} />
              </mesh>
              <mesh position={[0, 0.48, 0]}>
                <cylinderGeometry args={[0.41, 0.41, 0.08, 12]} />
                <meshStandardMaterial color="#5c3522" roughness={0.3} />
              </mesh>
            </group>
          )}

          {prop.kind === 'burger' && (
            <group>
              <mesh position={[0, -0.15, 0]} castShadow>
                <cylinderGeometry args={[0.58, 0.54, 0.22, 12]} />
                <meshStandardMaterial color="#e09f45" roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.04, 0]} castShadow>
                <cylinderGeometry args={[0.62, 0.62, 0.14, 12]} />
                <meshStandardMaterial color="#6b3424" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.16, 0]}>
                <cylinderGeometry args={[0.64, 0.64, 0.08, 12]} />
                <meshStandardMaterial color="#63a845" roughness={0.7} />
              </mesh>
              <mesh position={[0, 0.34, 0]} castShadow>
                <sphereGeometry args={[0.56, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#e6a347" roughness={0.55} />
              </mesh>
            </group>
          )}

          {prop.kind === 'ramen_bowl' && (
            <group>
              <mesh position={[0, 0.05, 0]} castShadow>
                <cylinderGeometry args={[0.62, 0.32, 0.52, 12]} />
                <meshStandardMaterial color="#c94432" roughness={0.45} />
              </mesh>
              <mesh position={[0, 0.26, 0]}>
                <cylinderGeometry args={[0.54, 0.54, 0.1, 12]} />
                <meshStandardMaterial color="#f2c464" roughness={0.5} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
}
