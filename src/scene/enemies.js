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
import {
  cloneEnemyAt as cloneEnemyForScene,
  tryReplicateEnemy as tryReplicateEnemyForScene
} from "./enemyReplication.js";
import { getBossUpdateActions, getBossWavePlan } from "./bossRules.js";
import {
  applyDisplayScalePreservingBody,
  CHARACTER_DISPLAY_SCALE
} from "../art/presentationRules.js";

// Domain mixin: enemies. Methods are Object.assign'd onto PrototypeScene.prototype.
export const enemiesMixin = {

  setupSpawning() {
    this.scheduleNextSpawn();
  },


  scheduleNextSpawn() {
    if (!this.regularSpawningActive) {
      return;
    }
    const director = this.getDifficultyDirectorState();
    this.spawnEvent = this.time.delayedCall(director.spawnIntervalMs, () => {
      if (!this.isGameOver && !this.isLevelUpActive) {
        this.spawnEnemyWave();
      }
      if (!this.isGameOver) {
        this.scheduleNextSpawn();
      }
    });
  },


  spawnEnemyWave() {
    if (!this.regularSpawningActive) {
      return;
    }
    if (this.enemies.getLength() >= BALANCE.enemy.maxActiveEnemies) {
      return;
    }

    const director = this.getDifficultyDirectorState();
    let spawnCount = 1;
    if (Math.random() < director.extraSpawnChance) {
      spawnCount += 1;
    }
    spawnCount = Math.min(
      spawnCount,
      BALANCE.enemy.maxActiveEnemies - this.enemies.getLength()
    );

    for (let index = 0; index < spawnCount; index += 1) {
      const enemyType = this.pickEnemyType(director.typeWeights);
      this.spawnEnemyAtEdge(enemyType, director.scaling);
    }

    this.trySpawnElites(director);
  },


  getActiveEliteLimit() {
    const elapsedSeconds = this.elapsedSurvivalMs / 1000;
    if (elapsedSeconds >= BALANCE.enemy.elite.lateMaxActiveStartSeconds) {
      return BALANCE.enemy.elite.lateMaxActive;
    }
    return BALANCE.enemy.elite.earlyMaxActive;
  },


  getActiveEliteCount() {
    let count = 0;
    for (const enemy of this.enemies.getChildren()) {
      if (enemy.active && enemy.isElite) {
        count += 1;
      }
    }
    return count;
  },


  trySpawnElites(director) {
    if (this.enemies.getLength() >= BALANCE.enemy.maxActiveEnemies) {
      return;
    }
    if (director.eliteChance <= 0) {
      return;
    }
    if (Math.random() > director.eliteChance) {
      return;
    }

    const limit = this.getActiveEliteLimit();
    let activeElites = this.getActiveEliteCount();
    if (activeElites >= limit) {
      return;
    }

    let spawnCount = 1;
    if (Math.random() < director.eliteDoubleChance) {
      spawnCount = 2;
    }

    let firstElite = null;
    for (let index = 0; index < spawnCount; index += 1) {
      if (
        activeElites >= limit ||
        this.enemies.getLength() >= BALANCE.enemy.maxActiveEnemies
      ) {
        break;
      }
      const eliteType = this.pickEnemyType(director.eliteWeights);
      if (index === 0) {
        firstElite = this.spawnEliteAtEdge(eliteType, director.scaling);
      } else if (firstElite) {
        const closeX = Phaser.Math.Clamp(
          firstElite.x + Phaser.Math.Between(-65, 65),
          20,
          WORLD_WIDTH - 20
        );
        const closeY = Phaser.Math.Clamp(
          firstElite.y + Phaser.Math.Between(-65, 65),
          20,
          WORLD_HEIGHT - 20
        );
        this.spawnEliteAtEdge(eliteType, director.scaling, { x: closeX, y: closeY });
      } else {
        this.spawnEliteAtEdge(eliteType, director.scaling);
      }
      activeElites += 1;
    }
  },


  pickEnemyType(weights) {
    const entries = Object.entries(weights).filter(([, weight]) => weight > 0);
    const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);
    let randomWeight = Math.random() * totalWeight;

    for (const [type, weight] of entries) {
      randomWeight -= weight;
      if (randomWeight <= 0) {
        return type;
      }
    }

    return "infectedStaff";
  },


  getSpawnPositionAtEdge() {
    // Spawn on a ring just beyond the visible viewport, around the player,
    // so enemies enter from off-screen regardless of camera position.
    const halfView = Math.max(GAME_WIDTH, GAME_HEIGHT) / 2;
    const spawnDistance = halfView + Phaser.Math.Between(40, 140);
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const x = Phaser.Math.Clamp(
      this.player.x + Math.cos(angle) * spawnDistance,
      16,
      WORLD_WIDTH - 16
    );
    const y = Phaser.Math.Clamp(
      this.player.y + Math.sin(angle) * spawnDistance,
      16,
      WORLD_HEIGHT - 16
    );
    return { x, y };
  },


  spawnEnemyAtEdge(type, scaling) {
    const config =
      BALANCE.enemy.types[type] ?? BALANCE.enemy.types.infectedStaff;
    const { x, y } = this.getSpawnPositionAtEdge();
    const enemy = this.enemies.create(x, y, config.textureKey);

    this.initializeEnemyFromConfig(enemy, config, scaling, false);
  },


  spawnEliteAtEdge(type, scaling, forcedPosition = null) {
    const config = BALANCE.enemy.elite.types[type];
    if (!config) {
      return null;
    }
    const { x, y } = forcedPosition ?? this.getSpawnPositionAtEdge();
    const textureKey =
      type === "riotUnit"
        ? "elite-riot"
        : type === "blinkStalker"
          ? "elite-blink"
          : "elite-biomass";
    const enemy = this.enemies.create(x, y, textureKey);
    this.initializeEnemyFromConfig(enemy, config, scaling, true);
    enemy.eliteType = type;
    this.attachEliteVisuals(enemy);
    return enemy;
  },


  spawnBiomassChild(x, y) {
    if (this.enemies.getLength() >= BALANCE.enemy.maxActiveEnemies) {
      return;
    }
    const config = BALANCE.enemy.elite.types.biomassChild;
    const child = this.enemies.create(x, y, "biomass-child");
    this.initializeEnemyFromConfig(
      child,
      config,
      { healthMultiplier: 1, damageMultiplier: 1 },
      false
    );
    child.isBiomassChild = true;
    child.canSplit = false;
    child.behavior = "chase";
  },


  initializeEnemyFromConfig(enemy, config, scaling, isElite) {
    enemy.enemyType = config.type;
    enemy.enemyColor = config.color;
    enemy.moveSpeed = config.speed;
    enemy.behavior = config.behavior ?? "chase";
    enemy.xpReward = config.xpReward;
    enemy.isDying = false;
    enemy.isElite = isElite;
    enemy.contactDamage = Math.max(
      1,
      Math.round(config.contactDamage * scaling.damageMultiplier)
    );
    enemy.maxHealth = Math.max(
      1,
      Math.round(config.health * scaling.healthMultiplier)
    );
    enemy.health = enemy.maxHealth;
    enemy.nextInstabilityTeleportAtMs =
      this.elapsedSurvivalMs +
      Phaser.Math.Between(
        BALANCE.timeline.effects.enemyTeleportMinMs,
        BALANCE.timeline.effects.enemyTeleportMaxMs
      );
    enemy.nextReplicateAtMs =
      this.elapsedSurvivalMs +
      Phaser.Math.Between(
        BALANCE.enemy.replication.intervalMinMs,
        BALANCE.enemy.replication.intervalMaxMs
      );

    if (config.bodyShape === "circle") {
      enemy.setCircle(config.bodyRadius);
    } else if (config.bodyShape === "box") {
      enemy.body.setSize(config.bodySize, config.bodySize);
    } else {
      enemy.body.setSize(enemy.width, enemy.height);
    }

    if (config.type === "infectedStaff") {
      applyDisplayScalePreservingBody(enemy, CHARACTER_DISPLAY_SCALE.infectedStaff);
    }

    if (config.type === "drone") {
      enemy.projectileDamage = Math.max(
        1,
        Math.round(config.projectileDamage * scaling.damageMultiplier)
      );
      enemy.shootCooldownMs = config.shootCooldownMs;
      enemy.nextShotAtMs =
        this.elapsedSurvivalMs + Phaser.Math.Between(600, config.shootCooldownMs);
      enemy.preferredRangeMin = config.preferredRangeMin;
      enemy.preferredRangeMax = config.preferredRangeMax;
    }

    if (isElite) {
      enemy.setScale(1.2);
      enemy.setDepth(10);
      enemy.eliteState = "idle";
      enemy.canSplit = config.type === "biomass";
      enemy.warningUntilMs = 0;
      enemy.nextActionAtMs = this.elapsedSurvivalMs + Phaser.Math.Between(700, 1600);
      enemy.facingAngle = 0;
      if (config.type === "riotUnit") {
        enemy.frontDamageMultiplier = config.frontDamageMultiplier;
        enemy.sideDamageMultiplier = config.sideDamageMultiplier;
        enemy.rearDamageMultiplier = config.rearDamageMultiplier;
        enemy.frontArcDegrees = config.frontArcDegrees;
        enemy.chargeCooldownMs = config.chargeCooldownMs;
        enemy.chargeWarningMs = config.chargeWarningMs;
        enemy.chargeDurationMs = config.chargeDurationMs;
        enemy.chargeSpeed = config.chargeSpeed;
      }
      if (config.type === "blinkStalker") {
        enemy.teleportCooldownMs = config.teleportCooldownMs;
        enemy.teleportWarningMs = config.teleportWarningMs;
        enemy.minDestinationDistance = config.minDestinationDistance;
        enemy.maxDestinationDistance = config.maxDestinationDistance;
        enemy.postTeleportDashMs = config.postTeleportDashMs;
        enemy.dashSpeed = config.dashSpeed;
        enemy.setAlpha(0.85);
      }
    }

    enemy.once("destroy", () => {
      if (enemy.armorBrokenLabel?.active) {
        enemy.armorBrokenLabel.destroy();
      }
    });
  },


  updateEnemies() {
    // These are constant across the whole frame — compute once instead of per enemy.
    const instabilitySpeedMultiplier = this.getEnemyInstabilitySpeedMultiplier();
    const teleportEnabled = this.getTimelinePhase().effects.teleport;

    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active || enemy.isDying || enemy.isBoss) {
        continue;
      }

      if (BALANCE.enemy.replication.enabled) {
        this.tryReplicateEnemy(enemy);
      }

      if ((enemy.knockbackUntilMs ?? 0) > this.elapsedSurvivalMs) {
        continue;
      }

      if ((enemy.staggerUntilMs ?? 0) > this.elapsedSurvivalMs) {
        enemy.body.setVelocity(0, 0);
        continue;
      }

      const slowMultiplier =
        (enemy.slowUntilMs ?? 0) > this.elapsedSurvivalMs
          ? enemy.slowMultiplier ?? 1
          : 1;
      if ((enemy.slowUntilMs ?? 0) <= this.elapsedSurvivalMs) {
        enemy.slowMultiplier = 1;
      }
      const originalSpeed = enemy.moveSpeed;
      enemy.moveSpeed = originalSpeed * slowMultiplier * instabilitySpeedMultiplier;

      if (enemy.isElite) {
        this.updateEliteEnemy(enemy);
      } else if (enemy.behavior === "ranged") {
        this.updateDroneBehavior(enemy);
      } else {
        this.physics.moveToObject(enemy, this.player, enemy.moveSpeed);
      }

      if (teleportEnabled) {
        this.tryInstabilityTeleportEnemy(enemy);
      }

      enemy.moveSpeed = originalSpeed;
    }
  },


  tryReplicateEnemy(enemy) {
    return tryReplicateEnemyForScene(this, enemy, BALANCE, Phaser.Math, {
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT
    });
  },


  cloneEnemyAt(source, x, y) {
    return cloneEnemyForScene(this, source, x, y, BALANCE);
  },


  tryInstabilityTeleportEnemy(enemy) {
    if (!enemy.active || enemy.isDying) {
      return;
    }
    if ((enemy.nextInstabilityTeleportAtMs ?? 0) > this.elapsedSurvivalMs) {
      return;
    }
    enemy.nextInstabilityTeleportAtMs =
      this.elapsedSurvivalMs +
      Phaser.Math.Between(
        BALANCE.timeline.effects.enemyTeleportMinMs,
        BALANCE.timeline.effects.enemyTeleportMaxMs
      );
    if (Math.random() > 0.25) {
      return;
    }

    const distance = BALANCE.timeline.effects.enemyTeleportDistance;
    const newX = Phaser.Math.Clamp(
      enemy.x + Phaser.Math.Between(-distance, distance),
      16,
      WORLD_WIDTH - 16
    );
    const newY = Phaser.Math.Clamp(
      enemy.y + Phaser.Math.Between(-distance, distance),
      16,
      WORLD_HEIGHT - 16
    );
    const blink = this.add.circle(enemy.x, enemy.y, 6, 0xd8b0ff, 0.5);
    blink.setDepth(16);
    this.registerTransientEffect(blink);
    this.tweens.add({
      targets: blink,
      alpha: 0,
      scale: 1.8,
      duration: 120,
      onComplete: () => blink.destroy()
    });
    enemy.setPosition(newX, newY);
  },


  updateEliteEnemy(enemy) {
    if (enemy.eliteType === "riotUnit") {
      this.updateRiotElite(enemy);
    } else if (enemy.eliteType === "blinkStalker") {
      this.updateBlinkElite(enemy);
    } else if (enemy.eliteType === "biomass") {
      this.updateBiomassElite(enemy);
    }
    this.updateEliteVisuals(enemy);
  },


  updateRiotElite(enemy) {
    if (enemy.eliteState === "warning") {
      enemy.body.setVelocity(0, 0);
      if (this.elapsedSurvivalMs >= enemy.warningUntilMs) {
        enemy.eliteState = "charging";
        enemy.chargeUntilMs = this.elapsedSurvivalMs + enemy.chargeDurationMs;
        enemy.nextActionAtMs = this.elapsedSurvivalMs + enemy.chargeCooldownMs;
        this.clearEliteWarning(enemy);
      }
      return;
    }

    if (enemy.eliteState === "charging") {
      enemy.body.setVelocity(
        Math.cos(enemy.chargeAngle) * enemy.chargeSpeed,
        Math.sin(enemy.chargeAngle) * enemy.chargeSpeed
      );
      enemy.facingAngle = enemy.chargeAngle;
      if (this.elapsedSurvivalMs >= enemy.chargeUntilMs) {
        enemy.eliteState = "idle";
      }
      return;
    }

    this.physics.moveToObject(enemy, this.player, enemy.moveSpeed);
    enemy.facingAngle = Phaser.Math.Angle.Between(
      enemy.x,
      enemy.y,
      this.player.x,
      this.player.y
    );

    if (this.elapsedSurvivalMs >= enemy.nextActionAtMs) {
      enemy.eliteState = "warning";
      enemy.warningUntilMs = this.elapsedSurvivalMs + enemy.chargeWarningMs;
      enemy.chargeAngle = enemy.facingAngle;
      this.createChargeWarning(enemy);
    }
  },


  updateBlinkElite(enemy) {
    if (enemy.eliteState === "teleportWarning") {
      enemy.body.setVelocity(0, 0);
      enemy.setAlpha(0.35 + Math.sin(this.elapsedSurvivalMs * 0.03) * 0.2);
      if (this.elapsedSurvivalMs >= enemy.warningUntilMs) {
        enemy.setPosition(enemy.teleportTargetX, enemy.teleportTargetY);
        enemy.setAlpha(0.95);
        this.clearEliteWarning(enemy);
        enemy.eliteState = "postDash";
        enemy.dashUntilMs = this.elapsedSurvivalMs + enemy.postTeleportDashMs;
      }
      return;
    }

    if (enemy.eliteState === "postDash") {
      const dashAngle = Phaser.Math.Angle.Between(
        enemy.x,
        enemy.y,
        this.player.x,
        this.player.y
      );
      enemy.body.setVelocity(
        Math.cos(dashAngle) * enemy.dashSpeed,
        Math.sin(dashAngle) * enemy.dashSpeed
      );
      if (this.elapsedSurvivalMs >= enemy.dashUntilMs) {
        enemy.eliteState = "idle";
      }
      return;
    }

    enemy.setAlpha(0.85);
    this.physics.moveToObject(enemy, this.player, enemy.moveSpeed);
    if (this.elapsedSurvivalMs >= enemy.nextActionAtMs) {
      const target = this.getBlinkTeleportDestination(enemy);
      enemy.teleportTargetX = target.x;
      enemy.teleportTargetY = target.y;
      enemy.eliteState = "teleportWarning";
      enemy.warningUntilMs = this.elapsedSurvivalMs + enemy.teleportWarningMs;
      enemy.nextActionAtMs = this.elapsedSurvivalMs + enemy.teleportCooldownMs;
      this.createTeleportWarning(enemy, target.x, target.y);
    }
  },


  updateBiomassElite(enemy) {
    this.physics.moveToObject(enemy, this.player, enemy.moveSpeed);
    const pulse = 1.16 + Math.sin(this.elapsedSurvivalMs * 0.008) * 0.07;
    enemy.setScale(pulse);
  },


  updateDroneBehavior(enemy) {
    const distance = Phaser.Math.Distance.Between(
      enemy.x,
      enemy.y,
      this.player.x,
      this.player.y
    );

    if (distance > enemy.preferredRangeMax) {
      this.physics.moveToObject(enemy, this.player, enemy.moveSpeed);
    } else if (distance < enemy.preferredRangeMin) {
      const awayAngle = Phaser.Math.Angle.Between(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y
      );
      enemy.body.setVelocity(
        Math.cos(awayAngle) * enemy.moveSpeed,
        Math.sin(awayAngle) * enemy.moveSpeed
      );
    } else {
      enemy.body.setVelocity(0, 0);
    }

    if (this.elapsedSurvivalMs >= enemy.nextShotAtMs) {
      enemy.nextShotAtMs = this.elapsedSurvivalMs + enemy.shootCooldownMs;
      this.fireEnemyProjectile(enemy);
    }
  },


  fireEnemyProjectile(enemy) {
    if (!enemy.active || this.isGameOver || this.isLevelUpActive) {
      return;
    }

    const projectile = this.enemyProjectiles.create(
      enemy.x,
      enemy.y,
      "enemy-projectile"
    );
    projectile.setCircle(5);
    projectile.damage = enemy.projectileDamage ?? 10;
    projectile.expireAtMs =
      this.elapsedSurvivalMs + BALANCE.combat.enemyProjectileLifetimeMs;

    this.physics.moveToObject(
      projectile,
      this.player,
      BALANCE.combat.enemyProjectileSpeed
    );
  },


  attachEliteVisuals(enemy) {
    const marker = this.add.text(enemy.x, enemy.y - 32, "精英", {
      fontSize: "12px",
      color: "#ffd4d4"
    });
    marker.setOrigin(0.5);
    marker.setDepth(22);
    this.registerTransientEffect(marker);
    enemy.eliteMarker = marker;

    const outline = this.add.graphics();
    outline.setDepth(9);
    this.registerTransientEffect(outline);
    enemy.eliteOutline = outline;

    if (enemy.eliteType === "riotUnit") {
      const shield = this.add.triangle(enemy.x, enemy.y, 0, 0, 14, 6, 0, 12, 0x87bcff, 0.95);
      shield.setDepth(11);
      this.registerTransientEffect(shield);
      enemy.shieldIndicator = shield;
    }

    enemy.once("destroy", () => {
      this.clearEliteWarning(enemy);
      if (enemy.eliteMarker?.active) {
        enemy.eliteMarker.destroy();
      }
      if (enemy.eliteOutline?.active) {
        enemy.eliteOutline.destroy();
      }
      if (enemy.shieldIndicator?.active) {
        enemy.shieldIndicator.destroy();
      }
    });
  },


  updateEliteVisuals(enemy) {
    if (!enemy.eliteOutline) {
      return;
    }

    enemy.eliteOutline.clear();
    enemy.eliteOutline.lineStyle(2, 0xfff08e, 0.95);
    if (enemy.eliteType === "riotUnit") {
      enemy.eliteOutline.strokeRect(enemy.x - 22, enemy.y - 22, 44, 44);
    } else if (enemy.eliteType === "blinkStalker") {
      enemy.eliteOutline.strokeCircle(enemy.x, enemy.y, 20);
    } else {
      enemy.eliteOutline.strokeCircle(enemy.x, enemy.y, 22);
    }

    if (enemy.eliteMarker) {
      enemy.eliteMarker.setPosition(enemy.x, enemy.y - 34);
    }

    if (enemy.shieldIndicator) {
      const shieldDistance = 22;
      enemy.shieldIndicator.setPosition(
        enemy.x + Math.cos(enemy.facingAngle) * shieldDistance,
        enemy.y + Math.sin(enemy.facingAngle) * shieldDistance
      );
      enemy.shieldIndicator.setRotation(enemy.facingAngle);
    }
  },


  createChargeWarning(enemy) {
    this.clearEliteWarning(enemy);
    const warning = this.add.graphics();
    warning.setDepth(15);
    warning.lineStyle(3, 0xffa773, 0.95);
    warning.lineBetween(
      enemy.x,
      enemy.y,
      enemy.x + Math.cos(enemy.chargeAngle) * 140,
      enemy.y + Math.sin(enemy.chargeAngle) * 140
    );
    this.registerTransientEffect(warning);
    enemy.warningGraphic = warning;
  },


  createTeleportWarning(enemy, x, y) {
    this.clearEliteWarning(enemy);
    const warning = this.add.graphics();
    warning.setDepth(15);
    warning.lineStyle(2, 0x9df7ff, 0.95);
    warning.strokeCircle(x, y, 24);
    warning.lineBetween(x - 10, y, x + 10, y);
    warning.lineBetween(x, y - 10, x, y + 10);
    this.registerTransientEffect(warning);
    enemy.warningGraphic = warning;
  },


  clearEliteWarning(enemy) {
    if (enemy.warningGraphic && enemy.warningGraphic.active) {
      enemy.warningGraphic.destroy();
    }
    enemy.warningGraphic = null;
  },


  getBlinkTeleportDestination(enemy) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(
      enemy.minDestinationDistance,
      enemy.maxDestinationDistance
    );
    const x = Phaser.Math.Clamp(
      this.player.x + Math.cos(angle) * distance,
      24,
      WORLD_WIDTH - 24
    );
    const y = Phaser.Math.Clamp(
      this.player.y + Math.sin(angle) * distance,
      24,
      WORLD_HEIGHT - 24
    );
    return { x, y };
  },


  tryInterruptElite(enemy) {
    if (enemy.eliteType === "riotUnit" && enemy.eliteState === "warning") {
      enemy.eliteState = "idle";
      enemy.nextActionAtMs = this.elapsedSurvivalMs + 1000;
      this.clearEliteWarning(enemy);
    }
    if (enemy.eliteType === "blinkStalker" && enemy.eliteState === "teleportWarning") {
      enemy.eliteState = "idle";
      enemy.nextActionAtMs = this.elapsedSurvivalMs + 1100;
      this.clearEliteWarning(enemy);
      enemy.setAlpha(0.85);
    }
  },


  spawnScp049Boss() {
    if (this.bossEnemy?.active || this.isGameOver) {
      return;
    }

    const config = BALANCE.boss.scp049;
    // Enter from above the player so it is on-screen when it appears.
    const bossX = Phaser.Math.Clamp(this.player.x, 60, WORLD_WIDTH - 60);
    const bossY = Phaser.Math.Clamp(this.player.y - 220, 60, WORLD_HEIGHT - 60);
    const boss = this.enemies.create(bossX, bossY, "enemy-scp049");
    boss.isBoss = true;
    boss.isElite = false;
    boss.isDying = false;
    boss.enemyType = "scp049";
    boss.behavior = "chase";
    boss.moveSpeed = config.speed;
    boss.contactDamage = config.contactDamage;
    boss.maxHealth = config.health;
    boss.health = config.health;
    boss.xpReward = 0;
    boss.setCircle(18);
    applyDisplayScalePreservingBody(boss, CHARACTER_DISPLAY_SCALE.scp049);
    boss.setDepth(12);
    boss.setCollideWorldBounds(true);
    // Immovable so its own summoned minions cannot shove it around.
    boss.body.setImmovable(true);
    boss.summonCooldownMs = config.summonCooldownMs;
    boss.nextSummonAtMs = this.elapsedSurvivalMs + config.summonInitialDelayMs;
    // Surgery Frenzy state machine. All timers use elapsedSurvivalMs so they are
    // pause-safe (update() stops advancing elapsedSurvivalMs while paused).
    boss.bossState = "normal";
    boss.stateUntilMs = 0;
    boss.nextFrenzyAtMs = this.elapsedSurvivalMs + config.frenzyFirstDelayMs;

    const label = this.add.text(boss.x, boss.y - 36, "SCP-049", {
      fontSize: "14px",
      color: "#b8ffd0"
    });
    label.setOrigin(0.5);
    label.setDepth(13);
    boss.bossLabel = label;
    this.registerTransientEffect(label);
    label.once("destroy", () => {
      boss.bossLabel = null;
    });
    boss.once("destroy", () => {
      if (boss.bossLabel?.active) {
        boss.bossLabel.destroy();
      }
      if (this.bossEnemy === boss) {
        this.bossEnemy = null;
      }
    });

    this.bossEnemy = boss;
    this.bossPhaseActive = true;
    this.cameras.main.shake(220, 0.0045);
    this.playSound("bossAppear");
    this.showTopBanner("终局", "击败 SCP-049 以完成收容", 3200);
  },


  updateBoss() {
    const boss = this.bossEnemy;
    if (!boss?.active || boss.isDying || this.isGameOver) {
      return;
    }

    if (boss.bossLabel?.active) {
      boss.bossLabel.setPosition(boss.x, boss.y - 36);
    }

    const config = BALANCE.boss.scp049;

    // Frenzy roots the boss; otherwise it chases (unless staggered).
    if (config.frenzyEnabled && boss.bossState === "frenzy") {
      boss.body.setVelocity(0, 0);
      // Re-assert the exposed tint each frame: the shared hit-flash clears tint
      // after every hit, and the boss is hit constantly during this window.
      boss.setTint(0xff5a6e);
    } else if ((boss.staggerUntilMs ?? 0) > this.elapsedSurvivalMs) {
      boss.body.setVelocity(0, 0);
    } else {
      this.physics.moveToObject(boss, this.player, boss.moveSpeed);
    }

    const actions = getBossUpdateActions(boss, this.elapsedSurvivalMs, config);

    if (config.frenzyEnabled) {
      if (actions.exitFrenzy) {
        this.exitFrenzy(boss);
      } else {
        if (actions.summonNormal) {
          this.summonBossMinions(boss);
          boss.nextSummonAtMs =
            this.elapsedSurvivalMs + actions.nextSummonDelayMs;
        }
        if (actions.enterFrenzy) {
          this.enterFrenzy(boss);
        }
      }
      return;
    }

    if (actions.summonNormal) {
      this.summonBossMinions(boss);
      boss.nextSummonAtMs =
        this.elapsedSurvivalMs + actions.nextSummonDelayMs;
    }
  },


  enterFrenzy(boss) {
    const config = BALANCE.boss.scp049;
    boss.bossState = "frenzy";
    boss.stateUntilMs = this.elapsedSurvivalMs + config.frenzyDurationMs;
    boss.setTint(0xff5a6e);
    boss.body.setVelocity(0, 0);
    this.summonBossMinions(boss, { frenzy: true });
    this.showTopBanner("外科狂乱", "SCP-049 暴露了弱点", 1800);
  },


  exitFrenzy(boss) {
    const config = BALANCE.boss.scp049;
    this.clearFrenzyTint(boss);
    boss.bossState = "normal";
    const hpRatio = boss.health / boss.maxHealth;
    const cadenceMultiplier =
      hpRatio <= config.enragedHpThreshold ? config.frenzyEnragedMultiplier : 1;
    boss.nextFrenzyAtMs =
      this.elapsedSurvivalMs + config.frenzyCooldownMs * cadenceMultiplier;
  },


  clearFrenzyTint(boss) {
    if (boss?.active) {
      boss.clearTint();
    }
  },


  summonBossMinions(boss, options = {}) {
    const config = BALANCE.boss.scp049;

    if (options.frenzy) {
      this.summonBossFrenzyWave(boss, config);
      return;
    }

    const wavePlan = getBossWavePlan(config);
    const count = Phaser.Math.Between(wavePlan.countMin, wavePlan.countMax);
    const baseConfig = BALANCE.enemy.types[wavePlan.types[0]];
    const scaling = {
      healthMultiplier: wavePlan.healthMultiplier,
      damageMultiplier: wavePlan.damageMultiplier
    };

    for (let index = 0; index < count; index += 1) {
      if (this.enemies.getLength() >= BALANCE.enemy.maxActiveEnemies) {
        break;
      }
      const angle = (Math.PI * 2 * index) / count;
      const spawnX = Phaser.Math.Clamp(
        boss.x + Math.cos(angle) * wavePlan.radius,
        24,
        WORLD_WIDTH - 24
      );
      const spawnY = Phaser.Math.Clamp(
        boss.y + Math.sin(angle) * wavePlan.radius,
        24,
        WORLD_HEIGHT - 24
      );
      const minion = this.enemies.create(spawnX, spawnY, baseConfig.textureKey);
      this.initializeEnemyFromConfig(minion, baseConfig, scaling, false);
      minion.isBossMinion = true;
    }

    this.playSound("bossSummon");
  },


  summonBossFrenzyWave(boss, config) {
    const wavePlan = getBossWavePlan(config, { frenzy: true });
    const count = Phaser.Math.Between(wavePlan.countMin, wavePlan.countMax);
    const scaling = {
      healthMultiplier: wavePlan.healthMultiplier,
      damageMultiplier: wavePlan.damageMultiplier
    };
    const radius = wavePlan.radius;

    for (let index = 0; index < count; index += 1) {
      if (this.enemies.getLength() >= BALANCE.enemy.maxActiveEnemies) {
        break;
      }
      const angle = (Math.PI * 2 * index) / count;
      const spawnX = Phaser.Math.Clamp(
        boss.x + Math.cos(angle) * radius,
        24,
        WORLD_WIDTH - 24
      );
      const spawnY = Phaser.Math.Clamp(
        boss.y + Math.sin(angle) * radius,
        24,
        WORLD_HEIGHT - 24
      );
      const type = Phaser.Utils.Array.GetRandom(wavePlan.types);

      let minion;
      if (type === "drone") {
        const droneConfig = BALANCE.enemy.types.drone;
        minion = this.enemies.create(spawnX, spawnY, droneConfig.textureKey);
        this.initializeEnemyFromConfig(minion, droneConfig, scaling, false);
      } else {
        // Reuse the elite factory but force the spawn onto the frenzy ring
        // instead of the map edge.
        minion = this.spawnEliteAtEdge(type, scaling, { x: spawnX, y: spawnY });
      }

      if (minion) {
        minion.isBossMinion = true;
      }
    }

    this.playSound("bossSummon");
  },


  handleBossDefeat(boss) {
    if (boss.isDying) {
      return;
    }
    boss.isDying = true;
    boss.bossState = "dying";
    this.clearFrenzyTint(boss);
    boss.body.setVelocity(0, 0);
    this.killCount += 1;
    this.bossPhaseActive = false;
    this.showTopBanner("收容完成", "SCP-049 已被击败", 2200);
    this.playEnemyDeathEffect(boss);
    this.time.delayedCall(BALANCE.feedback.deathShrinkMs + 120, () => {
      if (!this.isGameOver) {
        this.triggerVictory();
      }
    });
  },


  stopRegularSpawning() {
    this.regularSpawningActive = false;
    if (this.spawnEvent) {
      this.spawnEvent.remove(false);
      this.spawnEvent = null;
    }
  },


  clearRegularEnemies() {
    for (const enemy of this.enemies.getChildren()) {
      if (enemy.active && !enemy.isBoss) {
        enemy.destroy();
      }
    }
  },


  findNearestEnemy(
    maxDistance = Number.POSITIVE_INFINITY,
    originX = this.player.x,
    originY = this.player.y,
    excludeSet = null,
    prioritizeBoss = false
  ) {
    if (prioritizeBoss && this.bossEnemy?.active && !this.bossEnemy.isDying) {
      const boss = this.bossEnemy;
      const bossDistance = Phaser.Math.Distance.Between(
        originX,
        originY,
        boss.x,
        boss.y
      );
      if (bossDistance <= maxDistance) {
        return boss;
      }
    }

    // For bounded searches use the spatial grid so we only test enemies in the
    // cells the search radius can reach, instead of scanning all 200+ enemies.
    if (Number.isFinite(maxDistance)) {
      return this.findNearestEnemyInGrid(
        maxDistance,
        originX,
        originY,
        excludeSet
      );
    }

    let nearest = null;
    let nearestDist = Number.POSITIVE_INFINITY;

    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active || enemy.isDying) {
        continue;
      }
      if (excludeSet && excludeSet.has(enemy)) {
        continue;
      }
      const dist = Phaser.Math.Distance.Between(
        originX,
        originY,
        enemy.x,
        enemy.y
      );
      if (dist <= maxDistance && dist < nearestDist) {
        nearest = enemy;
        nearestDist = dist;
      }
    }

    return nearest;
  },


  // Lazily (re)build a uniform grid of enemy positions, at most once per frame.
  // elapsedSurvivalMs is constant within a frame, so keying on it rebuilds exactly
  // once; all findNearestEnemy calls in a frame happen before enemies move.
  ensureEnemyGrid() {
    if (
      this._enemyGrid &&
      this._enemyGridAtMs === this.elapsedSurvivalMs
    ) {
      return this._enemyGrid;
    }

    const cellSize = ENEMY_GRID_CELL_SIZE;
    const grid = this._enemyGrid instanceof Map ? this._enemyGrid : new Map();
    grid.clear();

    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active || enemy.isDying) {
        continue;
      }
      const cx = Math.floor(enemy.x / cellSize);
      const cy = Math.floor(enemy.y / cellSize);
      const key = cx * ENEMY_GRID_STRIDE + cy;
      let bucket = grid.get(key);
      if (!bucket) {
        bucket = [];
        grid.set(key, bucket);
      }
      bucket.push(enemy);
    }

    this._enemyGrid = grid;
    this._enemyGridAtMs = this.elapsedSurvivalMs;
    return grid;
  },


  findNearestEnemyInGrid(maxDistance, originX, originY, excludeSet) {
    const cellSize = ENEMY_GRID_CELL_SIZE;
    const grid = this.ensureEnemyGrid();

    const originCx = Math.floor(originX / cellSize);
    const originCy = Math.floor(originY / cellSize);
    const cellRadius = Math.ceil(maxDistance / cellSize);

    let nearest = null;
    let nearestDist = Number.POSITIVE_INFINITY;

    for (let cx = originCx - cellRadius; cx <= originCx + cellRadius; cx += 1) {
      for (let cy = originCy - cellRadius; cy <= originCy + cellRadius; cy += 1) {
        const bucket = grid.get(cx * ENEMY_GRID_STRIDE + cy);
        if (!bucket) {
          continue;
        }
        for (const enemy of bucket) {
          if (!enemy.active || enemy.isDying) {
            continue;
          }
          if (excludeSet && excludeSet.has(enemy)) {
            continue;
          }
          const dist = Phaser.Math.Distance.Between(
            originX,
            originY,
            enemy.x,
            enemy.y
          );
          if (dist <= maxDistance && dist < nearestDist) {
            nearest = enemy;
            nearestDist = dist;
          }
        }
      }
    }

    return nearest;
  }
};
