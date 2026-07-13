import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  CHARACTER_DISPLAY_SCALE,
  applyDisplayScalePreservingBody,
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

test("outage integration no longer depends on removed arenaGrid", async () => {
  const timeline = await readFile(new URL("../src/scene/timeline.js", import.meta.url), "utf8");
  const world = await readFile(new URL("../src/scene/world.js", import.meta.url), "utf8");
  const systems = await readFile(new URL("../src/scene/systems.js", import.meta.url), "utf8");
  assert.doesNotMatch(timeline, /arenaGrid/);
  assert.match(world, /this\.facilityVisuals\s*=\s*createFacilityRoomVisuals/);
  assert.match(systems, /resetFacilityPresentation\(this\.facilityVisuals\)/);
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
