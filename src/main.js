import Phaser from "phaser";
import { menusMixin } from "./scene/menus.js";
import { enemiesMixin } from "./scene/enemies.js";
import { weaponsMixin } from "./scene/weapons.js";
import { combatMixin } from "./scene/combat.js";
import { effectsMixin } from "./scene/effects.js";
import { progressionMixin } from "./scene/progression.js";
import { hudMixin } from "./scene/hud.js";
import { timelineMixin } from "./scene/timeline.js";
import { worldMixin } from "./scene/world.js";
import { systemsMixin } from "./scene/systems.js";
import {
  DEBUG_MODE,
  GAME_WIDTH,
  GAME_HEIGHT,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  ENEMY_GRID_CELL_SIZE,
  ENEMY_GRID_STRIDE
} from "./config/constants.js";
import { BALANCE } from "./config/balance.js";
import { UPGRADE_DEFINITIONS } from "./config/upgrades.js";
import {
  META_PERKS,
  loadMetaProgress,
  saveMetaProgress
} from "./config/meta.js";

class PrototypeScene extends Phaser.Scene {
  constructor() {
    super("PrototypeScene");
  }


  create() {
    // Persistent cross-run progress; re-loaded each run (saved on run end).
    this.meta = loadMetaProgress();
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
    // Per-run mutation (质变) flags — one-shot upgrades that change weapon behavior.
    this.weaponMutations = {
      pistolBoomerang: false,
      breacherExplosive: false,
      teslaField: false
    };
    this.teslaFieldNextTickAtMs = 0;
    this.isVictory = false;
    this.nextInstabilityShakeAtMs = 0;
    this.nextDecoySpawnAtMs = Phaser.Math.Between(
      BALANCE.timeline.effects.decoySpawnMinMs,
      BALANCE.timeline.effects.decoySpawnMaxMs
    );
    this.timelineHudBasePositions = null;
    this._timelinePhaseCache = null;
    this._timelinePhaseCacheAtMs = -1;
    this._enemyGrid = null;
    this._enemyGridAtMs = -1;
    // Object pools for high-frequency, short-lived combat visuals. Reusing these
    // avoids per-hit create/destroy churn (and the GC pauses it caused) during
    // heavy fights. Reset here so a scene.restart starts with empty pools.
    this._damageTextPool = [];
    this._impactPool = [];
    this._particlePool = [];
    this._lightningPool = [];

    this.playerMoveSpeed = BALANCE.player.baseMoveSpeed;
    this.playerFacingAngle = 0;
    this.dashUntilMs = 0;
    this.dashReadyAtMs = 0;
    this.dashAngle = 0;
    this.pickupRadius = BALANCE.player.basePickupRadius;
    this.projectileCount = 1;
    this.bulletPenetration = 0;
    this.initWeapons();
    this.soundMuted = false;
    this.audioContext = null;
    this.audioGain = null;

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBackgroundColor("#111319");

    this.createPlaceholderTextures();
    this.createArenaDecoration();
    this.createPlayer();
    this.createGroups();
    this.createColliders();
    this.createUI();
    this.createBuildPanel();
    this.setupInputHandlers();
    this.isPaused = false;
    this.createStartScreen();
    this.updateUI();
  }


  update(_, delta) {
    if (this.isGameOver) {
      return;
    }

    if (!this.isMissionActive) {
      return;
    }

    if (this.isPaused) {
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
}

Object.assign(
  PrototypeScene.prototype,
  menusMixin,
  enemiesMixin,
  weaponsMixin,
  combatMixin,
  effectsMixin,
  progressionMixin,
  hudMixin,
  timelineMixin,
  worldMixin,
  systemsMixin
);


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

