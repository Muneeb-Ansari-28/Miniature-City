import { create } from 'zustand';
import { ALLOWED_SIM_SPEEDS, DEFAULT_TIME_OF_DAY } from '@/config/constants';
import { normalizeTimeOfDay } from '@/sim/atmosphereSim';
import type { CameraPresetId, SimSpeed, WeatherMode } from '@/sim/types';

export interface CityStoreState {
  timeOfDay: number;
  autoCycleTime: boolean;
  simSpeed: SimSpeed;
  weather: WeatherMode;
  tiltShiftEnabled: boolean;
  soundEnabled: boolean;
  showPerfOverlay: boolean;
  highQuality: boolean;
  cameraPreset: CameraPresetId;
  cameraPresetVersion: number;
  selectedPoiId: string | null;
  followedVehicleId: string | null;
  isSceneReady: boolean;

  setTimeOfDay: (hours: number) => void;
  setAutoCycleTime: (enabled: boolean) => void;
  setSimSpeed: (speed: number) => void;
  togglePlayPause: () => void;
  setWeather: (weather: WeatherMode) => void;
  toggleWeather: () => void;
  toggleTiltShift: () => void;
  toggleSound: () => void;
  togglePerfOverlay: () => void;
  toggleHighQuality: () => void;
  setCameraPreset: (preset: CameraPresetId) => void;
  selectPoi: (poiId: string | null) => void;
  followVehicle: (vehicleId: string | null) => void;
  clearSelection: () => void;
  setSceneReady: (ready: boolean) => void;
}

function clampSimSpeed(raw: number): SimSpeed {
  let closest: SimSpeed = 1;
  let minDiff = Infinity;
  for (const allowed of ALLOWED_SIM_SPEEDS) {
    const diff = Math.abs(raw - allowed);
    if (diff < minDiff) {
      minDiff = diff;
      closest = allowed;
    }
  }
  return closest;
}

export const useCityStore = create<CityStoreState>((set) => ({
  timeOfDay: DEFAULT_TIME_OF_DAY,
  autoCycleTime: false,
  simSpeed: 1,
  weather: 'clear',
  tiltShiftEnabled: true,
  soundEnabled: false,
  showPerfOverlay: true,
  highQuality: true,
  cameraPreset: 'overview',
  cameraPresetVersion: 0,
  selectedPoiId: null,
  followedVehicleId: null,
  isSceneReady: false,

  setTimeOfDay: (hours) =>
    set({
      timeOfDay: normalizeTimeOfDay(hours),
    }),

  setAutoCycleTime: (enabled) => set({ autoCycleTime: enabled }),

  setSimSpeed: (speed) =>
    set({
      simSpeed: clampSimSpeed(speed),
    }),

  togglePlayPause: () =>
    set((state) => ({
      simSpeed: state.simSpeed === 0 ? 1 : 0,
    })),

  setWeather: (weather) => set({ weather }),

  toggleWeather: () =>
    set((state) => ({
      weather: state.weather === 'clear' ? 'rain' : 'clear',
    })),

  toggleTiltShift: () =>
    set((state) => ({
      tiltShiftEnabled: !state.tiltShiftEnabled,
    })),

  toggleSound: () =>
    set((state) => ({
      soundEnabled: !state.soundEnabled,
    })),

  togglePerfOverlay: () =>
    set((state) => ({
      showPerfOverlay: !state.showPerfOverlay,
    })),

  toggleHighQuality: () =>
    set((state) => ({
      highQuality: !state.highQuality,
    })),

  setCameraPreset: (preset) =>
    set((state) => ({
      cameraPreset: preset,
      cameraPresetVersion: state.cameraPresetVersion + 1,
      followedVehicleId: null,
    })),

  selectPoi: (poiId) =>
    set({
      selectedPoiId: poiId,
      followedVehicleId: null,
    }),

  followVehicle: (vehicleId) =>
    set({
      followedVehicleId: vehicleId,
      selectedPoiId: null,
    }),

  clearSelection: () =>
    set({
      selectedPoiId: null,
      followedVehicleId: null,
    }),

  setSceneReady: (ready) => set({ isSceneReady: ready }),
}));
