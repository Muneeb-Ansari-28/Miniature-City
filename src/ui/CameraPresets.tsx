import { useState } from 'react';
import { Camera, Car, MapPin, Menu, X } from 'lucide-react';
import { CAMERA_PRESETS } from '@/config/constants';
import type { CameraPresetId } from '@/sim/types';
import { defaultWorldEngine, type WorldEngine } from '@/sim/worldEngine';
import { useCityStore } from '@/store/useCityStore';

interface CameraPresetsProps {
  engine?: WorldEngine;
}

const PRESET_ORDER: CameraPresetId[] = ['overview', 'plaza', 'downtown', 'topdown'];

/**
 * Top-right collapsible menu & camera/POI quick-jump drawer.
 */
export function CameraPresets({ engine = defaultWorldEngine }: CameraPresetsProps) {
  const [open, setOpen] = useState(false);
  const cameraPreset = useCityStore((s) => s.cameraPreset);
  const setCameraPreset = useCityStore((s) => s.setCameraPreset);
  const selectPoi = useCityStore((s) => s.selectPoi);
  const followVehicle = useCityStore((s) => s.followVehicle);

  const firstVehicle = engine.vehicles[0];

  return (
    <div className="pointer-events-auto relative flex flex-col items-end">
      <button
        type="button"
        aria-label="Toggle city navigation menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-stone-950/65 text-stone-100 shadow-lg backdrop-blur-md transition hover:border-amber-300/40 hover:bg-stone-900/80"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <div className="mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-2xl border border-white/15 bg-stone-950/80 p-3 text-xs text-stone-100 shadow-2xl backdrop-blur-lg">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-amber-300 uppercase">
            <Camera className="h-3.5 w-3.5" />
            Camera Angles
          </div>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {PRESET_ORDER.map((id, idx) => {
              const active = cameraPreset === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCameraPreset(id)}
                  className={`rounded-lg px-2.5 py-1.5 text-left font-medium transition ${
                    active
                      ? 'bg-amber-400/25 text-amber-200 ring-1 ring-amber-300/50'
                      : 'bg-white/5 text-stone-200 hover:bg-white/10'
                  }`}
                >
                  <span className="mr-1 text-[10px] text-stone-400">{idx + 1}</span>
                  {CAMERA_PRESETS[id].label}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-amber-300 uppercase">
            <MapPin className="h-3.5 w-3.5" />
            Explore Spots
          </div>
          <div className="mt-1.5 flex flex-col gap-1">
            {engine.city.pois.map((poi) => (
              <button
                key={poi.id}
                type="button"
                data-testid={`poi-jump-${poi.id}`}
                onClick={() => {
                  selectPoi(poi.id);
                  setOpen(false);
                }}
                className="flex items-center justify-between rounded-lg bg-white/5 px-2.5 py-1.5 text-left text-stone-200 transition hover:bg-white/12"
              >
                <span className="truncate">{poi.name}</span>
                <span className="ml-2 text-[10px] text-amber-300/80 capitalize">{poi.category}</span>
              </button>
            ))}
          </div>

          {firstVehicle && (
            <button
              type="button"
              data-testid="ride-along-btn"
              onClick={() => {
                followVehicle(firstVehicle.id);
                setOpen(false);
              }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-400/20 px-3 py-2 font-semibold text-amber-200 ring-1 ring-amber-300/40 transition hover:bg-amber-400/30"
            >
              <Car className="h-3.5 w-3.5" />
              Ride-Along ({firstVehicle.label})
            </button>
          )}
        </div>
      )}
    </div>
  );
}
