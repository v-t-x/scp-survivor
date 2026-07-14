import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { TEXTURES } from "../src/assets/manifest.js";
import {
  ENEMY_PRESENTATION,
  applyEnemyPresentation,
  registerEnemyAnimations
} from "../src/art/enemyPresentation.js";
import { runPreloadCreatePipeline } from "../src/scenes/preloadOrchestration.js";

const EXPECTED_PRESENTATION = {
  infectedStaff: {
    productionTextureKey: TEXTURES.r17Drifter,
    animationKey: "r17-drifter-loop",
    frameWidth: 48,
    frameHeight: 48,
    frameRate: 6
  },
  crawler: {
    productionTextureKey: TEXTURES.r17RiftSkimmer,
    animationKey: "r17-rift-skimmer-loop",
    frameWidth: 48,
    frameHeight: 48,
    frameRate: 10
  },
  drone: {
    productionTextureKey: TEXTURES.r17PulseSac,
    animationKey: "r17-pulse-sac-loop",
    frameWidth: 48,
    frameHeight: 48,
    frameRate: 6
  },
  riotUnit: {
    productionTextureKey: TEXTURES.r17CarapaceGate,
    animationKey: "r17-carapace-gate-loop",
    frameWidth: 64,
    frameHeight: 64,
    frameRate: 4
  },
  blinkStalker: {
    productionTextureKey: TEXTURES.r17FrameGap,
    animationKey: "r17-frame-gap-loop",
    frameWidth: 64,
    frameHeight: 64,
    frameRate: 8
  },
  biomass: {
    productionTextureKey: TEXTURES.r17BroodMass,
    animationKey: "r17-brood-mass-loop",
    frameWidth: 64,
    frameHeight: 64,
    frameRate: 4
  },
  biomassChild: {
    productionTextureKey: TEXTURES.r17Bud,
    animationKey: "r17-bud-loop",
    frameWidth: 32,
    frameHeight: 32,
    frameRate: 10
  }
};

const FALLBACK_TEXTURES = {
  infectedStaff: TEXTURES.enemyInfected,
  crawler: TEXTURES.enemyCrawler,
  drone: TEXTURES.enemyDrone,
  riotUnit: TEXTURES.eliteRiot,
  blinkStalker: TEXTURES.eliteBlink,
  biomass: TEXTURES.eliteBiomass,
  biomassChild: TEXTURES.biomassChild
};

function createScene(frameTotals = {}) {
  const availableFrames = new Map(Object.entries(frameTotals));
  const existingAnimations = new Set();
  const created = [];
  return {
    created,
    textures: {
      exists: (key) => availableFrames.has(key),
      get: (key) => ({ frameTotal: availableFrames.get(key) })
    },
    anims: {
      exists: (key) => existingAnimations.has(key),
      generateFrameNumbers: (textureKey, range) => ({ textureKey, ...range }),
      create(config) {
        existingAnimations.add(config.key);
        created.push(config);
      }
    }
  };
}

function createEnemyStub({
  fallbackTextureKey,
  fallbackFrameWidth,
  fallbackFrameHeight,
  productionFrameWidth,
  productionFrameHeight,
  sourceWidth,
  sourceHeight,
  offsetX,
  offsetY,
  radius = 0,
  pendingScale = 1,
  x = 100,
  y = 200,
  withBody = true
}) {
  const calls = {
    play: [],
    setFlipX: [],
    setScale: [],
    setTexture: []
  };
  const textureFrames = {
    [fallbackTextureKey]: {
      width: fallbackFrameWidth,
      height: fallbackFrameHeight,
      originX: fallbackFrameWidth / 2,
      originY: fallbackFrameHeight / 2
    }
  };
  for (const config of Object.values(EXPECTED_PRESENTATION)) {
    textureFrames[config.productionTextureKey] = {
      width: productionFrameWidth ?? config.frameWidth,
      height: productionFrameHeight ?? config.frameHeight,
      originX: (productionFrameWidth ?? config.frameWidth) * 0.375,
      originY: (productionFrameHeight ?? config.frameHeight) * 0.625
    };
  }

  const gameObject = {
    x,
    y,
    width: fallbackFrameWidth,
    height: fallbackFrameHeight,
    scaleX: 1,
    scaleY: 1,
    displayOriginX: fallbackFrameWidth / 2,
    displayOriginY: fallbackFrameHeight / 2,
    texture: { key: fallbackTextureKey },
    calls,
    setTexture(key, frame) {
      calls.setTexture.push([key, frame]);
      const textureFrame = textureFrames[key];
      this.texture.key = key;
      this.width = textureFrame.width;
      this.height = textureFrame.height;
      this.displayOriginX = textureFrame.originX;
      this.displayOriginY = textureFrame.originY;
      if (this.body) {
        // Model Phaser changing the frame-derived body source dimensions when
        // a texture with a different frame size is selected.
        this.body.sourceWidth = textureFrame.width;
        this.body.sourceHeight = textureFrame.height;
      }
      return this;
    },
    setScale(scale) {
      calls.setScale.push(scale);
      this.scaleX = scale;
      this.scaleY = scale;
      return this;
    },
    setFlipX(value) {
      calls.setFlipX.push(value);
      return this;
    },
    play(key, ignoreIfPlaying) {
      calls.play.push([key, ignoreIfPlaying]);
      return this;
    }
  };

  if (withBody) {
    gameObject.body = {
      sourceWidth,
      sourceHeight,
      width: sourceWidth,
      height: sourceHeight,
      halfWidth: sourceWidth / 2,
      halfHeight: sourceHeight / 2,
      radius,
      isCircle: radius > 0,
      _sx: 1,
      _sy: 1,
      updateCount: 0,
      offset: {
        x: offsetX,
        y: offsetY,
        set(nextX, nextY) {
          this.x = nextX;
          this.y = nextY;
        }
      },
      position: { x: 0, y: 0 },
      updateFromGameObject() {
        this.updateCount += 1;
        this._sx = gameObject.scaleX;
        this._sy = gameObject.scaleY;
        this.width = this.sourceWidth * Math.abs(gameObject.scaleX);
        this.height = this.sourceHeight * Math.abs(gameObject.scaleY);
        this.halfWidth = this.width / 2;
        this.halfHeight = this.height / 2;
        this.position.x =
          gameObject.x
          + gameObject.scaleX * (this.offset.x - gameObject.displayOriginX);
        this.position.y =
          gameObject.y
          + gameObject.scaleY * (this.offset.y - gameObject.displayOriginY);
      }
    };
    gameObject.body.updateFromGameObject();
  }

  gameObject.setScale(pendingScale);
  for (const callList of Object.values(calls)) callList.length = 0;
  return gameObject;
}

function effectiveBodySnapshot(gameObject) {
  return {
    gameObjectX: gameObject.x,
    gameObjectY: gameObject.y,
    x: gameObject.x
      + gameObject.scaleX * (gameObject.body.offset.x - gameObject.displayOriginX),
    y: gameObject.y
      + gameObject.scaleY * (gameObject.body.offset.y - gameObject.displayOriginY),
    width: gameObject.body.sourceWidth * Math.abs(gameObject.scaleX),
    height: gameObject.body.sourceHeight * Math.abs(gameObject.scaleY),
    radius: gameObject.body.radius,
    isCircle: gameObject.body.isCircle
  };
}

test("enemy presentation contract contains exactly the seven approved R-17 loops", () => {
  assert.deepEqual(ENEMY_PRESENTATION, EXPECTED_PRESENTATION);
  assert.ok(Object.isFrozen(ENEMY_PRESENTATION));
  for (const config of Object.values(ENEMY_PRESENTATION)) {
    assert.ok(Object.isFrozen(config));
  }
});

test("only exact four-frame production sheets register complete idempotent loops", () => {
  const validFrames = Object.fromEntries(
    Object.values(ENEMY_PRESENTATION).map(({ productionTextureKey }) => [
      productionTextureKey,
      5
    ])
  );
  const scene = createScene(validFrames);

  registerEnemyAnimations(scene);
  registerEnemyAnimations(scene);

  assert.equal(scene.created.length, 7);
  const byKey = new Map(scene.created.map((animation) => [animation.key, animation]));
  for (const config of Object.values(EXPECTED_PRESENTATION)) {
    assert.deepEqual(byKey.get(config.animationKey), {
      key: config.animationKey,
      frames: {
        textureKey: config.productionTextureKey,
        start: 0,
        end: 3
      },
      frameRate: config.frameRate,
      repeat: -1
    });
  }

  for (const frameTotal of [undefined, 4, 6]) {
    const invalidScene = createScene(
      frameTotal === undefined ? {} : { [TEXTURES.r17Drifter]: frameTotal }
    );
    registerEnemyAnimations(invalidScene);
    assert.deepEqual(invalidScene.created, [], `frameTotal ${frameTotal} must be rejected`);
  }
});

test("missing, incomplete and extra-frame sheets leave fallback display state untouched", () => {
  for (const frameTotal of [undefined, 4, 6]) {
    const scene = createScene(
      frameTotal === undefined ? {} : { [TEXTURES.r17Drifter]: frameTotal }
    );
    const enemy = createEnemyStub({
      fallbackTextureKey: TEXTURES.enemyInfected,
      fallbackFrameWidth: 32,
      fallbackFrameHeight: 32,
      productionFrameWidth: 48,
      productionFrameHeight: 48,
      sourceWidth: 20,
      sourceHeight: 20,
      offsetX: 6,
      offsetY: 7,
      radius: 10,
      pendingScale: 1.15
    });
    const before = effectiveBodySnapshot(enemy);

    assert.equal(applyEnemyPresentation(scene, enemy, "infectedStaff"), enemy);

    assert.equal(enemy.texture.key, TEXTURES.enemyInfected);
    assert.equal(enemy.scaleX, 1.15);
    assert.equal(enemy.scaleY, 1.15);
    assert.deepEqual(enemy.calls, {
      play: [],
      setFlipX: [],
      setScale: [],
      setTexture: []
    });
    assert.deepEqual(effectiveBodySnapshot(enemy), before);
  }
});

test("a complete production sheet applies texture, unit scale and its loop", () => {
  const scene = createScene({ [TEXTURES.r17Drifter]: 5 });
  registerEnemyAnimations(scene);
  const enemy = createEnemyStub({
    fallbackTextureKey: TEXTURES.enemyInfected,
    fallbackFrameWidth: 32,
    fallbackFrameHeight: 32,
    productionFrameWidth: 48,
    productionFrameHeight: 48,
    sourceWidth: 20,
    sourceHeight: 20,
    offsetX: 6,
    offsetY: 6,
    pendingScale: 1.15,
    withBody: false
  });

  assert.equal(applyEnemyPresentation(scene, enemy, "infectedStaff"), enemy);

  assert.equal(enemy.texture.key, TEXTURES.r17Drifter);
  assert.equal(enemy.scaleX, 1);
  assert.equal(enemy.scaleY, 1);
  assert.deepEqual(enemy.calls.setTexture, [[TEXTURES.r17Drifter, 0]]);
  assert.deepEqual(enemy.calls.setScale, [1]);
  assert.deepEqual(enemy.calls.setFlipX, [false]);
  assert.deepEqual(enemy.calls.play, [["r17-drifter-loop", true]]);
});

test("all seven swaps preserve effective world-space body geometry after stale scaling", () => {
  const bodyCases = {
    infectedStaff: { source: [20, 20], offset: [7, 5], radius: 10, scale: 1.15 },
    crawler: { source: [18, 14], offset: [3, 9], radius: 7, scale: 0.9 },
    drone: { source: [24, 18], offset: [8, 4], radius: 0, scale: 1.05 },
    riotUnit: { source: [39, 35], offset: [11, 6], radius: 0, scale: 1.2 },
    blinkStalker: { source: [31, 37], offset: [5, 13], radius: 0, scale: 1.2 },
    biomass: { source: [42, 38], offset: [14, 10], radius: 0, scale: 1.2 },
    biomassChild: { source: [13, 11], offset: [2, 6], radius: 0, scale: 0.85 }
  };
  const validFrames = Object.fromEntries(
    Object.values(ENEMY_PRESENTATION).map(({ productionTextureKey }) => [
      productionTextureKey,
      5
    ])
  );
  const scene = createScene(validFrames);
  registerEnemyAnimations(scene);

  for (const [index, [enemyType, bodyCase]] of Object.entries(bodyCases).entries()) {
    const config = ENEMY_PRESENTATION[enemyType];
    const enemy = createEnemyStub({
      fallbackTextureKey: FALLBACK_TEXTURES[enemyType],
      fallbackFrameWidth: 28 + index * 3,
      fallbackFrameHeight: 30 + index * 2,
      productionFrameWidth: config.frameWidth,
      productionFrameHeight: config.frameHeight,
      sourceWidth: bodyCase.source[0],
      sourceHeight: bodyCase.source[1],
      offsetX: bodyCase.offset[0],
      offsetY: bodyCase.offset[1],
      radius: bodyCase.radius,
      pendingScale: bodyCase.scale,
      x: 101 + index * 17,
      y: 203 - index * 11
    });
    const expected = effectiveBodySnapshot(enemy);
    assert.notEqual(
      enemy.body._sx,
      enemy.scaleX,
      `${enemyType} must begin with a stale body scale`
    );

    applyEnemyPresentation(scene, enemy, enemyType);

    assert.equal(enemy.x, expected.gameObjectX, `${enemyType} changed game object x`);
    assert.equal(enemy.y, expected.gameObjectY, `${enemyType} changed game object y`);
    assert.equal(enemy.body.position.x, expected.x, `${enemyType} changed body world x`);
    assert.equal(enemy.body.position.y, expected.y, `${enemyType} changed body world y`);
    assert.equal(enemy.body.width, expected.width, `${enemyType} changed body width`);
    assert.equal(enemy.body.height, expected.height, `${enemyType} changed body height`);
    assert.equal(enemy.body.radius, expected.radius, `${enemyType} changed body radius`);
    assert.equal(enemy.body.isCircle, expected.isCircle, `${enemyType} changed body shape`);
    assert.equal(enemy.texture.key, config.productionTextureKey);
    assert.equal(enemy.scaleX, 1);
    assert.equal(enemy.scaleY, 1);
    assert.deepEqual(enemy.calls.play, [[config.animationKey, true]]);
    assert.equal(enemy.body.updateCount, 3, `${enemyType} must sync before and after the swap`);
  }
});

test("unknown enemy types are inert even when production sheets exist", () => {
  const scene = createScene({ [TEXTURES.r17Drifter]: 5 });
  const enemy = createEnemyStub({
    fallbackTextureKey: TEXTURES.enemyCrawler,
    fallbackFrameWidth: 24,
    fallbackFrameHeight: 24,
    productionFrameWidth: 48,
    productionFrameHeight: 48,
    sourceWidth: 16,
    sourceHeight: 12,
    offsetX: 3,
    offsetY: 4,
    pendingScale: 0.75
  });
  const before = effectiveBodySnapshot(enemy);

  assert.equal(applyEnemyPresentation(scene, enemy, "unknownType"), enemy);
  assert.equal(enemy.texture.key, TEXTURES.enemyCrawler);
  assert.equal(enemy.scaleX, 0.75);
  assert.deepEqual(enemy.calls, {
    play: [],
    setFlipX: [],
    setScale: [],
    setTexture: []
  });
  assert.deepEqual(effectiveBodySnapshot(enemy), before);
});

test("enemy adapter stays display-only and has no per-frame sync API", async () => {
  const source = await readFile(
    new URL("../src/art/enemyPresentation.js", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /syncEnemyPresentation/);
  assert.doesNotMatch(source, /\.(?:health|speed|damage|behavior|timer|velocity)\s*=/i);
  assert.doesNotMatch(source, /\.body\./);
  assert.doesNotMatch(source, /\.(?:setSize|setOffset|setCircle|setVelocity)\s*\(/);
});

test("preload create pipeline invokes each dependency once with one scene in exact order", () => {
  const calls = [];
  const scene = {
    name: "preload-scene",
    scene: {
      start(key) {
        calls.push(["start", key]);
      }
    }
  };
  const dependency = (name) => (receivedScene) => calls.push([name, receivedScene]);

  runPreloadCreatePipeline(scene, {
    generateFallbackTextures: dependency("fallback"),
    registerOpeningCharacterAnimations: dependency("opening"),
    registerEnemyAnimations: dependency("enemy")
  });

  assert.deepEqual(calls.map(([name]) => name), [
    "fallback",
    "opening",
    "enemy",
    "start"
  ]);
  assert.equal(calls.length, 4);
  for (const [, receivedScene] of calls.slice(0, 3)) {
    assert.equal(receivedScene, scene);
  }
  assert.deepEqual(calls[3], ["start", "PrototypeScene"]);
});

test("PreloadScene delegates creation through the no-DOM pipeline before scene start", async () => {
  const [source, pipelineSource] = await Promise.all([
    readFile(new URL("../src/scenes/PreloadScene.js", import.meta.url), "utf8"),
    readFile(new URL("../src/scenes/preloadOrchestration.js", import.meta.url), "utf8")
  ]);

  assert.match(
    source,
    /runPreloadCreatePipeline\(this,\s*\{\s*generateFallbackTextures,\s*registerOpeningCharacterAnimations,\s*registerEnemyAnimations\s*\}\s*\)/
  );
  assert.doesNotMatch(source, /this\.scene\.start\("PrototypeScene"\)/);
  assert.match(pipelineSource, /scene\.scene\.start\("PrototypeScene"\)/);
  assert.doesNotMatch(pipelineSource, /from\s+["']phaser["']/i);
});
