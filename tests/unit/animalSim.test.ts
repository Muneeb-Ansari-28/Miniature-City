import { describe, expect, it } from 'vitest';
import { generateCity } from '@/sim/cityGenerator';
import { buildSidewalkGraph, spawnPedestrians } from '@/sim/pedestrianSim';
import { createPRNG } from '@/sim/prng';
import {
  createAnimalRoster,
  updateAnimalSim,
} from '@/sim/animalSim';

describe('animalSim: Urban Wildlife and Pet Simulation', () => {
  const city = generateCity();
  const graph = buildSidewalkGraph(city);
  const prng = createPRNG(42);
  const pedestrians = spawnPedestrians(graph, city.pois, prng, 30);

  it('generates a diverse roster of dogs, cats, pigeons, and bird nests', () => {
    const animals = createAnimalRoster(city, pedestrians);

    const dogs = animals.filter((a) => a.type === 'dog');
    const cats = animals.filter((a) => a.type === 'cat');
    const pigeons = animals.filter((a) => a.type === 'pigeon');
    const nests = animals.filter((a) => a.type === 'bird_nest');

    expect(dogs.length).toBeGreaterThanOrEqual(3);
    expect(cats.length).toBeGreaterThanOrEqual(3);
    expect(pigeons.length).toBeGreaterThanOrEqual(8);
    expect(nests.length).toBeGreaterThanOrEqual(3);

    // Dogs should have at least 1 leashed dog attached to a pedestrian
    const leashedDogs = dogs.filter((d) => d.pedestrianOwnerId !== undefined);
    expect(leashedDogs.length).toBeGreaterThanOrEqual(1);

    // Bird nests should have egg counts
    for (const nest of nests) {
      expect(nest.nestEggs).toBeGreaterThanOrEqual(2);
    }
  });

  it('updates leashed dogs to follow their pedestrian owners smoothly', () => {
    const animals = createAnimalRoster(city, pedestrians);
    const leashedDog = animals.find((a) => a.type === 'dog' && a.pedestrianOwnerId !== undefined);
    expect(leashedDog).toBeDefined();

    const owner = pedestrians.find((p) => p.id === leashedDog!.pedestrianOwnerId);
    expect(owner).toBeDefined();

    // Run simulation update
    updateAnimalSim(animals, 0.1, pedestrians);

    // Dog should stay close to owner (< 1.2m)
    const dist = Math.hypot(
      leashedDog!.position.x - owner!.position.x,
      leashedDog!.position.z - owner!.position.z,
    );
    expect(dist).toBeLessThan(1.2);
  });

  it('keeps cats in resting or loafing states on benches, sills, and walls', () => {
    const animals = createAnimalRoster(city, pedestrians);
    const cats = animals.filter((a) => a.type === 'cat');

    for (const cat of cats) {
      expect(['sleeping', 'idle']).toContain(cat.state);
      expect(cat.position.y).toBeGreaterThan(0.2); // Elevated on bench, wall, or sill
    }
  });
});
