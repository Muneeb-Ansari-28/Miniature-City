import { DEFAULT_CITY_BLUEPRINT, type CityBlueprint } from '@/config/cityLayout';
import { SIDEWALK_HEIGHT, TILE_SIZE } from '@/config/constants';
import type {
  CityLot,
  GeneratedCity,
  PointOfInterest,
  SidewalkSegment,
  Vec3,
} from '@/sim/types';

function gridToWorld(row: number, col: number, rows: number, cols: number, tileSize: number): Vec3 {
  const halfCols = (cols - 1) / 2;
  const halfRows = (rows - 1) / 2;
  return {
    x: (col - halfCols) * tileSize,
    y: 0,
    z: (row - halfRows) * tileSize,
  };
}

/**
 * Generates non-overlapping outdoor patio seating coordinates arranged neatly
 * along the front sidewalk apron of a restaurant, cafe, park, or plaza lot.
 */
function buildSeatingPositions(
  worldPos: Vec3,
  capacity: number,
  category: PointOfInterest['category'],
  tileSize: number,
): Vec3[] {
  const seats: Vec3[] = [];
  const half = tileSize * 0.5;

  if (category === 'park' || category === 'landmark') {
    const ringRadius = tileSize * 0.28;
    for (let i = 0; i < capacity; i++) {
      const angle = (i / Math.max(1, capacity)) * Math.PI * 2 + 0.35;
      seats.push({
        x: Number((worldPos.x + Math.cos(angle) * ringRadius).toFixed(3)),
        y: SIDEWALK_HEIGHT,
        z: Number((worldPos.z + Math.sin(angle) * ringRadius).toFixed(3)),
      });
    }
    return seats;
  }

  // Restaurants/cafes/shops: place pairs of patio chairs around sidewalk tables
  const perRow = Math.min(4, Math.max(2, Math.ceil(capacity / 2)));
  const spacingX = (tileSize - 1.4) / Math.max(1, perRow - 1);
  for (let i = 0; i < capacity; i++) {
    const rowIdx = Math.floor(i / perRow);
    const colIdx = i % perRow;
    const xOffset = -((perRow - 1) * spacingX) / 2 + colIdx * spacingX;
    const zOffset = half - 0.55 - rowIdx * 0.72;
    seats.push({
      x: Number((worldPos.x + xOffset).toFixed(3)),
      y: SIDEWALK_HEIGHT,
      z: Number((worldPos.z + zOffset).toFixed(3)),
    });
  }
  return seats;
}

/**
 * Pure headless city generator that transforms a CityBlueprint into world-space lots,
 * intersections, Points of Interest (with patio seats), and sidewalk/crosswalk segments.
 */
export function generateCity(blueprint: CityBlueprint = DEFAULT_CITY_BLUEPRINT): GeneratedCity {
  const gridRows = blueprint.rows.length;
  const gridCols = blueprint.rows[0]?.length ?? 0;
  const tileSize = TILE_SIZE;
  const islandSize = Math.max(gridRows, gridCols) * tileSize + 2.4;

  const lots: CityLot[] = [];
  const intersections: CityLot[] = [];
  const pois: PointOfInterest[] = [];
  const sidewalks: SidewalkSegment[] = [];

  for (let row = 0; row < gridRows; row++) {
    const rowCells = blueprint.rows[row]!;
    for (let col = 0; col < gridCols; col++) {
      const cell = rowCells[col]!;
      const worldPos = gridToWorld(row, col, gridRows, gridCols, tileSize);
      const lotId = `lot_${row}_${col}`;

      const lot: CityLot = {
        id: lotId,
        row,
        col,
        type: cell.type,
        worldPos,
        rotationY: cell.rotationY ?? 0,
        style: cell.style,
        assetId: cell.assetId,
        poiId: cell.poi?.id,
        height: cell.height,
        baseColor: cell.baseColor,
        accentColor: cell.accentColor,
        rooftopProp: cell.rooftopProp,
        hasSteam: cell.hasSteam,
        neonSign: cell.neonSign,
      };

      lots.push(lot);

      if (cell.type === 'road_intersection') {
        intersections.push(lot);
      }

      if (cell.poi) {
        const seatingPositions = buildSeatingPositions(
          worldPos,
          cell.poi.capacity,
          cell.poi.category,
          tileSize,
        );
        const entrancePos: Vec3 = {
          x: worldPos.x,
          y: SIDEWALK_HEIGHT,
          z: worldPos.z + tileSize * 0.48,
        };
        pois.push({
          id: cell.poi.id,
          name: cell.poi.name,
          category: cell.poi.category,
          gridPos: { row, col },
          worldPos,
          entrancePos,
          seatingPositions,
          capacity: cell.poi.capacity,
          occupantIds: [],
          description: cell.poi.description,
        });
      }
    }
  }

  // Build sidewalk segments along the perimeter of each non-road block
  const half = tileSize * 0.5;
  for (const lot of lots) {
    if (lot.type === 'road_straight' || lot.type === 'road_intersection') {
      continue;
    }
    const { x, z } = lot.worldPos;
    const corners: Vec3[] = [
      { x: x - half, y: SIDEWALK_HEIGHT, z: z - half },
      { x: x + half, y: SIDEWALK_HEIGHT, z: z - half },
      { x: x + half, y: SIDEWALK_HEIGHT, z: z + half },
      { x: x - half, y: SIDEWALK_HEIGHT, z: z + half },
    ];
    for (let i = 0; i < 4; i++) {
      sidewalks.push({
        id: `sw_${lot.id}_${i}`,
        start: corners[i]!,
        end: corners[(i + 1) % 4]!,
        isCrosswalk: false,
      });
    }
  }

  return {
    gridRows,
    gridCols,
    tileSize,
    islandSize,
    lots,
    intersections,
    pois,
    sidewalks,
  };
}
