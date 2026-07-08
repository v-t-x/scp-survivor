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

// Domain mixin: combat. Methods are Object.assign'd onto PrototypeScene.prototype.
export const combatMixin = {

  handleBulletEnemyCollision(bullet, enemy) {
    if (!enemy.active || enemy.isDying) {
      return;
    }

    const damage = Math.max(1, Math.round(bullet.damage ?? this.bulletDamage));
    if (bullet.weaponId === "shotgun") {
      this.applyBreacherPelletEffects(bullet, enemy);
      if (this.weaponMutations.breacherExplosive) {
        this.applyBreacherExplosion(enemy.x, enemy.y, enemy, damage);
      }
    }
    this.damageEnemy(
      enemy,
      damage,
      bullet.x,
      bullet.y,
      bullet.originX ?? this.player.x,
      bullet.originY ?? this.player.y,
      {
        sourceWeaponId: bullet.weaponId ?? "pistol",
        sourceDistance: Phaser.Math.Distance.Between(
          bullet.originX ?? this.player.x,
          bullet.originY ?? this.player.y,
          enemy.x,
          enemy.y
        ),
        shotId: bullet.shotId ?? 0
      }
    );

    if (bullet.remainingPenetration > 0) {
      bullet.remainingPenetration -= 1;
      return;
    }

    bullet.destroy();
  },


  applyBreacherPelletEffects(bullet, enemy) {
    const weapon = this.weapons.shotgun;
    const distanceToPlayer = Phaser.Math.Distance.Between(
      this.player.x,
      this.player.y,
      enemy.x,
      enemy.y
    );

    if (!enemy.isElite) {
      this.applyKnockbackToEnemy(
        enemy,
        this.player.x,
        this.player.y,
        weapon.knockbackStrength
      );
      if (distanceToPlayer <= weapon.triggerRange) {
        enemy.staggerUntilMs = Math.max(
          enemy.staggerUntilMs ?? 0,
          this.elapsedSurvivalMs + weapon.staggerDurationMs
        );
      }
      if (weapon.suppressionSlowMultiplier < 1) {
        enemy.slowUntilMs = Math.max(
          enemy.slowUntilMs ?? 0,
          this.elapsedSurvivalMs + 1400
        );
        enemy.slowMultiplier = Math.min(
          enemy.slowMultiplier ?? 1,
          weapon.suppressionSlowMultiplier
        );
      }
    }

    if (enemy._lastBreacherShotId !== bullet.shotId) {
      enemy._lastBreacherShotId = bullet.shotId;
      enemy._breacherPelletsFromShot = 0;
    }
    enemy._breacherPelletsFromShot += 1;

    if (enemy.isElite && enemy._breacherPelletsFromShot >= 2) {
      this.tryInterruptElite(enemy);
    }
  },


  applyKnockbackToEnemy(enemy, sourceX, sourceY, strength) {
    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, enemy.x, enemy.y);
    enemy.body.setVelocity(Math.cos(angle) * strength, Math.sin(angle) * strength);
    enemy.knockbackUntilMs = this.elapsedSurvivalMs + 240;
  },


  applyBreacherExplosion(x, y, sourceEnemy, pelletDamage) {
    const radius = BALANCE.weaponUpgrades.breacherExplosionRadius;
    const splashDamage = Math.max(
      1,
      Math.round(pelletDamage * BALANCE.weaponUpgrades.breacherExplosionDamageMultiplier)
    );
    // Use the spatial grid so a dense field doesn't cost a full O(n) scan per pellet.
    const grid = this.ensureEnemyGrid();
    const cellSize = ENEMY_GRID_CELL_SIZE;
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    const cellRadius = Math.ceil(radius / cellSize);
    for (let gx = cx - cellRadius; gx <= cx + cellRadius; gx += 1) {
      for (let gy = cy - cellRadius; gy <= cy + cellRadius; gy += 1) {
        const bucket = grid.get(gx * ENEMY_GRID_STRIDE + gy);
        if (!bucket) {
          continue;
        }
        for (const other of bucket) {
          if (other === sourceEnemy || !other.active || other.isDying) {
            continue;
          }
          if (Phaser.Math.Distance.Between(x, y, other.x, other.y) <= radius) {
            this.damageEnemy(other, splashDamage, other.x, other.y, x, y, {
              sourceWeaponId: "shotgun"
            });
          }
        }
      }
    }
    this.spawnExplosionEffect(x, y, radius);
  },


  damageEnemy(
    enemy,
    damageAmount,
    impactX,
    impactY,
    sourceX = this.player.x,
    sourceY = this.player.y,
    combatContext = {}
  ) {
    if (!enemy.active || enemy.isDying) {
      return;
    }

    const damageMultiplier = this.getEnemyDamageTakenMultiplier(
      enemy,
      sourceX,
      sourceY,
      combatContext
    );
    const damage = Math.max(1, Math.round(damageAmount * damageMultiplier));
    enemy.health -= damage;
    this.flashEnemyOnHit(enemy);
    this.spawnFloatingDamage(enemy.x, enemy.y, damage);
    this.spawnImpactEffect(impactX, impactY);
    this.playSound("enemyHit");

    if (enemy.health <= 0) {
      if (enemy.isBoss) {
        this.handleBossDefeat(enemy);
        return;
      }
      this.handleEnemyDefeatRewards(enemy, combatContext);
      this.playEnemyDeathEffect(enemy);
      this.killCount += 1;
    }
  },


  getEnemyDamageTakenMultiplier(enemy, sourceX, sourceY, combatContext = {}) {
    let multiplier = 1;

    if (
      enemy.isBoss &&
      combatContext.sourceWeaponId === "shotgun" &&
      BALANCE.boss.scp049.shotgunDamageMultiplier > 1
    ) {
      multiplier *= BALANCE.boss.scp049.shotgunDamageMultiplier;
    }

    if (!enemy.isElite || enemy.eliteType !== "riotUnit") {
      return multiplier;
    }

    const attackAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, sourceX, sourceY);
    const angleDiff = Phaser.Math.Angle.Wrap(attackAngle - enemy.facingAngle);
    const halfFrontArc = Phaser.Math.DegToRad(enemy.frontArcDegrees / 2);
    const absDiff = Math.abs(angleDiff);

    if (absDiff <= halfFrontArc) {
      return enemy.frontDamageMultiplier;
    }
    if (absDiff >= Math.PI - Phaser.Math.DegToRad(40)) {
      return enemy.rearDamageMultiplier;
    }
    return enemy.sideDamageMultiplier;
  },


  handleEnemyDefeatRewards(enemy, combatContext = {}) {
    if (enemy.isBoss || enemy.isBossMinion) {
      this.dropExperienceGem(enemy.x, enemy.y, enemy.xpReward ?? BALANCE.xp.gemValue);
      return;
    }
    if (enemy.isElite) {
      this.dropEliteRewards(enemy);
    } else {
      this.dropExperienceGem(
        enemy.x,
        enemy.y,
        enemy.xpReward ?? BALANCE.xp.gemValue
      );
    }
  },


  dropEliteRewards(enemy) {
    const gemDrops = Math.max(2, Math.round(enemy.xpReward));
    for (let index = 0; index < gemDrops; index += 1) {
      const offsetX = Phaser.Math.Between(-12, 12);
      const offsetY = Phaser.Math.Between(-12, 12);
      this.dropExperienceGem(enemy.x + offsetX, enemy.y + offsetY, 1);
    }

    this.showEliteNeutralizedText(enemy.x, enemy.y - 28);

    if (enemy.eliteType === "biomass" && enemy.canSplit) {
      for (let index = 0; index < BALANCE.enemy.elite.types.biomass.childCount; index += 1) {
        const angle = (Math.PI * 2 * index) / BALANCE.enemy.elite.types.biomass.childCount;
        const spawnX = Phaser.Math.Clamp(enemy.x + Math.cos(angle) * 26, 20, WORLD_WIDTH - 20);
        const spawnY = Phaser.Math.Clamp(enemy.y + Math.sin(angle) * 26, 20, WORLD_HEIGHT - 20);
        this.spawnBiomassChild(spawnX, spawnY);
      }
    }

    if (Math.random() < BALANCE.enemy.elite.supplyDropChance) {
      this.spawnCombatStim(enemy.x, enemy.y);
    }
  },


  handleSupplyPickupOverlap(_, pickup) {
    if (!pickup.active) {
      return;
    }
    if (pickup.pickupType === "combatStim") {
      this.health = Math.min(this.maxHealth, this.health + BALANCE.pickups.combatStim.healAmount);
      this.moveSpeedBuffMultiplier = BALANCE.pickups.combatStim.speedMultiplier;
      this.activeStimUntilMs = this.elapsedSurvivalMs + BALANCE.pickups.combatStim.durationMs;
      this.updateUI();
    } else if (pickup.pickupType === "scp500") {
      this.health = Math.min(this.maxHealth, this.health + BALANCE.pickups.scp500.healAmount);
      this.playSound("pickupHeal");
      this.updateUI();
    }
    pickup.destroy();
  },


  handlePlayerEnemyOverlap(_, enemy) {
    this.applyPlayerDamage(enemy.contactDamage ?? 1, enemy.x, enemy.y);
  },


  handleEnemyProjectileOverlap(_, projectile) {
    const damage = projectile.damage ?? 1;
    const sourceX = projectile.x;
    const sourceY = projectile.y;
    projectile.destroy();
    this.applyPlayerDamage(damage, sourceX, sourceY);
  },


  applyPlayerDamage(amount, sourceX = this.player.x, sourceY = this.player.y) {
    const now = this.elapsedSurvivalMs;
    if (now < this.playerInvulnerableUntilMs) {
      return;
    }

    this.playerInvulnerableUntilMs = now + BALANCE.player.damageCooldownMs;

    this.health -= amount;
    this.triggerPlayerDamageFeedback();
    this.updateUI();

    if (this.health <= 0) {
      this.health = 0;
      this.triggerGameOver();
    }
  },


  triggerPlayerDamageFeedback() {
    this.player.setTint(0xff6666);
    this.cameras.main.shake(85, 0.0035);
    this.playSound("playerDamage");
    this.time.delayedCall(BALANCE.feedback.playerDamageTintMs, () => {
      if (this.player.active) {
        this.player.clearTint();
      }
    });
  }
};
