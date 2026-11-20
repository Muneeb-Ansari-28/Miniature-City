import { useEffect } from 'react';
import { defaultWorldEngine, type WorldEngine } from '@/sim/worldEngine';
import { useCityStore } from '@/store/useCityStore';
import { CameraPresets } from '@/ui/CameraPresets';
import { InspectorCard } from '@/ui/InspectorCard';
import { PerfOverlay } from '@/ui/PerfOverlay';
import { TimeWeatherBar } from '@/ui/TimeWeatherBar';
import { cityAudioManager } from '@/utils/audioManager';

interface HudOverlayProps {
  engine?: WorldEngine;
}

/**
 * Main responsive HUD shell, audio sync bridge, and global keyboard shortcut handler.
 * Shortcuts: Space (play/pause), 1-4 (camera presets), N (night/day), R (rain), P (perf), Esc (close).
 */
export function HudOverlay({ engine = defaultWorldEngine }: HudOverlayProps) {
  const soundEnabled = useCityStore((s) => s.soundEnabled);
  const weather = useCityStore((s) => s.weather);

  useEffect(() => {
    cityAudioManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    cityAudioManager.setWeather(weather);
  }, [weather]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      const store = useCityStore.getState();

      if (e.code === 'Space') {
        e.preventDefault();
        store.togglePlayPause();
      } else if (e.key === 'Escape') {
        store.clearSelection();
      } else if (e.key === '1') {
        store.setCameraPreset('overview');
      } else if (e.key === '2') {
        store.setCameraPreset('plaza');
      } else if (e.key === '3') {
        store.setCameraPreset('downtown');
      } else if (e.key === '4') {
        store.setCameraPreset('topdown');
      } else if (e.key === 'n' || e.key === 'N') {
        const isCurrentlyNight = store.timeOfDay < 6.5 || store.timeOfDay >= 18.5;
        store.setAutoCycleTime(false);
        store.setTimeOfDay(isCurrentlyNight ? 12.5 : 21.8);
      } else if (e.key === 'r' || e.key === 'R') {
        store.toggleWeather();
      } else if (e.key === 'p' || e.key === 'P') {
        store.togglePerfOverlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-5">
      {/* Top row: CITY SIM telemetry card (left) + Navigation drawer (right) */}
      <div className="flex items-start justify-between gap-3">
        <PerfOverlay engine={engine} />
        <CameraPresets engine={engine} />
      </div>

      {/* Bottom area: Contextual InspectorCard + Floating Time/Weather Dock */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex w-full justify-end sm:justify-center">
          <InspectorCard engine={engine} />
        </div>
        <TimeWeatherBar />
      </div>
    </div>
  );
}
