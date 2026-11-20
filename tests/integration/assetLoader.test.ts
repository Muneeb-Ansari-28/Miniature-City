import { afterEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { clearAssetAvailabilityCache, loadAssetOrFallback } from '@/utils/assetLoader';

describe('TC-I02: assetLoader fallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    clearAssetAvailabilityCache();
  });

  it('resolves cleanly with procedural fallback when manifest .glb returns 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'text/plain' }),
      }),
    );

    const fallbackObj = new THREE.Group();
    fallbackObj.name = 'procedural_ramen_fallback';
    const fallbackFactory = vi.fn(() => fallbackObj);

    const result = await loadAssetOrFallback('restaurant_ramen', fallbackFactory);

    expect(result.source).toBe('procedural');
    expect(result.object).toBe(fallbackObj);
    expect(fallbackFactory).toHaveBeenCalledTimes(1);
  });
});
