import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { BALANCE } from "../src/config/balance.js";
import {
  getBossDamageMultiplier,
  getBossUpdateActions,
  getBossWavePlan
} from "../src/scene/bossRules.js";

const config = BALANCE.boss.scp049;

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

async function loadHandleBossDefeat() {
  const source = await readFile(new URL("../src/scene/enemies.js", import.meta.url), "utf8");
  const method = extractObjectMethod(source, "handleBossDefeat");
  return new Function("BALANCE", `"use strict"; return ({${method}}).handleBossDefeat;`)(BALANCE);
}

test("normal and frenzy wave plans preserve the approved pressure contract", () => {
  assert.deepEqual(getBossWavePlan(config), {
    countMin: 10,
    countMax: 10,
    radius: 52,
    types: ["infectedStaff"],
    healthMultiplier: 0.6,
    damageMultiplier: 0.85
  });

  assert.deepEqual(getBossWavePlan(config, { frenzy: true }), {
    countMin: 20,
    countMax: 20,
    radius: 190,
    types: ["riotUnit", "blinkStalker", "biomass", "drone"],
    healthMultiplier: 1,
    damageMultiplier: 1
  });
});

test("Boss damage bonuses multiply and clamp at 2x", () => {
  assert.equal(getBossDamageMultiplier("pistol", "normal", config), 1);
  assert.equal(getBossDamageMultiplier("shotgun", "normal", config), 1.5);
  assert.equal(getBossDamageMultiplier("pistol", "frenzy", config), 1.35);
  assert.equal(getBossDamageMultiplier("shotgun", "frenzy", config), 2);
});

test("frenzy state actions use elapsed survival deadlines", () => {
  const normalBoss = {
    bossState: "normal",
    nextSummonAtMs: 15_000,
    nextFrenzyAtMs: 12_000,
    health: 2_500,
    maxHealth: 2_500,
    summonCooldownMs: 11_000
  };
  assert.deepEqual(getBossUpdateActions(normalBoss, 11_999, config), {
    summonNormal: false,
    enterFrenzy: false,
    exitFrenzy: false,
    nextSummonDelayMs: 11_000
  });
  assert.deepEqual(getBossUpdateActions(normalBoss, 12_000, config), {
    summonNormal: false,
    enterFrenzy: true,
    exitFrenzy: false,
    nextSummonDelayMs: 11_000
  });

  const frenzyBoss = { ...normalBoss, bossState: "frenzy", stateUntilMs: 14_500 };
  assert.equal(getBossUpdateActions(frenzyBoss, 14_499, config).exitFrenzy, false);
  assert.equal(getBossUpdateActions(frenzyBoss, 14_500, config).exitFrenzy, true);
});

test("frenzy-disabled rollback retains enraged normal summon cadence", () => {
  const rollbackConfig = { ...config, frenzyEnabled: false };
  const boss = {
    bossState: "normal",
    nextSummonAtMs: 20_000,
    nextFrenzyAtMs: 0,
    health: 1_000,
    maxHealth: 2_500,
    summonCooldownMs: 11_000
  };

  assert.deepEqual(getBossUpdateActions(boss, 20_000, rollbackConfig), {
    summonNormal: true,
    enterFrenzy: false,
    exitFrenzy: false,
    nextSummonDelayMs: 6_600
  });
});

function runBossDefeat(handleBossDefeat) {
  const events = [];
  let isDying = false;
  let bossState = "normal";
  let killCount = 0;
  let bossPhaseActive = true;
  let victoryCallback = null;
  const boss = {
    active: true,
    body: {
      enable: true,
      velocity: { x: 5, y: 6 },
      setVelocity(x, y) {
        events.push("velocity");
        this.velocity.x = x;
        this.velocity.y = y;
      }
    }
  };
  Object.defineProperty(boss, "isDying", {
    get: () => isDying,
    set(value) { isDying = value; events.push("isDying"); }
  });
  Object.defineProperty(boss, "bossState", {
    get: () => bossState,
    set(value) { bossState = value; events.push("bossState"); }
  });
  const scene = {
    isGameOver: false,
    clearFrenzyTint() { events.push("clearTint"); },
    showTopBanner() { events.push("banner"); },
    playEnemyDeathEffect() { events.push("legacyDeath"); },
    commitEnemyDeathActor(target) {
      events.push("commitActor");
      target.body.enable = false;
    },
    time: {
      delayedCall(delay, callback) {
        events.push("timer");
        victoryCallback = callback;
        scene.victoryDelay = delay;
        return {};
      }
    },
    triggerVictory() { events.push("victory"); }
  };
  Object.defineProperty(scene, "killCount", {
    get: () => killCount,
    set(value) { killCount = value; events.push("killCount"); }
  });
  Object.defineProperty(scene, "bossPhaseActive", {
    get: () => bossPhaseActive,
    set(value) { bossPhaseActive = value; events.push("bossPhase"); }
  });

  handleBossDefeat.call(scene, boss, () => {
    events.push("presentations");
    assert.equal(isDying, true);
    assert.equal(bossState, "dying");
    assert.equal(killCount, 1);
    assert.equal(bossPhaseActive, false);
    assert.equal(boss.body.enable, false);
  });
  return { scene, events, victoryCallback };
}

// Break caught: victory scheduling precedes terminal presentation or hard-codes 210/900 instead of the balance expression.
test("Boss defeat commits state then presentations then the deathShrink plus 120 victory timer", async () => {
  const handleBossDefeat = await loadHandleBossDefeat();
  const originalDeathShrinkMs = BALANCE.feedback.deathShrinkMs;
  try {
    assert.equal(originalDeathShrinkMs, 90);
    const current = runBossDefeat(handleBossDefeat);
    assert.deepEqual(current.events, [
      "isDying", "bossState", "clearTint", "velocity", "killCount", "bossPhase",
      "banner", "commitActor", "presentations", "timer"
    ]);
    assert.equal(current.scene.victoryDelay, originalDeathShrinkMs + 120);
    assert.equal(current.scene.victoryDelay, 210);
    current.victoryCallback();
    assert.equal(current.events.at(-1), "victory");

    BALANCE.feedback.deathShrinkMs = 95;
    const shifted = runBossDefeat(handleBossDefeat);
    assert.equal(shifted.scene.victoryDelay, 95 + 120);
  } finally {
    BALANCE.feedback.deathShrinkMs = originalDeathShrinkMs;
  }
});
