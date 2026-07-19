import test from "node:test";
import assert from "node:assert/strict";
import { THEME } from "../src/ui/theme.js";
import {
  createTitleAction,
  createTitleScreenView,
  formatTitleCredits,
  getTitleActionPalette
} from "../src/art/titleScreenView.js";
import { menusMixin } from "../src/scene/menus.js";

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
    setFillStyle(fill, alpha) { this.fill = fill; this.fillAlpha = alpha; return this; },
    clear() { this.commands = []; return this; },
    fillStyle(...args) { this.commands.push(["fillStyle", ...args]); return this; },
    fillRect(...args) { this.commands.push(["fillRect", ...args]); return this; },
    lineStyle(...args) { this.commands.push(["lineStyle", ...args]); return this; },
    strokeRect(...args) { this.commands.push(["strokeRect", ...args]); return this; },
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
        ...displayObject("rectangle"), x, y, width, height, fill, fillAlpha: alpha
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
  assert.equal(states[0].status, "AUTH");
  assert.equal(states[1].status, "READY");
  assert.ok(states[1].borderWidth > states[0].borderWidth);
  assert.ok(states[1].accentAlpha > states[0].accentAlpha);
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
  const [frame, main, , index, , , accent] = action.objects;
  assert.equal(main.x, 70);
  assert.equal(index.text, "AUTH");
  assert.equal(accent.alpha, getTitleActionPalette("idle").accentAlpha);
  action.hitArea.handlers.get("pointerover")();
  assert.equal(main.x, 73);
  assert.equal(index.text, "READY");
  assert.equal(accent.alpha, getTitleActionPalette("hover").accentAlpha);
  assert.ok(frame.commands.some((command) =>
    command[0] === "lineStyle" && command[1] === getTitleActionPalette("hover").borderWidth
  ));
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
  assert.ok(texts.includes("累计学分"));
  assert.ok(texts.includes("585"));
  assert.deepEqual(
    scene.created
      .filter(({ type, y }) => type === "text" && y === 517)
      .map(({ text }) => text),
    ["WASD  移动", "SPACE  闪避", "TAB  构建", "ESC  暂停 · M  静音"]
  );
  assert.equal(texts.some((text) => text.includes("/ SPACE")), false);
  assert.ok(texts.includes("POWER"));
  assert.ok(texts.includes("CONTAINMENT"));
  assert.ok(texts.includes("电力在线"));
  assert.ok(texts.includes("收容失效"));
  assert.equal(texts.includes("电力在线          收容失效"), false);
  const controlGroups = scene.created.filter(({ type, y }) => type === "text" && y === 517);
  assert.ok(controlGroups.every(({ style }) => style.fontSize === "10px" && style.color === THEME.text.secondary));
  const powerLabel = scene.created.find(({ type, text, y }) => type === "text" && text === "POWER" && y === 507);
  const dangerLabel = scene.created.find(({ type, text, y }) => type === "text" && text === "CONTAINMENT" && y === 507);
  const powerStatus = scene.created.find(({ type, text, y }) => type === "text" && text === "电力在线" && y === 524);
  const dangerStatus = scene.created.find(({ type, text, y }) => type === "text" && text === "收容失效" && y === 524);
  assert.equal(powerLabel.style.fontSize, "8px");
  assert.equal(dangerLabel.style.fontSize, "8px");
  assert.equal(powerStatus.style.color, THEME.text.contained);
  assert.equal(dangerStatus.style.color, THEME.text.critical);
  const creditsLabel = scene.created.find(({ type, text, y }) => type === "text" && text === "累计学分" && y === 507);
  const creditsValue = scene.created.find(({ type, text, y }) => type === "text" && text === "585" && y === 524);
  assert.ok(Number.parseInt(creditsValue.style.fontSize) > Number.parseInt(creditsLabel.style.fontSize));
  assert.equal(creditsValue.style.align, "right");
  const bottom = scene.created.find(({ type, width, height }) => type === "rectangle" && width === 960 && height === 46);
  assert.ok(bottom.fillAlpha <= 0.72, "bottom rail fill should remain translucent");
  const bottomTicks = scene.created.find(({ type, commands }) =>
    type === "graphics" && commands.some(([command, x]) => command === "lineTo" && x === 512)
  );
  assert.ok(bottomTicks.commands.filter(([command]) => command === "lineTo").length >= 4);
  assert.equal(scene.tweens.created.length, 5);
  const [titleTween, missionTween, actionTween, bottomEntranceTween, alertPulseTween] = scene.tweens.created;
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
  const bottomObjects = bottomEntranceTween.config.targets;
  assert.ok(bottomObjects.includes(bottom));
  assert.ok(bottomObjects.includes(dangerStatus));
  assert.ok(bottomObjects.every(({ alpha }) => alpha === 0));
  assert.ok(bottomEntranceTween.config.delay >= 400, "bottom rail should resolve after the title hierarchy");
  const alert = scene.created.find(({ type, text, y }) => type === "text" && text === "收容失效" && y === 72);
  assert.deepEqual(alertPulseTween.config, {
    targets: alert,
    alpha: { from: 0.84, to: 1 },
    yoyo: true,
    repeat: -1,
    delay: 700,
    duration: 900,
    ease: "Sine.InOut"
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

function lifecycleScene() {
  const objects = [];
  const tweens = [];
  function object(type, values = {}) {
    const item = {
      ...displayObject(type),
      ...values,
      active: true,
      setScale(value) { this.scale = value; return this; },
      destroyCount: 0,
      destroy() { this.active = false; this.destroyCount += 1; return this; }
    };
    objects.push(item);
    return item;
  }
  const scene = {
    meta: { credits: 17 },
    setGameplayHudVisible() {},
    cameras: { main: { setBackgroundColor() {} } },
    add: {
      image: (x, y, texture) => object("image", { x, y, texture }),
      graphics: () => object("graphics"),
      rectangle: (x, y, width, height, fill, alpha) => object("rectangle", { x, y, width, height, fill, alpha }),
      circle: (x, y, radius, fill, alpha) => object("circle", { x, y, radius, fill, alpha }),
      text: (x, y, text, style) => object("text", { x, y, text, style })
    },
    tweens: {
      add(config) {
        const tween = { config, stopCount: 0, stop() { this.stopCount += 1; } };
        tweens.push(tween);
        return tween;
      }
    },
    weaponSelectionCreates: 0,
    createWeaponSelectionScreen() { this.weaponSelectionCreates += 1; }
  };
  scene.createStartScreen = menusMixin.createStartScreen;
  scene.beginFromStartScreen = menusMixin.beginFromStartScreen;
  scene.destroyStartScreen = menusMixin.destroyStartScreen;
  return { scene, objects, tweens };
}

test("menusMixin title lifecycle activates, destroys idempotently and recreates without leaks", () => {
  const { scene, objects, tweens } = lifecycleScene();

  scene.createStartScreen();
  const firstObjects = [...scene.startScreenObjects];
  const firstTweens = [...tweens];
  const firstHitArea = scene.titleScreenController.action.hitArea;
  assert.equal(firstTweens.length, 9, "both controllers should own all entrance and ambient tweens");
  assert.equal(firstHitArea.handlers.size, 4);
  assert.ok(scene.titleBackdropController);
  assert.ok(scene.titleScreenController);

  firstHitArea.handlers.get("pointerup")();
  assert.equal(scene.weaponSelectionCreates, 1);
  assert.equal(scene.startScreenObjects, null);
  assert.equal(scene.titleBackdropController, null);
  assert.equal(scene.titleScreenController, null);
  assert.ok(firstObjects.every(({ active, destroyCount }) => !active && destroyCount === 1));
  assert.ok(firstTweens.every(({ stopCount }) => stopCount === 1));
  assert.equal(firstHitArea.handlers.size, 0);

  scene.destroyStartScreen();
  assert.ok(firstObjects.every(({ destroyCount }) => destroyCount === 1));
  assert.ok(firstTweens.every(({ stopCount }) => stopCount === 1));

  scene.createStartScreen();
  const secondObjects = [...scene.startScreenObjects];
  const secondTweens = tweens.slice(firstTweens.length);
  const secondHitArea = scene.titleScreenController.action.hitArea;
  assert.notEqual(secondHitArea, firstHitArea);
  assert.equal(secondHitArea.handlers.size, 4);
  assert.equal(secondTweens.length, 9);
  assert.equal(objects.filter(({ active }) => active).length, secondObjects.length);
  assert.ok(secondTweens.every(({ stopCount }) => stopCount === 0));

  scene.destroyStartScreen();
  scene.destroyStartScreen();
  assert.ok(secondObjects.every(({ active, destroyCount }) => !active && destroyCount === 1));
  assert.ok(secondTweens.every(({ stopCount }) => stopCount === 1));
  assert.equal(secondHitArea.handlers.size, 0);
  assert.equal(objects.filter(({ active }) => active).length, 0);
});
