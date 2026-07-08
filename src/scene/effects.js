import Phaser from "phaser";
import {
  DEBUG_MODE,
  GAME_WIDTH,
  GAME_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  ENEMY_GRID_CELL_SIZE,
  ENEMY_GRID_STRIDE
} from "../config/constants.js";
import { BALANCE } from "../config/balance.js";
import { UPGRADE_DEFINITIONS } from "../config/upgrades.js";
import { META_PERKS, loadMetaProgress, saveMetaProgress } from "../config/meta.js";

// Domain mixin: effects. Methods are Object.assign'd onto PrototypeScene.prototype.
export const effectsMixin = {

  spawnImpactEffect(x, y) {
    let impact = this._impactPool.pop();
    if (impact) {
      impact.setPosition(x, y);
      impact.setScale(1);
      impact.setAlpha(0.9);
      impact.setActive(true).setVisible(true);
    } else {
      impact = this.add.circle(x, y, 4, 0xfff7bf, 0.9);
      impact.setDepth(17);
    }

    this.tweens.add({
      targets: impact,
      scale: 1.9,
      alpha: 0,
      duration: BALANCE.feedback.impactDurationMs,
      onComplete: () => this.releaseToPool(this._impactPool, impact)
    });
  },


  spawnExplosionEffect(x, y, radius) {
    const blast = this.add.circle(x, y, radius * 0.4, 0xffa040, 0.35);
    blast.setDepth(17);
    this.registerTransientEffect(blast);
    this.tweens.add({
      targets: blast,
      scale: 2.4,
      alpha: 0,
      duration: 220,
      onComplete: () => blast.destroy()
    });
  },


  showEliteNeutralizedText(x, y) {
    const label = this.add.text(x, y, "精英已消灭", {
      fontSize: "16px",
      color: "#ffe6a2"
    });
    label.setDepth(24);
    label.setOrigin(0.5);
    this.registerTransientEffect(label);
    this.tweens.add({
      targets: label,
      y: y - 24,
      alpha: 0,
      duration: BALANCE.enemy.elite.neutralizedTextMs,
      onComplete: () => label.destroy()
    });
  },


  registerTransientEffect(gameObject) {
    this.transientEffects.add(gameObject);
    gameObject.once("destroy", () => {
      this.transientEffects.delete(gameObject);
    });
  },


  // Return a pooled visual to its pool, hidden and deactivated, for reuse.
  releaseToPool(pool, gameObject) {
    if (!gameObject || !gameObject.scene) {
      return;
    }
    gameObject.setActive(false).setVisible(false);
    if (typeof gameObject.clear === "function") {
      // Graphics objects: drop drawn paths so they don't linger when reused.
      gameObject.clear();
    }
    pool.push(gameObject);
  },


  flashEnemyOnHit(enemy) {
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(BALANCE.feedback.enemyHitFlashMs, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });
  },


  spawnFloatingDamage(x, y, damage) {
    let damageText = this._damageTextPool.pop();
    if (damageText) {
      damageText.setText(`${damage}`);
      damageText.setPosition(x, y - 6);
      damageText.setAlpha(1);
      damageText.setActive(true).setVisible(true);
    } else {
      damageText = this.add.text(x, y - 6, `${damage}`, {
        fontSize: "14px",
        color: "#ffe9a8"
      });
      damageText.setOrigin(0.5);
      damageText.setDepth(26);
    }

    this.tweens.add({
      targets: damageText,
      y: y - BALANCE.feedback.damageNumberRisePx,
      alpha: 0,
      duration: BALANCE.feedback.damageNumberDurationMs,
      onComplete: () => this.releaseToPool(this._damageTextPool, damageText)
    });
  },


  spawnDeathParticles(x, y, color) {
    for (let index = 0; index < BALANCE.feedback.deathBurstParticles; index += 1) {
      const angle = (Math.PI * 2 * index) / BALANCE.feedback.deathBurstParticles;
      const distance = Phaser.Math.Between(8, 20);
      let particle = this._particlePool.pop();
      if (particle) {
        particle.setPosition(x, y);
        particle.setScale(1);
        particle.setAlpha(0.95);
        particle.setFillStyle(color, 0.95);
        particle.setActive(true).setVisible(true);
      } else {
        particle = this.add.circle(x, y, 2.5, color, 0.95);
        particle.setDepth(16);
      }

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 180,
        onComplete: () => this.releaseToPool(this._particlePool, particle)
      });
    }
  },


  playEnemyDeathEffect(enemy) {
    enemy.isDying = true;
    this.clearEliteWarning(enemy);
    enemy.body.enable = false;
    enemy.setVelocity(0, 0);
    this.spawnDeathParticles(enemy.x, enemy.y, enemy.enemyColor);

    this.tweens.add({
      targets: enemy,
      scaleX: 0.25,
      scaleY: 0.25,
      alpha: 0,
      duration: BALANCE.feedback.deathShrinkMs,
      onComplete: () => {
        if (enemy.active) {
          enemy.destroy();
        }
      }
    });
  },


  spawnDashTrail() {
    const trail = this.add.circle(this.player.x, this.player.y, 12, 0x8fd0ff, 0.5);
    trail.setDepth(5);
    this.registerTransientEffect(trail);
    this.tweens.add({
      targets: trail,
      scale: 2,
      alpha: 0,
      duration: 240,
      onComplete: () => trail.destroy()
    });
  },


  spawnGemPickupSpark(x, y) {
    const spark = this.add.circle(x, y, 4, 0x9dffb8, 0.9);
    spark.setDepth(17);
    this.registerTransientEffect(spark);
    this.tweens.add({
      targets: spark,
      scale: 2.2,
      alpha: 0,
      duration: 140,
      onComplete: () => spark.destroy()
    });
  },


  updatePlayerInvulnerabilityVisual() {
    if (!this.player.active) {
      return;
    }

    if (this.elapsedSurvivalMs < this.playerInvulnerableUntilMs) {
      const blinkOn = Math.sin(this.elapsedSurvivalMs * 0.04) > 0;
      this.player.setAlpha(blinkOn ? 1 : 0.35);
    } else {
      this.player.setAlpha(1);
    }
  },


  triggerEventPulse() {
    const pulse = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x8bb2ff,
      0.15
    );
    pulse.setDepth(12);
    pulse.setScrollFactor(0);
    this.registerTransientEffect(pulse);

    this.tweens.add({
      targets: pulse,
      alpha: 0,
      duration: 420,
      onComplete: () => pulse.destroy()
    });
  },


  ensureAudio() {
    if (!BALANCE.audio.enabled || this.soundMuted) {
      return false;
    }
    if (this.audioContext && this.audioGain) {
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
  },


  playTone({ frequency, durationMs, type, volume }) {
    if (!this.ensureAudio()) {
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
  },


  playSound(soundName) {
    if (!BALANCE.audio.enabled || this.soundMuted) {
      return;
    }

    if (soundName === "shoot") {
      this.playTone({
        frequency: 620,
        durationMs: 40,
        type: "square",
        volume: 0.09
      });
      return;
    }

    if (soundName === "enemyHit") {
      this.playTone({
        frequency: 240,
        durationMs: 40,
        type: "triangle",
        volume: 0.07
      });
      return;
    }

    if (soundName === "playerDamage") {
      this.playTone({
        frequency: 120,
        durationMs: 110,
        type: "sawtooth",
        volume: 0.11
      });
      return;
    }

    if (soundName === "levelUp") {
      this.playTone({
        frequency: 520,
        durationMs: 80,
        type: "triangle",
        volume: 0.1
      });
      this.time.delayedCall(90, () => {
        this.playTone({
          frequency: 760,
          durationMs: 110,
          type: "triangle",
          volume: 0.1
        });
      });
      return;
    }

    if (soundName === "facilityWarning") {
      this.playTone({
        frequency: 360,
        durationMs: 120,
        type: "square",
        volume: 0.08
      });
      this.time.delayedCall(140, () => {
        this.playTone({
          frequency: 260,
          durationMs: 120,
          type: "square",
          volume: 0.08
        });
      });
      return;
    }

    if (soundName === "objectiveComplete") {
      this.playTone({
        frequency: 580,
        durationMs: 90,
        type: "triangle",
        volume: 0.11
      });
      this.time.delayedCall(90, () => {
        this.playTone({
          frequency: 780,
          durationMs: 120,
          type: "triangle",
          volume: 0.11
        });
      });
      return;
    }

    if (soundName === "pickupHeal") {
      this.playTone({
        frequency: 440,
        durationMs: 90,
        type: "sine",
        volume: 0.1
      });
      this.time.delayedCall(80, () => {
        this.playTone({
          frequency: 660,
          durationMs: 120,
          type: "sine",
          volume: 0.1
        });
      });
      return;
    }

    if (soundName === "bossAppear") {
      this.playTone({
        frequency: 90,
        durationMs: 180,
        type: "sawtooth",
        volume: 0.12
      });
      this.time.delayedCall(120, () => {
        this.playTone({
          frequency: 140,
          durationMs: 220,
          type: "sawtooth",
          volume: 0.1
        });
      });
      return;
    }

    if (soundName === "bossSummon") {
      this.playTone({
        frequency: 200,
        durationMs: 100,
        type: "triangle",
        volume: 0.08
      });
    }
  }
};
