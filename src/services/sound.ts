class SoundService {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private enabled: boolean = true;

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Audio compressor for loud, clear, punchy sound without distortion
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-12, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      this.master = this.ctx.createGain();
      // Loud, clear volume tuned for kids on mobile and laptop speakers
      this.master.gain.value = 0.75;

      this.master.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    } catch {
      // Audio not supported or blocked
    }
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private playTone(freq: number, offsetSec: number, durationSec: number, type: OscillatorType = 'sine', peakGain: number = 0.32) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx || !this.master) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;

      osc.connect(gain);
      gain.connect(this.master);

      const startTime = this.ctx.currentTime + offsetSec;
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

      osc.start(startTime);
      osc.stop(startTime + durationSec + 0.03);
    } catch {
      // safely ignore
    }
  }

  public tap() {
    this.playTone(520, 0, 0.09, 'sine', 0.28);
  }

  public click() {
    this.tap();
  }

  public pick() {
    this.playTone(659.25, 0, 0.12, 'triangle', 0.32);
  }

  public good() {
    // Gentle cheerful major chord
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      this.playTone(freq, idx * 0.08, 0.45, 'sine', 0.30);
    });
  }

  public notYet() {
    this.playTone(329.63, 0, 0.25, 'triangle', 0.22);
  }

  public finish() {
    // Grand celebratory chime arpeggio
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
      this.playTone(freq, idx * 0.08, 0.55, 'sine', 0.34);
    });
  }

  public cheer() {
    this.finish();
  }

  public fanfare() {
    this.finish();
  }

  public coin() {
    [987.77, 1318.51].forEach((freq, idx) => {
      this.playTone(freq, idx * 0.07, 0.32, 'triangle', 0.35);
    });
  }

  public swoosh() {
    this.playTone(400, 0, 0.14, 'triangle', 0.18);
  }

  // --- Cute Owl Acoustic Reaction Sounds ---

  // Warm gentle owl hoot (Hooo... Hoo!)
  public owlHoot() {
    this.playTone(440, 0, 0.32, 'sine', 0.32);
    this.playTone(392, 0.35, 0.48, 'sine', 0.35);
  }

  // Happy bright owl chirp
  public owlChirp() {
    this.playTone(880, 0, 0.09, 'triangle', 0.30);
    this.playTone(1318.5, 0.08, 0.14, 'sine', 0.32);
  }

  // Playful giggling chime cascade
  public owlGiggle() {
    [659.25, 880, 1046.5, 1318.5, 987.77, 1318.5].forEach((freq, idx) => {
      this.playTone(freq, idx * 0.06, 0.13, 'sine', 0.26);
    });
  }

  // Light airy wing flutter
  public owlFlutter() {
    [320, 420, 360, 480, 400].forEach((freq, idx) => {
      this.playTone(freq, idx * 0.04, 0.10, 'triangle', 0.20);
    });
  }

  // Funny comical angry squawk (pouty / grumpy beak)
  public owlAnger() {
    [392, 349, 329, 293].forEach((freq, idx) => {
      this.playTone(freq, idx * 0.06, 0.12, 'sawtooth', 0.24);
    });
  }

  // Sweet kawaii cutie-pie chime cascade
  public owlCutiePie() {
    [783.99, 987.77, 1174.66, 1567.98].forEach((freq, idx) => {
      this.playTone(freq, idx * 0.07, 0.35, 'sine', 0.28);
    });
  }

  // Whimsical sad / pouty slide (need a hug!)
  public owlSad() {
    [587.33, 523.25, 493.88, 440].forEach((freq, idx) => {
      this.playTone(freq, idx * 0.12, 0.32, 'sine', 0.22);
    });
  }

  // Cute sleepy snore (soft rhythmic breathing whistle Zzz)
  public owlSnore() {
    this.playTone(280, 0, 0.6, 'sine', 0.16);
    this.playTone(340, 0.8, 0.5, 'sine', 0.12);
  }

  // Sunny cheerful wake-up chime!
  public owlWakeUp() {
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      this.playTone(freq, idx * 0.07, 0.38, 'triangle', 0.32);
    });
  }

  // Upbeat 4-beat owl disco dance party!
  public owlDanceBeat() {
    // Kick & bass rhythm
    this.playTone(180, 0, 0.15, 'triangle', 0.35);
    this.playTone(587.33, 0.12, 0.12, 'sine', 0.28);
    this.playTone(180, 0.25, 0.15, 'triangle', 0.35);
    this.playTone(880, 0.37, 0.14, 'sine', 0.30);
    this.playTone(220, 0.50, 0.15, 'triangle', 0.35);
    this.playTone(1046.5, 0.62, 0.22, 'sine', 0.32);
  }

  // Cute munching / eating snack sound
  public owlMunch() {
    [600, 520, 680, 560].forEach((freq, idx) => {
      this.playTone(freq, idx * 0.08, 0.08, 'triangle', 0.25);
    });
  }

  // Bouncy spring hop sound
  public owlBoing() {
    [260, 340, 440, 560, 720].forEach((freq, idx) => {
      this.playTone(freq, idx * 0.03, 0.07, 'sine', 0.28);
    });
  }

  // Soft affectionate purring / trill when gently petted or stroked
  public owlPurr() {
    [380, 420, 400, 440, 410, 450, 420].forEach((freq, idx) => {
      this.playTone(freq, idx * 0.04, 0.06, 'sine', 0.18);
    });
  }
}

export const sound = new SoundService();
