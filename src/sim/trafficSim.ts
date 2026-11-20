import { TRAFFIC_CONFIG, VEHICLE_SPECS } from '@/config/constants';
import type { SeededPRNG } from '@/sim/prng';
import { sampleRoadEdge, type RoadEdge, type RoadGraph } from '@/sim/roadGraph';
import { getSignalForAxis } from '@/sim/trafficLights';
import type { TrafficLightState, VehicleAgent, VehicleType } from '@/sim/types';

const VEHICLE_TYPE_POOL: readonly VehicleType[] = [
  'taxi',
  'sedan',
  'compact',
  'taxi',
  'van',
  'sedan',
  'bus',
  'compact',
  'taxi',
  'sedan',
  'van',
  'compact',
  'bus',
  'sedan',
  'taxi',
  'sedan',
];

function chooseNextEdgeId(graph: RoadGraph, currentEdge: RoadEdge, prng: SeededPRNG): string | null {
  const endNode = graph.nodes.get(currentEdge.toNodeId);
  if (!endNode || endNode.outEdges.length === 0) return null;
  if (endNode.outEdges.length === 1) return endNode.outEdges[0]!;
  return prng.pick(endNode.outEdges);
}

/**
 * Spawns varied vehicles across straight road segments without overlap.
 */
export function spawnVehicles(
  graph: RoadGraph,
  prng: SeededPRNG,
  count: number = TRAFFIC_CONFIG.vehicleCount,
): VehicleAgent[] {
  const vehicles: VehicleAgent[] = [];
  const candidates = graph.straightEdgeIds;
  if (candidates.length === 0) return vehicles;

  let taxiIdx = 1;
  let busIdx = 1;
  let vanIdx = 1;
  let carIdx = 1;

  for (let i = 0; i < count; i++) {
    const edgeId = candidates[i % candidates.length]!;
    const edge = graph.edges.get(edgeId);
    if (!edge) continue;

    const type = VEHICLE_TYPE_POOL[i % VEHICLE_TYPE_POOL.length]!;
    const spec = VEHICLE_SPECS[type];
    const color = prng.pick(spec.colors);

    // Space multiple vehicles on the same edge cleanly
    const slotOnEdge = Math.floor(i / candidates.length);
    const baseDist = Math.max(
      spec.length * 0.6,
      edge.length * 0.22 + slotOnEdge * (spec.length + TRAFFIC_CONFIG.minSafeHeadway + 1.2),
    );
    const distanceOnEdge = Math.min(edge.length - spec.length * 0.6, baseDist);
    const sample = sampleRoadEdge(edge, distanceOnEdge / Math.max(0.001, edge.length));

    let label: string;
    if (type === 'taxi') {
      label = `TAXI #${String(taxiIdx++).padStart(2, '0')}`;
    } else if (type === 'bus') {
      label = `BUS #${String(busIdx++).padStart(2, '0')}`;
    } else if (type === 'van') {
      label = `VAN #${String(vanIdx++).padStart(2, '0')}`;
    } else {
      label = `${type.toUpperCase()} #${String(carIdx++).padStart(2, '0')}`;
    }

    vehicles.push({
      id: `vehicle-${i + 1}`,
      label,
      type,
      color,
      edgeId,
      nextEdgeId: chooseNextEdgeId(graph, edge, prng),
      distanceOnEdge,
      speed: spec.maxSpeed * 0.65,
      maxSpeed: spec.maxSpeed,
      length: spec.length,
      position: { ...sample.position },
      yaw: sample.yaw,
      status: 'driving',
      brakeLightsOn: false,
      headlightsOn: false,
    });
  }

  return vehicles;
}

/**
 * Finds bumper-to-bumper gap to the nearest lead vehicle on the same edge
 * or immediately on the vehicle's planned next edge.
 */
function findLeadVehicleGap(
  vehicle: VehicleAgent,
  vehicles: VehicleAgent[],
  currentEdge: RoadEdge,
): { gap: number; leadSpeed: number } | null {
  let minGap = Infinity;
  let leadSpeed = vehicle.maxSpeed;

  for (let i = 0; i < vehicles.length; i++) {
    const other = vehicles[i]!;
    if (other.id === vehicle.id) continue;

    if (other.edgeId === vehicle.edgeId && other.distanceOnEdge > vehicle.distanceOnEdge) {
      const centerDist = other.distanceOnEdge - vehicle.distanceOnEdge;
      const bumperGap = centerDist - (vehicle.length * 0.5 + other.length * 0.5);
      if (bumperGap < minGap) {
        minGap = bumperGap;
        leadSpeed = other.speed;
      }
    } else if (vehicle.nextEdgeId && other.edgeId === vehicle.nextEdgeId) {
      const distToEdgeEnd = currentEdge.length - vehicle.distanceOnEdge;
      const centerDist = distToEdgeEnd + other.distanceOnEdge;
      const bumperGap = centerDist - (vehicle.length * 0.5 + other.length * 0.5);
      if (bumperGap < minGap) {
        minGap = bumperGap;
        leadSpeed = other.speed;
      }
    }
  }

  return minGap < Infinity ? { gap: minGap, leadSpeed } : null;
}

/**
 * Steps all vehicles forward by `dt` seconds, enforcing red-light stop lines,
 * smooth braking, and strict bumper-to-bumper safe headway.
 */
export function stepVehicles(
  vehicles: VehicleAgent[],
  graph: RoadGraph,
  lightMap: Map<string, TrafficLightState>,
  prng: SeededPRNG,
  dt: number,
  isNight: boolean,
): void {
  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i]!;
    const edge = graph.edges.get(v.edgeId);
    if (!edge) continue;

    if (!v.nextEdgeId) {
      v.nextEdgeId = chooseNextEdgeId(graph, edge, prng);
    }

    let targetSpeed = edge.isIntersectionTurn ? v.maxSpeed * 0.72 : v.maxSpeed;
    let stopReason: 'none' | 'light' | 'traffic' = 'none';

    // 1. Check upcoming intersection traffic signal when on a straight approach edge
    const distToStopLine = edge.length - v.distanceOnEdge - v.length * 0.5 - TRAFFIC_CONFIG.stopLineBuffer;
    if (!edge.isIntersectionTurn && edge.intersectionId) {
      const light = lightMap.get(edge.intersectionId);
      if (light) {
        const signal = getSignalForAxis(light, edge.axis);
        if (signal === 'red' || (signal === 'yellow' && distToStopLine > 0.6)) {
          if (distToStopLine <= 0.12) {
            targetSpeed = 0;
            stopReason = 'light';
          } else if (distToStopLine < 5.5) {
            const safeApproach = Math.sqrt(Math.max(0, 2 * TRAFFIC_CONFIG.deceleration * distToStopLine));
            if (safeApproach < targetSpeed) {
              targetSpeed = Math.min(targetSpeed, safeApproach);
              stopReason = 'light';
            }
          }
        }
      }
    }

    // 2. Check lead vehicle headway
    const lead = findLeadVehicleGap(v, vehicles, edge);
    if (lead) {
      const safeHeadway = TRAFFIC_CONFIG.minSafeHeadway;
      const desiredGap = safeHeadway + Math.max(0, v.speed * 0.35);
      if (lead.gap <= safeHeadway + 0.08) {
        targetSpeed = 0;
        stopReason = 'traffic';
      } else if (lead.gap < desiredGap + 3.2) {
        const available = Math.max(0, lead.gap - safeHeadway);
        const safeSpeed = Math.min(
          lead.leadSpeed + available * 1.1,
          Math.sqrt(2 * TRAFFIC_CONFIG.deceleration * available),
        );
        if (safeSpeed < targetSpeed) {
          targetSpeed = Math.max(0, safeSpeed);
          stopReason = 'traffic';
        }
      }
    }

    // 3. Integrate speed smoothly
    const prevSpeed = v.speed;
    if (targetSpeed < v.speed) {
      const decel =
        stopReason === 'traffic' && lead && lead.gap <= TRAFFIC_CONFIG.minSafeHeadway + 0.35
          ? TRAFFIC_CONFIG.emergencyDeceleration
          : TRAFFIC_CONFIG.deceleration;
      v.speed = Math.max(targetSpeed, v.speed - decel * dt);
    } else {
      v.speed = Math.min(targetSpeed, v.speed + TRAFFIC_CONFIG.acceleration * dt);
    }

    // 4. Advance position along edge while clamping strictly against stop line / lead bumper
    let stepDist = v.speed * dt;
    if (stopReason === 'light' && distToStopLine >= 0) {
      stepDist = Math.min(stepDist, distToStopLine);
      if (distToStopLine <= 0.05) {
        v.speed = 0;
        stepDist = 0;
      }
    }
    if (lead) {
      const maxAdvance = Math.max(0, lead.gap - TRAFFIC_CONFIG.minSafeHeadway);
      if (stepDist > maxAdvance) {
        stepDist = maxAdvance;
        v.speed = Math.min(v.speed, lead.leadSpeed);
      }
    }

    v.distanceOnEdge += stepDist;

    // 5. Transition to next edge when reaching end of current edge
    let activeEdge = edge;
    if (v.distanceOnEdge >= activeEdge.length && v.nextEdgeId) {
      const overflow = v.distanceOnEdge - activeEdge.length;
      const nextEdge = graph.edges.get(v.nextEdgeId);
      if (nextEdge) {
        v.edgeId = nextEdge.id;
        v.distanceOnEdge = Math.min(overflow, nextEdge.length * 0.5);
        v.nextEdgeId = chooseNextEdgeId(graph, nextEdge, prng);
        activeEdge = nextEdge;
      } else {
        v.distanceOnEdge = activeEdge.length;
      }
    }

    // 6. Update transform, status, and lights
    const sample = sampleRoadEdge(activeEdge, v.distanceOnEdge / Math.max(0.001, activeEdge.length));
    v.position.x = sample.position.x;
    v.position.y = sample.position.y;
    v.position.z = sample.position.z;
    v.yaw = sample.yaw;

    const isDecelerating = v.speed < prevSpeed - 0.01;
    if (v.speed <= 0.05 && stopReason === 'light') {
      v.status = 'stopped_light';
      v.brakeLightsOn = true;
    } else if (v.speed <= 0.05 && stopReason === 'traffic') {
      v.status = 'stopped_traffic';
      v.brakeLightsOn = true;
    } else if (isDecelerating || (stopReason !== 'none' && v.speed < v.maxSpeed * 0.85)) {
      v.status = 'braking';
      v.brakeLightsOn = true;
    } else {
      v.status = 'driving';
      v.brakeLightsOn = false;
    }

    v.headlightsOn = isNight;
  }
}
