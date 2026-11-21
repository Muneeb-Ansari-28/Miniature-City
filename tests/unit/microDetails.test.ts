import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createManholeGeometry,
  createStormDrainGeometry,
  createNewspaperBoxGeometry,
  createWallAcUnitGeometry,
  createRooftopWaterTowerGeometry,
  createClotheslineGeometry,
} from '@/scene/procedural/microDetailFactory';

describe('microDetailFactory: Architectural and Street Micro-Details', () => {
  it('creates valid sewer manhole cover geometry', () => {
    const manhole = createManholeGeometry();
    expect(manhole).toBeInstanceOf(THREE.BufferGeometry);
    expect(manhole.getAttribute('position').count).toBeGreaterThan(10);
    manhole.computeBoundingBox();
    const box = manhole.boundingBox!;
    // Diameter around 0.6m - 0.8m
    expect(box.max.x - box.min.x).toBeGreaterThan(0.5);
    expect(box.max.x - box.min.x).toBeLessThan(0.9);
  });

  it('creates valid storm drain grate geometry', () => {
    const drain = createStormDrainGeometry();
    expect(drain).toBeInstanceOf(THREE.BufferGeometry);
    drain.computeBoundingBox();
    const box = drain.boundingBox!;
    expect(box.max.x - box.min.x).toBeGreaterThan(0.4);
  });

  it('creates valid newspaper vending box geometry', () => {
    const newsBox = createNewspaperBoxGeometry();
    expect(newsBox).toBeInstanceOf(THREE.BufferGeometry);
    newsBox.computeBoundingBox();
    const box = newsBox.boundingBox!;
    expect(box.max.y - box.min.y).toBeGreaterThan(0.6);
  });

  it('creates valid wall AC compressor unit geometry', () => {
    const ac = createWallAcUnitGeometry();
    expect(ac).toBeInstanceOf(THREE.BufferGeometry);
    ac.computeBoundingBox();
    const box = ac.boundingBox!;
    expect(box.max.x - box.min.x).toBeGreaterThan(0.4);
  });

  it('creates valid rooftop timber water tower geometry', () => {
    const tower = createRooftopWaterTowerGeometry();
    expect(tower).toBeInstanceOf(THREE.BufferGeometry);
    tower.computeBoundingBox();
    const box = tower.boundingBox!;
    // Total height with stilts and conical cap around 2.0m - 2.8m
    expect(box.max.y - box.min.y).toBeGreaterThan(1.8);
  });

  it('creates valid rooftop clothesline with laundry geometry', () => {
    const clothesline = createClotheslineGeometry();
    expect(clothesline).toBeInstanceOf(THREE.BufferGeometry);
  });
});
