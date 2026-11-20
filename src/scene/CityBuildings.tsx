import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  buildProceduralLotMesh,
  createBuildingSharedMaterials,
} from '@/scene/procedural/buildingFactory';
import type { CityLot, GeneratedCity } from '@/sim/types';
import type { WorldEngine } from '@/sim/worldEngine';
import { useCityStore } from '@/store/useCityStore';
import { loadAssetOrFallback } from '@/utils/assetLoader';

interface CityBuildingsProps {
  city: GeneratedCity;
  engine: WorldEngine;
}

interface BuildingLotItemProps {
  lot: CityLot;
  mats: ReturnType<typeof createBuildingSharedMaterials>;
  onSelectPoi: (poiId: string) => void;
}

function BuildingLotItem({ lot, mats, onSelectPoi }: BuildingLotItemProps) {
  const [loadedObject, setLoadedObject] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    let active = true;
    const assetId = lot.assetId ?? lot.id;

    void loadAssetOrFallback(assetId, () => buildProceduralLotMesh(lot, mats)).then((result) => {
      if (active) {
        setLoadedObject(result.object);
      }
    });

    return () => {
      active = false;
    };
  }, [lot, mats]);

  // Dispose cloned/procedural geometries on unmount
  useEffect(() => {
    return () => {
      if (!loadedObject) return;
      loadedObject.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
        }
      });
    };
  }, [loadedObject]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!lot.poiId) return;
    e.stopPropagation();
    onSelectPoi(lot.poiId);
  };

  if (!loadedObject) return null;

  return (
    <group
      position={[lot.worldPos.x, lot.worldPos.y, lot.worldPos.z]}
      rotation={[0, lot.rotationY, 0]}
      onClick={handleClick}
      onPointerOver={() => {
        if (lot.poiId) document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto';
      }}
    >
      <primitive object={loadedObject} />
    </group>
  );
}

/**
 * Renders all non-road city lots via the asset-agnostic loader (CC0 GLB or procedural fallback),
 * modulates shared warm window emissive intensity in `useFrame` (zero React setState),
 * and renders subtle floating 3D callout badges for the selected POI.
 */
export function CityBuildings({ city, engine }: CityBuildingsProps) {
  const selectPoi = useCityStore((s) => s.selectPoi);
  const selectedPoiId = useCityStore((s) => s.selectedPoiId);
  const sharedMats = useMemo(() => createBuildingSharedMaterials(), []);
  const lastEmissiveRef = useRef(-1);

  const buildableLots = useMemo(
    () =>
      city.lots.filter(
        (lot) => lot.type !== 'road_straight' && lot.type !== 'road_intersection',
      ),
    [city.lots],
  );

  useEffect(() => {
    return () => {
      Object.values(sharedMats).forEach((m) => m.dispose());
    };
  }, [sharedMats]);

  useFrame(() => {
    const strength = engine.atmosphere.emissiveStrength;
    if (Math.abs(strength - lastEmissiveRef.current) > 0.005) {
      lastEmissiveRef.current = strength;
      sharedMats.litWindowWarm.emissiveIntensity = 0.25 + strength * 1.95;
      sharedMats.litWindowAmber.emissiveIntensity = 0.2 + strength * 1.75;
    }
  });

  const selectedPoi = selectedPoiId ? engine.getPoiById(selectedPoiId) : undefined;

  return (
    <group name="city-buildings">
      {buildableLots.map((lot) => (
        <BuildingLotItem
          key={lot.id}
          lot={lot}
          mats={sharedMats}
          onSelectPoi={selectPoi}
        />
      ))}

      {/* Floating 3D badge above selected restaurant/POI matching concept art */}
      {selectedPoi && (
        <Html
          position={[selectedPoi.worldPos.x, 5.2, selectedPoi.worldPos.z]}
          center
          distanceFactor={24}
          zIndexRange={[10, 0]}
        >
          <div className="pointer-events-none min-w-[190px] whitespace-nowrap rounded-xl border border-white/20 bg-stone-950/88 p-2.5 text-xs text-white shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-1.5 font-bold tracking-wide uppercase text-amber-300">
              <span>{selectedPoi.category === 'restaurant' ? '🍜' : selectedPoi.category === 'cafe' ? '☕' : '📍'}</span>
              <span>{selectedPoi.name}</span>
              {selectedPoi.occupantIds.length >= Math.ceil(selectedPoi.capacity * 0.6) && (
                <span className="rounded-full bg-amber-400/25 px-1.5 py-0.2 text-[9px] font-semibold text-amber-200">
                  (Busy)
                </span>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-1.5 text-[10px] text-stone-300">
              <span className="flex items-center gap-1">
                <span>👥</span>
                <span className="font-semibold text-amber-200">{selectedPoi.occupantIds.length}/{selectedPoi.capacity} diners</span>
              </span>
              <span className="text-stone-400">⏱ {Math.round(4.5 + (selectedPoi.occupantIds.length * 0.4))}s avg</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}
