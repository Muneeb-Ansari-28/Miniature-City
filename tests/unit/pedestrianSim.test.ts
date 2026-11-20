import { describe, expect, it } from 'vitest';
import { generateCity } from '@/sim/cityGenerator';
import { buildSidewalkGraph, spawnPedestrians, stepPedestrians } from '@/sim/pedestrianSim';
import { createPRNG } from '@/sim/prng';
import { createTrafficLights, stepTrafficLights } from '@/sim/trafficLights';
import type { PedestrianState } from '@/sim/types';

describe('TC-U06: pedestrianSim', () => {
  it('transitions pedestrians across FSM states, enforces POI capacity, and releases seats cleanly', () => {
    const city = generateCity();
    const sidewalkGraph = buildSidewalkGraph(city);
    const lights = createTrafficLights(city.intersections);
    const lightMap = new Map(lights.map((l) => [l.intersectionId, l]));
    const poiMap = new Map(city.pois.map((p) => [p.id, p]));
    const prng = createPRNG(42);

    const pedestrians = spawnPedestrians(sidewalkGraph, city.pois, prng, 30);
    const observedStates = new Set<PedestrianState>();
    let sawSeatRelease = false;

    const prevDining = new Set(
      pedestrians.filter((p) => p.state === 'dining').map((p) => p.id),
    );

    // Simulate 1,800 ticks (30 simulated seconds at 60Hz)
    const dt = 1 / 60;
    for (let tick = 0; tick < 1800; tick++) {
      stepTrafficLights(lights, dt);
      stepPedestrians(pedestrians, sidewalkGraph, poiMap, lightMap, prng, dt);

      for (const p of pedestrians) {
        observedStates.add(p.state);
        if (prevDining.has(p.id) && p.state !== 'dining') {
          expect(p.seatIndex).toBeNull();
          expect(p.targetPoiId).toBeNull();
          sawSeatRelease = true;
          prevDining.delete(p.id);
        }
        if (p.state === 'dining') {
          prevDining.add(p.id);
        }
      }

      for (const poi of city.pois) {
        expect(poi.occupantIds.length).toBeLessThanOrEqual(poi.capacity);
      }
    }

    expect(observedStates.has('walking')).toBe(true);
    expect(observedStates.has('dining')).toBe(true);
    expect(observedStates.has('idling')).toBe(true);
    expect(sawSeatRelease).toBe(true);
  });
});
