import type { BuildingStyle, LotType, PoiCategory } from '@/sim/types';

export interface BlueprintLot {
  type: LotType;
  style?: BuildingStyle;
  assetId?: string;
  rotationY?: number;
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
  poi?: {
    id: string;
    name: string;
    category: PoiCategory;
    capacity: number;
    description: string;
  };
}

export interface CityBlueprint {
  name: string;
  blocksPerSide: 4 | 5;
  rows: BlueprintLot[][];
}

const RD: BlueprintLot = { type: 'road_straight' };
const INT: BlueprintLot = { type: 'road_intersection' };

/**
 * Default 4x4 city-block neighborhood (7x7 tile matrix with continuous perimeter road loop
 * and central crossroad, yielding 9 road intersections and 16 distinct city lots).
 * Modeled after the warm sunset diorama composition:
 * - Front-left: Sakura Ramen Corner with striped awning & patio umbrellas + Corner Cafe Apartment
 * - Front-right: Central Pocket Park with stylized trees & benches + Café Burger Diner
 * - Back-left: Cozy Balcony Apartments + Bean & Steam Cafe
 * - Back-right: Commercial Towers, Bistro Lumiere & Fountain Plaza
 */
export const DEFAULT_CITY_BLUEPRINT: CityBlueprint = {
  name: 'Sunset Harbor Mini-City',
  blocksPerSide: 4,
  rows: [
    // Row 0: North perimeter road
    [INT, RD, RD, INT, RD, RD, INT],

    // Row 1: North blocks (NW & NE quadrants)
    [
      RD,
      {
        type: 'residential',
        style: 'apartment_balcony',
        assetId: 'building_apartment_balcony',
        rotationY: 0,
        height: 6.4,
        baseColor: '#d9ccb8',
        accentColor: '#7a5c4d',
        rooftopProp: 'coffee_cup',
        hasSteam: true,
        neonSign: { text: 'ESPRESSO', color: '#4fd1ff', icon: 'coffee' },
      },
      {
        type: 'restaurant',
        style: 'cafe_corner',
        assetId: 'restaurant_bean_steam',
        rotationY: 0,
        height: 5.4,
        baseColor: '#b57b5b',
        accentColor: '#40536b',
        rooftopProp: 'ac_units',
        hasSteam: true,
        neonSign: { text: 'BEAN & STEAM', color: '#5ce1e6', icon: 'coffee' },
        poi: {
          id: 'bean-steam-cafe',
          name: 'Bean & Steam Cafe',
          category: 'cafe',
          capacity: 6,
          description:
            'Artisanal corner roastery with warm glowing windows, steaming rooftop vents, and sidewalk patio tables.',
        },
      },
      RD,
      {
        type: 'commercial',
        style: 'commercial_tower',
        assetId: 'building_commercial_tower',
        rotationY: 0,
        height: 7.4,
        baseColor: '#cfa57a',
        accentColor: '#52495e',
        rooftopProp: 'antenna',
        neonSign: { text: 'ARCADE', color: '#ff5ea8', icon: 'cafe' },
      },
      {
        type: 'commercial',
        style: 'commercial_mid',
        assetId: 'building_commercial_mid',
        rotationY: -Math.PI / 2,
        height: 6.2,
        baseColor: '#c7976b',
        accentColor: '#3f4b5e',
        rooftopProp: 'burger',
        neonSign: { text: 'GRILL', color: '#ffb84d', icon: 'burger' },
      },
      RD,
    ],

    // Row 2: North-central blocks bordering central crossroad
    [
      RD,
      {
        type: 'residential',
        style: 'apartment_warm',
        assetId: 'building_apartment_warm',
        rotationY: Math.PI / 2,
        height: 5.0,
        baseColor: '#c98863',
        accentColor: '#4c5d70',
        rooftopProp: 'ac_units',
      },
      {
        type: 'restaurant',
        style: 'bistro_lumiere',
        assetId: 'restaurant_bistro_lumiere',
        rotationY: 0,
        height: 3.9,
        baseColor: '#e2c9a6',
        accentColor: '#a84438',
        rooftopProp: 'ac_units',
        hasSteam: true,
        neonSign: { text: 'BISTRO LUMIERE', color: '#ff9d5c', icon: 'cafe' },
        poi: {
          id: 'bistro-lumiere',
          name: 'Bistro Lumiere',
          category: 'restaurant',
          capacity: 6,
          description:
            'Cozy evening bistro serving wood-fired dishes beneath warm awning lights and umbrella-shaded patio tables.',
        },
      },
      RD,
      {
        type: 'plaza',
        style: 'plaza_fountain',
        assetId: 'plaza_fountain',
        rotationY: 0,
        height: 0.4,
        baseColor: '#d7cfc2',
        accentColor: '#5ba8c9',
        poi: {
          id: 'harbor-plaza',
          name: 'Harbor Fountain Plaza',
          category: 'landmark',
          capacity: 4,
          description:
            'Stone-paved neighborhood square with a tiered fountain, warm lantern posts, and gathering benches.',
        },
      },
      {
        type: 'restaurant',
        style: 'burger_diner',
        assetId: 'restaurant_burger_diner',
        rotationY: -Math.PI / 2,
        height: 4.3,
        baseColor: '#d9b991',
        accentColor: '#b84237',
        rooftopProp: 'burger',
        hasSteam: true,
        neonSign: { text: 'CAFÉ', color: '#ffd166', icon: 'burger' },
        poi: {
          id: 'sunset-cafe-diner',
          name: 'Sunset Café & Grill',
          category: 'cafe',
          capacity: 6,
          description:
            'Lively avenue cafe crowned with a rotating burger billboard, glowing golden signage, and outdoor patio tables.',
        },
      },
      RD,
    ],

    // Row 3: Central East-West crossroad
    [INT, RD, RD, INT, RD, RD, INT],

    // Row 4: South-central blocks (SW & SE quadrants)
    [
      RD,
      {
        type: 'commercial',
        style: 'corner_shop',
        assetId: 'building_corner_shop',
        rotationY: Math.PI / 2,
        height: 4.2,
        baseColor: '#d6bfa1',
        accentColor: '#5c7c66',
        rooftopProp: 'ac_units',
        poi: {
          id: 'vinyl-books-shop',
          name: 'Corner Vinyl & Books',
          category: 'shop',
          capacity: 3,
          description:
            'Neighborhood bookshop and record store with warm display windows and sidewalk browsing racks.',
        },
      },
      {
        type: 'restaurant',
        style: 'ramen_corner',
        assetId: 'restaurant_ramen',
        rotationY: 0,
        height: 3.4,
        baseColor: '#d8b48c',
        accentColor: '#c94c38',
        rooftopProp: 'ramen_bowl',
        hasSteam: true,
        neonSign: { text: 'RAMEN CORNER', color: '#ffae42', icon: 'ramen' },
        poi: {
          id: 'sakura-ramen-corner',
          name: 'Sakura Ramen Corner',
          category: 'restaurant',
          capacity: 8,
          description:
            'Bustling late-night noodle shop with striped awnings, steaming kitchen vents, and lively patio seating.',
        },
      },
      RD,
      {
        type: 'park',
        style: 'pocket_park',
        assetId: 'park_pocket',
        rotationY: 0,
        height: 0.25,
        baseColor: '#769c57',
        accentColor: '#597a41',
        poi: {
          id: 'central-pocket-park',
          name: 'Maple Pocket Park',
          category: 'park',
          capacity: 6,
          description:
            'Lush neighborhood green with wind-swaying stylized trees, winding stone paths, and shaded wooden benches.',
        },
      },
      {
        type: 'park',
        style: 'pocket_park',
        assetId: 'park_pocket_east',
        rotationY: Math.PI / 2,
        height: 0.25,
        baseColor: '#6f9652',
        accentColor: '#52733b',
      },
      RD,
    ],

    // Row 5: South perimeter blocks
    [
      RD,
      {
        type: 'residential',
        style: 'apartment_warm',
        assetId: 'building_south_apt_1',
        rotationY: Math.PI,
        height: 4.8,
        baseColor: '#d4b89c',
        accentColor: '#8f5947',
        rooftopProp: 'ac_units',
      },
      {
        type: 'commercial',
        style: 'corner_shop',
        assetId: 'building_south_shop',
        rotationY: Math.PI,
        height: 3.6,
        baseColor: '#c8a989',
        accentColor: '#4b6b82',
        rooftopProp: 'none',
      },
      RD,
      {
        type: 'residential',
        style: 'apartment_balcony',
        assetId: 'building_south_apt_2',
        rotationY: Math.PI,
        height: 5.2,
        baseColor: '#cfb59b',
        accentColor: '#5f6f7d',
        rooftopProp: 'ac_units',
      },
      {
        type: 'commercial',
        style: 'commercial_mid',
        assetId: 'building_south_comm',
        rotationY: Math.PI,
        height: 5.8,
        baseColor: '#c49674',
        accentColor: '#48566b',
        rooftopProp: 'antenna',
      },
      RD,
    ],

    // Row 6: South perimeter road
    [INT, RD, RD, INT, RD, RD, INT],
  ],
};
