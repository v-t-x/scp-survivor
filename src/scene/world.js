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
import { TEXTURES } from "../assets/manifest.js";
import { createFacilityRoomController } from "../art/facilityRoom.js";
import {
  resolveCharacterTexture
} from "../art/characterPresentation.js";
import {
  applyDisplayScalePreservingBody,
  CHARACTER_DISPLAY_SCALE
} from "../art/presentationRules.js";

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
    this.teardownFacilityRoomController();
    try {
      this.facilityRoomController = createFacilityRoomController(this, WORLD_WIDTH, WORLD_HEIGHT);
    } catch {
      this.facilityRoomController = createMinimalFacilityFallback(this, WORLD_WIDTH, WORLD_HEIGHT);
    }
    this.facilityVisuals = this.facilityRoomController.objects;
    this.bindFacilityRoomLifecycle();

    try {
      const border = this.add?.graphics?.();
      if (!border) {
        this.arenaBorder = null;
        return;
      }
      border.lineStyle(3, 0x3a4664, 1);
      border.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      this.arenaBorder = border;
    } catch {
      this.arenaBorder = null;
    }
  },


  bindFacilityRoomLifecycle() {
    const events = this.events;
    const teardown = this.teardownFacilityRoomController;
    if (!events || typeof teardown !== "function") {
      return;
    }
    events.off?.(Phaser.Scenes.Events.SHUTDOWN, teardown, this);
    events.off?.(Phaser.Scenes.Events.DESTROY, teardown, this);
    events.once?.(Phaser.Scenes.Events.SHUTDOWN, teardown, this);
    events.once?.(Phaser.Scenes.Events.DESTROY, teardown, this);
  },


  teardownFacilityRoomController() {
    const controller = this.facilityRoomController;
    this.events?.off?.(Phaser.Scenes.Events.SHUTDOWN, this.teardownFacilityRoomController, this);
    this.events?.off?.(Phaser.Scenes.Events.DESTROY, this.teardownFacilityRoomController, this);
    try {
      controller?.destroy?.();
    } catch {
      // Facility presentation cleanup must not interfere with scene teardown.
    } finally {
      if (this.facilityRoomController === controller) {
        this.facilityRoomController = null;
      }
      this.facilityVisuals = null;
    }
  },


  createPlayer() {
    const playerTexture = resolveCharacterTexture(this, "player", TEXTURES.player);
    this.player = this.physics.add.sprite(
      WORLD_WIDTH / 2,
      WORLD_HEIGHT / 2,
      playerTexture
    );
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(24, 24);
    applyDisplayScalePreservingBody(this.player, CHARACTER_DISPLAY_SCALE.player);
    this.player.setDepth(6);
    this.combatFeedback.trackActor(this.player, {
      kind: "player",
      radius: 12,
      offsetY: 3
    });
    this.player.once("destroy", () => {
      this.combatFeedback?.untrackActor(this.player);
    });
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
  },


  createGroups() {
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite
    });
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

function clampFallbackAlpha(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(1, Math.max(0, value));
}

function getFallbackDimension(value) {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function destroyFallbackVisual(visual) {
  try {
    visual?.destroy?.();
  } catch {
    // A failed fallback display object is already isolated from gameplay.
  }
}

function configureFallbackVisual(visual) {
  try {
    visual.setDepth?.(-20);
    visual.setTint?.(0xffffff);
    visual.setAlpha?.(1);
    visual.setVisible?.(true);
    return visual;
  } catch {
    destroyFallbackVisual(visual);
    return null;
  }
}

function createDisplayOnlyFallbackController(visual) {
  const objects = visual ? [visual] : [];
  const byId = new Map(visual ? [["facility-fallback-floor", visual]] : []);
  let destroyed = false;

  function setPresentation(state = {}) {
    if (destroyed) return;
    const tint = Number.isInteger(state.ambientTint) ? state.ambientTint : 0xffffff;
    const alpha = clampFallbackAlpha(state.ambientAlpha);
    const visible = typeof state.visible === "boolean" ? state.visible : true;
    for (const object of objects) {
      try {
        object.setTint?.(tint);
        object.setAlpha?.(alpha);
        object.setVisible?.(visible);
      } catch {
        // A fallback visual is optional; keep presentation failures contained.
      }
    }
  }

  function reset() {
    setPresentation();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    for (let index = objects.length - 1; index >= 0; index -= 1) {
      destroyFallbackVisual(objects[index]);
    }
    objects.length = 0;
    byId.clear();
  }

  return { objects, byId, setPresentation, reset, destroy };
}

export function createNoopFacilityController() {
  return createDisplayOnlyFallbackController(null);
}

export function createMinimalFacilityFallback(scene, width, height) {
  try {
    const add = scene?.add;
    if (!add) return createNoopFacilityController();

    const resolvedWidth = getFallbackDimension(width);
    const resolvedHeight = getFallbackDimension(height);
    const centerX = resolvedWidth / 2;
    const centerY = resolvedHeight / 2;
    let visual = null;
    let hasFacilityFloor = false;

    try {
      hasFacilityFloor = scene?.textures?.exists?.(TEXTURES.facilityFloor) === true;
    } catch {
      hasFacilityFloor = false;
    }

    if (hasFacilityFloor && typeof add.tileSprite === "function") {
      try {
        visual = configureFallbackVisual(
          add.tileSprite(centerX, centerY, resolvedWidth, resolvedHeight, TEXTURES.facilityFloor)
        );
      } catch {
        visual = null;
      }
    }

    if (!visual && typeof add.rectangle === "function") {
      try {
        visual = configureFallbackVisual(
          add.rectangle(centerX, centerY, resolvedWidth, resolvedHeight, 0x18202a, 1)
        );
      } catch {
        visual = null;
      }
    }

    return visual ? createDisplayOnlyFallbackController(visual) : createNoopFacilityController();
  } catch {
    return createNoopFacilityController();
  }
}
