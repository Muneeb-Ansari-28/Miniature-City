import { SIDEWALK_HEIGHT } from '@/config/constants';
import type { GeneratedCity, PedestrianAgent, Vec3 } from '@/sim/types';

export type AnimalType = 'dog' | 'cat' | 'pigeon' | 'bird_nest';

export interface AnimalAgent {
  id: string;
  type: AnimalType;
  position: Vec3;
  rotationY: number;
  scale: number;
  color: string;
  state: 'idle' | 'walking' | 'sleeping' | 'pecking';
  pedestrianOwnerId?: string;
  tetherOffset?: { dx: number; dz: number };
  nestEggs?: number;
  peckTimer?: number;
  hopPhase?: number;
}

/**
 * Creates the initial living roster of urban pets, strays, plaza pigeons, and tree nests.
 */
export function createAnimalRoster(
  _city: GeneratedCity,
  pedestrians: PedestrianAgent[],
): AnimalAgent[] {
  const animals: AnimalAgent[] = [];
  let idCounter = 1;

  // 1. Dogs (4 total: 2 leashed walking dogs + 2 resting/sitting companion dogs)
  const walkingPeds = pedestrians.filter((p) => p.state === 'walking');
  const dog1Owner = walkingPeds[0] ?? pedestrians[0];
  const dog2Owner = walkingPeds[3] ?? pedestrians[1];

  if (dog1Owner) {
    animals.push({
      id: `animal_${idCounter++}`,
      type: 'dog',
      position: {
        x: dog1Owner.position.x - 0.45,
        y: SIDEWALK_HEIGHT,
        z: dog1Owner.position.z - 0.25,
      },
      rotationY: dog1Owner.yaw,
      scale: 0.85,
      color: '#d48c46', // Shiba Inu orange/tan
      state: 'walking',
      pedestrianOwnerId: dog1Owner.id,
      tetherOffset: { dx: -0.4, dz: -0.3 },
    });
  }

  if (dog2Owner) {
    animals.push({
      id: `animal_${idCounter++}`,
      type: 'dog',
      position: {
        x: dog2Owner.position.x + 0.35,
        y: SIDEWALK_HEIGHT,
        z: dog2Owner.position.z - 0.4,
      },
      rotationY: dog2Owner.yaw,
      scale: 0.95,
      color: '#e3a857', // Golden Retriever warm gold
      state: 'walking',
      pedestrianOwnerId: dog2Owner.id,
      tetherOffset: { dx: 0.35, dz: -0.35 },
    });
  }

  // Resting dog 3: Sitting companion by Sunset Cafe & Grill patio
  animals.push({
    id: `animal_${idCounter++}`,
    type: 'dog',
    position: { x: 7.2, y: SIDEWALK_HEIGHT, z: -1.2 },
    rotationY: -Math.PI * 0.4,
    scale: 0.9,
    color: '#3b2f2f', // Dark chocolate / black lab
    state: 'idle',
  });

  // Resting dog 4: Friendly dog sitting on park lawn in Botanical Garden
  animals.push({
    id: `animal_${idCounter++}`,
    type: 'dog',
    position: { x: 6.8, y: SIDEWALK_HEIGHT + 0.16, z: 6.8 },
    rotationY: Math.PI * 0.75,
    scale: 0.88,
    color: '#d48c46', // Shiba Inu
    state: 'idle',
  });

  // 2. Cats (4 total: peaceful loafing & basking in sunlight)
  // Cat 1: Curled up asleep on a park bench in West Playground
  animals.push({
    id: `animal_${idCounter++}`,
    type: 'cat',
    position: { x: -1.1, y: SIDEWALK_HEIGHT + 0.36, z: 6.75 },
    rotationY: 0.2,
    scale: 0.75,
    color: '#e07a5f', // Ginger Tabby
    state: 'sleeping',
  });

  // Cat 2: Sunbathing on the low stone retaining border of Harbor Plaza fountain
  animals.push({
    id: `animal_${idCounter++}`,
    type: 'cat',
    position: { x: 5.4, y: SIDEWALK_HEIGHT + 0.38, z: -3.6 },
    rotationY: -Math.PI * 0.35,
    scale: 0.72,
    color: '#2b2d36', // Black & white tuxedo
    state: 'idle',
  });

  // Cat 3: Sitting on the cafe windowsill stoop of Bean & Steam Cafe
  animals.push({
    id: `animal_${idCounter++}`,
    type: 'cat',
    position: { x: -6.2, y: SIDEWALK_HEIGHT + 0.28, z: -7.2 },
    rotationY: Math.PI * 0.5,
    scale: 0.7,
    color: '#f4a261', // Calico tricolor
    state: 'idle',
  });

  // Cat 4: Lounging on the stone border wall in East Botanical Garden
  animals.push({
    id: `animal_${idCounter++}`,
    type: 'cat',
    position: { x: 8.5, y: SIDEWALK_HEIGHT + 0.3, z: 4.8 },
    rotationY: Math.PI,
    scale: 0.74,
    color: '#e2d4c0', // Siamese cream
    state: 'sleeping',
  });

  // 3. Ground Pigeons (10 total: 5 in Harbor Plaza, 5 in Maple Pocket Park)
  const pigeonColors = ['#708090', '#556270', '#88929a', '#606c76', '#4a5568'];
  const plazaPigeonOffsets = [
    [-0.6, -0.8],
    [0.8, -0.5],
    [-0.4, 0.9],
    [1.1, 0.7],
    [0.1, -1.2],
  ];
  for (let i = 0; i < plazaPigeonOffsets.length; i++) {
    const [dx, dz] = plazaPigeonOffsets[i]!;
    animals.push({
      id: `animal_${idCounter++}`,
      type: 'pigeon',
      position: { x: 6.0 + dx!, y: SIDEWALK_HEIGHT + 0.12, z: -6.0 + dz! },
      rotationY: Math.random() * Math.PI * 2,
      scale: 0.55,
      color: pigeonColors[i % pigeonColors.length]!,
      state: 'pecking',
      peckTimer: Math.random() * 2,
      hopPhase: Math.random() * Math.PI * 2,
    });
  }

  const parkPigeonOffsets = [
    [-0.8, 0.3],
    [0.5, 0.8],
    [0.2, -0.6],
    [-0.4, -0.7],
    [1.2, 0.1],
  ];
  for (let i = 0; i < parkPigeonOffsets.length; i++) {
    const [dx, dz] = parkPigeonOffsets[i]!;
    animals.push({
      id: `animal_${idCounter++}`,
      type: 'pigeon',
      position: { x: 3.0 + dx!, y: SIDEWALK_HEIGHT + 0.22, z: 6.0 + dz! },
      rotationY: Math.random() * Math.PI * 2,
      scale: 0.52,
      color: pigeonColors[(i + 2) % pigeonColors.length]!,
      state: 'pecking',
      peckTimer: Math.random() * 2,
      hopPhase: Math.random() * Math.PI * 2,
    });
  }

  // 4. Bird Nests (4 total: snug in tree branch boughs and building eaves)
  animals.push({
    id: `animal_${idCounter++}`,
    type: 'bird_nest',
    position: { x: 0 - 1.9, y: SIDEWALK_HEIGHT + 1.48, z: 6.0 - 1.85 }, // In West Oak Tree
    rotationY: 0.4,
    scale: 0.5,
    color: '#8b6f47',
    state: 'idle',
    nestEggs: 3,
  });

  animals.push({
    id: `animal_${idCounter++}`,
    type: 'bird_nest',
    position: { x: 6.0 - 1.85, y: SIDEWALK_HEIGHT + 1.55, z: 6.0 - 1.75 }, // In East Sakura Tree
    rotationY: -0.6,
    scale: 0.5,
    color: '#7a5a3a',
    state: 'idle',
    nestEggs: 3,
  });

  animals.push({
    id: `animal_${idCounter++}`,
    type: 'bird_nest',
    position: { x: -6.0 + 1.8, y: 3.55, z: 6.0 + 1.8 }, // Eaves of Sakura Ramen Corner
    rotationY: 1.2,
    scale: 0.48,
    color: '#9c7b52',
    state: 'idle',
    nestEggs: 2,
  });

  animals.push({
    id: `animal_${idCounter++}`,
    type: 'bird_nest',
    position: { x: 5.6, y: 4.88, z: -5.8 }, // Utility pole crossarm near Plaza
    rotationY: 0,
    scale: 0.46,
    color: '#826544',
    state: 'idle',
    nestEggs: 3,
  });

  return animals;
}

/**
 * Updates dynamic animal positions and states (leashed dogs follow owners, pigeons peck & hop).
 */
export function updateAnimalSim(
  animals: AnimalAgent[],
  dt: number,
  pedestrians: PedestrianAgent[],
): void {
  const pedMap = new Map(pedestrians.map((p) => [p.id, p]));

  for (const animal of animals) {
    // 1. Leashed dogs follow their assigned pedestrian
    if (animal.type === 'dog' && animal.pedestrianOwnerId) {
      const owner = pedMap.get(animal.pedestrianOwnerId);
      if (owner) {
        // Calculate tether goal position behind and slightly to the side of owner
        const backDist = 0.55;
        const sideDist = animal.tetherOffset?.dx ?? -0.25;
        const cosH = Math.cos(owner.yaw);
        const sinH = Math.sin(owner.yaw);

        const goalX = owner.position.x - sinH * backDist + cosH * sideDist;
        const goalZ = owner.position.z - cosH * backDist - sinH * sideDist;

        // Smoothly lerp towards goal
        const lerpSpeed = 7.5 * dt;
        animal.position.x += (goalX - animal.position.x) * Math.min(1, lerpSpeed);
        animal.position.z += (goalZ - animal.position.z) * Math.min(1, lerpSpeed);
        animal.position.y = owner.position.y;
        animal.rotationY = owner.yaw;
        animal.state = owner.state === 'walking' ? 'walking' : 'idle';
      }
    }

    // 2. Pigeons peck and hop
    if (animal.type === 'pigeon') {
      animal.peckTimer = (animal.peckTimer ?? 0) + dt;
      if (animal.peckTimer > 2.5) {
        animal.peckTimer = 0;
        // Occasionally turn slightly to peck elsewhere
        animal.rotationY += (Math.random() - 0.5) * 1.2;
      }
    }
  }
}
