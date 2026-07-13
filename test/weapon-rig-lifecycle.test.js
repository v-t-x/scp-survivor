import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const mainPath = new URL("../src/main.js", import.meta.url);
const systemsPath = new URL("../src/scene/systems.js", import.meta.url);

async function loadLifecycleSystems() {
  const source = await readFile(systemsPath, "utf8");
  const helperStart = source.indexOf("export function updateWeaponRigPresentation");
  const helperEnd = source.indexOf("\n\n// Domain mixin:", helperStart);
  const mixinStart = source.indexOf("export const systemsMixin = {");
  const mixinEnd = source.lastIndexOf("\n};") + 3;
  const helper = source.slice(helperStart, helperEnd).replace("export ", "");
  const mixin = source
    .slice(mixinStart, mixinEnd)
    .replace("export const systemsMixin = ", "")
    .replace(/;\s*$/, "");

  return Function(`${helper}\nreturn { updateWeaponRigPresentation, systemsMixin: ${mixin}, lifecycleSource: ${JSON.stringify(helper)} };`)();
}

async function loadSceneCreate(createWeaponRigView) {
  const source = await readFile(mainPath, "utf8");
  const createStart = source.indexOf("  create() {") + "  create() {".length;
  const createBody = source
    .slice(createStart)
    .match(/^[\s\S]*?(?=\r?\n  }\r?\n(?:\r?\n)+  update\()/)?.[0];
  assert.ok(createBody, "PrototypeScene.create() must end before update()");
  const balance = {
    player: { baseMaxHealth: 100, baseMoveSpeed: 80, basePickupRadius: 12 },
    upgrades: { rerollsPerRun: 1 },
    timeline: { effects: { decoySpawnMinMs: 1, decoySpawnMaxMs: 2 } }
  };
  const phaser = {
    Math: { Between: () => 1 },
    Scenes: { Events: { SHUTDOWN: "shutdown", DESTROY: "destroy" } }
  };
  const Manager = class { destroy() {} };

  return Function(
    "loadMetaProgress",
    "BALANCE",
    "UPGRADE_DEFINITIONS",
    "Phaser",
    "WORLD_WIDTH",
    "WORLD_HEIGHT",
    "AudioManager",
    "UIManager",
    "createWeaponRigView",
    `return function create() {${createBody}\n};`
  )(
    () => ({ perks: {} }),
    balance,
    [],
    phaser,
    1280,
    720,
    Manager,
    Manager,
    createWeaponRigView
  );
}

function makeScene() {
  const updates = [];
  const pauses = [];
  return {
    elapsedSurvivalMs: 900,
    isPaused: false,
    isLevelUpActive: false,
    isGameOver: false,
    outageVisualStrength: 0.35,
    player: { x: 320, y: 240 },
    projectileCount: 3,
    selectedWeaponId: "pistol",
    weapons: {
      pistol: {
        id: "pistol",
        nextAttackAtMs: 1300,
        cooldownMs: 400,
        currentShells: 0,
        magazineSize: 0,
        isReloading: false,
        chainTargets: 0
      }
    },
    weaponRigHasTarget: true,
    weaponRigAimAngle: Math.PI / 2,
    weaponRigLastTargetAtMs: 800,
    weaponRigView: {
      update(snapshot, delta) { updates.push({ snapshot, delta }); },
      setPaused(value) { pauses.push(value); }
    },
    updates,
    pauses
  };
}

test("weapon rig receives one frozen read-only gameplay snapshot", async () => {
  const scene = makeScene();
  const { updateWeaponRigPresentation } = await loadLifecycleSystems();

  updateWeaponRigPresentation(scene, 16);

  assert.equal(scene.updates.length, 1);
  const [{ snapshot, delta }] = scene.updates;
  assert.equal(delta, 16);
  assert.ok(Object.isFrozen(snapshot));
  assert.deepEqual(snapshot, {
    anchorX: 320,
    anchorY: 240,
    weaponId: "pistol",
    aimAngle: Math.PI / 2,
    hasTarget: true,
    targetAgeMs: 100,
    projectileCount: 3,
    currentShells: 0,
    magazineSize: 0,
    isReloading: false,
    chainTargets: 0,
    cooldownRatio: 0,
    outageStrength: 0.35,
    paused: false
  });
  assert.equal("player" in snapshot, false);
  assert.equal("weapon" in snapshot, false);
  assert.deepEqual(scene.player, { x: 320, y: 240 });
  assert.deepEqual(scene.weapons.pistol, {
    id: "pistol",
    nextAttackAtMs: 1300,
    cooldownMs: 400,
    currentShells: 0,
    magazineSize: 0,
    isReloading: false,
    chainTargets: 0
  });
});

test("weapon rig pauses and resumes with the gameplay systems", async () => {
  const scene = makeScene();
  const { systemsMixin } = await loadLifecycleSystems();
  scene.physics = {
    pause() { scene.physicsPaused = true; },
    resume() { scene.physicsResumed = true; }
  };
  scene.spawnEvent = { paused: false };
  scene.regularSpawningActive = true;

  systemsMixin.pauseGameplaySystems.call(scene);
  systemsMixin.resumeGameplaySystems.call(scene);

  assert.equal(scene.physicsPaused, true);
  assert.equal(scene.physicsResumed, true);
  assert.deepEqual(scene.pauses, [true, false]);
  assert.equal(scene.spawnEvent.paused, false);
});

test("a rig creation failure preserves the title-screen lifecycle fallback", async () => {
  const calls = [];
  const create = await loadSceneCreate((scene) => {
    calls.push("rig");
    assert.ok(scene.player, "the player must exist before the rig factory runs");
    throw new Error("unavailable rig texture");
  });
  const scene = {
    events: { off() {}, once() {} },
    physics: { world: { setBounds() {} } },
    cameras: { main: { setBounds() {}, setBackgroundColor() {} } },
    getRequiredXpForLevel() { return 10; },
    initWeapons() {},
    createPlaceholderTextures() {},
    createArenaDecoration() {},
    createPlayer() { calls.push("player"); this.player = { x: 1, y: 2 }; },
    createGroups() {},
    createColliders() {},
    createUI() {},
    createBuildPanel() {},
    setupInputHandlers() {},
    createStartScreen() { calls.push("title"); },
    updateUI() {}
  };

  const warn = console.warn;
  console.warn = () => {};
  try {
    create.call(scene);
  } finally {
    console.warn = warn;
  }

  assert.deepEqual(calls, ["player", "rig", "title"]);
  assert.equal(scene.weaponRigView, null);
});

test("rig lifecycle source creates after the player, updates after character sync, and tears down safely", async () => {
  const mainSource = await readFile(mainPath, "utf8");
  const createPlayerIndex = mainSource.indexOf("this.createPlayer()");
  const createWeaponRigViewIndex = mainSource.indexOf("this.weaponRigView = createWeaponRigView");
  const syncCharacterIndex = mainSource.indexOf("syncCharacterPresentation(this)");
  const weaponRigUpdateIndex = mainSource.indexOf("this.updateWeaponRigPresentation(delta)");

  assert.ok(createPlayerIndex < createWeaponRigViewIndex);
  assert.ok(syncCharacterIndex < weaponRigUpdateIndex);
  assert.match(mainSource, /weaponRigView\?\.destroy\(\)/);
  assert.match(mainSource, /Shoulder fire-control presentation disabled/);
  assert.match(mainSource, /this\.weaponRigView\s*=\s*null/);
  assert.match(mainSource, /this\.weaponRigHasTarget\s*=\s*false/);
  assert.match(mainSource, /this\.weaponRigAimAngle\s*=\s*0/);
  assert.match(mainSource, /this\.weaponRigLastTargetAtMs\s*=\s*Number\.NEGATIVE_INFINITY/);
});

test("rig lifecycle helper source never assigns gameplay state", async () => {
  const { lifecycleSource } = await loadLifecycleSystems();

  assert.doesNotMatch(lifecycleSource, /scene\.player(?:\.body|\.(?:velocity|x|y))\s*=/);
  assert.doesNotMatch(lifecycleSource, /scene\.(?:enemies|weapons)\b[^\n]*\s*=/);
  assert.doesNotMatch(lifecycleSource, /selectedWeapon\.(?:nextAttackAtMs|cooldownMs|damage)\s*=/);
  assert.doesNotMatch(lifecycleSource, /(?:localStorage|saveMetaProgress)\s*\(/);
});
