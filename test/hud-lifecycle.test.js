import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import { HUD_REGIONS } from "../src/art/openingVisualContract.js";
import { TEXTURES } from "../src/assets/manifest.js";
import {
  getHudPresentation,
  selectTimelineHudContainers
} from "../src/ui/hudPresentation.js";
import { createTacticalHudView } from "../src/ui/tacticalHudView.js";
import { createStatusLamp, createTacticalPanel } from "../src/ui/tacticalUi.js";
import { UIManager } from "../src/ui/UIManager.js";

const SCENE_EVENTS = Object.freeze({ SHUTDOWN: "shutdown", DESTROY: "destroy" });

function createEventEmitter() {
  const listeners = new Map();
  const remove = (event, listener, context) => {
    const retained = (listeners.get(event) ?? [])
      .filter((entry) => entry.listener !== listener || entry.context !== context);
    if (retained.length > 0) listeners.set(event, retained);
    else listeners.delete(event);
  };
  return {
    off(event, listener, context) {
      remove(event, listener, context);
      return this;
    },
    once(event, listener, context) {
      listeners.set(event, [...(listeners.get(event) ?? []), { listener, context }]);
      return this;
    },
    emit(event) {
      for (const entry of [...(listeners.get(event) ?? [])]) {
        remove(event, entry.listener, entry.context);
        entry.listener.call(entry.context);
      }
    },
    listenerCount(event) {
      return (listeners.get(event) ?? []).length;
    }
  };
}

function createDisplayObject(scene, type, initial = {}) {
  const listeners = new Map();
  const object = {
    type,
    active: true,
    alpha: 1,
    visible: true,
    ...initial,
    setDepth(value) { this.depth = value; return this; },
    setScrollFactor(value) { this.scrollFactor = value; return this; },
    setOrigin(...value) { this.origin = value; return this; },
    setVisible(value) { this.visible = value; return this; },
    setAlpha(value) { this.alpha = value; return this; },
    setText(value) { this.text = value; return this; },
    setColor(value) { this.color = value; return this; },
    setFillStyle(...value) { this.fillStyleValue = value; return this; },
    setStrokeStyle(...value) { this.strokeStyleValue = value; return this; },
    setDisplaySize(width, height) { this.displayWidth = width; this.displayHeight = height; return this; },
    setTexture(key) { this.texture = { key }; this.textureKey = key; return this; },
    setInteractive() { this.interactive = true; return this; },
    disableInteractive() { this.interactive = false; return this; },
    removeInteractive() { this.interactive = false; return this; },
    on(event, listener) { listeners.set(event, listener); return this; },
    emit(event, ...args) { listeners.get(event)?.(...args); return this; },
    removeAllListeners() { listeners.clear(); return this; },
    clear() { return this; },
    fillStyle() { return this; },
    lineStyle() { return this; },
    beginPath() { return this; },
    moveTo() { return this; },
    lineTo() { return this; },
    closePath() { return this; },
    fillPath() { return this; },
    strokePath() { return this; },
    fillCircle() { return this; },
    strokeCircle() { return this; },
    fill() { return this; },
    erase() { return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    add(children) {
      this.children = [...(this.children ?? []), ...children];
      for (const child of children) child.parentContainer = this;
      return this;
    },
    destroy(destroyChildren = false) {
      if (!this.active) return;
      this.removeAllListeners();
      if (destroyChildren) {
        for (const child of [...(this.children ?? [])]) child.destroy?.(true);
      }
      this.active = false;
      this.destroyed = true;
      const index = scene.children.list.indexOf(this);
      if (index >= 0) scene.children.list.splice(index, 1);
    }
  };
  Object.defineProperty(object, "listenerCount", { get: () => listeners.size });
  scene.children.list.push(object);
  scene.allObjects.push(object);
  return object;
}

function createScene() {
  const scene = {
    events: createEventEmitter(),
    children: { list: [] },
    allObjects: [],
    textures: { exists: () => true },
    player: { x: 400, y: 260 },
    soundMuted: false,
    isPaused: false,
    isMissionActive: true,
    isGameOver: false,
    health: 80,
    maxHealth: 100,
    level: 2,
    currentXp: 3,
    xpToNextLevel: 12,
    killCount: 7,
    elapsedSurvivalMs: 1_000,
    selectedWeaponId: "pistol",
    weapons: {
      pistol: { name: "基金会勤务手枪", currentLevel: 1, damage: 20, cooldownMs: 280 },
      shotgun: { unlocked: false },
      tesla: { unlocked: false }
    },
    dashReadyAtMs: 0,
    bossPhaseActive: false,
    bossEnemy: null,
    activeFacilityEvent: null,
    pickupRadius: 72,
    buildPanel: { visible: false },
    topBannerState: null,
    togglePauseCalls: 0,
    togglePause() { this.togglePauseCalls += 1; this.isPaused = !this.isPaused; },
    getPhaseHudState() {
      return { phaseLabel: "职员感染", nextNodeSeconds: 38, missionDetail: "下一节点 38秒" };
    }
  };
  const add = (type, factory) => (...args) => createDisplayObject(scene, type, factory(...args));
  scene.add = {
    container: add("container", (x, y) => ({ x, y })),
    graphics: add("graphics", () => ({})),
    rectangle: add("rectangle", (x, y, width, height, fill, alpha) => ({ x, y, width, height, fill, alpha })),
    text: add("text", (x, y, text, style) => ({ x, y, text, style })),
    image: add("image", (x, y, textureKey) => ({ x, y, texture: { key: textureKey }, textureKey })),
    renderTexture: add("renderTexture", (x, y, width, height) => ({ x, y, width, height }))
  };
  return scene;
}

async function loadHudMixin(tacticalFactory = createTacticalHudView) {
  const source = await readFile(new URL("../src/scene/hud.js", import.meta.url), "utf8");
  const declaration = "export const hudMixin =";
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1, "hud mixin export must exist");
  const body = source.slice(start).replace(declaration, "const hudMixin =");
  return Function(
    "Phaser", "GAME_WIDTH", "GAME_HEIGHT", "BALANCE", "UPGRADE_DEFINITIONS",
    "HUD_REGIONS", "TEXTURES", "getHudPresentation", "selectTimelineHudContainers",
    "createTacticalHudView", "createStatusLamp", "createTacticalPanel", "THEME",
    "HUD_DEPTH", "FACILITY_HUD_DEPTH", "HEALTH_BAR_WIDTH", "XP_BAR_WIDTH",
    "WEAPON_STATUS_BAR_WIDTH", "DASH_BAR_WIDTH",
    `${body}\nreturn hudMixin;`
  )(
    { Scenes: { Events: SCENE_EVENTS } }, 960, 540, BALANCE, [], HUD_REGIONS, TEXTURES,
    getHudPresentation, selectTimelineHudContainers, tacticalFactory,
    createStatusLamp, createTacticalPanel,
    {
      font: { mono: "monospace", label: "sans", body: "sans", display: "sans" },
      fontSize: { hudEyebrow: "10px", hudTitle: "14px", hudBody: "12px", hudMicro: "10px", mute: "12px", pauseLabel: "12px", bannerTitle: "18px", bannerDetail: "12px" },
      text: { muted: "#aaa", primary: "#fff", secondary: "#ccc", contained: "#0f0", critical: "#f00", onButton: "#fff" },
      color: { text: { bannerTitle: "#fff", phase: "#ff0" } },
      hud: { panelFill: 0, panelBorder: 1, barTrack: 2, health: 3, healthCritical: 4, experience: 5, neutral: 6 },
      terminal: { danger: 7, warning: 8, contained: 9, frame: 10, panelFill: 11, panelRaised: 12, disabled: 13, frameFocus: 14 },
      surface: { raised: 15, overlay: 16 },
      border: { default: 17, warning: 18 },
      layout: { cornerCut: 4 }
    },
    45, 58, 150, 82, 92, 72
  );
}

function activeObjectCount(scene) {
  return scene.allObjects.filter((object) => object.active).length;
}

test("three tactical HUD create-teardown cycles do not grow Phaser objects or scene listeners", async () => {
  const scene = createScene();
  Object.assign(scene, await loadHudMixin());
  const liveCounts = [];

  for (let restart = 0; restart < 3; restart += 1) {
    scene.createUI();
    liveCounts.push(activeObjectCount(scene));
    assert.equal(scene.events.listenerCount(SCENE_EVENTS.SHUTDOWN), 1);
    assert.equal(scene.events.listenerCount(SCENE_EVENTS.DESTROY), 1);
    scene.teardownHud();
    scene.teardownHud();
    assert.equal(activeObjectCount(scene), 0);
    assert.equal(scene.events.listenerCount(SCENE_EVENTS.SHUTDOWN), 0);
    assert.equal(scene.events.listenerCount(SCENE_EVENTS.DESTROY), 0);
  }

  assert.equal(liveCounts.every((count) => count === liveCounts[0] && count > 0), true);
});

test("tactical construction failure executes the extracted legacy HUD and keeps update pause mute and shutdown safe", async () => {
  let tacticalAttempts = 0;
  const scene = createScene();
  Object.assign(scene, await loadHudMixin(() => {
    tacticalAttempts += 1;
    throw new Error("tactical unavailable");
  }));

  assert.doesNotThrow(() => scene.createUI());
  assert.equal(tacticalAttempts, 1);
  assert.equal(scene.tacticalHudView.mode, "legacy");
  assert.equal(activeObjectCount(scene) > 0, true);
  assert.doesNotThrow(() => scene.updateUI());
  scene.pauseButton.emit("pointerdown");
  assert.equal(scene.togglePauseCalls, 1);
  scene.soundMuted = true;
  assert.doesNotThrow(() => scene.updateMuteText());
  assert.equal(scene.muteText.text, "音频：静音 (M)");
  assert.doesNotThrow(() => scene.events.emit(SCENE_EVENTS.SHUTDOWN));
  assert.doesNotThrow(() => scene.events.emit(SCENE_EVENTS.DESTROY));
  assert.equal(activeObjectCount(scene), 0);
});

test("legacy failure rolls back its partial object and installs a complete no-op HUD", async () => {
  const scene = createScene();
  Object.assign(scene, await loadHudMixin(() => {
    throw new Error("tactical unavailable");
  }));
  scene.createLegacyHud = function createFailingLegacyHud() {
    this.add.graphics();
    throw new Error("legacy unavailable");
  };

  assert.doesNotThrow(() => scene.createUI());
  assert.equal(scene.tacticalHudView.mode, "noop");
  assert.deepEqual(scene.gameplayHudContainers, []);
  assert.deepEqual(scene.timelineHudBasePositions, []);
  assert.equal(activeObjectCount(scene), 0);
  for (const name of [
    "statsText", "levelText", "xpBarBackground", "xpBarFill", "xpText",
    "weaponHudText", "phaseText", "muteText", "pauseButton", "pauseButtonLabel",
    "pickupRadiusIndicator", "eventBannerContainer", "eventBannerBg", "eventBannerTitle",
    "eventBannerDetail", "outageDarknessRt", "outageLightSprite"
  ]) {
    assert.strictEqual(scene[name], scene.tacticalHudView.refs[name]);
  }
  assert.doesNotThrow(() => {
    scene.updateUI();
    scene.updateWeaponHud();
    scene.setGameplayHudVisible(false);
    scene.collapseFacilityHud();
    scene.updatePickupRadiusIndicator();
    scene.updateMuteText();
    scene.events.emit(SCENE_EVENTS.SHUTDOWN);
    scene.events.emit(SCENE_EVENTS.DESTROY);
  });
});

test("top banner survives the real frame update order and restores facility presentation after expiry", async () => {
  const scene = createScene();
  Object.assign(scene, await loadHudMixin());
  scene.createUI();
  const ui = new UIManager(scene);

  ui.showBanner("收容加压", "Boss 即将到来", 1_000);
  scene.updateTopBanner();
  scene.updateUI();

  assert.equal(scene.eventBannerTitle.text, "收容加压");
  assert.equal(scene.eventBannerDetail.text, "Boss 即将到来");
  assert.equal(scene.eventBannerContainer.visible, true);
  assert.equal(scene.eventBannerBg.visible, true);
  assert.equal(scene.eventBannerDetail.visible, true);
  assert.equal(scene.eventBannerContainer.alpha, 1);

  scene.elapsedSurvivalMs = 1_900;
  scene.updateTopBanner();
  scene.updateUI();

  assert.equal(scene.eventBannerTitle.text, "收容加压");
  assert.equal(scene.eventBannerDetail.text, "Boss 即将到来");
  assert.equal(scene.eventBannerContainer.visible, true);
  assert.equal(scene.eventBannerContainer.alpha, 100 / 280);

  scene.elapsedSurvivalMs = 2_000;
  scene.updateTopBanner();
  scene.updateUI();

  assert.equal(scene.topBannerState, null);
  assert.equal(scene.eventBannerContainer.visible, false);
  assert.equal(scene.eventBannerBg.visible, false);
  assert.equal(scene.eventBannerDetail.visible, false);
  assert.equal(scene.eventBannerContainer.alpha, 1);
  assert.equal(scene.eventBannerTitle.text, "设施稳定 // SITE-CN // 收容系统在线");
  assert.equal(scene.eventBannerDetail.text, "SITE-CN // 收容系统在线");
});
