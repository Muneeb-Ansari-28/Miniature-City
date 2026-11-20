import type { CameraPresetId, SimSpeed, Vec3, VehicleType } from '@/sim/types';

export const TILE_SIZE = 6.0;
export const ROAD_WIDTH = 4.4;
export const LANE_OFFSET = 1.05;
export const SIDEWALK_HEIGHT = 0.18;
export const ISLAND_BASE_DEPTH = 3.6;

export const MAX_SIM_DT = 0.05;
export const DEFAULT_SEED = 42;
export const DEFAULT_TIME_OF_DAY = 17.6; // Warm golden sunset matching reference diorama

export const LIGHT_TIMINGS = {
  NS_GREEN: 8.0,
  NS_YELLOW: 2.0,
  ALL_RED_TO_EW: 1.0,
  EW_GREEN: 8.0,
  EW_YELLOW: 2.0,
  ALL_RED_TO_NS: 1.0,
} as const;

export const TRAFFIC_CONFIG = {
  vehicleCount: 18,
  minSafeHeadway: 1.4,
  stopLineBuffer: 0.75,
  acceleration: 4.5,
  deceleration: 8.5,
  emergencyDeceleration: 14.0,
} as const;

export const VEHICLE_SPECS: Record<
  VehicleType,
  { length: number; width: number; height: number; maxSpeed: number; colors: readonly string[] }
> = {
  sedan: {
    length: 2.15,
    width: 1.08,
    height: 0.86,
    maxSpeed: 5.2,
    colors: ['#c93d2e', '#4b7bb8', '#5b8c66', '#c98a38', '#7c6aa3'],
  },
  taxi: {
    length: 2.15,
    width: 1.08,
    height: 0.88,
    maxSpeed: 5.5,
    colors: ['#f5b827', '#f2af1f'],
  },
  compact: {
    length: 1.8,
    width: 0.98,
    height: 0.82,
    maxSpeed: 5.4,
    colors: ['#e05445', '#4aa3a0', '#e6aa50', '#6f7fb8'],
  },
  van: {
    length: 2.5,
    width: 1.15,
    height: 1.2,
    maxSpeed: 4.5,
    colors: ['#eae5dc', '#d2ccc2', '#7a9bb8'],
  },
  bus: {
    length: 3.4,
    width: 1.24,
    height: 1.44,
    maxSpeed: 3.9,
    colors: ['#e6b12a', '#3f78a8'],
  },
};

export const PEDESTRIAN_CONFIG = {
  count: 84,
  minSpeed: 1.15,
  maxSpeed: 1.75,
  minDineSeconds: 10,
  maxDineSeconds: 25,
  minIdleSeconds: 2.5,
  maxIdleSeconds: 6.0,
  dineProbability: 0.42,
  idleProbability: 0.18,
} as const;

export const CAMERA_CONFIG = {
  fov: 32,
  near: 0.5,
  far: 220,
  minDistance: 12,
  maxDistance: 68,
  minPolarAngle: 0.25,
  maxPolarAngle: Math.PI / 2 - 0.14,
  panLimit: 20,
} as const;

export const CAMERA_PRESETS: Record<
  CameraPresetId,
  { label: string; position: Vec3; target: Vec3 }
> = {
  overview: {
    label: 'Overview',
    position: { x: 4.2, y: 20.0, z: 27.5 },
    target: { x: 0, y: 1.4, z: 0 },
  },
  plaza: {
    label: 'Ramen Plaza',
    position: { x: -3.5, y: 11.0, z: 16.5 },
    target: { x: -6.0, y: 1.4, z: 6.0 },
  },
  downtown: {
    label: 'Downtown Corner',
    position: { x: 16.5, y: 13.5, z: -5.0 },
    target: { x: 7.5, y: 2.2, z: -7.5 },
  },
  topdown: {
    label: 'Top-Down',
    position: { x: 0.1, y: 44.0, z: 1.0 },
    target: { x: 0, y: 0, z: 0 },
  },
};

export const ALLOWED_SIM_SPEEDS: readonly SimSpeed[] = [0, 0.5, 1, 2];

export const PERF_BUDGETS = {
  maxDrawCalls: 100,
  maxTriangles: 150_000,
  targetFps: 60,
} as const;
