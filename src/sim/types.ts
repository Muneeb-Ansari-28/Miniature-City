export type LotType =
  | 'road_straight'
  | 'road_intersection'
  | 'commercial'
  | 'restaurant'
  | 'residential'
  | 'park'
  | 'plaza';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface GridCoord {
  row: number;
  col: number;
}

export type PoiCategory = 'restaurant' | 'cafe' | 'shop' | 'park' | 'landmark';

export type BuildingStyle =
  | 'ramen_corner'
  | 'cafe_corner'
  | 'burger_diner'
  | 'bistro_lumiere'
  | 'apartment_balcony'
  | 'apartment_warm'
  | 'commercial_tower'
  | 'commercial_mid'
  | 'corner_shop'
  | 'pocket_park'
  | 'plaza_fountain';

export interface PointOfInterest {
  id: string;
  name: string;
  category: PoiCategory;
  gridPos: GridCoord;
  worldPos: Vec3;
  entrancePos: Vec3;
  seatingPositions: Vec3[];
  capacity: number;
  occupantIds: string[];
  description: string;
}

export interface CityLot {
  id: string;
  row: number;
  col: number;
  type: LotType;
  worldPos: Vec3;
  rotationY: number;
  style?: BuildingStyle;
  assetId?: string;
  poiId?: string;
  height?: number;
  baseColor?: string;
  accentColor?: string;
  rooftopProp?: 'coffee_cup' | 'burger' | 'ramen_bowl' | 'ac_units' | 'antenna' | 'none';
  hasSteam?: boolean;
  neonSign?: {
    text: string;
    color: string;
    icon?: 'coffee' | 'burger' | 'ramen' | 'cafe';
  };
}

export interface SidewalkSegment {
  id: string;
  start: Vec3;
  end: Vec3;
  isCrosswalk: boolean;
  intersectionId?: string;
  axis?: 'NS' | 'EW';
}

export interface GeneratedCity {
  gridRows: number;
  gridCols: number;
  tileSize: number;
  islandSize: number;
  lots: CityLot[];
  intersections: CityLot[];
  pois: PointOfInterest[];
  sidewalks: SidewalkSegment[];
}

export type LightColor = 'green' | 'yellow' | 'red';

export type IntersectionPhase =
  | 'NS_GREEN'
  | 'NS_YELLOW'
  | 'ALL_RED_TO_EW'
  | 'EW_GREEN'
  | 'EW_YELLOW'
  | 'ALL_RED_TO_NS';

export interface TrafficLightState {
  intersectionId: string;
  worldPos: Vec3;
  phase: IntersectionPhase;
  timer: number;
  nsLight: LightColor;
  ewLight: LightColor;
}

export type VehicleType = 'sedan' | 'taxi' | 'van' | 'bus' | 'compact';

export type VehicleStatus =
  | 'driving'
  | 'braking'
  | 'stopped_light'
  | 'stopped_traffic';

export interface VehicleAgent {
  id: string;
  label: string;
  type: VehicleType;
  color: string;
  edgeId: string;
  nextEdgeId: string | null;
  distanceOnEdge: number;
  speed: number;
  maxSpeed: number;
  length: number;
  position: Vec3;
  yaw: number;
  status: VehicleStatus;
  brakeLightsOn: boolean;
  headlightsOn: boolean;
}

export type PedestrianState =
  | 'walking'
  | 'waiting_crosswalk'
  | 'dining'
  | 'idling';

export interface PedestrianAgent {
  id: string;
  shirtColor: string;
  pantsColor: string;
  skinTone: string;
  state: PedestrianState;
  position: Vec3;
  yaw: number;
  speed: number;
  walkPhase: number;
  currentNodeId: string;
  targetNodeId: string;
  edgeProgress: number;
  targetPoiId: string | null;
  seatIndex: number | null;
  dwellTimer: number;
}

export interface AtmosphereState {
  timeOfDay: number;
  sunPosition: Vec3;
  sunIntensity: number;
  sunColor: string;
  ambientIntensity: number;
  skyTopColor: string;
  skyHorizonColor: string;
  fogColor: string;
  emissiveStrength: number;
  isNight: boolean;
}

export type WeatherMode = 'clear' | 'rain';
export type SimSpeed = 0 | 0.5 | 1 | 2;
export type CameraPresetId = 'overview' | 'plaza' | 'downtown' | 'topdown';

export interface CityStats {
  fps: number;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  activeVehicles: number;
  activePedestrians: number;
  timeOfDay: number;
}

declare global {
  interface Window {
    __CITY_STATS__?: CityStats;
  }
}
