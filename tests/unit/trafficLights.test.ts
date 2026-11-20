import { describe, expect, it } from 'vitest';
import { createSingleTrafficLight, stepTrafficLight } from '@/sim/trafficLights';
import type { IntersectionPhase } from '@/sim/types';

describe('TC-U03: trafficLights', () => {
  it('steps through exact 6-phase sequence over 2 full cycles (44s) and never turns NS & EW green simultaneously', () => {
    const light = createSingleTrafficLight('inter-1', 'NS_GREEN');
    const observedPhases: IntersectionPhase[] = [light.phase];

    const dt = 0.1;
    const totalTicks = 445; // ~44.5 seconds to step 2 full 22s cycles and transition into cycle 3

    for (let i = 0; i < totalTicks; i++) {
      stepTrafficLight(light, dt);

      // Strict safety invariant on every single tick
      expect(!(light.nsLight === 'green' && light.ewLight === 'green')).toBe(true);

      if (observedPhases[observedPhases.length - 1] !== light.phase) {
        observedPhases.push(light.phase);
      }
    }

    const expectedSequence: IntersectionPhase[] = [
      'NS_GREEN',
      'NS_YELLOW',
      'ALL_RED_TO_EW',
      'EW_GREEN',
      'EW_YELLOW',
      'ALL_RED_TO_NS',
      'NS_GREEN',
      'NS_YELLOW',
      'ALL_RED_TO_EW',
      'EW_GREEN',
      'EW_YELLOW',
      'ALL_RED_TO_NS',
      'NS_GREEN',
    ];

    expect(observedPhases.slice(0, expectedSequence.length)).toEqual(expectedSequence);
  });
});
