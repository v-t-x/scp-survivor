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
import { generateFallbackTextures } from "../assets/fallbackTextureFactory.js";

// Domain mixin: world. Methods are Object.assign'd onto PrototypeScene.prototype.
export const worldMixin = {

  // Texture generation now lives in src/assets/fallbackTextureFactory.js and is
  // normally driven by PreloadScene before this scene starts. This call remains
  // as a compatibility safeguard for any path that reaches the game scene without
  // going through PreloadScene (e.g. a direct-boot/debug path). The factory is
  // existence-checked per key, so it never regenerates or overwrites textures
  // already created by PreloadScene or provided by real assets.
  createPlaceholderTextures() {
    generateFallbackTextures(this);
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
