import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import { HUD_REGIONS } from "../src/art/openingVisualContract.js";
import { TEXTURES } from "../src/assets/manifest.js";
import { getHudPresentation } from "../src/ui/hudPresentation.js";
import { createTacticalHudView } from "../src/ui/tacticalHudView.js";

async function loadHudMixin() {
  const source = await readFile(new URL("../src/scene/hud.js", import.meta.url), "utf8");
  const declaration = "export const hudMixin =";
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1, "hudMixin export must exist");
  const body = source.slice(start).replace(declaration, "const hudMixin =");
  return Function(`${body}\nreturn hudMixin;`)();
}

const hudMixin = await loadHudMixin();

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

function throwConfiguredFailure(failure, object, method) {
  const configured = failure.configuration;
  if (!configured || configured.type !== object.type || configured.method !== method) return;
  configured.seen = (configured.seen ?? 0) + 1;
  if (configured.seen === (configured.occurrence ?? 1)) {
    throw new Error(`configuration failed: ${object.type}.${method}`);
  }
}

function throwContainerAddFailure(failure, children) {
  const configured = failure.containerAdd;
  if (!configured) return;
  configured.seen = (configured.seen ?? 0) + 1;
  const child = children[0];
  const occurrenceMatches = configured.occurrence == null
    || configured.seen === configured.occurrence;
  const childMatches = configured.childType == null
    || (child?.type === configured.childType
      && (configured.textureKey == null || child.textureKey === configured.textureKey));
  if (occurrenceMatches && childMatches) {
    throw new Error(`container add failed: ${configured.label}`);
  }
}

function createDisplayObject(type, initial = {}, failure = {}) {
  const handlers = new Map();
  const addHandler = (event, handler, context, once) => {
    handlers.set(event, [
      ...(handlers.get(event) ?? []),
      { handler, context, once }
    ]);
  };
  const removeEntry = (event, target) => {
    const retained = (handlers.get(event) ?? []).filter((entry) => entry !== target);
    if (retained.length > 0) handlers.set(event, retained);
    else handlers.delete(event);
  };
  const removeHandler = (event, handler, context, once) => {
    if (handler === undefined) {
      handlers.delete(event);
      return;
    }
    const retained = (handlers.get(event) ?? []).filter((entry) => {
      if (entry.handler !== handler) return true;
      if (context !== undefined && entry.context !== context) return true;
      if (once !== undefined && entry.once !== once) return true;
      return false;
    });
    if (retained.length > 0) handlers.set(event, retained);
    else handlers.delete(event);
  };
  const object = {
    type,
    active: true,
    alpha: 1,
    calls: [],
    destroying: false,
    destroyed: false,
    interactive: false,
    scrollFactor: undefined,
    visible: true,
    ...initial,
    setDepth(value) {
      throwConfiguredFailure(failure, this, "setDepth");
      this.depth = value;
      return this;
    },
    setScrollFactor(value) {
      throwConfiguredFailure(failure, this, "setScrollFactor");
      this.scrollFactor = value;
      return this;
    },
    setOrigin(...args) {
      throwConfiguredFailure(failure, this, "setOrigin");
      this.origin = args;
      return this;
    },
    setVisible(value) {
      throwConfiguredFailure(failure, this, "setVisible");
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
      throwConfiguredFailure(failure, this, "setDisplaySize");
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
      throwConfiguredFailure(failure, this, "setInteractive");
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
    on(event, handler, context) {
      addHandler(event, handler, context, false);
      if (failure.listenerEvent === event && failure.remainingListenerFailures > 0) {
        failure.remainingListenerFailures -= 1;
        throw new Error("listener registration failed");
      }
      return this;
    },
    once(event, handler, context) {
      addHandler(event, handler, context, true);
      return this;
    },
    off(event, handler, context, once) {
      removeHandler(event, handler, context, once);
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
      throwContainerAddFailure(failure, children);
      for (const child of children) child.parentContainer = this;
      this.children = [...(this.children ?? []), ...children];
      return this;
    },
    destroy() {
      if (this.destroyed) return this;
      this.destroying = true;
      this.emit("destroy", this);
      this.removeAllListeners();
      this.active = false;
      this.destroyed = true;
      this.destroying = false;
      return this;
    }
  };
  Object.defineProperty(object, "listenerCount", {
    get: () => [...handlers.values()].reduce((count, entries) => count + entries.length, 0)
  });
  return object;
}

function createScene(options = {}) {
  const objects = [];
  const failure = {
    listenerEvent: options.listenerEvent,
    remainingListenerFailures: options.listenerFailures ?? 0,
    configuration: options.configurationFailure
      ? { ...options.configurationFailure }
      : null,
    containerAdd: options.containerAddFailure
      ? { ...options.containerAddFailure }
      : null
  };
  const add = (type, factory) => (...args) => {
    const object = factory(...args);
    objects.push(object);
    options.onCreate?.(object, { type, index: objects.length - 1 });
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

function isEffectivelyVisible(object) {
  for (let current = object; current; current = current.parentContainer) {
    if (current.visible === false) return false;
  }
  return true;
}

function assertSceneRolledBack(scene) {
  assert.equal(scene.objects.length > 0, true);
  assert.equal(scene.objects.every((object) => object.destroyed), true);
  assert.equal(scene.objects.every((object) => object.listenerCount === 0), true);
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

test("outage mask stays viewport-fixed outside the offset facility container", () => {
  const scene = createScene();
  const view = createView(scene);
  const darkness = view.refs.outageDarknessRt;
  const light = view.refs.outageLightSprite;

  assert.equal(darkness.parentContainer ?? null, null);
  assert.deepEqual(
    [darkness.x, darkness.y, darkness.width, darkness.height],
    [0, 0, 960, 540]
  );
  assert.deepEqual(darkness.origin, [0, 0]);
  assert.equal(darkness.scrollFactor, 0);
  assert.equal(darkness.depth, 40);
  assert.equal(light.parentContainer ?? null, null);
  assert.deepEqual(light.origin, [0.5]);
  assert.equal(light.scrollFactor, 0);
  assert.equal(light.depth, 40);

  view.update(presentation({
    activeFacilityEvent: { type: "powerOutage", warning: "power unstable" }
  }));
  assert.equal(darkness.visible, true);
  assert.equal(light.visible, false, "the erase-mask sprite must never render as a white orb");

  view.setGameplayVisible(false);
  assert.equal(darkness.visible, false);
  assert.equal(light.visible, false);
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

test("first pickup presentation establishes a hidden radius baseline without a cue", () => {
  const scene = createScene();
  const view = createView(scene);

  view.update(presentation({ elapsedSurvivalMs: 100, pickupRadius: 72 }));
  view.update(presentation({ elapsedSurvivalMs: 749, pickupRadius: 72 }));

  assert.equal(view.pickupWorldGraphic.visible, false);
  assert.equal(
    view.pickupWorldGraphic.calls.some(([name]) => name === "strokeCircle"),
    false
  );
});

test("pickup radius changes show a cue for 650ms and clear exactly at expiry", () => {
  const scene = createScene();
  const view = createView(scene);
  view.update(presentation({ elapsedSurvivalMs: 100, pickupRadius: 72 }));

  view.update(presentation({ elapsedSurvivalMs: 200, pickupRadius: 96 }));
  assert.equal(view.pickupWorldGraphic.visible, true);
  assert.deepEqual(
    view.pickupWorldGraphic.calls.findLast(([name]) => name === "strokeCircle"),
    ["strokeCircle", 400, 260, 96]
  );

  view.update(presentation({ elapsedSurvivalMs: 849, pickupRadius: 96 }));
  assert.equal(view.pickupWorldGraphic.visible, true);
  const clearsBeforeExpiry = view.pickupWorldGraphic.calls.filter(([name]) => name === "clear").length;

  view.update(presentation({ elapsedSurvivalMs: 850, pickupRadius: 96 }));
  assert.equal(view.pickupWorldGraphic.visible, false);
  assert.equal(
    view.pickupWorldGraphic.calls.filter(([name]) => name === "clear").length,
    clearsBeforeExpiry + 1
  );
  assert.deepEqual(view.pickupWorldGraphic.calls.at(-1), ["clear"]);
});

test("explicit pickup cues use presentation time without timers and expire exactly", () => {
  const scene = createScene();
  let timerCalls = 0;
  scene.time = {
    delayedCall() {
      timerCalls += 1;
    }
  };
  const view = createView(scene);
  view.update(presentation({ elapsedSurvivalMs: 100 }));

  view.notifyPickupCue({ reason: "combatStim", nowMs: 500, durationMs: 650 });
  view.update(presentation({ elapsedSurvivalMs: 1_149, buildPanelVisible: false }));
  assert.equal(view.pickupWorldGraphic.visible, true);

  view.update(presentation({ elapsedSurvivalMs: 1_150, buildPanelVisible: false }));
  assert.equal(view.pickupWorldGraphic.visible, false);
  assert.equal(timerCalls, 0);
});

test("build panel visibility and unexpired cues compose without leaving a permanent ring", () => {
  const scene = createScene();
  const view = createView(scene);
  view.update(presentation({ elapsedSurvivalMs: 100, buildPanelVisible: true }));
  assert.equal(view.pickupWorldGraphic.visible, true);

  view.update(presentation({ elapsedSurvivalMs: 200, buildPanelVisible: false }));
  assert.equal(view.pickupWorldGraphic.visible, false);

  view.notifyPickupCue({ reason: "medkit", nowMs: 300, durationMs: 650 });
  view.update(presentation({ elapsedSurvivalMs: 400, buildPanelVisible: true }));
  assert.equal(view.pickupWorldGraphic.visible, true);

  view.update(presentation({ elapsedSurvivalMs: 949, buildPanelVisible: false }));
  assert.equal(view.pickupWorldGraphic.visible, true);
  view.update(presentation({ elapsedSurvivalMs: 950, buildPanelVisible: false }));
  assert.equal(view.pickupWorldGraphic.visible, false);
});

test("overlapping pickup cues never shorten the active deadline", () => {
  const scene = createScene();
  const view = createView(scene);
  view.update(presentation({ elapsedSurvivalMs: 50 }));

  view.notifyPickupCue({ reason: "radius-change", nowMs: 100, durationMs: 650 });
  view.notifyPickupCue({ reason: "medkit", nowMs: 200, durationMs: 100 });
  view.update(presentation({ elapsedSurvivalMs: 749 }));
  assert.equal(view.pickupWorldGraphic.visible, true);

  view.update(presentation({ elapsedSurvivalMs: 750 }));
  assert.equal(view.pickupWorldGraphic.visible, false);
});

test("legacy per-frame pickup updates do not trigger or renew a tactical cue", () => {
  const scene = createScene();
  const view = createView(scene);
  const notifyPickupCue = view.notifyPickupCue;
  let notificationCalls = 0;
  view.notifyPickupCue = (...args) => {
    notificationCalls += 1;
    return notifyPickupCue(...args);
  };
  view.update(presentation({ elapsedSurvivalMs: 100 }));
  const hudFacade = {
    elapsedSurvivalMs: 100,
    _hudPresentation: { pickup: { nowMs: 100 } },
    tacticalHudView: view
  };

  for (const nowMs of [100, 101, 102]) {
    hudFacade.elapsedSurvivalMs = nowMs;
    hudFacade._hudPresentation = { pickup: { nowMs } };
    hudMixin.updatePickupRadiusIndicator.call(hudFacade);
    view.update(presentation({ elapsedSurvivalMs: nowMs }));
    assert.equal(view.pickupWorldGraphic.visible, false);
  }
  assert.equal(notificationCalls, 1, "the legacy shim is not called every frame");
});

test("pickup cue clock is nested under pickup and absent from the presentation root", () => {
  const scene = createScene();
  const view = createView(scene);
  const cueStart = presentation({ elapsedSurvivalMs: 500 });

  assert.equal(Object.hasOwn(cueStart, "nowMs"), false);
  assert.equal(cueStart.pickup.nowMs, 500);
  view.notifyPickupCue({ reason: "build", nowMs: cueStart.pickup.nowMs, durationMs: 100 });

  const beforeExpiry = presentation({ elapsedSurvivalMs: 599, buildPanelVisible: false });
  assert.equal(Object.hasOwn(beforeExpiry, "nowMs"), false);
  assert.equal(beforeExpiry.pickup.nowMs, 599);
  view.update(beforeExpiry);
  assert.equal(view.pickupWorldGraphic.visible, true);

  const afterExpiry = presentation({ elapsedSurvivalMs: 600, buildPanelVisible: false });
  assert.equal(Object.hasOwn(afterExpiry, "nowMs"), false);
  assert.equal(afterExpiry.pickup.nowMs, 600);
  view.update(afterExpiry);
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
  const initialViewObjects = [...view.objects];
  const initialSceneObjects = [...scene.objects];

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
  assert.equal(view.objects.length, initialViewObjects.length);
  assert.equal(view.objects.every((object, index) => object === initialViewObjects[index]), true);
  assert.equal(scene.objects.length, initialSceneObjects.length);
  assert.equal(scene.objects.every((object, index) => object === initialSceneObjects[index]), true);
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

test("facility keeps its single-line status while collapse only hides expanded warning detail", () => {
  const scene = createScene();
  const view = createView(scene);
  const before = [...view.objects];
  const stable = presentation();

  view.update(stable);
  assert.equal(view.regions.facility.container.visible, true);
  assert.equal(isEffectivelyVisible(view.refs.eventBannerTitle), true);
  assert.equal(view.refs.eventBannerTitle.text, `${stable.facility.title} // ${stable.facility.detail}`);
  assert.equal(isEffectivelyVisible(view.refs.eventBannerDetail), false);
  assert.equal(isEffectivelyVisible(view.refs.eventBannerBg), false);

  view.update(presentation({
    activeFacilityEvent: { type: "powerOutage", warning: "电力系统不稳定。" }
  }));
  assert.equal(isEffectivelyVisible(view.refs.eventBannerTitle), true);
  assert.equal(isEffectivelyVisible(view.refs.eventBannerDetail), true);
  assert.equal(isEffectivelyVisible(view.refs.eventBannerBg), true);

  view.setFacilityCollapsed(true);
  assert.equal(view.regions.facility.container.visible, true);
  assert.equal(isEffectivelyVisible(view.refs.eventBannerTitle), true);
  assert.equal(isEffectivelyVisible(view.refs.eventBannerDetail), false);
  assert.equal(isEffectivelyVisible(view.refs.eventBannerBg), false);

  view.setFacilityCollapsed(false);
  assert.equal(view.regions.facility.container.visible, true);
  assert.equal(isEffectivelyVisible(view.refs.eventBannerDetail), true);

  view.setGameplayVisible(false);
  assert.equal(view.regions.facility.container.visible, false);
  assert.equal(view.regions.mission.container.visible, false);

  view.setGameplayVisible(true);
  assert.equal(view.regions.facility.container.visible, true);
  assert.equal(isEffectivelyVisible(view.refs.eventBannerTitle), true);
  assert.equal(isEffectivelyVisible(view.refs.eventBannerDetail), true);
  assert.equal(view.objects.every((object, index) => object === before[index]), true);
});

test("destroy is idempotent and removes interactive listeners", () => {
  const scene = createScene();
  const view = createView(scene);
  const observedControl = view.controls.pauseHitArea;
  const destroyObservations = [];
  const persistentContext = { name: "persistent" };
  const onceContext = { name: "once" };
  const observeDestroy = function observeDestroy(target) {
    destroyObservations.push([
      this.name,
      target === observedControl,
      target.destroying,
      target.destroyed
    ]);
  };
  observedControl.on("destroy", observeDestroy, persistentContext);
  observedControl.once("destroy", observeDestroy, onceContext);

  view.destroy();
  view.destroy();

  assert.deepEqual(destroyObservations, [
    ["persistent", true, true, false],
    ["once", true, true, false]
  ]);
  assert.equal(scene.objects.every((object) => object.destroyed), true);
  for (const control of Object.values(view.controls)) {
    assert.equal(control.listenerCount, 0);
    assert.equal(control.interactive, false);
  }
});

test("destroy tolerates Phaser scene shutdown destroying HUD objects first", () => {
  const scene = createScene();
  const view = createView(scene);

  for (const object of scene.objects) {
    object.destroy();
    object.disableInteractive = () => {
      throw new Error("destroyed objects no longer have a Scene input system");
    };
    object.removeInteractive = () => {
      throw new Error("destroyed objects no longer have a Scene input system");
    };
  }

  assert.doesNotThrow(() => view.destroy());
  assert.equal(scene.objects.every((object) => object.destroyed), true);
  assert.equal(scene.objects.every((object) => object.listenerCount === 0), true);
});

test("constructor rollback destroys already-created objects and unregisters listeners after a mid-build failure", () => {
  const destroyObservations = [];
  let observedObject;
  const scene = createScene({
    listenerEvent: "pointerdown",
    listenerFailures: 1,
    onCreate(object) {
      if (observedObject) return;
      observedObject = object;
      object.on("destroy", (target) => {
        destroyObservations.push(["persistent", target.destroying, target.destroyed]);
      });
      object.once("destroy", (target) => {
        destroyObservations.push(["once", target.destroying, target.destroyed]);
      });
    }
  });

  assert.throws(
    () => createView(scene),
    /listener registration failed/
  );
  assert.deepEqual(destroyObservations, [
    ["persistent", true, false],
    ["once", true, false]
  ]);
  assert.equal(observedObject.destroyed, true);
  assert.equal(scene.objects.length > 0, true);
  assert.equal(scene.objects.every((object) => object.destroyed), true);
  assert.equal(scene.objects.every((object) => object.listenerCount === 0), true);
});

for (const { type, method } of [
  { type: "container", method: "setDepth" },
  { type: "container", method: "setScrollFactor" },
  { type: "text", method: "setOrigin" },
  { type: "image", method: "setDisplaySize" },
  { type: "rectangle", method: "setInteractive" },
  { type: "graphics", method: "setVisible" },
  { type: "renderTexture", method: "setVisible" },
  { type: "image", method: "setVisible" }
]) {
  test(`constructor owns ${type} before ${method} can throw`, () => {
    const scene = createScene({ configurationFailure: { type, method } });

    assert.throws(
      () => createView(scene),
      new RegExp(`configuration failed: ${type}\\.${method}`)
    );
    assertSceneRolledBack(scene);
  });
}

for (const { label, failure } of [
  {
    label: "early",
    failure: { label: "early", occurrence: 1 }
  },
  {
    label: "late",
    failure: {
      label: "late",
      childType: "image",
      textureKey: TEXTURES.weaponPistolIcon
    }
  }
]) {
  test(`constructor rolls back every object after ${label} container add failure`, () => {
    const scene = createScene({ containerAddFailure: failure });

    assert.throws(
      () => createView(scene),
      new RegExp(`container add failed: ${label}`)
    );
    assertSceneRolledBack(scene);
  });
}
