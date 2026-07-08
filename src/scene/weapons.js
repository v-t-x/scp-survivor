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

// Domain mixin: weapons. Methods are Object.assign'd onto PrototypeScene.prototype.
export const weaponsMixin = {

  initWeapons() {
    const selected = this.selectedWeaponId;
    this.weapons = {
      pistol: {
        id: BALANCE.weapons.pistol.id,
        name: BALANCE.weapons.pistol.name,
        currentLevel: selected === "pistol" ? 1 : 0,
        unlocked: selected === "pistol",
        damage: BALANCE.weapons.pistol.baseDamage,
        cooldownMs: BALANCE.weapons.pistol.baseCooldownMs,
        range: BALANCE.weapons.pistol.range,
        projectileSpeed: BALANCE.weapons.pistol.projectileSpeed,
        nextAttackAtMs: 0
      },
      shotgun: {
        id: BALANCE.weapons.shotgun.id,
        name: BALANCE.weapons.shotgun.name,
        currentLevel: selected === "shotgun" ? 1 : 0,
        unlocked: selected === "shotgun",
        damage: BALANCE.weapons.shotgun.baseDamage,
        cooldownMs: BALANCE.weapons.shotgun.baseCooldownMs,
        range: BALANCE.weapons.shotgun.range,
        triggerRange: BALANCE.weapons.shotgun.triggerRange,
        projectileSpeed: BALANCE.weapons.shotgun.projectileSpeed,
        pelletCount: BALANCE.weapons.shotgun.basePelletCount,
        spreadDeg: BALANCE.weapons.shotgun.spreadDeg,
        magazineSize: 4,
        currentShells: selected === "shotgun" ? 4 : 0,
        reloadDurationMs: 2000,
        reloadEndAtMs: 0,
        isReloading: false,
        knockbackStrength: 330,
        staggerDurationMs: 320,
        suppressionSlowMultiplier: 1,
        nextShotId: 1,
        nextAttackAtMs: 0
      },
      tesla: {
        id: BALANCE.weapons.tesla.id,
        name: BALANCE.weapons.tesla.name,
        currentLevel: selected === "tesla" ? 1 : 0,
        unlocked: selected === "tesla",
        damage: BALANCE.weapons.tesla.baseDamage,
        cooldownMs: BALANCE.weapons.tesla.baseCooldownMs,
        range: BALANCE.weapons.tesla.range,
        chainTargets: BALANCE.weapons.tesla.baseChainTargets,
        chainSearchRadius: BALANCE.weapons.tesla.baseChainSearchRadius,
        nextAttackAtMs: 0
      }
    };
    this.syncCombatStatsFromWeapons();
  },


  syncCombatStatsFromWeapons() {
    const weaponId = this.selectedWeaponId;
    if (!weaponId || !this.weapons[weaponId]?.unlocked) {
      return;
    }
    const weapon = this.weapons[weaponId];
    this.bulletDamage = weapon.damage;
    this.shootIntervalMs = weapon.cooldownMs;
  },


  updateWeapons() {
    for (const weapon of Object.values(this.weapons)) {
      if (!weapon.unlocked) {
        continue;
      }

      if (weapon.id === "shotgun") {
        this.updateBreacherReloadState(weapon);
      }

      if (this.elapsedSurvivalMs < weapon.nextAttackAtMs) {
        continue;
      }

      let didAttack = false;
      if (weapon.id === "pistol") {
        didAttack = this.attackWithPistol(weapon);
      } else if (weapon.id === "shotgun") {
        didAttack = this.attackWithShotgun(weapon);
      } else if (weapon.id === "tesla") {
        didAttack = this.attackWithTesla(weapon);
      }

      weapon.nextAttackAtMs =
        this.elapsedSurvivalMs +
        (didAttack ? weapon.cooldownMs : Math.min(weapon.cooldownMs, 120));
    }

    if (this.weaponMutations.teslaField && this.weapons.tesla.unlocked) {
      this.updateTeslaField();
    }
  },


  updateTeslaField() {
    if (this.elapsedSurvivalMs < this.teslaFieldNextTickAtMs) {
      return;
    }
    this.teslaFieldNextTickAtMs =
      this.elapsedSurvivalMs + BALANCE.weaponUpgrades.teslaFieldTickMs;

    const radius = BALANCE.weaponUpgrades.teslaFieldRadius;
    const damage = Math.max(
      1,
      Math.round(
        this.weapons.tesla.damage * BALANCE.weaponUpgrades.teslaFieldDamageMultiplier
      )
    );
    const px = this.player.x;
    const py = this.player.y;

    const grid = this.ensureEnemyGrid();
    const cellSize = ENEMY_GRID_CELL_SIZE;
    const cx = Math.floor(px / cellSize);
    const cy = Math.floor(py / cellSize);
    const cellRadius = Math.ceil(radius / cellSize);
    for (let gx = cx - cellRadius; gx <= cx + cellRadius; gx += 1) {
      for (let gy = cy - cellRadius; gy <= cy + cellRadius; gy += 1) {
        const bucket = grid.get(gx * ENEMY_GRID_STRIDE + gy);
        if (!bucket) {
          continue;
        }
        for (const enemy of bucket) {
          if (!enemy.active || enemy.isDying) {
            continue;
          }
          if (Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y) <= radius) {
            this.damageEnemy(enemy, damage, enemy.x, enemy.y, px, py, {
              sourceWeaponId: "tesla"
            });
          }
        }
      }
    }

    this.spawnTeslaFieldPulse(px, py, radius);
  },


  spawnTeslaFieldPulse(x, y, radius) {
    const pulse = this.add.circle(x, y, radius, 0x74e0ff, 0.16);
    pulse.setDepth(15);
    this.registerTransientEffect(pulse);
    this.tweens.add({
      targets: pulse,
      scale: 1.15,
      alpha: 0,
      duration: BALANCE.weaponUpgrades.teslaFieldTickMs * 0.8,
      onComplete: () => pulse.destroy()
    });
  },


  updateBreacherReloadState(weapon) {
    if (weapon.isReloading && this.elapsedSurvivalMs >= weapon.reloadEndAtMs) {
      weapon.currentShells = weapon.magazineSize;
      weapon.isReloading = false;
      weapon.reloadEndAtMs = 0;
    }

    if (!weapon.isReloading && weapon.currentShells <= 0) {
      weapon.isReloading = true;
      weapon.reloadEndAtMs = this.elapsedSurvivalMs + weapon.reloadDurationMs;
      weapon.nextAttackAtMs = weapon.reloadEndAtMs;
    }
  },


  updatePlayerBullets() {
    const margin = 18;
    for (const bullet of this.bullets.getChildren()) {
      const isExpired = this.elapsedSurvivalMs >= bullet.expireAtMs;
      const distanceFromOrigin = Phaser.Math.Distance.Between(
        bullet.originX ?? bullet.x,
        bullet.originY ?? bullet.y,
        bullet.x,
        bullet.y
      );
      const exceededRange =
        bullet.maxRange !== undefined && distanceFromOrigin > bullet.maxRange;
      const outOfBounds =
        bullet.x < -margin ||
        bullet.x > WORLD_WIDTH + margin ||
        bullet.y < -margin ||
        bullet.y > WORLD_HEIGHT + margin;

      // Boomerang mutation: pistol bullets fold back toward the player at max
      // range instead of despawning, and only die once the return leg runs out.
      if (
        bullet.weaponId === "pistol" &&
        this.weaponMutations.pistolBoomerang &&
        !bullet.isReturning &&
        exceededRange &&
        !outOfBounds
      ) {
        this.startBoomerangReturn(bullet);
        continue;
      }

      if (isExpired || exceededRange || outOfBounds) {
        bullet.destroy();
      }
    }
  },


  startBoomerangReturn(bullet) {
    bullet.isReturning = true;
    // Re-anchor range/expiry from the turn-around point so the return leg gets
    // its own full travel budget back toward the player.
    const speed = Math.hypot(bullet.body.velocity.x, bullet.body.velocity.y) || 1;
    const returnSpeed = speed * BALANCE.weaponUpgrades.boomerangReturnSpeedMultiplier;
    const angle = Phaser.Math.Angle.Between(
      bullet.x,
      bullet.y,
      this.player.x,
      this.player.y
    );
    bullet.originX = bullet.x;
    bullet.originY = bullet.y;
    bullet.expireAtMs =
      this.elapsedSurvivalMs + (bullet.maxRange / returnSpeed) * 1000 + 120;
    // Let a returning bullet strike enemies it passed through on the way out.
    bullet.remainingPenetration = Math.max(bullet.remainingPenetration, 2);
    bullet.body.setVelocity(
      Math.cos(angle) * returnSpeed,
      Math.sin(angle) * returnSpeed
    );
  },


  updateEnemyProjectiles() {
    const margin = 16;
    for (const projectile of this.enemyProjectiles.getChildren()) {
      const isExpired = this.elapsedSurvivalMs >= projectile.expireAtMs;
      const outOfBounds =
        projectile.x < -margin ||
        projectile.x > WORLD_WIDTH + margin ||
        projectile.y < -margin ||
        projectile.y > WORLD_HEIGHT + margin;

      if (isExpired || outOfBounds) {
        projectile.destroy();
      }
    }
  },


  attackWithPistol(weapon) {
    const nearest = this.findNearestEnemy(weapon.range);
    if (!nearest) {
      return false;
    }

    const baseAngle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      nearest.x,
      nearest.y
    );
    this.spawnMuzzleFlash(baseAngle);
    this.playSound("shoot");

    const projectileTotal = Math.min(
      this.projectileCount,
      BALANCE.combat.maxProjectiles
    );

    for (let index = 0; index < projectileTotal; index += 1) {
      const spreadStepRadians = Phaser.Math.DegToRad(
        BALANCE.upgrades.projectileSpreadDeg
      );
      const spreadOffset = (index - (projectileTotal - 1) / 2) * spreadStepRadians;
      const bulletAngle = baseAngle + spreadOffset;
      this.spawnPlayerProjectile({
        x: this.player.x,
        y: this.player.y,
        angle: bulletAngle,
        damage: weapon.damage,
        speed: weapon.projectileSpeed,
        range: weapon.range,
        penetration: this.bulletPenetration,
        weaponId: "pistol"
      });
    }
    return true;
  },


  attackWithShotgun(weapon) {
    if (weapon.isReloading || weapon.currentShells <= 0) {
      return false;
    }

    const attackRange =
      this.bossPhaseActive && this.bossEnemy?.active ? weapon.range : weapon.triggerRange;
    const nearest = this.findNearestEnemy(
      attackRange,
      this.player.x,
      this.player.y,
      null,
      this.bossPhaseActive
    );
    if (!nearest) {
      return false;
    }

    const baseAngle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      nearest.x,
      nearest.y
    );
    this.playerFacingAngle = baseAngle;
    this.spawnMuzzleFlash(baseAngle);
    this.playSound("shoot");

    const shotId = weapon.nextShotId++;
    weapon.currentShells -= 1;

    const pelletTotal = weapon.pelletCount;
    const spreadStepRadians = Phaser.Math.DegToRad(
      weapon.spreadDeg / Math.max(1, pelletTotal - 1)
    );
    const spreadStart = -Phaser.Math.DegToRad(weapon.spreadDeg / 2);

    for (let index = 0; index < pelletTotal; index += 1) {
      const angle = baseAngle + spreadStart + spreadStepRadians * index;
      this.spawnPlayerProjectile({
        x: this.player.x,
        y: this.player.y,
        angle,
        damage: weapon.damage,
        speed: weapon.projectileSpeed,
        range: weapon.range,
        penetration: 0,
        weaponId: "shotgun",
        shotId
      });
    }

    if (weapon.currentShells <= 0) {
      weapon.isReloading = true;
      weapon.reloadEndAtMs = this.elapsedSurvivalMs + weapon.reloadDurationMs;
      weapon.nextAttackAtMs = weapon.reloadEndAtMs;
    }

    return true;
  },


  attackWithTesla(weapon) {
    const prioritizeBoss = this.bossPhaseActive;
    const firstTarget = this.findNearestEnemy(
      weapon.range,
      this.player.x,
      this.player.y,
      null,
      prioritizeBoss
    );
    if (!firstTarget) {
      return false;
    }

    if (firstTarget.isBoss) {
      let currentOrigin = { x: this.player.x, y: this.player.y };
      let currentDamage = weapon.damage;
      for (let chainIndex = 0; chainIndex < weapon.chainTargets; chainIndex += 1) {
        this.spawnLightningSegment(
          currentOrigin.x,
          currentOrigin.y,
          firstTarget.x,
          firstTarget.y
        );
        this.damageEnemy(
          firstTarget,
          currentDamage,
          firstTarget.x,
          firstTarget.y,
          currentOrigin.x,
          currentOrigin.y,
          {
            sourceWeaponId: "tesla",
            sourceDistance: Phaser.Math.Distance.Between(
              currentOrigin.x,
              currentOrigin.y,
              firstTarget.x,
              firstTarget.y
            )
          }
        );
        currentOrigin = { x: firstTarget.x, y: firstTarget.y };
        currentDamage *= BALANCE.weapons.tesla.chainDamageFalloff;
      }
      return true;
    }

    const hitEnemies = new Set();
    let currentOrigin = { x: this.player.x, y: this.player.y };
    let currentTarget = firstTarget;
    let currentDamage = weapon.damage;

    for (let chainIndex = 0; chainIndex < weapon.chainTargets; chainIndex += 1) {
      if (!currentTarget || hitEnemies.has(currentTarget) || !currentTarget.active) {
        break;
      }

      hitEnemies.add(currentTarget);
      this.spawnLightningSegment(
        currentOrigin.x,
        currentOrigin.y,
        currentTarget.x,
        currentTarget.y
      );
      this.damageEnemy(
        currentTarget,
        currentDamage,
        currentTarget.x,
        currentTarget.y,
        currentOrigin.x,
        currentOrigin.y,
        {
          sourceWeaponId: "tesla",
          sourceDistance: Phaser.Math.Distance.Between(
            currentOrigin.x,
            currentOrigin.y,
            currentTarget.x,
            currentTarget.y
          )
        }
      );

      currentOrigin = { x: currentTarget.x, y: currentTarget.y };
      currentDamage *= BALANCE.weapons.tesla.chainDamageFalloff;
      currentTarget = this.findNearestEnemy(
        weapon.chainSearchRadius,
        currentOrigin.x,
        currentOrigin.y,
        hitEnemies
      );
    }

    return true;
  },


  spawnPlayerProjectile({
    x,
    y,
    angle,
    damage,
    speed,
    range,
    penetration,
    weaponId = "pistol",
    shotId = 0
  }) {
    let finalAngle = angle;
    if (this.getTimelinePhase().effects.bulletDeviation) {
      finalAngle += Phaser.Math.DegToRad(
        Phaser.Math.FloatBetween(
          -BALANCE.timeline.effects.bulletDeviationDeg,
          BALANCE.timeline.effects.bulletDeviationDeg
        )
      );
    }
    const bullet = this.bullets.create(x, y, "bullet-circle");
    bullet.damage = damage;
    bullet.remainingPenetration = penetration;
    bullet.maxRange = range;
    bullet.originX = x;
    bullet.originY = y;
    bullet.weaponId = weaponId;
    bullet.shotId = shotId;
    bullet.isReturning = false;
    bullet.expireAtMs = this.elapsedSurvivalMs + (range / speed) * 1000 + 60;
    bullet.setCircle(4);

    bullet.body.setVelocity(Math.cos(finalAngle) * speed, Math.sin(finalAngle) * speed);
    return bullet;
  },


  spawnLightningSegment(x1, y1, x2, y2) {
    let graphics = this._lightningPool.pop();
    if (graphics) {
      graphics.clear();
      graphics.setAlpha(1);
      graphics.setActive(true).setVisible(true);
    } else {
      graphics = this.add.graphics();
      graphics.setDepth(19);
    }
    graphics.lineStyle(2, 0x99f0ff, 0.95);
    graphics.beginPath();
    graphics.moveTo(x1, y1);

    const points = 3;
    for (let index = 1; index <= points; index += 1) {
      const t = index / (points + 1);
      const px = Phaser.Math.Linear(x1, x2, t) + Phaser.Math.Between(-8, 8);
      const py = Phaser.Math.Linear(y1, y2, t) + Phaser.Math.Between(-8, 8);
      graphics.lineTo(px, py);
    }
    graphics.lineTo(x2, y2);
    graphics.strokePath();

    this.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 90,
      onComplete: () => this.releaseToPool(this._lightningPool, graphics)
    });
  },


  spawnMuzzleFlash(directionAngle) {
    const flash = this.add.circle(
      this.player.x + Math.cos(directionAngle) * 10,
      this.player.y + Math.sin(directionAngle) * 10,
      5,
      0xffee9c,
      0.85
    );
    flash.setDepth(18);
    this.registerTransientEffect(flash);

    this.tweens.add({
      targets: flash,
      scale: 1.8,
      alpha: 0,
      duration: BALANCE.feedback.muzzleDurationMs,
      onComplete: () => flash.destroy()
    });
  },


  skipToBossPhase() {
    if (!this.isMissionActive || this.isGameOver || this.bossEnemy?.active) {
      return;
    }

    this.elapsedSurvivalMs = Math.max(
      this.elapsedSurvivalMs,
      BALANCE.match.survivalDurationMs
    );
    this.endSurvivalPhase(true);
  }
};
