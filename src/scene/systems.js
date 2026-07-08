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

// Domain mixin: systems. Methods are Object.assign'd onto PrototypeScene.prototype.
export const systemsMixin = {

  setupInputHandlers() {
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      tab: Phaser.Input.Keyboard.KeyCodes.TAB,
      mute: Phaser.Input.Keyboard.KeyCodes.M,
      dash: Phaser.Input.Keyboard.KeyCodes.SPACE
    });

    this.input.keyboard.on("keydown-SPACE", () => {
      this.tryStartDash();
    });

    this.input.keyboard.on("keydown-TAB", (event) => {
      event.preventDefault();
      this.toggleBuildPanel();
    });

    this.input.keyboard.on("keyup-TAB", (event) => {
      event.preventDefault();
      this.hideBuildPanel();
    });

    this.input.keyboard.on("keydown-M", () => {
      if (!BALANCE.audio.enabled) {
        return;
      }
      this.soundMuted = !this.soundMuted;
      this.updateMuteText();
    });

    this.input.keyboard.on("keydown-ESC", () => {
      this.togglePause();
    });

    if (DEBUG_MODE) {
      this.input.keyboard.on("keydown-B", () => {
        this.skipToBossPhase();
      });
    }
  },


  handlePlayerMovement() {
    const body = this.player.body;

    // While dashing, lock velocity to the dash vector.
    if (this.elapsedSurvivalMs < this.dashUntilMs) {
      body.setVelocity(
        Math.cos(this.dashAngle) * BALANCE.player.dashSpeed,
        Math.sin(this.dashAngle) * BALANCE.player.dashSpeed
      );
      return;
    }

    let velocityX = 0;
    let velocityY = 0;

    if (this.keys.left.isDown) {
      velocityX -= 1;
    }
    if (this.keys.right.isDown) {
      velocityX += 1;
    }
    if (this.keys.up.isDown) {
      velocityY -= 1;
    }
    if (this.keys.down.isDown) {
      velocityY += 1;
    }

    const direction = new Phaser.Math.Vector2(velocityX, velocityY).normalize();
    const effectiveSpeed = this.playerMoveSpeed * this.moveSpeedBuffMultiplier;
    if (direction.lengthSq() > 0) {
      this.playerFacingAngle = Math.atan2(direction.y, direction.x);
    }
    body.setVelocity(
      direction.x * effectiveSpeed,
      direction.y * effectiveSpeed
    );
  },


  tryStartDash() {
    if (!this.isMissionActive || this.isGameOver || this.isLevelUpActive) {
      return;
    }
    if (this.elapsedSurvivalMs < this.dashReadyAtMs) {
      return;
    }

    // Dash toward the current movement input; fall back to last facing.
    let dashX = 0;
    let dashY = 0;
    if (this.keys.left.isDown) dashX -= 1;
    if (this.keys.right.isDown) dashX += 1;
    if (this.keys.up.isDown) dashY -= 1;
    if (this.keys.down.isDown) dashY += 1;
    if (dashX !== 0 || dashY !== 0) {
      this.dashAngle = Math.atan2(dashY, dashX);
    } else {
      this.dashAngle = this.playerFacingAngle;
    }

    this.dashUntilMs = this.elapsedSurvivalMs + BALANCE.player.dashDurationMs;
    this.dashReadyAtMs = this.elapsedSurvivalMs + BALANCE.player.dashCooldownMs;
    this.playerInvulnerableUntilMs = Math.max(
      this.playerInvulnerableUntilMs,
      this.elapsedSurvivalMs + BALANCE.player.dashInvulnerabilityMs
    );
    this.spawnDashTrail();
    this.playSound("shoot");
  },


  updateTemporaryBuffs() {
    if (this.activeStimUntilMs > 0 && this.elapsedSurvivalMs >= this.activeStimUntilMs) {
      this.activeStimUntilMs = 0;
      this.moveSpeedBuffMultiplier = 1;
    }
  },


  pauseGameplaySystems() {
    this.physics.pause();

    if (this.spawnEvent) {
      this.spawnEvent.paused = true;
    }
  },


  clearTransientEffects() {
    for (const effect of this.transientEffects) {
      if (effect.active) {
        effect.destroy();
      }
    }
    this.transientEffects.clear();
  },


  resumeGameplaySystems() {
    this.physics.resume();

    if (this.spawnEvent && this.regularSpawningActive) {
      this.spawnEvent.paused = false;
    } else if (this.regularSpawningActive && !this.spawnEvent && !this.isGameOver) {
      this.scheduleNextSpawn();
    }
  },


  clearCombatEntities() {
    this.enemies.clear(true, true);
    this.enemyProjectiles.clear(true, true);
    this.bullets.clear(true, true);
    this.xpGems.clear(true, true);
    this.supplyPickups.clear(true, true);
    this.instabilityDecoys.clear(true, true);
    this.clearTransientEffects();
  },


  clearFacilitySystems() {
    this.activeFacilityEvent = null;
    this.activeFacilityEventEndAtMs = 0;
    this.outageVisualStrength = 0;
    if (this.outageDarknessRt) {
      this.outageDarknessRt.clear();
      this.outageDarknessRt.setVisible(false);
    }
    if (this.eventBannerContainer) {
      this.eventBannerContainer.setVisible(false);
    }
    this.topBannerState = null;
  }
};
