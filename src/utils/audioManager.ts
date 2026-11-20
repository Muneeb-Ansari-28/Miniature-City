import type { WeatherMode } from '@/sim/types';

/**
 * Procedural Web Audio ambient soundscape (gentle distant city hum + filtered rain pink noise).
 * Strictly opt-in: remains silent and uninitialized until the user enables audio via HUD.
 */
class CityAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private cityGain: GainNode | null = null;
  private rainGain: GainNode | null = null;
  private isEnabled = false;
  private weather: WeatherMode = 'clear';

  private initContext(): void {
    if (this.ctx || typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const masterGain = ctx.createGain();
    masterGain.gain.value = 0;
    masterGain.connect(ctx.destination);

    // Build a reusable 2-second pink-ish noise buffer
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.02) * 0.25;
    }

    // Warm low-passed city hum
    const citySource = ctx.createBufferSource();
    citySource.buffer = buffer;
    citySource.loop = true;
    const cityFilter = ctx.createBiquadFilter();
    cityFilter.type = 'lowpass';
    cityFilter.frequency.value = 260;
    const cityGain = ctx.createGain();
    cityGain.gain.value = 0.35;
    citySource.connect(cityFilter);
    cityFilter.connect(cityGain);
    cityGain.connect(masterGain);
    citySource.start();

    // Soft band-passed rain hiss
    const rainSource = ctx.createBufferSource();
    rainSource.buffer = buffer;
    rainSource.loop = true;
    const rainFilter = ctx.createBiquadFilter();
    rainFilter.type = 'bandpass';
    rainFilter.frequency.value = 1400;
    rainFilter.Q.value = 0.6;
    const rainGain = ctx.createGain();
    rainGain.gain.value = 0;
    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(masterGain);
    rainSource.start();

    this.ctx = ctx;
    this.masterGain = masterGain;
    this.cityGain = cityGain;
    this.rainGain = rainGain;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled) {
      this.initContext();
      if (this.ctx?.state === 'suspended') {
        void this.ctx.resume();
      }
    }
    this.syncGains();
  }

  setWeather(weather: WeatherMode): void {
    this.weather = weather;
    this.syncGains();
  }

  private syncGains(): void {
    if (!this.ctx || !this.masterGain || !this.cityGain || !this.rainGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.setTargetAtTime(this.isEnabled ? 0.28 : 0.0, now, 0.25);
    this.rainGain.gain.setTargetAtTime(this.weather === 'rain' ? 0.55 : 0.0, now, 0.35);
  }

  dispose(): void {
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
      this.cityGain = null;
      this.rainGain = null;
    }
  }
}

export const cityAudioManager = new CityAudioManager();
