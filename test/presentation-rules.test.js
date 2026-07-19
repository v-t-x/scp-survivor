import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CHARACTER_DISPLAY_SCALE,
  applyDisplayScalePreservingBody,
  applyTextureAndScalePreservingBody,
  centerCircularBody,
  getOutagePresentation,
  resetFacilityPresentation
} from "../src/art/presentationRules.js";

function createPhysicsImageStub({ width, height, radius = 0 }) {
  const gameObject = {
    x: 100,
    y: 200,
    scaleX: 1,
    scaleY: 1,
    displayOriginX: 16,
    displayOriginY: 16,
    setScale(scale) {
      this.scaleX = scale;
      this.scaleY = scale;
      return this;
    }
  };
  gameObject.body = {
    sourceWidth: width,
    sourceHeight: height,
    width,
    height,
    halfWidth: width / 2,
    halfHeight: height / 2,
    radius,
    isCircle: radius > 0,
    offset: {
      x: (32 - width) / 2,
      y: (32 - height) / 2,
      set(x, y) {
        this.x = x;
        this.y = y;
      }
    },
    position: { x: 0, y: 0 },
    updateFromGameObject() {
      this.width = this.sourceWidth * Math.abs(gameObject.scaleX);
      this.height = this.sourceHeight * Math.abs(gameObject.scaleY);
      this.halfWidth = this.width / 2;
      this.halfHeight = this.height / 2;
      this.position.x =
        gameObject.x + gameObject.scaleX * (this.offset.x - gameObject.displayOriginX);
      this.position.y =
        gameObject.y + gameObject.scaleY * (this.offset.y - gameObject.displayOriginY);
    }
  };
  gameObject.body.updateFromGameObject();
  return gameObject;
}

function createTextureSwapPhysicsStub() {
  const calls = { setTexture: [], setScale: [] };
  const gameObject = {
    x: 150,
    y: 90,
    width: 40,
    height: 36,
    scaleX: 1,
    scaleY: 1,
    displayOriginX: 20,
    displayOriginY: 18,
    texture: { key: "fallback-texture" },
    setTexture(key, frame) {
      calls.setTexture.push([key, frame]);
      this.texture.key = key;
      this.width = 64;
      this.height = 64;
      this.displayOriginX = 21;
      this.displayOriginY = 39;
      this.body.sourceWidth = 64;
      this.body.sourceHeight = 64;
      return this;
    },
    setScale(scale) {
      calls.setScale.push(scale);
      this.scaleX = scale;
      this.scaleY = scale;
      return this;
    }
  };
  gameObject.body = {
    sourceWidth: 31,
    sourceHeight: 27,
    width: 31,
    height: 27,
    halfWidth: 15.5,
    halfHeight: 13.5,
    radius: 9,
    isCircle: true,
    _sx: 1,
    _sy: 1,
    updateCount: 0,
    offset: {
      x: 7,
      y: 11,
      set(x, y) {
        this.x = x;
        this.y = y;
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
        gameObject.x + gameObject.scaleX * (this.offset.x - gameObject.displayOriginX);
      this.position.y =
        gameObject.y + gameObject.scaleY * (this.offset.y - gameObject.displayOriginY);
    }
  };
  gameObject.body.updateFromGameObject();
  return { calls, gameObject };
}

function snapshotTextureSwapState(gameObject, calls) {
  return {
    calls: {
      setTexture: [...calls.setTexture],
      setScale: [...calls.setScale]
    },
    gameObject: {
      x: gameObject.x,
      y: gameObject.y,
      width: gameObject.width,
      height: gameObject.height,
      scaleX: gameObject.scaleX,
      scaleY: gameObject.scaleY,
      displayOriginX: gameObject.displayOriginX,
      displayOriginY: gameObject.displayOriginY,
      textureKey: gameObject.texture.key
    },
    body: {
      sourceWidth: gameObject.body.sourceWidth,
      sourceHeight: gameObject.body.sourceHeight,
      width: gameObject.body.width,
      height: gameObject.body.height,
      halfWidth: gameObject.body.halfWidth,
      halfHeight: gameObject.body.halfHeight,
      radius: gameObject.body.radius,
      isCircle: gameObject.body.isCircle,
      scaleX: gameObject.body._sx,
      scaleY: gameObject.body._sy,
      updateCount: gameObject.body.updateCount,
      offset: { ...gameObject.body.offset },
      position: { ...gameObject.body.position }
    }
  };
}

test("outage preserves facility readability at full strength", () => {
  assert.deepEqual(CHARACTER_DISPLAY_SCALE, {
    player: 1.2,
    infectedStaff: 1.15,
    scp049: 1.2
  });
  const state = getOutagePresentation(1, 1000);
  assert.equal(state.darknessAlpha, 0.82);
  assert.ok(state.facilityAlpha >= 0.62 && state.facilityAlpha <= 0.88);
  assert.equal(state.facilityTint, 0x9b3942);
});

test("facility controller wiring replaces legacy visual-array outage resets", async () => {
  const timeline = await readFile(new URL("../src/scene/timeline.js", import.meta.url), "utf8");
  const world = await readFile(new URL("../src/scene/world.js", import.meta.url), "utf8");
  const systems = await readFile(new URL("../src/scene/systems.js", import.meta.url), "utf8");
  assert.doesNotMatch(timeline, /arenaGrid/);
  assert.match(world, /createFacilityRoomController/);
  assert.match(world, /createMinimalFacilityFallback/);
  assert.match(world, /this\.facilityRoomController\s*=/);
  assert.match(world, /Phaser\.Scenes\.Events\.SHUTDOWN/);
  assert.match(world, /Phaser\.Scenes\.Events\.DESTROY/);
  assert.match(timeline, /getFacilityPresentation/);
  assert.match(timeline, /refreshFacilityPresentation/);
  assert.match(systems, /facilityRoomController/);
  assert.doesNotMatch(timeline, /resetFacilityPresentation/);
  assert.doesNotMatch(systems, /resetFacilityPresentation/);
});

test("display scaling preserves rectangular and circular physics geometry", () => {
  const player = createPhysicsImageStub({ width: 24, height: 24 });
  const boss = createPhysicsImageStub({ width: 36, height: 36, radius: 18 });
  const beforePlayer = { ...player.body.position };
  const beforeBoss = { ...boss.body.position };

  applyDisplayScalePreservingBody(player, CHARACTER_DISPLAY_SCALE.player);
  applyDisplayScalePreservingBody(boss, CHARACTER_DISPLAY_SCALE.scp049);

  assert.deepEqual(
    [player.body.width, player.body.height, player.body.position.x, player.body.position.y],
    [24, 24, beforePlayer.x, beforePlayer.y]
  );
  assert.deepEqual(
    [boss.body.width, boss.body.height, boss.body.radius, boss.body.position.x, boss.body.position.y],
    [36, 36, 18, beforeBoss.x, beforeBoss.y]
  );
});

test("texture swap snapshots the next preUpdate body after an immediate scale", () => {
  const { calls, gameObject } = createTextureSwapPhysicsStub();
  gameObject.setScale(1.2);
  calls.setScale.length = 0;

  assert.equal(gameObject.body._sx, 1, "body must begin on the previous physics scale");
  assert.equal(gameObject.scaleX, 1.2, "game object must already have the elite scale");
  const expected = {
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

  assert.equal(
    applyTextureAndScalePreservingBody(gameObject, "production-sheet", 1),
    gameObject
  );

  assert.deepEqual(calls.setTexture, [["production-sheet", 0]]);
  assert.deepEqual(calls.setScale, [1]);
  assert.equal(gameObject.texture.key, "production-sheet");
  assert.equal(gameObject.scaleX, 1);
  assert.equal(gameObject.scaleY, 1);
  assert.equal(gameObject.x, expected.gameObjectX);
  assert.equal(gameObject.y, expected.gameObjectY);
  assert.equal(gameObject.body.position.x, expected.x);
  assert.equal(gameObject.body.position.y, expected.y);
  assert.equal(gameObject.body.width, expected.width);
  assert.equal(gameObject.body.height, expected.height);
  assert.equal(gameObject.body.radius, expected.radius);
  assert.equal(gameObject.body.isCircle, expected.isCircle);
  assert.equal(gameObject.body.updateCount, 3, "helper must update before and after the swap");
});

test("texture swap rejects zero and non-finite target scales before body mutation", () => {
  for (const targetScale of [0, Number.NaN, Number.POSITIVE_INFINITY]) {
    const { calls, gameObject } = createTextureSwapPhysicsStub();
    gameObject.setScale(1.2);
    calls.setScale.length = 0;
    const before = snapshotTextureSwapState(gameObject, calls);

    assert.throws(
      () => applyTextureAndScalePreservingBody(gameObject, "production-sheet", targetScale),
      {
        name: "RangeError",
        message: /finite, non-zero target scale/
      }
    );
    assert.deepEqual(
      snapshotTextureSwapState(gameObject, calls),
      before,
      `target scale ${String(targetScale)} must not mutate display or body state`
    );
  }
});

test("texture swap preserves finite circular body geometry at a negative target scale", () => {
  const { calls, gameObject } = createTextureSwapPhysicsStub();
  gameObject.setScale(1.2);
  calls.setScale.length = 0;
  const expected = {
    x: gameObject.x
      + gameObject.scaleX * (gameObject.body.offset.x - gameObject.displayOriginX),
    y: gameObject.y
      + gameObject.scaleY * (gameObject.body.offset.y - gameObject.displayOriginY),
    width: gameObject.body.sourceWidth * Math.abs(gameObject.scaleX),
    height: gameObject.body.sourceHeight * Math.abs(gameObject.scaleY),
    radius: gameObject.body.radius,
    isCircle: gameObject.body.isCircle
  };

  applyTextureAndScalePreservingBody(gameObject, "production-sheet", -1.5);

  assert.equal(gameObject.scaleX, -1.5);
  assert.equal(gameObject.scaleY, -1.5);
  assert.deepEqual(
    {
      x: gameObject.body.position.x,
      y: gameObject.body.position.y,
      width: gameObject.body.width,
      height: gameObject.body.height,
      radius: gameObject.body.radius,
      isCircle: gameObject.body.isCircle
    },
    expected
  );
  for (const value of [
    gameObject.body.position.x,
    gameObject.body.position.y,
    gameObject.body.width,
    gameObject.body.height,
    gameObject.body.radius
  ]) {
    assert.ok(Number.isFinite(value));
  }
});

test("texture swap snapshots an initial zero-scale stale body before restoring unit scale", () => {
  const { calls, gameObject } = createTextureSwapPhysicsStub();
  gameObject.setScale(0);
  calls.setScale.length = 0;

  assert.equal(gameObject.body._sx, 1, "body must begin stale at its previous scale");
  applyTextureAndScalePreservingBody(gameObject, "production-sheet", 1);

  assert.equal(gameObject.scaleX, 1);
  assert.equal(gameObject.scaleY, 1);
  assert.deepEqual(
    {
      x: gameObject.body.position.x,
      y: gameObject.body.position.y,
      width: gameObject.body.width,
      height: gameObject.body.height,
      radius: gameObject.body.radius,
      isCircle: gameObject.body.isCircle
    },
    {
      x: gameObject.x,
      y: gameObject.y,
      width: 0,
      height: 0,
      radius: 9,
      isCircle: true
    }
  );
  for (const value of [
    gameObject.body.position.x,
    gameObject.body.position.y,
    gameObject.body.width,
    gameObject.body.height,
    gameObject.body.radius
  ]) {
    assert.ok(Number.isFinite(value));
  }
});

test("texture swap without a physics body still applies valid texture and scale values", () => {
  for (const targetScale of [1, -1.5]) {
    const calls = [];
    const gameObject = {
      setTexture(key, frame) {
        calls.push(["texture", key, frame]);
        return this;
      },
      setScale(scale) {
        calls.push(["scale", scale]);
        return this;
      }
    };

    assert.equal(
      applyTextureAndScalePreservingBody(gameObject, "production-sheet", targetScale),
      gameObject
    );
    assert.deepEqual(calls, [
      ["texture", "production-sheet", 0],
      ["scale", targetScale]
    ]);
  }
});

test("texture swap rejects invalid scales before reading a missing body or mutating display state", () => {
  for (const targetScale of [0, Number.NaN, Number.POSITIVE_INFINITY]) {
    const calls = [];
    let bodyReads = 0;
    const gameObject = {
      texture: { key: "fallback-texture" },
      frame: 7,
      scaleX: 1.25,
      scaleY: -1.25,
      get body() {
        bodyReads += 1;
        return undefined;
      },
      setTexture(key, frame) {
        calls.push(["texture", key, frame]);
        this.texture.key = key;
        this.frame = frame;
        return this;
      },
      setScale(scale) {
        calls.push(["scale", scale]);
        this.scaleX = scale;
        this.scaleY = scale;
        return this;
      }
    };
    const before = {
      textureKey: gameObject.texture.key,
      frame: gameObject.frame,
      scaleX: gameObject.scaleX,
      scaleY: gameObject.scaleY
    };

    assert.throws(
      () => applyTextureAndScalePreservingBody(gameObject, "production-sheet", targetScale),
      {
        name: "RangeError",
        message: /finite, non-zero target scale/
      }
    );
    assert.equal(bodyReads, 0, "invalid scale must be rejected before reading body");
    assert.deepEqual(calls, []);
    assert.deepEqual(
      {
        textureKey: gameObject.texture.key,
        frame: gameObject.frame,
        scaleX: gameObject.scaleX,
        scaleY: gameObject.scaleY
      },
      before
    );
  }
});

test("circular bodies stay centered for production and fallback character textures", () => {
  const cases = [
    { width: 48, height: 48, radius: 10, expected: [10, 14, 14] },
    { width: 20, height: 20, radius: 10, expected: [10, 0, 0] },
    { width: 64, height: 80, radius: 18, expected: [18, 14, 22] },
    { width: 36, height: 36, radius: 18, expected: [18, 0, 0] }
  ];

  for (const { width, height, radius, expected } of cases) {
    const calls = [];
    const gameObject = {
      width,
      height,
      setCircle(...args) {
        calls.push(args);
        return this;
      }
    };

    assert.equal(centerCircularBody(gameObject, radius), gameObject);
    assert.deepEqual(calls, [expected]);
  }
});

test("infected staff centers its circle without changing crawler collision offsets", async () => {
  const enemies = await readFile(new URL("../src/scene/enemies.js", import.meta.url), "utf8");
  const circleBranch = enemies.slice(
    enemies.indexOf('if (config.bodyShape === "circle")'),
    enemies.indexOf('} else if (config.bodyShape === "box")')
  );

  assert.match(circleBranch, /config\.type === "infectedStaff"/);
  assert.match(circleBranch, /centerCircularBody\(enemy, config\.bodyRadius\)/);
  assert.match(circleBranch, /enemy\.setCircle\(config\.bodyRadius\)/);
});

test("enemy frame updates keep R-17 transforms stable and biomass only writes its compatibility body size", async () => {
  const enemies = await readFile(new URL("../src/scene/enemies.js", import.meta.url), "utf8");
  const methodRanges = [
    ["  updateEnemies()", "  tryReplicateEnemy(enemy)"],
    ["  updateRiotElite(enemy)", "  updateBlinkElite(enemy)"],
    ["  updateBlinkElite(enemy)", "  updateBiomassElite(enemy)"],
    ["  updateBiomassElite(enemy)", "  updateDroneBehavior(enemy)"]
  ];

  for (const [startMarker, endMarker] of methodRanges) {
    const block = enemies.slice(
      enemies.indexOf(startMarker),
      enemies.indexOf(endMarker)
    );
    assert.doesNotMatch(block, /enemy\.(?:setScale|setFlipX|setRotation)\s*\(/);
    assert.doesNotMatch(block, /applyEnemyPresentation/);
  }

  const biomassUpdate = enemies.slice(
    enemies.indexOf("  updateBiomassElite(enemy)"),
    enemies.indexOf("  updateDroneBehavior(enemy)")
  );
  assert.match(
    biomassUpdate,
    /this\.physics\.moveToObject\(enemy, this\.player, enemy\.moveSpeed\)/
  );
  assert.match(
    biomassUpdate,
    /const pulse = 1\.16 \+ Math\.sin\(this\.elapsedSurvivalMs \* 0\.008\) \* 0\.07;/
  );
  assert.match(biomassUpdate, /enemy\.body\.setSize\(/);
  assert.match(biomassUpdate, /enemy\.biomassFallbackBodySourceWidth \* pulse/);
  assert.match(biomassUpdate, /enemy\.biomassFallbackBodySourceHeight \* pulse/);
  assert.equal((biomassUpdate.match(/enemy\.body\./g) ?? []).length, 1);
  assert.doesNotMatch(
    biomassUpdate,
    /enemy\.body\.(?:sourceWidth|sourceHeight|offset|updateFromGameObject|isCircle|radius)\s*=/
  );
  assert.doesNotMatch(
    biomassUpdate,
    /enemy\.(?:contactDamage|maxHealth|health|moveSpeed|frontDamageMultiplier|sideDamageMultiplier|rearDamageMultiplier)\s*=/
  );
});

test("facility presentation reset clears outage tint and alpha", () => {
  const activeVisual = {
    active: true,
    alpha: 0.7,
    tinted: true,
    setAlpha(value) {
      this.alpha = value;
    },
    clearTint() {
      this.tinted = false;
    }
  };
  const destroyedVisual = { active: false };

  resetFacilityPresentation([activeVisual, destroyedVisual]);

  assert.equal(activeVisual.alpha, 1);
  assert.equal(activeVisual.tinted, false);
});

test("opening character integration preserves body configuration contracts", async () => {
  const [world, enemies, main] = await Promise.all([
    readFile(new URL("../src/scene/world.js", import.meta.url), "utf8"),
    readFile(new URL("../src/scene/enemies.js", import.meta.url), "utf8"),
    readFile(new URL("../src/main.js", import.meta.url), "utf8")
  ]);
  assert.match(world, /this\.player\.body\.setSize\(24, 24\)/);
  assert.match(enemies, /centerCircularBody\(enemy, config\.bodyRadius\)/);
  assert.match(enemies, /enemy\.body\.setSize\(config\.bodySize, config\.bodySize\)/);
  assert.match(enemies, /centerCircularBody\(boss, 18\)/);
  assert.doesNotMatch(`${world}\n${enemies}`, /body\.setOffset/);
  assert.match(main, /syncCharacterPresentation\(this\)/);
});

test("player presentation receives attack-facing separately from movement fallback memory", async () => {
  const [main, systems, presentation] = await Promise.all([
    readFile(new URL("../src/main.js", import.meta.url), "utf8"),
    readFile(new URL("../src/scene/systems.js", import.meta.url), "utf8"),
    readFile(new URL("../src/art/characterPresentation.js", import.meta.url), "utf8")
  ]);
  const movement = systems.slice(
    systems.indexOf("  handlePlayerMovement()"),
    systems.indexOf("  tryStartDash()")
  );

  assert.match(main, /this\.playerMovementFallbackAngle\s*=\s*0/);
  assert.match(movement, /this\.playerMovementFallbackAngle\s*=\s*Math\.atan2/);
  assert.doesNotMatch(movement, /this\.playerFacingAngle\s*=/);
  assert.match(presentation, /scene\.playerFacingAngle/);
});
