// Central tuning table. Every gameplay number lives here for fast iteration.

export const BALANCE = {
  match: {
    survivalDurationMs: 360000,
    bossSpawnAtMs: 360000,
    powerOutageAtMs: 180000,
    scp500SpawnAtMs: 240000
  },
  player: {
    // Core survivability values.
    baseMaxHealth: 100,
    baseMoveSpeed: 220,
    damageCooldownMs: 500,
    basePickupRadius: 56,
    // Dodge dash (SPACE): burst of speed with brief invulnerability.
    dashSpeed: 720,
    dashDurationMs: 160,
    dashCooldownMs: 2200,
    dashInvulnerabilityMs: 260
  },
  combat: {
    // Baseline weapon feel.
    baseBulletDamage: 20,
    bulletSpeed: 420,
    bulletLifetimeMs: 1250,
    shootBaseCooldownMs: 280,
    shootMinCooldownMs: 80,
    maxProjectiles: 5,
    enemyProjectileSpeed: 270,
    enemyProjectileLifetimeMs: 2500
  },
  weapons: {
    pistol: {
      id: "pistol",
      name: "基金会勤务手枪",
      permanentlyUnlocked: true,
      unlockCost: 0,
      unlockDescription: "标准配发副武器。",
      baseDamage: 20,
      baseCooldownMs: 280,
      minCooldownMs: 80,
      range: 640,
      projectileSpeed: 420
    },
    shotgun: {
      id: "shotgun",
      name: "基金会收容突破器",
      permanentlyUnlocked: true,
      unlockCost: 0,
      unlockDescription: "近距离收容突破平台。",
      baseDamage: 8,
      baseCooldownMs: 1300,
      minCooldownMs: 480,
      basePelletCount: 5,
      maxPelletCount: 10,
      spreadDeg: 50,
      triggerRange: 180,
      range: 230,
      projectileSpeed: 500
    },
    tesla: {
      id: "tesla",
      name: "特斯拉发射器",
      permanentlyUnlocked: true,
      unlockCost: 0,
      unlockDescription: "电弧链式放电武器系统。",
      baseDamage: 18,
      baseCooldownMs: 1600,
      minCooldownMs: 520,
      range: 320,
      baseChainTargets: 3,
      maxChainTargets: 8,
      baseChainSearchRadius: 180,
      chainDamageFalloff: 0.8
    }
  },
  weaponUpgrades: {
    breacherKnockbackMultiplier: 1.45,
    breacherSuppressionSlowMultiplier: 0.72,
    breacherSuppressionStaggerMultiplier: 1.4,
    breacherMagazineSizeBonus: 1,
    breacherReloadDurationMultiplier: 0.88,
    teslaCooldownMultiplier: 0.88,
    // Mutation (质变) upgrades — one per weapon, changes how the weapon plays.
    boomerangReturnSpeedMultiplier: 1.1,
    breacherExplosionRadius: 96,
    breacherExplosionDamageMultiplier: 0.6,
    teslaFieldRadius: 130,
    teslaFieldTickMs: 600,
    teslaFieldDamageMultiplier: 0.45
  },
  meta: {
    // Local-storage meta progression: credits earned per run, spent on perks.
    killCreditRate: 0.5,
    timeCreditRate: 0.4,
    victoryBonus: 200
  },
  enemy: {
    maxActiveEnemies: 230,
    // Every enemy periodically clones itself. Bounded by maxActiveEnemies so it
    // cannot grow without limit.
    replication: {
      enabled: true,
      intervalMinMs: 6000,
      intervalMaxMs: 9000
    },
    spawn: {
      startIntervalMs: 950,
      minIntervalMs: 250,
      intervalRampSeconds: 240,
      phaseOneEndS: 60,
      phaseTwoEndS: 120,
      phaseThreeEndS: 240
    },
    scaling: {
      maxHealthBonus: 0.35,
      healthRampSeconds: 360,
      maxDamageBonus: 0.22,
      damageRampSeconds: 420
    },
    elite: {
      firstAppearanceSeconds: 90,
      earlyMaxActive: 3,
      lateMaxActive: 5,
      lateMaxActiveStartSeconds: 240,
      supplyDropChance: 0.2,
      neutralizedTextMs: 800,
      spawn: {
        earlySeconds: 150,
        lateSeconds: 240
      },
      types: {
        riotUnit: {
          type: "riotUnit",
          label: "防暴镇压单位",
          health: 180,
          speed: 70,
          contactDamage: 18,
          xpReward: 8,
          color: 0x4d5b78,
          frontDamageMultiplier: 0.4,
          sideDamageMultiplier: 1,
          rearDamageMultiplier: 1.2,
          frontArcDegrees: 120,
          chargeCooldownMs: 5000,
          chargeWarningMs: 800,
          chargeDurationMs: 450,
          chargeSpeed: 360
        },
        blinkStalker: {
          type: "blinkStalker",
          label: "闪现潜行者",
          health: 90,
          speed: 130,
          contactDamage: 15,
          xpReward: 6,
          color: 0x7c8dff,
          teleportCooldownMs: 4500,
          teleportWarningMs: 700,
          minDestinationDistance: 100,
          maxDestinationDistance: 160,
          postTeleportDashMs: 320,
          dashSpeed: 320
        },
        biomass: {
          type: "biomass",
          label: "复制生物体",
          health: 140,
          speed: 80,
          contactDamage: 14,
          xpReward: 5,
          color: 0x51cb79,
          childCount: 3
        },
        biomassChild: {
          type: "biomassChild",
          label: "生物体碎片",
          health: 20,
          speed: 160,
          contactDamage: 6,
          xpReward: 1,
          color: 0x7adf95
        }
      }
    },
    types: {
      infectedStaff: {
        type: "infectedStaff",
        label: "感染职员",
        health: 30,
        speed: 110,
        contactDamage: 10,
        xpReward: 1,
        textureKey: "enemy-infected",
        color: 0xff4040,
        bodyShape: "circle",
        bodyRadius: 10,
        behavior: "chase"
      },
      crawler: {
        type: "crawler",
        label: "异常爬行者",
        health: 15,
        speed: 190,
        contactDamage: 8,
        xpReward: 1,
        textureKey: "enemy-crawler",
        color: 0xff8a3d,
        bodyShape: "circle",
        bodyRadius: 8,
        behavior: "chase"
      },
      drone: {
        type: "drone",
        label: "安保无人机",
        health: 25,
        speed: 100,
        contactDamage: 5,
        projectileDamage: 10,
        shootCooldownMs: 2000,
        preferredRangeMin: 240,
        preferredRangeMax: 300,
        xpReward: 2,
        textureKey: "enemy-drone",
        color: 0x9b4dff,
        bodyShape: "box",
        bodySize: 18,
        behavior: "ranged"
      }
    }
  },
  xp: {
    gemValue: 1,
    firstLevelRequirement: 8,
    requirementGrowthPerLevel: 5
  },
  upgrades: {
    damageMultiplier: 1.2,
    attackSpeedMultiplier: 0.85,
    movementSpeedMultiplier: 1.1,
    maxHealthBonus: 20,
    maxHealthHealOnPick: 20,
    emergencyHealAmount: 25,
    projectileSpreadDeg: 10,
    pickupRadiusMultiplier: 1.25,
    rerollsPerRun: 3,
    skipHealAmount: 8
  },
  feedback: {
    enemyHitFlashMs: 80,
    damageNumberDurationMs: 420,
    damageNumberRisePx: 20,
    deathBurstParticles: 6,
    deathShrinkMs: 90,
    impactDurationMs: 120,
    muzzleDurationMs: 90,
    playerDamageTintMs: 110
  },
  audio: {
    enabled: true,
    masterGain: 0.18
  },
  pickups: {
    combatStim: {
      healAmount: 15,
      speedMultiplier: 1.2,
      durationMs: 6000
    },
    scp500: {
      healAmount: 60
    }
  },
  boss: {
    scp049: {
      health: 2500,
      speed: 85,
      contactDamage: 20,
      summonInitialDelayMs: 5000,
      summonCooldownMs: 11000,
      enragedHpThreshold: 0.5,
      // Deprecated fallback: only read on the frenzyEnabled=false rollback branch
      // (see updateBoss). Kept so disabling the frenzy mechanic restores the
      // original under-50%-HP faster-trickle behavior exactly.
      enragedSummonMultiplier: 0.6,
      summonCountMin: 10,
      summonCountMax: 10,
      minionHealthMultiplier: 0.6,
      minionDamageMultiplier: 0.85,
      introDelayMs: 2800,
      shotgunDamageMultiplier: 1.5,
      // Surgery Frenzy (Option C): explicit telegraphed root-and-summon window.
      // frenzyEnabled=false reverts to the trickle summon + enragedSummonMultiplier.
      frenzyEnabled: true,
      frenzyFirstDelayMs: 12000,
      frenzyCooldownMs: 14000,
      frenzyEnragedMultiplier: 0.65,
      frenzyDurationMs: 2500,
      frenzySummonCountMin: 20,
      frenzySummonCountMax: 20,
      frenzySummonRadius: 190,
      // Frenzy summons a mix of elites and drones at full strength (not the
      // weakened infected staff the normal trickle uses).
      frenzyMinionTypes: ["riotUnit", "blinkStalker", "biomass", "drone"],
      frenzyMinionHealthMultiplier: 1.0,
      frenzyMinionDamageMultiplier: 1.0,
      exposedDamageMultiplier: 1.35,
      exposedDamageCap: 2.0
    }
  },
  facility: {
    events: {
      powerOutage: {
        name: "电力故障",
        warning: "电力系统不稳定，应急照明即将失效。",
        durationMs: 25000,
        crawlerWeightBonus: 0.2
      }
    }
  },
  timeline: {
    phaseFiveSpawnIntervalMultiplier: 0.88,
    phaseSixExtraSpawnBonus: 0.12,
    effects: {
      stageTwoEnemySpeedMultiplier: 1.04,
      stageThreeEnemySpeedMultiplier: 1.08,
      stageFourEnemySpeedMultiplier: 1.1,
      bulletDeviationDeg: 2.5,
      decoyLifetimeMs: 3000,
      decoySpawnMinMs: 6500,
      decoySpawnMaxMs: 9800,
      enemyTeleportMinMs: 3500,
      enemyTeleportMaxMs: 6200,
      enemyTeleportDistance: 70
    },
    phases: [
      {
        id: 1,
        atMs: 0,
        name: "第一阶段：职员感染",
        effects: {
          decoys: false,
          teleport: false,
          hudCorruption: false,
          bulletDeviation: false,
          screenShake: false
        }
      },
      {
        id: 2,
        atMs: 60000,
        name: "第二阶段：爬行者渗入",
        effects: {
          decoys: false,
          teleport: false,
          hudCorruption: false,
          bulletDeviation: false,
          screenShake: false
        }
      },
      {
        id: 3,
        atMs: 120000,
        name: "第三阶段：无人机部署",
        effects: {
          decoys: true,
          teleport: false,
          hudCorruption: false,
          bulletDeviation: false,
          screenShake: false
        }
      },
      {
        id: 4,
        atMs: 180000,
        name: "第四阶段：电力故障",
        effects: {
          decoys: true,
          teleport: false,
          hudCorruption: false,
          bulletDeviation: false,
          screenShake: false
        }
      },
      {
        id: 5,
        atMs: 240000,
        name: "第五阶段：异常介入",
        effects: {
          decoys: true,
          teleport: true,
          hudCorruption: false,
          bulletDeviation: false,
          screenShake: false
        }
      },
      {
        id: 6,
        atMs: 300000,
        name: "第六阶段：收容加压",
        effects: {
          decoys: true,
          teleport: true,
          hudCorruption: true,
          bulletDeviation: true,
          screenShake: true
        }
      },
      {
        id: 7,
        atMs: 360000,
        name: "终局：SCP-049",
        effects: {
          decoys: false,
          teleport: false,
          hudCorruption: false,
          bulletDeviation: false,
          screenShake: false
        }
      }
    ]
  }
};

