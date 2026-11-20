import {
  DEFAULT_SEED,
  DEFAULT_TIME_OF_DAY,
  MAX_SIM_DT,
  PEDESTRIAN_CONFIG,
  TRAFFIC_CONFIG,
} from '@/config/constants';
import { DEFAULT_CITY_BLUEPRINT, type CityBlueprint } from '@/config/cityLayout';
import { computeAtmosphere, normalizeTimeOfDay } from '@/sim/atmosphereSim';
import { generateCity } from '@/sim/cityGenerator';
import { buildSidewalkGraph, spawnPedestrians, stepPedestrians, type SidewalkGraph } from '@/sim/pedestrianSim';
import { createPRNG, type SeededPRNG } from '@/sim/prng';
import { buildRoadGraph, type RoadGraph } from '@/sim/roadGraph';
import { createTrafficLights, stepTrafficLights } from '@/sim/trafficLights';
import { spawnVehicles, stepVehicles } from '@/sim/trafficSim';
import type {
  AtmosphereState,
  GeneratedCity,
  PedestrianAgent,
  PointOfInterest,
  TrafficLightState,
  VehicleAgent,
} from '@/sim/types';

export interface WorldEngineOptions {
  seed?: number;
  blueprint?: CityBlueprint;
  initialTimeOfDay?: number;
  vehicleCount?: number;
  pedestrianCount?: number;
}

/**
 * Headless, 100% deterministic city simulation orchestrator.
 * Zero React or WebGL dependencies — safe to run directly inside Vitest/Node.
 */
export class WorldEngine {
  readonly seed: number;
  readonly prng: SeededPRNG;
  readonly city: GeneratedCity;
  readonly roadGraph: RoadGraph;
  readonly sidewalkGraph: SidewalkGraph;
  readonly trafficLights: TrafficLightState[];
  readonly vehicles: VehicleAgent[];
  readonly pedestrians: PedestrianAgent[];

  private readonly lightMap: Map<string, TrafficLightState>;
  private readonly poiMap: Map<string, PointOfInterest>;
  private _timeOfDay: number;
  private _atmosphere: AtmosphereState;
  private _elapsedSimTime = 0;

  constructor(options: WorldEngineOptions = {}) {
    this.seed = options.seed ?? DEFAULT_SEED;
    this.prng = createPRNG(this.seed);
    this.city = generateCity(options.blueprint ?? DEFAULT_CITY_BLUEPRINT);
    this.roadGraph = buildRoadGraph(this.city);
    this.sidewalkGraph = buildSidewalkGraph(this.city);
    this.trafficLights = createTrafficLights(this.city.intersections);

    this.lightMap = new Map(this.trafficLights.map((l) => [l.intersectionId, l]));
    this.poiMap = new Map(this.city.pois.map((p) => [p.id, p]));

    this._timeOfDay = normalizeTimeOfDay(options.initialTimeOfDay ?? DEFAULT_TIME_OF_DAY);
    this._atmosphere = computeAtmosphere(this._timeOfDay);

    this.vehicles = spawnVehicles(
      this.roadGraph,
      this.prng,
      options.vehicleCount ?? TRAFFIC_CONFIG.vehicleCount,
    );
    this.pedestrians = spawnPedestrians(
      this.sidewalkGraph,
      this.city.pois,
      this.prng,
      options.pedestrianCount ?? PEDESTRIAN_CONFIG.count,
    );
  }

  get timeOfDay(): number {
    return this._timeOfDay;
  }

  get atmosphere(): AtmosphereState {
    return this._atmosphere;
  }

  get elapsedSimTime(): number {
    return this._elapsedSimTime;
  }

  setTimeOfDay(hours: number): void {
    this._timeOfDay = normalizeTimeOfDay(hours);
    this._atmosphere = computeAtmosphere(this._timeOfDay);
  }

  getPoiById(id: string): PointOfInterest | undefined {
    return this.poiMap.get(id);
  }

  getVehicleById(id: string): VehicleAgent | undefined {
    return this.vehicles.find((v) => v.id === id);
  }

  /**
   * Advances all city subsystems by a clamped delta time `dt` (<= 0.05s).
   */
  step(rawDt: number, autoCycleTime = false): void {
    if (rawDt <= 0) return;
    const dt = Math.min(rawDt, MAX_SIM_DT);
    this._elapsedSimTime += dt;

    if (autoCycleTime) {
      // 1 simulated hour per ~12 real seconds at 1x speed
      this.setTimeOfDay(this._timeOfDay + dt * (1 / 12));
    }

    stepTrafficLights(this.trafficLights, dt);
    stepVehicles(
      this.vehicles,
      this.roadGraph,
      this.lightMap,
      this.prng,
      dt,
      this._atmosphere.isNight,
    );
    stepPedestrians(
      this.pedestrians,
      this.sidewalkGraph,
      this.poiMap,
      this.lightMap,
      this.prng,
      dt,
    );
  }
}

export const defaultWorldEngine = new WorldEngine();
