import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CHARACTER_SHEETS,
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
  isTinted = false,
  scaleX = 1,
  scaleY = 1
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
    scaleX,
    scaleY,
    flipX: false,
    anims: { currentAnim: null },
    setFlipX(value) {
      this.flipX = value;
      return this;
    },
    play(key) {
      played.push(key);
      this.anims.currentAnim = { key };
    }
  };
  return { sprite, played };
}

test("opening character sheet contract is player-only", () => {
  assert.deepEqual(CHARACTER_SHEETS, {
    player: {
      sheetKey: TEXTURES.playerOpeningSheet,
      fallbackKey: TEXTURES.player
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
    getCharacterAnimationKey({ kind: "player", motion: "move", facing: "left", hit: false }),
    "player-move-left"
  );
  assert.equal(
    getCharacterAnimationKey({ kind: "player", motion: "move", facing: "up", hit: true }),
    "player-hit-up"
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

  assert.equal(scene.created.length, 12);
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
  assert.deepEqual(
    byKey.get("player-move-right").frames,
    byKey.get("player-move-left").frames,
    "right-facing player animation should mirror the full-size left-facing row"
  );
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
  assert.equal(missing.warnings.length, 1);
  assert.match(missing.warnings[0], /player-opening-sheet/);
});

test("tinted player enters hit-facing and keeps it until hitUntil expires", () => {
  const player = createSprite({
    kind: "player",
    sheetKey: TEXTURES.playerOpeningSheet,
    velocity: { x: 0, y: -55 },
    isTinted: true
  });
  const playerBodyBefore = structuredClone({
    width: player.sprite.body.width,
    height: player.sprite.body.height,
    offset: player.sprite.body.offset,
    velocity: { x: player.sprite.body.velocity.x, y: player.sprite.body.velocity.y }
  });
  const scene = {
    elapsedSurvivalMs: 1_000,
    player: player.sprite
  };

  syncCharacterPresentation(scene);

  assert.deepEqual(player.played, ["player-hit-up"]);
  assert.equal(player.sprite.presentationHitUntilMs, 1_120);
  assert.equal(player.sprite.presentationFacing, "up");
  assert.equal(player.sprite.flipX, false);
  assert.equal(player.sprite.scaleX, 1);
  assert.equal(player.sprite.scaleY, 1);

  player.sprite.isTinted = false;
  scene.elapsedSurvivalMs = 1_119;
  syncCharacterPresentation(scene);
  assert.deepEqual(player.played, ["player-hit-up"]);

  scene.elapsedSurvivalMs = 1_120;
  syncCharacterPresentation(scene);
  assert.deepEqual(player.played, ["player-hit-up", "player-move-up"]);
  assert.deepEqual(
    {
      width: player.sprite.body.width,
      height: player.sprite.body.height,
      offset: player.sprite.body.offset,
      velocity: { x: player.sprite.body.velocity.x, y: player.sprite.body.velocity.y }
    },
    playerBodyBefore
  );
});

test("stationary player retains the latest firing-facing without changing scale", () => {
  const firingFacing = getFacingFromVector(1, 0, "down");
  const player = createSprite({
    kind: "player",
    sheetKey: TEXTURES.playerOpeningSheet,
    velocity: { x: 0, y: 0 },
    presentationFacing: firingFacing,
    scaleX: 1.2,
    scaleY: 1.2
  });

  syncCharacterPresentation({
    elapsedSurvivalMs: 0,
    player: player.sprite
  });

  assert.equal(player.sprite.presentationFacing, "right");
  assert.equal(player.sprite.flipX, true);
  assert.deepEqual(player.played, ["player-idle-right"]);
  assert.equal(player.sprite.scaleX, 1.2);
  assert.equal(player.sprite.scaleY, 1.2);
});

test("horizontal facing mirrors right without changing character scale", () => {
  const player = createSprite({
    kind: "player",
    sheetKey: TEXTURES.playerOpeningSheet,
    velocity: { x: 90, y: 0 },
    scaleX: 1.2,
    scaleY: 1.2
  });
  const scene = {
    elapsedSurvivalMs: 0,
    player: player.sprite,
    enemies: { getChildren: () => [] }
  };

  syncCharacterPresentation(scene);

  assert.equal(player.sprite.presentationFacing, "right");
  assert.equal(player.sprite.flipX, true);
  assert.equal(player.sprite.scaleX, 1.2);
  assert.equal(player.sprite.scaleY, 1.2);

  player.sprite.body.velocity.x = -90;
  syncCharacterPresentation(scene);

  assert.equal(player.sprite.presentationFacing, "left");
  assert.equal(player.sprite.flipX, false);
  assert.equal(player.sprite.scaleX, 1.2);
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
  const createGroups = world.slice(world.indexOf("  createGroups()"), world.indexOf("  createColliders()"));
  const initializer = enemies.slice(
    enemies.indexOf("  initializeEnemyFromConfig("),
    enemies.indexOf("  updateEnemies()")
  );
  const bossCreation = enemies.slice(
    enemies.indexOf("  spawnScp049Boss()"),
    enemies.indexOf("  updateBoss()")
  );
  assert.match(createPlayer, /physics\.add\.sprite/);
  const creation = createPlayer.indexOf("physics.add.sprite");
  const collide = createPlayer.indexOf("setCollideWorldBounds(true)");
  const body = createPlayer.indexOf("body.setSize(24, 24)");
  const scale = createPlayer.indexOf("applyDisplayScalePreservingBody");
  assert.ok(creation < collide && collide < body && body < scale);

  assert.match(createGroups, /classType:\s*Phaser\.Physics\.Arcade\.Sprite/);
  assert.doesNotMatch(createGroups, /createCallback/);
  assert.doesNotMatch(createGroups, /resolveCharacterTexture/);
  assert.equal(
    world.match(/resolveCharacterTexture\s*\(/g)?.length,
    1,
    "resolveCharacterTexture must be called only for the player"
  );
  assert.match(enemies, /centerCircularBody\(enemy, config\.bodyRadius\)/);
  assert.match(enemies, /enemy\.setCircle\(config\.bodyRadius\)/);
  assert.match(enemies, /enemy\.body\.setSize\(config\.bodySize, config\.bodySize\)/);
  assert.match(enemies, /enemy\.body\.setSize\(enemy\.width, enemy\.height\)/);
  assert.match(
    initializer,
    /applyDisplayScalePreservingBody\(enemy, CHARACTER_DISPLAY_SCALE\.infectedStaff\)/
  );
  assert.match(initializer, /enemy\.setScale\(1\.2\)/);
  const bodyBranch = initializer.indexOf('if (config.bodyShape === "circle")');
  const infectedScale = initializer.indexOf("applyDisplayScalePreservingBody");
  const eliteScale = initializer.indexOf("enemy.setScale(1.2)");
  const riotFields = initializer.indexOf("enemy.frontDamageMultiplier");
  const blinkFields = initializer.indexOf("enemy.teleportCooldownMs");
  const presentation = initializer.indexOf(
    "applyEnemyPresentation(this, enemy, config.type)"
  );
  const destroyListener = initializer.indexOf('enemy.once("destroy"');
  assert.ok(bodyBranch >= 0 && bodyBranch < infectedScale);
  assert.ok(infectedScale < presentation);
  assert.ok(eliteScale < presentation);
  assert.ok(riotFields < presentation);
  assert.ok(blinkFields < presentation);
  assert.ok(presentation >= 0 && presentation < destroyListener);

  assert.match(bossCreation, /this\.enemies\.create\(bossX, bossY, "enemy-scp049"\)/);
  const bossCircle = bossCreation.indexOf("centerCircularBody(boss, 18)");
  const bossScale = bossCreation.indexOf(
    "applyDisplayScalePreservingBody(boss, CHARACTER_DISPLAY_SCALE.scp049)"
  );
  const bossDepth = bossCreation.indexOf("boss.setDepth(12)");
  assert.ok(bossCircle >= 0 && bossCircle < bossScale && bossScale < bossDepth);
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
