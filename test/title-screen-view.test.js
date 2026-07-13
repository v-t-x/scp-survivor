import test from "node:test";
import assert from "node:assert/strict";
import { THEME } from "../src/ui/theme.js";
import {
  createTitleAction,
  createTitleScreenView,
  formatTitleCredits,
  getTitleActionPalette
} from "../src/art/titleScreenView.js";

function displayObject(type) {
  const handlers = new Map();
  return {
    type,
    x: 0,
    alpha: 1,
    handlers,
    commands: [],
    setDepth(value) { this.depth = value; return this; },
    setScrollFactor(value) { this.scrollFactor = value; return this; },
    setOrigin(...value) { this.origin = value; return this; },
    setInteractive(value) { this.interactive = value; return this; },
    disableInteractive() { this.interactive = false; return this; },
    removeInteractive() { this.interactive = false; return this; },
    removeAllListeners() { handlers.clear(); return this; },
    on(event, handler) { handlers.set(event, handler); return this; },
    setText(value) { this.text = value; return this; },
    setColor(value) { this.color = value; return this; },
    clear() { this.commands = []; return this; },
    fillStyle(...args) { this.commands.push(["fillStyle", ...args]); return this; },
    lineStyle(...args) { this.commands.push(["lineStyle", ...args]); return this; },
    beginPath() { this.commands.push(["beginPath"]); return this; },
    moveTo(...args) { this.commands.push(["moveTo", ...args]); return this; },
    lineTo(...args) { this.commands.push(["lineTo", ...args]); return this; },
    closePath() { this.commands.push(["closePath"]); return this; },
    fillPath() { this.commands.push(["fillPath"]); return this; },
    strokePath() { this.commands.push(["strokePath"]); return this; },
    fillCircle(...args) { this.commands.push(["fillCircle", ...args]); return this; },
    strokeCircle(...args) { this.commands.push(["strokeCircle", ...args]); return this; }
  };
}

function sceneStub() {
  const created = [];
  const add = (type, build) => (...args) => {
    const object = build(...args);
    created.push(object);
    return object;
  };
  return {
    created,
    add: {
      graphics: add("graphics", () => displayObject("graphics")),
      rectangle: add("rectangle", (x, y, width, height, fill, alpha) => ({
        ...displayObject("rectangle"), x, y, width, height, fill, alpha
      })),
      text: add("text", (x, y, text, style) => ({
        ...displayObject("text"), x, y, text, style
      }))
    }
  };
}

function screenSceneStub() {
  const scene = sceneStub();
  const tweens = [];
  scene.add.circle = (...args) => {
    const object = { ...displayObject("circle"), args };
    scene.created.push(object);
    return object;
  };
  scene.tweens = {
    add(config) {
      const tween = { config, stopCount: 0, stop() { this.stopCount += 1; } };
      tweens.push(tween);
      return tween;
    }
  };
  scene.tweens.created = tweens;
  return scene;
}

test("title action palettes are distinct and production tokens are fixed", () => {
  assert.deepEqual(THEME.title, {
    scrim: 0x03070c,
    bottomRail: 0x071019,
    line: 0x637b90,
    actionFill: 0x101b27,
    actionHover: 0x172a38,
    actionPressed: 0x0a1119,
    alarm: 0xb9474f
  });
  const states = ["idle", "hover", "pressed", "activated"]
    .map(getTitleActionPalette);
  assert.equal(new Set(states.map(({ fill, border }) => `${fill}/${border}`)).size, 4);
  assert.equal(states[3].label, "授权中");
  assert.ok(states.every(Object.isFrozen));
});

test("title action owns one exact hit area and stops listeners idempotently", () => {
  const scene = sceneStub();
  const cleanup = [];
  let activations = 0;
  const action = createTitleAction(scene, cleanup, {
    x: 52,
    y: 356,
    width: 316,
    height: 62,
    depth: 20,
    onActivate: () => { activations += 1; }
  });

  assert.equal(action.objects.length, 7);
  assert.equal(action.hitArea.x, 210);
  assert.equal(action.hitArea.y, 387);
  assert.equal(action.hitArea.width, 316);
  assert.equal(action.hitArea.height, 62);
  assert.deepEqual(cleanup, action.objects);
  action.hitArea.handlers.get("pointerover")();
  action.hitArea.handlers.get("pointerdown")();
  action.hitArea.handlers.get("pointerup")();
  assert.equal(activations, 1);
  action.stop();
  action.stop();
  assert.equal(action.hitArea.handlers.size, 0);
  assert.equal(action.hitArea.interactive, false);
});

test("credits formatting is finite and title view owns the approved information hierarchy", () => {
  assert.equal(formatTitleCredits(585), "585");
  assert.equal(formatTitleCredits(1234567), "1,234,567");
  assert.equal(formatTitleCredits(Number.MAX_SAFE_INTEGER), "999,999,999+");
  assert.equal(formatTitleCredits(-4), "0");
  assert.equal(formatTitleCredits("bad"), "0");

  const scene = screenSceneStub();
  const cleanup = [];
  let activations = 0;
  const view = createTitleScreenView(scene, cleanup, {
    credits: 585,
    depth: 20,
    onActivate() { activations += 1; }
  });
  const texts = scene.created.filter(({ type }) => type === "text").map(({ text }) => text);
  assert.ok(texts.includes("SITE-CN-03 // CONTAINMENT INCIDENT"));
  assert.ok(texts.includes("收容失效"));
  assert.ok(texts.includes("SCP"));
  assert.ok(texts.includes("幸存者"));
  assert.ok(texts.includes("进入失控设施，完成 SCP-049 再收容。"));
  assert.ok(texts.includes("累计学分 585"));
  assert.ok(texts.some((text) => text.includes("WASD 移动")));
  const creditsText = scene.created.find(({ type, text }) => type === "text" && text === "累计学分 585");
  assert.equal(creditsText.style.fixedWidth, 180);
  assert.equal(scene.tweens.created.length, 3);
  const [titleTween, missionTween, actionTween] = scene.tweens.created;
  assert.deepEqual(titleTween.config, {
    targets: scene.created.slice(0, 5), x: "+=16", alpha: 1, duration: 360, ease: "Sine.Out"
  });
  assert.deepEqual(missionTween.config, {
    targets: scene.created.slice(5, 7), x: "+=12", alpha: 1, delay: 120, duration: 320, ease: "Sine.Out"
  });
  const actionVisualObjects = view.action.objects.filter((object) => object !== view.action.hitArea);
  assert.deepEqual(actionTween.config, {
    targets: actionVisualObjects, alpha: 1, delay: 240, duration: 300, ease: "Sine.Out"
  });
  assert.equal(view.action.hitArea.alpha, 1);
  assert.ok(actionVisualObjects.every(({ alpha }) => alpha === 0));
  view.action.hitArea.handlers.get("pointerup")();
  assert.equal(activations, 1);
  assert.deepEqual(cleanup, scene.created);
  assert.deepEqual(view.objects, scene.created);
  view.stop();
  view.stop();
  assert.ok(scene.tweens.created.every((tween) => tween.stopCount === 1));
  assert.equal(view.action.hitArea.handlers.size, 0);
});
