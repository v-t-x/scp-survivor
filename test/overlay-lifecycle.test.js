import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";
import { META_PERKS, loadMetaProgress, saveMetaProgress } from "../src/config/meta.js";
import { TEXTURES } from "../src/assets/manifest.js";
import { HUD_REGIONS } from "../src/art/openingVisualContract.js";
import { menusMixin } from "../src/scene/menus.js";
import {
  getHudPresentation,
  selectTimelineHudContainers
} from "../src/ui/hudPresentation.js";
import { THEME } from "../src/ui/theme.js";
import { createTacticalHudView } from "../src/ui/tacticalHudView.js";
import {
  createStatusLamp,
  createTacticalPanel,
  createTerminalButton
} from "../src/ui/tacticalUi.js";
import {
  createTerminalCard,
  createTerminalOverlay
} from "../src/ui/terminalOverlay.js";
import { UPGRADE_PRESENTATION } from "../src/ui/upgradePresentation.js";

const SHUTDOWN = "shutdown";
const DESTROY = "destroy";
const PHASER_STUB = Object.freeze({
  Scenes: { Events: { SHUTDOWN, DESTROY } },
  Math: {
    Distance: { Between: () => 0 },
    Angle: { Between: () => 0 },
    FloatBetween: () => 0,
    Between: () => 0,
    Clamp: (value, min, max) => Math.max(min, Math.min(max, value))
  },
  Utils: { Array: { Shuffle: (values) => values } }
});
const LEVEL_UP_CHOICES = ["moveSpeed", "damage", "pistolBoomerang"].map((key) =>
  UPGRADE_DEFINITIONS.find((upgrade) => upgrade.key === key)
);

async function loadHudMixin() {
  const source = await readFile(new URL("../src/scene/hud.js", import.meta.url), "utf8");
  const declaration = "export const hudMixin =";
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1, "hud mixin export must exist");
  const body = source.slice(start).replace(declaration, "const hudMixin =");
  return Function(
    "Phaser", "GAME_WIDTH", "GAME_HEIGHT", "BALANCE", "UPGRADE_DEFINITIONS",
    "HUD_REGIONS", "TEXTURES", "getHudPresentation", "selectTimelineHudContainers",
    "THEME", "createTacticalHudView", "createStatusLamp", "createTacticalPanel",
    "createTerminalOverlay", "UPGRADE_PRESENTATION", "HUD_DEPTH", "FACILITY_HUD_DEPTH",
    "HEALTH_BAR_WIDTH", "XP_BAR_WIDTH", "WEAPON_STATUS_BAR_WIDTH", "DASH_BAR_WIDTH",
    `${body}\nreturn hudMixin;`
  )(
    PHASER_STUB, 960, 540, BALANCE, UPGRADE_DEFINITIONS, HUD_REGIONS, TEXTURES,
    getHudPresentation, selectTimelineHudContainers, THEME, createTacticalHudView,
    createStatusLamp, createTacticalPanel, createTerminalOverlay, UPGRADE_PRESENTATION,
    45, 58, 150, 82, 92, 72
  );
}

async function loadProgressionMixin() {
  const source = await readFile(new URL("../src/scene/progression.js", import.meta.url), "utf8");
  const declaration = "export const progressionMixin =";
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1, "progression mixin export must exist");
  const body = source.slice(start).replace(declaration, "const progressionMixin =");
  return Function(
    "Phaser", "DEBUG_MODE", "GAME_WIDTH", "GAME_HEIGHT", "WORLD_WIDTH", "WORLD_HEIGHT",
    "ENEMY_GRID_CELL_SIZE", "ENEMY_GRID_STRIDE", "BALANCE", "UPGRADE_DEFINITIONS",
    "META_PERKS", "loadMetaProgress", "saveMetaProgress", "TEXTURES",
    "createTerminalButton", "createTerminalCard", "createTerminalOverlay",
    "UPGRADE_PRESENTATION", `${body}\nreturn progressionMixin;`
  )(
    PHASER_STUB, false, 960, 540, 2_400, 1_800, 96, 32, BALANCE,
    UPGRADE_DEFINITIONS, META_PERKS, loadMetaProgress, saveMetaProgress, TEXTURES,
    createTerminalButton, createTerminalCard, createTerminalOverlay, UPGRADE_PRESENTATION
  );
}

const hudMixin = await loadHudMixin();
const progressionMixin = await loadProgressionMixin();

function createSceneEmitter() {
  const handlers = new Map();
  const remove = (event, handler, context) => {
    const retained = (handlers.get(event) ?? []).filter(
      (entry) => entry.handler !== handler || entry.context !== context
    );
    if (retained.length > 0) handlers.set(event, retained);
    else handlers.delete(event);
  };
  return {
    off(event, handler, context) {
      remove(event, handler, context);
      return this;
    },
    once(event, handler, context) {
      handlers.set(event, [...(handlers.get(event) ?? []), { handler, context }]);
      return this;
    },
    emit(event, ...args) {
      for (const entry of [...(handlers.get(event) ?? [])]) {
        remove(event, entry.handler, entry.context);
        entry.handler.apply(entry.context, args);
      }
      return this;
    },
    listenerCount(event) {
      return (handlers.get(event) ?? []).length;
    }
  };
}

function createObjectEmitter(target = {}) {
  const handlers = new Map();
  const removeEntry = (event, targetEntry) => {
    const retained = (handlers.get(event) ?? []).filter((entry) => entry !== targetEntry);
    if (retained.length > 0) handlers.set(event, retained);
    else handlers.delete(event);
  };
  Object.assign(target, {
    on(event, handler, context) {
      handlers.set(event, [...(handlers.get(event) ?? []), { handler, context, once: false }]);
      return this;
    },
    once(event, handler, context) {
      handlers.set(event, [...(handlers.get(event) ?? []), { handler, context, once: true }]);
      return this;
    },
    off(event, handler, context, once) {
      if (handler === undefined) {
        handlers.delete(event);
        return this;
      }
      const retained = (handlers.get(event) ?? []).filter((entry) => {
        if (entry.handler !== handler) return true;
        if (context !== undefined && entry.context !== context) return true;
        if (once !== undefined && entry.once !== once) return true;
        return false;
      });
      if (retained.length > 0) handlers.set(event, retained);
      else handlers.delete(event);
      return this;
    },
    emit(event, ...args) {
      for (const entry of [...(handlers.get(event) ?? [])]) {
        if (!(handlers.get(event) ?? []).includes(entry)) continue;
        if (entry.once) removeEntry(event, entry);
        entry.handler.apply(entry.context ?? this, args);
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

function removeFromList(list, object) {
  const index = list?.indexOf(object) ?? -1;
  if (index >= 0) list.splice(index, 1);
}

function parseFontSize(value) {
  const parsed = Number.parseFloat(String(value ?? 0));
  return Number.isFinite(parsed) ? parsed : 0;
}

function createDisplayObject(scene, type, properties = {}) {
  const object = createObjectEmitter({
    type,
    active: true,
    destroyed: false,
    destroying: false,
    input: null,
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
    setTexture(textureKey) { this.textureKey = textureKey; this.texture = { key: textureKey }; return this; },
    setInteractive(options) {
      this.input ??= {};
      this.input.enabled = true;
      this.interactiveOptions = options;
      return this;
    },
    disableInteractive() { if (this.input) this.input.enabled = false; return this; },
    removeInteractive() { this.input = null; return this; },
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
    beginPath() { return this; },
    moveTo() { return this; },
    lineTo() { return this; },
    closePath() { return this; },
    fillPath() { return this; },
    strokePath() { return this; },
    fillCircle(...args) { this.calls.push(["fillCircle", ...args]); return this; },
    strokeCircle(...args) { this.calls.push(["strokeCircle", ...args]); return this; },
    fillRect(...args) { this.calls.push(["fillRect", ...args]); return this; },
    lineBetween(...args) { this.calls.push(["lineBetween", ...args]); return this; },
    fill() { return this; },
    erase() { return this; },
    draw() { return this; },
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
    onChildDestroyed(child) {
      removeFromList(this.list, child);
      if (child.parentContainer === this) child.parentContainer = null;
    },
    add(children) {
      const candidates = Array.isArray(children) ? children : [children];
      this.list ??= [];
      for (const child of candidates) {
        if (!child) continue;
        const previousParent = child.parentContainer;
        if (previousParent && previousParent !== this) {
          child.off("destroy", previousParent.onChildDestroyed, previousParent, true);
          removeFromList(previousParent.list, child);
        }
        removeFromList(scene.children.list, child);
        if (!this.list.includes(child)) {
          this.list.push(child);
          child.once("destroy", this.onChildDestroyed, this);
        }
        child.parentContainer = this;
      }
      return this;
    },
    destroy(destroyChildren = false) {
      if (this.destroyed) return this;
      this.destroying = true;
      if (destroyChildren) {
        for (const child of [...(this.list ?? [])]) child.destroy?.(true);
      } else {
        for (const child of [...(this.list ?? [])]) {
          child.off("destroy", this.onChildDestroyed, this, true);
          child.parentContainer = null;
          if (!scene.children.list.includes(child)) scene.children.list.push(child);
        }
      }
      if (this.list) this.list.length = 0;
      this.emit("destroy", this, false);
      this.removeAllListeners();
      removeFromList(scene.children.list, this);
      if (this.input) this.input.enabled = false;
      this.input = null;
      this.active = false;
      this.destroyed = true;
      this.destroying = false;
      return this;
    }
  });

  if (type === "container") object.list = [];
  scene.children.list.push(object);
  scene.created.push(object);
  return object;
}

function createScene() {
  const scene = {
    events: createSceneEmitter(),
    children: { list: [] },
    created: [],
    tweensCreated: [],
    timersCreated: [],
    scale: { width: 960, height: 540 },
    cameras: { main: { width: 960, height: 540, scrollX: 180, scrollY: 120 } },
    textures: { exists: () => true },
    player: { x: 400, y: 260 },
    isMissionActive: true,
    isGameOver: false,
    isVictory: false,
    isPaused: false,
    isLevelUpActive: false,
    isResolvingLevelUp: false,
    _levelUpPresentationUnavailable: false,
    pendingLevelUps: 1,
    rerollsRemaining: 1,
    soundMuted: false,
    health: 80,
    maxHealth: 100,
    level: 2,
    currentXp: 3,
    xpToNextLevel: 12,
    killCount: 37,
    elapsedSurvivalMs: 73_400,
    lastRunCreditsEarned: 42,
    meta: { credits: 314, perks: {} },
    selectedWeaponId: "pistol",
    playerMoveSpeed: 120,
    projectileCount: 2,
    bulletPenetration: 1,
    pickupRadius: 90,
    weaponMutations: {
      pistolBoomerang: false,
      breacherExplosive: false,
      teslaField: false
    },
    weapons: {
      pistol: {
        name: "基金会勤务手枪",
        unlocked: true,
        currentLevel: 2,
        damage: 20,
        cooldownMs: 250
      },
      shotgun: {
        name: "突破器霰弹枪",
        unlocked: true,
        currentLevel: 1,
        damage: 8,
        pelletCount: 6,
        cooldownMs: 900,
        currentShells: 3,
        magazineSize: 4,
        reloadDurationMs: 1_600,
        knockbackStrength: 180,
        suppressionSlowMultiplier: 0.7,
        staggerDurationMs: 420
      },
      tesla: {
        name: "特斯拉电弧发射器",
        unlocked: true,
        currentLevel: 1,
        damage: 14,
        cooldownMs: 700,
        chainTargets: 3,
        range: 260
      }
    },
    upgradeLevels: Object.fromEntries(UPGRADE_DEFINITIONS.map(({ key }) => [key, 0])),
    dashReadyAtMs: 0,
    bossPhaseActive: false,
    bossEnemy: null,
    activeFacilityEvent: null,
    topBannerState: null,
    survivalPhaseEnded: false,
    regularSpawningActive: true,
    spawnEvent: { paused: false },
    transientEffects: new Set(),
    buildPanel: { visible: false, setVisible() {}, destroy() {} },
    pauseCount: 0,
    resumeCount: 0,
    updateCount: 0,
    sounds: [],
    pauseGameplaySystems() { this.pauseCount += 1; },
    resumeGameplaySystems() { this.resumeCount += 1; },
    syncScreenOverlayPosition(container) {
      container.setPosition(this.cameras.main.scrollX, this.cameras.main.scrollY);
    },
    getFinalSurvivalTimeSeconds() { return "73.4"; },
    getPhaseHudState() {
      return { phaseLabel: "职员感染", nextNodeSeconds: 38, missionDetail: "下一节点 38秒" };
    },
    playSound(name) { this.sounds.push(name); },
    getRequiredXpForLevel() { return 10; },
    syncCombatStatsFromWeapons() {},
    tweens: {
      add(config) {
        const tween = { config, removed: false, remove() { this.removed = true; } };
        scene.tweensCreated.push(tween);
        return tween;
      }
    },
    time: {
      delayedCall(delay, callback) {
        const timer = {
          delay,
          callback,
          removed: false,
          remove() { this.removed = true; }
        };
        scene.timersCreated.push(timer);
        return timer;
      }
    }
  };

  const add = (type, factory) => (...args) => createDisplayObject(scene, type, factory(...args));
  scene.add = {
    container: add("container", (x, y) => ({ x, y })),
    graphics: add("graphics", () => ({})),
    rectangle: add("rectangle", (x, y, width, height, fill, alpha) => ({ x, y, width, height, fill, alpha })),
    text: add("text", (x, y, text, style) => ({ x, y, text: String(text ?? ""), style: { ...style } })),
    image: add("image", (x, y, textureKey) => ({ x, y, texture: { key: textureKey }, textureKey })),
    tileSprite: add("tileSprite", (x, y, width, height, textureKey) => ({ x, y, width, height, textureKey })),
    renderTexture: add("renderTexture", (x, y, width, height) => ({ x, y, width, height }))
  };

  Object.assign(scene, menusMixin, progressionMixin, hudMixin);
  scene.getLevelUpChoices = () => LEVEL_UP_CHOICES;
  return scene;
}

function liveObjects(scene) {
  return scene.created.filter(({ destroyed }) => !destroyed);
}

function activeTweens(scene) {
  return scene.tweensCreated.filter(({ removed }) => !removed);
}

function activeTimers(scene) {
  return scene.timersCreated.filter(({ removed }) => !removed);
}

function assertReleased(objects) {
  assert.equal(objects.every(({ destroyed }) => destroyed), true);
  assert.equal(objects.every(({ listenerCount }) => listenerCount === 0), true);
  assert.equal(objects.every(({ input }) => input?.enabled !== true), true);
}

function resetCreateState(scene) {
  scene.isGameOver = false;
  scene.isVictory = false;
  scene.isPaused = false;
  scene.isLevelUpActive = false;
  scene.isResolvingLevelUp = false;
  scene._levelUpPresentationUnavailable = false;
  scene.pendingLevelUps = 1;
  scene.topBannerState = null;
}

test("three shutdown-create cycles keep one lifecycle registration and release every overlay", () => {
  const scene = createScene();
  const liveCounts = [];
  const observerStates = [];

  for (let cycle = 0; cycle < 3; cycle += 1) {
    resetCreateState(scene);
    scene.createUI();
    scene.createBuildPanel();
    scene.pauseGame();
    scene.showGameOverOverlay();
    scene.showLevelUpOverlay();

    assert.equal(scene.events.listenerCount(SHUTDOWN), 1);
    assert.equal(scene.events.listenerCount(DESTROY), 1);
    liveCounts.push(liveObjects(scene).length);
    assert.ok(scene.buildPanelText);
    scene.buildPanelText.on("destroy", (target) => {
      observerStates.push({ destroying: target.destroying, destroyed: target.destroyed });
    });

    const cycleObjects = [...liveObjects(scene)];
    scene.events.emit(SHUTDOWN);
    scene.events.emit(SHUTDOWN);

    assert.equal(scene.events.listenerCount(SHUTDOWN), 0);
    assert.equal(scene.events.listenerCount(DESTROY), 0);
    assert.equal(scene.tacticalHudView === null, true);
    assert.equal((scene.buildPanelController ?? null) === null, true);
    assert.equal(scene.buildPanel.visible, false);
    assert.equal(scene.pauseOverlayController === null, true);
    assert.equal(scene.pauseOverlay === null, true);
    assert.equal(scene.resultOverlayController === null, true);
    assert.equal(scene.resultOverlay === null, true);
    assert.equal(scene.levelUpOverlayController === null, true);
    assert.equal(scene.levelUpOverlay === null, true);
    assert.equal(liveObjects(scene).length, 0);
    assert.equal(activeTweens(scene).length, 0);
    assert.equal(activeTimers(scene).length, 0);
    assertReleased(cycleObjects);
  }

  assert.equal(liveCounts.every((count) => count === liveCounts[0] && count > 0), true);
  assert.deepEqual(observerStates, [
    { destroying: true, destroyed: false },
    { destroying: true, destroyed: false },
    { destroying: true, destroyed: false }
  ]);
});

test("three pause cycles preserve observer order and leave no controllers objects or tweens", () => {
  const scene = createScene();
  const observerStates = [];

  for (let cycle = 0; cycle < 3; cycle += 1) {
    const objectStart = scene.created.length;
    scene.pauseGame();
    const controller = scene.pauseOverlayController;
    assert.ok(controller);
    const observed = controller.actions.resume.hitArea;
    observed.on("destroy", (target) => {
      observerStates.push({ destroying: target.destroying, destroyed: target.destroyed });
    });

    scene.resumeFromPause();
    scene.hidePauseOverlay();

    assert.equal(scene.pauseOverlayController === null, true);
    assert.equal(scene.pauseOverlay === null, true);
    assert.equal(liveObjects(scene).length, 0);
    assert.equal(activeTweens(scene).length, 0);
    assertReleased(scene.created.slice(objectStart));
  }

  assert.equal(scene.pauseCount, 3);
  assert.equal(scene.resumeCount, 3);
  assert.deepEqual(observerStates, [
    { destroying: true, destroyed: false },
    { destroying: true, destroyed: false },
    { destroying: true, destroyed: false }
  ]);
});

test("consecutive level-up presentations replace ownership and unified teardown clears its timer", () => {
  const scene = createScene();
  const liveCounts = [];
  let previousController = null;
  let previousObjects = [];

  for (let presentation = 0; presentation < 3; presentation += 1) {
    scene.showLevelUpOverlay();
    if (previousController) {
      assert.notEqual(scene.levelUpOverlayController, previousController);
      assertReleased(previousObjects);
    }
    previousController = scene.levelUpOverlayController;
    previousObjects = [...previousController.objects];
    liveCounts.push(liveObjects(scene).length);
    assert.equal(activeTweens(scene).length, 1);
    assert.equal(activeTimers(scene).length, 0);
  }

  assert.equal(liveCounts.every((count) => count === liveCounts[0] && count > 0), true);
  const resumeBeforeTeardown = scene.resumeCount;
  scene.skipLevelUpChoice();
  assert.equal(scene.pendingLevelUps, 0);
  assert.equal(activeTimers(scene).length, 1);
  assert.equal(activeTimers(scene)[0].delay, 120);
  assert.equal(typeof scene.teardownTerminalOverlays, "function");

  scene.teardownTerminalOverlays();
  scene.teardownTerminalOverlays();

  assert.equal(scene.resumeCount, resumeBeforeTeardown, "teardown must not alter level-up timing semantics");
  assert.equal(scene.levelUpOverlayController, null);
  assert.equal(scene.levelUpOverlay, null);
  assert.equal(scene.levelUpResolutionTimer, null);
  assert.equal(liveObjects(scene).length, 0);
  assert.equal(activeTweens(scene).length, 0);
  assert.equal(activeTimers(scene).length, 0);
  assertReleased(scene.created);
});

test("unified teardown clears every overlay reference when one controller destroy throws late", () => {
  const scene = createScene();
  scene.createUI();
  scene.createBuildPanel();
  scene.pauseGame();
  scene.showGameOverOverlay();
  scene.showLevelUpOverlay();

  const levelController = scene.levelUpOverlayController;
  const originalDestroy = levelController.destroy.bind(levelController);
  levelController.destroy = () => {
    originalDestroy();
    throw new Error("forced late level-up destroy failure");
  };

  assert.doesNotThrow(() => scene.teardownTerminalOverlays());
  assert.equal(scene.levelUpOverlayController === null, true);
  assert.equal(scene.levelUpOverlay === null, true);
  assert.equal(scene.pauseOverlayController === null, true);
  assert.equal(scene.pauseOverlay === null, true);
  assert.equal(scene.resultOverlayController === null, true);
  assert.equal(scene.resultOverlay === null, true);
  assert.equal(scene.buildPanelController === null, true);
  assert.equal(scene.buildPanel.visible, false);
});
