import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

import {
  SPRITESHEET_ASSETS,
  TEXTURES
} from "../src/assets/manifest.js";
import { BALANCE } from "../src/config/balance.js";
import * as enemyPresentationModule from "../src/art/enemyPresentation.js";
import {
  CHARACTER_DISPLAY_SCALE,
  applyDisplayScalePreservingBody,
  centerCircularBody
} from "../src/art/presentationRules.js";
import { runPreloadCreatePipeline } from "../src/scenes/preloadOrchestration.js";

const {
  ENEMY_PRESENTATION,
  applyEnemyPresentation,
  getEnemyAnimationKey,
  getEnemyPresentationMode,
  getScp049LocomotionAnimationKey,
  getScp049PresentationMode,
  registerEnemyAnimations
} = enemyPresentationModule;

const CANDIDATE_OPTIONS = {
  isDevelopment: true,
  candidateMode: true,
  candidateIds: [
    "r17-drifter-action-sheet",
    "r17-rift-skimmer-action-sheet",
    "r17-pulse-sac-action-sheet",
    "r17-carapace-gate-action-sheet",
    "r17-frame-gap-action-sheet",
    "r17-brood-mass-action-sheet",
    "r17-bud-action-sheet",
    "enemy-scp049-locomotion-sheet",
    "enemy-scp049-action-sheet"
  ]
};

const FORMAL_R17_CONTRACTS = {
  infectedStaff: {
    textureKey: "r17-drifter-action-sheet",
    frameTotal: 19,
    prefix: "r17-drifter-action",
    clips: {
      move: [0, 5, 6, -1], hit: [6, 7, 24, 0], death: [8, 13, 12, 0], contact: [14, 17, 12, 0]
    }
  },
  crawler: {
    textureKey: "r17-rift-skimmer-action-sheet",
    frameTotal: 19,
    prefix: "r17-rift-skimmer-action",
    clips: {
      move: [0, 5, 12, -1], hit: [6, 7, 24, 0], death: [8, 13, 12, 0], pierce: [14, 17, 15, 0]
    }
  },
  drone: {
    textureKey: "r17-pulse-sac-action-sheet",
    frameTotal: 21,
    prefix: "r17-pulse-sac-action",
    clips: {
      move: [0, 5, 6, -1], hit: [6, 7, 24, 0], death: [8, 13, 12, 0], shoot: [14, 19, 10, 0]
    }
  },
  riotUnit: {
    textureKey: "r17-carapace-gate-action-sheet",
    frameTotal: 23,
    prefix: "r17-carapace-gate-action",
    clips: {
      move: [0, 5, 6, -1], hit: [6, 7, 24, 0], death: [8, 13, 12, 0], brace: [14, 17, 5, 0], charge: [18, 21, 9, -1]
    }
  },
  blinkStalker: {
    textureKey: "r17-frame-gap-action-sheet",
    frameTotal: 23,
    prefix: "r17-frame-gap-action",
    clips: {
      move: [0, 5, 8, -1], hit: [6, 7, 24, 0], death: [8, 13, 12, 0], "phase-out": [14, 17, 6, 0], "reappear-dash": [18, 21, 12.5, -1]
    }
  },
  biomass: {
    textureKey: "r17-brood-mass-action-sheet",
    frameTotal: 23,
    prefix: "r17-brood-mass-action",
    clips: {
      move: [0, 5, 5, -1], hit: [6, 7, 24, 0], death: [8, 13, 12, 0], split: [14, 21, 12, 0]
    }
  },
  biomassChild: {
    textureKey: "r17-bud-action-sheet",
    frameTotal: 19,
    prefix: "r17-bud-action",
    clips: {
      move: [0, 5, 12, -1], hit: [6, 7, 24, 0], death: [8, 13, 12, 0], snap: [14, 17, 16, 0]
    }
  }
};

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

function createScene(frameTotals = {}, { existingAnimations = [], failOnCreate = null } = {}) {
  const availableFrames = new Map(Object.entries(frameTotals));
  const registeredAnimations = new Set(existingAnimations);
  const created = [];
  return {
    created,
    textures: {
      exists: (key) => availableFrames.has(key),
      get: (key) => ({ frameTotal: availableFrames.get(key) })
    },
    anims: {
      exists: (key) => registeredAnimations.has(key),
      generateFrameNumbers: (textureKey, range) => ({ textureKey, ...range }),
      create(config) {
        if (config.key === failOnCreate) throw new Error(`refused ${config.key}`);
        registeredAnimations.add(config.key);
        created.push(config);
      },
      remove(key) {
        registeredAnimations.delete(key);
        const index = created.findIndex((animation) => animation.key === key);
        if (index >= 0) created.splice(index, 1);
      }
    }
  };
}

async function loadPreloadSceneForBehavior({ isDevelopment, manifestModule = null }) {
  const entryPoint = fileURLToPath(new URL("../src/scenes/PreloadScene.js", import.meta.url));
  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    define: {
      "import.meta.env.DEV": JSON.stringify(isDevelopment)
    },
    plugins: [{
      name: "preload-scene-test-boundaries",
      setup(esbuild) {
        esbuild.onResolve({ filter: /^phaser$/ }, () => ({ path: "phaser", namespace: "test-stub" }));
        esbuild.onLoad({ filter: /^phaser$/, namespace: "test-stub" }, () => ({
          contents: "export default { Scene: class Scene {} };",
          loader: "js"
        }));

        if (manifestModule !== null) {
          esbuild.onResolve({ filter: /assets[\\/]manifest\.js$/ }, () => ({
            path: "manifest",
            namespace: "test-stub"
          }));
          esbuild.onLoad({ filter: /^manifest$/, namespace: "test-stub" }, () => ({
            contents: manifestModule,
            loader: "js"
          }));
        }

        const runtimeStubs = [
          [/fallbackTextureFactory\.js$/, "export function generateFallbackTextures() {}"],
          [/characterPresentation\.js$/, "export function registerOpeningCharacterAnimations() {}"],
          [/enemyPresentation\.js$/, "export function registerEnemyAnimations() {}"],
          [/preloadOrchestration\.js$/, "export function runPreloadCreatePipeline() {}"]
        ];
        for (const [filter, contents] of runtimeStubs) {
          esbuild.onResolve({ filter }, () => ({
            path: filter.source,
            namespace: "test-stub",
            pluginData: { contents }
          }));
        }
        esbuild.onLoad({ filter: /.*/, namespace: "test-stub" }, (args) => {
          return args.pluginData?.contents
            ? { contents: args.pluginData.contents, loader: "js" }
            : null;
        });
      }
    }]
  });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString("base64")}`);
}

async function collectPreloadSpritesheets({ isDevelopment, search = "", manifestModule = null }) {
  const { PreloadScene } = await loadPreloadSceneForBehavior({ isDevelopment, manifestModule });
  const previousLocation = globalThis.location;
  globalThis.location = { search };
  try {
    const scene = new PreloadScene();
    const requested = [];
    scene.load = {
      image() {},
      spritesheet(key, assetPath, frameConfig) {
        requested.push({ key, path: assetPath, frameConfig });
      },
      atlas() {},
      audio() {}
    };
    scene.preload();
    return requested;
  } finally {
    if (previousLocation === undefined) delete globalThis.location;
    else globalThis.location = previousLocation;
  }
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
  for (const config of Object.values(FORMAL_R17_CONTRACTS)) {
    const formalFrameSize = config.textureKey === "r17-bud-action-sheet"
      ? 32
      : ["carapace", "frame-gap", "brood"].some((name) => config.textureKey.includes(name))
        ? 64
        : 48;
    textureFrames[config.textureKey] = {
      width: productionFrameWidth ?? formalFrameSize,
      height: productionFrameHeight ?? formalFrameSize,
      originX: (productionFrameWidth ?? formalFrameSize) / 2,
      originY: (productionFrameHeight ?? formalFrameSize) / 2
    };
  }
  for (const key of ["enemy-scp049-locomotion-sheet", "enemy-scp049-action-sheet"]) {
    textureFrames[key] = {
      width: productionFrameWidth ?? 80,
      height: productionFrameHeight ?? 96,
      originX: (productionFrameWidth ?? 80) / 2,
      originY: (productionFrameHeight ?? 96) / 2
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

function extractObjectMethod(source, methodName) {
  const start = source.indexOf(`  ${methodName}(`);
  assert.notEqual(start, -1, `${methodName} must exist`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) {
      return source.slice(start, index + 1).trim();
    }
  }
  throw new Error(`Could not extract ${methodName}`);
}

function createDisplaySpy(kind) {
  return {
    kind,
    active: true,
    commands: [],
    destroyCount: 0,
    setOrigin(...args) {
      this.commands.push(["setOrigin", ...args]);
      return this;
    },
    setDepth(...args) {
      this.commands.push(["setDepth", ...args]);
      return this;
    },
    clear(...args) {
      this.commands.push(["clear", ...args]);
      return this;
    },
    lineStyle(...args) {
      this.commands.push(["lineStyle", ...args]);
      return this;
    },
    beginPath(...args) {
      this.commands.push(["beginPath", ...args]);
      return this;
    },
    arc(...args) {
      this.commands.push(["arc", ...args]);
      return this;
    },
    strokePath(...args) {
      this.commands.push(["strokePath", ...args]);
      return this;
    },
    lineBetween(...args) {
      this.commands.push(["lineBetween", ...args]);
      return this;
    },
    strokeRect(...args) {
      this.commands.push(["strokeRect", ...args]);
      return this;
    },
    strokeCircle(...args) {
      this.commands.push(["strokeCircle", ...args]);
      return this;
    },
    setPosition(...args) {
      this.commands.push(["setPosition", ...args]);
      return this;
    },
    setRotation(...args) {
      this.commands.push(["setRotation", ...args]);
      return this;
    },
    destroy() {
      this.destroyCount += 1;
      this.active = false;
    }
  };
}

function createEliteVisualScene() {
  const created = {
    graphics: [],
    texts: [],
    triangles: [],
    transients: []
  };
  return {
    created,
    clearEliteWarningCalls: 0,
    add: {
      text(...args) {
        const object = createDisplaySpy("text");
        object.createArgs = args;
        created.texts.push(object);
        return object;
      },
      graphics(...args) {
        const object = createDisplaySpy("graphics");
        object.createArgs = args;
        created.graphics.push(object);
        return object;
      },
      triangle(...args) {
        const object = createDisplaySpy("triangle");
        object.createArgs = args;
        created.triangles.push(object);
        return object;
      }
    },
    registerTransientEffect(object) {
      created.transients.push(object);
    },
    clearEliteWarning() {
      this.clearEliteWarningCalls += 1;
    }
  };
}

function createEliteVisualEnemy(eliteType) {
  return {
    x: 160,
    y: 220,
    eliteType,
    listeners: new Map(),
    once(eventName, listener) {
      this.listeners.set(eventName, listener);
      return this;
    }
  };
}

async function loadEliteVisualMethods() {
  const source = await readFile(
    new URL("../src/scene/enemies.js", import.meta.url),
    "utf8"
  );
  const attachSource = extractObjectMethod(source, "attachEliteVisuals");
  const updateSource = extractObjectMethod(source, "updateEliteVisuals");
  return {
    attachEliteVisuals: new Function(
      `"use strict"; return ({${attachSource}}).attachEliteVisuals;`
    )(),
    updateEliteVisuals: new Function(
      "getRiotArmorArcPresentation",
      `"use strict"; return ({${updateSource}}).updateEliteVisuals;`
    )(enemyPresentationModule.getRiotArmorArcPresentation),
    attachSource,
    updateSource
  };
}

function createInitializerEnemy(width, height) {
  const calls = {
    once: [],
    setAlpha: [],
    setCircle: [],
    setDepth: [],
    setScale: [],
    setSize: []
  };
  const enemy = {
    x: 120,
    y: 180,
    width,
    height,
    scaleX: 1,
    scaleY: 1,
    displayOriginX: width / 2,
    displayOriginY: height / 2,
    calls,
    setCircle(radius, offsetX, offsetY) {
      const nextOffsetX = offsetX ?? (this.width - radius * 2) / 2;
      const nextOffsetY = offsetY ?? (this.height - radius * 2) / 2;
      calls.setCircle.push([radius, nextOffsetX, nextOffsetY]);
      this.body.sourceWidth = radius * 2;
      this.body.sourceHeight = radius * 2;
      this.body.radius = radius;
      this.body.isCircle = true;
      this.body.offset.set(nextOffsetX, nextOffsetY);
      this.body.updateFromGameObject();
      return this;
    },
    setScale(scale) {
      calls.setScale.push(scale);
      this.scaleX = scale;
      this.scaleY = scale;
      return this;
    },
    setDepth(depth) {
      calls.setDepth.push(depth);
      this.depth = depth;
      return this;
    },
    setAlpha(alpha) {
      calls.setAlpha.push(alpha);
      this.alpha = alpha;
      return this;
    },
    once(eventName) {
      calls.once.push(eventName);
      return this;
    }
  };
  enemy.body = {
    sourceWidth: width,
    sourceHeight: height,
    width,
    height,
    halfWidth: width / 2,
    halfHeight: height / 2,
    radius: 0,
    isCircle: false,
    offset: {
      x: 0,
      y: 0,
      set(x, y) {
        this.x = x;
        this.y = y;
      }
    },
    position: { x: 0, y: 0 },
    setSize(nextWidth, nextHeight) {
      calls.setSize.push([nextWidth, nextHeight]);
      this.sourceWidth = nextWidth;
      this.sourceHeight = nextHeight;
      this.radius = 0;
      this.isCircle = false;
      this.updateFromGameObject();
      return this;
    },
    updateFromGameObject() {
      this.width = this.sourceWidth * Math.abs(enemy.scaleX);
      this.height = this.sourceHeight * Math.abs(enemy.scaleY);
      this.halfWidth = this.width / 2;
      this.halfHeight = this.height / 2;
      this.position.x =
        enemy.x + enemy.scaleX * (this.offset.x - enemy.displayOriginX);
      this.position.y =
        enemy.y + enemy.scaleY * (this.offset.y - enemy.displayOriginY);
    }
  };
  enemy.body.updateFromGameObject();
  return enemy;
}

test("enemy presentation contract contains exactly the seven approved R-17 loops", () => {
  assert.deepEqual(ENEMY_PRESENTATION, EXPECTED_PRESENTATION);
  assert.ok(Object.isFrozen(ENEMY_PRESENTATION));
  for (const config of Object.values(ENEMY_PRESENTATION)) {
    assert.ok(Object.isFrozen(config));
  }
});

test("riot armor arc presentation has a fixed radius and symmetric approved angles", () => {
  for (const frontArcDegrees of [90, 120, 180]) {
    const halfArc = (frontArcDegrees * Math.PI) / 360;
    const presentation = enemyPresentationModule.getRiotArmorArcPresentation(
      frontArcDegrees
    );

    assert.deepEqual(presentation, {
      radius: 28,
      startAngle: -halfArc,
      endAngle: halfArc
    });
    assert.deepEqual(Object.keys(presentation), ["radius", "startAngle", "endAngle"]);
    assert.ok(Object.isFrozen(presentation));
  }
});

test("riot elite owns only its functional armor arc and destroys it cleanly", async () => {
  const { attachEliteVisuals } = await loadEliteVisualMethods();
  const scene = createEliteVisualScene();
  const enemy = createEliteVisualEnemy("riotUnit");

  attachEliteVisuals.call(scene, enemy);

  assert.equal(scene.created.texts.length, 0);
  assert.equal(scene.created.triangles.length, 0);
  assert.equal(scene.created.graphics.length, 1);
  assert.equal(enemy.eliteMarker, undefined);
  assert.equal(enemy.eliteOutline, undefined);
  assert.equal(enemy.shieldIndicator, scene.created.graphics[0]);
  assert.deepEqual(enemy.shieldIndicator.commands, [["setDepth", 11]]);
  assert.deepEqual(scene.created.transients, [enemy.shieldIndicator]);

  enemy.listeners.get("destroy")();

  assert.equal(scene.clearEliteWarningCalls, 1);
  assert.equal(enemy.shieldIndicator.destroyCount, 1);
});

test("riot armor arc updates without a generic marker or outline", async () => {
  const { updateEliteVisuals } = await loadEliteVisualMethods();
  const shield = createDisplaySpy("shield");
  const enemy = {
    x: 145,
    y: 278,
    eliteType: "riotUnit",
    frontArcDegrees: 120,
    facingAngle: -0.625,
    shieldIndicator: shield
  };

  updateEliteVisuals.call({}, enemy);

  assert.deepEqual(shield.commands, [
    ["clear"],
    ["lineStyle", 3, 0x9fc7da, 0.95],
    ["beginPath"],
    ["arc", 0, 0, 28, -Math.PI / 3, Math.PI / 3, false],
    ["strokePath"],
    ["lineStyle", 1, 0x5f8294, 0.8],
    ["lineBetween", 22, -11, 22, 11],
    ["setPosition", enemy.x, enemy.y],
    ["setRotation", enemy.facingAngle]
  ]);
});

test("blink and biomass elites create no permanent generic decoration", async () => {
  const { attachEliteVisuals, updateEliteVisuals } = await loadEliteVisualMethods();
  for (const eliteType of ["blinkStalker", "biomass"]) {
    const scene = createEliteVisualScene();
    const enemy = createEliteVisualEnemy(eliteType);

    attachEliteVisuals.call(scene, enemy);
    updateEliteVisuals.call({}, enemy);

    assert.equal(scene.created.texts.length, 0);
    assert.equal(scene.created.graphics.length, 0);
    assert.equal(scene.created.triangles.length, 0);
    assert.deepEqual(scene.created.transients, []);
    assert.equal(enemy.eliteMarker, undefined);
    assert.equal(enemy.eliteOutline, undefined);
    assert.equal(enemy.shieldIndicator, undefined);

    enemy.listeners.get("destroy")();
    assert.equal(scene.clearEliteWarningCalls, 1);
  }
});

test("elite visuals contain no generic title or yellow outline source path", async () => {
  const { attachSource, updateSource } = await loadEliteVisualMethods();

  assert.doesNotMatch(attachSource, /add\.text\s*\(/);
  assert.doesNotMatch(attachSource, /eliteMarker|eliteOutline/);
  assert.doesNotMatch(updateSource, /eliteMarker|eliteOutline|0xfff08e/);
  assert.match(
    updateSource,
    /getRiotArmorArcPresentation\(enemy\.frontArcDegrees\)/
  );
  assert.match(updateSource, /setRotation\(enemy\.facingAngle\)/);
});

test("riot arc update reads gameplay geometry without writing multipliers facing or body rotation", async () => {
  const { updateSource } = await loadEliteVisualMethods();

  assert.match(
    updateSource,
    /getRiotArmorArcPresentation\(enemy\.frontArcDegrees\)/
  );
  assert.match(
    updateSource,
    /enemy\.shieldIndicator\.setRotation\(enemy\.facingAngle\)/
  );
  assert.doesNotMatch(
    updateSource,
    /enemy\.(?:frontDamageMultiplier|sideDamageMultiplier|rearDamageMultiplier|facingAngle)\s*=/
  );
  assert.doesNotMatch(updateSource, /enemy\.(?:setRotation|setAngle)\s*\(/);
});

// Break caught: a formal animation key or clip range drifts from the accepted sheet layout.
test("formal R-17 and SCP-049 animation keys and clip definitions are exact", () => {
  for (const [enemyType, contract] of Object.entries(FORMAL_R17_CONTRACTS)) {
    for (const [clip, [start, end, frameRate, repeat]] of Object.entries(contract.clips)) {
      const key = `${contract.prefix}-${clip}`;
      assert.equal(getEnemyAnimationKey(enemyType, clip), key);
      const scene = createScene({ [contract.textureKey]: contract.frameTotal });
      registerEnemyAnimations(scene, {
        isDevelopment: true,
        candidateMode: true,
        candidateIds: [contract.textureKey]
      });
      assert.deepEqual(scene.created.find((animation) => animation.key === key), {
        key,
        frames: { textureKey: contract.textureKey, start, end },
        frameRate,
        repeat
      });
    }
  }

  const locomotion = [
    ["down", "idle", 0, 3, 5, -1], ["down", "walk", 4, 9, 8, -1],
    ["left", "idle", 10, 13, 5, -1], ["left", "walk", 14, 19, 8, -1],
    ["right", "idle", 20, 23, 5, -1], ["right", "walk", 24, 29, 8, -1],
    ["up", "idle", 30, 33, 5, -1], ["up", "walk", 34, 39, 8, -1]
  ];
  const actions = [
    ["frenzy-enter", 0, 4, 10, 0],
    ["frenzy-loop", 5, 8, 8, -1],
    ["hit-overlay", 9, 10, 24, 0],
    ["recontain", 11, 18, 12, 0]
  ];
  const scene = createScene({
    "enemy-scp049-locomotion-sheet": 41,
    "enemy-scp049-action-sheet": 20
  });
  registerEnemyAnimations(scene, CANDIDATE_OPTIONS);
  for (const [direction, clip, start, end, frameRate, repeat] of locomotion) {
    const key = `enemy-scp049-${direction}-${clip}`;
    assert.equal(getScp049LocomotionAnimationKey(direction, clip), key);
    assert.deepEqual(scene.created.find((animation) => animation.key === key), {
      key,
      frames: { textureKey: "enemy-scp049-locomotion-sheet", start, end },
      frameRate,
      repeat
    });
  }
  for (const [clip, start, end, frameRate, repeat] of actions) {
    const key = `enemy-scp049-${clip}`;
    assert.deepEqual(scene.created.find((animation) => animation.key === key), {
      key,
      frames: { textureKey: "enemy-scp049-action-sheet", start, end },
      frameRate,
      repeat
    });
  }
});

// Break caught: the Pulse Sac release event moves away from its accepted sixth shoot frame.
test("Pulse Sac shoot resolves frames 14 through 19 at 10fps with release frame 18", () => {
  const scene = createScene({
    "r17-pulse-sac-action-sheet": 21,
    [TEXTURES.r17PulseSac]: 5
  });
  registerEnemyAnimations(scene, CANDIDATE_OPTIONS);
  const mode = getEnemyPresentationMode(scene, "drone", CANDIDATE_OPTIONS);
  assert.deepEqual(
    {
      animationKey: getEnemyAnimationKey("drone", "shoot"),
      registered: scene.created.find((animation) => animation.key === "r17-pulse-sac-action-shoot"),
      releaseFrame: mode.releaseFrame
    },
    {
      animationKey: "r17-pulse-sac-action-shoot",
      registered: {
        key: "r17-pulse-sac-action-shoot",
        frames: { textureKey: "r17-pulse-sac-action-sheet", start: 14, end: 19 },
        frameRate: 10,
        repeat: 0
      },
      releaseFrame: 18
    }
  );
});

// Break caught: an absent, short, long or transactionally incomplete action sheet is partially admitted.
test("formal sheets fail closed on every wrong Phaser total and on a missing clip", () => {
  for (const [enemyType, contract] of Object.entries(FORMAL_R17_CONTRACTS)) {
    for (const frameTotal of [undefined, contract.frameTotal - 1, contract.frameTotal + 1]) {
      const scene = createScene(frameTotal === undefined ? {} : { [contract.textureKey]: frameTotal });
      registerEnemyAnimations(scene, CANDIDATE_OPTIONS);
      assert.equal(scene.created.some(({ key }) => key.startsWith(`${contract.prefix}-`)), false);
      assert.equal(getEnemyPresentationMode(scene, enemyType, CANDIDATE_OPTIONS).family, "unchanged");
    }
  }

  for (const [textureKey, expectedTotal, prefix] of [
    ["enemy-scp049-locomotion-sheet", 41, "enemy-scp049-down-"],
    ["enemy-scp049-action-sheet", 20, "enemy-scp049-frenzy-"]
  ]) {
    for (const frameTotal of [expectedTotal - 1, expectedTotal + 1]) {
      const scene = createScene({ [textureKey]: frameTotal });
      registerEnemyAnimations(scene, CANDIDATE_OPTIONS);
      assert.equal(scene.created.some(({ key }) => key.startsWith(prefix)), false);
    }
  }

  const failedScene = createScene(
    { "r17-drifter-action-sheet": 19 },
    { failOnCreate: "r17-drifter-action-hit" }
  );
  registerEnemyAnimations(failedScene, CANDIDATE_OPTIONS);
  assert.deepEqual(failedScene.created, []);
  assert.equal(getEnemyPresentationMode(failedScene, "infectedStaff", CANDIDATE_OPTIONS).family, "unchanged");
});

// Break caught: candidate permission becomes global instead of the exact DEV mode and per-id allowlist intersection.
test("candidate resolution is development-only, allowlisted per type and independently fail-safe", () => {
  const allFrames = Object.fromEntries(
    Object.values(FORMAL_R17_CONTRACTS).map(({ textureKey, frameTotal }) => [textureKey, frameTotal])
  );
  const gate2Ids = [
    "r17-rift-skimmer-action-sheet",
    "r17-bud-action-sheet",
    "r17-frame-gap-action-sheet"
  ];
  const scene = createScene(allFrames);
  registerEnemyAnimations(scene, {
    isDevelopment: true,
    candidateMode: true,
    candidateIds: gate2Ids
  });

  assert.equal(getEnemyPresentationMode(scene, "crawler", {}).family, "unchanged");
  assert.equal(getEnemyPresentationMode(scene, "crawler", { isDevelopment: true, candidateIds: gate2Ids }).family, "unchanged");
  assert.equal(getEnemyPresentationMode(scene, "crawler", { candidateMode: true, candidateIds: gate2Ids }).family, "unchanged");
  assert.equal(getEnemyPresentationMode(scene, "crawler", {
    isDevelopment: true,
    candidateMode: true,
    candidateIds: ["unknown", ...gate2Ids, gate2Ids[0]]
  }).family, "formal");

  assert.deepEqual(
    Object.keys(FORMAL_R17_CONTRACTS).filter((enemyType) => (
      getEnemyPresentationMode(scene, enemyType, {
        isDevelopment: true,
        candidateMode: true,
        candidateIds: gate2Ids
      }).family === "formal"
    )),
    ["crawler", "blinkStalker", "biomassChild"]
  );

  const oneBroken = createScene({ ...allFrames, "r17-rift-skimmer-action-sheet": 18 });
  registerEnemyAnimations(oneBroken, CANDIDATE_OPTIONS);
  assert.equal(getEnemyPresentationMode(oneBroken, "crawler", CANDIDATE_OPTIONS).family, "unchanged");
  for (const enemyType of Object.keys(FORMAL_R17_CONTRACTS).filter((type) => type !== "crawler")) {
    assert.equal(getEnemyPresentationMode(oneBroken, enemyType, CANDIDATE_OPTIONS).family, "formal");
  }
});

// Break caught: the dev-only forceLegacy switch deletes or bypasses the exact legacy fallback contract in production.
test("forceLegacy is a development-only pure option and preserves loaded formal and legacy sheets", () => {
  const scene = createScene({
    "r17-drifter-action-sheet": 19,
    [TEXTURES.r17Drifter]: 5
  });
  registerEnemyAnimations(scene, CANDIDATE_OPTIONS);
  assert.equal(getEnemyPresentationMode(scene, "infectedStaff", CANDIDATE_OPTIONS).family, "formal");
  assert.equal(getEnemyPresentationMode(scene, "infectedStaff", {
    ...CANDIDATE_OPTIONS,
    forceLegacy: true
  }).family, "legacy");
  assert.equal(getEnemyPresentationMode(scene, "infectedStaff", {
    ...CANDIDATE_OPTIONS,
    isDevelopment: false,
    forceLegacy: true
  }).family, "legacy");
  assert.equal(scene.textures.exists("r17-drifter-action-sheet"), true);
  assert.equal(scene.textures.exists(TEXTURES.r17Drifter), true);
});

// Break caught: 049 action failure incorrectly disables valid locomotion, or invalid locomotion uses formal art.
test("SCP-049 resolves full formal, locomotion plus static action fallback, then old static", () => {
  const full = createScene({
    "enemy-scp049-locomotion-sheet": 41,
    "enemy-scp049-action-sheet": 20,
    [TEXTURES.enemyScp049]: 1
  });
  registerEnemyAnimations(full, CANDIDATE_OPTIONS);
  assert.deepEqual(getScp049PresentationMode(full, CANDIDATE_OPTIONS), {
    family: "formal",
    locomotionTextureKey: "enemy-scp049-locomotion-sheet",
    actionTextureKey: "enemy-scp049-action-sheet",
    displayScale: 1
  });

  for (const actionTotal of [undefined, 19, 21]) {
    const frames = {
      "enemy-scp049-locomotion-sheet": 41,
      [TEXTURES.enemyScp049]: 1
    };
    if (actionTotal !== undefined) frames["enemy-scp049-action-sheet"] = actionTotal;
    const scene = createScene(frames);
    registerEnemyAnimations(scene, CANDIDATE_OPTIONS);
    assert.deepEqual(getScp049PresentationMode(scene, CANDIDATE_OPTIONS), {
      family: "formal-locomotion",
      locomotionTextureKey: "enemy-scp049-locomotion-sheet",
      actionTextureKey: TEXTURES.enemyScp049,
      displayScale: 1
    });
  }

  for (const locomotionTotal of [undefined, 40, 42]) {
    const frames = {
      "enemy-scp049-action-sheet": 20,
      [TEXTURES.enemyScp049]: 1
    };
    if (locomotionTotal !== undefined) frames["enemy-scp049-locomotion-sheet"] = locomotionTotal;
    const scene = createScene(frames);
    registerEnemyAnimations(scene, CANDIDATE_OPTIONS);
    assert.deepEqual(getScp049PresentationMode(scene, CANDIDATE_OPTIONS), {
      family: "static",
      textureKey: TEXTURES.enemyScp049,
      displayScale: CHARACTER_DISPLAY_SCALE.scp049
    });
  }
});

// Break caught: applying a formal sheet changes world/body geometry, rotates actors or scales types by role.
test("formal R-17 and SCP-049 application preserves world position and body geometry", () => {
  const enemyScene = createScene({
    "r17-carapace-gate-action-sheet": 23,
    [TEXTURES.r17CarapaceGate]: 5
  });
  registerEnemyAnimations(enemyScene, CANDIDATE_OPTIONS);
  const enemy = createEnemyStub({
    fallbackTextureKey: TEXTURES.eliteRiot,
    fallbackFrameWidth: 38,
    fallbackFrameHeight: 42,
    productionFrameWidth: 64,
    productionFrameHeight: 64,
    sourceWidth: 20,
    sourceHeight: 24,
    offsetX: 5,
    offsetY: 7,
    pendingScale: 1.2
  });
  const enemyBefore = effectiveBodySnapshot(enemy);
  applyEnemyPresentation(enemyScene, enemy, "riotUnit", CANDIDATE_OPTIONS);
  assert.equal(enemy.texture.key, "r17-carapace-gate-action-sheet");
  assert.equal(enemy.scaleX, 1);
  assert.deepEqual(effectiveBodySnapshot(enemy), enemyBefore);

  const bossScene = createScene({
    "enemy-scp049-locomotion-sheet": 41,
    "enemy-scp049-action-sheet": 20,
    [TEXTURES.enemyScp049]: 1
  });
  registerEnemyAnimations(bossScene, CANDIDATE_OPTIONS);
  const boss = createEnemyStub({
    fallbackTextureKey: TEXTURES.enemyScp049,
    fallbackFrameWidth: 64,
    fallbackFrameHeight: 80,
    productionFrameWidth: 80,
    productionFrameHeight: 96,
    sourceWidth: 36,
    sourceHeight: 36,
    offsetX: 14,
    offsetY: 22,
    radius: 18,
    pendingScale: CHARACTER_DISPLAY_SCALE.scp049
  });
  const bossBefore = effectiveBodySnapshot(boss);
  applyEnemyPresentation(bossScene, boss, "scp049", CANDIDATE_OPTIONS);
  assert.equal(boss.texture.key, "enemy-scp049-locomotion-sheet");
  assert.equal(boss.scaleX, 1);
  assert.equal(boss.body.radius, 18);
  assert.deepEqual(effectiveBodySnapshot(boss), bossBefore);
  assert.equal("rotation" in enemy || "rotation" in boss, false);
});

// Break caught: repeat registration creates duplicate global Phaser animation keys.
test("formal animation registration is idempotent across all nine sheets", () => {
  const scene = createScene({
    ...Object.fromEntries(Object.values(FORMAL_R17_CONTRACTS).map(({ textureKey, frameTotal }) => [textureKey, frameTotal])),
    "enemy-scp049-locomotion-sheet": 41,
    "enemy-scp049-action-sheet": 20
  });
  registerEnemyAnimations(scene, CANDIDATE_OPTIONS);
  registerEnemyAnimations(scene, CANDIDATE_OPTIONS);
  assert.equal(scene.created.length, 42);
  assert.equal(new Set(scene.created.map(({ key }) => key)).size, 42);
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

test("all seven incomplete production sheets preserve their legacy fallback display state", () => {
  let index = 0;
  for (const [enemyType, config] of Object.entries(EXPECTED_PRESENTATION)) {
    const scene = createScene({ [config.productionTextureKey]: 4 });
    const fallbackScale = enemyType === "infectedStaff"
      ? 1.15
      : ["riotUnit", "blinkStalker", "biomass"].includes(enemyType)
        ? 1.2
        : 1;
    const enemy = createEnemyStub({
      fallbackTextureKey: FALLBACK_TEXTURES[enemyType],
      fallbackFrameWidth: 24 + index * 2,
      fallbackFrameHeight: 26 + index * 2,
      productionFrameWidth: config.frameWidth,
      productionFrameHeight: config.frameHeight,
      sourceWidth: 14 + index,
      sourceHeight: 16 + index,
      offsetX: 2 + index,
      offsetY: 3 + index,
      radius: enemyType === "infectedStaff" ? 10 : 0,
      pendingScale: fallbackScale
    });
    const before = effectiveBodySnapshot(enemy);

    assert.equal(applyEnemyPresentation(scene, enemy, enemyType), enemy);

    assert.equal(enemy.texture.key, FALLBACK_TEXTURES[enemyType]);
    assert.equal(enemy.scaleX, fallbackScale);
    assert.equal(enemy.scaleY, fallbackScale);
    assert.deepEqual(enemy.calls, {
      play: [],
      setFlipX: [],
      setScale: [],
      setTexture: []
    });
    assert.deepEqual(effectiveBodySnapshot(enemy), before);
    index += 1;
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

test("all seven complete production sheets swap from fallback and preserve real body invariants", () => {
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
    assert.equal(enemy.texture.key, FALLBACK_TEXTURES[enemyType]);
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
    assert.deepEqual(enemy.calls.setTexture, [[config.productionTextureKey, 0]]);
    assert.deepEqual(enemy.calls.setScale, [1]);
    assert.deepEqual(enemy.calls.setFlipX, [false]);
    assert.deepEqual(enemy.calls.play, [[config.animationKey, true]]);
    assert.equal(enemy.body.updateCount, 3, `${enemyType} must sync before and after the swap`);
  }
});

test("the unified initializer reaches presentation after all legacy body scale and elite fields", async () => {
  const source = await readFile(
    new URL("../src/scene/enemies.js", import.meta.url),
    "utf8"
  );
  const methodSource = extractObjectMethod(source, "initializeEnemyFromConfig");
  const presentationCalls = [];
  const initializeEnemyFromConfig = new Function(
    "Phaser",
    "BALANCE",
    "applyDisplayScalePreservingBody",
    "centerCircularBody",
    "CHARACTER_DISPLAY_SCALE",
    "applyEnemyPresentation",
    `"use strict"; return ({${methodSource}}).initializeEnemyFromConfig;`
  )(
    { Math: { Between: (minimum) => minimum } },
    BALANCE,
    applyDisplayScalePreservingBody,
    centerCircularBody,
    CHARACTER_DISPLAY_SCALE,
    (scene, enemy, enemyType) => {
      assert.equal(enemy.calls.once.length, 0, "presentation must precede destroy wiring");
      presentationCalls.push({
        scene,
        enemy,
        enemyType,
        body: {
          width: enemy.body.width,
          height: enemy.body.height,
          radius: enemy.body.radius,
          isCircle: enemy.body.isCircle
        },
        scaleX: enemy.scaleX
      });
      return enemy;
    }
  );
  const scene = {
    elapsedSurvivalMs: 1_000,
    combatFeedback: { trackActor() {}, untrackActor() {} }
  };
  const cases = [
    {
      type: "infectedStaff",
      config: BALANCE.enemy.types.infectedStaff,
      isElite: false,
      fallbackSize: [32, 32],
      expectedBody: [20, 20, 10, true],
      expectedScale: CHARACTER_DISPLAY_SCALE.infectedStaff
    },
    {
      type: "crawler",
      config: BALANCE.enemy.types.crawler,
      isElite: false,
      fallbackSize: [24, 24],
      expectedBody: [16, 16, 8, true],
      expectedScale: 1
    },
    {
      type: "drone",
      config: BALANCE.enemy.types.drone,
      isElite: false,
      fallbackSize: [28, 28],
      expectedBody: [18, 18, 0, false],
      expectedScale: 1
    },
    {
      type: "riotUnit",
      config: BALANCE.enemy.elite.types.riotUnit,
      isElite: true,
      fallbackSize: [40, 42],
      expectedBody: [40, 42, 0, false],
      expectedScale: 1.2
    },
    {
      type: "blinkStalker",
      config: BALANCE.enemy.elite.types.blinkStalker,
      isElite: true,
      fallbackSize: [38, 44],
      expectedBody: [38, 44, 0, false],
      expectedScale: 1.2
    },
    {
      type: "biomass",
      config: BALANCE.enemy.elite.types.biomass,
      isElite: true,
      fallbackSize: [46, 48],
      expectedBody: [46, 48, 0, false],
      expectedScale: 1.2
    },
    {
      type: "biomassChild",
      config: BALANCE.enemy.elite.types.biomassChild,
      isElite: false,
      fallbackSize: [18, 16],
      expectedBody: [18, 16, 0, false],
      expectedScale: 1
    }
  ];

  for (const testCase of cases) {
    presentationCalls.length = 0;
    const enemy = createInitializerEnemy(...testCase.fallbackSize);
    initializeEnemyFromConfig.call(
      scene,
      enemy,
      testCase.config,
      { healthMultiplier: 1, damageMultiplier: 1 },
      testCase.isElite
    );

    assert.equal(presentationCalls.length, 1, `${testCase.type} must reach presentation once`);
    const presentation = presentationCalls[0];
    assert.equal(presentation.scene, scene);
    assert.equal(presentation.enemy, enemy);
    assert.equal(presentation.enemyType, testCase.type);
    assert.deepEqual(Object.values(presentation.body), testCase.expectedBody);
    assert.equal(presentation.scaleX, testCase.expectedScale);
    assert.equal(enemy.enemyType, testCase.type);
    assert.equal(enemy.health, testCase.config.health);
    assert.equal(enemy.contactDamage, testCase.config.contactDamage);
    assert.deepEqual(enemy.calls.once, ["destroy"]);

    if (testCase.type === "drone") {
      assert.equal(enemy.shootCooldownMs, testCase.config.shootCooldownMs);
      assert.equal(enemy.preferredRangeMax, testCase.config.preferredRangeMax);
    }
    if (testCase.isElite) {
      assert.equal(enemy.eliteState, "idle");
      assert.equal(enemy.depth, 10);
      assert.equal(enemy.facingAngle, 0);
    }
    if (testCase.type === "riotUnit") {
      assert.equal(enemy.frontArcDegrees, testCase.config.frontArcDegrees);
      assert.equal(enemy.chargeSpeed, testCase.config.chargeSpeed);
    }
    if (testCase.type === "blinkStalker") {
      assert.equal(enemy.teleportCooldownMs, testCase.config.teleportCooldownMs);
      assert.equal(enemy.alpha, 0.85);
    }
    if (testCase.type === "biomass") {
      assert.equal(enemy.canSplit, true);
    }
  }
});

test("actor tracking is attached after enemy and boss presentation setup", async () => {
  const enemies = await readFile(
    new URL("../src/scene/enemies.js", import.meta.url),
    "utf8"
  );
  const initializer = enemies.slice(
    enemies.indexOf("  initializeEnemyFromConfig("),
    enemies.indexOf("  updateEnemies()")
  );
  const bossCreation = enemies.slice(
    enemies.indexOf("  spawnScp049Boss()"),
    enemies.indexOf("  updateBoss()")
  );

  const enemyPresentation = initializer.indexOf("applyEnemyPresentation(this, enemy, config.type)");
  const enemyTracking = initializer.indexOf("this.combatFeedback?.trackActor(enemy");
  assert.ok(enemyPresentation >= 0 && enemyPresentation < enemyTracking);
  assert.match(initializer, /enemy\.once\("destroy"[\s\S]*combatFeedback\?\.untrackActor\(enemy\)/);

  const bossBody = bossCreation.indexOf("boss.body.setImmovable(true)");
  const bossTracking = bossCreation.indexOf("this.combatFeedback.trackActor(boss");
  assert.ok(bossBody >= 0 && bossBody < bossTracking);
  assert.match(bossCreation, /boss\.once\("destroy"[\s\S]*combatFeedback\?\.untrackActor\(boss\)/);
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

// Break caught: ordinary DEV or a bare candidate query leaks gated PNGs, or existing Player dev entries stop loading.
test("DEV preload requests gated candidates only in explicit candidate mode with exact repeated ids", async () => {
  const candidateKeys = CANDIDATE_OPTIONS.candidateIds;
  const playerDevelopmentKeys = [
    "player-response-operative-prototype-sheet",
    "player-response-operative-body-prototype-sheet",
    "player-response-operative-breacher-sample-sheet",
    "player-response-operative-cbrn-sample-sheet"
  ];

  for (const search of ["", "?enemyPresentation=candidate"]) {
    const requested = await collectPreloadSpritesheets({ isDevelopment: true, search });
    const keys = requested.map(({ key }) => key);
    assert.deepEqual(keys.filter((key) => candidateKeys.includes(key)), []);
    assert.deepEqual(keys.filter((key) => playerDevelopmentKeys.includes(key)), playerDevelopmentKeys);
  }

  const gates = [
    [
      ["r17-rift-skimmer-action-sheet", "r17-bud-action-sheet", "r17-frame-gap-action-sheet"],
      ["r17-rift-skimmer-action-sheet", "r17-frame-gap-action-sheet", "r17-bud-action-sheet"]
    ],
    [
      [
        "r17-drifter-action-sheet", "r17-rift-skimmer-action-sheet", "r17-pulse-sac-action-sheet",
        "r17-carapace-gate-action-sheet", "r17-frame-gap-action-sheet", "r17-brood-mass-action-sheet",
        "r17-bud-action-sheet"
      ],
      [
        "r17-drifter-action-sheet", "r17-rift-skimmer-action-sheet", "r17-pulse-sac-action-sheet",
        "r17-carapace-gate-action-sheet", "r17-frame-gap-action-sheet", "r17-brood-mass-action-sheet",
        "r17-bud-action-sheet"
      ]
    ],
    [candidateKeys, candidateKeys]
  ];
  for (const [allowlist, expectedKeys] of gates) {
    const query = new URLSearchParams({ enemyPresentation: "candidate" });
    for (const id of allowlist) query.append("enemyCandidate", id);
    const requested = await collectPreloadSpritesheets({ isDevelopment: true, search: `?${query}` });
    const gated = requested.map(({ key }) => key).filter((key) => candidateKeys.includes(key));
    assert.equal(gated.length, expectedKeys.length);
    assert.deepEqual(gated, expectedKeys);
  }

  const query = new URLSearchParams({ enemyPresentation: "candidate" });
  for (const id of ["unknown", "r17-bud-action-sheet", "r17-bud-action-sheet", "unknown"]) {
    query.append("enemyCandidate", id);
  }
  const deduplicated = await collectPreloadSpritesheets({ isDevelopment: true, search: `?${query}` });
  assert.deepEqual(
    deduplicated.map(({ key }) => key).filter((key) => candidateKeys.includes(key)),
    ["r17-bud-action-sheet"]
  );
});

// Break caught: production begins honoring candidate queries or production entries are accidentally filtered by inert metadata.
test("production preload ignores candidate query and always requests every production sheet", async () => {
  const query = new URLSearchParams({ enemyPresentation: "candidate" });
  for (const id of CANDIDATE_OPTIONS.candidateIds) query.append("enemyCandidate", id);
  const requested = await collectPreloadSpritesheets({ isDevelopment: false, search: `?${query}` });
  assert.deepEqual(requested.map(({ key }) => key), SPRITESHEET_ASSETS.map(({ key }) => key));

  const fixtureManifest = `
    export const IMAGE_ASSETS = [];
    export const SPRITESHEET_ASSETS = [{
      key: "production-with-inert-candidate-metadata",
      path: "production.png",
      frameConfig: { frameWidth: 32, frameHeight: 32 },
      previewQuery: { name: "enemyPresentation", value: "candidate" },
      candidateId: "not-allowlisted"
    }];
    export const DEVELOPMENT_SPRITESHEET_ASSETS = [];
    export const ATLAS_ASSETS = [];
    export const AUDIO_ASSETS = [];
  `;
  const productionFixture = await collectPreloadSpritesheets({
    isDevelopment: false,
    search: "",
    manifestModule: fixtureManifest
  });
  assert.deepEqual(productionFixture, [{
    key: "production-with-inert-candidate-metadata",
    path: "production.png",
    frameConfig: { frameWidth: 32, frameHeight: 32 }
  }]);
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
