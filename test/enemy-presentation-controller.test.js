import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  R17_DEATH_COPY_POOL_LIMIT,
  createEnemyPresentationController
} from "../src/art/enemyPresentationController.js";
import {
  getEnemyPresentationMode,
  getScp049PresentationMode
} from "../src/art/enemyPresentation.js";

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

const EXPECTED_ANIMATION_KEYS = Object.freeze({
  allFormal: Object.freeze([
    "r17-drifter-loop", "r17-rift-skimmer-loop", "r17-pulse-sac-loop", "r17-carapace-gate-loop", "r17-frame-gap-loop", "r17-brood-mass-loop", "r17-bud-loop",
    "r17-drifter-action-move", "r17-drifter-action-hit", "r17-drifter-action-death", "r17-drifter-action-contact",
    "r17-rift-skimmer-action-move", "r17-rift-skimmer-action-hit", "r17-rift-skimmer-action-death", "r17-rift-skimmer-action-pierce",
    "r17-pulse-sac-action-move", "r17-pulse-sac-action-hit", "r17-pulse-sac-action-death", "r17-pulse-sac-action-shoot",
    "r17-carapace-gate-action-move", "r17-carapace-gate-action-hit", "r17-carapace-gate-action-death", "r17-carapace-gate-action-brace", "r17-carapace-gate-action-charge",
    "r17-frame-gap-action-move", "r17-frame-gap-action-hit", "r17-frame-gap-action-death", "r17-frame-gap-action-phase-out", "r17-frame-gap-action-reappear-dash",
    "r17-brood-mass-action-move", "r17-brood-mass-action-hit", "r17-brood-mass-action-death", "r17-brood-mass-action-split",
    "r17-bud-action-move", "r17-bud-action-hit", "r17-bud-action-death", "r17-bud-action-snap",
    "enemy-scp049-down-idle", "enemy-scp049-down-walk", "enemy-scp049-left-idle", "enemy-scp049-left-walk", "enemy-scp049-right-idle", "enemy-scp049-right-walk", "enemy-scp049-up-idle", "enemy-scp049-up-walk",
    "enemy-scp049-frenzy-enter", "enemy-scp049-frenzy-loop", "enemy-scp049-hit-overlay", "enemy-scp049-recontain"
  ]),
  missingRift: Object.freeze([
    "r17-drifter-loop", "r17-rift-skimmer-loop", "r17-pulse-sac-loop", "r17-carapace-gate-loop", "r17-frame-gap-loop", "r17-brood-mass-loop", "r17-bud-loop",
    "r17-drifter-action-move", "r17-drifter-action-hit", "r17-drifter-action-death", "r17-drifter-action-contact",
    "r17-pulse-sac-action-move", "r17-pulse-sac-action-hit", "r17-pulse-sac-action-death", "r17-pulse-sac-action-shoot",
    "r17-carapace-gate-action-move", "r17-carapace-gate-action-hit", "r17-carapace-gate-action-death", "r17-carapace-gate-action-brace", "r17-carapace-gate-action-charge",
    "r17-frame-gap-action-move", "r17-frame-gap-action-hit", "r17-frame-gap-action-death", "r17-frame-gap-action-phase-out", "r17-frame-gap-action-reappear-dash",
    "r17-brood-mass-action-move", "r17-brood-mass-action-hit", "r17-brood-mass-action-death", "r17-brood-mass-action-split",
    "r17-bud-action-move", "r17-bud-action-hit", "r17-bud-action-death", "r17-bud-action-snap",
    "enemy-scp049-down-idle", "enemy-scp049-down-walk", "enemy-scp049-left-idle", "enemy-scp049-left-walk", "enemy-scp049-right-idle", "enemy-scp049-right-walk", "enemy-scp049-up-idle", "enemy-scp049-up-walk",
    "enemy-scp049-frenzy-enter", "enemy-scp049-frenzy-loop", "enemy-scp049-hit-overlay", "enemy-scp049-recontain"
  ]),
  locomotionOnly: Object.freeze([
    "r17-drifter-loop", "r17-rift-skimmer-loop", "r17-pulse-sac-loop", "r17-carapace-gate-loop", "r17-frame-gap-loop", "r17-brood-mass-loop", "r17-bud-loop",
    "enemy-scp049-down-idle", "enemy-scp049-down-walk", "enemy-scp049-left-idle", "enemy-scp049-left-walk", "enemy-scp049-right-idle", "enemy-scp049-right-walk", "enemy-scp049-up-idle", "enemy-scp049-up-walk"
  ]),
  absent: Object.freeze([])
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

function createScene({ formal = true, legacy = true, missing = [], throwingTextures = false, failAnimationKey = null } = {}) {
  const sprites = [];
  const timers = [];
  const missingSet = new Set(missing);
  const frameTotals = { ...(legacy ? LEGACY_FRAMES : {}), ...(formal ? FORMAL_FRAMES : {}) };
  const animationKeys = new Set();
  const allocationCounters = {
    tween: 0,
    textureAdd: 0,
    textureGenerate: 0,
    filter: 0,
    pipeline: 0,
    shader: 0
  };
  const scene = {
    sprites,
    timers,
    legacyCalls: [],
    animationKeys,
    animationCreateKeys: [],
    animationCreateAttemptKeys: [],
    animationGenerateCount: 0,
    animationRemoveKeys: [],
    duplicateAnimationKeys: [],
    allocationCounters,
    textures: {
      exists(key) {
        if (throwingTextures) throw new Error("texture lookup failed");
        return !missingSet.has(key) && Object.hasOwn(frameTotals, key);
      },
      get(key) { return { frameTotal: frameTotals[key] }; },
      add() { allocationCounters.textureAdd += 1; throw new Error("sync must not create textures"); },
      generate() { allocationCounters.textureGenerate += 1; throw new Error("sync must not generate textures"); }
    },
    anims: {
      exists(key) { return animationKeys.has(key); },
      generateFrameNumbers(textureKey, range) {
        if (!scene.textures.exists(textureKey)) throw new Error(`missing animation texture: ${textureKey}`);
        scene.animationGenerateCount += 1;
        return { textureKey, ...range };
      },
      create(config) {
        scene.animationCreateAttemptKeys.push(config.key);
        if (!scene.textures.exists(config.frames?.textureKey)) {
          throw new Error(`animation requires texture: ${config.frames?.textureKey}`);
        }
        if (config.key === failAnimationKey) throw new Error(`forced animation failure: ${config.key}`);
        if (animationKeys.has(config.key)) {
          scene.duplicateAnimationKeys.push(config.key);
          throw new Error(`duplicate animation: ${config.key}`);
        }
        animationKeys.add(config.key);
        scene.animationCreateKeys.push(config.key);
      },
      remove(key) {
        animationKeys.delete(key);
        scene.animationRemoveKeys.push(key);
      }
    },
    add: {
      sprite(x, y, key) {
        const sprite = createActor({ x, y, textureKey: key });
        sprite.kind = "copy";
        sprites.push(sprite);
        return sprite;
      },
      graphics() { allocationCounters.filter += 1; throw new Error("sync must not create filters"); },
      shader() { allocationCounters.shader += 1; throw new Error("sync must not create shaders"); }
    },
    tweens: {
      add() { allocationCounters.tween += 1; throw new Error("sync must not create tweens"); }
    },
    filters: {
      add() { allocationCounters.filter += 1; throw new Error("sync must not create filters"); }
    },
    renderer: {
      pipelines: {
        add() { allocationCounters.pipeline += 1; throw new Error("sync must not create pipelines"); }
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

function controllerFor(scene, ids, { forceLegacy = false } = {}) {
  return createEnemyPresentationController(scene, {
    allowedDevelopmentAssetIds: new Set(ids),
    forceLegacy
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

// Break caught: a committed frenzy exit leaves the Boss trapped in the prior action role lock.
test("frenzy exit immediately resumes current-direction SCP-049 locomotion", () => {
  const scene = createScene();
  const actor = createActor({ textureKey: "enemy-scp049" });
  actor.bossState = "frenzy";
  const controller = controllerFor(scene, [
    "enemy-scp049-locomotion-sheet",
    "enemy-scp049-action-sheet"
  ]);
  const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });

  controller.notifyAction(Object.freeze({ presentationId, action: "frenzy-enter", atMs: 100 }));
  controller.sync(100, 16);
  assert.equal(actor.currentAnimation, "enemy-scp049-frenzy-enter");

  actor.bossState = "normal";
  actor.body.velocity.x = -20;
  controller.notifyAction(Object.freeze({ presentationId, action: "frenzy-exit", atMs: 200 }));
  controller.sync(200, 16);
  assert.equal(actor.currentAnimation, "enemy-scp049-left-walk");
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
  controller.notifyAction(Object.freeze({ presentationId, action: "shoot-release", shotAtMs: 1_000 }));
  assert.equal(actor.frame.name, 18, "the committed release immediately replaces observed precharge");
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
  controller.notifyAction(Object.freeze({ presentationId, action: "shoot-release", shotAtMs: 1_000 }));
  assert.equal(actor.frame.name, 18);
  controller.sync(1_000, 16);
  controller.sync(1_100, 16);
  assert.deepEqual(actor.framed.slice(-2), [18, 19]);
  assert.ok(!actor.framed.slice(-2).some((frame) => frame >= 14 && frame <= 17));
});

// Break caught: presentation clocks write the gameplay shoot deadline or create a projectile from animation work.
test("Pulse Sac sync and release remain read-only over the gameplay deadline and projectile group", () => {
  const scene = createScene();
  scene.enemyProjectiles = {
    create() {
      throw new Error("presentation must not create gameplay projectiles");
    }
  };
  const actor = createActor({ textureKey: "enemy-drone" });
  let deadline = 1_000;
  let deadlineWrites = 0;
  Object.defineProperty(actor, "nextShotAtMs", {
    configurable: true,
    get() { return deadline; },
    set(value) { deadlineWrites += 1; deadline = value; }
  });
  const controller = controllerFor(scene, ["r17-pulse-sac-action-sheet"]);
  const presentationId = controller.trackActor(actor, { enemyType: "drone", isBoss: false });

  assert.doesNotThrow(() => controller.sync(600, 16));
  assert.doesNotThrow(() => controller.notifyAction(Object.freeze({
    presentationId,
    action: "shoot-release",
    shotAtMs: 1_000
  })));
  assert.doesNotThrow(() => controller.sync(1_201, 16));
  assert.equal(deadline, 1_000);
  assert.equal(deadlineWrites, 0);
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

// Break caught: a 230-actor presentation frame allocates display children, timers, or listeners as it syncs.
test("230 tracked actors keep formal and forced-legacy sync allocation-free for 3600 frames", () => {
  for (const { label, forceLegacy, expectedSprites } of [
    { label: "formal", forceLegacy: false, expectedSprites: 1 },
    { label: "forced legacy", forceLegacy: true, expectedSprites: 0 }
  ]) {
    const scene = createScene();
    const controller = controllerFor(scene, Object.keys(FORMAL_FRAMES), { forceLegacy });
    const actors = [];
    for (let index = 0; index < 229; index += 1) {
      const actor = createActor({ x: index, textureKey: "enemy-crawler" });
      actors.push(actor);
      actor._presentationId = controller.trackActor(actor, { enemyType: "crawler", isBoss: false });
    }
    const boss = createActor({ x: 230, textureKey: "enemy-scp049" });
    actors.push(boss);
    const bossId = controller.trackActor(boss, { enemyType: "scp049", isBoss: true });
    boss._presentationId = bossId;

    controller.notifyHit(Object.freeze({ presentationId: bossId, lethal: false, atMs: 0 }));
    controller.sync(0, 16);
    const warmedAllocationCounters = { ...scene.allocationCounters };
    const warmedSprites = scene.sprites.length;
    const warmedTimers = scene.timers.length;
    const warmedListeners = actors.reduce((total, actor) => total + actor.listenerCount("animationcomplete"), 0);

    for (let frame = 1; frame < 3_600; frame += 1) {
      const elapsedMs = frame * 16;
      if (frame % 600 === 0) {
        controller.notifyHit(Object.freeze({ presentationId: bossId, lethal: false, atMs: elapsedMs }));
      }
      controller.sync(elapsedMs, 16);
    }

    assert.equal(actors.length, 230, label);
    assert.equal(scene.sprites.length, expectedSprites, `${label}: only the reusable Boss overlay may exist`);
    assert.equal(scene.timers.length, 0, `${label}: live sync creates no timers`);
    assert.equal(actors.reduce((total, actor) => total + actor.listenerCount("animationcomplete"), 0), 0, label);
    assert.deepEqual(scene.allocationCounters, warmedAllocationCounters, `${label}: no tween/filter/shader/texture allocation after warm-up`);
    assert.equal(scene.sprites.length, warmedSprites, `${label}: no live display allocation after warm-up`);
    assert.equal(scene.timers.length, warmedTimers, `${label}: no live timer allocation after warm-up`);
    assert.equal(actors.reduce((total, actor) => total + actor.listenerCount("animationcomplete"), 0), warmedListeners, `${label}: no listener allocation after warm-up`);
    assert.ok(actors.every((actor) => actor.active && actor.visible), `${label}: no live actor is replaced`);
    const probe = createActor({ x: 231, textureKey: "enemy-crawler" });
    const probeId = controller.trackActor(probe, { enemyType: "crawler", isBoss: false });
    assert.equal(probeId, 231, `${label}: sync did not create actor records`);
    controller.untrackActor(probe);
    controller.destroy();
    assert.ok(actors.every((actor) => actor._presentationId === 0), label);
  }
});

// Break caught: a partial or absent asset family leaves an actor, copy, timer, listener, or prior-run pool alive after restart.
test("four fallback rows survive two pause cleanup restart cycles without presentation residue", () => {
  const r17FormalKeys = Object.keys(FORMAL_FRAMES).filter((key) => key.startsWith("r17-"));
  const rows = [
    {
      label: "all formal",
      options: {},
      expected: {
        enemyFamily: "formal",
        enemyTexture: "r17-rift-skimmer-action-sheet",
        enemyAnimation: "r17-rift-skimmer-action-move",
        bossFamily: "formal",
        bossTexture: "enemy-scp049-locomotion-sheet",
        bossAnimation: "enemy-scp049-down-idle",
        bossActionTexture: "enemy-scp049-action-sheet",
        animationKeys: EXPECTED_ANIMATION_KEYS.allFormal
      }
    },
    {
      label: "one R-17 sheet missing",
      options: { missing: ["r17-rift-skimmer-action-sheet"] },
      expected: {
        enemyFamily: "legacy",
        enemyTexture: "r17-rift-skimmer",
        enemyAnimation: "r17-rift-skimmer-loop",
        bossFamily: "formal",
        bossTexture: "enemy-scp049-locomotion-sheet",
        bossAnimation: "enemy-scp049-down-idle",
        bossActionTexture: "enemy-scp049-action-sheet",
        animationKeys: EXPECTED_ANIMATION_KEYS.missingRift
      }
    },
    {
      label: "R-17 missing with SCP-049 locomotion only",
      options: { missing: [...r17FormalKeys, "enemy-scp049-action-sheet"] },
      expected: {
        enemyFamily: "legacy",
        enemyTexture: "r17-rift-skimmer",
        enemyAnimation: "r17-rift-skimmer-loop",
        bossFamily: "formal-locomotion",
        bossTexture: "enemy-scp049-locomotion-sheet",
        bossAnimation: "enemy-scp049-down-idle",
        bossActionTexture: "enemy-scp049",
        animationKeys: EXPECTED_ANIMATION_KEYS.locomotionOnly
      }
    },
    {
      label: "all formal and legacy sheets absent",
      options: { legacy: false, missing: Object.keys(FORMAL_FRAMES) },
      expected: {
        enemyFamily: "unchanged",
        enemyTexture: "enemy-crawler",
        enemyAnimation: undefined,
        bossFamily: "unchanged",
        bossTexture: "enemy-scp049",
        bossAnimation: undefined,
        bossActionTexture: undefined,
        animationKeys: EXPECTED_ANIMATION_KEYS.absent
      }
    },
  ];

  for (const { label, options, expected } of rows) {
    for (let restart = 0; restart < 2; restart += 1) {
      const scene = createScene(options);
      const controller = controllerFor(scene, Object.keys(FORMAL_FRAMES));
      const enemy = createActor({ textureKey: "enemy-crawler" });
      const boss = createActor({ textureKey: "enemy-scp049" });
      const enemyId = controller.trackActor(enemy, { enemyType: "crawler", isBoss: false });
      const bossId = controller.trackActor(boss, { enemyType: "scp049", isBoss: true });
      enemy._presentationId = enemyId;
      boss._presentationId = bossId;

      controller.sync(16, 16);
      assert.equal(enemy.visible, true, `${label}/${restart}: R-17 visible after update`);
      assert.equal(boss.visible, true, `${label}/${restart}: SCP-049 visible after update`);
      assert.equal(getEnemyPresentationMode(scene, "crawler").family, expected.enemyFamily, `${label}/${restart}: resolver selects the expected R-17 family`);
      const bossMode = getScp049PresentationMode(scene);
      assert.equal(bossMode.family, expected.bossFamily, `${label}/${restart}: resolver selects the expected SCP-049 family`);
      assert.equal(bossMode.actionTextureKey, expected.bossActionTexture, `${label}/${restart}: SCP-049 action fallback texture`);
      assert.equal(enemy.texture.key, expected.enemyTexture, `${label}/${restart}: R-17 fallback route`);
      assert.equal(enemy.currentAnimation, expected.enemyAnimation, `${label}/${restart}: R-17 animation route`);
      assert.equal(boss.texture.key, expected.bossTexture, `${label}/${restart}: SCP-049 fallback route`);
      assert.equal(boss.currentAnimation, expected.bossAnimation, `${label}/${restart}: SCP-049 animation route`);
      assert.deepEqual(scene.animationCreateKeys, expected.animationKeys, `${label}/${restart}: exact created animation identities`);
      assert.deepEqual(scene.animationCreateAttemptKeys, expected.animationKeys, `${label}/${restart}: exact create attempts`);
      assert.equal(scene.animationGenerateCount, expected.animationKeys.length, `${label}/${restart}: every created animation generated frames once`);
      assert.equal(scene.animationKeys.size, expected.animationKeys.length, `${label}/${restart}: no partial animation registration`);
      assert.deepEqual(scene.duplicateAnimationKeys, [], `${label}/${restart}: no duplicate animation key`);
      assert.deepEqual(scene.animationRemoveKeys, [], `${label}/${restart}: successful registration removes no key`);
      controller.setPaused(true);
      controller.setPaused(false);
      controller.notifyDeath(deathSnapshot(enemyId));
      controller.notifyDeath(deathSnapshot(bossId, { enemyType: "scp049", isBoss: true }));
      controller.destroy();

      assert.equal(enemy._presentationId, 0, `${label}/${restart}: enemy record released`);
      assert.equal(boss._presentationId, 0, `${label}/${restart}: Boss record released`);
      assert.ok(scene.sprites.every((sprite) => sprite.destroyed), `${label}/${restart}: copies released`);
      assert.ok(scene.timers.every((timer) => timer.removed), `${label}/${restart}: timers released`);
      assert.equal(enemy.listenerCount("animationcomplete"), 0, `${label}/${restart}: enemy listener released`);
      assert.equal(boss.listenerCount("animationcomplete"), 0, `${label}/${restart}: Boss listener released`);
      const registeredBeforeControllerRestart = scene.animationCreateKeys.length;
      const restartedController = controllerFor(scene, Object.keys(FORMAL_FRAMES));
      assert.equal(scene.animationCreateKeys.length, registeredBeforeControllerRestart, `${label}/${restart}: controller restart does not duplicate animations`);
      assert.deepEqual(scene.animationCreateKeys, expected.animationKeys, `${label}/${restart}: controller restart keeps exact registered identities`);
      assert.deepEqual(scene.animationCreateAttemptKeys, expected.animationKeys, `${label}/${restart}: controller restart has no duplicate create attempt`);
      assert.equal(scene.animationGenerateCount, expected.animationKeys.length, `${label}/${restart}: controller restart has no duplicate generation`);
      assert.equal(scene.animationKeys.size, expected.animationKeys.length, `${label}/${restart}: controller restart keeps exact registrations`);
      assert.deepEqual(scene.duplicateAnimationKeys, [], `${label}/${restart}: controller restart keeps unique animations`);
      assert.deepEqual(scene.animationRemoveKeys, [], `${label}/${restart}: controller restart removes no key`);
      restartedController.destroy();
    }
  }
});

// Break caught: one failed formal clip leaves its already-created sibling registered or prevents the affected actor's legacy fallback.
test("failed formal batch rolls back only its partial R-17 registration", () => {
  const scene = createScene({ failAnimationKey: "r17-rift-skimmer-action-hit" });
  const controller = controllerFor(scene, Object.keys(FORMAL_FRAMES));
  const actor = createActor({ textureKey: "enemy-crawler" });
  controller.trackActor(actor, { enemyType: "crawler", isBoss: false });

  assert.deepEqual(scene.animationRemoveKeys, ["r17-rift-skimmer-action-move"]);
  assert.equal(scene.animationCreateAttemptKeys.includes("r17-rift-skimmer-action-move"), true);
  assert.equal(scene.animationCreateAttemptKeys.includes("r17-rift-skimmer-action-hit"), true);
  assert.equal(scene.animationKeys.has("r17-rift-skimmer-action-move"), false);
  assert.equal(scene.animationKeys.has("r17-rift-skimmer-action-hit"), false);
  assert.equal(scene.animationKeys.has("r17-rift-skimmer-action-death"), false);
  assert.equal(scene.animationKeys.has("r17-rift-skimmer-action-pierce"), false);
  assert.deepEqual(scene.duplicateAnimationKeys, []);
  assert.equal(getEnemyPresentationMode(scene, "crawler").family, "legacy");
  assert.equal(actor.texture.key, "r17-rift-skimmer");
  assert.equal(actor.visible, true);
  controller.destroy();
});

// Break caught: sync creates arrays, snapshots, sprites, tweens or other per-frame objects.
test("sync source iterates the actor Map directly without per-frame collection or display allocation", async () => {
  const source = await readFile(new URL("../src/art/enemyPresentationController.js", import.meta.url), "utf8");
  const start = source.indexOf("function sync(");
  const end = source.indexOf("\n  function notifyAction", start);
  assert.ok(start >= 0 && end > start, "controller exposes a local sync implementation");
  const sync = source.slice(start, end);
  assert.match(sync, /for\s*\(const\s+record\s+of\s+records\.values\(\)\)/);
  assert.doesNotMatch(sync, /\[\.\.\.|Array\.from|\.map\(|\.filter\(|add\.(?:sprite|graphics|shader)|tweens\.|textures\.(?:add|generate)|filters\.|pipelines\.|shader|Object\.freeze|structuredClone/);
});
