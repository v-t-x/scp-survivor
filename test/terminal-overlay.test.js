import test from "node:test";
import assert from "node:assert/strict";
import { UPGRADE_DEFINITIONS } from "../src/config/upgrades.js";
import { THEME } from "../src/ui/theme.js";
import {
  createTerminalCard,
  createTerminalOverlay
} from "../src/ui/terminalOverlay.js";

const LONGEST_UPGRADE_DESCRIPTION = UPGRADE_DEFINITIONS
  .map(({ description }) => description)
  .sort((left, right) => right.length - left.length)[0];

function parseFontSize(value) {
  const parsed = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(parsed) ? parsed : 0;
}

const PHASER_RENDER_MASK = 15;
const PHASER_VISIBLE_FLAG = 1;
const PHASER_ALPHA_FLAG = 2;

function glyphWidth(character, fontSize) {
  return character.codePointAt(0) > 255 ? fontSize : fontSize * 0.58;
}

function measuredWidth(value, fontSize) {
  return [...String(value ?? "")].reduce(
    (width, character) => width + glyphWidth(character, fontSize),
    0
  );
}

function advancedWrapLines(value, fontSize, wrapWidth) {
  const wrapped = [];
  for (const sourceLine of String(value ?? "").split("\n")) {
    let line = "";
    let width = 0;
    for (const character of [...sourceLine]) {
      const characterWidth = glyphWidth(character, fontSize);
      if (line && width + characterWidth > wrapWidth) {
        wrapped.push(line);
        line = "";
        width = 0;
      }
      line += character;
      width += characterWidth;
    }
    wrapped.push(line);
  }
  return wrapped;
}

function basicWrapLines(value, fontSize, wrapWidth) {
  const wrapped = [];
  for (const sourceLine of String(value ?? "").split("\n")) {
    const words = sourceLine.split(" ");
    if (words.length === 1) {
      wrapped.push(sourceLine);
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && measuredWidth(candidate, fontSize) > wrapWidth) {
        wrapped.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    wrapped.push(line);
  }
  return wrapped;
}

function createEventEmitter(target = {}) {
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
    off(event, handler, context, once) {
      if (handler === undefined) {
        handlers.delete(event);
        return this;
      }
      const retained = (handlers.get(event) ?? []).filter((entry) => {
        if (entry.handler !== handler) return true;
        if (context !== undefined && entry.context !== context) return true;
        if (once !== undefined && entry.once !== once) return true;
        return false;
      });
      if (retained.length > 0) handlers.set(event, retained);
      else handlers.delete(event);
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
    }
  });
  Object.defineProperty(target, "listenerCount", {
    get: () => [...handlers.values()].reduce((count, entries) => count + entries.length, 0)
  });
  return target;
}

function throwConfiguredFailure(failure, object, method) {
  const configured = failure.configuration;
  if (!configured || configured.type !== object.type || configured.method !== method) return;
  throw new Error(`configuration failed: ${object.type}.${method}`);
}

function createDisplayObject(scene, type, failure, properties = {}) {
  const object = createEventEmitter({
    type,
    active: true,
    destroyed: false,
    destroying: false,
    interactive: false,
    calls: [],
    visible: true,
    alpha: 1,
    renderFlags: PHASER_RENDER_MASK,
    depth: undefined,
    scrollFactor: undefined,
    parentContainer: null,
    ...properties,
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
    setPosition(x, y) {
      throwConfiguredFailure(failure, this, "setPosition");
      this.x = x;
      this.y = y;
      return this;
    },
    setOrigin(...args) {
      throwConfiguredFailure(failure, this, "setOrigin");
      this.origin = args;
      return this;
    },
    setAlpha(value) {
      throwConfiguredFailure(failure, this, "setAlpha");
      this.alpha = Math.max(0, Math.min(1, value));
      if (this.alpha === 0) this.renderFlags &= ~PHASER_ALPHA_FLAG;
      else this.renderFlags |= PHASER_ALPHA_FLAG;
      return this;
    },
    setVisible(value) {
      throwConfiguredFailure(failure, this, "setVisible");
      this.visible = value === true;
      if (this.visible) this.renderFlags |= PHASER_VISIBLE_FLAG;
      else this.renderFlags &= ~PHASER_VISIBLE_FLAG;
      return this;
    },
    willRender() {
      return this.renderFlags === PHASER_RENDER_MASK;
    },
    setInteractive(options) {
      throwConfiguredFailure(failure, this, "setInteractive");
      this.interactive = true;
      this.interactiveOptions = options;
      return this;
    },
    disableInteractive() {
      this.interactive = false;
      return this;
    },
    removeInteractive() {
      this.interactive = false;
      return this;
    },
    setDisplaySize(width, height) {
      throwConfiguredFailure(failure, this, "setDisplaySize");
      this.displayWidth = width;
      this.displayHeight = height;
      return this;
    },
    setStyle(style) {
      throwConfiguredFailure(failure, this, "setStyle");
      this.style = { ...this.style, ...style };
      return this;
    },
    setFontSize(fontSize) {
      throwConfiguredFailure(failure, this, "setFontSize");
      this.style = { ...this.style, fontSize: typeof fontSize === "number" ? `${fontSize}px` : fontSize };
      return this;
    },
    setColor(color) {
      this.style = { ...this.style, color };
      return this;
    },
    setText(text) {
      throwConfiguredFailure(failure, this, "setText");
      this.text = String(text ?? "");
      return this;
    },
    setFillStyle(...args) { this.calls.push(["setFillStyle", ...args]); return this; },
    setStrokeStyle(...args) { this.calls.push(["setStrokeStyle", ...args]); return this; },
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
    getBounds() {
      if (this.type !== "text") {
        return { width: this.displayWidth ?? this.width ?? 0, height: this.displayHeight ?? this.height ?? 0 };
      }
      const fontSize = parseFontSize(this.style?.fontSize);
      const rawWidth = measuredWidth(this.text, fontSize);
      const wrapWidth = this.style?.wordWrap?.width;
      const lines = wrapWidth
        ? this.style.wordWrap.useAdvancedWrap
          ? advancedWrapLines(this.text, fontSize, wrapWidth)
          : basicWrapLines(this.text, fontSize, wrapWidth)
        : String(this.text ?? "").split("\n");
      const visibleLines = this.style?.maxLines > 0
        ? lines.slice(0, this.style.maxLines)
        : lines;
      return {
        width: wrapWidth
          ? Math.max(0, ...visibleLines.map((line) => measuredWidth(line, fontSize)))
          : rawWidth,
        height: Math.max(1, visibleLines.length) * (fontSize + Number(this.style?.lineSpacing ?? 0) + 2)
      };
    },
    destroy(fromScene = false) {
      if (this.destroyed) return this;
      this.destroying = true;
      if (this.list) {
        for (const child of [...this.list]) {
          if (this.exclusive !== false) child.destroy?.(false);
          else this.onChildDestroyed(child);
        }
      }
      if (this.parentContainer) {
        const parent = this.parentContainer;
        parent.onChildDestroyed(this);
      }
      this.emit("destroy", this, fromScene === true);
      this.removeAllListeners();
      this.active = false;
      this.destroyed = true;
      this.destroying = false;
      return this;
    }
  });

  if (type === "container") {
    object.list = [];
    object.exclusive = true;
    object.onChildDestroyed = function onChildDestroyed(child) {
      this.list = this.list.filter((candidate) => candidate !== child);
      if (child.parentContainer === this) child.parentContainer = null;
    };
    object.add = function add(children) {
      const candidates = Array.isArray(children) ? children : [children];
      for (const child of candidates) {
        failure.containerAddCount += 1;
        if (failure.containerAddFailure === failure.containerAddCount) {
          throw new Error(`container add failed: #${failure.containerAddCount}`);
        }
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
  const failure = {
    configuration: options.configurationFailure ? { ...options.configurationFailure } : null,
    containerAddFailure: options.containerAddFailure ?? null,
    containerAddCount: 0
  };
  const scene = {
    created: [],
    tweensCreated: [],
    scale: { width: 960, height: 540 },
    cameras: { main: { width: 960, height: 540 } },
    textures: { exists: (key) => options.availableTextures?.includes(key) ?? false }
  };
  const add = (type, factory) => (...args) => {
    const occurrence = (addCounts.get(type) ?? 0) + 1;
    addCounts.set(type, occurrence);
    if (options.addFailure?.type === type && options.addFailure.occurrence === occurrence) {
      throw new Error(`add failed: ${type}#${occurrence}`);
    }
    return factory(...args);
  };
  scene.add = {
    container: add("container", (x, y) => createDisplayObject(scene, "container", failure, { x, y })),
    graphics: add("graphics", () => createDisplayObject(scene, "graphics", failure)),
    rectangle: add("rectangle", (x, y, width, height, fill, alpha) => createDisplayObject(
      scene,
      "rectangle",
      failure,
      { x, y, width, height, fill, alpha }
    )),
    text: add("text", (x, y, text, style) => createDisplayObject(
      scene,
      "text",
      failure,
      { x, y, text, style: { ...style } }
    )),
    image: add("image", (x, y, textureKey) => createDisplayObject(
      scene,
      "image",
      failure,
      { x, y, textureKey }
    )),
    tileSprite: add("tileSprite", (x, y, width, height, textureKey) => createDisplayObject(
      scene,
      "tileSprite",
      failure,
      { x, y, width, height, textureKey }
    ))
  };
  scene.tweens = {
    add(config) {
      if (options.tweenFailure) throw new Error("tween add failed");
      const tween = {
        config,
        removed: false,
        remove() { this.removed = true; }
      };
      scene.tweensCreated.push(tween);
      return tween;
    }
  };
  return scene;
}

function worldPosition(object) {
  let x = object.x ?? 0;
  let y = object.y ?? 0;
  let parent = object.parentContainer;
  while (parent) {
    x += parent.x ?? 0;
    y += parent.y ?? 0;
    parent = parent.parentContainer;
  }
  return { x, y };
}

function isPhaserInputCandidate(object) {
  if (!object.interactive || !object.willRender()) return false;
  let parent = object.parentContainer;
  while (parent) {
    if (!parent.willRender()) return false;
    parent = parent.parentContainer;
  }
  return true;
}

function assertRolledBack(scene, ignored = []) {
  const ignoredSet = new Set(ignored);
  const owned = scene.created.filter((object) => !ignoredSet.has(object));
  assert.equal(owned.every((object) => object.destroyed), true);
  assert.equal(owned.every((object) => object.listenerCount === 0), true);
}

test("terminal overlay owns the Foundation frame, texture slot, scanlines, and display hierarchy", () => {
  const scene = createScene({ availableTextures: ["terminal-surface-grid"] });
  const overlay = createTerminalOverlay(scene, {
    x: 120,
    y: 80,
    width: 760,
    height: 420,
    depth: 60,
    scrollFactor: 1,
    eyebrow: "SITE-19 / FIELD AUTHORIZATION",
    title: "现场授权方案",
    subtitle: "选择一项处置协议",
    tone: "standard",
    surfaceTextureKey: "terminal-surface-grid"
  });

  assert.deepEqual(Object.keys(overlay).sort(), [
    "body", "container", "content", "destroy", "header", "objects", "setTone", "setVisible"
  ]);
  assert.equal(overlay.body.parentContainer, overlay.container);
  assert.equal(overlay.header.parentContainer, overlay.container);
  assert.equal(overlay.content.parentContainer, overlay.container);
  assert.equal(overlay.objects.includes(overlay.container), true);
  assert.equal(overlay.objects.every(({ depth }) => depth === 60), true);
  assert.equal(overlay.objects.every(({ scrollFactor }) => scrollFactor === 1), true);

  const dimmer = overlay.objects.find(({ type, width, height }) => type === "rectangle" && width === 960 && height === 540);
  assert.ok(dimmer);
  assert.equal(dimmer.interactive, true, "the dimmer blocks input behind the overlay immediately");
  const surface = overlay.objects.find(({ type }) => type === "tileSprite");
  assert.ok(surface);
  assert.equal(surface.textureKey, "terminal-surface-grid");
  assert.ok(surface.alpha > 0 && surface.alpha <= 0.2);
  const scanlines = overlay.objects.find(({ type, calls }) => type === "graphics" && calls.some(([name]) => name === "lineBetween"));
  assert.ok(scanlines);
  const edgeShade = overlay.objects.find(({ type, calls }) => type === "graphics" && calls.filter(([name]) => name === "fillRect").length === 4);
  assert.ok(edgeShade, "the overlay owns four programmatic edge-shade strips");
  assert.ok(scene.tweensCreated[0].config.duration <= 160);
  assert.equal(scene.tweensCreated[0].config.targets, overlay.container);
});

test("terminal overlay remains an input candidate before the first fade tween update", () => {
  const scene = createScene({ availableTextures: ["upgrade-icon"] });
  const overlay = createTerminalOverlay(scene, {
    width: 760,
    height: 420,
    depth: 60,
    scrollFactor: 1
  });
  const card = createTerminalCard(scene, {
    x: 240,
    y: 270,
    parent: overlay.content,
    iconKey: "upgrade-icon",
    title: "现场授权"
  });
  const dimmer = overlay.objects.find(({ type, width, height }) => type === "rectangle" && width === 960 && height === 540);

  assert.equal(scene.tweensCreated.length, 1, "the tween exists but has not advanced in this harness");
  assert.ok(overlay.container.alpha > 0 && overlay.container.alpha <= 0.01);
  assert.equal(overlay.container.willRender(), true);
  assert.equal(isPhaserInputCandidate(dimmer), true);
  assert.equal(isPhaserInputCandidate(card.hitArea), true);
});

test("terminal card keeps the 220 by 230 hit area, text bounds, icon size, and parent movement aligned", () => {
  const scene = createScene({ availableTextures: ["terminal-surface-grid", "upgrade-icon"] });
  const overlay = createTerminalOverlay(scene, {
    x: 40,
    y: 50,
    width: 760,
    height: 420,
    depth: 60,
    scrollFactor: 1
  });
  let activations = 0;
  const card = createTerminalCard(scene, {
    x: 240,
    y: 270,
    width: 220,
    height: 230,
    depth: 60,
    scrollFactor: 1,
    parent: overlay.content,
    iconKey: "upgrade-icon",
    eyebrow: "STANDARD",
    title: "现场授权强化",
    description: LONGEST_UPGRADE_DESCRIPTION,
    footer: "当前：Lv 3",
    riskLabel: "本局不可撤销",
    tone: "mutation",
    onActivate: () => { activations += 1; }
  });

  assert.deepEqual(Object.keys(card).sort(), [
    "destroy", "disableInteractive", "hitArea", "icon", "objects", "setFooter", "setState"
  ]);
  assert.equal(card.hitArea.width, 220);
  assert.equal(card.hitArea.height, 230);
  assert.equal(card.hitArea.interactive, true, "cards can activate on their first frame");
  assert.equal(card.icon.displayWidth, 32);
  assert.equal(card.icon.displayHeight, 32);
  assert.equal(card.objects.every((object) => object.parentContainer === overlay.content), true);
  assert.equal(card.objects.every(({ depth }) => depth === 60), true);
  assert.equal(card.objects.every(({ scrollFactor }) => scrollFactor === 1), true);

  const title = card.objects.find(({ type, text }) => type === "text" && text === "现场授权强化");
  const description = card.objects.find(({ type, style }) => type === "text" && style.maxLines === 5);
  const footer = card.objects.find(({ type, text }) => type === "text" && text === "当前：Lv 3");
  const risk = card.objects.find(({ type, text }) => type === "text" && text === "本局不可撤销");
  assert.equal(title.style.fontSize, "18px");
  assert.equal(title.style.wordWrap.width, 180);
  assert.equal(title.style.maxLines, 2);
  assert.equal(description.style.wordWrap.width, 180);
  assert.equal(description.style.wordWrap.useAdvancedWrap, true);
  assert.equal(/\s/.test(LONGEST_UPGRADE_DESCRIPTION), false);
  assert.equal(description.text, LONGEST_UPGRADE_DESCRIPTION);
  assert.ok(parseFontSize(description.style.fontSize) >= 12);
  const descriptionBounds = description.getBounds();
  assert.ok(descriptionBounds.width <= 180);
  assert.ok(descriptionBounds.height <= 92);
  assert.ok(descriptionBounds.height > parseFontSize(description.style.fontSize) + 2, "the Chinese copy uses multiple lines");
  assert.equal(footer.style.fontSize, "13px");
  assert.equal(risk.style.fontSize, "12px");

  const before = worldPosition(card.hitArea);
  const iconBefore = worldPosition(card.icon);
  overlay.container.setPosition(170, 210);
  const after = worldPosition(card.hitArea);
  const iconAfter = worldPosition(card.icon);
  assert.deepEqual({ x: after.x - before.x, y: after.y - before.y }, { x: 130, y: 160 });
  assert.deepEqual({ x: iconAfter.x - iconBefore.x, y: iconAfter.y - iconBefore.y }, { x: 130, y: 160 });

  card.hitArea.emit("pointerdown");
  assert.equal(activations, 1);
  card.setFooter("当前：Lv 4");
  assert.equal(footer.text, "当前：Lv 4");
  card.setState("selected");
  card.disableInteractive();
  assert.equal(card.hitArea.interactive, false);

  const destroyObservations = [];
  card.hitArea.on("destroy", (target) => {
    destroyObservations.push([target.destroying, target.destroyed]);
  });
  card.destroy();
  card.destroy();
  assert.deepEqual(destroyObservations, [[true, false]]);
  assert.equal(card.objects.every(({ destroyed }) => destroyed), true);
  assert.equal(card.objects.every(({ listenerCount }) => listenerCount === 0), true);
  assert.equal(card.objects.some((object) => overlay.content.list.includes(object)), false);
  overlay.destroy();
});

test("terminal card truncates pathological Chinese copy with an ellipsis at no less than 12px", () => {
  const scene = createScene({ availableTextures: ["upgrade-icon"] });
  const card = createTerminalCard(scene, {
    x: 240,
    y: 270,
    width: 220,
    height: 230,
    iconKey: "upgrade-icon",
    title: "异常现场授权协议".repeat(8),
    description: "该授权协议包含无法在单张现场终端档案中完整展示的异常处置说明".repeat(12),
    footer: "当前等级与风险状态需要在行动前再次确认".repeat(4),
    riskLabel: "本局不可撤销且风险持续累积".repeat(4)
  });

  const texts = card.objects.filter(({ type }) => type === "text");
  assert.ok(texts.some(({ text }) => text.endsWith("…")));
  assert.equal(texts.every(({ style }) => parseFontSize(style.fontSize) >= 12), true);
  const description = texts.find(({ style }) => style.wordWrap?.width === 180 && style.fontSize !== "18px");
  assert.ok(description.getBounds().height <= 92);
});

test("missing surface textures are skipped and overlay teardown preserves destroy observers", () => {
  const scene = createScene();
  const overlay = createTerminalOverlay(scene, {
    width: 700,
    height: 400,
    surfaceTextureKey: "missing-surface"
  });
  assert.equal(overlay.objects.some(({ type }) => type === "tileSprite"), false);

  overlay.setVisible(false);
  assert.equal(overlay.container.visible, false);
  overlay.setVisible(true);
  overlay.setTone("danger");

  const observed = [];
  const child = overlay.objects.find(({ type }) => type === "text");
  child.on("destroy", (target) => observed.push([target.destroying, target.destroyed]));
  overlay.destroy();
  overlay.destroy();

  assert.deepEqual(observed, [[true, false]]);
  assert.equal(overlay.objects.every(({ destroyed }) => destroyed), true);
  assert.equal(overlay.objects.every(({ listenerCount }) => listenerCount === 0), true);
  assert.equal(scene.tweensCreated[0].removed, true);
});

test("manual overlay destroy emits fromScene false after reverse child cleanup", () => {
  const scene = createScene();
  const overlay = createTerminalOverlay(scene, { width: 700, height: 400 });
  const descendants = overlay.objects.filter((object) => object !== overlay.container);
  const observations = [];
  overlay.container.on("destroy", (target, fromScene) => {
    observations.push({
      target,
      fromScene,
      childrenDestroyed: descendants.every(({ destroyed }) => destroyed),
      listenerCountDuringEmit: target.listenerCount
    });
  });

  overlay.destroy();

  assert.equal(observations.length, 1);
  assert.equal(observations[0].target, overlay.container);
  assert.notEqual(observations[0].fromScene, true);
  assert.equal(observations[0].childrenDestroyed, true);
  assert.ok(observations[0].listenerCountDuringEmit > 0);
  assert.equal(overlay.container.listenerCount, 0);
});

for (const { type, occurrence } of [
  { type: "container", occurrence: 2 },
  { type: "rectangle", occurrence: 1 },
  { type: "graphics", occurrence: 2 },
  { type: "tileSprite", occurrence: 1 },
  { type: "text", occurrence: 2 }
]) {
  test(`terminal overlay rolls back when scene.add.${type} #${occurrence} throws`, () => {
    const scene = createScene({
      availableTextures: ["terminal-surface-grid"],
      addFailure: { type, occurrence }
    });
    assert.throws(
      () => createTerminalOverlay(scene, {
        width: 760,
        height: 420,
        eyebrow: "SITE-19",
        title: "现场授权",
        subtitle: "选择处置协议",
        surfaceTextureKey: "terminal-surface-grid"
      }),
      new RegExp(`add failed: ${type}#${occurrence}`)
    );
    assertRolledBack(scene);
  });
}

for (const { type, occurrence } of [
  { type: "graphics", occurrence: 1 },
  { type: "rectangle", occurrence: 1 },
  { type: "image", occurrence: 1 },
  { type: "text", occurrence: 3 }
]) {
  test(`terminal card rolls back when scene.add.${type} #${occurrence} throws`, () => {
    const scene = createScene({ addFailure: { type, occurrence } });
    assert.throws(
      () => createTerminalCard(scene, {
        x: 100,
        y: 100,
        width: 220,
        height: 230,
        iconKey: "upgrade-icon",
        title: "授权",
        description: LONGEST_UPGRADE_DESCRIPTION,
        footer: "当前：Lv 1"
      }),
      new RegExp(`add failed: ${type}#${occurrence}`)
    );
    assertRolledBack(scene);
  });
}

for (const configurationFailure of [
  { type: "container", method: "setDepth" },
  { type: "rectangle", method: "setInteractive" },
  { type: "tileSprite", method: "setAlpha" },
  { type: "text", method: "setOrigin" }
]) {
  test(`terminal overlay rolls back after ${configurationFailure.type}.${configurationFailure.method} fails`, () => {
    const scene = createScene({
      availableTextures: ["terminal-surface-grid"],
      configurationFailure
    });
    assert.throws(
      () => createTerminalOverlay(scene, {
        width: 760,
        height: 420,
        title: "现场授权",
        surfaceTextureKey: "terminal-surface-grid"
      }),
      /configuration failed/
    );
    assertRolledBack(scene);
  });
}

test("terminal card rolls back after image configuration or parent.add fails", () => {
  const imageFailureScene = createScene({ configurationFailure: { type: "image", method: "setDisplaySize" } });
  assert.throws(
    () => createTerminalCard(imageFailureScene, { width: 220, height: 230, iconKey: "upgrade-icon" }),
    /configuration failed: image\.setDisplaySize/
  );
  assertRolledBack(imageFailureScene);

  const parentFailureScene = createScene({ containerAddFailure: 2 });
  const parent = parentFailureScene.add.container(0, 0);
  const baseline = [...parentFailureScene.created];
  assert.throws(
    () => createTerminalCard(parentFailureScene, {
      parent,
      width: 220,
      height: 230,
      iconKey: "upgrade-icon",
      title: "授权"
    }),
    /container add failed/
  );
  assert.equal(parent.destroyed, false);
  assertRolledBack(parentFailureScene, baseline);
});

test("terminal overlay rolls back when fade tween creation fails", () => {
  const scene = createScene({ tweenFailure: true });
  assert.throws(
    () => createTerminalOverlay(scene, { width: 760, height: 420, title: "现场授权" }),
    /tween add failed/
  );
  assertRolledBack(scene);
});

test("terminal overlay rolls back objects already parented before container.add fails", () => {
  const scene = createScene({ containerAddFailure: 3 });
  assert.throws(
    () => createTerminalOverlay(scene, { width: 760, height: 420, title: "现场授权" }),
    /container add failed: #3/
  );
  assertRolledBack(scene);
});
