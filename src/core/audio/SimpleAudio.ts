export class SimpleAudio {
  private audioContext: AudioContext | null = null;

  private initialized = false;

  private buffers: Map<string, AudioBuffer> = new Map();

  private muted = false;

  public init(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    if (this.initialized) {
      return true;
    }

    const AudioContextClass =
      (window.AudioContext as typeof AudioContext | undefined) ||
      (window.webkitAudioContext as typeof AudioContext | undefined);

    if (!AudioContextClass) {
      return false;
    }

    try {
      this.audioContext = new AudioContextClass();
      this.initialized = true;

      // Auto-resume on first user interaction
      if (this.audioContext.state === 'suspended') {
        const resumeOnInteraction = () => {
          this.resume().catch(() => {
            // Silently ignore resume errors
          });
          document.removeEventListener('click', resumeOnInteraction);
          document.removeEventListener('touchstart', resumeOnInteraction);
          document.removeEventListener('keydown', resumeOnInteraction);
        };

        document.addEventListener('click', resumeOnInteraction);
        document.addEventListener('touchstart', resumeOnInteraction);
        document.addEventListener('keydown', resumeOnInteraction);
      }

      return true;
    } catch (error) {
      console.warn('Unable to start audio context', error);
      return false;
    }
  }

  public async resume(): Promise<void> {
    if (!this.audioContext) {
      return;
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public async decode(key: string, data: ArrayBuffer): Promise<void> {
    if (!this.initialized || !this.audioContext) {
      return;
    }

    try {
      const buffer = await this.audioContext.decodeAudioData(data.slice(0));
      this.buffers.set(key, buffer);
    } catch (error) {
      console.warn(`Unable to decode audio buffer for ${key}`, error);
    }
  }

  public async playMatch(): Promise<void> {
    if (this.buffers.has('match')) {
      await this.playBuffer('match');
      return;
    }

    await this.playTone(660, 0.18, 0.18);
  }

  public async playCountdown(): Promise<void> {
    if (this.buffers.has('countdown')) {
      await this.playBuffer('countdown');
      return;
    }

    await this.playTone(220, 0.3, 0.16);
  }

  public async playSuccess(): Promise<void> {
    if (this.buffers.has('success')) {
      await this.playBuffer('success');
      return;
    }

    await this.playSequence([
      { frequency: 440, duration: 0.12, volume: 0.12 },
      { frequency: 560, duration: 0.12, volume: 0.12 },
      { frequency: 720, duration: 0.2, volume: 0.18 },
    ]);
  }

  public async playMismatch(): Promise<void> {
    if (this.buffers.has('mismatch')) {
      await this.playBuffer('mismatch');
      return;
    }

    await this.playSequence([
      { frequency: 330, duration: 0.12, volume: 0.12 },
      { frequency: 210, duration: 0.24, volume: 0.16 },
    ]);
  }

  private async playSequence(
    tones: ReadonlyArray<{ frequency: number; duration: number; volume: number }>,
  ): Promise<void> {
    for (const tone of tones) {
      // eslint-disable-next-line no-await-in-loop
      await this.playTone(tone.frequency, tone.duration, tone.volume);
    }
  }

  private playBuffer(key: string): Promise<void> {
    if (!this.initialized || !this.audioContext || this.muted) {
      return Promise.resolve();
    }

    const buffer = this.buffers.get(key);
    if (!buffer) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const source = this.audioContext!.createBufferSource();
      const gainNode = this.audioContext!.createGain();
      source.buffer = buffer;
      source.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);
      gainNode.gain.setValueAtTime(0.8, this.audioContext!.currentTime);
      source.addEventListener('ended', () => resolve());
      source.start();
    });
  }

  private playTone(frequency: number, duration: number, volume: number): Promise<void> {
    if (!this.initialized || !this.audioContext || this.muted) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      const oscillator = this.audioContext!.createOscillator();
      const gainNode = this.audioContext!.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext!.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      const now = this.audioContext!.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);

      oscillator.start(now);
      oscillator.stop(now + duration);
      oscillator.addEventListener('ended', () => {
        resolve();
      });
    });
  }
}

export const simpleAudio = new SimpleAudio();

export default simpleAudio;
