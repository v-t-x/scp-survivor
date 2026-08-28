import test from "node:test";
import assert from "node:assert/strict";

import {
  SCP049_TERMINAL_TIMEOUT_MS,
  createEnemyPresentationController,
  resolveScp049Direction
} from "../src/art/enemyPresentationController.js";

const LOCOMOTION_KEYS = new Set(
  ["down", "left", "right", "up"].flatMap((direction) => [
    `enemy-scp049-${direction}-idle`,
    `enemy-scp049-${direction}-walk`
  ])
);
const ACTION_KEYS = new Set([
  "enemy-scp049-frenzy-enter",
  "enemy-scp049-frenzy-loop",
  "enemy-scp049-hit-overlay",
  "enemy-scp049-recontain"
]);

function createDisplay({ x = 240, y = 180, textureKey = "enemy-scp049", scale = 1.2 } = {}) {
  const listeners = new Map();
  const display = {
    active: true,
    visible: true,
    destroyed: false,
    x,
    y,
    width: 64,
    height: 80,
    displayOriginX: 32,
    displayOriginY: 40,
    scaleX: scale,
    scaleY: scale,
    alpha: 1,
    depth: 12,
    flipX: false,
    tint: null,
    tintFill: null,
    clearTintCalls: 0,
    texture: { key: textureKey },
    frame: { name: 0 },
    played: [],
    pauseCount: 0,
    resumeCount: 0,
    setTexture(key, frame = 0) { this.texture.key = key; this.frame.name = frame; return this; },
    setFrame(frame) { this.frame.name = frame; return this; },
    setScale(value) { this.scaleX = value; this.scaleY = value; return this; },
    setFlipX(value) { this.flipX = value; return this; },
    setAlpha(value) { this.alpha = value; return this; },
    setDepth(value) { this.depth = value; return this; },
    setTint(value) { this.tint = value; this.tintFill = null; return this; },
    setTintFill(value) { this.tintFill = value; this.tint = null; return this; },
    clearTint() { this.tint = null; this.tintFill = null; this.clearTintCalls += 1; return this; },
    setVisible(value) { this.visible = value; return this; },
    setActive(value) { this.active = value; return this; },
    setPosition(nextX, nextY) { this.x = nextX; this.y = nextY; return this; },
    setOrigin() { return this; },
    play(key) { this.currentAnimation = key; this.played.push(key); return this; },
    once(event, fn) { listeners.set(event, fn); return this; },
    off(event, fn) { if (listeners.get(event) === fn) listeners.delete(event); return this; },
    emit(event) { const fn = listeners.get(event); if (fn) { listeners.delete(event); fn(); } },
    listenerCount(event) { return listeners.has(event) ? 1 : 0; },
    destroy() {
      if (this.destroyed) return;
      this.destroyed = true;
      this.active = false;
      this.visible = false;
      this.emit("destroy");
    }
  };
  display.anims = {
    pause() { display.pauseCount += 1; },
    resume() { display.resumeCount += 1; }
  };
  display.body = {
    sourceWidth: 36,
    sourceHeight: 36,
    width: 36,
    height: 36,
    radius: 18,
    isCircle: true,
    position: { x: x - 18, y: y - 18 },
    offset: {
      x: 14,
      y: 22,
      set(nextX, nextY) { this.x = nextX; this.y = nextY; }
    },
    velocity: { x: 0, y: 0 },
    updateFromGameObject() {
      this.width = this.sourceWidth * Math.abs(display.scaleX);
      this.height = this.sourceHeight * Math.abs(display.scaleY);
      this.position.x = display.x + display.scaleX * (this.offset.x - display.displayOriginX);
      this.position.y = display.y + display.scaleY * (this.offset.y - display.displayOriginY);
    }
  };
  display.body.updateFromGameObject();
  return display;
}

function createScene({ locomotion = true, action = true } = {}) {
  const sprites = [];
  const timers = [];
  const scene = {
    sprites,
    timers,
    enemies: new Set(),
    transientEffects: new Set(),
    legacyCalls: [],
    textures: {
      exists(key) {
        if (key === "enemy-scp049") return true;
        if (key === "enemy-scp049-locomotion-sheet") return locomotion;
        if (key === "enemy-scp049-action-sheet") return action;
        return false;
      },
      get(key) {
        if (key === "enemy-scp049-locomotion-sheet") return { frameTotal: 41 };
        if (key === "enemy-scp049-action-sheet") return { frameTotal: 20 };
        return { frameTotal: 1 };
      }
    },
    anims: {
      exists(key) {
        return (locomotion && LOCOMOTION_KEYS.has(key)) || (action && ACTION_KEYS.has(key));
      }
    },
    add: {
      sprite(x, y, key) {
        const sprite = createDisplay({ x, y, textureKey: key, scale: 1 });
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
          removeCalls: 0,
          remove() { this.removeCalls += 1; this.removed = true; },
          fire() { if (!this.removed) { this.removed = true; callback(); } }
        };
        timers.push(timer);
        return timer;
      }
    },
    playLegacyEnemyDeathVisual(actor, options) { this.legacyCalls.push({ actor, options }); }
  };
  return scene;
}

function createController(scene, ids = [
  "enemy-scp049-locomotion-sheet",
  "enemy-scp049-action-sheet"
]) {
  return createEnemyPresentationController(scene, {
    allowedDevelopmentAssetIds: new Set(ids),
    forceLegacy: false
  });
}

function bodySnapshot(actor) {
  return {
    x: actor.x,
    y: actor.y,
    bodyX: actor.body.position.x,
    bodyY: actor.body.position.y,
    sourceWidth: actor.body.sourceWidth,
    sourceHeight: actor.body.sourceHeight,
    width: actor.body.width,
    height: actor.body.height,
    radius: actor.body.radius,
    isCircle: actor.body.isCircle,
    offsetX: actor.body.offset.x,
    offsetY: actor.body.offset.y
  };
}

function deathSnapshot(presentationId) {
  return Object.freeze({
    presentationId,
    enemyType: "scp049",
    eliteType: null,
    isBoss: true,
    canSplit: false,
    x: 240,
    y: 180,
    frame: 5,
    flipX: false,
    alpha: 1,
    depth: 12,
    scaleX: 1,
    scaleY: 1
  });
}

// Break caught: facing flickers around diagonals or resets while stationary.
test("SCP-049 direction retains rest facing and applies 15 percent diagonal hysteresis", () => {
  assert.equal(resolveScp049Direction(0, 0, "left"), "left");
  assert.equal(resolveScp049Direction(20, 10, "down"), "right");
  assert.equal(resolveScp049Direction(-20, 10, "down"), "left");
  assert.equal(resolveScp049Direction(10, -20, "right"), "up");
  assert.equal(resolveScp049Direction(10, 20, "right"), "down");
  assert.equal(resolveScp049Direction(100, 108, "right"), "right");
  assert.equal(resolveScp049Direction(100, 108, "down"), "down");
});

// Break caught: formal locomotion changes collision geometry, position, or retains legacy scale.
test("formal locomotion uses scale 1 without changing the radius, body or world position", () => {
  const scene = createScene();
  const actor = createDisplay();
  const before = bodySnapshot(actor);
  const controller = createController(scene);
  controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
  assert.equal(actor.texture.key, "enemy-scp049-locomotion-sheet");
  assert.equal(actor.scaleX, 1);
  assert.equal(actor.scaleY, 1);
  const after = bodySnapshot(actor);
  assert.deepEqual(
    {
      x: after.x,
      y: after.y,
      bodyX: after.bodyX,
      bodyY: after.bodyY,
      width: after.width,
      height: after.height,
      radius: after.radius,
      isCircle: after.isCircle
    },
    {
      x: before.x,
      y: before.y,
      bodyX: before.bodyX,
      bodyY: before.bodyY,
      width: before.width,
      height: before.height,
      radius: before.radius,
      isCircle: before.isCircle
    }
  );
  assert.equal(after.sourceWidth, before.width);
  assert.equal(after.sourceHeight, before.height);
  assert.ok(Number.isFinite(after.offsetX) && Number.isFinite(after.offsetY));
});

// Break caught: incomplete locomotion replaces the approved static fallback or changes its scale/body.
test("missing formal locomotion leaves the static fallback at scale 1.2 with identical body", () => {
  const scene = createScene({ locomotion: false, action: false });
  const actor = createDisplay();
  const before = bodySnapshot(actor);
  const controller = createController(scene);
  controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
  assert.equal(actor.texture.key, "enemy-scp049");
  assert.equal(actor.scaleX, 1.2);
  assert.equal(actor.scaleY, 1.2);
  const after = bodySnapshot(actor);
  for (const field of Object.keys(before)) {
    assert.ok(Math.abs(after[field] - before[field]) < 1e-9 || after[field] === before[field], field);
  }
});

// Break caught: diagonal movement changes direction every frame and rest loses the prior direction.
test("live locomotion derives direction from velocity and keeps the last direction at rest", () => {
  const scene = createScene();
  const actor = createDisplay();
  const controller = createController(scene);
  controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
  actor.body.velocity.x = -30;
  actor.body.velocity.y = 1;
  controller.sync(100, 16);
  assert.equal(actor.currentAnimation, "enemy-scp049-left-walk");
  actor.body.velocity.x = 0;
  actor.body.velocity.y = 0;
  controller.sync(116, 16);
  assert.equal(actor.currentAnimation, "enemy-scp049-left-idle");
});

// Break caught: hit swaps the main actor to the action texture or creates a new overlay per hit.
test("SCP-049 hit reuses one display-only overlay and never swaps the locomotion sprite", () => {
  const scene = createScene();
  const actor = createDisplay();
  const controller = createController(scene);
  const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
  const locomotionTexture = actor.texture.key;
  controller.notifyHit(Object.freeze({ presentationId, lethal: false, atMs: 100 }));
  controller.sync(100, 16);
  assert.equal(scene.sprites.length, 1);
  assert.equal(scene.sprites[0].texture.key, "enemy-scp049-action-sheet");
  assert.equal(scene.sprites[0].currentAnimation, "enemy-scp049-hit-overlay");
  controller.notifyHit(Object.freeze({ presentationId, lethal: false, atMs: 200 }));
  controller.sync(200, 16);
  assert.equal(scene.sprites.length, 1);
  assert.equal(actor.texture.key, locomotionTexture);
});

// Break caught: the formal frenzy clip plays under the legacy whole-body red tint.
test("a successfully playing formal frenzy action suppresses the red fallback on every sync", () => {
  const scene = createScene();
  const actor = createDisplay();
  const controller = createController(scene);
  const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });

  actor.bossState = "frenzy";
  actor.setTint(0xff5a6e);
  controller.notifyAction(Object.freeze({ presentationId, action: "frenzy-enter", atMs: 100 }));
  controller.sync(100, 16);

  assert.equal(actor.currentAnimation, "enemy-scp049-frenzy-enter");
  assert.equal(actor.tint, null);
  const clearsAfterStart = actor.clearTintCalls;

  actor.setTint(0xff5a6e);
  controller.sync(116, 16);
  assert.equal(actor.tint, null);
  assert.equal(actor.clearTintCalls, clearsAfterStart + 1);
});

// Break caught: a missing or throwing formal action clears the only visible frenzy fallback.
test("formal frenzy suppresses red tint only after actor.play succeeds", () => {
  for (const failure of ["missing-animation", "missing-play", "throwing-play"]) {
    const scene = createScene();
    const actor = createDisplay();
    const controller = createController(scene);
    const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
    actor.bossState = "frenzy";
    actor.setTint(0xff5a6e);

    if (failure === "missing-animation") {
      const exists = scene.anims.exists;
      scene.anims.exists = (key) => key === "enemy-scp049-frenzy-enter" ? false : exists(key);
    } else if (failure === "missing-play") {
      actor.play = undefined;
    } else {
      actor.play = () => { throw new Error("formal action failed"); };
    }

    controller.notifyAction(Object.freeze({ presentationId, action: "frenzy-enter", atMs: 100 }));
    assert.doesNotThrow(() => controller.sync(100, 16), failure);
    assert.equal(actor.tint, 0xff5a6e, failure);
    assert.equal(actor.clearTintCalls, 0, failure);
  }
});

// Break caught: a successful enter leaves stale formal state that clears red after the loop clip fails.
test("a failed frenzy-loop transition restores locomotion and preserves the red fallback", () => {
  for (const failure of ["missing-animation", "missing-play", "throwing-play"]) {
    const scene = createScene();
    const actor = createDisplay();
    const controller = createController(scene);
    const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
    const play = actor.play;

    controller.notifyAction(Object.freeze({ presentationId, action: "frenzy-enter", atMs: 100 }));
    if (failure === "missing-animation") {
      const exists = scene.anims.exists;
      scene.anims.exists = (key) => key === "enemy-scp049-frenzy-loop" ? false : exists(key);
    } else if (failure === "missing-play") {
      actor.play = undefined;
    } else {
      actor.play = function playExceptLoop(key, ignoreIfPlaying) {
        if (key === "enemy-scp049-frenzy-loop") throw new Error("loop failed");
        return play.call(this, key, ignoreIfPlaying);
      };
    }
    actor.bossState = "frenzy";
    actor.setTint(0xff5a6e);

    assert.doesNotThrow(() => controller.sync(601, 16), failure);
    assert.equal(actor.texture.key, "enemy-scp049-locomotion-sheet", failure);
    assert.equal(actor.tint, 0xff5a6e, failure);
  }
});

// Break caught: the formal hit overlay is visible but the legacy full-body white flash remains on top.
test("a successfully playing formal hit overlay suppresses the white fallback on every sync", () => {
  const scene = createScene();
  const actor = createDisplay();
  const controller = createController(scene);
  const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });

  actor.setTintFill(0xffffff);
  controller.notifyHit(Object.freeze({ presentationId, lethal: false, atMs: 100 }));
  assert.equal(scene.sprites[0].currentAnimation, "enemy-scp049-hit-overlay");
  assert.equal(actor.tintFill, null);
  const clearsAfterStart = actor.clearTintCalls;

  actor.setTintFill(0xffffff);
  controller.sync(116, 16);
  assert.equal(actor.tintFill, null);
  assert.equal(actor.clearTintCalls, clearsAfterStart + 1);
});

// Break caught: overlay construction or playback failure erases the legacy white hit flash.
test("SCP-049 hit suppresses white tint only after overlay.play succeeds", () => {
  for (const failure of ["formal-locomotion", "missing-play", "throwing-play"]) {
    const scene = createScene({ locomotion: true, action: failure !== "formal-locomotion" });
    const actor = createDisplay();
    if (failure !== "formal-locomotion") {
      const addSprite = scene.add.sprite;
      scene.add.sprite = (...args) => {
        const overlay = addSprite(...args);
        overlay.play = failure === "missing-play"
          ? undefined
          : () => { throw new Error("overlay play failed"); };
        return overlay;
      };
    }
    const controller = createController(scene);
    const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
    actor.setTintFill(0xffffff);

    assert.doesNotThrow(
      () => controller.notifyHit(Object.freeze({ presentationId, lethal: false, atMs: 100 })),
      failure
    );
    assert.equal(actor.tintFill, 0xffffff, failure);
    assert.equal(actor.clearTintCalls, 0, failure);
  }
});

// Break caught: frenzy suppression erases the white fallback after a failed overlay attempt.
test("a failed hit overlay temporarily outranks formal frenzy tint suppression", () => {
  const scene = createScene();
  const actor = createDisplay();
  const controller = createController(scene);
  const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
  actor.bossState = "frenzy";
  controller.notifyAction(Object.freeze({ presentationId, action: "frenzy-enter", atMs: 100 }));
  controller.sync(100, 16);

  const addSprite = scene.add.sprite;
  scene.add.sprite = (...args) => {
    const overlay = addSprite(...args);
    overlay.play = () => { throw new Error("overlay play failed"); };
    return overlay;
  };
  actor.setTintFill(0xffffff);
  controller.notifyHit(Object.freeze({ presentationId, lethal: false, atMs: 200 }));
  actor.setTint(0xff5a6e);
  controller.sync(216, 16);
  assert.equal(actor.tintFill, 0xffffff, "the existing 80ms white fallback outranks the next-frame frenzy tint");

  actor.clearTint();
  actor.setTint(0xff5a6e);
  controller.sync(281, 16);
  assert.equal(actor.tint, null, "formal frenzy resumes suppression after the fallback window");
});

// Break caught: terminal recontainment is registered as an enemy/transient or paused by victory freeze.
test("terminal copy stays outside gameplay collections, ignores pause, and cleans once on animationcomplete", () => {
  const scene = createScene();
  const actor = createDisplay();
  const controller = createController(scene);
  const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
  assert.equal(controller.notifyDeath(deathSnapshot(presentationId)), undefined);
  const terminal = scene.sprites[0];
  assert.equal(terminal.currentAnimation, "enemy-scp049-recontain");
  assert.equal(scene.enemies.has(terminal), false);
  assert.equal(scene.transientEffects.has(terminal), false);
  assert.ok(scene.timers.some((timer) => timer.delay === SCP049_TERMINAL_TIMEOUT_MS));
  controller.setPaused(true);
  assert.equal(terminal.pauseCount, 0);
  terminal.emit("animationcomplete");
  assert.equal(terminal.destroyed, true);
  assert.ok(scene.timers.find((timer) => timer.delay === SCP049_TERMINAL_TIMEOUT_MS).removed);
  assert.doesNotThrow(() => terminal.emit("animationcomplete"));
  assert.doesNotThrow(() => controller.destroy());
});

// Break caught: an early terminal animation completion cancels the independent live-actor destroy.
test("terminal completion releases its copy while the 90ms live-actor timer still destroys exactly once", () => {
  const scene = createScene();
  const actor = createDisplay();
  let actorDestroyCalls = 0;
  const destroyActor = actor.destroy.bind(actor);
  actor.destroy = () => { actorDestroyCalls += 1; destroyActor(); };
  const controller = createController(scene);
  const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
  controller.notifyDeath(deathSnapshot(presentationId));
  const terminal = scene.sprites[0];
  const actorTimer = scene.timers.find((timer) => timer.delay === 90);
  const timeoutTimer = scene.timers.find((timer) => timer.delay === SCP049_TERMINAL_TIMEOUT_MS);

  terminal.emit("animationcomplete");
  assert.equal(terminal.destroyed, true);
  assert.equal(timeoutTimer.removed, true);
  assert.equal(actorTimer.removed, false, "display cleanup must not cancel live actor cleanup");
  assert.equal(actorDestroyCalls, 0);

  actorTimer.fire();
  actorTimer.fire();
  assert.equal(actorDestroyCalls, 1);
  assert.equal(actor.active, false);
});

// Break caught: decoupling the live actor timer leaves it unowned across Scene shutdown/restart.
test("controller destroy removes a live-actor timer left after terminal display completion", () => {
  const scene = createScene();
  const actor = createDisplay();
  const controller = createController(scene);
  const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
  controller.notifyDeath(deathSnapshot(presentationId));
  const terminal = scene.sprites[0];
  const actorTimer = scene.timers.find((timer) => timer.delay === 90);

  terminal.emit("animationcomplete");
  assert.equal(actorTimer.removeCalls, 0);
  controller.destroy();
  assert.equal(actorTimer.removeCalls, 1);
  assert.equal(actorTimer.removed, true);
});

// Break caught: terminal timeout setup failure strands its Set entry, listener, actor timer, or copy.
test("terminal timer setup failure rolls back copy listener and live-actor timer before legacy fallback", () => {
  const scene = createScene();
  const actor = createDisplay();
  const addSprite = scene.add.sprite;
  let copyDestroyCalls = 0;
  scene.add.sprite = (...args) => {
    const copy = addSprite(...args);
    const destroyCopy = copy.destroy.bind(copy);
    copy.destroy = () => { copyDestroyCalls += 1; destroyCopy(); };
    return copy;
  };
  const delayedCall = scene.time.delayedCall;
  let timerCalls = 0;
  scene.time.delayedCall = (delay, callback) => {
    timerCalls += 1;
    if (timerCalls === 2) throw new Error("terminal timeout timer failed");
    return delayedCall(delay, callback);
  };
  const controller = createController(scene);
  const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });

  assert.doesNotThrow(() => controller.notifyDeath(deathSnapshot(presentationId)));
  const copy = scene.sprites[0];
  const actorTimer = scene.timers[0];
  assert.equal(copyDestroyCalls, 1);
  assert.equal(copy.listenerCount("animationcomplete"), 0);
  assert.equal(actorTimer.removeCalls, 1);
  assert.equal(actorTimer.removed, true);
  assert.equal(actor.visible, true);
  assert.equal(actor.active, true);
  assert.equal(scene.legacyCalls.length, 1);

  controller.destroy();
  assert.equal(copyDestroyCalls, 1, "rolled-back copy is no longer controller-owned");
  assert.equal(actorTimer.removeCalls, 1, "rolled-back actor timer is no longer controller-owned");
  actorTimer.fire();
  assert.equal(actor.active, true);
});

// Break caught: timeout, shutdown and explicit destroy can each double-destroy a terminal copy.
test("terminal copy hard timeout and explicit destroy are idempotent", () => {
  for (const cleanup of ["timeout", "destroy"]) {
    const scene = createScene();
    const actor = createDisplay();
    const controller = createController(scene);
    const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
    controller.notifyDeath(deathSnapshot(presentationId));
    const terminal = scene.sprites[0];
    let destroyCalls = 0;
    const destroy = terminal.destroy.bind(terminal);
    terminal.destroy = () => { destroyCalls += 1; destroy(); };
    if (cleanup === "timeout") {
      scene.timers.find((timer) => timer.delay === SCP049_TERMINAL_TIMEOUT_MS).fire();
      controller.destroy();
    } else {
      controller.destroy();
      controller.destroy();
    }
    assert.equal(destroyCalls, 1);
  }
});

// Break caught: incomplete action sheet attempts formal recontainment rather than legacy fallback.
test("formal locomotion without a complete action sheet uses legacy terminal fallback", () => {
  const scene = createScene({ locomotion: true, action: false });
  const actor = createDisplay();
  const controller = createController(scene);
  const presentationId = controller.trackActor(actor, { enemyType: "scp049", isBoss: true });
  controller.notifyDeath(deathSnapshot(presentationId));
  assert.equal(scene.legacyCalls.length, 1);
  assert.equal(scene.legacyCalls[0].actor, actor);
  assert.equal(scene.sprites.length, 0);
  assert.equal(actor.visible, true);
});
