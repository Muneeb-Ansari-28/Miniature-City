import { describe, expect, it } from 'vitest';
import { DEFAULT_CITY_BLUEPRINT } from '@/config/cityLayout';
import { generateCity } from '@/sim/cityGenerator';

describe('TC-U01: cityGenerator', () => {
  it('generates a valid 4x4 city neighborhood with >=4 intersections and >=3 restaurants with valid seats', () => {
    const city = generateCity(DEFAULT_CITY_BLUEPRINT);

    expect(city.intersections.length).toBeGreaterThanOrEqual(4);

    const restaurantsAndCafes = city.pois.filter(
      (poi) => poi.category === 'restaurant' || poi.category === 'cafe',
    );
    expect(restaurantsAndCafes.length).toBeGreaterThanOrEqual(3);

    for (const poi of restaurantsAndCafes) {
      expect(poi.capacity).toBeGreaterThan(0);
      expect(poi.seatingPositions.length).toBe(poi.capacity);

      // Verify all patio seating positions are distinct and non-overlapping
      for (let i = 0; i < poi.seatingPositions.length; i++) {
        for (let j = i + 1; j < poi.seatingPositions.length; j++) {
          const a = poi.seatingPositions[i]!;
          const b = poi.seatingPositions[j]!;
          const dist = Math.hypot(a.x - b.x, a.z - b.z);
          expect(dist).toBeGreaterThan(0.3);
        }
      }
    }
  });
});
