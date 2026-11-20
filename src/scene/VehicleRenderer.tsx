import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SIDEWALK_HEIGHT, VEHICLE_SPECS } from '@/config/constants';
import type { WorldEngine } from '@/sim/worldEngine';
import { useCityStore } from '@/store/useCityStore';

interface VehicleRendererProps {
  engine: WorldEngine;
}

const scratchObj = new THREE.Object3D();
const scratchColor = new THREE.Color();
const COLOR_RED_ON = new THREE.Color('#ff2424');
const COLOR_RED_OFF = new THREE.Color('#381212');
const COLOR_YELLOW_ON = new THREE.Color('#ffbe2e');
const COLOR_YELLOW_OFF = new THREE.Color('#382e12');
const COLOR_GREEN_ON = new THREE.Color('#2eff7a');
const COLOR_GREEN_OFF = new THREE.Color('#10331d');
const COLOR_HEADLIGHT_ON = new THREE.Color('#fff7d6');
const COLOR_HEADLIGHT_OFF = new THREE.Color('#5e5a52');
const COLOR_BRAKE_ON = new THREE.Color('#ff2020');
const COLOR_BRAKE_OFF = new THREE.Color('#401515');

/**
 * Renders all active vehicles and intersection traffic lights using InstancedMesh
 * for minimal draw calls (< 15 total) and zero per-frame React state updates.
 * Features: 3D wheels, taxi roof caps, active headlights, bright brake lights,
 * additive night light cones, and concept-matching target reticle.
 */
export function VehicleRenderer({ engine }: VehicleRendererProps) {
  const followVehicle = useCityStore((s) => s.followVehicle);
  const followedVehicleId = useCityStore((s) => s.followedVehicleId);

  const vehicleCount = engine.vehicles.length;
  const lightCount = engine.trafficLights.length;

  const chassisRef = useRef<THREE.InstancedMesh>(null);
  const cabinRef = useRef<THREE.InstancedMesh>(null);
  const wheelsRef = useRef<THREE.InstancedMesh>(null);
  const taxiCapRef = useRef<THREE.InstancedMesh>(null);
  const headlightsRef = useRef<THREE.InstancedMesh>(null);
  const brakeLightsRef = useRef<THREE.InstancedMesh>(null);
  const headlightConeRef = useRef<THREE.InstancedMesh>(null);

  // Traffic light poles + signal lenses (2 poles per intersection: NS & EW)
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const lensRedRef = useRef<THREE.InstancedMesh>(null);
  const lensYellowRef = useRef<THREE.InstancedMesh>(null);
  const lensGreenRef = useRef<THREE.InstancedMesh>(null);

  const polePlacements = useMemo(() => {
    const half = engine.city.tileSize * 0.5 - 0.55;
    const list: { x: number; z: number; axis: 'NS' | 'EW'; lightIndex: number }[] = [];
    engine.trafficLights.forEach((light, idx) => {
      list.push({
        x: light.worldPos.x + half,
        z: light.worldPos.z + half,
        axis: 'NS',
        lightIndex: idx,
      });
      list.push({
        x: light.worldPos.x - half,
        z: light.worldPos.z - half,
        axis: 'EW',
        lightIndex: idx,
      });
    });
    return list;
  }, [engine.city.tileSize, engine.trafficLights]);

  // Initialize static vehicle colors and traffic light poles
  useEffect(() => {
    if (chassisRef.current && cabinRef.current) {
      engine.vehicles.forEach((v, i) => {
        scratchColor.set(v.color);
        chassisRef.current!.setColorAt(i, scratchColor);
        scratchColor.set(v.type === 'bus' ? '#f5efe6' : v.color).multiplyScalar(0.92);
        cabinRef.current!.setColorAt(i, scratchColor);
      });
      if (chassisRef.current.instanceColor) chassisRef.current.instanceColor.needsUpdate = true;
      if (cabinRef.current.instanceColor) cabinRef.current.instanceColor.needsUpdate = true;
    }

    if (poleRef.current && lensRedRef.current && lensYellowRef.current && lensGreenRef.current) {
      polePlacements.forEach((p, i) => {
        scratchObj.position.set(p.x, SIDEWALK_HEIGHT + 1.05, p.z);
        scratchObj.rotation.set(0, p.axis === 'NS' ? 0 : Math.PI / 2, 0);
        scratchObj.scale.set(1, 1, 1);
        scratchObj.updateMatrix();
        poleRef.current!.setMatrixAt(i, scratchObj.matrix);

        scratchObj.position.set(p.x, SIDEWALK_HEIGHT + 2.08, p.z);
        scratchObj.updateMatrix();
        lensRedRef.current!.setMatrixAt(i, scratchObj.matrix);

        scratchObj.position.set(p.x, SIDEWALK_HEIGHT + 1.88, p.z);
        scratchObj.updateMatrix();
        lensYellowRef.current!.setMatrixAt(i, scratchObj.matrix);

        scratchObj.position.set(p.x, SIDEWALK_HEIGHT + 1.68, p.z);
        scratchObj.updateMatrix();
        lensGreenRef.current!.setMatrixAt(i, scratchObj.matrix);
      });
      poleRef.current.instanceMatrix.needsUpdate = true;
      lensRedRef.current.instanceMatrix.needsUpdate = true;
      lensYellowRef.current.instanceMatrix.needsUpdate = true;
      lensGreenRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [engine.vehicles, polePlacements]);

  // Update vehicle transforms, wheels, headlights, brake lights, and traffic light lenses directly in useFrame
  useFrame(() => {
    const vehicles = engine.vehicles;
    const isNight = engine.atmosphere.isNight;

    if (
      chassisRef.current &&
      cabinRef.current &&
      wheelsRef.current &&
      taxiCapRef.current &&
      headlightsRef.current &&
      brakeLightsRef.current &&
      headlightConeRef.current
    ) {
      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i]!;
        const spec = VEHICLE_SPECS[v.type];
        const cosY = Math.cos(v.yaw);
        const sinY = Math.sin(v.yaw);

        // Lower chassis
        const chassisH = v.type === 'bus' ? spec.height * 0.72 : spec.height * 0.48;
        scratchObj.position.set(v.position.x, v.position.y + 0.18 + chassisH * 0.5, v.position.z);
        scratchObj.rotation.set(0, v.yaw, 0);
        scratchObj.scale.set(spec.width, chassisH, spec.length);
        scratchObj.updateMatrix();
        chassisRef.current.setMatrixAt(i, scratchObj.matrix);

        // Upper cabin
        const cabinH = v.type === 'bus' ? spec.height * 0.32 : spec.height * 0.42;
        const cabinL = v.type === 'bus' ? spec.length * 0.92 : spec.length * 0.56;
        scratchObj.position.set(
          v.position.x,
          v.position.y + 0.18 + chassisH + cabinH * 0.45,
          v.position.z,
        );
        scratchObj.scale.set(spec.width * 0.88, cabinH, cabinL);
        scratchObj.updateMatrix();
        cabinRef.current.setMatrixAt(i, scratchObj.matrix);

        // 4 Wheels
        const wdx = spec.width * 0.48;
        const wdz = spec.length * 0.3;
        const wheelOffsets: [number, number][] = [
          [-wdx, wdz],
          [wdx, wdz],
          [-wdx, -wdz],
          [wdx, -wdz],
        ];
        for (let w = 0; w < 4; w++) {
          const [ox, oz] = wheelOffsets[w]!;
          const wx = v.position.x + cosY * ox + sinY * oz;
          const wz = v.position.z - sinY * ox + cosY * oz;
          scratchObj.position.set(wx, v.position.y + 0.16, wz);
          scratchObj.rotation.set(0, v.yaw, Math.PI / 2);
          scratchObj.scale.set(0.18, 0.12, 0.18);
          scratchObj.updateMatrix();
          wheelsRef.current.setMatrixAt(i * 4 + w, scratchObj.matrix);
        }

        // TAXI roof sign cap
        if (v.type === 'taxi') {
          scratchObj.position.set(
            v.position.x,
            v.position.y + 0.18 + chassisH + cabinH + 0.08,
            v.position.z,
          );
          scratchObj.rotation.set(0, v.yaw, 0);
          scratchObj.scale.set(0.38, 0.14, 0.18);
        } else {
          scratchObj.position.set(0, -50, 0);
          scratchObj.scale.set(0.001, 0.001, 0.001);
        }
        scratchObj.updateMatrix();
        taxiCapRef.current.setMatrixAt(i, scratchObj.matrix);

        // Front headlights (+Z in local car frame)
        const frontOffset = spec.length * 0.5 + 0.02;
        scratchObj.position.set(
          v.position.x + sinY * frontOffset,
          v.position.y + 0.36,
          v.position.z + cosY * frontOffset,
        );
        scratchObj.scale.set(spec.width * 0.72, 0.12, 0.08);
        scratchObj.updateMatrix();
        headlightsRef.current.setMatrixAt(i, scratchObj.matrix);
        headlightsRef.current.setColorAt(
          i,
          v.headlightsOn || isNight ? COLOR_HEADLIGHT_ON : COLOR_HEADLIGHT_OFF,
        );

        // Rear brake lights (-Z in local car frame)
        const rearOffset = -spec.length * 0.5 - 0.02;
        scratchObj.position.set(
          v.position.x + sinY * rearOffset,
          v.position.y + 0.38,
          v.position.z + cosY * rearOffset,
        );
        scratchObj.scale.set(spec.width * 0.72, 0.12, 0.08);
        scratchObj.updateMatrix();
        brakeLightsRef.current.setMatrixAt(i, scratchObj.matrix);
        brakeLightsRef.current.setColorAt(i, v.brakeLightsOn ? COLOR_BRAKE_ON : COLOR_BRAKE_OFF);

        // Headlight cone projection
        if (isNight || v.headlightsOn) {
          const coneOffset = spec.length * 0.5 + 1.25;
          scratchObj.position.set(
            v.position.x + sinY * coneOffset,
            v.position.y + 0.22,
            v.position.z + cosY * coneOffset,
          );
          scratchObj.rotation.set(-Math.PI / 2, 0, -v.yaw);
          scratchObj.scale.set(1.1, 1.2, 1.1);
        } else {
          scratchObj.position.set(0, -50, 0);
          scratchObj.scale.set(0.001, 0.001, 0.001);
        }
        scratchObj.updateMatrix();
        headlightConeRef.current.setMatrixAt(i, scratchObj.matrix);
      }

      chassisRef.current.instanceMatrix.needsUpdate = true;
      cabinRef.current.instanceMatrix.needsUpdate = true;
      wheelsRef.current.instanceMatrix.needsUpdate = true;
      taxiCapRef.current.instanceMatrix.needsUpdate = true;
      headlightsRef.current.instanceMatrix.needsUpdate = true;
      brakeLightsRef.current.instanceMatrix.needsUpdate = true;
      headlightConeRef.current.instanceMatrix.needsUpdate = true;
      if (headlightsRef.current.instanceColor) headlightsRef.current.instanceColor.needsUpdate = true;
      if (brakeLightsRef.current.instanceColor) brakeLightsRef.current.instanceColor.needsUpdate = true;
    }

    // Update intersection signal lenses
    if (lensRedRef.current && lensYellowRef.current && lensGreenRef.current) {
      for (let i = 0; i < polePlacements.length; i++) {
        const p = polePlacements[i]!;
        const light = engine.trafficLights[p.lightIndex]!;
        const color = p.axis === 'NS' ? light.nsLight : light.ewLight;
        lensRedRef.current.setColorAt(i, color === 'red' ? COLOR_RED_ON : COLOR_RED_OFF);
        lensYellowRef.current.setColorAt(i, color === 'yellow' ? COLOR_YELLOW_ON : COLOR_YELLOW_OFF);
        lensGreenRef.current.setColorAt(i, color === 'green' ? COLOR_GREEN_ON : COLOR_GREEN_OFF);
      }
      if (lensRedRef.current.instanceColor) lensRedRef.current.instanceColor.needsUpdate = true;
      if (lensYellowRef.current.instanceColor) lensYellowRef.current.instanceColor.needsUpdate = true;
      if (lensGreenRef.current.instanceColor) lensGreenRef.current.instanceColor.needsUpdate = true;
    }
  });

  const handleVehicleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const v = engine.vehicles[e.instanceId];
    if (v) followVehicle(v.id);
  };

  const followedVehicle = followedVehicleId ? engine.getVehicleById(followedVehicleId) : undefined;

  return (
    <group name="vehicles-and-signals">
      {/* Lower vehicle chassis */}
      <instancedMesh
        ref={chassisRef}
        args={[undefined, undefined, vehicleCount]}
        castShadow
        receiveShadow
        onClick={handleVehicleClick}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.4} metalness={0.2} />
      </instancedMesh>

      {/* Upper cabin & windows */}
      <instancedMesh
        ref={cabinRef}
        args={[undefined, undefined, vehicleCount]}
        castShadow
        onClick={handleVehicleClick}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial roughness={0.35} metalness={0.25} />
      </instancedMesh>

      {/* 4 Wheels per vehicle */}
      <instancedMesh ref={wheelsRef} args={[undefined, undefined, vehicleCount * 4]} castShadow>
        <cylinderGeometry args={[1, 1, 1, 10]} />
        <meshStandardMaterial color="#222329" roughness={0.88} />
      </instancedMesh>

      {/* Illuminated TAXI roof caps */}
      <instancedMesh ref={taxiCapRef} args={[undefined, undefined, vehicleCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#fff2a6"
          emissive="#ffca38"
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </instancedMesh>

      {/* Headlights */}
      <instancedMesh ref={headlightsRef} args={[undefined, undefined, vehicleCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Brake lights */}
      <instancedMesh ref={brakeLightsRef} args={[undefined, undefined, vehicleCount]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Headlight road cones */}
      <instancedMesh ref={headlightConeRef} args={[undefined, undefined, vehicleCount]}>
        <coneGeometry args={[0.85, 2.6, 10, 1, true]} />
        <meshBasicMaterial
          color="#ffe8a3"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>

      {/* Traffic light poles & emissive signal lenses */}
      <instancedMesh ref={poleRef} args={[undefined, undefined, lightCount * 2]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 2.1, 6]} />
        <meshStandardMaterial color="#2d303a" roughness={0.65} metalness={0.35} />
      </instancedMesh>
      <instancedMesh ref={lensRedRef} args={[undefined, undefined, lightCount * 2]}>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={lensYellowRef} args={[undefined, undefined, lightCount * 2]}>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={lensGreenRef} args={[undefined, undefined, lightCount * 2]}>
        <sphereGeometry args={[0.11, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* Floating Ride-Along target reticle & badge matching concept art */}
      {followedVehicle && (
        <Html
          position={[
            followedVehicle.position.x,
            followedVehicle.position.y + 1.9,
            followedVehicle.position.z,
          ]}
          center
          distanceFactor={22}
          zIndexRange={[10, 0]}
        >
          <div className="pointer-events-none relative flex flex-col items-center">
            {/* Corner bracket target reticle */}
            <div className="relative h-11 w-14 border border-amber-400/40 bg-amber-400/10">
              <span className="absolute -top-1 -left-1 h-2.5 w-2.5 border-t-2 border-l-2 border-amber-300" />
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 border-t-2 border-r-2 border-amber-300" />
              <span className="absolute -bottom-1 -left-1 h-2.5 w-2.5 border-b-2 border-l-2 border-amber-300" />
              <span className="absolute -bottom-1 -right-1 h-2.5 w-2.5 border-b-2 border-r-2 border-amber-300" />
            </div>

            {/* Target callout pill matching Finished_Product_Concept.jpg */}
            <div className="mt-1 flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/20 bg-stone-950/90 px-2.5 py-1 text-[11px] font-bold tracking-wider text-amber-200 shadow-xl backdrop-blur-md">
              <span>🎯</span>
              <span>FOLLOW: {followedVehicle.label}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
