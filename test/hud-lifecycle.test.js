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

function removeFromList(list, object) {
  const index = list?.indexOf(object) ?? -1;
  if (index >= 0) list.splice(index, 1);
}

function createDisplayObject(scene, type, initial = {}) {
  const listeners = new Map();
  const isContainer = type === "container";
  const object = {
    type,
    active: true,
    destroyed: false,
    alpha: 1,
    visible: true,
    ...(isContainer ? { list: [] } : {}),
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
      const candidates = Array.isArray(children) ? children : [children];
      this.list ??= [];
      for (const child of candidates) {
        if (!child) continue;
        removeFromList(child.parentContainer?.list, child);
        removeFromList(scene.children.list, child);
        if (!this.list.includes(child)) this.list.push(child);
        child.parentContainer = this;
        child.on("destroy", () => {
          removeFromList(this.list, child);
          if (child.parentContainer === this) child.parentContainer = null;
        });
      }
      return this;
    },
    destroy(destroyChildren = false) {
      if (this.destroyed) return;
      if (destroyChildren) {
        for (const child of [...(this.list ?? [])]) child.destroy?.(true);
      } else {
        for (const child of [...(this.list ?? [])]) {
          child.parentContainer = null;
          if (!scene.children.list.includes(child)) scene.children.list.push(child);
        }
      }
      if (this.list) this.list.length = 0;
      this.emit("destroy", this);
      this.removeAllListeners();
      removeFromList(scene.children.list, this);
      this.active = false;
      this.destroyed = true;
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

function liveObjectCount(scene) {
  return scene.allObjects.filter((object) => !object.destroyed).length;
}

test("three tactical HUD create-teardown cycles do not grow Phaser objects or scene listeners", async () => {
  const scene = createScene();
  Object.assign(scene, await loadHudMixin());
  const liveCounts = [];

  for (let restart = 0; restart < 3; restart += 1) {
    scene.createUI();
    liveCounts.push(liveObjectCount(scene));
    assert.equal(scene.events.listenerCount(SCENE_EVENTS.SHUTDOWN), 1);
    assert.equal(scene.events.listenerCount(SCENE_EVENTS.DESTROY), 1);
    scene.teardownHud();
    scene.teardownHud();
    assert.equal(liveObjectCount(scene), 0);
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
  assert.equal(liveObjectCount(scene) > 0, true);
  assert.doesNotThrow(() => scene.updateUI());
  scene.pauseButton.emit("pointerdown");
  assert.equal(scene.togglePauseCalls, 1);
  scene.soundMuted = true;
  assert.doesNotThrow(() => scene.updateMuteText());
  assert.equal(scene.muteText.text, "音频：静音 (M)");
  assert.doesNotThrow(() => scene.events.emit(SCENE_EVENTS.SHUTDOWN));
  assert.doesNotThrow(() => scene.events.emit(SCENE_EVENTS.DESTROY));
  assert.equal(liveObjectCount(scene), 0);
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
  assert.equal(liveObjectCount(scene), 0);
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

test("fallback cleanup preserves recursive baseline objects and destroys inactive reparented partials", async () => {
  const scene = createScene();
  const baselineContainer = scene.add.container(12, 18);
  const baselineChild = scene.add.text(4, 6, "existing", {});
  baselineChild.on("pointerdown", () => {});
  baselineContainer.add([baselineChild]);
  const baselineChildListenerCount = baselineChild.listenerCount;
  const baselineCount = scene.allObjects.length;
  let partialContainer;
  let reparentedPartial;
  let injectedPartial;

  Object.assign(scene, await loadHudMixin((factoryScene) => {
    partialContainer = factoryScene.add.container(30, 40);
    partialContainer.on("pointerdown", () => {});
    reparentedPartial = factoryScene.add.rectangle(2, 3, 8, 9, 0xffffff, 1);
    reparentedPartial.setInteractive().on("pointerdown", () => {});
    partialContainer.add([reparentedPartial]);
    partialContainer.active = false;
    reparentedPartial.active = false;

    injectedPartial = factoryScene.add.text(8, 10, "partial", {});
    injectedPartial.on("pointerdown", () => {});
    injectedPartial.active = false;
    baselineContainer.add([injectedPartial]);
    throw new Error("tactical construction failed after reparenting");
  }));

  scene.createUI();

  assert.equal(scene.tacticalHudView.mode, "legacy");
  assert.equal(baselineContainer.destroyed, false);
  assert.equal(baselineChild.destroyed, false);
  assert.equal(baselineChild.listenerCount, baselineChildListenerCount);
  assert.equal(baselineContainer.list.includes(baselineChild), true);
  for (const object of [partialContainer, reparentedPartial, injectedPartial]) {
    assert.equal(object.destroyed, true, `${object.type} partial is destroyed`);
    assert.equal(object.listenerCount, 0, `${object.type} partial listeners are cleared`);
  }
  assert.equal(baselineContainer.list.includes(injectedPartial), false);

  const inactiveLegacyObject = scene.pauseButton;
  assert.equal(inactiveLegacyObject.listenerCount > 0, true);
  inactiveLegacyObject.active = false;
  const legacyObjects = [...scene.tacticalHudView.objects];

  scene.teardownHud();

  assert.equal(inactiveLegacyObject.destroyed, true);
  assert.equal(inactiveLegacyObject.listenerCount, 0);
  assert.equal(legacyObjects.every((object) => object.destroyed), true);
  assert.equal(legacyObjects.every((object) => object.listenerCount === 0), true);
  assert.equal(baselineContainer.destroyed, false);
  assert.equal(baselineChild.destroyed, false);
  assert.equal(baselineChild.listenerCount, baselineChildListenerCount);
  assert.equal(liveObjectCount(scene), baselineCount);
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

test("direct facility updates preserve active banners and restore facility presentation after expiry", async (t) => {
  const facility = {
    expanded: false,
    title: "设施稳定",
    detail: "SITE-CN // 收容系统在线",
    tone: "contained"
  };
  const cases = [
    ["tactical", createTacticalHudView],
    ["legacy", () => { throw new Error("tactical unavailable"); }]
  ];

  for (const [mode, factory] of cases) {
    await t.test(mode, async () => {
      const scene = createScene();
      Object.assign(scene, await loadHudMixin(factory));
      scene.createUI();
      scene.updateUI();
      assert.equal(scene.tacticalHudView.mode ?? "tactical", mode);

      scene.showTopBanner("外科狂乱", "SCP-049 暴露了弱点", 1_000);
      scene.elapsedSurvivalMs = 1_900;
      scene.updateTopBanner();
      scene.applyFacilityHudPresentation(facility);

      assert.equal(scene.eventBannerTitle.text, "外科狂乱");
      assert.equal(scene.eventBannerDetail.text, "SCP-049 暴露了弱点");
      assert.equal(scene.eventBannerContainer.visible, true);
      assert.equal(scene.eventBannerBg.visible, true);
      assert.equal(scene.eventBannerDetail.visible, true);
      assert.equal(scene.eventBannerContainer.alpha, 100 / 280);

      scene.elapsedSurvivalMs = 2_000;
      scene.updateTopBanner();
      scene.applyFacilityHudPresentation(facility);

      assert.equal(scene.topBannerState, null);
      assert.equal(scene.eventBannerContainer.visible, false);
      assert.equal(scene.eventBannerContainer.alpha, 1);
      if (mode === "tactical") {
        assert.equal(scene.eventBannerTitle.text, "设施稳定 // SITE-CN // 收容系统在线");
        assert.equal(scene.eventBannerDetail.text, "SITE-CN // 收容系统在线");
      } else {
        assert.equal(scene.facilityTitleText.text, "设施稳定");
        assert.equal(scene.facilityDetailText.text, "SITE-CN // 收容系统在线");
      }
    });
  }
});

test("partial facility update waits without a cached tactical presentation and preserves existing refs", async () => {
  const scene = createScene();
  Object.assign(scene, await loadHudMixin());
  scene.createUI();
  scene.updateUI();

  const watchedRefs = [
    "phaseText", "statsText", "levelText", "xpText", "weaponHudText",
    "pauseButtonLabel", "muteText"
  ];
  const before = Object.fromEntries(watchedRefs.map((name) => [
    name,
    {
      text: scene[name].text,
      visible: scene[name].visible,
      alpha: scene[name].alpha
    }
  ]));
  const originalUpdate = scene.tacticalHudView.update;
  let updateCalls = 0;
  scene.tacticalHudView.update = (...args) => {
    updateCalls += 1;
    return originalUpdate(...args);
  };
  scene._hudPresentation = null;

  scene.applyFacilityHudPresentation({
    expanded: true,
    title: "收容警报",
    detail: "观察区出现异常读数。",
    tone: "warning"
  });

  assert.equal(updateCalls, 0);
  assert.equal(scene._hudPresentation, null);
  for (const name of watchedRefs) {
    assert.deepEqual({
      text: scene[name].text,
      visible: scene[name].visible,
      alpha: scene[name].alpha
    }, before[name], `${name} remains unchanged`);
  }
});
