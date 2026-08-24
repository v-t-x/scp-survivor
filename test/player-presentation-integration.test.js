import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import { createPlayerPresentationSnapshot } from "../src/art/playerPresentationModel.js";
import { installPlayerCharacterVisualStateBridge } from "../src/art/playerCharacterVisualStateDriver.js";

function extractObjectMethod(source, name) {
  const start = source.search(new RegExp(`^  ${name}\\(`, "m"));
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

function extractNamedFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

async function loadCreatePlayer(dependencies) {
  const source = await readFile(new URL("../src/scene/world.js", import.meta.url), "utf8");
  const method = extractObjectMethod(source, "createPlayer");
  return new Function(
    "WORLD_WIDTH",
    "WORLD_HEIGHT",
    "DEFAULT_CHARACTER_ID",
    "resolveCharacterPresentation",
    "applyDisplayScalePreservingBody",
    "createPlayerPresentationController",
    `"use strict"; return ({${method}}).createPlayer;`
  )(...dependencies);
}

async function loadUpdate(snapshotFactory, legacySync) {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const method = extractObjectMethod(source, "update");
  return new Function(
    "createPlayerPresentationSnapshot",
    "syncCharacterPresentation",
    `"use strict"; return ({${method}}).update;`
  )(snapshotFactory, legacySync);
}

async function loadPreviewScheduler() {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const scheduler = extractNamedFunction(
    source,
    "schedulePlayerPresentationPreview"
  );
  return new Function(
    `"use strict"; ${scheduler}; return schedulePlayerPresentationPreview;`
  )();
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createGameplayPlayer(events) {
  return {
    x: 320,
    y: 240,
    active: true,
    visible: true,
    body: {
      width: 32,
      height: 32,
      velocity: { x: 0, y: 0 },
      setSize(width, height) {
        events.push(`body:${width}x${height}`);
        this.width = width;
        this.height = height;
        return this;
      }
    },
    setCollideWorldBounds(value) {
      events.push(`bounds:${value}`);
      return this;
    },
    setDepth(value) {
      events.push(`depth:${value}`);
      return this;
    },
    setVisible(value) {
      this.visible = value;
      return this;
    },
    once(event, callback) {
      events.push(`once:${event}`);
      this.destroyListener = callback;
      return this;
    }
  };
}

test("createPlayer preserves the gameplay sprite and body before attaching presentation and camera", async () => {
  const events = [];
  let trackedShadowOptions = null;
  let cameraFollowArgs = null;
  const player = createGameplayPlayer(events);
  const controller = Object.freeze({ update() {}, setPaused() {}, destroy() {} });
  const presentation = {
    characterId: "foundation-response-operative",
    textureKey: "player",
    animationFamily: "static",
    displayScale: 1.5
  };
  const createPlayer = await loadCreatePlayer([
    640,
    480,
    "foundation-response-operative",
    () => presentation,
    (anchor, scale) => {
      assert.equal(anchor, player);
      assert.deepEqual([anchor.body.width, anchor.body.height], [24, 24]);
      events.push(`scale:${scale}`);
    },
    (scene, options) => {
      assert.equal(options.anchor, player);
      assert.equal(options.characterId, presentation.characterId);
      assert.deepEqual([player.body.width, player.body.height], [24, 24]);
      events.push("presentation");
      return controller;
    }
  ]);
  const scene = {
    physics: {
      add: {
        sprite(x, y, textureKey) {
          events.push(`sprite:${x},${y}:${textureKey}`);
          return player;
        }
      }
    },
    combatFeedback: {
      trackActor(anchor, options) {
        assert.equal(anchor, player);
        trackedShadowOptions = structuredClone(options);
        events.push("shadow");
      },
      untrackActor() {}
    },
    cameras: {
      main: {
        startFollow(...args) {
          cameraFollowArgs = args;
          events.push("camera");
        }
      }
    }
  };

  createPlayer.call(scene);

  assert.equal(scene.player, player, "the Arcade gameplay sprite remains this.player");
  assert.equal(scene.playerPresentation, controller, "the new object has its own scene reference");
  assert.deepEqual([player.body.width, player.body.height], [24, 24]);
  assert.deepEqual(trackedShadowOptions, {
    kind: "player",
    radius: 12,
    offsetY: 3,
    widthScale: 1.5,
    roundPosition: true
  });
  assert.deepEqual(cameraFollowArgs, [player, true, 0.3, 0.3]);
  assert.deepEqual(events, [
    "sprite:320,240:player",
    "bounds:true",
    "body:24x24",
    "scale:1.5",
    "depth:6",
    "shadow",
    "once:destroy",
    "presentation",
    "camera"
  ]);
});

test("createPlayer keeps the gameplay anchor visible when presentation construction fails", async () => {
  const events = [];
  const player = createGameplayPlayer(events);
  const createPlayer = await loadCreatePlayer([
    640,
    480,
    "foundation-response-operative",
    () => ({
      characterId: "foundation-response-operative",
      textureKey: "player",
      animationFamily: "static",
      displayScale: 1
    }),
    () => {},
    () => {
      throw new Error("presentation allocation failed");
    }
  ]);
  const scene = {
    physics: { add: { sprite: () => player } },
    combatFeedback: { trackActor() {}, untrackActor() {} },
    cameras: { main: { startFollow() {} } }
  };

  assert.doesNotThrow(() => createPlayer.call(scene));
  assert.equal(scene.player, player);
  assert.equal(scene.playerPresentation, null);
  assert.equal(player.visible, true);
});

test("update commits movement and presentation before the first selected-weapon attack", async () => {
  const events = [];
  let receivedSnapshot = null;
  let receivedDelta = null;
  const snapshotFactory = (scene) => {
    events.push("snapshot");
    const snapshot = createPlayerPresentationSnapshot(scene);
    assert.equal(Object.isFrozen(snapshot), true);
    return snapshot;
  };
  const update = await loadUpdate(snapshotFactory, () => events.push("legacy-sync"));
  const scene = {
    isGameOver: false,
    isMissionActive: true,
    isPaused: false,
    isLevelUpActive: false,
    elapsedSurvivalMs: 100,
    playerFacingAngle: 0.25,
    dashUntilMs: 0,
    selectedWeaponId: "pistol",
    bossPhaseActive: false,
    player: {
      x: 10,
      y: 20,
      active: true,
      isDying: false,
      body: { velocity: { x: 0, y: 0 } }
    },
    updateTimelineDirector() { events.push("timeline"); },
    updateTimelineEffects() { events.push("timeline-effects"); },
    updateTemporaryBuffs() { events.push("buffs"); },
    updateFacilityEventDirector() { events.push("facility-event"); },
    updateMedkitSpawn() { events.push("medkit"); },
    handlePlayerMovement() {
      events.push("movement");
      this.player.x = 11;
      this.player.body.velocity.x = 30;
    },
    updateWeapons() {
      events.push("weapons");
      assert.equal(events.at(-2), "presentation", "the first shot sees the current formal pose");
    },
    updateEnemies() {
      events.push("enemies");
      this.player.body.velocity.x = 64;
    },
    updateBoss() { events.push("boss"); },
    updatePlayerBullets() { events.push("bullets"); },
    updateEnemyProjectiles() { events.push("enemy-projectiles"); },
    handleExperienceCollection() { events.push("experience"); },
    updateSupplyPickups() { events.push("supplies"); },
    updatePickupRadiusIndicator() { events.push("pickup-radius"); },
    playerPresentation: {
      update(snapshot, delta) {
        events.push("presentation");
        receivedSnapshot = snapshot;
        receivedDelta = delta;
      }
    },
    combatFeedback: { update() { events.push("feedback"); } },
    updatePlayerInvulnerabilityVisual() { events.push("invulnerability"); },
    updateFacilityVisualEffects() { events.push("facility-visuals"); },
    updateTimelineHudCorruption() { events.push("hud-corruption"); },
    updateUI() { events.push("ui"); },
    buildPanel: { visible: false }
  };

  update.call(scene, 0, 16);

  assert.equal(events.includes("legacy-sync"), false);
  assert.deepEqual(events.slice(events.indexOf("movement"), events.indexOf("feedback") + 1), [
    "movement",
    "snapshot",
    "presentation",
    "weapons",
    "enemies",
    "bullets",
    "enemy-projectiles",
    "experience",
    "supplies",
    "pickup-radius",
    "feedback"
  ]);
  assert.equal(receivedDelta, 16);
  assert.deepEqual(receivedSnapshot, {
    active: true,
    x: 11,
    y: 20,
    velocityX: 30,
    velocityY: 0,
    facingAngle: 0.25,
    elapsedMs: 116,
    dashActive: false,
    selectedWeaponId: "pistol"
  });
});

test("a live preview frame advances the presentation animation clock only once", async () => {
  const update = await loadUpdate(createPlayerPresentationSnapshot, () => {});
  const deltas = [];
  const controllerState = { mode: "legacy", previewMode: null };
  const scene = {
    events: new EventEmitter(),
    isGameOver: false,
    isMissionActive: true,
    isPaused: false,
    isLevelUpActive: false,
    elapsedSurvivalMs: 100,
    playerFacingAngle: Math.PI / 2,
    dashUntilMs: 0,
    bossPhaseActive: false,
    player: {
      x: 10,
      y: 20,
      active: true,
      isDying: false,
      isTinted: false,
      body: { velocity: { x: 0, y: 80 } }
    },
    playerPresentation: {
      setPreviewOverride(value) {
        controllerState.previewMode = value?.mode ?? null;
        return true;
      },
      update(_snapshot, delta) {
        deltas.push(delta);
        return true;
      },
      snapshot() {
        return Object.freeze({ ...controllerState });
      }
    },
    updateTimelineDirector() {},
    updateTimelineEffects() {},
    updateTemporaryBuffs() {},
    updateFacilityEventDirector() {},
    updateMedkitSpawn() {},
    handlePlayerMovement() {},
    updateWeapons() {},
    updateEnemies() {},
    updateBoss() {},
    updatePlayerBullets() {},
    updateEnemyProjectiles() {},
    handleExperienceCollection() {},
    updateSupplyPickups() {},
    updatePickupRadiusIndicator() {},
    combatFeedback: { update() {} },
    updatePlayerInvulnerabilityVisual() {},
    updateFacilityVisualEffects() {},
    updateTimelineHudCorruption() {},
    updateUI() {},
    buildPanel: { visible: false }
  };
  const windowRef = {};
  const bridge = installPlayerCharacterVisualStateBridge(scene, windowRef, {
    mode: "body"
  });
  deltas.length = 0;

  scene.events.emit("update", 0, 16);
  update.call(scene, 0, 16);

  assert.equal(
    deltas.reduce((total, delta) => total + delta, 0),
    16,
    "one 16ms Phaser frame must not advance the presentation clock by 32ms"
  );
  assert.equal(deltas.filter((delta) => delta > 0).length, 1);
  bridge.cleanup();
});

test("main installs only explicit development player-presentation previews through the restart-safe bridge", async () => {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const devGuardIndex = source.indexOf("import.meta.env && import.meta.env.DEV");
  const queryIndex = source.indexOf('get("playerPresentation")');
  const dynamicImportIndex = source.indexOf('import("./art/playerCharacterVisualStateDriver.js")');

  assert.ok(devGuardIndex >= 0, "preview uses Vite's statically replaceable development guard");
  assert.ok(queryIndex > devGuardIndex, "the query is read only inside the development branch");
  assert.ok(dynamicImportIndex > queryIndex, "the driver stays dynamically imported after an explicit query");
  assert.match(
    source,
    /\[\s*"states",\s*"body",\s*"legacy",\s*"static",\s*"sample-a",\s*"sample-b",\s*"two-direction"\s*\]\.includes\(previewMode\)/
  );
  assert.match(
    source,
    /schedulePlayerPresentationPreview\(\s*this,\s*window,\s*previewMode,\s*\(\) => import\("\.\/art\/playerCharacterVisualStateDriver\.js"\)\s*\)/,
    "the explicit development branch delegates its dynamic import to the tested scheduler"
  );
  assert.match(
    extractObjectMethod(source, "teardownManagers"),
    /this\._playerPresentationPreviewInstallToken = null;/,
    "shutdown invalidates a pending development-only import"
  );
  assert.doesNotMatch(source, /playerCharacterPrototype/);
  assert.doesNotMatch(source, /events\.on\("update",\s*\(\)\s*=>/);
  assert.doesNotMatch(source, /__SCP_PLAYER_PRESENTATION_PREVIEW__/);
});

test("deferred preview loading installs only the current Scene create token", async () => {
  const schedulePreview = await loadPreviewScheduler();
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const teardown = extractObjectMethod(source, "teardownManagers");
  const teardownManagers = new Function(
    `"use strict"; return ({${teardown}}).teardownManagers;`
  )();
  const windowRef = {};
  const installs = [];
  const errors = [];
  const bridgeModule = {
    installPlayerCharacterVisualStateBridge(scene, receivedWindow, { mode }) {
      installs.push({ scene, receivedWindow, mode });
    }
  };

  const restartScene = {};
  const shutdownDeferred = createDeferred();
  const shutdownLoad = schedulePreview(
    restartScene,
    windowRef,
    "body",
    () => shutdownDeferred.promise,
    (error) => errors.push(error)
  );
  teardownManagers.call(restartScene);
  shutdownDeferred.resolve(bridgeModule);
  assert.equal(await shutdownLoad, false, "shutdown invalidates the pending token");
  assert.deepEqual(installs, []);

  const staleDeferred = createDeferred();
  const currentDeferred = createDeferred();
  const staleLoad = schedulePreview(
    restartScene,
    windowRef,
    "legacy",
    () => staleDeferred.promise,
    (error) => errors.push(error)
  );
  const currentLoad = schedulePreview(
    restartScene,
    windowRef,
    "static",
    () => currentDeferred.promise,
    (error) => errors.push(error)
  );
  staleDeferred.resolve(bridgeModule);
  assert.equal(await staleLoad, false, "a later create token supersedes the old load");
  assert.deepEqual(installs, []);

  currentDeferred.resolve(bridgeModule);
  assert.equal(await currentLoad, true);
  assert.deepEqual(installs, [{
    scene: restartScene,
    receivedWindow: windowRef,
    mode: "static"
  }]);
  assert.deepEqual(errors, []);
});
