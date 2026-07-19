# v1.6 急救包泛化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把 4:00 出现的一次性治疗拾取物完整泛化为“急救包 / Medkit”，内部契约统一为 `medkit`，同时证明全部玩法、视觉、资源和发布边界保持不变。

**Architecture:** 先让现有测试和新增身份测试切换到 `medkit` 契约并观察 RED，再最小修改配置、Scene 状态、生成方法、纹理键、拾取类型和 HUD reason。第二个提交同步当前文档、历史说明与发布计划，使当前 tracked tree 不再携带旧条目身份；最后执行两阶段独立审查、完整 v1.6 final-head 门禁和针对新横幅的浏览器 smoke。

**Tech Stack:** Phaser 3.90、Vite 7、JavaScript ES Modules、Node.js test runner、Python/Pillow 像素测试、PowerShell、Git。

## Global Constraints

- 中文公众名称固定为“急救包”，英文公众名称固定为 “Medkit”，内部标识固定为 `medkit`。
- 顶部横幅固定为标题“医疗补给”、详情“急救包已在设施内出现”、持续 2400ms。
- 保持 4:00（240000ms）生成一次、玩家附近 240–420 距离、72 边界夹取、60 生命治疗、碰撞圆半径 9、depth 14、`pickupHeal` 音效和 650ms HUD cue。
- 保持“治疗提交 → UI 更新 → 拾取物销毁 → HUD cue”的顺序。
- 保持 18×18 红白程序化 fallback 的尺寸、颜色和绘制几何；不新增、删除或重画 PNG。
- 不修改六分钟结构、数值、刷怪、AI、奖励、胜负、存档和 `localStorage` 语义。
- 不修改 SCP-049、橘色路线、角色动画、App Platform、53/51/2 素材统计或 UI/Art cutoff。
- 当前 worktree 固定为 `C:\scp-survivor-release-v1.6`，分支固定为 `codex/release-v1.6`；不得 rebase、squash、force-push 或重写历史。
- `.superpowers/`、`dist/`、`node_modules/` 和临时 smoke 材料不得提交。
- 本地 commit 已获批准；push、PR、merge、tag 和 GitHub Release 仍需原发布计划规定的独立授权。
- 设计依据为 `docs/superpowers/specs/2026-07-18-medkit-rename-design.md`。

## File Responsibility Map

- `test/medkit-identity.test.js`：锁定急救包的配置、生成状态、纹理、碰撞和横幅契约。
- `test/hud-pickup-notification.test.js`：锁定治疗提交顺序、音效和 HUD cue。
- `test/tactical-hud-view.test.js`：锁定 `medkit` cue 与建造面板/重叠 deadline 的组合。
- `test/combat-presentation-integration.test.js`：锁定主循环调用 `updateMedkitSpawn()`。
- `src/config/balance.js`：保存 `medkitSpawnAtMs` 与 60 点治疗量。
- `src/main.js`、`src/scene/menus.js`：初始化、主循环调用和新单局重置 `medkitSpawned`。
- `src/scene/progression.js`：按原位置规则生成急救包并显示新横幅。
- `src/scene/combat.js`：应用急救包治疗并发送 `medkit` cue。
- `src/assets/manifest.js`、`src/assets/fallbackTextureFactory.js`：提供 `TEXTURES.medkit`，保持程序化图形不变。
- `README.md`、`README.en.md`、`CHANGELOG.md`、`docs/design.md`：当前玩家和设计事实。
- `docs/archive/roadmap-1.md`、`docs/archive/v1.0-notes.md`：随当前源码归档分发的旧说明泛化。
- `docs/superpowers/plans/2026-07-10-ui-art-phase1-proposal.md`、`docs/superpowers/plans/2026-07-15-tactical-hud-slice.md`：历史实现说明中的名称和示例契约同步。
- `docs/superpowers/plans/2026-07-18-v1.6-integration-and-release.md`：记录本次候选修正及门禁失效/重跑边界。

---

### Task 1: 用 TDD 建立 `medkit` 运行时契约

**Files:**
- Create: `test/medkit-identity.test.js`
- Modify: `test/hud-pickup-notification.test.js`
- Modify: `test/tactical-hud-view.test.js`
- Modify: `test/combat-presentation-integration.test.js`
- Modify: `src/config/balance.js`
- Modify: `src/main.js`
- Modify: `src/scene/menus.js`
- Modify: `src/scene/progression.js`
- Modify: `src/scene/combat.js`
- Modify: `src/assets/manifest.js`
- Modify: `src/assets/fallbackTextureFactory.js`

**Interfaces:**
- Consumes: 现有一次性治疗拾取物的 4:00 时间线、60 HP 数值、生成位置、程序化 fallback 和 HUD 通知链。
- Produces: `BALANCE.match.medkitSpawnAtMs`、`BALANCE.pickups.medkit`、`TEXTURES.medkit`、`medkitSpawned`、`updateMedkitSpawn()`、`spawnMedkit()` 与 `pickupType/reason = "medkit"`。

- [ ] **Step 1: 新增身份与不变量测试**

创建 `test/medkit-identity.test.js`：

```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { BALANCE } from "../src/config/balance.js";
import { TEXTURES } from "../src/assets/manifest.js";

async function loadProgressionMixin() {
  const source = await readFile(new URL("../src/scene/progression.js", import.meta.url), "utf8");
  const declaration = "export const progressionMixin =";
  const start = source.indexOf(declaration);
  assert.notEqual(start, -1, "progressionMixin export must exist");
  const body = source.slice(start).replace(declaration, "const progressionMixin =");
  const Phaser = {
    Math: {
      FloatBetween: () => 0,
      Between: () => 240,
      Clamp: (value, min, max) => Math.min(max, Math.max(min, value))
    }
  };
  return Function(
    "Phaser",
    "BALANCE",
    "WORLD_WIDTH",
    "WORLD_HEIGHT",
    `${body}\nreturn progressionMixin;`
  )(Phaser, BALANCE, 2_000, 2_000);
}

const progressionMixin = await loadProgressionMixin();

test("medkit keeps the approved timing, healing, and texture contract", () => {
  assert.equal(BALANCE.match.medkitSpawnAtMs, 240_000);
  assert.equal(BALANCE.pickups.medkit.healAmount, 60);
  assert.equal(TEXTURES.medkit, "medkit");
});

test("medkit spawn keeps placement, collision, depth, and banner semantics", () => {
  const created = [];
  const banners = [];
  const pickup = {
    pickupType: null,
    circle: null,
    depth: null,
    setCircle(value) { this.circle = value; return this; },
    setDepth(value) { this.depth = value; return this; }
  };
  const scene = {
    player: { x: 500, y: 500 },
    supplyPickups: {
      create(x, y, texture) {
        created.push([x, y, texture]);
        return pickup;
      }
    },
    showTopBanner(...args) { banners.push(args); }
  };

  progressionMixin.spawnMedkit.call(scene);

  assert.deepEqual(created, [[740, 500, "medkit"]]);
  assert.equal(pickup.pickupType, "medkit");
  assert.equal(pickup.circle, 9);
  assert.equal(pickup.depth, 14);
  assert.deepEqual(banners, [["医疗补给", "急救包已在设施内出现", 2400]]);
});

test("medkit spawns once when mission time reaches four minutes", () => {
  let spawnCalls = 0;
  const scene = {
    medkitSpawned: false,
    isMissionActive: true,
    isGameOver: false,
    elapsedSurvivalMs: 239_999,
    spawnMedkit() { spawnCalls += 1; }
  };

  progressionMixin.updateMedkitSpawn.call(scene);
  assert.equal(spawnCalls, 0);
  assert.equal(scene.medkitSpawned, false);

  scene.elapsedSurvivalMs = 240_000;
  progressionMixin.updateMedkitSpawn.call(scene);
  assert.equal(spawnCalls, 1);
  assert.equal(scene.medkitSpawned, true);

  progressionMixin.updateMedkitSpawn.call(scene);
  assert.equal(spawnCalls, 1);
});
```

- [ ] **Step 2: 先把现有测试切换到目标契约**

在三个现有测试文件中只做以下目标替换：

- `test/hud-pickup-notification.test.js`：所有相关拾取类型、cue reason、平衡读取和测试名称统一使用 `medkit`、`BALANCE.pickups.medkit` 与 “medkit”。
- `test/tactical-hud-view.test.js`：相关 cue reason 统一为 `"medkit"`。
- `test/combat-presentation-integration.test.js`：主循环 method trace 统一为 `"updateMedkitSpawn"`。

治疗测试必须继续精确断言：

```js
assert.deepEqual(result.events, ["sound:pickupHeal", "update", "destroy", "notify"]);
assert.deepEqual(result.cues, [{
  reason: "medkit",
  nowMs: 1_250,
  durationMs: 650
}]);
assert.equal(
  result.gameplay.health,
  Math.min(100, 40 + BALANCE.pickups.medkit.healAmount)
);
assert.equal(result.gameplay.moveSpeedBuffMultiplier, 1);
assert.equal(result.gameplay.activeStimUntilMs, 0);
```

- [ ] **Step 3: 运行 RED 并确认失败来自生产契约尚未迁移**

```powershell
node --test test/medkit-identity.test.js test/hud-pickup-notification.test.js test/tactical-hud-view.test.js test/combat-presentation-integration.test.js
```

Expected: 命令失败；至少报告 `medkitSpawnAtMs`、`BALANCE.pickups.medkit`、`TEXTURES.medkit` 或 `updateMedkitSpawn` 尚不存在。若失败来自语法、文件路径或测试装载错误，先修正测试，直到它因目标生产契约缺失而失败。

- [ ] **Step 4: 实施最小生产代码迁移**

把配置目标改为：

```js
match: {
  survivalDurationMs: 360000,
  bossSpawnAtMs: 360000,
  powerOutageAtMs: 180000,
  medkitSpawnAtMs: 240000
},
```

```js
pickups: {
  combatStim: {
    healAmount: 15,
    speedMultiplier: 1.2,
    durationMs: 6000
  },
  medkit: {
    healAmount: 60
  }
},
```

`src/main.js` 和 `src/scene/menus.js` 的单局状态统一为 `this.medkitSpawned = false`，主循环调用 `this.updateMedkitSpawn()`。

`src/scene/progression.js` 的目标实现为：

```js
updateMedkitSpawn() {
  if (this.medkitSpawned || !this.isMissionActive || this.isGameOver) {
    return;
  }
  if (this.elapsedSurvivalMs < BALANCE.match.medkitSpawnAtMs) {
    return;
  }
  this.medkitSpawned = true;
  this.spawnMedkit();
},

spawnMedkit() {
  // Place it a short distance from the player so it is reachable in the
  // larger world but still requires deliberate movement to grab.
  const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
  const distance = Phaser.Math.Between(240, 420);
  const x = Phaser.Math.Clamp(
    this.player.x + Math.cos(angle) * distance,
    72,
    WORLD_WIDTH - 72
  );
  const y = Phaser.Math.Clamp(
    this.player.y + Math.sin(angle) * distance,
    72,
    WORLD_HEIGHT - 72
  );
  const pickup = this.supplyPickups.create(x, y, "medkit");
  pickup.pickupType = "medkit";
  pickup.setCircle(9);
  pickup.setDepth(14);
  this.showTopBanner("医疗补给", "急救包已在设施内出现", 2400);
}
```

`src/scene/combat.js` 的普通治疗分支统一为：

```js
} else if (pickup.pickupType === "medkit") {
  this.health = Math.min(this.maxHealth, this.health + BALANCE.pickups.medkit.healAmount);
  this.playSound("pickupHeal");
  this.updateUI();
  cueReason = "medkit";
}
```

`src/assets/manifest.js` 增加目标键 `medkit: "medkit"`；`src/assets/fallbackTextureFactory.js` 只把纹理引用迁移为 `TEXTURES.medkit`，中间的 `clear`、两个 fillStyle、两个 fillCircle、尺寸和坐标逐字保持不变。

- [ ] **Step 5: 运行 GREEN 与完整 Node 回归**

```powershell
node --test test/medkit-identity.test.js test/hud-pickup-notification.test.js test/tactical-hud-view.test.js test/combat-presentation-integration.test.js
if ($LASTEXITCODE -ne 0) { throw '急救包聚焦测试失败' }
npm.cmd test
if ($LASTEXITCODE -ne 0) { throw '完整 Node 测试失败' }
git diff --check -- src test
if ($LASTEXITCODE -ne 0) { throw '源码或测试 diff check 失败' }
```

Expected: 四个聚焦文件全部通过；总 Node 测试数由 311 增加为 314，失败为 0；diff check 无输出。

- [ ] **Step 6: 验证无玩法或视觉漂移并提交**

```powershell
git diff --word-diff=porcelain 6738be3 -- src/config/balance.js src/main.js src/scene/menus.js src/scene/progression.js src/scene/combat.js src/assets/manifest.js src/assets/fallbackTextureFactory.js
git diff --check
git status --short
git add -- src/config/balance.js src/main.js src/scene/menus.js src/scene/progression.js src/scene/combat.js src/assets/manifest.js src/assets/fallbackTextureFactory.js test/medkit-identity.test.js test/hud-pickup-notification.test.js test/tactical-hud-view.test.js test/combat-presentation-integration.test.js
git diff --cached --check
git commit -m "fix: treat the healing pickup as a medkit"
```

Expected: 数字、绘制坐标和提交顺序只有标识迁移，没有值变化；提交只包含列出的源码与测试。

---

### Task 2: 泛化当前文档与随源码分发的历史说明

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/design.md`
- Modify: `docs/archive/roadmap-1.md`
- Modify: `docs/archive/v1.0-notes.md`
- Modify: `docs/superpowers/plans/2026-07-10-ui-art-phase1-proposal.md`
- Modify: `docs/superpowers/plans/2026-07-15-tactical-hud-slice.md`
- Modify: `docs/superpowers/plans/2026-07-18-v1.6-integration-and-release.md`

**Interfaces:**
- Consumes: Task 1 的 `medkit` 运行时契约和已批准的急救包设计。
- Produces: 中英文玩家说明、当前设计、CHANGELOG、历史说明与运行时一致的 tracked tree。

- [ ] **Step 1: 更新当前玩家入口与设计事实**

目标文案固定为：

```text
README.md:
  → 4:00 出现急救包
  - 6 分钟时间轴、电力故障、感知干扰、战斗兴奋剂和急救包；

README.en.md:
  → Medkit appears at 4:00
  - a six-minute timeline, power outage, perception hazards, combat stim, and Medkit;

CHANGELOG.md:
  - 急救包改为在玩家附近 240–420 距离生成，确保大地图中可被找到。
  - **补给拾取**：急救包（治疗）、战斗兴奋剂（精英掉落）。

docs/design.md:
  4:00 时间轴写“生成一次急救包”
  章节名写“拾取物与补给”
  表格行写“急救包 | 4:00 在地图中生成一次 | 恢复 60 生命，拾取后消耗”
```

- [ ] **Step 2: 更新当前源码归档中的历史说明**

在两个 archive 文档和两个旧实施计划中，把该治疗拾取物的公开名称统一为“急救包”，示例标识统一为：

```js
medkitSpawnAtMs: 240000
pickups: {
  medkit: { healAmount: 60 },
  combatStim: { healAmount: 15, speedMultiplier: 1.2, durationMs: 6000 }
}
BALANCE.pickups.medkit.healAmount
```

UI/Art 资源键表统一为：

```markdown
| `medkit` | `medkit` | 急救包 | 18×18 |
```

HUD 计划中的两个相关段落只把物品名称改为“急救包”，保持 650ms cue、效果提交顺序和失败隔离说明不变。

- [ ] **Step 3: 在 v1.6 总计划记录修正边界**

在 `docs/superpowers/plans/2026-07-18-v1.6-integration-and-release.md` 的 Task 10 前增加一个已完成的本地修正说明，链接本规格与本计划，并明确：

```markdown
## v1.6 候选修正：普通治疗拾取物泛化

- 项目所有者确认该物品只是普通回血补给，公众名称改为“急救包 / Medkit”，内部契约改为 `medkit`。
- 4:00、60 HP、位置、碰撞、音效、HUD cue 和程序化图形保持不变。
- 当前 tracked tree 移除旧条目身份；历史 Git/标签/Release 不重写。
- 该玩家可见修正使旧 HEAD 的 final-head 审查和视觉验收失效，必须在新 HEAD 重跑 Task 7–9。
- 本修正只关闭一个具体条目缺口，总体 Level 2 许可门禁仍未完成。
```

- [ ] **Step 4: 执行全树旧身份与当前文案检查**

```powershell
$legacyNumber = 'SCP-' + '500'
$legacyKey = 'scp' + '500'
$legacyEnglish = 'pana' + 'cea'
$legacyChinese = '万' + '能药'
$legacyHits = @(git grep -n -I -i -E "$legacyNumber|$legacyKey|$legacyEnglish|$legacyChinese" -- .)
$legacyExit = $LASTEXITCODE
if ($legacyExit -gt 1) { throw '无法扫描旧条目身份' }
if ($legacyHits) { $legacyHits; throw '当前 tracked tree 仍包含旧条目身份' }
git grep -n -I -E '急救包|Medkit|medkitSpawnAtMs|updateMedkitSpawn|TEXTURES\.medkit' -- README.md README.en.md CHANGELOG.md docs src test
if ($LASTEXITCODE -ne 0) { throw '无法定位急救包目标契约' }
git diff --check
if ($LASTEXITCODE -ne 0) { throw '文档 diff check 失败' }
```

Expected: 第一项零命中；第二项能在运行时、测试和文档中定位目标名称；diff check 无输出。

- [ ] **Step 5: 提交文档泛化**

```powershell
git add -- README.md README.en.md CHANGELOG.md docs/design.md docs/archive/roadmap-1.md docs/archive/v1.0-notes.md docs/superpowers/plans/2026-07-10-ui-art-phase1-proposal.md docs/superpowers/plans/2026-07-15-tactical-hud-slice.md docs/superpowers/plans/2026-07-18-v1.6-integration-and-release.md
git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'staged 文档 diff check 失败' }
git commit -m "docs: describe the medkit as regular supply"
```

Expected: 提交只包含列出的文档；不修改 Release 名称、版本号、许可正文、SCP-049 署名或素材登记。

---

### Task 3: 两阶段独立审查与修复循环

**Files:**
- Inspect: `689eac9..HEAD`
- Modify only if review finds a verified issue: files already listed in Tasks 1–2 and their tests

**Interfaces:**
- Consumes: 规格、实施计划和两个实现提交。
- Produces: 最终 HEAD 的规格符合性批准与代码质量批准。

- [ ] **Step 1: 规格符合性审查**

调用独立 reviewer，只提供设计规格、实施计划、base `689eac9` 与当前 HEAD。逐项核对名称、内部契约、全部不变量、全树旧身份清理、历史边界和总体许可门禁是否准确；不得只依赖实现 Agent 摘要。

Expected: reviewer 明确给出 APPROVED，或列出带路径/行号的缺口。

- [ ] **Step 2: 代码质量审查**

调用另一个独立 reviewer，重点核对：

- 测试是否真实经历 RED/GREEN；
- `medkit` 配置、状态、方法、纹理、pickup/reason 是否一致；
- 治疗、音效、UI、销毁、cue 顺序是否保持；
- 生成数字与 fallback 绘制参数是否无漂移；
- 没有存档迁移需求、未知调用点或旧标识残留；
- 文档没有误称总体许可已经解决。

Expected: reviewer 明确给出 APPROVED，或列出带严重级别的具体问题。

- [ ] **Step 3: 核实并处理审查意见**

对每条意见用源码、测试和 Git diff 独立验证。有效行为缺口必须先加失败测试，再做最小修复；无效或超范围意见写明反证。任何 tracked 修复必须独立提交，然后重新执行两个 reviewer，直到最终 HEAD 同时获批。

---

### Task 4: 重跑完整 v1.6 final-head 门禁

**Files:**
- Inspect only: entire tracked tree and Git ancestry
- Generated but untracked: `dist/`, local test/build output

**Interfaces:**
- Consumes: 两阶段审查通过的最终 HEAD。
- Produces: 新 HEAD 的自动化、资源、文档、隐私、许可关键词和 Git 边界证据。

- [ ] **Step 1: 验证版本、Debug、素材与 ancestry**

```powershell
node -e "const p=require('./package.json');const l=require('./package-lock.json');if(p.version!=='1.6.0'||l.version!=='1.6.0'||l.packages[''].version!=='1.6.0'||p.scripts.test!=='node --test'||p.license!=='SEE LICENSE IN LICENSE')process.exit(1)"
if ($LASTEXITCODE -ne 0) { throw '版本、测试脚本或许可元数据不匹配' }
node --input-type=module -e "import { DEBUG_MODE } from './src/config/constants.js'; if (DEBUG_MODE !== false) process.exit(1)"
if ($LASTEXITCODE -ne 0) { throw 'DEBUG_MODE 必须为 false' }
node --input-type=module -e "import fs from'node:fs';import{IMAGE_ASSETS,SPRITESHEET_ASSETS}from'./src/assets/manifest.js';import{execFileSync}from'node:child_process';const loaded=[...IMAGE_ASSETS,...SPRITESHEET_ASSETS].map(x=>'public/'+x.path);const png=execFileSync('git',['ls-files','public/assets/art/**/*.png'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(Boolean);const extra=png.filter(x=>!loaded.includes(x)).sort();if(png.length!==53||loaded.length!==51||JSON.stringify(extra)!==JSON.stringify(['public/assets/art/characters/infected-opening-sheet.png','public/assets/art/characters/infected-staff.png'])||loaded.some(x=>!fs.existsSync(x))){console.error({png:png.length,loaded:loaded.length,extra});process.exit(1)}"
if ($LASTEXITCODE -ne 0) { throw '53/51/2 素材边界不匹配' }
$excluded = @('da8b2354d5ab8344c2a873219d6bee992eb914d4','7767846b5007dc96b3cc03ba9832e57a3a9f0cbe','4a5512ffcdccff37c72541c58cd82f56594db468','68c23bc67134fe2e34a086217d639496320f8f25')
git merge-base --is-ancestor 31d8a240963b98f994d25c96414c9802a268ba0e HEAD
if ($LASTEXITCODE -ne 0) { throw 'UI/Art cutoff 不在候选分支' }
foreach ($commit in $excluded) {
  git merge-base --is-ancestor $commit HEAD
  if ($LASTEXITCODE -eq 0) { throw "排除提交误入候选分支：$commit" }
  if ($LASTEXITCODE -ne 1) { throw "无法验证排除提交 ancestry：$commit" }
}
```

- [ ] **Step 2: 验证 Markdown 本地链接**

```powershell
$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Stop'
try {
function Get-MarkdownLinkTargets {
  param(
    [AllowEmptyCollection()][AllowEmptyString()][string[]]$Lines = @(),
    [Parameter(Mandatory = $true)][string]$Source
  )
  $inFence = $false
  $fenceChar = $null
  $fenceLength = 0
  $scanLines = foreach ($line in $Lines) {
    $fenceMatch = [regex]::Match($line, '^\s*(`{3,}|~{3,})(.*)$')
    if ($fenceMatch.Success) {
      $candidateFence = $fenceMatch.Groups[1].Value
      if (-not $inFence) {
        $inFence = $true
        $fenceChar = $candidateFence[0]
        $fenceLength = $candidateFence.Length
        continue
      }
      if (
        $candidateFence[0] -eq $fenceChar -and
        $candidateFence.Length -ge $fenceLength -and
        -not $fenceMatch.Groups[2].Value.Trim()
      ) {
        $inFence = $false
        $fenceChar = $null
        $fenceLength = 0
        continue
      }
    }
    if (-not $inFence) {
      [regex]::Replace($line, '`+[^`]*`+', 'INLINE_CODE')
    }
  }
  if ($inFence) {
    throw "$Source -> unclosed fenced code block"
  }
  $text = [regex]::Replace(($scanLines -join "`n"), '(?s)<!--.*?-->', '')
  foreach ($match in [regex]::Matches($text, '\[[^\]]*\]\(([^)]+)\)')) {
    $match.Groups[1].Value
  }
  foreach ($match in [regex]::Matches($text, '(?m)^\s*\[(?!\^)[^\]]+\]:\s*(?:<([^>]+)>|(\S+))')) {
    if ($match.Groups[1].Success) {
      $match.Groups[1].Value
    } else {
      $match.Groups[2].Value
    }
  }
}

$fixtureLines = @(
  '[`code`](missing-code.md)',
  '[release]: missing-reference.md',
  '```powershell',
  '[int](ignored-fenced.md)',
  '```',
  '`[char](ignored-inline.md)`'
)
$fixtureTargets = @(Get-MarkdownLinkTargets -Lines $fixtureLines -Source '<fixture>')
if ([string]::Join('|', $fixtureTargets) -ne 'missing-code.md|missing-reference.md') {
  $fixtureTargets
  throw 'Markdown 链接检查器负向 fixture 失败'
}

$files = @(git ls-files '*.md') + @('LICENSE')
if ($LASTEXITCODE -ne 0) { throw '无法枚举 Markdown 文件' }
$broken = foreach ($path in $files) {
  $file = Get-Item -LiteralPath $path
  $targets = @(Get-MarkdownLinkTargets -Lines (Get-Content -LiteralPath $path -Encoding utf8) -Source $path)
  foreach ($rawTarget in $targets) {
    $target = $rawTarget.Trim()
    if ($target -match '^<([^>]+)>') {
      $target = $Matches[1]
    } else {
      $target = ($target -split '\s+', 2)[0]
    }
    if ($target -match '^(https?://|mailto:|#)') { continue }
    $relative = ($target -split '#', 2)[0]
    if (-not $relative) { continue }
    $resolved = Join-Path $file.DirectoryName $relative
    if (-not (Test-Path -LiteralPath $resolved)) { "$path -> $target" }
  }
}
if ($broken) { $broken; throw 'broken local Markdown links' }
} finally {
  $ErrorActionPreference = $previousErrorActionPreference
}
```

Expected: 负向 fixture 只识别两个故意缺失链接；真实仓库没有 broken local Markdown links。

- [ ] **Step 3: 验证隐私、私有目录、许可关键词与旧身份**

```powershell
$accountPathHits = @(git grep -n -I -i -E 'C:[\\/]+Users[\\/]' -- .)
$accountPathExit = $LASTEXITCODE
if ($accountPathExit -gt 1) { throw '无法扫描 tracked 账户路径' }
if ($accountPathHits) { $accountPathHits; throw 'tracked 文件仍包含账户专属绝对路径' }
$tracked = git ls-files -- '.superpowers/**' 'dist/**' 'node_modules/**'
if ($LASTEXITCODE -ne 0) { throw '无法检查私有或生成目录' }
if ($tracked) { $tracked; throw '私有或生成目录被误纳入版本控制' }
foreach ($pattern in @('Gabriel Jade','djkaktus','CC BY-SA 3\.0','SCP Licensing Team','SEE LICENSE IN LICENSE')) {
  git grep -n -I -E $pattern -- LICENSE ATTRIBUTION.md docs/licensing-and-commercialization.md package.json | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "无法检查许可关键信息：$pattern" }
}
$legacyNumber = 'SCP-' + '500'
$legacyKey = 'scp' + '500'
$legacyEnglish = 'pana' + 'cea'
$legacyChinese = '万' + '能药'
$legacyHits = @(git grep -n -I -i -E "$legacyNumber|$legacyKey|$legacyEnglish|$legacyChinese" -- .)
$legacyExit = $LASTEXITCODE
if ($legacyExit -gt 1) { throw '无法扫描旧条目身份' }
if ($legacyHits) { $legacyHits; throw '旧条目身份仍存在' }
```

- [ ] **Step 4: 执行完整自动化与 Git 检查**

```powershell
npm.cmd ci
if ($LASTEXITCODE -ne 0) { throw 'npm ci 失败' }
npm.cmd test
if ($LASTEXITCODE -ne 0) { throw 'Node 测试失败' }
$python = (Get-Command python -ErrorAction SilentlyContinue).Source
if (-not $python -or $python -match '\\WindowsApps\\') {
  $python = Join-Path ([Environment]::GetFolderPath('UserProfile')) '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
}
if (-not (Test-Path -LiteralPath $python)) { throw '找不到可执行的 Python runtime' }
& $python scripts/art/test_pixel_tools.py
if ($LASTEXITCODE -ne 0) { throw 'Python 像素测试失败' }
npm.cmd run build
if ($LASTEXITCODE -ne 0) { throw 'Vite 构建失败' }
git diff --check main...HEAD
if ($LASTEXITCODE -ne 0) { throw 'main...HEAD diff check 失败' }
$status = git status --porcelain
if ($LASTEXITCODE -ne 0) { throw '无法读取 Git 状态' }
if ($status) { $status; throw '候选 worktree 不干净' }
```

Expected: 314 个 Node 测试通过、Python 4/4 通过、Vite 构建成功；只允许记录既有大 chunk warning；diff check 无输出；工作树干净。

---

### Task 5: 浏览器 smoke 与新的项目所有者验收绑定

**Files:**
- Inspect only: built application and browser runtime
- Local ignored evidence only: `.superpowers/sdd/`

**Interfaces:**
- Consumes: Task 4 全部门禁通过的干净最终 HEAD。
- Produces: 新 HEAD 的运行时证据、稳定本地链接和项目所有者确认入口。

- [ ] **Step 1: 启动 worktree 所有的稳定 Vite 服务**

```powershell
$smokeRoot = (Resolve-Path -LiteralPath '.').Path
$smokePort = 64126..64135 | Where-Object {
  -not (Get-NetTCPConnection -LocalPort $_ -State Listen -ErrorAction SilentlyContinue)
} | Select-Object -First 1
if (-not $smokePort) { throw '64126–64135 没有空闲 smoke 端口；不得终止未知进程' }
$nodePath = (Get-Command node -ErrorAction Stop).Source
$vitePath = Join-Path $smokeRoot 'node_modules\vite\bin\vite.js'
if (-not (Test-Path -LiteralPath $vitePath)) { throw 'Vite 入口不存在，请先完成 npm ci' }
$smokeOut = Join-Path ([IO.Path]::GetTempPath()) "scp-survivor-v16-medkit-$smokePort.out.log"
$smokeErr = Join-Path ([IO.Path]::GetTempPath()) "scp-survivor-v16-medkit-$smokePort.err.log"
$smokeProcess = Start-Process -FilePath $nodePath `
  -ArgumentList @($vitePath, '--host', '127.0.0.1', '--port', "$smokePort", '--strictPort') `
  -WorkingDirectory $smokeRoot `
  -RedirectStandardOutput $smokeOut `
  -RedirectStandardError $smokeErr `
  -WindowStyle Hidden `
  -PassThru
$smokePid = $smokeProcess.Id
Start-Sleep -Seconds 2
$listener = Get-NetTCPConnection -LocalPort $smokePort -State Listen -ErrorAction Stop
$owner = Get-CimInstance Win32_Process -Filter "ProcessId = $($listener.OwningProcess)"
if ($owner.ProcessId -ne $smokePid) { throw '端口 listener 不属于刚启动的 Vite 进程' }
if ($owner.CommandLine -notlike "*$smokeRoot*" -and $owner.CommandLine -notlike "*$vitePath*") {
  throw 'Vite 命令行无法证明属于当前 worktree'
}
$response = Invoke-WebRequest -UseBasicParsing -Uri "http://127.0.0.1:$smokePort/"
if ($response.StatusCode -ne 200) { throw "smoke HTTP 状态异常：$($response.StatusCode)" }
```

保留 `$smokeRoot`、`$smokePort` 与 `$smokePid`，不得用这些变量指向其他进程。

- [ ] **Step 2: 执行目标浏览器检查**

使用 in-app Browser 打开 `http://127.0.0.1:$smokePort/`，检查 960×540 和 1280×720，完成标题 → 武器选择 → 任务进入，确认没有控制台错误、资源 404 或 fallback 警告。进入任务后只在浏览器页面上下文执行以下一次性 smoke 注入；它不得写入仓库：

```js
const game = window.Phaser?.GAMES?.find((candidate) => candidate?.isRunning);
const scene = game?.scene?.getScene("PrototypeScene");
if (!scene?.isMissionActive) throw new Error("PrototypeScene mission is not active");
scene.medkitSpawned = false;
scene.elapsedSurvivalMs = 240_000;
scene.updateMedkitSpawn();
const pickup = scene.supplyPickups
  .getChildren()
  .find((candidate) => candidate.active && candidate.pickupType === "medkit");
if (!pickup) throw new Error("medkit pickup did not spawn");
window.__medkitSmoke = { scene, pickup };
({ spawned: true, pickupType: pickup.pickupType });
```

先截图确认横幅和拾取图形，再在同一页面上下文执行：

```js
const { scene, pickup } = window.__medkitSmoke;
scene.health = 40;
scene.maxHealth = 100;
scene.handleSupplyPickupOverlap(null, pickup);
if (scene.health !== 100) throw new Error(`expected health 100, got ${scene.health}`);
if (pickup.active) throw new Error("medkit pickup was not destroyed");
delete window.__medkitSmoke;
({ health: scene.health, pickupActive: pickup.active });
```

如果 npm Phaser 构建不暴露 `window.Phaser.GAMES`，不得修改生产代码增加调试入口；改为正常推进到 4:00 后执行相同观察。

必须观察并记录：

- 横幅显示“医疗补给 / 急救包已在设施内出现”；
- 红白 18×18 拾取图形外观未变化；
- 拾取后恢复 60 生命，播放治疗音效，拾取物消失并短暂显示 HUD cue；
- pause、restart 后 `medkitSpawned` 正确重置；
- 既有标题、HUD、战斗和 restart smoke 没有回归。

- [ ] **Step 3: 交付新候选供项目所有者复验**

提供最终 HEAD、稳定链接和只包含本次变化的简短清单。明确旧 HEAD 的视觉/试玩通过已被玩家可见文案修改取代，请项目所有者确认新横幅与急救包称呼；这不等于许可、push、PR、merge、tag 或 Release 授权。

- [ ] **Step 4: 验收后安全停止 smoke 服务**

```powershell
$listener = Get-NetTCPConnection -LocalPort $smokePort -State Listen -ErrorAction SilentlyContinue
if (-not $listener) { throw '停止前 smoke 端口已无 listener，先核查进程状态' }
if ($listener.OwningProcess -ne $smokePid) { throw 'listener PID 已变化，不得终止' }
$owner = Get-CimInstance Win32_Process -Filter "ProcessId = $smokePid"
if (-not $owner) { throw '记录的 smoke PID 已不存在' }
if ($owner.CommandLine -notlike "*$smokeRoot*" -and $owner.CommandLine -notlike '*node_modules\vite\bin\vite.js*') {
  throw '记录 PID 不再能证明属于当前 worktree，不得终止'
}
Stop-Process -Id $smokePid
Wait-Process -Id $smokePid -Timeout 10 -ErrorAction SilentlyContinue
if (Get-NetTCPConnection -LocalPort $smokePort -State Listen -ErrorAction SilentlyContinue) {
  throw 'smoke 端口仍在监听'
}
```

把结果写入 ignored `.superpowers/sdd/` 证据，不 stage、不 commit。
