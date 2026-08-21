import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

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

function createPhaserStub() {
  return {
    Math: {
      Angle: { Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) },
      DegToRad: (degrees) => (degrees * Math.PI) / 180,
      Distance: { Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) }
    }
  };
}

async function loadWeaponMethods(...names) {
  const source = await readFile(new URL("../src/scene/weapons.js", import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  const helper = source.slice(source.indexOf("function getClosestPresentationAngle"));
  return new Function(
    "Phaser",
    "BALANCE",
    "ENEMY_GRID_CELL_SIZE",
    "ENEMY_GRID_STRIDE",
    `"use strict"; ${helper} return ({${methods}});`
  )(
    createPhaserStub(),
    {
      upgrades: { projectileSpreadDeg: 8 },
      combat: { maxProjectiles: 8 },
      weapons: { tesla: { chainDamageFalloff: 0.8 } },
      weaponUpgrades: {
        teslaFieldTickMs: 500,
        teslaFieldRadius: 100,
        teslaFieldDamageMultiplier: 0.5
      }
    },
    50,
    1_000
  );
}

async function loadEffectsMethods(...names) {
  const source = await readFile(new URL("../src/scene/effects.js", import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  return new Function("BALANCE", `"use strict"; return ({${methods}});`)({});
}

function createController(mode, events, snapshots) {
  if (mode === "missing") return undefined;
  return {
    notifyAttack(snapshot) {
      events.push("notify");
      snapshots.push(structuredClone(snapshot));
      if (mode === "throw") throw new Error("presentation failed");
      return mode === "real";
    },
    notifyTeslaChannel(snapshot) {
      events.push("notify");
      snapshots.push(structuredClone(snapshot));
      if (mode === "throw") throw new Error("presentation failed");
      return mode === "real";
    }
  };
}

function assertSnapshot(snapshot, expected) {
  assert.deepEqual(Object.keys(snapshot).sort(), ["angle", "heavy", "originX", "originY", "shotCount", "weaponId"]);
  assert.deepEqual(snapshot, expected);
}

function assertCommittedBeforeNotification(events, committedEvent) {
  const notifyIndex = events.indexOf("notify");
  assert.ok(notifyIndex >= 0, "an actual committed attack must notify exactly once");
  assert.ok(events.lastIndexOf(committedEvent) < notifyIndex, `${committedEvent} must commit before notifyAttack`);
}

function createProjectileScene({ mode, emitAttackPresentation, presentationAngles = [0.35, 0.05, -0.25] } = {}) {
  const events = [];
  const snapshots = [];
  const bullets = [];
  const muzzleDirections = [];
  const scene = {
    player: { x: 100, y: 100 },
    playerFacingAngle: Math.PI,
    projectileCount: presentationAngles.length,
    bulletPenetration: 2,
    elapsedSurvivalMs: 1_000,
    bossPhaseActive: false,
    combatFeedback: createController(mode, events, snapshots),
    findNearestEnemy: () => ({ x: 200, y: 100, active: true }),
    playSound() { events.push("sound"); },
    spawnMuzzleFlash(direction) { events.push("muzzle"); muzzleDirections.push(direction); },
    emitAttackPresentation(snapshot, fallbackDirection) {
      return emitAttackPresentation.call(this, snapshot, fallbackDirection);
    },
    spawnPlayerProjectile(payload) {
      events.push("bullet");
      bullets.push(structuredClone(payload));
      const presentationAngle = presentationAngles[bullets.length - 1];
      return presentationAngle === null ? null : { presentationAngle };
    }
  };
  return { scene, events, snapshots, bullets, muzzleDirections };
}

test("presentation routing suppresses or retains exactly one legacy muzzle without leaking callback failures", async () => {
  const { emitAttackPresentation } = await loadEffectsMethods("emitAttackPresentation");
  assert.equal(typeof emitAttackPresentation, "function");
  const snapshot = { weaponId: "pistol", originX: 10, originY: 20, angle: 0.5, shotCount: 1, heavy: false };

  for (const [mode, expectedMuzzles] of [["real", 0], ["noop", 1], ["missing", 1], ["throw", 1]]) {
    const events = [];
    const scene = {
      combatFeedback: createController(mode, events, []),
      spawnMuzzleFlash() { events.push("muzzle"); }
    };
    assert.doesNotThrow(() => emitAttackPresentation.call(scene, snapshot, 0.5));
    assert.equal(events.filter((event) => event === "muzzle").length, expectedMuzzles, `${mode} must preserve the correct legacy muzzle count`);
  }

  const teslaEvents = [];
  emitAttackPresentation.call({
    combatFeedback: createController("noop", teslaEvents, []),
    spawnMuzzleFlash() { teslaEvents.push("muzzle"); }
  }, { ...snapshot, weaponId: "tesla", heavy: true }, undefined);
  assert.deepEqual(teslaEvents, ["notify"], "Tesla routes never create a duplicate legacy muzzle");
});

test("Tesla channel presentation bridge fails closed without mutating its snapshot", async () => {
  const { emitTeslaChannelPresentation } = await loadEffectsMethods("emitTeslaChannelPresentation");
  const snapshot = Object.freeze({
    phase: "sustain",
    weaponId: "tesla",
    angle: 0.25,
    segments: Object.freeze([
      Object.freeze({ x1: 12, y1: 18, x2: 80, y2: 44 })
    ])
  });
  const before = structuredClone(snapshot);
  const received = [];

  assert.equal(emitTeslaChannelPresentation.call({
    combatFeedback: {
      notifyTeslaChannel(payload) {
        received.push(payload);
        return true;
      }
    }
  }, snapshot), true);
  assert.equal(received[0], snapshot, "the bridge forwards the immutable coordinate snapshot without rewriting it");

  assert.equal(emitTeslaChannelPresentation.call({}, snapshot), false);
  assert.equal(emitTeslaChannelPresentation.call({
    combatFeedback: {
      notifyTeslaChannel() {
        throw new Error("visual channel failed");
      }
    }
  }, snapshot), false);
  assert.deepEqual(snapshot, before);
});

test("visual-origin resolver returns a frozen action-point copy and falls back without mutating inputs or Scene", async () => {
  const { resolvePlayerAttackVisualOrigin } = await loadEffectsMethods("resolvePlayerAttackVisualOrigin");
  const payload = { weaponId: "tesla", angle: 0.5, originX: 100, originY: 120 };
  const before = structuredClone(payload);
  const queries = [];
  const validScene = {
    playerPresentation: {
      getAttackEffectOrigin(query) {
        queries.push(structuredClone(query));
        return { x: 137, y: 91, vfxType: "tesla" };
      }
    }
  };
  const resolved = resolvePlayerAttackVisualOrigin.call(validScene, payload);
  assert.deepEqual(resolved, { x: 137, y: 91 });
  assert.equal(Object.isFrozen(resolved), true);
  assert.deepEqual(queries, [{ weaponId: "tesla", angle: 0.5 }]);
  assert.deepEqual(payload, before);
  assert.equal(Object.hasOwn(validScene, "originX"), false);
  assert.equal(Object.hasOwn(validScene, "originY"), false);

  const fallbackModes = [
    ["missing", {}],
    ["false", { playerPresentation: { getAttackEffectOrigin: () => false } }],
    ["throw", { playerPresentation: { getAttackEffectOrigin() { throw new Error("query failed"); } } }],
    ["invalid-x", { playerPresentation: { getAttackEffectOrigin: () => ({ x: Infinity, y: 91 }) } }],
    ["invalid-y", { playerPresentation: { getAttackEffectOrigin: () => ({ x: 137, y: Number.NaN }) } }]
  ];
  for (const [mode, scene] of fallbackModes) {
    assert.deepEqual(
      resolvePlayerAttackVisualOrigin.call(scene, payload),
      { x: 100, y: 120 },
      `${mode} returns the exact caller-provided gameplay center`
    );
  }
  assert.deepEqual(payload, before, "all fallback routes keep the payload immutable");
});

test("pistol and breacher notify once after successful projectile commitments and keep mechanics equivalent across presentation outcomes", async () => {
  const { attackWithPistol, attackWithShotgun } = await loadWeaponMethods("attackWithPistol", "attackWithShotgun");
  const { emitAttackPresentation } = await loadEffectsMethods("emitAttackPresentation");
  const pistolRuns = [];
  const shotgunRuns = [];

  for (const mode of ["real", "noop", "missing", "throw"]) {
    const pistol = createProjectileScene({ mode, emitAttackPresentation });
    assert.equal(attackWithPistol.call(pistol.scene, { range: 300, damage: 4, projectileSpeed: 200 }), true);
    pistolRuns.push({
      mode,
      bullets: pistol.bullets,
      facing: pistol.scene.playerFacingAngle,
      muzzleCount: pistol.muzzleDirections.length,
      events: pistol.events,
      snapshots: pistol.snapshots
    });

    const shotgun = createProjectileScene({ mode, emitAttackPresentation, presentationAngles: [-0.3, 0.12, 0.4] });
    shotgun.scene.projectileCount = 99;
    const weapon = {
      isReloading: false,
      currentShells: 1,
      triggerRange: 120,
      range: 300,
      nextShotId: 7,
      pelletCount: 3,
      spreadDeg: 20,
      damage: 8,
      projectileSpeed: 220,
      reloadDurationMs: 900,
      nextAttackAtMs: 0
    };
    assert.equal(attackWithShotgun.call(shotgun.scene, weapon), true);
    shotgunRuns.push({
      mode,
      bullets: shotgun.bullets,
      facing: shotgun.scene.playerFacingAngle,
      muzzleCount: shotgun.muzzleDirections.length,
      events: shotgun.events,
      snapshots: shotgun.snapshots,
      ammo: weapon.currentShells,
      reloading: weapon.isReloading,
      reloadEndAtMs: weapon.reloadEndAtMs,
      nextAttackAtMs: weapon.nextAttackAtMs,
      nextShotId: weapon.nextShotId
    });
  }

  const realPistol = pistolRuns[0];
  assert.equal(realPistol.snapshots.length, 1);
  assertSnapshot(realPistol.snapshots[0], {
    weaponId: "pistol", originX: 100, originY: 100, angle: 0.05, shotCount: 3, heavy: false
  });
  assertCommittedBeforeNotification(realPistol.events, "bullet");
  assert.equal(realPistol.muzzleCount, 0);
  assert.equal(realPistol.facing, Math.PI, "attacks never rotate the player");
  for (const run of pistolRuns.slice(1)) {
    assert.deepEqual(run.bullets, realPistol.bullets, `${run.mode} must not alter pistol projectile commitment`);
    assert.equal(run.facing, realPistol.facing, `${run.mode} must not alter pistol facing`);
    assert.equal(run.muzzleCount, 1, `${run.mode} must retain exactly one legacy pistol muzzle`);
    if (run.mode !== "missing") assertCommittedBeforeNotification(run.events, "bullet");
  }

  const realShotgun = shotgunRuns[0];
  assert.equal(realShotgun.snapshots.length, 1);
  assertSnapshot(realShotgun.snapshots[0], {
    weaponId: "shotgun", originX: 100, originY: 100, angle: 0.12, shotCount: 3, heavy: true
  });
  assertCommittedBeforeNotification(realShotgun.events, "bullet");
  assert.equal(realShotgun.muzzleCount, 0);
  assert.equal(realShotgun.facing, Math.PI, "attacks never rotate the player");
  for (const run of shotgunRuns.slice(1)) {
    assert.deepEqual(run.bullets, realShotgun.bullets, `${run.mode} must not alter shotgun pellets`);
    assert.deepEqual(
      [run.facing, run.ammo, run.reloading, run.reloadEndAtMs, run.nextAttackAtMs, run.nextShotId],
      [realShotgun.facing, realShotgun.ammo, realShotgun.reloading, realShotgun.reloadEndAtMs, realShotgun.nextAttackAtMs, realShotgun.nextShotId],
      `${run.mode} must not alter shotgun ammo or reload commitment`
    );
    assert.equal(run.muzzleCount, 1, `${run.mode} must retain exactly one legacy breacher muzzle`);
    if (run.mode !== "missing") assertCommittedBeforeNotification(run.events, "bullet");
  }
});

test("Tesla channel start notifies after committed damage without changing damage or facing", async () => {
  const methods = await loadWeaponMethods(
    "isTeslaChannelTargetValid",
    "resolveTeslaChannelTargets",
    "createTeslaChannelSnapshot",
    "stopTeslaChannel",
    "updateTeslaChannel",
    "attackWithTesla"
  );
  const { emitTeslaChannelPresentation, resolvePlayerAttackVisualOrigin } = await loadEffectsMethods(
    "emitTeslaChannelPresentation",
    "resolvePlayerAttackVisualOrigin"
  );
  const runs = [];
  for (const mode of ["real", "noop", "missing", "throw"]) {
    const events = [];
    const snapshots = [];
    const damage = [];
    const candidates = [
      { x: 200, y: 100, active: true },
      { x: 200, y: 200, active: true }
    ];
    const scene = {
      player: { x: 100, y: 100 },
      playerFacingAngle: Math.PI,
      elapsedSurvivalMs: 1_000,
      bossPhaseActive: false,
      combatFeedback: createController(mode, events, snapshots),
      playerPresentation: {
        getAttackEffectOrigin() {
          events.push("origin");
          return { x: 132, y: 92, vfxType: "tesla" };
        }
      },
      emitTeslaChannelPresentation(snapshot) {
        return emitTeslaChannelPresentation.call(this, snapshot);
      },
      resolvePlayerAttackVisualOrigin(payload) {
        return resolvePlayerAttackVisualOrigin.call(this, payload);
      },
      findNearestEnemy(range, x, y, ignored) {
        return candidates.find((candidate) => !ignored?.has(candidate)) ?? null;
      },
      playSound() {},
      damageEnemy(enemy, amount, impactX, impactY, sourceX, sourceY, metadata) {
        events.push("damage");
        damage.push({
          target: [enemy.x, enemy.y],
          amount,
          impact: [impactX, impactY],
          source: [sourceX, sourceY],
          metadata: structuredClone(metadata)
        });
      }
    };
    Object.assign(scene, methods);
    const weapon = {
      range: 300,
      damage: 10,
      chainTargets: 2,
      chainSearchRadius: 150,
      cooldownMs: 300,
      nextAttackAtMs: 0,
      channelTarget: null,
      channelTargets: [],
      isChanneling: false
    };
    assert.equal(methods.updateTeslaChannel.call(scene, weapon), true);
    runs.push({ mode, events, snapshots, damage, facing: scene.playerFacingAngle });
  }

  const real = runs[0];
  assert.deepEqual(
    real.events,
    ["damage", "damage", "origin", "notify"],
    "the persistent visual channel is emitted only after the first damage tick commits"
  );
  assert.deepEqual(real.damage, [
    {
      target: [200, 100], amount: 10, impact: [200, 100], source: [100, 100],
      metadata: { sourceWeaponId: "tesla", sourceDistance: 100, suppressHitSound: true }
    },
    {
      target: [200, 200], amount: 8, impact: [200, 200], source: [200, 100],
      metadata: { sourceWeaponId: "tesla", sourceDistance: 100, suppressHitSound: true }
    }
  ], "damage geometry remains rooted at gameplay currentOrigin rather than the action point");
  assertCommittedBeforeNotification(real.events, "damage");
  assert.deepEqual(real.snapshots[0], {
    phase: "start",
    weaponId: "tesla",
    angle: 0,
    visualPhase: 20,
    segments: [
      { x1: 132, y1: 92, x2: 200, y2: 100 },
      { x1: 200, y1: 100, x2: 200, y2: 200 }
    ]
  });
  assert.equal(real.facing, Math.PI, "attacks never rotate the player");
  for (const run of runs.slice(1)) {
    assert.deepEqual(run.damage, real.damage, `${run.mode} must not alter Tesla damage count or falloff`);
    assert.equal(run.facing, real.facing, `${run.mode} must not alter Tesla facing`);
    if (run.mode !== "missing") assertCommittedBeforeNotification(run.events, "damage");
  }
});

test("Tesla Boss overcharge renders one channel but keeps every repeated damage field center-authored", async () => {
  const methods = await loadWeaponMethods(
    "isTeslaChannelTargetValid",
    "resolveTeslaChannelTargets",
    "createTeslaChannelSnapshot",
    "stopTeslaChannel",
    "updateTeslaChannel",
    "attackWithTesla"
  );
  const { emitTeslaChannelPresentation, resolvePlayerAttackVisualOrigin } = await loadEffectsMethods(
    "emitTeslaChannelPresentation",
    "resolvePlayerAttackVisualOrigin"
  );
  const boss = { x: 220, y: 100, active: true, isBoss: true };
  const snapshots = [];
  const damage = [];
  const scene = {
    player: { x: 100, y: 100 },
    bossPhaseActive: true,
    elapsedSurvivalMs: 1_000,
    combatFeedback: createController("real", [], snapshots),
    playerPresentation: {
      getAttackEffectOrigin: () => ({ x: 134, y: 90, vfxType: "tesla" })
    },
    findNearestEnemy: () => boss,
    resolvePlayerAttackVisualOrigin(payload) {
      return resolvePlayerAttackVisualOrigin.call(this, payload);
    },
    emitTeslaChannelPresentation(snapshot) {
      return emitTeslaChannelPresentation.call(this, snapshot);
    },
    playSound() {},
    damageEnemy(enemy, amount, impactX, impactY, sourceX, sourceY, metadata) {
      damage.push({ amount, source: [sourceX, sourceY], sourceDistance: metadata.sourceDistance });
    }
  };
  Object.assign(scene, methods);

  assert.equal(methods.updateTeslaChannel.call(scene, {
    range: 300,
    damage: 10,
    chainTargets: 3,
    chainSearchRadius: 150,
    cooldownMs: 300,
    nextAttackAtMs: 0,
    channelTarget: null,
    channelTargets: [],
    isChanneling: false
  }), true);
  assert.deepEqual(snapshots[0].segments, [{ x1: 134, y1: 90, x2: 220, y2: 100 }]);
  assert.deepEqual(damage, [
    { amount: 10, source: [100, 100], sourceDistance: 120 },
    { amount: 8, source: [220, 100], sourceDistance: 0 },
    { amount: 6.4, source: [220, 100], sourceDistance: 0 }
  ]);
});

test("Tesla-field mutation notifies only after real hits and preserves pulse timing for zero-hit ticks", async () => {
  const { updateTeslaField } = await loadWeaponMethods("updateTeslaField");
  const { emitAttackPresentation } = await loadEffectsMethods("emitAttackPresentation");
  const runs = [];
  for (const mode of ["real", "noop", "missing", "throw"]) {
    const events = [];
    const snapshots = [];
    const damage = [];
    const grid = new Map([[2_002, [
      { x: 140, y: 100, active: true, isDying: false },
      { x: 160, y: 100, active: true, isDying: false }
    ]]]);
    const scene = {
      elapsedSurvivalMs: 1_000,
      teslaFieldNextTickAtMs: 0,
      player: { x: 100, y: 100 },
      weapons: { tesla: { damage: 10 } },
      combatFeedback: createController(mode, events, snapshots),
      ensureEnemyGrid: () => grid,
      damageEnemy(enemy, amount) { events.push("damage"); damage.push([enemy.x, enemy.y, amount]); },
      spawnTeslaFieldPulse() { events.push("pulse"); },
      spawnMuzzleFlash() { events.push("muzzle"); },
      emitAttackPresentation(snapshot, fallbackDirection) {
        return emitAttackPresentation.call(this, snapshot, fallbackDirection);
      }
    };
    updateTeslaField.call(scene);
    runs.push({ mode, events, snapshots, damage, nextTick: scene.teslaFieldNextTickAtMs });
  }

  const real = runs[0];
  assert.deepEqual(real.damage, [[140, 100, 5], [160, 100, 5]]);
  assertCommittedBeforeNotification(real.events, "pulse");
  assertSnapshot(real.snapshots[0], {
    weaponId: "tesla-field", originX: 100, originY: 100, angle: 0, shotCount: 2, heavy: true
  });
  assert.equal(real.nextTick, 1_500);
  assert.equal(real.events.filter((event) => event === "muzzle").length, 0);
  for (const run of runs.slice(1)) {
    assert.deepEqual(run.damage, real.damage, `${run.mode} must not alter mutation damage`);
    assert.equal(run.nextTick, real.nextTick, `${run.mode} must not alter mutation timing`);
    assert.equal(run.events.filter((event) => event === "pulse").length, 1, `${run.mode} must preserve the field pulse`);
    assert.equal(run.events.filter((event) => event === "muzzle").length, 0, `${run.mode} must not add a field muzzle`);
    if (run.mode !== "missing") assertCommittedBeforeNotification(run.events, "pulse");
  }

  const zeroEvents = [];
  const zeroSnapshots = [];
  const zeroHitScene = {
    elapsedSurvivalMs: 1_000,
    teslaFieldNextTickAtMs: 0,
    player: { x: 100, y: 100 },
    weapons: { tesla: { damage: 10 } },
    combatFeedback: createController("real", zeroEvents, zeroSnapshots),
    ensureEnemyGrid: () => new Map(),
    damageEnemy() { zeroEvents.push("damage"); },
    spawnTeslaFieldPulse() { zeroEvents.push("pulse"); },
    spawnMuzzleFlash() { zeroEvents.push("muzzle"); },
    emitAttackPresentation(snapshot, fallbackDirection) {
      return emitAttackPresentation.call(this, snapshot, fallbackDirection);
    }
  };
  updateTeslaField.call(zeroHitScene);
  assert.deepEqual(zeroEvents, ["pulse"], "zero-hit field ticks keep their existing pulse without notifying");
  assert.deepEqual(zeroSnapshots, []);
});

test("isolated weapon seams remain safe when the effects mixin is not installed", async () => {
  const { attackWithPistol, attackWithTesla } = await loadWeaponMethods("attackWithPistol", "attackWithTesla");
  const pistol = createProjectileScene({ mode: "missing", emitAttackPresentation() {} });
  delete pistol.scene.emitAttackPresentation;
  assert.doesNotThrow(() => {
    attackWithPistol.call(pistol.scene, { range: 300, damage: 4, projectileSpeed: 200 });
  });
  assert.equal(pistol.scene.playerFacingAngle, Math.PI, "attacks never rotate the player");

  const tesla = {
    player: { x: 100, y: 100 },
    playerFacingAngle: Math.PI,
    bossPhaseActive: false,
    findNearestEnemy: () => ({ x: 100, y: 200, active: true }),
    playSound() {},
    damageEnemy() {}
  };
  const target = tesla.findNearestEnemy();
  assert.doesNotThrow(() => {
    attackWithTesla.call(
      tesla,
      { range: 300, damage: 9, chainTargets: 1, chainSearchRadius: 80 },
      [target]
    );
  });
  assert.equal(tesla.playerFacingAngle, Math.PI, "tesla never rotates the player");
});

test("cooldown, no target, zero allocation, pause, and game-over paths notify zero times", async () => {
  const { attackWithPistol, updateWeapons } = await loadWeaponMethods("attackWithPistol", "updateWeapons");
  const { emitAttackPresentation } = await loadEffectsMethods("emitAttackPresentation");
  const noTarget = createProjectileScene({ mode: "real", emitAttackPresentation });
  noTarget.scene.findNearestEnemy = () => null;
  assert.equal(attackWithPistol.call(noTarget.scene, { range: 300, damage: 4, projectileSpeed: 200 }), false);
  assert.deepEqual(noTarget.snapshots, []);
  assert.equal(noTarget.muzzleDirections.length, 0);

  const zeroAllocation = createProjectileScene({ mode: "real", emitAttackPresentation });
  zeroAllocation.scene.spawnPlayerProjectile = () => null;
  assert.equal(attackWithPistol.call(zeroAllocation.scene, { range: 300, damage: 4, projectileSpeed: 200 }), true);
  assert.deepEqual(zeroAllocation.snapshots, []);
  assert.equal(zeroAllocation.muzzleDirections.length, 0);

  let attacks = 0;
  const cooldownWeapon = { id: "pistol", unlocked: true, nextAttackAtMs: 1_100, cooldownMs: 500 };
  updateWeapons.call({
    weapons: { pistol: cooldownWeapon, tesla: { unlocked: false } },
    weaponMutations: { teslaField: false },
    elapsedSurvivalMs: 1_000,
    attackWithPistol() { attacks += 1; return true; }
  });
  assert.equal(attacks, 0, "cooldown must prevent the attack route and its notification");

  const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const update = main.slice(main.indexOf("  update(_, delta)"), main.indexOf("  // Dispose manager-owned"));
  assert.match(update, /if \(this\.isGameOver\) \{\s*return;/, "game-over must return before weapon updates");
  assert.match(update, /if \(this\.isPaused\) \{\s*return;/, "pause must return before weapon updates");
  assert.ok(update.indexOf("this.updateWeapons()") > update.indexOf("if (this.isPaused)"), "weapon updates remain after pause protection");
});
