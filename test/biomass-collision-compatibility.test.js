import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { TEXTURES } from "../src/assets/manifest.js";
import { applyEnemyPresentation } from "../src/art/enemyPresentation.js";
import {
  CHARACTER_DISPLAY_SCALE,
  applyDisplayScalePreservingBody,
  centerCircularBody
} from "../src/art/presentationRules.js";
import { BALANCE } from "../src/config/balance.js";

const FALLBACK_SIZE = 36;
const PULSE_CASES = [
  { name: "minimum", elapsedSurvivalMs: (Math.PI * 1.5) / 0.008, pulse: 1.09 },
  { name: "midpoint", elapsedSurvivalMs: 0, pulse: 1.16 },
  { name: "maximum", elapsedSurvivalMs: (Math.PI * 0.5) / 0.008, pulse: 1.23 }
];

function extractObjectMethod(source, methodName) {
  const start = source.indexOf(`  ${methodName}(`);
  assert.notEqual(start, -1, `${methodName} must exist`);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1).trim();
  }
  throw new Error(`Could not extract ${methodName}`);
}

async function loadEnemyMethods() {
  const source = await readFile(
    new URL("../src/scene/enemies.js", import.meta.url),
    "utf8"
  );
  const initializerSource = extractObjectMethod(source, "initializeEnemyFromConfig");
  const biomassUpdateSource = extractObjectMethod(source, "updateBiomassElite");
  const eliteUpdateSource = extractObjectMethod(source, "updateEliteEnemy");
  return {
    initializeEnemyFromConfig: new Function(
      "Phaser",
      "BALANCE",
      "applyDisplayScalePreservingBody",
      "centerCircularBody",
      "CHARACTER_DISPLAY_SCALE",
      "applyEnemyPresentation",
      `"use strict"; return ({${initializerSource}}).initializeEnemyFromConfig;`
    )(
      { Math: { Between: (minimum) => minimum } },
      BALANCE,
      applyDisplayScalePreservingBody,
      centerCircularBody,
      CHARACTER_DISPLAY_SCALE,
      applyEnemyPresentation
    ),
    updateBiomassElite: new Function(
      `"use strict"; return ({${biomassUpdateSource}}).updateBiomassElite;`
    )(),
    updateEliteEnemy: new Function(
      `"use strict"; return ({${eliteUpdateSource}}).updateEliteEnemy;`
    )()
  };
}

function createScene({ production }) {
  const moveCalls = [];
  return {
    elapsedSurvivalMs: 1_000,
    player: { x: 300, y: 400 },
    moveCalls,
    textures: {
      exists: (key) => production && key === TEXTURES.r17BroodMass,
      get: () => ({ frameTotal: 5 })
    },
    anims: {
      exists: (key) => production && key === "r17-brood-mass-loop"
    },
    physics: {
      moveToObject(enemy, player, speed) {
        moveCalls.push([enemy, player, speed]);
      }
    }
  };
}

function createEnemy(width = FALLBACK_SIZE, height = FALLBACK_SIZE) {
  const calls = {
    setFlipX: [],
    setRotation: [],
    setScale: [],
    setSize: [],
    updateFromGameObject: 0
  };
  const enemy = {
    x: 120,
    y: 180,
    width,
    height,
    displayOriginX: width / 2,
    displayOriginY: height / 2,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    flipX: false,
    texture: { key: TEXTURES.eliteBiomass },
    calls,
    setTexture(key) {
      this.texture.key = key;
      this.width = 64;
      this.height = 64;
      this.displayOriginX = 32;
      this.displayOriginY = 32;
      this.body.sourceWidth = 64;
      this.body.sourceHeight = 64;
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
      this.flipX = value;
      return this;
    },
    setRotation(value) {
      calls.setRotation.push(value);
      this.rotation = value;
      return this;
    },
    play() {
      return this;
    },
    setDepth() {
      return this;
    },
    setAlpha() {
      return this;
    },
    once() {
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
    _sx: 1,
    _sy: 1,
    position: { x: enemy.x - width / 2, y: enemy.y - height / 2 },
    center: { x: enemy.x, y: enemy.y },
    offset: {
      x: 0,
      y: 0,
      set(x, y) {
        this.x = x;
        this.y = y;
      }
    },
    setSize(nextWidth, nextHeight, center = true) {
      calls.setSize.push([nextWidth, nextHeight, center]);
      this.sourceWidth = nextWidth;
      this.sourceHeight = nextHeight;
      this.width = nextWidth * this._sx;
      this.height = nextHeight * this._sy;
      this.halfWidth = Math.floor(this.width / 2);
      this.halfHeight = Math.floor(this.height / 2);
      if (center) {
        this.offset.set(
          (enemy.width - nextWidth) / 2,
          (enemy.height - nextHeight) / 2
        );
      }
      this.isCircle = false;
      this.radius = 0;
      return this;
    },
    updateFromGameObject() {
      calls.updateFromGameObject += 1;
      this._sx = Math.abs(enemy.scaleX);
      this._sy = Math.abs(enemy.scaleY);
      this.width = this.sourceWidth * this._sx;
      this.height = this.sourceHeight * this._sy;
      this.halfWidth = Math.floor(this.width / 2);
      this.halfHeight = Math.floor(this.height / 2);
      this.position.x =
        enemy.x + enemy.scaleX * (this.offset.x - enemy.displayOriginX);
      this.position.y =
        enemy.y + enemy.scaleY * (this.offset.y - enemy.displayOriginY);
      this.center.x = this.position.x + this.halfWidth;
      this.center.y = this.position.y + this.halfHeight;
    },
    preUpdate() {
      this.updateFromGameObject();
    }
  };
  enemy.body.updateFromGameObject();
  return enemy;
}

async function initializeBiomass(production) {
  const { initializeEnemyFromConfig, updateBiomassElite } = await loadEnemyMethods();
  const scene = createScene({ production });
  const enemy = createEnemy();
  initializeEnemyFromConfig.call(
    scene,
    enemy,
    BALANCE.enemy.elite.types.biomass,
    { healthMultiplier: 1, damageMultiplier: 1 },
    true
  );
  return { enemy, scene, updateBiomassElite };
}

test("biomass initialization captures the unscaled fallback body before presentation", async () => {
  for (const production of [false, true]) {
    const { enemy } = await initializeBiomass(production);
    assert.equal(enemy.biomassFallbackBodySourceWidth, FALLBACK_SIZE);
    assert.equal(enemy.biomassFallbackBodySourceHeight, FALLBACK_SIZE);
    enemy.body.preUpdate();
    assert.equal(enemy.body.width, FALLBACK_SIZE * 1.2);
    assert.equal(enemy.body.height, FALLBACK_SIZE * 1.2);
  }
});

for (const production of [false, true]) {
  const presentation = production ? "production" : "fallback";
  for (const pulseCase of PULSE_CASES) {
    test(`biomass ${presentation} body reaches the old ${pulseCase.name} pulse on next preUpdate`, async () => {
      const { enemy, scene, updateBiomassElite } = await initializeBiomass(production);
      const stableScale = production ? 1 : 1.2;
      const expectedWorldSize = FALLBACK_SIZE * pulseCase.pulse;
      const syncCount = enemy.calls.updateFromGameObject;
      enemy.calls.setScale.length = 0;
      enemy.calls.setFlipX.length = 0;
      enemy.calls.setRotation.length = 0;
      scene.elapsedSurvivalMs = pulseCase.elapsedSurvivalMs;

      updateBiomassElite.call(scene, enemy);

      assert.equal(enemy.calls.updateFromGameObject, syncCount);
      assert.equal(enemy.calls.setScale.length, 0);
      assert.equal(enemy.calls.setFlipX.length, 0);
      assert.equal(enemy.calls.setRotation.length, 0);
      assert.equal(enemy.scaleX, stableScale);
      assert.equal(enemy.scaleY, stableScale);
      assert.equal(enemy.rotation, 0);
      assert.equal(enemy.flipX, false);
      assert.deepEqual(scene.moveCalls, [[enemy, scene.player, enemy.moveSpeed]]);

      enemy.body.preUpdate();

      assert.ok(Number.isFinite(enemy.body.sourceWidth));
      assert.ok(Number.isFinite(enemy.body.sourceHeight));
      assert.ok(Number.isFinite(enemy.body.width));
      assert.ok(Number.isFinite(enemy.body.height));
      assert.ok(
        Math.abs(enemy.body.width - expectedWorldSize) < 1e-9,
        `expected old ${pulseCase.name} width ${expectedWorldSize}, received fixed ${enemy.body.width}`
      );
      assert.ok(
        Math.abs(enemy.body.height - expectedWorldSize) < 1e-9,
        `expected old ${pulseCase.name} height ${expectedWorldSize}, received fixed ${enemy.body.height}`
      );
      assert.equal(enemy.calls.setSize.length, 2);
      assert.ok(Math.abs(enemy.body.position.x + enemy.body.width / 2 - enemy.x) < 1e-9);
      assert.ok(Math.abs(enemy.body.position.y + enemy.body.height / 2 - enemy.y) < 1e-9);
      assert.ok(Number.isFinite(enemy.body.center.x));
      assert.ok(Number.isFinite(enemy.body.center.y));
      assert.ok(
        Math.abs(
          enemy.body.center.x
          - (enemy.x - expectedWorldSize / 2 + Math.floor(expectedWorldSize / 2))
        ) < 1e-9
      );
      assert.ok(
        Math.abs(
          enemy.body.center.y
          - (enemy.y - expectedWorldSize / 2 + Math.floor(expectedWorldSize / 2))
        ) < 1e-9
      );
      assert.equal(enemy.body.isCircle, false);
      assert.equal(enemy.body.radius, 0);
    });
  }
}

test("non-biomass elite initialization and routing never use biomass compatibility state", async () => {
  const { initializeEnemyFromConfig, updateEliteEnemy } = await loadEnemyMethods();
  for (const eliteType of ["riotUnit", "blinkStalker"]) {
    const enemy = createEnemy(40, 42);
    const scene = createScene({ production: false });
    initializeEnemyFromConfig.call(
      scene,
      enemy,
      BALANCE.enemy.elite.types[eliteType],
      { healthMultiplier: 1, damageMultiplier: 1 },
      true
    );
    assert.equal(Object.hasOwn(enemy, "biomassFallbackBodySourceWidth"), false);
    assert.equal(Object.hasOwn(enemy, "biomassFallbackBodySourceHeight"), false);
    const initialBody = {
      sourceWidth: enemy.body.sourceWidth,
      sourceHeight: enemy.body.sourceHeight,
      offsetX: enemy.body.offset.x,
      offsetY: enemy.body.offset.y
    };
    const calls = [];
    scene.updateRiotElite = () => calls.push("riot");
    scene.updateBlinkElite = () => calls.push("blink");
    scene.updateBiomassElite = () => calls.push("biomass");
    scene.updateEliteVisuals = () => calls.push("visuals");
    enemy.eliteType = eliteType;

    updateEliteEnemy.call(scene, enemy);

    assert.deepEqual(calls, [eliteType === "riotUnit" ? "riot" : "blink", "visuals"]);
    assert.deepEqual(
      {
        sourceWidth: enemy.body.sourceWidth,
        sourceHeight: enemy.body.sourceHeight,
        offsetX: enemy.body.offset.x,
        offsetY: enemy.body.offset.y
      },
      initialBody
    );
  }
});
