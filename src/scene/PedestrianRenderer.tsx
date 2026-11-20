import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WorldEngine } from '@/sim/worldEngine';

interface PedestrianRendererProps {
  engine: WorldEngine;
}

const scratchObj = new THREE.Object3D();
const scratchColor = new THREE.Color();

/**
 * Renders all walking, waiting, idling, and dining citizens in just 3 draw calls
 * (legs, torso, head) with procedural stride bobbing and sitting poses in `useFrame`.
 */
export function PedestrianRenderer({ engine }: PedestrianRendererProps) {
  const count = engine.pedestrians.length;
  const legsRef = useRef<THREE.InstancedMesh>(null);
  const torsoRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    if (!legsRef.current || !torsoRef.current || !headRef.current) return;
    engine.pedestrians.forEach((p, i) => {
      scratchColor.set(p.pantsColor);
      legsRef.current!.setColorAt(i, scratchColor);
      scratchColor.set(p.shirtColor);
      torsoRef.current!.setColorAt(i, scratchColor);
      scratchColor.set(p.skinTone);
      headRef.current!.setColorAt(i, scratchColor);
    });
    if (legsRef.current.instanceColor) legsRef.current.instanceColor.needsUpdate = true;
    if (torsoRef.current.instanceColor) torsoRef.current.instanceColor.needsUpdate = true;
    if (headRef.current.instanceColor) headRef.current.instanceColor.needsUpdate = true;
  }, [engine.pedestrians]);

  useFrame(() => {
    if (!legsRef.current || !torsoRef.current || !headRef.current) return;
    const peds = engine.pedestrians;

    for (let i = 0; i < peds.length; i++) {
      const p = peds[i]!;
      const isDining = p.state === 'dining';
      const isWalking = p.state === 'walking';
      const bob = isWalking ? Math.abs(Math.sin(p.walkPhase)) * 0.07 : 0;
      const tilt = isWalking ? Math.sin(p.walkPhase) * 0.08 : 0;
      const sitDrop = isDining ? -0.14 : 0;

      // Legs
      scratchObj.position.set(p.position.x, p.position.y + 0.16 + sitDrop * 0.5, p.position.z);
      scratchObj.rotation.set(0, p.yaw, tilt);
      scratchObj.scale.set(0.18, isDining ? 0.18 : 0.3, 0.16);
      scratchObj.updateMatrix();
      legsRef.current.setMatrixAt(i, scratchObj.matrix);

      // Torso
      scratchObj.position.set(
        p.position.x,
        p.position.y + 0.44 + bob + sitDrop,
        p.position.z,
      );
      scratchObj.rotation.set(0, p.yaw, -tilt * 0.5);
      scratchObj.scale.set(0.24, 0.3, 0.18);
      scratchObj.updateMatrix();
      torsoRef.current.setMatrixAt(i, scratchObj.matrix);

      // Head
      scratchObj.position.set(
        p.position.x,
        p.position.y + 0.72 + bob + sitDrop,
        p.position.z,
      );
      scratchObj.rotation.set(0, p.yaw, 0);
      scratchObj.scale.set(0.17, 0.17, 0.17);
      scratchObj.updateMatrix();
      headRef.current.setMatrixAt(i, scratchObj.matrix);
    }

    legsRef.current.instanceMatrix.needsUpdate = true;
    torsoRef.current.instanceMatrix.needsUpdate = true;
    headRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="pedestrians">
      <instancedMesh ref={legsRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.85} />
      </instancedMesh>
      <instancedMesh ref={torsoRef} args={[undefined, undefined, count]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.78} />
      </instancedMesh>
      <instancedMesh ref={headRef} args={[undefined, undefined, count]} castShadow>
        <sphereGeometry args={[0.72, 8, 8]} />
        <meshStandardMaterial roughness={0.75} />
      </instancedMesh>
    </group>
  );
}
