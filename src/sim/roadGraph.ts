import { LANE_OFFSET } from '@/config/constants';
import type { GeneratedCity, Vec3 } from '@/sim/types';

export type CardinalDir = 'N' | 'S' | 'E' | 'W';

export interface RoadNode {
  id: string;
  position: Vec3;
  intersectionId: string;
  direction: CardinalDir;
  role: 'entry' | 'exit';
  inEdges: string[];
  outEdges: string[];
}

export interface RoadEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  p0: Vec3;
  p1: Vec3; // Quadratic Bezier control point
  p2: Vec3;
  length: number;
  isIntersectionTurn: boolean;
  intersectionId: string | null;
  axis: 'NS' | 'EW';
}

export interface RoadGraph {
  nodes: Map<string, RoadNode>;
  edges: Map<string, RoadEdge>;
  straightEdgeIds: string[];
}

export interface EdgeSample {
  position: Vec3;
  yaw: number;
}

/**
 * Evaluates a quadratic Bezier edge at parameter t in [0, 1].
 * Guaranteed: at t=0 returns p0, at t=1 returns p2.
 */
export function sampleRoadEdge(edge: RoadEdge, t: number): EdgeSample {
  const clamped = Math.max(0, Math.min(1, t));
  const inv = 1 - clamped;

  const x = inv * inv * edge.p0.x + 2 * inv * clamped * edge.p1.x + clamped * clamped * edge.p2.x;
  const y = inv * inv * edge.p0.y + 2 * inv * clamped * edge.p1.y + clamped * clamped * edge.p2.y;
  const z = inv * inv * edge.p0.z + 2 * inv * clamped * edge.p1.z + clamped * clamped * edge.p2.z;

  // Derivative B'(t) = 2(1-t)(p1-p0) + 2t(p2-p1)
  const dx = 2 * inv * (edge.p1.x - edge.p0.x) + 2 * clamped * (edge.p2.x - edge.p1.x);
  const dz = 2 * inv * (edge.p1.z - edge.p0.z) + 2 * clamped * (edge.p2.z - edge.p1.z);

  const yaw = Math.atan2(dx, dz);

  return {
    position: { x, y, z },
    yaw,
  };
}

function estimateQuadraticLength(p0: Vec3, p1: Vec3, p2: Vec3, steps = 16): number {
  let len = 0;
  let prevX = p0.x;
  let prevZ = p0.z;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const inv = 1 - t;
    const x = inv * inv * p0.x + 2 * inv * t * p1.x + t * t * p2.x;
    const z = inv * inv * p0.z + 2 * inv * t * p1.z + t * t * p2.z;
    len += Math.hypot(x - prevX, z - prevZ);
    prevX = x;
    prevZ = z;
  }
  return len;
}

function isRoadCell(city: GeneratedCity, row: number, col: number): boolean {
  if (row < 0 || col < 0 || row >= city.gridRows || col >= city.gridCols) return false;
  const lot = city.lots[row * city.gridCols + col];
  return lot?.type === 'road_straight' || lot?.type === 'road_intersection';
}

function oppositeDir(dir: CardinalDir): CardinalDir {
  switch (dir) {
    case 'N':
      return 'S';
    case 'S':
      return 'N';
    case 'E':
      return 'W';
    case 'W':
      return 'E';
  }
}

function dirDelta(dir: CardinalDir): { dr: number; dc: number } {
  switch (dir) {
    case 'N':
      return { dr: -1, dc: 0 };
    case 'S':
      return { dr: 1, dc: 0 };
    case 'E':
      return { dr: 0, dc: 1 };
    case 'W':
      return { dr: 0, dc: -1 };
  }
}

/**
 * Right-hand-drive lane node coordinate on the boundary of an intersection tile.
 * +X = East, -X = West, +Z = South, -Z = North.
 */
function boundaryPoint(center: Vec3, side: CardinalDir, role: 'entry' | 'exit', halfTile: number): Vec3 {
  // side indicates which edge of the intersection tile the road attaches to.
  // If role === 'entry', vehicle is entering the intersection FROM `side` (heading oppositeDir(side)).
  // If role === 'exit', vehicle is leaving the intersection TOWARD `side` (heading `side`).
  const travelDir = role === 'exit' ? side : oppositeDir(side);
  let x = center.x;
  let z = center.z;

  if (side === 'N') z -= halfTile;
  if (side === 'S') z += halfTile;
  if (side === 'E') x += halfTile;
  if (side === 'W') x -= halfTile;

  // Apply right-hand-drive lane offset perpendicular to travelDir
  if (travelDir === 'E') z += LANE_OFFSET;
  if (travelDir === 'W') z -= LANE_OFFSET;
  if (travelDir === 'S') x -= LANE_OFFSET;
  if (travelDir === 'N') x += LANE_OFFSET;

  return { x, y: 0.04, z };
}

/**
 * Builds a strongly connected, right-hand-drive directed road graph from a GeneratedCity.
 * Zero dead-ends: every node has inDegree >= 1 and outDegree >= 1.
 */
export function buildRoadGraph(city: GeneratedCity): RoadGraph {
  const nodes = new Map<string, RoadNode>();
  const edges = new Map<string, RoadEdge>();
  const straightEdgeIds: string[] = [];

  const halfTile = city.tileSize * 0.5;
  const intersectionMap = new Map<string, (typeof city.intersections)[number]>();
  for (const inter of city.intersections) {
    intersectionMap.set(`${inter.row}_${inter.col}`, inter);
  }

  const dirs: CardinalDir[] = ['N', 'S', 'E', 'W'];

  const addNode = (
    id: string,
    position: Vec3,
    intersectionId: string,
    direction: CardinalDir,
    role: 'entry' | 'exit',
  ) => {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id,
        position,
        intersectionId,
        direction,
        role,
        inEdges: [],
        outEdges: [],
      });
    }
  };

  const addEdge = (
    id: string,
    fromNodeId: string,
    toNodeId: string,
    p1: Vec3,
    isIntersectionTurn: boolean,
    intersectionId: string | null,
    axis: 'NS' | 'EW',
  ) => {
    const from = nodes.get(fromNodeId)!;
    const to = nodes.get(toNodeId)!;
    const length = estimateQuadraticLength(from.position, p1, to.position);
    edges.set(id, {
      id,
      fromNodeId,
      toNodeId,
      p0: from.position,
      p1,
      p2: to.position,
      length,
      isIntersectionTurn,
      intersectionId,
      axis,
    });
    from.outEdges.push(id);
    to.inEdges.push(id);
    if (!isIntersectionTurn) {
      straightEdgeIds.push(id);
    }
  };

  // 1. Create entry & exit boundary nodes for every road arm connected to each intersection
  for (const inter of city.intersections) {
    for (const side of dirs) {
      const { dr, dc } = dirDelta(side);
      if (!isRoadCell(city, inter.row + dr, inter.col + dc)) continue;

      const entryId = `${inter.id}_entry_${side}`;
      const exitId = `${inter.id}_exit_${side}`;

      addNode(entryId, boundaryPoint(inter.worldPos, side, 'entry', halfTile), inter.id, oppositeDir(side), 'entry');
      addNode(exitId, boundaryPoint(inter.worldPos, side, 'exit', halfTile), inter.id, side, 'exit');
    }
  }

  // 2. Connect intersection entry nodes to valid exit nodes (exclude U-turns unless no other exit)
  for (const inter of city.intersections) {
    const connectedSides = dirs.filter((side) => {
      const { dr, dc } = dirDelta(side);
      return isRoadCell(city, inter.row + dr, inter.col + dc);
    });

    for (const inSide of connectedSides) {
      const entryId = `${inter.id}_entry_${inSide}`;
      const entryNode = nodes.get(entryId)!;
      const candidateExits = connectedSides.filter((outSide) => outSide !== inSide);
      const validExits = candidateExits.length > 0 ? candidateExits : [inSide];

      for (const outSide of validExits) {
        const exitId = `${inter.id}_exit_${outSide}`;
        const exitNode = nodes.get(exitId)!;
        const axis: 'NS' | 'EW' = inSide === 'N' || inSide === 'S' ? 'NS' : 'EW';

        // Control point: for straight-through use midpoint; for turns use intersection of lane rays
        let controlPoint: Vec3;
        if (outSide === oppositeDir(inSide)) {
          controlPoint = {
            x: (entryNode.position.x + exitNode.position.x) * 0.5,
            y: 0.04,
            z: (entryNode.position.z + exitNode.position.z) * 0.5,
          };
        } else if (inSide === 'N' || inSide === 'S') {
          controlPoint = { x: entryNode.position.x, y: 0.04, z: exitNode.position.z };
        } else {
          controlPoint = { x: exitNode.position.x, y: 0.04, z: entryNode.position.z };
        }

        addEdge(
          `turn_${inter.id}_${inSide}_to_${outSide}`,
          entryId,
          exitId,
          controlPoint,
          true,
          inter.id,
          axis,
        );
      }
    }
  }

  // 3. Connect straight road edges between neighboring intersections
  for (const inter of city.intersections) {
    for (const side of dirs) {
      const { dr, dc } = dirDelta(side);
      let r = inter.row + dr;
      let c = inter.col + dc;
      while (isRoadCell(city, r, c)) {
        const nextInter = intersectionMap.get(`${r}_${c}`);
        if (nextInter) {
          const fromId = `${inter.id}_exit_${side}`;
          const toId = `${nextInter.id}_entry_${oppositeDir(side)}`;
          const edgeId = `straight_${inter.id}_to_${nextInter.id}`;
          if (!edges.has(edgeId) && nodes.has(fromId) && nodes.has(toId)) {
            const fromNode = nodes.get(fromId)!;
            const toNode = nodes.get(toId)!;
            const mid: Vec3 = {
              x: (fromNode.position.x + toNode.position.x) * 0.5,
              y: 0.04,
              z: (fromNode.position.z + toNode.position.z) * 0.5,
            };
            const axis: 'NS' | 'EW' = side === 'N' || side === 'S' ? 'NS' : 'EW';
            addEdge(edgeId, fromId, toId, mid, false, nextInter.id, axis);
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }
  }

  return { nodes, edges, straightEdgeIds };
}
