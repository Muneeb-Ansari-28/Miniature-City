import { describe, expect, it } from 'vitest';
import { WorldEngine } from '@/sim/worldEngine';

describe('TC-U08: worldEngine determinism', () => {
  it('produces identical vehicle, pedestrian, and traffic light states for equal seed across 600 steps', () => {
    const engineA = new WorldEngine({ seed: 42 });
    const engineB = new WorldEngine({ seed: 42 });

    const dt = 1 / 60;
    for (let i = 0; i < 600; i++) {
      engineA.step(dt);
      engineB.step(dt);
    }

    expect(engineA.vehicles).toEqual(engineB.vehicles);
    expect(engineA.pedestrians).toEqual(engineB.pedestrians);
    expect(engineA.trafficLights).toEqual(engineB.trafficLights);
  });
});
