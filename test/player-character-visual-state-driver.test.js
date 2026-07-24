import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  PLAYER_CHARACTER_VISUAL_STATES,
  createPlayerCharacterVisualStateDriver,
  installPlayerCharacterVisualStateBridge
} from "../src/art/playerCharacterVisualStateDriver.js";
import {
  DEFAULT_CHARACTER_ID,
  getPlayerMotion,
  registerOpeningCharacterAnimations
} from "../src/art/characterPresentation.js";
import { TEXTURES } from "../src/assets/manifest.js";

const LEGACY_SHEET = TEXTURES.playerOpeningSheet;
const PROTOTYPE_SHEET = TEXTURES.playerResponseOperativePrototypeSheet;
const FACING_NAMES = ["down", "left", "right", "up"];
const MOTION_NAMES = ["idle", "forward", "backward", "strafeLeft", "strafeRight", "hit"];
const EXPECTED_STATE_KEYS = FACING_NAMES.flatMap((facing) =>
  MOTION_NAMES.map((motion) => `${facing}-${motion}`)
);
const FRAME_SIZE = 64;

function createEventStub() {
  const listeners = new Map();
  return {
    once(event, fn) {
      listeners.set(event, [...(listeners.get(event) ?? []), { fn, once: true }]);
    },
    off(event, fn) {
      listeners.set(event, (listeners.get(event) ?? []).filter((entry) => entry.fn !== fn));
    },
    emit(event) {
      for (const entry of [...(listeners.get(event) ?? [])]) {
        if (entry.once) this.off(event, entry.fn);
        entry.fn();
      }
    },
    count(event) {
      return (listeners.get(event) ?? []).length;
    }
  };
}

function createPlayerSprite() {
  const player = {
    x: 400,
    y: 300,
    active: true,
    isDying: false,
    isTinted: false,
    flipX: false,
    texture: { key: PROTOTYPE_SHEET },
    characterId: DEFAULT_CHARACTER_ID,
    presentationAnimationFamily: "prototype",
    presentationFacing: "down",
    scaleX: 1,
    scaleY: 1,
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    displayOriginX: FRAME_SIZE / 2,
    displayOriginY: FRAME_SIZE / 2,
    anims: {
      currentAnim: { key: `${DEFAULT_CHARACTER_ID}-prototype-idle-down` },
      progress: 0.5,
      getProgress() {
        return this.progress;
      },
      setProgress(value) {
        this.progress = value;
      },
      stop() {
        this.currentAnim = null;
      }
    },
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
      return this;
    },
    setScale(value) {
      this.scaleX = value;
      this.scaleY = value;
      return this;
    }
  };
  player.body = {
    sourceWidth: 24,
    sourceHeight: 24,
    width: 24,
    height: 24,
    x: 0,
    y: 0,
    isCircle: false,
    radius: 0,
    offset: {
      x: 32,
      y: 32,
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
      this.width = this.sourceWidth * Math.abs(player.scaleX);
      this.height = this.sourceHeight * Math.abs(player.scaleY);
      this.position.x = player.x + player.scaleX * (this.offset.x - player.displayOriginX);
      this.position.y = player.y + player.scaleY * (this.offset.y - player.displayOriginY);
      this.x = this.position.x;
      this.y = this.position.y;
    }
  };
  player.body.updateFromGameObject();
  return player;
}

function createScene() {
  const warnings = [];
  const existing = new Set();
  const scene = {
    playerFacingAngle: 0.7,
    elapsedSurvivalMs: 12_000,
    isPaused: false,
    physics: { isPaused: false },
    rng: { seed: 1234, calls: 0 },
    events: createEventStub(),
    textures: {
      exists: (key) => [LEGACY_SHEET, PROTOTYPE_SHEET].includes(key),
      get: (key) => ({ frameTotal: key === LEGACY_SHEET ? 49 : 29 })
    },
    anims: {
      exists: (key) => existing.has(key),
      remove: (key) => existing.delete(key),
      generateFrameNumbers: (sheetKey, range) => ({ sheetKey, ...range }),
      create: (config) => {
        existing.add(config.key);
      }
    },
    console: {
      warn: (message) => warnings.push(message)
    }
  };
  registerOpeningCharacterAnimations(scene);
  return { scene, warnings };
}

function createFixture() {
  const { scene, warnings } = createScene();
  const player = createPlayerSprite();
  scene.player = player;
  return { scene, player, warnings };
}

function gameplaySnapshot(scene, player, storageDump) {
  return {
    playerFacingAngle: scene.playerFacingAngle,
    elapsedSurvivalMs: scene.elapsedSurvivalMs,
    isPaused: scene.isPaused,
    physicsPaused: scene.physics.isPaused,
    rng: { ...scene.rng },
    mathRandom: Math.random,
    velocityX: player.body.velocity.x,
    velocityY: player.body.velocity.y,
    hitDeadline: player.presentationHitUntilMs ?? null,
    storage: storageDump
  };
}

function expectedForState(state) {
  const { facing, motion } = state;
  if (facing === "down" && motion !== "hit") {
    return {
      textureKey: PROTOTYPE_SHEET,
      scale: 1,
      flipX: false,
      animationKey: `${DEFAULT_CHARACTER_ID}-prototype-${motion}-down`
    };
  }
  const mapped = motion === "hit" ? "hit" : motion === "idle" ? "idle" : "move";
  return {
    textureKey: LEGACY_SHEET,
    scale: 1.2,
    flipX: facing === "right",
    animationKey: `${DEFAULT_CHARACTER_ID}-legacy-${mapped}-${facing}`
  };
}

function bodySnapshotOf(player) {
  return {
    x: player.body.x,
    y: player.body.y,
    width: player.body.width,
    height: player.body.height,
    offsetX: player.body.offset.x,
    offsetY: player.body.offset.y
  };
}

test("visual states cover the exact 24 facing and motion grid with self-consistent input", () => {
  assert.deepEqual(Object.keys(PLAYER_CHARACTER_VISUAL_STATES), EXPECTED_STATE_KEYS);
  assert.equal(Object.isFrozen(PLAYER_CHARACTER_VISUAL_STATES), true);

  for (const [name, state] of Object.entries(PLAYER_CHARACTER_VISUAL_STATES)) {
    assert.equal(Object.isFrozen(state), true, `${name} is frozen`);
    assert.equal(Object.isFrozen(state.velocity), true, `${name} velocity is frozen`);
    assert.equal(`${state.facing}-${state.motion}`, name);
    if (state.motion === "hit") {
      assert.deepEqual(
        { x: state.velocity.x, y: state.velocity.y },
        { x: 0, y: 0 },
        `${name} carries the hit flag instead of velocity`
      );
      continue;
    }
    assert.equal(
      getPlayerMotion({
        velocityX: state.velocity.x,
        velocityY: state.velocity.y,
        facingAngle: state.angle
      }),
      state.motion,
      `${name} classifies back to its own locomotion`
    );
  }
});

test("driver creation rejects a player still showing hit tint", () => {
  const { scene, player } = createFixture();
  player.isTinted = true;
  assert.throws(
    () => createPlayerCharacterVisualStateDriver({ scene }),
    /hit tint/
  );
});

test("applyState drives all 24 states through the approved family mapping without touching gameplay", () => {
  const storageContent = [["meta", "{" + "\"perks\":[]" + "}"], ["settings", "{" + "\"muted\":false" + "}"]];
  const { scene, player, warnings } = createFixture();
  const before = gameplaySnapshot(scene, player, storageContent);
  const driver = createPlayerCharacterVisualStateDriver({ scene });
  assert.deepEqual(driver.listStates(), EXPECTED_STATE_KEYS);

  const bodyBefore = bodySnapshotOf(player);
  const expectedOverrides = new Map();
  for (const name of EXPECTED_STATE_KEYS) {
    const state = PLAYER_CHARACTER_VISUAL_STATES[name];
    const expected = expectedForState(state);

    const result = driver.applyState(name);

    assert.equal(Object.isFrozen(result), true, `${name} snapshot is frozen`);
    assert.deepEqual(Object.keys(result).sort(), ["animationKey", "body", "name", "scaleX", "scaleY", "textureKey"]);
    assert.equal(result.name, name);
    assert.equal(result.animationKey, expected.animationKey, `${name} animation`);
    assert.equal(result.textureKey, expected.textureKey, `${name} texture`);
    assert.equal(result.scaleX, expected.scale, `${name} scaleX`);
    assert.equal(result.scaleY, expected.scale, `${name} scaleY`);
    assert.deepEqual(result.body, bodyBefore, `${name} keeps body width, height and offset`);
    assert.deepEqual(bodySnapshotOf(player), bodyBefore, `${name} leaves the live body untouched`);

    assert.equal(player.presentationPrototypeEnabled, true, `${name} enables the prototype flag`);
    expectedOverrides.set(name, {
      facingAngle: state.angle,
      velocityX: state.velocity.x,
      velocityY: state.velocity.y,
      hit: state.motion === "hit"
    });
    assert.deepEqual(player.presentationSmokeOverride, expectedOverrides.get(name), `${name} override input`);
    assert.equal(Object.isFrozen(player.presentationSmokeOverride), true);
    assert.equal(player.flipX, expected.flipX, `${name} flip`);
  }

  const downLocomotion = EXPECTED_STATE_KEYS.filter((name) => name.startsWith("down-") && !name.endsWith("-hit"));
  assert.equal(downLocomotion.length, 5);
  assert.deepEqual(
    gameplaySnapshot(scene, player, storageContent),
    before,
    "24 states leave facing, velocity, pause, elapsed, hit deadline, RNG and storage untouched"
  );
  assert.deepEqual(
    warnings,
    [`[character-presentation] Missing, incomplete or failing spritesheet: ${TEXTURES.playerResponseOperativeSheet}; falling back to the previous character presentation.`],
    "only the absent production sheet warns; prototype and legacy animations cover every state"
  );

  driver.restore();
  driver.restore();
  assert.equal("__SCP_PLAYER_CHARACTER_PROTOTYPE__" in scene, false);
});

test("restore is idempotent and brings back the original presentation exactly", () => {
  const { scene, player } = createFixture();
  const driver = createPlayerCharacterVisualStateDriver({ scene });
  driver.applyState("up-backward");
  driver.applyState("right-hit");
  assert.equal(player.texture.key, LEGACY_SHEET);
  assert.equal(player.flipX, true);
  const playsBeforeRestore = player.played.length;

  driver.restore();

  assert.equal(Object.hasOwn(player, "presentationPrototypeEnabled"), false);
  assert.equal(Object.hasOwn(player, "presentationSmokeOverride"), false);
  assert.equal(player.presentationAnimationFamily, "prototype");
  assert.equal(player.presentationFacing, "down");
  assert.equal(player.texture.key, PROTOTYPE_SHEET);
  assert.equal(player.scaleX, 1);
  assert.equal(player.scaleY, 1);
  assert.equal(player.flipX, false);
  assert.equal(player.anims.currentAnim.key, `${DEFAULT_CHARACTER_ID}-prototype-idle-down`);
  assert.equal(player.anims.getProgress(), 0.5);
  assert.equal(player.played.length, playsBeforeRestore + 1, "restore replays the original animation once");
  assert.deepEqual(bodySnapshotOf(player), {
    x: 400,
    y: 300,
    width: 24,
    height: 24,
    offsetX: 32,
    offsetY: 32
  });

  driver.restore();
  assert.equal(player.played.length, playsBeforeRestore + 1, "a second restore is a no-op");
  assert.throws(() => driver.applyState("down-idle"), /already restored/);
  assert.throws(() => driver.applyState("unknown-state"), /already restored/);
});

test("applyState rejects unknown states and respects the usePrototype flag", () => {
  const { scene, player } = createFixture();
  const driver = createPlayerCharacterVisualStateDriver({ scene });

  assert.throws(() => driver.applyState("down-teleport"), /unknown player character visual state/);

  driver.applyState("down-idle", { usePrototype: false });
  assert.equal(player.presentationPrototypeEnabled, false);
  driver.restore();
});

test("a throwing syncPresentation restores the presentation before rethrowing", () => {
  const { scene, player } = createFixture();
  const failure = new Error("sync exploded");
  const driver = createPlayerCharacterVisualStateDriver({
    scene,
    syncPresentation() {
      throw failure;
    }
  });

  let caught = null;
  try {
    driver.applyState("left-forward");
  } catch (error) {
    caught = error;
  }

  assert.equal(caught, failure, "the original error propagates unchanged");
  assert.equal(Object.hasOwn(player, "presentationPrototypeEnabled"), false, "restore cleared the driver fields first");
  assert.equal(Object.hasOwn(player, "presentationSmokeOverride"), false);
  assert.equal(player.texture.key, PROTOTYPE_SHEET);
  assert.equal(player.anims.currentAnim.key, `${DEFAULT_CHARACTER_ID}-prototype-idle-down`);
  assert.throws(() => driver.applyState("down-idle"), /already restored/);
});

test("driver never touches RNG or storage even when both throw on access", () => {
  const originalRandom = Math.random;
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Math.random = () => {
    throw new Error("RNG access is forbidden in the visual state driver");
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("localStorage access is forbidden in the visual state driver");
    }
  });

  try {
    const { scene, player } = createFixture();
    const driver = createPlayerCharacterVisualStateDriver({ scene });
    for (const name of EXPECTED_STATE_KEYS) {
      const expected = expectedForState(PLAYER_CHARACTER_VISUAL_STATES[name]);
      const result = driver.applyState(name);
      assert.equal(result.textureKey, expected.textureKey, name);
      assert.equal(result.scaleX, expected.scale, name);
    }
    driver.restore();
    assert.equal(player.texture.key, PROTOTYPE_SHEET);
  } finally {
    Math.random = originalRandom;
    if (originalDescriptor) {
      Object.defineProperty(globalThis, "localStorage", originalDescriptor);
    } else {
      delete globalThis.localStorage;
    }
  }
});

test("bridge installs a single global entry and cleans paired listeners on shutdown or destroy", () => {
  const { scene } = createFixture();
  const windowRef = {};

  const driver = installPlayerCharacterVisualStateBridge(scene, windowRef);
  assert.equal(windowRef.__SCP_PLAYER_CHARACTER_PROTOTYPE__, driver);
  assert.equal(scene.events.count("shutdown"), 1);
  assert.equal(scene.events.count("destroy"), 1);

  scene.events.emit("shutdown");
  assert.equal("__SCP_PLAYER_CHARACTER_PROTOTYPE__" in windowRef, false);
  assert.equal(scene.events.count("shutdown"), 0);
  assert.equal(scene.events.count("destroy"), 0);
  assert.throws(() => driver.applyState("down-idle"), /already restored/);

  const second = installPlayerCharacterVisualStateBridge(scene, windowRef);
  assert.equal(windowRef.__SCP_PLAYER_CHARACTER_PROTOTYPE__, second);
  assert.equal(scene.events.count("shutdown"), 1, "restart keeps at most one shutdown listener");
  assert.equal(scene.events.count("destroy"), 1, "restart keeps at most one destroy listener");

  scene.events.emit("destroy");
  assert.equal(scene.events.count("shutdown"), 0);
  assert.equal(scene.events.count("destroy"), 0);
  assert.equal("__SCP_PLAYER_CHARACTER_PROTOTYPE__" in windowRef, false);
});

test("bridge restores a previous global entry before replacing it", () => {
  const { scene } = createFixture();
  const calls = [];
  const windowRef = {
    __SCP_PLAYER_CHARACTER_PROTOTYPE__: {
      restore: () => calls.push("restore")
    }
  };

  const driver = installPlayerCharacterVisualStateBridge(scene, windowRef);

  assert.deepEqual(calls, ["restore"]);
  assert.equal(windowRef.__SCP_PLAYER_CHARACTER_PROTOTYPE__, driver);
  scene.events.emit("shutdown");
});

test("driver source never writes gameplay, RNG, timer or pause state", async () => {
  const source = await readFile(
    new URL("../src/art/playerCharacterVisualStateDriver.js", import.meta.url),
    "utf8"
  );
  assert.doesNotMatch(source, /Math\.random|Phaser\.Math\.RND|localStorage/);
  assert.doesNotMatch(source, /triggerVictory|triggerGameOver|saveMetaProgress/);
  assert.doesNotMatch(source, /playerFacingAngle\s*=|\.body\.setVelocity|\.velocity\.(?:x|y)\s*=/);
  assert.doesNotMatch(source, /elapsedSurvivalMs\s*=|presentationHitUntilMs\s*=/);
  assert.doesNotMatch(source, /\.pause\(|\.resume\(|isPaused\s*=/);
  assert.equal(Object.keys(PLAYER_CHARACTER_VISUAL_STATES).length, 24);
});
