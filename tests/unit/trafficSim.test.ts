import { describe, expect, it } from 'vitest';
import { TRAFFIC_CONFIG } from '@/config/constants';
import { generateCity } from '@/sim/cityGenerator';
import { createPRNG } from '@/sim/prng';
import { buildRoadGraph } from '@/sim/roadGraph';
import { createSingleTrafficLight } from '@/sim/trafficLights';
import { stepVehicles } from '@/sim/trafficSim';
import type { TrafficLightState, VehicleAgent } from '@/sim/types';

function makeVehicle(overrides: Partial<VehicleAgent>): VehicleAgent {
  return {
    id: 'v-1',
    label: 'SEDAN #01',
    type: 'sedan',
    color: '#5a8fc4',
    edgeId: '',
    nextEdgeId: null,
    distanceOnEdge: 0,
    speed: 5,
    maxSpeed: 5.2,
    length: 2.1,
    position: { x: 0, y: 0, z: 0 },
    yaw: 0,
    status: 'driving',
    brakeLightsOn: false,
    headlightsOn: false,
    ...overrides,
  };
}

describe('TC-U04 & TC-U05: trafficSim', () => {
  it('TC-U04: trailing car brakes behind stationary lead car and preserves minSafeHeadway', () => {
    const city = generateCity();
    const graph = buildRoadGraph(city);
    const edgeId = graph.straightEdgeIds[0]!;
    const edge = graph.edges.get(edgeId)!;
    const prng = createPRNG(123);

    // Keep upcoming light red so lead car stays stationary at the end of the edge
    const light = createSingleTrafficLight(
      edge.intersectionId!,
      edge.axis === 'NS' ? 'EW_GREEN' : 'NS_GREEN',
    );
    const lightMap = new Map<string, TrafficLightState>([[light.intersectionId, light]]);

    const lead = makeVehicle({
      id: 'lead',
      edgeId,
      distanceOnEdge: edge.length - 1.9,
      speed: 0,
      maxSpeed: 0,
    });
    const trailing = makeVehicle({
      id: 'trailing',
      edgeId,
      distanceOnEdge: 1.5,
      speed: 5.2,
      maxSpeed: 5.2,
    });

    let sawBrakingOrStopped = false;
    let sawBrakeLights = false;

    for (let tick = 0; tick < 120; tick++) {
      stepVehicles([lead, trailing], graph, lightMap, prng, 1 / 60, false);

      if (trailing.status === 'braking' || trailing.status === 'stopped_traffic') {
        sawBrakingOrStopped = true;
      }
      if (trailing.brakeLightsOn) {
        sawBrakeLights = true;
      }

      const bumperGap =
        lead.distanceOnEdge - trailing.distanceOnEdge - (lead.length * 0.5 + trailing.length * 0.5);
      expect(bumperGap).toBeGreaterThanOrEqual(TRAFFIC_CONFIG.minSafeHeadway - 0.02);
    }

    expect(sawBrakingOrStopped).toBe(true);
    expect(sawBrakeLights).toBe(true);
  });

  it('TC-U05: vehicle halts prior to stop line on red light and resumes crossing on green', () => {
    const city = generateCity();
    const graph = buildRoadGraph(city);
    const edgeId = graph.straightEdgeIds[0]!;
    const edge = graph.edges.get(edgeId)!;
    const prng = createPRNG(99);

    const redPhase = edge.axis === 'NS' ? 'EW_GREEN' : 'NS_GREEN';
    const greenPhase = edge.axis === 'NS' ? 'NS_GREEN' : 'EW_GREEN';
    const light = createSingleTrafficLight(edge.intersectionId!, redPhase);
    const lightMap = new Map<string, TrafficLightState>([[light.intersectionId, light]]);

    const car = makeVehicle({
      id: 'car-red',
      edgeId,
      distanceOnEdge: edge.length * 0.35,
      speed: 4.5,
      maxSpeed: 5.0,
    });

    // Step while light is red
    for (let tick = 0; tick < 180; tick++) {
      stepVehicles([car], graph, lightMap, prng, 1 / 60, false);
    }

    expect(car.status).toBe('stopped_light');
    expect(car.edgeId).toBe(edgeId);
    expect(car.distanceOnEdge).toBeLessThan(edge.length);

    // Switch light to green and verify vehicle resumes moving across intersection
    const greenLight = createSingleTrafficLight(edge.intersectionId!, greenPhase);
    lightMap.set(greenLight.intersectionId, greenLight);

    const startDist = car.distanceOnEdge;
    for (let tick = 0; tick < 180; tick++) {
      stepVehicles([car], graph, lightMap, prng, 1 / 60, false);
    }

    expect(car.edgeId !== edgeId || car.distanceOnEdge > startDist + 1.0).toBe(true);
  });
});
