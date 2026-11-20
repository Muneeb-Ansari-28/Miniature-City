import type { AtmosphereState } from '@/sim/types';

interface PaletteStop {
  hour: number;
  skyTop: [number, number, number];
  skyHorizon: [number, number, number];
  fog: [number, number, number];
  sunColor: [number, number, number];
  sunIntensity: number;
  ambientIntensity: number;
  emissiveStrength: number;
}

const PALETTE_STOPS: readonly PaletteStop[] = [
  {
    hour: 0.0,
    skyTop: [14, 18, 38],
    skyHorizon: [29, 34, 62],
    fog: [24, 28, 52],
    sunColor: [140, 170, 235],
    sunIntensity: 0.35,
    ambientIntensity: 0.34,
    emissiveStrength: 1.0,
  },
  {
    hour: 5.5,
    skyTop: [36, 42, 78],
    skyHorizon: [130, 88, 108],
    fog: [95, 76, 98],
    sunColor: [245, 165, 118],
    sunIntensity: 0.6,
    ambientIntensity: 0.45,
    emissiveStrength: 0.72,
  },
  {
    hour: 7.5,
    skyTop: [96, 158, 224],
    skyHorizon: [242, 206, 174],
    fog: [215, 204, 194],
    sunColor: [255, 234, 198],
    sunIntensity: 1.55,
    ambientIntensity: 0.75,
    emissiveStrength: 0.1,
  },
  {
    hour: 12.0,
    skyTop: [78, 152, 230],
    skyHorizon: [204, 228, 248],
    fog: [205, 222, 240],
    sunColor: [255, 250, 240],
    sunIntensity: 2.1,
    ambientIntensity: 0.92,
    emissiveStrength: 0.0,
  },
  {
    hour: 16.5,
    skyTop: [104, 146, 208],
    skyHorizon: [244, 194, 142],
    fog: [224, 188, 156],
    sunColor: [255, 214, 156],
    sunIntensity: 1.8,
    ambientIntensity: 0.78,
    emissiveStrength: 0.22,
  },
  {
    hour: 18.0,
    skyTop: [82, 78, 126],
    skyHorizon: [242, 174, 122],
    fog: [176, 134, 122],
    sunColor: [255, 164, 96],
    sunIntensity: 1.35,
    ambientIntensity: 0.62,
    emissiveStrength: 0.78,
  },
  {
    hour: 19.5,
    skyTop: [28, 32, 64],
    skyHorizon: [94, 68, 96],
    fog: [58, 52, 80],
    sunColor: [165, 175, 225],
    sunIntensity: 0.45,
    ambientIntensity: 0.4,
    emissiveStrength: 0.96,
  },
  {
    hour: 22.0,
    skyTop: [15, 19, 40],
    skyHorizon: [32, 36, 66],
    fog: [25, 30, 54],
    sunColor: [140, 170, 235],
    sunIntensity: 0.35,
    ambientIntensity: 0.34,
    emissiveStrength: 1.0,
  },
  {
    hour: 24.0,
    skyTop: [14, 18, 38],
    skyHorizon: [29, 34, 62],
    fog: [24, 28, 52],
    sunColor: [140, 170, 235],
    sunIntensity: 0.35,
    ambientIntensity: 0.34,
    emissiveStrength: 1.0,
  },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rgbToHex(r: number, g: number, b: number): string {
  const toByte = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toByte(r)}${toByte(g)}${toByte(b)}`;
}

function lerpRgbHex(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): string {
  return rgbToHex(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t));
}

export function normalizeTimeOfDay(timeOfDay: number): number {
  const mod = timeOfDay % 24;
  return mod < 0 ? mod + 24 : mod;
}

/**
 * Pure atmosphere & solar-arc evaluator for continuous 24h timeOfDay in [0, 24).
 */
export function computeAtmosphere(rawTimeOfDay: number): AtmosphereState {
  const timeOfDay = normalizeTimeOfDay(rawTimeOfDay);

  let lower = PALETTE_STOPS[0]!;
  let upper = PALETTE_STOPS[PALETTE_STOPS.length - 1]!;
  for (let i = 0; i < PALETTE_STOPS.length - 1; i++) {
    const a = PALETTE_STOPS[i]!;
    const b = PALETTE_STOPS[i + 1]!;
    if (timeOfDay >= a.hour && timeOfDay <= b.hour) {
      lower = a;
      upper = b;
      break;
    }
  }

  const span = Math.max(0.0001, upper.hour - lower.hour);
  const t = Math.max(0, Math.min(1, (timeOfDay - lower.hour) / span));

  // Solar arc: rises at 6:00, peaks at 12:00, sets at 18:00
  const sunAngle = ((timeOfDay - 6) / 24) * Math.PI * 2;
  const orbitRadius = 46;
  const sunX = Math.cos(sunAngle) * orbitRadius;
  const sunY = Math.sin(sunAngle) * orbitRadius;
  const sunZ = 18;

  const isNight = timeOfDay < 6.5 || timeOfDay >= 18.5;

  return {
    timeOfDay,
    sunPosition: { x: sunX, y: sunY, z: sunZ },
    sunIntensity: lerp(lower.sunIntensity, upper.sunIntensity, t),
    sunColor: lerpRgbHex(lower.sunColor, upper.sunColor, t),
    ambientIntensity: lerp(lower.ambientIntensity, upper.ambientIntensity, t),
    skyTopColor: lerpRgbHex(lower.skyTop, upper.skyTop, t),
    skyHorizonColor: lerpRgbHex(lower.skyHorizon, upper.skyHorizon, t),
    fogColor: lerpRgbHex(lower.fog, upper.fog, t),
    emissiveStrength: lerp(lower.emissiveStrength, upper.emissiveStrength, t),
    isNight,
  };
}

export function formatClockTime(timeOfDay: number): string {
  const normalized = normalizeTimeOfDay(timeOfDay);
  const hours = Math.floor(normalized);
  const minutes = Math.floor((normalized - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
