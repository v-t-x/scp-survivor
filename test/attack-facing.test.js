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
  class Vector2 {
    constructor(x, y) { this.x = x; this.y = y; }
    normalize() {
      const length = Math.hypot(this.x, this.y);
      if (length > 0) { this.x /= length; this.y /= length; }
      return this;
    }
    lengthSq() { return this.x * this.x + this.y * this.y; }
  }
  return {
    Math: {
      Vector2,
      Angle: { Between: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) },
      DegToRad: (degrees) => (degrees * Math.PI) / 180,
      FloatBetween: () => 0,
      Distance: { Between: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1) }
    }
  };
}

async function loadMethods(...names) {
  const source = await readFile(new URL("../src/scene/weapons.js", import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  const helper = source.slice(source.indexOf("function getClosestPresentationAngle"));
  return new Function("Phaser", "BALANCE", `"use strict"; ${helper} return ({${methods}});`)(
    createPhaserStub(),
    {
      upgrades: { projectileSpreadDeg: 8 },
      combat: { maxProjectiles: 8 },
      weapons: { tesla: { chainDamageFalloff: 0.8 } }
    }
  );
}

async function loadSystemMethods(...names) {
  const source = await readFile(new URL("../src/scene/systems.js", import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  return new Function("Phaser", "BALANCE", `"use strict"; return ({${methods}});`)(
    createPhaserStub(),
    { player: { dashSpeed: 900, dashDurationMs: 120, dashCooldownMs: 800, dashInvulnerabilityMs: 120 } }
  );
}

function createWeaponScene(overrides = {}) {
  return {
    player: { x: 100, y: 100 },
    playerFacingAngle: Math.PI,
    projectileCount: 3,
    bulletPenetration: 0,
    elapsedSurvivalMs: 1_000,
    bossPhaseActive: false,
    findNearestEnemy: () => ({ x: 200, y: 100, active: true }),
    spawnMuzzleFlash() {},
    playSound() {},
    ...overrides
  };
}

test("movement remembers its own direction without changing the committed attack facing", async () => {
  const { handlePlayerMovement, tryStartDash } = await loadSystemMethods(
    "handlePlayerMovement",
    "tryStartDash"
  );
  const velocity = [];
  const scene = {
    player: { body: { setVelocity(x, y) { velocity.push([x, y]); } } },
    playerFacingAngle: 0,
    playerMovementFallbackAngle: 0,
    playerMoveSpeed: 100,
    moveSpeedBuffMultiplier: 1,
    elapsedSurvivalMs: 10,
    dashUntilMs: 0,
    dashReadyAtMs: 0,
    keys: {
      left: { isDown: false }, right: { isDown: false },
      up: { isDown: true }, down: { isDown: false }
    },
    isMissionActive: true,
    isGameOver: false,
    isLevelUpActive: false,
    playerInvulnerableUntilMs: 0,
    spawnDashTrail() {},
    playSound() {}
  };

  handlePlayerMovement.call(scene);
  assert.deepEqual(velocity, [[0, -100]]);
  assert.equal(scene.playerFacingAngle, 0, "WASD must not overwrite attack-facing");
  assert.equal(scene.playerMovementFallbackAngle, -Math.PI / 2);

  scene.keys.up.isDown = false;
  tryStartDash.call(scene);
  assert.equal(scene.dashAngle, -Math.PI / 2, "no-input dash keeps the last movement direction");
  assert.equal(scene.playerFacingAngle, 0);
});

test("pistol commits the successful projectile closest to the target angle", async () => {
  const { attackWithPistol } = await loadMethods("attackWithPistol");
  const returnedAngles = [0.45, 0.08, -0.21];
  const scene = createWeaponScene({
    spawnPlayerProjectile() {
      return { presentationAngle: returnedAngles.shift() };
    }
  });

  assert.equal(attackWithPistol.call(scene, { range: 300, damage: 4, projectileSpeed: 200 }), true);
  assert.equal(scene.playerFacingAngle, 0.08);
});

test("pistol leaves facing unchanged when no projectile commits", async () => {
  const { attackWithPistol } = await loadMethods("attackWithPistol");
  const scene = createWeaponScene({ spawnPlayerProjectile: () => null });

  assert.equal(attackWithPistol.call(scene, { range: 300, damage: 4, projectileSpeed: 200 }), true);
  assert.equal(scene.playerFacingAngle, Math.PI);
});

test("shotgun does not turn the player unless a pellet is successfully committed", async () => {
  const { attackWithShotgun } = await loadMethods("attackWithShotgun");
  const scene = createWeaponScene({ spawnPlayerProjectile: () => null });
  const weapon = {
    isReloading: false, currentShells: 2, triggerRange: 120, range: 300,
    nextShotId: 1, pelletCount: 2, spreadDeg: 20, damage: 8,
    projectileSpeed: 220, reloadDurationMs: 900
  };

  assert.equal(attackWithShotgun.call(scene, weapon), true);
  assert.equal(weapon.currentShells, 1, "ammo behavior remains committed even when a visual-facing update is unavailable");
  assert.equal(scene.playerFacingAngle, Math.PI);
});

test("spawned projectiles expose an immutable committed presentation angle", async () => {
  const { spawnPlayerProjectile } = await loadMethods("spawnPlayerProjectile");
  const bullet = {
    body: { setVelocity(x, y) { this.velocity = [x, y]; } },
    setCircle(radius) { this.radius = radius; }
  };
  const scene = {
    elapsedSurvivalMs: 0,
    getTimelinePhase: () => ({ effects: { bulletDeviation: false } }),
    bullets: { create: () => bullet }
  };

  assert.equal(spawnPlayerProjectile.call(scene, {
    x: 4, y: 9, angle: 0.25, damage: 2, speed: 100, range: 500, penetration: 1
  }), bullet);
  assert.equal(bullet.presentationAngle, 0.25);
  assert.equal(Object.getOwnPropertyDescriptor(bullet, "presentationAngle").writable, false);
  assert.deepEqual(bullet.body.velocity, [Math.cos(0.25) * 100, Math.sin(0.25) * 100]);
});

test("Tesla commits first-target facing only after its first lightning and damage complete", async () => {
  const { attackWithTesla } = await loadMethods("attackWithTesla");
  const calls = [];
  const scene = createWeaponScene({
    findNearestEnemy: () => ({ x: 100, y: 200, active: true }),
    spawnLightningSegment() { calls.push("lightning"); },
    damageEnemy() { calls.push("damage"); }
  });

  assert.equal(attackWithTesla.call(scene, { range: 300, damage: 9, chainTargets: 1, chainSearchRadius: 80 }), true);
  assert.deepEqual(calls, ["lightning", "damage"]);
  assert.equal(scene.playerFacingAngle, Math.PI / 2);
});
