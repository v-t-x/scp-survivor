import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  PLAYER_CHARACTER_VISUAL_STATES,
  createPlayerCharacterVisualStateDriver,
  installPlayerCharacterVisualStateBridge
} from "../src/art/playerCharacterVisualStateDriver.js";

const FACING_NAMES = ["down", "left", "right", "up"];
const MOTION_NAMES = [
  "idle",
  "forward",
  "backward",
  "strafeLeft",
  "strafeRight",
  "hit"
];
const EXPECTED_STATE_KEYS = FACING_NAMES.flatMap((facing) =>
  MOTION_NAMES.map((motion) => `${facing}-${motion}`)
);

function createEventStub(log = []) {
  const listeners = new Map();
  return {
    on(event, fn) {
      log.push(`on:${event}:${fn.name}`);
      listeners.set(event, [...(listeners.get(event) ?? []), { fn, once: false }]);
    },
    once(event, fn) {
      log.push(`once:${event}:${fn.name}`);
      listeners.set(event, [...(listeners.get(event) ?? []), { fn, once: true }]);
    },
    off(event, fn) {
      log.push(`off:${event}:${fn.name}`);
      listeners.set(event, (listeners.get(event) ?? []).filter((entry) => entry.fn !== fn));
    },
    emit(event, ...args) {
      for (const entry of [...(listeners.get(event) ?? [])]) {
        if (entry.once) this.off(event, entry.fn);
        entry.fn(...args);
      }
    },
    count(event) {
      return (listeners.get(event) ?? []).length;
    },
    functions(event) {
      return (listeners.get(event) ?? []).map((entry) => entry.fn);
    }
  };
}

function createFixture() {
  const calls = [];
  const controllerState = {
    mode: "legacy",
    fallback: false,
    previewMode: null,
    destroyed: false
  };
  const playerPresentation = {
    setPreviewOverride(value) {
      calls.push(["setPreviewOverride", value]);
      controllerState.previewMode = value?.mode ?? null;
      return true;
    },
    update(snapshot, delta) {
      calls.push(["update", snapshot, delta]);
      return true;
    },
    snapshot() {
      calls.push(["snapshot"]);
      return Object.freeze({ ...controllerState });
    }
  };
  const scene = {
    player: {
      active: true,
      isDying: false,
      isTinted: false,
      x: 400,
      y: 300,
      body: {
        width: 24,
        height: 24,
        velocity: { x: 80, y: -40 }
      }
    },
    playerPresentation,
    playerFacingAngle: Math.PI / 4,
    elapsedSurvivalMs: 1200,
    dashUntilMs: 1400,
    health: 90,
    isPaused: false,
    events: createEventStub(calls),
    calls
  };
  return { scene, playerPresentation, calls, controllerState };
}

function gameplaySnapshot(scene) {
  return {
    player: {
      x: scene.player.x,
      y: scene.player.y,
      active: scene.player.active,
      isDying: scene.player.isDying,
      isTinted: scene.player.isTinted,
      body: scene.player.body,
      width: scene.player.body.width,
      height: scene.player.body.height,
      velocityX: scene.player.body.velocity.x,
      velocityY: scene.player.body.velocity.y
    },
    scene: {
      playerFacingAngle: scene.playerFacingAngle,
      elapsedSurvivalMs: scene.elapsedSurvivalMs,
      dashUntilMs: scene.dashUntilMs,
      health: scene.health,
      isPaused: scene.isPaused
    }
  };
}

test("visual states retain the exact 24 facing and motion grid", () => {
  assert.deepEqual(Object.keys(PLAYER_CHARACTER_VISUAL_STATES), EXPECTED_STATE_KEYS);
  for (const [name, state] of Object.entries(PLAYER_CHARACTER_VISUAL_STATES)) {
    assert.equal(Object.isFrozen(state), true, name);
    assert.equal(Object.isFrozen(state.velocity), true, name);
    assert.equal(Number.isFinite(state.angle), true, name);
    assert.equal(Number.isFinite(state.velocity.x), true, name);
    assert.equal(Number.isFinite(state.velocity.y), true, name);
  }
});

test("manual states use only the presentation controller contract and never mutate gameplay", () => {
  const { scene, calls } = createFixture();
  const before = gameplaySnapshot(scene);
  const driver = createPlayerCharacterVisualStateDriver({ scene });

  assert.deepEqual(driver.listStates(), EXPECTED_STATE_KEYS);
  for (const name of EXPECTED_STATE_KEYS) {
    const result = driver.applyState(name);
    const state = PLAYER_CHARACTER_VISUAL_STATES[name];
    const overrideCall = calls.at(-3);
    const updateCall = calls.at(-2);
    const snapshotCall = calls.at(-1);

    assert.equal(overrideCall[0], "setPreviewOverride", name);
    assert.deepEqual(overrideCall[1], {
      mode: "body",
      facingAngle: state.angle,
      velocityX: state.velocity.x,
      velocityY: state.velocity.y,
      hit: state.motion === "hit"
    }, name);
    assert.equal(Object.isFrozen(overrideCall[1]), true, name);
    assert.equal(updateCall[0], "update", name);
    assert.equal(Object.isFrozen(updateCall[1]), true, name);
    assert.equal(updateCall[2], 0, name);
    assert.deepEqual(snapshotCall, ["snapshot"], name);
    assert.equal(result.name, name);
    assert.equal(result.previewMode, "body");
  }
  assert.deepEqual(gameplaySnapshot(scene), before);
});

test("manual states can explicitly validate legacy and static fallback modes", () => {
  const { scene, calls } = createFixture();
  const driver = createPlayerCharacterVisualStateDriver({ scene });

  driver.applyState("left-forward", { mode: "legacy" });
  assert.equal(calls.at(-3)[1].mode, "legacy");
  driver.applyState("right-hit", { mode: "static" });
  assert.equal(calls.at(-3)[1].mode, "static");

  assert.throws(
    () => driver.applyState("down-idle", { mode: "unknown" }),
    /unknown player presentation preview mode/
  );
  assert.throws(
    () => driver.applyState("down-teleport"),
    /unknown player character visual state/
  );
});

test("driver restores with null and reports rejected controller overrides", () => {
  const { scene, playerPresentation, calls } = createFixture();
  const driver = createPlayerCharacterVisualStateDriver({ scene });
  playerPresentation.setPreviewOverride = (value) => {
    calls.push(["setPreviewOverride", value]);
    return value === null;
  };

  assert.throws(
    () => driver.applyState("down-idle"),
    /presentation controller rejected preview override/
  );
  assert.equal(driver.restore(), true);
  assert.deepEqual(calls.at(-2), ["setPreviewOverride", null]);
  assert.equal(calls.at(-1)[0], "update");
  assert.equal(driver.restore(), true, "restore is safe to repeat");
});

test("driver rejects a false presentation update and live mode cleans itself safely", () => {
  const manualFixture = createFixture();
  manualFixture.playerPresentation.update = (snapshot, delta) => {
    manualFixture.calls.push(["update", snapshot, delta]);
    return false;
  };
  const driver = createPlayerCharacterVisualStateDriver({
    scene: manualFixture.scene
  });
  assert.throws(
    () => driver.applyState("down-idle"),
    /presentation controller rejected preview update/
  );

  const liveFixture = createFixture();
  liveFixture.playerPresentation.update = (snapshot, delta) => {
    liveFixture.calls.push(["update", snapshot, delta]);
    return false;
  };
  const windowRef = {};
  const bridge = installPlayerCharacterVisualStateBridge(
    liveFixture.scene,
    windowRef,
    { mode: "body" }
  );
  assert.equal(liveFixture.scene.events.count("update"), 0);
  assert.equal(liveFixture.scene.events.count("shutdown"), 0);
  assert.equal(liveFixture.scene.events.count("destroy"), 0);
  assert.equal("__SCP_PLAYER_PRESENTATION_PREVIEW__" in windowRef, false);
  assert.equal(bridge.snapshot().restored, false);
});

test("body live bridge installs a named update and cleanup removes every owned entry", () => {
  const { scene, calls } = createFixture();
  const windowRef = {};
  const before = gameplaySnapshot(scene);

  const bridge = installPlayerCharacterVisualStateBridge(scene, windowRef, {
    mode: "body"
  });

  assert.equal(windowRef.__SCP_PLAYER_PRESENTATION_PREVIEW__, bridge);
  assert.equal(scene.events.count("update"), 1);
  assert.equal(scene.events.count("shutdown"), 1);
  assert.equal(scene.events.count("destroy"), 1);
  assert.equal(scene.events.functions("update")[0].name, "onUpdate");

  scene.player.body.velocity.x = -20;
  scene.player.body.velocity.y = 60;
  scene.playerFacingAngle = Math.PI / 2;
  scene.player.isTinted = true;
  const gameplayBeforeUpdate = gameplaySnapshot(scene);
  scene.events.emit("update", 0, 17);

  const overrideCall = calls.findLast((entry) => entry[0] === "setPreviewOverride");
  const updateCall = calls.findLast((entry) => entry[0] === "update");
  assert.deepEqual(overrideCall[1], {
    mode: "body",
    facingAngle: Math.PI / 2,
    velocityX: -20,
    velocityY: 60,
    hit: true
  });
  assert.equal(Object.isFrozen(overrideCall[1]), true);
  assert.equal(updateCall[2], 17);
  assert.equal(Object.isFrozen(updateCall[1]), true);

  const updateListener = scene.events.functions("update")[0];
  scene.events.emit("shutdown");
  const nullIndex = calls.findIndex(
    (entry) => entry[0] === "setPreviewOverride" && entry[1] === null
  );
  const updateOffIndex = calls.findIndex(
    (entry) => entry === `off:update:${updateListener.name}`
  );
  assert.ok(nullIndex >= 0 && nullIndex < updateOffIndex, "normal legacy restoration happens before listener removal");
  assert.equal(scene.events.count("update"), 0);
  assert.equal(scene.events.count("shutdown"), 0);
  assert.equal(scene.events.count("destroy"), 0);
  assert.equal("__SCP_PLAYER_PRESENTATION_PREVIEW__" in windowRef, false);
  assert.deepEqual(gameplaySnapshot(scene), gameplayBeforeUpdate, "bridge writes no gameplay state");
  assert.equal(before.player.body, gameplayBeforeUpdate.player.body);
});

test("two-direction bridge stays live, presentation-only and fully removable", () => {
  const { scene, calls } = createFixture();
  const windowRef = {};
  const before = gameplaySnapshot(scene);
  const bridge = installPlayerCharacterVisualStateBridge(scene, windowRef, {
    mode: "two-direction"
  });

  assert.equal(scene.events.count("update"), 1);
  scene.player.body.velocity.x = 0;
  scene.player.body.velocity.y = -80;
  const gameplayBeforeUpdate = gameplaySnapshot(scene);
  scene.events.emit("update", 0, 16);
  const override = calls.findLast(
    (entry) => entry[0] === "setPreviewOverride"
  )[1];
  assert.equal(override.mode, "two-direction");
  assert.equal(override.velocityX, 0);
  assert.equal(override.velocityY, -80);
  assert.deepEqual(gameplaySnapshot(scene), gameplayBeforeUpdate);
  assert.equal(before.player.body, gameplayBeforeUpdate.player.body);

  assert.equal(bridge.cleanup(), true);
  assert.equal(scene.events.count("update"), 0);
  assert.equal(scene.events.count("shutdown"), 0);
  assert.equal(scene.events.count("destroy"), 0);
  assert.equal("__SCP_PLAYER_PRESENTATION_PREVIEW__" in windowRef, false);
});

test("states installs no live update while legacy and static install development-only live fallback", () => {
  for (const mode of ["states", "legacy", "static"]) {
    const { scene, calls } = createFixture();
    const windowRef = {};
    const bridge = installPlayerCharacterVisualStateBridge(scene, windowRef, { mode });
    assert.equal(scene.events.count("update"), mode === "states" ? 0 : 1, mode);
    if (mode === "states") {
      assert.equal(
        calls.some((entry) => entry[0] === "setPreviewOverride"),
        false,
        "states waits for an explicit manual selection"
      );
    } else {
      const override = calls.find((entry) => entry[0] === "setPreviewOverride")[1];
      assert.equal(override.mode, mode);
    }
    bridge.cleanup();
    assert.equal(scene.events.count("update"), 0, mode);
  }
});

test("three real shutdown-create cycles leave every old Scene listener-free", () => {
  const windowRef = {};
  const cycles = [];

  for (let index = 0; index < 3; index += 1) {
    const fixture = createFixture();
    const bridge = installPlayerCharacterVisualStateBridge(fixture.scene, windowRef, {
      mode: "body"
    });
    cycles.push({ ...fixture, bridge });
    assert.equal(fixture.scene.events.count("update"), 1, `cycle ${index + 1}`);
    assert.equal(fixture.scene.events.count("shutdown"), 1, `cycle ${index + 1}`);
    assert.equal(fixture.scene.events.count("destroy"), 1, `cycle ${index + 1}`);
    assert.equal(windowRef.__SCP_PLAYER_PRESENTATION_PREVIEW__, bridge);

    fixture.scene.events.emit("shutdown");
    assert.equal(fixture.scene.events.count("update"), 0, `cycle ${index + 1}`);
    assert.equal(fixture.scene.events.count("shutdown"), 0, `cycle ${index + 1}`);
    assert.equal(fixture.scene.events.count("destroy"), 0, `cycle ${index + 1}`);
    assert.equal("__SCP_PLAYER_PRESENTATION_PREVIEW__" in windowRef, false);

    const callsAfterShutdown = fixture.calls.length;
    fixture.scene.events.emit("update", 0, 16);
    assert.equal(
      fixture.calls.length,
      callsAfterShutdown,
      `old Scene ${index + 1} has no live update callback`
    );
  }
  assert.ok(cycles.every(({ bridge }) => bridge.snapshot().restored));
});

test("a rejected live override cleans the dev bridge without escaping into the scene update", () => {
  const { scene, playerPresentation } = createFixture();
  const windowRef = {};
  const bridge = installPlayerCharacterVisualStateBridge(scene, windowRef, {
    mode: "body"
  });
  playerPresentation.setPreviewOverride = () => false;

  assert.doesNotThrow(() => scene.events.emit("update", 0, 16));
  assert.equal(scene.events.count("update"), 0);
  assert.equal(scene.events.count("shutdown"), 0);
  assert.equal(scene.events.count("destroy"), 0);
  assert.equal("__SCP_PLAYER_PRESENTATION_PREVIEW__" in windowRef, false);
  assert.equal(bridge.snapshot().restored, false);
});

test("throwing preview restoration never escapes update or lifecycle cleanup", () => {
  const liveFixture = createFixture();
  const liveWindow = {};
  const liveBridge = installPlayerCharacterVisualStateBridge(liveFixture.scene, liveWindow, {
    mode: "body"
  });
  liveFixture.playerPresentation.setPreviewOverride = () => {
    throw new Error("preview controller exploded");
  };

  let restoreResult = null;
  assert.doesNotThrow(() => {
    restoreResult = liveBridge.restore();
  });
  assert.equal(restoreResult, false);
  assert.doesNotThrow(() => liveFixture.scene.events.emit("update", 0, 16));
  assert.equal(liveFixture.scene.events.count("update"), 0);
  assert.equal(liveFixture.scene.events.count("shutdown"), 0);
  assert.equal(liveFixture.scene.events.count("destroy"), 0);
  assert.equal("__SCP_PLAYER_PRESENTATION_PREVIEW__" in liveWindow, false);

  const lifecycleFixture = createFixture();
  const lifecycleWindow = {};
  installPlayerCharacterVisualStateBridge(
    lifecycleFixture.scene,
    lifecycleWindow,
    { mode: "states" }
  );
  lifecycleFixture.playerPresentation.setPreviewOverride = () => {
    throw new Error("restore exploded");
  };

  assert.doesNotThrow(() => lifecycleFixture.scene.events.emit("shutdown"));
  assert.equal(lifecycleFixture.scene.events.count("update"), 0);
  assert.equal(lifecycleFixture.scene.events.count("shutdown"), 0);
  assert.equal(lifecycleFixture.scene.events.count("destroy"), 0);
  assert.equal("__SCP_PLAYER_PRESENTATION_PREVIEW__" in lifecycleWindow, false);
});

test("cleanup isolates every release step and retries only because work remains", () => {
  const fixture = createFixture();
  const windowTarget = {};
  let deleteAttempts = 0;
  const windowRef = new Proxy(windowTarget, {
    deleteProperty(target, property) {
      deleteAttempts += 1;
      if (deleteAttempts === 1) {
        throw new Error("global delete failed");
      }
      return Reflect.deleteProperty(target, property);
    }
  });
  const bridge = installPlayerCharacterVisualStateBridge(
    fixture.scene,
    windowRef,
    { mode: "body" }
  );
  const originalOff = fixture.scene.events.off.bind(fixture.scene.events);
  let updateOffAttempts = 0;
  fixture.scene.events.off = (event, fn) => {
    if (event === "update") {
      updateOffAttempts += 1;
      if (updateOffAttempts === 1) {
        throw new Error("update off failed");
      }
    }
    return originalOff(event, fn);
  };

  assert.doesNotThrow(() => bridge.cleanup());
  assert.equal(fixture.scene.events.count("update"), 1, "only the failed detach remains");
  assert.equal(fixture.scene.events.count("shutdown"), 0);
  assert.equal(fixture.scene.events.count("destroy"), 0);
  assert.equal(deleteAttempts, 1, "global deletion is attempted despite an earlier off failure");
  assert.equal(windowRef.__SCP_PLAYER_PRESENTATION_PREVIEW__, bridge);

  assert.doesNotThrow(() => bridge.cleanup());
  assert.equal(fixture.scene.events.count("update"), 0);
  assert.equal(fixture.scene.events.count("shutdown"), 0);
  assert.equal(fixture.scene.events.count("destroy"), 0);
  assert.equal(deleteAttempts, 2);
  assert.equal("__SCP_PLAYER_PRESENTATION_PREVIEW__" in windowTarget, false);
});

test("a throwing previous bridge cannot block a replacement installation", () => {
  const fixture = createFixture();
  const priorCalls = [];
  const windowRef = {
    __SCP_PLAYER_PRESENTATION_PREVIEW__: {
      cleanup() {
        priorCalls.push("cleanup");
        throw new Error("old cleanup failed");
      },
      restore() {
        priorCalls.push("restore");
        throw new Error("old restore failed");
      }
    }
  };
  let bridge = null;

  assert.doesNotThrow(() => {
    bridge = installPlayerCharacterVisualStateBridge(
      fixture.scene,
      windowRef,
      { mode: "states" }
    );
  });
  assert.deepEqual(priorCalls, ["cleanup", "restore"]);
  assert.equal(windowRef.__SCP_PLAYER_PRESENTATION_PREVIEW__, bridge);
  bridge.cleanup();
});

test("reinstall cleans an older bridge before publishing its replacement", () => {
  const { scene, calls } = createFixture();
  const windowRef = {};
  const first = installPlayerCharacterVisualStateBridge(scene, windowRef, {
    mode: "body"
  });
  const marker = calls.length;
  const second = installPlayerCharacterVisualStateBridge(scene, windowRef, {
    mode: "static"
  });

  assert.equal(first.snapshot().restored, true);
  assert.equal(windowRef.__SCP_PLAYER_PRESENTATION_PREVIEW__, second);
  const reinstallCalls = calls.slice(marker);
  assert.deepEqual(
    reinstallCalls.find((entry) => entry[0] === "setPreviewOverride"),
    ["setPreviewOverride", null],
    "the old override is restored before the replacement is installed"
  );
  second.cleanup();
});

test("RNG and storage remain unreachable through manual and live preview paths", () => {
  const originalRandom = Math.random;
  const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Math.random = () => {
    throw new Error("RNG access is forbidden");
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("storage access is forbidden");
    }
  });

  try {
    const { scene } = createFixture();
    const windowRef = {};
    const bridge = installPlayerCharacterVisualStateBridge(scene, windowRef, {
      mode: "two-direction"
    });
    bridge.applyState("up-backward");
    scene.events.emit("update", 0, 16);
    bridge.cleanup();
  } finally {
    Math.random = originalRandom;
    if (originalDescriptor) {
      Object.defineProperty(globalThis, "localStorage", originalDescriptor);
    } else {
      delete globalThis.localStorage;
    }
  }
});

test("driver source is limited to the approved presentation API and contains no gameplay writes", async () => {
  const source = await readFile(
    new URL("../src/art/playerCharacterVisualStateDriver.js", import.meta.url),
    "utf8"
  );
  assert.match(source, /\.setPreviewOverride\(/);
  assert.match(source, /\.update\(/);
  assert.match(source, /\.snapshot\(/);
  assert.deepEqual(
    new Set([...source.matchAll(/playerPresentation\.([A-Za-z]+)/g)].map((match) => match[1])),
    new Set(["setPreviewOverride", "update", "snapshot"])
  );
  assert.doesNotMatch(source, /presentationPrototypeEnabled|presentationSmokeOverride/);
  assert.doesNotMatch(source, /syncCharacterPresentation|applyTextureAndScalePreservingBody/);
  assert.doesNotMatch(source, /Math\.random|Phaser\.Math\.RND|localStorage/);
  assert.doesNotMatch(source, /triggerVictory|triggerGameOver|saveMetaProgress/);
  assert.doesNotMatch(source, /\.body\.setVelocity|\.velocity\.(?:x|y)\s*=/);
  assert.doesNotMatch(source, /playerFacingAngle\s*=|elapsedSurvivalMs\s*=|presentationHitUntilMs\s*=/);
  assert.doesNotMatch(source, /\.pause\(|\.resume\(|isPaused\s*=/);
  assert.equal(Object.keys(PLAYER_CHARACTER_VISUAL_STATES).length, 24);
});
