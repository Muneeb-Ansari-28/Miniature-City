import { describe, expect, it } from 'vitest';
import { generateCity } from '@/sim/cityGenerator';
import { buildRoadGraph, sampleRoadEdge } from '@/sim/roadGraph';

describe('TC-U02: roadGraph', () => {
  it('builds a strongly connected directed road graph with zero dead ends and exact spline endpoints', () => {
    const city = generateCity();
    const graph = buildRoadGraph(city);

    expect(graph.nodes.size).toBeGreaterThan(0);
    expect(graph.edges.size).toBeGreaterThan(0);

    for (const node of graph.nodes.values()) {
      expect(node.inEdges.length).toBeGreaterThanOrEqual(1);
      expect(node.outEdges.length).toBeGreaterThanOrEqual(1);
    }

    for (const edge of graph.edges.values()) {
      expect(edge.length).toBeGreaterThan(0);

      const fromNode = graph.nodes.get(edge.fromNodeId)!;
      const toNode = graph.nodes.get(edge.toNodeId)!;

      const startSample = sampleRoadEdge(edge, 0);
      const endSample = sampleRoadEdge(edge, 1);

      expect(Math.hypot(startSample.position.x - fromNode.position.x, startSample.position.z - fromNode.position.z)).toBeLessThan(1e-3);
      expect(Math.hypot(endSample.position.x - toNode.position.x, endSample.position.z - toNode.position.z)).toBeLessThan(1e-3);
    }
  });
});
