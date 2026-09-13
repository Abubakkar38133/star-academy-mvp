// Voice mimicry service for Mascot Buddy (Talking Tom style voice copy & animations)

export interface VoiceMimicState {
  isRecording: boolean;
  isPlaying: boolean;
  audioLevel: number;
  hasAudio: boolean;
  transcribedText?: string;
  error: string | null;
}

class VoiceMimicService {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private currentSource: AudioBufferSourceNode | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private stream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private animFrameId: number | null = null;
  private recognition: any = null;
  private onStateChangeCallback: ((state: VoiceMimicState) => void) | null = null;

  public state: VoiceMimicState = {
    isRecording: false,
    isPlaying: false,
    audioLevel: 0,
    hasAudio: false,
    transcribedText: undefined,
    error: null,
  };

  private notify() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({ ...this.state });
    }
  }

  public subscribe(cb: (state: VoiceMimicState) => void) {
    this.onStateChangeCallback = cb;
    cb({ ...this.state });
    return () => {
      if (this.onStateChangeCallback === cb) {
        this.onStateChangeCallback = null;
      }
    };
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioContext = new AudioCtx();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  // Start recording child's voice
  public async startListening(): Promise<boolean> {
    try {
      this.stopPlayback();
      this.initAudioContext();

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        this.state.error = 'Microphone access is not supported in this browser.';
        this.notify();
        return false;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.audioChunks = [];
      this.state.transcribedText = undefined;

      // Start Web Speech Recognition if supported
      if (typeof window !== 'undefined') {
        const SpeechRec =
          (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRec) {
          try {
            this.recognition = new SpeechRec();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            this.recognition.onresult = (event: any) => {
              const transcript = event.results[0]?.[0]?.transcript;
              if (transcript) {
                this.state.transcribedText = transcript;
                this.notify();
              }
            };
            this.recognition.start();
          } catch {
            // Fallback gracefully
          }
        }
      }

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      this.mediaRecorder = mimeType
        ? new MediaRecorder(this.stream, { mimeType })
        : new MediaRecorder(this.stream);

      this.mediaRecorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        this.state.isRecording = false;
        this.notify();
        await this.processRecordedAudio();
      };

      this.mediaRecorder.start(250);
      this.state.isRecording = true;
      this.state.error = null;
      this.notify();

      // Start volume monitor during recording
      this.monitorAudioLevel(this.stream);
      return true;
    } catch (err: unknown) {
      console.warn('Microphone error:', err);
      this.state.isRecording = false;
      this.state.error = 'Please allow microphone access so Buddy can hear and copy your voice!';
      this.notify();
      return false;
    }
  }

  // Stop recording and trigger Talking Tom playback
  public stopListening() {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore
      }
    }
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      try {
        this.mediaRecorder.stop();
      } catch (e) {
        console.warn(e);
      }
    }
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.state.audioLevel = 0;
    this.notify();
  }

  // Convert blob to AudioBuffer and auto-play in cartoon pitch
  private async processRecordedAudio() {
    if (this.audioChunks.length === 0) return;
    try {
      const blob = new Blob(this.audioChunks, { type: this.audioChunks[0].type || 'audio/webm' });
      const arrayBuffer = await blob.arrayBuffer();
      const ctx = this.initAudioContext();
      this.currentBuffer = await ctx.decodeAudioData(arrayBuffer);
      this.state.hasAudio = true;
      this.notify();

      // Automatically play back in cartoon pitch (Talking Tom style!)
      await this.playCartoonVoice(1.24);
    } catch (e) {
      console.warn('Audio decoding failed', e);
      this.state.error = 'Could not process audio. Try speaking louder!';
      this.notify();
    }
  }

  // Playback with pitch & speed shift (1.24x for clear, lovable Talking Tom cartoon voice)
  public playCartoonVoice(pitchRate: number = 1.24): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentBuffer) {
        resolve();
        return;
      }
      this.stopPlayback();
      const ctx = this.initAudioContext();

      const source = ctx.createBufferSource();
      source.buffer = this.currentBuffer;
      source.playbackRate.value = pitchRate;

      // Connect to gain boost and compressor for loud, clear playback
      const gainNode = ctx.createGain();
      gainNode.gain.value = 1.9; // Loud, clear voice for kids
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.setValueAtTime(-10, ctx.currentTime);
      comp.ratio.setValueAtTime(6, ctx.currentTime);

      // Connect to analyser for mouth animations
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;

      source.connect(gainNode);
      gainNode.connect(comp);
      comp.connect(analyser);
      analyser.connect(ctx.destination);

      this.currentSource = source;
      this.state.isPlaying = true;
      this.notify();

      // Monitor playback volume for mouth flapping
      const pcmData = new Uint8Array(analyser.frequencyBinCount);
      const checkPlayback = () => {
        if (!this.state.isPlaying) return;
        analyser.getByteFrequencyData(pcmData);
        let sum = 0;
        for (let i = 0; i < pcmData.length; i++) {
          sum += pcmData[i];
        }
        const avg = sum / pcmData.length;
        this.state.audioLevel = Math.min(1, avg / 80);
        this.notify();
        this.animFrameId = requestAnimationFrame(checkPlayback);
      };
      this.animFrameId = requestAnimationFrame(checkPlayback);

      source.onended = () => {
        this.state.isPlaying = false;
        this.state.audioLevel = 0;
        this.currentSource = null;
        if (this.animFrameId) {
          cancelAnimationFrame(this.animFrameId);
          this.animFrameId = null;
        }
        this.notify();
        resolve();
      };

      source.start(0);
    });
  }

  public stopPlayback() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch {
        // ignore
      }
      this.currentSource = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.state.isPlaying = false;
    this.state.audioLevel = 0;
    this.notify();
  }

  private monitorAudioLevel(stream: MediaStream) {
    try {
      const ctx = this.initAudioContext();
      const micSource = ctx.createMediaStreamSource(stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      micSource.connect(this.analyser);

      const buffer = new Uint8Array(this.analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!this.state.isRecording || !this.analyser) return;
        this.analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        this.state.audioLevel = Math.min(1, avg / 70);
        this.notify();
        this.animFrameId = requestAnimationFrame(updateLevel);
      };
      this.animFrameId = requestAnimationFrame(updateLevel);
    } catch {
      // ignore
    }
  }

  // Mascot fun kid jokes and speech lines
  public tellMascotJoke(): string {
    const jokes = [
      "Why did the teacher wear sunglasses? Because her students were so bright!",
      "How do bees get to school? On the school buzz!",
      "Why was the math book sad? Because it had too many problems!",
      "What do you call a dinosaur that knows a lot of words? A thesaurus!",
      "Why is the sky blue? Because sunlight scatters blue light more than other colors!",
      "What building in America has the most stories? The library!",
      "What did one wall say to the other wall? I will meet you at the corner!",
      "Why did the cookie go to the doctor? Because it felt crummy!",
    ];
    const pick = jokes[Math.floor(Math.random() * jokes.length)];
    this.speakAsMascot(pick);
    return pick;
  }

  // Cheerful cartoon mascot speech via SpeechSynthesis (tuned for high kid-comprehension)
  public speakAsMascot(text: string) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Expand abbreviations and format text for young listeners
      const cleanText = text
        .replace(/\bU\.S\.A\.\b/gi, 'U. S. A.')
        .replace(/\bU\.S\.\b/gi, 'U. S.')
        .replace(/\bUS\b/g, 'U. S.')
        .replace(/\be\.g\.\b/gi, 'for example')
        .replace(/\bi\.e\.\b/gi, 'that is')
        .replace(/&/g, ' and ')
        .trim();

      const u = new SpeechSynthesisUtterance(cleanText);
      u.pitch = 1.18; // Warm, friendly, upbeat cartoon owl pitch
      u.rate = 0.88; // Gentle, clear speed easy for young kids to understand
      u.volume = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred = ["ana", "jenny", "aria", "samantha", "victoria", "ava", "google us english", "google uk english female"];
      let chosenVoice = null;
      for (const p of preferred) {
        const f = voices.find(v => v.name.toLowerCase().includes(p));
        if (f) {
          chosenVoice = f;
          break;
        }
      }
      if (!chosenVoice) {
        chosenVoice = voices.find(v => /female|natural/i.test(v.name));
      }
      if (chosenVoice) u.voice = chosenVoice;

      this.state.isPlaying = true;
      this.notify();

      // Dynamic mouth flapping synced with speech
      let flapInterval: NodeJS.Timeout | null = setInterval(() => {
        this.state.audioLevel = Math.random() > 0.3 ? 0.4 + Math.random() * 0.5 : 0.1;
        this.notify();
      }, 120);

      u.onend = () => {
        if (flapInterval) clearInterval(flapInterval);
        this.state.isPlaying = false;
        this.state.audioLevel = 0;
        this.notify();
      };

      u.onerror = () => {
        if (flapInterval) clearInterval(flapInterval);
        this.state.isPlaying = false;
        this.state.audioLevel = 0;
        this.notify();
      };

      window.speechSynthesis.speak(u);
    } catch (e) {
      console.warn(e);
    }
  }
}

export const voiceMimic = new VoiceMimicService();
