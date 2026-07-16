import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { TEXTURES, IMAGE_ASSETS } from "../src/assets/manifest.js";
import { generateFallbackTextures } from "../src/assets/fallbackTextureFactory.js";
import {
  OPENING_VIEWPORT,
  HUD_REGIONS
} from "../src/art/openingVisualContract.js";
import {
  createOpeningFacilityLayout,
  validateOpeningFacilityRelationships
} from "../src/art/openingFacilityLayout.js";
import { createFacilityRoomController } from "../src/art/facilityRoom.js";
import {
  COMBAT_PRESENTATION_DEPTH,
  createCombatFeedbackController
} from "../src/art/combatFeedback.js";
import { createTacticalHudView } from "../src/ui/tacticalHudView.js";
import { menusMixin } from "../src/scene/menus.js";

const SHUTDOWN = "shutdown";
const DESTROY = "destroy";

const SLICE_ASSET_CONTRACT = Object.freeze([
  ["facilityCombatFloor", "facility-combat-floor", "assets/art/facility/combat-floor.png"],
  ["facilityEntryThreshold", "facility-entry-threshold", "assets/art/facility/entry-threshold.png"],
  ["facilityMaintenanceDeck", "facility-maintenance-deck", "assets/art/facility/maintenance-deck.png"],
  ["facilityWallBank", "facility-wall-bank", "assets/art/facility/wall-bank.png"],
  ["facilityPowerJunction", "facility-power-junction", "assets/art/facility/power-junction.png"],
  ["facilityContaminationTrail", "facility-contamination-trail", "assets/art/facility/contamination-trail.png"],
  ["upgradeDamage", "upgrade-damage", "assets/art/upgrades/damage.png"],
  ["upgradeAttackSpeed", "upgrade-attack-speed", "assets/art/upgrades/attack-speed.png"],
  ["upgradeMoveSpeed", "upgrade-move-speed", "assets/art/upgrades/move-speed.png"],
  ["upgradeMaxHealth", "upgrade-max-health", "assets/art/upgrades/max-health.png"],
  ["upgradeProjectileCount", "upgrade-projectile-count", "assets/art/upgrades/projectile-count.png"],
  ["upgradePenetration", "upgrade-penetration", "assets/art/upgrades/penetration.png"],
  ["upgradePickupRadius", "upgrade-pickup-radius", "assets/art/upgrades/pickup-radius.png"],
  ["upgradeEmergencyHeal", "upgrade-emergency-heal", "assets/art/upgrades/emergency-heal.png"],
  ["upgradeBreacherKnockback", "upgrade-breacher-knockback", "assets/art/upgrades/breacher-knockback.png"],
  ["upgradeBreacherSuppression", "upgrade-breacher-suppression", "assets/art/upgrades/breacher-suppression.png"],
  ["upgradeBreacherMagazine", "upgrade-breacher-magazine", "assets/art/upgrades/breacher-magazine.png"],
  ["upgradeTeslaChains", "upgrade-tesla-chains", "assets/art/upgrades/tesla-chains.png"],
  ["upgradeTeslaCooldown", "upgrade-tesla-cooldown", "assets/art/upgrades/tesla-cooldown.png"],
  ["upgradePistolBoomerang", "upgrade-pistol-boomerang", "assets/art/upgrades/pistol-boomerang.png"],
  ["upgradeBreacherExplosive", "upgrade-breacher-explosive", "assets/art/upgrades/breacher-explosive.png"],
  ["upgradeTeslaField", "upgrade-tesla-field", "assets/art/upgrades/tesla-field.png"],
  ["terminalSurfaceGrid", "terminal-surface-grid", "assets/art/ui/terminal-surface-grid.png"],
  ["incidentStampFrame", "incident-stamp-frame", "assets/art/ui/incident-stamp-frame.png"],
  ["recontainmentStampFrame", "recontainment-stamp-frame", "assets/art/ui/recontainment-stamp-frame.png"],
  ["contactShadow", "contact-shadow", "assets/art/effects/contact-shadow.png"]
]);

class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, fn, context) {
    const entries = this.listeners.get(event) ?? [];
    entries.push({ fn, context, once: false });
    this.listeners.set(event, entries);
    return this;
  }

  once(event, fn, context) {
    const entries = this.listeners.get(event) ?? [];
    entries.push({ fn, context, once: true });
    this.listeners.set(event, entries);
    return this;
  }

  off(event, fn, context) {
    if (fn === undefined) {
      this.listeners.delete(event);
      return this;
    }
    const retained = (this.listeners.get(event) ?? []).filter(
      (entry) => entry.fn !== fn || entry.context !== context
    );
    if (retained.length > 0) this.listeners.set(event, retained);
    else this.listeners.delete(event);
    return this;
  }

  emit(event, ...args) {
    const entries = [...(this.listeners.get(event) ?? [])];
    const retained = (this.listeners.get(event) ?? []).filter((entry) => !entry.once);
    if (retained.length > 0) this.listeners.set(event, retained);
    else this.listeners.delete(event);
    for (const entry of entries) entry.fn.call(entry.context, ...args);
    return this;
  }

  removeAllListeners(event) {
    if (event === undefined) this.listeners.clear();
    else this.listeners.delete(event);
    return this;
  }

  listenerCount(event) {
    return (this.listeners.get(event) ?? []).length;
  }
}

function makeDisplayObject(scene, type, properties = {}) {
  const events = new EventBus();
  const object = {
    type,
    active: true,
    destroyed: false,
    visible: true,
    alpha: 1,
    depth: 0,
    scrollFactor: 1,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    textureKey: null,
    parentContainer: null,
    data: new Map(),
    input: null,
    ...properties,
    on(event, fn, context) { events.on(event, fn, context); return this; },
    once(event, fn, context) { events.once(event, fn, context); return this; },
    off(event, fn, context) { events.off(event, fn, context); return this; },
    emit(event, ...args) { events.emit(event, ...args); return this; },
    removeAllListeners(event) { events.removeAllListeners(event); return this; },
    setDepth(value) { this.depth = value; return this; },
    setScrollFactor(value) { this.scrollFactor = value; return this; },
    setPosition(x, y) { this.x = x; this.y = y; return this; },
    setOrigin(...value) { this.origin = value; return this; },
    setAlpha(value) { this.alpha = value; return this; },
    setVisible(value) { this.visible = value === true; return this; },
    setTint(value) { this.tint = value; return this; },
    setRotation(value) { this.rotation = value; return this; },
    setScale(x, y = x) { this.scaleX = x; this.scaleY = y; return this; },
    setDisplaySize(width, height) { this.displayWidth = width; this.displayHeight = height; return this; },
    setData(key, value) { this.data.set(key, value); return this; },
    setText(value) { this.text = String(value ?? ""); return this; },
    setColor(value) { this.color = value; return this; },
    setStyle(value) { this.style = { ...this.style, ...value }; return this; },
    setFillStyle(fill, alpha = 1) { this.fill = fill; this.alpha = alpha; return this; },
    setStrokeStyle(width, color, alpha = 1) {
      this.stroke = { width, color, alpha };
      return this;
    },
    setFontSize(value) {
      this.fontSize = Number.parseFloat(value) || 0;
      return this;
    },
    setTexture(value) { this.textureKey = value; return this; },
    getBounds() {
      const fontSize = this.fontSize || Number.parseFloat(this.style?.fontSize) || 12;
      return {
        width: Math.min(this.style?.wordWrap?.width ?? Infinity, [...String(this.text ?? "")].length * fontSize * 0.7),
        height: fontSize + 2
      };
    },
    setInteractive(options = {}) { this.input = { enabled: true, ...options }; return this; },
    disableInteractive() { if (this.input) this.input.enabled = false; return this; },
    removeInteractive() { this.input = null; return this; },
    clear() { return this; },
    fillStyle() { return this; },
    fillRect() { return this; },
    fillCircle() { return this; },
    fillTriangle() { return this; },
    lineStyle() { return this; },
    lineBetween() { return this; },
    strokeRect() { return this; },
    strokeCircle() { return this; },
    beginPath() { return this; },
    moveTo() { return this; },
    lineTo() { return this; },
    closePath() { return this; },
    fillPath() { return this; },
    strokePath() { return this; },
    erase() { return this; },
    destroy() {
      if (this.destroyed) return this;
      if (this.list) {
        for (const child of [...this.list]) child.destroy?.();
      }
      this.parentContainer?.removeChild?.(this);
      this.disableInteractive();
      this.emit("destroy", this, false);
      this.removeAllListeners();
      this.active = false;
      this.destroyed = true;
      scene.children.list = scene.children.list.filter((candidate) => candidate !== this);
      return this;
    }
  };

  if (type === "container") {
    object.list = [];
    object.add = function add(children) {
      for (const child of Array.isArray(children) ? children : [children]) {
        if (!child) continue;
        child.parentContainer?.removeChild?.(child);
        if (!this.list.includes(child)) this.list.push(child);
        child.parentContainer = this;
      }
      return this;
    };
    object.removeChild = function removeChild(child) {
      this.list = this.list.filter((candidate) => candidate !== child);
      if (child?.parentContainer === this) child.parentContainer = null;
      return this;
    };
  }

  scene.created.push(object);
  scene.children.list.push(object);
  return object;
}

function makeScene() {
  const scene = {
    created: [],
    children: { list: [] },
    events: new EventBus(),
    scale: { width: OPENING_VIEWPORT.width, height: OPENING_VIEWPORT.height },
    cameras: {
      main: {
        width: OPENING_VIEWPORT.width,
        height: OPENING_VIEWPORT.height,
        scrollX: 0,
        scrollY: 0
      }
    },
    textures: {
      exists() { return true; },
      get() { return { setFilter() {} }; }
    },
    tweens: {
      created: [],
      add(config) {
        const tween = {
          config,
          removed: false,
          remove() { this.removed = true; }
        };
        this.created.push(tween);
        return tween;
      }
    },
    time: { now: 0 },
    soundMuted: false,
    isMissionActive: true,
    isGameOver: false,
    isLevelUpActive: false,
    isPaused: false,
    bossPhaseActive: false,
    elapsedSurvivalMs: 73400,
    killCount: 37,
    lastRunCreditsEarned: 42,
    meta: { credits: 314, perks: {} },
    player: { x: 480, y: 270 },
    getFinalSurvivalTimeSeconds() { return "73.4"; },
    syncScreenOverlayPosition(container) {
      container.setPosition(this.cameras.main.scrollX, this.cameras.main.scrollY);
    },
    updateMuteText() {},
    togglePause() {}
  };

  scene.add = {
    container: (x, y) => makeDisplayObject(scene, "container", { x, y }),
    graphics: () => makeDisplayObject(scene, "graphics"),
    rectangle: (x, y, width, height, fill, alpha) => makeDisplayObject(
      scene,
      "rectangle",
      { x, y, width, height, fill, alpha }
    ),
    image: (x, y, textureKey) => makeDisplayObject(scene, "image", { x, y, textureKey }),
    tileSprite: (x, y, width, height, textureKey) => makeDisplayObject(
      scene,
      "tileSprite",
      { x, y, width, height, textureKey }
    ),
    text: (x, y, text, style = {}) => makeDisplayObject(
      scene,
      "text",
      { x, y, text: String(text ?? ""), style: { ...style } }
    ),
    renderTexture: (x, y, width, height) => makeDisplayObject(
      scene,
      "renderTexture",
      { x, y, width, height }
    )
  };

  return scene;
}

function rectanglesOverlap(first, second) {
  return (
    first.x < second.x + second.width
    && first.x + first.width > second.x
    && first.y < second.y + second.height
    && first.y + first.height > second.y
  );
}

function globalPosition(object) {
  let x = object.x ?? 0;
  let y = object.y ?? 0;
  for (let parent = object.parentContainer; parent; parent = parent.parentContainer) {
    x += parent.x ?? 0;
    y += parent.y ?? 0;
  }
  return { x, y };
}

function screenBounds(scene, object) {
  const position = globalPosition(object);
  const scrollFactor = Number.isFinite(object.scrollFactor) ? object.scrollFactor : 1;
  const x = position.x - (scene.cameras.main.scrollX ?? 0) * scrollFactor;
  const y = position.y - (scene.cameras.main.scrollY ?? 0) * scrollFactor;
  const measured = object.getBounds?.() ?? {};
  const width = object.displayWidth > 0
    ? object.displayWidth
    : object.width > 0 ? object.width : measured.width ?? 0;
  const height = object.displayHeight > 0
    ? object.displayHeight
    : object.height > 0 ? object.height : measured.height ?? 0;
  const centered = ["rectangle", "image", "tileSprite", "renderTexture"].includes(object.type);
  const originX = object.origin?.[0] ?? (centered ? 0.5 : 0);
  const originY = object.origin?.[1] ?? (centered ? 0.5 : 0);
  return {
    x: x - width * originX,
    y: y - height * originY,
    width,
    height
  };
}

function dispatchPointerDown(scene, x, y) {
  const candidates = scene.children.list.filter((object) => {
    if (!object.active || !object.visible || !object.input?.enabled) return false;
    if (!(object.width > 0) || !(object.height > 0)) return false;
    for (let parent = object.parentContainer; parent; parent = parent.parentContainer) {
      if (!parent.active || !parent.visible) return false;
    }
    const bounds = screenBounds(scene, object);
    return (
      x >= bounds.x
      && x <= bounds.x + bounds.width
      && y >= bounds.y
      && y <= bounds.y + bounds.height
    );
  });
  candidates.sort((first, second) => (
    first.depth - second.depth
    || scene.created.indexOf(first) - scene.created.indexOf(second)
  ));
  const target = candidates.at(-1) ?? null;
  target?.emit("pointerdown");
  return target;
}

function findBlockEnd(source, bodyStart) {
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = bodyStart; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === "\"" || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "{") depth += 1;
    if (character === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  throw new Error("unterminated source block");
}

function extractObjectMethod(source, name) {
  const start = source.search(new RegExp(`^  ${name}\\(`, "m"));
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = source.indexOf("{", start);
  return source.slice(start, findBlockEnd(source, bodyStart) + 1);
}

function extractNamedFunction(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `missing ${name}`);
  const bodyStart = source.indexOf("{", start);
  return source.slice(start, findBlockEnd(source, bodyStart) + 1);
}

async function loadMainLifecycle() {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const teardown = extractObjectMethod(source, "teardownManagers");
  const install = extractNamedFunction(source, "installManagerTeardown");
  const teardownManagers = new Function(`"use strict"; return ({${teardown}}).teardownManagers;`)();
  const installManagerTeardown = new Function(
    "Phaser",
    `"use strict"; ${install}; return installManagerTeardown;`
  )({ Scenes: { Events: { SHUTDOWN, DESTROY } } });
  return { teardownManagers, installManagerTeardown };
}

async function loadPresentationLifecycleMixins(tacticalFactory = createTacticalHudView) {
  const [hudSource, worldSource] = await Promise.all([
    readFile(new URL("../src/scene/hud.js", import.meta.url), "utf8"),
    readFile(new URL("../src/scene/world.js", import.meta.url), "utf8")
  ]);
  const Phaser = { Scenes: { Events: { SHUTDOWN, DESTROY } } };
  const hudMethods = [
    "createUI",
    "installHudAliases",
    "snapshotHudObjectIdentities",
    "collectHudObjectsSince",
    "destroyHudObjectsSince",
    "createNoopHudView",
    "teardownHud",
    "setGameplayHudVisible"
  ].map((name) => extractObjectMethod(hudSource, name)).join(",");
  const worldMethods = [
    "bindFacilityRoomLifecycle",
    "teardownFacilityRoomController"
  ].map((name) => extractObjectMethod(worldSource, name)).join(",");
  const hudLifecycle = new Function(
    "Phaser",
    "createTacticalHudView",
    "HUD_REGIONS",
    `"use strict"; return ({${hudMethods}});`
  )(Phaser, tacticalFactory, HUD_REGIONS);
  const worldLifecycle = new Function(
    "Phaser",
    `"use strict"; return ({${worldMethods}});`
  )(Phaser);
  return { hudLifecycle, worldLifecycle };
}

async function loadSystemMethods(...names) {
  const source = await readFile(new URL("../src/scene/systems.js", import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  return new Function(`"use strict"; return ({${methods}});`)();
}

async function loadTimelineMethods(...names) {
  const source = await readFile(new URL("../src/scene/timeline.js", import.meta.url), "utf8");
  const methods = names.map((name) => extractObjectMethod(source, name)).join(",");
  const Phaser = { Math: { FloatBetween: (_min, max) => max } };
  return new Function("Phaser", `"use strict"; return ({${methods}});`)(Phaser);
}

async function loadEnemyWarningMethods() {
  const source = await readFile(new URL("../src/scene/enemies.js", import.meta.url), "utf8");
  const methods = ["createChargeWarning", "createTeleportWarning", "clearEliteWarning"]
    .map((name) => extractObjectMethod(source, name))
    .join(",");
  return new Function(
    "COMBAT_PRESENTATION_DEPTH",
    `"use strict"; return ({${methods}});`
  )(COMBAT_PRESENTATION_DEPTH);
}

async function loadMainUpdate() {
  const source = await readFile(new URL("../src/main.js", import.meta.url), "utf8");
  const update = extractObjectMethod(source, "update");
  return new Function(
    "syncCharacterPresentation",
    `"use strict"; return ({${update}}).update;`
  )((scene) => scene.updateTrace.push("presentation:sync"));
}

function installSceneMethods(scene, presentationLifecycle) {
  Object.assign(scene, presentationLifecycle.hudLifecycle, presentationLifecycle.worldLifecycle);
  for (const method of [
    "showGameOverOverlay",
    "showVictoryOverlay",
    "showMissionResultOverlay",
    "showPauseOverlay",
    "hidePauseOverlay",
    "destroyResultOverlay",
    "quitToTitle",
    "teardownTerminalOverlays"
  ]) {
    scene[method] = menusMixin[method];
  }
  scene.cancelLevelUpResolutionTimer = () => {};
  scene.destroyLevelUpOverlay = () => {};
  scene.destroyBuildPanel = () => {};
  return scene;
}

async function installPresentationCycle(scene, lifecycle) {
  const facility = createFacilityRoomController(
    scene,
    OPENING_VIEWPORT.width,
    OPENING_VIEWPORT.height
  );
  const facilityObjects = [...facility.objects];
  scene.facilityRoomController = facility;
  scene.facilityVisuals = facility.objects;
  scene.bindFacilityRoomLifecycle();

  scene.createUI();
  const hudObjects = [...scene.tacticalHudView.objects];

  const combatFeedback = createCombatFeedbackController(scene);
  scene.combatFeedback = combatFeedback;
  scene.audio = { destroyed: false, destroy() { this.destroyed = true; } };
  scene.ui = { destroyed: false, destroy() { this.destroyed = true; } };
  scene.teardownManagers = lifecycle.teardownManagers;
  lifecycle.installManagerTeardown(scene);

  return { facilityObjects, hudObjects, combatFeedback };
}

test("slice assets have one production file one manifest path and one executable fallback", async () => {
  assert.equal(SLICE_ASSET_CONTRACT.length, 26);
  const fallbackSource = await readFile(
    new URL("../src/assets/fallbackTextureFactory.js", import.meta.url),
    "utf8"
  );
  const allManifestKeys = IMAGE_ASSETS.map(({ key }) => key);
  const allManifestPaths = IMAGE_ASSETS.map(({ path }) => path);
  assert.equal(new Set(allManifestKeys).size, allManifestKeys.length, "manifest keys stay unique");
  assert.equal(new Set(allManifestPaths).size, allManifestPaths.length, "manifest paths stay unique");
  const expectedKeys = new Set(SLICE_ASSET_CONTRACT.map(([, key]) => key));
  const generated = new Set();
  const fallbackCalls = new Map();
  const graphics = {
    clear() { return this; },
    fillCircle() { return this; },
    fillEllipse() { return this; },
    fillRect() { return this; },
    fillStyle() { return this; },
    fillTriangle() { return this; },
    lineBetween() { return this; },
    lineStyle() { return this; },
    strokeCircle() { return this; },
    strokeRect() { return this; },
    generateTexture(key) {
      fallbackCalls.set(key, (fallbackCalls.get(key) ?? 0) + 1);
      generated.add(key);
      return this;
    },
    destroy() { this.destroyed = true; }
  };
  generateFallbackTextures({
    textures: {
      exists(key) {
        return !expectedKeys.has(key) || generated.has(key);
      }
    },
    add: { graphics: () => graphics }
  });
  assert.equal(graphics.destroyed, true, "fallback generator releases its scratch graphics");
  assert.equal(
    new Set(SLICE_ASSET_CONTRACT.map(([property]) => TEXTURES[property])).size,
    SLICE_ASSET_CONTRACT.length,
    "slice texture values stay unique"
  );

  for (const [property, key, path] of SLICE_ASSET_CONTRACT) {
    assert.equal(TEXTURES[property], key, `TEXTURES.${property} must keep its approved key`);
    const entries = IMAGE_ASSETS.filter((asset) => asset.key === key);
    assert.equal(entries.length, 1, `${property} must have exactly one production manifest entry`);
    assert.equal(entries[0].path, path, `${property} must keep its approved production path`);
    const file = await stat(new URL(`../public/${path}`, import.meta.url));
    assert.equal(file.isFile(), true, `${property} production path must be a PNG file`);
    const fallbackMatches = fallbackSource.match(
      new RegExp(`ensureTexture\\(scene, TEXTURES\\.${property}\\b`, "g")
    ) ?? [];
    assert.equal(fallbackMatches.length, 1, `${property} must have exactly one fallback generator`);
    assert.equal(fallbackCalls.get(key), 1, `${property} fallback must execute exactly once when missing`);
  }
});

test("opening facility preserves the center-safe floor and rejects decorative intrusion", () => {
  const layout = createOpeningFacilityLayout(OPENING_VIEWPORT.width, OPENING_VIEWPORT.height);
  assert.deepEqual(validateOpeningFacilityRelationships(layout), []);

  const mutated = structuredClone(layout);
  const junction = mutated.find(({ id }) => id === "maintenance-power-junction");
  junction.x = OPENING_VIEWPORT.width / 2;
  junction.y = OPENING_VIEWPORT.height / 2;
  assert.ok(
    validateOpeningFacilityRelationships(mutated).includes("safe-area-intrusion"),
    "integration gate must reject a non-floor visual moved into the combat-safe center"
  );
});

test("real timeline HUD and pause overlay compose inside 960x540 without input collision", async () => {
  const regions = Object.entries(HUD_REGIONS);
  for (let first = 0; first < regions.length; first += 1) {
    const [firstName, firstRegion] = regions[first];
    assert.ok(firstRegion.x >= 0 && firstRegion.y >= 0, `${firstName} begins inside viewport`);
    assert.ok(firstRegion.x + firstRegion.width <= OPENING_VIEWPORT.width, `${firstName} fits viewport width`);
    assert.ok(firstRegion.y + firstRegion.height <= OPENING_VIEWPORT.height, `${firstName} fits viewport height`);
    for (let second = first + 1; second < regions.length; second += 1) {
      assert.equal(
        rectanglesOverlap(firstRegion, regions[second][1]),
        false,
        `${firstName} must not overlap ${regions[second][0]}`
      );
    }
  }

  const scene = makeScene();
  let pauseClicks = 0;
  scene.cameras.main.scrollX = 320;
  scene.cameras.main.scrollY = 180;
  scene.isPaused = true;
  scene.physics = { world: { isPaused: true } };
  scene.spawnEvent = { paused: true };
  const gameplayStateBefore = structuredClone({
    isPaused: scene.isPaused,
    physicsPaused: scene.physics.world.isPaused,
    spawnPaused: scene.spawnEvent.paused
  });
  const view = createTacticalHudView(scene, {
    regions: HUD_REGIONS,
    onTogglePause: () => { pauseClicks += 1; }
  });
  scene.tacticalHudView = view;
  const { hudLifecycle } = await loadPresentationLifecycleMixins();
  hudLifecycle.installHudAliases.call(scene, view);
  scene.getTimelinePhase = () => ({ effects: { hudCorruption: true } });
  scene.resumeFromPause = () => {};
  scene.quitToTitle = () => {};
  const systemBefore = {
    x: view.regions.system.container.x,
    y: view.regions.system.container.y,
    alpha: view.regions.system.container.alpha
  };
  const timelineBefore = scene.timelineHudBasePositions.map(
    ([container]) => ({ container, x: container.x, y: container.y })
  );
  const { updateTimelineHudCorruption } = await loadTimelineMethods("updateTimelineHudCorruption");
  updateTimelineHudCorruption.call(scene);
  assert.ok(timelineBefore.every(({ container, x, y }) => (
    container.x !== x && container.y !== y && container.alpha === 0.82
  )), "the real timeline consumer corrupts all four timeline regions");
  assert.deepEqual({
    x: view.regions.system.container.x,
    y: view.regions.system.container.y,
    alpha: view.regions.system.container.alpha
  }, systemBefore, "the real timeline consumer excludes system controls");

  for (const [name, hitArea] of Object.entries(view.controls)) {
    const worldBounds = {
      x: HUD_REGIONS.system.x + hitArea.x - hitArea.width / 2,
      y: HUD_REGIONS.system.y + hitArea.y - hitArea.height / 2,
      width: hitArea.width,
      height: hitArea.height
    };
    assert.ok(worldBounds.x >= HUD_REGIONS.system.x, `${name} begins inside system region`);
    assert.ok(worldBounds.y >= HUD_REGIONS.system.y, `${name} begins inside system region`);
    assert.ok(worldBounds.x + worldBounds.width <= HUD_REGIONS.system.x + HUD_REGIONS.system.width);
    assert.ok(worldBounds.y + worldBounds.height <= HUD_REGIONS.system.y + HUD_REGIONS.system.height);
  }

  const pauseBounds = screenBounds(scene, view.controls.pauseHitArea);
  const pauseCenter = {
    x: pauseBounds.x + pauseBounds.width / 2,
    y: pauseBounds.y + pauseBounds.height / 2
  };
  assert.equal(dispatchPointerDown(scene, pauseCenter.x, pauseCenter.y), view.controls.pauseHitArea);
  assert.equal(pauseClicks, 1, "HUD pause hot area receives input before an overlay opens");

  const overlay = menusMixin.showPauseOverlay.call(scene);
  assert.ok(overlay, "the real pause controller must be constructed");
  assert.equal(scene.pauseOverlayController, overlay);
  assert.equal(overlay.container.x, scene.cameras.main.scrollX, "pause owner follows camera X");
  assert.equal(overlay.container.y, scene.cameras.main.scrollY, "pause owner follows camera Y");
  const dimmer = overlay.objects.find((object) => (
    object.type === "rectangle"
    && object.width === OPENING_VIEWPORT.width
    && object.height === OPENING_VIEWPORT.height
  ));
  assert.ok(dimmer?.input?.enabled, "full-screen overlay dimmer owns input");
  assert.ok(dimmer.depth > view.controls.pauseHitArea.depth, "overlay input sorts above HUD controls");
  assert.equal(dispatchPointerDown(scene, pauseCenter.x, pauseCenter.y), dimmer);
  assert.equal(pauseClicks, 1, "overlay dimmer blocks the underlying HUD hot area");
  const surface = overlay.objects.find((object) => (
    object.type === "tileSprite"
    && object.textureKey === TEXTURES.terminalSurfaceGrid
  ));
  assert.ok(surface && surface.parentContainer === overlay.body, "real panel surface belongs to the body");
  const texts = overlay.objects.filter((object) => object.type === "text");
  assert.ok(texts.some(({ text }) => text === "行动暂停"), "real header title is present");
  assert.ok(texts.some(({ text }) => text.includes("站点编号")), "real status content is present");
  assert.ok(texts.some(({ text }) => text.includes("设施状态")), "real facility content is present");
  for (const object of [dimmer, surface, ...texts]) {
    const bounds = screenBounds(scene, object);
    assert.ok(bounds.width > 0 && bounds.height > 0, `${object.type} exposes measurable bounds`);
    assert.ok(bounds.x >= 0, `${object.type} begins inside viewport width`);
    assert.ok(bounds.y >= 0, `${object.type} begins inside viewport height`);
    assert.ok(bounds.x + bounds.width <= OPENING_VIEWPORT.width, `${object.type} fits viewport width`);
    assert.ok(bounds.y + bounds.height <= OPENING_VIEWPORT.height, `${object.type} fits viewport height`);
  }
  for (const [name, action] of Object.entries(overlay.actions)) {
    const bounds = screenBounds(scene, action.hitArea);
    assert.ok(bounds.x >= 0, `${name} begins inside viewport`);
    assert.ok(bounds.x + bounds.width <= OPENING_VIEWPORT.width, `${name} fits viewport width`);
    assert.ok(bounds.y >= 0, `${name} begins inside viewport`);
    assert.ok(bounds.y + bounds.height <= OPENING_VIEWPORT.height, `${name} fits viewport height`);
  }
  assert.deepEqual({
    isPaused: scene.isPaused,
    physicsPaused: scene.physics.world.isPaused,
    spawnPaused: scene.spawnEvent.paused
  }, gameplayStateBefore, "view construction does not alter committed gameplay pause state");

  const overlayObjects = [...overlay.objects];
  menusMixin.hidePauseOverlay.call(scene);
  assert.ok(overlayObjects.every(({ destroyed }) => destroyed));
  assert.ok(overlayObjects.every((object) => !scene.children.list.includes(object)));
  view.destroy();
});

test("live elite warnings stay above combat decoration and actor-relative shadows stay below actors", async () => {
  const scene = makeScene();
  const controller = createCombatFeedbackController(scene);
  const actor = { x: 40, y: 60, depth: 6, active: true };
  controller.trackActor(actor, { kind: "player", radius: 12 });
  controller.update(1);
  const shadow = scene.created.find((object) => object.type === "image");
  assert.equal(shadow.depth, actor.depth - 1);

  controller.notifyHit({ impactX: 40, impactY: 60, enemyType: "drone", lethal: false });
  controller.notifyDeath({ x: 40, y: 60, enemyType: "drone", isBoss: false });
  const decorations = scene.created.filter((object) => object.type === "graphics");
  assert.ok(decorations.length >= 2);
  assert.ok(decorations.every(({ depth }) => (
    depth >= COMBAT_PRESENTATION_DEPTH.decorationMin
    && depth <= COMBAT_PRESENTATION_DEPTH.decorationMax
  )));
  Object.assign(scene, await loadEnemyWarningMethods());
  scene.registerTransientEffect = () => {};
  const enemy = { x: 40, y: 60, chargeAngle: 0, warningGraphic: null };
  scene.createChargeWarning(enemy);
  assert.equal(enemy.warningGraphic.depth, COMBAT_PRESENTATION_DEPTH.warning);
  assert.ok(decorations.every(({ depth }) => depth < enemy.warningGraphic.depth));
  scene.createTeleportWarning(enemy, 64, 72);
  assert.equal(enemy.warningGraphic.depth, COMBAT_PRESENTATION_DEPTH.warning);
  assert.ok(decorations.every(({ depth }) => depth < enemy.warningGraphic.depth));
  scene.clearEliteWarning(enemy);
  controller.destroy();
});

test("one Scene shutdown releases facility HUD overlay combat and manager ownership", async () => {
  const [lifecycle, presentationLifecycle] = await Promise.all([
    loadMainLifecycle(),
    loadPresentationLifecycleMixins()
  ]);
  const scene = installSceneMethods(makeScene(), presentationLifecycle);
  const cycle = await installPresentationCycle(scene, lifecycle);

  const combatStart = scene.created.length;
  const actor = { x: 40, y: 60, depth: 6, active: true };
  cycle.combatFeedback.trackActor(actor, { kind: "player", radius: 12 });
  cycle.combatFeedback.notifyHit({ impactX: 40, impactY: 60, enemyType: "drone" });
  const combatObjects = scene.created.slice(combatStart);

  scene.isPaused = true;
  const pauseController = scene.showPauseOverlay();
  assert.ok(pauseController, "shutdown cycle must own the real pause controller");
  const overlayObjects = [...pauseController.objects];
  const audio = scene.audio;
  const ui = scene.ui;

  assert.equal(scene.events.listenerCount(SHUTDOWN), 3, "facility HUD and managers each own one shutdown hook");
  scene.events.emit(SHUTDOWN);

  assert.equal(scene.facilityRoomController, null);
  assert.equal(scene.tacticalHudView, null);
  assert.equal(scene.pauseOverlayController, null);
  assert.equal(scene.pauseOverlay, null);
  assert.equal(scene.combatFeedback, null);
  assert.equal(scene.audio, null);
  assert.equal(scene.ui, null);
  assert.equal(audio.destroyed, true);
  assert.equal(ui.destroyed, true);
  assert.ok(cycle.facilityObjects.every(({ destroyed }) => destroyed));
  assert.ok(cycle.hudObjects.every(({ destroyed }) => destroyed));
  assert.ok(overlayObjects.every(({ destroyed }) => destroyed));
  assert.ok(combatObjects.every(({ destroyed }) => destroyed));
  assert.equal(scene.events.listenerCount(SHUTDOWN), 0);
  assert.equal(scene.events.listenerCount(DESTROY), 1, "only the inert manager final-destroy hook remains");
  scene.events.emit(DESTROY);
  assert.equal(scene.events.listenerCount(DESTROY), 0);
});

test("return-title failure and victory restarts never accumulate subsystem listeners", async () => {
  const [lifecycle, presentationLifecycle] = await Promise.all([
    loadMainLifecycle(),
    loadPresentationLifecycleMixins()
  ]);
  const routes = [
    {
      name: "return-title",
      show(scene) {
        scene.isPaused = true;
        return scene.showPauseOverlay();
      },
      activate(controller) { controller.actions.quit.hitArea.emit("pointerdown"); },
      cleared(scene) { return !scene.pauseOverlayController && !scene.pauseOverlay; }
    },
    {
      name: "failure",
      show(scene) { return scene.showGameOverOverlay(); },
      activate(controller) { controller.actions.restart.hitArea.emit("pointerdown"); },
      cleared(scene) { return !scene.resultOverlayController && !scene.resultOverlay; }
    },
    {
      name: "victory",
      show(scene) { return scene.showVictoryOverlay(); },
      activate(controller) { controller.actions.restart.hitArea.emit("pointerdown"); },
      cleared(scene) { return !scene.resultOverlayController && !scene.resultOverlay; }
    }
  ];

  for (const route of routes) {
    const scene = installSceneMethods(makeScene(), presentationLifecycle);
    let restarts = 0;
    scene.scene = {
      restart() {
        restarts += 1;
        scene.events.emit(SHUTDOWN);
      }
    };

    for (let cycle = 0; cycle < 3; cycle += 1) {
      await installPresentationCycle(scene, lifecycle);
      assert.equal(scene.events.listenerCount(SHUTDOWN), 3, `${route.name} cycle ${cycle} shutdown hooks`);
      assert.equal(scene.events.listenerCount(DESTROY), 3, `${route.name} cycle ${cycle} destroy hooks`);
      const controller = route.show(scene);
      assert.ok(controller, `${route.name} cycle ${cycle} creates its real controller`);
      const overlayObjects = [...controller.objects];
      route.activate(controller);
      route.activate(controller);
      assert.equal(restarts, cycle + 1, `${route.name} restarts exactly once`);
      assert.equal(route.cleared(scene), true, `${route.name} clears controller ownership`);
      assert.ok(overlayObjects.every(({ destroyed }) => destroyed));
      assert.ok(overlayObjects.every((object) => !scene.children.list.includes(object)));
      assert.equal(scene.events.listenerCount(SHUTDOWN), 0);
      assert.equal(scene.events.listenerCount(DESTROY), 1);
    }
    scene.events.emit(DESTROY);
    assert.equal(scene.events.listenerCount(DESTROY), 0);
  }
});

test("missing or throwing presentation seams cannot block core pause resume and cleanup", async () => {
  const { pauseGameplaySystems, resumeGameplaySystems } = await loadSystemMethods(
    "pauseGameplaySystems",
    "resumeGameplaySystems"
  );
  const events = [];
  const scene = {
    physics: {
      pause() { events.push("physics:pause"); },
      resume() { events.push("physics:resume"); }
    },
    spawnEvent: { paused: false },
    regularSpawningActive: true,
    isGameOver: false,
    combatFeedback: null
  };
  assert.doesNotThrow(() => pauseGameplaySystems.call(scene));
  assert.doesNotThrow(() => resumeGameplaySystems.call(scene));
  scene.combatFeedback = { setPaused() { throw new Error("presentation unavailable"); } };
  assert.doesNotThrow(() => pauseGameplaySystems.call(scene));
  assert.doesNotThrow(() => resumeGameplaySystems.call(scene));
  assert.deepEqual(events, ["physics:pause", "physics:resume", "physics:pause", "physics:resume"]);
  assert.equal(scene.spawnEvent.paused, false);

  const noOp = createCombatFeedbackController({});
  assert.equal(noOp.notifyAttack({}), false);
  assert.equal(noOp.notifyHit({}), false);
  assert.equal(noOp.notifyDeath({}), false);
  assert.doesNotThrow(() => noOp.update(1));
  assert.doesNotThrow(() => noOp.destroy());

  const updateTrace = [];
  const coreScene = {
    updateTrace,
    isGameOver: false,
    isMissionActive: true,
    isPaused: false,
    isLevelUpActive: false,
    bossPhaseActive: false,
    elapsedSurvivalMs: 0,
    buildPanel: { visible: false },
    combatFeedback: {
      update(time) {
        updateTrace.push(`combat:update:${time}`);
        noOp.update(time);
      }
    }
  };
  for (const method of [
    "updateTimelineDirector",
    "updateTimelineEffects",
    "updateTemporaryBuffs",
    "updateFacilityEventDirector",
    "updateScp500Spawn",
    "handlePlayerMovement",
    "updateWeapons",
    "updateEnemies",
    "updatePlayerBullets",
    "updateEnemyProjectiles",
    "handleExperienceCollection",
    "updateSupplyPickups",
    "updatePickupRadiusIndicator",
    "updatePlayerInvulnerabilityVisual",
    "updateFacilityVisualEffects",
    "updateTimelineHudCorruption",
    "updateUI"
  ]) {
    coreScene[method] = () => updateTrace.push(method);
  }
  const mainUpdate = await loadMainUpdate();
  assert.doesNotThrow(() => mainUpdate.call(coreScene, 0, 16));
  assert.equal(coreScene.elapsedSurvivalMs, 16);
  assert.deepEqual(updateTrace, [
    "updateTimelineDirector",
    "updateTimelineEffects",
    "updateTemporaryBuffs",
    "updateFacilityEventDirector",
    "updateScp500Spawn",
    "handlePlayerMovement",
    "updateWeapons",
    "updateEnemies",
    "updatePlayerBullets",
    "updateEnemyProjectiles",
    "handleExperienceCollection",
    "updateSupplyPickups",
    "updatePickupRadiusIndicator",
    "presentation:sync",
    "combat:update:16",
    "updatePlayerInvulnerabilityVisual",
    "updateFacilityVisualEffects",
    "updateTimelineHudCorruption",
    "updateUI"
  ]);

  const { hudLifecycle, worldLifecycle } = await loadPresentationLifecycleMixins();
  assert.doesNotThrow(() => hudLifecycle.setGameplayHudVisible.call({}));

  const { hudLifecycle: fallbackHudLifecycle } = await loadPresentationLifecycleMixins(() => {
    throw new Error("tactical HUD unavailable");
  });
  const fallbackHudScene = makeScene();
  Object.assign(fallbackHudScene, fallbackHudLifecycle);
  fallbackHudScene.createLegacyHud = () => { throw new Error("legacy HUD unavailable"); };
  assert.doesNotThrow(() => fallbackHudScene.createUI());
  assert.equal(fallbackHudScene.tacticalHudView.mode, "noop");
  assert.deepEqual(fallbackHudScene.timelineHudBasePositions, []);
  assert.doesNotThrow(() => fallbackHudScene.events.emit(SHUTDOWN));

  const pauseFallbackScene = makeScene();
  pauseFallbackScene.isPaused = true;
  let resumedAfterPauseFailure = 0;
  pauseFallbackScene.resumeGameplaySystems = () => { resumedAfterPauseFailure += 1; };
  pauseFallbackScene.add.text = () => { throw new Error("pause overlay unavailable"); };
  assert.equal(menusMixin.showPauseOverlay.call(pauseFallbackScene), null);
  assert.equal(pauseFallbackScene.isPaused, false);
  assert.equal(resumedAfterPauseFailure, 1);
  assert.ok(pauseFallbackScene.created.every(({ destroyed }) => destroyed));

  const resultFallbackScene = makeScene();
  Object.assign(resultFallbackScene, {
    showMissionResultOverlay: menusMixin.showMissionResultOverlay,
    showGameOverOverlay: menusMixin.showGameOverOverlay,
    destroyResultOverlay: menusMixin.destroyResultOverlay
  });
  let resultRestarts = 0;
  resultFallbackScene.scene = { restart() { resultRestarts += 1; } };
  const addImage = resultFallbackScene.add.image;
  let failFirstImage = true;
  resultFallbackScene.add.image = (...args) => {
    if (failFirstImage) {
      failFirstImage = false;
      throw new Error("result stamp unavailable");
    }
    return addImage(...args);
  };
  const fallbackResult = resultFallbackScene.showGameOverOverlay();
  assert.equal(fallbackResult?.fallback, true);
  assert.equal(fallbackResult.actions.restart.hitArea.input?.enabled, true);
  const resultPartials = resultFallbackScene.created.filter(
    (object) => !fallbackResult.objects.includes(object)
  );
  assert.ok(resultPartials.every(({ destroyed }) => destroyed));
  fallbackResult.actions.restart.hitArea.emit("pointerdown");
  fallbackResult.actions.restart.hitArea.emit("pointerdown");
  assert.equal(resultRestarts, 1);
  assert.equal(resultFallbackScene.resultOverlayController, null);
  assert.equal(resultFallbackScene.resultOverlay, null);
  assert.ok(resultFallbackScene.children.list.every((object) => !object.destroyed));

  const facilityOwner = {
    events: new EventBus(),
    facilityRoomController: { destroy() { throw new Error("facility unavailable"); } },
    facilityVisuals: [{}]
  };
  facilityOwner.teardownFacilityRoomController = worldLifecycle.teardownFacilityRoomController;
  assert.doesNotThrow(() => facilityOwner.teardownFacilityRoomController());
  assert.equal(facilityOwner.facilityRoomController, null);
  assert.equal(facilityOwner.facilityVisuals, null);

  const teardownOrder = [];
  const overlayOwner = {
    cancelLevelUpResolutionTimer() { teardownOrder.push("timer"); throw new Error("timer"); },
    destroyLevelUpOverlay() { teardownOrder.push("level"); },
    hidePauseOverlay() { teardownOrder.push("pause"); throw new Error("pause"); },
    destroyResultOverlay() { teardownOrder.push("result"); },
    destroyBuildPanel() { teardownOrder.push("build"); }
  };
  assert.doesNotThrow(() => menusMixin.teardownTerminalOverlays.call(overlayOwner));
  assert.deepEqual(teardownOrder, ["timer", "level", "pause", "result", "build"]);
});
