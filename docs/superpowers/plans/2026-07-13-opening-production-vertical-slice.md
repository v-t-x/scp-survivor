# Opening Production Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将标题页、武器选择和开局 60 秒战斗重制为视觉统一、具备真实素材、角色动画和战术 HUD 的成品级竖切片。

**Architecture:** 保留单一 `PrototypeScene`、现有玩法 mixin、physics body 和数据语义；新增独立的 opening art、语义化房间、战术 UI 与角色 presentation 模块。玩法状态经纯展示适配器转换为 UI/动画状态，正式资源由 manifest 加载并由稳定 key 的程序化纹理兜底。

**Tech Stack:** Phaser 3.90、Vite 7、JavaScript ES Modules、Node `node:test`、PNG/spritesheet、Browser smoke。

## Global Constraints

- 仅在 `feature/ui-art-overhaul` 与 `C:\scp-survivor-ui-art` 工作。
- 世界表现采用精细像素 2D 俯视角；禁止 3D、等距 3D、Q 版和写实高清角色。
- UI 使用高清战术界面；游戏世界保持 nearest-filtered 精细像素风。
- 不改变伤害、AI、刷怪、碰撞、升级概率、六分钟时间线、胜负、存档和武器 ID。
- 不更改 Scene 启动、restart、SHUTDOWN、DESTROY、Preload/manifest/fallback、AudioManager 或 UIManager 公共合同。
- 地图物件必须有语义和依附关系；不得随机散布门、控制台、通风口或污染贴图。
- 所有正式素材必须更新 `docs/art/asset-register.md`，记录生成工具、原始 prompt、人工处理、权利基础和商业使用状态。
- 每项任务先完成 RED，再实现 GREEN；任务结束后独立审查，修复所有 Critical/Important。
- 未经用户明确授权不得 merge、push、删除分支/worktree 或重写历史。

---

## File Structure

### New modules

- `src/art/openingVisualContract.js`：开局屏幕、素材尺寸、房间语义与 HUD 区域的纯数据合同。
- `src/ui/tacticalUi.js`：可复用终端按钮、面板、标签和状态灯组件。
- `src/art/titleBackdrop.js`：标题页场景背景和轻量警报动效。
- `src/art/weaponSelectionView.js`：军械槽视觉、武器状态和选中反馈。
- `src/art/openingFacilityLayout.js`：语义化维护大厅布局与空间关系验证数据。
- `src/art/characterPresentation.js`：spritesheet 动画注册、朝向映射和纯显示状态同步。
- `src/ui/hudPresentation.js`：玩法状态到 HUD 文案、颜色、进度和可见性的纯转换。

### Existing modules to modify

- `src/ui/theme.js`：扩展终端、军械、HUD 和警报 token。
- `src/assets/manifest.js`：新增菜单、设施模块和 spritesheet key。
- `src/assets/fallbackTextureFactory.js`：为所有新增 key 提供 existence-guarded fallback。
- `src/scenes/PreloadScene.js`：加载后注册可用 spritesheet 动画。
- `src/scene/menus.js`：消费标题页与军械界面组件，保留原点击和清理流程。
- `src/art/facilityRoom.js`：按语义布局渲染设施，不再维护无含义坐标数组。
- `src/scene/world.js`：创建支持动画的 player sprite，保持 body 合同。
- `src/scene/enemies.js`：创建支持动画的敌人 sprite，保持 AI 与 body 合同。
- `src/main.js`：在现有 update 中调用 presentation 同步，不改变更新顺序和玩法状态。
- `src/scene/hud.js`：创建分区 HUD 并消费纯展示状态。
- `src/scene/timeline.js`、`src/scene/systems.js`：保持设施警报展开和清理一致。
- `docs/art/asset-register.md`：登记全部新增/修改素材。

### New tests

- `test/opening-visual-contract.test.js`
- `test/tactical-ui.test.js`
- `test/title-screen-art.test.js`
- `test/weapon-selection-view.test.js`
- `test/opening-facility-layout.test.js`
- `test/character-presentation.test.js`
- `test/hud-presentation.test.js`

---

### Task 1: Lock the opening visual contract

**Files:**
- Create: `src/art/openingVisualContract.js`
- Create: `test/opening-visual-contract.test.js`
- Modify: `docs/art/asset-register.md`

**Interfaces:**
- Produces: `OPENING_VIEWPORT`, `OPENING_ASSET_SPECS`, `HUD_REGIONS`, `OPENING_FACILITY_ZONES`.
- Consumes: `GAME_WIDTH = 960`, `GAME_HEIGHT = 540`, `WORLD_WIDTH = 1920`, `WORLD_HEIGHT = 1920`.

- [ ] **Step 1: Write the failing contract test**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  OPENING_VIEWPORT,
  OPENING_ASSET_SPECS,
  HUD_REGIONS,
  OPENING_FACILITY_ZONES
} from "../src/art/openingVisualContract.js";

test("opening visual contract fixes the approved production dimensions", () => {
  assert.deepEqual(OPENING_VIEWPORT, { width: 960, height: 540 });
  assert.deepEqual(OPENING_ASSET_SPECS.player, {
    frameWidth: 48,
    frameHeight: 48,
    directions: 4,
    idleFrames: 4,
    moveFrames: 6,
    hitFrames: 2
  });
  assert.deepEqual(OPENING_ASSET_SPECS.weaponIllustration, { width: 96, height: 96 });
  assert.equal(HUD_REGIONS.mission.anchor, "top-left");
  assert.equal(HUD_REGIONS.vitals.anchor, "bottom-left");
  assert.equal(HUD_REGIONS.weapon.anchor, "bottom-right");
  assert.equal(HUD_REGIONS.facility.anchor, "top-center");
  assert.deepEqual(Object.keys(OPENING_FACILITY_ZONES), [
    "entry",
    "observation",
    "maintenance",
    "contamination"
  ]);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test test/opening-visual-contract.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `openingVisualContract.js`.

- [ ] **Step 3: Implement the immutable contract**

```js
export const OPENING_VIEWPORT = Object.freeze({ width: 960, height: 540 });

export const OPENING_ASSET_SPECS = Object.freeze({
  floorTile: Object.freeze({ width: 32, height: 32 }),
  facilityModule: Object.freeze({ allowedSizes: [64, 96] }),
  player: Object.freeze({
    frameWidth: 48,
    frameHeight: 48,
    directions: 4,
    idleFrames: 4,
    moveFrames: 6,
    hitFrames: 2
  }),
  ordinaryEnemy: Object.freeze({
    frameWidth: 48,
    frameHeight: 48,
    directions: 4,
    idleFrames: 4,
    moveFrames: 6,
    hitFrames: 2
  }),
  weaponIllustration: Object.freeze({ width: 96, height: 96 }),
  statusIcon: Object.freeze({ allowedSizes: [24, 32] })
});

export const HUD_REGIONS = Object.freeze({
  mission: Object.freeze({ anchor: "top-left", x: 16, y: 16, width: 292, height: 92 }),
  vitals: Object.freeze({ anchor: "bottom-left", x: 16, y: 462, width: 268, height: 62 }),
  weapon: Object.freeze({ anchor: "bottom-right", x: 676, y: 446, width: 268, height: 78 }),
  facility: Object.freeze({ anchor: "top-center", x: 320, y: 12, width: 320, height: 48 })
});

export const OPENING_FACILITY_ZONES = Object.freeze({
  entry: Object.freeze({ role: "room-entry" }),
  observation: Object.freeze({ role: "containment-observation" }),
  maintenance: Object.freeze({ role: "door-and-power-control" }),
  contamination: Object.freeze({ role: "incident-trail" })
});
```

- [ ] **Step 4: Add planned asset-register rows**

Add rows with status `计划中 / 未准入` for:

- `title-facility-backdrop`
- `armory-rack-backdrop`
- `facility-service-floor`
- `facility-hazard-stripe`
- `facility-observation-window`
- `facility-pipe-bank`
- `player-opening-sheet`
- `infected-opening-sheet`
- `infected-opening-sheet`（`elapsedSurvivalMs < 60000` 时唯一权重大于 0 的普通敌人）
- three 96×96 weapon illustrations

Leave tool, date, prompt, edits and rights fields explicitly blank until the exact asset exists.

- [ ] **Step 5: Verify GREEN**

Run: `node --test test/opening-visual-contract.test.js`

Expected: 1 test, 1 pass, 0 fail.

- [ ] **Step 6: Commit**

```bash
git add src/art/openingVisualContract.js test/opening-visual-contract.test.js docs/art/asset-register.md
git commit -m "test(art): lock opening production contract"
```

---

### Task 2: Build reusable Foundation tactical UI primitives

**Files:**
- Create: `src/ui/tacticalUi.js`
- Create: `test/tactical-ui.test.js`
- Modify: `src/ui/theme.js`

**Interfaces:**
- Produces: `getTerminalButtonPalette(state)`, `createTerminalButton(scene, options)`, `createTacticalPanel(scene, options)`, `createStatusLamp(scene, options)`.
- Button return type: `{ objects, hitArea, label, signal, setState(nextState), destroy() }`.

- [ ] **Step 1: Write failing state tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { getTerminalButtonPalette } from "../src/ui/tacticalUi.js";

test("terminal button states are visibly distinct", () => {
  const disabled = getTerminalButtonPalette("disabled");
  const idle = getTerminalButtonPalette("idle");
  const hover = getTerminalButtonPalette("hover");
  const armed = getTerminalButtonPalette("armed");
  assert.notDeepEqual(idle, hover);
  assert.notDeepEqual(hover, armed);
  assert.equal(disabled.interactive, false);
  assert.equal(idle.interactive, true);
  assert.equal(armed.signal, "contained");
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/tactical-ui.test.js`

Expected: FAIL because `src/ui/tacticalUi.js` does not exist.

- [ ] **Step 3: Extend Theme tokens**

Add exact groups to `THEME`:

```js
terminal: {
  panelFill: 0x0b1119,
  panelRaised: 0x141f2c,
  frame: 0x53677d,
  frameFocus: 0x8da6c2,
  scanline: 0x9db7c9,
  contained: 0x6fd6b4,
  warning: 0xd2a34b,
  danger: 0xb9474f,
  disabled: 0x48525d
},
layout: {
  cornerCut: 8,
  panelPadding: 12,
  buttonHeight: 56,
  labelGap: 8
}
```

- [ ] **Step 4: Implement pure palettes and Phaser builders**

`getTerminalButtonPalette` must return frozen values for `disabled`, `idle`, `hover`, `pressed`, and `armed`. `createTerminalButton` must create one `Graphics` frame, one invisible rectangle hit area, one label, and one status signal; all objects use the supplied depth and scroll factor. Pointer handlers call `setState` and `onActivate` only when enabled.

```js
export function getTerminalButtonPalette(state) {
  const palettes = {
    disabled: { fill: THEME.terminal.panelFill, border: THEME.terminal.disabled, text: THEME.text.muted, signal: "off", interactive: false },
    idle: { fill: THEME.terminal.panelRaised, border: THEME.terminal.frame, text: THEME.text.primary, signal: "standby", interactive: true },
    hover: { fill: 0x1b2a38, border: THEME.terminal.frameFocus, text: THEME.text.onButton, signal: "standby", interactive: true },
    pressed: { fill: 0x243747, border: THEME.terminal.warning, text: THEME.text.onButton, signal: "warning", interactive: true },
    armed: { fill: 0x163229, border: THEME.terminal.contained, text: THEME.text.onButton, signal: "contained", interactive: true }
  };
  return Object.freeze({ ...palettes[state] });
}
```

The frame must be drawn with clipped corners rather than `fillRoundedRect`, so it cannot resemble the old web-card language.

- [ ] **Step 5: Verify component contracts**

Run: `node --test test/tactical-ui.test.js`

Expected: all tests pass and each button state has a distinct fill/border/signal tuple.

- [ ] **Step 6: Run full tests and commit**

```bash
node --test
git add src/ui/theme.js src/ui/tacticalUi.js test/tactical-ui.test.js
git commit -m "feat(ui): add Foundation tactical controls"
```

---

### Task 3: Replace the title screen with a facility security terminal

**Files:**
- Create: `public/assets/art/menus/title-facility-backdrop.png`
- Create: `src/art/titleBackdrop.js`
- Create: `test/title-screen-art.test.js`
- Modify: `src/assets/manifest.js`
- Modify: `src/assets/fallbackTextureFactory.js`
- Modify: `src/scene/menus.js`
- Modify: `docs/art/asset-register.md`

**Interfaces:**
- Produces: `TEXTURES.titleFacilityBackdrop`, `createTitleBackdrop(scene, targetArray, depth)` returning `{ objects, stop() }`.
- Consumes: `createTerminalButton` and existing `beginFromStartScreen()`.

- [ ] **Step 1: Write failing title-screen tests**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { IMAGE_ASSETS, TEXTURES } from "../src/assets/manifest.js";

test("title screen declares a dedicated production backdrop", () => {
  assert.equal(TEXTURES.titleFacilityBackdrop, "title-facility-backdrop");
  assert.ok(IMAGE_ASSETS.some((asset) =>
    asset.key === TEXTURES.titleFacilityBackdrop
    && asset.path === "assets/art/menus/title-facility-backdrop.png"
  ));
});

test("title screen uses the tactical terminal instead of a rectangle button", async () => {
  const source = await readFile(new URL("../src/scene/menus.js", import.meta.url), "utf8");
  const method = source.slice(source.indexOf("createStartScreen()"), source.indexOf("beginFromStartScreen()"));
  assert.match(method, /createTitleBackdrop/);
  assert.match(method, /createTerminalButton/);
  assert.doesNotMatch(method, /startButton\s*=\s*this\.add\.rectangle/);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/title-screen-art.test.js`

Expected: FAIL because the backdrop key and module do not exist.

- [ ] **Step 3: Generate the title backdrop using imagegen**

Use the `imagegen` skill with this exact art brief:

```text
960x540 orthographic 2D pixel-art game background, Foundation containment facility security checkpoint during an early containment breach. Left 44 percent intentionally low-detail and dark for title/UI readability. Right side has a coherent wall-connected half-open blast door, observation monitor bank, conduit pipes and red rotating warning lamp. Top-down/near-orthographic 2D only, no 3D render, no isometric camera, no characters, no text, no logos, no UI, no loose floating props. Steel blue and graphite base, restrained amber and deep red signals, hard pixel edges, detailed but controlled 32-pixel module language.
```

Post-process only to exact 960×540 8-bit RGBA and limited palette without changing composition. Save to the declared path. Record the actual tool/model, date, exact prompt, post-processing and rights status in the asset register.

- [ ] **Step 4: Add manifest and fallback**

Add `titleFacilityBackdrop` to `TEXTURES`, add the exact `IMAGE_ASSETS` path, and generate an existence-guarded 960×540 fallback composed from facility floor, wall, door and console colors. The fallback must not overwrite the real asset.

- [ ] **Step 5: Implement `createTitleBackdrop`**

Create a screen-fixed background image, dark left-side readability scrim, right-side red lamp glow and subtle scanline overlay. Return every object, push it into `targetArray`, and own one low-frequency tween:

```js
export function createTitleBackdrop(scene, targetArray, depth) {
  const background = scene.add.image(480, 270, TEXTURES.titleFacilityBackdrop).setDepth(depth);
  const scrim = scene.add.rectangle(220, 270, 440, 540, 0x03070c, 0.72).setDepth(depth + 1);
  const lamp = scene.add.circle(804, 112, 42, THEME.terminal.danger, 0.14).setDepth(depth + 2);
  const scanline = scene.add.rectangle(220, 0, 440, 2, THEME.terminal.scanline, 0.08).setDepth(depth + 2);
  const objects = [background, scrim, lamp, scanline];
  for (const object of objects) {
    object.setScrollFactor(0);
    targetArray.push(object);
  }
  const tween = scene.tweens.add({
    targets: [lamp, scanline],
    alpha: { from: 0.06, to: 0.18 },
    yoyo: true,
    repeat: -1,
    duration: 1100
  });
  return { objects, stop: () => tween.stop() };
}
```

`createStartScreen()` stores the return value as `this.titleBackdropController`; `destroyStartScreen()` calls `this.titleBackdropController?.stop()` before destroying `startScreenObjects`, then sets the controller to `null`.

- [ ] **Step 6: Rebuild `createStartScreen()`**

Use a left-aligned information column and terminal control:

- title at `(72, 116)` with origin `(0, 0.5)`;
- facility code and alert level above title;
- one-sentence objective below title;
- terminal button centered at `(230, 352)`, size `316×60`, label `开始行动`;
- status lamps and credits below the terminal;
- preserve `startScreenObjects`, scroll factor, `beginFromStartScreen()` and destruction behavior.

- [ ] **Step 7: Verify title screen**

Run:

```bash
node --test test/title-screen-art.test.js test/art-assets.test.js test/menu-art.test.js
npm run build
```

Expected: all tests pass; build succeeds; title screenshot differs in composition and control shape from `static-gate-v3/title.png`.

- [ ] **Step 8: Commit**

```bash
git add public/assets/art/menus/title-facility-backdrop.png src/art/titleBackdrop.js src/assets/manifest.js src/assets/fallbackTextureFactory.js src/scene/menus.js docs/art/asset-register.md test/title-screen-art.test.js
git commit -m "feat(ui): rebuild the facility title terminal"
```

---

### Task 4: Replace weapon cards with an armory loadout screen

**Files:**
- Create: `public/assets/art/menus/armory-rack-backdrop.png`
- Replace: `public/assets/art/weapons/pistol.png`
- Replace: `public/assets/art/weapons/breacher.png`
- Replace: `public/assets/art/weapons/tesla.png`
- Create: `src/art/weaponSelectionView.js`
- Create: `test/weapon-selection-view.test.js`
- Modify: `src/assets/manifest.js`
- Modify: `src/assets/fallbackTextureFactory.js`
- Modify: `src/scene/menus.js`
- Modify: `docs/art/asset-register.md`

**Interfaces:**
- Produces: `TEXTURES.armoryRackBackdrop`, `getWeaponSlotVisualState({ selected, hovered })`, `createArmorySlot(scene, options)`.
- Consumes: existing weapon IDs `pistol`, `shotgun`, `tesla`; existing `pendingSelectedWeaponId`; `createTerminalButton`.

- [ ] **Step 1: Write failing armory tests**

Test exact manifest paths, 96×96 weapon dimensions, removal of `fillRoundedRect` from weapon-card rendering, and pure states:

```js
assert.deepEqual(getWeaponSlotVisualState({ selected: false, hovered: false }), {
  frame: "idle",
  lamp: "standby",
  selectedLabelVisible: false
});
assert.equal(getWeaponSlotVisualState({ selected: true, hovered: false }).frame, "locked");
assert.equal(getWeaponSlotVisualState({ selected: false, hovered: true }).frame, "inspect");
```

- [ ] **Step 2: Verify RED**

Run: `node --test test/weapon-selection-view.test.js`

Expected: FAIL because `weaponSelectionView.js` and armory assets do not exist.

- [ ] **Step 3: Generate the armory background and weapon illustrations**

Armory prompt:

```text
960x540 orthographic 2D pixel-art Foundation armory wall, three coherent illuminated equipment bays connected by one metal rack structure, central bay emphasized but empty, cables and status lamps attached to the rack, no weapons, no text, no UI, no characters, no 3D render, no isometric perspective. Dark graphite and steel blue, controlled amber and cyan signals, hard pixel edges, readable under a high-definition tactical overlay.
```

Weapon prompt template, run separately for each weapon:

```text
96x96 transparent-background detailed pixel-art orthographic equipment illustration of [Foundation duty pistol / containment breacher shotgun / compact Tesla projector]. Side-three-quarter technical inventory view, mechanically plausible silhouette, steel graphite body, restrained Foundation blue-grey accents, no hands, no text, no glow outside the 96x96 frame, no 3D render, no isometric environment.
```

Validate exact dimensions, binary alpha for weapons, controlled palette and no embedded text. Update the asset register with real prompts and edits.

- [ ] **Step 4: Implement armory slots**

Each slot is a narrow equipment bay rather than a card. It contains the 96×96 weapon image, one tactical-role line, at most three compact stat rows, a status lamp and a full-height hit area. `createArmorySlot` returns `setState`, and does not own selection state.

```js
export function getWeaponSlotVisualState({ selected, hovered }) {
  if (selected) {
    return Object.freeze({ frame: "locked", lamp: "contained", selectedLabelVisible: true });
  }
  if (hovered) {
    return Object.freeze({ frame: "inspect", lamp: "warning", selectedLabelVisible: false });
  }
  return Object.freeze({ frame: "idle", lamp: "standby", selectedLabelVisible: false });
}

export function createArmorySlot(scene, options) {
  const { x, y, width, height, textureKey, name, role, stats, depth, onActivate } = options;
  const frame = scene.add.graphics().setDepth(depth);
  const icon = scene.add.image(x, y - 76, textureKey).setDisplaySize(96, 96).setDepth(depth + 1);
  const nameText = scene.add.text(x, y - 6, name, options.nameStyle).setOrigin(0.5).setDepth(depth + 1);
  const roleText = scene.add.text(x, y + 28, role, options.roleStyle).setOrigin(0.5).setDepth(depth + 1);
  const statsText = scene.add.text(x, y + 82, stats.map(({ label, value }) => `${label}  ${value}`).join("\n"), options.statsStyle).setOrigin(0.5).setDepth(depth + 1);
  const lamp = scene.add.circle(x, y - height / 2 + 18, 4, THEME.terminal.disabled, 1).setDepth(depth + 2);
  const lockedLabel = scene.add.text(x, y + height / 2 - 22, "装备锁定", options.lockedStyle).setOrigin(0.5).setDepth(depth + 2);
  const hitArea = scene.add.rectangle(x, y, width, height, 0xffffff, 0.001).setDepth(depth + 3).setInteractive({ useHandCursor: true });
  hitArea.on("pointerdown", onActivate);
  function setState(next) {
    const state = getWeaponSlotVisualState(next);
    drawArmoryFrame(frame, { x, y, width, height, frame: state.frame });
    lamp.setFillStyle(getLampColor(state.lamp), 1);
    lockedLabel.setVisible(state.selectedLabelVisible);
  }
  return {
    objects: [frame, icon, nameText, roleText, statsText, lamp, lockedLabel, hitArea],
    hitArea,
    setState
  };
}
```

`drawArmoryFrame` and `getLampColor` are private functions in the same file; frame variants use straight industrial rails and clipped corners, never rounded cards.

- [ ] **Step 5: Integrate without changing selection semantics**

Keep the current pointer callbacks and `pendingSelectedWeaponId`. Replace `refreshWeaponSelectionVisuals()` drawing with `slot.setState({ selected, hovered })`. The confirm control uses terminal states `disabled`, `idle`, `hover`, and `armed`. Preserve perk-store entry and credits.

- [ ] **Step 6: Verify**

Run:

```bash
node --test test/weapon-selection-view.test.js test/menu-art.test.js test/art-assets.test.js
npm run build
```

Expected: all tests pass; weapon selection screenshot has one coherent rack and no three large rounded cards.

- [ ] **Step 7: Commit**

```bash
git add public/assets/art/menus/armory-rack-backdrop.png public/assets/art/weapons src/art/weaponSelectionView.js src/assets/manifest.js src/assets/fallbackTextureFactory.js src/scene/menus.js docs/art/asset-register.md test/weapon-selection-view.test.js
git commit -m "feat(ui): build the Foundation armory loadout"
```

---

### Task 5: Build a semantic containment maintenance hall

**Files:**
- Create: `public/assets/art/facility/service-floor.png`
- Create: `public/assets/art/facility/hazard-stripe.png`
- Create: `public/assets/art/facility/observation-window.png`
- Create: `public/assets/art/facility/pipe-bank.png`
- Create: `src/art/openingFacilityLayout.js`
- Create: `test/opening-facility-layout.test.js`
- Modify: `src/art/facilityRoom.js`
- Modify: `src/assets/manifest.js`
- Modify: `src/assets/fallbackTextureFactory.js`
- Modify: `docs/art/asset-register.md`

**Interfaces:**
- Produces: `createOpeningFacilityLayout(width, height)`, where each entry is `{ id, parentId, zone, role, key, x, y, depth, rotation, scaleX, scaleY }`.
- Produces: `validateOpeningFacilityRelationships(layout)` returning an array of violation codes.
- Consumes: `OPENING_FACILITY_ZONES` and stable texture keys.

- [ ] **Step 1: Write failing semantic-layout tests**

Tests must assert:

- unique `id` for every object;
- every object has a known `zone` and `role`;
- every door is within 72px of a wall segment;
- every console is in `maintenance` or `observation` and within 128px of its assigned door/window;
- every vent or pipe has a wall/maintenance parent relation;
- contamination objects form one incident trail rather than uniform scatter;
- full texture bounds stay outside the center 260px safe radius;
- the initial 960×540 camera sees an entry, a wall relationship and a functional equipment zone.

- [ ] **Step 2: Verify RED**

Run: `node --test test/opening-facility-layout.test.js`

Expected: FAIL because the semantic layout module does not exist.

- [ ] **Step 3: Generate four modular facility assets**

Use separate imagegen prompts with strict orthographic 2D pixel art and no text. `service-floor` and `hazard-stripe` are opaque 32×32 seamless tiles; `observation-window` and `pipe-bank` are transparent-background 96×64 modules. Record all source and rights data.

- [ ] **Step 4: Implement a coherent room graph**

Define the initial hall around world center `(960, 960)`:

- entry wall and blast door along the top-left boundary of the initial camera;
- observation window bank along the top-right boundary;
- maintenance console and pipe bank along the right boundary;
- contamination trail entering from the bottom-right and stopping outside the safe radius;
- service-floor lane connecting entry and maintenance zones;
- open center with no structure or decal texture bounds inside radius 260.

All entries remain display-only; no physics APIs are permitted in this module.

The first implementation uses this exact semantic graph; later art iteration may move nodes only while preserving tests:

```js
export function createOpeningFacilityLayout(width, height) {
  const cx = width / 2;
  const cy = height / 2;
  return [
    { id: "entry-wall-left", parentId: null, zone: "entry", role: "wall", key: TEXTURES.facilityWall, x: cx - 320, y: cy - 224, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "entry-door", parentId: "entry-wall-left", zone: "entry", role: "door", key: TEXTURES.facilityDoor, x: cx - 256, y: cy - 224, depth: -8, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "entry-wall-right", parentId: "entry-door", zone: "entry", role: "wall", key: TEXTURES.facilityWall, x: cx - 224, y: cy - 224, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "observation-window", parentId: "observation-wall", zone: "observation", role: "window", key: TEXTURES.facilityObservationWindow, x: cx + 256, y: cy - 224, depth: -9, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "observation-wall", parentId: null, zone: "observation", role: "wall", key: TEXTURES.facilityWall, x: cx + 352, y: cy - 224, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "maintenance-console", parentId: "observation-window", zone: "maintenance", role: "console", key: TEXTURES.facilityConsole, x: cx + 320, y: cy - 128, depth: -8, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "maintenance-pipes", parentId: "observation-wall", zone: "maintenance", role: "pipe", key: TEXTURES.facilityPipeBank, x: cx + 416, y: cy - 64, depth: -9, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "lower-vent", parentId: "lower-wall", zone: "maintenance", role: "vent", key: TEXTURES.facilityVent, x: cx - 320, y: cy + 192, depth: -9, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "lower-wall", parentId: null, zone: "maintenance", role: "wall", key: TEXTURES.facilityWall, x: cx - 384, y: cy + 192, depth: -10, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "incident-origin", parentId: null, zone: "contamination", role: "incident-origin", key: TEXTURES.facilityDecal, x: cx + 352, y: cy + 208, depth: -7, rotation: 0, scaleX: 1, scaleY: 1 },
    { id: "incident-trail-a", parentId: "incident-origin", zone: "contamination", role: "incident-trail", key: TEXTURES.facilityDecal, x: cx + 304, y: cy + 176, depth: -7, rotation: 0.35, scaleX: 0.8, scaleY: 0.8 },
    { id: "incident-trail-b", parentId: "incident-trail-a", zone: "contamination", role: "incident-trail", key: TEXTURES.facilityDecal, x: cx + 272, y: cy + 152, depth: -7, rotation: -0.2, scaleX: 0.65, scaleY: 0.65 }
  ];
}
```

- [ ] **Step 5: Replace coordinate scattering in `facilityRoom.js`**

Render base floor, service-floor tile strips and semantic objects. Store semantic metadata on created objects with `setData("facilityRole", role)` and `setData("facilityZone", zone)` for debugging and smoke inspection. Keep `facilityVisuals` as the complete cleanup/tint list.

- [ ] **Step 6: Verify**

Run:

```bash
node --test test/opening-facility-layout.test.js test/facility-room.test.js test/presentation-rules.test.js
npm run build
```

Expected: all tests pass; the normal combat screenshot shows a coherent room boundary, entry and equipment zone without meaningless scattered props.

- [ ] **Step 7: Commit**

```bash
git add public/assets/art/facility src/art/openingFacilityLayout.js src/art/facilityRoom.js src/assets/manifest.js src/assets/fallbackTextureFactory.js docs/art/asset-register.md test/opening-facility-layout.test.js test/facility-room.test.js
git commit -m "feat(art): compose the opening containment hall"
```

---

### Task 6: Animate the player and opening enemies without changing physics

**Files:**
- Create: `public/assets/art/characters/player-opening-sheet.png`
- Create: `public/assets/art/characters/infected-opening-sheet.png`
- Create: `src/art/characterPresentation.js`
- Create: `test/character-presentation.test.js`
- Modify: `src/assets/manifest.js`
- Modify: `src/assets/fallbackTextureFactory.js`
- Modify: `src/scenes/PreloadScene.js`
- Modify: `src/scene/world.js`
- Modify: `src/scene/enemies.js`
- Modify: `src/main.js`
- Modify: `docs/art/asset-register.md`

**Interfaces:**
- Produces: `CHARACTER_SHEETS`, `registerOpeningCharacterAnimations(scene)`, `resolveCharacterTexture(scene, kind, fallbackKey)`, `getFacingFromVector(x, y, previousFacing)`, `getCharacterAnimationKey({ kind, motion, facing, hit })`, `syncCharacterPresentation(scene)`.
- Consumes: existing body setup, velocity, `enemyType`, `isDying`, invulnerability and hit state.

- [ ] **Step 1: Inventory opening enemies and write failing tests**

Lock the opening enemy list to `Object.freeze(["infectedStaff"])`. The current director assigns `{ infectedStaff: 1, crawler: 0, drone: 0 }` while `elapsedSurvivalMs < 60000`; do not animate crawler, drone or elites in this task.

Test direction mapping:

```js
assert.equal(getFacingFromVector(1, 0, "down"), "right");
assert.equal(getFacingFromVector(-1, 0, "down"), "left");
assert.equal(getFacingFromVector(0, -1, "down"), "up");
assert.equal(getFacingFromVector(0, 0, "left"), "left");
```

Test animation mapping for idle, move and hit, and assert the source code retains the existing player `24×24` body and each enemy config body call.

- [ ] **Step 2: Verify RED**

Run: `node --test test/character-presentation.test.js`

Expected: FAIL because `characterPresentation.js` does not exist.

- [ ] **Step 3: Generate exact spritesheets**

For each character, use imagegen to create a clean frame reference, then assemble an exact spritesheet with nearest-neighbor tooling. Layout is four direction rows in order `down,left,right,up`; columns contain idle frames 0–3, move frames 4–9 and hit frames 10–11. Every frame is 48×48, transparent RGBA, aligned feet anchor and consistent silhouette.

Player prompt base:

```text
top-down orthographic detailed pixel-art Foundation tactical survivor, dark navy protective suit, compact chest rig, pale shoulder insignia without readable text, clearly visible held weapon direction, adult realistic proportions, no chibi, no 3D render, transparent background, consistent 48x48 game-sprite silhouette
```

Infected prompt base:

```text
top-down orthographic detailed pixel-art infected Foundation maintenance staff, torn grey-blue work uniform, asymmetric diseased posture, readable head and arms, restrained dark blood, adult realistic proportions, no chibi, no 3D render, transparent background, consistent 48x48 game-sprite silhouette
```

Record every exact prompt and assembly edit in the asset register.

- [ ] **Step 4: Add sheet manifest and safe registration**

Declare separate sheet keys such as `playerOpeningSheet` and `infectedOpeningSheet` in `SPRITESHEET_ASSETS` with `{ frameWidth: 48, frameHeight: 48 }`. `registerOpeningCharacterAnimations` checks texture existence and frame count before creating animation keys. If a sheet is missing or incomplete, keep the existing static texture and log at most one warning per key.

```js
export const CHARACTER_SHEETS = Object.freeze({
  player: Object.freeze({ sheetKey: TEXTURES.playerOpeningSheet, fallbackKey: TEXTURES.player }),
  infectedStaff: Object.freeze({ sheetKey: TEXTURES.infectedOpeningSheet, fallbackKey: TEXTURES.enemyInfected })
});

const DIRECTIONS = Object.freeze(["down", "left", "right", "up"]);
const MOTIONS = Object.freeze({
  idle: Object.freeze({ start: 0, end: 3, frameRate: 4 }),
  move: Object.freeze({ start: 4, end: 9, frameRate: 8 }),
  hit: Object.freeze({ start: 10, end: 11, frameRate: 10 })
});

export function resolveCharacterTexture(scene, kind, fallbackKey) {
  const config = CHARACTER_SHEETS[kind];
  if (!config || !scene.textures.exists(config.sheetKey)) {
    return fallbackKey;
  }
  return scene.textures.get(config.sheetKey).frameTotal >= 48
    ? config.sheetKey
    : fallbackKey;
}

export function registerOpeningCharacterAnimations(scene) {
  for (const [kind, config] of Object.entries(CHARACTER_SHEETS)) {
    if (resolveCharacterTexture(scene, kind, config.fallbackKey) !== config.sheetKey) {
      continue;
    }
    DIRECTIONS.forEach((facing, row) => {
      for (const [motion, range] of Object.entries(MOTIONS)) {
        const key = `${kind}-${motion}-${facing}`;
        if (!scene.anims.exists(key)) {
          scene.anims.create({
            key,
            frames: scene.anims.generateFrameNumbers(config.sheetKey, {
              start: row * 12 + range.start,
              end: row * 12 + range.end
            }),
            frameRate: range.frameRate,
            repeat: motion === "hit" ? 0 : -1
          });
        }
      }
    });
  }
}
```

- [ ] **Step 5: Use Arcade Sprites without changing body geometry**

Change player creation from `physics.add.image` to `physics.add.sprite`, then execute the existing `setCollideWorldBounds`, `body.setSize(24, 24)` and display-scale preservation in the same order. Configure `this.enemies` with `classType: Phaser.Physics.Arcade.Sprite`; static later-wave texture keys remain valid on Sprite instances.

```js
const playerTexture = resolveCharacterTexture(this, "player", TEXTURES.player);
this.player = this.physics.add.sprite(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, playerTexture);
this.player.setCollideWorldBounds(true);
this.player.body.setSize(24, 24);
applyDisplayScalePreservingBody(this.player, CHARACTER_DISPLAY_SCALE.player);

this.enemies = this.physics.add.group({ classType: Phaser.Physics.Arcade.Sprite });
```

At each ordinary enemy creation call, use:

```js
const textureKey = resolveCharacterTexture(this, type, config.textureKey);
const enemy = this.enemies.create(spawnX, spawnY, textureKey);
```

Boss and elite creation continue using their existing static texture keys in this phase.

- [ ] **Step 6: Sync display state after gameplay updates**

At the end of the active, non-paused gameplay update section, call `syncCharacterPresentation(this)`. It may read velocity, facing, enemy type and hit flags, and may call `play`, `setFlipX` or set frame. It may not set velocity, body size, AI state, health or timers.

```js
export function getFacingFromVector(x, y, previousFacing = "down") {
  if (x === 0 && y === 0) return previousFacing;
  if (Math.abs(x) >= Math.abs(y)) return x < 0 ? "left" : "right";
  return y < 0 ? "up" : "down";
}

export function getCharacterAnimationKey({ kind, motion, facing, hit }) {
  return `${kind}-${hit ? "hit" : motion}-${facing}`;
}

function syncSprite(sprite, kind) {
  if (!sprite?.active || !CHARACTER_SHEETS[kind] || sprite.texture.key !== CHARACTER_SHEETS[kind].sheetKey) {
    return;
  }
  sprite.presentationFacing = getFacingFromVector(
    sprite.body.velocity.x,
    sprite.body.velocity.y,
    sprite.presentationFacing
  );
  const moving = sprite.body.velocity.lengthSq() > 1;
  const key = getCharacterAnimationKey({
    kind,
    motion: moving ? "move" : "idle",
    facing: sprite.presentationFacing,
    hit: (sprite.presentationHitUntilMs ?? 0) > sprite.scene.elapsedSurvivalMs
  });
  if (sprite.anims.currentAnim?.key !== key) sprite.play(key, true);
}

export function syncCharacterPresentation(scene) {
  syncSprite(scene.player, "player");
  for (const enemy of scene.enemies.getChildren()) {
    syncSprite(enemy, enemy.enemyType);
  }
}
```

Existing hit handlers set only `presentationHitUntilMs = elapsedSurvivalMs + 120` in addition to their current behavior; this field has no gameplay consumer.

- [ ] **Step 7: Verify physics invariance and lifecycle**

Run:

```bash
node --test test/character-presentation.test.js test/presentation-rules.test.js test/enemy-replication.test.js
node --test
npm run build
```

Browser smoke must compare player/enemy body debug values before and after animation registration using a temporary read-only debug probe, then remove the probe before commit. Pause, failure and restart must not leave animation listeners or duplicate animation warnings.

- [ ] **Step 8: Commit**

```bash
git add public/assets/art/characters src/art/characterPresentation.js src/assets/manifest.js src/assets/fallbackTextureFactory.js src/scenes/PreloadScene.js src/scene/world.js src/scene/enemies.js src/main.js docs/art/asset-register.md test/character-presentation.test.js
git commit -m "feat(art): animate the opening survivor cast"
```

---

### Task 7: Recompose the HUD into tactical information zones

**Files:**
- Create: `src/ui/hudPresentation.js`
- Create: `test/hud-presentation.test.js`
- Modify: `src/scene/hud.js`
- Modify: `src/scene/timeline.js`
- Modify: `src/scene/systems.js`
- Modify: `src/ui/theme.js`

**Interfaces:**
- Produces: `getHudPresentation(state)` returning `{ mission, vitals, weapon, facility }`.
- Consumes: `HUD_REGIONS`, current health/maxHealth, level/xp, kill count, selected weapon state, dash cooldown, phase, active facility event and event banner state.

- [ ] **Step 1: Write failing presentation tests**

```js
const view = getHudPresentation({
  health: 34,
  maxHealth: 100,
  level: 2,
  currentXp: 3,
  xpToNextLevel: 12,
  killCount: 7,
  elapsedSurvivalMs: 22000,
  selectedWeaponId: "pistol",
  weapon: { name: "基金会勤务手枪", level: 1, damage: 20, cooldownMs: 280 },
  dashReadyAtMs: 0,
  phaseLabel: "职员感染",
  nextNodeSeconds: 38,
  activeFacilityEvent: null
});
assert.equal(view.mission.title, "职员感染");
assert.equal(view.mission.detail, "下一节点 38秒");
assert.equal(view.vitals.healthRatio, 0.34);
assert.equal(view.vitals.critical, true);
assert.equal(view.facility.expanded, false);
assert.equal(view.weapon.iconKey, "weapon-pistol-icon");
```

Add cases for shotgun reload, Tesla cooldown, active power outage, Boss phase and no active mission.

- [ ] **Step 2: Verify RED**

Run: `node --test test/hud-presentation.test.js`

Expected: FAIL because `hudPresentation.js` does not exist.

- [ ] **Step 3: Implement pure state conversion**

`getHudPresentation` performs formatting and clamps ratios, but never mutates input. Unknown weapon IDs return a neutral icon and label rather than throwing. Facility state is collapsed when no event is active and expanded with warning/danger color only during real events.

```js
const WEAPON_ICONS = Object.freeze({
  pistol: TEXTURES.weaponPistolIcon,
  shotgun: TEXTURES.weaponBreacherIcon,
  tesla: TEXTURES.weaponTeslaIcon
});

export function getHudPresentation(state) {
  const healthRatio = Math.min(1, Math.max(0, state.maxHealth > 0 ? state.health / state.maxHealth : 0));
  const xpRatio = Math.min(1, Math.max(0, state.xpToNextLevel > 0 ? state.currentXp / state.xpToNextLevel : 0));
  const eventType = state.activeFacilityEvent?.type ?? null;
  const facilityExpanded = eventType !== null || state.bossPhaseActive === true;
  const weaponIcon = WEAPON_ICONS[state.selectedWeaponId] ?? null;
  return Object.freeze({
    mission: Object.freeze({
      title: state.phaseLabel,
      detail: state.bossPhaseActive ? "终局：收容 SCP-049" : `下一节点 ${Math.max(0, Math.ceil(state.nextNodeSeconds))}秒`,
      kills: state.killCount
    }),
    vitals: Object.freeze({
      healthText: `${Math.max(0, Math.floor(state.health))} / ${state.maxHealth}`,
      healthRatio,
      critical: healthRatio < 0.35,
      levelText: `等级 ${state.level}`,
      xpText: `${state.currentXp} / ${state.xpToNextLevel}`,
      xpRatio
    }),
    weapon: Object.freeze({
      iconKey: weaponIcon,
      name: state.weapon?.name ?? "未装备",
      detail: state.weapon?.detail ?? "",
      dashReady: state.dashReadyAtMs <= state.elapsedSurvivalMs
    }),
    facility: Object.freeze({
      expanded: facilityExpanded,
      title: state.bossPhaseActive ? "终局收容" : eventType === "powerOutage" ? "设施断电" : "设施稳定",
      tone: state.bossPhaseActive ? "danger" : eventType ? "warning" : "contained"
    })
  });
}
```

- [ ] **Step 4: Build four HUD containers**

In `createUI`, replace the top-left text stack with:

- `missionHudContainer` at `HUD_REGIONS.mission`;
- `vitalsHudContainer` at `HUD_REGIONS.vitals`;
- `weaponHudContainer` at `HUD_REGIONS.weapon`;
- `facilityHudContainer` at `HUD_REGIONS.facility`.

Use `createTacticalPanel`, compact labels and real weapon icons. Preserve compatibility properties required by existing code, but point them to the new text/progress objects. Keep mute and pause as small top-right controls outside the mission panel.

```js
this.missionHudContainer = this.add.container(HUD_REGIONS.mission.x, HUD_REGIONS.mission.y).setDepth(45).setScrollFactor(0);
this.vitalsHudContainer = this.add.container(HUD_REGIONS.vitals.x, HUD_REGIONS.vitals.y).setDepth(45).setScrollFactor(0);
this.weaponHudContainer = this.add.container(HUD_REGIONS.weapon.x, HUD_REGIONS.weapon.y).setDepth(45).setScrollFactor(0);
this.facilityHudContainer = this.add.container(HUD_REGIONS.facility.x, HUD_REGIONS.facility.y).setDepth(58).setScrollFactor(0);

this.missionPanel = createTacticalPanel(this, { x: 0, y: 0, width: 292, height: 92, originX: 0, originY: 0, depth: 45 });
this.vitalsPanel = createTacticalPanel(this, { x: 0, y: 0, width: 268, height: 62, originX: 0, originY: 0, depth: 45 });
this.weaponPanel = createTacticalPanel(this, { x: 0, y: 0, width: 268, height: 78, originX: 0, originY: 0, depth: 45 });
this.facilityPanel = createTacticalPanel(this, { x: 0, y: 0, width: 320, height: 48, originX: 0, originY: 0, depth: 58 });

this.missionHudContainer.add(this.missionPanel.objects);
this.vitalsHudContainer.add(this.vitalsPanel.objects);
this.weaponHudContainer.add(this.weaponPanel.objects);
this.facilityHudContainer.add(this.facilityPanel.objects);
```

Text, icon and progress objects are created inside the matching container, not at global screen coordinates. Containers are added to `gameplayHudContainers` for shared visibility and teardown.

- [ ] **Step 5: Update and cleanup through one presentation object**

`updateUI()` builds the current state object and applies `getHudPresentation`. `setGameplayHudVisible()` operates on the four containers plus mute/pause/pickup radius. `clearFacilitySystems()` collapses and clears the facility container together with existing banner state.

- [ ] **Step 6: Verify**

Run:

```bash
node --test test/hud-presentation.test.js test/presentation-rules.test.js
node --test
npm run build
```

Browser smoke must show normal, low-health, pause, outage, Boss, failure and restart HUD states with no overlapping text at 960×540.

- [ ] **Step 7: Commit**

```bash
git add src/ui/hudPresentation.js src/scene/hud.js src/scene/timeline.js src/scene/systems.js src/ui/theme.js test/hud-presentation.test.js
git commit -m "feat(ui): compose the tactical combat HUD"
```

---

### Task 8: Run the production visual gate and close the branch review loop

**Files:**
- Modify: `docs/art/asset-register.md` only if verification finds incomplete rows
- Evidence outside repository: `C:\scp-survivor-ui-art-evidence\opening-production-v1\`

**Interfaces:**
- Consumes all previous tasks.
- Produces no gameplay code; produces verification evidence and review findings.

- [ ] **Step 1: Run static verification**

```bash
node --test
npm run build
git diff --check b000ed96f93e604476232966418edc36eba54832..HEAD
git status --short --branch
```

Expected: all tests pass, build exits 0, diff check has no whitespace errors, only the pre-existing large-chunk warning remains.

- [ ] **Step 2: Audit asset registration**

Every new or replaced PNG must have exact path, dimensions, source/tool, date, original prompt, human edits, license/right basis, commercial status and attribution requirement. Any blank field blocks the visual gate unless the row remains explicitly `计划中 / 未准入` and the asset is not in the manifest.

- [ ] **Step 3: Capture 960×540 browser evidence**

Start production preview on fixed port 4173 and save:

- `title.png`
- `weapon-selection-idle.png`
- `weapon-selection-locked.png`
- `combat-normal.png`
- `combat-moving.png`
- `combat-hit.png`
- `pause.png`
- `outage.png`
- `boss-compatibility.png`
- `failure.png`
- `restart.png`

Capture console logs and require 0 error, 0 missing texture, 0 missing animation, 0 duplicate animation and 0 restart-listener warnings.

- [ ] **Step 4: Apply the visual acceptance checklist**

Reject the gate if any statement is false:

- title composition and main control are visibly different from `static-gate-v3/title.png`;
- weapon selection is one coherent armory, not three rounded web cards;
- combat screenshot explains entry, wall relationship, equipment zone and open center without source-code context;
- no prop appears detached from a wall, path, device or incident trail;
- player and opening enemies visibly animate during movement and hit;
- mission, vitals, weapon and facility status occupy separate HUD zones;
- no gameplay values, bodies, collision, timeline or save behavior changed.

- [ ] **Step 5: Request independent code and visual review**

Review the full implementation range against:

- `docs/superpowers/specs/2026-07-13-opening-production-vertical-slice-design.md`
- this plan
- all saved evidence

Fix every Critical and Important finding in one bounded remediation task, rerun static and browser verification, then request a focused re-review.

- [ ] **Step 6: Final local commit if verification changes documentation**

```bash
git add docs/art/asset-register.md
git commit -m "docs(art): finalize opening slice provenance"
```

Skip this commit when the asset register has no verification-time changes. Do not merge or push without explicit user authorization.
