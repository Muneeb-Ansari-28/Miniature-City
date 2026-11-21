import { PEDESTRIAN_CONFIG, SIDEWALK_HEIGHT } from '@/config/constants';
import type { SeededPRNG } from '@/sim/prng';
import { getSignalForAxis } from '@/sim/trafficLights';
import type {
  GeneratedCity,
  PedestrianAgent,
  PointOfInterest,
  TrafficLightState,
  Vec3,
} from '@/sim/types';

export interface WalkNode {
  id: string;
  position: Vec3;
  neighbors: WalkEdge[];
  nearbyPoiId: string | null;
}

export interface WalkEdge {
  toNodeId: string;
  length: number;
  isCrosswalk: boolean;
  intersectionId: string | null;
  crossAxis: 'NS' | 'EW' | null;
}

export interface SidewalkGraph {
  nodes: Map<string, WalkNode>;
  nodeIds: string[];
}

const SHIRT_COLORS = [
  '#d95d4c',
  '#4f86c6',
  '#e6a844',
  '#5fa378',
  '#9c6eb5',
  '#e07a5f',
  '#3d5a80',
  '#f2cc8f',
  '#70a9a1',
] as const;

const PANTS_COLORS = ['#2e3545', '#424854', '#5c4b3e', '#3a4f63', '#2b2d36'] as const;
const SKIN_TONES = ['#f2c9a8', '#e5b28a', '#c98e68', '#a36b47', '#f7d7be'] as const;

/**
 * Builds a connected sidewalk & crosswalk waypoint network around every city block.
 */
export function buildSidewalkGraph(city: GeneratedCity): SidewalkGraph {
  const nodes = new Map<string, WalkNode>();
  const half = city.tileSize * 0.5;
  const inset = 0.52;

  const coordKey = (x: number, z: number) => `${Math.round(x * 10)}_${Math.round(z * 10)}`;
  const posIndex = new Map<string, string>();

  const getOrCreateNode = (x: number, z: number): WalkNode => {
    const key = coordKey(x, z);
    const existingId = posIndex.get(key);
    if (existingId) return nodes.get(existingId)!;

    const id = `wn_${nodes.size + 1}`;
    const node: WalkNode = {
      id,
      position: { x, y: SIDEWALK_HEIGHT, z },
      neighbors: [],
      nearbyPoiId: null,
    };
    nodes.set(id, node);
    posIndex.set(key, id);
    return node;
  };

  const connect = (
    a: WalkNode,
    b: WalkNode,
    isCrosswalk: boolean,
    intersectionId: string | null = null,
    crossAxis: 'NS' | 'EW' | null = null,
  ) => {
    if (a.id === b.id) return;
    if (a.neighbors.some((n) => n.toNodeId === b.id)) return;
    const length = Math.hypot(b.position.x - a.position.x, b.position.z - a.position.z);
    a.neighbors.push({ toNodeId: b.id, length, isCrosswalk, intersectionId, crossAxis });
    b.neighbors.push({ toNodeId: a.id, length, isCrosswalk, intersectionId, crossAxis });
  };

  // Create corner sidewalk loops for every buildable (non-road) lot
  const lotCorners = new Map<string, WalkNode[]>();
  for (const lot of city.lots) {
    if (lot.type === 'road_straight' || lot.type === 'road_intersection') continue;
    const { x, z } = lot.worldPos;
    const d = half - inset;

    // For the Plaza Fountain lot, nudge the SW corner slightly towards the sidewalk curb
    // so pedestrians turning the corner have generous clearance around the street burger kiosk
    const isPlaza = lot.style === 'plaza_fountain' || lot.type === 'plaza';
    const swX = isPlaza ? x - d - 0.12 : x - d;
    const swZ = isPlaza ? z + d + 0.12 : z + d;

    const nw = getOrCreateNode(x - d, z - d);
    const ne = getOrCreateNode(x + d, z - d);
    const se = getOrCreateNode(x + d, z + d);
    const sw = getOrCreateNode(swX, swZ);

    connect(nw, ne, false);
    connect(ne, se, false);

    // On Commercial Tower (row 1, col 4), do not connect SE to SW straight through
    // the wall-mounted street vending machines and utility conduit.
    // Pedestrians naturally circulate across the wide plaza promenade in front (z = -8.48).
    const isCommercialTowerNorthOfPlaza = lot.row === 1 && lot.col === 4;
    if (!isCommercialTowerNorthOfPlaza) {
      connect(se, sw, false);
    }

    connect(sw, nw, false);

    lotCorners.set(`${lot.row}_${lot.col}`, [nw, ne, se, sw]);
  }

  // Connect adjacent non-road lots within the same quadrant seamlessly
  for (const lot of city.lots) {
    const corners = lotCorners.get(`${lot.row}_${lot.col}`);
    if (!corners) continue;
    const [, ne, se, sw] = corners;

    const eastCorners = lotCorners.get(`${lot.row}_${lot.col + 1}`);
    if (eastCorners) {
      connect(ne!, eastCorners[0]!, false);
      connect(se!, eastCorners[3]!, false);
    }

    const southCorners = lotCorners.get(`${lot.row + 1}_${lot.col}`);
    if (southCorners) {
      connect(sw!, southCorners[0]!, false);
      connect(se!, southCorners[1]!, false);
    }
  }

  // Connect crosswalks across roads bordering every intersection
  const allNodes = Array.from(nodes.values());
  for (const inter of city.intersections) {
    const ix = inter.worldPos.x;
    const iz = inter.worldPos.z;
    const near = allNodes.filter(
      (n) =>
        Math.abs(n.position.x - ix) <= city.tileSize * 0.95 &&
        Math.abs(n.position.z - iz) <= city.tileSize * 0.95,
    );

    for (let i = 0; i < near.length; i++) {
      for (let j = i + 1; j < near.length; j++) {
        const a = near[i]!;
        const b = near[j]!;
        const dx = Math.abs(a.position.x - b.position.x);
        const dz = Math.abs(a.position.z - b.position.z);

        // Crosswalk spanning east-west across a N-S road
        if (dz < 0.8 && dx > city.tileSize * 0.65 && dx < city.tileSize * 1.45) {
          connect(a, b, true, inter.id, 'NS');
        }
        // Crosswalk spanning north-south across an E-W road
        if (dx < 0.8 && dz > city.tileSize * 0.65 && dz < city.tileSize * 1.45) {
          connect(a, b, true, inter.id, 'EW');
        }
      }
    }
  }

  // Attach nearest sidewalk node to each Point of Interest
  for (const poi of city.pois) {
    let bestNode: WalkNode | null = null;
    let bestDist = Infinity;
    for (const node of allNodes) {
      const dist = Math.hypot(
        node.position.x - poi.entrancePos.x,
        node.position.z - poi.entrancePos.z,
      );
      if (dist < bestDist) {
        bestDist = dist;
        bestNode = node;
      }
    }
    if (bestNode) {
      bestNode.nearbyPoiId = poi.id;
    }
  }

  return {
    nodes,
    nodeIds: Array.from(nodes.keys()),
  };
}

/**
 * Spawns stylized pedestrians distributed across the sidewalk network,
 * with a few starting directly seated at outdoor restaurant patios so the city feels alive immediately.
 */
export function spawnPedestrians(
  graph: SidewalkGraph,
  pois: PointOfInterest[],
  prng: SeededPRNG,
  count: number = PEDESTRIAN_CONFIG.count,
): PedestrianAgent[] {
  const agents: PedestrianAgent[] = [];
  if (graph.nodeIds.length === 0) return agents;

  const diningPois = pois.filter(
    (p) => (p.category === 'restaurant' || p.category === 'cafe') && p.capacity > 0,
  );

  for (let i = 0; i < count; i++) {
    const id = `ped-${i + 1}`;
    const startNodeId = prng.pick(graph.nodeIds);
    const startNode = graph.nodes.get(startNodeId)!;
    const nextEdge = startNode.neighbors.length > 0 ? prng.pick(startNode.neighbors) : null;
    const targetNodeId = nextEdge ? nextEdge.toNodeId : startNodeId;

    const agent: PedestrianAgent = {
      id,
      shirtColor: prng.pick(SHIRT_COLORS),
      pantsColor: prng.pick(PANTS_COLORS),
      skinTone: prng.pick(SKIN_TONES),
      state: 'walking',
      position: { ...startNode.position },
      yaw: prng.range(0, Math.PI * 2),
      speed: prng.range(PEDESTRIAN_CONFIG.minSpeed, PEDESTRIAN_CONFIG.maxSpeed),
      walkPhase: prng.range(0, Math.PI * 2),
      currentNodeId: startNodeId,
      targetNodeId,
      edgeProgress: prng.range(0, 0.8),
      targetPoiId: null,
      seatIndex: null,
      dwellTimer: 0,
    };

    // Pre-seat ~25% of initial citizens at restaurants/cafes for instant bustling ambiance
    if (i < Math.min(8, count / 3) && diningPois.length > 0) {
      const poi = diningPois[i % diningPois.length]!;
      const seatIndex = claimAvailableSeat(poi, id);
      if (seatIndex !== null) {
        const seatPos = poi.seatingPositions[seatIndex]!;
        agent.state = 'dining';
        agent.targetPoiId = poi.id;
        agent.seatIndex = seatIndex;
        agent.dwellTimer = prng.range(
          PEDESTRIAN_CONFIG.minDineSeconds,
          PEDESTRIAN_CONFIG.maxDineSeconds,
        );
        agent.position = { ...seatPos };
        agent.yaw = Math.atan2(poi.worldPos.x - seatPos.x, poi.worldPos.z - seatPos.z);
      }
    }

    agents.push(agent);
  }

  return agents;
}

function claimAvailableSeat(poi: PointOfInterest, pedestrianId: string): number | null {
  if (poi.occupantIds.length >= poi.capacity) return null;
  if (poi.occupantIds.includes(pedestrianId)) return null;

  // Find first unoccupied seat index via a lightweight scan
  const seatCount = Math.min(poi.capacity, poi.seatingPositions.length);
  if (seatCount <= 0) return null;

  const seatIdx = poi.occupantIds.length;
  if (seatIdx >= seatCount) return null;

  poi.occupantIds.push(pedestrianId);
  return seatIdx;
}

function releaseSeat(poi: PointOfInterest | undefined, pedestrianId: string): void {
  if (!poi) return;
  const idx = poi.occupantIds.indexOf(pedestrianId);
  if (idx !== -1) {
    poi.occupantIds.splice(idx, 1);
  }
}

/**
 * Steps all pedestrians through the 4-state FSM:
 * walking -> waiting_crosswalk -> dining -> idling.
 */
export function stepPedestrians(
  pedestrians: PedestrianAgent[],
  graph: SidewalkGraph,
  poiMap: Map<string, PointOfInterest>,
  lightMap: Map<string, TrafficLightState>,
  prng: SeededPRNG,
  dt: number,
): void {
  for (let i = 0; i < pedestrians.length; i++) {
    const p = pedestrians[i]!;

    // 1. Dining state: sit at outdoor patio until dwellTimer expires, then vacate seat cleanly
    if (p.state === 'dining') {
      p.dwellTimer -= dt;
      if (p.dwellTimer <= 0) {
        const poi = p.targetPoiId ? poiMap.get(p.targetPoiId) : undefined;
        releaseSeat(poi, p.id);
        p.targetPoiId = null;
        p.seatIndex = null;
        p.state = 'walking';
        const curNode = graph.nodes.get(p.currentNodeId);
        if (curNode && curNode.neighbors.length > 0) {
          p.targetNodeId = prng.pick(curNode.neighbors).toNodeId;
          p.edgeProgress = 0;
          p.position.x = curNode.position.x;
          p.position.y = curNode.position.y;
          p.position.z = curNode.position.z;
        }
      }
      continue;
    }

    // 2. Idling state: pause briefly at park/shop before resuming walk
    if (p.state === 'idling') {
      p.dwellTimer -= dt;
      if (p.dwellTimer <= 0) {
        p.state = 'walking';
      }
      continue;
    }

    const fromNode = graph.nodes.get(p.currentNodeId);
    const toNode = graph.nodes.get(p.targetNodeId);
    if (!fromNode || !toNode) continue;

    const edge = fromNode.neighbors.find((n) => n.toNodeId === p.targetNodeId);
    if (!edge) {
      if (fromNode.neighbors.length > 0) {
        p.targetNodeId = prng.pick(fromNode.neighbors).toNodeId;
        p.edgeProgress = 0;
      }
      continue;
    }

    // 3. Crosswalk signal check right before stepping onto the roadway
    if (edge.isCrosswalk && edge.intersectionId && edge.crossAxis && p.edgeProgress < 0.08) {
      const light = lightMap.get(edge.intersectionId);
      if (light) {
        const vehicleSignal = getSignalForAxis(light, edge.crossAxis);
        // Wait if perpendicular traffic has green or yellow
        if (vehicleSignal === 'green' || vehicleSignal === 'yellow') {
          p.state = 'waiting_crosswalk';
          p.yaw = Math.atan2(
            toNode.position.x - fromNode.position.x,
            toNode.position.z - fromNode.position.z,
          );
          // Keep waiting pedestrians safely on the sidewalk behind the curb
          p.position.x = fromNode.position.x;
          p.position.z = fromNode.position.z;
          p.edgeProgress = 0;
          continue;
        }
      }
    }

    // Resume walking if light is now safe
    p.state = 'walking';

    const edgeLen = Math.max(0.1, edge.length);
    p.edgeProgress += (p.speed * dt) / edgeLen;
    p.walkPhase = (p.walkPhase + dt * p.speed * 5.2) % (Math.PI * 2);

    if (p.edgeProgress >= 1) {
      p.currentNodeId = toNode.id;
      p.edgeProgress = 0;
      p.position.x = toNode.position.x;
      p.position.y = toNode.position.y;
      p.position.z = toNode.position.z;

      // Check if we arrived next to a restaurant/cafe/park POI
      if (toNode.nearbyPoiId) {
        const poi = poiMap.get(toNode.nearbyPoiId);
        if (
          poi &&
          (poi.category === 'restaurant' || poi.category === 'cafe') &&
          poi.occupantIds.length < poi.capacity &&
          prng.chance(PEDESTRIAN_CONFIG.dineProbability)
        ) {
          const seatIdx = claimAvailableSeat(poi, p.id);
          if (seatIdx !== null) {
            const seatPos = poi.seatingPositions[seatIdx]!;
            p.state = 'dining';
            p.targetPoiId = poi.id;
            p.seatIndex = seatIdx;
            p.dwellTimer = prng.range(
              PEDESTRIAN_CONFIG.minDineSeconds,
              PEDESTRIAN_CONFIG.maxDineSeconds,
            );
            p.position.x = seatPos.x;
            p.position.y = seatPos.y;
            p.position.z = seatPos.z;
            p.yaw = Math.atan2(poi.worldPos.x - seatPos.x, poi.worldPos.z - seatPos.z);
            continue;
          }
        }
      }

      // Occasional brief idle at sidewalk corner or park
      if (prng.chance(PEDESTRIAN_CONFIG.idleProbability)) {
        p.state = 'idling';
        p.dwellTimer = prng.range(
          PEDESTRIAN_CONFIG.minIdleSeconds,
          PEDESTRIAN_CONFIG.maxIdleSeconds,
        );
      }

      // Pick next walking neighbor (prefer not immediately backtracking)
      const candidates = toNode.neighbors.filter((n) => n.toNodeId !== fromNode.id);
      const nextEdge =
        candidates.length > 0
          ? prng.pick(candidates)
          : toNode.neighbors.length > 0
            ? prng.pick(toNode.neighbors)
            : null;
      if (nextEdge) {
        p.targetNodeId = nextEdge.toNodeId;
      }
      continue;
    }

    // Interpolate sidewalk position
    p.position.x = fromNode.position.x + (toNode.position.x - fromNode.position.x) * p.edgeProgress;
    p.position.y = fromNode.position.y;
    p.position.z = fromNode.position.z + (toNode.position.z - fromNode.position.z) * p.edgeProgress;
    p.yaw = Math.atan2(
      toNode.position.x - fromNode.position.x,
      toNode.position.z - fromNode.position.z,
    );
  }
}
