export interface SoundPreferences {
  music: boolean;
  effects: boolean;
}

// Original procedural game music: no remote audio, tracking or paid service.
// AudioContext is created/resumed only from a user gesture. Each note has a
// short lifetime, and all scheduled voices are canceled on pause/home/unmount.
class GameSound {
  private context?: AudioContext;
  private musicBus?: GainNode;
  private effectsBus?: GainNode;
  private voices = new Map<OscillatorNode, 'music' | 'effect'>();
  private timer?: number;
  private nextBeat = 0;
  private beat = 0;
  private active = false;
  private paused = false;
  private urgent = false;
  private narrating = false;
  private preferences: SoundPreferences = { music: true, effects: true };

  private unlock() {
    try {
      const Constructor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Constructor) return false;
      if (!this.context) {
        this.context = new Constructor();
        this.musicBus = this.context.createGain();
        this.effectsBus = this.context.createGain();
        this.musicBus.connect(this.context.destination);
        this.effectsBus.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
      this.volume();
      return true;
    } catch {
      return false;
    }
  }

  private volume() {
    if (!this.context) return;
    const time = this.context.currentTime;
    // Pronunciation stays in front; neither mute toggle affects word MP3s.
    this.musicBus!.gain.setTargetAtTime(
      this.preferences.music && !this.paused ? (this.narrating ? 0.012 : 0.075) : 0,
      time,
      0.04,
    );
    this.effectsBus!.gain.setTargetAtTime(
      this.preferences.effects && !this.paused ? 0.18 : 0,
      time,
      0.015,
    );
  }

  private note(
    frequency: number,
    start: number,
    duration: number,
    type: OscillatorType,
    channel: 'music' | 'effect',
    strength = 0.4,
    endFrequency?: number,
  ) {
    const context = this.context!;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency)
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(strength, start + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(channel === 'music' ? this.musicBus! : this.effectsBus!);
    this.voices.set(oscillator, channel);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
      this.voices.delete(oscillator);
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
  }

  private cancelVoices(channel?: 'music' | 'effect') {
    for (const [voice, kind] of this.voices) {
      if (channel && channel !== kind) continue;
      try {
        voice.stop();
      } catch {
        /* already ended */
      }
    }
  }

  private schedule = () => {
    if (
      !this.active ||
      this.paused ||
      !this.preferences.music ||
      !this.context ||
      this.context.state !== 'running'
    )
      return;
    const now = this.context.currentTime;
    if (this.nextBeat < now - 0.1) this.nextBeat = now;
    const melody = [
      293.66, 440, 587.33, 440, 349.23, 523.25, 698.46, 523.25, 261.63, 392, 523.25, 392, 277.18,
      415.3, 554.37, 415.3,
    ];
    const step = 60 / (this.urgent ? 160 : 126) / 2;
    while (this.nextBeat < now + 0.15) {
      const index = this.beat % melody.length;
      this.note(melody[index], this.nextBeat, step * 0.7, 'triangle', 'music', 0.34);
      if (this.beat % 4 === 0)
        this.note(melody[index] / 2, this.nextBeat, step * 1.5, 'sine', 'music', 0.45);
      if (this.beat % 2 === 0) this.note(95, this.nextBeat, 0.07, 'sine', 'music', 0.55, 45);
      this.beat++;
      this.nextBeat += step;
    }
  };

  start(preferences: SoundPreferences) {
    this.stop();
    this.active = true;
    this.paused = false;
    this.preferences = preferences;
    this.beat = 0;
    this.urgent = false;
    if (!this.unlock()) return;
    this.nextBeat = this.context!.currentTime;
    this.timer = window.setInterval(this.schedule, 80);
    this.schedule();
  }

  setPreferences(preferences: SoundPreferences) {
    this.preferences = preferences;
    if (!preferences.music) this.cancelVoices('music');
    if (!preferences.effects) this.cancelVoices('effect');
    if (this.active && !this.paused) this.unlock();
    this.volume();
  }

  setUrgent(urgent: boolean) {
    this.urgent = urgent;
  }
  setNarrating(narrating: boolean) {
    this.narrating = narrating;
    this.volume();
  }

  answer(correct: boolean) {
    if (!this.active || this.paused || !this.preferences.effects || !this.unlock()) return;
    const now = this.context!.currentTime;
    if (correct) {
      [523.25, 659.25, 783.99].forEach((frequency, index) =>
        this.note(frequency, now + index * 0.09, 0.2, 'sine', 'effect', 0.42),
      );
    } else {
      this.note(330, now, 0.17, 'triangle', 'effect', 0.35, 220);
      this.note(196, now + 0.17, 0.22, 'triangle', 'effect', 0.3);
    }
  }

  finish() {
    this.stop();
    if (!this.preferences.effects || !this.unlock()) return;
    const now = this.context!.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) =>
      this.note(frequency, now + index * 0.12, 0.3, 'sine', 'effect', 0.4),
    );
  }

  pause() {
    this.paused = true;
    this.cancelVoices();
    this.volume();
  }
  resume() {
    if (!this.active) return;
    this.paused = false;
    if (this.unlock()) this.nextBeat = this.context!.currentTime;
  }
  stop() {
    this.active = false;
    this.paused = false;
    this.narrating = false;
    window.clearInterval(this.timer);
    this.timer = undefined;
    this.cancelVoices();
  }
}

export const gameSound = new GameSound();
