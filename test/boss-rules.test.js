import test from "node:test";
import assert from "node:assert/strict";

import { BALANCE } from "../src/config/balance.js";
import {
  getBossDamageMultiplier,
  getBossUpdateActions,
  getBossWavePlan
} from "../src/scene/bossRules.js";

const config = BALANCE.boss.scp049;

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
