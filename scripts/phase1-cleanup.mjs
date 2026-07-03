import fs from "fs";

const path = "c:/scp-survivor/src/main.js";
let s = fs.readFileSync(path, "utf8");

s = s.replaceAll("BALANCE.containmentInstability", "BALANCE.timelineEffects");
s = s.replaceAll("this.containmentInstabilityStage", "this.getTimelineEffectStage()");
s = s.replaceAll("updateInstabilityHudCorruption", "updateTimelineHudCorruption");
s = s.replaceAll("updateContainmentInstabilitySystem", "updateTimelineEffects");
s = s.replaceAll("this.instabilityHudBasePositions", "this.timelineHudBasePositions");

s = s.replace(/\n  showProtocolRewardOverlay\(\) \{[\s\S]*?\n  getUpgradeCurrentLevel\(upgrade\) \{/, "\n  getUpgradeCurrentLevel(upgrade) {");

s = s.replace(/\n  setupContainmentNodes\(\) \{[\s\S]*?\n  updateFacilityStatusHud\(\) \{[\s\S]*?\n  \}\n\n  updateWeaponHud\(\)/, "\n  updateWeaponHud()");

s = s.replace(/\n  unlockWeapon\(weaponId\) \{[\s\S]*?\n  \}\n\n  update\(_, delta\)/, "\n  update(_, delta)");

s = s.replace(/\n  spawnDebugBurst\(\) \{[\s\S]*?\n  \}\n\n  getFinalSurvivalTimeSeconds/, "\n  getFinalSurvivalTimeSeconds");

s = s.replace(/if \(this\.isGameOver \|\| this\.isProtocolRewardActive\) \{/g, "if (this.isGameOver) {");
s = s.replace(/\n      !this\.isProtocolRewardActive\n/g, "\n");

s = s.replace(/\n    this\.threatText\.setText\([^)]+\);\n    this\.eliteCounterText\.setText\([^)]+\);\n/g, "\n");
s = s.replace(/\n    this\.updateContainmentInstabilityHud\(\);\n/g, "\n");
s = s.replace(/\n    this\.updateContainmentStatusHud\(\);\n/g, "\n");
s = s.replace(/\n    this\.updateFacilityStatusHud\(\);\n/g, "\n");

s = s.replace(/\n      this\.addContainmentInstability\([^)]+\);/g, "");
s = s.replace(/\n    this\.addContainmentInstability\([^)]+\);/g, "");

s = s.replace(/\n        if \(\n          this\.isTerminalActivelyProgressing\(\) &&[\s\S]*?\n          \);\n          continue;\n        \}/g, "");

const timelineEffectsBlock = `
  getTimelineEffectStage() {
    const elapsedSeconds = this.elapsedSurvivalMs / 1000;
    if (elapsedSeconds >= 300) {
      return 4;
    }
    if (elapsedSeconds >= 240) {
      return 3;
    }
    if (elapsedSeconds >= 120) {
      return 2;
    }
    return 1;
  }

  updateTimelineEffects() {
    this.updateInstabilityDecoys();
    const stage = this.getTimelineEffectStage();
    if (stage >= 2 && this.elapsedSurvivalMs >= this.nextDecoySpawnAtMs) {
      this.spawnInstabilityDecoy();
      this.nextDecoySpawnAtMs =
        this.elapsedSurvivalMs +
        Phaser.Math.Between(
          BALANCE.timelineEffects.decoySpawnMinMs,
          BALANCE.timelineEffects.decoySpawnMaxMs
        );
    }

    if (stage >= 2 && this.elapsedSurvivalMs >= this.nextInstabilityShakeAtMs) {
      const intensity = stage >= 4 ? 0.0024 : 0.0013;
      this.cameras.main.shake(70, intensity);
      this.nextInstabilityShakeAtMs = this.elapsedSurvivalMs + Phaser.Math.Between(3200, 5800);
    }
  }

  getEnemyInstabilitySpeedMultiplier() {
    const stage = this.getTimelineEffectStage();
    if (stage >= 4) {
      return BALANCE.timelineEffects.stageFourEnemySpeedMultiplier;
    }
    if (stage === 3) {
      return BALANCE.timelineEffects.stageThreeEnemySpeedMultiplier;
    }
    if (stage === 2) {
      return BALANCE.timelineEffects.stageTwoEnemySpeedMultiplier;
    }
    return 1;
  }

  spawnInstabilityDecoy() {
    const { x, y } = this.getSpawnPositionAtEdge();
    const decoy = this.add.circle(x, y, 10, 0x9b74ff, 0.5);
    decoy.setDepth(8);
    decoy.expiresAtMs = this.elapsedSurvivalMs + BALANCE.timelineEffects.decoyLifetimeMs;
    decoy.moveSpeed = 120;
    this.instabilityDecoys.add(decoy);
    this.registerTransientEffect(decoy);
  }

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
  }

  updateTimelineHudCorruption() {
    if (!this.timelineHudBasePositions) {
      return;
    }
    if (this.getTimelineEffectStage() < 3 || this.isGameOver || !this.isMissionActive) {
      for (const [target, baseX, baseY] of this.timelineHudBasePositions) {
        if (!target?.active) {
          continue;
        }
        target.setPosition(baseX, baseY);
        target.setAlpha(1);
      }
      return;
    }

    const jitter = this.getTimelineEffectStage() >= 4 ? 2.4 : 1.2;
    for (const [target, baseX, baseY] of this.timelineHudBasePositions) {
      if (!target?.active || !target.visible) {
        continue;
      }
      target.setPosition(
        baseX + Phaser.Math.FloatBetween(-jitter, jitter),
        baseY + Phaser.Math.FloatBetween(-jitter, jitter)
      );
      target.setAlpha(this.getTimelineEffectStage() >= 4 ? 0.82 : 0.92);
    }
  }
`;

if (/updateTimelineEffects\(\) \{[\s\S]*?updateTimelineHudCorruption/.test(s)) {
  s = s.replace(/\n  updateTimelineEffects\(\) \{[\s\S]*?\n  updateTimelineHudCorruption\(\) \{[\s\S]*?\n  \}\n\n  updateWeaponHud\(\)/, timelineEffectsBlock + "\n\n  updateWeaponHud()");
} else if (/updateContainmentInstabilitySystem/.test(s)) {
  s = s.replace(/\n  updateContainmentInstabilitySystem\(\) \{[\s\S]*?\n  updateInstabilityHudCorruption\(\) \{[\s\S]*?\n  \}\n\n  setupContainmentNodes/, timelineEffectsBlock + "\n\n  updateWeaponHud()");
}

s = s.replace(/\n  addContainmentInstability\(amount\) \{[\s\S]*?\n  \}\n\n  getContainmentInstabilityStage\(\) \{[\s\S]*?\n  \}\n\n  getEnemyInstabilitySpeedMultiplier/g, "\n  getEnemyInstabilitySpeedMultiplier");

s = s.replace(/\n  getContainmentInstabilityColor\(value\) \{[\s\S]*?\n  \}\n\n  updateContainmentInstabilityHud\(\) \{[\s\S]*?\n  \}\n\n  spawnInstabilityDecoy/g, "\n  spawnInstabilityDecoy");

s = s.replace(/\n    this\.clearTerminalState\(\);/g, "");
s = s.replace(/\n    this\.redAlertOverlay\.clear\(\);\n    this\.redAlertOverlay\.setVisible\(false\);/g, "");
s = s.replace(/    this\.eventWarning = null;\n    this\.lastFacilityEventType = null;\n    this\.nextFacilityEventAtMs =[\s\S]*?\n      \);\n/g, "");

s = s.replace(/\n    if \(this\.protocolRewardOverlay\) \{[\s\S]*?\n    \}\n    this\.levelUpCards = \[\];\n    this\.protocolRewardCards = \[\];\n    this\.isLevelUpActive = false;\n    this\.isProtocolRewardActive = false;\n    this\.isResolvingLevelUp = false;\n    this\.isResolvingProtocolReward = false;/, "\n    this.levelUpCards = [];\n    this.isLevelUpActive = false;\n    this.isResolvingLevelUp = false;");

s = s.replace(/\n    this\.clearContainmentObjective\(\);/g, "");

fs.writeFileSync(path, s);
console.log("Written", s.length, "chars");
