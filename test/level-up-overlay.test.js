import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";
import { META_PERKS, loadMetaProgress, saveMetaProgress } from "../src/config/meta.js";
import { TEXTURES } from "../src/assets/manifest.js";
import { menusMixin } from "../src/scene/menus.js";
import { createTerminalButton } from "../src/ui/tacticalUi.js";
import {
  createTerminalCard,
  createTerminalOverlay
} from "../src/ui/terminalOverlay.js";
import { UPGRADE_PRESENTATION } from "../src/ui/upgradePresentation.js";

const TEST_UPGRADES = ["moveSpeed", "damage", "pistolBoomerang"].map((key) =>
  UPGRADE_DEFINITIONS.find((upgrade) => upgrade.key === key)
);

function createTrackedChoices(label) {
  return TEST_UPGRADES.map((definition, index) => {
    let trackedUpgrade = null;
    trackedUpgrade = {
      ...definition,
      name: `${definition.name} / ${label}-${index + 1}`,
      apply(scene) {
        scene.appliedUpgradeObjects.push(trackedUpgrade);
      }
    };
    return trackedUpgrade;
  });
}

function stripImports(source) {
  return source.replace(/import[\s\S]*?from\s+["'][^"']+["'];\s*/g, "");
}

async function loadProgressionMixin() {
  globalThis.__levelUpProgressionDeps = {
    Phaser: {
      Math: {
        Distance: { Between: () => 0 },
        Angle: { Between: () => 0 },
        FloatBetween: () => 0,
        Between: () => 0,
        Clamp: (value, min, max) => Math.max(min, Math.min(max, value))
      },
      Utils: { Array: { Shuffle: (values) => values } }
    },
    DEBUG_MODE: false,
    GAME_WIDTH: 960,
    GAME_HEIGHT: 540,
    WORLD_WIDTH: 2400,
    WORLD_HEIGHT: 1800,
    ENEMY_GRID_CELL_SIZE: 96,
    ENEMY_GRID_STRIDE: 32,
    BALANCE,
    UPGRADE_DEFINITIONS,
    META_PERKS,
    loadMetaProgress,
    saveMetaProgress,
    TEXTURES,
    createTerminalButton,
    createTerminalCard,
    createTerminalOverlay,
    UPGRADE_PRESENTATION
  };
  const source = await readFile(new URL("../src/scene/progression.js", import.meta.url), "utf8");
  const injected = `
    const {
      Phaser, DEBUG_MODE, GAME_WIDTH, GAME_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT,
      ENEMY_GRID_CELL_SIZE, ENEMY_GRID_STRIDE, BALANCE, UPGRADE_DEFINITIONS,
      META_PERKS, loadMetaProgress, saveMetaProgress, TEXTURES,
      createTerminalButton, createTerminalCard, createTerminalOverlay,
      UPGRADE_PRESENTATION
    } = globalThis.__levelUpProgressionDeps;
  `;
  const executable = `${injected}\n${stripImports(source)}`;
  return import(`data:text/javascript;base64,${Buffer.from(executable).toString("base64")}`);
}

const { progressionMixin } = await loadProgressionMixin();

function parseFontSize(value) {
  const parsed = Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function createEmitter(target = {}) {
  const handlers = new Map();
  Object.assign(target, {
    on(event, handler, context) {
      handlers.set(event, [...(handlers.get(event) ?? []), { handler, context }]);
      return this;
    },
    off(event, handler, context) {
      if (handler === undefined) {
        handlers.delete(event);
        return this;
      }
      const retained = (handlers.get(event) ?? []).filter(
        (entry) => entry.handler !== handler || (context !== undefined && entry.context !== context)
      );
      if (retained.length) handlers.set(event, retained);
      else handlers.delete(event);
      return this;
    },
    emit(event, ...args) {
      for (const { handler, context } of [...(handlers.get(event) ?? [])]) {
        handler.apply(context ?? this, args);
      }
      return this;
    },
    removeAllListeners(event) {
      if (event === undefined) handlers.clear();
      else handlers.delete(event);
      return this;
    }
  });
  Object.defineProperty(target, "listenerCount", {
    get: () => [...handlers.values()].reduce((count, entries) => count + entries.length, 0)
  });
  return target;
}

function createDisplayObject(scene, type, properties = {}) {
  const object = createEmitter({
    type,
    active: true,
    destroyed: false,
    interactive: false,
    visible: true,
    alpha: 1,
    parentContainer: null,
    calls: [],
    ...properties,
    setDepth(value) { this.depth = value; return this; },
    setScrollFactor(value) { this.scrollFactor = value; return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setOrigin(...value) { this.origin = value; return this; },
    setAlpha(value) { this.alpha = value; return this; },
    setVisible(value) { this.visible = value === true; return this; },
    setDisplaySize(width, height) { this.displayWidth = width; this.displayHeight = height; return this; },
    setInteractive(options) { this.interactive = true; this.interactiveOptions = options; return this; },
    disableInteractive() { this.interactive = false; return this; },
    removeInteractive() { this.interactive = false; return this; },
    setStrokeStyle(...args) { this.calls.push(["setStrokeStyle", ...args]); return this; },
    setFillStyle(...args) { this.calls.push(["setFillStyle", ...args]); return this; },
    setStyle(style) { this.style = { ...this.style, ...style }; return this; },
    setFontSize(value) {
      this.style = { ...this.style, fontSize: typeof value === "number" ? `${value}px` : value };
      return this;
    },
    setColor(value) { this.style = { ...this.style, color: value }; return this; },
    setText(value) { this.text = String(value ?? ""); return this; },
    clear() { this.calls.push(["clear"]); return this; },
    fillStyle(...args) { this.calls.push(["fillStyle", ...args]); return this; },
    lineStyle(...args) { this.calls.push(["lineStyle", ...args]); return this; },
    beginPath() { this.calls.push(["beginPath"]); return this; },
    moveTo(...args) { this.calls.push(["moveTo", ...args]); return this; },
    lineTo(...args) { this.calls.push(["lineTo", ...args]); return this; },
    closePath() { this.calls.push(["closePath"]); return this; },
    fillPath() { this.calls.push(["fillPath"]); return this; },
    strokePath() { this.calls.push(["strokePath"]); return this; },
    fillCircle(...args) { this.calls.push(["fillCircle", ...args]); return this; },
    strokeCircle(...args) { this.calls.push(["strokeCircle", ...args]); return this; },
    fillRect(...args) { this.calls.push(["fillRect", ...args]); return this; },
    lineBetween(...args) { this.calls.push(["lineBetween", ...args]); return this; },
    getBounds() {
      if (this.type !== "text") {
        return { width: this.displayWidth ?? this.width ?? 0, height: this.displayHeight ?? this.height ?? 0 };
      }
      const fontSize = parseFontSize(this.style?.fontSize);
      const wrapWidth = this.style?.wordWrap?.width;
      const rawWidth = [...String(this.text ?? "")].reduce(
        (width, character) => width + (character.codePointAt(0) > 255 ? fontSize : fontSize * 0.58),
        0
      );
      const lines = wrapWidth ? Math.max(1, Math.ceil(rawWidth / wrapWidth)) : 1;
      const visibleLines = Math.min(lines, this.style?.maxLines ?? lines);
      return {
        width: wrapWidth ? Math.min(wrapWidth, rawWidth) : rawWidth,
        height: visibleLines * (fontSize + Number(this.style?.lineSpacing ?? 0) + 2)
      };
    },
    destroy() {
      if (this.destroyed) return this;
      if (this.list) {
        for (const child of [...this.list]) child.destroy?.();
      }
      this.parentContainer?.onChildDestroyed?.(this);
      this.emit("destroy", this, false);
      this.removeAllListeners();
      this.active = false;
      this.destroyed = true;
      return this;
    }
  });

  if (type === "container") {
    object.list = [];
    object.onChildDestroyed = function onChildDestroyed(child) {
      this.list = this.list.filter((candidate) => candidate !== child);
      if (child.parentContainer === this) child.parentContainer = null;
    };
    object.add = function add(children) {
      for (const child of Array.isArray(children) ? children : [children]) {
        child.parentContainer?.onChildDestroyed?.(child);
        if (!this.list.includes(child)) this.list.push(child);
        child.parentContainer = this;
      }
      return this;
    };
  }
  scene.created.push(object);
  return object;
}

function worldPosition(object) {
  let x = object.x ?? 0;
  let y = object.y ?? 0;
  for (let parent = object.parentContainer; parent; parent = parent.parentContainer) {
    x += parent.x ?? 0;
    y += parent.y ?? 0;
  }
  return { x, y };
}

function isOwnedBy(object, container) {
  if (object === container) return true;
  for (let parent = object.parentContainer; parent; parent = parent.parentContainer) {
    if (parent === container) return true;
  }
  return false;
}

function createScene(options = {}) {
  const addCounts = new Map();
  const failureState = { terminalFailed: false, terminalButtonFailed: false };
  const scene = {
    created: [],
    delayedCalls: [],
    pauseCount: 0,
    resumeCount: 0,
    hideBuildPanelCount: 0,
    updateCount: 0,
    sounds: [],
    appliedUpgradeObjects: [],
    isGameOver: false,
    isLevelUpActive: false,
    isResolvingLevelUp: false,
    _levelUpPresentationUnavailable: false,
    pendingLevelUps: options.pendingLevelUps ?? 1,
    rerollsRemaining: options.rerollsRemaining ?? 1,
    health: options.health ?? 40,
    maxHealth: options.maxHealth ?? 100,
    playerMoveSpeed: 100,
    pickupRadius: 80,
    selectedWeaponId: "pistol",
    weaponMutations: { pistolBoomerang: false, breacherExplosive: false, teslaField: false },
    elapsedSurvivalMs: 0,
    teslaFieldNextTickAtMs: 0,
    weapons: {
      pistol: { damage: 10, currentLevel: 2 },
      shotgun: { currentLevel: 0 },
      tesla: { currentLevel: 0 }
    },
    upgradeLevels: Object.fromEntries(UPGRADE_DEFINITIONS.map(({ key }) => [key, 0])),
    currentXp: 0,
    xpToNextLevel: 10,
    level: 1,
    scale: { width: 960, height: 540 },
    cameras: { main: { width: 960, height: 540, scrollX: 120, scrollY: 80 } },
    textures: { exists: () => true },
    transientEffects: new Set(),
    regularSpawningActive: true,
    spawnEvent: { paused: false },
    hideBuildPanel() { this.hideBuildPanelCount += 1; },
    pauseGameplaySystems() { this.pauseCount += 1; this.physicsPaused = true; },
    resumeGameplaySystems() { this.resumeCount += 1; this.physicsPaused = false; },
    updateUI() { this.updateCount += 1; },
    playSound(name) { this.sounds.push(name); },
    syncCombatStatsFromWeapons() { this.syncCombatCount = (this.syncCombatCount ?? 0) + 1; },
    getRequiredXpForLevel() { return 10; },
    time: {
      delayedCall(delay, callback) {
        scene.delayedCalls.push({ delay, callback });
        return { remove() {} };
      }
    },
    tweens: {
      add(config) {
        return { config, remove() {} };
      }
    }
  };

  const shouldFail = (type, occurrence, args) => {
    if (options.failTerminal === "overlay" && type === "tileSprite" && occurrence === 1) {
      failureState.terminalFailed = true;
      return true;
    }
    const failedCardImageOccurrence = options.failTerminalCardAtImageOccurrence
      ?? (options.failTerminal === "card" ? 1 : null);
    if (type === "image" && occurrence === failedCardImageOccurrence) {
      failureState.terminalFailed = true;
      return true;
    }
    if (
      options.failTerminal === "button"
      && !failureState.terminalButtonFailed
      && type === "rectangle"
      && args[2] === 200
      && args[3] === 46
    ) {
      failureState.terminalFailed = true;
      failureState.terminalButtonFailed = true;
      return true;
    }
    return options.failLegacy === true && failureState.terminalFailed && type === "rectangle";
  };
  const add = (type, factory) => (...args) => {
    const occurrence = (addCounts.get(type) ?? 0) + 1;
    addCounts.set(type, occurrence);
    if (shouldFail(type, occurrence, args)) throw new Error(`forced ${type} failure`);
    return factory(...args);
  };
  scene.add = {
    container: add("container", (x, y) => createDisplayObject(scene, "container", { x, y })),
    graphics: add("graphics", () => createDisplayObject(scene, "graphics")),
    rectangle: add("rectangle", (x, y, width, height, fill, alpha) =>
      createDisplayObject(scene, "rectangle", { x, y, width, height, fill, alpha })
    ),
    text: add("text", (x, y, text, style) =>
      createDisplayObject(scene, "text", { x, y, text: String(text ?? ""), style: { ...style } })
    ),
    image: add("image", (x, y, textureKey) =>
      createDisplayObject(scene, "image", { x, y, textureKey })
    ),
    tileSprite: add("tileSprite", (x, y, width, height, textureKey) =>
      createDisplayObject(scene, "tileSprite", { x, y, width, height, textureKey })
    )
  };
  scene.addCounts = addCounts;
  scene.choiceSets = options.choiceSets ?? [TEST_UPGRADES];
  scene.choiceCallCount = 0;
  Object.assign(scene, progressionMixin);
  const renderLegacyLevelUpCards = scene.renderLegacyLevelUpCards;
  scene.legacyChoiceArrays = [];
  scene.renderLegacyLevelUpCards = function renderTrackedLegacyLevelUpCards(choices) {
    this.legacyChoiceArrays.push(choices);
    return renderLegacyLevelUpCards.call(this, choices);
  };
  scene.getLevelUpChoices = function getLevelUpChoices() {
    const index = Math.min(this.choiceCallCount, this.choiceSets.length - 1);
    this.choiceCallCount += 1;
    return this.choiceSets[index];
  };
  return scene;
}

function runNextDelay(scene, expectedDelay) {
  const delayed = scene.delayedCalls.shift();
  assert.equal(delayed?.delay, expectedDelay);
  delayed.callback();
}

function findText(objects, value) {
  return objects.find((object) => object.type === "text" && object.text === value);
}

test("showLevelUpOverlay builds three world-space terminal card controllers from real upgrade data", () => {
  const scene = createScene();
  scene.upgradeLevels.moveSpeed = 3;

  scene.showLevelUpOverlay();

  assert.equal(scene.isLevelUpActive, true);
  assert.equal(scene.hideBuildPanelCount, 1);
  assert.equal(scene.pauseCount, 1);
  assert.ok(scene.levelUpOverlayController);
  assert.equal(scene.levelUpOverlay, scene.levelUpOverlayController.container);
  assert.deepEqual(
    { x: scene.levelUpOverlay.x, y: scene.levelUpOverlay.y },
    { x: scene.cameras.main.scrollX, y: scene.cameras.main.scrollY }
  );
  assert.equal(scene.levelUpCards.length, 3);
  assert.equal(scene.choiceCallCount, 1);
  assert.equal(scene.levelUpCards.every((card) => typeof card.disableInteractive === "function"), true);
  assert.equal(
    scene.levelUpCards.every((card) =>
      card.hitArea.width === 220
      && card.hitArea.height === 230
      && card.objects.every((object) => object.parentContainer === scene.levelUpOverlayController.content)
    ),
    true
  );

  TEST_UPGRADES.forEach((upgrade, index) => {
    const card = scene.levelUpCards[index];
    assert.equal(card.icon.textureKey, UPGRADE_PRESENTATION[upgrade.key].textureKey);
    assert.ok(findText(card.objects, upgrade.name));
    assert.ok(findText(card.objects, upgrade.description));
    assert.ok(findText(card.objects, UPGRADE_PRESENTATION[upgrade.key].riskLabel ?? ""));
  });
  assert.ok(findText(scene.levelUpCards[0].objects, "当前：Lv 3"));
  assert.ok(findText(scene.levelUpCards[1].objects, "当前：Lv 2"));

  const beforeHit = worldPosition(scene.levelUpCards[0].hitArea);
  const beforeIcon = worldPosition(scene.levelUpCards[0].icon);
  scene.levelUpOverlay.setPosition(300, 210);
  const afterHit = worldPosition(scene.levelUpCards[0].hitArea);
  const afterIcon = worldPosition(scene.levelUpCards[0].icon);
  assert.deepEqual(
    { x: afterHit.x - beforeHit.x, y: afterHit.y - beforeHit.y },
    { x: 180, y: 130 }
  );
  assert.deepEqual(
    { x: afterIcon.x - beforeIcon.x, y: afterIcon.y - beforeIcon.y },
    { x: 180, y: 130 }
  );
});

for (const terminalFailure of ["card", "button"]) {
  test(`initial terminal ${terminalFailure} failure reuses one exact choice array in the legacy fallback`, () => {
    const originalChoices = createTrackedChoices(`${terminalFailure}-original`);
    const replacementChoices = createTrackedChoices(`${terminalFailure}-replacement`);
    const scene = createScene({
      failTerminal: terminalFailure,
      choiceSets: [originalChoices, replacementChoices]
    });

    scene.showLevelUpOverlay();

    assert.equal(scene.choiceCallCount, 1);
    assert.equal(scene.legacyChoiceArrays[0], originalChoices);
    assert.equal(scene.levelUpOverlayController, null);
    originalChoices.forEach((upgrade) => {
      assert.ok(findText(scene.levelUpCardObjects, upgrade.name));
    });
    replacementChoices.forEach((upgrade) => {
      assert.equal(findText(scene.levelUpCardObjects, upgrade.name), undefined);
    });

    scene.levelUpCards[0].emit("pointerdown");
    assert.equal(scene.appliedUpgradeObjects[0], originalChoices[0]);
  });
}

test("reroll uses a 200 by 46 pointerdown terminal button and releases old card listeners", () => {
  const nextChoices = [TEST_UPGRADES[2], TEST_UPGRADES[0], TEST_UPGRADES[1]];
  const scene = createScene({ choiceSets: [TEST_UPGRADES, nextChoices], rerollsRemaining: 1 });
  scene.showLevelUpOverlay();
  const oldCards = [...scene.levelUpCards];
  const rerollHit = scene.levelUpOverlayController.content.list.find(
    (object) => object.type === "rectangle" && object.width === 200 && object.height === 46 && object.x < 480
  );
  assert.ok(rerollHit);

  rerollHit.emit("pointerdown");

  assert.equal(scene.rerollsRemaining, 0);
  assert.equal(scene.choiceCallCount, 2);
  assert.equal(scene.levelUpCards.length, 3);
  assert.equal(oldCards.every((card) => card.objects.every(({ destroyed }) => destroyed)), true);
  assert.equal(oldCards.every((card) => card.objects.every(({ listenerCount }) => listenerCount === 0)), true);
  assert.equal(oldCards.some((card) => scene.levelUpCards.includes(card)), false);
  assert.equal(rerollHit.interactive, false);
  rerollHit.emit("pointerdown");
  assert.equal(scene.choiceCallCount, 2, "disabled reroll cannot activate again");
});

test("reroll terminal card failure reuses that reroll's exact choices in the legacy fallback", () => {
  const initialChoices = createTrackedChoices("initial");
  const rerolledChoices = createTrackedChoices("rerolled");
  const replacementChoices = createTrackedChoices("replacement");
  const scene = createScene({
    choiceSets: [initialChoices, rerolledChoices, replacementChoices],
    rerollsRemaining: 1,
    failTerminalCardAtImageOccurrence: 4
  });
  scene.showLevelUpOverlay();
  const rerollHit = scene.levelUpOverlayController.content.list.find(
    (object) => object.type === "rectangle" && object.width === 200 && object.height === 46 && object.x < 480
  );

  rerollHit.emit("pointerdown");

  assert.equal(scene.choiceCallCount, 2);
  assert.equal(scene.legacyChoiceArrays[0], rerolledChoices);
  assert.equal(scene.levelUpOverlayController, null);
  rerolledChoices.forEach((upgrade) => {
    assert.ok(findText(scene.levelUpCardObjects, upgrade.name));
  });
  replacementChoices.forEach((upgrade) => {
    assert.equal(findText(scene.levelUpCardObjects, upgrade.name), undefined);
  });

  scene.levelUpCards[0].emit("pointerdown");
  assert.equal(scene.appliedUpgradeObjects[0], rerolledChoices[0]);
});

test("apply keeps selected feedback, upgrade levels, weapon currentLevel, pending, and 160ms sequencing", () => {
  const scene = createScene({ pendingLevelUps: 2 });
  scene.showLevelUpOverlay();
  assert.equal(scene.choiceCallCount, 1);
  const damageCard = scene.levelUpCards[1];
  const states = [];
  const setState = damageCard.setState;
  damageCard.setState = (state) => {
    states.push(state);
    setState(state);
  };

  damageCard.hitArea.emit("pointerdown");

  assert.deepEqual(states, ["selected"]);
  assert.equal(scene.weapons.pistol.damage, 10 * BALANCE.upgrades.damageMultiplier);
  assert.equal(scene.upgradeLevels.damage, 1);
  assert.equal(scene.weapons.pistol.currentLevel, 3);
  assert.equal(scene.pendingLevelUps, 1);
  assert.equal(scene.isResolvingLevelUp, true);
  assert.equal(scene.levelUpCards.every((card) => card.hitArea.interactive === false), true);
  runNextDelay(scene, 160);
  assert.equal(scene.isLevelUpActive, true);
  assert.equal(scene.pendingLevelUps, 1);
  assert.equal(scene.resumeCount, 0);
  assert.equal(scene.levelUpCards.length, 3);
  assert.equal(scene.choiceCallCount, 2);

  scene.levelUpCards[0].hitArea.emit("pointerdown");
  assert.equal(scene.pendingLevelUps, 0);
  runNextDelay(scene, 160);
  assert.equal(scene.isLevelUpActive, false);
  assert.equal(scene.isResolvingLevelUp, false);
  assert.equal(scene.resumeCount, 1);
  assert.equal(scene.levelUpOverlay, null);
  assert.equal(scene.levelUpOverlayController, null);
});

test("skip heals by the frozen amount, consumes one pending level, and resumes only after 120ms", () => {
  const scene = createScene({ pendingLevelUps: 1, health: 95, maxHealth: 100 });
  scene.showLevelUpOverlay();
  const skipHit = scene.levelUpOverlayController.content.list.find(
    (object) => object.type === "rectangle" && object.width === 200 && object.height === 46 && object.x > 480
  );

  skipHit.emit("pointerdown");

  assert.equal(scene.health, 100);
  assert.equal(scene.pendingLevelUps, 0);
  assert.equal(scene.resumeCount, 0);
  assert.equal(scene.isResolvingLevelUp, true);
  runNextDelay(scene, 120);
  assert.equal(scene.isLevelUpActive, false);
  assert.equal(scene.isResolvingLevelUp, false);
  assert.equal(scene.resumeCount, 1);
});

for (const failure of ["overlay", "card"]) {
  test(`terminal ${failure} construction failure rolls back before the legacy overlay`, () => {
    const scene = createScene({ failTerminal: failure });

    scene.showLevelUpOverlay();

    assert.equal(scene._levelUpPresentationUnavailable, false);
    assert.equal(scene.isLevelUpActive, true);
    assert.equal(scene.levelUpOverlayController, null);
    assert.ok(scene.levelUpOverlay?.active);
    assert.equal(scene.levelUpCards.length, 3);
    assert.equal(scene.choiceCallCount, 1);
    assert.equal(scene.levelUpCards.every((card) => card.type === "rectangle"), true);
    assert.equal(
      scene.created.every((object) => object.destroyed || isOwnedBy(object, scene.levelUpOverlay)),
      true
    );

    scene.levelUpCards[0].emit("pointerdown");
    assert.equal(scene.pendingLevelUps, 0);
    runNextDelay(scene, 160);
    assert.equal(scene.resumeCount, 1);
    assert.equal(scene.levelUpOverlay, null);
  });
}

test("double presentation failure locks retries for ten frames without losing pending or pause balance", () => {
  const scene = createScene({ failTerminal: "overlay", failLegacy: true, pendingLevelUps: 2 });

  scene.showLevelUpOverlay();

  assert.equal(scene._levelUpPresentationUnavailable, true);
  assert.equal(scene.pendingLevelUps, 2);
  assert.equal(scene.isLevelUpActive, false);
  assert.equal(scene.isResolvingLevelUp, false);
  assert.equal(scene.physicsPaused, false);
  assert.equal(scene.pauseCount, 1);
  assert.equal(scene.resumeCount, 1);
  assert.equal(scene.levelUpOverlay, null);
  assert.equal(scene.levelUpOverlayController, null);
  const tileAttempts = scene.addCounts.get("tileSprite");

  for (let frame = 0; frame < 10; frame += 1) scene.addExperience(0);

  assert.equal(scene.addCounts.get("tileSprite"), tileAttempts);
  assert.equal(scene.pauseCount, 1);
  assert.equal(scene.resumeCount, 1);
  assert.equal(scene.pendingLevelUps, 2);
});

test("PrototypeScene.create resets the presentation failure lock on a reused scene instance", async () => {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  let capturedConfig = null;
  class Scene {}
  class AudioManager {}
  class UIManager {}
  const emptyMixin = {};
  globalThis.__levelUpMainDeps = {
    Phaser: {
      Scene,
      AUTO: "AUTO",
      Game: class Game { constructor(config) { capturedConfig = config; } },
      Math: { Between: () => 100 },
      Scenes: { Events: { SHUTDOWN: "shutdown", DESTROY: "destroy" } }
    },
    PreloadScene: class PreloadScene {},
    AudioManager,
    UIManager,
    menusMixin: emptyMixin,
    enemiesMixin: emptyMixin,
    weaponsMixin: emptyMixin,
    combatMixin: emptyMixin,
    effectsMixin: emptyMixin,
    progressionMixin: emptyMixin,
    hudMixin: emptyMixin,
    timelineMixin: emptyMixin,
    worldMixin: emptyMixin,
    systemsMixin: emptyMixin,
    syncCharacterPresentation() {},
    DEBUG_MODE: false,
    GAME_WIDTH: 960,
    GAME_HEIGHT: 540,
    WORLD_WIDTH: 2400,
    WORLD_HEIGHT: 1800,
    ENEMY_GRID_CELL_SIZE: 96,
    ENEMY_GRID_STRIDE: 32,
    BALANCE,
    UPGRADE_DEFINITIONS,
    META_PERKS,
    loadMetaProgress: () => ({ credits: 0, perks: {} }),
    saveMetaProgress() {}
  };
  const injected = `
    const {
      Phaser, PreloadScene, AudioManager, UIManager, menusMixin, enemiesMixin,
      weaponsMixin, combatMixin, effectsMixin, progressionMixin, hudMixin,
      timelineMixin, worldMixin, systemsMixin, syncCharacterPresentation,
      DEBUG_MODE, GAME_WIDTH, GAME_HEIGHT, WORLD_WIDTH, WORLD_HEIGHT,
      ENEMY_GRID_CELL_SIZE, ENEMY_GRID_STRIDE, BALANCE, UPGRADE_DEFINITIONS,
      META_PERKS, loadMetaProgress, saveMetaProgress
    } = globalThis.__levelUpMainDeps;
  `;
  const executable = `${injected}\n${stripImports(source)}\nexport { PrototypeScene };`;
  const { PrototypeScene } = await import(
    `data:text/javascript;base64,${Buffer.from(executable).toString("base64")}`
  );
  assert.ok(capturedConfig);

  const scene = new PrototypeScene();
  Object.assign(scene, {
    _levelUpPresentationUnavailable: true,
    events: { off() {}, once() {} },
    physics: { world: { setBounds() {} } },
    cameras: { main: { setBounds() {}, setBackgroundColor() {} } },
    getRequiredXpForLevel: () => 10,
    initWeapons() {},
    createPlaceholderTextures() {},
    createArenaDecoration() {},
    createPlayer() {},
    createGroups() {},
    createColliders() {},
    createUI() {},
    createBuildPanel() { this.buildPanel = { visible: false }; },
    setupInputHandlers() {},
    createStartScreen() {},
    updateUI() {}
  });

  scene.create();

  assert.equal(scene._levelUpPresentationUnavailable, false);
});

test("menus teardown and return-to-title destroy terminal and legacy level-up ownership safely", () => {
  const terminalScene = createScene();
  Object.assign(terminalScene, menusMixin, {
    scene: { restart() { terminalScene.restartCount = (terminalScene.restartCount ?? 0) + 1; } },
    hidePauseOverlay() {},
    clearCombatEntities() {},
    clearFacilitySystems() {},
    hideBuildPanel() {},
    pickupRadiusIndicator: { clear() {} },
    activeStimUntilMs: 10,
    moveSpeedBuffMultiplier: 2,
    isPaused: true
  });
  terminalScene.showLevelUpOverlay();
  const terminalController = terminalScene.levelUpOverlayController;
  terminalScene.freezeForGameOver();
  assert.equal(terminalController.objects.every(({ destroyed }) => destroyed), true);
  assert.equal(terminalScene.levelUpOverlayController, null);
  assert.equal(terminalScene.levelUpOverlay, null);

  const legacyScene = createScene({ failTerminal: "overlay" });
  Object.assign(legacyScene, menusMixin, {
    scene: { restart() { legacyScene.restartCount = (legacyScene.restartCount ?? 0) + 1; } },
    hidePauseOverlay() {},
    isPaused: true
  });
  legacyScene.showLevelUpOverlay();
  const legacyOverlay = legacyScene.levelUpOverlay;
  legacyScene.quitToTitle();
  assert.equal(legacyOverlay.destroyed, true);
  assert.equal(legacyScene.levelUpOverlay, null);
  assert.equal(legacyScene.restartCount, 1);
});
