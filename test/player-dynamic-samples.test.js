import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import {
  resolveCharacterPresentation
} from "../src/art/characterPresentation.js";
import {
  getPlayerDynamicSampleDefinition
} from "../src/art/playerDynamicSampleDefinitions.js";
import {
  createPlayerPresentationController
} from "../src/art/playerPresentationController.js";
import {
  PLAYER_TWO_DIRECTION_QUALITY_SAMPLE_SOCKETS
} from "../src/art/playerTwoDirectionQualitySampleSockets.js";
import {
  DEVELOPMENT_SPRITESHEET_ASSETS,
  SPRITESHEET_ASSETS,
  TEXTURES
} from "../src/assets/manifest.js";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const SAMPLE_MODES = Object.freeze(["sample-a", "sample-b"]);
const EXPECTED = Object.freeze({
  "sample-a": Object.freeze({
    textureKey: "player-response-operative-breacher-sample-sheet",
    path: "assets/art/characters/player-response-operative-breacher-sample.png",
    frameDurationsMs: Object.freeze([110, 90, 110, 90]),
    settle: Object.freeze({ frame: 2, durationMs: 90, overshootPx: 0 })
  }),
  "sample-b": Object.freeze({
    textureKey: "player-response-operative-cbrn-sample-sheet",
    path: "assets/art/characters/player-response-operative-cbrn-sample.png",
    frameDurationsMs: Object.freeze([150, 130, 150, 130]),
    settle: Object.freeze({ frame: 2, durationMs: 180, overshootPx: 1 })
  })
});

function readPngHeader(bytes) {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  assert.deepEqual([...bytes.subarray(0, 8)], signature);
  assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR");
  return Object.freeze({
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
    bitDepth: bytes[24],
    colorType: bytes[25]
  });
}

function sceneWithFrames(frameTotals) {
  return {
    textures: {
      exists: (key) => Object.hasOwn(frameTotals, key),
      get: (key) => ({ frameTotal: frameTotals[key] })
    }
  };
}

function createSampleControllerScene({
  includeSamples = true,
  graphicsFactory = null
} = {}) {
  const anchor = {
    active: true,
    isDying: false,
    x: 100,
    y: 200,
    depth: 6,
    visible: true,
    characterId: "foundation-response-operative",
    presentationFacing: "left",
    body: {
      width: 24,
      height: 24,
      velocity: { x: -80, y: 0 }
    },
    setVisible(value) {
      this.visible = value;
      return this;
    }
  };
  const frameTotals = {
    [TEXTURES.playerOpeningSheet]: 49,
    ...(includeSamples
      ? {
          [EXPECTED["sample-a"].textureKey]: 6,
          [EXPECTED["sample-b"].textureKey]: 6
        }
      : {})
  };
  const sprites = [];
  const graphics = [];
  const tweens = [];

  function createSprite(textureKey) {
    return {
      active: true,
      texture: { key: textureKey },
      scaleX: 1,
      scaleY: 1,
      originY: 0.5,
      frame: { name: 0 },
      anims: {
        timeScale: 1,
        stop() {},
        pause() {},
        resume() {}
      },
      setOrigin(x, y) {
        this.originX = x;
        this.originY = y;
        return this;
      },
      setScale(value) {
        this.scaleX = value;
        this.scaleY = value;
        return this;
      },
      setTexture(value) {
        this.texture.key = value;
        return this;
      },
      setFrame(value) {
        this.frame.name = value;
        return this;
      },
      setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
      },
      setRotation(value) {
        this.rotation = value;
        return this;
      },
      setVisible(value) {
        this.visible = value;
        return this;
      },
      setDepth(value) {
        this.depth = value;
        return this;
      },
      setAlpha(value) {
        this.alpha = value;
        return this;
      },
      setTint(value) {
        this.tint = value;
        return this;
      },
      clearTint() {
        this.tint = null;
        return this;
      },
      setFlipX(value) {
        this.flipX = value;
        return this;
      },
      play(key) {
        this.played = key;
        return this;
      },
      destroy() {
        this.active = false;
        this.destroyed = true;
      }
    };
  }

  function defaultGraphicsFactory() {
    return {
      active: true,
      body: null,
      commands: [],
      clear() {
        this.commands = [];
        return this;
      },
      lineStyle(...args) {
        this.commands.push(["lineStyle", ...args]);
        return this;
      },
      lineBetween(...args) {
        this.commands.push(["lineBetween", ...args]);
        return this;
      },
      fillStyle(...args) {
        this.commands.push(["fillStyle", ...args]);
        return this;
      },
      fillRect(...args) {
        this.commands.push(["fillRect", ...args]);
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
      setAlpha(value) {
        this.alpha = value;
        return this;
      },
      destroy() {
        this.active = false;
        this.destroyed = true;
      }
    };
  }

  const scene = {
    player: anchor,
    playerFacingAngle: Math.PI,
    elapsedSurvivalMs: 0,
    dashUntilMs: 0,
    sprites,
    graphics,
    tweenRecords: tweens,
    textures: {
      exists: (key) => Object.hasOwn(frameTotals, key),
      get: (key) => ({ frameTotal: frameTotals[key] })
    },
    anims: {
      exists: () => true
    },
    add: {
      sprite(x, y, textureKey) {
        const sprite = createSprite(textureKey);
        sprite.x = x;
        sprite.y = y;
        sprites.push(sprite);
        return sprite;
      },
      graphics() {
        const graphic = graphicsFactory
          ? graphicsFactory()
          : defaultGraphicsFactory();
        if (graphic) graphics.push(graphic);
        return graphic;
      }
    },
    time: {
      delayedCall(_delay, callback) {
        return {
          callback,
          paused: false,
          remove() {}
        };
      }
    },
    tweens: {
      add(config) {
        const tween = {
          ...config,
          active: true,
          removed: false,
          pendingRemove: false,
          isActive() {
            return this.active;
          },
          isRemoved() {
            return this.removed;
          },
          isPendingRemove() {
            return this.pendingRemove;
          },
          advanceToPeak() {
            for (const [property, values] of Object.entries(this.props ?? {})) {
              this.targets[property] = values.to;
            }
          },
          remove() {
            this.active = false;
            this.removed = true;
          },
          stop() {
            this.active = false;
            this.pendingRemove = true;
            this.onStop?.();
          }
        };
        tweens.push(tween);
        return tween;
      }
    }
  };
  return scene;
}

function sampleOverride(mode, {
  facingAngle = Math.PI,
  velocityX = -80,
  velocityY = 0,
  hit = false
} = {}) {
  return { mode, facingAngle, velocityX, velocityY, hit };
}

function readStyledLines(graphic) {
  let style = null;
  const lines = [];
  for (const command of graphic.commands) {
    if (command[0] === "lineStyle") {
      style = command.slice(1);
    } else if (command[0] === "lineBetween") {
      lines.push({
        width: style?.[0],
        color: style?.[1],
        alpha: style?.[2],
        x1: command[1],
        y1: command[2],
        x2: command[3],
        y2: command[4]
      });
    }
  }
  return lines;
}

test("dynamic sample definitions are immutable, frame-exact and visibly distinct in timing", () => {
  for (const mode of SAMPLE_MODES) {
    const definition = getPlayerDynamicSampleDefinition(mode);
    const expected = EXPECTED[mode];
    assert.ok(definition);
    assert.equal(Object.isFrozen(definition), true);
    assert.equal(definition.mode, mode);
    assert.equal(definition.textureKey, expected.textureKey);
    assert.equal(definition.idleFrame, 0);
    assert.deepEqual(definition.walkFrames, [1, 2, 3, 4]);
    assert.deepEqual(definition.frameDurationsMs, expected.frameDurationsMs);
    assert.deepEqual(definition.settle, expected.settle);
    assert.equal(Object.isFrozen(definition.walkFrames), true);
    assert.equal(Object.isFrozen(definition.frameDurationsMs), true);
    assert.equal(Object.isFrozen(definition.settle), true);
    assert.equal(definition.sockets.length, 5);
    assert.equal(Object.isFrozen(definition.sockets), true);
    assert.deepEqual(
      definition.sockets.map(({ index }) => index),
      [0, 1, 2, 3, 4]
    );
    const coordinates = new Set(
      definition.sockets.map((socket) => {
        assert.equal(Object.isFrozen(socket), true);
        assert.equal(["front", "behind"].includes(socket.equipmentLayer), true);
        for (const key of ["gripX", "gripY", "supportX", "supportY"]) {
          assert.equal(Number.isInteger(socket[key]), true);
          assert.equal(socket[key] >= 0 && socket[key] < 64, true);
        }
        return [
          socket.gripX,
          socket.gripY,
          socket.supportX,
          socket.supportY
        ].join(",");
      })
    );
    assert.ok(
      coordinates.size >= 3,
      `${mode} must use measured per-frame sockets, not one copied coordinate`
    );
  }

  assert.notDeepEqual(
    getPlayerDynamicSampleDefinition("sample-a").frameDurationsMs,
    getPlayerDynamicSampleDefinition("sample-b").frameDurationsMs
  );
  assert.equal(getPlayerDynamicSampleDefinition("body"), null);
  assert.equal(getPlayerDynamicSampleDefinition("legacy"), null);
  assert.equal(getPlayerDynamicSampleDefinition(null), null);
});

test("two-direction preview reuses A's existing sheet with the quality timing and generated sockets", () => {
  const source = getPlayerDynamicSampleDefinition("sample-a");
  const trial = getPlayerDynamicSampleDefinition("two-direction");

  assert.ok(trial);
  assert.equal(trial.mode, "two-direction");
  assert.equal(trial.textureKey, source.textureKey);
  assert.deepEqual(trial.walkFrames, [1, 2, 3, 4]);
  assert.deepEqual(trial.frameDurationsMs, [105, 85, 105, 85]);
  assert.deepEqual(trial.settle, {
    frame: 2,
    durationMs: 100,
    overshootPx: 0
  });
  assert.deepEqual(trial.sockets, PLAYER_TWO_DIRECTION_QUALITY_SAMPLE_SOCKETS);
  assert.notEqual(trial.walkFrames, source.walkFrames);
  assert.notEqual(trial.frameDurationsMs, source.frameDurationsMs);
  assert.notEqual(trial.settle, source.settle);
  assert.notEqual(trial.sockets, source.sockets);
  assert.equal(
    DEVELOPMENT_SPRITESHEET_ASSETS.filter(
      ({ key }) => key === trial.textureKey
    ).length,
    1
  );
  assert.deepEqual(
    DEVELOPMENT_SPRITESHEET_ASSETS
      .filter(({ previewQuery }) => previewQuery === undefined)
      .map(({ key }) => key)
      .sort(),
    [
      TEXTURES.playerResponseOperativePrototypeSheet,
      TEXTURES.playerResponseOperativeBodyPrototypeSheet,
      TEXTURES.playerResponseOperativeBreacherSampleSheet,
      TEXTURES.playerResponseOperativeCbrnSampleSheet
    ].sort()
  );
  assert.equal(
    SPRITESHEET_ASSETS.some(({ key }) => key === trial.textureKey),
    false
  );

  const scene = sceneWithFrames({
    [TEXTURES.playerOpeningSheet]: 49,
    [trial.textureKey]: 6
  });
  assert.deepEqual(
    resolveCharacterPresentation(
      scene,
      undefined,
      { sampleMode: "two-direction" }
    ),
    {
      characterId: "foundation-response-operative",
      textureKey: trial.textureKey,
      animationFamily: "dynamic-sample",
      displayScale: 1,
      sampleMode: "two-direction"
    }
  );
});

test("development manifest declares two exact five-frame 64px sample sheets without changing production preload", () => {
  for (const mode of SAMPLE_MODES) {
    const expected = EXPECTED[mode];
    assert.equal(
      Object.values(TEXTURES).filter((key) => key === expected.textureKey).length,
      1
    );
    assert.equal(
      SPRITESHEET_ASSETS.some(({ key }) => key === expected.textureKey),
      false
    );
    const entries = DEVELOPMENT_SPRITESHEET_ASSETS.filter(
      ({ key }) => key === expected.textureKey
    );
    assert.deepEqual(entries, [{
      key: expected.textureKey,
      path: expected.path,
      frameConfig: { frameWidth: 64, frameHeight: 64 }
    }]);
  }
});

test("sample PNGs are native 320x64 RGBA assets", async () => {
  for (const mode of SAMPLE_MODES) {
    const bytes = await readFile(`${ROOT}/public/${EXPECTED[mode].path}`);
    assert.deepEqual(readPngHeader(bytes), {
      width: 320,
      height: 64,
      bitDepth: 8,
      colorType: 6
    });
  }
});

test("sample presentation resolves only for an explicit exact five-frame sheet", () => {
  const legacyFrames = { [TEXTURES.playerOpeningSheet]: 49 };
  const normalScene = sceneWithFrames({
    ...legacyFrames,
    [EXPECTED["sample-a"].textureKey]: 6
  });

  assert.equal(resolveCharacterPresentation(normalScene).animationFamily, "legacy");
  assert.deepEqual(
    resolveCharacterPresentation(
      normalScene,
      undefined,
      { sampleMode: "sample-a" }
    ),
    {
      characterId: "foundation-response-operative",
      textureKey: EXPECTED["sample-a"].textureKey,
      animationFamily: "dynamic-sample",
      displayScale: 1,
      sampleMode: "sample-a"
    }
  );

  const incomplete = sceneWithFrames({
    ...legacyFrames,
    [EXPECTED["sample-a"].textureKey]: 5
  });
  assert.equal(
    resolveCharacterPresentation(
      incomplete,
      undefined,
      { sampleMode: "sample-a" }
    ).animationFamily,
    "legacy"
  );
  assert.equal(
    resolveCharacterPresentation(
      normalScene,
      undefined,
      { sampleMode: "sample-b" }
    ).animationFamily,
    "legacy"
  );
});

test("sample URL modes stay development-only and do not replace normal presentation modes", async () => {
  const [mainSource, driverSource, definitionsSource] = await Promise.all([
    readFile(`${ROOT}/src/main.js`, "utf8"),
    readFile(`${ROOT}/src/art/playerCharacterVisualStateDriver.js`, "utf8"),
    readFile(`${ROOT}/src/art/playerDynamicSampleDefinitions.js`, "utf8")
  ]);

  const devBranch = mainSource.slice(
    mainSource.indexOf("if (import.meta.env && import.meta.env.DEV)"),
    mainSource.indexOf("\n  }\n\n\n  update(", mainSource.indexOf("if (import.meta.env && import.meta.env.DEV)"))
  );
  for (const mode of ["states", "body", "legacy", "static", ...SAMPLE_MODES]) {
    assert.match(devBranch, new RegExp(`["']${mode}["']`));
    assert.match(driverSource, new RegExp(`["']${mode}["']`));
  }
  assert.match(devBranch, /["']two-direction["']/);
  assert.match(driverSource, /["']two-direction["']/);
  assert.doesNotMatch(
    mainSource.slice(0, mainSource.indexOf("if (import.meta.env && import.meta.env.DEV)")),
    /sample-a|sample-b/
  );
  assert.doesNotMatch(
    mainSource.slice(0, mainSource.indexOf("if (import.meta.env && import.meta.env.DEV)")),
    /two-direction/
  );
  assert.doesNotMatch(
    definitionsSource,
    /\b(?:bullet|damage|target|collision|localStorage|setVelocity|body\.)\b/
  );
});

test("sample controller creates one non-physical rig, advances native frames and reads committed attack angle", () => {
  const scene = createSampleControllerScene();
  const anchor = scene.player;
  const bodyBefore = anchor.body;
  const gameplayBefore = {
    x: anchor.x,
    y: anchor.y,
    velocityX: anchor.body.velocity.x,
    velocityY: anchor.body.velocity.y,
    facingAngle: scene.playerFacingAngle
  };
  const controller = createPlayerPresentationController(scene, { anchor });
  const visual = scene.sprites[0];

  assert.equal(controller.setPreviewOverride(sampleOverride("sample-a")), true);
  assert.equal(controller.snapshot().mode, "sample-a");
  assert.equal(controller.snapshot().dynamicSampleMode, "sample-a");
  assert.equal(controller.snapshot().dynamicSampleRig, true);
  assert.equal(visual.texture.key, EXPECTED["sample-a"].textureKey);
  assert.equal(visual.originY, 56 / 64);
  assert.equal(visual.frame.name, 0);
  assert.equal(scene.graphics.length, 2);
  assert.equal(scene.graphics.every((graphic) => graphic.body === null), true);

  const moving = Object.freeze({
    active: true,
    x: 100,
    y: 200,
    velocityX: -80,
    velocityY: 0,
    facingAngle: Math.PI,
    elapsedMs: 110,
    dashActive: false
  });
  assert.equal(controller.update(moving, 0), true);
  assert.equal(visual.frame.name, 1);
  assert.equal(controller.update(moving, 110), true);
  assert.equal(visual.frame.name, 2);

  assert.equal(controller.notifyAttack({ angle: 0, heavy: false }), true);
  scene.tweenRecords.at(-1).advanceToPeak();
  assert.equal(controller.update(moving, 0), true);
  assert.equal(controller.snapshot().dynamicSampleAimCommitted, true);
  assert.equal(controller.snapshot().dynamicSampleAimAngle, 0);
  assert.ok(
    scene.graphics.some((graphic) =>
      graphic.commands.some(
        ([name, x1, _y1, x2]) => name === "lineBetween" && x2 > x1
      )
    ),
    "the dummy equipment renders toward the committed rightward angle"
  );

  assert.equal(anchor.body, bodyBefore);
  assert.deepEqual(
    {
      x: anchor.x,
      y: anchor.y,
      velocityX: anchor.body.velocity.x,
      velocityY: anchor.body.velocity.y,
      facingAngle: scene.playerFacingAngle
    },
    gameplayBefore
  );

  const oldRig = [...scene.graphics];
  assert.equal(controller.setPreviewOverride(sampleOverride("sample-b")), true);
  assert.equal(controller.snapshot().mode, "sample-b");
  assert.equal(controller.snapshot().dynamicSampleMode, "sample-b");
  assert.equal(visual.texture.key, EXPECTED["sample-b"].textureKey);
  assert.equal(oldRig.every((graphic) => graphic.destroyed === true), true);
  assert.equal(scene.graphics.length, 4);

  assert.equal(controller.setPreviewOverride(null), true);
  assert.equal(controller.snapshot().mode, "legacy");
  assert.equal(controller.snapshot().dynamicSampleMode, null);
  assert.equal(controller.snapshot().dynamicSampleRig, false);
  assert.equal(scene.graphics.slice(2).every((graphic) => graphic.destroyed === true), true);
});

test("missing sample assets use complete legacy fallback and rig allocation failure restores the gameplay anchor", () => {
  for (const [previewMode, anchorVisible] of [
    ["sample-a", false],
    ["two-direction", false]
  ]) {
    const missing = createSampleControllerScene({ includeSamples: false });
    const missingController = createPlayerPresentationController(missing, {
      anchor: missing.player
    });
    assert.equal(
      missingController.setPreviewOverride(sampleOverride(previewMode)),
      true,
      previewMode
    );
    assert.equal(missingController.snapshot().mode, "legacy", previewMode);
    assert.equal(missingController.snapshot().previewMode, previewMode, previewMode);
    assert.equal(missingController.snapshot().dynamicSampleRig, false, previewMode);
    assert.equal(missing.player.visible, anchorVisible, previewMode);
    assert.equal(missing.graphics.length, 0, previewMode);
  }

  const failed = createSampleControllerScene({
    graphicsFactory: () => null
  });
  const failedController = createPlayerPresentationController(failed, {
    anchor: failed.player
  });
  assert.equal(
    failedController.setPreviewOverride(sampleOverride("sample-a")),
    false
  );
  assert.equal(failedController.snapshot().fallback, true);
  assert.equal(failedController.snapshot().dynamicSampleRig, false);
  assert.equal(failed.player.visible, true);
  assert.equal(failed.sprites[0].destroyed, true);
});

test("two-direction preview fixes its foot anchor and mirrors only the body and current-frame socket", () => {
  const scene = createSampleControllerScene();
  const controller = createPlayerPresentationController(scene, {
    anchor: scene.player
  });
  const visual = scene.sprites[0];

  const update = ({ velocityX, velocityY, elapsedMs = 100, deltaMs = 16 }) => {
    assert.equal(controller.setPreviewOverride(sampleOverride("two-direction", {
      facingAngle: Math.PI / 2,
      velocityX,
      velocityY
    })), true);
    assert.equal(controller.update(Object.freeze({
      active: true,
      x: 100,
      y: 200,
      velocityX,
      velocityY,
      facingAngle: Math.PI / 2,
      elapsedMs,
      dashActive: false
    }), deltaMs), true);
  };

  update({ velocityX: 0, velocityY: 0, elapsedMs: 0 });
  assert.equal(visual.flipX, false);
  assert.equal(controller.snapshot().dynamicSampleFacing, "left");

  update({ velocityX: -80, velocityY: 0 });
  assert.equal(visual.flipX, false);
  assert.equal(controller.snapshot().dynamicSampleFacing, "left");
  assert.equal(visual.x, 100);
  assert.equal(visual.y, 212, "two-direction body keeps the y + 12 foot anchor while running");
  assert.equal(visual.rotation, 0, "run weight comes from frames, not whole-sprite lean");
  const leftGripLine = scene.graphics
    .flatMap(({ commands }) => commands)
    .find(([name]) => name === "lineBetween");
  assert.deepEqual(
    leftGripLine.slice(1, 3),
    [88, 186],
    "left-facing frame 1 consumes its unmirrored generated grip socket"
  );

  update({ velocityX: 80, velocityY: 0, elapsedMs: 116 });
  assert.equal(visual.flipX, true);
  assert.equal(controller.snapshot().dynamicSampleFacing, "right");
  assert.equal(controller.snapshot().dynamicSampleMirrored, true);
  assert.equal(visual.x, 100);
  assert.equal(visual.y, 212, "right-facing run keeps the same fixed foot anchor");
  assert.equal(visual.rotation, 0);
  const rightGripLine = scene.graphics
    .flatMap(({ commands }) => commands)
    .find(([name]) => name === "lineBetween");
  assert.deepEqual(
    rightGripLine.slice(1, 3),
    [111, 186],
    "right-facing frame 1 mirrors x as 63 - x without changing y or layer"
  );
  assert.equal(scene.graphics[0].commands.length, 0, "front socket remains on the front layer");
  assert.ok(scene.graphics[1].commands.length > 0);

  controller.setPaused(true);
  assert.equal(visual.rotation, 0, "pause cannot restore movement lean");
  controller.setPaused(false);

  update({ velocityX: 0, velocityY: -80, elapsedMs: 132 });
  assert.equal(visual.flipX, true, "pure up preserves the last right-facing state");
  update({ velocityX: 0, velocityY: 80, elapsedMs: 148 });
  assert.equal(visual.flipX, true, "pure down preserves the last right-facing state");

  assert.equal(controller.notifyAttack({ angle: Math.PI, heavy: false }), true);
  scene.tweenRecords.at(-1).advanceToPeak();
  update({ velocityX: 0, velocityY: -80, elapsedMs: 164 });
  assert.equal(controller.snapshot().dynamicSampleFacing, "right");
  assert.equal(controller.snapshot().dynamicSampleAimAngle, Math.PI);
  assert.equal(scene.playerFacingAngle, Math.PI);
  assert.deepEqual(scene.player.body.velocity, { x: -80, y: 0 });
});

test("two-direction stop settles on frame 2 for exactly 100ms before returning idle", () => {
  const scene = createSampleControllerScene();
  const controller = createPlayerPresentationController(scene, { anchor: scene.player });
  const visual = scene.sprites[0];
  const update = (velocityX, deltaMs) => {
    assert.equal(controller.setPreviewOverride(sampleOverride("two-direction", {
      facingAngle: Math.PI,
      velocityX,
      velocityY: 0
    })), true);
    assert.equal(controller.update(Object.freeze({
      active: true,
      x: 100,
      y: 200,
      velocityX,
      velocityY: 0,
      facingAngle: Math.PI,
      elapsedMs: 100,
      dashActive: false
    }), deltaMs), true);
  };

  update(-80, 0);
  assert.equal(visual.frame.name, 1);
  update(0, 250);
  assert.equal(
    visual.frame.name,
    2,
    "the first stopped update renders the authored settle frame without consuming its delta"
  );
  update(0, 99);
  assert.equal(visual.frame.name, 2);
  update(0, 1);
  assert.equal(visual.frame.name, 0);
});

test("two-direction aim and recoil move only the connected rig and use the quality weapon silhouette", () => {
  const scene = createSampleControllerScene();
  const controller = createPlayerPresentationController(scene, { anchor: scene.player });
  const visual = scene.sprites[0];
  const moving = Object.freeze({
    active: true,
    x: 100,
    y: 200,
    velocityX: -80,
    velocityY: 0,
    facingAngle: Math.PI,
    elapsedMs: 100,
    dashActive: false
  });

  assert.equal(controller.setPreviewOverride(sampleOverride("two-direction")), true);
  assert.equal(controller.update(moving, 0), true);
  const bodyBefore = {
    x: visual.x,
    y: visual.y,
    rotation: visual.rotation,
    flipX: visual.flipX,
    frame: visual.frame.name
  };
  const gameplayBefore = {
    x: scene.player.x,
    y: scene.player.y,
    velocity: { ...scene.player.body.velocity },
    facingAngle: scene.playerFacingAngle
  };

  assert.equal(controller.notifyAttack({ angle: 0, heavy: false }), true);
  const lightTween = scene.tweenRecords.at(-1);
  assert.equal(lightTween.duration, 75);
  assert.equal(lightTween.props.recoilPx.to, 2);
  assert.equal(controller.update(moving, 0), true);
  assert.equal(controller.snapshot().dynamicSampleAimAngle, 0);
  assert.deepEqual({
    x: visual.x,
    y: visual.y,
    rotation: visual.rotation,
    flipX: visual.flipX,
    frame: visual.frame.name
  }, bodyBefore, "aim does not steer, rotate or move the body sprite");

  const qualityLines = readStyledLines(scene.graphics[1]);
  for (const expectedLine of [
    { width: 7, x1: 90, y1: 188, x2: 97, y2: 188 },
    { width: 6, x1: 97, y1: 188, x2: 109, y2: 188 },
    { width: 2, x1: 109, y1: 188, x2: 121, y2: 188 },
    { width: 4, x1: 102, y1: 190, x2: 102, y2: 195 }
  ]) {
    assert.ok(
      qualityLines.some((line) => (
        line.width === expectedLine.width
        && line.x1 === expectedLine.x1
        && line.y1 === expectedLine.y1
        && line.x2 === expectedLine.x2
        && line.y2 === expectedLine.y2
      )),
      `quality weapon segment is missing: ${JSON.stringify(expectedLine)}`
    );
  }

  lightTween.advanceToPeak();
  assert.equal(controller.update(moving, 0), true);
  assert.deepEqual({
    x: visual.x,
    y: visual.y,
    rotation: visual.rotation,
    flipX: visual.flipX,
    frame: visual.frame.name
  }, bodyBefore, "light recoil translates only the connected rig");

  assert.equal(controller.notifyAttack({ angle: Math.PI / 2, heavy: true }), true);
  const heavyTween = scene.tweenRecords.at(-1);
  assert.equal(heavyTween.duration, 90);
  assert.equal(heavyTween.props.recoilPx.to, 3);
  heavyTween.advanceToPeak();
  assert.equal(controller.update(moving, 0), true);
  assert.deepEqual({
    x: visual.x,
    y: visual.y,
    rotation: visual.rotation,
    flipX: visual.flipX,
    frame: visual.frame.name
  }, bodyBefore, "heavy recoil translates only the connected rig");
  assert.deepEqual({
    x: scene.player.x,
    y: scene.player.y,
    velocity: { ...scene.player.body.velocity },
    facingAngle: scene.playerFacingAngle
  }, gameplayBefore);

  const comparison = createSampleControllerScene();
  const comparisonController = createPlayerPresentationController(comparison, {
    anchor: comparison.player
  });
  assert.equal(comparisonController.setPreviewOverride(sampleOverride("sample-a", {
    facingAngle: 0,
    velocityX: -80,
    velocityY: 0
  })), true);
  assert.equal(comparisonController.update(moving, 0), true);
  assert.equal(comparisonController.notifyAttack({ angle: 0 }), true);
  assert.equal(comparisonController.update(moving, 0), true);
  assert.equal(
    readStyledLines(comparison.graphics[1]).some(({ width, x1, x2 }) => (
      width === 6 && x1 === 97 && x2 === 109
    )),
    false,
    "the quality test weapon stays scoped to two-direction"
  );
});

test("existing sample-a remains a fixed native left-facing comparison", () => {
  const scene = createSampleControllerScene();
  const controller = createPlayerPresentationController(scene, { anchor: scene.player });
  assert.equal(controller.setPreviewOverride(sampleOverride("sample-a", {
    facingAngle: 0,
    velocityX: 80,
    velocityY: 0
  })), true);
  assert.equal(controller.update({
    active: true,
    x: 100,
    y: 200,
    velocityX: 80,
    velocityY: 0,
    facingAngle: 0,
    elapsedMs: 100,
    dashActive: false
  }, 16), true);
  assert.equal(scene.sprites[0].flipX, false);
  assert.equal(controller.snapshot().dynamicSampleFacing, null);
});
