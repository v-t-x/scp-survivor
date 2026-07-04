import Phaser from "phaser";

const DEBUG_MODE = false;

const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;

const BALANCE = {
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
    basePickupRadius: 56
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
    teslaCooldownMultiplier: 0.88
  },
  enemy: {
    maxActiveEnemies: 230,
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
      enragedSummonMultiplier: 0.6,
      summonCountMin: 2,
      summonCountMax: 3,
      minionHealthMultiplier: 0.6,
      minionDamageMultiplier: 0.85,
      introDelayMs: 2800,
      shotgunDamageMultiplier: 1.5
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

const UPGRADE_DEFINITIONS = [
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
    name: "额外弹丸",
    description: "每次攻击额外发射一枚弹丸。",
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
  }
];

class PrototypeScene extends Phaser.Scene {
  constructor() {
    super("PrototypeScene");
  }

  create() {
    this.isMissionActive = false;
    this.selectedWeaponId = null;
    this.pendingSelectedWeaponId = null;
    this.elapsedSurvivalMs = 0;
    this.killCount = 0;
    this.maxHealth = BALANCE.player.baseMaxHealth;
    this.health = this.maxHealth;
    this.playerInvulnerableUntilMs = 0;
    this.isGameOver = false;
    this.isLevelUpActive = false;
    this.isResolvingLevelUp = false;
    this.pendingLevelUps = 0;
    this.rerollsRemaining = BALANCE.upgrades.rerollsPerRun;
    this.levelUpOverlay = null;
    this.transientEffects = new Set();
    this.topBannerState = null;
    this.outageVisualStrength = 0;
    this.activeStimUntilMs = 0;
    this.moveSpeedBuffMultiplier = 1;
    this.activeFacilityEvent = null;
    this.activeFacilityEventEndAtMs = 0;
    this.powerOutageTriggered = false;
    this.bossWarningShown = false;
    this.regularSpawningActive = false;
    this.survivalPhaseEnded = false;
    this.scp500Spawned = false;
    this.bossPhaseActive = false;
    this.bossEnemy = null;
    this.bossIntroTimer = null;

    this.level = 1;
    this.currentXp = 0;
    this.xpToNextLevel = this.getRequiredXpForLevel(this.level);
    this.upgradeLevels = Object.fromEntries(
      UPGRADE_DEFINITIONS.map((upgrade) => [upgrade.key, 0])
    );
    this.isVictory = false;
    this.nextInstabilityShakeAtMs = 0;
    this.nextDecoySpawnAtMs = Phaser.Math.Between(
      BALANCE.timeline.effects.decoySpawnMinMs,
      BALANCE.timeline.effects.decoySpawnMaxMs
    );
    this.timelineHudBasePositions = null;

    this.playerMoveSpeed = BALANCE.player.baseMoveSpeed;
    this.playerFacingAngle = 0;
    this.pickupRadius = BALANCE.player.basePickupRadius;
    this.projectileCount = 1;
    this.bulletPenetration = 0;
    this.initWeapons();
    this.soundMuted = false;
    this.audioContext = null;
    this.audioGain = null;

    this.physics.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.setBackgroundColor("#111319");

    this.createPlaceholderTextures();
    this.createArenaDecoration();
    this.createPlayer();
    this.createGroups();
    this.createColliders();
    this.createUI();
    this.createBuildPanel();
    this.setupInputHandlers();
    this.createWeaponSelectionScreen();
    this.updateUI();
  }

  setupInputHandlers() {
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      tab: Phaser.Input.Keyboard.KeyCodes.TAB,
      mute: Phaser.Input.Keyboard.KeyCodes.M
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

    if (DEBUG_MODE) {
      this.input.keyboard.on("keydown-B", () => {
        this.skipToBossPhase();
      });
    }
  }

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
  }

  syncCombatStatsFromWeapons() {
    const weaponId = this.selectedWeaponId;
    if (!weaponId || !this.weapons[weaponId]?.unlocked) {
      return;
    }
    const weapon = this.weapons[weaponId];
    this.bulletDamage = weapon.damage;
    this.shootIntervalMs = weapon.cooldownMs;
  }

  update(_, delta) {
    if (this.isGameOver) {
      return;
    }

    if (!this.isMissionActive) {
      return;
    }

    if (!this.isLevelUpActive) {
      this.elapsedSurvivalMs += delta;
      this.updateTimelineDirector();
      this.updateTimelineEffects();
      this.updateTemporaryBuffs();
      this.updateFacilityEventDirector();
      this.updateScp500Spawn();
      this.handlePlayerMovement();
      this.updateWeapons();
      this.updateEnemies();
      if (this.bossPhaseActive) {
        this.updateBoss();
      }
      this.updatePlayerBullets();
      this.updateEnemyProjectiles();
      this.handleExperienceCollection();
      this.updateSupplyPickups();
      this.updatePickupRadiusIndicator();
    }

    this.updatePlayerInvulnerabilityVisual();
    this.updateFacilityVisualEffects();
    this.updateTimelineHudCorruption();
    this.updateUI();
    if (this.buildPanel.visible) {
      this.updateBuildPanelText();
    }
  }

  createWeaponSelectionScreen() {
    this.setGameplayHudVisible(false);
    this.cameras.main.setBackgroundColor("#080C16");
    this.weaponSelectOverlay = null;
    this.weaponSelectUiObjects = [];
    this.weaponSelectHoveredCardId = null;
    this.weaponSelectButtonHovered = false;

    const cardWidth = 250;
    const cardHeight = 318;

    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 870, 520, 0x111a2e, 1);
    bg.setStrokeStyle(2, 0x6f91d8);
    bg.setDepth(10);
    this.weaponSelectUiObjects.push(bg);

    const topAccent = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 246, 830, 3, 0xa3c1ff, 0.8);
    topAccent.setDepth(11);
    this.weaponSelectUiObjects.push(topAccent);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 205, "选择主武器", {
      fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
      fontSize: "48px",
      fontStyle: "bold",
      color: "#f4f7ff"
    });
    title.setShadow(0, 2, "#05080f", 5, false, true);
    title.setOrigin(0.5);
    title.setDepth(21);
    this.weaponSelectUiObjects.push(title);

    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 168,
      "部署前请选择一套装备。",
      {
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
        fontSize: "20px",
        color: "#c5d2ee"
      }
    );
    subtitle.setOrigin(0.5);
    subtitle.setDepth(21);
    this.weaponSelectUiObjects.push(subtitle);

    this.weaponSelectCards = [];
    const options = [
      {
        id: "pistol",
        symbol: "■",
        role: "可靠的中远距离单体武器",
        difficulty: { label: "简单", color: "#7FE29A" },
        stats: [
          { label: "伤害", value: `${BALANCE.weapons.pistol.baseDamage}` },
          { label: "冷却", value: `${BALANCE.weapons.pistol.baseCooldownMs} ms` },
          { label: "射程", value: `${BALANCE.weapons.pistol.range}` }
        ]
      },
      {
        id: "shotgun",
        symbol: "▲",
        role: "近距离爆发、击退与控场",
        difficulty: { label: "中等", color: "#FFD166" },
        stats: [
          { label: "伤害", value: `${BALANCE.weapons.shotgun.baseDamage}/弹丸` },
          { label: "弹药", value: "4" },
          { label: "装填", value: "2000 ms" }
        ]
      },
      {
        id: "tesla",
        symbol: "≈",
        role: "对密集敌群造成链式伤害",
        difficulty: { label: "中等", color: "#FFD166" },
        stats: [
          { label: "伤害", value: `${BALANCE.weapons.tesla.baseDamage}` },
          { label: "冷却", value: `${BALANCE.weapons.tesla.baseCooldownMs} ms` },
          { label: "链击", value: `${BALANCE.weapons.tesla.baseChainTargets}` }
        ]
      }
    ];

    const startX = GAME_WIDTH / 2 - 270;
    options.forEach((option, index) => {
      const cardX = startX + index * 260;
      const cardY = GAME_HEIGHT / 2 + 4;

      const cardBg = this.add.graphics();
      cardBg.setDepth(20);
      const divider = this.add.graphics();
      divider.setDepth(21);

      const cardHitArea = this.add.rectangle(cardX, cardY, cardWidth, cardHeight, 0xffffff, 0.001);
      cardHitArea.setDepth(20);
      cardHitArea.setInteractive({ useHandCursor: true });
      cardHitArea.on("pointerover", () => {
        this.weaponSelectHoveredCardId = option.id;
        this.refreshWeaponSelectionVisuals();
      });
      cardHitArea.on("pointerout", () => {
        this.weaponSelectHoveredCardId = null;
        this.refreshWeaponSelectionVisuals();
      });
      cardHitArea.on("pointerdown", () => {
        this.pendingSelectedWeaponId = option.id;
        this.refreshWeaponSelectionVisuals();
      });

      const symbolText = this.add.text(cardX, cardY - 124, option.symbol, {
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
        fontSize: "36px",
        color: "#c8ddff"
      });
      symbolText.setOrigin(0.5);
      symbolText.setDepth(21);

      const nameText = this.add.text(cardX, cardY - 68, BALANCE.weapons[option.id].name, {
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
        fontSize: "22px",
        fontStyle: "bold",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 216 },
        lineSpacing: 2
      });
      nameText.setOrigin(0.5);
      nameText.setDepth(21);

      const roleText = this.add.text(cardX, cardY - 2, option.role, {
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
        fontSize: "15px",
        color: "#d6e0f5",
        align: "center",
        wordWrap: { width: 214 },
        lineSpacing: 2
      });
      roleText.setOrigin(0.5);
      roleText.setDepth(21);

      const difficultyBadge = this.add.rectangle(cardX, cardY + 50, 130, 28, 0x101a2f, 1);
      difficultyBadge.setStrokeStyle(1, Phaser.Display.Color.HexStringToColor(option.difficulty.color).color);
      difficultyBadge.setDepth(21);

      const difficultyText = this.add.text(cardX, cardY + 50, `难度：${option.difficulty.label}`, {
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
        fontSize: "15px",
        color: option.difficulty.color
      });
      difficultyText.setOrigin(0.5);
      difficultyText.setDepth(21);

      const selectedLabel = this.add.text(
        cardX + cardWidth / 2 - 12,
        cardY - cardHeight / 2 + 18,
        "已选择",
        {
          fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
          fontSize: "12px",
          fontStyle: "bold",
          color: "#dff0ff",
          backgroundColor: "#35578D",
          padding: { left: 8, right: 8, top: 2, bottom: 2 }
        }
      );
      selectedLabel.setOrigin(1, 0.5);
      selectedLabel.setVisible(false);
      selectedLabel.setDepth(22);

      const statRows = [];
      const statStartY = cardY + 92;
      for (let rowIndex = 0; rowIndex < option.stats.length; rowIndex += 1) {
        const stat = option.stats[rowIndex];
        const rowY = statStartY + rowIndex * 30;
        const statLabel = this.add.text(cardX - 90, rowY, stat.label, {
          fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
          fontSize: "16px",
          color: "#9fb2d8"
        });
        statLabel.setOrigin(0, 0.5);
        statLabel.setDepth(21);
        const statValue = this.add.text(cardX + 90, rowY, stat.value, {
          fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
          fontSize: "16px",
          color: "#f2f6ff"
        });
        statValue.setOrigin(1, 0.5);
        statValue.setDepth(21);
        statRows.push(statLabel, statValue);
      }

      this.weaponSelectCards.push({
        id: option.id,
        cardX,
        cardY,
        cardWidth,
        cardHeight,
        cardBg,
        divider,
        selectedLabel
      });
      this.weaponSelectUiObjects.push(
        cardBg,
        divider,
        cardHitArea,
        symbolText,
        nameText,
        roleText,
        difficultyBadge,
        difficultyText,
        selectedLabel,
        ...statRows
      );
    });

    this.startMissionButton = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 220,
      250,
      58,
      0x2a3242,
      1
    );
    this.startMissionButton.setStrokeStyle(2, 0x475064);
    this.startMissionButton.setDepth(30);
    this.startMissionButton.setInteractive({ useHandCursor: true });
    this.startMissionButton.on("pointerover", () => {
      this.weaponSelectButtonHovered = true;
      this.refreshWeaponSelectionVisuals();
    });
    this.startMissionButton.on("pointerout", () => {
      this.weaponSelectButtonHovered = false;
      this.refreshWeaponSelectionVisuals();
    });
    this.startMissionButton.on("pointerdown", () => {
      if (this.pendingSelectedWeaponId) {
        this.startMissionWithWeapon(this.pendingSelectedWeaponId);
      }
    });

    this.startMissionButtonLabel = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 220,
      "请选择武器",
      {
        fontFamily: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
        fontSize: "24px",
        fontStyle: "bold",
        color: "#7f899c"
      }
    );
    this.startMissionButtonLabel.setOrigin(0.5);
    this.startMissionButtonLabel.setDepth(31);

    this.weaponSelectUiObjects.push(this.startMissionButton, this.startMissionButtonLabel);
    this.refreshWeaponSelectionVisuals();
  }

  refreshWeaponSelectionVisuals() {
    for (const entry of this.weaponSelectCards) {
      const selected = this.pendingSelectedWeaponId === entry.id;
      const hovered = this.weaponSelectHoveredCardId === entry.id;

      let fill = 0x17223a;
      let border = 0x40557f;
      let borderWidth = 2;
      let scale = hovered ? 1.02 : 1;

      if (hovered) {
        fill = 0x1d2b49;
        border = 0x6e91d5;
      }

      if (selected) {
        fill = 0x22345a;
        border = 0x9fc1ff;
        borderWidth = 3;
        scale = 1.02;
      }

      const drawW = entry.cardWidth * scale;
      const drawH = entry.cardHeight * scale;
      const drawX = entry.cardX - drawW / 2;
      const drawY = entry.cardY - drawH / 2;

      entry.cardBg.clear();
      entry.cardBg.fillStyle(fill, 1);
      entry.cardBg.fillRoundedRect(drawX, drawY, drawW, drawH, 10);
      entry.cardBg.lineStyle(borderWidth, border, 1);
      entry.cardBg.strokeRoundedRect(drawX, drawY, drawW, drawH, 10);
      if (selected) {
        entry.cardBg.lineStyle(2, 0x6f9fff, 0.5);
        entry.cardBg.strokeRoundedRect(drawX - 4, drawY - 4, drawW + 8, drawH + 8, 12);
      }

      entry.divider.clear();
      entry.divider.lineStyle(1, 0x50648f, 1);
      entry.divider.lineBetween(
        entry.cardX - 96,
        entry.cardY + 68,
        entry.cardX + 96,
        entry.cardY + 68
      );
      entry.selectedLabel.setVisible(selected);
      entry.selectedLabel.setPosition(
        entry.cardX + drawW / 2 - 12,
        entry.cardY - drawH / 2 + 18
      );
      entry.cardBg.setVisible(true);
      entry.cardBg.setAlpha(1);
      entry.divider.setVisible(true);
      entry.divider.setAlpha(1);
      entry.selectedLabel.setAlpha(1);
      entry.selectedLabel.setDepth(22);
    }

    const canStart = !!this.pendingSelectedWeaponId;
    this.startMissionButton.setFillStyle(
      canStart
        ? this.weaponSelectButtonHovered
          ? 0x678dd7
          : 0x547ac5
        : 0x2a3242,
      1
    );
    this.startMissionButton.setStrokeStyle(2, canStart ? 0xa9c7ff : 0x475064);
    this.startMissionButtonLabel.setText(canStart ? "开始任务" : "请选择武器");
    this.startMissionButtonLabel.setColor(canStart ? "#ffffff" : "#7f899c");
  }

  destroyWeaponSelectionScreen() {
    if (!this.weaponSelectUiObjects) {
      return;
    }
    for (const object of this.weaponSelectUiObjects) {
      if (object?.active) {
        object.destroy();
      }
    }
    this.weaponSelectUiObjects = [];
    this.weaponSelectCards = [];
    this.weaponSelectOverlay = null;
  }

  startMissionWithWeapon(weaponId) {
    if (!weaponId) {
      return;
    }
    this.selectedWeaponId = weaponId;
    this.pendingSelectedWeaponId = weaponId;
    this.isMissionActive = true;
    this.elapsedSurvivalMs = 0;
    this.powerOutageTriggered = false;
    this.bossWarningShown = false;
    this.regularSpawningActive = true;
    this.survivalPhaseEnded = false;
    this.scp500Spawned = false;
    this.bossPhaseActive = false;
    this.bossEnemy = null;
    this.bossIntroTimer = null;
    this.activeFacilityEvent = null;
    this.activeFacilityEventEndAtMs = 0;

    this.initWeapons();
    this.syncCombatStatsFromWeapons();
    this.setupSpawning();
    this.cameras.main.setBackgroundColor("#111319");
    this.setGameplayHudVisible(true);
    this.updateUI();

    this.destroyWeaponSelectionScreen();
  }

  createPlaceholderTextures() {
    const graphics = this.add.graphics();

    graphics.clear();
    graphics.fillStyle(0x3f82ff, 1);
    graphics.fillRect(0, 0, 28, 28);
    graphics.generateTexture("player-rect", 28, 28);

    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.types.infectedStaff.color, 1);
    graphics.fillCircle(10, 10, 10);
    graphics.generateTexture("enemy-infected", 20, 20);

    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.types.crawler.color, 1);
    graphics.fillTriangle(10, 0, 20, 18, 0, 18);
    graphics.generateTexture("enemy-crawler", 20, 20);

    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.types.drone.color, 1);
    graphics.fillRect(0, 0, 22, 22);
    graphics.generateTexture("enemy-drone", 22, 22);

    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.elite.types.riotUnit.color, 1);
    graphics.fillRect(0, 0, 34, 34);
    graphics.generateTexture("elite-riot", 34, 34);

    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.elite.types.blinkStalker.color, 1);
    graphics.fillTriangle(16, 0, 32, 16, 16, 32);
    graphics.fillTriangle(16, 0, 16, 32, 0, 16);
    graphics.generateTexture("elite-blink", 32, 32);

    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.elite.types.biomass.color, 1);
    graphics.fillCircle(18, 18, 18);
    graphics.generateTexture("elite-biomass", 36, 36);

    graphics.clear();
    graphics.fillStyle(BALANCE.enemy.elite.types.biomassChild.color, 1);
    graphics.fillCircle(10, 10, 10);
    graphics.generateTexture("biomass-child", 20, 20);

    graphics.clear();
    graphics.fillStyle(0xffde59, 1);
    graphics.fillCircle(4, 4, 4);
    graphics.generateTexture("bullet-circle", 8, 8);

    graphics.clear();
    graphics.fillStyle(0xff3db9, 1);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture("enemy-projectile", 10, 10);

    graphics.clear();
    graphics.fillStyle(0x50d66c, 1);
    graphics.fillCircle(5, 5, 5);
    graphics.generateTexture("xp-gem", 10, 10);

    graphics.clear();
    graphics.fillStyle(0x9affcc, 1);
    graphics.fillRect(2, 2, 12, 12);
    graphics.fillStyle(0x1b4f36, 1);
    graphics.fillRect(7, 4, 2, 8);
    graphics.fillRect(4, 7, 8, 2);
    graphics.generateTexture("combat-stim", 16, 16);

    graphics.clear();
    graphics.fillStyle(0xff4040, 1);
    graphics.fillCircle(9, 9, 9);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(9, 9, 4);
    graphics.generateTexture("scp500", 18, 18);

    graphics.clear();
    graphics.fillStyle(0x1a4d32, 1);
    graphics.fillRect(0, 0, 36, 36);
    graphics.fillStyle(0x2d6b45, 1);
    graphics.fillRect(6, 6, 24, 24);
    graphics.lineStyle(2, 0x8fd4a8, 1);
    graphics.strokeRect(0, 0, 36, 36);
    graphics.generateTexture("enemy-scp049", 36, 36);

    graphics.clear();
    const lightRadius = 220;
    const lightCenter = lightRadius;
    for (let radius = lightRadius; radius > 0; radius -= 6) {
      const progress = 1 - radius / lightRadius;
      const alpha = Phaser.Math.Clamp(0.02 + progress * 0.12, 0.02, 0.2);
      graphics.fillStyle(0xffffff, alpha);
      graphics.fillCircle(lightCenter, lightCenter, radius);
    }
    graphics.generateTexture(
      "power-outage-light",
      lightRadius * 2,
      lightRadius * 2
    );

    graphics.destroy();
  }

  createArenaDecoration() {
    const border = this.add.graphics();
    border.lineStyle(2, 0x252c3b, 1);
    border.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.arenaBorder = border;

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x191f2b, 0.45);
    this.arenaGrid = grid;

    const cell = 48;
    for (let x = cell; x < GAME_WIDTH; x += cell) {
      grid.lineBetween(x, 0, x, GAME_HEIGHT);
    }
    for (let y = cell; y < GAME_HEIGHT; y += cell) {
      grid.lineBetween(0, y, GAME_WIDTH, y);
    }
  }

  createPlayer() {
    this.player = this.physics.add.image(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      "player-rect"
    );
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 24);
  }

  createGroups() {
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();
    this.xpGems = this.physics.add.group();
    this.supplyPickups = this.physics.add.group();
    this.instabilityDecoys = this.add.group();
  }

  createColliders() {
    this.physics.add.overlap(
      this.bullets,
      this.enemies,
      this.handleBulletEnemyCollision,
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerEnemyOverlap,
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.enemyProjectiles,
      this.handleEnemyProjectileOverlap,
      null,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.supplyPickups,
      this.handleSupplyPickupOverlap,
      null,
      this
    );
  }

  createUI() {
    this.statsText = this.add.text(14, 12, "", {
      fontSize: "18px",
      color: "#e2e8ff"
    });
    this.statsText.setDepth(45);
    this.statsText.setScrollFactor(0);

    this.levelText = this.add.text(14, 40, "", {
      fontSize: "18px",
      color: "#a7f3d0"
    });
    this.levelText.setDepth(45);
    this.levelText.setScrollFactor(0);

    this.xpBarBackground = this.add.rectangle(15, 72, 250, 14, 0x223344, 1);
    this.xpBarBackground.setOrigin(0, 0);
    this.xpBarBackground.setDepth(45);
    this.xpBarBackground.setScrollFactor(0);

    this.xpBarFill = this.add.rectangle(16, 73, 248, 12, 0x54d67b, 1);
    this.xpBarFill.setOrigin(0, 0);
    this.xpBarFill.setDepth(46);
    this.xpBarFill.setScrollFactor(0);

    this.xpText = this.add.text(272, 67, "", {
      fontSize: "16px",
      color: "#e2e8ff"
    });
    this.xpText.setDepth(45);
    this.xpText.setScrollFactor(0);

    this.muteText = this.add.text(GAME_WIDTH - 14, 14, "", {
      fontSize: "14px",
      color: "#d5d5ff"
    });
    this.muteText.setOrigin(1, 0);
    this.muteText.setDepth(45);
    this.muteText.setScrollFactor(0);
    this.updateMuteText();

    this.pickupRadiusIndicator = this.add.graphics();
    this.pickupRadiusIndicator.setDepth(4);

    this.weaponHudText = this.add.text(14, 98, "", {
      fontSize: "14px",
      color: "#cbd8ff",
      lineSpacing: 3
    });
    this.weaponHudText.setDepth(45);
    this.weaponHudText.setScrollFactor(0);

    this.phaseText = this.add.text(14, 148, "", {
      fontSize: "14px",
      color: "#ffdf9a"
    });
    this.phaseText.setDepth(45);
    this.phaseText.setScrollFactor(0);

    this.eventBannerContainer = this.add.container(0, 0);
    this.eventBannerContainer.setDepth(58);
    this.eventBannerContainer.setVisible(false);
    this.eventBannerBg = this.add.rectangle(GAME_WIDTH / 2, 30, 640, 52, 0x000000, 0.78);
    this.eventBannerBg.setStrokeStyle(2, 0x5f7cb8);
    this.eventBannerTitle = this.add.text(GAME_WIDTH / 2, 20, "", {
      fontSize: "18px",
      color: "#fff2be"
    });
    this.eventBannerTitle.setOrigin(0.5);
    this.eventBannerDetail = this.add.text(GAME_WIDTH / 2, 38, "", {
      fontSize: "13px",
      color: "#d8e6ff"
    });
    this.eventBannerDetail.setOrigin(0.5);
    this.eventBannerContainer.add([
      this.eventBannerBg,
      this.eventBannerTitle,
      this.eventBannerDetail
    ]);

    this.outageDarknessRt = this.add.renderTexture(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.outageDarknessRt.setOrigin(0, 0);
    this.outageDarknessRt.setScrollFactor(0);
    this.outageDarknessRt.setDepth(40);
    this.outageDarknessRt.setVisible(false);
    this.outageLightSprite = this.add.image(0, 0, "power-outage-light");
    this.outageLightSprite.setVisible(false);
    this.outageLightSprite.setOrigin(0.5);

    this.timelineHudBasePositions = [
      [this.statsText, this.statsText.x, this.statsText.y],
      [this.levelText, this.levelText.x, this.levelText.y],
      [this.xpText, this.xpText.x, this.xpText.y],
      [this.weaponHudText, this.weaponHudText.x, this.weaponHudText.y],
      [this.phaseText, this.phaseText.x, this.phaseText.y]
    ];
  }

  updateMuteText() {
    if (!this.muteText) {
      return;
    }
    if (!BALANCE.audio.enabled) {
      this.muteText.setText("音频：关闭");
      return;
    }
    this.muteText.setText(this.soundMuted ? "音频：静音 (M)" : "音频：开启 (M)");
  }

  setGameplayHudVisible(isVisible) {
    const targets = [
      this.statsText,
      this.levelText,
      this.xpBarBackground,
      this.xpBarFill,
      this.xpText,
      this.muteText,
      this.weaponHudText,
      this.phaseText,
      this.pickupRadiusIndicator
    ];
    for (const target of targets) {
      if (target) {
        target.setVisible(isVisible);
      }
    }
  }

  createBuildPanel() {
    this.buildPanel = this.add.container(0, 0);
    this.buildPanel.setDepth(56);
    this.buildPanel.setVisible(false);

    const panelBackground = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      500,
      560,
      0x000000,
      0.78
    );
    panelBackground.setStrokeStyle(2, 0x4060a0);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 250, "当前构筑 (TAB)", {
      fontSize: "28px",
      color: "#ffffff"
    });
    title.setOrigin(0.5);

    this.buildPanelText = this.add.text(
      GAME_WIDTH / 2 - 220,
      GAME_HEIGHT / 2 - 218,
      "",
      {
        fontSize: "16px",
        color: "#e9f0ff",
        lineSpacing: 6
      }
    );

    this.buildPanel.add([panelBackground, title, this.buildPanelText]);
  }

  toggleBuildPanel() {
    if (this.isGameOver || this.isLevelUpActive) {
      return;
    }

    this.buildPanel.setVisible(!this.buildPanel.visible);
    if (this.buildPanel.visible) {
      this.updateBuildPanelText();
    }
  }

  hideBuildPanel() {
    if (this.buildPanel) {
      this.buildPanel.setVisible(false);
    }
  }

  updateBuildPanelText() {
    const pistol = this.weapons.pistol;
    const shotgun = this.weapons.shotgun;
    const tesla = this.weapons.tesla;
    const attacksPerSecond = (1000 / pistol.cooldownMs).toFixed(2);
    const upgradeLines = UPGRADE_DEFINITIONS.map(
      (upgrade) => `${upgrade.name}：Lv ${this.upgradeLevels[upgrade.key]}`
    ).join("\n");

    this.buildPanelText.setText(
      [
        `伤害倍率：x${(pistol.damage / BALANCE.weapons.pistol.baseDamage).toFixed(2)}`,
        `攻击冷却：${pistol.cooldownMs.toFixed(0)} ms (${attacksPerSecond}/秒)`,
        `移动速度：${this.playerMoveSpeed.toFixed(0)}`,
        `最大生命值：${this.maxHealth}`,
        `弹丸数量：${this.projectileCount}`,
        `弹丸穿透：${this.bulletPenetration}`,
        `拾取范围：${this.pickupRadius.toFixed(0)}`,
        "",
        `武器`,
        `- 手枪 Lv ${pistol.currentLevel}：伤害 ${pistol.damage.toFixed(1)}，冷却 ${pistol.cooldownMs.toFixed(0)}ms`,
        shotgun.unlocked
          ? `- 突破器 Lv ${shotgun.currentLevel}：伤害 ${shotgun.damage.toFixed(1)} x ${shotgun.pelletCount}，冷却 ${shotgun.cooldownMs.toFixed(0)}ms，弹药 ${shotgun.currentShells}/${shotgun.magazineSize}，装填 ${shotgun.reloadDurationMs}ms`
          : `- 突破器：未解锁`,
        tesla.unlocked
          ? `- 特斯拉 Lv ${tesla.currentLevel}：伤害 ${tesla.damage.toFixed(1)}，链击 ${tesla.chainTargets}，冷却 ${tesla.cooldownMs.toFixed(0)}ms，射程 ${tesla.range.toFixed(0)}`
          : `- 特斯拉：未解锁`,
        "",
        "升级等级",
        upgradeLines
      ].join("\n")
    );
  }

  setupSpawning() {
    this.scheduleNextSpawn();
  }

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
  }

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
  }

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
  }

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
  }

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
  }

  updateFacilityEventDirector() {
    if (!this.powerOutageTriggered && this.elapsedSurvivalMs >= BALANCE.match.powerOutageAtMs) {
      this.powerOutageTriggered = true;
      this.beginFacilityEvent("powerOutage");
    }

    if (this.activeFacilityEvent && this.elapsedSurvivalMs >= this.activeFacilityEventEndAtMs) {
      this.endFacilityEvent("设施系统已稳定。");
    }
  }

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
  }

  endFacilityEvent(message = "事件已结束。") {
    if (!this.activeFacilityEvent) {
      return;
    }

    this.activeFacilityEvent = null;
    this.activeFacilityEventEndAtMs = 0;
    this.showTopBanner("事件结束", message, 1400);
  }

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
    this.registerTransientEffect(pulse);

    this.tweens.add({
      targets: pulse,
      alpha: 0,
      duration: 420,
      onComplete: () => pulse.destroy()
    });
  }

  showTopBanner(title, detail, durationMs = 1500) {
    if (!this.eventBannerContainer) {
      return;
    }
    this.eventBannerTitle.setText(title);
    this.eventBannerDetail.setText(detail);
    this.eventBannerContainer.setVisible(true);
    this.eventBannerContainer.setAlpha(1);
    this.topBannerState = {
      expiresAtMs: this.elapsedSurvivalMs + durationMs
    };
  }

  updateSupplyPickups() {
    for (const pickup of this.supplyPickups.getChildren()) {
      pickup.rotation += 0.035;
    }
  }

  updateFacilityVisualEffects() {
    this.updateTopBanner();
    this.updatePowerOutageVisual();
  }

  updateTopBanner() {
    if (!this.eventBannerContainer?.visible || !this.topBannerState) {
      return;
    }
    if (this.elapsedSurvivalMs >= this.topBannerState.expiresAtMs) {
      this.eventBannerContainer.setVisible(false);
      this.eventBannerContainer.setAlpha(1);
      this.topBannerState = null;
      return;
    }
    const remaining = this.topBannerState.expiresAtMs - this.elapsedSurvivalMs;
    if (remaining < 280) {
      this.eventBannerContainer.setAlpha(remaining / 280);
    } else {
      this.eventBannerContainer.setAlpha(1);
    }
  }

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
    this.outageLightSprite.setPosition(this.player.x, this.player.y);
    this.outageDarknessRt.erase(this.outageLightSprite);

    if (this.arenaGrid) {
      const flickerAlpha = 0.45 + Math.sin(this.elapsedSurvivalMs * 0.08) * 0.22;
      this.arenaGrid.setAlpha(
        Phaser.Math.Clamp(flickerAlpha, 0.2, 0.75) * this.outageVisualStrength
      );
    }
  }

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
  }

  getActiveEliteLimit() {
    const elapsedSeconds = this.elapsedSurvivalMs / 1000;
    if (elapsedSeconds >= BALANCE.enemy.elite.lateMaxActiveStartSeconds) {
      return BALANCE.enemy.elite.lateMaxActive;
    }
    return BALANCE.enemy.elite.earlyMaxActive;
  }

  getActiveEliteCount() {
    let count = 0;
    for (const enemy of this.enemies.getChildren()) {
      if (enemy.active && enemy.isElite) {
        count += 1;
      }
    }
    return count;
  }

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
          GAME_WIDTH - 20
        );
        const closeY = Phaser.Math.Clamp(
          firstElite.y + Phaser.Math.Between(-65, 65),
          20,
          GAME_HEIGHT - 20
        );
        this.spawnEliteAtEdge(eliteType, director.scaling, { x: closeX, y: closeY });
      } else {
        this.spawnEliteAtEdge(eliteType, director.scaling);
      }
      activeElites += 1;
    }
  }

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
  }

  getSpawnPositionAtEdge() {
    const side = Phaser.Math.Between(0, 3);
    if (side === 0) {
      return {
        x: Phaser.Math.Between(0, GAME_WIDTH),
        y: 0
      };
    }
    if (side === 1) {
      return {
        x: GAME_WIDTH,
        y: Phaser.Math.Between(0, GAME_HEIGHT)
      };
    }
    if (side === 2) {
      return {
        x: Phaser.Math.Between(0, GAME_WIDTH),
        y: GAME_HEIGHT
      };
    }
    return {
      x: 0,
      y: Phaser.Math.Between(0, GAME_HEIGHT)
    };
  }

  spawnEnemyAtEdge(type, scaling) {
    const config =
      BALANCE.enemy.types[type] ?? BALANCE.enemy.types.infectedStaff;
    const { x, y } = this.getSpawnPositionAtEdge();
    const enemy = this.enemies.create(x, y, config.textureKey);

    this.initializeEnemyFromConfig(enemy, config, scaling, false);
  }

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
  }

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
  }

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

    if (config.bodyShape === "circle") {
      enemy.setCircle(config.bodyRadius);
    } else if (config.bodyShape === "box") {
      enemy.body.setSize(config.bodySize, config.bodySize);
    } else {
      enemy.body.setSize(enemy.width, enemy.height);
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
  }

  handlePlayerMovement() {
    const body = this.player.body;
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
  }

  updateTemporaryBuffs() {
    if (this.activeStimUntilMs > 0 && this.elapsedSurvivalMs >= this.activeStimUntilMs) {
      this.activeStimUntilMs = 0;
      this.moveSpeedBuffMultiplier = 1;
    }
  }

  updateEnemies() {
    for (const enemy of this.enemies.getChildren()) {
      if (!enemy.active || enemy.isDying || enemy.isBoss) {
        continue;
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
      const instabilitySpeedMultiplier = this.getEnemyInstabilitySpeedMultiplier();
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

      if (this.getTimelinePhase().effects.teleport) {
        this.tryInstabilityTeleportEnemy(enemy);
      }

      enemy.moveSpeed = originalSpeed;
    }
  }

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
      GAME_WIDTH - 16
    );
    const newY = Phaser.Math.Clamp(
      enemy.y + Phaser.Math.Between(-distance, distance),
      16,
      GAME_HEIGHT - 16
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
  }

  updateEliteEnemy(enemy) {
    if (enemy.eliteType === "riotUnit") {
      this.updateRiotElite(enemy);
    } else if (enemy.eliteType === "blinkStalker") {
      this.updateBlinkElite(enemy);
    } else if (enemy.eliteType === "biomass") {
      this.updateBiomassElite(enemy);
    }
    this.updateEliteVisuals(enemy);
  }

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
  }

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
  }

  updateBiomassElite(enemy) {
    this.physics.moveToObject(enemy, this.player, enemy.moveSpeed);
    const pulse = 1.16 + Math.sin(this.elapsedSurvivalMs * 0.008) * 0.07;
    enemy.setScale(pulse);
  }

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
  }

  updatePlayerBullets() {
    const margin = 18;
    for (const bullet of this.bullets.getChildren()) {
      const isExpired = this.elapsedSurvivalMs >= bullet.expireAtMs;
      const exceededRange =
        bullet.maxRange !== undefined &&
        Phaser.Math.Distance.Between(
          bullet.originX ?? bullet.x,
          bullet.originY ?? bullet.y,
          bullet.x,
          bullet.y
        ) > bullet.maxRange;
      const outOfBounds =
        bullet.x < -margin ||
        bullet.x > GAME_WIDTH + margin ||
        bullet.y < -margin ||
        bullet.y > GAME_HEIGHT + margin;

      if (isExpired || exceededRange || outOfBounds) {
        bullet.destroy();
      }
    }
  }

  updateEnemyProjectiles() {
    const margin = 16;
    for (const projectile of this.enemyProjectiles.getChildren()) {
      const isExpired = this.elapsedSurvivalMs >= projectile.expireAtMs;
      const outOfBounds =
        projectile.x < -margin ||
        projectile.x > GAME_WIDTH + margin ||
        projectile.y < -margin ||
        projectile.y > GAME_HEIGHT + margin;

      if (isExpired || outOfBounds) {
        projectile.destroy();
      }
    }
  }

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
  }

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
  }

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
  }

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
  }

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
    bullet.expireAtMs = this.elapsedSurvivalMs + (range / speed) * 1000 + 60;
    bullet.setCircle(4);

    bullet.body.setVelocity(Math.cos(finalAngle) * speed, Math.sin(finalAngle) * speed);
    return bullet;
  }

  spawnLightningSegment(x1, y1, x2, y2) {
    const graphics = this.add.graphics();
    graphics.setDepth(19);
    this.registerTransientEffect(graphics);
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
      onComplete: () => graphics.destroy()
    });
  }

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
  }

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
  }

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
  }

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
  }

  clearEliteWarning(enemy) {
    if (enemy.warningGraphic && enemy.warningGraphic.active) {
      enemy.warningGraphic.destroy();
    }
    enemy.warningGraphic = null;
  }

  getBlinkTeleportDestination(enemy) {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const distance = Phaser.Math.Between(
      enemy.minDestinationDistance,
      enemy.maxDestinationDistance
    );
    const x = Phaser.Math.Clamp(
      this.player.x + Math.cos(angle) * distance,
      24,
      GAME_WIDTH - 24
    );
    const y = Phaser.Math.Clamp(
      this.player.y + Math.sin(angle) * distance,
      24,
      GAME_HEIGHT - 24
    );
    return { x, y };
  }

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
  }

  spawnImpactEffect(x, y) {
    const impact = this.add.circle(x, y, 4, 0xfff7bf, 0.9);
    impact.setDepth(17);
    this.registerTransientEffect(impact);

    this.tweens.add({
      targets: impact,
      scale: 1.9,
      alpha: 0,
      duration: BALANCE.feedback.impactDurationMs,
      onComplete: () => impact.destroy()
    });
  }

  handleExperienceCollection() {
    const collectDistance = 14;
    for (const gem of this.xpGems.getChildren()) {
      if (!gem.active) {
        continue;
      }
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        gem.x,
        gem.y
      );

      // Begin magnetizing once the gem enters pickup radius.
      if (!gem.isMagnetized && distance <= this.pickupRadius) {
        gem.isMagnetized = true;
      }

      if (gem.isMagnetized) {
        if (distance <= collectDistance) {
          const xpValue = gem.xpValue ?? BALANCE.xp.gemValue;
          this.spawnGemPickupSpark(gem.x, gem.y);
          gem.destroy();
          this.addExperience(xpValue);
          continue;
        }

        // Accelerate toward the player for a satisfying vacuum feel.
        gem.magnetSpeed = Math.min(620, (gem.magnetSpeed ?? 180) + 26);
        const angle = Phaser.Math.Angle.Between(
          gem.x,
          gem.y,
          this.player.x,
          this.player.y
        );
        const step = (gem.magnetSpeed / 1000) * 16;
        gem.x += Math.cos(angle) * step;
        gem.y += Math.sin(angle) * step;
      }
    }
  }

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
  }

  addExperience(amount) {
    this.currentXp += amount;

    while (this.currentXp >= this.xpToNextLevel) {
      this.currentXp -= this.xpToNextLevel;
      this.level += 1;
      this.pendingLevelUps += 1;
      this.xpToNextLevel = this.getRequiredXpForLevel(this.level);
    }

    if (
      this.pendingLevelUps > 0 &&
      !this.isLevelUpActive
    ) {
      this.showLevelUpOverlay();
    }
  }

  getRequiredXpForLevel(level) {
    return Math.floor(
      BALANCE.xp.firstLevelRequirement +
        (level - 1) * BALANCE.xp.requirementGrowthPerLevel
    );
  }

  showLevelUpOverlay() {
    if (this.isGameOver) {
      return;
    }

    this.isLevelUpActive = true;
    this.isResolvingLevelUp = false;
    this.hideBuildPanel();
    this.pauseGameplaySystems();

    if (this.levelUpOverlay) {
      this.levelUpOverlay.destroy(true);
    }

    this.levelUpOverlay = this.add.container(0, 0);
    this.levelUpOverlay.setDepth(60);

    const backdrop = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      760,
      420,
      0x000000,
      0.84
    );
    backdrop.setStrokeStyle(2, 0x5a6b95);

    const title = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 175,
      "升级",
      {
        fontSize: "50px",
        color: "#fff4c2"
      }
    );
    title.setOrigin(0.5);

    const subtitle = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 132,
      "选择一个升级",
      {
        fontSize: "22px",
        color: "#ffffff"
      }
    );
    subtitle.setOrigin(0.5);

    this.levelUpOverlay.add([backdrop, title, subtitle]);

    this.levelUpCardObjects = [];
    this.levelUpCards = [];
    this.renderLevelUpCards();
    this.createLevelUpButtons();
  }

  renderLevelUpCards() {
    if (this.levelUpCardObjects) {
      for (const object of this.levelUpCardObjects) {
        if (object?.active) {
          object.destroy();
        }
      }
    }
    this.levelUpCardObjects = [];
    this.levelUpCards = [];

    const options = this.getLevelUpChoices();
    const startX = GAME_WIDTH / 2 - 240;

    options.forEach((upgrade, index) => {
      const optionX = startX + index * 240;
      const optionY = GAME_HEIGHT / 2 - 15;
      const currentLevel = this.getUpgradeCurrentLevel(upgrade);

      const card = this.add.rectangle(optionX, optionY, 220, 230, 0x1c2333, 1);
      card.setStrokeStyle(2, 0x4b5d88);
      card.setInteractive({ useHandCursor: true });
      card.on("pointerover", () => card.setFillStyle(0x27314a, 1));
      card.on("pointerout", () => card.setFillStyle(0x1c2333, 1));
      card.on("pointerdown", () => {
        this.applyUpgrade(upgrade, card);
      });
      this.levelUpCards.push(card);

      const nameText = this.add.text(optionX, optionY - 62, upgrade.name, {
        fontSize: "22px",
        color: "#8cd5ff",
        align: "center",
        wordWrap: { width: 190 }
      });
      nameText.setOrigin(0.5);

      const descriptionText = this.add.text(
        optionX,
        optionY + 5,
        upgrade.description,
        {
          fontSize: "16px",
          color: "#dde7ff",
          align: "center",
          wordWrap: { width: 185 }
        }
      );
      descriptionText.setOrigin(0.5);

      const currentLevelText = this.add.text(
        optionX,
        optionY + 82,
        `当前：Lv ${currentLevel}`,
        {
          fontSize: "15px",
          color: "#ffd990",
          align: "center",
          wordWrap: { width: 195 }
        }
      );
      currentLevelText.setOrigin(0.5);

      this.levelUpCardObjects.push(card, nameText, descriptionText, currentLevelText);
      this.levelUpOverlay.add([card, nameText, descriptionText, currentLevelText]);
    });
  }

  createLevelUpButtons() {
    const buttonY = GAME_HEIGHT / 2 + 160;

    const rerollButton = this.add.rectangle(
      GAME_WIDTH / 2 - 115,
      buttonY,
      200,
      46,
      0x2d3a55,
      1
    );
    rerollButton.setStrokeStyle(2, 0x5f78b0);
    rerollButton.setInteractive({ useHandCursor: true });

    const rerollLabel = this.add.text(GAME_WIDTH / 2 - 115, buttonY, "", {
      fontSize: "18px",
      color: "#dfe8ff",
      align: "center"
    });
    rerollLabel.setOrigin(0.5);

    rerollButton.on("pointerover", () => {
      if (this.rerollsRemaining > 0) {
        rerollButton.setFillStyle(0x3a4b6e, 1);
      }
    });
    rerollButton.on("pointerout", () => rerollButton.setFillStyle(0x2d3a55, 1));
    rerollButton.on("pointerdown", () => this.rerollLevelUpChoices());

    const skipButton = this.add.rectangle(
      GAME_WIDTH / 2 + 115,
      buttonY,
      200,
      46,
      0x2d3a55,
      1
    );
    skipButton.setStrokeStyle(2, 0x5f78b0);
    skipButton.setInteractive({ useHandCursor: true });

    const skipLabel = this.add.text(
      GAME_WIDTH / 2 + 115,
      buttonY,
      `跳过（+${BALANCE.upgrades.skipHealAmount} 生命）`,
      {
        fontSize: "18px",
        color: "#dfe8ff",
        align: "center"
      }
    );
    skipLabel.setOrigin(0.5);

    skipButton.on("pointerover", () => skipButton.setFillStyle(0x3a4b6e, 1));
    skipButton.on("pointerout", () => skipButton.setFillStyle(0x2d3a55, 1));
    skipButton.on("pointerdown", () => this.skipLevelUpChoice());

    this.levelUpRerollButton = rerollButton;
    this.levelUpRerollLabel = rerollLabel;
    this.levelUpOverlay.add([rerollButton, rerollLabel, skipButton, skipLabel]);
    this.updateRerollButtonState();
  }

  updateRerollButtonState() {
    if (!this.levelUpRerollLabel) {
      return;
    }
    this.levelUpRerollLabel.setText(`重抽（剩 ${this.rerollsRemaining}）`);
    const enabled = this.rerollsRemaining > 0;
    this.levelUpRerollLabel.setColor(enabled ? "#dfe8ff" : "#6b7590");
    this.levelUpRerollButton.setStrokeStyle(2, enabled ? 0x5f78b0 : 0x3a4256);
  }

  rerollLevelUpChoices() {
    if (this.isResolvingLevelUp || this.rerollsRemaining <= 0) {
      return;
    }
    this.rerollsRemaining -= 1;
    this.renderLevelUpCards();
    this.updateRerollButtonState();
    this.playSound("levelUp");
  }

  skipLevelUpChoice() {
    if (this.isResolvingLevelUp) {
      return;
    }
    this.isResolvingLevelUp = true;

    for (const card of this.levelUpCards) {
      card.disableInteractive();
    }

    this.health = Math.min(
      this.maxHealth,
      this.health + BALANCE.upgrades.skipHealAmount
    );

    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps -= 1;
    }
    this.updateUI();

    this.time.delayedCall(120, () => {
      if (this.pendingLevelUps > 0) {
        this.showLevelUpOverlay();
        return;
      }
      if (this.levelUpOverlay) {
        this.levelUpOverlay.destroy(true);
        this.levelUpOverlay = null;
      }
      this.levelUpCards = [];
      this.levelUpCardObjects = [];
      this.isLevelUpActive = false;
      this.isResolvingLevelUp = false;
      this.resumeGameplaySystems();
      this.updateUI();
    });
  }

  applyUpgrade(upgrade, selectedCard) {
    if (this.isResolvingLevelUp) {
      return;
    }
    this.isResolvingLevelUp = true;

    for (const card of this.levelUpCards) {
      card.disableInteractive();
    }
    selectedCard.setStrokeStyle(4, 0xffdd66);
    selectedCard.setFillStyle(0x35527a, 1);

    upgrade.apply(this);
    this.upgradeLevels[upgrade.key] += 1;
    if (upgrade.kind === "weapon") {
      const weaponId = upgrade.weaponId ?? this.selectedWeaponId;
      if (weaponId && this.weapons[weaponId]) {
        this.weapons[weaponId].currentLevel += 1;
      }
    }

    if (this.pendingLevelUps > 0) {
      this.pendingLevelUps -= 1;
    }
    this.updateUI();
    this.playSound("levelUp");

    this.time.delayedCall(160, () => {
      if (this.pendingLevelUps > 0) {
        this.showLevelUpOverlay();
        return;
      }

      if (this.levelUpOverlay) {
        this.levelUpOverlay.destroy(true);
        this.levelUpOverlay = null;
      }
      this.levelUpCards = [];
      this.levelUpCardObjects = [];
      this.isLevelUpActive = false;
      this.isResolvingLevelUp = false;
      this.resumeGameplaySystems();
      this.updateUI();
    });
  }

  getUpgradeCurrentLevel(upgrade) {
    if (upgrade.kind === "weapon") {
      const weaponId = upgrade.weaponId ?? this.selectedWeaponId;
      if (weaponId && this.weapons[weaponId]) {
        return this.weapons[weaponId].currentLevel;
      }
    }
    return this.upgradeLevels[upgrade.key] ?? 0;
  }

  getLevelUpChoices() {
    const available = UPGRADE_DEFINITIONS.filter(
      (upgrade) => upgrade.isAvailable?.(this) ?? true
    );
    const shuffled = Phaser.Utils.Array.Shuffle([...available]);
    const choices = [];
    const seen = new Set();

    for (const upgrade of shuffled) {
      if (seen.has(upgrade.key)) {
        continue;
      }
      choices.push(upgrade);
      seen.add(upgrade.key);
      if (choices.length === 3) {
        break;
      }
    }

    if (choices.length < 3) {
      const genericFallback = available.filter((upgrade) => upgrade.kind === "generic");
      for (const upgrade of genericFallback) {
        if (choices.length === 3) {
          break;
        }
        if (seen.has(upgrade.key)) {
          continue;
        }
        choices.push(upgrade);
        seen.add(upgrade.key);
      }
    }

    if (choices.length < 3) {
      const emergency = UPGRADE_DEFINITIONS.find((upgrade) => upgrade.key === "emergencyHeal");
      if (emergency && !seen.has(emergency.key)) {
        choices.push(emergency);
        seen.add(emergency.key);
      }
    }

    return choices;
  }

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
  }

  handleBulletEnemyCollision(bullet, enemy) {
    if (!enemy.active || enemy.isDying) {
      return;
    }

    const damage = Math.max(1, Math.round(bullet.damage ?? this.bulletDamage));
    if (bullet.weaponId === "shotgun") {
      this.applyBreacherPelletEffects(bullet, enemy);
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
  }

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
  }

  applyKnockbackToEnemy(enemy, sourceX, sourceY, strength) {
    const angle = Phaser.Math.Angle.Between(sourceX, sourceY, enemy.x, enemy.y);
    enemy.body.setVelocity(Math.cos(angle) * strength, Math.sin(angle) * strength);
    enemy.knockbackUntilMs = this.elapsedSurvivalMs + 240;
  }

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
  }

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
  }

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
  }

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
  }

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
        const spawnX = Phaser.Math.Clamp(enemy.x + Math.cos(angle) * 26, 20, GAME_WIDTH - 20);
        const spawnY = Phaser.Math.Clamp(enemy.y + Math.sin(angle) * 26, 20, GAME_HEIGHT - 20);
        this.spawnBiomassChild(spawnX, spawnY);
      }
    }

    if (Math.random() < BALANCE.enemy.elite.supplyDropChance) {
      this.spawnCombatStim(enemy.x, enemy.y);
    }
  }

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
  }

  registerTransientEffect(gameObject) {
    this.transientEffects.add(gameObject);
    gameObject.once("destroy", () => {
      this.transientEffects.delete(gameObject);
    });
  }

  flashEnemyOnHit(enemy) {
    enemy.setTintFill(0xffffff);
    this.time.delayedCall(BALANCE.feedback.enemyHitFlashMs, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });
  }

  spawnFloatingDamage(x, y, damage) {
    const damageText = this.add.text(x, y - 6, `${damage}`, {
      fontSize: "14px",
      color: "#ffe9a8"
    });
    damageText.setOrigin(0.5);
    damageText.setDepth(26);
    this.registerTransientEffect(damageText);

    this.tweens.add({
      targets: damageText,
      y: y - BALANCE.feedback.damageNumberRisePx,
      alpha: 0,
      duration: BALANCE.feedback.damageNumberDurationMs,
      onComplete: () => damageText.destroy()
    });
  }

  spawnDeathParticles(x, y, color) {
    for (let index = 0; index < BALANCE.feedback.deathBurstParticles; index += 1) {
      const angle = (Math.PI * 2 * index) / BALANCE.feedback.deathBurstParticles;
      const distance = Phaser.Math.Between(8, 20);
      const particle = this.add.circle(x, y, 2.5, color, 0.95);
      particle.setDepth(16);
      this.registerTransientEffect(particle);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        duration: 180,
        onComplete: () => particle.destroy()
      });
    }
  }

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
  }

  dropExperienceGem(x, y, xpValue = BALANCE.xp.gemValue) {
    const gem = this.xpGems.create(x, y, "xp-gem");
    gem.xpValue = xpValue;
    gem.setCircle(5);
  }

  spawnCombatStim(x, y) {
    const stim = this.supplyPickups.create(x, y, "combat-stim");
    stim.pickupType = "combatStim";
    stim.setCircle(8);
    stim.setDepth(14);
  }

  updateScp500Spawn() {
    if (this.scp500Spawned || !this.isMissionActive || this.isGameOver) {
      return;
    }
    if (this.elapsedSurvivalMs < BALANCE.match.scp500SpawnAtMs) {
      return;
    }
    this.scp500Spawned = true;
    this.spawnScp500();
  }

  spawnScp500() {
    const x = Phaser.Math.Between(72, GAME_WIDTH - 72);
    const y = Phaser.Math.Between(72, GAME_HEIGHT - 72);
    const pickup = this.supplyPickups.create(x, y, "scp500");
    pickup.pickupType = "scp500";
    pickup.setCircle(9);
    pickup.setDepth(14);
    this.showTopBanner("异常物品", "SCP-500 已在设施内出现", 2400);
  }

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
  }

  handlePlayerEnemyOverlap(_, enemy) {
    this.applyPlayerDamage(enemy.contactDamage ?? 1, enemy.x, enemy.y);
  }

  handleEnemyProjectileOverlap(_, projectile) {
    const damage = projectile.damage ?? 1;
    const sourceX = projectile.x;
    const sourceY = projectile.y;
    projectile.destroy();
    this.applyPlayerDamage(damage, sourceX, sourceY);
  }

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
  }

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
  }

  updateUI() {
    const elapsedSeconds = this.elapsedSurvivalMs / 1000;

    this.statsText.setText(
      `生命：${Math.floor(this.health)} / ${this.maxHealth}   时间：${elapsedSeconds.toFixed(1)}秒   击杀：${this.killCount}`
    );
    this.levelText.setText(`等级：${this.level}`);

    const xpProgress = Phaser.Math.Clamp(this.currentXp / this.xpToNextLevel, 0, 1);
    this.xpBarFill.width = 248 * xpProgress;
    this.xpText.setText(`${this.currentXp} / ${this.xpToNextLevel} 经验`);
    this.updateWeaponHud();
    this.updatePhaseHud();
  }

  getTimelinePhase() {
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

    return {
      ...current,
      nextAtMs,
      countdownMs: Math.max(0, nextAtMs - this.elapsedSurvivalMs)
    };
  }

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
  }

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
  }

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
  }

  clearRegularEnemies() {
    for (const enemy of this.enemies.getChildren()) {
      if (enemy.active && !enemy.isBoss) {
        enemy.destroy();
      }
    }
  }

  spawnScp049Boss() {
    if (this.bossEnemy?.active || this.isGameOver) {
      return;
    }

    const config = BALANCE.boss.scp049;
    const boss = this.enemies.create(GAME_WIDTH / 2, 72, "enemy-scp049");
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
    boss.setDepth(12);
    boss.setCollideWorldBounds(true);
    boss.summonCooldownMs = config.summonCooldownMs;
    boss.nextSummonAtMs = this.elapsedSurvivalMs + config.summonInitialDelayMs;

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
  }

  updateBoss() {
    const boss = this.bossEnemy;
    if (!boss?.active || boss.isDying || this.isGameOver) {
      return;
    }

    if (boss.bossLabel?.active) {
      boss.bossLabel.setPosition(boss.x, boss.y - 36);
    }

    if ((boss.staggerUntilMs ?? 0) > this.elapsedSurvivalMs) {
      boss.body.setVelocity(0, 0);
    } else {
      this.physics.moveToObject(boss, this.player, boss.moveSpeed);
    }

    const config = BALANCE.boss.scp049;
    const hpRatio = boss.health / boss.maxHealth;
    const summonInterval =
      hpRatio <= config.enragedHpThreshold
        ? boss.summonCooldownMs * config.enragedSummonMultiplier
        : boss.summonCooldownMs;

    if (this.elapsedSurvivalMs >= boss.nextSummonAtMs) {
      this.summonBossMinions(boss);
      boss.nextSummonAtMs = this.elapsedSurvivalMs + summonInterval;
    }
  }

  summonBossMinions(boss) {
    const config = BALANCE.boss.scp049;
    const count = Phaser.Math.Between(config.summonCountMin, config.summonCountMax);
    const baseConfig = BALANCE.enemy.types.infectedStaff;
    const scaling = {
      healthMultiplier: config.minionHealthMultiplier,
      damageMultiplier: config.minionDamageMultiplier
    };

    for (let index = 0; index < count; index += 1) {
      if (this.enemies.getLength() >= BALANCE.enemy.maxActiveEnemies) {
        break;
      }
      const angle = (Math.PI * 2 * index) / count;
      const spawnX = Phaser.Math.Clamp(
        boss.x + Math.cos(angle) * 52,
        24,
        GAME_WIDTH - 24
      );
      const spawnY = Phaser.Math.Clamp(
        boss.y + Math.sin(angle) * 52,
        24,
        GAME_HEIGHT - 24
      );
      const minion = this.enemies.create(spawnX, spawnY, baseConfig.textureKey);
      this.initializeEnemyFromConfig(minion, baseConfig, scaling, false);
      minion.isBossMinion = true;
    }

    this.playSound("bossSummon");
  }

  handleBossDefeat(boss) {
    if (boss.isDying) {
      return;
    }
    boss.isDying = true;
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
  }

  stopRegularSpawning() {
    this.regularSpawningActive = false;
    if (this.spawnEvent) {
      this.spawnEvent.remove(false);
      this.spawnEvent = null;
    }
  }

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
  }

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
  }

  spawnInstabilityDecoy() {
    const { x, y } = this.getSpawnPositionAtEdge();
    const decoy = this.add.circle(x, y, 10, 0x9b74ff, 0.5);
    decoy.setDepth(8);
    decoy.expiresAtMs = this.elapsedSurvivalMs + BALANCE.timeline.effects.decoyLifetimeMs;
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

  updateWeaponHud() {
    if (!this.isMissionActive || !this.selectedWeaponId) {
      this.weaponHudText.setText("");
      return;
    }

    const lines = [];
    if (this.selectedWeaponId === "pistol") {
      const pistol = this.weapons.pistol;
      const fireRate = (1000 / pistol.cooldownMs).toFixed(2);
      lines.push(`■ ${pistol.name} — 等级 ${pistol.currentLevel}`);
      lines.push(`伤害 ${pistol.damage.toFixed(1)} | ${fireRate}/秒`);
    } else if (this.selectedWeaponId === "shotgun") {
      const breacher = this.weapons.shotgun;
      const status = breacher.isReloading
        ? `装填 ${(
            Math.max(0, breacher.reloadEndAtMs - this.elapsedSurvivalMs) / 1000
          ).toFixed(1)}秒`
        : `弹药 ${breacher.currentShells}/${breacher.magazineSize}`;
      lines.push(`▲ ${breacher.name} — 等级 ${breacher.currentLevel}`);
      lines.push(`${status} | 弹丸伤害 ${breacher.damage.toFixed(1)}`);
    } else if (this.selectedWeaponId === "tesla") {
      const tesla = this.weapons.tesla;
      const cdLeft = Math.max(0, tesla.nextAttackAtMs - this.elapsedSurvivalMs);
      lines.push(`≈ ${tesla.name} — 等级 ${tesla.currentLevel}`);
      lines.push(`链击 ${tesla.chainTargets} | 放电 ${(cdLeft / 1000).toFixed(1)}秒`);
    }

    this.weaponHudText.setText(lines.join("\n"));
  }

  updatePickupRadiusIndicator() {
    this.pickupRadiusIndicator.clear();
    this.pickupRadiusIndicator.fillStyle(0x50d66c, 0.1);
    this.pickupRadiusIndicator.lineStyle(1, 0x50d66c, 0.35);
    this.pickupRadiusIndicator.fillCircle(this.player.x, this.player.y, this.pickupRadius);
    this.pickupRadiusIndicator.strokeCircle(this.player.x, this.player.y, this.pickupRadius);
  }

  pauseGameplaySystems() {
    this.physics.pause();

    if (this.spawnEvent) {
      this.spawnEvent.paused = true;
    }
  }

  clearTransientEffects() {
    for (const effect of this.transientEffects) {
      if (effect.active) {
        effect.destroy();
      }
    }
    this.transientEffects.clear();
  }

  resumeGameplaySystems() {
    this.physics.resume();

    if (this.spawnEvent && this.regularSpawningActive) {
      this.spawnEvent.paused = false;
    } else if (this.regularSpawningActive && !this.spawnEvent && !this.isGameOver) {
      this.scheduleNextSpawn();
    }
  }

  clearCombatEntities() {
    this.enemies.clear(true, true);
    this.enemyProjectiles.clear(true, true);
    this.bullets.clear(true, true);
    this.xpGems.clear(true, true);
    this.supplyPickups.clear(true, true);
    this.instabilityDecoys.clear(true, true);
    this.clearTransientEffects();
  }

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

  getFinalSurvivalTimeSeconds() {
    return (this.elapsedSurvivalMs / 1000).toFixed(1);
  }

  freezeForGameOver() {
    this.pauseGameplaySystems();
    this.clearCombatEntities();
    this.activeStimUntilMs = 0;
    this.moveSpeedBuffMultiplier = 1;
    this.clearFacilitySystems();

    if (this.levelUpOverlay) {
      this.levelUpOverlay.destroy(true);
      this.levelUpOverlay = null;
    }
    this.levelUpCards = [];
    this.isLevelUpActive = false;
    this.isResolvingLevelUp = false;
    this.hideBuildPanel();
    this.pickupRadiusIndicator.clear();
  }

  showGameOverOverlay() {
    const finalTime = this.getFinalSurvivalTimeSeconds();

    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      420,
      280,
      0x000000,
      0.7
    );
    overlay.setDepth(50);

    const gameOverText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 90,
      "游戏结束",
      {
        fontSize: "46px",
        color: "#ffffff"
      }
    );
    gameOverText.setDepth(51);
    gameOverText.setOrigin(0.5);

    const finalStatsText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 20,
      `最终生存时间：${finalTime}秒\n最终击杀数：${this.killCount}`,
      {
        fontSize: "22px",
        color: "#d7defa",
        align: "center"
      }
    );
    finalStatsText.setDepth(51);
    finalStatsText.setOrigin(0.5);

    const restartButton = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 78,
      170,
      52,
      0x3f82ff,
      1
    );
    restartButton.setDepth(51);
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.on("pointerdown", () => {
      this.scene.restart();
    });

    const restartLabel = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 78,
      "重新开始",
      {
        fontSize: "25px",
        color: "#ffffff"
      }
    );
    restartLabel.setDepth(52);
    restartLabel.setOrigin(0.5);
  }

  triggerGameOver() {
    this.isGameOver = true;
    this.isVictory = false;
    this.freezeForGameOver();
    this.updateUI();
    this.showGameOverOverlay();
  }

  showVictoryOverlay() {
    const finalTime = this.getFinalSurvivalTimeSeconds();
    const overlay = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      480,
      320,
      0x000000,
      0.72
    );
    overlay.setDepth(50);
    overlay.setStrokeStyle(2, 0x7bd7a8);

    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 98, "任务完成", {
      fontSize: "44px",
      color: "#cbffe1"
    });
    title.setOrigin(0.5);
    title.setDepth(51);

    const detail = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 - 12,
      `SCP-049 已被成功收容。\n生存时间：${finalTime}秒\n击杀数：${this.killCount}`,
      {
        fontSize: "22px",
        color: "#d7defa",
        align: "center"
      }
    );
    detail.setOrigin(0.5);
    detail.setDepth(51);

    const restartButton = this.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2 + 92,
      170,
      52,
      0x4da07b,
      1
    );
    restartButton.setDepth(51);
    restartButton.setInteractive({ useHandCursor: true });
    restartButton.on("pointerdown", () => {
      this.scene.restart();
    });

    const restartLabel = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 92, "重新开始", {
      fontSize: "25px",
      color: "#ffffff"
    });
    restartLabel.setOrigin(0.5);
    restartLabel.setDepth(52);
  }

  triggerVictory() {
    if (this.isGameOver) {
      return;
    }
    this.isGameOver = true;
    this.isVictory = true;
    this.freezeForGameOver();
    this.updateUI();
    this.showVictoryOverlay();
  }

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
  }

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
  }

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
}

const config = {
  type: Phaser.AUTO,
  parent: "app",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  scene: PrototypeScene
};

new Phaser.Game(config);
