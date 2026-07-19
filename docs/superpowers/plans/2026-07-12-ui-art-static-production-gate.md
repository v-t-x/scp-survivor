# UI/Art 静态正式素材门禁实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在真实 Phaser 画面中，用正式精细像素素材替换战斗房间、玩家、感染职员和 SCP-049 的程序化几何外观，完成动画生产前的静态造型门禁。

**Architecture:** `src/assets/manifest.js` 继续作为稳定 key 与正式文件路径的单一事实来源，`PreloadScene` 先加载 PNG，`fallbackTextureFactory` 只在文件缺失时补齐同名 key。新增独立的设施表现模块负责无碰撞的地面、边界模块和设备贴花；玩法代码仅继续消费既有角色 key，不改伤害、AI、刷怪、碰撞、时间线、胜负或存档。

**Tech Stack:** Phaser 3.90、Vite 7、JavaScript ES Modules、Node `node:test`、PNG RGBA 精细像素素材、Superpowers、ImageGen（仅作母版生成并记录，正式准入前进行像素清理和实机检查）。

## Global Constraints

- 世界保持正交俯视坐标；角色内部采用严肃写实的 3/4 绘制角度，禁止等距地图、3D 渲染截图和 Q 版比例。
- 第一验收视口固定为 `960×540`；地面 `32×32`，玩家和感染职员 `48×48`，SCP-049 `64×80`。
- 使用有限色板、硬边像素簇、透明背景和 nearest filtering；不得用整张 AI“假游戏截图”代替实际素材与实机证据。
- 正式文件进入 manifest 前必须登记工具/模型、日期、原始提示、人工修改、来源/许可、商业使用状态和准入结论。
- 稳定 key、`PreloadScene`、fallback 合同、Scene restart、manager API 和 localStorage schema 保持兼容。
- 本计划只实现静态正式素材门禁；方向、比例和接地点未通过前，不生产角色动画、完整 HUD 表皮或第二批敌人素材。
- `src/assets/manifest.js` 是高冲突共享文件。本次修改原因是接入已批准的首批正式素材；影响仅限新增环境 key 与为既有角色 key 声明 PNG；回退方式是移除 `IMAGE_ASSETS` 条目后自动恢复程序化 fallback；验证包括 manifest 合同测试、缺失文件 fallback smoke、构建、控制台和 restart。

---

### Task 1: 锁定正式素材合同与准入记录

**Files:**
- Create: `test/art-assets.test.js`
- Create: `docs/art/asset-register.md`
- Modify: `src/assets/manifest.js:1-42`

**Interfaces:**
- Consumes: 既有 `TEXTURES.player`、`TEXTURES.enemyInfected`、`TEXTURES.enemyScp049` 稳定字符串。
- Produces: `TEXTURES.facilityFloor`、`facilityWall`、`facilityDoor`、`facilityConsole`、`facilityVent`、`facilityDecal`，以及包含九项 PNG 的 `IMAGE_ASSETS`。

- [ ] **Step 1: 写入失败的 manifest 与 PNG 合同测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { IMAGE_ASSETS, TEXTURES } from "../src/assets/manifest.js";

test("production manifest declares the approved static vertical slice", () => {
  assert.deepEqual(new Map(IMAGE_ASSETS.map(({ key, path }) => [key, path])), new Map([
    [TEXTURES.facilityFloor, "assets/art/facility/floor.png"],
    [TEXTURES.facilityWall, "assets/art/facility/wall.png"],
    [TEXTURES.facilityDoor, "assets/art/facility/door.png"],
    [TEXTURES.facilityConsole, "assets/art/facility/console.png"],
    [TEXTURES.facilityVent, "assets/art/facility/vent.png"],
    [TEXTURES.facilityDecal, "assets/art/facility/decal.png"],
    [TEXTURES.player, "assets/art/characters/player.png"],
    [TEXTURES.enemyInfected, "assets/art/characters/infected-staff.png"],
    [TEXTURES.enemyScp049, "assets/art/characters/scp-049.png"]
  ]));
});
```

- [ ] **Step 2: 运行测试确认因新增 key/文件缺失而失败**

Run: `node --test test/art-assets.test.js`

Expected: FAIL，首个错误为环境 key 未定义或 manifest 内容不匹配。

- [ ] **Step 3: 在 manifest 中声明稳定 key 与精确路径**

```js
export const TEXTURES = {
  // 保留全部既有条目原值
  player: "player-rect",
  enemyInfected: "enemy-infected",
  enemyScp049: "enemy-scp049",
  facilityFloor: "facility-floor",
  facilityWall: "facility-wall",
  facilityDoor: "facility-door",
  facilityConsole: "facility-console",
  facilityVent: "facility-vent",
  facilityDecal: "facility-decal"
};

export const IMAGE_ASSETS = [
  { key: TEXTURES.facilityFloor, path: "assets/art/facility/floor.png" },
  { key: TEXTURES.facilityWall, path: "assets/art/facility/wall.png" },
  { key: TEXTURES.facilityDoor, path: "assets/art/facility/door.png" },
  { key: TEXTURES.facilityConsole, path: "assets/art/facility/console.png" },
  { key: TEXTURES.facilityVent, path: "assets/art/facility/vent.png" },
  { key: TEXTURES.facilityDecal, path: "assets/art/facility/decal.png" },
  { key: TEXTURES.player, path: "assets/art/characters/player.png" },
  { key: TEXTURES.enemyInfected, path: "assets/art/characters/infected-staff.png" },
  { key: TEXTURES.enemyScp049, path: "assets/art/characters/scp-049.png" }
];
```

保留 `TEXTURES` 中未展示的全部现有条目、`SPRITESHEET_ASSETS`、`ATLAS_ASSETS` 和 `AUDIO_ASSETS`；同时将文件头“尚无正式素材”的过时说明改成正式素材优先、fallback 补缺的真实合同。

- [ ] **Step 4: 建立逐项资产登记表**

在 `docs/art/asset-register.md` 写入九行固定字段：`Asset`、`Type`、`Path`、`Tool/model`、`Date`、`Original prompt/source`、`Human edits`、`License/right basis`、`Commercial-use status`、`Admission`。AI 自产素材统一标记为“项目定制生成，无第三方素材输入；商业发布前复核所用服务条款”，不得伪造作者或许可证。

- [ ] **Step 5: 运行合同测试**

Run: `node --test test/art-assets.test.js`

Expected: 1 test PASS。

- [ ] **Step 6: Commit**

```bash
git add src/assets/manifest.js test/art-assets.test.js docs/art/asset-register.md
git commit -m "test(art): define static production asset contract"
```

---

### Task 2: 生产并清理设施与角色静态 PNG

**Files:**
- Create: `public/assets/art/facility/floor.png`
- Create: `public/assets/art/facility/wall.png`
- Create: `public/assets/art/facility/door.png`
- Create: `public/assets/art/facility/console.png`
- Create: `public/assets/art/facility/vent.png`
- Create: `public/assets/art/facility/decal.png`
- Create: `public/assets/art/characters/player.png`
- Create: `public/assets/art/characters/infected-staff.png`
- Create: `public/assets/art/characters/scp-049.png`
- Modify: `test/art-assets.test.js`
- Modify: `docs/art/asset-register.md`

**Interfaces:**
- Consumes: Task 1 的九个路径、尺寸合同和稳定 texture key。
- Produces: 可由 Phaser 直接加载的九张 RGBA PNG；角色脚底接地点分别位于画布水平中心附近，透明边缘无半透明毛边。

- [ ] **Step 1: 增加失败的 PNG 尺寸测试**

在 `test/art-assets.test.js` 增加 `node:fs/promises` 的 `access`/`readFile`、`node:url` 的 `fileURLToPath`，并加入：

```js
const expected = new Map([
  [TEXTURES.facilityFloor, [32, 32]],
  [TEXTURES.facilityWall, [64, 64]],
  [TEXTURES.facilityDoor, [64, 64]],
  [TEXTURES.facilityConsole, [64, 64]],
  [TEXTURES.facilityVent, [32, 32]],
  [TEXTURES.facilityDecal, [32, 32]],
  [TEXTURES.player, [48, 48]],
  [TEXTURES.enemyInfected, [48, 48]],
  [TEXTURES.enemyScp049, [64, 80]]
]);

function readPngSize(buffer) {
  assert.equal(buffer.subarray(1, 4).toString("ascii"), "PNG");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "IHDR");
  return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
}

test("production PNGs exist at their exact approved dimensions", async () => {
  for (const { key, path } of IMAGE_ASSETS) {
    const absolute = fileURLToPath(new URL(`../public/${path}`, import.meta.url));
    await access(absolute);
    assert.deepEqual(readPngSize(await readFile(absolute)), expected.get(key), key);
  }
});
```

- [ ] **Step 2: 运行测试确认 PNG 尚不存在**

Run: `node --test test/art-assets.test.js`

Expected: manifest test PASS；PNG dimensions test FAIL with `ENOENT`。

- [ ] **Step 3: 固定共同美术约束与生成提示**

共同提示必须逐张复用：

```text
SCP Foundation-inspired industrial horror, serious tactical survival, modern detailed pixel art, orthographic top-down world with a 3/4 character view, strict hard-edged pixel clusters, limited palette of coal black dirty grey cold white muted amber and restrained warning red, single overhead-left light, no antialiasing, no text, no logo, no isometric diamond grid, no 3D render, no photorealism, no chibi proportions, isolated game asset, transparent background where applicable.
```

设施六张图分别追加“seamless scratched sealed floor plate”“modular reinforced concrete/steel wall face”“sealed security blast door”“Foundation control console with dead monitor and amber status light”“square ventilation/drain grate”“blood-contamination and cracked-floor decal”。角色三张图分别追加“armed tactical containment operative”“infected former facility employee with torn lab/maintenance uniform”“SCP-049, tall plague doctor silhouette, beaked mask, long coat and cane”。

- [ ] **Step 4: 生成设施母版并执行像素清理**

使用 ImageGen 生成六张独立母版；裁切/重绘到合同尺寸，删除文字和伪 logo，确保 `floor.png` 四边可无缝拼接，其他设施图透明区域为 alpha 0。禁止通过把完整概念图缩小到 32px 来冒充像素素材；必须在目标像素网格检查轮廓和材质簇。

- [ ] **Step 5: 生成三类角色母版并执行像素清理**

角色必须是单个静态朝下母版：玩家和感染职员为 `48×48`，SCP-049 为 `64×80`。玩家武器、感染职员身份痕迹、049 鸟嘴面具与长外套必须在 1× 像素查看时可辨；清除多余肢体、漂浮装备、柔边光晕和地面背景。

- [ ] **Step 6: 更新准入记录为真实生成信息**

逐行记录实际模型/工具、日期、完整原始提示、裁切/重绘/调色内容和“静态门禁候选”结论。若任何素材使用第三方输入图，必须写入真实 URL 与许可；无法确认则该文件不得提交。

- [ ] **Step 7: 运行 PNG 合同测试**

Run: `node --test test/art-assets.test.js`

Expected: 2 tests PASS；九张文件均有 PNG/IHDR 且尺寸精确。

- [ ] **Step 8: 人工像素质量检查**

分别以 1× 和 4× nearest-neighbor 查看九张 PNG。拒绝条件：柔边抗锯齿、JPEG 噪声、等距地砖、3D 光滑材质、角色接地点漂移、角色身份不可辨或 049 剪影不成立。发现任一项时回到 Step 2/3 重做，不进入接入任务。

- [ ] **Step 9: Commit**

```bash
git add public/assets/art test/art-assets.test.js docs/art/asset-register.md
git commit -m "art: add static facility and character masters"
```

---

### Task 3: 接入正式设施房间并保留完整 fallback

**Files:**
- Create: `src/art/facilityRoom.js`
- Create: `test/facility-room.test.js`
- Modify: `src/assets/fallbackTextureFactory.js:24-152`
- Modify: `src/scene/world.js:1-70`

**Interfaces:**
- Consumes: Task 1 的六个设施 texture key、`WORLD_WIDTH`、`WORLD_HEIGHT` 和 Phaser scene `add`/`textures` API。
- Produces: `getFacilityRoomLayout(width, height)`、`applyProductionTextureFiltering(scene)`、`createFacilityRoomVisuals(scene, width, height)`；所有对象仅表现，不注册物理碰撞。

- [ ] **Step 1: 写入失败的设施布局与 fallback 合同测试**

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { TEXTURES } from "../src/assets/manifest.js";
import { getFacilityRoomLayout } from "../src/art/facilityRoom.js";

test("facility layout keeps the initial combat center unobstructed", () => {
  const layout = getFacilityRoomLayout(1920, 1920);
  assert.ok(layout.length >= 12);
  assert.ok(layout.every(({ x, y }) => Math.hypot(x - 960, y - 960) >= 260));
  assert.ok(layout.some(({ key }) => key === TEXTURES.facilityDoor));
  assert.ok(layout.some(({ key }) => key === TEXTURES.facilityConsole));
  assert.ok(layout.some(({ key }) => key === TEXTURES.facilityVent));
  assert.ok(layout.some(({ key }) => key === TEXTURES.facilityDecal));
});

test("every new production environment key has an existence-guarded fallback", async () => {
  const source = await readFile(new URL("../src/assets/fallbackTextureFactory.js", import.meta.url), "utf8");
  for (const key of ["facilityFloor", "facilityWall", "facilityDoor", "facilityConsole", "facilityVent", "facilityDecal"]) {
    assert.match(source, new RegExp(`ensureTexture\\(scene, TEXTURES\\.${key}`));
  }
});
```

- [ ] **Step 2: 运行测试确认模块不存在**

Run: `node --test test/facility-room.test.js`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/art/facilityRoom.js`。

- [ ] **Step 3: 实现纯布局、nearest filtering 与无碰撞设施渲染**

`getFacilityRoomLayout(1920, 1920)` 返回至少 12 个固定设备/贴花点，全部位于中心半径 260px 之外；至少包含一扇门、两个 console、四个 vent 和四个 decal。`createFacilityRoomVisuals` 创建：全世界 `tileSprite` 地板（depth `-20`）、四周每 64px 一段 wall（depth `-10`）、布局中的门/设备/贴花（depth `-9` 到 `-7`）。不得调用 `physics.add`、`setInteractive` 或改变 world bounds。

```js
export function applyProductionTextureFiltering(scene) {
  for (const key of Object.values(TEXTURES)) {
    if (scene.textures.exists(key)) {
      scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
    }
  }
}

export function createFacilityRoomVisuals(scene, width, height) {
  applyProductionTextureFiltering(scene);
  const objects = [
    scene.add.tileSprite(width / 2, height / 2, width, height, TEXTURES.facilityFloor).setDepth(-20)
  ];
  // 按 64px 正交步长添加四周墙段，再添加 getFacilityRoomLayout() 返回的对象。
  return objects;
}
```

- [ ] **Step 4: 为六个环境 key 增加最小程序化 fallback**

在 `generateFallbackTextures` 中逐项使用既有 `ensureTexture(scene, key, draw)`；尺寸必须与正式素材合同一致。fallback 只需提供深灰地板、墙、门、控制台、通风口和污染贴花的清晰占位，不追求正式画质，也不得覆盖已加载 PNG。

- [ ] **Step 5: 用设施渲染替换旧空白网格**

`world.js` 导入 `TEXTURES` 与三个设施函数。`createArenaDecoration()` 调用 `createFacilityRoomVisuals(this, WORLD_WIDTH, WORLD_HEIGHT)`，保留最外层边界线用于世界边缘识别，但删除覆盖整张地图的 48px 原型网格。`createPlayer()` 使用 `TEXTURES.player` 替代同值裸字符串；仍保持 `body.setSize(24, 24)`、depth、camera follow 和 world bounds 原样。

- [ ] **Step 6: 运行相关测试**

Run: `node --test test/art-assets.test.js test/facility-room.test.js`

Expected: 4 tests PASS。

- [ ] **Step 7: 验证故意缺失正式素材时的 fallback**

临时将 `public/assets/art` 改名为同级 `art.disabled`，运行 `npm run dev -- --host 127.0.0.1`，确认资源加载失败后 `PrototypeScene` 仍启动、玩家/感染职员/049 与六个环境 key 均存在且控制台没有 duplicate texture key；随后恢复原目录名。不得提交改名状态。

- [ ] **Step 8: Commit**

```bash
git add src/art/facilityRoom.js src/assets/fallbackTextureFactory.js src/scene/world.js test/facility-room.test.js
git commit -m "feat(art): render the facility room with production assets"
```

---

### Task 4: 实机静态门禁、回归与审查

**Files:**
- Create: `artifacts/ui-art-static-gate/title.png`
- Create: `artifacts/ui-art-static-gate/combat-normal.png`
- Create: `artifacts/ui-art-static-gate/combat-outage.png`
- Create: `artifacts/ui-art-static-gate/scp049-normal.png`
- Create: `artifacts/ui-art-static-gate/scp049-frenzy.png`
- Create: `artifacts/ui-art-static-gate/restart.png`
- Modify: `docs/art/asset-register.md`（仅准入结论需要变更时）

**Interfaces:**
- Consumes: 当前 HEAD 的真实 Phaser 运行画面和 Task 1–3 的正式 PNG/设施渲染。
- Produces: 静态造型门禁证据；不产生新玩法接口。

- [ ] **Step 1: 运行自动回归**

Run: `node --test`

Expected: 所有既有 Boss/复制测试和新增 art/facility 测试 PASS。

Run: `npm run build`

Expected: Vite production build PASS，无 missing asset import。

- [ ] **Step 2: 启动当前 HEAD 并在 960×540 做真实视觉 smoke**

Run: `npm run dev -- --host 127.0.0.1`

逐项检查标题/武器选择、正常战斗、停电、SCP-049 normal、frenzy、暂停、失败/胜利和 restart。捕获上列六张真实截图；浏览器控制台必须为 0 个未捕获错误、0 个 missing/duplicate texture key、0 个 atlas/frame 错误。截图不得由 ImageGen 或静态合成稿替代。

- [ ] **Step 3: 执行静态成品感判定**

在 100% 缩放下检查：无需说明即可认出基金会工业设施、战术人员、感染职员和 SCP-049；角色脚底接地；玩家与感染职员不因同屏密度混淆；049 normal/frenzy 仍可借既有 tint/警报区分；HUD 不遮挡角色和设施主体。若仅像换色或仍像几何原型，门禁失败，回到 Task 2 调整素材，不得开始动画计划。

- [ ] **Step 4: 请求两阶段代码审查并修复**

先审查规格符合性，再审查代码质量。重点核对：没有玩法数值 diff、manifest key 未重命名、fallback 守卫完整、设施对象无碰撞、restart 无残留、资产登记真实。修复所有 Critical/Important 问题后重跑 Steps 1–3。

- [ ] **Step 5: 最终验证工作树**

Run: `git diff --check 2172c6d..HEAD`

Expected: 无输出。

Run: `git status --short --branch`

Expected: 仅保留任务开始前已存在且未触碰的 `.superpowers/` 未跟踪目录；没有其他未提交文件。

- [ ] **Step 6: Commit evidence if screenshots are admitted to the branch**

```bash
git add artifacts/ui-art-static-gate docs/art/asset-register.md
git commit -m "test(art): record static production gate evidence"
```

若仓库政策不接收截图，则不执行本 commit，在阶段报告中以绝对路径交付证据，并保持截图未跟踪或移至仓库外的临时证据目录。

---

## Plan Self-Review

- 规格覆盖：本计划覆盖色板/比例/命名/登记、设施静态母版、三类角色静态母版、manifest 接入、nearest filtering、fallback、真实视口、normal/outage/frenzy/restart 与成品感门禁。
- 有意延期：四方向动画、受击/死亡帧、动态阴影/VFX、高清 HUD 表皮、230 敌人动画性能预算；这些项目依赖本静态门禁通过，按批准规格必须后置。
- 边界检查：不修改 balance、AI、刷怪、碰撞尺寸、时间线、Boss deadline、胜负、存档、manager API 或 Scene 生命周期。
- 回退检查：删除九项 `IMAGE_ASSETS` 声明即可恢复同 key fallback；设施模块可由旧 `createArenaDecoration` 实现替回，角色玩法引用不变。
