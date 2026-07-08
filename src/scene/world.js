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

// Domain mixin: world. Methods are Object.assign'd onto PrototypeScene.prototype.
export const worldMixin = {

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
  },


  createArenaDecoration() {
    const border = this.add.graphics();
    border.lineStyle(3, 0x3a4664, 1);
    border.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.arenaBorder = border;

    const grid = this.add.graphics();
    grid.lineStyle(1, 0x191f2b, 0.45);
    this.arenaGrid = grid;

    const cell = 48;
    for (let x = cell; x < WORLD_WIDTH; x += cell) {
      grid.lineBetween(x, 0, x, WORLD_HEIGHT);
    }
    for (let y = cell; y < WORLD_HEIGHT; y += cell) {
      grid.lineBetween(0, y, WORLD_WIDTH, y);
    }
  },


  createPlayer() {
    this.player = this.physics.add.image(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      "player-rect"
    );
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 24);
    this.player.setDepth(6);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  },


  createGroups() {
    this.enemies = this.physics.add.group();
    this.bullets = this.physics.add.group();
    this.enemyProjectiles = this.physics.add.group();
    this.xpGems = this.physics.add.group();
    this.supplyPickups = this.physics.add.group();
    this.instabilityDecoys = this.add.group();
  },


  createColliders() {
    // Enemies push against each other instead of stacking into a single point.
    this.physics.add.collider(this.enemies, this.enemies);

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
};
