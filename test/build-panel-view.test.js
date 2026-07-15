import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";
import { TEXTURES } from "../src/assets/manifest.js";
import { HUD_REGIONS } from "../src/art/openingVisualContract.js";
import {
  getHudPresentation,
  selectTimelineHudContainers
} from "../src/ui/hudPresentation.js";
import { THEME } from "../src/ui/theme.js";
import { createTacticalHudView } from "../src/ui/tacticalHudView.js";
import { createStatusLamp, createTacticalPanel } from "../src/ui/tacticalUi.js";
import { createTerminalOverlay } from "../src/ui/terminalOverlay.js";
import { UPGRADE_PRESENTATION } from "../src/ui/upgradePresentation.js";

const SCENE_EVENTS = Object.freeze({ SHUTDOWN: "shutdown", DESTROY: "destroy" });

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
    { Scenes: { Events: SCENE_EVENTS } }, 960, 540, BALANCE, UPGRADE_DEFINITIONS,
    HUD_REGIONS, TEXTURES, getHudPresentation, selectTimelineHudContainers,
    THEME, createTacticalHudView, createStatusLamp, createTacticalPanel,
    createTerminalOverlay, UPGRADE_PRESENTATION, 45, 58, 150, 82, 92, 72
  );
}

const hudMixin = await loadHudMixin();

function createEmitter(target = {}) {
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
    off(event, handler, context) {
      if (handler === undefined) {
        handlers.delete(event);
        return this;
      }
      const retained = (handlers.get(event) ?? []).filter(
        (entry) => entry.handler !== handler || (context !== undefined && entry.context !== context)
      );
      if (retained.length > 0) handlers.set(event, retained);
      else handlers.delete(event);
      return this;
    },
    emit(event, ...args) {
      for (const entry of [...(handlers.get(event) ?? [])]) {
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

function createSceneEvents() {
  return createEmitter();
}

function removeFromList(list, object) {
  const index = list?.indexOf(object) ?? -1;
  if (index >= 0) list.splice(index, 1);
}

function createDisplayObject(scene, type, properties = {}) {
  const object = createEmitter({
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
    getBounds() {
      const fontSize = Number.parseFloat(String(this.style?.fontSize ?? 0)) || 0;
      return {
        width: this.type === "text" ? String(this.text ?? "").length * fontSize : this.width ?? 0,
        height: this.type === "text" ? fontSize + 2 : this.height ?? 0
      };
    },
    destroy(destroyChildren = true) {
      if (this.destroyed) return this;
      this.destroying = true;
      if (destroyChildren) {
        for (const child of [...(this.list ?? [])]) child.destroy?.(true);
      }
      this.parentContainer?.onChildDestroyed?.(this);
      this.emit("destroy", this, false);
      this.removeAllListeners();
      removeFromList(scene.children.list, this);
      this.active = false;
      this.destroyed = true;
      this.destroying = false;
      return this;
    }
  });

  if (type === "container") {
    object.list = [];
    object.onChildDestroyed = function onChildDestroyed(child) {
      removeFromList(this.list, child);
      if (child.parentContainer === this) child.parentContainer = null;
    };
    object.add = function add(children) {
      for (const child of Array.isArray(children) ? children : [children]) {
        if (!child) continue;
        child.parentContainer?.onChildDestroyed?.(child);
        removeFromList(scene.children.list, child);
        if (!this.list.includes(child)) this.list.push(child);
        child.parentContainer = this;
      }
      return this;
    };
  }

  scene.children.list.push(object);
  scene.created.push(object);
  return object;
}

function createScene(options = {}) {
  const addCounts = new Map();
  const failureState = { terminalFailed: false };
  const scene = {
    events: createSceneEvents(),
    children: { list: [] },
    created: [],
    tweensCreated: [],
    scale: { width: 960, height: 540 },
    cameras: { main: { width: 960, height: 540 } },
    textures: { exists: () => true },
    isGameOver: false,
    isLevelUpActive: false,
    isPaused: false,
    pauseCount: 0,
    resumeCount: 0,
    selectedWeaponId: "pistol",
    playerMoveSpeed: 120,
    health: 80,
    maxHealth: 100,
    projectileCount: 2,
    bulletPenetration: 1,
    pickupRadius: 90,
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
    weaponMutations: {
      pistolBoomerang: false,
      breacherExplosive: false,
      teslaField: false
    },
    pauseGameplaySystems() { this.pauseCount += 1; },
    resumeGameplaySystems() { this.resumeCount += 1; },
    tweens: {
      add(config) {
        const tween = { config, removed: false, remove() { this.removed = true; } };
        scene.tweensCreated.push(tween);
        return tween;
      }
    }
  };

  const add = (type, factory) => (...args) => {
    const occurrence = (addCounts.get(type) ?? 0) + 1;
    addCounts.set(type, occurrence);
    if (options.failTerminal && type === "tileSprite" && !failureState.terminalFailed) {
      failureState.terminalFailed = true;
      throw new Error("forced terminal build panel failure");
    }
    if (options.failLegacy && failureState.terminalFailed && type === "rectangle") {
      throw new Error("forced legacy build panel failure");
    }
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
  Object.assign(scene, hudMixin);
  return scene;
}

function liveObjects(scene) {
  return scene.created.filter(({ destroyed }) => !destroyed);
}

function visibleText(objects) {
  return objects
    .filter(({ type, destroyed, visible }) => type === "text" && !destroyed && visible !== false)
    .map(({ text }) => text)
    .join("\n");
}

function assertReleased(objects) {
  assert.equal(objects.every(({ destroyed }) => destroyed), true);
  assert.equal(objects.every(({ listenerCount }) => listenerCount === 0), true);
  assert.equal(objects.every(({ input }) => input?.enabled !== true), true);
}

function gameplaySnapshot(scene) {
  return structuredClone({
    isPaused: scene.isPaused,
    pauseCount: scene.pauseCount,
    resumeCount: scene.resumeCount,
    selectedWeaponId: scene.selectedWeaponId,
    playerMoveSpeed: scene.playerMoveSpeed,
    health: scene.health,
    maxHealth: scene.maxHealth,
    projectileCount: scene.projectileCount,
    bulletPenetration: scene.bulletPenetration,
    pickupRadius: scene.pickupRadius,
    weapons: scene.weapons,
    upgradeLevels: scene.upgradeLevels,
    weaponMutations: scene.weaponMutations
  });
}

test("build panel uses one screen-fixed terminal controller and TAB changes visibility only", () => {
  const scene = createScene();
  const before = gameplaySnapshot(scene);

  scene.createBuildPanel();

  assert.equal(typeof scene.createBuildPanel, "function");
  assert.equal(typeof scene.toggleBuildPanel, "function");
  assert.equal(typeof scene.hideBuildPanel, "function");
  assert.equal(typeof scene.updateBuildPanelText, "function");
  assert.ok(scene.buildPanelController);
  assert.equal(scene.buildPanelController.mode, "terminal");
  assert.equal(scene.buildPanel, scene.buildPanelController.container);
  assert.equal(scene.buildPanel.visible, false);
  assert.deepEqual(new Set(scene.buildPanelController.objects), new Set(liveObjects(scene)));
  assert.equal(scene.buildPanelController.objects.every(({ scrollFactor }) => scrollFactor === 0), true);
  assert.ok(scene.buildPanelController.objects.some(
    ({ type, textureKey }) => type === "tileSprite" && textureKey === TEXTURES.terminalSurfaceGrid
  ));

  const content = visibleText(scene.buildPanelController.objects);
  assert.match(content, /主武器/);
  assert.match(content, /常规强化/);
  assert.match(content, /异常突变/);
  const imageKeys = new Set(
    scene.buildPanelController.objects
      .filter(({ type, destroyed }) => type === "image" && !destroyed)
      .map(({ textureKey }) => textureKey)
  );
  for (const key of [
    TEXTURES.weaponPistolIcon,
    TEXTURES.weaponBreacherIcon,
    TEXTURES.weaponTeslaIcon,
    ...Object.values(UPGRADE_PRESENTATION).map(({ textureKey }) => textureKey)
  ]) {
    assert.equal(imageKeys.has(key), true, `expected existing build icon ${key}`);
  }

  scene.toggleBuildPanel();
  assert.equal(scene.buildPanel.visible, true);
  scene.toggleBuildPanel();
  assert.equal(scene.buildPanel.visible, false);
  assert.deepEqual(gameplaySnapshot(scene), before);
});

test("build panel updates icon-adjacent levels and short values in place", () => {
  const scene = createScene();
  scene.createBuildPanel();
  const controller = scene.buildPanelController;
  assert.ok(controller, "terminal build panel must expose its controller");
  const originalObjects = new Set(liveObjects(scene));
  const originalCount = scene.created.length;

  scene.upgradeLevels.damage = 4;
  scene.upgradeLevels.moveSpeed = 3;
  scene.weapons.pistol.currentLevel = 5;
  scene.weapons.pistol.damage = 25.5;
  scene.weapons.pistol.cooldownMs = 180;
  scene.playerMoveSpeed = 135;
  scene.weaponMutations.pistolBoomerang = true;
  scene.updateBuildPanelText();
  scene.updateBuildPanelText();

  assert.equal(scene.buildPanelController, controller);
  assert.equal(scene.created.length, originalCount);
  assert.deepEqual(new Set(liveObjects(scene)), originalObjects);
  const content = visibleText(controller.objects);
  assert.match(content, /基金会勤务手枪[^\n]*Lv 5[^\n]*25\.5/);
  assert.match(content, /伤害提升[^\n]*Lv 4/);
  assert.match(content, /移动速度[^\n]*Lv 3[^\n]*135/);
  assert.match(content, /回旋弹[^\n]*已激活/);
  for (const { description } of UPGRADE_DEFINITIONS) {
    assert.equal(content.includes(description), false, "compact panel must not copy long descriptions");
  }
  assert.equal(
    controller.objects
      .filter(({ type }) => type === "text")
      .every(({ text }) => String(text).length <= 42),
    true,
    "every build row remains short"
  );
});

test("terminal construction failure rolls back partial objects before extracted legacy fallback", () => {
  const scene = createScene({ failTerminal: true });
  const legacy = scene.createLegacyBuildPanel;
  let legacyCalls = 0;
  scene.createLegacyBuildPanel = function createTrackedLegacyBuildPanel(...args) {
    legacyCalls += 1;
    return legacy?.apply(this, args);
  };

  scene.createBuildPanel();

  assert.equal(legacyCalls, 1);
  assert.ok(scene.buildPanelController);
  assert.equal(scene.buildPanelController.mode, "legacy");
  assert.equal(scene.buildPanel, scene.buildPanelController.container);
  assert.equal(scene.buildPanel.visible, false);
  assert.deepEqual(new Set(scene.buildPanelController.objects), new Set(liveObjects(scene)));
  const partialObjects = scene.created.filter(
    (object) => !scene.buildPanelController.objects.includes(object)
  );
  assert.ok(partialObjects.length > 0);
  assertReleased(partialObjects);
});

test("terminal and legacy construction failure install a safe inert build panel", () => {
  const scene = createScene({ failTerminal: true, failLegacy: true });
  const before = gameplaySnapshot(scene);

  assert.doesNotThrow(() => scene.createBuildPanel());

  assert.equal(scene.buildPanelController, null);
  assert.equal(scene.buildPanel.visible, false);
  assert.equal(typeof scene.buildPanel.setVisible, "function");
  assert.equal(typeof scene.buildPanel.destroy, "function");
  assert.equal(liveObjects(scene).length, 0);
  assertReleased(scene.created);
  assert.doesNotThrow(() => {
    scene.toggleBuildPanel();
    scene.hideBuildPanel();
    scene.updateBuildPanelText();
    scene.buildPanel.setVisible(true);
    scene.buildPanel.destroy();
  });
  assert.equal(scene.buildPanel.visible, false);
  assert.deepEqual(gameplaySnapshot(scene), before);
});
