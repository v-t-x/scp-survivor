import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";

const weaponsPath = new URL("../src/scene/weapons.js", import.meta.url);

const Phaser = {
  Math: {
    Angle: {
      Between(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
      }
    },
    DegToRad(degrees) {
      return degrees * Math.PI / 180;
    },
    Distance: {
      Between(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
      }
    }
  }
};

async function loadWeaponsMixin() {
  const source = await readFile(weaponsPath, "utf8");
  const mixinStart = source.indexOf("export const weaponsMixin = {");
  const mixinEnd = source.lastIndexOf("\n};") + 3;
  const mixin = source
    .slice(mixinStart, mixinEnd)
    .replace("export const weaponsMixin = ", "")
    .replace(/;\s*$/, "");

  return Function("Phaser", "BALANCE", `return ${mixin};`)(Phaser, BALANCE);
}

function methodSource(source, signature) {
  const start = source.indexOf(signature);
  const bodyStart = source.indexOf("{", start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not locate ${signature}`);
}

function makeController(mode, snapshots, destruction) {
  if (mode === "absent") return null;
  return {
    fire(snapshot) {
      snapshots.push(snapshot);
      if (mode === "throwing" || mode === "throwing-destroy") {
        throw new Error("presentation unavailable");
      }
    },
    destroy() {
      destruction.count += 1;
      if (mode === "throwing-destroy") throw new Error("teardown unavailable");
    }
  };
}

function makeScene(weaponId, controller) {
  const targets = [
    { id: "alpha", x: 130, y: 80, active: true },
    { id: "bravo", x: 150, y: 100, active: true },
    { id: "charlie", x: 170, y: 120, active: true }
  ];
  const targetSequence = weaponId === "tesla" ? [...targets, null] : [targets[0]];
  const selectedTargets = [];
  const projectiles = [];
  const damage = [];
  const lightning = [];
  const player = { x: 100, y: 80 };
  const scene = {
    player,
    elapsedSurvivalMs: 500,
    projectileCount: 3,
    bulletPenetration: 2,
    bossPhaseActive: false,
    playerFacingAngle: -1,
    weaponRigView: controller,
    add: {
      circle() {
        return { setDepth() {} };
      }
    },
    tweens: { add() {} },
    registerTransientEffect() {},
    playSound() {},
    findNearestEnemy() {
      const target = targetSequence.shift() ?? null;
      selectedTargets.push(target?.id ?? null);
      return target;
    },
    spawnPlayerProjectile(projectile) {
      projectiles.push(structuredClone(projectile));
    },
    spawnLightningSegment(x1, y1, x2, y2) {
      lightning.push({ x1, y1, x2, y2 });
    },
    damageEnemy(target, amount, x, y, originX, originY, details) {
      damage.push({
        target: target.id,
        amount,
        x,
        y,
        originX,
        originY,
        details: structuredClone(details)
      });
    }
  };

  return { scene, targets, selectedTargets, projectiles, damage, lightning };
}

function makeWeapon(weaponId) {
  if (weaponId === "pistol") {
    return {
      id: "pistol",
      damage: 11,
      projectileSpeed: 320,
      range: 260,
      nextAttackAtMs: 0
    };
  }
  if (weaponId === "shotgun") {
    return {
      id: "shotgun",
      damage: 17,
      projectileSpeed: 280,
      range: 190,
      triggerRange: 140,
      pelletCount: 3,
      spreadDeg: 24,
      currentShells: 2,
      magazineSize: 4,
      reloadDurationMs: 900,
      reloadEndAtMs: 0,
      isReloading: false,
      nextShotId: 4,
      nextAttackAtMs: 0
    };
  }
  return {
    id: "tesla",
    damage: 23,
    range: 240,
    chainTargets: 3,
    chainSearchRadius: 100,
    nextAttackAtMs: 0
  };
}

async function attackOnce(weaponId, mode) {
  const weaponsMixin = await loadWeaponsMixin();
  const snapshots = [];
  const destruction = { count: 0 };
  const controller = makeController(mode, snapshots, destruction);
  const result = makeScene(weaponId, controller);
  const { scene } = result;
  scene.spawnMuzzleFlash = weaponsMixin.spawnMuzzleFlash;
  scene.notifyWeaponRigFire = weaponsMixin.notifyWeaponRigFire;
  const weapon = makeWeapon(weaponId);
  const method = {
    pistol: "attackWithPistol",
    shotgun: "attackWithShotgun",
    tesla: "attackWithTesla"
  }[weaponId];
  const didAttack = weaponsMixin[method].call(scene, weapon);

  return {
    didAttack,
    projectiles: result.projectiles,
    damage: result.damage,
    lightning: result.lightning,
    selectedTargets: result.selectedTargets,
    playerFacingAngle: scene.playerFacingAngle,
    weapon: structuredClone(weapon),
    snapshots,
    destroyed: destruction.count,
    controllerAfterAttack: scene.weaponRigView
  };
}

function gameplayResult(run) {
  return {
    didAttack: run.didAttack,
    projectiles: run.projectiles,
    damage: run.damage,
    lightning: run.lightning,
    selectedTargets: run.selectedTargets,
    playerFacingAngle: run.playerFacingAngle,
    weapon: run.weapon
  };
}

const expectedSnapshots = {
  pistol: {
    weaponId: "pistol",
    anchorX: 100,
    anchorY: 80,
    aimAngle: 0,
    firedAtMs: 500,
    projectileCount: 3
  },
  shotgun: {
    weaponId: "shotgun",
    anchorX: 100,
    anchorY: 80,
    aimAngle: 0,
    firedAtMs: 500,
    currentShells: 1,
    magazineSize: 4,
    isReloading: false
  },
  tesla: {
    weaponId: "tesla",
    anchorX: 100,
    anchorY: 80,
    aimAngle: 0,
    firedAtMs: 500,
    chainTargets: 3,
    cooldownRatio: 0
  }
};

for (const weaponId of ["pistol", "shotgun", "tesla"]) {
  test(`${weaponId} fire notification preserves the baseline for absent, normal, and throwing controllers`, async () => {
    const absent = await attackOnce(weaponId, "absent");
    const normal = await attackOnce(weaponId, "normal");
    const throwing = await attackOnce(weaponId, "throwing");

    assert.deepEqual(gameplayResult(normal), gameplayResult(absent));
    assert.deepEqual(gameplayResult(throwing), gameplayResult(absent));
    assert.equal(absent.snapshots.length, 0);
    assert.equal(normal.snapshots.length, 1);
    assert.ok(Object.isFrozen(normal.snapshots[0]));
    assert.deepEqual(normal.snapshots[0], expectedSnapshots[weaponId]);
    assert.equal(throwing.snapshots.length, 1);
    assert.deepEqual(throwing.snapshots[0], expectedSnapshots[weaponId]);
    assert.equal(throwing.destroyed, 1);
    assert.equal(throwing.controllerAfterAttack, null);
  });
}

test("a throwing rig teardown remains presentation-only", async () => {
  const absent = await attackOnce("pistol", "absent");
  const throwingDestroy = await attackOnce("pistol", "throwing-destroy");

  assert.deepEqual(gameplayResult(throwingDestroy), gameplayResult(absent));
  assert.equal(throwingDestroy.destroyed, 1);
  assert.equal(throwingDestroy.controllerAfterAttack, null);
});

test("legacy muzzle flash remains the no-controller fallback", async () => {
  const weaponsMixin = await loadWeaponsMixin();
  const withoutRig = makeScene("pistol", null).scene;
  const withRig = makeScene("pistol", { fire() {}, destroy() {} }).scene;
  let fallbackCalls = 0;
  withoutRig.add.circle = () => {
    fallbackCalls += 1;
    return { setDepth() {} };
  };
  withRig.add.circle = () => {
    fallbackCalls += 1;
    return { setDepth() {} };
  };

  weaponsMixin.spawnMuzzleFlash.call(withoutRig, 0);
  weaponsMixin.spawnMuzzleFlash.call(withRig, 0);

  assert.equal(fallbackCalls, 1);
});

test("weapon fire source keeps gameplay operations independent from the rig controller", async () => {
  const source = await readFile(weaponsPath, "utf8");
  const updateWeapons = methodSource(source, "  updateWeapons()");
  const weaponMethods = ["attackWithPistol", "attackWithShotgun", "attackWithTesla"]
    .map((name) => methodSource(source, `  ${name}(`));

  assert.match(updateWeapons, /this\.weaponRigHasTarget\s*=\s*false/);
  assert.doesNotMatch(updateWeapons, /weaponRigView|notifyWeaponRigFire/);
  for (const method of weaponMethods) {
    assert.match(method, /this\.notifyWeaponRigFire\(\{/);
    assert.doesNotMatch(method, /weaponRigView/);
    assert.doesNotMatch(method, /return\s+(?:this\.)?notifyWeaponRigFire/);
    assert.match(method, /return true;/);
  }
  assert.match(source, /notifyWeaponRigFire\(snapshot\)\s*\{/);
  assert.match(source, /Object\.freeze\(\{\s*\.\.\.snapshot\s*\}\)/);
  assert.match(source, /try\s*\{[\s\S]*?\.fire\(frozenSnapshot\)[\s\S]*?\}\s*catch/);
  assert.match(source, /weaponRigView\.destroy\?\.\(\)/);
  assert.match(source, /this\.weaponRigView\s*=\s*null/);
});

test("parallel fire-control upgrade changes copy only and retains the projectile clamp contract", () => {
  const upgrade = UPGRADE_DEFINITIONS.find(({ key }) => key === "projectileCount");
  const scene = { selectedWeaponId: "pistol", projectileCount: BALANCE.combat.maxProjectiles - 1 };

  assert.equal(upgrade.name, "并联火控");
  assert.equal(upgrade.description, "增加一条同步模块通道。");
  assert.equal(upgrade.weaponId, "pistol");
  assert.equal(upgrade.isAvailable(scene), true);
  upgrade.apply(scene);
  assert.equal(scene.projectileCount, BALANCE.combat.maxProjectiles);
  assert.equal(upgrade.isAvailable(scene), false);
  upgrade.apply(scene);
  assert.equal(scene.projectileCount, BALANCE.combat.maxProjectiles);
});
