/**
 * Notification Sound Service
 * Uses Web Audio API to generate notification sounds without external audio files
 */

class NotificationSoundService {
  private audioContext: AudioContext | null = null;
  private lastPlayedAt = 0;
  private readonly MIN_INTERVAL = 300; // Minimum ms between sounds to avoid spam

  private getContext(): AudioContext | null {
    try {
      if (!this.audioContext || this.audioContext.state === 'closed') {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      // Resume if suspended (e.g. by autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
      return this.audioContext;
    } catch {
      return null;
    }
  }

  /**
   * Play a pleasant two-tone notification sound (like Telegram/WhatsApp)
   */
  playMessageSound(): void {
    const now = Date.now();
    if (now - this.lastPlayedAt < this.MIN_INTERVAL) return;
    this.lastPlayedAt = now;

    const ctx = this.getContext();
    if (!ctx) return;

    const currentTime = ctx.currentTime;

    // Master gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.3, currentTime);
    masterGain.connect(ctx.destination);

    // First tone - higher pitch
    this.playTone(ctx, masterGain, 880, currentTime, 0.08, 0.12);
    // Second tone - slightly higher for a pleasant "ding-ding"
    this.playTone(ctx, masterGain, 1174.66, currentTime + 0.1, 0.06, 0.15);
  }

  /**
   * Play a subtle single-tone sound for sent messages
   */
  playSentSound(): void {
    const now = Date.now();
    if (now - this.lastPlayedAt < this.MIN_INTERVAL) return;
    this.lastPlayedAt = now;

    const ctx = this.getContext();
    if (!ctx) return;

    const currentTime = ctx.currentTime;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.15, currentTime);
    masterGain.connect(ctx.destination);

    this.playTone(ctx, masterGain, 1046.5, currentTime, 0.03, 0.08);
  }

  private playTone(
    ctx: AudioContext,
    destination: AudioNode,
    frequency: number,
    startTime: number,
    attackTime: number,
    releaseTime: number
  ): void {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startTime);

    // Envelope: quick attack, smooth release
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(1, startTime + attackTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + attackTime + releaseTime);

    oscillator.connect(gainNode);
    gainNode.connect(destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + attackTime + releaseTime + 0.01);
  }

  /**
   * Must be called from a user gesture to unlock audio on mobile browsers
   */
  unlock(): void {
    const ctx = this.getContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const notificationSound = new NotificationSoundService();
