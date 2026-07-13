import test from "node:test";
import assert from "node:assert/strict";
import { THEME } from "../src/ui/theme.js";
import {
  createStatusLamp,
  createTacticalPanel,
  createTerminalButton,
  getTerminalButtonPalette
} from "../src/ui/tacticalUi.js";

function createDisplayObject(type) {
  const handlers = new Map();
  return {
    type,
    calls: [],
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
    on(event, handler) {
      handlers.set(event, handler);
      return this;
    },
    emit(event) {
      handlers.get(event)?.();
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
    lineCircle(...args) {
      this.calls.push(["lineCircle", ...args]);
      return this;
    },
    destroy() {
      this.destroyed = true;
    }
  };
}

function createScene() {
  const objects = [];
  const add = (type, factory) => (...args) => {
    const object = factory(...args);
    objects.push(object);
    return object;
  };
  return {
    objects,
    add: {
      graphics: add("graphics", () => createDisplayObject("graphics")),
      rectangle: add("rectangle", (x, y, width, height, fill, alpha) => ({
        ...createDisplayObject("rectangle"), x, y, width, height, fill, alpha
      })),
      text: add("text", (x, y, text, style) => ({
        ...createDisplayObject("text"), x, y, text, style
      }))
    }
  };
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

  button.hitArea.emit("pointerover");
  assert.equal(button.hitArea.interactive, true);
  button.hitArea.emit("pointerdown");
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
  lamp.setState("contained");
  assert.ok(lamp.lamp.calls.filter(([name]) => name === "clear").length >= 2);
  lamp.destroy();
  assert.equal(lamp.lamp.destroyed, true);
});
