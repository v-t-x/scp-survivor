# 标题页商业化战术 UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 保留现有设施门背景，把 960×540 标题页重构为以品牌标题和收容门为双焦点、具有紧凑主行动区与底部状态栏的商业化战术标题页。

**Architecture:** `menus.js` 只保留业务组装与进入军械库回调；新建 `titleScreenView.js` 管理标题组、任务简报、主行动控件和底部状态栏；`titleBackdrop.js` 管理渐隐遮罩、门禁标记与氛围 tween。所有控制器只停止 tween 和监听器，显示对象继续统一登记在 `startScreenObjects`，由现有销毁循环释放。

**Tech Stack:** Phaser 3.90、JavaScript ES Modules、Node.js `node:test`、Vite 7。

## Global Constraints

- 只在 `feature/ui-art-overhaul` 的 `C:\scp-survivor-ui-art` worktree 工作。
- 保留 `title-facility-backdrop`，不新增图片、Logo、字体、依赖或第三方素材。
- 固定设计分辨率为 960×540、DPR 1；不增加响应式布局范围。
- 唯一主行动入口仍调用 `beginFromStartScreen()`，随后进入现有军械库。
- 不修改伤害、生命、刷怪、AI、升级、胜负、存档、Scene 启动或 restart 语义。
- 不修改 `AudioManager`、`UIManager`、manifest、preload 或 fallback 公共合同。
- 标题页所有 tween 与监听器必须可幂等停止；restart 后不能重复。
- 每个实现任务遵循 RED→GREEN→REFACTOR，并在提交前执行对应聚焦测试。
- 未经用户明确授权，不 merge、push、删除 worktree 或重写历史。

---

## File Map

- Create `src/art/titleScreenView.js`：标题页信息层级、主行动控件、底部状态栏与入场 tween。
- Modify `src/art/titleBackdrop.js`：全屏背景、渐隐遮罩、门禁定位与氛围 tween。
- Modify `src/scene/menus.js`：用两个标题页控制器组装页面，保留业务数据与跳转。
- Modify `src/ui/theme.js`：增加标题页专用的可复用颜色与尺寸 token。
- Create `test/title-screen-view.test.js`：主行动状态、学分格式、组件对象所有权和监听清理。
- Modify `test/title-screen-art.test.js`：背景层、tween 生命周期、标题页集成合同。
- Modify `test/menu-art.test.js`：更新标题页模块集成断言，保留军械库合同。

---

### Task 1: 建立标题页视觉 token 与主行动控件

**Files:**
- Create: `src/art/titleScreenView.js`
- Modify: `src/ui/theme.js`
- Create: `test/title-screen-view.test.js`

**Interfaces:**
- Consumes: `THEME.font`、`THEME.text`、`THEME.terminal`、Phaser `scene.add.graphics/text/rectangle`。
- Produces: `getTitleActionPalette(state)`；`createTitleAction(scene, targetArray, options)`，返回 `{ objects, hitArea, setState, stop }`。

- [ ] **Step 1: 写失败测试，锁定标题页 token 与行动状态**

创建 `test/title-screen-view.test.js`：

```js
import test from "node:test";
import assert from "node:assert/strict";
import { THEME } from "../src/ui/theme.js";
import {
  createTitleAction,
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
```

- [ ] **Step 2: 运行测试并确认按预期失败**

Run: `node --test test/title-screen-view.test.js`

Expected: FAIL，提示 `titleScreenView.js` 不存在或 `THEME.title` 未定义。

- [ ] **Step 3: 增加标题页 token**

在 `THEME` 中新增：

```js
  title: {
    scrim: 0x03070c,
    bottomRail: 0x071019,
    line: 0x637b90,
    actionFill: 0x101b27,
    actionHover: 0x172a38,
    actionPressed: 0x0a1119,
    alarm: 0xb9474f
  },
```

- [ ] **Step 4: 实现主行动控件**

在 `src/art/titleScreenView.js` 中实现以下公开合同；`drawActionFrame` 使用绝对坐标绘制 8px 切角矩形，内部再画一条 `y + 4` 的高光线：

```js
import { THEME } from "../ui/theme.js";

const ACTION_PALETTES = Object.freeze({
  idle: Object.freeze({ fill: THEME.title.actionFill, border: THEME.title.line, text: THEME.text.primary, signal: THEME.terminal.frame, label: "01 / 进入设施", offsetX: 0 }),
  hover: Object.freeze({ fill: THEME.title.actionHover, border: THEME.terminal.frameFocus, text: THEME.text.onButton, signal: THEME.terminal.contained, label: "01 / 进入设施", offsetX: 3 }),
  pressed: Object.freeze({ fill: THEME.title.actionPressed, border: THEME.terminal.warning, text: THEME.text.onButton, signal: THEME.terminal.warning, label: "01 / 进入设施", offsetX: 3 }),
  activated: Object.freeze({ fill: THEME.title.actionFill, border: THEME.terminal.contained, text: THEME.text.contained, signal: THEME.terminal.contained, label: "授权中", offsetX: 3 })
});

export function getTitleActionPalette(state) {
  return ACTION_PALETTES[state] ?? ACTION_PALETTES.idle;
}

export function createTitleAction(scene, targetArray, options) {
  const { x, y, width, height, depth, onActivate } = options;
  const frame = scene.add.graphics();
  const main = scene.add.text(x + 18, y + 20, "", {
    fontFamily: THEME.font.display,
    fontSize: "18px",
    fontStyle: "bold",
    color: THEME.text.primary
  }).setOrigin(0, 0.5);
  const detail = scene.add.text(x + 18, y + 43, "前往军械库并授权装备", {
    fontFamily: THEME.font.label,
    fontSize: "11px",
    color: THEME.text.muted
  }).setOrigin(0, 0.5);
  const index = scene.add.text(x + width - 46, y + 15, "AUTH", {
    fontFamily: THEME.font.mono,
    fontSize: "9px",
    color: THEME.text.muted
  }).setOrigin(0, 0.5);
  const signal = scene.add.graphics();
  const hitArea = scene.add.rectangle(x + width / 2, y + height / 2, width, height, 0x000000, 0);
  const accent = scene.add.rectangle(x + 4, y + 8, 3, height - 16, THEME.title.alarm, 0.9).setOrigin(0, 0);
  const objects = [frame, main, detail, index, signal, hitArea];
  objects.push(accent);
  for (const object of objects) {
    object.setDepth(depth);
    object.setScrollFactor(0);
    targetArray.push(object);
  }

  let stopped = false;
  let current = "idle";
  function setState(state) {
    if (stopped) return;
    current = state;
    const palette = getTitleActionPalette(state);
    drawActionFrame(frame, { x, y, width, height, fill: palette.fill, border: palette.border });
    main.setText(palette.label);
    main.x = x + 18 + palette.offsetX;
    main.setColor(palette.text);
    signal.clear().fillStyle(palette.signal, 1).fillCircle(x + width - 22, y + height / 2, 5);
    signal.lineStyle(1, THEME.terminal.frameFocus, 0.8).strokeCircle(x + width - 22, y + height / 2, 5);
  }

  hitArea.setInteractive({ useHandCursor: true });
  hitArea.on("pointerover", () => setState("hover"));
  hitArea.on("pointerout", () => setState(current === "activated" ? "activated" : "idle"));
  hitArea.on("pointerdown", () => setState("pressed"));
  hitArea.on("pointerup", () => {
    setState("activated");
    onActivate();
  });
  setState("idle");

  return {
    objects,
    hitArea,
    setState,
    stop() {
      if (stopped) return;
      stopped = true;
      hitArea.removeAllListeners();
      hitArea.disableInteractive();
      hitArea.removeInteractive();
    }
  };
}
```

实现同文件私有函数：

```js
function drawActionFrame(graphics, { x, y, width, height, fill, border }) {
  const cut = 8;
  graphics.clear();
  graphics.fillStyle(fill, 0.96);
  graphics.lineStyle(2, border, 1);
  graphics.beginPath();
  graphics.moveTo(x + cut, y);
  graphics.lineTo(x + width - cut, y);
  graphics.lineTo(x + width, y + cut);
  graphics.lineTo(x + width, y + height - cut);
  graphics.lineTo(x + width - cut, y + height);
  graphics.lineTo(x + cut, y + height);
  graphics.lineTo(x, y + height - cut);
  graphics.lineTo(x, y + cut);
  graphics.closePath();
  graphics.fillPath();
  graphics.strokePath();
  graphics.lineStyle(1, THEME.terminal.frameFocus, 0.3);
  graphics.beginPath();
  graphics.moveTo(x + 12, y + 4);
  graphics.lineTo(x + width - 12, y + 4);
  graphics.strokePath();
}
```

- [ ] **Step 5: 运行聚焦测试**

Run: `node --test test/title-screen-view.test.js test/tactical-ui.test.js`

Expected: PASS；既有 tactical controls 测试保持不变。

- [ ] **Step 6: 提交**

```bash
git add src/ui/theme.js src/art/titleScreenView.js test/title-screen-view.test.js
git commit -m "feat(ui): add production title action"
```

---

### Task 2: 重构背景遮罩与门禁氛围控制器

**Files:**
- Modify: `src/art/titleBackdrop.js`
- Modify: `test/title-screen-art.test.js`

**Interfaces:**
- Consumes: `TEXTURES.titleFacilityBackdrop`、`THEME.title`、`scene.tweens.add()`。
- Produces: `createTitleBackdrop(scene, targetArray, depth)`，返回 `{ objects, stop }`；`stop()` 幂等停止全部 tween。

- [ ] **Step 1: 改写失败测试，要求渐隐遮罩、门禁标记和多个 tween**

扩展 `makeDisplayObject()`：

```js
function makeDisplayObject() {
  return {
    x: 0,
    y: 0,
    alpha: 1,
    commands: [],
    setDepth(depth) { this.depth = depth; return this; },
    setScrollFactor(value) { this.scrollFactor = value; return this; },
    setScale(value) { this.scale = value; return this; },
    setOrigin(...value) { this.origin = value; return this; },
    clear() { this.commands = []; return this; },
    fillStyle(...args) { this.commands.push(["fillStyle", ...args]); return this; },
    fillRect(...args) { this.commands.push(["fillRect", ...args]); return this; },
    lineStyle(...args) { this.commands.push(["lineStyle", ...args]); return this; },
    strokeRect(...args) { this.commands.push(["strokeRect", ...args]); return this; }
  };
}
```

将背景测试改为：

```js
test("title backdrop owns gradient, gate focus and every tween idempotently", () => {
  const calls = [];
  const tweens = [];
  const scene = {
    add: {
      image(...args) { calls.push({ type: "image", args }); return makeDisplayObject(); },
      graphics(...args) { calls.push({ type: "graphics", args }); return makeDisplayObject(); },
      rectangle(...args) { calls.push({ type: "rectangle", args }); return makeDisplayObject(); },
      circle(...args) { calls.push({ type: "circle", args }); return makeDisplayObject(); },
      text(...args) { calls.push({ type: "text", args }); return makeDisplayObject(); }
    },
    tweens: {
      add(config) {
        const tween = { config, stopCount: 0, stop() { this.stopCount += 1; } };
        tweens.push(tween);
        return tween;
      }
    }
  };
  const cleanup = [];
  const controller = createTitleBackdrop(scene, cleanup, 7);

  assert.equal(calls[0].type, "image");
  assert.deepEqual(calls[0].args, [480, 270, TEXTURES.titleFacilityBackdrop]);
  assert.equal(calls.filter(({ type }) => type === "graphics").length, 2);
  assert.equal(calls.some(({ type, args }) => type === "rectangle" && args[2] === 440 && args[3] === 540), false);
  assert.equal(tweens.length, 3);
  assert.equal(cleanup.length, controller.objects.length);
  assert.ok(controller.objects.every((object) => object.scrollFactor === 0));
  controller.stop();
  controller.stop();
  assert.ok(tweens.every((tween) => tween.stopCount === 1));
});
```

- [ ] **Step 2: 运行 RED**

Run: `node --test test/title-screen-art.test.js`

Expected: FAIL，旧控制器仍创建 440×540 scrim、只有一个 tween、没有 graphics 门禁层。

- [ ] **Step 3: 实现背景控制器**

将 `createTitleBackdrop` 改为以下结构：

```js
export function createTitleBackdrop(scene, targetArray, depth) {
  const background = scene.add.image(480, 270, TEXTURES.titleFacilityBackdrop)
    .setDepth(depth)
    .setScale(1.02);
  const gradient = scene.add.graphics().setDepth(depth + 1);
  for (let index = 0; index < 12; index += 1) {
    gradient.fillStyle(THEME.title.scrim, Math.max(0.08, 0.82 - index * 0.065));
    gradient.fillRect(index * 48, 0, 52, 540);
  }
  const vignette = scene.add.rectangle(480, 270, 960, 540, 0x000000, 0.08).setDepth(depth + 1);
  const gateFocus = scene.add.graphics().setDepth(depth + 2);
  gateFocus.lineStyle(1, THEME.title.line, 0.55);
  gateFocus.strokeRect(592, 124, 286, 366);
  gateFocus.lineStyle(3, THEME.title.alarm, 0.75);
  gateFocus.strokeRect(604, 136, 22, 3);
  gateFocus.strokeRect(844, 474, 22, 3);
  const gateLabel = scene.add.text(604, 112, "GATE 03 // BREACH", {
    fontFamily: THEME.font.mono,
    fontSize: "10px",
    color: THEME.text.critical
  }).setDepth(depth + 3);
  const lamp = scene.add.circle(804, 112, 42, THEME.title.alarm, 0.1).setDepth(depth + 2);
  const scanline = scene.add.rectangle(735, 166, 224, 2, THEME.title.alarm, 0.18)
    .setDepth(depth + 3)
    .setOrigin(0.5, 0.5);
  const objects = [background, gradient, vignette, gateFocus, gateLabel, lamp, scanline];
  for (const object of objects) {
    object.setScrollFactor(0);
    targetArray.push(object);
  }

  const tweens = [
    scene.tweens.add({ targets: background, scaleX: 1, scaleY: 1, duration: 600, ease: "Sine.Out" }),
    scene.tweens.add({ targets: lamp, alpha: { from: 0.06, to: 0.17 }, yoyo: true, repeat: -1, duration: 850 }),
    scene.tweens.add({ targets: scanline, y: { from: 166, to: 452 }, alpha: { from: 0.04, to: 0.2 }, repeat: -1, repeatDelay: 2400, duration: 900 })
  ];
  let stopped = false;
  return {
    objects,
    stop() {
      if (stopped) return;
      stopped = true;
      for (const tween of tweens) tween.stop();
    }
  };
}
```

若 `Graphics#setDepth()` 的返回 stub 已支持链式调用，不增加测试专用生产代码。

- [ ] **Step 4: 运行聚焦与资源测试**

Run: `node --test test/title-screen-art.test.js test/art-assets.test.js`

Expected: PASS；正式背景 key、尺寸与 fallback 合同不变。

- [ ] **Step 5: 提交**

```bash
git add src/art/titleBackdrop.js test/title-screen-art.test.js
git commit -m "feat(ui): focus the title facility breach"
```

---

### Task 3: 创建完整标题信息层级与底部状态栏

**Files:**
- Modify: `src/art/titleScreenView.js`
- Modify: `test/title-screen-view.test.js`

**Interfaces:**
- Consumes: Task 1 的 `createTitleAction()`；`credits: unknown`；`onActivate: () => void`。
- Produces: `formatTitleCredits(value): string`；`createTitleScreenView(scene, targetArray, options)`，返回 `{ objects, action, stop }`。

- [ ] **Step 1: 写失败测试，锁定文本、状态栏与清理**

在 `test/title-screen-view.test.js` 增加 tween stub：

```js
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
```

增加测试：

```js
test("credits formatting is finite and title view owns the approved information hierarchy", () => {
  assert.equal(formatTitleCredits(585), "585");
  assert.equal(formatTitleCredits(1234567), "1,234,567");
  assert.equal(formatTitleCredits(Number.MAX_SAFE_INTEGER), "999,999,999+");
  assert.equal(formatTitleCredits(-4), "0");
  assert.equal(formatTitleCredits("bad"), "0");

  const scene = screenSceneStub();
  const cleanup = [];
  const view = createTitleScreenView(scene, cleanup, {
    credits: 585,
    depth: 20,
    onActivate() {}
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
  assert.deepEqual(cleanup, view.objects);
  view.stop();
  view.stop();
  assert.ok(scene.tweens.created.every((tween) => tween.stopCount === 1));
  assert.equal(view.action.hitArea.handlers.size, 0);
});
```

更新 import：

```js
import {
  createTitleAction,
  createTitleScreenView,
  formatTitleCredits,
  getTitleActionPalette
} from "../src/art/titleScreenView.js";
```

- [ ] **Step 2: 运行 RED**

Run: `node --test test/title-screen-view.test.js`

Expected: FAIL，`formatTitleCredits` 与 `createTitleScreenView` 尚未导出。

- [ ] **Step 3: 实现学分格式与标题页组装**

在 `titleScreenView.js` 增加：

```js
export function formatTitleCredits(value) {
  const number = Number(value);
  const safe = Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
  if (safe > 999_999_999) return "999,999,999+";
  return safe.toLocaleString("zh-CN");
}

function register(targetArray, objects, depth) {
  for (const object of objects) {
    object.setDepth(depth);
    object.setScrollFactor(0);
    targetArray.push(object);
  }
  return objects;
}

export function createTitleScreenView(scene, targetArray, options) {
  const { credits, depth, onActivate } = options;
  const eyebrow = scene.add.text(52, 48, "SITE-CN-03 // CONTAINMENT INCIDENT", {
    fontFamily: THEME.font.mono, fontSize: "11px", color: THEME.text.muted
  });
  const alertRail = scene.add.rectangle(52, 72, 128, 24, THEME.title.alarm, 0.9).setOrigin(0, 0.5);
  const alert = scene.add.text(64, 72, "收容失效", {
    fontFamily: THEME.font.label, fontSize: "12px", fontStyle: "bold", color: THEME.text.onButton
  }).setOrigin(0, 0.5);
  const scp = scene.add.text(52, 112, "SCP", {
    fontFamily: THEME.font.display, fontSize: "34px", fontStyle: "bold", color: THEME.text.secondary
  }).setOrigin(0, 0.5);
  const title = scene.add.text(50, 164, "幸存者", {
    fontFamily: THEME.font.display, fontSize: "64px", fontStyle: "bold", color: THEME.text.primary
  }).setOrigin(0, 0.5);
  const missionLabel = scene.add.text(52, 222, "MISSION 01 // RECONTAINMENT", {
    fontFamily: THEME.font.mono, fontSize: "10px", color: THEME.text.critical
  }).setOrigin(0, 0.5);
  const mission = scene.add.text(52, 246, "进入失控设施，完成 SCP-049 再收容。", {
    fontFamily: THEME.font.body, fontSize: "15px", color: THEME.text.secondary
  }).setOrigin(0, 0.5);
  const titleObjects = register(targetArray, [eyebrow, alertRail, alert, scp, title], depth);
  const missionObjects = register(targetArray, [missionLabel, mission], depth);

  const action = createTitleAction(scene, targetArray, {
    x: 52, y: 356, width: 316, height: 62, depth, onActivate
  });
  const bottom = scene.add.rectangle(480, 517, 960, 46, THEME.title.bottomRail, 0.92).setOrigin(0.5, 0.5);
  const topLine = scene.add.rectangle(480, 494, 960, 1, THEME.title.line, 0.55).setOrigin(0.5, 0.5);
  const controls = scene.add.text(24, 517, "WASD 移动 / SPACE 闪避 / TAB 构建 / ESC 暂停 / M 静音", {
    fontFamily: THEME.font.mono, fontSize: "10px", color: THEME.text.muted
  }).setOrigin(0, 0.5);
  const powerLamp = scene.add.circle(565, 517, 4, THEME.terminal.contained, 1);
  const dangerLamp = scene.add.circle(675, 517, 4, THEME.terminal.danger, 1);
  const status = scene.add.text(578, 517, "电力在线          收容失效", {
    fontFamily: THEME.font.label, fontSize: "11px", color: THEME.text.secondary
  }).setOrigin(0, 0.5);
  const creditsText = scene.add.text(936, 517, `累计学分 ${formatTitleCredits(credits)}`, {
    fontFamily: THEME.font.mono, fontSize: "11px", color: THEME.text.secondary, align: "right", fixedWidth: 180
  }).setOrigin(1, 0.5);
  const bottomObjects = register(targetArray, [bottom, topLine, controls, powerLamp, dangerLamp, status, creditsText], depth);

  for (const object of [...titleObjects, ...missionObjects, ...action.objects]) object.alpha = 0;
  for (const object of titleObjects) object.x -= 16;
  for (const object of missionObjects) object.x -= 12;
  const tweens = [
    scene.tweens.add({ targets: titleObjects, x: "+=16", alpha: 1, duration: 360, ease: "Sine.Out" }),
    scene.tweens.add({ targets: missionObjects, x: "+=12", alpha: 1, delay: 120, duration: 320, ease: "Sine.Out" }),
    scene.tweens.add({ targets: action.objects, alpha: 1, delay: 240, duration: 300, ease: "Sine.Out" })
  ];
  let stopped = false;
  const objects = [...titleObjects, ...missionObjects, ...action.objects, ...bottomObjects];
  return {
    objects,
    action,
    stop() {
      if (stopped) return;
      stopped = true;
      for (const tween of tweens) tween.stop();
      action.stop();
    }
  };
}
```

- [ ] **Step 4: 修正 stub 所需的链式方法，不放宽行为断言**

如测试因 stub 缺少 Phaser 链式方法而报错，只在 `displayObject()` 增加生产代码实际调用的方法：

```js
setAlpha(value) { this.alpha = value; return this; },
setVisible(value) { this.visible = value; return this; },
```

禁止删除标题、状态栏、tween 数量或清理断言来让测试通过。

- [ ] **Step 5: 运行聚焦测试**

Run: `node --test test/title-screen-view.test.js test/tactical-ui.test.js`

Expected: PASS；标题页专属控件不改变现有 tactical UI。

- [ ] **Step 6: 提交**

```bash
git add src/art/titleScreenView.js test/title-screen-view.test.js
git commit -m "feat(ui): compose the commercial title hierarchy"
```

---

### Task 4: 集成标题页并锁定 restart 生命周期

**Files:**
- Modify: `src/scene/menus.js`
- Modify: `test/title-screen-art.test.js`
- Modify: `test/menu-art.test.js`

**Interfaces:**
- Consumes: `createTitleBackdrop(scene, targetArray, 7)`；`createTitleScreenView(scene, targetArray, { credits, depth, onActivate })`。
- Produces: `createStartScreen()` 创建一套背景与标题视图控制器；`destroyStartScreen()` 幂等停止两者并销毁所有对象。

- [ ] **Step 1: 写集成失败测试**

将 `test/title-screen-art.test.js` 的标题页源码测试改为：

```js
test("title screen delegates presentation and keeps the existing mission transition", async () => {
  const source = await readFile(new URL("../src/scene/menus.js", import.meta.url), "utf8");
  const method = source.slice(source.indexOf("createStartScreen()"), source.indexOf("beginFromStartScreen()"));
  assert.match(method, /createTitleBackdrop\(this, this\.startScreenObjects, 7\)/);
  assert.match(method, /createTitleScreenView\(this, this\.startScreenObjects, \{/);
  assert.match(method, /credits:\s*this\.meta\.credits/);
  assert.match(method, /onActivate:\s*\(\)\s*=>\s*this\.beginFromStartScreen\(\)/);
  assert.doesNotMatch(method, /this\.add\.text|createTerminalButton|createStatusLamp/);

  const destroyMethod = source.slice(source.indexOf("destroyStartScreen()"), source.indexOf("createWeaponSelectionScreen()"));
  assert.match(destroyMethod, /this\.titleScreenController\?\.stop\(\)/);
  assert.match(destroyMethod, /this\.titleBackdropController\?\.stop\(\)/);
  assert.match(destroyMethod, /object\.destroy\(\)/);
});
```

更新 `test/menu-art.test.js` 的标题页断言：

```js
assert.match(source, /createTitleBackdrop\(this, this\.startScreenObjects, 7\)/);
assert.match(source, /createTitleScreenView\(this, this\.startScreenObjects, \{/);
```

- [ ] **Step 2: 运行 RED**

Run: `node --test test/title-screen-art.test.js test/menu-art.test.js`

Expected: FAIL，`menus.js` 仍直接创建标题、按钮和状态文本。

- [ ] **Step 3: 替换 `createStartScreen()` 组装逻辑**

在 `menus.js` 增加 import：

```js
import { createTitleScreenView } from "../art/titleScreenView.js";
```

保留军械库仍使用的 `createTerminalButton` import；移除仅由旧标题页使用的 `createStatusLamp` import。将 `createStartScreen()` 收敛为：

```js
createStartScreen() {
  this.setGameplayHudVisible(false);
  this.cameras.main.setBackgroundColor(THEME.surface.facility);
  this.startScreenObjects = [];
  this.titleBackdropController = createTitleBackdrop(this, this.startScreenObjects, 7);
  this.titleScreenController = createTitleScreenView(this, this.startScreenObjects, {
    credits: this.meta.credits,
    depth: 20,
    onActivate: () => this.beginFromStartScreen()
  });
},
```

将 `destroyStartScreen()` 改为：

```js
destroyStartScreen() {
  this.titleScreenController?.stop();
  this.titleScreenController = null;
  this.titleBackdropController?.stop();
  this.titleBackdropController = null;
  if (!this.startScreenObjects) return;
  for (const object of this.startScreenObjects) {
    if (object?.active) object.destroy();
  }
  this.startScreenObjects = null;
},
```

不改 `beginFromStartScreen()`、`quitToTitle()` 或 `scene.restart()`。

- [ ] **Step 4: 运行标题页和菜单测试**

Run: `node --test test/title-screen-art.test.js test/title-screen-view.test.js test/menu-art.test.js test/weapon-selection-view.test.js`

Expected: PASS；标题页进入军械库与军械库 UI 合同同时成立。

- [ ] **Step 5: 运行全量测试与构建**

Run: `node --test`

Expected: 全部 PASS，测试总数至少为当前 77 加本计划新增测试。

Run: `npm run build`

Expected: PASS；允许保留既有 `>500 kB` chunk warning，不允许新增 error。

- [ ] **Step 6: 提交**

```bash
git add src/scene/menus.js test/title-screen-art.test.js test/menu-art.test.js
git commit -m "feat(ui): rebuild the commercial title screen"
```

---

### Task 5: 960×540 WebGL 视觉门禁与修复循环

**Files:**
- Modify only if review finds a real defect: `src/art/titleScreenView.js`, `src/art/titleBackdrop.js`, `src/scene/menus.js`, their matching tests.
- Evidence output outside Git: `C:\scp-survivor-ui-art-evidence\title-screen-commercial-v1\`

**Interfaces:**
- Consumes: Tasks 1–4 的最终标题页。
- Produces: 静态证据、控制台日志、独立代码/视觉审查结论和干净分支状态。

- [ ] **Step 1: 启动固定端口生产预览**

Run: `npm run build`

Expected: PASS。

先用 `Get-NetTCPConnection -LocalPort 4173 -State Listen` 与对应进程命令行核实端口归属。若已有监听者是当前 worktree 的旧 Vite preview，按精确 PID 停止后重启；若属于其他程序，不得结束该进程，暂停预览步骤并报告端口冲突。

Run: `npm run preview -- --host 127.0.0.1 --port 4173`

Expected: `http://127.0.0.1:4173/` 返回 HTTP 200，并服务本次新构建的 hash 产物。后台启动使用隐藏窗口并记录 PID；完成视觉验证后保持该固定链接供用户验收，阶段报告中同时给出 URL 与 PID，后续重启必须先核实并替换同一 worktree 的旧 preview。

- [ ] **Step 2: 捕获完整 WebGL 候选帧**

在 960×540、DPR 1 下捕获：

- `title-idle.png`
- `title-hover.png`
- `title-entrance.png`
- `armory-after-activate.png`
- `title-after-restart.png`

每个状态连续捕获至少 3 个候选帧；拒绝 WebGL 清帧与重绘之间的黑屏、缺字或局部撕裂帧。所有 canonical 文件必须校验为真实 PNG、960×540，并记录 SHA-256。

- [ ] **Step 3: 检查视觉合同**

逐张确认：

- 左侧不再有固定 440×540 黑色面板。
- 标题与门构成双焦点；门禁线不遮挡门体。
- 唯一主按钮一秒内可定位，idle/hover 明显不同；pressed 由确定性单元测试和现场点击过渡共同验证，因为 `pointerup` 会立即进入军械库，不要求保留不可稳定捕获的 pressed canonical 帧。
- 底部控制、双状态和学分均完整，不与标题或按钮重叠。
- 入场期间主按钮仍可激活。
- restart 后仅一套标题 UI、tween 和监听器；无残留 tint/alpha。

- [ ] **Step 4: 检查运行时日志**

要求：

- 0 console error。
- 0 runtime error。
- 0 missing texture/animation warning。
- 0 duplicate listener/animation warning。

- [ ] **Step 5: 请求独立审查并执行修复循环**

分别请求：

- 代码审查：生命周期、唯一回调、无玩法变化、fallback、测试质量。
- 视觉审查：商业完成度、标题/门双焦点、按钮层级、底栏可读性、动效克制。

任何 Critical/Important 都必须按 receiving-code-review 验证后修复，重新运行聚焦测试、全量测试、构建和对应复审。Minor 记录但不阻塞，除非它直接违背已批准规格。

- [ ] **Step 6: 最终验证与阶段提交**

Run: `node --test`

Expected: 全部 PASS。

Run: `npm run build`

Expected: PASS，仅允许既有大 chunk warning。

Run: `git diff --check 72c018a..HEAD`

Expected: 无输出。

Run: `git status --short --branch`

Expected: 仅既有未跟踪 `.superpowers/`；不存在 staged、tracked 或额外 untracked 产物。

若修复循环产生尚未提交的代码，按实际范围提交：

```bash
git add src/art/titleScreenView.js src/art/titleBackdrop.js src/scene/menus.js src/ui/theme.js test/title-screen-view.test.js test/title-screen-art.test.js test/menu-art.test.js
git commit -m "fix(ui): complete the title screen visual gate"
```

最终报告必须包含分支、HEAD、提交列表、测试、构建、证据目录、审查结果、剩余 Minor、端口关闭状态，以及“未 merge、未 push”。
