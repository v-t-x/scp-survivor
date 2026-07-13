import test from "node:test";
import assert from "node:assert/strict";
import {
  createWeaponRigFireSnapshot,
  createWeaponRigPresentation,
  quantizeWeaponRigDirection
} from "../src/art/weaponRigPresentation.js";

test("weapon rig quantizes finite angles into eight Phaser screen directions", () => {
  assert.equal(quantizeWeaponRigDirection(0), 0);
  assert.equal(quantizeWeaponRigDirection(Math.PI / 4), 1);
  assert.equal(quantizeWeaponRigDirection(Math.PI / 2), 2);
  assert.equal(quantizeWeaponRigDirection(Math.PI), 4);
  assert.equal(quantizeWeaponRigDirection(-Math.PI / 2), 6);
  assert.equal(quantizeWeaponRigDirection(Number.NaN, 7), 7);
});

test("pistol channels clamp to the existing one-to-five contract", () => {
  assert.equal(createWeaponRigPresentation({ weaponId: "pistol", projectileCount: -2 }).channelCount, 1);
  assert.equal(createWeaponRigPresentation({ weaponId: "pistol", projectileCount: 5 }).channelCount, 5);
  assert.equal(createWeaponRigPresentation({ weaponId: "pistol", projectileCount: 99 }).channelCount, 5);
});

test("shotgun reload and Tesla charge map existing read-only state", () => {
  const shotgun = createWeaponRigPresentation({
    weaponId: "shotgun", hasTarget: true, isReloading: true,
    currentShells: 2, magazineSize: 4
  });
  assert.equal(shotgun.mode, "reloading");
  assert.equal(shotgun.shellCount, 2);
  assert.equal(shotgun.magazineSize, 4);

  const tesla = createWeaponRigPresentation({
    weaponId: "tesla", hasTarget: true, chainTargets: 99,
    cooldownRatio: 0.25, outageStrength: 2
  });
  assert.equal(tesla.mode, "charging");
  assert.equal(tesla.coilNodes, 8);
  assert.equal(tesla.cooldownRatio, 0.25);
  assert.equal(tesla.outageStrength, 1);
});

test("unknown weapons stow and invalid aim preserves the last direction", () => {
  const previous = createWeaponRigPresentation({ weaponId: "shotgun", aimAngle: Math.PI / 2, hasTarget: true });
  const state = createWeaponRigPresentation({ weaponId: "unknown", aimAngle: Infinity, hasTarget: true }, previous);
  assert.equal(state.weaponId, null);
  assert.equal(state.mode, "travel");
  assert.equal(state.directionIndex, previous.directionIndex);
  assert.ok(Object.isFrozen(state));
});

test("lost targets hold aim for 250ms before returning to travel", () => {
  assert.equal(createWeaponRigPresentation({
    weaponId: "pistol", hasTarget: false, targetAgeMs: 249
  }).mode, "aiming");
  assert.equal(createWeaponRigPresentation({
    weaponId: "pistol", hasTarget: false, targetAgeMs: 250
  }).mode, "travel");
});

test("fire snapshots expose display data only", () => {
  assert.deepEqual(createWeaponRigFireSnapshot({
    weaponId: "tesla", aimAngle: -Math.PI / 4, firedAtMs: 1200,
    chainTargets: 6, anchorX: 400, anchorY: 300
  }), {
    weaponId: "tesla", directionIndex: 7, aimAngle: -Math.PI / 4,
    firedAtMs: 1200, channelCount: 1, shellCount: 0,
    magazineSize: 0, coilNodes: 6, anchorX: 400, anchorY: 300
  });
});
