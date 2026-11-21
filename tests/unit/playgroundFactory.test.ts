import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  createPlaygroundSlideGeometries,
  createSwingSetGeometries,
  createSandboxGeometries,
  createSeesawGeometries,
  createGardenAmenitiesGeometries,
} from '@/scene/procedural/playgroundFactory';

describe('playgroundFactory: Children Playground & Park Amenities', () => {
  it('creates slide geometries with ladder, platform, and curved chute', () => {
    const slide = createPlaygroundSlideGeometries();
    expect(slide.wood).toBeInstanceOf(THREE.BufferGeometry);
    expect(slide.chute).toBeInstanceOf(THREE.BufferGeometry);
    expect(slide.roof).toBeInstanceOf(THREE.BufferGeometry);

    slide.chute.computeBoundingBox();
    expect(slide.chute.boundingBox).not.toBeNull();
    const box = slide.chute.boundingBox!;
    // Chute should have significant length and height descent
    expect(box.max.y - box.min.y).toBeGreaterThan(0.6);
  });

  it('creates swing set geometries with A-frame posts and hanging seats', () => {
    const swing = createSwingSetGeometries();
    expect(swing.frame).toBeInstanceOf(THREE.BufferGeometry);
    expect(swing.seats).toBeInstanceOf(THREE.BufferGeometry);

    swing.frame.computeBoundingBox();
    const box = swing.frame.boundingBox!;
    // A-frame should be around 1.6m - 2.2m tall
    expect(box.max.y - box.min.y).toBeGreaterThan(1.4);
  });

  it('creates sandbox geometries with octagonal rim and sand mound', () => {
    const sandbox = createSandboxGeometries();
    expect(sandbox.rim).toBeInstanceOf(THREE.BufferGeometry);
    expect(sandbox.sand).toBeInstanceOf(THREE.BufferGeometry);
    expect(sandbox.toys).toBeInstanceOf(THREE.BufferGeometry);

    sandbox.rim.computeBoundingBox();
    const box = sandbox.rim.boundingBox!;
    expect(box.max.x - box.min.x).toBeGreaterThan(1.0);
  });

  it('creates seesaw geometries with fulcrum and tilted balance beam', () => {
    const seesaw = createSeesawGeometries();
    expect(seesaw.fulcrum).toBeInstanceOf(THREE.BufferGeometry);
    expect(seesaw.plank).toBeInstanceOf(THREE.BufferGeometry);

    seesaw.plank.computeBoundingBox();
    const box = seesaw.plank.boundingBox!;
    expect(box.max.x - box.min.x).toBeGreaterThan(1.5);
  });

  it('creates garden amenities with birdbath, water, and drinking fountain', () => {
    const amenities = createGardenAmenitiesGeometries();
    expect(amenities.birdbath).toBeInstanceOf(THREE.BufferGeometry);
    expect(amenities.water).toBeInstanceOf(THREE.BufferGeometry);
    expect(amenities.fountain).toBeInstanceOf(THREE.BufferGeometry);
  });
});
