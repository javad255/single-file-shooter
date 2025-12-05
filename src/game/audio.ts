class AudioManager {
  private audioContext: AudioContext | null = null;
  private masterVolume = 0.3;

  private initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'square',
    volumeEnvelope: number[] = [1, 0]
  ) {
    try {
      const ctx = this.initContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volumeEnvelope[0] * this.masterVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        Math.max(volumeEnvelope[1] * this.masterVolume, 0.001),
        ctx.currentTime + duration
      );

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (e) {
      // Audio context not available
    }
  }

  private playNoise(duration: number, volume: number = 0.5) {
    try {
      const ctx = this.initContext();
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      const gainNode = ctx.createGain();

      source.buffer = buffer;
      gainNode.gain.setValueAtTime(volume * this.masterVolume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      source.connect(gainNode);
      gainNode.connect(ctx.destination);

      source.start(ctx.currentTime);
    } catch (e) {
      // Audio context not available
    }
  }

  shoot() {
    this.playTone(880, 0.05, 'square', [0.3, 0.01]);
    this.playTone(440, 0.05, 'square', [0.2, 0.01]);
  }

  enemyShoot() {
    this.playTone(220, 0.08, 'sawtooth', [0.2, 0.01]);
  }

  explosion() {
    this.playNoise(0.3, 0.4);
    this.playTone(100, 0.2, 'sine', [0.5, 0.01]);
  }

  bossExplosion() {
    this.playNoise(0.8, 0.6);
    this.playTone(80, 0.5, 'sine', [0.7, 0.01]);
    this.playTone(60, 0.6, 'sine', [0.5, 0.01]);
  }

  playerHit() {
    this.playTone(200, 0.3, 'sawtooth', [0.5, 0.01]);
    this.playTone(100, 0.4, 'sawtooth', [0.4, 0.01]);
  }

  powerUp() {
    this.playTone(523, 0.1, 'sine', [0.3, 0.1]);
    setTimeout(() => this.playTone(659, 0.1, 'sine', [0.3, 0.1]), 100);
    setTimeout(() => this.playTone(784, 0.15, 'sine', [0.3, 0.01]), 200);
  }

  waveComplete() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', [0.3, 0.1]), i * 100);
    });
  }

  gameOver() {
    const notes = [392, 349, 330, 262];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, 'sawtooth', [0.4, 0.01]), i * 200);
    });
  }

  resume() {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
  }
}

export const audioManager = new AudioManager();
