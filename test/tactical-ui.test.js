import test from "node:test";
import assert from "node:assert/strict";
import { THEME } from "../src/ui/theme.js";
import {
  createStatusLamp,
  createTacticalPanel,
  createTerminalButton,
  getTerminalButtonPalette
} from "../src/ui/tacticalUi.js";

function throwConfiguredFailure(failure, object, method) {
  const configured = failure.configuration;
  if (!configured || configured.type !== object.type || configured.method !== method) return;
  throw new Error(`configuration failed: ${object.type}.${method}`);
}

function createDisplayObject(type, failure = {}) {
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
    calls: [],
    destroying: false,
    destroyed: false,
    interactive: false,
    depth: undefined,
    scrollFactor: undefined,
    setDepth(value) {
      this.depth = value;
      return this;
    },
    setScrollFactor(value) {
      this.scrollFactor = value;
      return this;
    },
    setOrigin(...args) {
      throwConfiguredFailure(failure, this, "setOrigin");
      this.calls.push(["setOrigin", ...args]);
      return this;
    },
    setStyle(style) {
      this.style = style;
      return this;
    },
    setText(value) {
      this.text = value;
      return this;
    },
    setFillStyle(...args) {
      this.calls.push(["setFillStyle", ...args]);
      return this;
    },
    setInteractive(options) {
      this.interactive = true;
      this.interactiveOptions = options;
      return this;
    },
    disableInteractive() {
      this.interactive = false;
      this.disableCount = (this.disableCount ?? 0) + 1;
      return this;
    },
    removeInteractive() {
      this.interactive = false;
      this.removeInteractiveCount = (this.removeInteractiveCount ?? 0) + 1;
      return this;
    },
    on(event, handler, context) {
      addHandler(event, handler, context, false);
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
  const addCounts = new Map();
  const failure = {
    configuration: options.configurationFailure
      ? { ...options.configurationFailure }
      : null
  };
  const add = (type, factory) => (...args) => {
    const occurrence = (addCounts.get(type) ?? 0) + 1;
    addCounts.set(type, occurrence);
    if (options.addFailure?.type === type && options.addFailure.occurrence === occurrence) {
      throw new Error(`add failed: ${type}#${occurrence}`);
    }
    const object = factory(...args);
    objects.push(object);
    return object;
  };
  return {
    objects,
    add: {
      graphics: add("graphics", () => createDisplayObject("graphics", failure)),
      rectangle: add("rectangle", (x, y, width, height, fill, alpha) => Object.assign(
        createDisplayObject("rectangle", failure),
        { x, y, width, height, fill, alpha }
      )),
      text: add("text", (x, y, text, style) => Object.assign(
        createDisplayObject("text", failure),
        { x, y, text, style }
      ))
    }
  };
}

function assertSceneRolledBack(scene) {
  assert.equal(scene.objects.length > 0, true);
  assert.equal(scene.objects.every((object) => object.destroyed), true);
  assert.equal(scene.objects.every((object) => object.listenerCount === 0), true);
}

test("terminal button states are visibly distinct", () => {
  const disabled = getTerminalButtonPalette("disabled");
  const idle = getTerminalButtonPalette("idle");
  const hover = getTerminalButtonPalette("hover");
  const pressed = getTerminalButtonPalette("pressed");
  const armed = getTerminalButtonPalette("armed");
  assert.notDeepEqual(idle, hover);
  assert.notDeepEqual(hover, armed);
  assert.equal(disabled.interactive, false);
  assert.equal(idle.interactive, true);
  assert.equal(armed.signal, "contained");
  assert.equal(Object.isFrozen(hover), true);
  assert.equal(new Set([disabled, idle, hover, pressed, armed].map(({ fill, border, signal }) => `${fill}/${border}/${signal}`)).size, 5);
});

test("Foundation terminal and layout tokens match the approved contract", () => {
  assert.deepEqual(THEME.terminal, {
    panelFill: 0x0b1119,
    panelRaised: 0x141f2c,
    frame: 0x53677d,
    frameFocus: 0x8da6c2,
    scanline: 0x9db7c9,
    contained: 0x6fd6b4,
    warning: 0xd2a34b,
    danger: 0xb9474f,
    disabled: 0x48525d
  });
  assert.deepEqual(THEME.layout, {
    cornerCut: 8,
    panelPadding: 12,
    buttonHeight: 56,
    labelGap: 8
  });
});

test("terminal buttons draw clipped frames, honor display options, and clean up", () => {
  const scene = createScene();
  let activations = 0;
  const button = createTerminalButton(scene, {
    x: 120,
    y: 80,
    width: 240,
    height: 56,
    text: "AUTHORIZE",
    depth: 24,
    scrollFactor: 0,
    onActivate: () => { activations += 1; }
  });

  assert.deepEqual(Object.keys(button).sort(), ["destroy", "hitArea", "label", "objects", "setState", "signal"]);
  assert.equal(button.objects.length, 4);
  assert.equal(button.hitArea.type, "rectangle");
  assert.equal(button.hitArea.alpha, 0);
  assert.equal(button.label.text, "AUTHORIZE");
  for (const object of button.objects) {
    assert.equal(object.depth, 24);
    assert.equal(object.scrollFactor, 0);
  }
  assert.ok(button.objects[0].calls.some(([name]) => name === "lineTo"));
  assert.equal(button.objects[0].calls.some(([name]) => name === "fillRoundedRect"), false);
  assert.ok(button.signal.calls.some(([name]) => name === "strokeCircle"));
  assert.equal(button.hitArea.interactive, true, "the default button is interactive on its first frame");

  button.hitArea.emit("pointerover");
  assert.equal(button.hitArea.interactive, true);
  button.hitArea.emit("pointerdown");
  assert.equal(activations, 0, "legacy buttons still wait for pointerup");
  button.hitArea.emit("pointerup");
  assert.equal(activations, 1);

  button.setState("disabled");
  assert.equal(button.hitArea.interactive, false);
  button.hitArea.emit("pointerdown");
  button.hitArea.emit("pointerup");
  assert.equal(activations, 1);

  button.destroy();
  button.destroy();
  assert.equal(button.hitArea.listenersRemoved, true);
  for (const object of button.objects) {
    assert.equal(object.destroyed, true);
  }
});

test("terminal button variants select presentation tokens and pointerdown can activate immediately", () => {
  const standard = getTerminalButtonPalette("idle", "standard");
  const primary = getTerminalButtonPalette("idle", "primary");
  const danger = getTerminalButtonPalette("idle", "danger");
  const success = getTerminalButtonPalette("idle", "success");

  assert.equal(new Set([standard, primary, danger, success].map(({ border, text, signal }) => `${border}/${text}/${signal}`)).size, 4);
  assert.equal(danger.border, THEME.terminal.danger);
  assert.equal(success.border, THEME.terminal.contained);

  const scene = createScene();
  let activations = 0;
  const button = createTerminalButton(scene, {
    width: 200,
    text: "立即授权",
    variant: "danger",
    activateOn: "pointerdown",
    onActivate: () => { activations += 1; }
  });

  assert.equal(button.hitArea.interactive, true);
  button.hitArea.emit("pointerdown");
  assert.equal(activations, 1);
  button.hitArea.emit("pointerup");
  assert.equal(activations, 1, "pointerup does not double-activate a pointerdown button");
});

test("tactical panels use a clipped Foundation frame and expose lifecycle cleanup", () => {
  const scene = createScene();
  const panel = createTacticalPanel(scene, {
    x: 20,
    y: 30,
    width: 300,
    height: 180,
    depth: 8,
    scrollFactor: 0
  });

  assert.equal(panel.objects.length, 1);
  assert.equal(panel.frame.depth, 8);
  assert.equal(panel.frame.scrollFactor, 0);
  assert.ok(panel.frame.calls.some(([name]) => name === "lineTo"));
  assert.equal(panel.frame.calls.some(([name]) => name === "fillRoundedRect"), false);
  panel.destroy();
  assert.equal(panel.frame.destroyed, true);
});

test("status lamps redraw state and release their graphics", () => {
  const scene = createScene();
  const lamp = createStatusLamp(scene, {
    x: 40,
    y: 50,
    state: "warning",
    radius: 7,
    depth: 15,
    scrollFactor: 0
  });

  assert.equal(lamp.objects.length, 1);
  assert.equal(lamp.lamp.depth, 15);
  assert.equal(lamp.lamp.scrollFactor, 0);
  assert.ok(lamp.lamp.calls.some(([name]) => name === "fillCircle"));
  assert.ok(lamp.lamp.calls.some(([name]) => name === "strokeCircle"));
  lamp.setState("contained");
  assert.ok(lamp.lamp.calls.filter(([name]) => name === "clear").length >= 2);
  lamp.destroy();
  assert.equal(lamp.lamp.destroyed, true);
});

test("standalone panel lamp and button destroy observers fire before listener cleanup", () => {
  const cases = [
    {
      label: "panel",
      create: (scene) => createTacticalPanel(scene, { width: 120, height: 36 }),
      object: (component) => component.frame
    },
    {
      label: "lamp",
      create: (scene) => createStatusLamp(scene, { state: "warning" }),
      object: (component) => component.lamp
    },
    {
      label: "button",
      create: (scene) => createTerminalButton(scene, { width: 120, text: "AUTHORIZE" }),
      object: (component) => component.hitArea
    }
  ];

  for (const { label, create, object: selectObject } of cases) {
    const scene = createScene();
    const component = create(scene);
    const observedObject = selectObject(component);
    const observations = [];
    const persistentContext = { name: `${label}-persistent` };
    const onceContext = { name: `${label}-once` };
    const observeDestroy = function observeDestroy(target) {
      observations.push([
        this.name,
        target === observedObject,
        target.destroying,
        target.destroyed
      ]);
    };
    observedObject.on("destroy", observeDestroy, persistentContext);
    observedObject.once("destroy", observeDestroy, onceContext);

    component.destroy();
    component.destroy();

    assert.deepEqual(observations, [
      [`${label}-persistent`, true, true, false],
      [`${label}-once`, true, true, false]
    ], `${label} emits all DESTROY observers during destroy`);
    assert.equal(observedObject.listenerCount, 0, `${label} listeners are cleared after emit`);
    assert.equal(observedObject.destroyed, true, `${label} object is destroyed`);
  }
});

test("tactical panel construction rolls back its graphics when setup throws", () => {
  const scene = createScene();
  const createGraphics = scene.add.graphics;
  let frame;
  scene.add.graphics = () => {
    frame = createGraphics();
    frame.setDepth = () => {
      throw new Error("depth setup failed");
    };
    return frame;
  };

  assert.throws(
    () => createTacticalPanel(scene, { width: 120, height: 36 }),
    /depth setup failed/
  );
  assert.equal(frame.destroyed, true);
});

test("terminal button construction rolls back objects and listeners when registration throws", () => {
  const scene = createScene();
  const createRectangle = scene.add.rectangle;
  let hitArea;
  scene.add.rectangle = (...args) => {
    hitArea = createRectangle(...args);
    hitArea.on = () => {
      throw new Error("listener registration failed");
    };
    return hitArea;
  };

  assert.throws(
    () => createTerminalButton(scene, { width: 120, text: "AUTHORIZE" }),
    /listener registration failed/
  );
  assert.equal(scene.objects.every((object) => object.destroyed), true);
  assert.equal(hitArea.listenersRemoved, true);
});

for (const { type, occurrence } of [
  { type: "rectangle", occurrence: 1 },
  { type: "graphics", occurrence: 2 }
]) {
  test(`terminal button owns earlier objects when add ${type} #${occurrence} throws`, () => {
    const scene = createScene({ addFailure: { type, occurrence } });

    assert.throws(
      () => createTerminalButton(scene, { width: 120, text: "AUTHORIZE" }),
      new RegExp(`add failed: ${type}#${occurrence}`)
    );
    assertSceneRolledBack(scene);
  });
}

test("terminal button owns its label before origin configuration can throw", () => {
  const scene = createScene({
    configurationFailure: { type: "text", method: "setOrigin" }
  });

  assert.throws(
    () => createTerminalButton(scene, { width: 120, text: "AUTHORIZE" }),
    /configuration failed: text\.setOrigin/
  );
  assertSceneRolledBack(scene);
});
