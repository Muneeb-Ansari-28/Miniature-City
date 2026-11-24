import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { WorldEngine } from '@/sim/worldEngine';
import { useCityStore } from '@/store/useCityStore';

interface CityEnvironmentProps {
  engine: WorldEngine;
}

const RAIN_COUNT = 320;
const scratchObj = new THREE.Object3D();
const scratchColorA = new THREE.Color();
const scratchColorB = new THREE.Color();

const SKY_VERTEX_SHADER = `
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const SKY_FRAGMENT_SHADER = `
  uniform vec3 uTopColor;
  uniform vec3 uHorizonColor;
  varying vec3 vWorldPosition;
  void main() {
    float h = normalize(vWorldPosition + vec3(0.0, 22.0, 0.0)).y;
    float factor = pow(max(h, 0.0), 0.55);
    vec3 col = mix(uHorizonColor, uTopColor, factor);
    gl_FragColor = vec4(col, 1.0);
  }
`;

/**
 * Renders the dynamic sky gradient dome, solar-arc directional light with shadows,
 * ambient hemisphere fill, atmospheric fog, and toggleable instanced rain streaks.
 */
export function CityEnvironment({ engine }: CityEnvironmentProps) {
  const weather = useCityStore((s) => s.weather);
  const highQuality = useCityStore((s) => s.highQuality);
  const { scene } = useThree();

  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight>(null);
  const rainRef = useRef<THREE.InstancedMesh>(null);

  const skyMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTopColor: { value: new THREE.Color(engine.atmosphere.skyTopColor) },
          uHorizonColor: { value: new THREE.Color(engine.atmosphere.skyHorizonColor) },
        },
        vertexShader: SKY_VERTEX_SHADER,
        fragmentShader: SKY_FRAGMENT_SHADER,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [engine.atmosphere.skyHorizonColor, engine.atmosphere.skyTopColor],
  );

  const rainSeeds = useMemo(() => {
    const arr: { x: number; y: number; z: number; speed: number }[] = [];
    for (let i = 0; i < RAIN_COUNT; i++) {
      // Deterministic pseudo-random scatter across the island
      const sx = Math.sin(i * 12.9898) * 43758.5453;
      const sz = Math.sin(i * 78.233) * 43758.5453;
      const sy = Math.sin(i * 39.425) * 43758.5453;
      arr.push({
        x: ((sx - Math.floor(sx)) - 0.5) * 46,
        y: (sy - Math.floor(sy)) * 28,
        z: ((sz - Math.floor(sz)) - 0.5) * 46,
        speed: 19 + (i % 7) * 1.6,
      });
    }
    return arr;
  }, []);

  useEffect(() => {
    return () => {
      skyMaterial.dispose();
    };
  }, [skyMaterial]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const atm = engine.atmosphere;
    const isRain = weather === 'rain';
    const rainDim = isRain ? 0.68 : 1.0;

    // Update sky gradient uniforms
    scratchColorA.set(atm.skyTopColor);
    scratchColorB.set(atm.skyHorizonColor);
    if (isRain) {
      scratchColorA.multiplyScalar(0.72);
      scratchColorB.multiplyScalar(0.76);
    }
    skyMaterial.uniforms.uTopColor!.value.copy(scratchColorA);
    skyMaterial.uniforms.uHorizonColor!.value.copy(scratchColorB);

    // Update scene fog & background smoothly
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.set(atm.fogColor);
      if (isRain) scene.fog.color.multiplyScalar(0.75);
    }

    // Update directional sun/moon light
    if (sunLightRef.current) {
      const yPos = Math.max(8, Math.abs(atm.sunPosition.y));
      sunLightRef.current.position.set(atm.sunPosition.x, yPos, atm.sunPosition.z);
      sunLightRef.current.intensity = atm.sunIntensity * rainDim;
      sunLightRef.current.color.set(atm.sunColor);
    }

    if (hemiLightRef.current) {
      // A small fill lift keeps shaded street details legible at sunset and after dark.
      hemiLightRef.current.intensity = Math.min(1.05, atm.ambientIntensity + 0.1) * (isRain ? 0.9 : 1.0);
      hemiLightRef.current.color.set(atm.skyHorizonColor);
    }

    // Animate falling rain streaks when rain is active
    if (rainRef.current && isRain) {
      for (let i = 0; i < RAIN_COUNT; i++) {
        const drop = rainSeeds[i]!;
        drop.y -= drop.speed * dt;
        if (drop.y < 0.2) {
          drop.y = 26 + (i % 4);
        }
        scratchObj.position.set(drop.x, drop.y, drop.z);
        scratchObj.rotation.set(0.08, 0, -0.06);
        scratchObj.scale.set(1, 1, 1);
        scratchObj.updateMatrix();
        rainRef.current.setMatrixAt(i, scratchObj.matrix);
      }
      rainRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group name="city-environment">
      <fog attach="fog" args={[engine.atmosphere.fogColor, 48, 125]} />

      {/* Sky dome */}
      <mesh material={skyMaterial}>
        <sphereGeometry args={[120, 24, 16]} />
      </mesh>

      {/* Hemisphere ambient fill */}
      <hemisphereLight
        ref={hemiLightRef}
        args={['#ffd6a5', '#3d334c', engine.atmosphere.ambientIntensity]}
      />

      {/* Sun / Moon key light */}
      <directionalLight
        ref={sunLightRef}
        position={[24, 30, 18]}
        intensity={engine.atmosphere.sunIntensity}
        color={engine.atmosphere.sunColor}
        castShadow={highQuality}
        shadow-mapSize-width={highQuality ? 2048 : 1024}
        shadow-mapSize-height={highQuality ? 2048 : 1024}
        shadow-camera-near={5}
        shadow-camera-far={110}
        shadow-camera-left={-28}
        shadow-camera-right={28}
        shadow-camera-top={28}
        shadow-camera-bottom={-28}
        shadow-bias={-0.0005}
      />

      {/* Instanced rain streaks */}
      {weather === 'rain' && (
        <instancedMesh ref={rainRef} args={[undefined, undefined, RAIN_COUNT]}>
          <boxGeometry args={[0.035, 0.85, 0.035]} />
          <meshBasicMaterial color="#b7d8f7" transparent opacity={0.45} depthWrite={false} />
        </instancedMesh>
      )}
    </group>
  );
}
