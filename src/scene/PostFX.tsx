import { Bloom, DepthOfField, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useCityStore } from '@/store/useCityStore';

/**
 * Selective Bloom for neon signs, warm windows, streetlamps, and headlights,
 * paired with a toggleable miniature Tilt-Shift DepthOfField and ACES Filmic ToneMapping.
 */
export function PostFX() {
  const tiltShiftEnabled = useCityStore((s) => s.tiltShiftEnabled);
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
      <DepthOfField
        focusDistance={0.038}
        focalLength={0.05}
        bokehScale={tiltShiftEnabled ? 2.6 : 0}
        height={360}
      />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
