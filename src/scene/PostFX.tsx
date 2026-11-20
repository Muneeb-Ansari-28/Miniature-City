import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useCityStore } from '@/store/useCityStore';

/**
 * Selective Bloom for neon signs, warm windows, streetlamps, and headlights,
 * paired with ACES Filmic ToneMapping for crisp, vibrant, zero-blur visuals.
 */
export function PostFX() {
  const highQuality = useCityStore((s) => s.highQuality);

  if (!highQuality) {
    return null;
  }

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={1.15}
        luminanceThreshold={0.92}
        luminanceSmoothing={0.35}
        mipmapBlur
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
