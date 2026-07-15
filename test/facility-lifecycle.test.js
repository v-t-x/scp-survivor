import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TEXTURES } from "../src/assets/manifest.js";
import { getFacilityPresentation } from "../src/art/facilityPresentation.js";
import { WORLD_WIDTH, WORLD_HEIGHT } from "../src/config/constants.js";

const FACILITY_EVENTS = Object.freeze({
  SHUTDOWN: "shutdown",
  DESTROY: "destroy"
});

const CONTROLLER_KEYS = ["byId", "destroy", "objects", "reset", "setPresentation"];

function createEventEmitter() {
  const listeners = new Map();

  function remove(event, listener, context) {
    const current = listeners.get(event) ?? [];
    const retained = current.filter((entry) => entry.listener !== listener || entry.context !== context);
    if (retained.length > 0) {
      listeners.set(event, retained);
    } else {
      listeners.delete(event);
    }
  }

  return {
    off(event, listener, context) {
      remove(event, listener, context);
      return this;
    },
    once(event, listener, context) {
      const current = listeners.get(event) ?? [];
      current.push({ listener, context });
      listeners.set(event, current);
      return this;
    },
    emit(event) {
      const current = [...(listeners.get(event) ?? [])];
      for (const entry of current) {
        remove(event, entry.listener, entry.context);
        entry.listener.call(entry.context);
      }
    },
    listenerCount(event) {
      return (listeners.get(event) ?? []).length;
    }
  };
}

function createDisplayObject(kind, properties = {}) {
  return {
    kind,
    active: true,
    destroyed: false,
    destroyCalls: 0,
    tint: 0xffffff,
    alpha: 1,
    visible: true,
    depth: 0,
    ...properties,
    setDepth(value) {
      this.depth = value;
      return this;
    },
    setTint(value) {
      this.tint = value;
      return this;
    },
    setAlpha(value) {
      this.alpha = value;
      return this;
    },
    setVisible(value) {
      this.visible = value;
      return this;
    },
    setData() {
      return this;
    },
    lineStyle() {
      return this;
    },
    strokeRect() {
      return this;
    },
    destroy() {
      this.destroyCalls += 1;
      this.destroyed = true;
      this.active = false;
    }
  };
}

function createWorldScene({ textureExists = true, tileSpriteFailure = null, rectangleFailure = null } = {}) {
  const events = createEventEmitter();
  const displays = [];
  const metrics = { delayedCalls: 0, tweenAdds: 0 };
  const scene = {
    events,
    displays,
    metrics,
    textures: {
      exists(key) {
        return textureExists && key === TEXTURES.facilityFloor;
      }
    },
    add: {
      tileSprite(x, y, width, height, key) {
        if (tileSpriteFailure) throw tileSpriteFailure;
        const visual = createDisplayObject("tileSprite", { x, y, width, height, key });
        displays.push(visual);
        return visual;
      },
      rectangle(x, y, width, height, color, alpha) {
        if (rectangleFailure) throw rectangleFailure;
        const visual = createDisplayObject("rectangle", { x, y, width, height, color, alpha });
        displays.push(visual);
        return visual;
      },
      graphics() {
        const visual = createDisplayObject("graphics");
        displays.push(visual);
        return visual;
      }
    },
    time: {
      delayedCall() {
        metrics.delayedCalls += 1;
      }
    },
    tweens: {
      add() {
        metrics.tweenAdds += 1;
      }
    }
  };
  Object.defineProperty(scene, "physics", {
    get() {
      throw new Error("facility presentation must not access physics");
    }
  });
  return scene;
}

async function loadWorldHarness(createFacilityRoomController) {
  const source = await readFile(new URL("../src/scene/world.js", import.meta.url), "utf8");
  const declaration = "export const worldMixin =";
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1, "world mixin export must exist");
  const body = source
    .slice(start)
    .replace(declaration, "const worldMixin =")
    .replaceAll("export function ", "function ");
  const evaluate = Function(
    "Phaser",
    "createFacilityRoomController",
    "TEXTURES",
    "WORLD_WIDTH",
    "WORLD_HEIGHT",
    `${body}\nreturn {\n  worldMixin,\n  createMinimalFacilityFallback: typeof createMinimalFacilityFallback === \"function\" ? createMinimalFacilityFallback : undefined,\n  createNoopFacilityController: typeof createNoopFacilityController === \"function\" ? createNoopFacilityController : undefined\n};`
  );
  return evaluate(
    { Scenes: { Events: FACILITY_EVENTS } },
    createFacilityRoomController,
    TEXTURES,
    WORLD_WIDTH,
    WORLD_HEIGHT
  );
}

async function loadTimelineMixin() {
  const source = await readFile(new URL("../src/scene/timeline.js", import.meta.url), "utf8");
  const declaration = "export const timelineMixin =";
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1, "timeline mixin export must exist");
  const body = source.slice(start).replace(declaration, "const timelineMixin =");
  const evaluate = Function(
    "Phaser",
    "BALANCE",
    "getOutagePresentation",
    "getFacilityPresentation",
    `${body}\nreturn timelineMixin;`
  );
  return evaluate(
    {},
    {
      facility: {
        events: {
          powerOutage: { name: "电力故障", warning: "备用电源切换", durationMs: 25000 }
        }
      }
    },
    () => ({ darknessAlpha: 0.5 }),
    getFacilityPresentation
  );
}

async function loadSystemsMixin() {
  const source = await readFile(new URL("../src/scene/systems.js", import.meta.url), "utf8");
  const declaration = "export const systemsMixin =";
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1, "systems mixin export must exist");
  const body = source.slice(start).replace(declaration, "const systemsMixin =");
  return Function("Phaser", "BALANCE", `${body}\nreturn systemsMixin;`)({}, {});
}

function assertControllerShape(controller) {
  assert.deepEqual(Object.keys(controller).sort(), [...CONTROLLER_KEYS].sort());
  assert.ok(controller.byId instanceof Map);
  assert.ok(Array.isArray(controller.objects));
}

test("facility fallback and noop controllers keep the production controller shape without physics", async () => {
  const {
    createMinimalFacilityFallback,
    createNoopFacilityController
  } = await loadWorldHarness(() => {
    throw new Error("primary renderer unavailable");
  });

  assert.equal(typeof createMinimalFacilityFallback, "function");
  assert.equal(typeof createNoopFacilityController, "function");

  const texturedScene = createWorldScene();
  const texturedFallback = createMinimalFacilityFallback(texturedScene, 1920, 1920);
  assertControllerShape(texturedFallback);
  assert.equal(texturedFallback.objects.length, 1);
  assert.equal(texturedFallback.objects[0].kind, "tileSprite");
  assert.equal(texturedFallback.objects[0].key, TEXTURES.facilityFloor);

  const rectangleScene = createWorldScene({ tileSpriteFailure: new Error("texture display failed") });
  const rectangleFallback = createMinimalFacilityFallback(rectangleScene, 1920, 1920);
  assertControllerShape(rectangleFallback);
  assert.equal(rectangleFallback.objects.length, 1);
  assert.equal(rectangleFallback.objects[0].kind, "rectangle");

  const noopScene = createWorldScene({
    tileSpriteFailure: new Error("tileSprite unavailable"),
    rectangleFailure: new Error("rectangle unavailable")
  });
  const noopFallback = createMinimalFacilityFallback(noopScene, 1920, 1920);
  const directNoop = createNoopFacilityController();
  for (const controller of [noopFallback, directNoop]) {
    assertControllerShape(controller);
    assert.equal(controller.objects.length, 0);
    assert.equal(controller.byId.size, 0);
    assert.doesNotThrow(() => {
      controller.setPresentation(getFacilityPresentation({ outageStrength: 1 }));
      controller.reset();
      controller.destroy();
      controller.destroy();
    });
  }
  assert.deepEqual(texturedScene.metrics, { delayedCalls: 0, tweenAdds: 0 });
  assert.deepEqual(rectangleScene.metrics, { delayedCalls: 0, tweenAdds: 0 });
  assert.deepEqual(noopScene.metrics, { delayedCalls: 0, tweenAdds: 0 });
});

test("facility controller lifecycle tears down references and does not grow objects, timers, tweens, or listeners across restarts", async () => {
  const controllers = [];
  const { worldMixin } = await loadWorldHarness((scene, width, height) => {
    const visual = scene.add.rectangle(width / 2, height / 2, width, height, 0x18202a, 1);
    const objects = [visual];
    const byId = new Map([["primary-floor", visual]]);
    const controller = {
      objects,
      byId,
      setPresentation() {},
      reset() {},
      destroyCalls: 0,
      destroy() {
        this.destroyCalls += 1;
        if (this.destroyCalls > 1) return;
        visual.destroy();
        objects.length = 0;
        byId.clear();
      }
    };
    controllers.push(controller);
    return controller;
  });
  const scene = createWorldScene();
  Object.assign(scene, worldMixin);

  for (let restart = 0; restart < 3; restart += 1) {
    scene.createArenaDecoration();
    assert.equal(scene.facilityRoomController, controllers[restart]);
    assert.equal(scene.facilityVisuals, controllers[restart].objects);
    assert.equal(scene.events.listenerCount(FACILITY_EVENTS.SHUTDOWN), 1);
    assert.equal(scene.events.listenerCount(FACILITY_EVENTS.DESTROY), 1);
    assert.deepEqual(scene.metrics, { delayedCalls: 0, tweenAdds: 0 });

    scene.events.emit(FACILITY_EVENTS.SHUTDOWN);
    scene.events.emit(FACILITY_EVENTS.DESTROY);

    assert.equal(controllers[restart].destroyCalls, 1);
    assert.equal(controllers[restart].objects.length, 0);
    assert.equal(controllers[restart].byId.size, 0);
    assert.equal(scene.facilityRoomController, null);
    assert.equal(scene.facilityVisuals, null);
    assert.equal(scene.events.listenerCount(FACILITY_EVENTS.SHUTDOWN), 0);
    assert.equal(scene.events.listenerCount(FACILITY_EVENTS.DESTROY), 0);
    assert.deepEqual(scene.metrics, { delayedCalls: 0, tweenAdds: 0 });
  }
});

function createColliderIdentityFixture() {
  const handles = Object.freeze([
    Object.freeze({}),
    Object.freeze({}),
    Object.freeze({})
  ]);
  return {
    originalSet: new Set(handles),
    originalHandles: handles
  };
}

function assertColliderIdentityPreserved(scene, originalSet, originalHandles) {
  assert.strictEqual(scene.collisionObjects, originalSet, "collider Set reference must be preserved");
  assert.equal(scene.collisionObjects.size, originalHandles.length, "collider Set size must not change");
  for (const handle of originalHandles) {
    assert.ok(scene.collisionObjects.has(handle), "every original collider handle must remain by identity");
  }
  for (const handle of scene.collisionObjects) {
    assert.ok(originalHandles.includes(handle), "collider Set must not gain or replace members");
  }
}

function createTimelineScene(timelineMixin, facilityRoomController) {
  const operations = [];
  const { originalSet, originalHandles } = createColliderIdentityFixture();
  const scene = {
    elapsedSurvivalMs: 180000,
    activeFacilityEvent: null,
    activeFacilityEventEndAtMs: 0,
    outageVisualStrength: 0,
    bossPhaseActive: true,
    facilityRoomController,
    collisionObjects: originalSet,
    player: { x: 320, y: 240 },
    cameras: { main: { scrollX: 0, scrollY: 0 } },
    outageDarknessRt: {
      visible: false,
      clear() { operations.push("darkness-clear"); return this; },
      setVisible(value) { this.visible = value; operations.push(["darkness-visible", value]); return this; },
      fill() { operations.push("darkness-fill"); return this; },
      erase() { operations.push("darkness-erase"); return this; }
    },
    outageLightSprite: {
      setPosition(x, y) { operations.push(["light-position", x, y]); return this; }
    },
    showTopBanner(...args) { operations.push(["banner", ...args]); },
    triggerEventPulse() { operations.push("pulse"); },
    playSound(key) { operations.push(["sound", key]); }
  };
  Object.assign(scene, timelineMixin);
  return { scene, operations, originalSet, originalHandles };
}

function snapshotTimelineState(scene, operations) {
  return {
    activeFacilityEvent: scene.activeFacilityEvent,
    activeFacilityEventEndAtMs: scene.activeFacilityEventEndAtMs,
    outageStrength: scene.outageVisualStrength,
    bossPhaseActive: scene.bossPhaseActive,
    operations
  };
}

test("facility presentation wiring preserves timeline state and collider identities when absent, normal, or throwing", async () => {
  const timelineMixin = await loadTimelineMixin();
  const normalPresentations = [];
  const cases = [
    null,
    { setPresentation(state) { normalPresentations.push(state); } },
    { setPresentation() { throw new Error("presentation failed"); } }
  ];
  const snapshots = [];

  for (const controller of cases) {
    const {
      scene,
      operations,
      originalSet,
      originalHandles
    } = createTimelineScene(timelineMixin, controller);
    assert.doesNotThrow(() => {
      scene.beginFacilityEvent("powerOutage");
      scene.updatePowerOutageVisual();
      scene.endFacilityEvent();
      scene.updatePowerOutageVisual();
    });
    assertColliderIdentityPreserved(scene, originalSet, originalHandles);
    snapshots.push(snapshotTimelineState(scene, operations));
  }

  assert.deepEqual(snapshots[1], snapshots[0]);
  assert.deepEqual(snapshots[2], snapshots[0]);
  assert.ok(normalPresentations.length >= 3);
  assert.equal(snapshots[0].bossPhaseActive, true);
});

function createSystemsScene(systemsMixin, facilityRoomController) {
  const resetSnapshots = [];
  const { originalSet, originalHandles } = createColliderIdentityFixture();
  const scene = {
    activeFacilityEvent: { type: "powerOutage" },
    activeFacilityEventEndAtMs: 205000,
    outageVisualStrength: 0.8,
    collisionObjects: originalSet,
    facilityRoomController: facilityRoomController && {
      reset() {
        resetSnapshots.push({
          activeFacilityEvent: scene.activeFacilityEvent,
          activeFacilityEventEndAtMs: scene.activeFacilityEventEndAtMs,
          outageVisualStrength: scene.outageVisualStrength
        });
        return facilityRoomController.reset();
      }
    },
    outageDarknessRt: {
      visible: true,
      clear() { return this; },
      setVisible(value) { this.visible = value; return this; }
    },
    eventBannerContainer: {
      visible: true,
      alpha: 0.4,
      setVisible(value) { this.visible = value; return this; },
      setAlpha(value) { this.alpha = value; return this; }
    },
    eventBannerTitle: { text: "title", setText(value) { this.text = value; return this; } },
    eventBannerDetail: { text: "detail", setText(value) { this.text = value; return this; } },
    topBannerState: { active: true },
    collapseFacilityHudCalls: 0,
    collapseFacilityHud() { this.collapseFacilityHudCalls += 1; }
  };
  Object.assign(scene, systemsMixin);
  return { scene, resetSnapshots, originalSet, originalHandles };
}

function snapshotSystemsState(scene) {
  return {
    activeFacilityEvent: scene.activeFacilityEvent,
    activeFacilityEventEndAtMs: scene.activeFacilityEventEndAtMs,
    outageVisualStrength: scene.outageVisualStrength,
    darknessVisible: scene.outageDarknessRt.visible,
    bannerVisible: scene.eventBannerContainer.visible,
    bannerAlpha: scene.eventBannerContainer.alpha,
    bannerTitle: scene.eventBannerTitle.text,
    bannerDetail: scene.eventBannerDetail.text,
    topBannerState: scene.topBannerState,
    collapseFacilityHudCalls: scene.collapseFacilityHudCalls
  };
}

test("facility system cleanup commits gameplay cleanup before an isolated controller reset", async () => {
  const systemsMixin = await loadSystemsMixin();
  const cases = [
    null,
    { reset() {} },
    { reset() { throw new Error("presentation reset failed"); } }
  ];
  const snapshots = [];
  const resetSnapshots = [];

  for (const controller of cases) {
    const fixture = createSystemsScene(systemsMixin, controller);
    assert.doesNotThrow(() => fixture.scene.clearFacilitySystems());
    assertColliderIdentityPreserved(
      fixture.scene,
      fixture.originalSet,
      fixture.originalHandles
    );
    snapshots.push(snapshotSystemsState(fixture.scene));
    resetSnapshots.push(fixture.resetSnapshots);
  }

  assert.deepEqual(snapshots[1], snapshots[0]);
  assert.deepEqual(snapshots[2], snapshots[0]);
  assert.deepEqual(resetSnapshots[1], [{
    activeFacilityEvent: null,
    activeFacilityEventEndAtMs: 0,
    outageVisualStrength: 0
  }]);
});
