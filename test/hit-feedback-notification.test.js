import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import {
  ENEMY_GRID_CELL_SIZE,
  ENEMY_GRID_STRIDE,
  WORLD_HEIGHT,
  WORLD_WIDTH
} from "../src/config/constants.js";

function extractObjectMethod(source, name) {
  const start = source.search(new RegExp(`^  ${name}\\(`, "m"));
  assert.ok(start >= 0, `missing ${name}`);
  const braceStart = source.indexOf(") {", start) + 2;
  assert.ok(braceStart >= 2, `missing body for ${name}`);
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

async function loadDamageEnemy() {
  const source = await readFile(new URL("../src/scene/combat.js", import.meta.url), "utf8");
  const method = extractObjectMethod(source, "damageEnemy");
  return new Function(`"use strict"; return ({${method}}).damageEnemy;`)();
}

function createPhaserStub() {
  return {
    Math: {
      Angle: { Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) },
      Distance: { Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) },
      Between: (minimum) => minimum,
      Clamp: (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value))
    }
  };
}

async function loadCombatMethods(...names) {
  const source = await readFile(new URL("../src/scene/combat.js", import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  return new Function(
    "Phaser",
    "BALANCE",
    "ENEMY_GRID_CELL_SIZE",
    "ENEMY_GRID_STRIDE",
    "WORLD_WIDTH",
    "WORLD_HEIGHT",
    `"use strict"; return ({${methods}});`
  )(
    createPhaserStub(),
    BALANCE,
    ENEMY_GRID_CELL_SIZE,
    ENEMY_GRID_STRIDE,
    WORLD_WIDTH,
    WORLD_HEIGHT
  );
}

async function loadWeaponMethod(name) {
  const source = await readFile(new URL("../src/scene/weapons.js", import.meta.url), "utf8");
  const method = extractObjectMethod(source, name);
  return new Function("Phaser", "BALANCE", `"use strict"; return ({${method}}).${name};`)(
    createPhaserStub(),
    BALANCE
  );
}

async function loadEnemyMethod(name) {
  const source = await readFile(new URL("../src/scene/enemies.js", import.meta.url), "utf8");
  const method = extractObjectMethod(source, name);
  return new Function("BALANCE", `"use strict"; return ({${method}}).${name};`)(BALANCE);
}

async function loadEffectsMethod(name) {
  const source = await readFile(new URL("../src/scene/effects.js", import.meta.url), "utf8");
  const method = extractObjectMethod(source, name);
  return new Function("BALANCE", `"use strict"; return ({${method}}).${name};`)(BALANCE);
}

function createEnemy(overrides = {}) {
  return {
    x: 120,
    y: 180,
    active: true,
    isDying: false,
    isBoss: false,
    isElite: false,
    enemyType: "infectedStaff",
    eliteType: null,
    enemyColor: 0x8b2635,
    health: 10,
    body: { enable: true },
    ...overrides
  };
}

function createController(mode, events, snapshots, scene, enemy) {
  if (mode === "missing") return undefined;
  return {
    notifyHit(snapshot) {
      events.push("notifyHit");
      snapshots.rawHit.push(snapshot);
      snapshots.hit.push(structuredClone(snapshot));
      snapshots.hitState.push({
        health: enemy.health,
        dying: enemy.isDying,
        rewards: scene.rewardCount,
        splits: scene.splitCount,
        kills: scene.killCount,
        bossState: enemy.bossState ?? null,
        bossPhaseActive: scene.bossPhaseActive,
        victoryTimers: scene.victoryTimers ?? 0
      });
      if (mode === "throwHit") throw new Error("hit presentation failed");
      return mode === "real" || mode === "hitOnly" || mode === "throwDeath";
    },
    notifyDeath(snapshot) {
      events.push("notifyDeath");
      snapshots.rawDeath.push(snapshot);
      snapshots.death.push(structuredClone(snapshot));
      snapshots.deathState.push({
        health: enemy.health,
        dying: enemy.isDying,
        rewards: scene.rewardCount,
        splits: scene.splitCount,
        kills: scene.killCount,
        bossState: enemy.bossState ?? null,
        bossPhaseActive: scene.bossPhaseActive,
        victoryTimers: scene.victoryTimers ?? 0
      });
      if (mode === "throwDeath") throw new Error("death presentation failed");
      return mode === "real" || mode === "deathOnly" || mode === "throwHit";
    }
  };
}

function createScene(enemy, mode = "real") {
  const events = [];
  const snapshots = {
    rawHit: [], rawDeath: [], hit: [], death: [], hitState: [], deathState: []
  };
  const scene = {
    player: { x: 0, y: 0 },
    killCount: 0,
    rewardCount: 0,
    splitCount: 0,
    bossPhaseActive: enemy.isBoss,
    getEnemyDamageTakenMultiplier: () => 1,
    flashEnemyOnHit() { events.push("flash"); },
    spawnFloatingDamage() { events.push("damageNumber"); },
    spawnImpactEffect() { events.push("legacyImpact"); },
    spawnDeathParticles() { events.push("legacyDeath"); },
    playSound() { events.push("sound"); },
    handleEnemyDefeatRewards(target) {
      events.push("rewards");
      this.rewardCount += 1;
      if (target.eliteType === "biomass") this.splitCount += 3;
    },
    playEnemyDeathEffect(target, options = {}) {
      events.push("deathState");
      target.isDying = true;
      target.body.enable = false;
      if (options.spawnParticles !== false) {
        this.spawnDeathParticles(target.x, target.y, target.enemyColor);
      }
    },
    handleBossDefeat(target) {
      events.push("bossState");
      target.isDying = true;
      target.bossState = "dying";
      target.body.enable = false;
      this.killCount += 1;
      this.bossPhaseActive = false;
    }
  };
  scene.combatFeedback = createController(mode, events, snapshots, scene, enemy);
  return { scene, events, snapshots };
}

function assertSnapshotShapes(snapshots) {
  assert.deepEqual(Object.keys(snapshots.hit[0]).sort(), [
    "damage", "eliteType", "enemyType", "impactX", "impactY", "isBoss", "lethal", "x", "y"
  ]);
  if (snapshots.death.length > 0) {
    assert.deepEqual(Object.keys(snapshots.death[0]).sort(), [
      "color", "eliteType", "enemyType", "isBoss", "x", "y"
    ]);
  }
  for (const snapshot of [...snapshots.rawHit, ...snapshots.rawDeath]) {
    assert.ok(Object.isFrozen(snapshot), "controller receives an immutable committed snapshot");
    assert.ok(
      Object.values(snapshot).every((value) => value === null || typeof value !== "object"),
      "snapshots retain primitives only"
    );
  }
}

test("nonlethal hits notify once after health commitment and preserve exactly one visual route", async () => {
  const damageEnemy = await loadDamageEnemy();
  for (const [mode, expectedLegacy] of [["real", 0], ["noop", 1], ["missing", 1], ["throwHit", 1]]) {
    const enemy = createEnemy();
    const { scene, events, snapshots } = createScene(enemy, mode);
    assert.doesNotThrow(() => damageEnemy.call(scene, enemy, 3, 118, 178, 0, 0, { sourceWeaponId: "pistol" }));
    assert.equal(enemy.health, 7, `${mode} must preserve damage`);
    assert.equal(snapshots.hit.length, mode === "missing" ? 0 : 1);
    assert.equal(snapshots.death.length, 0);
    assert.equal(events.filter((event) => event === "legacyImpact").length, expectedLegacy);
    assert.equal(events.filter((event) => event === "legacyDeath").length, 0);
    if (mode !== "missing") {
      assert.equal(snapshots.hitState[0].health, 7, "health must commit before notifyHit");
      assertSnapshotShapes(snapshots);
    }
  }
});

test("lethal normal and biomass hits commit rewards death state and kill count before independent notifications", async () => {
  const damageEnemy = await loadDamageEnemy();
  for (const [name, overrides, expectedSplits] of [
    ["normal", {}, 0],
    ["biomass", { isElite: true, eliteType: "biomass", enemyType: "biomass", canSplit: true }, 3]
  ]) {
    const enemy = createEnemy({ health: 2, ...overrides });
    const { scene, events, snapshots } = createScene(enemy, "real");
    damageEnemy.call(scene, enemy, 5, 121, 181, 0, 0, { sourceWeaponId: "tesla" });

    assert.equal(enemy.isDying, true, `${name} death state must commit`);
    assert.equal(scene.killCount, 1, `${name} kill count must commit once`);
    assert.equal(scene.rewardCount, 1, `${name} rewards must commit once`);
    assert.equal(scene.splitCount, expectedSplits, `${name} split count must remain gameplay-owned`);
    assert.deepEqual(events.filter((event) => event.startsWith("notify")), ["notifyHit", "notifyDeath"]);
    assert.deepEqual(snapshots.hitState[0], snapshots.deathState[0]);
    assert.deepEqual(snapshots.deathState[0], {
      health: -3,
      dying: true,
      rewards: 1,
      splits: expectedSplits,
      kills: 1,
      bossState: null,
      bossPhaseActive: false,
      victoryTimers: 0
    });
    assert.equal(events.includes("legacyImpact"), false);
    assert.equal(events.includes("legacyDeath"), false);
    assertSnapshotShapes(snapshots);

    damageEnemy.call(scene, enemy, 5, 121, 181, 0, 0, { sourceWeaponId: "tesla" });
    assert.equal(snapshots.hit.length, 1, `${name} duplicate overlap must not notify twice`);
    assert.equal(snapshots.death.length, 1, `${name} duplicate overlap must not duplicate death`);
    assert.equal(scene.killCount, 1);
  }
});

test("real Boss defeat commits boss and victory timer state before the single lethal hit/death pair", async () => {
  const [damageEnemy, handleBossDefeat] = await Promise.all([
    loadDamageEnemy(),
    loadEnemyMethod("handleBossDefeat")
  ]);
  const boss = createEnemy({
    health: 1,
    isBoss: true,
    enemyType: "scp049",
    bossState: "normal",
    body: { enable: true, setVelocity() {} }
  });
  const { scene, snapshots } = createScene(boss, "real");
  scene.handleBossDefeat = handleBossDefeat;
  scene.clearFrenzyTint = () => {};
  scene.showTopBanner = () => {};
  scene.victoryTimers = 0;
  scene.isGameOver = false;
  scene.time = {
    delayedCall(delay, callback) {
      scene.victoryTimers += 1;
      scene.victoryDelay = delay;
      scene.victoryCallback = callback;
      return {};
    }
  };
  damageEnemy.call(scene, boss, 2, boss.x, boss.y, 0, 0, { sourceWeaponId: "shotgun" });

  assert.equal(scene.killCount, 1);
  assert.equal(scene.bossPhaseActive, false);
  assert.equal(boss.bossState, "dying");
  assert.equal(snapshots.hit.length, 1);
  assert.equal(snapshots.death.length, 1);
  assert.equal(snapshots.hitState[0].bossState, "dying");
  assert.equal(snapshots.hitState[0].bossPhaseActive, false);
  assert.equal(snapshots.hitState[0].victoryTimers, 1);
  assert.equal(snapshots.deathState[0].kills, 1);
});

test("lethal false missing and throwing controller paths preserve exactly one fallback per event", async () => {
  const damageEnemy = await loadDamageEnemy();
  const matrix = [
    ["real", 0, 0],
    ["noop", 1, 1],
    ["missing", 1, 1],
    ["hitOnly", 0, 1],
    ["deathOnly", 1, 0],
    ["throwHit", 1, 0],
    ["throwDeath", 0, 1]
  ];

  for (const [mode, expectedImpact, expectedDeath] of matrix) {
    const enemy = createEnemy({ health: 1 });
    const { scene, events, snapshots } = createScene(enemy, mode);
    assert.doesNotThrow(() => damageEnemy.call(scene, enemy, 2, 1, 2));
    assert.equal(events.filter((event) => event === "legacyImpact").length, expectedImpact, `${mode} impact fallback`);
    assert.equal(events.filter((event) => event === "legacyDeath").length, expectedDeath, `${mode} death fallback`);
    assert.equal(scene.killCount, 1, `${mode} must preserve one kill`);
    assert.equal(scene.rewardCount, 1, `${mode} must preserve rewards`);
    assert.equal(snapshots.hit.length, mode === "missing" ? 0 : 1);
    assert.equal(snapshots.death.length, mode === "missing" ? 0 : 1);
  }
});

test("hit and death presentation failures remain independent and fall back per event", async () => {
  const damageEnemy = await loadDamageEnemy();

  const hitFailureEnemy = createEnemy({ health: 1 });
  const hitFailure = createScene(hitFailureEnemy, "throwHit");
  assert.doesNotThrow(() => damageEnemy.call(hitFailure.scene, hitFailureEnemy, 2, 1, 2));
  assert.deepEqual(hitFailure.events.filter((event) => event.startsWith("notify")), ["notifyHit", "notifyDeath"]);
  assert.equal(hitFailure.events.filter((event) => event === "legacyImpact").length, 1);
  assert.equal(hitFailure.events.filter((event) => event === "legacyDeath").length, 0);

  const deathFailureEnemy = createEnemy({ health: 1 });
  const deathFailure = createScene(deathFailureEnemy, "throwDeath");
  assert.doesNotThrow(() => damageEnemy.call(deathFailure.scene, deathFailureEnemy, 2, 1, 2));
  assert.deepEqual(deathFailure.events.filter((event) => event.startsWith("notify")), ["notifyHit", "notifyDeath"]);
  assert.equal(deathFailure.events.filter((event) => event === "legacyImpact").length, 0);
  assert.equal(deathFailure.events.filter((event) => event === "legacyDeath").length, 1);
});

test("real penetration explosion Tesla chain and biomass split routes notify once per committed damage", async () => {
  const combat = await loadCombatMethods(
    "handleBulletEnemyCollision",
    "applyBreacherExplosion",
    "damageEnemy",
    "handleEnemyDefeatRewards",
    "dropEliteRewards"
  );

  const penetrationEnemy = createEnemy({ health: 20 });
  const penetration = createScene(penetrationEnemy, "real");
  Object.assign(penetration.scene, combat);
  const bullet = {
    damage: 2, weaponId: "pistol", remainingPenetration: 1,
    x: 120, y: 180, originX: 0, originY: 0,
    destroyCalls: 0, destroy() { this.destroyCalls += 1; }
  };
  combat.handleBulletEnemyCollision.call(penetration.scene, bullet, penetrationEnemy);
  assert.equal(penetration.snapshots.hit.length, 1);
  assert.equal(bullet.remainingPenetration, 0);
  assert.equal(bullet.destroyCalls, 0);

  const splashA = createEnemy({ x: 110, y: 100, health: 20 });
  const splashB = createEnemy({ x: 125, y: 100, health: 20 });
  const sourceEnemy = createEnemy({ x: 100, y: 100, health: 20 });
  const explosion = createScene(splashA, "real");
  Object.assign(explosion.scene, combat);
  const cellX = Math.floor(100 / ENEMY_GRID_CELL_SIZE);
  const cellY = Math.floor(100 / ENEMY_GRID_CELL_SIZE);
  explosion.scene.ensureEnemyGrid = () => new Map([
    [cellX * ENEMY_GRID_STRIDE + cellY, [sourceEnemy, splashA, splashB]]
  ]);
  explosion.scene.spawnExplosionEffect = () => {};
  combat.applyBreacherExplosion.call(explosion.scene, 100, 100, sourceEnemy, 10);
  assert.equal(explosion.snapshots.hit.length, 2, "each real splash target notifies once");

  const teslaA = createEnemy({ x: 100, y: 0, health: 20 });
  const teslaB = createEnemy({ x: 200, y: 0, health: 20 });
  const tesla = createScene(teslaA, "real");
  Object.assign(tesla.scene, { damageEnemy: combat.damageEnemy });
  tesla.scene.playerFacingAngle = 0;
  tesla.scene.findNearestEnemy = (_range, _x, _y, excluded) =>
    [teslaA, teslaB].find((enemy) => !excluded?.has(enemy)) ?? null;
  tesla.scene.spawnLightningSegment = () => {};
  tesla.scene.emitAttackPresentation = () => {};
  const attackWithTesla = await loadWeaponMethod("attackWithTesla");
  assert.equal(attackWithTesla.call(tesla.scene, {
    range: 400, damage: 4, chainTargets: 2, chainSearchRadius: 200
  }), true);
  assert.equal(tesla.snapshots.hit.length, 2, "each real Tesla chain damage notifies once");

  const biomass = createEnemy({
    health: 1,
    isElite: true,
    eliteType: "biomass",
    enemyType: "biomass",
    canSplit: true,
    xpReward: 5
  });
  const biomassRun = createScene(biomass, "real");
  Object.assign(biomassRun.scene, combat);
  biomassRun.scene.dropExperienceGem = () => {};
  biomassRun.scene.showEliteNeutralizedText = () => {};
  biomassRun.scene.spawnBiomassChild = () => { biomassRun.scene.splitCount += 1; };
  biomassRun.scene.spawnCombatStim = () => {};
  combat.damageEnemy.call(biomassRun.scene, biomass, 2, biomass.x, biomass.y);
  assert.equal(biomassRun.scene.splitCount, BALANCE.enemy.elite.types.biomass.childCount);
  assert.equal(biomassRun.snapshots.hitState[0].splits, BALANCE.enemy.elite.types.biomass.childCount);
  assert.equal(biomassRun.snapshots.hit.length, 1);
  assert.equal(biomassRun.snapshots.death.length, 1);
});

test("direct death effect keeps legacy particles by default and explicitly defers only controller-routed particles", async () => {
  const playEnemyDeathEffect = await loadEffectsMethod("playEnemyDeathEffect");
  let particles = 0;
  const scene = {
    clearEliteWarning() {},
    spawnDeathParticles() { particles += 1; },
    tweens: { add() {} }
  };
  function enemy() {
    return {
      active: true, x: 1, y: 2, enemyColor: 0x123456,
      body: { enable: true }, setVelocity() {}, destroy() {}
    };
  }
  playEnemyDeathEffect.call(scene, enemy());
  playEnemyDeathEffect.call(scene, enemy(), { spawnParticles: false });
  assert.equal(particles, 1);
});
