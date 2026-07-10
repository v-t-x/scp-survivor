import { BALANCE } from "../config/balance.js";

// AudioManager — owns the Web Audio graph and all sound synthesis.
//
// This is a verbatim behavioral move of the audio code that used to live in
// scene/effects.js (ensureAudio / playTone / playSound). Sound names, frequencies,
// waveforms, volumes, and timing are unchanged.
//
// Owned by the UI/audio Agent. Gameplay code plays a sound via scene.audio.play(name)
// (or the retained scene.playSound(name) thin wrapper, which delegates here).
//
// Design notes for this stage:
// - No real audio files. Everything is synthesized at runtime, which stays the
//   fallback when/if sampled assets are added later.
// - Mute state stays on the scene (scene.soundMuted) as the single source of
//   truth, because the HUD and input handlers already read/write it there.
export class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.audioContext = null;
    this.audioGain = null;
  }

  get isMuted() {
    return !!this.scene.soundMuted;
  }

  // Lazily create (or resume) the AudioContext on first use. Returns false when
  // audio is disabled/muted or the browser has no Web Audio support, so callers
  // can safely bail. A single AudioContext/gain node is reused for the lifetime
  // of the manager — never recreated.
  ensure() {
    if (!BALANCE.audio.enabled || this.isMuted) {
      return false;
    }
    if (this.audioContext && this.audioGain) {
      // Browsers start the context "suspended" until a user gesture; resume once
      // the player has interacted (which is always the case by the time a sound
      // plays in-game).
      if (this.audioContext.state === "suspended") {
        this.audioContext.resume();
      }
      return true;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      return false;
    }

    this.audioContext = new AudioContextClass();
    this.audioGain = this.audioContext.createGain();
    this.audioGain.gain.value = BALANCE.audio.masterGain;
    this.audioGain.connect(this.audioContext.destination);
    return true;
  }

  playTone({ frequency, durationMs, type, volume }) {
    if (!this.ensure()) {
      return;
    }
    const context = this.audioContext;
    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(volume, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioGain);
    oscillator.start(now);
    oscillator.stop(now + durationMs / 1000);
  }

  play(soundName) {
    if (!BALANCE.audio.enabled || this.isMuted) {
      return;
    }

    if (soundName === "shoot") {
      this.playTone({ frequency: 620, durationMs: 40, type: "square", volume: 0.09 });
      return;
    }

    if (soundName === "enemyHit") {
      this.playTone({ frequency: 240, durationMs: 40, type: "triangle", volume: 0.07 });
      return;
    }

    if (soundName === "playerDamage") {
      this.playTone({ frequency: 120, durationMs: 110, type: "sawtooth", volume: 0.11 });
      return;
    }

    if (soundName === "levelUp") {
      this.playTone({ frequency: 520, durationMs: 80, type: "triangle", volume: 0.1 });
      this.scene.time.delayedCall(90, () => {
        this.playTone({ frequency: 760, durationMs: 110, type: "triangle", volume: 0.1 });
      });
      return;
    }

    if (soundName === "facilityWarning") {
      this.playTone({ frequency: 360, durationMs: 120, type: "square", volume: 0.08 });
      this.scene.time.delayedCall(140, () => {
        this.playTone({ frequency: 260, durationMs: 120, type: "square", volume: 0.08 });
      });
      return;
    }

    if (soundName === "objectiveComplete") {
      this.playTone({ frequency: 580, durationMs: 90, type: "triangle", volume: 0.11 });
      this.scene.time.delayedCall(90, () => {
        this.playTone({ frequency: 780, durationMs: 120, type: "triangle", volume: 0.11 });
      });
      return;
    }

    if (soundName === "pickupHeal") {
      this.playTone({ frequency: 440, durationMs: 90, type: "sine", volume: 0.1 });
      this.scene.time.delayedCall(80, () => {
        this.playTone({ frequency: 660, durationMs: 120, type: "sine", volume: 0.1 });
      });
      return;
    }

    if (soundName === "bossAppear") {
      this.playTone({ frequency: 90, durationMs: 180, type: "sawtooth", volume: 0.12 });
      this.scene.time.delayedCall(120, () => {
        this.playTone({ frequency: 140, durationMs: 220, type: "sawtooth", volume: 0.1 });
      });
      return;
    }

    if (soundName === "bossSummon") {
      this.playTone({ frequency: 200, durationMs: 100, type: "triangle", volume: 0.08 });
    }
  }

  // Release the Web Audio graph. Call on scene shutdown/destroy so a restarted
  // scene does not leak a closed-over context (and the browser's per-page
  // AudioContext budget is not exhausted across many restarts).
  destroy() {
    if (this.audioContext) {
      if (typeof this.audioContext.close === "function") {
        this.audioContext.close();
      }
      this.audioContext = null;
      this.audioGain = null;
    }
    this.scene = null;
  }
}
