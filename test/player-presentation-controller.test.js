import test from "node:test";
import assert from "node:assert/strict";

import { createPlayerPresentationController } from "../src/art/playerPresentationController.js";
import { createPlayerPresentationSnapshot } from "../src/art/playerPresentationModel.js";
import { TEXTURES } from "../src/assets/manifest.js";

const LEGACY_SHEET = TEXTURES.playerOpeningSheet;
const STATIC_TEXTURE = TEXTURES.player;
const BODY_SHEET = "player-response-operative-body-prototype-sheet";
const FORMAL_BODY_SHEET = TEXTURES.playerResponseOperativeBodySheet;

function formalEquipmentTextureEntries(weaponId) {
  return weaponId === "tesla"
    ? [
        [TEXTURES.playerTeslaPowerModule, 2],
        [TEXTURES.playerTeslaEmitterAimBack, 81],
        [TEXTURES.playerTeslaEmitterAimFront, 81],
        [TEXTURES.playerTeslaEmitterAimRecoilBack, 81],
        [TEXTURES.playerTeslaEmitterAimRecoilFront, 81]
      ]
    : [
        [TEXTURES.playerFoundationRifleAimBack, 81],
        [TEXTURES.playerFoundationRifleAimFront, 81],
        [TEXTURES.playerFoundationRifleAimRecoilBack, 81],
        [TEXTURES.playerFoundationRifleAimRecoilFront, 81]
      ];
}

function createFormalFrameTotals(weaponId = "pistol", omittedKey = null) {
  const entries = [
    [LEGACY_SHEET, 49],
    [FORMAL_BODY_SHEET, 6],
    ...formalEquipmentTextureEntries(weaponId)
  ];
  return Object.fromEntries(
    entries.filter(([key]) => key !== omittedKey)
  );
}

function createFormalSnapshot(overrides = {}) {
  return Object.freeze({
    active: true,
    x: 100,
    y: 200,
    velocityX: 0,
    velocityY: 0,
    facingAngle: 0,
    elapsedMs: 0,
    dashActive: false,
    selectedWeaponId: "pistol",
    ...overrides
  });
}

function createGraphicsDouble({ throwOn = null, includeTint = true } = {}) {
  const calls = [];
  const graphic = {
    active: true,
    visible: true,
    alpha: 1,
    body: undefined,
    calls,
    clear() {
      calls.push(["clear"]);
      if (throwOn === "clear") throw new Error("graphics clear failed");
      return this;
    },
    lineStyle(...args) {
      calls.push(["lineStyle", ...args]);
      if (throwOn === "lineStyle") throw new Error("graphics lineStyle failed");
      return this;
    },
    lineBetween(...args) {
      calls.push(["lineBetween", ...args]);
      if (throwOn === "lineBetween") throw new Error("graphics lineBetween failed");
      return this;
    },
    fillStyle(...args) {
      calls.push(["fillStyle", ...args]);
      if (throwOn === "fillStyle") throw new Error("graphics fillStyle failed");
      return this;
    },
    fillRect(...args) {
      calls.push(["fillRect", ...args]);
      if (throwOn === "fillRect") throw new Error("graphics fillRect failed");
      return this;
    },
    setDepth(value) {
      calls.push(["setDepth", value]);
      if (throwOn === "setDepth") throw new Error("graphics setDepth failed");
      this.depth = value;
      return this;
    },
    setVisible(value) {
      calls.push(["setVisible", value]);
      if (throwOn === "setVisible") throw new Error("graphics setVisible failed");
      this.visible = value;
      return this;
    },
    setAlpha(value) {
      calls.push(["setAlpha", value]);
      if (throwOn === "setAlpha") throw new Error("graphics setAlpha failed");
      this.alpha = value;
      return this;
    },
    setTint(value) {
      calls.push(["setTint", value]);
      if (throwOn === "setTint") throw new Error("graphics setTint failed");
      this.tint = value;
      return this;
    },
    clearTint() {
      calls.push(["clearTint"]);
      if (throwOn === "clearTint") throw new Error("graphics clearTint failed");
      this.tint = null;
      return this;
    },
    destroy() {
      calls.push(["destroy"]);
      this.active = false;
    }
  };
  if (!includeTint) {
    delete graphic.setTint;
    delete graphic.clearTint;
  }
  return graphic;
}

function createAnchor() {
  const visibility = [];
  return {
    active: true,
    isDying: false,
    isTinted: false,
    x: 100,
    y: 200,
    visible: true,
    characterId: "foundation-response-operative",
    presentationAnimationFamily: "legacy",
    presentationFacing: "down",
    texture: { key: LEGACY_SHEET },
    body: {
      width: 24,
      height: 24,
      velocity: { x: 80, y: 0 }
    },
    setVisible(value) {
      visibility.push(value);
      this.visible = value;
      return this;
    },
    setTint(value) {
      this.tint = value;
      this.isTinted = true;
      return this;
    },
    clearTint() {
      this.tint = null;
      this.isTinted = false;
      return this;
    },
    setAlpha(value) {
      this.alpha = value;
      return this;
    },
    setFlipX(value) {
      this.flipX = value;
      return this;
    },
    setFrame(value) {
      this.frame = { name: value };
      return this;
    },
    play(key) {
      this.played = [...(this.played ?? []), key];
      return this;
    },
    visibility
  };
}

function createSpriteDouble({
  textureKey,
  throwOnPlay = false,
  throwOnSetAlpha = false,
  throwOnSetOrigin = false,
  throwOnSetPositionCall = -1,
  throwOnSetFrameCall = -1,
  throwOnSetTint = false,
  throwOnSetTexture = false
} = {}) {
  const calls = {
    clearTint: 0,
    destroy: 0,
    pause: 0,
    resume: 0,
    play: [],
    setAlpha: [],
    setPosition: 0,
    setFrame: 0,
    setTint: [],
    setTexture: []
  };
  const sprite = {
    active: true,
    visible: true,
    x: 0,
    y: 0,
    rotation: 0,
    texture: { key: textureKey },
    scaleX: 1,
    scaleY: 1,
    anims: {
      currentAnim: null,
      paused: false,
      pause() {
        calls.pause += 1;
        this.paused = true;
      },
      resume() {
        calls.resume += 1;
        this.paused = false;
      }
    },
    setOrigin(x, y) {
      if (throwOnSetOrigin) {
        throw new Error("origin failed");
      }
      this.originX = x;
      this.originY = y;
      return this;
    },
    setPosition(x, y) {
      calls.setPosition += 1;
      if (calls.setPosition === throwOnSetPositionCall) {
        throw new Error("position failed");
      }
      this.x = x;
      this.y = y;
      return this;
    },
    setRotation(value) {
      this.rotation = value;
      return this;
    },
    setDepth(value) {
      this.depth = value;
      return this;
    },
    setVisible(value) {
      this.visible = value;
      return this;
    },
    setTint(value) {
      if (throwOnSetTint) {
        throw new Error("tint failed");
      }
      calls.setTint.push(value);
      this.tint = value;
      this.isTinted = true;
      return this;
    },
    clearTint() {
      calls.clearTint += 1;
      this.tint = null;
      this.isTinted = false;
      return this;
    },
    setAlpha(value) {
      if (throwOnSetAlpha) {
        throw new Error("alpha failed");
      }
      calls.setAlpha.push(value);
      this.alpha = value;
      return this;
    },
    setScale(value) {
      this.scaleX = value;
      this.scaleY = value;
      return this;
    },
    setTexture(value) {
      if (throwOnSetTexture) {
        throw new Error("texture failed");
      }
      calls.setTexture.push(value);
      this.texture.key = value;
      return this;
    },
    setFlipX(value) {
      this.flipX = value;
      return this;
    },
    setFrame(value) {
      calls.setFrame += 1;
      if (calls.setFrame === throwOnSetFrameCall) {
        throw new Error("frame failed");
      }
      this.frame = { name: value };
      return this;
    },
    play(key) {
      calls.play.push(key);
      if (throwOnPlay) {
        throw new Error("play failed");
      }
      this.anims.currentAnim = { key };
      this.anims.paused = false;
      return this;
    },
    destroy() {
      calls.destroy += 1;
      this.active = false;
    },
    calls
  };
  return sprite;
}

function createScene({
  frameTotals = { [LEGACY_SHEET]: 49 },
  spriteFactory = ({ textureKey }) => createSpriteDouble({ textureKey }),
  anchor = createAnchor(),
  throwOnTweenAdd = false,
  throwOnTweenRemove = false,
  throwOnTweenStop = false,
  leaveTweenActiveOnRemove = false
  , graphicsFactory = () => createGraphicsDouble()
} = {}) {
  const created = [];
  const graphicsCreated = [];
  const delayedCalls = [];
  const visibleAtAllocation = [];
  const globalPauseCalls = [];
  const tweenCalls = [];
  return {
    player: anchor,
    playerFacingAngle: 0,
    selectedWeaponId: null,
    elapsedSurvivalMs: 0,
    dashUntilMs: 0,
    created,
    delayedCalls,
    visibleAtAllocation,
    globalPauseCalls,
    tweenCalls,
    graphicsCreated,
    textures: {
      exists: (key) => Object.hasOwn(frameTotals, key),
      get: (key) => ({ frameTotal: frameTotals[key] })
    },
    anims: {
      exists: () => true,
      pauseAll() {
        globalPauseCalls.push("anims");
      }
    },
    time: {
      delayedCall(delay, callback) {
        const timer = {
          delay,
          callback,
          paused: false,
          removed: false,
          remove() {
            this.removed = true;
          }
        };
        delayedCalls.push(timer);
        return timer;
      }
    },
    tweens: {
      add(config) {
        if (throwOnTweenAdd) {
          throw new Error("tween failed");
        }
        const tween = {
          ...config,
          active: true,
          managerOwned: true,
          paused: false,
          pendingRemove: false,
          removed: false,
          destroyed: false,
          stopped: false,
          calls: { complete: 0, pause: 0, resume: 0, remove: 0, stop: 0 },
          isActive() {
            return this.active;
          },
          isPendingRemove() {
            return this.pendingRemove;
          },
          isRemoved() {
            return this.removed;
          },
          isDestroyed() {
            return this.destroyed;
          },
          pause() {
            this.calls.pause += 1;
            this.paused = true;
          },
          resume() {
            this.calls.resume += 1;
            this.paused = false;
          },
          advanceToPeak() {
            if (!this.active || this.paused || this.removed || this.stopped) return;
            const targets = Array.isArray(this.targets) ? this.targets : [this.targets];
            for (const target of targets) {
              for (const [property, values] of Object.entries(this.props ?? {})) {
                target[property] = values.to;
              }
            }
          },
          complete() {
            this.calls.complete += 1;
            if (!this.active) return;
            this.active = false;
            this.pendingRemove = true;
            this.onComplete?.();
          },
          stop() {
            this.calls.stop += 1;
            if (!this.active) return;
            this.onStop?.();
            if (throwOnTweenStop) {
              throw new Error("tween stop failed");
            }
            this.active = false;
            this.pendingRemove = true;
            this.stopped = true;
          },
          remove() {
            this.calls.remove += 1;
            if (throwOnTweenRemove) {
              throw new Error("tween remove failed");
            }
            if (leaveTweenActiveOnRemove) {
              return;
            }
            this.active = false;
            this.managerOwned = false;
            this.removed = true;
          },
          simulateManagerFrameRemoval() {
            if (!this.pendingRemove) return;
            this.pendingRemove = false;
            this.managerOwned = false;
            this.destroyed = true;
          }
        };
        tweenCalls.push(tween);
        return tween;
      },
      pauseAll() {
        globalPauseCalls.push("tweens");
      }
    },
    add: {
      sprite(x, y, textureKey) {
        visibleAtAllocation.push(anchor.visible);
        const sprite = spriteFactory({ x, y, textureKey });
        if (sprite) {
          sprite.x = x;
          sprite.y = y;
          sprite.texture ??= { key: textureKey };
          created.push(sprite);
        }
        return sprite;
      },
      graphics() {
        const graphic = graphicsFactory();
        if (graphic) graphicsCreated.push(graphic);
        return graphic;
      }
    }
  };
}

function assertSnapshotHasNoRuntimeReferences(value, forbidden) {
  const visit = (current) => {
    assert.notEqual(typeof current, "function", "snapshot must not expose functions");
    if (!current || typeof current !== "object") return;
    assert.equal(forbidden.has(current), false, "snapshot must not expose runtime objects");
    for (const child of Object.values(current)) visit(child);
  };
  visit(value);
}

function snapshotGameplayState(scene, anchor) {
  return {
    scene: {
      health: scene.health,
      elapsedSurvivalMs: scene.elapsedSurvivalMs,
      playerFacingAngle: scene.playerFacingAngle,
      dashUntilMs: scene.dashUntilMs
    },
    anchor: {
      x: anchor.x,
      y: anchor.y,
      body: anchor.body,
      bodyValues: {
        width: anchor.body.width,
        height: anchor.body.height,
        velocityX: anchor.body.velocity.x,
        velocityY: anchor.body.velocity.y
      }
    }
  };
}

function assertGameplayStateUnchanged(before, scene, anchor, context) {
  assert.deepEqual(
    {
      health: scene.health,
      elapsedSurvivalMs: scene.elapsedSurvivalMs,
      playerFacingAngle: scene.playerFacingAngle,
      dashUntilMs: scene.dashUntilMs
    },
    before.scene,
    `${context}: scene gameplay fields`
  );
  assert.equal(anchor.body, before.anchor.body, `${context}: body identity`);
  assert.deepEqual(
    {
      x: anchor.x,
      y: anchor.y,
      bodyValues: {
        width: anchor.body.width,
        height: anchor.body.height,
        velocityX: anchor.body.velocity.x,
        velocityY: anchor.body.velocity.y
      }
    },
    {
      x: before.anchor.x,
      y: before.anchor.y,
      bodyValues: before.anchor.bodyValues
    },
    `${context}: anchor transform and body values`
  );
}

function createActiveFormalFixture(weaponId = "pistol") {
  const anchor = createAnchor();
  const scene = createScene({
    anchor,
    frameTotals: createFormalFrameTotals(weaponId),
    graphicsFactory: () => createGraphicsDouble({ includeTint: false })
  });
  const controller = createPlayerPresentationController(scene, { anchor });
  controller.update(createFormalSnapshot({ selectedWeaponId: weaponId }), 0);
  assert.equal(controller.snapshot().formalWeaponId, weaponId, "formal fixture activates");
  return {
    anchor,
    scene,
    controller,
    legacy: scene.created[0],
    formalBody: scene.created.find(({ texture }) => texture.key === FORMAL_BODY_SHEET),
    formalObjects: [...scene.created.slice(1), ...scene.graphicsCreated]
  };
}

test("keeps the gameplay anchor visible through allocation and hides only its display after success", () => {
  const anchor = createAnchor();
  const bodyBefore = anchor.body;
  const scene = createScene({ anchor });

  const controller = createPlayerPresentationController(scene, { anchor });

  assert.deepEqual(scene.visibleAtAllocation, [true]);
  assert.equal(scene.created[0].texture.key, LEGACY_SHEET);
  assert.equal(scene.created[0].originY, 44 / 48);
  assert.equal(anchor.visible, false);
  assert.equal(anchor.active, true);
  assert.equal(anchor.body, bodyBefore);
  assert.equal(anchor.body.width, 24);
  assert.equal(anchor.body.height, 24);
  assert.equal(scene.created[0].body, undefined, "visible sprite stays non-physical");
  assert.equal(controller.snapshot().mode, "legacy");
});

test("update moves and rotates only the visible sprite while preserving anchor coordinates and body", () => {
  const anchor = createAnchor();
  const scene = createScene({ anchor });
  const controller = createPlayerPresentationController(scene, { anchor });
  const before = structuredClone({
    x: anchor.x,
    y: anchor.y,
    body: anchor.body
  });

  scene.elapsedSurvivalMs = 100;
  assert.equal(
    controller.update(createPlayerPresentationSnapshot(scene), 16),
    true
  );

  const visual = scene.created[0];
  assert.equal(visual.x, 100);
  assert.ok(visual.y >= 210.75 && visual.y <= 212);
  assert.ok(Math.abs(visual.rotation) <= Math.PI / 90);
  assert.deepEqual({ x: anchor.x, y: anchor.y, body: anchor.body }, before);
});

test("update consumes its frozen snapshot even after scene and anchor mutate", () => {
  const anchor = createAnchor();
  const scene = createScene({ anchor });
  const controller = createPlayerPresentationController(scene, { anchor });
  const snapshotA = createPlayerPresentationSnapshot(scene);
  assert.equal(Object.isFrozen(snapshotA), true);
  assert.equal(snapshotA.active, true);

  anchor.active = false;
  anchor.isDying = true;
  anchor.x = 500;
  anchor.y = 600;
  anchor.body.velocity.x = 0;
  anchor.body.velocity.y = 80;
  scene.playerFacingAngle = Math.PI / 2;
  scene.elapsedSurvivalMs = 100;

  controller.update(snapshotA, 16);

  const visual = scene.created[0];
  assert.equal(visual.visible, true, "visible sprite consumes snapshot A active state");
  assert.equal(visual.x, 100);
  assert.equal(visual.y, 212);
  assert.equal(visual.rotation, Math.PI / 90);
  assert.equal(
    visual.anims.currentAnim.key,
    `${anchor.characterId}-legacy-move-right`
  );
  assert.deepEqual(
    {
      x: anchor.x,
      y: anchor.y,
      velocityX: anchor.body.velocity.x,
      velocityY: anchor.body.velocity.y,
      facingAngle: scene.playerFacingAngle,
      elapsedMs: scene.elapsedSurvivalMs,
      active: anchor.active,
      isDying: anchor.isDying
    },
    {
      x: 500,
      y: 600,
      velocityX: 0,
      velocityY: 80,
      facingAngle: Math.PI / 2,
      elapsedMs: 100,
      active: false,
      isDying: true
    },
    "controller reads snapshot A without rewriting the later gameplay state"
  );
});

test("normal mode ignores a declared body bundle and resolves legacy then static", () => {
  const scene = createScene({
    frameTotals: { [LEGACY_SHEET]: 49, [BODY_SHEET]: 121 }
  });
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player,
    allowBodyPreview: false,
  });

  assert.equal(controller.snapshot().mode, "legacy");
  assert.equal(scene.created[0].texture.key, LEGACY_SHEET);

  const staticScene = createScene({ frameTotals: {} });
  const staticController = createPlayerPresentationController(staticScene, {
    anchor: staticScene.player
  });
  assert.equal(staticController.snapshot().mode, "static");
  assert.equal(staticScene.created[0].texture.key, STATIC_TEXTURE);
  assert.equal(staticScene.created[0].originY, 1);
});

test("explicit body preview selects the exact 28-frame body bundle only after both graphics allocate", () => {
  const cases = [
    ["no candidate sheet", { [LEGACY_SHEET]: 49 }],
    ["candidate sheet without frames", { [LEGACY_SHEET]: 49, [BODY_SHEET]: 1 }],
    ["candidate sheet with one frame missing", { [LEGACY_SHEET]: 49, [BODY_SHEET]: 28 }],
    ["candidate sheet with one extra frame", { [LEGACY_SHEET]: 49, [BODY_SHEET]: 30 }]
  ];

  for (const [label, frameTotals] of cases) {
    const scene = createScene({ frameTotals });
    const controller = createPlayerPresentationController(scene, {
      anchor: scene.player,
      allowBodyPreview: true
    });

    assert.equal(controller.snapshot().mode, "legacy", label);
    assert.equal(scene.created.length, 1, `${label}: body allocation does not start`);
    assert.equal(scene.created[0].texture.key, LEGACY_SHEET, label);
  }

  const scene = createScene({
    frameTotals: { [LEGACY_SHEET]: 49, [BODY_SHEET]: 29 }
  });
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player,
    allowBodyPreview: true
  });
  assert.equal(controller.snapshot().mode, "body");
  assert.equal(scene.created[0].texture.key, BODY_SHEET);
  assert.equal(scene.graphicsCreated.length, 2);
  assert.equal(scene.player.visible, false);
});

test("body preview shows body and dummy equipment only for down locomotion", () => {
  const scene = createScene({
    frameTotals: { [LEGACY_SHEET]: 49, [BODY_SHEET]: 29 }
  });
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player,
    allowBodyPreview: true
  });
  const visual = scene.created[0];
  const snapshot = Object.freeze({
    active: true,
    x: 100,
    y: 200,
    velocityX: 0,
    velocityY: 80,
    facingAngle: Math.PI / 2,
    elapsedMs: 16,
    dashActive: false
  });

  assert.equal(controller.update(snapshot, 16), true);
  assert.equal(visual.texture.key, BODY_SHEET);
  assert.equal(visual.presentationAnimationFamily, "prototype");
  assert.equal(scene.graphicsCreated.some(({ calls }) => calls.some(([name]) => name === "lineBetween")), true);

  for (const [label, input] of [
    ["left", { facingAngle: Math.PI, hit: false }],
    ["right", { facingAngle: 0, hit: false }],
    ["up", { facingAngle: -Math.PI / 2, hit: false }],
    ["hit", { facingAngle: Math.PI / 2, hit: true }]
  ]) {
    assert.equal(controller.setPreviewOverride({
      mode: "body",
      facingAngle: input.facingAngle,
      velocityX: 0,
      velocityY: 80,
      hit: input.hit
    }), true, label);
    assert.equal(controller.update(snapshot, 16), true, label);
    assert.equal(visual.texture.key, LEGACY_SHEET, label);
    assert.equal(scene.graphicsCreated.every(({ visible }) => visible === false), true, label);
  }
});

test("body preview rotates frame sockets through the same dash lean as the body sprite", () => {
  const scene = createScene({
    frameTotals: { [LEGACY_SHEET]: 49, [BODY_SHEET]: 29 }
  });
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player,
    allowBodyPreview: true
  });
  const visual = scene.created[0];
  const snapshot = Object.freeze({
    active: true,
    x: 100,
    y: 200,
    velocityX: 160,
    velocityY: 0,
    facingAngle: Math.PI / 2,
    elapsedMs: 0,
    dashActive: true
  });

  assert.equal(controller.update(snapshot, 0), true);
  assert.equal(visual.frame.name, 16, "rightward movement enters the first strafe-left frame");
  assert.equal(visual.rotation, Math.PI / 45);
  const activeRig = scene.graphicsCreated.find((graphic) => (
    graphic.calls.filter(([name]) => name === "lineBetween").length >= 7
  ));
  const lastClear = activeRig.calls.findLastIndex(([name]) => name === "clear");
  const firstForearm = activeRig.calls
    .slice(lastClear + 1)
    .find(([name]) => name === "lineBetween");
  assert.deepEqual(
    firstForearm.slice(1, 3),
    [87, 195],
    "frame 16 grip (18,40) must rotate around the body foot anchor before drawing"
  );
});

test("body preview construction failure restores the anchor and destroys every partial component", () => {
  let allocation = 0;
  const scene = createScene({
    frameTotals: { [LEGACY_SHEET]: 49, [BODY_SHEET]: 29 },
    graphicsFactory() {
      allocation += 1;
      return allocation === 1 ? createGraphicsDouble() : null;
    }
  });
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player,
    allowBodyPreview: true
  });

  assert.equal(controller.snapshot().fallback, true);
  assert.equal(scene.player.visible, true);
  assert.equal(scene.created[0].calls.destroy, 1);
  assert.equal(scene.graphicsCreated[0].active, false);
});

test("reapplying a dynamic sample preview preserves its active equipment recoil", () => {
  const scene = createScene({
    frameTotals: {
      [LEGACY_SHEET]: 49,
      [TEXTURES.playerResponseOperativeBreacherSampleSheet]: 6
    }
  });
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player
  });
  const override = {
    mode: "sample-a",
    facingAngle: 0,
    velocityX: 80,
    velocityY: 0,
    hit: false
  };
  const snapshot = Object.freeze({
    active: true,
    x: 100,
    y: 200,
    velocityX: 80,
    velocityY: 0,
    facingAngle: 0,
    elapsedMs: 16,
    dashActive: false
  });
  const latestRigLines = () => scene.graphicsCreated.flatMap((graphic) => {
    let lastClear = -1;
    graphic.calls.forEach((call, index) => {
      if (call[0] === "clear") lastClear = index;
    });
    return graphic.calls
      .slice(lastClear + 1)
      .filter(([name]) => name === "lineBetween");
  });

  assert.equal(
    controller.setPreviewOverride(override),
    true,
    JSON.stringify(controller.snapshot())
  );
  assert.equal(controller.snapshot().dynamicSampleFacing, null);
  assert.equal(controller.snapshot().dynamicSampleMirrored, false);
  assert.equal(controller.update(snapshot, 16), true);
  assert.equal(controller.notifyAttack({ angle: 0 }), true);
  scene.tweenCalls[0].advanceToPeak();
  assert.equal(controller.update(snapshot, 16), true);
  const recoilDraw = latestRigLines();

  assert.equal(controller.setPreviewOverride(override), true);
  assert.equal(controller.snapshot().dynamicSampleFacing, null);
  assert.equal(controller.snapshot().dynamicSampleMirrored, false);
  assert.equal(controller.update(snapshot, 16), true);
  assert.deepEqual(
    latestRigLines(),
    recoilDraw,
    "an inactive body rig must not clear the shared equipment recoil"
  );
});

test("leaving body preview releases its dummy equipment recoil before legacy fallback", () => {
  const scene = createScene({
    frameTotals: { [LEGACY_SHEET]: 49, [BODY_SHEET]: 29 }
  });
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player,
    allowBodyPreview: true
  });
  const snapshot = Object.freeze({
    active: true,
    x: 100,
    y: 200,
    velocityX: 0,
    velocityY: 80,
    facingAngle: Math.PI / 2,
    elapsedMs: 16,
    dashActive: false
  });

  assert.equal(controller.update(snapshot, 16), true);
  assert.equal(controller.notifyAttack({ angle: 0 }), true);
  const tween = scene.tweenCalls[0];
  tween.advanceToPeak();

  assert.equal(controller.setPreviewOverride({
    mode: "body",
    facingAngle: Math.PI,
    velocityX: 0,
    velocityY: 80,
    hit: false
  }), true);
  assert.equal(tween.calls.remove, 1);
  assert.equal(tween.active, false);
  assert.equal(controller.snapshot().mode, "legacy");
});

test("body preview retains the latest attack aim while a non-down fallback is active", () => {
  const scene = createScene({
    frameTotals: { [LEGACY_SHEET]: 49, [BODY_SHEET]: 29 }
  });
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player,
    allowBodyPreview: true
  });
  const snapshot = Object.freeze({
    active: true,
    x: 100,
    y: 200,
    velocityX: 0,
    velocityY: 80,
    facingAngle: Math.PI / 2,
    elapsedMs: 16,
    dashActive: false
  });

  assert.equal(controller.setPreviewOverride({
    mode: "body",
    facingAngle: Math.PI,
    velocityX: -80,
    velocityY: 0,
    hit: false
  }), true);
  assert.equal(controller.notifyAttack({ angle: 0 }), true, "the fallback commits a rightward attack");
  assert.equal(controller.setPreviewOverride({
    mode: "body",
    facingAngle: Math.PI / 2,
    velocityX: 0,
    velocityY: 80,
    hit: false
  }), true);
  assert.equal(controller.update(snapshot, 0), true);

  const activeRig = scene.graphicsCreated.findLast((graphic) => graphic.active !== false);
  const equipmentLine = activeRig.calls
    .filter(([name]) => name === "lineBetween")
    .at(-3);
  assert.ok(
    equipmentLine[1] < equipmentLine[3],
    "the reactivated dummy equipment must keep the latest rightward aim"
  );
});

test("setPreviewOverride copies valid animation inputs without overriding gameplay position or activity", () => {
  const anchor = createAnchor();
  const scene = createScene({ anchor });
  const controller = createPlayerPresentationController(scene, { anchor });
  const visual = scene.created[0];
  const gameplayBefore = snapshotGameplayState(scene, anchor);
  const override = {
    mode: "legacy",
    facingAngle: Math.PI / 2,
    velocityX: 0,
    velocityY: 80,
    hit: true
  };

  assert.equal(controller.setPreviewOverride(override), true);
  override.mode = "static";
  override.facingAngle = -Math.PI / 2;
  override.velocityY = -80;
  override.hit = false;

  controller.update(Object.freeze({
    active: false,
    x: 350,
    y: 480,
    velocityX: 80,
    velocityY: 0,
    facingAngle: 0,
    elapsedMs: 250,
    dashActive: true
  }), 16);

  assert.equal(controller.snapshot().previewMode, "legacy", "the controller owns a copied override");
  assert.equal(visual.texture.key, LEGACY_SHEET);
  assert.equal(visual.visible, false, "active still comes from the gameplay snapshot");
  assert.equal(visual.x, 350, "x still comes from the gameplay snapshot");
  assert.ok(visual.y > 490 && visual.y <= 492, "y remains anchored to gameplay y plus the foot offset");
  assert.equal(
    visual.anims.currentAnim.key,
    `${anchor.characterId}-legacy-hit-down`,
    "facing, velocity and hit come from the copied preview override"
  );
  assertGameplayStateUnchanged(gameplayBefore, scene, anchor, "preview override");

  assert.equal(controller.setPreviewOverride(null), true);
  controller.update(Object.freeze({
    active: true,
    x: 351,
    y: 481,
    velocityX: 80,
    velocityY: 0,
    facingAngle: 0,
    elapsedMs: 266,
    dashActive: false
  }), 16);
  assert.equal(controller.snapshot().previewMode, null);
  assert.equal(visual.visible, true);
  assert.equal(
    visual.anims.currentAnim.key,
    `${anchor.characterId}-legacy-move-right`,
    "null restores normal gameplay animation inputs"
  );
});

test("setPreviewOverride rejects invalid values without losing the previous valid override", () => {
  const scene = createScene();
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player
  });
  const valid = {
    mode: "static",
    facingAngle: 0,
    velocityX: 0,
    velocityY: 0,
    hit: false
  };

  assert.equal(controller.setPreviewOverride(valid), true);
  for (const invalid of [
    {},
    [],
    { ...valid, mode: "unknown" },
    { ...valid, facingAngle: Number.NaN },
    { ...valid, velocityX: Number.POSITIVE_INFINITY },
    { ...valid, velocityY: "0" },
    { ...valid, hit: 0 },
    { ...valid, extra: true },
    Object.assign({ ...valid }, { [Symbol("extra")]: true })
  ]) {
    assert.equal(controller.setPreviewOverride(invalid), false);
    assert.equal(controller.snapshot().previewMode, "static");
    assert.equal(controller.snapshot().fallback, false);
  }

  const throwingProxy = new Proxy({}, {
    getPrototypeOf() {
      throw new Error("validation trap");
    }
  });
  assert.equal(controller.setPreviewOverride(throwingProxy), false);
  assert.equal(controller.snapshot().previewMode, "static");
  assert.equal(controller.snapshot().fallback, false);
});

test("preview modes force static or safe legacy presentation and body never exposes an incomplete bundle", () => {
  const scene = createScene({
    frameTotals: { [LEGACY_SHEET]: 49, [BODY_SHEET]: 121 }
  });
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player
  });
  const visual = scene.created[0];
  const visualPosition = { x: visual.x, y: visual.y };
  const gameplayBefore = snapshotGameplayState(scene, scene.player);

  assert.equal(controller.setPreviewOverride({
    mode: "static",
    facingAngle: 0,
    velocityX: 0,
    velocityY: 0,
    hit: false
  }), true);
  assert.equal(controller.snapshot().mode, "static");
  assert.equal(controller.snapshot().previewMode, "static");
  assert.equal(visual.texture.key, STATIC_TEXTURE);
  assert.equal(visual.originY, 1);
  assert.equal(visual.presentationAnimationFamily, "static");
  assert.deepEqual({ x: visual.x, y: visual.y }, visualPosition);
  assertGameplayStateUnchanged(gameplayBefore, scene, scene.player, "static preview switch");

  assert.equal(controller.setPreviewOverride({
    mode: "body",
    facingAngle: 0,
    velocityX: 80,
    velocityY: 0,
    hit: false
  }), true);
  assert.equal(controller.snapshot().mode, "legacy");
  assert.equal(controller.snapshot().previewMode, "body");
  assert.equal(controller.snapshot().bodyPreviewRequested, true);
  assert.equal(visual.texture.key, LEGACY_SHEET, "Task 8 bundle absence falls back as one complete unit");
  assert.equal(scene.created.length, 1, "switching modes never allocates another visual");
  assert.deepEqual({ x: visual.x, y: visual.y }, visualPosition);
  assertGameplayStateUnchanged(gameplayBefore, scene, scene.player, "body preview fallback switch");

  assert.equal(controller.setPreviewOverride(null), true);
  assert.equal(controller.snapshot().previewMode, null);
  assert.equal(
    controller.snapshot().bodyPreviewRequested,
    false,
    "clearing the override restores the construction-time body preview setting"
  );

  const noLegacyScene = createScene({ frameTotals: {} });
  const noLegacyController = createPlayerPresentationController(noLegacyScene, {
    anchor: noLegacyScene.player
  });
  assert.equal(noLegacyController.setPreviewOverride({
    mode: "legacy",
    facingAngle: 0,
    velocityX: 0,
    velocityY: 0,
    hit: false
  }), true);
  assert.equal(noLegacyController.snapshot().mode, "static");
  assert.equal(noLegacyController.snapshot().previewMode, "legacy");
  assert.equal(noLegacyScene.created[0].texture.key, STATIC_TEXTURE);

  assert.equal(noLegacyController.setPreviewOverride({
    mode: "body",
    facingAngle: 0,
    velocityX: 0,
    velocityY: 0,
    hit: false
  }), true);
  assert.equal(noLegacyController.snapshot().mode, "static");
  assert.equal(noLegacyController.snapshot().previewMode, "body");
  assert.equal(noLegacyScene.created[0].texture.key, STATIC_TEXTURE);
});

test("a preview presentation switch failure enters the existing safe fallback", () => {
  const anchor = createAnchor();
  const scene = createScene({
    anchor,
    spriteFactory: ({ textureKey }) => createSpriteDouble({
      textureKey,
      throwOnSetTexture: true
    })
  });
  const controller = createPlayerPresentationController(scene, { anchor });

  assert.equal(controller.setPreviewOverride({
    mode: "static",
    facingAngle: 0,
    velocityX: 0,
    velocityY: 0,
    hit: false
  }), false);
  assert.equal(controller.snapshot().fallback, true);
  assert.equal(controller.snapshot().previewMode, null);
  assert.equal(anchor.visible, true);
  assert.equal(scene.created[0].calls.destroy, 1);
});

test("allocation, post-allocation setup and animation failures roll back owned objects and restore the anchor", () => {
  const allocationScene = createScene({
    spriteFactory() {
      throw new Error("allocation failed");
    }
  });
  const allocationController = createPlayerPresentationController(allocationScene, {
    anchor: allocationScene.player
  });
  assert.equal(allocationController.snapshot().fallback, true);
  assert.equal(allocationScene.player.visible, true);

  const setupScene = createScene({
    spriteFactory: ({ textureKey }) => createSpriteDouble({
      textureKey,
      throwOnSetOrigin: true
    })
  });
  setupScene.health = 73;
  const setupBefore = snapshotGameplayState(setupScene, setupScene.player);
  const setupController = createPlayerPresentationController(setupScene, {
    anchor: setupScene.player
  });
  assert.equal(setupController.snapshot().fallback, true);
  assert.equal(setupScene.player.visible, true);
  assert.deepEqual(setupScene.visibleAtAllocation, [true]);
  assert.equal(setupScene.created[0].calls.destroy, 1);
  setupController.destroy();
  assert.equal(setupScene.created[0].calls.destroy, 1);
  assertGameplayStateUnchanged(setupBefore, setupScene, setupScene.player, "setup failure");

  const animationScene = createScene({
    spriteFactory: ({ textureKey }) => createSpriteDouble({ textureKey, throwOnPlay: true })
  });
  const animationController = createPlayerPresentationController(animationScene, {
    anchor: animationScene.player
  });
  assert.equal(animationController.snapshot().fallback, true);
  assert.equal(animationScene.player.visible, true);
  assert.equal(animationScene.created[0].calls.destroy, 1);
});

test("a runtime update failure destroys once, restores the anchor and never reallocates", () => {
  const anchor = createAnchor();
  const scene = createScene({
    anchor,
    spriteFactory: ({ textureKey }) => createSpriteDouble({
      textureKey,
      throwOnSetPositionCall: 2
    })
  });
  scene.health = 61;
  const before = snapshotGameplayState(scene, anchor);
  const controller = createPlayerPresentationController(scene, { anchor });
  assert.equal(controller.snapshot().fallback, false);
  assert.equal(anchor.visible, false);

  assert.equal(
    controller.update(createPlayerPresentationSnapshot(scene), 16),
    false,
    "the failing frame reports that presentation entered fallback"
  );

  assert.equal(controller.snapshot().fallback, true);
  assert.equal(anchor.visible, true);
  assert.equal(scene.created[0].calls.destroy, 1);
  assert.equal(scene.visibleAtAllocation.length, 1);
  assert.ok((anchor.played?.length ?? 0) >= 1, "failure frame syncs the legacy anchor");
  assertGameplayStateUnchanged(before, scene, anchor, "runtime failure");

  const playedAfterFailure = anchor.played.length;
  scene.playerFacingAngle = Math.PI / 2;
  anchor.body.velocity.x = 0;
  anchor.body.velocity.y = 80;
  const fallbackInput = snapshotGameplayState(scene, anchor);
  assert.equal(
    controller.update(createPlayerPresentationSnapshot(scene), 16),
    false,
    "fallback frames still sync the anchor but never report presentation success"
  );

  assert.equal(
    anchor.played.length,
    playedAfterFailure + 1,
    "later fallback update performs one new anchor sync"
  );
  assert.equal(
    anchor.played.at(-1),
    `${anchor.characterId}-legacy-move-down`,
    "later fallback update reflects the changed movement and facing"
  );
  assertGameplayStateUnchanged(fallbackInput, scene, anchor, "later fallback sync");

  controller.destroy();
  controller.destroy();

  assert.equal(scene.created[0].calls.destroy, 1);
  assert.equal(scene.visibleAtAllocation.length, 1);
});

test("fallback is one-way and later updates sync the anchor without reallocating visuals", () => {
  const anchor = createAnchor();
  const scene = createScene({
    anchor,
    spriteFactory() {
      throw new Error("allocation failed");
    }
  });
  const controller = createPlayerPresentationController(scene, { anchor });

  controller.update(createPlayerPresentationSnapshot(scene), 16);
  controller.update(createPlayerPresentationSnapshot(scene), 16);

  assert.equal(scene.visibleAtAllocation.length, 1);
  assert.equal(anchor.visible, true);
  assert.ok((anchor.played?.length ?? 0) >= 1, "legacy anchor continues its compatibility sync");
});

test("setPaused freezes only the owned sprite animation", () => {
  const scene = createScene();
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player
  });

  controller.setPaused(true);
  controller.setPaused(false);

  assert.equal(scene.created[0].calls.pause, 1);
  assert.equal(scene.created[0].calls.resume, 1);
  assert.deepEqual(scene.globalPauseCalls, []);
});

test("pause remains effective when update changes the requested animation", () => {
  const anchor = createAnchor();
  const scene = createScene({ anchor });
  const controller = createPlayerPresentationController(scene, { anchor });
  const visual = scene.created[0];

  controller.setPaused(true);
  assert.equal(visual.anims.paused, true);

  scene.playerFacingAngle = Math.PI / 2;
  anchor.body.velocity.x = 0;
  anchor.body.velocity.y = 80;
  controller.update(createPlayerPresentationSnapshot(scene), 16);

  assert.equal(visual.anims.currentAnim.key.endsWith("-move-down"), true);
  assert.equal(visual.anims.paused, true, "changed animation remains paused");
  assert.equal(visual.calls.pause, 2, "pause is reapplied after the changed animation");
  assert.deepEqual(scene.globalPauseCalls, []);
});

test("notifyHit tints and plays hit feedback only on the owned visible sprite", () => {
  const anchor = createAnchor();
  const scene = createScene({ anchor });
  const controller = createPlayerPresentationController(scene, { anchor });
  const visual = scene.created[0];
  const beforeNotify = snapshotGameplayState(scene, anchor);

  assert.equal(controller.notifyHit({
    atMs: 250,
    durationMs: 120,
    tint: 0xff6666
  }), true);

  assert.deepEqual(visual.calls.setTint, [0xff6666]);
  assert.equal(visual.anims.currentAnim.key, `${anchor.characterId}-legacy-hit-right`);
  assert.equal(anchor.tint, undefined, "hidden gameplay anchor stays untinted");
  assert.equal(scene.delayedCalls.length, 1);
  assert.equal(scene.delayedCalls[0].delay, 120);
  assertGameplayStateUnchanged(beforeNotify, scene, anchor, "notifyHit");

  scene.elapsedSurvivalMs = 300;
  const beforeHitSync = snapshotGameplayState(scene, anchor);
  controller.update(createPlayerPresentationSnapshot(scene), 16);
  assert.equal(
    visual.anims.currentAnim.key,
    `${anchor.characterId}-legacy-hit-right`,
    "later frozen-snapshot sync preserves the controller-owned hit window"
  );
  assertGameplayStateUnchanged(beforeHitSync, scene, anchor, "hit follow-up sync");

  scene.delayedCalls[0].callback();
  assert.equal(visual.calls.clearTint, 1);
  assert.equal(anchor.tint, undefined, "tint cleanup also stays on the visible sprite");

  scene.elapsedSurvivalMs = 371;
  controller.update(createPlayerPresentationSnapshot(scene), 16);
  assert.equal(
    visual.anims.currentAnim.key,
    `${anchor.characterId}-legacy-move-right`,
    "the hit window expires without writing gameplay timing"
  );
});

test("setAlpha and notifyAttack mutate only visible presentation channels", () => {
  const anchor = createAnchor();
  const scene = createScene({ anchor });
  const controller = createPlayerPresentationController(scene, { anchor });
  const visual = scene.created[0];
  const before = {
    anchorX: anchor.x,
    anchorY: anchor.y,
    anchorScaleX: anchor.scaleX,
    anchorScaleY: anchor.scaleY,
    body: anchor.body,
    visualX: visual.x,
    visualY: visual.y,
    visualScaleX: visual.scaleX,
    visualScaleY: visual.scaleY
  };
  const initialVisualRotation = visual.rotation;

  assert.equal(controller.setAlpha(0.35), true);
  assert.equal(visual.alpha, 0.35);
  assert.equal(anchor.alpha, undefined);

  assert.equal(controller.notifyAttack({
    angle: 0,
    weaponId: "pistol",
    heavy: false
  }), true);
  assert.equal(scene.tweenCalls.length, 1);
  assert.equal(scene.tweenCalls[0].yoyo, true);
  assert.ok(scene.tweenCalls[0].duration <= 100);
  const recoilTween = scene.tweenCalls[0];
  recoilTween.advanceToPeak();
  assert.equal(visual.rotation, initialVisualRotation, "tween does not write Sprite rotation");
  assert.equal(visual.skewX, undefined, "tween does not write Sprite skewX");
  assert.equal(visual.skewY, undefined, "tween does not write Sprite skewY");
  controller.update(createPlayerPresentationSnapshot(scene), 16);
  assert.notEqual(visual.rotation, initialVisualRotation, "controller renders the recoil pulse");
  assert.deepEqual(
    {
      anchorX: anchor.x,
      anchorY: anchor.y,
      anchorScaleX: anchor.scaleX,
      anchorScaleY: anchor.scaleY,
      body: anchor.body,
      visualX: visual.x,
      visualY: visual.y,
      visualScaleX: visual.scaleX,
      visualScaleY: visual.scaleY
    },
    before,
    "recoil must not change anchor/visible position, scale or Body"
  );

  controller.destroy();
  controller.destroy();
  assert.equal(recoilTween.calls.remove, 1, "destroy releases an owned recoil tween once");
});

test("recoil remains visible when tween UPDATE runs before controller update and render", () => {
  const anchor = createAnchor();
  const scene = createScene({ anchor });
  const controller = createPlayerPresentationController(scene, { anchor });
  const visual = scene.created[0];
  const snapshot = createPlayerPresentationSnapshot(scene);
  const movementRotation = visual.rotation;

  assert.equal(controller.notifyAttack({
    angle: 0,
    weaponId: "pistol",
    heavy: false
  }), true);

  scene.tweenCalls[0].advanceToPeak();
  assert.equal(
    visual.rotation,
    movementRotation,
    "tween UPDATE changes controller state without writing the visible sprite directly"
  );
  controller.update(snapshot, 16);

  assert.ok(Number.isFinite(visual.rotation), "render rotation stays finite");
  assert.notEqual(
    visual.rotation,
    movementRotation,
    "render sees recoil after controller update instead of movement lean overwriting it"
  );

  const stationaryAnchor = createAnchor();
  stationaryAnchor.body.velocity.x = 0;
  const stationaryScene = createScene({ anchor: stationaryAnchor });
  const stationaryController = createPlayerPresentationController(stationaryScene, {
    anchor: stationaryAnchor
  });
  const stationaryVisual = stationaryScene.created[0];
  assert.equal(stationaryController.notifyAttack({ angle: 0, heavy: false }), true);
  stationaryScene.tweenCalls[0].advanceToPeak();
  stationaryController.update(createPlayerPresentationSnapshot(stationaryScene), 16);

  assert.ok(
    Math.abs(
      visual.rotation - (movementRotation + stationaryVisual.rotation)
    ) < Number.EPSILON,
    "controller adds the same recoil offset on top of movement lean"
  );
});

test("light and heavy recoil stay finite, lightweight and visible in every attack direction", () => {
  const attackAngles = [
    0,
    Math.PI / 2,
    Math.PI,
    -Math.PI / 2,
    Math.PI / 4,
    3 * Math.PI / 4
  ];

  for (const angle of attackAngles) {
    const peaks = {};
    for (const heavy of [false, true]) {
      const anchor = createAnchor();
      anchor.body.velocity.x = 0;
      const scene = createScene({ anchor });
      const controller = createPlayerPresentationController(scene, { anchor });
      const visual = scene.created[0];
      const label = `${heavy ? "heavy" : "light"} at ${angle}`;

      assert.equal(controller.notifyAttack({ angle, heavy }), true, label);
      scene.tweenCalls[0].advanceToPeak();
      controller.update(createPlayerPresentationSnapshot(scene), 16);

      const peak = Math.abs(visual.rotation);
      assert.ok(Number.isFinite(peak), `${label} stays finite`);
      assert.ok(peak >= 0.005, `${label} remains visibly non-zero`);
      assert.ok(peak <= 0.05, `${label} remains lightweight`);
      peaks[heavy ? "heavy" : "light"] = peak;
      controller.destroy();
    }
    assert.ok(peaks.heavy > peaks.light, `heavy exceeds light at ${angle}`);
  }
});

test("a new attack replaces prior recoil and stale callbacks cannot erase the new pulse", () => {
  const anchor = createAnchor();
  anchor.body.velocity.x = 0;
  const scene = createScene({ anchor });
  const controller = createPlayerPresentationController(scene, { anchor });
  const visual = scene.created[0];
  const snapshot = createPlayerPresentationSnapshot(scene);

  assert.equal(controller.notifyAttack({ angle: 0, heavy: false }), true);
  const firstTween = scene.tweenCalls[0];
  firstTween.advanceToPeak();
  controller.update(snapshot, 16);
  const firstPeak = visual.rotation;
  assert.ok(firstPeak < 0, "first attack produces its signed peak");

  assert.equal(controller.notifyAttack({ angle: Math.PI, heavy: false }), true);
  assert.equal(firstTween.calls.remove, 1, "replacement removes the prior owned tween");
  controller.update(snapshot, 16);
  assert.equal(visual.rotation, 0, "replacement clears the prior offset before its first tick");

  const secondTween = scene.tweenCalls[1];
  secondTween.advanceToPeak();
  controller.update(snapshot, 16);
  const secondPeak = visual.rotation;
  assert.ok(secondPeak > 0, "replacement pulse follows the new direction");

  firstTween.onStop();
  controller.update(snapshot, 16);
  assert.equal(
    visual.rotation,
    secondPeak,
    "a stale callback from the replaced tween cannot clear current recoil"
  );
});

test("complete and stop both release recoil state without leaving a render offset", () => {
  for (const lifecycleEvent of ["complete", "stop"]) {
    const anchor = createAnchor();
    anchor.body.velocity.x = 0;
    const scene = createScene({ anchor });
    const controller = createPlayerPresentationController(scene, { anchor });
    const visual = scene.created[0];
    const snapshot = createPlayerPresentationSnapshot(scene);

    assert.equal(controller.notifyAttack({ angle: 0, heavy: false }), true);
    const tween = scene.tweenCalls[0];
    tween.advanceToPeak();
    controller.update(snapshot, 16);
    assert.notEqual(visual.rotation, 0, `${lifecycleEvent}: peak is visible`);

    tween[lifecycleEvent]();
    controller.update(snapshot, 16);
    assert.equal(visual.rotation, 0, `${lifecycleEvent}: offset is cleared`);
    assert.equal(
      tween.targets.rotationOffset,
      0,
      `${lifecycleEvent}: controller-owned numeric state is cleared`
    );

    controller.destroy();
    assert.equal(
      tween.calls.remove,
      0,
      `${lifecycleEvent}: completed/stopped tween is no longer owned at destroy`
    );
  }
});

test("pause freezes active recoil and resume continues the same owned pulse", () => {
  const anchor = createAnchor();
  const scene = createScene({ anchor });
  const controller = createPlayerPresentationController(scene, { anchor });
  const visual = scene.created[0];
  const snapshot = createPlayerPresentationSnapshot(scene);
  const movementRotation = visual.rotation;

  assert.equal(controller.notifyAttack({ angle: 0, heavy: false }), true);
  const tween = scene.tweenCalls[0];
  tween.advanceToPeak();
  controller.update(snapshot, 16);
  assert.notEqual(visual.rotation, movementRotation, "pre-pause recoil is visible");

  controller.setPaused(true);
  assert.equal(tween.calls.pause, 1, "pause freezes the owned recoil tween");
  assert.equal(tween.calls.remove, 0, "pause does not detach active recoil");
  assert.notEqual(tween.targets.rotationOffset, 0, "pause preserves recoil numeric state");
  assert.equal(
    visual.rotation,
    movementRotation + tween.targets.rotationOffset,
    "pause preserves the visible recoil pose"
  );
  assert.equal(
    controller.notifyAttack({ angle: Math.PI, heavy: false }),
    false,
    "a paused controller does not claim to establish a visible pulse"
  );
  assert.equal(scene.tweenCalls.length, 1, "paused attack does not allocate a hidden tween");

  controller.setPaused(false);
  controller.update(snapshot, 16);
  assert.equal(tween.calls.resume, 1, "resume continues the same owned tween");
  assert.equal(
    visual.rotation,
    movementRotation + tween.targets.rotationOffset,
    "resume continues from the preserved recoil value"
  );
});

test("fallback and destroy remove active recoil and clear its numeric state", () => {
  const fallbackAnchor = createAnchor();
  fallbackAnchor.body.velocity.x = 0;
  const fallbackScene = createScene({
    anchor: fallbackAnchor,
    spriteFactory: ({ textureKey }) => createSpriteDouble({
      textureKey,
      throwOnSetAlpha: true
    })
  });
  const fallbackController = createPlayerPresentationController(fallbackScene, {
    anchor: fallbackAnchor
  });
  assert.equal(fallbackController.notifyAttack({ angle: 0, heavy: false }), true);
  const fallbackTween = fallbackScene.tweenCalls[0];
  fallbackTween.advanceToPeak();

  assert.equal(fallbackController.setAlpha(0.5), false);
  assert.equal(fallbackController.snapshot().fallback, true);
  assert.equal(fallbackTween.calls.remove, 1, "fallback removes active recoil");
  assert.equal(
    fallbackTween.targets.rotationOffset,
    0,
    "fallback clears recoil numeric state"
  );

  const destroyAnchor = createAnchor();
  destroyAnchor.body.velocity.x = 0;
  const destroyScene = createScene({ anchor: destroyAnchor });
  const destroyController = createPlayerPresentationController(destroyScene, {
    anchor: destroyAnchor
  });
  assert.equal(destroyController.notifyAttack({ angle: 0, heavy: false }), true);
  const destroyTween = destroyScene.tweenCalls[0];
  destroyTween.advanceToPeak();

  destroyController.destroy();
  destroyController.destroy();
  assert.equal(destroyTween.calls.remove, 1, "destroy removes active recoil once");
  assert.equal(
    destroyTween.targets.rotationOffset,
    0,
    "destroy clears recoil numeric state"
  );
});

test("a failed replacement reports unhandled and leaves no stale recoil", () => {
  const anchor = createAnchor();
  anchor.body.velocity.x = 0;
  const scene = createScene({ anchor });
  const controller = createPlayerPresentationController(scene, { anchor });
  const visual = scene.created[0];
  const snapshot = createPlayerPresentationSnapshot(scene);

  assert.equal(controller.notifyAttack({ angle: 0, heavy: false }), true);
  const firstTween = scene.tweenCalls[0];
  firstTween.advanceToPeak();
  controller.update(snapshot, 16);
  assert.notEqual(visual.rotation, 0);

  scene.tweens.add = () => null;
  assert.equal(controller.notifyAttack({ angle: Math.PI, heavy: false }), false);
  assert.equal(firstTween.calls.remove, 1, "failed replacement still releases prior recoil");
  controller.update(snapshot, 16);
  assert.equal(visual.rotation, 0, "failed replacement returns to movement-only rotation");
  assert.equal(controller.snapshot().fallback, false, "allocation refusal stays recoverable");
});

test("a replacement cleanup exception reports unhandled and activates safe fallback", () => {
  const anchor = createAnchor();
  anchor.body.velocity.x = 0;
  const scene = createScene({ anchor, throwOnTweenRemove: true });
  const controller = createPlayerPresentationController(scene, { anchor });
  const visual = scene.created[0];

  assert.equal(controller.notifyAttack({ angle: 0, heavy: false }), true);
  const failedRemovalTween = scene.tweenCalls[0];
  failedRemovalTween.advanceToPeak();

  assert.equal(
    controller.notifyAttack({ angle: Math.PI, heavy: false }),
    false,
    "replacement cleanup failure is not reported as handled"
  );
  assert.equal(controller.snapshot().fallback, true);
  assert.equal(anchor.visible, true, "safe fallback restores the gameplay anchor");
  assert.equal(visual.calls.destroy, 1, "safe fallback destroys the visible sprite once");
  assert.equal(scene.tweenCalls.length, 1, "no replacement tween is allocated after cleanup fails");
  assert.equal(failedRemovalTween.calls.remove, 1, "controller first attempts normal removal");
  assert.equal(failedRemovalTween.calls.stop, 1, "remove failure falls back to stop");
  assert.equal(failedRemovalTween.stopped, true, "fallback stop makes the tween inactive");
  assert.equal(
    failedRemovalTween.managerOwned,
    true,
    "Phaser keeps a stopped tween manager-owned until the next manager frame"
  );
  assert.equal(
    failedRemovalTween.isPendingRemove(),
    true,
    "stop marks the tween pending removal after dispatching onStop"
  );
  assert.equal(
    failedRemovalTween.targets.rotationOffset,
    0,
    "failed removal still clears controller-owned recoil state"
  );

  failedRemovalTween.advanceToPeak();
  assert.equal(
    failedRemovalTween.targets.rotationOffset,
    0,
    "detached tween cannot mutate recoil state again"
  );
  failedRemovalTween.simulateManagerFrameRemoval();
  assert.equal(
    failedRemovalTween.managerOwned,
    false,
    "the next TweenManager frame performs physical removal"
  );

  controller.destroy();
  controller.destroy();
  assert.equal(failedRemovalTween.calls.remove, 1, "destroy does not retry detached removal");
  assert.equal(failedRemovalTween.calls.stop, 1, "destroy does not stop detached tween twice");
  assert.equal(visual.calls.destroy, 1, "destroy stays idempotent after fallback");
});

test("a cleanup method that returns while the tween is still active is not treated as detached", () => {
  const anchor = createAnchor();
  anchor.body.velocity.x = 0;
  const scene = createScene({ anchor, leaveTweenActiveOnRemove: true });
  const controller = createPlayerPresentationController(scene, { anchor });

  assert.equal(controller.notifyAttack({ angle: 0, heavy: false }), true);
  const firstTween = scene.tweenCalls[0];
  firstTween.advanceToPeak();

  assert.equal(
    controller.notifyAttack({ angle: Math.PI, heavy: false }),
    true,
    "a verified stop permits the replacement after remove leaves the tween active"
  );
  assert.equal(firstTween.calls.remove, 1);
  assert.equal(
    firstTween.calls.stop,
    1,
    "controller verifies lifecycle state and stops the still-active tween"
  );
  assert.equal(firstTween.isActive(), false);
  assert.equal(firstTween.isPendingRemove(), true);
  assert.equal(firstTween.managerOwned, true);
  assert.equal(scene.tweenCalls.length, 2, "only one replacement tween is allocated");

  firstTween.simulateManagerFrameRemoval();
  assert.equal(firstTween.managerOwned, false);
});

test("combined remove and stop exceptions retain cleanup ownership for fallback and destroy retries", () => {
  const anchor = createAnchor();
  anchor.body.velocity.x = 0;
  const scene = createScene({
    anchor,
    throwOnTweenRemove: true,
    throwOnTweenStop: true
  });
  const controller = createPlayerPresentationController(scene, { anchor });
  const visual = scene.created[0];

  assert.equal(controller.notifyAttack({ angle: 0, heavy: false }), true);
  const stuckTween = scene.tweenCalls[0];
  stuckTween.advanceToPeak();

  assert.doesNotThrow(() => {
    assert.equal(
      controller.notifyAttack({ angle: Math.PI, heavy: false }),
      false,
      "combined cleanup failure is never reported as handled"
    );
  });
  assert.equal(controller.snapshot().fallback, true);
  assert.equal(scene.tweenCalls.length, 1, "cleanup failure allocates no replacement tween");
  assert.equal(
    stuckTween.calls.remove,
    2,
    "fallback retries the retained handle after the replacement cleanup attempt"
  );
  assert.equal(stuckTween.calls.stop, 2);
  assert.equal(stuckTween.isActive(), true, "throwing cleanup leaves the fake tween active");
  assert.equal(stuckTween.managerOwned, true);
  assert.equal(stuckTween.targets.rotationOffset, 0, "numeric recoil state is neutralized");
  assert.equal(visual.calls.destroy, 1);

  assert.equal(
    controller.notifyAttack({ angle: Math.PI, heavy: false }),
    false,
    "fallback remains one-way and cannot allocate a replacement"
  );
  assert.equal(stuckTween.calls.remove, 2, "fallback calls do not escape or lose ownership");
  assert.equal(stuckTween.calls.stop, 2);

  assert.doesNotThrow(() => controller.destroy());
  assert.equal(stuckTween.calls.remove, 3, "destroy retries the still-retained handle");
  assert.equal(stuckTween.calls.stop, 3);
  assert.equal(stuckTween.targets.rotationOffset, 0);

  assert.doesNotThrow(() => controller.destroy());
  assert.equal(stuckTween.calls.remove, 3, "idempotent destroy performs no fourth retry");
  assert.equal(stuckTween.calls.stop, 3);
  assert.equal(visual.calls.destroy, 1);
});

test("feedback methods return false after destroy and when their presentation channel is unavailable", () => {
  const destroyedScene = createScene();
  const destroyedController = createPlayerPresentationController(destroyedScene, {
    anchor: destroyedScene.player
  });
  destroyedController.destroy();

  assert.equal(destroyedController.notifyHit({
    atMs: 0,
    durationMs: 120,
    tint: 0xff6666
  }), false);
  assert.equal(destroyedController.setAlpha(0.35), false);
  assert.equal(destroyedController.notifyAttack({
    angle: 0,
    weaponId: "pistol",
    heavy: false
  }), false);

  const cases = [
    {
      label: "hit tint",
      disable(scene) {
        scene.created[0].setTint = undefined;
      },
      invoke(controller) {
        return controller.notifyHit({ atMs: 0, durationMs: 120, tint: 0xff6666 });
      }
    },
    {
      label: "alpha",
      disable(scene) {
        scene.created[0].setAlpha = undefined;
      },
      invoke(controller) {
        return controller.setAlpha(0.35);
      }
    },
    {
      label: "recoil tween",
      disable(scene) {
        scene.tweens.add = undefined;
      },
      invoke(controller) {
        return controller.notifyAttack({ angle: 0, weaponId: "pistol", heavy: false });
      }
    },
    {
      label: "visible recoil rotation",
      disable(scene) {
        scene.created[0].setRotation = undefined;
      },
      invoke(controller) {
        return controller.notifyAttack({ angle: 0, weaponId: "pistol", heavy: false });
      }
    }
  ];

  for (const { label, disable, invoke } of cases) {
    const anchor = createAnchor();
    const scene = createScene({ anchor });
    const controller = createPlayerPresentationController(scene, { anchor });
    const before = snapshotGameplayState(scene, anchor);
    disable(scene);

    assert.equal(invoke(controller), false, `${label} reports unavailable`);
    assertGameplayStateUnchanged(before, scene, anchor, `${label} unavailable`);
  }
});

test("feedback exceptions activate one safe fallback without escaping to gameplay", () => {
  const cases = [
    {
      label: "hit tint",
      scene: () => createScene({
        spriteFactory: ({ textureKey }) => createSpriteDouble({
          textureKey,
          throwOnSetTint: true
        })
      }),
      invoke(controller) {
        return controller.notifyHit({ atMs: 0, durationMs: 120, tint: 0xff6666 });
      }
    },
    {
      label: "alpha",
      scene: () => createScene({
        spriteFactory: ({ textureKey }) => createSpriteDouble({
          textureKey,
          throwOnSetAlpha: true
        })
      }),
      invoke(controller) {
        return controller.setAlpha(0.35);
      }
    },
    {
      label: "recoil tween",
      scene: () => createScene({ throwOnTweenAdd: true }),
      invoke(controller) {
        return controller.notifyAttack({ angle: 0, weaponId: "pistol", heavy: false });
      }
    }
  ];

  for (const { label, scene: makeScene, invoke } of cases) {
    const scene = makeScene();
    const controller = createPlayerPresentationController(scene, {
      anchor: scene.player
    });
    const visual = scene.created[0];
    const before = snapshotGameplayState(scene, scene.player);
    let handled;

    assert.doesNotThrow(() => {
      handled = invoke(controller);
    }, `${label} failure is presentation-only`);
    assert.equal(handled, false, `${label} failure reports unhandled`);
    assert.equal(controller.snapshot().fallback, true, `${label} enters fallback`);
    assert.equal(scene.player.visible, true, `${label} restores the anchor`);
    assert.equal(visual.calls.destroy, 1, `${label} destroys the visual once`);
    assertGameplayStateUnchanged(before, scene, scene.player, `${label} failure`);

    assert.equal(invoke(controller), false, `${label} fallback is one-way`);
    controller.destroy();
    controller.destroy();
    assert.equal(visual.calls.destroy, 1, `${label} does not repeat cleanup`);
  }
});

test("feedback methods return false after controller fallback without mutating the anchor", () => {
  const anchor = createAnchor();
  const scene = createScene({
    anchor,
    spriteFactory() {
      throw new Error("allocation failed");
    }
  });
  const controller = createPlayerPresentationController(scene, { anchor });

  assert.equal(controller.notifyHit({ atMs: 0, durationMs: 120, tint: 0xff6666 }), false);
  assert.equal(controller.setAlpha(0.35), false);
  assert.equal(controller.notifyAttack({ angle: 0, weaponId: "pistol", heavy: false }), false);
  assert.equal(anchor.tint, undefined);
  assert.equal(anchor.alpha, undefined);
  assert.equal(scene.tweenCalls.length, 0);
});

test("create, update and unavailable preview paths leave gameplay and anchor physics immutable", () => {
  for (const allowBodyPreview of [false, true]) {
    const anchor = createAnchor();
    const scene = createScene({
      anchor,
      frameTotals: { [LEGACY_SHEET]: 49, [BODY_SHEET]: 121 }
    });
    scene.health = 87;
    scene.elapsedSurvivalMs = 345;
    scene.playerFacingAngle = 0.25;
    scene.dashUntilMs = 600;
    const before = snapshotGameplayState(scene, anchor);

    const controller = createPlayerPresentationController(scene, {
      anchor,
      allowBodyPreview
    });
    controller.update(createPlayerPresentationSnapshot(scene), 16);

    assert.equal(controller.snapshot().mode, "legacy");
    assertGameplayStateUnchanged(
      before,
      scene,
      anchor,
      allowBodyPreview ? "preview fallback" : "normal"
    );
  }
});

test("normal gameplay atomically activates the selected formal rig and drives only its five-frame visual state", () => {
  const anchor = createAnchor();
  const scene = createScene({
    anchor,
    frameTotals: createFormalFrameTotals("pistol")
  });
  const controller = createPlayerPresentationController(scene, { anchor });
  const legacy = scene.created[0];
  const gameplayBefore = snapshotGameplayState(scene, anchor);

  controller.update(createFormalSnapshot({ selectedWeaponId: null }), 16);
  assert.equal(controller.snapshot().mode, "legacy");
  assert.equal(scene.created.length, 1, "no weapon keeps the complete legacy visual");
  assert.equal(controller.setAlpha(0.6), true);

  assert.equal(controller.update(createFormalSnapshot({ velocityX: 80 }), 0), true);
  const formalState = controller.snapshot();
  assert.equal(formalState.mode, "formal");
  assert.equal(formalState.formalWeaponId, "pistol");
  assert.equal(formalState.formalFrame, 0);
  assert.equal(formalState.formalFacing, "right");
  assert.equal(legacy.visible, false, "legacy hides only after the complete rig renders");
  assert.equal(anchor.visible, false, "the gameplay anchor remains display-hidden only");

  const body = scene.created.find(({ texture }) => texture.key === FORMAL_BODY_SHEET);
  const aimBack = scene.created.find(
    ({ texture }) => texture.key === TEXTURES.playerFoundationRifleAimBack
  );
  const aimFront = scene.created.find(
    ({ texture }) => texture.key === TEXTURES.playerFoundationRifleAimFront
  );
  const recoilBack = scene.created.find(
    ({ texture }) => texture.key === TEXTURES.playerFoundationRifleAimRecoilBack
  );
  const recoilFront = scene.created.find(
    ({ texture }) => texture.key === TEXTURES.playerFoundationRifleAimRecoilFront
  );
  assert.ok(body && aimBack && aimFront && recoilBack && recoilFront);
  assert.deepEqual([body.x, body.y, body.frame.name], [100, 212, 0]);
  assert.equal(body.alpha, 0.6, "formal body inherits the controller alpha set before activation");
  assert.equal(aimFront.alpha, 0.6, "formal equipment inherits the controller alpha set before activation");
  assert.equal(body.flipX, true, "activation facing consumes this frame's velocityX");
  assert.equal(formalState.formalVisualAimFacing, "left");
  assert.ok([aimBack, aimFront, recoilBack, recoilFront].every(({ flipX }) => flipX === true));
  assert.ok([aimBack, aimFront, recoilBack, recoilFront].every(({ frame }) => frame.name === 0));
  assert.equal(aimFront.visible, true);
  assert.equal(recoilFront.visible, false);
  assert.equal(
    aimFront.rotation,
    0,
    "the complete pose stays connected instead of freely rotating the weapon away from its hands"
  );

  controller.update(createFormalSnapshot({ x: 100, y: 200, velocityX: 80 }), 0);
  assert.equal(body.frame.name, 1);
  controller.update(createFormalSnapshot({ x: 112, y: 200, velocityX: 80 }), 105);
  assert.equal(body.frame.name, 2);
  controller.update(createFormalSnapshot({ x: 124, y: 200, velocityX: 80 }), 85);
  assert.equal(body.frame.name, 3);
  controller.update(createFormalSnapshot({ x: 136, y: 200, velocityX: 80 }), 105);
  assert.equal(body.frame.name, 4);
  controller.update(createFormalSnapshot({ x: 148, y: 200, velocityX: 80 }), 85);
  assert.equal(body.frame.name, 1);

  controller.update(createFormalSnapshot({ x: 148, y: 212, velocityX: 0, velocityY: 80 }), 0);
  assert.equal(body.frame.name, 2, "vertical travel advances from actual world distance");
  assert.equal(body.flipX, true, "vertical motion preserves the prior right facing");
  controller.update(createFormalSnapshot({ x: 148, y: 212 }), 0);
  assert.equal(body.frame.name, 2, "zero velocity enters the fixed settle frame");
  controller.update(createFormalSnapshot({ x: 148, y: 212 }), 99);
  assert.equal(body.frame.name, 2);
  controller.update(createFormalSnapshot({ x: 148, y: 212 }), 1);
  assert.equal(body.frame.name, 0, "settle returns to idle at exactly 100ms");
  controller.update(createFormalSnapshot({ x: 148, y: 212, velocityX: -80 }), 0);
  assert.equal(body.flipX, false, "only negative velocityX changes body facing left");

  assert.equal(
    controller.notifyAttack({ angle: 0, weaponId: "tesla", heavy: true }),
    false,
    "an attack mismatch cannot switch the selected equipment"
  );
  assert.equal(controller.snapshot().formalAimAngle, Math.PI);
  assert.equal(controller.snapshot().formalVisualAimFacing, "left");
  assert.equal(
    controller.notifyAttack({ angle: 0, weaponId: "pistol", heavy: false }),
    true,
    "the first selected-weapon shot reaches the formal rig"
  );
  assert.equal(controller.snapshot().formalAimAngle, 0);
  assert.equal(controller.snapshot().formalVisualAimFacing, "right");
  assert.equal(aimFront.visible, false);
  assert.equal(recoilFront.visible, true, "gun and both hands enter recoil together");
  assert.equal(Math.floor(recoilFront.frame.name / 5), 0, "rightward aim selects direction zero");
  assert.equal(recoilFront.frame.name % 5, controller.snapshot().formalFrame);
  const origin = controller.getAttackEffectOrigin({ weaponId: "pistol", angle: 0 });
  assert.deepEqual(
    origin,
    { x: 179, y: 197, vfxType: "ballistic" },
    "the flash follows the muzzle baked into the active recoil pose"
  );
  assert.equal(Object.isFrozen(origin), true);
  assert.equal(
    controller.getAttackEffectOrigin({ weaponId: "tesla", angle: 0 }),
    null
  );
  assertGameplayStateUnchanged(gameplayBefore, scene, anchor, "formal rig");
});

test("formal body and equipment keep one integer foot anchor without whole-rig movement transforms", () => {
  const anchor = createAnchor();
  const scene = createScene({
    anchor,
    frameTotals: createFormalFrameTotals("pistol")
  });
  const controller = createPlayerPresentationController(scene, { anchor });
  const gameplayBefore = snapshotGameplayState(scene, anchor);

  const cases = [
    {
      label: "horizontal start at an arbitrary global phase",
      snapshot: createFormalSnapshot({
        x: 100.6,
        y: 200.4,
        velocityX: 80,
        elapsedMs: 777
      }),
      expectedFoot: [101, 212]
    },
    {
      label: "vertical travel at another global phase",
      snapshot: createFormalSnapshot({
        x: 99.2,
        y: 201.7,
        velocityY: -80,
        elapsedMs: 9_999
      }),
      expectedFoot: [99, 214]
    },
    {
      label: "settle at the same world position",
      snapshot: createFormalSnapshot({
        x: 99.2,
        y: 201.7,
        elapsedMs: 10_137
      }),
      expectedFoot: [99, 214]
    }
  ];

  for (const { label, snapshot, expectedFoot } of cases) {
    assert.equal(controller.update(snapshot, 0), true, label);
    const formalSprites = scene.created.slice(1);
    assert.equal(formalSprites.length, 5, label);
    for (const sprite of formalSprites) {
      assert.deepEqual([sprite.x, sprite.y], expectedFoot, label);
      assert.equal(sprite.rotation, 0, label);
    }
  }
  assert.equal(controller.snapshot().formalFrame, 2, "zero velocity keeps the authored settle frame");
  assertGameplayStateUnchanged(gameplayBefore, scene, anchor, "formal fixed foot anchor");
});

test("formal walk cadence uses the original fast stride during dash and normal travel", () => {
  const scene = createScene({ frameTotals: createFormalFrameTotals("pistol") });
  const controller = createPlayerPresentationController(scene);
  const gameplayBefore = snapshotGameplayState(scene, scene.player);
  const fastMovement = createFormalSnapshot({
    x: 100,
    y: 200,
    velocityX: 720,
    elapsedMs: 100,
    dashActive: true
  });

  controller.update(fastMovement, 0);
  controller.update(fastMovement, 0);
  assert.equal(controller.snapshot().formalFrame, 1);
  controller.update(fastMovement, 500);
  assert.equal(controller.snapshot().formalFrame, 1, "elapsed time alone cannot cycle the legs");
  controller.update(createFormalSnapshot({
    x: 112,
    y: 200,
    velocityX: 720,
    dashActive: true
  }), 0);
  assert.equal(controller.snapshot().formalFrame, 2, "12px of dash travel advances the fast cycle");
  controller.update(createFormalSnapshot({
    x: 124,
    y: 200,
    velocityX: 720,
    dashActive: true
  }), 0);
  assert.equal(controller.snapshot().formalFrame, 3);
  controller.update(createFormalSnapshot({
    x: 124,
    y: 200,
    velocityX: 220
  }), 0);
  assert.equal(controller.snapshot().formalFrame, 3, "normal travel continues from the dash cycle");
  controller.update(createFormalSnapshot({
    x: 135,
    y: 200,
    velocityX: 220
  }), 0);
  assert.equal(controller.snapshot().formalFrame, 3);
  controller.update(createFormalSnapshot({
    x: 136,
    y: 200,
    velocityX: 220
  }), 0);
  assert.equal(controller.snapshot().formalFrame, 4, "12px of normal travel advances once");
  controller.update(createFormalSnapshot({ x: 136, y: 200 }), 0);
  assert.equal(controller.snapshot().formalFrame, 2, "stopping enters the settle frame");
  controller.setPaused(true);
  controller.update(createFormalSnapshot({ x: 136, y: 200 }), 500);
  assert.equal(controller.snapshot().formalFrame, 2, "pause freezes settle time");
  controller.setPaused(false);
  controller.update(createFormalSnapshot({ x: 136, y: 200 }), 100);
  assert.equal(controller.snapshot().formalFrame, 0);
  assertGameplayStateUnchanged(gameplayBefore, scene, scene.player, "distance-driven formal locomotion");
});

test("formal recoil switches gun, hands and forearms together while the foot anchor stays planted", () => {
  const anchor = createAnchor();
  const scene = createScene({
    anchor,
    frameTotals: createFormalFrameTotals("pistol")
  });
  const controller = createPlayerPresentationController(scene, { anchor });
  const idleSnapshot = createFormalSnapshot();
  const gameplayBefore = snapshotGameplayState(scene, anchor);
  controller.update(idleSnapshot, 0);
  const formalSprites = scene.created.slice(1);
  const body = formalSprites.find(({ texture }) => texture.key === FORMAL_BODY_SHEET);
  const normalPoses = formalSprites.filter(({ texture }) => [
    TEXTURES.playerFoundationRifleAimBack,
    TEXTURES.playerFoundationRifleAimFront
  ].includes(texture.key));
  const recoilPoses = formalSprites.filter(({ texture }) => [
    TEXTURES.playerFoundationRifleAimRecoilBack,
    TEXTURES.playerFoundationRifleAimRecoilFront
  ].includes(texture.key));

  assert.equal(controller.notifyAttack({ angle: 0, weaponId: "pistol", heavy: false }), true);
  const recoil = scene.tweenCalls[0];
  assert.deepEqual(Object.keys(recoil.props), ["recoilPx"]);
  assert.equal(recoil.yoyo, false);
  assert.deepEqual(recoil.props.recoilPx, { from: 2, to: 0 });
  assert.equal(controller.snapshot().formalRecoilPx, 2, "the kick is visible on the firing frame");
  assert.equal(body.rotation, 0);
  assert.ok([...normalPoses, ...recoilPoses].every(({ rotation }) => rotation === 0));
  assert.ok(normalPoses.every(({ visible }) => visible === false));
  assert.ok(recoilPoses.every(({ visible }) => visible === true));
  controller.update(idleSnapshot, 0);

  assert.equal(controller.snapshot().formalRecoilPx, 2);
  assert.deepEqual([body.x, body.y], [100, 212], "the body foot pivot stays planted");
  assert.ok([...normalPoses, ...recoilPoses].every(({ x, y }) => x === 100 && y === 212));
  assertGameplayStateUnchanged(gameplayBefore, scene, anchor, "formal firing kick");

  recoil.complete();
  controller.update(idleSnapshot, 0);
  assert.equal(controller.snapshot().formalRecoilPx, 0);
  assert.equal(body.rotation, 0);
  assert.ok(normalPoses.every(({ visible }) => visible === true));
  assert.ok(recoilPoses.every(({ visible }) => visible === false));
});

test("formal complete pose follows sixteen aim directions while body facing remains movement-owned", () => {
  const anchor = createAnchor();
  const scene = createScene({ anchor, frameTotals: createFormalFrameTotals("pistol") });
  const controller = createPlayerPresentationController(scene, { anchor });
  controller.update(createFormalSnapshot({ velocityX: -80 }), 0);
  const recoilFront = scene.created.find(
    ({ texture }) => texture.key === TEXTURES.playerFoundationRifleAimRecoilFront
  );

  const poseFrames = [];
  for (const angle of [-Math.PI / 4, Math.PI / 4]) {
    assert.equal(controller.notifyAttack({ angle, weaponId: "pistol" }), true);
    assert.equal(controller.snapshot().formalAimAngle, angle);
    assert.equal(controller.snapshot().formalVisualAimFacing, "right");
    assert.equal(controller.snapshot().formalFacing, "left");
    assert.equal(recoilFront.rotation, 0, "the weapon cannot rotate away from its baked hands");
    poseFrames.push(recoilFront.frame.name);
  }
  assert.deepEqual(poseFrames, [70, 10], "the two diagonal attacks select different complete poses");

  assert.equal(controller.notifyAttack({ angle: Math.PI / 2, weaponId: "pistol" }), true);
  assert.equal(recoilFront.frame.name, 20);
  assert.equal(
    controller.snapshot().formalVisualAimFacing,
    "right",
    "the vertical dead band preserves the previous visual side"
  );

  const exactLeftAngle = Math.PI - 0.4;
  assert.equal(controller.notifyAttack({ angle: exactLeftAngle, weaponId: "pistol" }), true);
  assert.equal(controller.snapshot().formalAimAngle, exactLeftAngle);
  assert.equal(controller.snapshot().formalVisualAimFacing, "left");
  assert.equal(recoilFront.frame.name, 35);

  controller.update(createFormalSnapshot({ velocityX: 80 }), 0);
  assert.equal(controller.snapshot().formalFacing, "right");
  assert.equal(controller.snapshot().formalVisualAimFacing, "left");
  assert.equal(controller.snapshot().formalAimAngle, exactLeftAngle, "movement cannot overwrite the committed aim");
  assert.equal(recoilFront.flipX, true, "the complete pose mirrors with movement-owned body facing");
  assert.equal(Math.floor(recoilFront.frame.name / 5), 1, "mirroring remaps the same world aim into body-local direction one");
  assert.equal(recoilFront.frame.name % 5, controller.snapshot().formalFrame);
});

test("formal attack-origin query uses the next quantized muzzle without committing aim or recoil", () => {
  const anchor = createAnchor();
  const scene = createScene({
    anchor,
    frameTotals: createFormalFrameTotals("tesla")
  });
  const controller = createPlayerPresentationController(scene, { anchor });
  controller.update(createFormalSnapshot({
    selectedWeaponId: "tesla",
    velocityX: -80
  }), 0);
  const aimFront = scene.created.find(
    ({ texture }) => texture.key === TEXTURES.playerTeslaEmitterAimFront
  );
  const recoilFront = scene.created.find(
    ({ texture }) => texture.key === TEXTURES.playerTeslaEmitterAimRecoilFront
  );

  assert.equal(controller.snapshot().formalVisualAimFacing, "left");
  assert.equal(controller.snapshot().formalAimAngle, Math.PI);
  assert.equal(aimFront.frame.name, 40);
  assert.deepEqual(
    controller.getAttackEffectOrigin({ weaponId: "tesla", angle: 0 }),
    { x: 130, y: 186, vfxType: "tesla" }
  );
  assert.equal(scene.tweenCalls.length, 0, "origin lookup cannot allocate recoil");
  assert.equal(controller.snapshot().formalVisualAimFacing, "left");
  assert.equal(controller.snapshot().formalAimAngle, Math.PI, "origin lookup cannot commit the next aim");
  assert.equal(aimFront.frame.name, 40, "origin lookup cannot switch the visible pose");

  assert.equal(
    controller.notifyAttack({ angle: 0, weaponId: "tesla", heavy: true }),
    true
  );
  assert.equal(controller.snapshot().formalVisualAimFacing, "right");
  assert.equal(aimFront.visible, false);
  assert.equal(recoilFront.visible, true);
  assert.equal(recoilFront.frame.name, 0);
  assert.equal(scene.tweenCalls.length, 1);
});

test("formal Tesla sustain updates its complete aim pose without creating another recoil tween", () => {
  const anchor = createAnchor();
  const scene = createScene({
    anchor,
    frameTotals: createFormalFrameTotals("tesla")
  });
  const controller = createPlayerPresentationController(scene, { anchor });
  controller.update(createFormalSnapshot({
    selectedWeaponId: "tesla",
    velocityX: -80
  }), 0);
  const aimFront = scene.created.find(
    ({ texture }) => texture.key === TEXTURES.playerTeslaEmitterAimFront
  );

  assert.equal(controller.updateAim({ angle: 0, weaponId: "tesla" }), true);
  assert.equal(controller.snapshot().formalAimAngle, 0);
  assert.equal(controller.snapshot().formalVisualAimFacing, "right");
  assert.equal(aimFront.visible, true);
  assert.equal(aimFront.frame.name, 0);
  assert.equal(scene.tweenCalls.length, 0, "sustain aim never creates a recoil tween");
  assert.equal(controller.snapshot().formalRecoilPx, 0);

  assert.equal(controller.updateAim({ angle: Math.PI, weaponId: "pistol" }), false);
  assert.equal(controller.snapshot().formalAimAngle, 0, "a different weapon cannot steer the selected rig");
  assert.equal(scene.tweenCalls.length, 0);
});

test("switching pistol to Tesla and back atomically replaces the complete formal rig", () => {
  const anchor = createAnchor();
  const scene = createScene({
    anchor,
    frameTotals: {
      ...createFormalFrameTotals("pistol"),
      ...Object.fromEntries(formalEquipmentTextureEntries("tesla"))
    }
  });
  const controller = createPlayerPresentationController(scene, { anchor });
  const gameplayBefore = snapshotGameplayState(scene, anchor);
  const pistolSnapshot = createFormalSnapshot({ selectedWeaponId: "pistol" });
  const teslaSnapshot = createFormalSnapshot({ selectedWeaponId: "tesla" });

  assert.equal(controller.update(pistolSnapshot, 0), true);
  const firstPistolRig = scene.created.slice(1);
  assert.equal(controller.notifyAttack({ angle: 0, weaponId: "pistol" }), true);
  const pistolTween = scene.tweenCalls[0];
  controller.setPaused(true);
  assert.ok(firstPistolRig.every(({ anims }) => anims.paused === true));

  assert.equal(controller.update(teslaSnapshot, 0), true);
  assert.equal(controller.snapshot().formalWeaponId, "tesla");
  assert.ok(firstPistolRig.every(({ active }) => active === false), "the old pistol rig is fully destroyed");
  assert.equal(pistolTween.calls.remove, 1, "the old pistol recoil tween is released before Tesla activation");
  const teslaRig = scene.created.slice(1).filter(({ active }) => active);
  assert.equal(teslaRig.length, 6, "only Tesla's body, power module, and complete pose layers survive");
  assert.ok(teslaRig.every(({ anims }) => anims.paused === true), "a paused controller pauses the replacement Tesla rig");
  const teslaOrigin = controller.getAttackEffectOrigin({ weaponId: "tesla", angle: 0 });
  assert.equal(teslaOrigin?.vfxType, "tesla");
  assert.equal(Number.isFinite(teslaOrigin?.x), true);
  assert.equal(Number.isFinite(teslaOrigin?.y), true);

  controller.setPaused(false);
  assert.ok(teslaRig.every(({ anims }) => anims.paused === false), "resume reaches the replacement Tesla rig once");
  assert.equal(controller.update(pistolSnapshot, 0), true);
  assert.equal(controller.snapshot().formalWeaponId, "pistol");
  assert.ok(teslaRig.every(({ active }) => active === false), "the old Tesla rig is fully destroyed");
  const secondPistolRig = scene.created.slice(1).filter(({ active }) => active);
  assert.equal(secondPistolRig.length, 5, "only the replacement pistol complete pose survives");
  const pistolOrigin = controller.getAttackEffectOrigin({ weaponId: "pistol", angle: 0 });
  assert.equal(pistolOrigin?.vfxType, "ballistic");
  assert.equal(Number.isFinite(pistolOrigin?.x), true);
  assert.equal(Number.isFinite(pistolOrigin?.y), true);
  assertGameplayStateUnchanged(gameplayBefore, scene, anchor, "formal weapon switches");
});

test("a missing Tesla rig leaves complete legacy once and can recover when pistol is selected", () => {
  const anchor = createAnchor();
  const missingTeslaTexture = TEXTURES.playerTeslaEmitterAimFront;
  const scene = createScene({
    anchor,
    frameTotals: {
      ...createFormalFrameTotals("pistol"),
      ...Object.fromEntries(
        formalEquipmentTextureEntries("tesla").filter(([key]) => key !== missingTeslaTexture)
      )
    }
  });
  const controller = createPlayerPresentationController(scene, { anchor });
  const gameplayBefore = snapshotGameplayState(scene, anchor);
  const legacy = scene.created[0];
  const pistolSnapshot = createFormalSnapshot({ selectedWeaponId: "pistol" });
  const missingTeslaSnapshot = createFormalSnapshot({ selectedWeaponId: "tesla" });

  assert.equal(controller.update(pistolSnapshot, 0), true);
  const firstPistolRig = scene.created.slice(1);
  assert.equal(controller.notifyAttack({ angle: 0, weaponId: "pistol" }), true);
  const pistolTween = scene.tweenCalls[0];
  controller.setPaused(true);
  assert.ok(firstPistolRig.every(({ anims }) => anims.paused === true));

  assert.equal(controller.update(missingTeslaSnapshot, 0), true);
  assert.equal(controller.snapshot().formalRig, false);
  assert.equal(controller.snapshot().mode, "legacy");
  assert.equal(legacy.visible, true, "legacy remains complete when the replacement rig cannot activate");
  assert.equal(legacy.anims.paused, true, "failed replacement keeps restored legacy paused");
  assert.ok(firstPistolRig.every(({ active }) => active === false), "the old pistol rig is fully destroyed");
  assert.equal(pistolTween.calls.remove, 1, "the old recoil tween is released before legacy restoration");
  const allocationsAfterMissingTesla = scene.created.length;
  assert.equal(controller.update(missingTeslaSnapshot, 16), true);
  assert.equal(scene.created.length, allocationsAfterMissingTesla, "the same failed Tesla ID is not retried every frame");

  assert.equal(controller.update(pistolSnapshot, 0), true);
  assert.equal(controller.snapshot().formalWeaponId, "pistol");
  assert.equal(legacy.visible, false, "a later available weapon can replace the restored legacy visual");
  const replacementPistolRig = scene.created.slice(1).filter(({ active }) => active);
  assert.equal(replacementPistolRig.length, 5, "only the recovered pistol complete pose survives");
  assert.ok(replacementPistolRig.every(({ anims }) => anims.paused === true), "a paused controller pauses the recovered pistol rig");
  controller.setPaused(false);
  assert.ok(replacementPistolRig.every(({ anims }) => anims.paused === false), "resume reaches the recovered pistol rig once");
  assert.equal(controller.getAttackEffectOrigin({ weaponId: "pistol", angle: 0 })?.vfxType, "ballistic");
  assertGameplayStateUnchanged(gameplayBefore, scene, anchor, "missing Tesla switch recovery");
});

test("a formal body without five visible frames plus __BASE atomically leaves only the complete legacy player", () => {
  const frameTotals = createFormalFrameTotals("pistol");
  frameTotals[FORMAL_BODY_SHEET] = 5;
  const scene = createScene({ frameTotals });
  const controller = createPlayerPresentationController(scene, { anchor: scene.player });

  assert.equal(controller.update(createFormalSnapshot({ selectedWeaponId: "pistol" }), 0), true);
  assert.equal(controller.snapshot().mode, "legacy");
  assert.equal(controller.snapshot().formalRig, false);
  assert.equal(scene.created[0].texture.key, LEGACY_SHEET);
  assert.equal(scene.created[0].visible, true);
  assert.equal(scene.created.length - 1, 0, "no formal sprite survives a preflight failure");
  assert.equal(scene.graphicsCreated.length, 0, "no formal graphics survive a preflight failure");
});

test("formal activation and render failures restore complete legacy once without retrying the same weapon", () => {
  for (const [weaponId, omittedKey] of [
    ["pistol", FORMAL_BODY_SHEET],
    ["pistol", TEXTURES.playerFoundationRifleAimFront],
    ["tesla", TEXTURES.playerTeslaEmitterAimRecoilBack]
  ]) {
    const anchor = createAnchor();
    const scene = createScene({
      anchor,
      frameTotals: createFormalFrameTotals(weaponId, omittedKey)
    });
    const controller = createPlayerPresentationController(scene, { anchor });
    const legacy = scene.created[0];
    const snapshot = createFormalSnapshot({ selectedWeaponId: weaponId });

    assert.equal(controller.update(snapshot, 0), true);
    assert.equal(controller.snapshot().mode, "legacy", `${omittedKey}: legacy remains active`);
    assert.equal(controller.snapshot().formalRig, false);
    assert.equal(legacy.visible, true);
    assert.equal(scene.created.length - 1, 0, `${omittedKey}: no formal sprite survives preflight`);
    assert.equal(scene.graphicsCreated.length, 0, `${omittedKey}: no formal graphics survive preflight`);
    const allocationsAfterFailure = scene.created.length;
    controller.update(snapshot, 16);
    assert.equal(
      scene.created.length,
      allocationsAfterFailure,
      `${omittedKey}: the same failed weapon is not allocated every frame`
    );
  }

  const allocated = [];
  const partialScene = createScene({
    frameTotals: createFormalFrameTotals("pistol"),
    spriteFactory: ({ textureKey }) => {
      const sprite = createSpriteDouble({ textureKey });
      if (textureKey === TEXTURES.playerFoundationRifleAimFront) {
        delete sprite.setDepth;
      }
      allocated.push(sprite);
      return sprite;
    }
  });
  const partialController = createPlayerPresentationController(partialScene);
  partialController.update(createFormalSnapshot(), 0);
  assert.equal(partialController.snapshot().mode, "legacy");
  assert.equal(partialScene.created[0].visible, true);
  assert.ok(
    allocated.slice(1).every((object) => object.active === false),
    "partial body/complete-pose allocation is destroyed before legacy remains visible"
  );

  let formalBody = null;
  const runtimeScene = createScene({
    frameTotals: createFormalFrameTotals("pistol"),
    spriteFactory: ({ textureKey }) => {
      const sprite = createSpriteDouble({
        textureKey,
        throwOnSetFrameCall: textureKey === FORMAL_BODY_SHEET ? 2 : -1
      });
      if (textureKey === FORMAL_BODY_SHEET) formalBody = sprite;
      return sprite;
    }
  });
  const runtimeController = createPlayerPresentationController(runtimeScene);
  const snapshot = createFormalSnapshot();
  runtimeController.update(snapshot, 0);
  const allocationsBeforeFailure = runtimeScene.created.length;
  assert.equal(runtimeController.update(snapshot, 16), true);
  assert.equal(runtimeController.snapshot().fallback, false, "formal failure is not anchor fallback");
  assert.equal(runtimeController.snapshot().mode, "legacy");
  assert.equal(runtimeScene.created[0].visible, true);
  assert.equal(formalBody.active, false);
  runtimeController.update(snapshot, 16);
  assert.equal(runtimeScene.created.length, allocationsBeforeFailure);
});

test("formal feedback freezes and resumes owned state and repeated destroy releases every formal object", () => {
  const anchor = createAnchor();
  const scene = createScene({
    anchor,
    frameTotals: createFormalFrameTotals("tesla"),
    graphicsFactory: () => createGraphicsDouble({ includeTint: false })
  });
  const controller = createPlayerPresentationController(scene, { anchor });
  const snapshot = createFormalSnapshot({ selectedWeaponId: "tesla", velocityX: 80 });
  controller.update(snapshot, 0);
  const formalObjects = [...scene.created.slice(1), ...scene.graphicsCreated];
  assert.equal(formalObjects.length, 6, "Tesla owns body, pack and four complete pose layers");
  assert.equal(scene.graphicsCreated.length, 0, "approved baked arms replace runtime Graphics lines");

  assert.equal(controller.setAlpha(0.35), true);
  assert.ok(formalObjects.every((object) => object.alpha === 0.35));
  assert.equal(controller.notifyHit({ atMs: 0, durationMs: 120, tint: 0xff1122 }), true);
  const formalSprites = scene.created.slice(1);
  assert.ok(formalSprites.every((object) => object.tint === 0xff1122));

  assert.equal(
    controller.notifyAttack({ angle: Math.PI / 2, weaponId: "tesla", heavy: true }),
    true
  );
  const tween = scene.tweenCalls[0];
  controller.update(snapshot, 0);
  const frameAtPause = controller.snapshot().formalFrame;
  assert.equal(controller.snapshot().formalRecoilPx, 3);

  controller.setPaused(true);
  assert.equal(tween.calls.pause, 1);
  assert.equal(tween.calls.remove, 0);
  assert.equal(scene.delayedCalls[0].paused, true);
  controller.update(snapshot, 500);
  assert.equal(controller.snapshot().formalFrame, frameAtPause);
  assert.equal(controller.snapshot().formalRecoilPx, 3);

  controller.setPaused(false);
  assert.equal(tween.calls.resume, 1);
  assert.equal(scene.delayedCalls[0].paused, false);
  assert.equal(controller.snapshot().formalRecoilPx, 3);
  scene.delayedCalls[0].callback();
  assert.ok(formalSprites.every((object) => object.tint === null));

  controller.notifyHit({ atMs: 0, durationMs: 120 });
  controller.destroy();
  controller.destroy();
  assert.equal(scene.delayedCalls[1].removed, true);
  assert.equal(tween.calls.remove, 1);
  assert.ok(formalObjects.every((object) => object.active === false));
  assert.equal(anchor.visible, true);
});

test("formal pause failure releases the rig and pauses restored legacy before considering anchor fallback", () => {
  const fixture = createActiveFormalFixture();
  fixture.formalBody.anims.pause = () => { throw new Error("formal pause failed"); };

  assert.doesNotThrow(() => fixture.controller.setPaused(true));
  assert.equal(fixture.controller.snapshot().fallback, false);
  assert.equal(fixture.controller.snapshot().mode, "legacy");
  assert.equal(fixture.legacy.visible, true);
  assert.equal(fixture.legacy.anims.paused, true);
  assert.equal(fixture.anchor.visible, false);
  assert.ok(fixture.formalObjects.every(({ active }) => active === false));

  const doubleFailure = createActiveFormalFixture();
  doubleFailure.formalBody.anims.pause = () => { throw new Error("formal pause failed"); };
  doubleFailure.legacy.anims.pause = () => { throw new Error("legacy pause failed"); };
  doubleFailure.controller.setPaused(true);
  assert.equal(doubleFailure.controller.snapshot().fallback, true);
  assert.equal(doubleFailure.anchor.visible, true);
});

test("formal initial hit-tint failure retries complete legacy before considering anchor fallback", () => {
  const fixture = createActiveFormalFixture();
  fixture.formalBody.setTint = () => { throw new Error("formal tint failed"); };

  assert.equal(
    fixture.controller.notifyHit({ atMs: 0, durationMs: 120, tint: 0xff3344 }),
    true
  );
  assert.equal(fixture.controller.snapshot().fallback, false);
  assert.equal(fixture.controller.snapshot().mode, "legacy");
  assert.equal(fixture.legacy.visible, true);
  assert.equal(fixture.legacy.tint, 0xff3344);
  assert.equal(fixture.anchor.visible, false);
  assert.ok(fixture.formalObjects.every(({ active }) => active === false));

  const doubleFailure = createActiveFormalFixture();
  doubleFailure.formalBody.setTint = () => { throw new Error("formal tint failed"); };
  doubleFailure.legacy.setTint = () => { throw new Error("legacy tint failed"); };
  assert.equal(doubleFailure.controller.notifyHit({ atMs: 0 }), false);
  assert.equal(doubleFailure.controller.snapshot().fallback, true);
  assert.equal(doubleFailure.anchor.visible, true);
});

test("formal alpha failure retries complete legacy before considering anchor fallback", () => {
  const fixture = createActiveFormalFixture();
  fixture.formalBody.setAlpha = () => { throw new Error("formal alpha failed"); };

  assert.equal(fixture.controller.setAlpha(0.4), true);
  assert.equal(fixture.controller.snapshot().fallback, false);
  assert.equal(fixture.controller.snapshot().mode, "legacy");
  assert.equal(fixture.legacy.visible, true);
  assert.equal(fixture.legacy.alpha, 0.4);
  assert.equal(fixture.anchor.visible, false);
  assert.ok(fixture.formalObjects.every(({ active }) => active === false));

  const doubleFailure = createActiveFormalFixture();
  doubleFailure.formalBody.setAlpha = () => { throw new Error("formal alpha failed"); };
  doubleFailure.legacy.setAlpha = () => { throw new Error("legacy alpha failed"); };
  assert.equal(doubleFailure.controller.setAlpha(0.4), false);
  assert.equal(doubleFailure.controller.snapshot().fallback, true);
  assert.equal(doubleFailure.anchor.visible, true);
});

test("paused formal alpha downgrade keeps the restored legacy animation paused", () => {
  const fixture = createActiveFormalFixture();
  fixture.controller.setPaused(true);
  assert.equal(fixture.controller.snapshot().paused, true);
  assert.equal(fixture.formalBody.anims.paused, true);
  assert.equal(fixture.legacy.anims.paused, false, "hidden legacy was not paused eagerly");
  fixture.formalBody.setAlpha = () => { throw new Error("formal alpha failed"); };

  assert.equal(fixture.controller.setAlpha(0.4), true);
  assert.equal(fixture.controller.snapshot().fallback, false);
  assert.equal(fixture.controller.snapshot().mode, "legacy");
  assert.equal(fixture.controller.snapshot().paused, true);
  assert.equal(fixture.legacy.visible, true);
  assert.equal(fixture.legacy.alpha, 0.4);
  assert.equal(fixture.legacy.anims.paused, true);
  assert.equal(fixture.anchor.visible, false);
  assert.ok(fixture.formalObjects.every(({ active }) => active === false));
});

test("destroy is idempotent and snapshot contains only inert serializable state", () => {
  const scene = createScene();
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player
  });
  const visual = scene.created[0];
  const body = scene.player.body;
  const snapshot = controller.snapshot();

  assert.equal(Object.isFrozen(snapshot), true);
  assertSnapshotHasNoRuntimeReferences(
    snapshot,
    new Set([scene, scene.player, body, visual])
  );

  controller.destroy();
  controller.destroy();

  assert.equal(visual.calls.destroy, 1);
  assert.equal(scene.player.visible, true);
  assert.equal(
    controller.update(createPlayerPresentationSnapshot(scene), 16),
    false,
    "a destroyed controller reports no update"
  );
});
