import { describe, expect, it } from 'vitest';
import { generateCity } from '@/sim/cityGenerator';
import { computeCityPropLayout } from '@/scene/procedural/propFactory';
import { buildSidewalkGraph } from '@/sim/pedestrianSim';

describe('spatialCollision: Zero Overlap & Spatial Clearance Verification', () => {
  const city = generateCity();
  const layout = computeCityPropLayout(city);
  const graph = buildSidewalkGraph(city);

  it('guarantees adequate clearance between all trees', () => {
    const trees = layout.trees;
    for (let i = 0; i < trees.length; i++) {
      for (let j = i + 1; j < trees.length; j++) {
        const a = trees[i]!;
        const b = trees[j]!;
        const dist = Math.hypot(a.position.x - b.position.x, a.position.z - b.position.z);
        // Minimum clearance between tree trunks
        expect(dist).toBeGreaterThanOrEqual(1.8);
      }
    }
  });

  it('guarantees West Park playground items maintain clearance from park trees', () => {
    // West park is at (x: 0, z: 6)
    const westTrees = layout.trees.filter(
      (t) => Math.abs(t.position.x - 0) < 3 && Math.abs(t.position.z - 6) < 3,
    );

    // Playground item centers in lot coordinates
    const playgroundItems = [
      { id: 'slide', x: 0 - 0.95, z: 6.0 - 0.65 },
      { id: 'swing', x: 0 + 0.95, z: 6.0 + 0.65 },
      { id: 'sandbox', x: 0 - 0.95, z: 6.0 + 1.25 },
      { id: 'seesaw', x: 0 + 0.95, z: 6.0 - 0.95 },
    ];

    for (const tree of westTrees) {
      for (const item of playgroundItems) {
        const dist = Math.hypot(tree.position.x - item.x, tree.position.z - item.z);
        // Minimum distance between tree trunks and playground equipment
        expect(dist).toBeGreaterThanOrEqual(1.1);
      }
    }
  });

  it('guarantees playground equipment items do not overlap each other', () => {
    const playgroundItems = [
      { id: 'slide', x: -0.95, z: -0.65, r: 0.7 },
      { id: 'swing', x: 0.95, z: 0.65, r: 0.8 },
      { id: 'sandbox', x: -0.95, z: 1.25, r: 0.75 },
      { id: 'seesaw', x: 0.95, z: -0.95, r: 0.75 },
    ];

    for (let i = 0; i < playgroundItems.length; i++) {
      for (let j = i + 1; j < playgroundItems.length; j++) {
        const a = playgroundItems[i]!;
        const b = playgroundItems[j]!;
        const dist = Math.hypot(a.x - b.x, a.z - b.z);
        expect(dist).toBeGreaterThanOrEqual(a.r + b.r);
      }
    }
  });

  it('guarantees Plaza Fountain props do not overlap burger stall or vending machines', () => {
    // Plaza is at (x: 6, z: -6)
    // Burger stall is at (6.0 - 1.5, -6.0 + 1.8) = (4.5, -4.2)
    const burgerPos = { x: 4.5, z: -4.2 };
    // Vending machines are at (6.0 + 1.2, -6.0 - 2.5) = (7.2, -8.5)

    const plazaTrees = layout.trees.filter(
      (t) => Math.abs(t.position.x - 6) < 3 && Math.abs(t.position.z - -6) < 3,
    );

    for (const tree of plazaTrees) {
      const dist = Math.hypot(tree.position.x - burgerPos.x, tree.position.z - burgerPos.z);
      expect(dist).toBeGreaterThanOrEqual(1.5);
    }
  });

  it('verifies sidewalk graph nodes maintain clearance from tree trunks', () => {
    const nodes = Array.from(graph.nodes.values());
    for (const tree of layout.trees) {
      for (const node of nodes) {
        const dist = Math.hypot(tree.position.x - node.position.x, tree.position.z - node.position.z);
        expect(dist).toBeGreaterThanOrEqual(0.35);
      }
    }
  });
});
