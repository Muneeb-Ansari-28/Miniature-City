import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { CAMERA_CONFIG, CAMERA_PRESETS } from '@/config/constants';
import type { WorldEngine } from '@/sim/worldEngine';
import { useCityStore } from '@/store/useCityStore';

interface CameraRigProps {
  engine: WorldEngine;
}

const desiredPos = new THREE.Vector3();
const desiredTarget = new THREE.Vector3();

/**
 * Manages miniature tilt-shift OrbitControls, smooth preset & POI focus transitions,
 * and the Ride-Along vehicle Chase Camera (automatically exiting on manual drag).
 */
export function CameraRig({ engine }: CameraRigProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const cameraPreset = useCityStore((s) => s.cameraPreset);
  const cameraPresetVersion = useCityStore((s) => s.cameraPresetVersion);
  const selectedPoiId = useCityStore((s) => s.selectedPoiId);
  const followedVehicleId = useCityStore((s) => s.followedVehicleId);
  const followVehicle = useCityStore((s) => s.followVehicle);

  const isTransitioningRef = useRef(false);
  const transitionGoalPos = useRef(new THREE.Vector3(28, 24, 28));
  const transitionGoalTarget = useRef(new THREE.Vector3(0, 1.2, 0));

  // Trigger smooth camera transition on preset selection
  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPreset];
    if (!preset) return;
    transitionGoalPos.current.set(preset.position.x, preset.position.y, preset.position.z);
    transitionGoalTarget.current.set(preset.target.x, preset.target.y, preset.target.z);
    isTransitioningRef.current = true;
  }, [cameraPreset, cameraPresetVersion]);

  // Smoothly focus on selected POI when clicked
  useEffect(() => {
    if (!selectedPoiId) return;
    const poi = engine.getPoiById(selectedPoiId);
    if (!poi) return;
    transitionGoalTarget.current.set(poi.worldPos.x, 1.4, poi.worldPos.z);
    transitionGoalPos.current.set(poi.worldPos.x + 11.5, 9.8, poi.worldPos.z + 12.5);
    isTransitioningRef.current = true;
  }, [selectedPoiId, engine]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const dt = Math.min(delta, 0.05);
    const lerpAlpha = 1 - Math.exp(-5.5 * dt);

    // Ride-Along Chase Cam mode
    if (followedVehicleId) {
      const v = engine.getVehicleById(followedVehicleId);
      if (v) {
        isTransitioningRef.current = false;
        const backDist = 7.2;
        const height = 4.6;
        desiredTarget.set(v.position.x, v.position.y + 0.9, v.position.z);
        desiredPos.set(
          v.position.x - Math.sin(v.yaw) * backDist,
          v.position.y + height,
          v.position.z - Math.cos(v.yaw) * backDist,
        );
        camera.position.lerp(desiredPos, lerpAlpha);
        controls.target.lerp(desiredTarget, lerpAlpha * 1.4);
        controls.update();
        return;
      }
    }

    // Smooth camera preset / POI focus transition
    if (isTransitioningRef.current) {
      camera.position.lerp(transitionGoalPos.current, lerpAlpha);
      controls.target.lerp(transitionGoalTarget.current, lerpAlpha);
      if (
        camera.position.distanceTo(transitionGoalPos.current) < 0.08 &&
        controls.target.distanceTo(transitionGoalTarget.current) < 0.08
      ) {
        isTransitioningRef.current = false;
      }
    }

    // Clamp pan target inside island bounds
    const limit = CAMERA_CONFIG.panLimit;
    controls.target.x = Math.max(-limit, Math.min(limit, controls.target.x));
    controls.target.z = Math.max(-limit, Math.min(limit, controls.target.z));
    controls.target.y = Math.max(0, Math.min(6, controls.target.y));
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      minDistance={CAMERA_CONFIG.minDistance}
      maxDistance={CAMERA_CONFIG.maxDistance}
      minPolarAngle={CAMERA_CONFIG.minPolarAngle}
      maxPolarAngle={CAMERA_CONFIG.maxPolarAngle}
      onStart={() => {
        // Manual user interaction cancels auto-transition & exits Ride-Along Follow Cam
        isTransitioningRef.current = false;
        if (useCityStore.getState().followedVehicleId) {
          followVehicle(null);
        }
      }}
    />
  );
}
