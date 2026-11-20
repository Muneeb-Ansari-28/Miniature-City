import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { SIDEWALK_HEIGHT } from '@/config/constants';
import { buildAllVehicleGeometries } from '@/scene/procedural/vehicleFactory';
import type { VehicleAgent, VehicleType } from '@/sim/types';
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

const VEHICLE_TYPES: readonly VehicleType[] = ['sedan', 'taxi', 'compact', 'van', 'bus'];

interface TypeGroup {
  type: VehicleType;
  items: { vehicleIndex: number; typeIndex: number; vehicle: VehicleAgent }[];
}

/**
 * High-detail procedural vehicle renderer:
 * - Handcrafted procedural 3D models per type (Sedan, Taxi, Compact, Van, Bus)
 * - Raked windshields, sculpted hoods, stepped trunks, roof spoilers, and cargo boxes
 * - Shiny chrome bumpers, radiator grilles, and side-view mirrors
 * - 4 rubber tires with bright silver alloy hubcaps on every vehicle
 * - Illuminated TAXI roof caps, active headlights, responsive brake lights, and night light cones
 * - 100% InstancedMesh rendered for optimal performance (< 55 total draw calls)
 */
export function VehicleRenderer({ engine }: VehicleRendererProps) {
  const followVehicle = useCityStore((s) => s.followVehicle);
  const followedVehicleId = useCityStore((s) => s.followedVehicleId);

  const vehicleCount = engine.vehicles.length;
  const lightCount = engine.trafficLights.length;

  const geometries = useMemo(() => buildAllVehicleGeometries(), []);

  // Partition vehicles by type
  const typeGroups = useMemo(() => {
    const map: Record<VehicleType, TypeGroup> = {
      sedan: { type: 'sedan', items: [] },
      taxi: { type: 'taxi', items: [] },
      compact: { type: 'compact', items: [] },
      van: { type: 'van', items: [] },
      bus: { type: 'bus', items: [] },
    };
    engine.vehicles.forEach((v, i) => {
      map[v.type].items.push({
        vehicleIndex: i,
        typeIndex: map[v.type].items.length,
        vehicle: v,
      });
    });
    return map;
  }, [engine.vehicles]);

  // InstancedMesh refs per vehicle type
  const bodyRefs = {
    sedan: useRef<THREE.InstancedMesh>(null),
    taxi: useRef<THREE.InstancedMesh>(null),
    compact: useRef<THREE.InstancedMesh>(null),
    van: useRef<THREE.InstancedMesh>(null),
    bus: useRef<THREE.InstancedMesh>(null),
  };
  const glassRefs = {
    sedan: useRef<THREE.InstancedMesh>(null),
    taxi: useRef<THREE.InstancedMesh>(null),
    compact: useRef<THREE.InstancedMesh>(null),
    van: useRef<THREE.InstancedMesh>(null),
    bus: useRef<THREE.InstancedMesh>(null),
  };
  const chromeRefs = {
    sedan: useRef<THREE.InstancedMesh>(null),
    taxi: useRef<THREE.InstancedMesh>(null),
    compact: useRef<THREE.InstancedMesh>(null),
    van: useRef<THREE.InstancedMesh>(null),
    bus: useRef<THREE.InstancedMesh>(null),
  };

  const taxiSignRef = useRef<THREE.InstancedMesh>(null);
  const tiresRef = useRef<THREE.InstancedMesh>(null);
  const hubcapsRef = useRef<THREE.InstancedMesh>(null);
  const headlightsRef = useRef<THREE.InstancedMesh>(null);
  const brakeLightsRef = useRef<THREE.InstancedMesh>(null);
  const headlightConeRef = useRef<THREE.InstancedMesh>(null);

  // Traffic lights
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

  // Set initial vehicle colors & traffic light poles
  useLayoutEffect(() => {
    VEHICLE_TYPES.forEach((t) => {
      const ref = bodyRefs[t].current;
      const group = typeGroups[t];
      if (ref && group.items.length > 0) {
        group.items.forEach((item, k) => {
          scratchColor.set(item.vehicle.color);
          ref.setColorAt(k, scratchColor);
        });
        if (ref.instanceColor) ref.instanceColor.needsUpdate = true;
        if (ref.material) (ref.material as THREE.Material).needsUpdate = true;
      }
    });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeGroups, polePlacements]);

  // Update transforms and lighting in useFrame
  useFrame(() => {
    const vehicles = engine.vehicles;
    const isNight = engine.atmosphere.isNight;

    // 1. Update vehicle bodies, glass, and chrome per type
    VEHICLE_TYPES.forEach((t) => {
      const bodyMesh = bodyRefs[t].current;
      const glassMesh = glassRefs[t].current;
      const chromeMesh = chromeRefs[t].current;
      const group = typeGroups[t];

      if (bodyMesh && glassMesh && chromeMesh && group.items.length > 0) {
        for (let k = 0; k < group.items.length; k++) {
          const v = group.items[k]!.vehicle;
          scratchObj.position.set(v.position.x, v.position.y, v.position.z);
          scratchObj.rotation.set(0, v.yaw, 0);
          scratchObj.scale.set(1, 1, 1);
          scratchObj.updateMatrix();

          bodyMesh.setMatrixAt(k, scratchObj.matrix);
          glassMesh.setMatrixAt(k, scratchObj.matrix);
          chromeMesh.setMatrixAt(k, scratchObj.matrix);

          if (t === 'taxi' && taxiSignRef.current) {
            taxiSignRef.current.setMatrixAt(k, scratchObj.matrix);
          }
        }
        bodyMesh.instanceMatrix.needsUpdate = true;
        glassMesh.instanceMatrix.needsUpdate = true;
        chromeMesh.instanceMatrix.needsUpdate = true;
        if (t === 'taxi' && taxiSignRef.current) {
          taxiSignRef.current.instanceMatrix.needsUpdate = true;
        }
      }
    });

    // 2. Update 4 wheels (tires + hubcaps), headlights, brake lights, and cones for each vehicle
    if (
      tiresRef.current &&
      hubcapsRef.current &&
      headlightsRef.current &&
      brakeLightsRef.current &&
      headlightConeRef.current
    ) {
      for (let i = 0; i < vehicles.length; i++) {
        const v = vehicles[i]!;
        const cosY = Math.cos(v.yaw);
        const sinY = Math.sin(v.yaw);

        // Dimensions by type
        let wdx = 0.48;
        let wdz = 0.62;
        let frontLightZ = 1.08;
        let rearLightZ = -1.08;
        let frontLightY = 0.36;
        let rearLightY = 0.42;
        let lightWidth = 0.72;

        if (v.type === 'compact') {
          wdx = 0.44;
          wdz = 0.52;
          frontLightZ = 0.90;
          rearLightZ = -0.90;
          frontLightY = 0.35;
          rearLightY = 0.40;
          lightWidth = 0.66;
        } else if (v.type === 'van') {
          wdx = 0.52;
          wdz = 0.72;
          frontLightZ = 1.25;
          rearLightZ = -1.24;
          frontLightY = 0.42;
          rearLightY = 0.46;
          lightWidth = 0.80;
        } else if (v.type === 'bus') {
          wdx = 0.56;
          wdz = 1.05;
          frontLightZ = 1.68;
          rearLightZ = -1.68;
          frontLightY = 0.40;
          rearLightY = 0.48;
          lightWidth = 0.90;
        }

        // 4 Wheels
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

          // Tire
          scratchObj.position.set(wx, v.position.y + 0.18, wz);
          scratchObj.rotation.set(0, v.yaw, 0);
          scratchObj.scale.set(1, 1, 1);
          scratchObj.updateMatrix();
          tiresRef.current.setMatrixAt(i * 4 + w, scratchObj.matrix);

          // Hubcap: on the outer face of the wheel
          // If ox > 0 (right wheel), faces +X in local space; if ox < 0, rotated to face -X
          scratchObj.rotation.set(0, ox > 0 ? v.yaw : v.yaw + Math.PI, 0);
          scratchObj.updateMatrix();
          hubcapsRef.current.setMatrixAt(i * 4 + w, scratchObj.matrix);
        }

        // Front Headlights
        scratchObj.position.set(
          v.position.x + sinY * frontLightZ,
          v.position.y + frontLightY,
          v.position.z + cosY * frontLightZ,
        );
        scratchObj.rotation.set(0, v.yaw, 0);
        scratchObj.scale.set(lightWidth, 0.10, 0.08);
        scratchObj.updateMatrix();
        headlightsRef.current.setMatrixAt(i, scratchObj.matrix);
        headlightsRef.current.setColorAt(
          i,
          v.headlightsOn || isNight ? COLOR_HEADLIGHT_ON : COLOR_HEADLIGHT_OFF,
        );

        // Rear Brake Lights
        scratchObj.position.set(
          v.position.x + sinY * rearLightZ,
          v.position.y + rearLightY,
          v.position.z + cosY * rearLightZ,
        );
        scratchObj.rotation.set(0, v.yaw, 0);
        scratchObj.scale.set(lightWidth, 0.10, 0.08);
        scratchObj.updateMatrix();
        brakeLightsRef.current.setMatrixAt(i, scratchObj.matrix);
        brakeLightsRef.current.setColorAt(i, v.brakeLightsOn ? COLOR_BRAKE_ON : COLOR_BRAKE_OFF);

        // Headlight road cone projection
        if (isNight || v.headlightsOn) {
          const coneOffset = frontLightZ + 1.25;
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

      tiresRef.current.instanceMatrix.needsUpdate = true;
      hubcapsRef.current.instanceMatrix.needsUpdate = true;
      headlightsRef.current.instanceMatrix.needsUpdate = true;
      brakeLightsRef.current.instanceMatrix.needsUpdate = true;
      headlightConeRef.current.instanceMatrix.needsUpdate = true;
      if (headlightsRef.current.instanceColor) headlightsRef.current.instanceColor.needsUpdate = true;
      if (brakeLightsRef.current.instanceColor) brakeLightsRef.current.instanceColor.needsUpdate = true;
    }

    // 3. Update intersection signal lenses
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

  const handleVehicleTypeClick = (type: VehicleType, e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (e.instanceId === undefined) return;
    const item = typeGroups[type].items[e.instanceId];
    if (item) followVehicle(item.vehicle.id);
  };

  const followedVehicle = followedVehicleId ? engine.getVehicleById(followedVehicleId) : undefined;

  return (
    <group name="vehicles-and-signals">
      {/* 1. Procedural vehicle models grouped by type (Sedan, Taxi, Compact, Van, Bus) */}
      {VEHICLE_TYPES.map((t) => {
        const count = typeGroups[t].items.length;
        if (count === 0) return null;
        const pack = geometries.packs[t];

        return (
          <group key={t} name={`vehicles-${t}`}>
            {/* Sculpted bodywork */}
            <instancedMesh
              ref={bodyRefs[t]}
              args={[pack.body, undefined, count]}
              castShadow
              receiveShadow
              onClick={(e) => handleVehicleTypeClick(t, e)}
              onPointerOver={() => {
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'auto';
              }}
            >
              <meshStandardMaterial roughness={0.32} metalness={0.35} />
            </instancedMesh>

            {/* Tinted glass windows */}
            <instancedMesh
              ref={glassRefs[t]}
              args={[pack.glass, undefined, count]}
              castShadow
              onClick={(e) => handleVehicleTypeClick(t, e)}
            >
              <meshStandardMaterial color="#1a2536" roughness={0.12} metalness={0.82} />
            </instancedMesh>

            {/* Polished chrome bumpers, grille, side mirrors */}
            <instancedMesh ref={chromeRefs[t]} args={[pack.chrome, undefined, count]} castShadow>
              <meshStandardMaterial color="#e8ecf2" roughness={0.16} metalness={0.92} />
            </instancedMesh>

            {/* Taxi illuminated roof sign */}
            {t === 'taxi' && pack.roofSign && (
              <instancedMesh ref={taxiSignRef} args={[pack.roofSign, undefined, count]}>
                <meshStandardMaterial
                  color="#fff2a6"
                  emissive="#ffca38"
                  emissiveIntensity={2.8}
                  toneMapped={false}
                />
              </instancedMesh>
            )}
          </group>
        );
      })}

      {/* 2. Detailed 4 wheels per vehicle (rubber tires + silver hubcaps) */}
      <instancedMesh
        ref={tiresRef}
        args={[geometries.wheel.tire, undefined, Math.max(1, vehicleCount * 4)]}
        castShadow
      >
        <meshStandardMaterial color="#1c1d22" roughness={0.92} />
      </instancedMesh>

      <instancedMesh
        ref={hubcapsRef}
        args={[geometries.wheel.hubcap, undefined, Math.max(1, vehicleCount * 4)]}
        castShadow
      >
        <meshStandardMaterial color="#dbe2ea" roughness={0.25} metalness={0.88} />
      </instancedMesh>

      {/* 3. Headlights & Brake Lights */}
      <instancedMesh
        ref={headlightsRef}
        args={[undefined, undefined, Math.max(1, vehicleCount)]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      <instancedMesh
        ref={brakeLightsRef}
        args={[undefined, undefined, Math.max(1, vehicleCount)]}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>

      {/* 4. Headlight road cones */}
      <instancedMesh
        ref={headlightConeRef}
        args={[undefined, undefined, Math.max(1, vehicleCount)]}
      >
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

      {/* 5. Traffic light poles & signal lenses */}
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

      {/* 6. Floating Ride-Along target reticle & badge matching concept art */}
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
