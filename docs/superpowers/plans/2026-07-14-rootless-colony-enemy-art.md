# R-17「无根群落」敌人美术重定实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用七套方向中立的精细像素 spritesheet 替换当前七种非 Boss 敌人的人形/程序化外观，使它们形成统一但可凭轮廓区分的 R-17 异常生态，同时完整保留现有敌人玩法、碰撞和 fallback 语义。

**Architecture:** 保留现有七个 gameplay/fallback `TEXTURES` key，并为七套正式 PNG 新增独立 production key。敌人仍以原 key 和原初始化顺序创建物理体；production sheet 精确完整时，`src/art/enemyPresentation.js` 才通过一个“换纹理并恢复 world-space body 快照”的表现 helper 切换正式素材。这样缺失/损坏 production 不会占用 fallback key，且换图前后的 body 宽高、半径、形状与世界位置相同；raw offset 只允许为补偿新 display origin 而改变。正式 PNG 内直接包含目标可见尺寸，production runtime scale 固定为 1。玩家继续由 `characterPresentation.js` 管理，SCP-049 不变。

**Tech Stack:** Phaser 3.90、Vite 7、JavaScript ES Modules、Node.js `node:test`、OpenAI built-in `image_gen`、PNG RGBA、Git。

## Global Constraints

- 工作目录固定为 `C:\scp-survivor-ui-art`，分支固定为 `feature/ui-art-overhaul`。
- 用户已在 2026-07-14 批准 R-17 设计；这是 Level 2 视觉重定，但不得声称已经调用外部 GPT。
- 只修改 UI/Art 表现层。不得修改血量、速度、伤害、生成权重、AI、攻击间隔、掉落、胜负、时间线或存档。
- 玩家角色和 SCP-049 的素材、动画、朝向与碰撞保持不变。
- 保留 `TEXTURES.enemyInfected`、`enemyCrawler`、`enemyDrone`、`eliteRiot`、`eliteBlink`、`eliteBiomass`、`biomassChild` 的字符串值。
- 生产 spritesheet 使用独立 key；缺失、损坏或 `frameTotal !== 5` 时必须静默保留原 gameplay/fallback 纹理，不换图、不播放动画，也不得阻止敌人创建。
- `.superpowers/` 当前为用户/Agent 临时目录，不纳入任何 commit。
- 不新增运行时依赖，不修改 `package.json` 或 `package-lock.json`。
- 素材生成使用 built-in `image_gen`。每种型态单独调用一次；失败时可按同一设计定向重试，但不得静默切换到 API/CLI 模式。
- 透明度、裁切、nearest 缩放和色板量化属于确定性规范化；不得用脚本凭空绘制替代怪物或伪造四帧动作。
- 每个代码任务遵循 RED → GREEN → review → fix → verify；实现子 Agent 与审查子 Agent不得为同一个。
- 游戏人工试玩由项目所有者完成；Agent 负责自动测试、构建、静态图片检查和提供固定本地链接。
- 未经用户明确授权，不 merge、不 push、不删除 worktree/分支、不重写历史。

## Approved Roster Contract

| gameplay type | R-17 名称 | fallback key | production key | production file | frame | sheet | fps | target visible extent |
|---|---|---|---|---:|---:|---:|---:|---:|
| `infectedStaff` | 游体 | `enemy-infected` | `r17-drifter` | `r17-drifter.png` | 48×48 | 192×48 | 6 | 36px |
| `crawler` | 裂吻梭 | `enemy-crawler` | `r17-rift-skimmer` | `r17-rift-skimmer.png` | 48×48 | 192×48 | 10 | 28px |
| `drone` | 脉冲囊 | `enemy-drone` | `r17-pulse-sac` | `r17-pulse-sac.png` | 48×48 | 192×48 | 6 | 34px |
| `riotUnit` | 甲壳门 | `elite-riot` | `r17-carapace-gate` | `r17-carapace-gate.png` | 64×64 | 256×64 | 4 | 52px |
| `blinkStalker` | 缺帧体 | `elite-blink` | `r17-frame-gap` | `r17-frame-gap.png` | 64×64 | 256×64 | 8 | 44px |
| `biomass` | 母殖团 | `elite-biomass` | `r17-brood-mass` | `r17-brood-mass.png` | 64×64 | 256×64 | 4 | 56px |
| `biomassChild` | 芽体 | `biomass-child` | `r17-bud` | `r17-bud.png` | 32×32 | 128×32 | 10 | 22px |

目标尺寸只在 PNG 规范化阶段应用一次：每帧非透明 bbox 的 `max(width, height)` 对应表中 target extent，四帧使用同一个 nearest scale factor。production runtime scale 必须固定为 `1`；原 fallback 的现有 scale 行为保留到 production 换图前，不得二次缩放正式素材。

---

## Execution Preflight

- [ ] 执行 Task 1 前运行：

```powershell
git branch --show-current
git status --short --branch
git log -1 --oneline
```

- [ ] Expected: 分支为 `feature/ui-art-overhaul`；批准状态与本计划已经提交；除既有 `?? .superpowers/` 外没有未提交生产文件。若不满足，停止实施并报告，不得覆盖其他 Agent 修改。
- [ ] 把此时 HEAD 记为本轮 implementation base；最终报告同时给出该 SHA。`git diff --check 4b564e0..HEAD` 仍覆盖完整 R-17 设计、计划与实现历史。

---

## Task 1: 生成并准入七套 R-17 生产 spritesheet

**Files:**

- Create: `public/assets/art/enemies/r17-drifter.png`
- Create: `public/assets/art/enemies/r17-rift-skimmer.png`
- Create: `public/assets/art/enemies/r17-pulse-sac.png`
- Create: `public/assets/art/enemies/r17-carapace-gate.png`
- Create: `public/assets/art/enemies/r17-frame-gap.png`
- Create: `public/assets/art/enemies/r17-brood-mass.png`
- Create: `public/assets/art/enemies/r17-bud.png`
- Modify: `src/assets/manifest.js`
- Modify: `test/art-assets.test.js`
- Modify: `docs/art/asset-register.md`
- Reference only: `docs/superpowers/specs/2026-07-14-rootless-colony-enemy-art-design.md`
- Temporary, never stage: `.superpowers/sdd/r17-assets/**`

### Step 1: 写入 spritesheet 资产合同测试（RED）

- [ ] 在 `test/art-assets.test.js` 中把 `infected-staff.png` 从正式静态 `approvedImageAssets` 移除；保留文件本身不删除，但它不再进入 manifest。
- [ ] 把 `assertApprovedStaticImageAssets()` 的硬编码数量从 18 更新为新的 17 项合同，或直接断言 `approvedImageAssets.length`，但仍保留 texture key 唯一和完整路径集合检查。
- [ ] 保留 `player-opening-sheet`；把 `infected-opening-sheet` 从 `approvedCharacterSheets` 移除。
- [ ] 新增七套 `approvedEnemySheets`：

```js
const approvedEnemySheets = [
  { key: "r17-drifter", path: "assets/art/enemies/r17-drifter.png", size: [192, 48], frame: [48, 48], visibleExtent: 36 },
  { key: "r17-rift-skimmer", path: "assets/art/enemies/r17-rift-skimmer.png", size: [192, 48], frame: [48, 48], visibleExtent: 28 },
  { key: "r17-pulse-sac", path: "assets/art/enemies/r17-pulse-sac.png", size: [192, 48], frame: [48, 48], visibleExtent: 34 },
  { key: "r17-carapace-gate", path: "assets/art/enemies/r17-carapace-gate.png", size: [256, 64], frame: [64, 64], visibleExtent: 52 },
  { key: "r17-frame-gap", path: "assets/art/enemies/r17-frame-gap.png", size: [256, 64], frame: [64, 64], visibleExtent: 44 },
  { key: "r17-brood-mass", path: "assets/art/enemies/r17-brood-mass.png", size: [256, 64], frame: [64, 64], visibleExtent: 56 },
  { key: "r17-bud", path: "assets/art/enemies/r17-bud.png", size: [128, 32], frame: [32, 32], visibleExtent: 22 }
];
```

- [ ] 让 manifest 合同精确断言 `SPRITESHEET_ASSETS` 等于一个 player sheet 加七个 enemy sheets，顺序固定。
- [ ] 新增逐帧门禁 helper，输出每帧 `visiblePixels`、alpha bbox、`centerX`、`centerY`、`bottomY`、`height` 与连通分量大小。
- [ ] 对每张 R-17 sheet 断言：
  - 文件存在且整体尺寸精确；
  - 8-bit RGBA color type 6；
  - alpha 只含 `0` 或 `255`；
  - 每帧非空且不触碰画布边缘；
  - 每帧非透明颜色不超过 32；
  - 任意单像素连通分量不得存在；缺帧体允许多个分量，但每个分量至少 2px；
  - 四帧规范化 RGBA hash 必须全部唯一，拒绝 `A-B-A-B` 或非相邻复制；
  - 四帧 `centerX` 最大漂移 ≤ 2px，`centerY` 最大漂移 ≤ 2px；
  - `bottomY` 最大漂移 ≤ 2px；
  - 48/64 帧的可见高度最大差 ≤ 4px，32 帧最大差 ≤ 3px；
  - `max(visiblePixels) / min(visiblePixels) ≤ 1.20`；
  - 全部六对帧至少有 3% 可见并集像素变化，且 alpha 轮廓差异至少 1.5%；相邻循环对（0→1、1→2、2→3、3→0）另外保留循环连续性检查；
  - 每帧 `max(bbox.width, bbox.height)` 与该资产 `visibleExtent` 相差不超过 1px，证明目标显示尺寸已在 PNG 内应用且无需 runtime 二次缩放。

关键断言形状：

```js
assert.ok(Math.max(...centersX) - Math.min(...centersX) <= 2, `${key} drifts horizontally`);
assert.ok(Math.max(...bottoms) - Math.min(...bottoms) <= 2, `${key} changes hover baseline`);
assert.ok(Math.max(...areas) / Math.min(...areas) <= 1.2, `${key} breathes by scaling`);
```

- [ ] 运行：

```powershell
node --test test/art-assets.test.js
```

Expected: FAIL，至少指出七个 PNG 尚不存在以及 manifest 尚未声明七套 sheets。不得通过放宽现有静态资产门禁来消除失败。

### Step 2: 生成共同风格基准图

- [ ] 使用 `imagegen` skill 的 built-in `image_gen` 生成一张七型态 lineup；不提供第三方参考图。输出只用于风格和轮廓核对，复制到 `.superpowers/sdd/r17-assets/reference/`，不提交。
- [ ] 使用以下实际基础 prompt；执行时把完整实际 prompt 记录到 `docs/art/asset-register.md`：

```text
Use case: stylized-concept
Asset type: visual lineup reference for seven production top-down 2D pixel-art enemy sprites in an industrial containment-horror game
Primary request: exactly seven distinct legless non-humanoid castes of one original anomalous colony, arranged in one clean horizontal lineup with wide separation: pear-shaped floating drifter, flat needle-shaped rift skimmer, ring-bound pulse sac, broad crescent-armored carapace gate, discontinuous frame-gap organism, large multi-lobed brood mass, tiny tadpole-like bud
Shared identity: dark graphite and restrained dried-red tissue, dirty off-white membranes, one cyan-white core organ per caste, fragments of Foundation-like containment clamps, electrodes, cables or stabilization rings; biological horror dominates, machinery and spatial anomalies are accents
Readability: every silhouette must remain unmistakably different in grayscale and at game-sprite scale; no design may resemble a standing human, zombie, robot soldier, animal with legs or famous existing SCP
Style/medium: authentic detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, limited 32-color family palette, crisp opaque edges, no antialiasing
Camera/composition: high orthographic overhead game view, one complete isolated creature per slot, consistent lighting and material language, no overlap
Backdrop: perfectly flat uniform solid #00ff00 chroma key
Constraints: no text, labels, numbers, logos, watermark, floor, scenery, shadows, gradients, gore spray, exposed realistic organs, extra creatures or UI
Avoid: 3D render, isometric, side view, front portrait, smooth painting, photorealism, chibi, generic zombie, generic alien, tentacle blob silhouettes that all look alike
```

- [ ] 主 Agent 用 `view_image` 检查：七个灰度轮廓是否可分；青白核心是否只作为共同语汇而非唯一辨识点；是否出现人形、腿、3D/isometric 或著名 SCP 借用。
- [ ] 若不通过，针对失败项重生成基准图；不得把不合格基准继续作为七张生产图的参考。

### Step 3: 分别生成七张四帧源图

- [ ] 每种型态单独调用一次 built-in `image_gen`。每次把已通过的 lineup 作为唯一图像参考，要求精确横向四格、绿幕背景和一致中心/基线。
- [ ] 所有 prompt 共用以下 animation 约束：

```text
Asset type: four-frame source board for one production direction-neutral top-down 2D pixel-art enemy spritesheet
Input image: use the approved R-17 lineup only for family palette, materials, camera and this caste's identity
Composition: exactly four complete isolated frames of the SAME creature in one horizontal row, equal cells, identical scale, center point and hover baseline, generous separation, no borders
Animation: a subtle seamless loop made by real local articulation of membranes, tendrils, core light and attached hardware; never animate by scaling, translating, rotating or mirroring the whole body
Style: hard-edged orthographic top-down detailed pixel art, deliberate coarse clusters, maximum 32 colors, no antialiasing
Backdrop: perfectly flat uniform #00ff00 chroma key
Constraints: direction-neutral silhouette; no legs, no humanoid anatomy, no shadows, floor, text, labels, logos, watermark, soft alpha, extra creatures or scenery
Avoid: 3D, isometric, side view, smooth illustration, frame-to-frame identity drift, changing camera, changing body size, duplicated frames
```

- [ ] 每种型态追加以下 subject/motion 约束：

| file | prompt 追加内容 |
|---|---|
| `r17-drifter.png` | `pear-shaped floating flesh sac, three short lower tendrils, one restrained cyan-white core; four phases of asymmetric breathing and tendril curl; target visible silhouette about 36 logical pixels` |
| `r17-rift-skimmer.png` | `flat sharp spindle-shaped flesh body, split jaw seam, trailing neural filaments; four rapid fin-and-tail contractions without changing total length; target about 28 logical pixels` |
| `r17-pulse-sac.png` | `round membrane sac surrounding an absorbed security camera, incomplete metal stabilization ring and electrodes; four core charge phases with minor ring vibration; target about 34 logical pixels` |
| `r17-carapace-gate.png` | `broad crescent frontal carapace shielding a rear cyan-white core, thick trailing fibers and embedded containment clamps; four heavy shell-tension phases, front remains clearly readable; target about 52 logical pixels` |
| `r17-frame-gap.png` | `discontinuous slabs of dark tissue around a luminous spinal line and clean spatial voids; four offset phases where fragments reconfigure locally but center and total envelope remain stable; target about 44 logical pixels` |
| `r17-brood-mass.png` | `large multi-lobed colony around several breathing sacs, containment stakes and one dominant cyan-white core; four asynchronous lobe contractions with stable outer envelope; target about 56 logical pixels` |
| `r17-bud.png` | `tiny embryo-like bud with one long tail filament, one tiny cyan-white core and a metal tag fragment; four fast tail-wave phases; target about 22 logical pixels` |

- [ ] 将每次原始输出复制到 `.superpowers/sdd/r17-assets/sources/`，保留内置工具返回的原始路径并写入资产登记。

### Step 4: 确定性规范化，不伪造动画

- [ ] 先验证本机已确认存在的 bundled Python 和官方 helper；使用精确命令，不调用 Windows Store stub：

```powershell
$userProfile = [Environment]::GetFolderPath('UserProfile')
$python = Join-Path $userProfile '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$removeChromaKey = Join-Path $userProfile '.codex\skills\.system\imagegen\scripts\remove_chroma_key.py'
& $python $removeChromaKey `
  --help
```

- [ ] 每个源文件使用同一 helper 去绿幕，输入/输出都用绝对路径：

```powershell
$userProfile = [Environment]::GetFolderPath('UserProfile')
$python = Join-Path $userProfile '.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$removeChromaKey = Join-Path $userProfile '.codex\skills\.system\imagegen\scripts\remove_chroma_key.py'
& $python $removeChromaKey `
  --input '<absolute-source.png>' `
  --out 'C:\scp-survivor-ui-art\.superpowers\sdd\r17-assets\keyed\<name>.png' `
  --key-color '#00ff00' `
  --tolerance 36 `
  --spill-cleanup `
  --force
```

- [ ] helper 只负责色键。裁切/nearest/拼接使用已在当前 Codex Node REPL 验证可用的 bundled `sharp`（libvips 8.17.3），通过 `mcp__node_repl__js` 运行并使用绝对路径；不要尝试仓库 Node `require('sharp')`，它缺少 `detect-libc`，也不要新增依赖。
- [ ] 在 `.superpowers/sdd/r17-assets/normalize-r17.mjs` 保存可审计的临时规范化模块，并通过 `mcp__node_repl__js` 动态导入。模块必须先按源图宽度切成四个固定等宽 cell，再在每个 cell 内计算所有不透明分量的联合 bbox；不能在整图上寻找“四个分量”，否则缺帧体自身的断片会被误识别为帧。
- [ ] 临时模块公开且只公开以下接口；参数必须全部显式，禁止读取隐式 cwd：

```js
export async function normalizeR17Sheet({
  inputPath,
  outputPath,
  frameWidth,
  frameHeight,
  targetVisibleExtent
})
```

模块必须拒绝不能整除为四个 cell 的源图、任一空 cell、越界 composite、输出非精确尺寸或最终 alpha 非二值。通过 Node REPL 的实际调用形状：

```js
const { normalizeR17Sheet } = await import(
  "file:///C:/scp-survivor-ui-art/.superpowers/sdd/r17-assets/normalize-r17.mjs?run=1"
);
nodeRepl.write(await normalizeR17Sheet({
  inputPath: "C:/scp-survivor-ui-art/.superpowers/sdd/r17-assets/keyed/r17-drifter.png",
  outputPath: "C:/scp-survivor-ui-art/public/assets/art/enemies/r17-drifter.png",
  frameWidth: 48,
  frameHeight: 48,
  targetVisibleExtent: 36
}));
```
- [ ] 四帧共同计算一个 scale factor：`targetVisibleExtent / max(allFrameBboxWidths, allFrameBboxHeights)`；四帧统一 nearest 缩放，绝不逐帧 fit。之后按同一中心和 bottom baseline 放入精确 frame canvas。
- [ ] 输出流程固定为：四等宽 cell 分割 → cell 内 union alpha bbox → 一个共享 nearest scale → 同中心/基线 composite → alpha 二值化 → whole-sheet 无抖动 ≤32 色量化 → 再解码为 RGBA → 横向四帧 PNG。量化中间文件可以是 indexed PNG，但最终文件必须恢复为 8-bit RGBA color type 6。
- [ ] 如果 bundled Python/helper 或 Node REPL `sharp` gate 任一失败，停止在本步骤并报告；不得进入图片生成后的“手工凑图”，不得静默切换到 OpenAI API/CLI。
- [ ] 只允许清除绿边、孤立噪点和越界杂像素；不得用脚本绘制新肢体、改变轮廓含义或复制同一帧冒充动作。
- [ ] 输出七个正式 PNG 到 `public/assets/art/enemies/`。

### Step 5: 更新 manifest（GREEN）

- [ ] 在 `src/assets/manifest.js` 中从 `IMAGE_ASSETS` 移除：

```js
{ key: TEXTURES.enemyInfected, path: "assets/art/characters/infected-staff.png" }
```

- [ ] `TEXTURES.infectedOpeningSheet` 字符串常量暂时保留，避免无必要 key 删除；但不再 preload 或使用该人形 sheet。
- [ ] 在 `TEXTURES` 中新增七个 production key；现有 gameplay/fallback key 的字符串值保持不变：

```js
r17Drifter: "r17-drifter",
r17RiftSkimmer: "r17-rift-skimmer",
r17PulseSac: "r17-pulse-sac",
r17CarapaceGate: "r17-carapace-gate",
r17FrameGap: "r17-frame-gap",
r17BroodMass: "r17-brood-mass",
r17Bud: "r17-bud",
```

- [ ] 将 `SPRITESHEET_ASSETS` 改成 player + 七套独立 production R-17 key：

```js
export const SPRITESHEET_ASSETS = [
  {
    key: TEXTURES.playerOpeningSheet,
    path: "assets/art/characters/player-opening-sheet.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 }
  },
  {
    key: TEXTURES.r17Drifter,
    path: "assets/art/enemies/r17-drifter.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 }
  },
  {
    key: TEXTURES.r17RiftSkimmer,
    path: "assets/art/enemies/r17-rift-skimmer.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 }
  },
  {
    key: TEXTURES.r17PulseSac,
    path: "assets/art/enemies/r17-pulse-sac.png",
    frameConfig: { frameWidth: 48, frameHeight: 48 }
  },
  {
    key: TEXTURES.r17CarapaceGate,
    path: "assets/art/enemies/r17-carapace-gate.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.r17FrameGap,
    path: "assets/art/enemies/r17-frame-gap.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.r17BroodMass,
    path: "assets/art/enemies/r17-brood-mass.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  },
  {
    key: TEXTURES.r17Bud,
    path: "assets/art/enemies/r17-bud.png",
    frameConfig: { frameWidth: 32, frameHeight: 32 }
  }
];
```

原因：production 与 gameplay/fallback 分离后，加载到三帧、五帧或其他不完整 sheet 也不会占用程序化 key；表现适配器只有在 `frameTotal === 5` 时换图。影响只限敌人纹理来源；验证由 manifest、精确 frameTotal、PNG、body 快照、fallback 和完整构建覆盖。该共享文件变更已包含在用户批准的设计范围内。

### Step 6: 完成来源和许可登记

- [ ] 在 `docs/art/asset-register.md` 表格追加七行，类型标为 `spritesheet PNG`，准入先写“R-17 动画门禁候选”。
- [ ] 同步更新登记表开头的素材总数和准入说明，避免继续写成“20 项文件”。不覆盖旧素材历史记录。
- [ ] 每行记录 built-in `image_gen`、实际日期、原始生成路径、最终路径、色键/裁切/nearest/alpha/量化处理、未使用第三方图像、商业发布前复核 OpenAI 输出权利。
- [ ] R-17 是原创异常，不登记为现有 SCP 编号；但明确“项目整体 SCP 衍生发布仍需按 `docs/licensing-and-commercialization.md` 复核 CC BY-SA 义务”。
- [ ] 追加一份实际 lineup prompt 和七份实际 production prompt；实际重试也必须登记，不能只记录成功版本。

### Step 7: 视觉与自动门禁

- [ ] 用 `view_image` 逐张查看原始分辨率七张 sheet，并生成一张仅用于检查的放大 contact sheet 放在 `.superpowers/sdd/r17-assets/review/`。
- [ ] 主 Agent 核对每张首帧在不看颜色时仍能对应玩法职责；重点拒绝“七个相似肉团”、3D/isometric、黑白毛边、帧间整体缩放、意义不明的设备碎片。
- [ ] 调度独立视觉审查 Agent，输入设计文档、七张 PNG 和测试输出。审查必须逐项给出 Critical / Important / Minor，不得只说“看起来不错”。
- [ ] 修复所有 Critical/Important 后重新运行：

```powershell
node --test test/art-assets.test.js
git diff --check -- src/assets/manifest.js test/art-assets.test.js docs/art/asset-register.md
```

Expected: tests PASS；`git diff --check` 无输出。

### Step 8: 提交素材批次

- [ ] 确认 staged 文件只含七张 PNG、manifest、资产测试和资产登记；不得包含 `.superpowers/`。
- [ ] Commit：

```powershell
git add public/assets/art/enemies src/assets/manifest.js test/art-assets.test.js docs/art/asset-register.md
git commit -m "art: add R-17 enemy sprite family"
```

---

## Task 2: 新增方向中立敌人表现适配器

**Files:**

- Create: `src/art/enemyPresentation.js`
- Create: `test/enemy-presentation.test.js`
- Modify: `src/art/characterPresentation.js`
- Modify: `test/character-presentation.test.js`
- Modify: `src/scenes/PreloadScene.js`
- Modify: `test/presentation-rules.test.js`

### Step 1: 写适配器合同测试（RED）

- [ ] 新建 `test/enemy-presentation.test.js`，用无 Phaser 渲染器的 scene/sprite stub 覆盖：
  - `ENEMY_PRESENTATION` 精确包含七种 gameplay type；
  - 每种映射到正确的独立 production `TEXTURES` key、frame size 和 fps；
  - 只有 Phaser `frameTotal === 5`（四帧 + `__BASE`）才算完整；缺失、4（仅三帧）、6（额外帧）都拒绝；
  - 七个动画注册完整、使用 frame 0..3、`repeat: -1`，重复调用幂等；
  - production 不完整时，`applyEnemyPresentation()` 不调用 `setTexture` / `setScale` / `play`，原 fallback texture 和原 scale 原样保留；
  - production 完整时换为 production key、scale 精确为 1，并播放对应循环；
  - 换图前后 game object x/y、body world position、width、height、radius、`isCircle` 完全相同；raw offset 允许为补偿新 display origin 而变化，但换算后的 world position 不变；
  - 用七组不同 body 快照覆盖 infected、crawler、drone、三个 elite 和 child 的矩形/圆形、不同 scale 与非零 offset；
  - 未知类型不换纹理、不缩放、不播放；
  - 源文件不得写入 health、speed、damage、behavior、timer、velocity 或 body setter。

测试配置断言：

```js
assert.deepEqual(ENEMY_PRESENTATION.infectedStaff, {
  productionTextureKey: TEXTURES.r17Drifter,
  animationKey: "r17-drifter-loop",
  frameWidth: 48,
  frameHeight: 48,
  frameRate: 6
});
```

- [ ] 运行：

```powershell
node --test test/enemy-presentation.test.js
```

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/art/enemyPresentation.js`。

### Step 2: 实现 world-space body 保持 helper 与最小敌人表现适配器（GREEN）

- [ ] 在 `src/art/presentationRules.js` 新增 `applyTextureAndScalePreservingBody(gameObject, textureKey, scale)`。它必须先调用一次 `body.updateFromGameObject()`，把紧邻调用前的既有 `setScale(1.2)` 同步为 Phaser 下一 physics preUpdate 本来会得到的有效碰撞基线；然后才在 `setTexture` 前捕获 `gameObject.x/y`、`body.position.x/y`、`body.width/height`、`isCircle` 和 `radius`。换图/缩放后重新计算 source size 与 offset，使 world-space body 矩形完全恢复。不得把新纹理宽高当作碰撞规格。

关键实现：

```js
export function applyTextureAndScalePreservingBody(gameObject, textureKey, scale = 1) {
  const body = gameObject.body;
  if (!body) {
    gameObject.setTexture(textureKey, 0);
    gameObject.setScale(scale);
    return gameObject;
  }

  // Match the effective body geometry Phaser would establish at the next
  // Arcade Body preUpdate after any immediately preceding setScale().
  body.updateFromGameObject();

  const snapshot = {
    x: body.position.x,
    y: body.position.y,
    width: body.width,
    height: body.height,
    isCircle: body.isCircle,
    radius: body.radius
  };

  gameObject.setTexture(textureKey, 0);
  gameObject.setScale(scale);

  const scaleX = Math.abs(gameObject.scaleX) || 1;
  const scaleY = Math.abs(gameObject.scaleY) || 1;
  body.sourceWidth = snapshot.width / scaleX;
  body.sourceHeight = snapshot.height / scaleY;
  body.offset.set(
    gameObject.displayOriginX + (snapshot.x - gameObject.x) / gameObject.scaleX,
    gameObject.displayOriginY + (snapshot.y - gameObject.y) / gameObject.scaleY
  );
  body.updateFromGameObject();
  body.isCircle = snapshot.isCircle;
  body.radius = snapshot.radius;
  return gameObject;
}
```

- [ ] `test/presentation-rules.test.js` 必须先为 helper 写 RED 测试，并比较有效 world-space body；测试至少覆盖“`setScale(1.2)` 已改 GameObject 但 body 仍是旧 `_sx/_sy`”的精英顺序，证明 helper 先同步到旧实现下一次 physics preUpdate 的宽高再换图。如果 stub 的 `setTexture()` 会改变 display origin/body source size，测试也必须模拟这一点，避免只在“setTexture 什么都不做”的假 stub 上通过。
- [ ] 新建 `src/art/enemyPresentation.js`，只导入 `TEXTURES` 和 `applyTextureAndScalePreservingBody`。
- [ ] 使用以下公开接口；不要添加每帧 `update`：

```js
import { TEXTURES } from "../assets/manifest.js";
import { applyTextureAndScalePreservingBody } from "./presentationRules.js";

const entry = (config) => Object.freeze(config);

export const ENEMY_PRESENTATION = Object.freeze({
  infectedStaff: entry({
    productionTextureKey: TEXTURES.r17Drifter,
    animationKey: "r17-drifter-loop",
    frameWidth: 48,
    frameHeight: 48,
    frameRate: 6
  }),
  crawler: entry({
    productionTextureKey: TEXTURES.r17RiftSkimmer,
    animationKey: "r17-rift-skimmer-loop",
    frameWidth: 48,
    frameHeight: 48,
    frameRate: 10
  }),
  drone: entry({
    productionTextureKey: TEXTURES.r17PulseSac,
    animationKey: "r17-pulse-sac-loop",
    frameWidth: 48,
    frameHeight: 48,
    frameRate: 6
  }),
  riotUnit: entry({
    productionTextureKey: TEXTURES.r17CarapaceGate,
    animationKey: "r17-carapace-gate-loop",
    frameWidth: 64,
    frameHeight: 64,
    frameRate: 4
  }),
  blinkStalker: entry({
    productionTextureKey: TEXTURES.r17FrameGap,
    animationKey: "r17-frame-gap-loop",
    frameWidth: 64,
    frameHeight: 64,
    frameRate: 8
  }),
  biomass: entry({
    productionTextureKey: TEXTURES.r17BroodMass,
    animationKey: "r17-brood-mass-loop",
    frameWidth: 64,
    frameHeight: 64,
    frameRate: 4
  }),
  biomassChild: entry({
    productionTextureKey: TEXTURES.r17Bud,
    animationKey: "r17-bud-loop",
    frameWidth: 32,
    frameHeight: 32,
    frameRate: 10
  })
});

function hasProductionSheet(scene, config) {
  return Boolean(
    scene?.textures?.exists(config.productionTextureKey)
    && scene.textures.get(config.productionTextureKey)?.frameTotal === 5
  );
}

export function registerEnemyAnimations(scene) {
  for (const config of Object.values(ENEMY_PRESENTATION)) {
    if (!hasProductionSheet(scene, config) || scene.anims.exists(config.animationKey)) continue;
    scene.anims.create({
      key: config.animationKey,
      frames: scene.anims.generateFrameNumbers(config.productionTextureKey, { start: 0, end: 3 }),
      frameRate: config.frameRate,
      repeat: -1
    });
  }
}

export function applyEnemyPresentation(scene, enemy, enemyType) {
  const config = ENEMY_PRESENTATION[enemyType];
  if (!config || !enemy) return enemy;
  if (!hasProductionSheet(scene, config)) return enemy;
  applyTextureAndScalePreservingBody(enemy, config.productionTextureKey, 1);
  enemy.setFlipX?.(false);
  if (scene.anims?.exists(config.animationKey)) enemy.play(config.animationKey, true);
  return enemy;
}
```

- [ ] 不导出或编写 `syncEnemyPresentation`；四帧方向中立循环只需创建时播放一次，避免新的每帧工作和方向状态。

### Step 3: 把角色适配器收窄为玩家专用

- [ ] 从 `src/art/characterPresentation.js` 删除 `infectedStaff` 的 `CHARACTER_SHEETS` 条目和 `OPENING_ANIMATED_ENEMY_TYPES` 导出。
- [ ] `syncCharacterPresentation(scene)` 只保留：

```js
export function syncCharacterPresentation(scene) {
  syncSprite(scene, scene.player, "player");
}
```

- [ ] 不改变玩家的四方向、开火朝向、flip 或 hit 逻辑。
- [ ] 更新 `test/character-presentation.test.js`：动画数从 24 改为 12；删除 infected 人形动画断言；保留玩家右向镜像、上下/左右尺寸不变、fallback 与 body 不变断言。
- [ ] missing sheet warning 改为只期望 `player-opening-sheet` 一次。

### Step 4: 在 PreloadScene 注册敌人循环

- [ ] `src/scenes/PreloadScene.js` 新增：

```js
import { registerEnemyAnimations } from "../art/enemyPresentation.js";
```

- [ ] 在 `generateFallbackTextures(this)` 之后依次调用：

```js
registerOpeningCharacterAnimations(this);
registerEnemyAnimations(this);
```

原因：fallback factory 先补齐七个 gameplay key；动画登记只检查七个独立 production key 的 `frameTotal === 5`。production 缺失或帧数异常时 gameplay key 已可用，且不会被错误 sheet 占用。验证覆盖缺失、3 帧、4 帧、5 帧、幂等和 Preload 启动顺序。

### Step 5: focused verification 与审查

- [ ] 运行：

```powershell
node --test test/enemy-presentation.test.js test/character-presentation.test.js test/presentation-rules.test.js
```

Expected: PASS。

- [ ] 调度独立代码审查 Agent，重点检查：适配器是否只写 display state；玩家行为是否完全保留；是否引入每帧敌人同步；fallback 是否会产生 missing animation 错误。
- [ ] 修复所有 Critical/Important 后重跑 focused tests。

### Step 6: 提交动画适配器

- [ ] Commit：

```powershell
git add src/art/enemyPresentation.js src/art/characterPresentation.js src/scenes/PreloadScene.js test/enemy-presentation.test.js test/character-presentation.test.js test/presentation-rules.test.js
git commit -m "feat(art): register direction-neutral R-17 animations"
```

---

## Task 3: 接入所有敌人创建与复制路径并保持碰撞体

**Files:**

- Modify: `src/scene/world.js`
- Modify: `src/scene/enemies.js`
- Modify: `test/enemy-presentation.test.js`
- Modify: `test/character-presentation.test.js`
- Modify: `test/presentation-rules.test.js`
- Modify: `test/enemy-replication.test.js`

### Step 1: 写创建路径与物理合同测试（RED）

- [ ] 在 `test/enemy-presentation.test.js` 增加七种完整 production sheet 换图和七种不完整 production 保留 fallback 的矩阵测试。
- [ ] 在 `test/presentation-rules.test.js` / `test/character-presentation.test.js` 更新静态集成合同：
  - `world.createGroups()` 不再把 `enemy-infected` 替换为 `infected-opening-sheet`；
  - 原 body 分支必须保持：仅 `infectedStaff` 调用 `centerCircularBody`，crawler 继续 `enemy.setCircle(config.bodyRadius)`；
  - box body 继续调用 `enemy.body.setSize(config.bodySize, config.bodySize)`；
  - 无显式 bodyShape 的 elite/child 继续在 fallback texture 上执行 `enemy.body.setSize(enemy.width, enemy.height)`；
  - infected 继续使用 `applyDisplayScalePreservingBody(..., 1.15)`，elite 继续在换图前执行既有 `enemy.setScale(1.2)`；
  - `initializeEnemyFromConfig()` 必须在上述旧 body/scale 初始化完成之后调用 `applyEnemyPresentation(this, enemy, config.type)`；
  - 不存在 `body.setOffset`；
  - SCP-049 仍使用 `centerCircularBody(boss, 18)` 与原显示 scale。
- [ ] 在 `test/enemy-replication.test.js` 增加：普通、精英和 `biomassChild` clone 仍先使用原 fallback key，且最终都经过 `initializeEnemyFromConfig()`，因此不需要在复制模块重复实现 production 换图。
- [ ] 增加源码合同：`updateBiomassElite()` 只保留追击，不得出现 `setScale`、pulse scale 或 body 写入；这明确删除现有第 535–536 行逐帧 pulse。
- [ ] 运行：

```powershell
node --test test/enemy-presentation.test.js test/presentation-rules.test.js test/character-presentation.test.js test/enemy-replication.test.js
```

Expected: FAIL，指出旧 infected create callback、spawn 仍解析人形 sheet、未调用新适配器或 biomass 仍逐帧 `setScale(pulse)`。

### Step 2: 移除 infected 人形纹理替换路径

- [ ] `src/scene/world.js` 继续保留 `resolveCharacterTexture` 导入，但它只能供 `createPlayer()` 使用。
- [ ] 把 `createGroups()` 简化为：

```js
this.enemies = this.physics.add.group({
  classType: Phaser.Physics.Arcade.Sprite
});
```

- [ ] 保留 player 创建中的 `resolveCharacterTexture(this, "player", TEXTURES.player)`；这里只删除 infected createCallback，不删除 player 正式 sheet 或 player 接口。

### Step 3: 保持 fallback 创建 key，并在初始化末尾换 production

- [ ] `src/scene/enemies.js` 导入：

```js
import { TEXTURES } from "../assets/manifest.js";
import { applyEnemyPresentation } from "../art/enemyPresentation.js";
```

- [ ] 删除 `src/scene/enemies.js` 对 `resolveCharacterTexture` 的导入；该函数此后只在 `world.createPlayer()` 使用。

- [ ] `spawnEnemyAtEdge()` 删除 `resolveCharacterTexture()`，恢复使用 gameplay config 的原 fallback key：

```js
const enemy = this.enemies.create(x, y, config.textureKey);
```

- [ ] `spawnEliteAtEdge()` 可把 raw string 改为等价的稳定 `TEXTURES` 常量，但仍创建 fallback key：

```js
const textureKey = type === "riotUnit"
  ? TEXTURES.eliteRiot
  : type === "blinkStalker"
    ? TEXTURES.eliteBlink
    : TEXTURES.eliteBiomass;
```

未知 elite 仍在前面的 `if (!config) return null` 被拒绝。

- [ ] `spawnBiomassChild()` 使用：

```js
const child = this.enemies.create(
  x,
  y,
  TEXTURES.biomassChild
);
```

- [ ] `src/scene/enemyReplication.js` 不修改。它现有的普通/child clone 都调用 `initializeEnemyFromConfig()`，elite clone 调用 `spawnEliteAtEdge()`；测试证明三条路径都会在 body 建立后进入统一表现适配器。

### Step 4: 在旧 body/scale 初始化后一次性应用表现

- [ ] 不重写现有 circle/box/default body 分支，不删除 infected 专用 scale，也不删除 elite 初始 `setScale(1.2)`；这些操作都发生在 fallback texture 上，构成换图前的碰撞基线。
- [ ] 在全部 body、fallback scale 与 elite 字段初始化完成后、destroy listener 之前调用：

```js
applyEnemyPresentation(this, enemy, config.type);
```

- [ ] 把 `updateBiomassElite()` 改为只调用 `physics.moveToObject(...)`，明确删除：

```js
const pulse = 1.16 + Math.sin(this.elapsedSurvivalMs * 0.008) * 0.07;
enemy.setScale(pulse);
```

- [ ] 不在 `updateEnemies()`、`updateRiotElite()`、`updateBlinkElite()` 或 `updateBiomassElite()` 中新增任何 scale/flip/rotation。方向中立动画由创建时一次播放。

### Step 5: focused verification 与审查

- [ ] 运行：

```powershell
node --test test/enemy-presentation.test.js test/presentation-rules.test.js test/character-presentation.test.js test/enemy-replication.test.js
```

Expected: PASS。

- [ ] 提交前调度独立代码审查 Agent，审查当前任务实际 worktree diff：

```powershell
git diff HEAD -- src/scene/world.js src/scene/enemies.js test/enemy-presentation.test.js test/character-presentation.test.js test/presentation-rules.test.js test/enemy-replication.test.js
```

重点审查：
  - 所有 spawn/clone 路径是否覆盖；
  - body 半径/尺寸/位置是否保持；
  - 是否误改 balance、AI 或 elite state；
  - fallback 静态纹理是否仍可创建并保持旧显示大小。
- [ ] 修复所有 Critical/Important 并重跑 focused tests。

### Step 6: 提交接入批次

- [ ] Commit：

```powershell
git add src/scene/world.js src/scene/enemies.js test/enemy-presentation.test.js test/character-presentation.test.js test/presentation-rules.test.js test/enemy-replication.test.js
git commit -m "feat(art): apply R-17 presentation to enemy spawns"
```

---

## Task 4: 把甲壳门正面提示改为装甲弧

**Files:**

- Modify: `src/art/enemyPresentation.js`
- Modify: `src/scene/enemies.js`
- Modify: `test/enemy-presentation.test.js`

### Step 1: 写纯表现几何测试（RED）

- [ ] 在 `test/enemy-presentation.test.js` 为以下 helper 写测试：

```js
getRiotArmorArcPresentation(120)
// => {
//   radius: 28,
//   startAngle: -Math.PI / 3,
//   endAngle: Math.PI / 3
// }
```

- [ ] 断言 90°、120°、180° 输入只影响弧角，不返回或修改 damage multiplier。
- [ ] 源码合同断言 `updateEliteVisuals()` 使用 `enemy.facingAngle` 设置 rotation，并且没有写 `frontDamageMultiplier`、`sideDamageMultiplier`、`rearDamageMultiplier`。
- [ ] 运行：

```powershell
node --test test/enemy-presentation.test.js
```

Expected: FAIL，因为 helper 尚不存在且仍使用 triangle indicator。

### Step 2: 实现装甲弧 helper

- [ ] 在 `src/art/enemyPresentation.js` 增加：

```js
export function getRiotArmorArcPresentation(frontArcDegrees = 120) {
  const halfArc = (frontArcDegrees * Math.PI) / 360;
  return Object.freeze({
    radius: 28,
    startAngle: -halfArc,
    endAngle: halfArc
  });
}
```

### Step 3: 用 Graphics 替换三角盾牌

- [ ] `attachEliteVisuals()` 中 riot 分支从 `this.add.triangle(...)` 改为 `this.add.graphics()`；仍命名为 `enemy.shieldIndicator`，保留 destroy 清理路径。
- [ ] `updateEliteVisuals()` 读取 `enemy.frontArcDegrees` 和 `enemy.facingAngle`：

```js
if (enemy.shieldIndicator) {
  const arc = getRiotArmorArcPresentation(enemy.frontArcDegrees);
  enemy.shieldIndicator.clear();
  enemy.shieldIndicator.lineStyle(3, 0x9fc7da, 0.95);
  enemy.shieldIndicator.beginPath();
  enemy.shieldIndicator.arc(
    0,
    0,
    arc.radius,
    arc.startAngle,
    arc.endAngle,
    false
  );
  enemy.shieldIndicator.strokePath();
  enemy.shieldIndicator.lineStyle(1, 0x5f8294, 0.8);
  enemy.shieldIndicator.lineBetween(22, -11, 22, 11);
  enemy.shieldIndicator.setPosition(enemy.x, enemy.y);
  enemy.shieldIndicator.setRotation(enemy.facingAngle);
}
```

- [ ] 主体 sprite 保持方向中立，不随 `facingAngle` 旋转。装甲弧只作为既有正面防御的可视化读取器。

### Step 4: 验证与提交提示批次

- [ ] 运行：

```powershell
node --test test/enemy-presentation.test.js test/presentation-rules.test.js
```

Expected: PASS。

- [ ] 独立代码审查确认弧线与 gameplay damage arc 使用同一 `frontArcDegrees` 输入，但没有反向写玩法状态。
- [ ] Commit：

```powershell
git add src/art/enemyPresentation.js src/scene/enemies.js test/enemy-presentation.test.js
git commit -m "feat(art): clarify R-17 carapace defense arc"
```

---

## Task 5: 完整验证、最终审查与用户试玩交接

**Files:**

- Verify only: all files changed since plan execution began
- Temporary, never stage: `.superpowers/sdd/r17-final-review/**`

### Step 1: 全量自动验证

- [ ] 从干净 Node 进程运行：

```powershell
node --test
npm run build
git diff --check 4b564e0..HEAD
git status --short --branch
```

Expected:

- `node --test` 全部通过；记录准确测试数量，不沿用旧的 82/82。
- `npm run build` exit 0；只接受已知 Vite large chunk warning，不接受新增构建错误。
- `git diff --check` 无输出。
- status 只允许既有 `?? .superpowers/`；不得有未提交的生产文件。

### Step 2: 最终独立审查

- [ ] 使用 `superpowers:requesting-code-review` 调度最终代码审查，base 为执行计划前的 commit，head 为当前 HEAD。
- [ ] 审查者必须核对设计文档、四个实施 commit、七张 PNG、资产登记、所有测试输出和 build 输出。
- [ ] 必查项：
  - 七种轮廓确实不同，不是统一肉团换颜色；
  - player 和 SCP-049 diff 为零或只有测试引用调整；
  - `src/config/balance.js`、timeline、combat 伤害逻辑无修改；
  - 所有 texture key 与 fallback 仍稳定；
  - 没有方向 flip/rotation/scale 更新；
  - 没有黑边、绿边、软 alpha、空帧、错误帧尺寸；
  - asset register 包含真实 prompts、处理、权利与准入状态。
- [ ] 若有 Critical/Important，回到对应任务修复、focused tests、全量测试、build，并单独提交 `fix(art): ...`；然后重新审查。不得把未解决问题降为“试玩再说”。

### Step 3: 启动固定端口供用户试玩

- [ ] 只有自动门禁和最终审查通过后，启动：

```powershell
npm run dev -- --host 127.0.0.1 --port 64126 --strictPort
```

- [ ] 如果 64126 被占用，只读确认占用进程；不得结束未知进程。向用户报告冲突后再决定端口。
- [ ] 给用户固定链接 `http://localhost:64126/`，明确人工试玩由用户执行。
- [ ] 请用户按下列清单验收，不代替用户操作浏览器：
  - 开局 0–60 秒游体是否已替代人形感染者；
  - 裂吻梭、脉冲囊、甲壳门、缺帧体、母殖团、芽体能否仅凭轮廓区分；
  - 敌人从左右移动切到上下移动时是否完全不再缩小；
  - 脉冲囊在开火前是否能识别为远程单位；
  - 甲壳门装甲弧是否与冲锋/正面方向一致；
  - 缺帧体瞬移、母殖团分裂和芽体生成后素材是否持续正确；
  - 高密度、停电、低生命、暂停恢复、Boss 阶段是否仍能看清玩家与危险提示；
  - 控制台是否有 missing texture、duplicate animation 或 runtime error。

### Step 4: 根据用户反馈收尾

- [ ] 若用户指出视觉问题，先用 `superpowers:systematic-debugging` 区分素材问题、缩放问题、层级问题或动画问题，再做最小修复；不要直接重做全部七种。
- [ ] 用户明确通过后，停止 dev server（若由 Agent 启动），重新运行 `git status --short --branch`。
- [ ] 最终报告：分支、HEAD、四个主要 commits、准确测试数量、build 产物名、`git diff --check`、最终 status、已知非阻塞项、未 merge/未 push。
- [ ] 使用 `superpowers:finishing-a-development-branch` 给出集成选项，但未经用户明确授权不得 merge 或 push。

## Plan Completion Criteria

- 七种非 Boss 敌人全部使用方向中立四帧生产 spritesheet，玩家和 SCP-049 不变。
- 运行时不根据敌人移动方向执行 flip、rotation 或 scale。
- fallback 静态纹理仍可创建所有敌人，且物理体几何和玩法状态不变。
- 甲壳门正面装甲弧准确读取既有 `facingAngle` / `frontArcDegrees`，不改减伤计算。
- 资产尺寸、alpha、色板、帧稳定性、来源与许可记录全部通过门禁。
- focused tests、全量 `node --test`、`npm run build`、`git diff --check`、独立代码/视觉审查全部通过。
- 项目所有者完成固定链接人工试玩并明确接受，或留下具体可复现反馈进入修复循环。
