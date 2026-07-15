import test from "node:test";
import assert from "node:assert/strict";
import { BALANCE } from "../src/config/balance.js";
import { HUD_REGIONS } from "../src/art/openingVisualContract.js";
import { TEXTURES } from "../src/assets/manifest.js";
import { getHudPresentation } from "../src/ui/hudPresentation.js";
import { createTacticalHudView } from "../src/ui/tacticalHudView.js";

const EXPECTED_REGION_KEYS = ["mission", "facility", "vitals", "weapon", "system"];
const EXPECTED_REF_KEYS = [
  "eventBannerBg",
  "eventBannerContainer",
  "eventBannerDetail",
  "eventBannerTitle",
  "levelText",
  "muteText",
  "outageDarknessRt",
  "outageLightSprite",
  "pauseButton",
  "pauseButtonLabel",
  "phaseText",
  "pickupRadiusIndicator",
  "statsText",
  "weaponHudText",
  "xpBarBackground",
  "xpBarFill",
  "xpText"
];

function createDisplayObject(type, initial = {}, failure = {}) {
  const handlers = new Map();
  const object = {
    type,
    active: true,
    alpha: 1,
    calls: [],
    destroyed: false,
    interactive: false,
    scrollFactor: undefined,
    visible: true,
    ...initial,
    setDepth(value) {
      this.depth = value;
      return this;
    },
    setScrollFactor(value) {
      this.scrollFactor = value;
      return this;
    },
    setOrigin(...args) {
      this.origin = args;
      return this;
    },
    setVisible(value) {
      this.visible = value;
      return this;
    },
    setAlpha(value) {
      this.alpha = value;
      return this;
    },
    setText(value) {
      this.text = value;
      return this;
    },
    setColor(value) {
      this.color = value;
      return this;
    },
    setFillStyle(...args) {
      this.fillStyleValue = args;
      this.calls.push(["setFillStyle", ...args]);
      return this;
    },
    setStrokeStyle(...args) {
      this.strokeStyleValue = args;
      this.calls.push(["setStrokeStyle", ...args]);
      return this;
    },
    setDisplaySize(width, height) {
      this.displayWidth = width;
      this.displayHeight = height;
      this.calls.push(["setDisplaySize", width, height]);
      return this;
    },
    setTexture(key) {
      this.texture = { key };
      this.textureKey = key;
      this.calls.push(["setTexture", key]);
      return this;
    },
    setInteractive(options) {
      this.interactive = true;
      this.interactiveOptions = options;
      return this;
    },
    disableInteractive() {
      this.interactive = false;
      this.disableInteractiveCount = (this.disableInteractiveCount ?? 0) + 1;
      return this;
    },
    removeInteractive() {
      this.interactive = false;
      this.removeInteractiveCount = (this.removeInteractiveCount ?? 0) + 1;
      return this;
    },
    on(event, handler) {
      handlers.set(event, handler);
      if (failure.listenerEvent === event && failure.remainingListenerFailures > 0) {
        failure.remainingListenerFailures -= 1;
        throw new Error("listener registration failed");
      }
      return this;
    },
    emit(event, ...args) {
      return handlers.get(event)?.(...args);
    },
    removeAllListeners() {
      handlers.clear();
      this.listenersRemoved = true;
      return this;
    },
    clear() {
      this.calls.push(["clear"]);
      return this;
    },
    fillStyle(...args) {
      this.calls.push(["fillStyle", ...args]);
      return this;
    },
    lineStyle(...args) {
      this.calls.push(["lineStyle", ...args]);
      return this;
    },
    beginPath() {
      this.calls.push(["beginPath"]);
      return this;
    },
    moveTo(...args) {
      this.calls.push(["moveTo", ...args]);
      return this;
    },
    lineTo(...args) {
      this.calls.push(["lineTo", ...args]);
      return this;
    },
    closePath() {
      this.calls.push(["closePath"]);
      return this;
    },
    fillPath() {
      this.calls.push(["fillPath"]);
      return this;
    },
    strokePath() {
      this.calls.push(["strokePath"]);
      return this;
    },
    fillCircle(...args) {
      this.calls.push(["fillCircle", ...args]);
      return this;
    },
    strokeCircle(...args) {
      this.calls.push(["strokeCircle", ...args]);
      return this;
    },
    add(children) {
      this.children = [...(this.children ?? []), ...children];
      return this;
    },
    destroy() {
      this.active = false;
      this.destroyed = true;
      return this;
    }
  };
  Object.defineProperty(object, "listenerCount", {
    get: () => handlers.size
  });
  return object;
}

function createScene(options = {}) {
  const objects = [];
  const failure = {
    listenerEvent: options.listenerEvent,
    remainingListenerFailures: options.listenerFailures ?? 0
  };
  const add = (type, factory) => (...args) => {
    const object = factory(...args);
    objects.push(object);
    return object;
  };
  const scene = {
    objects,
    player: { x: 400, y: 260 },
    soundMuted: false,
    togglePauseCalls: 0,
    updateMuteTextCalls: 0,
    cameras: { main: { scrollX: 240, scrollY: 120 } },
    textures: {
      exists(key) {
        return !options.missingTextures?.includes(key);
      }
    },
    togglePause() {
      this.togglePauseCalls += 1;
    },
    updateMuteText() {
      this.updateMuteTextCalls += 1;
    },
    add: {
      container: add("container", (x, y) => createDisplayObject("container", { x, y }, failure)),
      graphics: add("graphics", () => createDisplayObject("graphics", {}, failure)),
      rectangle: add("rectangle", (x, y, width, height, fill, alpha) => createDisplayObject(
        "rectangle",
        { x, y, width, height, fill, alpha },
        failure
      )),
      text: add("text", (x, y, text, style) => createDisplayObject(
        "text",
        { x, y, text, style },
        failure
      )),
      image: add("image", (x, y, textureKey) => createDisplayObject(
        "image",
        { x, y, texture: { key: textureKey }, textureKey },
        failure
      )),
      renderTexture: add("renderTexture", (x, y, width, height) => createDisplayObject(
        "renderTexture",
        { x, y, width, height },
        failure
      ))
    }
  };
  return scene;
}

function presentation(overrides = {}) {
  const base = {
    isMissionActive: true,
    phaseLabel: "职员感染",
    nextNodeSeconds: 38,
    health: 88,
    maxHealth: 100,
    currentXp: 3,
    xpToNextLevel: 12,
    level: 2,
    killCount: 7,
    elapsedSurvivalMs: 1_000,
    selectedWeaponId: "pistol",
    weapon: {
      id: "pistol",
      name: "基金会勤务手枪",
      currentLevel: 1,
      damage: 20,
      cooldownMs: 280,
      nextAttackAtMs: 0
    },
    dashReadyAtMs: 0,
    dashCooldownMs: 2_200,
    bossPhaseActive: false,
    bossHealthRatio: 0,
    activeFacilityEvent: null,
    soundMuted: false,
    isPaused: false,
    pickupRadius: 72,
    buildPanelVisible: false,
    ...overrides
  };
  return getHudPresentation(base);
}

function createView(scene, callbacks = {}) {
  return createTacticalHudView(scene, {
    regions: HUD_REGIONS,
    onTogglePause: callbacks.onTogglePause,
    onToggleMute: callbacks.onToggleMute
  });
}

test("tactical HUD exposes five stable HUD regions, compatibility refs, and the shared timeline selector", () => {
  const scene = createScene();
  const view = createView(scene);

  assert.deepEqual(Object.keys(view.regions), EXPECTED_REGION_KEYS);
  for (const regionKey of EXPECTED_REGION_KEYS) {
    const container = view.regions[regionKey].container;
    assert.equal(container.x, HUD_REGIONS[regionKey].x);
    assert.equal(container.y, HUD_REGIONS[regionKey].y);
    assert.equal(container.depth, regionKey === "facility" ? 58 : 45);
    assert.equal(container.scrollFactor, 0);
  }
  assert.deepEqual(Object.keys(view.refs).sort(), EXPECTED_REF_KEYS);
  assert.equal(view.refs.pickupRadiusIndicator, view.pickupWorldGraphic);
  assert.deepEqual(view.timelineContainers, [
    view.regions.mission.container,
    view.regions.vitals.container,
    view.regions.weapon.container,
    view.regions.facility.container
  ]);
  assert.equal(Object.isFrozen(view.timelineContainers), true);
  assert.equal(view.timelineContainers.includes(view.regions.system.container), false);
  assert.equal(view.pickupWorldGraphic.scrollFactor, 1);
  assert.equal(view.pickupWorldGraphic.visible, false);
});

test("pickup radius remains a single world-space graphic around the live player position", () => {
  const scene = createScene();
  const view = createView(scene);
  scene.player.x = 840;
  scene.player.y = 610;
  view.update(presentation({ buildPanelVisible: true, pickupRadius: 96 }));

  const firstCircle = view.pickupWorldGraphic.calls.findLast(([name]) => name === "strokeCircle");
  assert.deepEqual(firstCircle, ["strokeCircle", 840, 610, 96]);
  assert.equal(view.pickupWorldGraphic.visible, true);

  scene.cameras.main.scrollX = 700;
  scene.cameras.main.scrollY = 420;
  scene.player.x = 1_020;
  scene.player.y = 760;
  view.update(presentation({ elapsedSurvivalMs: 1_016, buildPanelVisible: true, pickupRadius: 96 }));

  const movedCircle = view.pickupWorldGraphic.calls.findLast(([name]) => name === "strokeCircle");
  assert.deepEqual(movedCircle, ["strokeCircle", 1_020, 760, 96]);
  assert.equal(movedCircle.includes(320), false);
});

test("pickup cues use presentation time without timers and expire back to hidden", () => {
  const scene = createScene();
  const view = createView(scene);

  view.notifyPickupCue({ reason: "build", nowMs: 100, durationMs: 300 });
  view.update(presentation({ elapsedSurvivalMs: 399, buildPanelVisible: false }));
  assert.equal(view.pickupWorldGraphic.visible, true);

  view.update(presentation({ elapsedSurvivalMs: 401, buildPanelVisible: false }));
  assert.equal(view.pickupWorldGraphic.visible, false);
});

test("system hot areas stay inside the system region and preserve pause and mute semantics", () => {
  const scene = createScene();
  let pauseCallbacks = 0;
  let muteCallbacks = 0;
  const view = createView(scene, {
    onTogglePause() {
      pauseCallbacks += 1;
    },
    onToggleMute() {
      muteCallbacks += 1;
    }
  });
  const { pauseHitArea, muteHitArea } = view.controls;
  const bounds = HUD_REGIONS.system;

  assert.deepEqual([pauseHitArea.width, pauseHitArea.height], [96, 30]);
  assert.deepEqual([muteHitArea.width, muteHitArea.height], [96, 26]);
  for (const hitArea of [pauseHitArea, muteHitArea]) {
    assert.equal(hitArea.x - hitArea.width / 2 >= 0, true);
    assert.equal(hitArea.y - hitArea.height / 2 >= 0, true);
    assert.equal(hitArea.x + hitArea.width / 2 <= bounds.width, true);
    assert.equal(hitArea.y + hitArea.height / 2 <= bounds.height, true);
    assert.equal(hitArea.interactive, true);
  }

  pauseHitArea.emit("pointerdown");
  assert.equal(pauseCallbacks, 1);
  assert.equal(scene.togglePauseCalls, 0);

  muteHitArea.emit("pointerdown");
  assert.equal(scene.soundMuted, true);
  assert.equal(scene.updateMuteTextCalls, 1);
  assert.equal(muteCallbacks, 1);

  const previousEnabled = BALANCE.audio.enabled;
  BALANCE.audio.enabled = false;
  try {
    muteHitArea.emit("pointerdown");
    assert.equal(scene.soundMuted, true);
    assert.equal(scene.updateMuteTextCalls, 1);
    assert.equal(muteCallbacks, 1);
  } finally {
    BALANCE.audio.enabled = previousEnabled;
  }
});

test("update keeps HUD objects stable while swapping the one 48px weapon image texture", () => {
  const scene = createScene();
  const view = createView(scene);
  const weaponImage = scene.objects.find((object) => object.type === "image" && object.textureKey === TEXTURES.weaponPistolIcon);
  const initialObjects = [...view.objects];

  view.update(presentation());
  view.update(presentation({
    selectedWeaponId: "shotgun",
    weapon: {
      id: "shotgun",
      name: "收容突破器",
      currentLevel: 2,
      pelletCount: 6,
      currentShells: 4,
      magazineSize: 4,
      isReloading: false,
      reloadEndAtMs: 0,
      reloadDurationMs: 1_000
    }
  }));
  view.update(presentation({
    selectedWeaponId: "tesla",
    weapon: {
      id: "tesla",
      name: "便携式特斯拉投射器",
      currentLevel: 3,
      chainTargets: 4,
      cooldownMs: 1_000,
      nextAttackAtMs: 0
    }
  }));

  assert.equal(scene.objects.filter((object) => object.type === "image").length, 2);
  assert.equal(scene.objects.includes(weaponImage), true);
  assert.equal(weaponImage.textureKey, TEXTURES.weaponTeslaIcon);
  assert.deepEqual([weaponImage.displayWidth, weaponImage.displayHeight], [48, 48]);
  assert.equal(weaponImage.calls.filter(([name]) => name === "setDisplaySize").length, 1);
  assert.equal(view.objects.length, initialObjects.length);
  assert.equal(view.objects.every((object, index) => object === initialObjects[index]), true);
});

test("missing weapon textures retain the existing fallback image", () => {
  const scene = createScene({ missingTextures: [TEXTURES.weaponTeslaIcon] });
  const view = createView(scene);
  const weaponImage = scene.objects.find((object) => object.type === "image" && object.textureKey === TEXTURES.weaponPistolIcon);

  view.update(presentation({
    selectedWeaponId: "tesla",
    weapon: {
      id: "tesla",
      name: "便携式特斯拉投射器",
      currentLevel: 1,
      chainTargets: 3,
      cooldownMs: 1_000,
      nextAttackAtMs: 0
    }
  }));

  assert.equal(weaponImage.textureKey, TEXTURES.weaponPistolIcon);
  assert.equal(weaponImage.visible, true);
});

test("facility collapse and gameplay visibility only change existing display state", () => {
  const scene = createScene();
  const view = createView(scene);
  const before = [...view.objects];

  view.update(presentation({
    activeFacilityEvent: { type: "powerOutage", warning: "电力系统不稳定。" }
  }));
  view.setFacilityCollapsed(true);
  view.setGameplayVisible(false);

  assert.equal(view.regions.facility.container.visible, false);
  assert.equal(view.regions.mission.container.visible, false);
  assert.equal(view.objects.every((object, index) => object === before[index]), true);
});

test("destroy is idempotent and removes interactive listeners", () => {
  const scene = createScene();
  const view = createView(scene);

  view.destroy();
  view.destroy();

  assert.equal(scene.objects.every((object) => object.destroyed), true);
  for (const control of Object.values(view.controls)) {
    assert.equal(control.listenerCount, 0);
    assert.equal(control.interactive, false);
  }
});

test("constructor rollback destroys already-created objects and unregisters listeners after a mid-build failure", () => {
  const scene = createScene({ listenerEvent: "pointerdown", listenerFailures: 1 });

  assert.throws(
    () => createView(scene),
    /listener registration failed/
  );
  assert.equal(scene.objects.length > 0, true);
  assert.equal(scene.objects.every((object) => object.destroyed), true);
  assert.equal(scene.objects.every((object) => object.listenerCount === 0), true);
});
