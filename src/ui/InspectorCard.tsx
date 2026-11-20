import { useEffect, useState } from 'react';
import { Car, Crosshair, MapPin, Users, X } from 'lucide-react';
import type { VehicleStatus } from '@/sim/types';
import { defaultWorldEngine, type WorldEngine } from '@/sim/worldEngine';
import { useCityStore } from '@/store/useCityStore';

interface InspectorCardProps {
  engine?: WorldEngine;
}

function formatVehicleStatus(status: VehicleStatus): string {
  switch (status) {
    case 'driving':
      return 'Driving';
    case 'braking':
      return 'Braking';
    case 'stopped_light':
      return 'Waiting at Red Light';
    case 'stopped_traffic':
      return 'Yielding to Traffic';
  }
}

/**
 * Floating contextual inspector for selected restaurants/POIs or active Ride-Along vehicles.
 */
export function InspectorCard({ engine = defaultWorldEngine }: InspectorCardProps) {
  const selectedPoiId = useCityStore((s) => s.selectedPoiId);
  const followedVehicleId = useCityStore((s) => s.followedVehicleId);
  const clearSelection = useCityStore((s) => s.clearSelection);
  const selectPoi = useCityStore((s) => s.selectPoi);

  // Throttled 4Hz UI refresh for live occupancy & vehicle speed (never per frame)
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!selectedPoiId && !followedVehicleId) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, [selectedPoiId, followedVehicleId]);

  if (selectedPoiId) {
    const poi = engine.getPoiById(selectedPoiId);
    if (!poi) return null;
    const occupied = poi.occupantIds.length;
    const busy = occupied >= Math.ceil(poi.capacity * 0.6);

    return (
      <div
        data-testid="inspector-card"
        className="pointer-events-auto w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-amber-300/25 bg-stone-950/80 p-4 text-stone-100 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-amber-300 uppercase">
              <MapPin className="h-3 w-3" />
              {poi.category}
              {busy && (
                <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[9px] text-amber-200">
                  Busy
                </span>
              )}
            </div>
            <h2 className="mt-0.5 text-sm font-bold text-white">{poi.name}</h2>
          </div>
          <button
            type="button"
            aria-label="Close inspector"
            onClick={clearSelection}
            className="rounded-lg p-1 text-stone-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-xs leading-relaxed text-stone-300">{poi.description}</p>

        <div className="mt-3 flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-xs">
          <span className="flex items-center gap-1.5 text-stone-300">
            <Users className="h-3.5 w-3.5 text-amber-300" />
            Patio Occupancy
          </span>
          <span data-testid="poi-occupancy" className="font-semibold text-amber-200 tabular-nums">
            {occupied} / {poi.capacity}
          </span>
        </div>

        <button
          type="button"
          onClick={() => selectPoi(poi.id)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-amber-400/20 px-3 py-1.5 text-xs font-semibold text-amber-200 ring-1 ring-amber-300/40 transition hover:bg-amber-400/30"
        >
          <Crosshair className="h-3.5 w-3.5" />
          Focus Camera
        </button>
      </div>
    );
  }

  if (followedVehicleId) {
    const vehicle = engine.getVehicleById(followedVehicleId);
    if (!vehicle) return null;
    const speedKmh = Math.round(vehicle.speed * 7.2);

    return (
      <div
        data-testid="follow-cam-card"
        className="pointer-events-auto w-72 max-w-[calc(100vw-2rem)] rounded-2xl border border-amber-400/35 bg-stone-950/85 p-4 text-stone-100 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-amber-300 uppercase">
              <Car className="h-3.5 w-3.5" />
              Ride-Along Follow Mode
            </div>
            <h2 className="mt-0.5 text-sm font-bold text-white">{vehicle.label}</h2>
          </div>
          <button
            type="button"
            aria-label="Exit follow mode"
            onClick={clearSelection}
            className="rounded-lg p-1 text-stone-400 transition hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl bg-white/5 px-2.5 py-2">
            <div className="text-[10px] text-stone-400">Speed</div>
            <div className="mt-0.5 font-mono font-semibold text-amber-200 tabular-nums">
              {speedKmh} km/h
            </div>
          </div>
          <div className="rounded-xl bg-white/5 px-2.5 py-2">
            <div className="text-[10px] text-stone-400">Status</div>
            <div className="mt-0.5 truncate font-medium text-stone-100">
              {formatVehicleStatus(vehicle.status)}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={clearSelection}
          className="mt-3 w-full rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-stone-100 transition hover:bg-white/20"
        >
          Exit Follow Mode (Esc)
        </button>
      </div>
    );
  }

  return null;
}
