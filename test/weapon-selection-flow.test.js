import test from "node:test";
import assert from "node:assert/strict";
import { menusMixin } from "../src/scene/menus.js";

function createMissionEntryScene() {
  const calls = {
    initWeapons: 0,
    setupSpawning: 0,
    updateUI: 0,
    destroyWeaponSelectionScreen: 0
  };
  const scene = {
    selectedWeaponId: "pistol",
    pendingSelectedWeaponId: "pistol",
    isMissionActive: false,
    elapsedSurvivalMs: 91_000,
    powerOutageTriggered: true,
    bossWarningShown: true,
    regularSpawningActive: false,
    survivalPhaseEnded: true,
    medkitSpawned: true,
    bossPhaseActive: true,
    bossEnemy: { active: true },
    bossIntroTimer: { active: true },
    activeFacilityEvent: { type: "powerOutage" },
    activeFacilityEventEndAtMs: 92_000,
    cameras: { main: { setBackgroundColor() {} } },
    initWeapons() { calls.initWeapons += 1; },
    syncCombatStatsFromWeapons() {},
    applyUnlockedPerks() {},
    setupSpawning() { calls.setupSpawning += 1; },
    setGameplayHudVisible() {},
    updateUI() { calls.updateUI += 1; },
    destroyWeaponSelectionScreen() { calls.destroyWeaponSelectionScreen += 1; }
  };
  return { scene, calls };
}

function missionSnapshot(scene) {
  return structuredClone({
    selectedWeaponId: scene.selectedWeaponId,
    pendingSelectedWeaponId: scene.pendingSelectedWeaponId,
    isMissionActive: scene.isMissionActive,
    elapsedSurvivalMs: scene.elapsedSurvivalMs,
    powerOutageTriggered: scene.powerOutageTriggered,
    bossWarningShown: scene.bossWarningShown,
    regularSpawningActive: scene.regularSpawningActive,
    survivalPhaseEnded: scene.survivalPhaseEnded,
    medkitSpawned: scene.medkitSpawned,
    bossPhaseActive: scene.bossPhaseActive,
    bossEnemy: scene.bossEnemy,
    bossIntroTimer: scene.bossIntroTimer,
    activeFacilityEvent: scene.activeFacilityEvent,
    activeFacilityEventEndAtMs: scene.activeFacilityEventEndAtMs
  });
}

test("invalid direct mission weapon ids preserve every mission field and skip all startup work", () => {
  for (const weaponId of ["shotgun", "unknown"]) {
    const { scene, calls } = createMissionEntryScene();
    const before = missionSnapshot(scene);

    const started = menusMixin.startMissionWithWeapon.call(scene, weaponId);

    assert.equal(started, false, `${weaponId} must not start a mission`);
    assert.deepEqual(missionSnapshot(scene), before);
    assert.deepEqual(calls, {
      initWeapons: 0,
      setupSpawning: 0,
      updateUI: 0,
      destroyWeaponSelectionScreen: 0
    });
  }
});
