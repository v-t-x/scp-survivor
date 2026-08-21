import test from "node:test";
import assert from "node:assert/strict";
import { BALANCE } from "../src/config/balance.js";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";
import {
  PLAYER_WEAPON_ALLOWLIST,
  isPlayerUpgradeVisible,
  isPlayerWeaponAllowed
} from "../src/config/playerWeaponAvailability.js";

test("player weapon allowlist is exact, frozen, and rejects dormant or unknown ids", () => {
  assert.deepEqual(PLAYER_WEAPON_ALLOWLIST, ["pistol", "tesla"]);
  assert.equal(Object.isFrozen(PLAYER_WEAPON_ALLOWLIST), true);
  assert.equal(isPlayerWeaponAllowed("pistol"), true);
  assert.equal(isPlayerWeaponAllowed("tesla"), true);
  for (const weaponId of ["shotgun", "unknown", "", null, undefined]) {
    assert.equal(isPlayerWeaponAllowed(weaponId), false, `${weaponId} must be rejected`);
  }
});

test("player-visible upgrades exclude dormant shotgun while retaining generic and allowed weapon upgrades", () => {
  assert.equal(isPlayerUpgradeVisible(null), true);
  assert.equal(isPlayerUpgradeVisible({ kind: "generic" }), true);
  assert.equal(isPlayerUpgradeVisible({ weaponId: "pistol" }), true);
  assert.equal(isPlayerUpgradeVisible({ weaponId: "tesla" }), true);
  assert.equal(isPlayerUpgradeVisible({ weaponId: "shotgun" }), false);
});

test("dormant shotgun configuration and upgrade definitions remain internally available", () => {
  assert.deepEqual(Object.keys(BALANCE.weapons), ["pistol", "shotgun", "tesla"]);
  assert.equal(BALANCE.weapons.shotgun.id, "shotgun");
  assert.equal(
    UPGRADE_DEFINITIONS.some((upgrade) => upgrade.weaponId === "shotgun"),
    true
  );
});
