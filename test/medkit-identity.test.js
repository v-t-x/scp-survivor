import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import { TEXTURES } from "../src/assets/manifest.js";

async function loadProgressionMixin() {
  const source = await readFile(new URL("../src/scene/progression.js", import.meta.url), "utf8");
  const declaration = "export const progressionMixin =";
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1, "progressionMixin export must exist");
  const body = source.slice(start).replace(declaration, "const progressionMixin =");
  const Phaser = {
    Math: {
      FloatBetween: () => 0,
      Between: () => 240,
      Clamp: (value, min, max) => Math.min(max, Math.max(min, value))
    }
  };
  return Function(
    "Phaser",
    "BALANCE",
    "WORLD_WIDTH",
    "WORLD_HEIGHT",
    `${body}\nreturn progressionMixin;`
  )(Phaser, BALANCE, 2_000, 2_000);
}

const progressionMixin = await loadProgressionMixin();

test("medkit keeps the approved timing, healing, and texture contract", () => {
  assert.equal(BALANCE.match.medkitSpawnAtMs, 240_000);
  assert.equal(BALANCE.pickups.medkit.healAmount, 60);
  assert.equal(TEXTURES.medkit, "medkit");
});

test("medkit spawn keeps placement, collision, depth, and banner semantics", () => {
  const created = [];
  const banners = [];
  const pickup = {
    pickupType: null,
    circle: null,
    depth: null,
    setCircle(value) { this.circle = value; return this; },
    setDepth(value) { this.depth = value; return this; }
  };
  const scene = {
    player: { x: 500, y: 500 },
    supplyPickups: {
      create(x, y, texture) {
        created.push([x, y, texture]);
        return pickup;
      }
    },
    showTopBanner(...args) { banners.push(args); }
  };

  progressionMixin.spawnMedkit.call(scene);

  assert.deepEqual(created, [[740, 500, "medkit"]]);
  assert.equal(pickup.pickupType, "medkit");
  assert.equal(pickup.circle, 9);
  assert.equal(pickup.depth, 14);
  assert.deepEqual(banners, [["医疗补给", "急救包已在设施内出现", 2400]]);
});

test("medkit spawns once when mission time reaches four minutes", () => {
  let spawnCalls = 0;
  const scene = {
    medkitSpawned: false,
    isMissionActive: true,
    isGameOver: false,
    elapsedSurvivalMs: 239_999,
    spawnMedkit() { spawnCalls += 1; }
  };

  progressionMixin.updateMedkitSpawn.call(scene);
  assert.equal(spawnCalls, 0);
  assert.equal(scene.medkitSpawned, false);

  scene.elapsedSurvivalMs = 240_000;
  progressionMixin.updateMedkitSpawn.call(scene);
  assert.equal(spawnCalls, 1);
  assert.equal(scene.medkitSpawned, true);

  progressionMixin.updateMedkitSpawn.call(scene);
  assert.equal(spawnCalls, 1);
});
