import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ASSET_MANIFEST, type AssetManifestEntry } from '@/config/assetManifest';

export interface LoadedAssetResult {
  assetId: string;
  source: 'glb' | 'procedural';
  object: THREE.Object3D;
}

const gltfLoader = new GLTFLoader();
const availabilityCache = new Map<string, boolean>();

/**
 * Checks whether a manifest `.glb` path is reachable without spamming console errors.
 */
async function isGlbAvailable(url: string): Promise<boolean> {
  if (availabilityCache.has(url)) {
    return availabilityCache.get(url)!;
  }
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentType = response.headers.get('content-type') ?? '';
    const isBinaryModel =
      response.ok &&
      !contentType.includes('text/html') &&
      !contentType.includes('application/xhtml');
    availabilityCache.set(url, isBinaryModel);
    return isBinaryModel;
  } catch {
    availabilityCache.set(url, false);
    return false;
  }
}

function applyManifestTransform(obj: THREE.Object3D, entry: AssetManifestEntry): void {
  obj.scale.set(entry.scale[0], entry.scale[1], entry.scale[2]);
  obj.position.set(entry.offset[0], entry.offset[1], entry.offset[2]);
  if (entry.rotationY !== undefined) {
    obj.rotation.y = entry.rotationY;
  }
}

/**
 * Asset-agnostic loader: attempts to load a Draco/WebP CC0 `.glb` from `ASSET_MANIFEST`
 * and seamlessly falls back to the supplied procedural Three.js factory if missing or failed.
 */
export async function loadAssetOrFallback(
  assetId: string,
  fallbackFactory: () => THREE.Object3D,
  manifest: Record<string, AssetManifestEntry> = ASSET_MANIFEST,
): Promise<LoadedAssetResult> {
  const entry = manifest[assetId];

  if (entry?.glbPath) {
    const available = await isGlbAvailable(entry.glbPath);
    if (available) {
      try {
        const gltf = await gltfLoader.loadAsync(entry.glbPath);
        const cloned = gltf.scene.clone(true);
        applyManifestTransform(cloned, entry);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        return {
          assetId,
          source: 'glb',
          object: cloned,
        };
      } catch {
        // Fall through cleanly to procedural fallback
      }
    }
  }

  return {
    assetId,
    source: 'procedural',
    object: fallbackFactory(),
  };
}

export function clearAssetAvailabilityCache(): void {
  availabilityCache.clear();
}
