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
import { COMBAT_PRESENTATION_DEPTH } from "../art/combatFeedback.js";

// Domain mixin: effects. Methods are Object.assign'd onto PrototypeScene.prototype.
export const effectsMixin = {

  resolvePlayerAttackVisualOrigin({ weaponId, angle, originX, originY } = {}) {
    let resolved = null;
    try {
      resolved = this.playerPresentation?.getAttackEffectOrigin?.({ weaponId, angle });
    } catch {
      // Visual origin lookup cannot alter or interrupt committed gameplay.
    }
    if (Number.isFinite(resolved?.x) && Number.isFinite(resolved?.y)) {
      return Object.freeze({ x: resolved.x, y: resolved.y });
    }
    return Object.freeze({ x: originX, y: originY });
  },

  emitAttackPresentation(snapshot, fallbackDirection, committedProjectiles) {
    try {
      if (this.combatFeedback?.notifyAttack(snapshot, committedProjectiles) === true) {
        return;
      }
    } catch {
      // Presentation feedback must not interrupt committed gameplay.
    }

    if (Number.isFinite(fallbackDirection)) {
      this.spawnMuzzleFlash(fallbackDirection);
    }
  },

  emitTeslaChannelPresentation(snapshot) {
    try {
      return this.combatFeedback?.notifyTeslaChannel(snapshot) === true;
    } catch {
      // A persistent visual channel cannot interrupt targeting or damage ticks.
      return false;
    }
  },

  spawnImpactEffect(x, y) {
    let impact = this._impactPool.pop();
    if (impact) {
      impact.setPosition(x, y);
      impact.setScale(1);
      impact.setAlpha(0.9);
      impact.setActive(true).setVisible(true);
    } else {
      impact = this.add.circle(x, y, 4, 0xfff7bf, 0.9);
      impact.setDepth(COMBAT_PRESENTATION_DEPTH.decorationMin + 1);
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
    blast.setDepth(COMBAT_PRESENTATION_DEPTH.decorationMin + 1);
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
    label.setDepth(COMBAT_PRESENTATION_DEPTH.decorationMax - 2);
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


  createEnemyPresentationSnapshot(
    enemy,
    { lethal = false, atMs = this.elapsedSurvivalMs } = {}
  ) {
    const frame = Number.isInteger(enemy?.frame?.name)
      ? enemy.frame.name
      : Number.isInteger(enemy?.frame?.index)
        ? enemy.frame.index
        : 0;
    return Object.freeze({
      presentationId: Number.isInteger(enemy?._presentationId) ? enemy._presentationId : 0,
      enemyType: typeof enemy?.enemyType === "string" ? enemy.enemyType : "unknown",
      eliteType: typeof enemy?.eliteType === "string" ? enemy.eliteType : null,
      isBoss: enemy?.isBoss === true,
      canSplit: enemy?.canSplit === true,
      x: Number.isFinite(enemy?.x) ? enemy.x : 0,
      y: Number.isFinite(enemy?.y) ? enemy.y : 0,
      frame,
      flipX: enemy?.flipX === true,
      alpha: Number.isFinite(enemy?.alpha) ? enemy.alpha : 1,
      depth: Number.isFinite(enemy?.depth) ? enemy.depth : 10,
      scaleX: Number.isFinite(enemy?.scaleX) ? enemy.scaleX : 1,
      scaleY: Number.isFinite(enemy?.scaleY) ? enemy.scaleY : 1,
      lethal: lethal === true,
      atMs: Number.isFinite(atMs) ? atMs : 0
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
      damageText.setDepth(COMBAT_PRESENTATION_DEPTH.decorationMax);
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
        particle.setDepth(COMBAT_PRESENTATION_DEPTH.decorationMin);
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


  commitEnemyDeathActor(enemy) {
    if (enemy.isDying !== true) {
      enemy.isDying = true;
    }
    this.clearEliteWarning(enemy);
    enemy.body.enable = false;
    if (
      enemy.body?.velocity?.x !== 0
      || enemy.body?.velocity?.y !== 0
    ) {
      enemy.setVelocity(0, 0);
    }
  },


  playLegacyEnemyDeathVisual(enemy, { spawnParticles = true } = {}) {
    if (spawnParticles) {
      this.spawnDeathParticles(enemy.x, enemy.y, enemy.enemyColor);
    }

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


  playEnemyDeathEffect(enemy, options = {}) {
    this.commitEnemyDeathActor(enemy);
    this.playLegacyEnemyDeathVisual(enemy, options);
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

    let alpha = 1;
    if (this.elapsedSurvivalMs < this.playerInvulnerableUntilMs) {
      const blinkOn = Math.sin(this.elapsedSurvivalMs * 0.04) > 0;
      alpha = blinkOn ? 1 : 0.35;
    }

    let handledByPlayerPresentation = false;
    try {
      handledByPlayerPresentation = this.playerPresentation?.setAlpha(alpha) === true;
    } catch {
      // Visible-body feedback failure falls through to the legacy anchor.
    }
    if (!handledByPlayerPresentation) {
      this.player.setAlpha(alpha);
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


  // Audio now lives in AudioManager (src/audio/AudioManager.js). This thin
  // wrapper is retained so the ~12 gameplay call sites (this.playSound("...")）
  // stay unchanged and can be delegated / rolled back in one place.
  playSound(soundName) {
    if (this.audio) {
      this.audio.play(soundName);
    }
  }
};
