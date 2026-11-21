import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { CAMERA_CONFIG, CAMERA_PRESETS } from '@/config/constants';
import { AnimalRenderer } from '@/scene/AnimalRenderer';
import { CameraRig } from '@/scene/CameraRig';
import { CityBuildings } from '@/scene/CityBuildings';
import { CityEnvironment } from '@/scene/CityEnvironment';
import { CityTerrain } from '@/scene/CityTerrain';
import { InstancedProps } from '@/scene/InstancedProps';
import { MicroDetails } from '@/scene/MicroDetails';
import { PedestrianRenderer } from '@/scene/PedestrianRenderer';
import { PostFX } from '@/scene/PostFX';
import { VehicleRenderer } from '@/scene/VehicleRenderer';
import { defaultWorldEngine, type WorldEngine } from '@/sim/worldEngine';
import { useCityStore } from '@/store/useCityStore';

interface SimulationBridgeProps {
  engine: WorldEngine;
}

/**
 * Steps the headless WorldEngine inside `useFrame` without triggering React state updates,
 * and updates `window.__CITY_STATS__` for automated Playwright perf tests and the PerfOverlay.
 */
function SimulationBridge({ engine }: SimulationBridgeProps) {
  const { gl } = useThree();
  const fpsAccRef = useRef({ frames: 0, elapsed: 0, fps: 60 });
  const clockSyncAccRef = useRef(0);
  const readyMarkedRef = useRef(false);

  useFrame((_, delta) => {
    const state = useCityStore.getState();

    // Sync manual time scrubber into WorldEngine when autoCycle is off
    if (!state.autoCycleTime && Math.abs(engine.timeOfDay - state.timeOfDay) > 0.001) {
      engine.setTimeOfDay(state.timeOfDay);
    }

    const scaledDt = delta * state.simSpeed;
    if (scaledDt > 0) {
      engine.step(scaledDt, state.autoCycleTime);
    }

    // Low-frequency UI sync when autoCycleTime is active (every ~0.5s, never per frame)
    if (state.autoCycleTime) {
      clockSyncAccRef.current += delta;
      if (clockSyncAccRef.current >= 0.5) {
        clockSyncAccRef.current = 0;
        useCityStore.setState({ timeOfDay: engine.timeOfDay });
      }
    }

    // Track rolling FPS & expose read-only telemetry on window.__CITY_STATS__
    const acc = fpsAccRef.current;
    acc.frames += 1;
    acc.elapsed += delta;
    if (acc.elapsed >= 0.35) {
      acc.fps = Math.round(acc.frames / acc.elapsed);
      acc.frames = 0;
      acc.elapsed = 0;
    }

    window.__CITY_STATS__ = {
      fps: acc.fps,
      drawCalls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      geometries: gl.info.memory.geometries,
      textures: gl.info.memory.textures,
      activeVehicles: engine.vehicles.length,
      activePedestrians: engine.pedestrians.length,
      timeOfDay: engine.timeOfDay,
    };

    if (!readyMarkedRef.current) {
      readyMarkedRef.current = true;
      state.setSceneReady(true);
    }
  });

  return null;
}

interface CityCanvasProps {
  engine?: WorldEngine;
}

export function CityCanvas({ engine = defaultWorldEngine }: CityCanvasProps) {
  const [contextLost, setContextLost] = useState(false);
  const highQuality = useCityStore((s) => s.highQuality);
  const clearSelection = useCityStore((s) => s.clearSelection);
  const overview = CAMERA_PRESETS.overview;

  useEffect(() => {
    // Initialize default telemetry immediately so readers always see a valid contract
    window.__CITY_STATS__ = {
      fps: 60,
      drawCalls: 0,
      triangles: 0,
      geometries: 0,
      textures: 0,
      activeVehicles: engine.vehicles.length,
      activePedestrians: engine.pedestrians.length,
      timeOfDay: engine.timeOfDay,
    };
  }, [engine]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <Canvas
        shadows={highQuality}
        dpr={highQuality ? [1, 2] : [1, 1.25]}
        camera={{
          fov: CAMERA_CONFIG.fov,
          near: CAMERA_CONFIG.near,
          far: CAMERA_CONFIG.far,
          position: [overview.position.x, overview.position.y, overview.position.z],
        }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        onPointerMissed={() => clearSelection()}
        onCreated={({ gl }) => {
          const dom = gl.domElement;
          const handleLost = (e: Event) => {
            e.preventDefault();
            setContextLost(true);
          };
          const handleRestored = () => {
            setContextLost(false);
          };
          dom.addEventListener('webglcontextlost', handleLost, false);
          dom.addEventListener('webglcontextrestored', handleRestored, false);
        }}
      >
        <SimulationBridge engine={engine} />
        <CityEnvironment engine={engine} />
        <CityTerrain city={engine.city} />
        <CityBuildings city={engine.city} engine={engine} />
        <InstancedProps city={engine.city} engine={engine} />
        <VehicleRenderer engine={engine} />
        <PedestrianRenderer engine={engine} />
        <AnimalRenderer city={engine.city} engine={engine} />
        <MicroDetails city={engine.city} />
        <CameraRig engine={engine} />
        <PostFX />
      </Canvas>

      {contextLost && (
        <div
          role="alert"
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/90 p-6 text-center backdrop-blur-md"
        >
          <div className="max-w-md rounded-2xl border border-amber-400/30 bg-stone-900/95 p-6 shadow-2xl">
            <h2 className="text-lg font-semibold text-amber-200">WebGL Context Lost</h2>
            <p className="mt-2 text-sm text-stone-300">
              Your graphics context was temporarily interrupted. Waiting for automatic recovery, or
              reload to restore the 3D miniature city.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-amber-300"
            >
              Reload City
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
