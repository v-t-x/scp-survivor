import test from "node:test";
import assert from "node:assert/strict";
import { TEXTURES } from "../src/assets/manifest.js";
import { menusMixin } from "../src/scene/menus.js";

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
      if (retained.length > 0) handlers.set(event, retained);
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
    setDisplaySize(width, height) {
      this.displayWidth = width;
      this.displayHeight = height;
      return this;
    },
    setInteractive(options) {
      this.interactive = true;
      this.interactiveOptions = options;
      return this;
    },
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
    destroy() {
      if (this.destroyed) return this;
      if (this.list) {
        for (const child of [...this.list]) child.destroy?.();
      }
      this.parentContainer?.onChildDestroyed?.(this);
      this.disableInteractive();
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

function createScene(options = {}) {
  const addCounts = new Map();
  let failureConsumed = false;
  const scene = {
    created: [],
    tweensCreated: [],
    pauseCount: 0,
    resumeCount: 0,
    restartCount: 0,
    destroyLevelUpCount: 0,
    syncCount: 0,
    isMissionActive: true,
    isGameOver: false,
    isLevelUpActive: false,
    isPaused: false,
    bossPhaseActive: false,
    elapsedSurvivalMs: 73400,
    killCount: 37,
    lastRunCreditsEarned: 42,
    meta: { credits: 314, perks: {} },
    activeFacilityEvent: {
      type: "powerOutage",
      name: "电力故障",
      warning: "备用电源切换"
    },
    scale: { width: 960, height: 540 },
    cameras: { main: { width: 960, height: 540, scrollX: 180, scrollY: 120 } },
    textures: { exists: () => true },
    pauseGameplaySystems() { this.pauseCount += 1; },
    resumeGameplaySystems() { this.resumeCount += 1; },
    syncScreenOverlayPosition(container) {
      this.syncCount += 1;
      container.setPosition(this.cameras.main.scrollX, this.cameras.main.scrollY);
    },
    destroyLevelUpOverlay() { this.destroyLevelUpCount += 1; },
    scene: {
      restart() { scene.restartCount += 1; }
    },
    tweens: {
      add(config) {
        const tween = {
          config,
          removed: false,
          remove() { this.removed = true; }
        };
        scene.tweensCreated.push(tween);
        return tween;
      }
    }
  };

  const add = (type, factory) => (...args) => {
    const occurrence = (addCounts.get(type) ?? 0) + 1;
    addCounts.set(type, occurrence);
    const failure = options.failOnce;
    if (
      !failureConsumed
      && failure?.type === type
      && (failure.occurrence === undefined || failure.occurrence === occurrence)
    ) {
      failureConsumed = true;
      throw new Error(`forced ${type} failure`);
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
  scene.addCounts = addCounts;
  Object.assign(scene, menusMixin);
  return scene;
}

function textContent(objects) {
  return objects
    .filter(({ type, destroyed }) => type === "text" && !destroyed)
    .map(({ text }) => text)
    .join("\n");
}

function assertTextIncludes(objects, ...fragments) {
  const content = textContent(objects);
  for (const fragment of fragments) {
    assert.match(content, new RegExp(fragment), `expected visible text to include ${fragment}`);
  }
}

function assertSingleOwner(scene, controller, scrollFactor) {
  assert.ok(controller);
  assert.ok(controller.objects.length > 0);
  assert.equal(new Set(controller.objects).size, controller.objects.length);
  assert.deepEqual(new Set(controller.objects), new Set(scene.created.filter(({ destroyed }) => !destroyed)));
  assert.equal(controller.objects.every((object) => object.scrollFactor === scrollFactor), true);
}

function assertReleased(objects) {
  assert.equal(objects.every(({ destroyed }) => destroyed), true);
  assert.equal(objects.every(({ listenerCount }) => listenerCount === 0), true);
  assert.equal(objects.every(({ interactive }) => interactive === false), true);
}

function resultButton(scene) {
  return scene.resultOverlayController.actions.restart;
}

test("pause terminal preserves world-space show, hide, resume, and return-title semantics", () => {
  const scene = createScene();

  scene.pauseGame();

  assert.equal(scene.isPaused, true);
  assert.equal(scene.pauseCount, 1);
  assert.equal(scene.resumeCount, 0);
  assert.equal(scene.syncCount, 1);
  assert.ok(scene.pauseOverlayController, "pause must expose its terminal controller");
  assert.equal(scene.pauseOverlay, scene.pauseOverlayController.container);
  assert.deepEqual(
    { x: scene.pauseOverlay.x, y: scene.pauseOverlay.y },
    { x: scene.cameras.main.scrollX, y: scene.cameras.main.scrollY }
  );
  assert.equal(scene.pauseOverlayController.tone, "standard");
  assertSingleOwner(scene, scene.pauseOverlayController, 1);
  assert.ok(scene.pauseOverlayController.objects.some(
    ({ type, textureKey }) => type === "tileSprite" && textureKey === TEXTURES.terminalSurfaceGrid
  ));
  assertTextIncludes(
    scene.pauseOverlayController.objects,
    "站点编号",
    "SITE-19",
    "当前任务",
    "运行时间",
    "73\\.4",
    "设施状态",
    "电力故障"
  );

  const firstObjects = [...scene.pauseOverlayController.objects];
  scene.hidePauseOverlay();
  scene.hidePauseOverlay();
  assert.equal(scene.isPaused, true, "hiding the view alone must not resume gameplay");
  assert.equal(scene.resumeCount, 0);
  assert.equal(scene.pauseOverlay, null);
  assert.equal(scene.pauseOverlayController, null);
  assertReleased(firstObjects);

  scene.showPauseOverlay();
  const resume = scene.pauseOverlayController.actions.resume;
  resume.hitArea.emit("pointerup");
  assert.equal(scene.isPaused, true, "pause actions preserve pointerdown activation");
  resume.hitArea.emit("pointerdown");
  assert.equal(scene.isPaused, false);
  assert.equal(scene.resumeCount, 1);
  assert.equal(scene.pauseOverlay, null);
  assert.equal(scene.pauseOverlayController, null);

  scene.pauseGame();
  const quitObjects = [...scene.pauseOverlayController.objects];
  const quit = scene.pauseOverlayController.actions.quit;
  quit.hitArea.emit("pointerup");
  assert.equal(scene.restartCount, 0);
  quit.hitArea.emit("pointerdown");
  quit.hitArea.emit("pointerdown");
  assert.equal(scene.isPaused, false);
  assert.equal(scene.destroyLevelUpCount, 1);
  assert.equal(scene.restartCount, 1);
  assert.equal(scene.resumeCount, 1, "returning to title keeps the existing restart-only resume semantics");
  assertReleased(quitObjects);
});

test("pause construction failure rolls back partial objects and resumes gameplay exactly once", () => {
  const scene = createScene({ failOnce: { type: "tileSprite", occurrence: 1 } });

  scene.pauseGame();

  assert.equal(scene.pauseCount, 1);
  assert.equal(scene.resumeCount, 1);
  assert.equal(scene.isPaused, false);
  assert.equal(scene.pauseOverlay, null);
  assert.equal(scene.pauseOverlayController, null);
  assertReleased(scene.created);
  scene.hidePauseOverlay();
  scene.hidePauseOverlay();
  assert.equal(scene.resumeCount, 1);
});

for (const result of [
  {
    name: "failure",
    show: "showGameOverOverlay",
    tone: "danger",
    stamp: TEXTURES.incidentStampFrame,
    status: "行动终止"
  },
  {
    name: "victory",
    show: "showVictoryOverlay",
    tone: "success",
    stamp: TEXTURES.recontainmentStampFrame,
    status: "重新收容确认"
  }
]) {
  test(`${result.name} terminal uses shared stats and restarts once on first pointerdown`, () => {
    const scene = createScene();
    let finalTimeCalls = 0;
    scene.getFinalSurvivalTimeSeconds = () => {
      finalTimeCalls += 1;
      return "87.6";
    };

    scene[result.show]();

    assert.equal(finalTimeCalls, 1);
    assert.ok(scene.resultOverlayController, "result must expose its terminal controller");
    assert.equal(scene.resultOverlay, scene.resultOverlayController.container);
    assert.equal(scene.resultOverlayController.tone, result.tone);
    assertSingleOwner(scene, scene.resultOverlayController, 0);
    assert.ok(scene.resultOverlayController.objects.some(
      ({ type, textureKey }) => type === "tileSprite" && textureKey === TEXTURES.terminalSurfaceGrid
    ));
    assert.ok(scene.resultOverlayController.objects.some(
      ({ type, textureKey }) => type === "image" && textureKey === result.stamp
    ));
    assertTextIncludes(
      scene.resultOverlayController.objects,
      result.status,
      "生存时间",
      "87\\.6 秒",
      "击杀数",
      "37",
      "当局学分",
      "\\+42",
      "累计学分",
      "314",
      "返回行动准备"
    );

    const controller = scene.resultOverlayController;
    const restart = resultButton(scene);
    assert.equal(restart.hitArea.width, 170);
    assert.equal(restart.hitArea.height, 52);
    restart.hitArea.emit("pointerup");
    assert.equal(scene.restartCount, 0, "result actions preserve pointerdown activation");
    restart.hitArea.emit("pointerdown");
    restart.hitArea.emit("pointerdown");
    assert.equal(scene.restartCount, 1);
    assert.equal(restart.hitArea.interactive, false);
    assert.equal(scene.resultOverlay, null);
    assert.equal(scene.resultOverlayController, null);
    assertReleased(controller.objects);
  });
}

test("repeated result show and destroy calls are idempotent and leak no listeners", () => {
  const scene = createScene();
  scene.showGameOverOverlay();
  const controller = scene.resultOverlayController;
  assert.ok(controller, "result must expose its terminal controller");
  const count = scene.created.length;

  scene.showGameOverOverlay();
  assert.equal(scene.resultOverlayController, controller);
  assert.equal(scene.created.length, count);

  scene.destroyResultOverlay();
  scene.destroyResultOverlay();
  assert.equal(scene.resultOverlay, null);
  assert.equal(scene.resultOverlayController, null);
  assertReleased(controller.objects);
});

for (const result of [
  { name: "failure", show: "showGameOverOverlay" },
  { name: "victory", show: "showVictoryOverlay" }
]) {
  test(`${result.name} terminal failure creates a minimal guarded restart fallback`, () => {
    const scene = createScene({ failOnce: { type: "image", occurrence: 1 } });

    scene[result.show]();

    const controller = scene.resultOverlayController;
    assert.ok(controller, "construction failure must install a result fallback controller");
    assert.equal(controller.fallback, true);
    assert.equal(scene.resultOverlay, controller.container);
    assertTextIncludes(controller.objects, "返回行动准备");
    assert.equal(controller.actions.restart.hitArea.interactive, true);
    const partialObjects = scene.created.filter((object) => !controller.objects.includes(object));
    assertReleased(partialObjects);

    const restart = controller.actions.restart;
    restart.hitArea.emit("pointerup");
    assert.equal(scene.restartCount, 0);
    restart.hitArea.emit("pointerdown");
    restart.hitArea.emit("pointerdown");
    assert.equal(scene.restartCount, 1);
    assertReleased(controller.objects);
  });
}
