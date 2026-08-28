import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createEnemyPresentationController } from "../src/art/enemyPresentationController.js";
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
    commitEnemyDeathActor(target) {
      events.push("commitActor");
      target.isDying = true;
      target.body.enable = false;
      target.setVelocity?.(0, 0);
    },
    createEnemyPresentationSnapshot(target, { lethal }) {
      return Object.freeze({
        presentationId: target._presentationId ?? 0,
        enemyType: target.enemyType ?? "unknown",
        eliteType: target.eliteType ?? null,
        isBoss: target.isBoss === true,
        canSplit: target.canSplit === true,
        x: target.x,
        y: target.y,
        frame: target.frame?.name ?? 0,
        flipX: target.flipX === true,
        alpha: target.alpha ?? 1,
        depth: target.depth ?? 10,
        scaleX: target.scaleX ?? 1,
        scaleY: target.scaleY ?? 1,
        lethal,
        atMs: this.elapsedSurvivalMs ?? 0
      });
    },
    playLegacyEnemyDeathVisual() { events.push("legacyActorDeath"); },
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

test("continuous Tesla ticks can suppress per-target hit audio without suppressing damage feedback", async () => {
  const damageEnemy = await loadDamageEnemy();
  const enemy = createEnemy();
  const { scene, events, snapshots } = createScene(enemy, "real");

  damageEnemy.call(scene, enemy, 3, 118, 178, 0, 0, {
    sourceWeaponId: "tesla",
    suppressHitSound: true
  });

  assert.equal(enemy.health, 7);
  assert.equal(events.filter((event) => event === "sound").length, 0);
  assert.equal(events.filter((event) => event === "damageNumber").length, 1);
  assert.equal(snapshots.hit.length, 1);
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

test("real Boss defeat delivers terminal death and existing hit/death before the 210ms victory timer", async () => {
  const [damageEnemy, handleBossDefeat] = await Promise.all([
    loadDamageEnemy(),
    loadEnemyMethod("handleBossDefeat")
  ]);
  const boss = createEnemy({
    health: 1,
    isBoss: true,
    enemyType: "scp049",
    bossState: "normal",
    _presentationId: 41,
    frame: { name: 4 },
    flipX: false,
    alpha: 1,
    depth: 12,
    scaleX: 1,
    scaleY: 1,
    body: {
      enable: true,
      velocity: { x: 2, y: 3 },
      setVelocity(x, y) { this.velocity.x = x; this.velocity.y = y; }
    }
  });
  const { scene, events, snapshots } = createScene(boss, "real");
  scene.handleBossDefeat = handleBossDefeat;
  scene.clearFrenzyTint = () => {};
  scene.showTopBanner = () => { events.push("banner"); };
  const terminalSnapshots = [];
  scene.enemyPresentation = {
    notifyDeath(snapshot) {
      events.push("enemyDeath");
      terminalSnapshots.push(snapshot);
      assert.equal(boss.isDying, true);
      assert.equal(boss.bossState, "dying");
      assert.equal(scene.killCount, 1);
      assert.equal(scene.bossPhaseActive, false);
      assert.equal(boss.body.enable, false);
    }
  };
  scene.victoryTimers = 0;
  scene.isGameOver = false;
  scene.time = {
    delayedCall(delay, callback) {
      events.push("timer");
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
  assert.equal(terminalSnapshots.length, 1);
  assert.equal(Object.isFrozen(terminalSnapshots[0]), true);
  assert.equal(snapshots.hitState[0].bossState, "dying");
  assert.equal(snapshots.hitState[0].bossPhaseActive, false);
  assert.equal(snapshots.hitState[0].victoryTimers, 0);
  assert.equal(snapshots.deathState[0].kills, 1);
  assert.equal(scene.victoryDelay, BALANCE.feedback.deathShrinkMs + 120);
  assert.equal(scene.victoryDelay, 210);
  assert.ok(events.indexOf("banner") < events.indexOf("enemyDeath"));
  assert.ok(events.indexOf("enemyDeath") < events.indexOf("notifyHit"));
  assert.ok(events.indexOf("notifyDeath") < events.indexOf("timer"));
});

// Break caught: throwing legacy feedback fallbacks escape the post-commit callback and cancel victory scheduling.
test("Boss fallback failures still register one deathShrink plus 120 timer and one victory", async () => {
  const [damageEnemy, handleBossDefeat] = await Promise.all([
    loadDamageEnemy(),
    loadEnemyMethod("handleBossDefeat")
  ]);
  const boss = createEnemy({
    health: 1,
    isBoss: true,
    enemyType: "scp049",
    bossState: "normal",
    _presentationId: 51,
    body: {
      enable: true,
      velocity: { x: 2, y: 3 },
      setVelocity(x, y) { this.velocity.x = x; this.velocity.y = y; }
    }
  });
  const { scene } = createScene(boss, "noop");
  const timers = [];
  let impactFallbacks = 0;
  let deathFallbacks = 0;
  let victories = 0;
  scene.handleBossDefeat = handleBossDefeat;
  scene.clearFrenzyTint = () => {};
  scene.showTopBanner = () => {};
  scene.enemyPresentation = { notifyDeath() {} };
  scene.spawnImpactEffect = () => {
    impactFallbacks += 1;
    throw new Error("impact fallback failed");
  };
  scene.spawnDeathParticles = () => {
    deathFallbacks += 1;
    throw new Error("death fallback failed");
  };
  scene.time = {
    delayedCall(delay, callback) {
      timers.push({ delay, callback });
      return {};
    }
  };
  scene.isGameOver = false;
  scene.triggerVictory = () => { victories += 1; };

  assert.doesNotThrow(() => damageEnemy.call(scene, boss, 2, boss.x, boss.y, 0, 0));
  assert.equal(impactFallbacks, 1);
  assert.equal(deathFallbacks, 1);
  assert.equal(timers.length, 1);
  assert.equal(timers[0].delay, BALANCE.feedback.deathShrinkMs + 120);
  timers[0].callback();
  assert.equal(victories, 1);
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
  }, [teslaA, teslaB]), true);
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

test("player damage commits health and invulnerability before notifying visible hit feedback", async () => {
  const combat = await loadCombatMethods("applyPlayerDamage", "triggerPlayerDamageFeedback");

  for (const mode of ["real", "false", "missing", "throw"]) {
    const events = [];
    const notifications = [];
    const delayed = [];
    const player = {
      active: true,
      x: 20,
      y: 30,
      tintCalls: 0,
      clearTintCalls: 0,
      setTint() {
        this.tintCalls += 1;
        events.push("anchorTint");
      },
      clearTint() {
        this.clearTintCalls += 1;
        events.push("anchorClearTint");
      }
    };
    const scene = {
      player,
      elapsedSurvivalMs: 1_000,
      playerInvulnerableUntilMs: 0,
      health: 10,
      cameras: { main: { shake() { events.push("shake"); } } },
      time: {
        delayedCall(delay, callback) {
          delayed.push({ delay, callback });
          return {};
        }
      },
      playSound() { events.push("sound"); },
      updateUI() { events.push("ui"); },
      triggerGameOver() { events.push("gameOver"); }
    };
    if (mode !== "missing") {
      scene.playerPresentation = {
        notifyHit(snapshot) {
          notifications.push({
            snapshot: structuredClone(snapshot),
            health: scene.health,
            invulnerableUntilMs: scene.playerInvulnerableUntilMs
          });
          events.push("visibleHit");
          if (mode === "throw") throw new Error("visible hit failed");
          return mode === "real";
        }
      };
    }
    Object.assign(scene, combat);

    assert.doesNotThrow(() => scene.applyPlayerDamage(3, 200, 300));
    assert.equal(scene.health, 7, `${mode} preserves player damage`);
    assert.equal(
      scene.playerInvulnerableUntilMs,
      1_000 + BALANCE.player.damageCooldownMs,
      `${mode} preserves damage cooldown`
    );
    assert.equal(events.includes("gameOver"), false);
    if (mode !== "missing") {
      assert.deepEqual(notifications, [{
        snapshot: {
          atMs: 1_000,
          durationMs: BALANCE.feedback.playerDamageTintMs,
          tint: 0xff6666
        },
        health: 7,
        invulnerableUntilMs: 1_000 + BALANCE.player.damageCooldownMs
      }]);
    }

    const expectedFallback = mode === "real" ? 0 : 1;
    assert.equal(player.tintCalls, expectedFallback, `${mode} anchor tint fallback count`);
    assert.equal(delayed.length, expectedFallback, `${mode} anchor tint cleanup count`);
    if (delayed[0]) {
      delayed[0].callback();
      assert.equal(player.clearTintCalls, 1, `${mode} clears only its fallback tint`);
    }
  }
});

test("invulnerability blinking uses visible alpha and falls back to the anchor per call", async () => {
  const updatePlayerInvulnerabilityVisual = await loadEffectsMethod(
    "updatePlayerInvulnerabilityVisual"
  );

  for (const mode of ["real", "false", "missing", "throw"]) {
    const visibleAlphas = [];
    const anchorAlphas = [];
    const scene = {
      elapsedSurvivalMs: 100,
      playerInvulnerableUntilMs: 200,
      player: {
        active: true,
        setAlpha(alpha) {
          anchorAlphas.push(alpha);
        }
      }
    };
    if (mode !== "missing") {
      scene.playerPresentation = {
        setAlpha(alpha) {
          visibleAlphas.push(alpha);
          if (mode === "throw") throw new Error("visible alpha failed");
          return mode === "real";
        }
      };
    }

    assert.doesNotThrow(() => updatePlayerInvulnerabilityVisual.call(scene));
    assert.deepEqual(visibleAlphas, mode === "missing" ? [] : [0.35]);
    assert.deepEqual(anchorAlphas, mode === "real" ? [] : [0.35]);
  }
});

test("death actor commitment is gameplay-only while the legacy visual keeps its particle default", async () => {
  const commitEnemyDeathActor = await loadEffectsMethod("commitEnemyDeathActor");
  const playLegacyEnemyDeathVisual = await loadEffectsMethod("playLegacyEnemyDeathVisual");
  let particles = 0;
  let tweenCalls = 0;
  const scene = {
    clearEliteWarning() {},
    spawnDeathParticles() { particles += 1; },
    tweens: { add() { tweenCalls += 1; } }
  };
  function enemy() {
    return {
      active: true, x: 1, y: 2, enemyColor: 0x123456,
      body: { enable: true, velocity: { x: 4, y: -3 } },
      setVelocity(x, y) { this.body.velocity.x = x; this.body.velocity.y = y; },
      destroy() {}
    };
  }
  const committed = enemy();
  commitEnemyDeathActor.call(scene, committed);
  assert.equal(committed.isDying, true);
  assert.equal(committed.body.enable, false);
  assert.deepEqual(committed.body.velocity, { x: 0, y: 0 });
  assert.equal(particles, 0);
  assert.equal(tweenCalls, 0);

  playLegacyEnemyDeathVisual.call(scene, enemy());
  playLegacyEnemyDeathVisual.call(scene, enemy(), { spawnParticles: false });
  assert.equal(particles, 1);
  assert.equal(tweenCalls, 2);
});

function task5PresentationSnapshot(scene, enemy, lethal) {
  return Object.freeze({
    presentationId: enemy._presentationId,
    enemyType: enemy.enemyType,
    eliteType: enemy.eliteType,
    isBoss: enemy.isBoss === true,
    canSplit: enemy.canSplit === true,
    x: enemy.x,
    y: enemy.y,
    frame: enemy.frame.name,
    flipX: enemy.flipX,
    alpha: enemy.alpha,
    depth: enemy.depth,
    scaleX: enemy.scaleX,
    scaleY: enemy.scaleY,
    lethal,
    atMs: scene.elapsedSurvivalMs
  });
}

function createTask5Enemy(overrides = {}) {
  const enemy = createEnemy({
    _presentationId: 17,
    canSplit: false,
    frame: { name: 6 },
    flipX: true,
    alpha: 0.85,
    depth: 12,
    scaleX: 1.2,
    scaleY: 1.1,
    body: { enable: true, velocity: { x: 8, y: -2 } },
    setVelocity(x, y) { this.body.velocity.x = x; this.body.velocity.y = y; },
    ...overrides
  });
  return enemy;
}

function createTask5DamageScene(enemy, events) {
  return {
    player: { x: 0, y: 0 },
    elapsedSurvivalMs: 4_200,
    killCount: 0,
    bossPhaseActive: enemy.isBoss === true,
    getEnemyDamageTakenMultiplier: () => 1,
    flashEnemyOnHit() { events.push("flash"); },
    spawnFloatingDamage() { events.push("number"); },
    playSound(name) { events.push(name); },
    handleEnemyDefeatRewards() { events.push("rewards"); },
    playEnemyDeathEffect(target) {
      events.push("oldDeathEffect");
      target.isDying = true;
      target.body.enable = false;
      target.setVelocity(0, 0);
    },
    commitEnemyDeathActor(target) {
      events.push("commitActor");
      target.isDying = true;
      target.body.enable = false;
      target.setVelocity(0, 0);
    },
    createEnemyPresentationSnapshot(target, { lethal }) {
      return task5PresentationSnapshot(this, target, lethal);
    },
    playLegacyEnemyDeathVisual() { events.push("legacyActorDeath"); },
    spawnImpactEffect() { events.push("legacyImpact"); },
    spawnDeathParticles() { events.push("legacyParticles"); }
  };
}

// Break caught: the new enemy hit hook runs before health/legacy feedback commits or replaces combatFeedback.
test("enemy presentation receives one frozen nonlethal snapshot after legacy hit cues and before combat feedback", async () => {
  const damageEnemy = await loadDamageEnemy();
  const enemy = createTask5Enemy();
  const events = [];
  const scene = createTask5DamageScene(enemy, events);
  let received = null;
  scene.enemyPresentation = {
    notifyHit(snapshot) {
      events.push("enemyHit");
      assert.equal(enemy.health, 7);
      received = snapshot;
    }
  };
  scene.combatFeedback = {
    notifyHit() { events.push("combatHit"); return true; }
  };

  damageEnemy.call(scene, enemy, 3, 119, 179, 0, 0);

  assert.deepEqual(events, ["flash", "number", "enemyHit", "enemyHit", "combatHit"]);
  assert.equal(Object.isFrozen(received), true);
  assert.deepEqual(Object.keys(received), [
    "presentationId", "enemyType", "eliteType", "isBoss", "canSplit", "x", "y",
    "frame", "flipX", "alpha", "depth", "scaleX", "scaleY", "lethal", "atMs"
  ]);
  assert.ok(Object.values(received).every((value) => value === null || typeof value !== "object"));
});

// Characterization: the void enemy hit channel is gameplay-neutral when absent, successful, or throwing.
test("enemy notifyHit absent normal and throwing modes preserve the same committed hit", async () => {
  const damageEnemy = await loadDamageEnemy();
  const results = [];
  for (const mode of ["absent", "normal", "throwing"]) {
    const enemy = createTask5Enemy();
    const events = [];
    const scene = createTask5DamageScene(enemy, events);
    let notifications = 0;
    if (mode !== "absent") {
      scene.enemyPresentation = {
        notifyHit(snapshot) {
          notifications += 1;
          assert.equal(snapshot.lethal, false);
          assert.equal(enemy.health, 7, "health commits before the void hit channel");
          if (mode === "throwing") throw new Error("enemy hit presentation failed");
        }
      };
    }
    scene.combatFeedback = { notifyHit() { return true; } };

    assert.doesNotThrow(() => damageEnemy.call(scene, enemy, 3, 119, 179, 0, 0));
    results.push({
      health: enemy.health,
      isDying: enemy.isDying,
      bodyEnabled: enemy.body.enable,
      killCount: scene.killCount,
      notifications
    });
  }

  assert.deepEqual(results, [
    { health: 7, isDying: false, bodyEnabled: true, killCount: 0, notifications: 0 },
    { health: 7, isDying: false, bodyEnabled: true, killCount: 0, notifications: 1 },
    { health: 7, isDying: false, bodyEnabled: true, killCount: 0, notifications: 1 }
  ]);
});

// Break caught: an untracked positive id is treated as delivered, leaving the committed actor stranded.
test("an untracked positive presentation id invalidates ownership and falls back to one legacy tween", async () => {
  const [damageEnemy, createEnemyPresentationSnapshot, commitEnemyDeathActor, playLegacyEnemyDeathVisual] = await Promise.all([
    loadDamageEnemy(),
    loadEffectsMethod("createEnemyPresentationSnapshot"),
    loadEffectsMethod("commitEnemyDeathActor"),
    loadEffectsMethod("playLegacyEnemyDeathVisual")
  ]);
  const enemy = createTask5Enemy({
    health: 1,
    destroy() { this.active = false; this.destroyed = true; }
  });
  const events = [];
  const scene = createTask5DamageScene(enemy, events);
  const tweens = [];
  scene.textures = { exists() { return false; }, get() { return { frameTotal: 0 }; } };
  scene.anims = { exists() { return false; } };
  scene.tweens = { add(config) { tweens.push(config); return config; } };
  scene.clearEliteWarning = () => {};
  scene.createEnemyPresentationSnapshot = createEnemyPresentationSnapshot;
  scene.commitEnemyDeathActor = commitEnemyDeathActor;
  scene.playLegacyEnemyDeathVisual = playLegacyEnemyDeathVisual;
  scene.combatFeedback = {
    notifyHit() { return true; },
    notifyDeath() { return true; }
  };
  const controller = createEnemyPresentationController(scene, { forceLegacy: true });
  const staleId = controller.trackActor(enemy, { enemyType: enemy.enemyType, isBoss: false });
  assert.ok(staleId > 0);
  enemy._presentationId = staleId;
  controller.untrackActor(enemy);
  scene.enemyPresentation = controller;

  assert.equal(enemy._presentationId, 0, "record removal invalidates the stale ownership id");
  assert.doesNotThrow(() => damageEnemy.call(scene, enemy, 2, enemy.x, enemy.y, 0, 0));
  assert.equal(tweens.length, 1, "legacy actor cleanup owns exactly one tween");
  assert.equal(enemy.isDying, true);
  assert.equal(enemy.body.enable, false);
  tweens[0].onComplete();
  assert.equal(enemy.active, false, "the committed actor is not stranded");
  assert.equal(enemy.destroyed, true);
});

// Break caught: rewards/kill/body state are submitted after death notification or combat feedback runs first.
test("lethal non-Boss presentation follows rewards kill and actor commitment before existing feedback", async () => {
  const damageEnemy = await loadDamageEnemy();
  const enemy = createTask5Enemy({ health: 1, enemyType: "biomass", eliteType: "biomass", canSplit: true });
  const events = [];
  const scene = createTask5DamageScene(enemy, events);
  scene.enemyPresentation = {
    notifyDeath(snapshot) {
      events.push("enemyDeath");
      assert.equal(scene.killCount, 1);
      assert.equal(enemy.isDying, true);
      assert.equal(enemy.body.enable, false);
      assert.equal(snapshot.canSplit, true);
      assert.equal(snapshot.lethal, true);
    }
  };
  scene.combatFeedback = {
    notifyHit() { events.push("combatHit"); return true; },
    notifyDeath() { events.push("combatDeath"); return true; }
  };

  damageEnemy.call(scene, enemy, 2, 120, 180, 0, 0);

  assert.deepEqual(events, [
    "flash", "number", "enemyHit", "rewards", "commitActor",
    "enemyDeath", "combatHit", "combatDeath"
  ]);
  assert.equal(scene.killCount, 1);
});

// Break caught: invulnerable overlaps emit action clips or action delivery controls contact gameplay.
test("contact actions emit once only after real player health commits and throwing delivery remains gameplay-neutral", async () => {
  const combat = await loadCombatMethods(
    "handlePlayerEnemyOverlap",
    "applyPlayerDamage"
  );
  for (const [enemyType, action] of [
    ["infectedStaff", "contact"],
    ["crawler", "pierce"],
    ["biomassChild", "snap"]
  ]) {
    const snapshots = [];
    const enemy = createTask5Enemy({ enemyType, contactDamage: 3 });
    const scene = {
      ...combat,
      player: { x: 10, y: 20 },
      elapsedSurvivalMs: 1_000,
      playerInvulnerableUntilMs: 0,
      health: 10,
      triggerPlayerDamageFeedback() {},
      updateUI() {},
      triggerGameOver() {},
      enemyPresentation: {
        notifyAction(snapshot) {
          snapshots.push(snapshot);
          throw new Error("action presentation failed");
        }
      }
    };

    assert.equal(scene.applyPlayerDamage(0), true, "accepted damage returns the presentation-only commit fact");
    scene.playerInvulnerableUntilMs = 0;
    scene.health = 10;
    assert.doesNotThrow(() => scene.handlePlayerEnemyOverlap(null, enemy));
    assert.equal(scene.health, 7);
    assert.equal(snapshots.length, 1);
    assert.equal(Object.isFrozen(snapshots[0]), true);
    assert.deepEqual(structuredClone(snapshots[0]), {
      presentationId: 17,
      action,
      atMs: 1_000
    });

    assert.equal(scene.applyPlayerDamage(1), false);
    assert.doesNotThrow(() => scene.handlePlayerEnemyOverlap(null, enemy));
    assert.equal(scene.health, 7);
    assert.equal(snapshots.length, 1, "invulnerable overlap emits no action");
  }
});
