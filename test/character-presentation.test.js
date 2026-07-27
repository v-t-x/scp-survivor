import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  CHARACTER_PROFILES,
  DEFAULT_CHARACTER_ID,
  getCharacterAnimationKey,
  getFacingFromVector,
  getPlayerMotion,
  registerOpeningCharacterAnimations,
  resolveCharacterPresentation,
  syncCharacterPresentation
} from "../src/art/characterPresentation.js";
import { TEXTURES } from "../src/assets/manifest.js";

const LEGACY_SHEET = TEXTURES.playerOpeningSheet;
const PROTOTYPE_SHEET = TEXTURES.playerResponseOperativePrototypeSheet;
const PRODUCTION_SHEET = TEXTURES.playerResponseOperativeSheet;
const STATIC_TEXTURE = TEXTURES.player;

const FACING_NAMES = ["down", "left", "right", "up"];
const FACING_ANGLES = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
const LOCOMOTION_MOTIONS = ["idle", "forward", "backward", "strafeLeft", "strafeRight"];
const ALL_MOTIONS = [...LOCOMOTION_MOTIONS, "hit"];
const LEGACY_MOTIONS = ["idle", "move", "hit"];

function legacyKey(motion, facing) {
  return `${DEFAULT_CHARACTER_ID}-legacy-${motion}-${facing}`;
}

function prototypeKey(motion) {
  return `${DEFAULT_CHARACTER_ID}-prototype-${motion}-down`;
}

function productionKey(motion, facing) {
  return `${DEFAULT_CHARACTER_ID}-production-${motion}-${facing}`;
}

function createAnimationScene({ frameTotals = {}, throwOnCreateIndex = -1 } = {}) {
  const created = [];
  const removed = [];
  const warnings = [];
  const existing = new Set();
  let createCalls = 0;
  return {
    created,
    removed,
    warnings,
    existing,
    textures: {
      exists: (key) => Object.hasOwn(frameTotals, key),
      get: (key) => ({ frameTotal: frameTotals[key] })
    },
    anims: {
      exists: (key) => existing.has(key),
      remove: (key) => {
        existing.delete(key);
        removed.push(key);
      },
      generateFrameNumbers: (sheetKey, range) => ({ sheetKey, ...range }),
      create: (config) => {
        createCalls += 1;
        if (createCalls === throwOnCreateIndex) {
          throw new Error(`animation create failure at call ${createCalls}`);
        }
        existing.add(config.key);
        created.push(config);
      }
    },
    console: {
      warn: (message) => warnings.push(message)
    }
  };
}

const FRAME_SIZES = {
  [LEGACY_SHEET]: 48,
  [PROTOTYPE_SHEET]: 64,
  [PRODUCTION_SHEET]: 64,
  [STATIC_TEXTURE]: 48
};

function createPlayerSprite({ textureKey, animationFamily, scale }) {
  const sprite = {
    x: 120,
    y: 80,
    active: true,
    isDying: false,
    isTinted: false,
    flipX: false,
    texture: { key: textureKey },
    characterId: DEFAULT_CHARACTER_ID,
    presentationAnimationFamily: animationFamily,
    presentationFacing: "down",
    scaleX: scale,
    scaleY: scale,
    width: FRAME_SIZES[textureKey],
    height: FRAME_SIZES[textureKey],
    displayOriginX: FRAME_SIZES[textureKey] / 2,
    displayOriginY: FRAME_SIZES[textureKey] / 2,
    anims: { currentAnim: null },
    played: [],
    setFlipX(value) {
      this.flipX = value;
      return this;
    },
    play(key) {
      this.played.push(key);
      this.anims.currentAnim = { key };
      return this;
    },
    setTexture(key) {
      this.texture.key = key;
      this.width = FRAME_SIZES[key];
      this.height = FRAME_SIZES[key];
      this.displayOriginX = FRAME_SIZES[key] / 2;
      this.displayOriginY = FRAME_SIZES[key] / 2;
      return this;
    },
    setScale(value) {
      this.scaleX = value;
      this.scaleY = value;
      return this;
    }
  };
  const sourceSize = 24 / scale;
  sprite.body = {
    sourceWidth: sourceSize,
    sourceHeight: sourceSize,
    width: 24,
    height: 24,
    isCircle: false,
    radius: 0,
    offset: {
      x: (FRAME_SIZES[textureKey] - sourceSize) / 2,
      y: (FRAME_SIZES[textureKey] - sourceSize) / 2,
      set(x, y) {
        this.x = x;
        this.y = y;
      }
    },
    position: { x: 0, y: 0 },
    velocity: {
      x: 0,
      y: 0,
      lengthSq() {
        return this.x * this.x + this.y * this.y;
      }
    },
    updateFromGameObject() {
      this.width = this.sourceWidth * Math.abs(sprite.scaleX);
      this.height = this.sourceHeight * Math.abs(sprite.scaleY);
      this.position.x = sprite.x + sprite.scaleX * (this.offset.x - sprite.displayOriginX);
      this.position.y = sprite.y + sprite.scaleY * (this.offset.y - sprite.displayOriginY);
    }
  };
  sprite.body.updateFromGameObject();
  return sprite;
}

function snapshotBodyGeometry(sprite) {
  return {
    width: sprite.body.width,
    height: sprite.body.height,
    positionX: sprite.body.position.x,
    positionY: sprite.body.position.y
  };
}

function assertBodyGeometryPreserved(sprite, before, context) {
  const tolerance = 1e-9;
  const after = snapshotBodyGeometry(sprite);
  for (const field of ["width", "height", "positionX", "positionY"]) {
    assert.ok(
      Math.abs(after[field] - before[field]) < tolerance,
      `${context}: body ${field} changed from ${before[field]} to ${after[field]}`
    );
  }
}

function velocityForMotion(motion, angle) {
  const speed = 2;
  const forwardX = Math.cos(angle);
  const forwardY = Math.sin(angle);
  switch (motion) {
    case "forward":
    case "hit":
      return { x: forwardX * speed, y: forwardY * speed };
    case "backward":
      return { x: -forwardX * speed, y: -forwardY * speed };
    case "strafeRight":
      return { x: -forwardY * speed, y: forwardX * speed };
    case "strafeLeft":
      return { x: forwardY * speed, y: -forwardX * speed };
    default:
      return { x: 0, y: 0 };
  }
}

function expectedPrototypeSync(facing, motion) {
  if (facing === "down" && motion !== "hit") {
    return {
      textureKey: PROTOTYPE_SHEET,
      scale: 1,
      flipX: false,
      key: prototypeKey(motion)
    };
  }
  const mapped = motion === "hit" ? "hit" : motion === "idle" ? "idle" : "move";
  return {
    textureKey: LEGACY_SHEET,
    scale: 1.2,
    flipX: facing === "right",
    key: legacyKey(mapped, facing)
  };
}

test("character registry exposes the frozen default response operative profile", () => {
  assert.equal(DEFAULT_CHARACTER_ID, "foundation-response-operative");
  assert.deepEqual(CHARACTER_PROFILES[DEFAULT_CHARACTER_ID], {
    prototypeSheetKey: TEXTURES.playerResponseOperativePrototypeSheet,
    productionSheetKey: TEXTURES.playerResponseOperativeSheet,
    fallbackSheetKey: TEXTURES.playerOpeningSheet,
    fallbackTextureKey: TEXTURES.player,
    frameWidth: 64,
    frameHeight: 64,
    prototypeFrameCount: 28,
    productionFrameCount: 120,
    displayScale: 1,
    fallbackDisplayScale: 1.2
  });
  assert.equal(Object.isFrozen(CHARACTER_PROFILES), true);
  assert.equal(Object.isFrozen(CHARACTER_PROFILES[DEFAULT_CHARACTER_ID]), true);
});

test("player motion classifier projects velocity onto the committed facing", () => {
  assert.equal(getPlayerMotion({ velocityX: 0, velocityY: 0, facingAngle: 0 }), "idle");
  assert.equal(getPlayerMotion({ velocityX: 2, velocityY: 0, facingAngle: 0 }), "forward");
  assert.equal(getPlayerMotion({ velocityX: -2, velocityY: 0, facingAngle: 0 }), "backward");
  assert.equal(getPlayerMotion({ velocityX: 0, velocityY: 2, facingAngle: 0 }), "strafeRight");
  assert.equal(getPlayerMotion({ velocityX: 0, velocityY: -2, facingAngle: 0 }), "strafeLeft");
  assert.equal(getPlayerMotion({ velocityX: 2, velocityY: 2, facingAngle: 0 }), "forward");
});

test("animation keys are namespaced per family and validate their domain", () => {
  assert.equal(
    getCharacterAnimationKey({
      characterId: DEFAULT_CHARACTER_ID,
      animationFamily: "production",
      motion: "backward",
      facing: "right"
    }),
    "foundation-response-operative-production-backward-right"
  );
  for (const facing of FACING_NAMES) {
    for (const motion of ALL_MOTIONS) {
      assert.equal(
        getCharacterAnimationKey({ characterId: DEFAULT_CHARACTER_ID, animationFamily: "production", motion, facing }),
        productionKey(motion, facing)
      );
    }
    for (const motion of LEGACY_MOTIONS) {
      assert.equal(
        getCharacterAnimationKey({ characterId: DEFAULT_CHARACTER_ID, animationFamily: "legacy", motion, facing }),
        legacyKey(motion, facing)
      );
    }
  }
  for (const motion of LOCOMOTION_MOTIONS) {
    assert.equal(
      getCharacterAnimationKey({ characterId: DEFAULT_CHARACTER_ID, animationFamily: "prototype", motion, facing: "down" }),
      prototypeKey(motion)
    );
  }
  assert.throws(
    () => getCharacterAnimationKey({ characterId: DEFAULT_CHARACTER_ID, animationFamily: "prototype", motion: "hit", facing: "down" }),
    RangeError,
    "prototype has no hit row"
  );
  for (const facing of ["left", "right", "up"]) {
    assert.throws(
      () => getCharacterAnimationKey({ characterId: DEFAULT_CHARACTER_ID, animationFamily: "prototype", motion: "idle", facing }),
      RangeError,
      `prototype has no ${facing} row`
    );
  }
  assert.throws(
    () => getCharacterAnimationKey({ characterId: DEFAULT_CHARACTER_ID, animationFamily: "legacy", motion: "forward", facing: "down" }),
    RangeError,
    "legacy keeps the idle/move/hit contract"
  );
  assert.throws(
    () => getCharacterAnimationKey({ characterId: DEFAULT_CHARACTER_ID, animationFamily: "static", motion: "idle", facing: "down" }),
    RangeError,
    "static textures own no animation keys"
  );
});

test("character facing preserves the last direction while idle", () => {
  assert.equal(getFacingFromVector(1, 0, "down"), "right");
  assert.equal(getFacingFromVector(-1, 0, "down"), "left");
  assert.equal(getFacingFromVector(0, -1, "down"), "up");
  assert.equal(getFacingFromVector(0, 1, "up"), "down");
  assert.equal(getFacingFromVector(0, 0, "left"), "left");
});

test("registration creates legacy twelve, prototype five and production twenty-four animations in order", () => {
  const scene = createAnimationScene({
    frameTotals: { [LEGACY_SHEET]: 49, [PROTOTYPE_SHEET]: 29, [PRODUCTION_SHEET]: 121 }
  });

  registerOpeningCharacterAnimations(scene);

  assert.equal(scene.created.length, 41);
  assert.deepEqual(
    scene.created.map((animation) => animation.key),
    [
      ...FACING_NAMES.flatMap((facing) => LEGACY_MOTIONS.map((motion) => legacyKey(motion, facing))),
      ...LOCOMOTION_MOTIONS.map((motion) => prototypeKey(motion)),
      ...FACING_NAMES.flatMap((facing) => ALL_MOTIONS.map((motion) => productionKey(motion, facing)))
    ]
  );

  const byKey = new Map(scene.created.map((animation) => [animation.key, animation]));
  assert.deepEqual(byKey.get(legacyKey("idle", "down")).frames, { sheetKey: LEGACY_SHEET, start: 0, end: 3 });
  assert.deepEqual(byKey.get(legacyKey("move", "left")).frames, { sheetKey: LEGACY_SHEET, start: 16, end: 21 });
  assert.deepEqual(
    byKey.get(legacyKey("move", "right")).frames,
    byKey.get(legacyKey("move", "left")).frames,
    "legacy right-facing rows keep the historical left-row mirror"
  );
  assert.deepEqual(byKey.get(legacyKey("hit", "up")).frames, { sheetKey: LEGACY_SHEET, start: 46, end: 47 });
  assert.equal(byKey.get(legacyKey("hit", "down")).repeat, 0);
  assert.equal(byKey.get(legacyKey("move", "down")).repeat, -1);

  assert.deepEqual(byKey.get(prototypeKey("idle")).frames, { sheetKey: PROTOTYPE_SHEET, start: 0, end: 3 });
  assert.deepEqual(byKey.get(prototypeKey("forward")).frames, { sheetKey: PROTOTYPE_SHEET, start: 4, end: 9 });
  assert.deepEqual(byKey.get(prototypeKey("backward")).frames, { sheetKey: PROTOTYPE_SHEET, start: 10, end: 15 });
  assert.deepEqual(byKey.get(prototypeKey("strafeLeft")).frames, { sheetKey: PROTOTYPE_SHEET, start: 16, end: 21 });
  assert.deepEqual(byKey.get(prototypeKey("strafeRight")).frames, { sheetKey: PROTOTYPE_SHEET, start: 22, end: 27 });
  const prototypeKeys = scene.created.map(({ key }) => key).filter((key) => key.includes("-prototype-"));
  assert.equal(prototypeKeys.length, 5);
  assert.equal(prototypeKeys.some((key) => key.includes("hit")), false, "prototype registers no hit animation");
  assert.equal(prototypeKeys.every((key) => key.endsWith("-down")), true, "prototype registers only down animations");

  assert.deepEqual(byKey.get(productionKey("idle", "down")).frames, { sheetKey: PRODUCTION_SHEET, start: 0, end: 3 });
  assert.deepEqual(
    byKey.get(productionKey("backward", "right")).frames,
    { sheetKey: PRODUCTION_SHEET, start: 70, end: 75 },
    "production right uses the real third row"
  );
  assert.deepEqual(byKey.get(productionKey("hit", "up")).frames, { sheetKey: PRODUCTION_SHEET, start: 118, end: 119 });
  assert.equal(byKey.get(productionKey("hit", "down")).repeat, 0);
  assert.equal(byKey.get(productionKey("forward", "left")).frameRate, 8);
  assert.equal(byKey.get(productionKey("idle", "left")).frameRate, 4);
  assert.deepEqual(scene.warnings, []);
});

test("completed registration is idempotent and never duplicates keys", () => {
  const scene = createAnimationScene({
    frameTotals: { [LEGACY_SHEET]: 49, [PROTOTYPE_SHEET]: 29, [PRODUCTION_SHEET]: 121 }
  });

  registerOpeningCharacterAnimations(scene);
  registerOpeningCharacterAnimations(scene);

  assert.equal(scene.created.length, 41);
  assert.deepEqual(scene.removed, []);
  assert.equal(scene.existing.size, 41);
  assert.deepEqual(scene.warnings, []);
});

test("wrong frame totals fail preflight without partial registration", () => {
  for (const prototypeTotal of [28, 30]) {
    const scene = createAnimationScene({
      frameTotals: { [LEGACY_SHEET]: 49, [PROTOTYPE_SHEET]: prototypeTotal, [PRODUCTION_SHEET]: 121 }
    });
    registerOpeningCharacterAnimations(scene);
    assert.equal(scene.created.length, 36, `prototype frameTotal ${prototypeTotal}`);
    assert.equal(scene.created.some(({ key }) => key.includes("-prototype-")), false);
    assert.equal(scene.warnings.length, 1);
    assert.match(scene.warnings[0], new RegExp(PROTOTYPE_SHEET));
  }

  for (const productionTotal of [120, 122]) {
    const scene = createAnimationScene({
      frameTotals: { [LEGACY_SHEET]: 49, [PRODUCTION_SHEET]: productionTotal }
    });
    registerOpeningCharacterAnimations(scene);
    assert.equal(scene.created.length, 12, `production frameTotal ${productionTotal}`);
    assert.equal(scene.created.some(({ key }) => key.includes("-production-")), false);
    assert.equal(scene.warnings.length, 1);
    assert.match(scene.warnings[0], new RegExp(PRODUCTION_SHEET));
  }
});

test("a failing prototype batch rolls back only its own created keys", () => {
  const scene = createAnimationScene({
    frameTotals: { [LEGACY_SHEET]: 49, [PROTOTYPE_SHEET]: 29, [PRODUCTION_SHEET]: 121 },
    throwOnCreateIndex: 12 + 3
  });

  assert.doesNotThrow(() => registerOpeningCharacterAnimations(scene));
  assert.deepEqual(scene.removed, [prototypeKey("idle"), prototypeKey("forward")]);
  assert.equal(scene.existing.size, 12 + 24);
  assert.equal([...scene.existing].some((key) => key.includes("-prototype-")), false);
  assert.equal(scene.created.length, 12 + 2 + 24);
  assert.equal(scene.warnings.length, 1);
  assert.match(scene.warnings[0], new RegExp(PROTOTYPE_SHEET));
});

test("a failing production batch rolls back only its own created keys", () => {
  const scene = createAnimationScene({
    frameTotals: { [LEGACY_SHEET]: 49, [PRODUCTION_SHEET]: 121 },
    throwOnCreateIndex: 12 + 7
  });

  assert.doesNotThrow(() => registerOpeningCharacterAnimations(scene));
  assert.deepEqual(
    scene.removed,
    ALL_MOTIONS.map((motion) => productionKey(motion, "down"))
  );
  assert.equal(scene.existing.size, 12);
  assert.equal(scene.warnings.length, 1);
  assert.match(scene.warnings[0], new RegExp(PRODUCTION_SHEET));
});

test("missing sheets warn at most once per AnimationManager and register nothing", () => {
  const scene = createAnimationScene({ frameTotals: {} });

  registerOpeningCharacterAnimations(scene);
  registerOpeningCharacterAnimations(scene);

  assert.equal(scene.created.length, 0);
  assert.equal(scene.warnings.length, 2);
  assert.match(scene.warnings[0], new RegExp(LEGACY_SHEET));
  assert.match(scene.warnings[1], new RegExp(PRODUCTION_SHEET));
  assert.equal(
    scene.warnings.filter((message) => message.includes("prototype")).length,
    0,
    "the absent dev-only prototype sheet stays silent"
  );
});

test("resolve ignores the prototype sheet during normal gameplay resolution", () => {
  const scene = createAnimationScene({
    frameTotals: { [LEGACY_SHEET]: 49, [PROTOTYPE_SHEET]: 29 }
  });

  assert.deepEqual(resolveCharacterPresentation(scene), {
    characterId: DEFAULT_CHARACTER_ID,
    textureKey: LEGACY_SHEET,
    animationFamily: "legacy",
    displayScale: 1.2
  });
  assert.deepEqual(resolveCharacterPresentation(scene, DEFAULT_CHARACTER_ID, { allowPrototype: true }), {
    characterId: DEFAULT_CHARACTER_ID,
    textureKey: PROTOTYPE_SHEET,
    animationFamily: "prototype",
    displayScale: 1
  });
});

test("resolve prefers an exact 120-frame production sheet and falls back through legacy to static", () => {
  const full = createAnimationScene({
    frameTotals: { [LEGACY_SHEET]: 49, [PROTOTYPE_SHEET]: 29, [PRODUCTION_SHEET]: 121 }
  });
  assert.deepEqual(resolveCharacterPresentation(full), {
    characterId: DEFAULT_CHARACTER_ID,
    textureKey: PRODUCTION_SHEET,
    animationFamily: "production",
    displayScale: 1
  });

  const wrongProduction = createAnimationScene({
    frameTotals: { [LEGACY_SHEET]: 49, [PRODUCTION_SHEET]: 120 }
  });
  assert.deepEqual(resolveCharacterPresentation(wrongProduction), {
    characterId: DEFAULT_CHARACTER_ID,
    textureKey: LEGACY_SHEET,
    animationFamily: "legacy",
    displayScale: 1.2
  });

  const empty = createAnimationScene({ frameTotals: {} });
  assert.deepEqual(resolveCharacterPresentation(empty), {
    characterId: DEFAULT_CHARACTER_ID,
    textureKey: STATIC_TEXTURE,
    animationFamily: "static",
    displayScale: 1.2
  });

  const prototypeOnly = createAnimationScene({ frameTotals: { [PROTOTYPE_SHEET]: 29 } });
  assert.equal(resolveCharacterPresentation(prototypeOnly).animationFamily, "static");
  assert.equal(resolveCharacterPresentation(prototypeOnly).displayScale, 1.2);
});

test("production sync plays every classified motion without flipping and preserves the body", () => {
  const scene = createAnimationScene({
    frameTotals: { [LEGACY_SHEET]: 49, [PRODUCTION_SHEET]: 121 }
  });
  registerOpeningCharacterAnimations(scene);
  const sprite = createPlayerSprite({ textureKey: PRODUCTION_SHEET, animationFamily: "production", scale: 1 });
  Object.assign(scene, {
    player: sprite,
    playerFacingAngle: 0,
    elapsedSurvivalMs: 1_000
  });
  const bodyBefore = snapshotBodyGeometry(sprite);

  for (const facing of FACING_NAMES) {
    for (const motion of LOCOMOTION_MOTIONS) {
      const angle = FACING_ANGLES[facing];
      const velocity = velocityForMotion(motion, angle);
      scene.playerFacingAngle = angle;
      sprite.body.velocity.x = velocity.x;
      sprite.body.velocity.y = velocity.y;

      syncCharacterPresentation(scene);

      assert.equal(sprite.anims.currentAnim.key, productionKey(motion, facing), `${motion}-${facing}`);
      assert.equal(sprite.flipX, false, `${motion}-${facing} never mirrors`);
      assert.equal(sprite.texture.key, PRODUCTION_SHEET);
      assert.equal(sprite.scaleX, 1);
      assert.equal(sprite.scaleY, 1);
    }
  }
  assertBodyGeometryPreserved(sprite, bodyBefore, "production sync");
});

test("production hit override holds for 120ms and then restores the classified motion", () => {
  const scene = createAnimationScene({
    frameTotals: { [LEGACY_SHEET]: 49, [PRODUCTION_SHEET]: 121 }
  });
  registerOpeningCharacterAnimations(scene);
  const sprite = createPlayerSprite({ textureKey: PRODUCTION_SHEET, animationFamily: "production", scale: 1 });
  Object.assign(scene, {
    player: sprite,
    playerFacingAngle: -Math.PI / 2,
    elapsedSurvivalMs: 1_000
  });
  sprite.body.velocity.y = -55;
  sprite.isTinted = true;

  syncCharacterPresentation(scene);
  assert.deepEqual(sprite.played, [productionKey("hit", "up")]);
  assert.equal(sprite.flipX, false);

  sprite.isTinted = false;
  scene.elapsedSurvivalMs = 1_119;
  syncCharacterPresentation(scene);
  assert.deepEqual(sprite.played, [productionKey("hit", "up")]);

  scene.elapsedSurvivalMs = 1_120;
  syncCharacterPresentation(scene);
  assert.deepEqual(sprite.played, [productionKey("hit", "up"), productionKey("forward", "up")]);
  assert.equal(sprite.flipX, false);
});

test("legacy sync keeps the idle, move and hit contract with the right-row mirror", () => {
  const scene = createAnimationScene({ frameTotals: { [LEGACY_SHEET]: 49 } });
  registerOpeningCharacterAnimations(scene);
  const sprite = createPlayerSprite({ textureKey: LEGACY_SHEET, animationFamily: "legacy", scale: 1.2 });
  Object.assign(scene, {
    player: sprite,
    playerFacingAngle: -Math.PI / 2,
    elapsedSurvivalMs: 1_000
  });
  sprite.body.velocity.y = -55;
  sprite.isTinted = true;

  syncCharacterPresentation(scene);
  assert.deepEqual(sprite.played, [legacyKey("hit", "up")]);
  assert.equal(sprite.flipX, false);
  assert.equal(sprite.scaleX, 1.2);

  sprite.isTinted = false;
  scene.elapsedSurvivalMs = 1_119;
  syncCharacterPresentation(scene);
  assert.deepEqual(sprite.played, [legacyKey("hit", "up")]);

  scene.elapsedSurvivalMs = 1_120;
  syncCharacterPresentation(scene);
  assert.deepEqual(sprite.played, [legacyKey("hit", "up"), legacyKey("move", "up")]);

  scene.playerFacingAngle = 0;
  sprite.body.velocity.y = 0;
  syncCharacterPresentation(scene);
  assert.equal(sprite.flipX, true, "legacy keeps the historical right mirror");
  assert.equal(sprite.anims.currentAnim.key, legacyKey("idle", "right"));
  assert.equal(sprite.scaleX, 1.2);
});

test("prototype sync consumes only the override and swaps sheets through the body-preserving path", () => {
  const scene = createAnimationScene({
    frameTotals: { [LEGACY_SHEET]: 49, [PROTOTYPE_SHEET]: 29 }
  });
  registerOpeningCharacterAnimations(scene);
  const sprite = createPlayerSprite({ textureKey: PROTOTYPE_SHEET, animationFamily: "prototype", scale: 1 });
  Object.assign(scene, {
    player: sprite,
    playerFacingAngle: 0.123,
    elapsedSurvivalMs: 5_000,
    isPaused: false
  });
  const sceneBefore = {
    playerFacingAngle: scene.playerFacingAngle,
    elapsedSurvivalMs: scene.elapsedSurvivalMs,
    isPaused: scene.isPaused
  };
  const bodyBefore = snapshotBodyGeometry(sprite);

  const expectedKeys = new Set();
  for (const facing of FACING_NAMES) {
    for (const motion of ALL_MOTIONS) {
      const angle = FACING_ANGLES[facing];
      const velocity = velocityForMotion(motion, angle);
      const override = {
        facingAngle: angle,
        velocityX: velocity.x,
        velocityY: velocity.y,
        hit: motion === "hit"
      };
      const expected = expectedPrototypeSync(facing, motion);
      const context = `${facing}-${motion}`;
      expectedKeys.add(expected.key);

      syncCharacterPresentation(scene, override);

      assert.equal(sprite.texture.key, expected.textureKey, `${context} texture`);
      assert.equal(sprite.scaleX, expected.scale, `${context} scaleX`);
      assert.equal(sprite.scaleY, expected.scale, `${context} scaleY`);
      assert.equal(sprite.flipX, expected.flipX, `${context} flipX`);
      assert.equal(sprite.anims.currentAnim.key, expected.key, `${context} animation key`);
      assertBodyGeometryPreserved(sprite, bodyBefore, context);
    }
  }
  for (const key of expectedKeys) {
    assert.ok(sprite.played.includes(key), `played ${key}`);
  }

  assert.deepEqual(
    {
      playerFacingAngle: scene.playerFacingAngle,
      elapsedSurvivalMs: scene.elapsedSurvivalMs,
      isPaused: scene.isPaused
    },
    sceneBefore,
    "overrides never leak into scene gameplay state"
  );
  assert.deepEqual(
    { x: sprite.body.velocity.x, y: sprite.body.velocity.y },
    { x: 0, y: 0 },
    "overrides never leak into the Arcade body velocity"
  );
  assert.equal(sprite.presentationHitUntilMs, undefined, "presentation never writes a hit deadline");
});

test("a legacy-spawned player honors the dev driver's sticky prototype override", () => {
  const scene = createAnimationScene({
    frameTotals: { [LEGACY_SHEET]: 49, [PROTOTYPE_SHEET]: 29 }
  });
  registerOpeningCharacterAnimations(scene);
  // Real Gate 2 boot: createPlayer resolves with allowPrototype=false, so the
  // sprite always spawns on the legacy sheet at 1.2 even when the 28-frame
  // prototype sheet is preloaded; only the dev driver fields below may opt it
  // into the prototype presentation.
  const sprite = createPlayerSprite({ textureKey: LEGACY_SHEET, animationFamily: "legacy", scale: 1.2 });
  Object.assign(scene, {
    player: sprite,
    playerFacingAngle: Math.PI / 2,
    elapsedSurvivalMs: 1_000
  });
  const bodyBefore = snapshotBodyGeometry(sprite);

  const downForward = velocityForMotion("forward", FACING_ANGLES.down);
  sprite.presentationPrototypeEnabled = true;
  sprite.presentationSmokeOverride = {
    facingAngle: FACING_ANGLES.down,
    velocityX: downForward.x,
    velocityY: downForward.y,
    hit: false
  };

  // The regular frame sync passes no override (main.js update loop), yet the
  // sticky driver override must keep the prototype presentation across frames.
  syncCharacterPresentation(scene);
  assert.equal(sprite.texture.key, PROTOTYPE_SHEET, "sticky down-forward uses the prototype sheet");
  assert.equal(sprite.scaleX, 1, "prototype displays at 1.0");
  assert.equal(sprite.flipX, false);
  assert.equal(sprite.anims.currentAnim.key, prototypeKey("forward"));
  assertBodyGeometryPreserved(sprite, bodyBefore, "sticky down-forward");

  syncCharacterPresentation(scene);
  assert.equal(sprite.texture.key, PROTOTYPE_SHEET, "prototype presentation survives the next frame");
  assert.equal(sprite.anims.currentAnim.key, prototypeKey("forward"));

  // A left state immediately drops back to the original legacy sheet at 1.2.
  const leftForward = velocityForMotion("forward", FACING_ANGLES.left);
  sprite.presentationSmokeOverride = {
    facingAngle: FACING_ANGLES.left,
    velocityX: leftForward.x,
    velocityY: leftForward.y,
    hit: false
  };
  syncCharacterPresentation(scene);
  assert.equal(sprite.texture.key, LEGACY_SHEET, "left drops back to the legacy sheet");
  assert.equal(sprite.scaleX, 1.2, "legacy displays at 1.2");
  assert.equal(sprite.anims.currentAnim.key, legacyKey("move", "left"));
  assertBodyGeometryPreserved(sprite, bodyBefore, "sticky left-forward");

  // A sticky hit override covers with the legacy hit animation.
  sprite.presentationSmokeOverride = {
    facingAngle: FACING_ANGLES.down,
    velocityX: 0,
    velocityY: 0,
    hit: true
  };
  syncCharacterPresentation(scene);
  assert.equal(sprite.texture.key, LEGACY_SHEET, "hit never uses the prototype sheet");
  assert.equal(sprite.anims.currentAnim.key, legacyKey("hit", "down"));

  // With the enable flag off, the same override never reaches the prototype sheet.
  sprite.presentationPrototypeEnabled = false;
  sprite.presentationSmokeOverride = {
    facingAngle: FACING_ANGLES.down,
    velocityX: downForward.x,
    velocityY: downForward.y,
    hit: false
  };
  syncCharacterPresentation(scene);
  assert.equal(sprite.texture.key, LEGACY_SHEET, "disabled flag keeps the legacy sheet");
  assert.equal(sprite.scaleX, 1.2);
  assert.equal(sprite.anims.currentAnim.key, legacyKey("move", "down"));

  // After the driver restores (fields deleted), normal gameplay sync resumes.
  delete sprite.presentationPrototypeEnabled;
  delete sprite.presentationSmokeOverride;
  scene.playerFacingAngle = 0;
  sprite.body.velocity.x = 55;
  syncCharacterPresentation(scene);
  assert.equal(sprite.texture.key, LEGACY_SHEET);
  assert.equal(sprite.anims.currentAnim.key, legacyKey("move", "right"));
  assert.equal(sprite.flipX, true, "legacy right mirror resumes after restore");
  assertBodyGeometryPreserved(sprite, bodyBefore, "restored gameplay sync");
});

test("static fallback sprites stay untouched", () => {
  const scene = createAnimationScene({ frameTotals: {} });
  const sprite = createPlayerSprite({ textureKey: STATIC_TEXTURE, animationFamily: "static", scale: 1.2 });
  Object.assign(scene, { player: sprite, playerFacingAngle: 0, elapsedSurvivalMs: 0 });

  syncCharacterPresentation(scene);

  assert.deepEqual(sprite.played, []);
  assert.equal(sprite.texture.key, STATIC_TEXTURE);
});

test("sync warns once and stops playback when the target animation is missing", () => {
  const scene = createAnimationScene({
    frameTotals: { [LEGACY_SHEET]: 49, [PRODUCTION_SHEET]: 121 },
    throwOnCreateIndex: 12 + 1
  });
  registerOpeningCharacterAnimations(scene);
  assert.equal(scene.warnings.length, 1);
  const sprite = createPlayerSprite({ textureKey: PRODUCTION_SHEET, animationFamily: "production", scale: 1 });
  Object.assign(scene, { player: sprite, playerFacingAngle: 0, elapsedSurvivalMs: 0 });

  syncCharacterPresentation(scene);
  syncCharacterPresentation(scene);

  assert.deepEqual(sprite.played, []);
  assert.equal(scene.warnings.length, 1, "the failed sheet warns once across registration and sync");
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
  assert.match(createPlayer, /resolveCharacterPresentation\(this, DEFAULT_CHARACTER_ID\)/);
  assert.match(createPlayer, /this\.player\.characterId = presentation\.characterId;/);
  assert.match(createPlayer, /this\.player\.presentationAnimationFamily = presentation\.animationFamily;/);
  assert.match(createPlayer, /physics\.add\.sprite/);
  const creation = createPlayer.indexOf("physics.add.sprite");
  const collide = createPlayer.indexOf("setCollideWorldBounds(true)");
  const body = createPlayer.indexOf("body.setSize(24, 24)");
  const scale = createPlayer.indexOf("applyDisplayScalePreservingBody");
  assert.ok(creation < collide && collide < body && body < scale);
  assert.match(createPlayer, /applyDisplayScalePreservingBody\(this\.player, presentation\.displayScale\)/);
  // Gate 3 rework (user report: the moving player shimmered and blurred): the
  // main camera must render at integer pixel positions. With camera
  // roundPixels set and the default integer zoom, Phaser floors both the
  // scroll and every sprite quad, so the 64x64 player texture is always
  // sampled on the pixel grid instead of crawling through sub-pixel phases.
  assert.match(createPlayer, /cameras\.main\.setRoundPixels\(true\)/);

  assert.match(createGroups, /classType:\s*Phaser\.Physics\.Arcade\.Sprite/);
  assert.doesNotMatch(createGroups, /createCallback/);
  assert.doesNotMatch(createGroups, /resolveCharacterPresentation/);
  assert.equal(
    world.match(/resolveCharacterPresentation\s*\(/g)?.length,
    1,
    "resolveCharacterPresentation must be called only for the player"
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
  assert.doesNotMatch(source, /scene\.playerFacingAngle\s*=/);
  assert.doesNotMatch(source, /presentationHitUntilMs\s*=/);
  assert.doesNotMatch(source, /\.time\.(?:addEvent|delayedCall)/);
  assert.doesNotMatch(source, /\.on\(|\.once\(/);
});
