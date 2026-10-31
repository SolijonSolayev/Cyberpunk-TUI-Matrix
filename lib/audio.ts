export type SoundEffect = 'key' | 'command' | 'scan' | 'success' | 'error' | 'warning';
const PATTERNS: Record<SoundEffect, {frequency: number; duration: number}[]> = {
  key: [{frequency: 720, duration: 0.018}],
  command: [{frequency: 440, duration: 0.045}, {frequency: 660, duration: 0.045}],
  scan: [{frequency: 240, duration: 0.07}, {frequency: 480, duration: 0.07}, {frequency: 960, duration: 0.09}],
  success: [{frequency: 523, duration: 0.08}, {frequency: 659, duration: 0.08}, {frequency: 784, duration: 0.12}],
  error: [{frequency: 220, duration: 0.12}, {frequency: 110, duration: 0.16}],
  warning: [{frequency: 330, duration: 0.08}]
};

// No assets or network requests. Audio is created only after an explicit gesture.
export class TerminalAudio {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private enabled = false;
  private volume = 20;
  private lastKey = -1;
  private generation = 0;
  async enable(): Promise<boolean> {
    const generation = ++this.generation;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.output = this.context.createGain();
        this.output.gain.value = 0;
        this.output.connect(this.context.destination);
      }
      await this.context.resume();
      if (generation !== this.generation) return false;
      this.enabled = this.context.state === 'running';
      this.applyVolume();
      return this.enabled;
    } catch {
      if (generation === this.generation) this.disable();
      return false;
    }
  }
  disable() { this.generation++; this.enabled = false; this.applyVolume(); }
  setVolume(percent: number) {
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new RangeError('Volume must be between 0 and 100');
    this.volume = percent;
    this.applyVolume();
  }
  private applyVolume() {
    if (!this.context || !this.output) return;
    this.output.gain.cancelScheduledValues(this.context.currentTime);
    this.output.gain.setValueAtTime(this.enabled ? this.volume / 100 : 0, this.context.currentTime);
  }
  play(effect: SoundEffect) {
    if (!this.enabled || !this.context || !this.output || this.context.state !== 'running') return;
    if (effect === 'key' && this.context.currentTime - this.lastKey < 0.03) return;
    if (effect === 'key') this.lastKey = this.context.currentTime;
    try {
      let start = this.context.currentTime;
      for (const note of PATTERNS[effect]) {
        const oscillator = this.context.createOscillator();
        const envelope = this.context.createGain();
        oscillator.type = effect === 'error' ? 'sawtooth' : 'sine';
        oscillator.frequency.value = note.frequency;
        envelope.gain.setValueAtTime(0.0001, start);
        envelope.gain.exponentialRampToValueAtTime(0.10, start + 0.005);
        envelope.gain.exponentialRampToValueAtTime(0.0001, start + note.duration);
        oscillator.connect(envelope);
        envelope.connect(this.output);
        oscillator.start(start);
        oscillator.stop(start + note.duration + 0.01);
        oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
        start += note.duration;
      }
    } catch {
      // Sound must never interrupt gameplay on devices with limited audio support.
    }
  }
  dispose() {
    this.disable();
    const context = this.context;
    this.output?.disconnect();
    this.output = null;
    this.context = null;
    if (context && context.state !== 'closed') void context.close().catch(() => {});
  }
}
