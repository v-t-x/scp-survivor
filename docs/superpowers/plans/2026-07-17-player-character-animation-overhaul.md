# 玩家角色与动画重制实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变玩法、攻击、碰撞、存档和胜负语义的前提下，把默认玩家替换为一名成年女性基金会异常响应干员的 64×64、四真实方向、120 帧精细像素动画，并保留完整旧角色 fallback。

**Architecture:** `src/art/characterPresentation.js` 继续作为唯一角色表现入口，新增按角色 ID 注册的只读配置、纯函数动作分类器和原子动画注册；`src/scene/world.js` 只消费解析出的纹理与显示缩放，仍先建立 24×24 Arcade Body，再走现有保体缩放路径。素材按“三剪影 → 单方向真实游戏原型 → 四方向完整表”推进，旧 `player-opening-sheet` 是一级动画 fallback，`player.png` 是二级静态 fallback。

**Tech Stack:** Phaser 3.90、Vite 7、JavaScript ES Modules、Node.js `node:test`、Python 3 + Pillow、built-in `image_gen`、本地 chroma-key helper、浏览器 960×540 smoke。

## Global Constraints

- 只在 `C:\scp-survivor-ui-art` 的 `feature/ui-art-overhaul` worktree 工作；执行开始时重新记录分支、HEAD、远端 ahead/behind 和状态。
- `.superpowers/` 始终是本地审计目录，绝不暂存；所有 `git add` 都必须使用显式文件清单。
- 不 merge、不 push、不删除分支或 worktree、不重写历史、不创建 release。
- 第一阶段只做玩家角色与动画；不做升级 UI、地图、掉落物、HUD、敌人、Boss 或后续统一润色。
- 角色是成年女性基金会异常响应干员；精细像素风；允许适度二次元化，但不得使用校服、偶像、泳装、夸张身体比例或 Q 版大头。
- 每帧固定 64×64 RGBA；游戏内可见人物高度 44–50 像素；alpha 只能为 0 或 255；整表最多 32 个不透明 RGB 色。
- 完整表固定 1920×256、120 帧；行顺序 `down,left,right,up`；每行列顺序 `idle 0–3`、`forward 4–9`、`backward 10–15`、`strafeLeft 16–21`、`strafeRight 22–27`、`hit 28–29`。
- 四个方向必须原生绘制；生产 `right` 不得镜像 `left`，运行时生产角色始终 `flipX=false`。
- 面朝只读取成功提交攻击后留下的 `playerFacingAngle`；WASD 速度只选择待机、前进、后退、左横移或右横移，不写回任何玩法状态。
- 停止阈值沿用当前语义：`velocity.lengthSq() <= 1` 为 `idle`；受击覆盖持续 120ms，结束后立即恢复由面朝与速度决定的动作。
- 新角色显示缩放为 `1.0`；旧动画表和旧静态图 fallback 保持 `1.2`；三条路径都必须保持玩家 Arcade Body 为 24×24。
- 新表缺失、不是精确 120 帧或动画注册抛错时，游戏必须启动并回退；每个失败 sheet key 每次 AnimationManager 生命周期只警告一次。
- 动画注册必须事务化；失败时删除本次创建的全部生产动画 key，不留下半注册动画、对象、计时器或监听器。
- 不新增角色选择 UI、角色技能、角色存档字段、姓名、肖像或背景故事。
- 不恢复悬浮武器、延迟装具或遮挡人物的额外模块；人物帧只包含紧凑制式持枪轮廓，不按三种武器生产三套角色动画。
- 用户负责三次主观视觉验收；Agent 负责 TDD、资源合同、自动测试、生产构建、独立审查、diff check、浏览器 smoke 和素材来源登记。
- 用户未明确接受当前视觉门时，暂停后续素材生产，只修复当前门内问题。

## 共享文件变更门禁

`src/assets/manifest.js` 是高冲突共享接口。本阶段修改它的唯一原因是声明新角色 spritesheet key/path/frameConfig；不改 Preload 循环、不改 fallback factory 公共合同、不改任何既有 key。影响范围限于多 preload 一张 PNG；验证方法是 manifest 唯一性测试、缺失资源 fallback 测试、启动 console 检查和完整 build。开始该文件的实施任务即视为执行已批准计划；若执行时 Project Lead 未明确批准本计划，必须停在只读状态。

---

## 文件与职责映射

| 路径 | 操作 | 单一职责 |
|---|---|---|
| `scripts/art/build_player_character_assets.py` | 新建 | 从透明剪影或固定 6×6 动作板确定性归一化、组装 64×64 角色帧和 1920×256 表 |
| `scripts/art/test_player_character_assets.py` | 新建 | 对组装器做合成 fixture、参数失败、确定性、方向顺序和 prototype/final 模式测试 |
| `test/player-character-assets.test.js` | 新建 | 锁定仓库内 prototype/final PNG、manifest、帧几何、色板、alpha、基线、真实右向和动作差异 |
| `src/assets/manifest.js` | 修改 | 新增默认干员 sheet key，并在相应视觉门后声明 prototype/final 精确路径和 64×64 frameConfig |
| `src/art/characterPresentation.js` | 修改 | 只读角色 registry、动作分类、原子动画注册、两级 fallback、运行时同步 |
| `src/scene/world.js` | 修改 | 按默认角色 ID 解析纹理/缩放，继续创建相同 24×24 body |
| `test/character-presentation.test.js` | 修改 | 锁定 registry、动作投影、hit 覆盖、无镜像、原子回滚、warn-once、fallback 链和保体合同 |
| `test/art-assets.test.js` | 修改 | 保留既有素材门禁，并断言新 key 不与旧 key/R-17 key 冲突 |
| `test/presentation-rules.test.js` | 修改 | 锁定 world 仍使用 `applyDisplayScalePreservingBody`，且不改通用敌人/Boss scale 常量 |
| `public/assets/art/characters/player-response-operative-prototype.png` | Gate 2 临时新增、Gate 3 删除 | 仅承载通过用户验收的单方向动作原型和旧表兼容行 |
| `public/assets/art/characters/player-response-operative.png` | Gate 3 新建 | 最终 1920×256、120 帧生产角色表 |
| `docs/art/asset-register.md` | 修改 | 记录三剪影、原型、完整表的工具、逐字 prompt、输入、后处理、SHA-256、许可证、商业状态、选中/拒绝原因 |
| `.superpowers/sdd/player-character/` | 本地生成、不暂存 | raw/cutout、contact sheet、截图、console/body 快照、审查记录和固定状态驱动 |

不修改：`src/scenes/PreloadScene.js`、`src/scenes/preloadOrchestration.js`、`src/assets/fallbackTextureFactory.js`、`src/main.js`、武器/伤害/移动/存档代码。

## 精确运行时接口

`src/art/characterPresentation.js` 必须导出以下接口，后续任务只依赖这些名称：

```js
export const DEFAULT_CHARACTER_ID = "foundation-response-operative";

export const CHARACTER_PROFILES = Object.freeze({
  [DEFAULT_CHARACTER_ID]: Object.freeze({
    sheetKey: TEXTURES.playerResponseOperativeSheet,
    fallbackSheetKey: TEXTURES.playerOpeningSheet,
    fallbackTextureKey: TEXTURES.player,
    frameWidth: 64,
    frameHeight: 64,
    frameCount: 120,
    displayScale: 1,
    fallbackDisplayScale: 1.2
  })
});

getPlayerMotion({ velocityX, velocityY, facingAngle }) -> PlayerMotion
getCharacterAnimationKey({ characterId, motion, facing }) -> string
registerOpeningCharacterAnimations(scene) -> void
resolveCharacterPresentation(scene, characterId = DEFAULT_CHARACTER_ID) -> CharacterPresentation
syncCharacterPresentation(scene) -> void
```

`resolveCharacterPresentation()` 的返回值固定为：

```js
{
  characterId: "foundation-response-operative",
  textureKey: "player-response-operative-sheet" | "player-opening-sheet" | "player-rect",
  animationFamily: "production" | "legacy" | "static",
  displayScale: 1 | 1.2
}
```

生产动作范围固定为：

```js
const PRODUCTION_MOTIONS = Object.freeze({
  idle: Object.freeze({ start: 0, end: 3, frameRate: 4, repeat: -1 }),
  forward: Object.freeze({ start: 4, end: 9, frameRate: 8, repeat: -1 }),
  backward: Object.freeze({ start: 10, end: 15, frameRate: 8, repeat: -1 }),
  strafeLeft: Object.freeze({ start: 16, end: 21, frameRate: 8, repeat: -1 }),
  strafeRight: Object.freeze({ start: 22, end: 27, frameRate: 8, repeat: -1 }),
  hit: Object.freeze({ start: 28, end: 29, frameRate: 10, repeat: 0 })
});
```

动作分类固定为：

```js
export function getPlayerMotion({ velocityX, velocityY, facingAngle }) {
  const speedSq = velocityX * velocityX + velocityY * velocityY;
  if (!Number.isFinite(speedSq) || speedSq <= 1) return "idle";
  const angle = Number.isFinite(facingAngle) ? facingAngle : 0;
  const forwardX = Math.cos(angle);
  const forwardY = Math.sin(angle);
  const longitudinal = velocityX * forwardX + velocityY * forwardY;
  const lateral = forwardX * velocityY - forwardY * velocityX;
  if (Math.abs(longitudinal) >= Math.abs(lateral)) {
    return longitudinal >= 0 ? "forward" : "backward";
  }
  return lateral >= 0 ? "strafeRight" : "strafeLeft";
}
```

---

### Task 1: 固定执行基线与污染边界

**Files:**
- Inspect only: repository and `.superpowers/`
- Create locally, never stage: `.superpowers/sdd/player-character/execution-baseline.txt`

**Interfaces:**
- Consumes: 当前 worktree 状态
- Produces: 后续 diff/review 使用的唯一基线 commit SHA

- [ ] **Step 1: 重新核对目标 worktree**

```powershell
Set-Location -LiteralPath 'C:\scp-survivor-ui-art'
Get-Location
git branch --show-current
git status --short --branch
git worktree list
git rev-parse HEAD
git rev-list --left-right --count origin/feature/ui-art-overhaul...HEAD
```

Expected: branch 是 `feature/ui-art-overhaul`；worktree 除 `?? .superpowers/` 外没有修改。任何额外项都停止有风险操作并报告，不覆盖、不 stash、不移动。

- [ ] **Step 2: 保存本地基线并验证不被 Git 跟踪**

```powershell
New-Item -ItemType Directory -Force -Path '.superpowers\sdd\player-character' | Out-Null
git rev-parse HEAD | Set-Content -LiteralPath '.superpowers\sdd\player-character\execution-baseline.txt' -Encoding ascii
git check-ignore -v '.superpowers/sdd/player-character/execution-baseline.txt'
```

Expected: `git check-ignore` 返回匹配规则；基线文件不出现在可暂存变更中。

- [ ] **Step 3: 跑当前角色与素材基线**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/character-presentation.test.js test/art-assets.test.js test/attack-facing.test.js test/combat-presentation-equivalence.test.js
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_pixel_tools.py
```

Expected: 当前已知基线为 JS 38/38、Python 4/4；执行时若计数已合法变化，以全绿为准并把新计数写入本地审计记录。基线失败时先用 `superpowers:systematic-debugging` 定位，不进入实现。

---

### Task 2: TDD 建立确定性角色素材组装器

**Files:**
- Create: `scripts/art/build_player_character_assets.py`
- Create: `scripts/art/test_player_character_assets.py`

**Interfaces:**
- Consumes: chroma helper 输出的 RGBA cutout；现有 `player-opening-sheet.png` 仅用于 Gate 2 非目标行和 hit 兼容帧
- Produces: `silhouette` 64×64 PNG；`prototype`/`production` 1920×256 PNG；所有输出 binary alpha、最多 32 色、baseline y=56

- [ ] **Step 1: 先写工具失败测试**

测试必须用 Pillow 现场生成 6×6 RGBA fixture，不依赖真实美术，覆盖：

测试类固定为 `PlayerCharacterAssetBuilderTests`，方法和断言逐项如下：

- `test_silhouette_is_64_square_with_48_pixel_subject_and_y56_baseline`：断言输出尺寸 `(64, 64)`、非透明 bbox 高 48、bbox bottom 为 56。
- `test_prototype_is_1920_by_256_and_reuses_only_legacy_non_down_rows`：断言 down 行来自新 board，left/right/up 与 hit 占用段逐像素等于 legacy 对应帧。
- `test_production_is_1920_by_256_with_rows_down_left_right_up`：断言尺寸 `(1920, 256)`，四行按 down/left/right/up 排列且每行占用帧为 `0–3, 6–11, 12–17, 18–23, 24–29, 30–31`。
- `test_right_row_is_not_derived_by_mirroring_left`：使用非对称 fixture，断言 right 每个占用帧既不等于 left，也不等于 left 水平翻转。
- `test_outputs_are_deterministic_binary_alpha_and_at_most_32_colors`：同一输入运行两次，断言 PNG bytes 相同、alpha 集合为 `{0, 255}`、非透明 RGB 色数不超过 32。
- `test_empty_required_cell_fails_without_writing_output`：清空一个 required cell，断言退出码非 0、stderr 含 cell 坐标、输出路径不存在。
- `test_subject_wider_than_60_or_shorter_than_44_after_fit_fails`：分别生成过宽与过矮 fixture，断言两次均退出非 0 且不写输出。

fixture 的 6×6 占用 cell 固定为 `0–3, 6–11, 12–17, 18–23, 24–29, 30–31`；其余 cell 必须透明。每个 required cell 用不同的腿部/肩部像素形状，防止测试只验证平移。

- [ ] **Step 2: 运行 RED**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_player_character_assets.py
```

Expected: FAIL，明确显示 `build_player_character_assets.py` 不存在或缺少被测试接口。

- [ ] **Step 3: 实现精确 CLI**

CLI 固定为三个子命令：

```text
build_player_character_assets.py silhouette --input PATH --output PATH
build_player_character_assets.py prototype --down-board PATH --legacy-sheet PATH --output PATH
build_player_character_assets.py production --down-board PATH --down-hit-board PATH --left-board PATH --right-board PATH --up-board PATH --output PATH
```

实现规则：

```python
FRAME_SIZE = 64
TARGET_VISIBLE_HEIGHT = 48
MIN_VISIBLE_HEIGHT = 44
MAX_VISIBLE_HEIGHT = 50
MAX_VISIBLE_WIDTH = 60
BASELINE_Y = 56
PALETTE_COLORS = 32
DIRECTION_ORDER = ("down", "left", "right", "up")
OCCUPIED_CELLS = (0, 1, 2, 3, 6, 7, 8, 9, 10, 11,
                  12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23,
                  24, 25, 26, 27, 28, 29, 30, 31)
```

- cell 边界用 `round(column * width / 6)` 与 `round(row * height / 6)` 计算，允许 1024 等不能被 6 整除的 imagegen 输出。
- `--down-board`、`--left-board`、`--right-board`、`--up-board` 都按 6×6 board 解析；`--down-hit-board` 固定按 1×2 board 解析，依次写入 down 行 frame 30、31。
- 每个 required cell 先取非零 alpha bbox，再以同一方向全部帧的 union bbox 计算一个 shared nearest scale；不得逐帧缩放。
- 缩放后水平中心固定 x=32，最后不透明行固定 y=56；任何帧触边、为空、可见高度不在 44–50、宽度超过 60 都抛错并不写 output。
- alpha 以 128 为界转为 0/255，透明像素 RGB 清零；整张 sheet 一次性无抖动量化到最多 32 色。
- `prototype` 的 down 列 0–27 来自新板，down hit 28–29 和其他三行来自旧表的原生方向帧；旧 `move 4–9` 依次复制到四个临时 locomotion block，仅为 Gate 2 运行兼容，不计入新动作验收。
- `production` 的 down 0–27 原样复用 Gate 2 已接受 source board；down 28–29 来自独立 hit board；left/right/up 全部来自各自原生板。
- production 组装前比较 left/right 的归一化 alpha hash；若整行满足镜像相等则失败。

- [ ] **Step 4: 运行 GREEN 与既有像素工具回归**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_player_character_assets.py
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_pixel_tools.py
git diff --check
```

Expected: 新工具测试全绿，既有 4 个 pixel tool 测试仍全绿，无 whitespace error。

- [ ] **Step 5: 提交工具与测试**

```powershell
git add -- scripts/art/build_player_character_assets.py scripts/art/test_player_character_assets.py
git diff --cached --name-only
git commit -m "test(art): add deterministic player character asset pipeline"
```

Expected staged list 只有上述两个文件；`.superpowers/` 不出现。

---

### Task 3: 视觉验收门 1——三种真实尺寸剪影

**Files:**
- Generate locally, never stage: `.superpowers/sdd/player-character/gate-1/**`
- Modify after acceptance: `docs/art/asset-register.md`

**Interfaces:**
- Consumes: Task 2 `silhouette` CLI、built-in `image_gen`
- Produces: 用户明确选择的一种角色身份方向，以及三种候选/拒绝原因的来源记录

- [ ] **Step 1: 分三次调用 built-in `image_gen`**

三个调用都使用以下共同 prompt；每次只附加一个候选差异块，不使用 CLI/API fallback：

```text
Use case: stylized-concept
Asset type: silhouette source for a production 64x64 top-down 2D pixel-art player character
Primary request: exactly one full-body adult female Foundation anomalous-response operative, readable at 48 pixels tall, neutral low-ready stance
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background, no floor, no shadow, no gradient, no texture
Style/medium: detailed orthographic top-down 2D pixel art, coarse deliberate hard pixel clusters, realistic adult proportions, no antialiasing
Composition/framing: one isolated character centered with generous padding, complete head, arms, compact held firearm, torso and both boots visible
Shared subject: professional dark navy and graphite tactical uniform, compact chest rig, breathing or eye protection, no readable insignia, no exposed skin emphasis
Constraints: strong hair/head silhouette; one stable identification color; weapon integrated close to body; no #00ff00 on subject; no text, logo, watermark, scenery, muzzle flash, extra character, floating weapon or separate shoulder module
Avoid: chibi, oversized head, school uniform, idol costume, swimsuit, exaggerated body proportions, 3D, isometric, side-view, smooth painting, soft transparency
```

候选 A 差异块：

```text
Variant A: compact agile responder; short asymmetric bob visible around a low-profile half-mask; slim but realistic armored vest; muted amber shoulder identification strip.
```

候选 B 差异块：

```text
Variant B: balanced containment specialist; tied-back braid loop visible behind full respirator and goggles; medium protective vest; desaturated teal forearm identification tab.
```

候选 C 差异块：

```text
Variant C: robust breach responder; close-cropped side hair under a compact protective hood; heavier rectangular over-vest without oversized armor; muted crimson collar identification tab.
```

每次生成后读取工具返回的真实保存路径，把选中 raw 输出复制为固定本地名 `gate-1/raw/silhouette-{a,b,c}.png`；禁止依赖或提交默认 generated_images 路径。

- [ ] **Step 2: 去色键并归一化到真实游戏尺寸**

```powershell
$python = 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$chroma = 'C:\Users\24037\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py'
foreach ($id in @('a','b','c')) {
  & $python $chroma --input ".superpowers/sdd/player-character/gate-1/raw/silhouette-$id.png" --out ".superpowers/sdd/player-character/gate-1/cutout/silhouette-$id.png" --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
  & $python scripts/art/build_player_character_assets.py silhouette --input ".superpowers/sdd/player-character/gate-1/cutout/silhouette-$id.png" --output ".superpowers/sdd/player-character/gate-1/final/silhouette-$id.png"
}
& $python scripts/art/build_contact_sheet.py --inputs .superpowers/sdd/player-character/gate-1/final/silhouette-a.png .superpowers/sdd/player-character/gate-1/final/silhouette-b.png .superpowers/sdd/player-character/gate-1/final/silhouette-c.png --scale 1 --columns 3 --output .superpowers/sdd/player-character/gate-1/silhouettes-1x.png
& $python scripts/art/build_contact_sheet.py --inputs .superpowers/sdd/player-character/gate-1/final/silhouette-a.png .superpowers/sdd/player-character/gate-1/final/silhouette-b.png .superpowers/sdd/player-character/gate-1/final/silhouette-c.png --scale 4 --columns 3 --output .superpowers/sdd/player-character/gate-1/silhouettes-4x.png
```

Expected: 三张 64×64、可见高 48、baseline y=56、二值 alpha；1× contact 为 192×64，4× 为 768×256。

- [ ] **Step 3: Agent 先做硬门槛筛选**

逐张检查：成年女性、俯视透视、头发/头部轮廓、专业制服、呼吸/护目装备、单一识别色、紧凑持枪、无浮空模块；任何候选不合格只做一次单点 prompt 修正并保留原拒绝原因。

- [ ] **Step 4: 用户视觉验收门 1**

同时展示 1× 与 4× contact sheet，并请用户明确回复“接受 A/B/C”或指出修改。用户没有明确接受前停止；不生成动作板、不改 manifest、不提交素材。

- [ ] **Step 5: 登记真实来源并提交选择记录**

在 `docs/art/asset-register.md` 新增“玩家角色 Gate 1 剪影”小节，逐字记录三个 prompt、built-in 工具、raw/final SHA-256、用户选项、另外两个候选的拒绝原因、无第三方输入、OpenAI 输出权利需在商业发布前复核；审计路径注明 `.superpowers/sdd/player-character/gate-1/` 不暂存。

```powershell
Get-FileHash -Algorithm SHA256 .superpowers/sdd/player-character/gate-1/raw/*.png
Get-FileHash -Algorithm SHA256 .superpowers/sdd/player-character/gate-1/final/*.png
git add -- docs/art/asset-register.md
git diff --cached --name-only
git commit -m "docs(art): record approved response operative silhouette"
```

Expected staged list只有 `docs/art/asset-register.md`。

---

### Task 4: TDD 扩展角色 registry、动作分类与原子 fallback

**Files:**
- Modify: `src/assets/manifest.js`
- Modify: `src/art/characterPresentation.js`
- Modify: `src/scene/world.js`
- Modify: `test/character-presentation.test.js`
- Modify: `test/art-assets.test.js`
- Modify: `test/presentation-rules.test.js`

**Interfaces:**
- Consumes: 本计划“精确运行时接口”、现有 `playerFacingAngle`、`sprite.body.velocity`
- Produces: `DEFAULT_CHARACTER_ID`、`CHARACTER_PROFILES`、`getPlayerMotion()`、`resolveCharacterPresentation()`；Preload 继续调用原名 `registerOpeningCharacterAnimations()`

- [ ] **Step 1: 写 registry 与纯动作分类失败测试**

在 `test/character-presentation.test.js` 先锁定：

```js
assert.equal(DEFAULT_CHARACTER_ID, "foundation-response-operative");
assert.deepEqual(CHARACTER_PROFILES[DEFAULT_CHARACTER_ID], {
  sheetKey: TEXTURES.playerResponseOperativeSheet,
  fallbackSheetKey: TEXTURES.playerOpeningSheet,
  fallbackTextureKey: TEXTURES.player,
  frameWidth: 64,
  frameHeight: 64,
  frameCount: 120,
  displayScale: 1,
  fallbackDisplayScale: 1.2
});
assert.equal(Object.isFrozen(CHARACTER_PROFILES), true);
assert.equal(Object.isFrozen(CHARACTER_PROFILES[DEFAULT_CHARACTER_ID]), true);

assert.equal(getPlayerMotion({ velocityX: 0, velocityY: 0, facingAngle: 0 }), "idle");
assert.equal(getPlayerMotion({ velocityX: 2, velocityY: 0, facingAngle: 0 }), "forward");
assert.equal(getPlayerMotion({ velocityX: -2, velocityY: 0, facingAngle: 0 }), "backward");
assert.equal(getPlayerMotion({ velocityX: 0, velocityY: 2, facingAngle: 0 }), "strafeRight");
assert.equal(getPlayerMotion({ velocityX: 0, velocityY: -2, facingAngle: 0 }), "strafeLeft");
assert.equal(getPlayerMotion({ velocityX: 2, velocityY: 2, facingAngle: 0 }), "forward");
```

再断言 `getCharacterAnimationKey({ characterId: DEFAULT_CHARACTER_ID, motion: "backward", facing: "right" })` 精确返回 `foundation-response-operative-backward-right`。

- [ ] **Step 2: 写动画注册与 fallback 失败测试**

把 scene stub 扩展为可分别声明新表/旧表 frameTotal、可在第 N 次 `anims.create` 抛错、记录 `anims.remove`。测试必须覆盖：

- 新表 `frameTotal === 121` 时创建 24 个生产动画，frame index 使用 `row * 30 + start/end`；right 取第三行真实帧；所有生产动画不依赖 flip。
- 新表缺失、`frameTotal` 为 120 或 122 时不使用新表，回退旧 `player-opening-sheet`。
- 旧表也缺失时返回 `player-rect` 静态 fallback。
- 第 7 个生产动画创建抛错时，前 6 个生产 key 被删除，旧 12 个动画仍存在，调用不向外抛错。
- 同一 AnimationManager 对同一 sheet 重复调用只警告一次；完整注册重复调用不创建重复 key。
- 生产、legacy、static 三种解析结果的 `displayScale` 分别为 1、1.2、1.2。

- [ ] **Step 3: 写同步与玩法安全失败测试**

新增 table-driven 用例遍历四面向与五种 locomotion，断言 `syncCharacterPresentation()` 播放正确 key；`hit` 在 120ms 内覆盖，结束后恢复分类动作。生产角色每次同步都 `setFlipX(false)`；legacy 继续保留旧 right mirror 行为。

保留并加严源码门禁：

```js
assert.doesNotMatch(source, /\.body\.(?:setSize|setOffset|setCircle|setVelocity)/);
assert.doesNotMatch(source, /scene\.playerFacingAngle\s*=/);
assert.doesNotMatch(source, /\.time\.(?:addEvent|delayedCall)/);
assert.doesNotMatch(source, /\.on\(|\.once\(/);
```

在 world 源码测试中断言顺序仍为 `physics.add.sprite` → `setCollideWorldBounds` → `body.setSize(24, 24)` → `applyDisplayScalePreservingBody`。

- [ ] **Step 4: 运行 RED**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/character-presentation.test.js test/art-assets.test.js test/presentation-rules.test.js
```

Expected: FAIL，缺少新导出、新 texture key、120 帧 layout 和 fallback 事务行为。

- [ ] **Step 5: 在 manifest 只新增 key，不声明缺失文件**

在 `TEXTURES` 中新增：

```js
playerResponseOperativeSheet: "player-response-operative-sheet",
```

此时不向 `SPRITESHEET_ASSETS` 加条目，确保运行时主动走旧表 fallback，不让浏览器请求不存在的文件。`test/art-assets.test.js` 断言该 key 与全部既有 texture key 唯一。

- [ ] **Step 6: 实现角色入口与原子注册**

实现本计划定义的 registry、motion ranges 和 classifier。注册顺序固定为 legacy 12 个动画后 production 24 个动画；production 预检要求精确 `frameTotal === 121`。

每个 AnimationManager 使用 `WeakMap` 保存失败 sheet 集合和已警告 sheet 集合；事务逻辑必须等价于：

```js
function registerAnimationBatch(scene, definitions, sheetKey) {
  const keys = definitions.map(({ key }) => key);
  const existingCount = keys.filter((key) => scene.anims.exists(key)).length;
  if (existingCount === keys.length) return true;
  if (existingCount > 0) keys.forEach((key) => scene.anims.remove(key));
  const created = [];
  try {
    for (const definition of definitions) {
      scene.anims.create(definition);
      created.push(definition.key);
    }
    return true;
  } catch (error) {
    created.forEach((key) => scene.anims.remove(key));
    markSheetFailedAndWarnOnce(scene, sheetKey, error);
    return false;
  }
}
```

`syncCharacterPresentation()` 只处理 `scene.player`；production 根据 `getPlayerMotion()` 选动作并始终 `flipX=false`；legacy 保持当前 idle/move/hit 合同。任何目标动画 key 不存在时标记对应 sheet 失败、警告一次并停止本帧播放，不改 body 或玩法字段。

- [ ] **Step 7: 修改 world 消费解析结果**

`createPlayer()` 的角色相关部分固定为：

```js
const presentation = resolveCharacterPresentation(this, DEFAULT_CHARACTER_ID);
this.player = this.physics.add.sprite(
  WORLD_WIDTH / 2,
  WORLD_HEIGHT / 2,
  presentation.textureKey
);
this.player.characterId = presentation.characterId;
this.player.presentationAnimationFamily = presentation.animationFamily;
this.player.setCollideWorldBounds(true);
this.player.body.setSize(24, 24);
applyDisplayScalePreservingBody(this.player, presentation.displayScale);
```

其他 createPlayer 顺序、depth、combatFeedback、destroy hook 和 camera follow 原样保留。

- [ ] **Step 8: 运行 GREEN、fallback 启动检查与回归**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/character-presentation.test.js test/art-assets.test.js test/presentation-rules.test.js test/attack-facing.test.js test/combat-presentation-equivalence.test.js
npm run build
git diff --check
```

Expected: 全绿；build 成功；未声明的新 key 不产生网络加载错误；只有一次 `missing production sheet` fallback warning；代码路径解析为 legacy sheet；24×24 body 和攻击朝向测试不变。

- [ ] **Step 9: 提交运行时合同**

```powershell
git add -- src/assets/manifest.js src/art/characterPresentation.js src/scene/world.js test/character-presentation.test.js test/art-assets.test.js test/presentation-rules.test.js
git diff --cached --name-only
git commit -m "feat(art): add extensible player animation contract"
```

Expected: staged list 精确为上述六个文件；不含素材和 `.superpowers/`。

---

### Task 5: 视觉验收门 2——单方向动作原型接入真实游戏

**Files:**
- Generate locally, never stage: `.superpowers/sdd/player-character/gate-2/**`
- Create after acceptance: `public/assets/art/characters/player-response-operative-prototype.png`
- Create: `test/player-character-assets.test.js`
- Modify: `src/assets/manifest.js`
- Modify: `docs/art/asset-register.md`

**Interfaces:**
- Consumes: Gate 1 选定剪影、Task 2 builder、Task 4 production registry
- Produces: down 方向 idle/forward/backward/strafeLeft/strafeRight 的真实游戏原型；其他方向和 hit 暂时继承旧表

- [ ] **Step 1: 写 prototype 资源合同失败测试**

`test/player-character-assets.test.js` 先断言：

```js
assert.equal(TEXTURES.playerResponseOperativeSheet, "player-response-operative-sheet");
assert.deepEqual(
  SPRITESHEET_ASSETS.find(({ key }) => key === TEXTURES.playerResponseOperativeSheet),
  {
    key: "player-response-operative-sheet",
    path: "assets/art/characters/player-response-operative-prototype.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  }
);
```

PNG 门禁固定为 1920×256、8-bit RGBA、120 帧、binary alpha、≤32 色；down 的五个目标 motion 各自帧数为 4/6/6/6/6、translation-normalized hash 全唯一、每帧高 44–50、baseline y=56±1、左右漂移≤2。prototype 暂不要求其他三行的新动作差异，也不把 down hit 计入新素材验收。

- [ ] **Step 2: 运行 RED**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-assets.test.js
```

Expected: FAIL，prototype PNG 和 manifest entry 尚不存在。

- [ ] **Step 3: 生成 down 方向 6×6 原型板**

先用 `view_image` 检查 Gate 1 选中 64×64 图，再作为 Image 1 identity reference 调用 built-in `image_gen`。精确 prompt：

```text
Use case: identity-preserve
Asset type: source pose board for one-direction prototype of a production 64x64 top-down 2D pixel-art player spritesheet
Input images: Image 1 is the sole approved identity, silhouette, uniform, protection gear, identification color and pixel-art reference
Primary request: exactly 28 isolated poses of the same adult female Foundation anomalous-response operative in a precise 6-row by 6-column grid, all natively facing down toward the viewer
Layout: row 1 columns 1-4 are idle phases and columns 5-6 empty; row 2 is forward tactical walk phases; row 3 is backward tactical walk phases; row 4 is left-strafe phases; row 5 is right-strafe phases; row 6 empty
Motion: real alternating boot contact, knee bend, hip/shoulder counter-rotation and compact weapon stabilization; backward visibly plants heels and withdraws weight; strafes use distinct crossing/opening footwork without rotating the torso away from down
Scene/backdrop: perfectly flat uniform #00ff00 chroma-key background in every cell, no cell border
Style/medium: detailed orthographic top-down 2D pixel art, coarse hard pixel clusters, realistic adult proportions, same palette and identity as Image 1, no antialiasing
Composition/framing: equal scale, full body, stable baseline, generous cell padding, no overlap
Constraints: every populated pose differs by real limb articulation after translation alignment; preserve exact hair/head silhouette, respirator/goggles, tactical uniform, identification color and compact held firearm; weapon keeps pointing down; no mirroring, recolor-only, translation-only, bob-only or scale-only variants; no shadow, floor, text, logo, watermark, muzzle flash, blood, extra person, floating weapon or separate shoulder module
Avoid: chibi, oversized head, 3D, isometric, side-view, smooth painting, soft transparency, duplicated poses
```

将工具返回 source 复制到 `.superpowers/sdd/player-character/gate-2/raw/down-prototype.png`。

- [ ] **Step 4: 去色键并组装 prototype**

```powershell
$python = 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $python 'C:\Users\24037\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py' --input .superpowers/sdd/player-character/gate-2/raw/down-prototype.png --out .superpowers/sdd/player-character/gate-2/cutout/down-prototype.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
& $python scripts/art/build_player_character_assets.py prototype --down-board .superpowers/sdd/player-character/gate-2/cutout/down-prototype.png --legacy-sheet public/assets/art/characters/player-opening-sheet.png --output public/assets/art/characters/player-response-operative-prototype.png
```

Expected: 1920×256；down 0–27 是新动作，down hit 和其他方向来自旧表；没有逐帧缩放或镜像生成。

- [ ] **Step 5: 声明 prototype 并跑 GREEN**

向 `SPRITESHEET_ASSETS` 增加：

```js
{
  key: TEXTURES.playerResponseOperativeSheet,
  path: "assets/art/characters/player-response-operative-prototype.png",
  frameConfig: { frameWidth: 64, frameHeight: 64 }
},
```

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-assets.test.js test/character-presentation.test.js test/art-assets.test.js test/attack-facing.test.js test/combat-presentation-equivalence.test.js
npm run build
```

Expected: 全绿；新表成为 production 解析路径；攻击/伤害结果仍等价。

- [ ] **Step 6: 生成原生尺寸审查图**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/build_contact_sheet.py --inputs public/assets/art/characters/player-response-operative-prototype.png --scale 1 --columns 1 --output .superpowers/sdd/player-character/gate-2/prototype-sheet-1x.png
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/build_contact_sheet.py --inputs public/assets/art/characters/player-response-operative-prototype.png --scale 4 --columns 1 --output .superpowers/sdd/player-character/gate-2/prototype-sheet-4x.png
```

Expected: 1× 1920×256；4× 7680×1024。只把 down 行和 960×540 游戏截图作为 Gate 2 判断对象，其他行明确标为旧表兼容内容。

- [ ] **Step 7: Agent 浏览器 prototype smoke**

先只读检查端口：

```powershell
Get-NetTCPConnection -LocalPort 64126 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess
```

未知监听者存在时停止，不终止进程。端口空闲时启动：

```powershell
npm run dev -- --host 127.0.0.1 --port 64126 --strictPort
```

用浏览器固定 960×540，检查标题→武器选择→实战→暂停→restart。使用 `.superpowers/sdd/player-character/gate-2/visual-state-driver.js` 仅临时把表现输入固定为 down 并依次给出静止、向下前进、向上后退、向右角色左横移、向左角色右横移；驱动不进入 Git，finally 恢复所有修改值。记录：当前 animation key、texture key、scale、body position/size/offset 前后快照、console error/warn、五种状态截图。

Expected: 五种动作肉眼不同；无月球漫步；人物高 44–50；无浮空装具；body 始终 24×24 且位置/offset 不因动作改变；console error 为 0，新 sheet warning 为 0。

- [ ] **Step 8: 用户视觉验收门 2**

向用户提供 1× contact、五张 960×540 截图和稳定 `http://localhost:64126/`，请用户只判断 down 方向的身份、比例、像素密度、前进/后退/左右横移、滑行和月球漫步。未明确接受前不制作其他方向、不提交 prototype；反馈只修当前原型并重复 Steps 3–8。

- [ ] **Step 9: 登记并提交已接受 prototype**

在 asset register 记录逐字 prompt、Image 1 身份来源、raw/cutout/prototype SHA-256、chroma 参数、builder 命令、旧表兼容行、用户接受结论、所有拒绝版本及原因、许可证/商业复核状态。

```powershell
git add -- public/assets/art/characters/player-response-operative-prototype.png src/assets/manifest.js test/player-character-assets.test.js docs/art/asset-register.md
git diff --cached --name-only
git commit -m "feat(art): integrate approved player locomotion prototype"
```

Expected: staged list 精确为四个文件；不含 raw/cutout/contact/screenshot/driver。

---

### Task 6: TDD 收紧完整 120 帧生产资源合同

**Files:**
- Modify: `test/player-character-assets.test.js`
- Generate locally, never stage: `.superpowers/sdd/player-character/gate-3/**`
- Create uncommitted for review: `public/assets/art/characters/player-response-operative.png`
- Modify uncommitted for review: `src/assets/manifest.js`

**Interfaces:**
- Consumes: Gate 2 已接受 down 0–27 source board；Gate 1 身份；Task 2 production builder
- Produces: 四真实方向完整 120 帧候选；不改变 Gate 2 已接受 down locomotion 像素

- [ ] **Step 1: 先把 prototype 测试收紧为 final RED**

manifest 期望路径改为 `assets/art/characters/player-response-operative.png`。资源门禁遍历四行六动作并断言：

- frame count 精确 120、尺寸精确 1920×256、frame 精确 64×64；
- 每帧非空、不触边、可见高 44–50、baseline y=56±1、同 motion 中心漂移≤2；
- alpha 只有 0/255、整表不透明 RGB 色≤32；
- 每个动作内部 translation-normalized hash 全唯一；
- 每对相邻 locomotion 帧和末帧→首帧 changed-pixel ratio 在 `0.03–0.65`；
- 每个 locomotion block 的 alpha-shape difference ratio 至少 `0.015`；
- left/right 对应帧的“水平镜像后 hash”不得全部相同；
- down 0–27 的像素 SHA-256 与 Gate 2 已接受源组装结果逐帧相同；
- hit 两帧不同、`repeat=0`，且角色 identity、装备数量和 baseline 不跳变由 Gate 3 人工审查补足。

- [ ] **Step 2: 运行 RED**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-assets.test.js
```

Expected: FAIL，final PNG/manifest path 尚未存在，prototype 的 legacy 行也不能通过 final 动作差异门禁。

- [ ] **Step 3: 生成 down 两帧受击板**

用 Gate 1 选中剪影作为 Image 1、Gate 2 已接受 down 原型板作为 Image 2，调用一次 built-in `image_gen`：

```text
Use case: identity-preserve
Asset type: two-frame hit-reaction source board for a production 64x64 top-down 2D pixel-art player spritesheet
Input images: Image 1 is the approved identity and silhouette; Image 2 is the approved down-facing locomotion board and exact uniform, gear, palette, scale and viewpoint reference
Primary request: exactly two isolated down-facing hit reactions of the same adult female Foundation anomalous-response operative, arranged left to right in one row
Motion: frame 1 twists the torso and draws the weapon arm inward while both boots brace; frame 2 recoils shoulders backward with a different free-arm and knee configuration; both remain controlled tactical reactions
Scene/backdrop: perfectly flat uniform #00ff00 chroma-key background, no border
Style/medium: exact same detailed orthographic top-down hard-cluster pixel art as the references, no antialiasing
Constraints: preserve identity, hair/head silhouette, respirator/goggles, uniform, identification color, equipment count, realistic adult proportions, scale and baseline; firearm remains attached to hands; no blood, dismemberment, muzzle flash, shadow, floor, text, logo, watermark, extra person, floating weapon or separate shoulder module
Avoid: duplicated pose, translation-only, bob-only, scale-only, mirroring, recolor-only, chibi, 3D, isometric, smooth painting, soft transparency
```

保存 raw 为 `.superpowers/sdd/player-character/gate-3/raw/down-hit.png`。

- [ ] **Step 4: 分别生成 left、right、up 三张完整 6×6 动作板**

每个调用都以 Gate 1 选中剪影为 Image 1、Gate 2 down 原型板为 Image 2，使用以下共同 prompt：

```text
Use case: identity-preserve
Asset type: one native-direction source pose board for a production 64x64 top-down 2D pixel-art player spritesheet
Input images: Image 1 is the approved identity and silhouette; Image 2 is the approved down-facing locomotion board and exact uniform, gear, palette, animation density, scale and orthographic viewpoint reference
Primary request: exactly 30 isolated poses of the same adult female Foundation anomalous-response operative in a precise 6-row by 6-column grid
Layout: row 1 columns 1-4 are idle phases and columns 5-6 empty; row 2 is forward tactical walk; row 3 is backward tactical walk; row 4 is character-left strafe; row 5 is character-right strafe; row 6 columns 1-2 are controlled hit reactions and columns 3-6 empty
Motion: genuine alternating boots, knee bend, hip/shoulder counter-rotation and compact weapon stabilization; forward, backward and both strafes must remain distinguishable after translation alignment; hit frames change torso, arms and bracing legs
Scene/backdrop: perfectly flat uniform #00ff00 chroma-key background in every cell, no cell border
Style/medium: exact same detailed orthographic top-down hard-cluster pixel art as the references, realistic adult proportions, no antialiasing
Composition/framing: equal scale, full body, stable baseline, generous cell padding, no overlap
Constraints: preserve exact identity, hair/head silhouette, respirator/goggles, tactical uniform, identification color, equipment count and compact held firearm; every populated pose uses real articulation; no translation-only, bob-only, scale-only, recolor-only or one-pixel-noise variants; no shadow, floor, text, logo, watermark, muzzle flash, blood, extra person, floating weapon or separate shoulder module
Avoid: chibi, oversized head, 3D, isometric, side-view platform art, smooth painting, soft transparency, duplicated poses
```

left 调用追加：

```text
Direction requirement: all poses are natively drawn facing screen-left; firearm and body point left; do not derive from any right-facing image by mirroring.
```

right 调用追加：

```text
Direction requirement: all poses are natively drawn facing screen-right; firearm and body point right; preserve the operative's asymmetric identification tab, hair and equipment on their anatomical sides; never mirror the left-facing board.
```

up 调用追加：

```text
Direction requirement: all poses are natively drawn facing up away from the viewer; back rig, tied hair/hood silhouette and rear protection are visible; firearm points up; do not rotate or mirror a side-facing board.
```

分别保存到 `.superpowers/sdd/player-character/gate-3/raw/{left,right,up}.png`。若任何板方向错误或 identity 漂移，只对该板做一次单点修正；不重生成已接受 down locomotion。

- [ ] **Step 5: 去色键、组装完整表并临时切换 manifest**

```powershell
$python = 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$chroma = 'C:\Users\24037\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py'
foreach ($id in @('down-hit','left','right','up')) {
  & $python $chroma --input ".superpowers/sdd/player-character/gate-3/raw/$id.png" --out ".superpowers/sdd/player-character/gate-3/cutout/$id.png" --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill
}
& $python scripts/art/build_player_character_assets.py production --down-board .superpowers/sdd/player-character/gate-2/cutout/down-prototype.png --down-hit-board .superpowers/sdd/player-character/gate-3/cutout/down-hit.png --left-board .superpowers/sdd/player-character/gate-3/cutout/left.png --right-board .superpowers/sdd/player-character/gate-3/cutout/right.png --up-board .superpowers/sdd/player-character/gate-3/cutout/up.png --output public/assets/art/characters/player-response-operative.png
```

把 manifest path 从 prototype 精确改成 `assets/art/characters/player-response-operative.png`，但在 Gate 3 用户接受前不暂存、不提交，也不删除 prototype。

- [ ] **Step 6: 运行 final GREEN 与定向玩法回归**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_player_character_assets.py
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-assets.test.js test/character-presentation.test.js test/art-assets.test.js test/presentation-rules.test.js test/attack-facing.test.js test/attack-feedback-notification.test.js test/hit-feedback-notification.test.js test/combat-presentation-equivalence.test.js
npm run build
git diff --check
```

Expected: 全绿；build 成功；down locomotion 像素未漂移；攻击提交/弹道/伤害等价；没有 whitespace error。

- [ ] **Step 7: 生成完整 contact sheet 和逐方向动画审查证据**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/build_contact_sheet.py --inputs public/assets/art/characters/player-response-operative.png --scale 1 --columns 1 --output .superpowers/sdd/player-character/gate-3/final-sheet-1x.png
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/build_contact_sheet.py --inputs public/assets/art/characters/player-response-operative.png --scale 4 --columns 1 --output .superpowers/sdd/player-character/gate-3/final-sheet-4x.png
Get-FileHash -Algorithm SHA256 public/assets/art/characters/player-response-operative.png
```

人工逐帧拒绝：方向镜像、身份/发型/识别色漂移、装备增减、武器脱手、脚底跳线、角色呼吸式缩放、仅平移/变色/噪点的假动作、软边/绿边、像素密度与地图/敌人不一致。

---

### Task 7: 独立审查、浏览器 smoke 与视觉验收门 3

**Files:**
- Inspect: 从 `.superpowers/sdd/player-character/execution-baseline.txt` 的 SHA 到当前 worktree diff
- Modify only for verified findings: Task 4/6 已列源码、测试、素材、登记
- Generate locally, never stage: `.superpowers/sdd/player-character/gate-3/review/**`

**Interfaces:**
- Consumes: 完整 final 候选和全部自动测试
- Produces: 无 Critical/Important finding、浏览器证据、用户最终接受或精确返工项

- [ ] **Step 1: 使用 `superpowers:requesting-code-review` 做两路独立只读审查**

在 Subagent-Driven 执行中分两路、互不修改：

1. 玩法/生命周期审查：`playerFacingAngle` 只读、body 24×24、攻击/移动/伤害等价、注册回滚、fallback 顺序、warn-once、restart 无残留；
2. 素材/表现审查：registry 接口、120 帧索引、四真实方向、动作分类符号、scale/baseline、pixel contract、来源登记、无浮空模块。

要求 findings 按 Critical / Important / Minor，给出文件和行号。主 Agent 对每条先用测试或代码路径验证；真实 Critical/Important 先加失败测试再最小修复，错误或越界建议写明理由后关闭。修复后重新审查，直到无 Critical/Important。

- [ ] **Step 2: 逐个提交审查修复（仅在确有 finding 时）**

每个逻辑相关修复一个 commit，源码与回归测试同 commit；素材修复与对应 asset-register hash/prompt/拒绝原因同 commit。示例 commit message 固定使用实际类别：

```powershell
git add -- src/art/characterPresentation.js test/character-presentation.test.js
git commit -m "fix(art): harden player animation fallback rollback"
```

若无 finding，不创建空 commit。

- [ ] **Step 3: 新鲜完整自动验证**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_pixel_tools.py
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_player_character_assets.py
npm run build
git diff --check
$phaseBase = Get-Content -LiteralPath '.superpowers\sdd\player-character\execution-baseline.txt' -Raw
git diff --check "$($phaseBase.Trim())..HEAD"
git status --short --branch
```

Expected: 全部 Node/Python 测试 0 fail；build 成功；diff 无 whitespace error；状态只包含尚未提交的 final candidate、manifest/test/register 修改以及既有 `?? .superpowers/`。

- [ ] **Step 4: 测试缺失/错误资源 fallback**

不改 Git index。先记录 final PNG SHA-256，把文件临时移动到 `.superpowers/sdd/player-character/gate-3/fallback/`，启动一次浏览器，确认旧 `player-opening-sheet` 动画可玩且只警告一次；恢复后验证 SHA-256 完全一致。再在本地临时复制一个 119 帧截短 fixture 并通过测试 stub/临时 manifest 工作副本验证精确帧数拒绝，绝不覆盖正式 final 文件。

检查内容：启动、移动、自动攻击、受击、暂停、失败/胜利 restart；body 24×24；没有半注册 production key。任何恢复或 hash 比对失败都阻止继续。

- [ ] **Step 5: Agent 运行 960×540 浏览器 final smoke**

继续使用端口 64126 的只读占用规则。检查并截图：

1. down：idle/forward/backward/strafeLeft/strafeRight/hit；
2. left、right、up：同样六动作，并确认 right 没有镜像权限条/发型/装备；
3. 自动攻击改变面朝，WASD 单独移动不改变面朝；
4. pistol、breacher、tesla 各一次成功攻击，人物动画不复制三套武器外观；
5. 暂停、受击恢复、失败 restart、胜利 restart、返回标题再开局；
6. production、legacy fallback、static fallback 三条 body snapshot 均为 24×24；
7. console error 0、missing/duplicate texture key 0、production warning 0。

截图和 JSON 快照保存到 `.superpowers/sdd/player-character/gate-3/review/`，不暂存。临时状态驱动必须 try/finally 恢复 scene 字段、RNG 和 `localStorage["scp-survivor-meta"]` 原字符串；不得调用会发奖的胜利/失败触发器。

- [ ] **Step 6: 用户视觉验收门 3**

向用户展示 final 1× contact sheet、四方向代表截图、动作截图和稳定 `http://localhost:64126/`。请用户亲自试玩并明确判断：

- 角色身份、成年女性比例、基金会专业感和精细像素密度；
- 四方向不缩小、不跳 baseline、不镜像不对称装备；
- 前进、后退、左右横移无滑行/月球漫步；
- 移动不改攻击面朝，攻击结果/弹道不变；
- 无悬浮武器、延迟装具或遮挡人物模块；
- 受击短暂覆盖后自然恢复。

用户未明确接受时，不删除 prototype、不提交 final；只修复指出的当前阶段问题，并重新执行 Task 6 对应 RED/GREEN、审查、smoke 和本门。

- [ ] **Step 7: 接受后完成来源登记与 final 原子替换 commit**

在 `docs/art/asset-register.md` 记录四个实际 prompt、每张 raw/cutout 的工具返回路径和 SHA-256、Gate 2 down 帧复用事实、chroma/builder 命令、final SHA-256、所有拒绝/中断版本原因、用户 Gate 1/2/3 接受结论、无第三方图像输入、OpenAI 输出权利商业发布前复核。把 prototype 条目标记为“Gate 2 历史候选，已由 final 替代”，保留其 hash 和来源记录。

```powershell
git add -- public/assets/art/characters/player-response-operative.png src/assets/manifest.js test/player-character-assets.test.js docs/art/asset-register.md
git rm -- public/assets/art/characters/player-response-operative-prototype.png
git diff --cached --name-only
git diff --cached --check
git commit -m "feat(art): ship response operative animation set"
```

Expected staged list：final PNG、manifest、asset test、asset register，以及 prototype 删除；不含 `.superpowers/` 或其他文件。

---

### Task 8: 最终 fresh verification、审查收口与交接

**Files:**
- Inspect only: repository, commit range, local smoke service
- No new tracked files unless a verified regression requires a TDD fix

**Interfaces:**
- Consumes: 用户 Gate 3 接受后的 final commit
- Produces: 可审计的阶段完成报告；不 merge、不 push

- [ ] **Step 1: 使用 `superpowers:verification-before-completion` 运行新鲜全套门禁**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_pixel_tools.py
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_player_character_assets.py
npm run build
git diff --check
git status --short --branch
git log --oneline --decorate -8
git rev-list --left-right --count origin/feature/ui-art-overhaul...HEAD
```

Expected: 全部测试 0 fail、build 成功、diff check 通过；工作区只剩 `?? .superpowers/`；分支仍为 `feature/ui-art-overhaul`；没有 merge/push。

- [ ] **Step 2: 最终 runtime smoke 不复用旧证据**

刷新页面并重新走标题→选武器→四方向动作→受击→暂停→restart；重新读取 console、texture、animation key 和 body snapshot。若服务已停止，按 Task 5 的端口只读检查后重新启动；不得把历史截图当成当前 HEAD 证据。

- [ ] **Step 3: 最终报告**

报告必须包含：

- worktree、分支、最终 HEAD、相对远端 ahead/behind；
- 本阶段 commit 列表及每个 commit 目的；
- final PNG 路径、尺寸、帧数、SHA-256、来源登记摘要；
- Node/Python 测试数量、build、diff check、fallback、浏览器 smoke、用户三门验收结果；
- 24×24 body、攻击朝向/弹道/伤害等价证据；
- 独立审查 findings 与关闭结果；
- 剩余 Minor 风险；
- 明确说明 `.superpowers/` 未 stage、未 merge、未 push；
- GPT 等级：本路线整体 Level 2，但本计划只执行已批准、三门可回退的第一阶段；不额外生成外部 GPT 审查包。

## 执行停止条件

出现以下任一情况立即停止后续步骤并报告，不自行扩权：worktree 出现未知修改、分支变化、远端 ancestry 异常、共享接口需要超出本计划的重构、必须改玩法/碰撞/存档、imagegen 需要改用 CLI/API/其他模型、chroma 去底失败且需要原生透明、端口 64126 被未知进程占用、任何用户视觉门未接受、fallback 恢复/hash 不一致、Critical/Important review finding 未关闭。

## 实施选择

计划批准后推荐使用 **Subagent-Driven**：每个实现任务使用新的实施子 Agent，主 Agent 在任务之间做规格审查与质量审查，并在三次用户视觉门处暂停。若用户选择当前会话内执行，则必须改用 `superpowers:executing-plans` 分批执行并保留相同检查点。
