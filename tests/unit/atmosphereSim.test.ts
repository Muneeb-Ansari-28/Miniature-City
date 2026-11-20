import { describe, expect, it } from 'vitest';
import { computeAtmosphere } from '@/sim/atmosphereSim';

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i;

describe('TC-U07: atmosphereSim', () => {
  it('evaluates solar arc, night flags, emissive strengths, and valid hex colors across 24h', () => {
    const sampleHours = [0.0, 6.0, 12.0, 18.0, 22.0];
    const results = sampleHours.map((h) => computeAtmosphere(h));

    for (const atm of results) {
      expect(atm.skyTopColor).toMatch(HEX_COLOR_RE);
      expect(atm.skyHorizonColor).toMatch(HEX_COLOR_RE);
      expect(atm.fogColor).toMatch(HEX_COLOR_RE);
      expect(atm.sunColor).toMatch(HEX_COLOR_RE);
    }

    const midnight = results[0]!;
    const noon = results[2]!;
    const lateNight = results[4]!;

    expect(noon.sunPosition.y).toBeGreaterThan(0);
    expect(noon.isNight).toBe(false);
    expect(noon.emissiveStrength).toBe(0);

    expect(midnight.isNight).toBe(true);
    expect(midnight.emissiveStrength).toBeGreaterThanOrEqual(0.8);

    expect(lateNight.isNight).toBe(true);
    expect(lateNight.emissiveStrength).toBeGreaterThanOrEqual(0.8);
  });
});
