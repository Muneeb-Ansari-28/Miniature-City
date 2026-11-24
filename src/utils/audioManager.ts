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
  private birdGain: GainNode | null = null;
  private birdTimer: ReturnType<typeof setTimeout> | null = null;
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

    const birdGain = ctx.createGain();
    birdGain.gain.value = 0.16;
    birdGain.connect(masterGain);

    this.ctx = ctx;
    this.masterGain = masterGain;
    this.cityGain = cityGain;
    this.rainGain = rainGain;
    this.birdGain = birdGain;
  }

  private scheduleBirdChirp(): void {
    if (!this.isEnabled || !this.ctx || this.birdTimer !== null) return;

    this.birdTimer = setTimeout(() => {
      this.birdTimer = null;
      if (!this.isEnabled || !this.ctx || !this.birdGain) return;

      const ctx = this.ctx;
      const startAt = ctx.currentTime;
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();
      const panner = ctx.createStereoPanner();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(2400 + Math.random() * 500, startAt);
      oscillator.frequency.exponentialRampToValueAtTime(3300 + Math.random() * 500, startAt + 0.055);
      oscillator.frequency.exponentialRampToValueAtTime(1900 + Math.random() * 300, startAt + 0.19);
      envelope.gain.setValueAtTime(0.0001, startAt);
      envelope.gain.exponentialRampToValueAtTime(0.07, startAt + 0.025);
      envelope.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.21);
      panner.pan.value = (Math.random() - 0.5) * 1.2;

      oscillator.connect(envelope);
      envelope.connect(panner);
      panner.connect(this.birdGain);
      oscillator.start(startAt);
      oscillator.stop(startAt + 0.22);

      this.scheduleBirdChirp();
    }, 4500 + Math.random() * 8000);
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled) {
      this.initContext();
      if (this.ctx?.state === 'suspended') {
        void this.ctx.resume();
      }
      this.scheduleBirdChirp();
    } else if (this.birdTimer !== null) {
      clearTimeout(this.birdTimer);
      this.birdTimer = null;
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
    this.birdGain?.gain.setTargetAtTime(this.weather === 'rain' ? 0.07 : 0.16, now, 0.4);
  }

  dispose(): void {
    if (this.birdTimer !== null) {
      clearTimeout(this.birdTimer);
      this.birdTimer = null;
    }
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
      this.masterGain = null;
      this.cityGain = null;
      this.rainGain = null;
      this.birdGain = null;
    }
  }
}

export const cityAudioManager = new CityAudioManager();
