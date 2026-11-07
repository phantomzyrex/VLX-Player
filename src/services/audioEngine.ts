/**
 * Web Audio Engine for VLX Player
 * Provides 10-band Equalizer, 200% Gain Volume Boost, and AnalyserNode for Visualizer
 */

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: Record<string, number[]> = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
  'Cinema': [4, 3, 0, -2, -1, 1, 3, 4, 3, 2],
  'Vocal': [-3, -2, -1, 2, 5, 4, 3, 1, 0, -2],
  'Rock': [5, 3, 2, 0, -1, -1, 1, 3, 4, 5],
  'Electronic': [6, 4, 1, 0, -2, 2, 1, 2, 4, 5],
  'Acoustic': [3, 2, 1, 1, 2, 2, 3, 3, 2, 1],
  'Night Mode': [-6, -4, -2, 1, 3, 2, 0, -2, -4, -6],
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private gainNode: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private currentVideoElement: HTMLVideoElement | null = null;
  private isConnected: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public attach(videoElement: HTMLVideoElement) {
    if (this.currentVideoElement === videoElement && this.isConnected) {
      return;
    }

    try {
      this.initContext();
      if (!this.ctx) return;

      // Disconnect prior if needed
      if (this.source && this.currentVideoElement !== videoElement) {
        try {
          this.source.disconnect();
        } catch (_) {}
        this.source = null;
      }

      this.currentVideoElement = videoElement;

      // Create nodes if not created
      if (!this.gainNode) {
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.value = 1.0;
      }

      if (!this.analyser) {
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
        this.analyser.smoothingTimeConstant = 0.8;
      }

      if (this.filters.length === 0) {
        this.filters = EQ_FREQUENCIES.map((freq) => {
          const filter = this.ctx!.createBiquadFilter();
          filter.type = 'peaking';
          filter.frequency.value = freq;
          filter.Q.value = 1.4;
          filter.gain.value = 0;
          return filter;
        });
      }

      // MediaElementSourceNode can only be created ONCE per HTMLMediaElement
      if (!this.source) {
        try {
          this.source = this.ctx.createMediaElementSource(videoElement);
        } catch (e) {
          // If already connected elsewhere or error
          console.warn('MediaElementSource already exists or failed:', e);
          return;
        }
      }

      // Chain: Source -> Filter 0 -> Filter 1 ... -> Filter 9 -> GainNode -> AnalyserNode -> Destination
      let previousNode: AudioNode = this.source;
      for (const filter of this.filters) {
        previousNode.connect(filter);
        previousNode = filter;
      }

      previousNode.connect(this.gainNode);
      this.gainNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      this.isConnected = true;
    } catch (err) {
      console.warn('AudioEngine attach error (likely CORS or cross-origin stream restriction):', err);
    }
  }

  public setVolume(volume: number) {
    // volume is 0.0 to 2.0 (200% boost)
    this.initContext();
    if (this.gainNode && this.ctx) {
      // Smooth transition to avoid clicking
      this.gainNode.gain.setTargetAtTime(Math.max(0, Math.min(2.0, volume)), this.ctx.currentTime, 0.02);
    }
  }

  public setFilterGains(gains: number[]) {
    this.initContext();
    if (!this.ctx || this.filters.length === 0) return;
    gains.forEach((gain, index) => {
      if (this.filters[index]) {
        this.filters[index].gain.setTargetAtTime(
          Math.max(-15, Math.min(15, gain)),
          this.ctx!.currentTime,
          0.02
        );
      }
    });
  }

  public getVisualizerData(dataArray: Uint8Array): boolean {
    if (!this.analyser) return false;
    this.analyser.getByteFrequencyData(dataArray as any);
    return true;
  }

  public getWaveformData(dataArray: Uint8Array): boolean {
    if (!this.analyser) return false;
    this.analyser.getByteTimeDomainData(dataArray as any);
    return true;
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }
}

export const audioEngine = new AudioEngine();
