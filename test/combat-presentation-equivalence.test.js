import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";

function extractObjectMethod(source, name) {
  const start = source.search(new RegExp(`^  ${name}\\(`, "m"));
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = source.indexOf(") {", start) + 2;
  assert.ok(bodyStart >= 2, `missing body for ${name}`);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
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
      Angle: {
        Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1)
      },
      DegToRad: (degrees) => (degrees * Math.PI) / 180,
      Distance: {
        Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)
      }
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
  )(createPhaserStub(), BALANCE, 50, 1_000);
}

async function loadEffectsMethod(name) {
  const source = await readFile(new URL("../src/scene/effects.js", import.meta.url), "utf8");
  const method = extractObjectMethod(source, name);
  return new Function("BALANCE", `"use strict"; return ({${method}}).${name};`)(BALANCE);
}

function makeVisual(created) {
  const visual = {
    destroyed: false,
    setOrigin() { return this; }, setPosition() { return this; }, setDisplaySize() { return this; },
    setAlpha() { return this; }, setVisible() { return this; }, setTint() { return this; },
    setRotation() { return this; }, setDepth() { return this; }, clear() { return this; },
    fillStyle() { return this; }, fillRect() { return this; }, lineStyle() { return this; },
    lineBetween() { return this; }, strokeRect() { return this; }, strokeCircle() { return this; },
    destroy() { this.destroyed = true; }
  };
  created.push(visual);
  return visual;
}

function makePresentationScene(mode) {
  const created = [];
  const add = {};
  add.image = () => makeVisual(created);
  if (mode === "production") add.graphics = () => makeVisual(created);
  return {
    created,
    time: { now: 0 },
    textures: {
      exists() { return mode !== "missingTexture"; }
    },
    add
  };
}

function makeActor(health) {
  return {
    x: 40,
    y: 60,
    active: true,
    isDying: false,
    isBoss: false,
    isElite: false,
    enemyType: "drone",
    eliteType: null,
    enemyColor: 0x9b4dff,
    health,
    depth: 0,
    body: {
      enable: true,
      width: 18,
      height: 18,
      radius: 0,
      offset: { x: 2, y: 3 },
      velocity: { x: 7, y: -4 }
    }
  };
}

async function runSimulation(mode, lethal) {
  const [{ createCombatFeedbackController }, damageEnemy] = await Promise.all([
    import("../src/art/combatFeedback.js"),
    loadDamageEnemy()
  ]);
  const presentation = makePresentationScene(mode);
  const controller = createCombatFeedbackController(presentation);
  const player = makeActor(100);
  player.depth = 6;
  const enemy = makeActor(lethal ? 2 : 10);
  const playerBodyBefore = structuredClone(player.body);
  let rewards = 0;
  let impacts = 0;
  let deathBursts = 0;
  const scene = {
    player,
    combatFeedback: controller,
    killCount: 0,
    getEnemyDamageTakenMultiplier: () => 1,
    flashEnemyOnHit() {},
    spawnFloatingDamage() {},
    spawnImpactEffect() { impacts += 1; },
    spawnDeathParticles() { deathBursts += 1; },
    playSound() {},
    handleEnemyDefeatRewards() { rewards += 1; },
    playEnemyDeathEffect(target, { spawnParticles } = {}) {
      target.isDying = true;
      target.body.enable = false;
      target.body.velocity.x = 0;
      target.body.velocity.y = 0;
      if (spawnParticles !== false) deathBursts += 1;
    }
  };

  controller.trackActor(player, { kind: "player", radius: 12 });
  controller.trackActor(enemy, { kind: "enemy", radius: 10 });
  controller.update(1);
  damageEnemy.call(scene, enemy, 3, enemy.x, enemy.y, player.x, player.y, {
    sourceWeaponId: "pistol"
  });
  const result = {
    playerBody: structuredClone(player.body),
    playerBodyBefore,
    enemyBody: structuredClone(enemy.body),
    health: enemy.health,
    dying: enemy.isDying,
    rewards,
    kills: scene.killCount
  };
  controller.destroy();
  assert.ok(presentation.created.every((visual) => visual.destroyed));
  return {
    result,
    presentationRoute: {
      impacts,
      deathBursts,
      allocatedVisuals: presentation.created.length
    }
  };
}

async function runPlayerAttackSimulation(playerPresentationMode) {
  const [
    { createCombatFeedbackController },
    { attackWithPistol, attackWithShotgun, spawnPlayerProjectile, updateWeapons },
    emitAttackPresentation
  ] = await Promise.all([
    import("../src/art/combatFeedback.js"),
    loadWeaponMethods(
      "attackWithPistol",
      "attackWithShotgun",
      "spawnPlayerProjectile",
      "updateWeapons"
    ),
    loadEffectsMethod("emitAttackPresentation")
  ]);
  const presentation = makePresentationScene("production");
  const recoilTweens = [];
  const player = {
    x: 100,
    y: 120,
    active: true,
    scaleX: 1.2,
    scaleY: 1.2,
    body: {
      width: 24,
      height: 24,
      offset: { x: 12, y: 28 },
      velocity: { x: 0, y: 0 }
    }
  };
  presentation.player = player;
  presentation.tweens = {
    add(config) {
      recoilTweens.push(config);
      return config;
    }
  };
  presentation.playerPresentation = {
    notifyAttack() {
      if (playerPresentationMode === "throw") {
        throw new Error("player presentation attack failed");
      }
      return playerPresentationMode === "real";
    }
  };
  const combatFeedback = createCombatFeedbackController(presentation);
  const bullets = [];
  const scene = {
    player,
    elapsedSurvivalMs: 1_000,
    projectileCount: 1,
    bulletPenetration: 2,
    bossPhaseActive: false,
    combatFeedback,
    bullets: {
      create(x, y, textureKey) {
        const bullet = {
          x,
          y,
          textureKey,
          body: {
            velocity: { x: 0, y: 0 },
            setVelocity(vx, vy) {
              this.velocity.x = vx;
              this.velocity.y = vy;
            }
          },
          setCircle(radius) {
            this.radius = radius;
          }
        };
        bullets.push(bullet);
        return bullet;
      }
    },
    getTimelinePhase() {
      return { effects: { bulletDeviation: false } };
    },
    findNearestEnemy() {
      return { x: 200, y: 120, active: true };
    },
    playSound() {},
    spawnMuzzleFlash() {
      throw new Error("real combat feedback should own the muzzle");
    },
    spawnPlayerProjectile(payload) {
      return spawnPlayerProjectile.call(this, payload);
    },
    emitAttackPresentation(snapshot, fallbackDirection) {
      return emitAttackPresentation.call(this, snapshot, fallbackDirection);
    }
  };
  const beforePlayer = structuredClone(player);
  const pistolWeapon = {
    id: "pistol",
    unlocked: true,
    range: 300,
    damage: 4,
    projectileSpeed: 200,
    cooldownMs: 500,
    nextAttackAtMs: 0
  };
  scene.attackWithPistol = attackWithPistol;
  scene.weapons = { pistol: pistolWeapon };
  scene.weaponMutations = { teslaField: false };
  updateWeapons.call(scene);
  const pistolCooldownAtMs = pistolWeapon.nextAttackAtMs;

  const shotgunWeapon = {
    id: "shotgun",
    unlocked: true,
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
    cooldownMs: 700,
    nextAttackAtMs: 0
  };
  const shotgunReturn = attackWithShotgun.call(scene, shotgunWeapon);
  scene.findNearestEnemy = () => null;
  const noTargetReturn = attackWithPistol.call(scene, pistolWeapon);

  const gameplay = {
    bullets: bullets.map((bullet) => ({
      x: bullet.x,
      y: bullet.y,
      damage: bullet.damage,
      remainingPenetration: bullet.remainingPenetration,
      maxRange: bullet.maxRange,
      originX: bullet.originX,
      originY: bullet.originY,
      weaponId: bullet.weaponId,
      shotId: bullet.shotId,
      radius: bullet.radius,
      velocity: { ...bullet.body.velocity }
    })),
    pistolCooldownAtMs,
    shotgun: {
      returnValue: shotgunReturn,
      currentShells: shotgunWeapon.currentShells,
      isReloading: shotgunWeapon.isReloading,
      reloadEndAtMs: shotgunWeapon.reloadEndAtMs,
      nextAttackAtMs: shotgunWeapon.nextAttackAtMs,
      nextShotId: shotgunWeapon.nextShotId
    },
    noTargetReturn,
    player
  };
  combatFeedback.destroy();
  return {
    gameplay,
    beforePlayer,
    anchorRecoilCount: recoilTweens.filter((tween) => tween.targets === player).length
  };
}

async function runActionPointGeometrySimulation(actionPoint) {
  const [
    { createCombatFeedbackController },
    {
      attackWithPistol,
      isTeslaChannelTargetValid,
      resolveTeslaChannelTargets,
      createTeslaChannelSnapshot,
      stopTeslaChannel,
      updateTeslaChannel,
      attackWithTesla,
      spawnPlayerProjectile
    },
    emitAttackPresentation,
    resolvePlayerAttackVisualOrigin,
    emitTeslaChannelPresentation
  ] = await Promise.all([
    import("../src/art/combatFeedback.js"),
    loadWeaponMethods(
      "attackWithPistol",
      "isTeslaChannelTargetValid",
      "resolveTeslaChannelTargets",
      "createTeslaChannelSnapshot",
      "stopTeslaChannel",
      "updateTeslaChannel",
      "attackWithTesla",
      "spawnPlayerProjectile"
    ),
    loadEffectsMethod("emitAttackPresentation"),
    loadEffectsMethod("resolvePlayerAttackVisualOrigin"),
    loadEffectsMethod("emitTeslaChannelPresentation")
  ]);
  const presentation = makePresentationScene("production");
  const player = {
    x: 100,
    y: 120,
    active: true,
    body: {
      width: 24,
      height: 24,
      offset: { x: 12, y: 28 },
      velocity: { x: 0, y: 0 }
    }
  };
  const playerBefore = structuredClone(player);
  const originQueries = [];
  presentation.player = player;
  presentation.tweens = { add(config) { return config; } };
  presentation.playerPresentation = {
    notifyAttack() { return true; },
    updateAim() { return true; },
    getAttackEffectOrigin(query) {
      originQueries.push(structuredClone(query));
      return { x: actionPoint.x, y: actionPoint.y, vfxType: query.weaponId === "tesla" ? "tesla" : "ballistic" };
    }
  };
  const combatFeedback = createCombatFeedbackController(presentation);
  const bulletPayloads = [];
  const bullets = [];
  const targetSearches = [];
  const damageCalls = [];
  const channelSnapshots = [];
  const candidates = [
    { id: "first", x: 200, y: 120, active: true },
    { id: "second", x: 200, y: 220, active: true },
    { id: "third", x: 100, y: 220, active: true }
  ];
  const scene = {
    player,
    elapsedSurvivalMs: 1_000,
    projectileCount: 2,
    bulletPenetration: 3,
    bossPhaseActive: false,
    combatFeedback,
    bullets: {
      create(x, y, textureKey) {
        const bullet = {
          x,
          y,
          textureKey,
          body: {
            velocity: { x: 0, y: 0 },
            setVelocity(vx, vy) {
              this.velocity.x = vx;
              this.velocity.y = vy;
            }
          },
          setCircle(radius) { this.radius = radius; }
        };
        bullets.push(bullet);
        return bullet;
      }
    },
    getTimelinePhase() { return { effects: { bulletDeviation: false } }; },
    findNearestEnemy(range, x, y, ignored, prioritizeBoss) {
      targetSearches.push({
        range,
        x,
        y,
        ignored: ignored ? [...ignored].map(({ id }) => id) : [],
        prioritizeBoss: prioritizeBoss === true
      });
      return candidates.find((candidate) => !ignored?.has(candidate)) ?? null;
    },
    playSound() {},
    spawnMuzzleFlash() {},
    spawnPlayerProjectile(payload) {
      bulletPayloads.push(structuredClone(payload));
      return spawnPlayerProjectile.call(this, payload);
    },
    emitAttackPresentation(snapshot, fallbackDirection) {
      return emitAttackPresentation.call(this, snapshot, fallbackDirection);
    },
    emitTeslaChannelPresentation(snapshot) {
      channelSnapshots.push(structuredClone(snapshot));
      return emitTeslaChannelPresentation.call(this, snapshot);
    },
    resolvePlayerAttackVisualOrigin(payload) {
      return resolvePlayerAttackVisualOrigin.call(this, payload);
    },
    damageEnemy(enemy, amount, impactX, impactY, sourceX, sourceY, metadata) {
      damageCalls.push({
        targetId: enemy.id,
        amount,
        impactX,
        impactY,
        sourceX,
        sourceY,
        metadata: structuredClone(metadata)
      });
    },
    playerPresentation: presentation.playerPresentation
  };
  Object.assign(scene, {
    isTeslaChannelTargetValid,
    resolveTeslaChannelTargets,
    createTeslaChannelSnapshot,
    stopTeslaChannel,
    updateTeslaChannel,
    attackWithTesla
  });

  const pistolReturn = attackWithPistol.call(scene, {
    range: 300,
    damage: 4,
    projectileSpeed: 200
  });
  const teslaReturn = updateTeslaChannel.call(scene, {
    range: 300,
    damage: 10,
    chainTargets: 3,
    chainSearchRadius: 150,
    cooldownMs: 300,
    nextAttackAtMs: 0,
    channelTarget: null,
    channelTargets: [],
    isChanneling: false
  });
  const visibleSegments = channelSnapshots.at(-1)?.segments ?? [];
  const snapshot = {
    pistolReturn,
    teslaReturn,
    bulletPayloads,
    bullets: bullets.map((bullet) => ({
      x: bullet.x,
      y: bullet.y,
      angle: bullet.presentationAngle,
      originX: bullet.originX,
      originY: bullet.originY,
      maxRange: bullet.maxRange,
      remainingPenetration: bullet.remainingPenetration,
      damage: bullet.damage,
      weaponId: bullet.weaponId,
      velocityX: bullet.body.velocity.x,
      velocityY: bullet.body.velocity.y
    })),
    targetSearches,
    targetOrder: damageCalls.map(({ targetId }) => targetId),
    damageCalls,
    chainCount: visibleSegments.length,
    player: structuredClone(player)
  };
  combatFeedback.destroy();
  return {
    gameplay: snapshot,
    playerBefore,
    visualFirstArc: visibleSegments[0]
      ? [visibleSegments[0].x1, visibleSegments[0].y1, visibleSegments[0].x2, visibleSegments[0].y2]
      : null,
    visualRemainingArcs: visibleSegments.slice(1).map(({ x1, y1, x2, y2 }) => [x1, y1, x2, y2]),
    originQueries
  };
}

test("production image fallback and missing-texture paths preserve identical body and damage outcomes", async () => {
  for (const lethal of [false, true]) {
    const runs = [];
    for (const mode of ["production", "fallback", "missingTexture"]) {
      runs.push([mode, await runSimulation(mode, lethal)]);
    }
    const baseline = runs[0][1].result;
    assert.deepEqual(baseline.playerBody, baseline.playerBodyBefore, "presentation never changes player physics");
    for (const [mode, { result }] of runs.slice(1)) {
      assert.deepEqual(result, baseline, `${mode} must preserve the complete gameplay result`);
    }
    assert.deepEqual(runs[0][1].presentationRoute, { impacts: 0, deathBursts: 0, allocatedVisuals: lethal ? 4 : 3 });
    assert.deepEqual(runs[1][1].presentationRoute, { impacts: 0, deathBursts: 0, allocatedVisuals: lethal ? 4 : 3 });
    assert.deepEqual(
      runs[2][1].presentationRoute,
      { impacts: 1, deathBursts: lethal ? 1 : 0, allocatedVisuals: 0 },
      "a real TextureManager miss must select legacy feedback before allocating visuals"
    );
  }
});

test("real no-op and throwing player presentation preserve projectiles damage cooldown ammo and returns", async () => {
  const runs = [];
  for (const mode of ["real", "noop", "throw"]) {
    runs.push([mode, await runPlayerAttackSimulation(mode)]);
  }

  const baseline = runs[0][1].gameplay;
  assert.deepEqual(
    baseline.bullets.map(({ x, y, originX, originY, damage, weaponId }) => ({
      x,
      y,
      originX,
      originY,
      damage,
      weaponId
    })),
    [
      { x: 100, y: 120, originX: 100, originY: 120, damage: 4, weaponId: "pistol" },
      { x: 100, y: 120, originX: 100, originY: 120, damage: 8, weaponId: "shotgun" },
      { x: 100, y: 120, originX: 100, originY: 120, damage: 8, weaponId: "shotgun" },
      { x: 100, y: 120, originX: 100, originY: 120, damage: 8, weaponId: "shotgun" }
    ],
    "all projectiles still originate at the gameplay anchor and retain their damage"
  );
  assert.equal(baseline.pistolCooldownAtMs, 1_500);
  assert.deepEqual(baseline.shotgun, {
    returnValue: true,
    currentShells: 0,
    isReloading: true,
    reloadEndAtMs: 1_900,
    nextAttackAtMs: 1_900,
    nextShotId: 8
  });
  assert.equal(baseline.noTargetReturn, false);

  for (const [mode, run] of runs) {
    assert.deepEqual(run.gameplay, baseline, `${mode} must preserve the complete attack result`);
    assert.deepEqual(run.gameplay.player, run.beforePlayer, `${mode} must preserve anchor transform and Body`);
    assert.equal(
      run.anchorRecoilCount,
      mode === "real" ? 0 : 2,
      `${mode} uses anchor recoil only when visible presentation does not handle it`
    );
  }
});

test("changing presentation action points changes only muzzle and first-arc visuals while every gameplay field remains identical", async () => {
  const first = await runActionPointGeometrySimulation({ x: 132, y: 92 });
  const second = await runActionPointGeometrySimulation({ x: 148, y: 84 });

  assert.deepEqual(first.gameplay, second.gameplay, "presentation origin cannot affect any captured gameplay field");
  assert.deepEqual(first.gameplay.bulletPayloads.map((payload) => ({
    x: payload.x,
    y: payload.y,
    angle: payload.angle,
    range: payload.range,
    penetration: payload.penetration
  })), second.gameplay.bulletPayloads.map((payload) => ({
    x: payload.x,
    y: payload.y,
    angle: payload.angle,
    range: payload.range,
    penetration: payload.penetration
  })));
  assert.equal(first.gameplay.bullets.length, 2);
  assert.ok(first.gameplay.bullets.every((bullet) => (
    bullet.x === 100
    && bullet.y === 120
    && bullet.originX === 100
    && bullet.originY === 120
    && bullet.maxRange === 300
    && bullet.remainingPenetration === 3
  )), "projectile coordinates origin range and penetration stay center-authored");
  assert.deepEqual(first.gameplay.targetOrder, ["first", "second", "third"]);
  assert.deepEqual(first.gameplay.damageCalls.map(({ amount, sourceX, sourceY, metadata }) => ({
    amount,
    sourceX,
    sourceY,
    sourceDistance: metadata.sourceDistance
  })), [
    { amount: 10, sourceX: 100, sourceY: 120, sourceDistance: 100 },
    { amount: 8, sourceX: 200, sourceY: 120, sourceDistance: 100 },
    { amount: 6.4, sourceX: 200, sourceY: 220, sourceDistance: 100 }
  ]);
  assert.equal(first.gameplay.chainCount, 3);
  assert.deepEqual([first.gameplay.pistolReturn, first.gameplay.teslaReturn], [true, true]);
  assert.deepEqual(first.gameplay.player, first.playerBefore);
  assert.deepEqual(second.gameplay.player, second.playerBefore);
  assert.deepEqual(first.visualFirstArc, [132, 92, 200, 120]);
  assert.deepEqual(second.visualFirstArc, [148, 84, 200, 120]);
  assert.deepEqual(first.visualRemainingArcs, second.visualRemainingArcs);
});
