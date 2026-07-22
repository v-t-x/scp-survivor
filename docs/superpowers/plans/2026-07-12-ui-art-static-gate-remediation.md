# UI/Art 静态门禁修复实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复首轮真实 960×540 smoke 暴露的标题原型感、武器几何符号、角色可读性和停电吞没设施/Boss 问题，使静态正式素材门禁可重新验收。

**Architecture:** 设施房间保留其创建对象引用，停电表现通过纯函数合同驱动黑幕强度和设施闪烁，不再依赖已删除的 `arenaGrid`。菜单复用正式设施纹理建立 screen-space 背景，并通过 manifest/fallback 接入三枚正式武器图标；角色只调整 display scale，物理 body 与玩法数值不变。

**Tech Stack:** Phaser 3.90、Vite 7、JavaScript ES Modules、Node `node:test`、OpenAI built-in `image_gen`、PNG 8-bit RGBA 共享有限色板。

## Global Constraints

- 不修改伤害、生命、速度、射程、刷怪、AI、碰撞 body、升级概率、时间线 deadline、胜负或存档。
- 停电最大黑幕 alpha 固定为 `0.82`；设施闪烁由现有 `elapsedSurvivalMs` 驱动，不创建新玩法状态。
- display scale：玩家 `1.2`、感染职员 `1.15`、SCP-049 `1.2`；必须在既有 body 设置之后应用，不能改变 Arcade Physics body。
- 菜单背景只使用已加载设施 key 和无交互装饰；标题、武器选择的现有按钮坐标、hit area 与流程保持。
- 武器图标固定 64×64 RGBA：`weapon-pistol-icon`、`weapon-breacher-icon`、`weapon-tesla-icon`；每图不超过 32 个不透明 RGB 色，alpha 仅 0/255，并有 existence-guarded fallback。
- manifest/Preload 合同、Scene restart、manager API 和 localStorage schema 保持兼容。
- 真实门禁继续使用 960×540 当前 HEAD 截图，不使用 ImageGen 概念图替代。

---

### Task 1: 修复停电设施引用与角色屏幕可读性

**Files:**
- Create: `src/art/presentationRules.js`
- Create: `test/presentation-rules.test.js`
- Modify: `src/art/facilityRoom.js`
- Modify: `src/scene/world.js`
- Modify: `src/scene/enemies.js`
- Modify: `src/scene/timeline.js`

**Interfaces:**
- Produces: `CHARACTER_DISPLAY_SCALE`；`getOutagePresentation(strength, elapsedMs)` 返回 `{ darknessAlpha, facilityAlpha, facilityTint }`。
- Consumes: `createFacilityRoomVisuals()` 的对象数组，以 `this.facilityVisuals` 保存并在 outage/restart 生命周期内由 Scene 自动销毁。

- [ ] **Step 1: 写失败测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CHARACTER_DISPLAY_SCALE, getOutagePresentation } from "../src/art/presentationRules.js";

test("outage preserves facility readability at full strength", () => {
  assert.deepEqual(CHARACTER_DISPLAY_SCALE, { player: 1.2, infectedStaff: 1.15, scp049: 1.2 });
  const state = getOutagePresentation(1, 1000);
  assert.equal(state.darknessAlpha, 0.82);
  assert.ok(state.facilityAlpha >= 0.62 && state.facilityAlpha <= 0.88);
  assert.equal(state.facilityTint, 0x9b3942);
});

test("outage integration no longer depends on removed arenaGrid", async () => {
  const timeline = await readFile(new URL("../src/scene/timeline.js", import.meta.url), "utf8");
  const world = await readFile(new URL("../src/scene/world.js", import.meta.url), "utf8");
  assert.doesNotMatch(timeline, /arenaGrid/);
  assert.match(world, /this\.facilityVisuals\s*=\s*createFacilityRoomVisuals/);
});
```

- [ ] **Step 2: 运行 RED**

Run: `node --test test/presentation-rules.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`。

- [ ] **Step 3: 实现纯表现规则**

`getOutagePresentation` clamp strength 到 0..1；`darknessAlpha = 0.82 * strength`；`facilityAlpha` 使用 `0.75 + sin(elapsedMs * 0.012) * 0.12` 后 clamp 到 0.62..0.88；active 时 tint 为 `0x9b3942`，strength 0 时返回 alpha 1、tint `null`。

- [ ] **Step 4: 保存设施引用并接入停电**

`world.js` 把 `createFacilityRoomVisuals` 返回值保存到 `this.facilityVisuals`。`timeline.js` 使用规则结果填充黑幕；遍历 active 的 facility visuals 设置 alpha/tint；strength 回到 0 时 alpha 1、`clearTint()`。删除全部 `arenaGrid` 分支。

- [ ] **Step 5: 应用仅显示层角色 scale**

玩家在 `body.setSize(24, 24)` 后 `setScale(CHARACTER_DISPLAY_SCALE.player)`；普通感染职员在 `initializeEnemyFromConfig` 完成 body shape 后设置 `1.15`，其他敌人不变；Boss 在 `setCircle(18)` 后设置 `1.2`。不得改变 body size、radius、speed、damage 或 label 状态语义。

- [ ] **Step 6: 验证并提交**

Run: `node --test test/presentation-rules.test.js && node --test && npm run build`

Expected: all PASS。

```bash
git add src/art/presentationRules.js src/art/facilityRoom.js src/scene/world.js src/scene/enemies.js src/scene/timeline.js test/presentation-rules.test.js
git commit -m "fix(art): restore outage readability and character scale"
```

---

### Task 2: 标题设施背景与正式武器图标

**Files:**
- Create: `public/assets/art/weapons/pistol.png`
- Create: `public/assets/art/weapons/breacher.png`
- Create: `public/assets/art/weapons/tesla.png`
- Create: `src/art/menuBackdrop.js`
- Create: `test/menu-art.test.js`
- Modify: `src/assets/manifest.js`
- Modify: `src/assets/fallbackTextureFactory.js`
- Modify: `src/scene/menus.js`
- Modify: `test/art-assets.test.js`
- Modify: `docs/art/asset-register.md`

**Interfaces:**
- Produces: `TEXTURES.weaponPistolIcon`、`weaponBreacherIcon`、`weaponTeslaIcon`；`createFacilityMenuBackdrop(scene, targetArray, depth)`。
- Consumes: `TEXTURES.facilityFloor/wall/door/console` 和菜单现有对象清理数组。

- [ ] **Step 1: 写失败合同测试**

测试精确断言三项路径为 `assets/art/weapons/pistol.png`、`breacher.png`、`tesla.png`；三图尺寸 64×64；`menus.js` 不再包含 `symbol: "■"`、`"▲"`、`"≈"`，并使用三个 `TEXTURES.weapon*Icon`。

- [ ] **Step 2: 运行 RED**

Run: `node --test test/menu-art.test.js test/art-assets.test.js`

Expected: FAIL with missing weapon keys/files。

- [ ] **Step 3: 逐图生成并清理武器图标**

使用内置 `image_gen`，每图单独提示：高俯视基金会勤务手枪、短管突破霰弹枪、双线圈特斯拉发射器；统一煤黑/钢灰/冷白/琥珀，tesla 可用少量冷青；平色 chroma-key 背景。去底、nearest 缩放、alpha 二值化、共享 32 色板量化；图标主体 bbox 不小于 42×24，不能出现文字、logo、3D 展台或 UI 边框。

- [ ] **Step 4: manifest/fallback 接入**

新增三项稳定 key 和 `IMAGE_ASSETS`；fallback 分别绘制可辨手枪、短管霰弹枪和双线圈轮廓，全部 `ensureTexture` 守卫、64×64。

- [ ] **Step 5: 实现复用菜单设施背景**

`createFacilityMenuBackdrop` 创建 960×540 floor tileSprite、上下 wall 条、右侧 door、左下 console、半透明煤黑 vignette/panel；全部 `setScrollFactor(0)`、无交互，并 push 到调用者清理数组。标题页用该背景替代纯色全屏矩形；武器选择在现有 870×520 panel 后加入同一背景。

- [ ] **Step 6: 替换三枚几何符号**

options 使用 `textureKey`，创建 `this.add.image(cardX, cardY - 122, option.textureKey).setDisplaySize(64,64)`，不再创建 symbol text；卡片坐标、hit area、部署按钮与状态逻辑不变。

- [ ] **Step 7: 更新真实资产登记并验证**

登记实际工具、日期、完整提示、处理、权利与候选状态。运行 focused tests、`node --test`、`npm run build`、`git diff --check`。

- [ ] **Step 8: Commit**

```bash
git add public/assets/art/weapons src/art/menuBackdrop.js src/assets/manifest.js src/assets/fallbackTextureFactory.js src/scene/menus.js test/menu-art.test.js test/art-assets.test.js docs/art/asset-register.md
git commit -m "feat(art): add facility menus and weapon icons"
```

---

### Task 3: 重跑真实静态成品感门禁

**Files:**
- External evidence only: `C:\scp-survivor-workspaces\evidence\ui-art\static-gate-v2\*.png`

- [ ] **Step 1: 自动验证**

Run: `node --test && npm run build && git diff --check 2172c6d..HEAD`

- [ ] **Step 2: 960×540 真实 smoke**

重新采集标题、武器选择、正常战斗、停电、SCP-049 normal、frenzy 尝试、暂停、失败和 restart。检查 console、missing/duplicate key、点击热区。

- [ ] **Step 3: 成品感比较**

并排比较 v1 evidence；必须看到标题有设施材质、武器图标不再是几何符号、角色轮廓在 100% 更清楚、停电仍能看到设施和 SCP-049。frenzy 若仍无法安全到达必须明确未测，但不得用它掩盖其他门禁。

- [ ] **Step 4: 整分支审查与最终状态**

请求 whole-branch review；修复全部 Critical/Important；最终工作树只保留任务开始前 `.superpowers/brainstorm/`。
