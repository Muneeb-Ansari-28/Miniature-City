import { LIGHT_TIMINGS } from '@/config/constants';
import type { CityLot, IntersectionPhase, LightColor, TrafficLightState } from '@/sim/types';

const PHASE_ORDER: readonly IntersectionPhase[] = [
  'NS_GREEN',
  'NS_YELLOW',
  'ALL_RED_TO_EW',
  'EW_GREEN',
  'EW_YELLOW',
  'ALL_RED_TO_NS',
];

function lightsForPhase(phase: IntersectionPhase): { nsLight: LightColor; ewLight: LightColor } {
  switch (phase) {
    case 'NS_GREEN':
      return { nsLight: 'green', ewLight: 'red' };
    case 'NS_YELLOW':
      return { nsLight: 'yellow', ewLight: 'red' };
    case 'ALL_RED_TO_EW':
      return { nsLight: 'red', ewLight: 'red' };
    case 'EW_GREEN':
      return { nsLight: 'red', ewLight: 'green' };
    case 'EW_YELLOW':
      return { nsLight: 'red', ewLight: 'yellow' };
    case 'ALL_RED_TO_NS':
      return { nsLight: 'red', ewLight: 'red' };
  }
}

export function createTrafficLights(intersections: CityLot[]): TrafficLightState[] {
  return intersections.map((inter, index) => {
    // Stagger initial phases slightly across intersections for natural traffic waves
    const startOnEW = index % 2 === 1;
    const phase: IntersectionPhase = startOnEW ? 'EW_GREEN' : 'NS_GREEN';
    const { nsLight, ewLight } = lightsForPhase(phase);
    return {
      intersectionId: inter.id,
      worldPos: { ...inter.worldPos },
      phase,
      timer: 0,
      nsLight,
      ewLight,
    };
  });
}

export function createSingleTrafficLight(
  intersectionId: string,
  initialPhase: IntersectionPhase = 'NS_GREEN',
): TrafficLightState {
  const { nsLight, ewLight } = lightsForPhase(initialPhase);
  return {
    intersectionId,
    worldPos: { x: 0, y: 0, z: 0 },
    phase: initialPhase,
    timer: 0,
    nsLight,
    ewLight,
  };
}

/**
 * Advances a single traffic light controller by `dt` seconds.
 * Invariant: nsLight and ewLight are NEVER simultaneously green.
 */
export function stepTrafficLight(light: TrafficLightState, dt: number): void {
  light.timer += dt;
  let duration = LIGHT_TIMINGS[light.phase];

  while (light.timer >= duration) {
    light.timer -= duration;
    const currentIdx = PHASE_ORDER.indexOf(light.phase);
    const nextPhase = PHASE_ORDER[(currentIdx + 1) % PHASE_ORDER.length]!;
    light.phase = nextPhase;
    const colors = lightsForPhase(nextPhase);
    light.nsLight = colors.nsLight;
    light.ewLight = colors.ewLight;
    duration = LIGHT_TIMINGS[light.phase];
  }
}

export function stepTrafficLights(lights: TrafficLightState[], dt: number): void {
  for (let i = 0; i < lights.length; i++) {
    stepTrafficLight(lights[i]!, dt);
  }
}

export function getSignalForAxis(light: TrafficLightState, axis: 'NS' | 'EW'): LightColor {
  return axis === 'NS' ? light.nsLight : light.ewLight;
}
