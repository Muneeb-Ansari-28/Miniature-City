import { useEffect, useState } from 'react';
import { defaultWorldEngine, type WorldEngine } from '@/sim/worldEngine';
import { useCityStore } from '@/store/useCityStore';

interface PerfOverlayProps {
  engine?: WorldEngine;
}

/**
 * Top-left floating glassmorphic title & live telemetry card matching the reference diorama UI.
 * Polls `window.__CITY_STATS__` at 2Hz (zero per-frame React re-renders).
 */
export function PerfOverlay({ engine = defaultWorldEngine }: PerfOverlayProps) {
  const showPerfOverlay = useCityStore((s) => s.showPerfOverlay);
  const [stats, setStats] = useState(() => ({
    fps: 60,
    drawCalls: 0,
    triangles: 0,
    npcs: engine.pedestrians.length + engine.vehicles.length,
  }));

  useEffect(() => {
    const id = window.setInterval(() => {
      const live = window.__CITY_STATS__;
      if (live) {
        setStats({
          fps: live.fps,
          drawCalls: live.drawCalls,
          triangles: live.triangles,
          npcs: live.activePedestrians + live.activeVehicles,
        });
      }
    }, 500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      data-testid="perf-overlay"
      className="pointer-events-auto rounded-xl border border-white/15 bg-stone-950/65 px-3.5 py-2.5 text-stone-100 shadow-xl backdrop-blur-md"
    >
      <div className="flex items-baseline gap-1.5">
        <span className="text-sm font-bold tracking-wider text-white sm:text-base">CITY SIM</span>
        <span className="text-[11px] font-medium text-amber-300/85">v1.0</span>
      </div>
      <div className="mt-1 space-y-0.5 text-[11px] font-medium text-stone-300 tabular-nums">
        <div>FPS: {stats.fps}</div>
        <div>Active NPCs: {stats.npcs}</div>
        {showPerfOverlay && (
          <div className="pt-0.5 text-[10px] text-stone-400">
            Calls: {stats.drawCalls} · Tris: {(stats.triangles / 1000).toFixed(1)}k
          </div>
        )}
      </div>
    </div>
  );
}
