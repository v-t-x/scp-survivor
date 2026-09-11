import test from "node:test";
import assert from "node:assert/strict";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";
import {
  isPlayerUpgradeVisible,
  PLAYER_WEAPON_ALLOWLIST
} from "../src/config/playerWeaponAvailability.js";

let createU3BuildModel = () => null;
try {
  ({ createU3BuildModel } = await import("../src/ui/u3BuildView.js"));
} catch {
  // RED state: the production module does not exist until the model contract is implemented.
}

function createBuildScene() {
  return {
    selectedWeaponId: "pistol",
    health: 87,
    maxHealth: 140,
    playerMoveSpeed: 242,
    pickupRadius: 70,
    projectileCount: 3,
    bulletPenetration: 2,
    weapons: {
      pistol: {
        id: "pistol",
        name: "基金会收容突击步枪",
        unlocked: true,
        currentLevel: 9,
        damage: 34.56,
        cooldownMs: 166.4,
        range: 640
      },
      shotgun: {
        id: "shotgun",
        name: "基金会收容突破器",
        unlocked: true,
        currentLevel: 99,
        damage: 999,
        cooldownMs: 1
      },
      tesla: {
        id: "tesla",
        name: "特斯拉收容发射器",
        unlocked: false,
        currentLevel: 0,
        damage: 6,
        cooldownMs: 300,
        range: 320,
        chainTargets: 3
      }
    },
    upgradeLevels: Object.fromEntries(
      UPGRADE_DEFINITIONS.map(({ key }) => [key, 0])
    ),
    weaponMutations: {
      pistolBoomerang: true,
      breacherExplosive: true,
      teslaField: false
    }
  };
}

test("U3 build model keeps both player-visible weapons and excludes dormant shotgun", () => {
  const model = createU3BuildModel(createBuildScene());

  assert.deepEqual(model.weapons.map(({ id }) => id), PLAYER_WEAPON_ALLOWLIST);
  assert.deepEqual(
    model.weapons.map(({ id, state, selected, totalLevel }) => ({ id, state, selected, totalLevel })),
    [
      { id: "pistol", state: "active", selected: true, totalLevel: 9 },
      { id: "tesla", state: "locked", selected: false, totalLevel: 0 }
    ]
  );
  assert.equal(JSON.stringify(model).includes("shotgun"), false);
  assert.equal(JSON.stringify(model).includes("突破器"), false);
});

test("U3 build model separates weapon total level from every applied-upgrade count", () => {
  const scene = createBuildScene();
  scene.upgradeLevels.damage = 7;
  scene.upgradeLevels.attackSpeed = 4;
  scene.upgradeLevels.moveSpeed = 12;
  scene.upgradeLevels.teslaChains = 3;

  const model = createU3BuildModel(scene);
  const rifle = model.weapons.find(({ id }) => id === "pistol");
  const damage = model.weaponProtocols.find(({ key }) => key === "damage");
  const cadence = model.weaponProtocols.find(({ key }) => key === "attackSpeed");
  const movement = model.genericUpgrades.find(({ key }) => key === "moveSpeed");

  assert.equal(rifle.totalLevel, 9);
  assert.deepEqual(rifle.metrics, [
    { label: "单发伤害", value: "34.6" },
    { label: "攻击间隔", value: "166 ms" },
    { label: "弹丸数量", value: "3" },
    { label: "穿透数量", value: "2" }
  ]);
  assert.deepEqual(
    [damage.count, damage.value, cadence.count, cadence.value],
    [7, "34.6", 4, "166 ms"]
  );
  assert.deepEqual(
    [movement.count, movement.value, movement.owner],
    [12, "242 px/s", "行动员 / 通用强化"]
  );
});

test("U3 build model preserves every visible upgrade and both mutation activation states at late-run counts", () => {
  const scene = createBuildScene();
  for (const upgrade of UPGRADE_DEFINITIONS) scene.upgradeLevels[upgrade.key] = 27;

  const model = createU3BuildModel(scene);
  const visible = UPGRADE_DEFINITIONS.filter(isPlayerUpgradeVisible);
  const expectedGeneric = visible
    .filter(({ kind, isMutation }) => kind === "generic" && isMutation !== true)
    .map(({ key }) => key);
  const expectedProtocols = visible
    .filter(({ kind, isMutation }) => kind === "weapon" && isMutation !== true)
    .map(({ key }) => key);

  assert.deepEqual(model.genericUpgrades.map(({ key }) => key), expectedGeneric);
  assert.deepEqual(model.weaponProtocols.map(({ key }) => key), expectedProtocols);
  assert.deepEqual(
    model.mutations.map(({ key, state, count }) => ({ key, state, count })),
    [
      { key: "pistolBoomerang", state: "active", count: 1 },
      { key: "teslaField", state: "inactive", count: 0 }
    ]
  );
  assert.deepEqual(
    model.mutations.find(({ key }) => key === "pistolBoomerang").facts,
    ["回程速度 x1.10", "触发射程 640 px"]
  );
  assert.deepEqual(
    model.mutations.find(({ key }) => key === "teslaField").facts,
    ["半径 130 px", "周期 600 ms", "当前脉冲伤害 8"]
  );
  assert.equal(model.genericUpgrades.every(({ count }) => count === 27), true);
  assert.equal(model.weaponProtocols.every(({ count }) => count === 27), true);
});
