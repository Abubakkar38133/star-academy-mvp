// Kid-friendly voice narration and speech synthesis service

export type VoiceStateListener = (isSpeaking: boolean, mouthLevel: number) => void;

class VoiceService {
  private enabled: boolean = true;
  private voice: SpeechSynthesisVoice | null = null;
  private rate: number = 0.92; // Clear, lively pace easy for kids to follow
  private pitch: number = 1.22; // Cute, friendly, cheerful cartoon owl tone
  private speaking: boolean = false;
  private listeners: Set<VoiceStateListener> = new Set();
  private mouthAnimInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => this.initVoices();
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      const list = window.speechSynthesis.getVoices();
      if (!list.length) return;

      const enVoices = list.filter(v => /^en/i.test(v.lang));
      const pool = enVoices.length ? enVoices : list;

      // Prioritize natural, expressive, friendly voices loved by children
      const preferredKeywords = [
        "ana", // Microsoft Ana (specifically designed for children/education)
        "jenny", // Microsoft Jenny (Natural)
        "aria", // Microsoft Aria (Natural)
        "samantha", // Apple Samantha
        "victoria", // Apple Victoria
        "ava", // Apple Ava
        "allison", // Apple Allison
        "google us english",
        "google uk english female",
        "karen",
        "tessa",
        "serena",
        "moira",
        "fiona",
        "zira",
        "hazel",
      ];

      for (const pref of preferredKeywords) {
        const found = pool.find(v => v.name.toLowerCase().includes(pref));
        if (found) {
          this.voice = found;
          return;
        }
      }

      // Fallback: prioritize any natural or female voice
      this.voice = pool.find(v => /natural|neural|female/i.test(v.name)) || pool[0];
    } catch {
      // Safe fallback
    }
  }

  public subscribe(listener: VoiceStateListener): () => void {
    this.listeners.add(listener);
    listener(this.speaking, 0);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(isSpeaking: boolean, mouthLevel: number) {
    this.speaking = isSpeaking;
    this.listeners.forEach(cb => {
      try {
        cb(isSpeaking, mouthLevel);
      } catch {
        // ignore callback error
      }
    });
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    if (!val) {
      this.stop();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public isSpeaking(): boolean {
    return this.speaking;
  }

  public setRate(rate: number) {
    this.rate = Math.max(0.65, Math.min(1.15, rate));
  }

  public setPitch(pitch: number) {
    this.pitch = Math.max(0.8, Math.min(1.5, pitch));
  }

  public stop() {
    if (this.mouthAnimInterval) {
      clearInterval(this.mouthAnimInterval);
      this.mouthAnimInterval = null;
    }
    this.notify(false, 0);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }

  /**
   * Pre-format text to ensure it's easy for kids to understand:
   * Expands abbreviations, standardizes punctuation pauses, avoids weird TTS acronym reads.
   */
  public formatTextForKids(text: string): string {
    if (!text) return '';
    return text
      .replace(/\bU\.S\.A\.\b/gi, 'U. S. A.')
      .replace(/\bU\.S\.\b/gi, 'U. S.')
      .replace(/\bUS\b/g, 'U. S.')
      .replace(/\be\.g\.\b/gi, 'for example')
      .replace(/\bi\.e\.\b/gi, 'that is')
      .replace(/\bDr\.\b/gi, 'Doctor')
      .replace(/\bMt\.\b/gi, 'Mount')
      .replace(/\bSt\.\b/gi, 'Saint')
      .replace(/\bapprox\.\b/gi, 'approximately')
      .replace(/\bmph\b/gi, 'miles per hour')
      .replace(/\bkm\/h\b/gi, 'kilometers per hour')
      .replace(/&/g, ' and ')
      .replace(/\+/g, ' plus ')
      .replace(/=/g, ' equals ')
      .replace(/—/g, ', ')
      .trim();
  }

  public say(text: string, onEnd?: () => void) {
    if (!this.enabled || !text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      if (onEnd) onEnd();
      return;
    }

    try {
      this.stop();

      const spokenText = this.formatTextForKids(text);
      const utterance = new SpeechSynthesisUtterance(spokenText);

      if (this.voice) {
        utterance.voice = this.voice;
      }
      utterance.rate = this.rate;
      utterance.pitch = this.pitch;
      utterance.volume = 1.0;

      // Start synchronized mouth flapping animation
      this.notify(true, 0.5);
      this.mouthAnimInterval = setInterval(() => {
        const randLevel = Math.random() > 0.35 ? 0.4 + Math.random() * 0.5 : 0.1;
        this.notify(true, randLevel);
      }, 120);

      utterance.onend = () => {
        if (this.mouthAnimInterval) {
          clearInterval(this.mouthAnimInterval);
          this.mouthAnimInterval = null;
        }
        this.notify(false, 0);
        if (onEnd) onEnd();
      };

      utterance.onerror = () => {
        if (this.mouthAnimInterval) {
          clearInterval(this.mouthAnimInterval);
          this.mouthAnimInterval = null;
        }
        this.notify(false, 0);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      this.stop();
      if (onEnd) onEnd();
    }
  }
}

export const voice = new VoiceService();
