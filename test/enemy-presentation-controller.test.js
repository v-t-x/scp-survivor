import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  R17_DEATH_COPY_POOL_LIMIT,
  createEnemyPresentationController
} from "../src/art/enemyPresentationController.js";

const FORMAL_FRAMES = Object.freeze({
  "r17-drifter-action-sheet": 19,
  "r17-rift-skimmer-action-sheet": 19,
  "r17-pulse-sac-action-sheet": 21,
  "r17-carapace-gate-action-sheet": 23,
  "r17-frame-gap-action-sheet": 23,
  "r17-brood-mass-action-sheet": 23,
  "r17-bud-action-sheet": 19,
  "enemy-scp049-locomotion-sheet": 41,
  "enemy-scp049-action-sheet": 20
});

const FORMAL_ANIMATIONS = new Set([
  "r17-drifter-action-move", "r17-drifter-action-hit", "r17-drifter-action-death", "r17-drifter-action-contact",
  "r17-rift-skimmer-action-move", "r17-rift-skimmer-action-hit", "r17-rift-skimmer-action-death", "r17-rift-skimmer-action-pierce",
  "r17-pulse-sac-action-move", "r17-pulse-sac-action-hit", "r17-pulse-sac-action-death", "r17-pulse-sac-action-shoot",
  "r17-carapace-gate-action-move", "r17-carapace-gate-action-hit", "r17-carapace-gate-action-death", "r17-carapace-gate-action-brace", "r17-carapace-gate-action-charge",
  "r17-frame-gap-action-move", "r17-frame-gap-action-hit", "r17-frame-gap-action-death", "r17-frame-gap-action-phase-out", "r17-frame-gap-action-reappear-dash",
  "r17-brood-mass-action-move", "r17-brood-mass-action-hit", "r17-brood-mass-action-death", "r17-brood-mass-action-split",
  "r17-bud-action-move", "r17-bud-action-hit", "r17-bud-action-death", "r17-bud-action-snap",
  "enemy-scp049-down-idle", "enemy-scp049-down-walk", "enemy-scp049-left-idle", "enemy-scp049-left-walk",
  "enemy-scp049-right-idle", "enemy-scp049-right-walk", "enemy-scp049-up-idle", "enemy-scp049-up-walk",
  "enemy-scp049-frenzy-enter", "enemy-scp049-frenzy-loop", "enemy-scp049-hit-overlay", "enemy-scp049-recontain"
]);

const LEGACY_FRAMES = Object.freeze({
  "r17-drifter": 5,
  "r17-rift-skimmer": 5,
  "r17-pulse-sac": 5,
  "r17-carapace-gate": 5,
  "r17-frame-gap": 5,
  "r17-brood-mass": 5,
  "r17-bud": 5,
  "enemy-scp049": 1
});

function createBody(actor, { width = 24, height = 24, radius = 0, isCircle = false } = {}) {
  return {
    sourceWidth: width,
    sourceHeight: height,
    width,
    height,
    radius,
    isCircle,
    enable: true,
    position: { x: actor.x - width / 2, y: actor.y - height / 2 },
    offset: {
      x: 0,
      y: 0,
      set(x, y) { this.x = x; this.y = y; }
    },
    velocity: { x: 0, y: 0 },
    updateFromGameObject() {
      this.width = this.sourceWidth * Math.abs(actor.scaleX);
      this.height = this.sourceHeight * Math.abs(actor.scaleY);
      this.position.x = actor.x + actor.scaleX * (this.offset.x - actor.displayOriginX);
      this.position.y = actor.y + actor.scaleY * (this.offset.y - actor.displayOriginY);
    }
  };
}

function createActor({ x = 100, y = 120, textureKey = "enemy-crawler", scale = 1, radius = 0 } = {}) {
  const listeners = new Map();
  const actor = {
    active: true,
    visible: true,
    alpha: 1,
    depth: 10,
    x,
    y,
    width: 48,
    height: 48,
    displayOriginX: 24,
    displayOriginY: 24,
    scaleX: scale,
    scaleY: scale,
    flipX: false,
    texture: { key: textureKey },
    frame: { name: 0 },
    played: [],
    framed: [],
    pauseCount: 0,
    resumeCount: 0,
    setTexture(key, frame = 0) { this.texture.key = key; this.frame.name = frame; return this; },
    setFrame(frame) { this.frame.name = frame; this.framed.push(frame); return this; },
    setScale(value) { this.scaleX = value; this.scaleY = value; return this; },
    setFlipX(value) { this.flipX = value; return this; },
    setAlpha(value) { this.alpha = value; return this; },
    setDepth(value) { this.depth = value; return this; },
    setVisible(value) { this.visible = value; return this; },
    setActive(value) { this.active = value; return this; },
    setPosition(nextX, nextY) { this.x = nextX; this.y = nextY; return this; },
    setOrigin() { return this; },
    play(key) { this.played.push(key); this.currentAnimation = key; return this; },
    once(event, fn) { listeners.set(event, fn); return this; },
    off(event, fn) { if (listeners.get(event) === fn) listeners.delete(event); return this; },
    emit(event) { const fn = listeners.get(event); if (fn) { listeners.delete(event); fn(); } },
    listenerCount(event) { return listeners.has(event) ? 1 : 0; },
    destroy() { if (!this.active && this.destroyed) return; this.active = false; this.visible = false; this.destroyed = true; this.emit("destroy"); }
  };
  actor.anims = {
    pause() { actor.pauseCount += 1; },
    resume() { actor.resumeCount += 1; }
  };
  actor.body = createBody(actor, { radius, isCircle: radius > 0 });
  actor.body.updateFromGameObject();
  return actor;
}

function createScene({ formal = true, missing = [], throwingTextures = false } = {}) {
  const sprites = [];
  const timers = [];
  const missingSet = new Set(missing);
  const frameTotals = { ...LEGACY_FRAMES, ...(formal ? FORMAL_FRAMES : {}) };
  const scene = {
    sprites,
    timers,
    legacyCalls: [],
    textures: {
      exists(key) {
        if (throwingTextures) throw new Error("texture lookup failed");
        return !missingSet.has(key) && Object.hasOwn(frameTotals, key);
      },
      get(key) { return { frameTotal: frameTotals[key] }; }
    },
    anims: {
      exists(key) { return formal && FORMAL_ANIMATIONS.has(key); }
    },
    add: {
      sprite(x, y, key) {
        const sprite = createActor({ x, y, textureKey: key });
        sprite.kind = "copy";
        sprites.push(sprite);
        return sprite;
      }
    },
    time: {
      delayedCall(delay, callback) {
        const timer = {
          delay,
          callback,
          paused: false,
          removed: false,
          remove() { this.removed = true; },
          fire() { if (!this.removed) { this.removed = true; callback(); } }
        };
        timers.push(timer);
        return timer;
      }
    },
    playLegacyEnemyDeathVisual(actor, options) {
      this.legacyCalls.push({ actor, options });
    }
  };
  return scene;
}

function controllerFor(scene, ids) {
  return createEnemyPresentationController(scene, {
    allowedDevelopmentAssetIds: new Set(ids),
    forceLegacy: false
  });
}

function deathSnapshot(presentationId, overrides = {}) {
  return Object.freeze({
    presentationId,
    enemyType: "crawler",
    eliteType: null,
    isBoss: false,
    canSplit: false,
    x: 100,
    y: 120,
    frame: 5,
    flipX: false,
    alpha: 1,
    depth: 10,
    scaleX: 1,
    scaleY: 1,
    ...overrides
  });
}

// Break caught: Preload's no-option registration is treated as sufficient, so DEV candidates never become formal.
test("controller filters the nine candidate ids before registering Task 3 animations", () => {
  const created = [];
  const existing = new Set();
  const scene = {
    textures: {
      exists(key) { return key === "r17-rift-skimmer-action-sheet"; },
      get() { return { frameTotal: 19 }; }
    },
    anims: {
      exists(key) { return existing.has(key); },
      generateFrameNumbers(textureKey, range) { return { textureKey, ...range }; },
      create(config) { created.push(config); existing.add(config.key); },
      remove(key) { existing.delete(key); }
    }
  };
  const controller = createEnemyPresentationController(scene, {
    allowedDevelopmentAssetIds: new Set(["unknown", "r17-rift-skimmer-action-sheet"]),
    forceLegacy: false
  });
  assert.deepEqual(created.map(({ key }) => key), [
    "r17-rift-skimmer-action-move",
    "r17-rift-skimmer-action-hit",
    "r17-rift-skimmer-action-death",
    "r17-rift-skimmer-action-pierce"
  ]);
  controller.destroy();
});

// Break caught: resolver failures hide the gameplay actor or replace its current fallback.
test("unknown, missing and throwing textures leave a live actor visible on its current fallback", () => {
  for (const [scene, currentTexture] of [
    [createScene({ formal: false }), "r17-rift-skimmer"],
    [createScene({ missing: ["r17-rift-skimmer-action-sheet"] }), "r17-rift-skimmer"],
    [createScene({ throwingTextures: true }), "enemy-crawler"]
  ]) {
    const actor = createActor({ textureKey: currentTexture });
    const controller = controllerFor(scene, ["unknown", "r17-rift-skimmer-action-sheet"]);
    assert.doesNotThrow(() => controller.trackActor(actor, { enemyType: "crawler", isBoss: false }));
    assert.equal(actor.visible, true);
    assert.equal(actor.active, true);
    assert.equal(actor.texture.key, currentTexture);
  }
});

// Break caught: an actor can receive multiple ids and duplicate registration side effects.
test("trackActor is idempotent and untrackActor and destroy are idempotent", () => {
  const scene = createScene();
  const actor = createActor();
  const controller = controllerFor(scene, ["r17-rift-skimmer-action-sheet"]);
  const first = controller.trackActor(actor, { enemyType: "crawler", isBoss: false });
  const second = controller.trackActor(actor, { enemyType: "crawler", isBoss: false });
  assert.ok(Number.isInteger(first) && first > 0);
  assert.equal(second, first);
  assert.equal(scene.sprites.length, 0, "live R-17 tracking creates no child display objects");
  assert.doesNotThrow(() => controller.untrackActor(actor));
  assert.doesNotThrow(() => controller.untrackActor(actor));
  assert.doesNotThrow(() => controller.destroy());
  assert.doesNotThrow(() => controller.destroy());
});

// Break caught: a later hit interrupts an already committed gameplay role.
test("committed role locks outrank later hits while a newly committed role preempts an older hit", () => {
  const scene = createScene();
  const actor = createActor();
  actor.body.velocity.x = 20;
  const controller = controllerFor(scene, ["r17-rift-skimmer-action-sheet"]);
  const presentationId = controller.trackActor(actor, { enemyType: "crawler", isBoss: false });

  assert.equal(controller.notifyAction(Object.freeze({ presentationId, action: "pierce", atMs: 100 })), undefined);
  controller.sync(100, 16);
  assert.equal(actor.currentAnimation, "r17-rift-skimmer-action-pierce");
  assert.equal(controller.notifyHit(Object.freeze({ presentationId, lethal: false, atMs: 120 })), undefined);
  controller.sync(120, 16);
  assert.equal(actor.currentAnimation, "r17-rift-skimmer-action-pierce");

  controller.sync(700, 16);
  controller.notifyHit(Object.freeze({ presentationId, lethal: false, atMs: 700 }));
  controller.sync(700, 16);
  assert.equal(actor.currentAnimation, "r17-rift-skimmer-action-hit");
  controller.notifyAction(Object.freeze({ presentationId, action: "pierce", atMs: 710 }));
  controller.sync(710, 16);
  assert.equal(actor.currentAnimation, "r17-rift-skimmer-action-pierce");

  controller.notifyHit(Object.freeze({ presentationId, lethal: true, atMs: 720 }));
  controller.sync(720, 16);
  assert.equal(actor.currentAnimation, "r17-rift-skimmer-action-pierce", "lethal skips hit entirely");
});

// Break caught: a second action replaces a still-active committed role instead of only preempting hit.
test("overlapping actions preserve the first committed role lock while a role may still preempt hit", () => {
  const scene = createScene();
  const actor = createActor({ textureKey: "enemy-riot" });
  actor.body.velocity.x = 20;
  const controller = controllerFor(scene, ["r17-carapace-gate-action-sheet"]);
  const presentationId = controller.trackActor(actor, { enemyType: "riotUnit", isBoss: false });

  controller.notifyHit(Object.freeze({ presentationId, lethal: false, atMs: 100 }));
  controller.sync(100, 16);
  assert.equal(actor.currentAnimation, "r17-carapace-gate-action-hit");

  controller.notifyAction(Object.freeze({ presentationId, action: "brace", atMs: 110 }));
  controller.sync(110, 16);
  assert.equal(actor.currentAnimation, "r17-carapace-gate-action-brace", "role may preempt an older hit");

  controller.notifyAction(Object.freeze({ presentationId, action: "charge", atMs: 120 }));
  controller.sync(120, 16);
  assert.equal(actor.currentAnimation, "r17-carapace-gate-action-brace", "active role remains locked");

  controller.notifyAction(Object.freeze({ presentationId, action: "charge", atMs: 711 }));
  controller.sync(711, 16);
  assert.equal(actor.currentAnimation, "r17-carapace-gate-action-charge", "new role starts after prior lock expires");
});

// Break caught: Pulse Sac samples the wrong deadline boundary or release timing.
test("Pulse Sac precharge and committed release use the exact approved frames", () => {
  const scene = createScene();
  const actor = createActor({ textureKey: "enemy-drone" });
  actor.nextShotAtMs = 1_000;
  const controller = controllerFor(scene, ["r17-pulse-sac-action-sheet"]);
  const presentationId = controller.trackActor(actor, { enemyType: "drone", isBoss: false });

  controller.sync(599, 16);
  assert.notEqual(actor.frame.name, 14);
  for (const [elapsed, frame] of [[600, 14], [700, 15], [800, 16], [900, 17]]) {
    controller.sync(elapsed, 16);
    assert.equal(actor.frame.name, frame, `deadline frame at ${elapsed}`);
  }
  actor.nextShotAtMs = 2_000;
  controller.notifyAction(Object.freeze({ presentationId, action: "shoot-release", atMs: 1_000 }));
  controller.sync(1_000, 16);
  assert.equal(actor.frame.name, 18);
  controller.sync(1_100, 16);
  assert.equal(actor.frame.name, 19);
  controller.sync(1_200, 16);
  assert.equal(actor.frame.name, 19, "frame 19 holds through +200ms");
  controller.sync(1_201, 16);
  assert.equal(actor.currentAnimation, "r17-pulse-sac-action-move");
  assert.equal(actor.nextShotAtMs, 2_000, "presentation does not rewrite the gameplay deadline");
});

// Break caught: a nonlethal hit interrupts the active deadline-derived shoot warning.
test("Pulse Sac precharge is an active role lock that a later hit cannot interrupt", () => {
  const scene = createScene();
  const actor = createActor({ textureKey: "enemy-drone" });
  actor.nextShotAtMs = 1_000;
  const controller = controllerFor(scene, ["r17-pulse-sac-action-sheet"]);
  const presentationId = controller.trackActor(actor, { enemyType: "drone", isBoss: false });
  controller.sync(600, 16);
  assert.equal(actor.frame.name, 14);
  controller.notifyHit(Object.freeze({ presentationId, lethal: false, atMs: 650 }));
  controller.sync(650, 16);
  assert.equal(actor.frame.name, 14);
  assert.notEqual(actor.currentAnimation, "r17-pulse-sac-action-hit");
});

// Break caught: a release observed after a missed precharge starts charging after the projectile.
test("Pulse Sac release without observed precharge jumps directly through frames 18 and 19", () => {
  const scene = createScene();
  const actor = createActor({ textureKey: "enemy-drone" });
  actor.nextShotAtMs = 5_000;
  const controller = controllerFor(scene, ["r17-pulse-sac-action-sheet"]);
  const presentationId = controller.trackActor(actor, { enemyType: "drone", isBoss: false });
  controller.notifyAction(Object.freeze({ presentationId, action: "shoot-release", atMs: 1_000 }));
  controller.sync(1_000, 16);
  controller.sync(1_100, 16);
  assert.deepEqual(actor.framed.slice(-2), [18, 19]);
  assert.ok(!actor.framed.slice(-2).some((frame) => frame >= 14 && frame <= 17));
});

// Break caught: splittable biomass and non-splitting clones select the same terminal clip.
test("splittable biomass uses split while clones use the common death clip", () => {
  const scene = createScene();
  const controller = controllerFor(scene, ["r17-brood-mass-action-sheet"]);
  const parent = createActor({ textureKey: "enemy-biomass" });
  const clone = createActor({ textureKey: "enemy-biomass" });
  const parentId = controller.trackActor(parent, { enemyType: "biomass", isBoss: false });
  const cloneId = controller.trackActor(clone, { enemyType: "biomass", isBoss: false });
  assert.equal(controller.notifyDeath(deathSnapshot(parentId, { enemyType: "biomass", canSplit: true })), undefined);
  assert.equal(controller.notifyDeath(deathSnapshot(cloneId, { enemyType: "biomass", canSplit: false })), undefined);
  assert.deepEqual(scene.sprites.map((sprite) => sprite.currentAnimation), [
    "r17-brood-mass-action-split",
    "r17-brood-mass-action-death"
  ]);
});

// Break caught: the death-copy pool allocates without a cap or blocks actor cleanup at saturation.
test("R-17 death copies cap at 64 and the 65th invokes legacy fallback", () => {
  const scene = createScene();
  const controller = controllerFor(scene, ["r17-rift-skimmer-action-sheet"]);
  const actors = [];
  for (let index = 0; index < R17_DEATH_COPY_POOL_LIMIT + 1; index += 1) {
    const actor = createActor({ x: index, textureKey: "enemy-crawler" });
    actors.push(actor);
    const presentationId = controller.trackActor(actor, { enemyType: "crawler", isBoss: false });
    controller.notifyDeath(deathSnapshot(presentationId, { x: index }));
  }
  assert.equal(scene.sprites.length, R17_DEATH_COPY_POOL_LIMIT);
  assert.equal(scene.legacyCalls.length, 1);
  assert.equal(scene.legacyCalls[0].actor, actors.at(-1));
  assert.ok(scene.timers.every((timer) => timer.delay === 90));
});

// Break caught: pausing presentation freezes terminal victory cleanup or fails to freeze ordinary copies.
test("ordinary death copies pause and resume while terminal ownership is independent", () => {
  const scene = createScene();
  const controller = controllerFor(scene, ["r17-rift-skimmer-action-sheet"]);
  const actor = createActor();
  const presentationId = controller.trackActor(actor, { enemyType: "crawler", isBoss: false });
  controller.notifyDeath(deathSnapshot(presentationId));
  const copy = scene.sprites[0];
  controller.setPaused(true);
  controller.setPaused(false);
  assert.equal(copy.pauseCount, 1);
  assert.equal(copy.resumeCount, 1);
});

// Break caught: sync creates arrays, snapshots, sprites, tweens or other per-frame objects.
test("sync source iterates the actor Map directly without per-frame collection or display allocation", async () => {
  const source = await readFile(new URL("../src/art/enemyPresentationController.js", import.meta.url), "utf8");
  const start = source.indexOf("function sync(");
  const end = source.indexOf("\n  function notifyAction", start);
  assert.ok(start >= 0 && end > start, "controller exposes a local sync implementation");
  const sync = source.slice(start, end);
  assert.match(sync, /for\s*\(const\s+record\s+of\s+records\.values\(\)\)/);
  assert.doesNotMatch(sync, /\[\.\.\.|Array\.from|\.map\(|\.filter\(|add\.sprite|tweens\.add|Object\.freeze|structuredClone/);
});
