import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

function extractObjectMethod(source, name) {
  const start = source.search(new RegExp(`^  ${name}\\(`, "m"));
  assert.ok(start >= 0, `missing ${name}`);
  const braceStart = source.indexOf(") {", start) + 2;
  let depth = 0;
  for (let index = braceStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`unterminated ${name}`);
}

async function loadMethods(relativePath, names, dependencyNames, dependencies) {
  const source = await readFile(new URL(relativePath, import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  return new Function(...dependencyNames, `"use strict"; return ({${methods}});`)(...dependencies);
}

function createVisual(x, y, key) {
  return {
    x, y, key, active: true, visible: true, alpha: 1,
    setPosition(nextX, nextY) { this.x = nextX; this.y = nextY; return this; },
    setDisplaySize(width, height) { this.displayWidth = width; this.displayHeight = height; return this; },
    setAlpha(value) { this.alpha = value; return this; },
    setVisible(value) { this.visible = value; return this; },
    setTint(value) { this.tint = value; return this; },
    setRotation(value) { this.rotation = value; return this; },
    setDepth(value) { this.depth = value; return this; },
    destroy() { this.active = false; }
  };
}

test("combat presentation depths are frozen and live controller visuals stay below warnings", async () => {
  const {
    COMBAT_PRESENTATION_DEPTH,
    createCombatFeedbackController
  } = await import("../src/art/combatFeedback.js");
  assert.deepEqual(COMBAT_PRESENTATION_DEPTH, { decorationMin: 16, decorationMax: 26, warning: 30 });
  assert.ok(Object.isFrozen(COMBAT_PRESENTATION_DEPTH));

  const created = [];
  const scene = { add: { image(x, y, key) { const visual = createVisual(x, y, key); created.push(visual); return visual; } } };
  const controller = createCombatFeedbackController(scene, { poolLimits: { attack: 2, hit: 8, death: 8 } });
  const actors = [6, 0, 10, 12].map((depth) => ({ x: 10, y: 20, depth, active: true }));
  for (const actor of actors) controller.trackActor(actor, { radius: 8 });
  controller.update(1);

  assert.deepEqual(created.slice(0, 4).map((visual) => visual.depth), [5, -1, 9, 11]);
  assert.deepEqual(actors.map((actor) => actor.depth), [6, 0, 10, 12], "shadows cannot change actor depth");

  controller.notifyAttack({ originX: 1, originY: 2, angle: 0, heavy: false });
  controller.notifyHit({ x: 2, y: 3, impactX: 2, impactY: 3, enemyType: "infectedStaff", eliteType: null, isBoss: false, lethal: false });
  controller.notifyDeath({ x: 2, y: 3, enemyType: "infectedStaff", eliteType: null, isBoss: false });
  const effectDepths = created.slice(4).map((visual) => visual.depth);
  assert.ok(effectDepths.length === 3);
  assert.ok(effectDepths.every((depth) => depth >= 16 && depth <= 26));
  assert.ok(effectDepths.every((depth) => depth < COMBAT_PRESENTATION_DEPTH.warning));
});

test("material families resolve to deterministic biomass metal spatial Boss and neutral styles", async () => {
  const { createCombatFeedbackController } = await import("../src/art/combatFeedback.js");
  const created = [];
  const scene = { add: { image(x, y, key) { const visual = createVisual(x, y, key); created.push(visual); return visual; } } };
  const controller = createCombatFeedbackController(scene, { poolLimits: { attack: 1, hit: 8, death: 8 } });
  const cases = [
    [{ enemyType: "biomass", eliteType: "biomass", isBoss: false }, 0xa14a72],
    [{ enemyType: "drone", eliteType: null, isBoss: false }, 0xe5f4ff],
    [{ enemyType: "blinkStalker", eliteType: "blinkStalker", isBoss: false }, 0x7de7f2],
    [{ enemyType: "scp049", eliteType: null, isBoss: true }, 0xd7e3e8],
    [{ enemyType: "unknown", eliteType: null, isBoss: false }, 0x9ed4df]
  ];
  for (const [metadata] of cases) {
    controller.notifyHit({ x: 1, y: 2, impactX: 1, impactY: 2, lethal: false, ...metadata });
  }
  assert.deepEqual(created.map((visual) => visual.tint), cases.map(([, tint]) => tint));
});

test("charge line and teleport target keep exact geometry at the warning depth", async () => {
  const { COMBAT_PRESENTATION_DEPTH } = await import("../src/art/combatFeedback.js");
  const { createChargeWarning, createTeleportWarning } = await loadMethods(
    "../src/scene/enemies.js",
    ["createChargeWarning", "createTeleportWarning"],
    ["COMBAT_PRESENTATION_DEPTH"],
    [COMBAT_PRESENTATION_DEPTH]
  );

  function run(method, args) {
    const calls = [];
    const graphics = {
      active: true,
      setDepth(value) { calls.push(["depth", value]); return this; },
      lineStyle(...values) { calls.push(["lineStyle", ...values]); return this; },
      lineBetween(...values) { calls.push(["lineBetween", ...values]); return this; },
      strokeCircle(...values) { calls.push(["strokeCircle", ...values]); return this; }
    };
    const scene = {
      add: { graphics: () => graphics },
      clearEliteWarning() { calls.push(["clear"]); },
      registerTransientEffect(target) { assert.equal(target, graphics); calls.push(["register"]); }
    };
    const enemy = { x: 10, y: 20, chargeAngle: 0, warningGraphic: null };
    method.call(scene, enemy, ...args);
    assert.equal(enemy.warningGraphic, graphics);
    return calls;
  }

  assert.deepEqual(run(createChargeWarning, []), [
    ["clear"], ["depth", 30], ["lineStyle", 3, 0xffa773, 0.95],
    ["lineBetween", 10, 20, 150, 20], ["register"]
  ]);
  assert.deepEqual(run(createTeleportWarning, [60, 70]), [
    ["clear"], ["depth", 30], ["lineStyle", 2, 0x9df7ff, 0.95],
    ["strokeCircle", 60, 70, 24], ["lineBetween", 50, 70, 70, 70],
    ["lineBetween", 60, 60, 60, 80], ["register"]
  ]);
});

test("field pulse lightning and muzzle decorations stay inside the shared decoration band", async () => {
  const { COMBAT_PRESENTATION_DEPTH } = await import("../src/art/combatFeedback.js");
  const Phaser = {
    Math: {
      Between: () => 0,
      Linear: (a, b, t) => a + (b - a) * t
    }
  };
  const BALANCE = { weaponUpgrades: { teslaFieldTickMs: 600 }, feedback: { muzzleDurationMs: 90 } };
  const methods = await loadMethods(
    "../src/scene/weapons.js",
    ["spawnTeslaFieldPulse", "spawnLightningSegment", "spawnMuzzleFlash"],
    ["Phaser", "BALANCE", "COMBAT_PRESENTATION_DEPTH"],
    [Phaser, BALANCE, COMBAT_PRESENTATION_DEPTH]
  );
  const depths = [];
  function display() {
    return {
      scene: {}, clear() { return this; }, setAlpha() { return this; }, setActive() { return this; }, setVisible() { return this; },
      setDepth(value) { depths.push(value); return this; }, lineStyle() { return this; }, beginPath() { return this; },
      moveTo() { return this; }, lineTo() { return this; }, strokePath() { return this; }, destroy() {}
    };
  }
  const scene = {
    player: { x: 10, y: 20 },
    _lightningPool: [],
    add: { circle: display, graphics: display },
    registerTransientEffect() {},
    tweens: { add() {} },
    releaseToPool() {}
  };
  methods.spawnTeslaFieldPulse.call(scene, 1, 2, 30);
  methods.spawnLightningSegment.call(scene, 1, 2, 3, 4);
  methods.spawnMuzzleFlash.call(scene, 0);
  assert.deepEqual(depths, [16, 19, 18]);
  assert.ok(depths.every((depth) => depth >= COMBAT_PRESENTATION_DEPTH.decorationMin && depth <= COMBAT_PRESENTATION_DEPTH.decorationMax));
});
