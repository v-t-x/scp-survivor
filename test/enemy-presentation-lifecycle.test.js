import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";

function extractObjectMethod(source, name) {
  const start = source.search(new RegExp(`^  ${name}\\(`, "m"));
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = source.indexOf("{", source.indexOf(") {", start));
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

function extractNamedFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = source.indexOf("{", start);
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

async function loadSystemMethods(...names) {
  const source = await readFile(new URL("../src/scene/systems.js", import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  return new Function(`"use strict"; return ({${methods}});`)();
}

// Break caught: create/update order lets presentation mutate before gameplay state commits or run after game-over.
test("main owns one controller and syncs it once after enemy and Boss updates", async () => {
  const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const create = main.slice(main.indexOf("  create()"), main.indexOf("  update(_, delta)"));
  const update = main.slice(main.indexOf("  update(_, delta)"), main.indexOf("  // Dispose manager-owned"));
  assert.match(main, /import\s*\{\s*createEnemyPresentationController\s*\}\s*from\s*"\.\/art\/enemyPresentationController\.js"/);
  assert.match(create, /this\.combatFeedback\s*=[\s\S]*allowedDevelopmentAssetIds[\s\S]*this\.enemyPresentation\s*=\s*createSafeEnemyPresentationController\(this,/);
  assert.ok(create.indexOf("this.enemyPresentation =") < create.indexOf("installManagerTeardown(this)"));
  assert.match(update, /if \(this\.isGameOver\)\s*\{\s*return;/);
  assert.match(update, /this\.updateEnemies\(\)[\s\S]*this\.updateBoss\(\)[\s\S]*this\.enemyPresentation\?\.sync\?\.\(this\.elapsedSurvivalMs, delta\)[\s\S]*this\.combatFeedback\.update/);
});

// Break caught: unknown query values are passed to the resolver or the Set is rebuilt during sync.
test("main creates the candidate Set once and keeps forceLegacy development-only", async () => {
  const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const create = main.slice(main.indexOf("  create()"), main.indexOf("  update(_, delta)"));
  assert.match(create, /const enemyPresentationParams = new URLSearchParams\([\s\S]*typeof window === "undefined" \? "" : window\.location\.search[\s\S]*\)/);
  assert.match(create, /import\.meta\.env\?\.DEV === true/);
  assert.match(create, /enemyPresentationMode === "candidate"\s*\? new Set\(enemyPresentationParams\.getAll\("enemyCandidate"\)\)\s*:\s*new Set\(\)/);
  assert.match(create, /forceLegacy:\s*enemyPresentationMode === "legacy"/);
  const update = main.slice(main.indexOf("  update(_, delta)"), main.indexOf("  // Dispose manager-owned"));
  assert.doesNotMatch(update, /new Set|URLSearchParams/);
});

// Break caught: a controller constructor exception aborts Scene create instead of installing the no-op seam.
test("main controller construction failure returns the complete no-op contract", async () => {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const helper = extractNamedFunction(source, "createSafeEnemyPresentationController");
  let factoryCalls = 0;
  const createSafeEnemyPresentationController = new Function(
    "createEnemyPresentationController",
    "createNoopEnemyPresentationController",
    `"use strict"; ${helper}; return createSafeEnemyPresentationController;`
  )(
    () => { factoryCalls += 1; throw new Error("controller constructor failed"); },
    () => ({
      trackActor() { return 0; }, sync() {}, notifyAction() {}, notifyHit() {},
      notifyDeath() {}, setPaused() {}, untrackActor() {}, destroy() {}
    })
  );

  const controller = createSafeEnemyPresentationController({}, Object.freeze({ forceLegacy: false }));
  assert.equal(factoryCalls, 1);
  assert.equal(controller.trackActor({}), 0);
  for (const method of ["sync", "notifyAction", "notifyHit", "notifyDeath", "setPaused", "untrackActor", "destroy"]) {
    assert.doesNotThrow(() => controller[method]());
  }
});

// Break caught: a throwing enemy-presentation sync prevents later projectile, pickup, feedback and frame work.
test("main update isolates presentation sync failure and commits the rest of the frame", async () => {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const method = extractObjectMethod(source, "update");
  const update = new Function(
    "createPlayerPresentationSnapshot",
    `"use strict"; return ({${method}}).update;`
  )(() => Object.freeze({ mode: "test" }));
  const events = [];
  const scene = {
    isGameOver: false,
    isMissionActive: true,
    isPaused: false,
    isLevelUpActive: false,
    bossPhaseActive: true,
    elapsedSurvivalMs: 0,
    buildPanel: { visible: false },
    playerPresentation: { update() { events.push("player-presentation"); } },
    enemyPresentation: { sync() { events.push("enemy-presentation"); throw new Error("sync failed"); } },
    combatFeedback: { update() { events.push("combat-feedback"); } }
  };
  for (const name of [
    "updateTimelineDirector", "updateTimelineEffects", "updateTemporaryBuffs",
    "updateFacilityEventDirector", "updateMedkitSpawn", "handlePlayerMovement",
    "updateWeapons", "updateEnemies", "updateBoss", "updatePlayerBullets",
    "updateEnemyProjectiles", "handleExperienceCollection", "updateSupplyPickups",
    "updatePickupRadiusIndicator", "updatePlayerInvulnerabilityVisual",
    "updateFacilityVisualEffects", "updateTimelineHudCorruption", "updateUI"
  ]) {
    scene[name] = () => events.push(name);
  }

  assert.doesNotThrow(() => update.call(scene, null, 16));
  assert.deepEqual(events.slice(events.indexOf("enemy-presentation")), [
    "enemy-presentation",
    "updatePlayerBullets",
    "updateEnemyProjectiles",
    "handleExperienceCollection",
    "updateSupplyPickups",
    "updatePickupRadiusIndicator",
    "combat-feedback",
    "updatePlayerInvulnerabilityVisual",
    "updateFacilityVisualEffects",
    "updateTimelineHudCorruption",
    "updateUI"
  ]);
  assert.equal(scene.elapsedSurvivalMs, 16);
});

// Break caught: ordinary or Boss track failures abort their already-committed gameplay spawn.
test("throwing presentation tracking leaves ordinary and Boss ids at zero and spawn work continues", async () => {
  const source = await readFile(new URL("../src/scene/enemies.js", import.meta.url), "utf8");
  const initializerSource = extractObjectMethod(source, "initializeEnemyFromConfig");
  const bossSource = extractObjectMethod(source, "spawnScp049Boss");
  const Phaser = { Math: { Between: (minimum) => minimum, Clamp: (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value)) } };
  const CHARACTER_DISPLAY_SCALE = { infectedStaff: 1, scp049: 1.2 };
  const initializeEnemyFromConfig = new Function(
    "Phaser", "BALANCE", "applyDisplayScalePreservingBody", "centerCircularBody",
    "CHARACTER_DISPLAY_SCALE", "applyEnemyPresentation",
    `"use strict"; return ({${initializerSource}}).initializeEnemyFromConfig;`
  )(Phaser, BALANCE, () => {}, () => {}, CHARACTER_DISPLAY_SCALE, () => {});
  const spawnScp049Boss = new Function(
    "Phaser", "BALANCE", "WORLD_WIDTH", "WORLD_HEIGHT", "centerCircularBody",
    "applyDisplayScalePreservingBody", "CHARACTER_DISPLAY_SCALE",
    `"use strict"; return ({${bossSource}}).spawnScp049Boss;`
  )(Phaser, BALANCE, 1920, 1080, () => {}, () => {}, CHARACTER_DISPLAY_SCALE);

  const ordinaryFeedback = [];
  const ordinary = {
    width: 24,
    height: 24,
    body: { width: 24, height: 24, setSize(width, height) { this.width = width; this.height = height; } },
    once() { return this; }
  };
  const ordinaryScene = {
    elapsedSurvivalMs: 1_000,
    enemyPresentation: { trackActor() { throw new Error("ordinary track failed"); } },
    combatFeedback: { trackActor(actor, options) { ordinaryFeedback.push({ actor, options }); } }
  };
  const ordinaryConfig = {
    type: "crawler", color: 0, speed: 10, behavior: "chase", xpReward: 1,
    contactDamage: 2, health: 3, bodyShape: "box", bodySize: 24
  };
  assert.doesNotThrow(() => initializeEnemyFromConfig.call(
    ordinaryScene,
    ordinary,
    ordinaryConfig,
    { healthMultiplier: 1, damageMultiplier: 1 },
    false
  ));
  assert.equal(ordinary._presentationId, 0);
  assert.equal(ordinaryFeedback.length, 1);

  const bossFeedback = [];
  const destroyListeners = new Map();
  const boss = {
    active: true,
    x: 0,
    y: 0,
    body: { width: 36, height: 36, setImmovable() {} },
    setDepth() { return this; },
    setCollideWorldBounds() { return this; },
    once(event, callback) { destroyListeners.set(event, callback); return this; }
  };
  const label = {
    active: true,
    setOrigin() { return this; }, setDepth() { return this; }, once() { return this; }, destroy() { this.active = false; }
  };
  const bossScene = {
    bossEnemy: null,
    isGameOver: false,
    player: { x: 500, y: 500 },
    elapsedSurvivalMs: 1_000,
    enemies: { create(x, y) { boss.x = x; boss.y = y; return boss; } },
    enemyPresentation: { trackActor() { throw new Error("Boss track failed"); } },
    combatFeedback: { trackActor(actor, options) { bossFeedback.push({ actor, options }); }, untrackActor() {} },
    add: { text() { return label; } },
    registerTransientEffect() {},
    cameras: { main: { shake() {} } },
    playSound() {},
    showTopBanner() {}
  };
  assert.doesNotThrow(() => spawnScp049Boss.call(bossScene));
  assert.equal(boss._presentationId, 0);
  assert.equal(bossFeedback.length, 1);
  assert.equal(bossScene.bossEnemy, boss);
  assert.equal(boss.bossState, "normal");
});

// Break caught: pause/resume failures leak into gameplay or terminal copies are cleared as transients.
test("pause resume and combat cleanup forward presentation calls independently", async () => {
  const { pauseGameplaySystems, resumeGameplaySystems, clearCombatEntities } = await loadSystemMethods(
    "pauseGameplaySystems",
    "resumeGameplaySystems",
    "clearCombatEntities"
  );
  const events = [];
  const enemies = [{ active: true }, { active: true }];
  const group = (name, children = []) => ({
    getChildren: () => children,
    clear(remove, destroy) {
      events.push(`clear:${name}:${remove}:${destroy}`);
      for (const child of children) child.active = false;
    }
  });
  const scene = {
    physics: { pause() { events.push("physics:pause"); }, resume() { events.push("physics:resume"); } },
    spawnEvent: { paused: false },
    regularSpawningActive: true,
    isGameOver: false,
    playerPresentation: { setPaused(value) { events.push(`player:${value}`); } },
    combatFeedback: {
      setPaused(value) { events.push(`feedback:${value}`); },
      untrackActor(actor) { events.push(`feedback-untrack:${enemies.indexOf(actor)}`); }
    },
    enemyPresentation: {
      setPaused(value) {
        events.push(`enemy-presentation:${value}`);
        if (value) throw new Error("presentation pause failure");
      },
      untrackActor(actor) { events.push(`presentation-untrack:${enemies.indexOf(actor)}`); }
    },
    enemies: group("enemies", enemies),
    enemyProjectiles: group("projectiles"),
    bullets: group("bullets"),
    xpGems: group("gems"),
    supplyPickups: group("pickups"),
    instabilityDecoys: group("decoys"),
    clearTransientEffects() { events.push("clear:transient"); }
  };
  assert.doesNotThrow(() => pauseGameplaySystems.call(scene));
  assert.doesNotThrow(() => resumeGameplaySystems.call(scene));
  assert.doesNotThrow(() => clearCombatEntities.call(scene));
  assert.deepEqual(events.filter((event) => event.startsWith("enemy-presentation:")), [
    "enemy-presentation:true",
    "enemy-presentation:false"
  ]);
  assert.deepEqual(events.filter((event) => event.startsWith("presentation-untrack:")), [
    "presentation-untrack:0",
    "presentation-untrack:1"
  ]);
  assert.ok(events.indexOf("clear:transient") < events.indexOf("presentation-untrack:0"));
});

// Break caught: teardown leaves a scene reference reachable or one cleanup failure strands later managers.
test("teardown clears enemy presentation first and isolates pause and destroy failures", async () => {
  const main = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const teardown = extractObjectMethod(main, "teardownManagers");
  const teardownManagers = new Function(`"use strict"; return ({${teardown}}).teardownManagers;`)();
  for (const failure of ["pause", "destroy"]) {
    const events = [];
    const scene = {
      playerPresentation: null,
      enemyPresentation: {
        setPaused(value) { events.push(`enemy:pause:${value}`); if (failure === "pause") throw new Error("pause"); },
        destroy() { events.push("enemy:destroy"); if (failure === "destroy") throw new Error("destroy"); }
      },
      combatFeedback: { setPaused() { events.push("feedback:pause"); }, destroy() { events.push("feedback:destroy"); } },
      audio: { destroy() { events.push("audio:destroy"); } },
      ui: { destroy() { events.push("ui:destroy"); } }
    };
    assert.doesNotThrow(() => teardownManagers.call(scene));
    assert.equal(scene.enemyPresentation, null);
    assert.deepEqual(events, [
      "enemy:pause:true",
      "enemy:destroy",
      "feedback:pause",
      "feedback:destroy",
      "audio:destroy",
      "ui:destroy"
    ]);
    assert.doesNotThrow(() => teardownManagers.call(scene));
    assert.equal(events.length, 6);
  }
});

// Break caught: factory routes register twice or registration occurs before fallback body setup is committed.
test("enemy and Boss factories track exactly once after fallback setup and untrack idempotently", async () => {
  const source = await readFile(new URL("../src/scene/enemies.js", import.meta.url), "utf8");
  const initializer = extractObjectMethod(source, "initializeEnemyFromConfig");
  const boss = extractObjectMethod(source, "spawnScp049Boss");
  assert.equal((initializer.match(/enemyPresentation\?\.trackActor\?\./g) ?? []).length, 1);
  assert.ok(initializer.indexOf("applyEnemyPresentation(this, enemy, config.type)") < initializer.indexOf("enemy._presentationId"));
  assert.match(initializer, /enemy\._presentationId\s*=\s*this\.enemyPresentation\?\.trackActor\?\.\(enemy,\s*\{\s*enemyType:\s*config\.type,\s*isBoss:\s*false/);
  assert.match(initializer, /enemy\.once\("destroy"[\s\S]*enemyPresentation\?\.untrackActor/);

  assert.equal((boss.match(/enemyPresentation\?\.trackActor\?\./g) ?? []).length, 1);
  const trackIndex = boss.indexOf("boss._presentationId");
  assert.ok(trackIndex > boss.indexOf("centerCircularBody(boss, 18)"));
  assert.ok(trackIndex > boss.indexOf("boss.body.setImmovable(true)"));
  assert.ok(trackIndex < boss.indexOf("this.combatFeedback.trackActor"));
  assert.match(boss, /enemyType:\s*"scp049",\s*isBoss:\s*true/);
  assert.match(boss, /boss\.once\("destroy"[\s\S]*enemyPresentation\?\.untrackActor/);
});

// Break caught: legacy fallback rewrites health, AI, body or timers rather than display only.
test("legacy enemy death fallback is presentation-only", async () => {
  const source = await readFile(new URL("../src/scene/enemies.js", import.meta.url), "utf8");
  const fallback = extractObjectMethod(source, "playLegacyEnemyDeathVisual");
  assert.match(fallback, /tweens\.add/);
  assert.doesNotMatch(fallback, /health|moveSpeed|contactDamage|projectileDamage|nextShotAtMs|bossState|canSplit|\.body\.|localStorage/);
  assert.doesNotMatch(fallback, /isDying\s*=|setVelocity|body\.enable/);
});
