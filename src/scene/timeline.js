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

// Domain mixin: timeline. Methods are Object.assign'd onto PrototypeScene.prototype.
export const timelineMixin = {

  getDifficultyDirectorState() {
    const elapsedSeconds = this.elapsedSurvivalMs / 1000;
    const spawnProgress = Phaser.Math.Clamp(
      elapsedSeconds / BALANCE.enemy.spawn.intervalRampSeconds,
      0,
      1
    );
    let spawnIntervalMs = Math.floor(
      Phaser.Math.Linear(
        BALANCE.enemy.spawn.startIntervalMs,
        BALANCE.enemy.spawn.minIntervalMs,
        spawnProgress
      )
    );

    let typeWeights;
    let extraSpawnChance;
    let threat;
    let eliteChance = 0;
    let eliteDoubleChance = 0;
    let eliteWeights = {
      riotUnit: 0,
      blinkStalker: 0,
      biomass: 0
    };

    if (elapsedSeconds < BALANCE.enemy.spawn.phaseOneEndS) {
      typeWeights = { infectedStaff: 1, crawler: 0, drone: 0 };
      extraSpawnChance = 0;
      threat = "低";
    } else if (elapsedSeconds < BALANCE.enemy.spawn.phaseTwoEndS) {
      const phase =
        (elapsedSeconds - BALANCE.enemy.spawn.phaseOneEndS) /
        (BALANCE.enemy.spawn.phaseTwoEndS - BALANCE.enemy.spawn.phaseOneEndS);
      typeWeights = {
        infectedStaff: Phaser.Math.Linear(0.82, 0.7, phase),
        crawler: Phaser.Math.Linear(0.18, 0.3, phase),
        drone: 0
      };
      extraSpawnChance = Phaser.Math.Linear(0.02, 0.08, phase);
      threat = "上升";
    } else if (elapsedSeconds < BALANCE.enemy.spawn.phaseThreeEndS) {
      const phase =
        (elapsedSeconds - BALANCE.enemy.spawn.phaseTwoEndS) /
        (BALANCE.enemy.spawn.phaseThreeEndS - BALANCE.enemy.spawn.phaseTwoEndS);
      typeWeights = {
        infectedStaff: Phaser.Math.Linear(0.62, 0.45, phase),
        crawler: Phaser.Math.Linear(0.28, 0.35, phase),
        drone: Phaser.Math.Linear(0.1, 0.2, phase)
      };
      extraSpawnChance = Phaser.Math.Linear(0.08, 0.18, phase);
      threat = "高";
    } else {
      const phase = Phaser.Math.Clamp(
        (elapsedSeconds - BALANCE.enemy.spawn.phaseThreeEndS) /
          BALANCE.enemy.spawn.phaseThreeEndS,
        0,
        1
      );
      typeWeights = {
        infectedStaff: Phaser.Math.Linear(0.4, 0.3, phase),
        crawler: Phaser.Math.Linear(0.35, 0.42, phase),
        drone: Phaser.Math.Linear(0.25, 0.28, phase)
      };
      extraSpawnChance = Phaser.Math.Linear(0.2, 0.45, phase);
      threat = "危急";
    }

    if (elapsedSeconds >= BALANCE.enemy.elite.firstAppearanceSeconds) {
      if (elapsedSeconds < BALANCE.enemy.elite.spawn.earlySeconds) {
        eliteChance = 0.08;
        eliteDoubleChance = 0;
        eliteWeights = {
          riotUnit: 0.72,
          blinkStalker: 0.18,
          biomass: 0.1
        };
      } else if (elapsedSeconds < BALANCE.enemy.elite.spawn.lateSeconds) {
        eliteChance = 0.13;
        eliteDoubleChance = 0.05;
        eliteWeights = {
          riotUnit: 0.4,
          blinkStalker: 0.35,
          biomass: 0.25
        };
      } else {
        eliteChance = 0.18;
        eliteDoubleChance = 0.22;
        eliteWeights = {
          riotUnit: 0.32,
          blinkStalker: 0.36,
          biomass: 0.32
        };
      }
    }

    const facilityModifiers = this.getFacilitySpawnModifiers();
    if (facilityModifiers.crawlerWeightBonus > 0) {
      typeWeights.crawler += facilityModifiers.crawlerWeightBonus;
    }
    if (facilityModifiers.droneWeightBonus > 0) {
      typeWeights.drone += facilityModifiers.droneWeightBonus;
    }
    if (facilityModifiers.eliteChanceBonus > 0) {
      eliteChance += facilityModifiers.eliteChanceBonus;
    }
    if (facilityModifiers.spawnRateMultiplier > 1) {
      const inverse = 1 / facilityModifiers.spawnRateMultiplier;
      const minInterval = BALANCE.enemy.spawn.minIntervalMs;
      spawnIntervalMs = Math.max(minInterval, Math.floor(spawnIntervalMs * inverse));
    }
    if (facilityModifiers.extraSpawnBonus > 0) {
      extraSpawnChance += facilityModifiers.extraSpawnBonus;
    }

    if (this.elapsedSurvivalMs >= BALANCE.timeline.phases[4].atMs) {
      spawnIntervalMs = Math.max(
        BALANCE.enemy.spawn.minIntervalMs,
        Math.floor(spawnIntervalMs * BALANCE.timeline.phaseFiveSpawnIntervalMultiplier)
      );
    }
    if (this.elapsedSurvivalMs >= BALANCE.timeline.phases[5].atMs) {
      extraSpawnChance += BALANCE.timeline.phaseSixExtraSpawnBonus;
    }

    const healthMultiplier =
      1 +
      Math.min(
        BALANCE.enemy.scaling.maxHealthBonus,
        (elapsedSeconds / BALANCE.enemy.scaling.healthRampSeconds) *
          BALANCE.enemy.scaling.maxHealthBonus
      );
    const damageMultiplier =
      1 +
      Math.min(
        BALANCE.enemy.scaling.maxDamageBonus,
        (elapsedSeconds / BALANCE.enemy.scaling.damageRampSeconds) *
          BALANCE.enemy.scaling.maxDamageBonus
      );

    return {
      threat,
      spawnIntervalMs,
      extraSpawnChance,
      typeWeights,
      eliteChance,
      eliteDoubleChance,
      eliteWeights,
      scaling: {
        healthMultiplier,
        damageMultiplier
      }
    };
  },


  getFacilitySpawnModifiers() {
    const modifiers = {
      spawnRateMultiplier: 1,
      extraSpawnBonus: 0,
      crawlerWeightBonus: 0,
      droneWeightBonus: 0,
      eliteChanceBonus: 0
    };

    if (this.activeFacilityEvent?.type === "powerOutage") {
      modifiers.crawlerWeightBonus += BALANCE.facility.events.powerOutage.crawlerWeightBonus;
    }

    return modifiers;
  },


  updateFacilityEventDirector() {
    if (!this.powerOutageTriggered && this.elapsedSurvivalMs >= BALANCE.match.powerOutageAtMs) {
      this.powerOutageTriggered = true;
      this.beginFacilityEvent("powerOutage");
    }

    if (this.activeFacilityEvent && this.elapsedSurvivalMs >= this.activeFacilityEventEndAtMs) {
      this.endFacilityEvent("设施系统已稳定。");
    }
  },


  beginFacilityEvent(type) {
    const config = BALANCE.facility.events[type];
    if (!config) {
      return;
    }
    this.activeFacilityEvent = {
      type,
      name: config.name
    };
    this.activeFacilityEventEndAtMs = this.elapsedSurvivalMs + config.durationMs;
    this.showTopBanner(config.name, config.warning, 1900);
    this.triggerEventPulse();
    this.playSound("facilityWarning");
  },


  endFacilityEvent(message = "事件已结束。") {
    if (!this.activeFacilityEvent) {
      return;
    }

    this.activeFacilityEvent = null;
    this.activeFacilityEventEndAtMs = 0;
    this.showTopBanner("事件结束", message, 1400);
  },


  updateFacilityVisualEffects() {
    this.updateTopBanner();
    this.updatePowerOutageVisual();
  },


  updatePowerOutageVisual() {
    const isActive = this.activeFacilityEvent?.type === "powerOutage";
    if (isActive) {
      this.outageVisualStrength = Math.min(1, this.outageVisualStrength + 0.08);
    } else {
      this.outageVisualStrength = Math.max(0, this.outageVisualStrength - 0.07);
    }

    if (this.outageVisualStrength <= 0) {
      this.outageDarknessRt.setVisible(false);
      this.outageDarknessRt.clear();
      if (this.arenaGrid) {
        this.arenaGrid.setAlpha(1);
      }
      return;
    }

    this.outageDarknessRt.setVisible(true);
    this.outageDarknessRt.clear();
    const outsideAlpha = 0.96 * this.outageVisualStrength;
    this.outageDarknessRt.fill(0x000000, outsideAlpha);
    // Render texture is screen-space (scrollFactor 0); convert the player's
    // world position into screen space so the light stays on the player.
    const cam = this.cameras.main;
    this.outageLightSprite.setPosition(
      this.player.x - cam.scrollX,
      this.player.y - cam.scrollY
    );
    this.outageDarknessRt.erase(this.outageLightSprite);

    if (this.arenaGrid) {
      const flickerAlpha = 0.45 + Math.sin(this.elapsedSurvivalMs * 0.08) * 0.22;
      this.arenaGrid.setAlpha(
        Phaser.Math.Clamp(flickerAlpha, 0.2, 0.75) * this.outageVisualStrength
      );
    }
  },


  getTimelinePhase() {
    // Memoize per elapsed-time value: within a single frame elapsedSurvivalMs is
    // constant, and this is called hundreds of times (once per enemy, plus HUD and
    // effect systems). Recomputing the linear phase scan each time was a measurable
    // cost at 200+ enemies.
    if (
      this._timelinePhaseCache &&
      this._timelinePhaseCacheAtMs === this.elapsedSurvivalMs
    ) {
      return this._timelinePhaseCache;
    }

    const phases = BALANCE.timeline.phases;
    let current = phases[0];
    for (const phase of phases) {
      if (this.elapsedSurvivalMs >= phase.atMs) {
        current = phase;
      } else {
        break;
      }
    }

    const currentIndex = phases.indexOf(current);
    const nextPhase = phases[currentIndex + 1] ?? null;
    const nextAtMs = nextPhase?.atMs ?? BALANCE.match.survivalDurationMs;

    const result = {
      ...current,
      nextAtMs,
      countdownMs: Math.max(0, nextAtMs - this.elapsedSurvivalMs)
    };
    this._timelinePhaseCache = result;
    this._timelinePhaseCacheAtMs = this.elapsedSurvivalMs;
    return result;
  },


  updatePhaseHud() {
    if (!this.phaseText || !this.isMissionActive) {
      return;
    }

    const phase = this.getTimelinePhase();
    const countdownSeconds = Math.ceil(phase.countdownMs / 1000);

    if (this.survivalPhaseEnded) {
      if (this.bossPhaseActive && this.bossEnemy?.active) {
        const hpPercent = Math.ceil(
          (this.bossEnemy.health / this.bossEnemy.maxHealth) * 100
        );
        this.phaseText.setText(`终局：SCP-049  |  Boss 生命 ${hpPercent}%`);
      } else {
        this.phaseText.setText(`${phase.name}  |  等待 Boss 登场`);
      }
      return;
    }

    if (phase.id >= 7) {
      this.phaseText.setText(`${phase.name}  |  Boss 战即将开始`);
      return;
    }

    this.phaseText.setText(`${phase.name}  |  下一节点 ${countdownSeconds}秒`);
  },


  updateTimelineDirector() {
    if (!this.isMissionActive || this.isGameOver) {
      return;
    }

    const phase = this.getTimelinePhase();

    if (!this.bossWarningShown && phase.id >= 6) {
      this.bossWarningShown = true;
      this.showTopBanner("收容加压", "Boss 即将到来", 3200);
    }

    if (!this.survivalPhaseEnded && this.elapsedSurvivalMs >= BALANCE.match.survivalDurationMs) {
      this.endSurvivalPhase();
    }
  },


  endSurvivalPhase(immediateBoss = false) {
    if (this.survivalPhaseEnded) {
      if (immediateBoss && !this.bossEnemy?.active) {
        if (this.bossIntroTimer) {
          this.bossIntroTimer.remove(false);
          this.bossIntroTimer = null;
        }
        this.spawnScp049Boss();
      }
      return;
    }

    this.survivalPhaseEnded = true;
    this.stopRegularSpawning();
    this.instabilityDecoys?.clear(true, true);
    this.enemyProjectiles.clear(true, true);
    this.clearRegularEnemies();
    this.showTopBanner("收容突破", "SCP-049 已突破收容", 4200);

    if (this.bossIntroTimer) {
      this.bossIntroTimer.remove(false);
      this.bossIntroTimer = null;
    }

    if (immediateBoss) {
      this.spawnScp049Boss();
      return;
    }

    this.bossIntroTimer = this.time.delayedCall(BALANCE.boss.scp049.introDelayMs, () => {
      this.bossIntroTimer = null;
      if (!this.isGameOver && this.isMissionActive) {
        this.spawnScp049Boss();
      }
    });
  },


  updateTimelineEffects() {
    const phase = this.getTimelinePhase();
    this.updateInstabilityDecoys();

    if (!phase.effects.decoys) {
      return;
    }

    if (this.elapsedSurvivalMs >= this.nextDecoySpawnAtMs) {
      this.spawnInstabilityDecoy();
      this.nextDecoySpawnAtMs =
        this.elapsedSurvivalMs +
        Phaser.Math.Between(
          BALANCE.timeline.effects.decoySpawnMinMs,
          BALANCE.timeline.effects.decoySpawnMaxMs
        );
    }

    if (
      phase.effects.screenShake &&
      this.elapsedSurvivalMs >= this.nextInstabilityShakeAtMs
    ) {
      this.cameras.main.shake(70, 0.0024);
      this.nextInstabilityShakeAtMs = this.elapsedSurvivalMs + Phaser.Math.Between(3200, 5800);
    }
  },


  getEnemyInstabilitySpeedMultiplier() {
    const phase = this.getTimelinePhase();
    if (phase.id >= 7) {
      return 1;
    }
    if (phase.id >= 6) {
      return BALANCE.timeline.effects.stageFourEnemySpeedMultiplier;
    }
    if (phase.id >= 5) {
      return BALANCE.timeline.effects.stageThreeEnemySpeedMultiplier;
    }
    if (phase.id >= 4) {
      return BALANCE.timeline.effects.stageTwoEnemySpeedMultiplier;
    }
    return 1;
  },


  spawnInstabilityDecoy() {
    const { x, y } = this.getSpawnPositionAtEdge();
    const decoy = this.add.circle(x, y, 10, 0x9b74ff, 0.5);
    decoy.setDepth(8);
    decoy.expiresAtMs = this.elapsedSurvivalMs + BALANCE.timeline.effects.decoyLifetimeMs;
    decoy.moveSpeed = 120;
    this.instabilityDecoys.add(decoy);
    this.registerTransientEffect(decoy);
  },


  updateInstabilityDecoys() {
    if (!this.instabilityDecoys) {
      return;
    }
    for (const decoy of this.instabilityDecoys.getChildren()) {
      if (!decoy.active) {
        continue;
      }
      if (this.elapsedSurvivalMs >= decoy.expiresAtMs) {
        decoy.destroy();
        continue;
      }
      const angle = Phaser.Math.Angle.Between(decoy.x, decoy.y, this.player.x, this.player.y);
      const step = (decoy.moveSpeed / 1000) * 16;
      decoy.x += Math.cos(angle) * step;
      decoy.y += Math.sin(angle) * step;
      decoy.alpha = 0.35 + Math.sin(this.elapsedSurvivalMs * 0.02) * 0.12;
    }
  },


  updateTimelineHudCorruption() {
    if (!this.timelineHudBasePositions) {
      return;
    }
    const phase = this.getTimelinePhase();
    if (!phase.effects.hudCorruption || this.isGameOver || !this.isMissionActive) {
      for (const [target, baseX, baseY] of this.timelineHudBasePositions) {
        if (!target?.active) {
          continue;
        }
        target.setPosition(baseX, baseY);
        target.setAlpha(1);
      }
      return;
    }

    const jitter = 2.4;
    for (const [target, baseX, baseY] of this.timelineHudBasePositions) {
      if (!target?.active || !target.visible) {
        continue;
      }
      target.setPosition(
        baseX + Phaser.Math.FloatBetween(-jitter, jitter),
        baseY + Phaser.Math.FloatBetween(-jitter, jitter)
      );
      target.setAlpha(0.82);
    }
  }
};
