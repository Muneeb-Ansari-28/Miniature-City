import {
  Clock,
  CloudRain,
  Focus,
  Pause,
  Play,
  Sparkles,
  Sun,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { formatClockTime } from '@/sim/atmosphereSim';
import { useCityStore } from '@/store/useCityStore';

const TIME_PRESETS = [
  { label: 'Morning', hours: 8.5 },
  { label: 'Noon', hours: 12.5 },
  { label: 'Sunset', hours: 17.6 },
  { label: 'Night', hours: 21.8 },
] as const;

/**
 * Floating bottom glassmorphic control dock matching the reference screenshot:
 * Time of Day presets + 24h scrubber, Weather (Clear / Rain), Simulation Speed,
 * Tilt-Shift toggle, Audio toggle, and Quality toggle.
 */
export function TimeWeatherBar() {
  const timeOfDay = useCityStore((s) => s.timeOfDay);
  const setTimeOfDay = useCityStore((s) => s.setTimeOfDay);
  const setAutoCycleTime = useCityStore((s) => s.setAutoCycleTime);
  const weather = useCityStore((s) => s.weather);
  const setWeather = useCityStore((s) => s.setWeather);
  const simSpeed = useCityStore((s) => s.simSpeed);
  const setSimSpeed = useCityStore((s) => s.setSimSpeed);
  const togglePlayPause = useCityStore((s) => s.togglePlayPause);
  const tiltShiftEnabled = useCityStore((s) => s.tiltShiftEnabled);
  const toggleTiltShift = useCityStore((s) => s.toggleTiltShift);
  const soundEnabled = useCityStore((s) => s.soundEnabled);
  const toggleSound = useCityStore((s) => s.toggleSound);
  const highQuality = useCityStore((s) => s.highQuality);
  const toggleHighQuality = useCityStore((s) => s.toggleHighQuality);

  const handleTimePreset = (hours: number) => {
    setAutoCycleTime(false);
    setTimeOfDay(hours);
  };

  return (
    <div className="pointer-events-auto mx-auto flex w-full max-w-4xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/15 bg-stone-950/75 px-3 py-2 text-xs text-stone-100 shadow-2xl backdrop-blur-xl sm:flex-nowrap sm:gap-3.5 sm:px-4 sm:py-2.5">
      {/* Time of Day group */}
      <div className="flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap">
        <div className="flex items-center gap-1.5 text-amber-300">
          <Clock className="h-4 w-4 shrink-0" />
          <span className="w-11 font-mono text-[11px] font-semibold tabular-nums">
            {formatClockTime(timeOfDay)}
          </span>
        </div>

        <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
          {TIME_PRESETS.map((preset) => {
            const isActive = Math.abs(timeOfDay - preset.hours) < 1.2;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={isActive}
                onClick={() => handleTimePreset(preset.hours)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                  isActive
                    ? 'bg-amber-400/25 text-amber-200'
                    : 'text-stone-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <input
          type="range"
          aria-label="Time of day"
          min={0}
          max={23.95}
          step={0.05}
          value={timeOfDay}
          onChange={(e) => {
            setAutoCycleTime(false);
            setTimeOfDay(Number(e.target.value));
          }}
          className="city-slider w-20 sm:w-24"
        />
      </div>

      <div className="hidden h-6 w-px bg-white/15 sm:block" />

      {/* Weather group */}
      <div className="flex items-center gap-1 rounded-lg bg-white/5 p-0.5">
        <button
          type="button"
          aria-pressed={weather === 'clear'}
          onClick={() => setWeather('clear')}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition ${
            weather === 'clear'
              ? 'bg-amber-400/25 text-amber-200'
              : 'text-stone-300 hover:bg-white/10'
          }`}
        >
          <Sun className="h-3.5 w-3.5" />
          Clear
        </button>
        <button
          type="button"
          aria-pressed={weather === 'rain'}
          onClick={() => setWeather('rain')}
          className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition ${
            weather === 'rain'
              ? 'bg-sky-400/25 text-sky-200'
              : 'text-stone-300 hover:bg-white/10'
          }`}
        >
          <CloudRain className="h-3.5 w-3.5" />
          Rain
        </button>
      </div>

      <div className="hidden h-6 w-px bg-white/15 sm:block" />

      {/* Simulation Speed & Utility Toggles */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={simSpeed === 0 ? 'Play simulation' : 'Pause simulation'}
          aria-pressed={simSpeed === 0}
          onClick={togglePlayPause}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-stone-100 transition hover:bg-white/20"
        >
          {simSpeed === 0 ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>

        <div className="flex items-center gap-0.5 rounded-lg bg-white/5 p-0.5 text-[11px]">
          {([1, 2] as const).map((spd) => (
            <button
              key={spd}
              type="button"
              aria-pressed={simSpeed === spd}
              onClick={() => setSimSpeed(spd)}
              className={`rounded-md px-1.5 py-0.5 font-medium transition ${
                simSpeed === spd ? 'bg-amber-400/25 text-amber-200' : 'text-stone-300 hover:bg-white/10'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        <button
          type="button"
          title="Toggle Tilt-Shift Miniature Blur"
          aria-label="Toggle tilt-shift depth of field"
          aria-pressed={tiltShiftEnabled}
          onClick={toggleTiltShift}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
            tiltShiftEnabled
              ? 'bg-amber-400/25 text-amber-200'
              : 'bg-white/5 text-stone-400 hover:bg-white/10'
          }`}
        >
          <Focus className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          title="Toggle Ambient City Sound"
          aria-label="Toggle ambient audio"
          aria-pressed={soundEnabled}
          onClick={toggleSound}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
            soundEnabled
              ? 'bg-emerald-400/25 text-emerald-200'
              : 'bg-white/5 text-stone-400 hover:bg-white/10'
          }`}
        >
          {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          title="Toggle High Quality PostFX & Shadows"
          aria-label="Toggle graphics quality"
          aria-pressed={highQuality}
          onClick={toggleHighQuality}
          className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
            highQuality
              ? 'bg-amber-400/25 text-amber-200'
              : 'bg-white/5 text-stone-400 hover:bg-white/10'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
