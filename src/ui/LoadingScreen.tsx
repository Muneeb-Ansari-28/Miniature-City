import { useEffect, useState } from 'react';
import { useCityStore } from '@/store/useCityStore';

/**
 * Clean fade-out loading screen displayed briefly while WebGL and city geometry initialize.
 */
export function LoadingScreen() {
  const isSceneReady = useCityStore((s) => s.isSceneReady);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!isSceneReady) return;
    const timer = window.setTimeout(() => setHidden(true), 450);
    return () => window.clearTimeout(timer);
  }, [isSceneReady]);

  if (hidden) return null;

  return (
    <div
      data-testid="loading-screen"
      className={`fixed inset-0 z-40 flex flex-col items-center justify-center bg-[#191724] text-stone-100 transition-opacity duration-500 ${
        isSceneReady ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-3 px-6 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-300/25 border-t-amber-300" />
        <div className="text-lg font-bold tracking-widest text-white">MINIATURE 3D CITY</div>
        <div className="text-xs text-stone-400">Initializing traffic, citizens & lighting...</div>
      </div>
    </div>
  );
}
