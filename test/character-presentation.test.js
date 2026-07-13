import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CHARACTER_SHEETS,
  OPENING_ANIMATED_ENEMY_TYPES,
  getCharacterAnimationKey,
  getFacingFromVector,
  registerOpeningCharacterAnimations,
  resolveCharacterTexture,
  syncCharacterPresentation
} from "../src/art/characterPresentation.js";
import { TEXTURES } from "../src/assets/manifest.js";

function createTextureScene({ available = true, frameTotal = 49 } = {}) {
  const created = [];
  const existing = new Set();
  const warnings = [];
  return {
    created,
    warnings,
    textures: {
      exists: () => available,
      get: () => ({ frameTotal })
    },
    anims: {
      exists: (key) => existing.has(key),
      generateFrameNumbers: (sheetKey, range) => ({ sheetKey, ...range }),
      create: (config) => {
        existing.add(config.key);
        created.push(config);
      }
    },
    console: {
      warn: (message) => warnings.push(message)
    }
  };
}

function createSprite({
  kind,
  sheetKey,
  velocity = { x: 0, y: 0 },
  presentationFacing = "down",
  presentationHitUntilMs = 0,
  isTinted = false
}) {
  const played = [];
  const sprite = {
    active: true,
    isDying: false,
    enemyType: kind,
    texture: { key: sheetKey },
    body: {
      width: 24,
      height: 24,
      offset: { x: 12, y: 12 },
      velocity: {
        ...velocity,
        lengthSq() {
          return this.x * this.x + this.y * this.y;
        }
      }
    },
    presentationFacing,
    presentationHitUntilMs,
    isTinted,
    anims: { currentAnim: null },
    play(key) {
      played.push(key);
      this.anims.currentAnim = { key };
    }
  };
  return { sprite, played };
}

test("opening animation scope is limited to infected staff", () => {
  assert.deepEqual(OPENING_ANIMATED_ENEMY_TYPES, ["infectedStaff"]);
  assert.ok(Object.isFrozen(OPENING_ANIMATED_ENEMY_TYPES));
  assert.deepEqual(CHARACTER_SHEETS, {
    player: {
      sheetKey: TEXTURES.playerOpeningSheet,
      fallbackKey: TEXTURES.player
    },
    infectedStaff: {
      sheetKey: TEXTURES.infectedOpeningSheet,
      fallbackKey: TEXTURES.enemyInfected
    }
  });
});

test("character facing preserves the last direction while idle", () => {
  assert.equal(getFacingFromVector(1, 0, "down"), "right");
  assert.equal(getFacingFromVector(-1, 0, "down"), "left");
  assert.equal(getFacingFromVector(0, -1, "down"), "up");
  assert.equal(getFacingFromVector(0, 1, "up"), "down");
  assert.equal(getFacingFromVector(0, 0, "left"), "left");
});

test("animation keys map idle, move and hit without changing character kind", () => {
  assert.equal(
    getCharacterAnimationKey({ kind: "player", motion: "idle", facing: "down", hit: false }),
    "player-idle-down"
  );
  assert.equal(
    getCharacterAnimationKey({ kind: "infectedStaff", motion: "move", facing: "left", hit: false }),
    "infectedStaff-move-left"
  );
  assert.equal(
    getCharacterAnimationKey({ kind: "infectedStaff", motion: "move", facing: "up", hit: true }),
    "infectedStaff-hit-up"
  );
});

test("character textures fall back when a sheet is missing or incomplete", () => {
  assert.equal(resolveCharacterTexture(createTextureScene({ available: false }), "player", TEXTURES.player), TEXTURES.player);
  assert.equal(resolveCharacterTexture(createTextureScene({ frameTotal: 48 }), "player", TEXTURES.player), TEXTURES.player);
  assert.equal(
    resolveCharacterTexture(createTextureScene(), "player", TEXTURES.player),
    TEXTURES.playerOpeningSheet
  );
  assert.equal(resolveCharacterTexture(createTextureScene(), "crawler", TEXTURES.enemyCrawler), TEXTURES.enemyCrawler);
});

test("animation registration is complete, frame-exact and idempotent", () => {
  const scene = createTextureScene();
  registerOpeningCharacterAnimations(scene);
  registerOpeningCharacterAnimations(scene);

  assert.equal(scene.created.length, 24);
  const byKey = new Map(scene.created.map((animation) => [animation.key, animation]));
  assert.deepEqual(byKey.get("player-idle-down").frames, {
    sheetKey: TEXTURES.playerOpeningSheet,
    start: 0,
    end: 3
  });
  assert.deepEqual(byKey.get("player-move-left").frames, {
    sheetKey: TEXTURES.playerOpeningSheet,
    start: 16,
    end: 21
  });
  assert.deepEqual(byKey.get("infectedStaff-hit-up").frames, {
    sheetKey: TEXTURES.infectedOpeningSheet,
    start: 46,
    end: 47
  });
  assert.equal(byKey.get("player-idle-down").repeat, -1);
  assert.equal(byKey.get("player-move-down").frameRate, 8);
  assert.equal(byKey.get("player-hit-down").repeat, 0);
  assert.deepEqual(scene.warnings, []);
});

test("missing or incomplete sheets warn at most once per key and register nothing", () => {
  const missing = createTextureScene({ available: false });
  registerOpeningCharacterAnimations(missing);
  registerOpeningCharacterAnimations(missing);
  assert.equal(missing.created.length, 0);
  assert.equal(missing.warnings.length, 2);
  assert.match(missing.warnings[0], /player-opening-sheet/);
  assert.match(missing.warnings[1], /infected-opening-sheet/);
});

test("presentation sync changes only animation-facing display state", () => {
  const player = createSprite({
    kind: "player",
    sheetKey: TEXTURES.playerOpeningSheet,
    velocity: { x: 90, y: 10 }
  });
  const enemy = createSprite({
    kind: "infectedStaff",
    sheetKey: TEXTURES.infectedOpeningSheet,
    velocity: { x: 0, y: -55 },
    isTinted: true
  });
  const playerBodyBefore = structuredClone({
    width: player.sprite.body.width,
    height: player.sprite.body.height,
    offset: player.sprite.body.offset,
    velocity: { x: player.sprite.body.velocity.x, y: player.sprite.body.velocity.y }
  });
  const enemyBodyBefore = structuredClone({
    width: enemy.sprite.body.width,
    height: enemy.sprite.body.height,
    offset: enemy.sprite.body.offset,
    velocity: { x: enemy.sprite.body.velocity.x, y: enemy.sprite.body.velocity.y }
  });
  const scene = {
    elapsedSurvivalMs: 1_000,
    player: player.sprite,
    enemies: { getChildren: () => [enemy.sprite] }
  };

  syncCharacterPresentation(scene);

  assert.deepEqual(player.played, ["player-move-right"]);
  assert.deepEqual(enemy.played, ["infectedStaff-hit-up"]);
  assert.equal(enemy.sprite.presentationHitUntilMs, 1_120);
  assert.deepEqual(
    {
      width: player.sprite.body.width,
      height: player.sprite.body.height,
      offset: player.sprite.body.offset,
      velocity: { x: player.sprite.body.velocity.x, y: player.sprite.body.velocity.y }
    },
    playerBodyBefore
  );
  assert.deepEqual(
    {
      width: enemy.sprite.body.width,
      height: enemy.sprite.body.height,
      offset: enemy.sprite.body.offset,
      velocity: { x: enemy.sprite.body.velocity.x, y: enemy.sprite.body.velocity.y }
    },
    enemyBodyBefore
  );
});

test("static fallbacks and later-wave textures are presentation-compatible", () => {
  const fallbackPlayer = createSprite({ kind: "player", sheetKey: TEXTURES.player });
  const crawler = createSprite({ kind: "crawler", sheetKey: TEXTURES.enemyCrawler });
  syncCharacterPresentation({
    elapsedSurvivalMs: 0,
    player: fallbackPlayer.sprite,
    enemies: { getChildren: () => [crawler.sprite] }
  });
  assert.deepEqual(fallbackPlayer.played, []);
  assert.deepEqual(crawler.played, []);
});

test("player and enemy creation retain the approved physics geometry and order", async () => {
  const [world, enemies] = await Promise.all([
    readFile(new URL("../src/scene/world.js", import.meta.url), "utf8"),
    readFile(new URL("../src/scene/enemies.js", import.meta.url), "utf8")
  ]);
  const createPlayer = world.slice(world.indexOf("  createPlayer()"), world.indexOf("  createGroups()"));
  assert.match(createPlayer, /physics\.add\.sprite/);
  const creation = createPlayer.indexOf("physics.add.sprite");
  const collide = createPlayer.indexOf("setCollideWorldBounds(true)");
  const body = createPlayer.indexOf("body.setSize(24, 24)");
  const scale = createPlayer.indexOf("applyDisplayScalePreservingBody");
  assert.ok(creation < collide && collide < body && body < scale);

  assert.match(world, /classType:\s*Phaser\.Physics\.Arcade\.Sprite/);
  assert.match(enemies, /enemy\.setCircle\(config\.bodyRadius\)/);
  assert.match(enemies, /enemy\.body\.setSize\(config\.bodySize, config\.bodySize\)/);
  assert.match(enemies, /boss\.setCircle\(18\)/);
  assert.doesNotMatch(enemies, /body\.setOffset/);
});

test("presentation adapter source never writes gameplay, body or timer state", async () => {
  const source = await readFile(
    new URL("../src/art/characterPresentation.js", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /\.body\.(?:setSize|setOffset|setCircle|setVelocity)/);
  assert.doesNotMatch(source, /\.(?:health|moveSpeed|elapsedSurvivalMs|playerInvulnerableUntilMs)\s*=/);
  assert.doesNotMatch(source, /\.time\.(?:addEvent|delayedCall)/);
});
