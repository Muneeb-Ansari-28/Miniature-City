/**
 * Deterministic seeded PRNG using the Mulberry32 algorithm.
 * Ensures 100% reproducible simulation ticks across unit tests and browser runs.
 */
export interface SeededPRNG {
  /** Returns a float in [0, 1). */
  next: () => number;
  /** Returns a float in [min, max). */
  range: (min: number, max: number) => number;
  /** Returns an integer in [min, max] inclusive. */
  int: (min: number, max: number) => number;
  /** Picks a deterministic element from a non-empty readonly array. */
  pick: <T>(items: readonly T[]) => T;
  /** Returns true with the given probability p in [0, 1]. */
  chance: (probability: number) => boolean;
}

export function createPRNG(seed: number): SeededPRNG {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    range: (min: number, max: number) => min + next() * (max - min),
    int: (min: number, max: number) => Math.floor(min + next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T => {
      if (items.length === 0) {
        throw new Error('Cannot pick from an empty array');
      }
      return items[Math.floor(next() * items.length)]!;
    },
    chance: (probability: number) => next() < probability,
  };
}
