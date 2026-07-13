import { BALANCE } from "./balance.js";

// Level-up choices. Each entry gates its own availability and applies its effect.

export const UPGRADE_DEFINITIONS = [
  {
    key: "damage",
    name: "伤害提升",
    description: "当前武器伤害提升 20%。",
    kind: "weapon",
    isAvailable: (scene) => !!scene.selectedWeaponId,
    apply: (scene) => {
      const weapon = scene.weapons[scene.selectedWeaponId];
      weapon.damage *= BALANCE.upgrades.damageMultiplier;
      scene.syncCombatStatsFromWeapons();
    }
  },
  {
    key: "attackSpeed",
    name: "攻击速度",
    description: "当前武器冷却缩短 15%。",
    kind: "weapon",
    isAvailable: (scene) => {
      const weaponId = scene.selectedWeaponId;
      if (!weaponId) {
        return false;
      }
      const config = BALANCE.weapons[weaponId];
      return scene.weapons[weaponId].cooldownMs > config.minCooldownMs + 1;
    },
    apply: (scene) => {
      const weaponId = scene.selectedWeaponId;
      const weapon = scene.weapons[weaponId];
      const config = BALANCE.weapons[weaponId];
      weapon.cooldownMs = Math.max(
        config.minCooldownMs,
        weapon.cooldownMs * BALANCE.upgrades.attackSpeedMultiplier
      );
      scene.syncCombatStatsFromWeapons();
    }
  },
  {
    key: "moveSpeed",
    name: "移动速度",
    description: "移动速度提升 10%。",
    kind: "generic",
    isAvailable: () => true,
    apply: (scene) => {
      scene.playerMoveSpeed *= BALANCE.upgrades.movementSpeedMultiplier;
    }
  },
  {
    key: "maxHealth",
    name: "最大生命值",
    description: "最大生命值 +20，并恢复 20 点生命。",
    kind: "generic",
    isAvailable: () => true,
    apply: (scene) => {
      scene.maxHealth += BALANCE.upgrades.maxHealthBonus;
      scene.health = Math.min(
        scene.maxHealth,
        scene.health + BALANCE.upgrades.maxHealthHealOnPick
      );
    }
  },
  {
    key: "projectileCount",
    name: "并联火控",
    description: "增加一条同步模块通道。",
    kind: "weapon",
    weaponId: "pistol",
    isAvailable: (scene) =>
      scene.selectedWeaponId === "pistol" &&
      scene.projectileCount < BALANCE.combat.maxProjectiles,
    apply: (scene) => {
      scene.projectileCount = Math.min(
        BALANCE.combat.maxProjectiles,
        scene.projectileCount + 1
      );
    }
  },
  {
    key: "penetration",
    name: "弹丸穿透",
    description: "子弹额外穿透一名敌人。",
    kind: "weapon",
    weaponId: "pistol",
    isAvailable: (scene) => scene.selectedWeaponId === "pistol",
    apply: (scene) => {
      scene.bulletPenetration += 1;
    }
  },
  {
    key: "pickupRadius",
    name: "拾取范围",
    description: "经验拾取范围提升 25%。",
    kind: "generic",
    isAvailable: () => true,
    apply: (scene) => {
      scene.pickupRadius *= BALANCE.upgrades.pickupRadiusMultiplier;
    }
  },
  {
    key: "emergencyHeal",
    name: "紧急治疗",
    description: "立即恢复 25 点生命值。",
    kind: "generic",
    isAvailable: () => true,
    apply: (scene) => {
      scene.health = Math.min(
        scene.maxHealth,
        scene.health + BALANCE.upgrades.emergencyHealAmount
      );
    }
  },
  {
    key: "breacherKnockback",
    name: "击退强化",
    description: "突破器击退效果提升。",
    kind: "weapon",
    weaponId: "shotgun",
    isAvailable: (scene) => scene.selectedWeaponId === "shotgun",
    apply: (scene) => {
      scene.weapons.shotgun.knockbackStrength *=
        BALANCE.weaponUpgrades.breacherKnockbackMultiplier;
    }
  },
  {
    key: "breacherSuppression",
    name: "压制弹",
    description: "命中的敌人会被减速并延长硬直时间。",
    kind: "weapon",
    weaponId: "shotgun",
    isAvailable: (scene) => scene.selectedWeaponId === "shotgun",
    apply: (scene) => {
      scene.weapons.shotgun.suppressionSlowMultiplier = Math.max(
        0.35,
        scene.weapons.shotgun.suppressionSlowMultiplier *
          BALANCE.weaponUpgrades.breacherSuppressionSlowMultiplier
      );
      scene.weapons.shotgun.staggerDurationMs = Math.round(
        scene.weapons.shotgun.staggerDurationMs *
          BALANCE.weaponUpgrades.breacherSuppressionStaggerMultiplier
      );
    }
  },
  {
    key: "breacherMagazine",
    name: "扩容弹匣",
    description: "弹匣容量 +1，装填时间略缩短。",
    kind: "weapon",
    weaponId: "shotgun",
    isAvailable: (scene) => scene.selectedWeaponId === "shotgun",
    apply: (scene) => {
      const weapon = scene.weapons.shotgun;
      weapon.magazineSize += BALANCE.weaponUpgrades.breacherMagazineSizeBonus;
      weapon.currentShells = Math.min(weapon.currentShells + 1, weapon.magazineSize);
      weapon.reloadDurationMs = Math.max(
        900,
        Math.round(
          weapon.reloadDurationMs * BALANCE.weaponUpgrades.breacherReloadDurationMultiplier
        )
      );
    }
  },
  {
    key: "teslaChains",
    name: "额外链击",
    description: "额外命中一名敌人，最多 8 个目标。",
    kind: "weapon",
    weaponId: "tesla",
    isAvailable: (scene) =>
      scene.selectedWeaponId === "tesla" &&
      scene.weapons.tesla.chainTargets < BALANCE.weapons.tesla.maxChainTargets,
    apply: (scene) => {
      scene.weapons.tesla.chainTargets = Math.min(
        BALANCE.weapons.tesla.maxChainTargets,
        scene.weapons.tesla.chainTargets + 1
      );
    }
  },
  {
    key: "teslaCooldown",
    name: "快速放电",
    description: "特斯拉冷却缩短 12%。",
    kind: "weapon",
    weaponId: "tesla",
    isAvailable: (scene) =>
      scene.selectedWeaponId === "tesla" &&
      scene.weapons.tesla.cooldownMs > BALANCE.weapons.tesla.minCooldownMs + 1,
    apply: (scene) => {
      scene.weapons.tesla.cooldownMs = Math.max(
        BALANCE.weapons.tesla.minCooldownMs,
        scene.weapons.tesla.cooldownMs * BALANCE.weaponUpgrades.teslaCooldownMultiplier
      );
    }
  },
  {
    key: "pistolBoomerang",
    name: "回旋弹",
    description: "【质变】子弹抵达射程后折返飞回，回程可再次命中。",
    kind: "weapon",
    weaponId: "pistol",
    isMutation: true,
    isAvailable: (scene) =>
      scene.selectedWeaponId === "pistol" && !scene.weaponMutations.pistolBoomerang,
    apply: (scene) => {
      scene.weaponMutations.pistolBoomerang = true;
    }
  },
  {
    key: "breacherExplosive",
    name: "爆炸弹",
    description: "【质变】弹丸命中时引发小范围爆炸，波及周围敌人。",
    kind: "weapon",
    weaponId: "shotgun",
    isMutation: true,
    isAvailable: (scene) =>
      scene.selectedWeaponId === "shotgun" && !scene.weaponMutations.breacherExplosive,
    apply: (scene) => {
      scene.weaponMutations.breacherExplosive = true;
    }
  },
  {
    key: "teslaField",
    name: "常驻电场",
    description: "【质变】玩家周身持续释放电场，周期性电击近身敌人。",
    kind: "weapon",
    weaponId: "tesla",
    isMutation: true,
    isAvailable: (scene) =>
      scene.selectedWeaponId === "tesla" && !scene.weaponMutations.teslaField,
    apply: (scene) => {
      scene.weaponMutations.teslaField = true;
      scene.teslaFieldNextTickAtMs =
        scene.elapsedSurvivalMs + BALANCE.weaponUpgrades.teslaFieldTickMs;
    }
  }
];
