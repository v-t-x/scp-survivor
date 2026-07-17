# 玩家角色与动画重制实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变玩法、攻击、碰撞、存档和胜负语义的前提下，把默认玩家替换为一名成年女性基金会异常响应干员的 64×64、四真实方向、120 帧精细像素动画，并保留完整旧角色 fallback。

**Architecture:** `src/art/characterPresentation.js` 继续作为唯一角色表现入口，新增按角色 ID 注册的只读配置、纯函数动作分类器和原子动画注册；`src/art/openingVisualContract.js` 同时保留 legacy/new 命名合同，并只在 Gate 3 接受时切换权威默认；`src/scene/world.js` 只消费正常 production/legacy 解析结果，仍先建立 24×24 Arcade Body，再走现有保体缩放路径。素材严格按“三剪影及真实游戏截图 → 单方向 28 帧开发态原型 → 四方向 120 帧完整表”推进；Gate 2 原型只在 `?playerCharacterPrototype=1` 下启用，普通 URL 始终保留旧生产角色，直到 Gate 3 接受后才原子切换。浏览器固定状态通过只写 presentation-owned override、绝不改 `playerFacingAngle`、Arcade Body velocity、RNG 或存档的开发态驱动复现。

**Tech Stack:** Phaser 3.90、Vite 7、JavaScript ES Modules、Node.js `node:test`、Python 3 + Pillow、built-in `image_gen`、本地 chroma-key helper、浏览器 960×540 smoke。

## Global Constraints

- 只在 `C:\scp-survivor-ui-art` 的 `feature/ui-art-overhaul` worktree 工作；执行开始时重新记录分支、HEAD、远端 ahead/behind 和状态。
- `.superpowers/` 始终是本地审计目录，绝不暂存；所有 `git add` 都必须使用显式文件清单。
- 不 merge、不 push、不删除分支或 worktree、不重写历史、不创建 release。
- 第一阶段只做玩家角色与动画；不做升级 UI、地图、掉落物、HUD、敌人、Boss 或后续统一润色。
- 角色是成年女性基金会异常响应干员；精细像素风；允许适度二次元化，但不得使用校服、偶像、泳装、夸张身体比例或 Q 版大头。
- 每帧固定 64×64 RGBA；游戏内可见人物高度 44–50 像素；alpha 只能为 0 或 255；整表最多 32 个不透明 RGB 色。
- 完整表固定 1920×256、120 帧；行顺序 `down,left,right,up`；每行列顺序 `idle 0–3`、`forward 4–9`、`backward 10–15`、`strafeLeft 16–21`、`strafeRight 22–27`、`hit 28–29`。
- Gate 2 原型不是完整表：只含 down 的 28 个 locomotion 帧，固定 1792×64；不含 hit、不填充 left/right/up、不进入普通 URL 或 production 解析路径。
- 四个方向必须原生绘制；生产 `right` 不得镜像 `left`，运行时生产角色始终 `flipX=false`。
- 面朝只读取成功提交攻击后留下的 `playerFacingAngle`；WASD 速度只选择待机、前进、后退、左横移或右横移，不写回任何玩法状态。
- 停止阈值沿用当前语义：`velocity.lengthSq() <= 1` 为 `idle`；受击覆盖持续 120ms，结束后立即恢复由面朝与速度决定的动作。
- 新角色显示缩放为 `1.0`；Gate 2 down 原型按 `1.0` 显示，left/right/up 和 hit 继续使用原始 legacy sheet 的 `1.2`，不得复制进 prototype；最终 production 为 `1.0`；所有纹理切换都走保体路径，玩家 Arcade Body 始终为 24×24。
- 新表缺失、不是精确 120 帧或动画注册抛错时，游戏必须启动并回退；每个失败 sheet key 每次 AnimationManager 生命周期只警告一次。
- 动画注册必须事务化；失败时删除本次创建的全部生产动画 key，不留下半注册动画、对象、计时器或监听器。
- 不新增角色选择 UI、角色技能、角色存档字段、姓名、肖像或背景故事。
- 未来每个角色必须拥有独立完整 sheet，不得共享同一角色表后只换颜色；本阶段只注册默认角色。
- 不恢复悬浮武器、延迟装具或遮挡人物的额外模块；人物帧只包含紧凑制式持枪轮廓，不按三种武器生产三套角色动画。
- 用户负责三次主观视觉验收；Agent 负责 TDD、资源合同、自动测试、生产构建、独立审查、diff check、浏览器 smoke 和素材来源登记。
- 用户未明确接受当前视觉门时，暂停后续素材生产，只修复当前门内问题。
- 设计直接批准的常量是 64×64、44–50 可见高、四方向、动作帧数与 120 帧最终布局；`baseline y=56`、`≤32` 色、production scale `1.0` 和 hit `120ms` 是从当前渲染/动画基线选出的可测试工程常量，不扩大产品方向，任何视觉门反馈要求调整时先修订计划和合同再继续。
- 每次写入 `docs/art/asset-register.md` 都必须逐项记录：来源、生成方式、逐字 prompt 或作者、许可证、修改状态、商业使用、署名要求、原始/后处理/最终 SHA-256、后处理命令、被拒绝版本及原因；无署名要求也必须显式写“无”。

## 共享文件变更门禁

`src/assets/manifest.js` 是高冲突共享接口。本阶段修改它的唯一原因是声明新角色 spritesheet key/path/frameConfig；不改 Preload 循环、不改 fallback factory 公共合同、不改任何既有 key。影响范围限于多 preload 一张 PNG；验证方法是 manifest 唯一性测试、缺失资源 fallback 测试、启动 console 检查和完整 build。开始该文件的实施任务即视为执行已批准计划；若执行时 Project Lead 未明确批准本计划，必须停在只读状态。

`src/main.js` 也是高冲突共享文件。本阶段唯一允许的变更是一个 `import.meta.env.DEV && URLSearchParams(...).get("playerCharacterPrototype") === "1"` 动态 import；默认开发 URL 和生产 build 都不安装、不暴露 prototype bridge。影响范围限于显式 prototype URL；验证方法是源码门禁、driver 单元测试、普通 URL 上全局入口不存在、prototype URL 上入口存在、build 后产物不出现 `__SCP_PLAYER_CHARACTER_PROTOTYPE__`。不得顺带调整 Scene 初始化、update、restart 或 mixin 顺序。

---

## 文件与职责映射

| 路径 | 操作 | 单一职责 |
|---|---|---|
| `scripts/art/build_player_character_assets.py` | 新建 | 从透明剪影或固定动作板确定性归一化；输出 Gate 1 游戏截图 composite、1792×64/28 帧 prototype 或 1920×256/120 帧 final |
| `scripts/art/test_player_character_assets.py` | 新建 | 对组装器做合成 fixture、参数失败、确定性、截图 composite、28 帧 prototype 和 120 帧 final 测试 |
| `test/player-character-assets.test.js` | 新建 | 锁定仓库内 prototype/final PNG、manifest、帧几何、色板、alpha、基线、真实右向和动作差异 |
| `src/assets/manifest.js` | 修改 | 分离 prototype 与 production texture key；Gate 2 声明非默认 prototype，Gate 3 评审时加入未提交 final，接受后原子移除 prototype entry 并提交 production entry |
| `src/art/characterPresentation.js` | 修改 | 只读角色 registry、动作分类、原子动画注册、两级 fallback、运行时同步 |
| `src/art/openingVisualContract.js` | 修改 | 把权威玩家素材规格拆为 frozen legacy/new contracts；Gate 3 接受前默认仍指向 legacy，接受时原子切到 response operative |
| `src/art/playerCharacterVisualStateDriver.js` | 新建 | 提供 query-gated、可恢复、只写 presentation override、零玩法/RNG/存档写入的 24 状态浏览器表现驱动 |
| `src/scene/world.js` | 修改 | 按默认角色 ID 解析纹理/缩放，继续创建相同 24×24 body |
| `src/main.js` | 修改 | 仅在 `import.meta.env.DEV` 且 URL 含 `playerCharacterPrototype=1` 时动态安装表现驱动 |
| `test/character-presentation.test.js` | 修改 | 锁定 registry、动作投影、hit 覆盖、无镜像、原子回滚、warn-once、fallback 链和保体合同 |
| `test/art-assets.test.js` | 修改 | 保留既有素材门禁，并断言新 key 不与旧 key/R-17 key 冲突 |
| `test/opening-visual-contract.test.js` | 修改 | 同时锁定 48×48/48 帧 legacy 与 64×64/120 帧 new contract，并锁定 Gate 3 默认切换 |
| `test/player-character-visual-state-driver.test.js` | 新建 | 锁定 24 个状态、presentation 恢复、body 不变、玩法状态零写入以及不访问 RNG/localStorage |
| `test/presentation-rules.test.js` | 修改 | 锁定 world 仍使用 `applyDisplayScalePreservingBody`，且不改通用敌人/Boss scale 常量 |
| `public/assets/art/characters/player-response-operative-prototype.png` | Gate 2 临时新增、Gate 3 删除 | 仅承载通过用户验收的 down 方向 28 帧，不含 hit 或 legacy 兼容行，不作为 production default |
| `public/assets/art/characters/player-response-operative.png` | Gate 3 新建 | 最终 1920×256、120 帧生产角色表 |
| `docs/art/asset-register.md` | 修改 | 记录三剪影、原型、完整表的工具、逐字 prompt、输入、后处理、SHA-256、许可证、商业状态、选中/拒绝原因 |
| `.superpowers/sdd/player-character/` | 本地生成、不暂存 | raw/cutout、contact sheet、截图、console/body 快照和审查记录；不再承载无定义的状态驱动源码 |

不修改：`src/scenes/PreloadScene.js`、`src/scenes/preloadOrchestration.js`、`src/assets/fallbackTextureFactory.js`、武器/伤害/移动/存档代码。

## 精确运行时接口

`src/art/characterPresentation.js` 必须导出以下接口，后续任务只依赖这些名称：

```js
export const DEFAULT_CHARACTER_ID = "foundation-response-operative";

export const CHARACTER_PROFILES = Object.freeze({
  [DEFAULT_CHARACTER_ID]: Object.freeze({
    prototypeSheetKey: TEXTURES.playerResponseOperativePrototypeSheet,
    productionSheetKey: TEXTURES.playerResponseOperativeSheet,
    fallbackSheetKey: TEXTURES.playerOpeningSheet,
    fallbackTextureKey: TEXTURES.player,
    frameWidth: 64,
    frameHeight: 64,
    prototypeFrameCount: 28,
    productionFrameCount: 120,
    displayScale: 1,
    fallbackDisplayScale: 1.2
  })
});

getPlayerMotion({ velocityX, velocityY, facingAngle }) -> PlayerMotion
getCharacterAnimationKey({ characterId, animationFamily, motion, facing }) -> string
registerOpeningCharacterAnimations(scene) -> void
resolveCharacterPresentation(scene, characterId = DEFAULT_CHARACTER_ID, { allowPrototype = false } = {}) -> CharacterPresentation
syncCharacterPresentation(scene, presentationOverride = null) -> void
```

`resolveCharacterPresentation()` 的返回值固定为：

```js
{
  characterId: "foundation-response-operative",
  textureKey: "player-response-operative-prototype-sheet" | "player-response-operative-sheet" | "player-opening-sheet" | "player-rect",
  animationFamily: "prototype" | "production" | "legacy" | "static",
  displayScale: 1 | 1.2
}
```

普通游戏调用 `resolveCharacterPresentation(..., { allowPrototype: false })`，即使 28 帧 prototype 已 preload 也绝不选中它；只有显式开发态 bridge 可以传 `{ allowPrototype: true }`。`presentationOverride` 的精确只读输入形状为 `{ facingAngle, velocityX, velocityY, hit }`，只供 `syncCharacterPresentation()` 计算本次 texture/animation/scale，既不复制进 `scene.playerFacingAngle` 或 Arcade Body，也不改 hit deadline、RNG、时钟、暂停或存档。

prototype 模式只在 `facing === "down" && motion !== "hit"` 时返回 28 帧新表并按 `1.0` 显示；left/right/up 与任意 hit 都返回原始 legacy 表及其真实动画并按 `1.2` 显示。纹理/scale 切换必须调用现有 `applyTextureAndScalePreservingBody()`；禁止把 legacy 像素复制进 28 帧 prototype。production 只有精确 120 帧时可解析，按 `1.0` 显示；否则依次回退 legacy sheet、静态 `player-rect`。

`src/art/openingVisualContract.js` 的权威玩家素材合同固定拆成两个命名规格，禁止再用单个匿名 48×48 对象代表所有正式玩家素材：

```js
export const OPENING_PLAYER_ASSET_SPECS = Object.freeze({
  legacy: Object.freeze({
    frameWidth: 48,
    frameHeight: 48,
    directions: 4,
    framesPerDirection: 12,
    totalFrames: 48,
    displayScale: 1.2,
    motions: Object.freeze({ idle: 4, move: 6, hit: 2 })
  }),
  responseOperative: Object.freeze({
    frameWidth: 64,
    frameHeight: 64,
    directions: 4,
    framesPerDirection: 30,
    totalFrames: 120,
    displayScale: 1,
    motions: Object.freeze({
      idle: 4,
      forward: 6,
      backward: 6,
      strafeLeft: 6,
      strafeRight: 6,
      hit: 2
    })
  })
});

export const DEFAULT_OPENING_PLAYER_ASSET_ID = "legacy"; // Gate 3 接受前
export const DEFAULT_OPENING_PLAYER_ASSET_SPEC =
  OPENING_PLAYER_ASSET_SPECS[DEFAULT_OPENING_PLAYER_ASSET_ID];
```

`OPENING_ASSET_SPECS.player` 必须引用 `DEFAULT_OPENING_PLAYER_ASSET_SPEC`，保留现有消费者入口。Gate 2 只增加 `responseOperative` 命名合同，不改变权威默认值；只有 Gate 3 用户明确接受后的原子 commit 才把 `DEFAULT_OPENING_PLAYER_ASSET_ID` 改为 `"responseOperative"`。legacy 合同和测试永久保留，供两级 fallback 审计。

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
- Consumes: chroma helper 输出的 RGBA cutout；Gate 1 `preview` 另消费真实 960×540 游戏截图
- Produces: `silhouette` 64×64 PNG；`preview` 960×540 PNG；`prototype` 1792×64/28 帧 PNG；`production` 1920×256/120 帧 PNG；角色输出 binary alpha、最多 32 色、baseline y=56

- [ ] **Step 1: 先写工具失败测试**

测试必须用 Pillow 现场生成 6×6 RGBA fixture，不依赖真实美术，覆盖：

测试类固定为 `PlayerCharacterAssetBuilderTests`，方法和断言逐项如下：

- `test_silhouette_is_64_square_with_48_pixel_subject_and_y56_baseline`：断言输出尺寸 `(64, 64)`、非透明 bbox 高 48、bbox bottom 为 56。
- `test_preview_composites_native_silhouette_on_960x540_without_resampling`：用像素可辨识的 960×540 背景和 64×64 剪影，断言输出仍为 `(960, 540)`，剪影逐像素原样贴到 `(anchorX - 32, anchorY - 56)`，其余背景逐像素不变。
- `test_preview_rejects_wrong_background_size_or_out_of_bounds_anchor_without_output`：背景不是 960×540 或贴图越界时退出非 0，stderr 给出实际尺寸/anchor，且不写 output。
- `test_prototype_is_1792_by_64_with_exact_28_down_frames`：断言尺寸 `(1792, 64)`；输出 frame 0–3 来自 source row 1 cells 0–3，4–9/10–15/16–21/22–27 分别来自 source rows 2–5 的六格；不存在 hit、其他方向或 legacy 像素。
- `test_production_is_1920_by_256_with_rows_down_left_right_up`：断言尺寸 `(1920, 256)`，四行按 down/left/right/up 排列；每行输出列连续映射为 idle `0–3`、forward `4–9`、backward `10–15`、strafeLeft `16–21`、strafeRight `22–27`、hit `28–29`。
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

CLI 固定为四个子命令：

```text
build_player_character_assets.py silhouette --input PATH --output PATH
build_player_character_assets.py preview --background PATH --silhouette PATH --anchor-x INT --anchor-y INT --output PATH
build_player_character_assets.py prototype --down-board PATH --output PATH
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
PROTOTYPE_SOURCE_CELLS = (0, 1, 2, 3, 6, 7, 8, 9, 10, 11,
                          12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
                          22, 23, 24, 25, 26, 27)
```

- `preview` 要求 background 精确为 960×540、silhouette 精确为 64×64；不缩放、不量化背景，以 feet anchor 语义把左上角固定为 `(anchorX - 32, anchorY - 56)`，越界即失败。
- cell 边界用 `round(column * width / 6)` 与 `round(row * height / 6)` 计算，允许 1024 等不能被 6 整除的 imagegen 输出。
- `--down-board`、`--left-board`、`--right-board`、`--up-board` 都按 6×6 source board 解析；source 的 occupied cells 是 `0–3,6–11,12–17,18–23,24–29,30–31`，但必须紧凑重排到每个 production 输出行的 frame `0–29`。`--down-hit-board` 固定按 1×2 board 解析，依次写入 down 输出行 frame 28、29。
- 每个 required cell 先取非零 alpha bbox，再以同一方向全部帧的 union bbox 计算一个 shared nearest scale；不得逐帧缩放。
- 缩放后水平中心固定 x=32，最后不透明行固定 y=56；任何帧触边、为空、可见高度不在 44–50、宽度超过 60 都抛错并不写 output。
- alpha 以 128 为界转为 0/255，透明像素 RGB 清零；整张 sheet 一次性无抖动量化到最多 32 色。
- `prototype` 只提取 `PROTOTYPE_SOURCE_CELLS`，按 idle/forward/backward/strafeLeft/strafeRight 连续打包成 28 帧单行 1792×64；不得读取 legacy sheet，不得生成 hit 或其他方向，也不得用空 cell 凑成 30/120 帧。
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
- Consumes: Task 2 `silhouette`/`preview` CLI、built-in `image_gen`、普通 URL 的真实 960×540 游戏截图
- Produces: 1×/4× contact 与三张同背景/同 anchor/原生尺寸游戏 composite，供用户明确选择一种角色身份方向；同时产出三种候选/拒绝原因的完整来源记录

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
  & $python $chroma --input ".superpowers/sdd/player-character/gate-1/raw/silhouette-$id.png" --out ".superpowers/sdd/player-character/gate-1/cutout/silhouette-$id.png" --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill --force
  & $python scripts/art/build_player_character_assets.py silhouette --input ".superpowers/sdd/player-character/gate-1/cutout/silhouette-$id.png" --output ".superpowers/sdd/player-character/gate-1/final/silhouette-$id.png"
}
& $python scripts/art/build_contact_sheet.py --inputs .superpowers/sdd/player-character/gate-1/final/silhouette-a.png .superpowers/sdd/player-character/gate-1/final/silhouette-b.png .superpowers/sdd/player-character/gate-1/final/silhouette-c.png --scale 1 --columns 3 --output .superpowers/sdd/player-character/gate-1/silhouettes-1x.png
& $python scripts/art/build_contact_sheet.py --inputs .superpowers/sdd/player-character/gate-1/final/silhouette-a.png .superpowers/sdd/player-character/gate-1/final/silhouette-b.png .superpowers/sdd/player-character/gate-1/final/silhouette-c.png --scale 4 --columns 3 --output .superpowers/sdd/player-character/gate-1/silhouettes-4x.png
```

Expected: 三张 64×64、可见高 48、baseline y=56、二值 alpha；1× contact 为 192×64，4× 为 768×256。

- [ ] **Step 3: 截取真实游戏背景并生成三张原生尺寸游戏 composite**

先只读检查端口；未知监听者存在时停止，不终止进程。端口空闲时启动固定服务：

```powershell
Get-NetTCPConnection -LocalPort 64126 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess
npm run dev -- --host 127.0.0.1 --port 64126 --strictPort
```

用 `browser:control-in-app-browser` 把 viewport 固定为 960×540，在普通 `http://localhost:64126/` 完成标题→选武器→进入实战；选择一块 `(600, 360)` 周围 64×64 内没有角色、敌人、掉落物、弹道或 HUD 的可见地板，保存当前真实页面截图为 `.superpowers/sdd/player-character/gate-1/gameplay-base-960x540.png`。截图若不是精确 960×540，或 anchor 区域不空，必须重截，禁止缩放截图。

```powershell
$python = 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
foreach ($id in @('a','b','c')) {
  & $python scripts/art/build_player_character_assets.py preview --background .superpowers/sdd/player-character/gate-1/gameplay-base-960x540.png --silhouette ".superpowers/sdd/player-character/gate-1/final/silhouette-$id.png" --anchor-x 600 --anchor-y 360 --output ".superpowers/sdd/player-character/gate-1/silhouette-$id-game-960x540.png"
}
```

Expected: 三张输出都精确 960×540，背景和 anchor 完全相同；64×64 候选不经过缩放，脚底固定在 `(600, 360)`。这些图只证明真实游戏中的比例/像素密度，不声称 Gate 1 已做运行时接入；真正接入发生在 Gate 2。

- [ ] **Step 4: Agent 先做硬门槛筛选**

逐张检查：成年女性、俯视透视、头发/头部轮廓、专业制服、呼吸/护目装备、单一识别色、紧凑持枪、无浮空模块；任何候选不合格只做一次单点 prompt 修正并保留原拒绝原因。

- [ ] **Step 5: 用户视觉验收门 1**

同时展示 1×、4× contact sheet 与三张 960×540 游戏 composite，并请用户明确回复“接受 A/B/C”或指出修改。用户没有明确接受前停止；不生成动作板、不改 manifest、不提交素材。

- [ ] **Step 6: 登记真实来源并提交选择记录**

在 `docs/art/asset-register.md` 新增“玩家角色 Gate 1 剪影”小节。A/B/C 每项都必须显式记录：来源；生成方法与工具版本；逐字 prompt/作者；许可证；修改状态；商业使用状态；署名要求（没有也写“无”）；raw、cutout、final 的 SHA-256；完整 chroma/silhouette/preview 后处理命令；选中或拒绝结论及原因。另记录 gameplay base/composite 的 SHA-256、用户选择、无第三方图像输入、OpenAI 输出权利需在商业发布前复核；审计路径注明 `.superpowers/sdd/player-character/gate-1/` 不暂存。

```powershell
Get-FileHash -Algorithm SHA256 .superpowers/sdd/player-character/gate-1/raw/*.png
Get-FileHash -Algorithm SHA256 .superpowers/sdd/player-character/gate-1/cutout/*.png
Get-FileHash -Algorithm SHA256 .superpowers/sdd/player-character/gate-1/final/*.png
Get-FileHash -Algorithm SHA256 .superpowers/sdd/player-character/gate-1/*960x540.png
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
- Modify: `src/art/openingVisualContract.js`
- Modify: `src/scene/world.js`
- Modify: `test/character-presentation.test.js`
- Modify: `test/art-assets.test.js`
- Modify: `test/opening-visual-contract.test.js`
- Modify: `test/presentation-rules.test.js`

**Interfaces:**
- Consumes: 本计划“精确运行时接口”、现有 `playerFacingAngle`、`sprite.body.velocity`
- Produces: `DEFAULT_CHARACTER_ID`、`CHARACTER_PROFILES`、`getPlayerMotion()`、`resolveCharacterPresentation()`；Preload 继续调用原名 `registerOpeningCharacterAnimations()`

- [ ] **Step 1: 写 registry 与纯动作分类失败测试**

在 `test/character-presentation.test.js` 先锁定：

```js
assert.equal(DEFAULT_CHARACTER_ID, "foundation-response-operative");
assert.deepEqual(CHARACTER_PROFILES[DEFAULT_CHARACTER_ID], {
  prototypeSheetKey: TEXTURES.playerResponseOperativePrototypeSheet,
  productionSheetKey: TEXTURES.playerResponseOperativeSheet,
  fallbackSheetKey: TEXTURES.playerOpeningSheet,
  fallbackTextureKey: TEXTURES.player,
  frameWidth: 64,
  frameHeight: 64,
  prototypeFrameCount: 28,
  productionFrameCount: 120,
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

再断言 `getCharacterAnimationKey({ characterId: DEFAULT_CHARACTER_ID, animationFamily: "production", motion: "backward", facing: "right" })` 精确返回 `foundation-response-operative-production-backward-right`；prototype family 只接受 down 的五种 locomotion，传 hit 或其他方向必须拒绝。

在 `test/opening-visual-contract.test.js` 同一个 RED 周期先锁定两个命名合同和 Gate 2 默认值：

```js
assert.deepEqual(OPENING_PLAYER_ASSET_SPECS.legacy, {
  frameWidth: 48,
  frameHeight: 48,
  directions: 4,
  framesPerDirection: 12,
  totalFrames: 48,
  displayScale: 1.2,
  motions: { idle: 4, move: 6, hit: 2 }
});
assert.deepEqual(OPENING_PLAYER_ASSET_SPECS.responseOperative, {
  frameWidth: 64,
  frameHeight: 64,
  directions: 4,
  framesPerDirection: 30,
  totalFrames: 120,
  displayScale: 1,
  motions: {
    idle: 4,
    forward: 6,
    backward: 6,
    strafeLeft: 6,
    strafeRight: 6,
    hit: 2
  }
});
assert.equal(DEFAULT_OPENING_PLAYER_ASSET_ID, "legacy");
assert.equal(DEFAULT_OPENING_PLAYER_ASSET_SPEC, OPENING_PLAYER_ASSET_SPECS.legacy);
assert.equal(OPENING_ASSET_SPECS.player, DEFAULT_OPENING_PLAYER_ASSET_SPEC);
```

同时断言 registry、两个 nested `motions` 和两个 spec 全部 frozen。原先只深比较 `OPENING_ASSET_SPECS.player` 为匿名 48×48 对象的断言删除，其他 facility/HUD 合同断言原样保留。

- [ ] **Step 2: 写动画注册与 fallback 失败测试**

把 scene stub 扩展为可分别声明 prototype/production/legacy frameTotal、可在第 N 次 `anims.create` 抛错、记录 `anims.remove`。测试必须覆盖：

- prototype `frameTotal === 29` 时只创建 down 的 5 个 locomotion 动画，frame index 精确为 `0–3,4–9,10–15,16–21,22–27`；不存在 prototype hit 或其他方向 key。
- production `frameTotal === 121` 时创建 24 个生产动画，frame index 使用 `row * 30 + start/end`；right 取第三行真实帧；所有生产动画不依赖 flip。
- prototype frameTotal 为 28/30 或 production 为 120/122 时，对应 batch 预检失败且不产生半注册；普通解析完全忽略 prototype，production 缺失/错误时回退旧 `player-opening-sheet`。
- 旧表也缺失时返回 `player-rect` 静态 fallback。
- prototype 第 3 个或 production 第 7 个动画创建抛错时，只删除本 batch 已创建 key，旧 12 个动画仍存在，调用不向外抛错。
- 同一 AnimationManager 对同一 sheet 重复调用只警告一次；完整注册重复调用不创建重复 key。
- `resolveCharacterPresentation(scene)` 即使 prototype 可用也只返回 production/legacy/static；`resolveCharacterPresentation(scene, id, { allowPrototype: true })` 在 29 帧表可用时可返回 prototype。
- prototype、production、legacy、static 四种解析结果的 `displayScale` 分别为 1、1、1.2、1.2。

- [ ] **Step 3: 写同步与玩法安全失败测试**

新增 table-driven 用例遍历四面向与五种 locomotion，断言 production `syncCharacterPresentation()` 播放正确 key；`hit` 在 120ms 内覆盖，结束后恢复分类动作。再传入 24 组 `presentationOverride`：down 五种 locomotion 使用 prototype/1.0；down hit 与 left/right/up 全部动作使用原始 legacy/1.2，且方向切换走 `applyTextureAndScalePreservingBody()`。生产角色每次同步都 `setFlipX(false)`；legacy 继续保留旧 right mirror 行为。override 调用前后 `scene.playerFacingAngle`、body velocity/size/offset、hit deadline、elapsed、暂停状态完全相等。

保留并加严源码门禁：

```js
assert.doesNotMatch(source, /\.body\.(?:setSize|setOffset|setCircle|setVelocity)/);
assert.doesNotMatch(source, /scene\.playerFacingAngle\s*=/);
assert.doesNotMatch(source, /presentationHitUntilMs\s*=/);
assert.doesNotMatch(source, /\.time\.(?:addEvent|delayedCall)/);
assert.doesNotMatch(source, /\.on\(|\.once\(/);
```

在 world 源码测试中断言顺序仍为 `physics.add.sprite` → `setCollideWorldBounds` → `body.setSize(24, 24)` → `applyDisplayScalePreservingBody`。

- [ ] **Step 4: 运行 RED**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/character-presentation.test.js test/art-assets.test.js test/opening-visual-contract.test.js test/presentation-rules.test.js
```

Expected: FAIL，缺少新导出、legacy/new 权威合同、prototype/production 两个 texture key、28/120 帧 layout 和 fallback 事务行为。

- [ ] **Step 5: 在 manifest 只新增 key，不声明缺失文件**

在 `TEXTURES` 中新增：

```js
playerResponseOperativePrototypeSheet: "player-response-operative-prototype-sheet",
playerResponseOperativeSheet: "player-response-operative-sheet",
```

此时不向 `SPRITESHEET_ASSETS` 加条目，确保运行时主动走旧表 fallback，不让浏览器请求不存在的文件。`test/art-assets.test.js` 断言该 key 与全部既有 texture key 唯一。

- [ ] **Step 6: 实现双权威合同、角色入口与原子注册**

先按“精确运行时接口”导出 `OPENING_PLAYER_ASSET_SPECS`、`DEFAULT_OPENING_PLAYER_ASSET_ID = "legacy"` 和 `DEFAULT_OPENING_PLAYER_ASSET_SPEC`，让 `OPENING_ASSET_SPECS.player` 引用默认规格；再实现本计划定义的 registry、motion ranges 和 classifier。注册顺序固定为 legacy 12 个、prototype 5 个、production 24 个；prototype/production 分别预检精确 `frameTotal === 29/121`，并分别做事务回滚。Gate 2 期间不得把 opening 默认合同提前切到新角色。

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

`syncCharacterPresentation()` 只处理 `scene.player`；production 根据 `getPlayerMotion()` 选动作并始终 `flipX=false`；prototype 只消费本次 `presentationOverride` 且仅接管 down locomotion；其余状态立即切回原始 legacy/1.2。legacy 保持当前 idle/move/hit 合同。任何目标动画 key 不存在时标记对应 sheet 失败、警告一次并停止本帧播放，不改 body 或玩法字段。

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
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/character-presentation.test.js test/art-assets.test.js test/opening-visual-contract.test.js test/presentation-rules.test.js test/attack-facing.test.js test/combat-presentation-equivalence.test.js
npm run build
git diff --check
```

Expected: 全绿；build 成功；未声明的新 key 不产生网络加载错误；只有一次 `missing production sheet` fallback warning；代码路径解析为 legacy sheet；24×24 body 和攻击朝向测试不变。

- [ ] **Step 9: 提交运行时合同**

```powershell
git add -- src/assets/manifest.js src/art/characterPresentation.js src/art/openingVisualContract.js src/scene/world.js test/character-presentation.test.js test/art-assets.test.js test/opening-visual-contract.test.js test/presentation-rules.test.js
git diff --cached --name-only
git commit -m "feat(art): add extensible player animation contract"
```

Expected: staged list 精确为上述八个文件；不含素材和 `.superpowers/`；`DEFAULT_OPENING_PLAYER_ASSET_ID` 仍为 `legacy`。

---

### Task 5: 视觉验收门 2——单方向动作原型接入真实游戏

**Files:**
- Generate locally, never stage: `.superpowers/sdd/player-character/gate-2/**`
- Create after acceptance: `public/assets/art/characters/player-response-operative-prototype.png`
- Create: `src/art/playerCharacterVisualStateDriver.js`
- Create: `test/player-character-assets.test.js`
- Create: `test/player-character-visual-state-driver.test.js`
- Modify: `src/assets/manifest.js`
- Modify: `src/main.js`
- Modify: `docs/art/asset-register.md`

**Interfaces:**
- Consumes: Gate 1 选定剪影、Task 2 builder、Task 4 production registry 和双权威合同
- Produces: 仅含 down 方向 idle/forward/backward/strafeLeft/strafeRight 的 28 帧真实游戏原型；其他方向与 hit 在运行时使用原始 legacy/1.2；`window.__SCP_PLAYER_CHARACTER_PROTOTYPE__` 的显式开发态入口

- [ ] **Step 1: 先写可恢复浏览器状态驱动失败测试**

在 `test/player-character-visual-state-driver.test.js` 用纯 stub 锁定：`PLAYER_CHARACTER_VISUAL_STATES` 精确包含 `down,left,right,up × idle,forward,backward,strafeLeft,strafeRight,hit` 共 24 项；每项 angle/velocity 进入 `getPlayerMotion()` 后得到同名 locomotion；玩家仍处于 hit tint 时创建 driver 明确失败；`applyState()` 只写 `player.presentationPrototypeEnabled`/`player.presentationSmokeOverride` 并返回 animation/texture/scale/body 快照；down 五种 locomotion 返回 prototype/1.0，其他 19 项返回 legacy/1.2。连续切换四方向前后 body width/height/offset 不变；`restore()` 幂等，清除 override、恢复原 texture/scale/flip/animation 与 presentation-owned 字段。EventEmitter stub 还必须证明 shutdown/destroy 任一先触发都会移除成对监听器和全局入口，restart 后每种事件最多一个 driver 监听器。

测试夹具在创建 driver 前后从外部快照并深比较 `scene.playerFacingAngle`、body velocity、scene/physics pause、elapsed、hit deadline、RNG 对象/状态和 localStorage 原始内容；24 项和异常路径都必须完全相等。另把 `Math.random` 临时替换为抛错函数，并给 `globalThis.localStorage` getter 一个抛错 stub；驱动仍全绿。注入会抛错的 `syncPresentation`，断言 `applyState()` 在 catch 内先恢复 presentation 再原样抛错。源码再锁定：

```js
assert.doesNotMatch(source, /Math\.random|Phaser\.Math\.RND|localStorage/);
assert.doesNotMatch(source, /triggerVictory|triggerGameOver|saveMetaProgress/);
assert.doesNotMatch(source, /playerFacingAngle\s*=|\.body\.setVelocity|\.velocity\.(?:x|y)\s*=/);
assert.doesNotMatch(source, /elapsedSurvivalMs\s*=|presentationHitUntilMs\s*=/);
assert.doesNotMatch(source, /\.pause\(|\.resume\(|isPaused\s*=/);
assert.equal(Object.keys(PLAYER_CHARACTER_VISUAL_STATES).length, 24);
```

- [ ] **Step 2: 运行 driver RED**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-visual-state-driver.test.js
```

Expected: FAIL，模块和导出尚不存在。

- [ ] **Step 3: 实现完整 driver 与显式开发态安装入口**

`src/art/playerCharacterVisualStateDriver.js` 固定实现以下公开接口；内部不得读取 RNG、时钟或存档：

```js
import { syncCharacterPresentation } from "./characterPresentation.js";
import { applyTextureAndScalePreservingBody } from "./presentationRules.js";

const FACING_ANGLES = Object.freeze({
  down: Math.PI / 2,
  left: Math.PI,
  right: 0,
  up: -Math.PI / 2
});
const MOTIONS = Object.freeze([
  "idle", "forward", "backward", "strafeLeft", "strafeRight", "hit"
]);
const SPEED = 80;
const clean = (value) => Math.abs(value) < 1e-9 ? 0 : value;

function velocityFor(angle, motion) {
  const forward = [Math.cos(angle), Math.sin(angle)];
  const right = [-forward[1], forward[0]];
  const units = {
    idle: [0, 0],
    forward,
    backward: [-forward[0], -forward[1]],
    strafeLeft: [-right[0], -right[1]],
    strafeRight: right,
    hit: [0, 0]
  }[motion];
  return Object.freeze({ x: clean(units[0] * SPEED), y: clean(units[1] * SPEED) });
}

export const PLAYER_CHARACTER_VISUAL_STATES = Object.freeze(Object.fromEntries(
  Object.entries(FACING_ANGLES).flatMap(([facing, angle]) => MOTIONS.map((motion) => [
    `${facing}-${motion}`,
    Object.freeze({ facing, motion, angle, velocity: velocityFor(angle, motion) })
  ]))
));

function bodySnapshot(body) {
  return Object.freeze({
    x: body.x, y: body.y, width: body.width, height: body.height,
    offsetX: body.offset?.x ?? 0, offsetY: body.offset?.y ?? 0
  });
}

export function createPlayerCharacterVisualStateDriver({
  scene,
  syncPresentation = syncCharacterPresentation
}) {
  if (!scene?.player?.body || !scene.player.anims) {
    throw new Error("player character prototype requires an active player sprite");
  }
  const player = scene.player;
  if (player.isTinted) {
    throw new Error("wait for player hit tint to clear before starting character prototype review");
  }
  const original = {
    hasPrototypeEnabled: Object.hasOwn(player, "presentationPrototypeEnabled"),
    prototypeEnabled: player.presentationPrototypeEnabled,
    hasOverride: Object.hasOwn(player, "presentationSmokeOverride"),
    override: player.presentationSmokeOverride,
    animationFamily: player.presentationAnimationFamily,
    presentationFacing: player.presentationFacing,
    textureKey: player.texture?.key ?? null,
    scale: player.scaleX,
    flipX: player.flipX,
    animationKey: player.anims.currentAnim?.key ?? null,
    animationProgress: player.anims.getProgress?.() ?? 0
  };
  let restored = false;

  function restorePresentation() {
    if (original.hasPrototypeEnabled) {
      player.presentationPrototypeEnabled = original.prototypeEnabled;
    } else {
      delete player.presentationPrototypeEnabled;
    }
    if (original.hasOverride) {
      player.presentationSmokeOverride = original.override;
    } else {
      delete player.presentationSmokeOverride;
    }
    player.presentationAnimationFamily = original.animationFamily;
    player.presentationFacing = original.presentationFacing;
    if (original.textureKey) {
      applyTextureAndScalePreservingBody(player, original.textureKey, original.scale);
    }
    player.setFlipX?.(original.flipX);
    if (original.animationKey) {
      player.play(original.animationKey, true);
      player.anims.setProgress?.(original.animationProgress);
    } else {
      player.anims.stop?.();
    }
  }

  function restore() {
    if (restored) return;
    restored = true;
    restorePresentation();
  }

  function applyState(name, { usePrototype = true } = {}) {
    if (restored) throw new Error("player character prototype driver already restored");
    const state = PLAYER_CHARACTER_VISUAL_STATES[name];
    if (!state) throw new Error(`unknown player character visual state: ${name}`);
    const beforeBody = bodySnapshot(player.body);
    try {
      const override = Object.freeze({
        facingAngle: state.angle,
        velocityX: state.velocity.x,
        velocityY: state.velocity.y,
        hit: state.motion === "hit"
      });
      player.presentationPrototypeEnabled = usePrototype;
      player.presentationSmokeOverride = override;
      syncPresentation(scene, override);
      const body = bodySnapshot(player.body);
      if (JSON.stringify(body) !== JSON.stringify(beforeBody)) {
        throw new Error(`player body changed in visual state ${name}`);
      }
      return Object.freeze({
        name,
        animationKey: player.anims.currentAnim?.key ?? null,
        textureKey: player.texture?.key ?? null,
        scaleX: player.scaleX,
        scaleY: player.scaleY,
        body
      });
    } catch (error) {
      restore();
      throw error;
    }
  }

  return Object.freeze({
    listStates: () => Object.keys(PLAYER_CHARACTER_VISUAL_STATES),
    applyState,
    restore
  });
}

export function installPlayerCharacterVisualStateBridge(scene, windowRef = window) {
  const driver = createPlayerCharacterVisualStateDriver({ scene });
  windowRef.__SCP_PLAYER_CHARACTER_PROTOTYPE__?.restore?.();
  Object.defineProperty(windowRef, "__SCP_PLAYER_CHARACTER_PROTOTYPE__", {
    configurable: true,
    value: driver
  });
  const cleanup = () => {
    driver.restore();
    delete windowRef.__SCP_PLAYER_CHARACTER_PROTOTYPE__;
    scene.events.off("shutdown", cleanup);
    scene.events.off("destroy", cleanup);
  };
  scene.events.once("shutdown", cleanup);
  scene.events.once("destroy", cleanup);
  return driver;
}
```

在 `PrototypeScene.create()` 最后、`updateUI()` 之后只加入：

```js
if (
  import.meta.env.DEV
  && new URLSearchParams(window.location.search).get("playerCharacterPrototype") === "1"
) {
  import("./art/playerCharacterVisualStateDriver.js")
    .then(({ installPlayerCharacterVisualStateBridge }) => {
      installPlayerCharacterVisualStateBridge(this, window);
    })
    .catch((error) => console.error("[player-character-prototype]", error));
}
```

- [ ] **Step 4: 运行 driver GREEN 并单独提交 prototype seam**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-visual-state-driver.test.js
npm run build
if (rg -n "__SCP_PLAYER_CHARACTER_PROTOTYPE__" dist) { throw 'prototype bridge leaked into production build' }
git diff --check
git add -- src/art/playerCharacterVisualStateDriver.js src/main.js test/player-character-visual-state-driver.test.js
git diff --cached --name-only
git commit -m "test(art): add read-only player prototype driver"
```

Expected: driver 测试全绿；build 成功；显式检查不抛错，证明生产 build 没有 prototype 全局入口；staged list 精确为三个文件。测试外部快照证明 driver 没有写朝向、速度、hit、暂停、时钟、RNG 或存档。

- [ ] **Step 5: 写 prototype 资源合同失败测试**

`test/player-character-assets.test.js` 先断言：

```js
assert.equal(
  TEXTURES.playerResponseOperativePrototypeSheet,
  "player-response-operative-prototype-sheet"
);
assert.deepEqual(
  SPRITESHEET_ASSETS.find(
    ({ key }) => key === TEXTURES.playerResponseOperativePrototypeSheet
  ),
  {
    key: "player-response-operative-prototype-sheet",
    path: "assets/art/characters/player-response-operative-prototype.png",
    frameConfig: { frameWidth: 64, frameHeight: 64 }
  }
);
```

PNG 门禁固定为 1792×64、8-bit RGBA、28 帧、binary alpha、≤32 色；五个目标 motion 各自帧数精确为 4/6/6/6/6，translation-normalized hash 全唯一，每帧高 44–50、每个 motion 的可见高中位数为 48–50、baseline y=56±1、左右漂移≤2。测试另读取仓库真实 `player-opening-sheet.png`：确认其四行原生可见高仍为 40–42，并按 runtime `1.2` 计算显示高度；prototype 各 motion 中位显示高与 legacy 各方向中位显示高的最大差必须 ≤2 像素。这样在不复制 legacy 像素的前提下自动阻止方向切换缩小。测试同时断言不存在第 29 帧、第二行或 hit/legacy 像素；production key 尚未出现在 `SPRITESHEET_ASSETS`，普通 `resolveCharacterPresentation()` 仍返回 legacy。

- [ ] **Step 6: 运行 prototype RED**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-assets.test.js
```

Expected: FAIL，prototype PNG 和 manifest entry 尚不存在。

- [ ] **Step 7: 生成 down 方向 6×6 原型板**

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

- [ ] **Step 8: 去色键并组装 prototype**

```powershell
$python = 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
& $python 'C:\Users\24037\.codex\skills\.system\imagegen\scripts\remove_chroma_key.py' --input .superpowers/sdd/player-character/gate-2/raw/down-prototype.png --out .superpowers/sdd/player-character/gate-2/cutout/down-prototype.png --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill --force
& $python scripts/art/build_player_character_assets.py prototype --down-board .superpowers/sdd/player-character/gate-2/cutout/down-prototype.png --output public/assets/art/characters/player-response-operative-prototype.png
```

Expected: 1792×64；frame 0–27 依次为新 idle/forward/backward/strafeLeft/strafeRight；没有 hit、其他方向、legacy 输入、逐帧缩放或镜像生成。

- [ ] **Step 9: 声明 prototype 并跑 GREEN**

向 `SPRITESHEET_ASSETS` 增加：

```js
{
  key: TEXTURES.playerResponseOperativePrototypeSheet,
  path: "assets/art/characters/player-response-operative-prototype.png",
  frameConfig: { frameWidth: 64, frameHeight: 64 }
},
```

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-assets.test.js test/player-character-visual-state-driver.test.js test/character-presentation.test.js test/art-assets.test.js test/opening-visual-contract.test.js test/attack-facing.test.js test/combat-presentation-equivalence.test.js
npm run build
```

Expected: 全绿；prototype 只在 `{ allowPrototype: true }`/显式 query 路径可解析，普通 URL 与 opening 默认仍使用 legacy；攻击/伤害结果仍等价。

- [ ] **Step 10: 生成原生尺寸审查图**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/build_contact_sheet.py --inputs public/assets/art/characters/player-response-operative-prototype.png --scale 1 --columns 1 --output .superpowers/sdd/player-character/gate-2/prototype-sheet-1x.png
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/build_contact_sheet.py --inputs public/assets/art/characters/player-response-operative-prototype.png --scale 4 --columns 1 --output .superpowers/sdd/player-character/gate-2/prototype-sheet-4x.png
```

Expected: 1× 1792×64；4× 7168×256。contact 只显示 down 的五种动作；四方向切换尺寸必须在真实游戏 smoke 中检查，不能靠往 prototype 填 legacy 行伪造。

- [ ] **Step 11: Agent 浏览器 prototype smoke**

先只读检查端口：

```powershell
Get-NetTCPConnection -LocalPort 64126 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess
```

未知监听者存在时停止，不终止进程。端口空闲时启动：

```powershell
npm run dev -- --host 127.0.0.1 --port 64126 --strictPort
```

先在普通 `http://localhost:64126/` 完成标题→武器选择→实战→暂停→restart，确认仍显示 legacy，并在页面上下文执行 `typeof window.__SCP_PLAYER_CHARACTER_PROTOTYPE__`，Expected: `"undefined"`。再打开 `http://localhost:64126/?playerCharacterPrototype=1`，固定 viewport 960×540；等待入口存在后执行：

```js
const driver = window.__SCP_PLAYER_CHARACTER_PROTOTYPE__;
if (!driver) throw new Error("player character prototype bridge missing");
const states = driver.listStates();
if (states.length !== 24) throw new Error(`expected 24 states, got ${states.length}`);
states;
```

浏览器控制器必须在自己的 `try/finally` 中逐个执行 `driver.applyState(stateName)` 并在每次调用后截图/记录返回 JSON；`finally` 的页面命令固定为：

```js
window.__SCP_PLAYER_CHARACTER_PROTOTYPE__?.restore();
```

执行顺序固定为每个方向的 `idle,forward,backward,strafeLeft,strafeRight,hit`，方向顺序 `down,left,right,up`。保存全部 24 份 JSON 到 `.superpowers/sdd/player-character/gate-2/state-snapshots.json`；截图至少包含 down 的五种 locomotion，以及 down→left→right→up 的 idle 和 forward，共 11 张。每次 `applyState()` 都同步比较调用前/返回 body snapshot；不得通过暂停 physics、写 velocity/facing/hit/elapsed、自然刷怪、等待自动攻击、改 Scene 源码、改 RNG、写 `localStorage` 或调用胜负/发奖入口制造状态。

Expected: down 五种 locomotion 使用 28 帧 prototype/1.0，肉眼不同且无月球漫步；down hit 与 left/right/up 的全部状态使用未经复制的原始 legacy/1.2。四方向连续切换时人物显示高度约 48–50.4 像素、比例无明显跳变、baseline 不跳；24 个返回值 texture/scale/family 正确；每次调用前后 body 都为 24×24 且 x/y/offset 不因表现切换改变；普通 URL 不暴露 bridge；console error 0、prototype warning 0；`restore()` 只恢复 presentation，测试已证明 velocity/facing/hit/elapsed/pause/RNG/storage 从未被 driver 写入。

- [ ] **Step 12: 用户视觉验收门 2**

向用户提供 1× contact、down 五动作截图、四方向切换对比截图和稳定 `http://localhost:64126/?playerCharacterPrototype=1`。请用户判断 down 方向的身份、比例、像素密度、前进/后退/左右横移、滑行和月球漫步，并确认切到原始 legacy left/right/up 或 hit 时角色不缩小；legacy 状态的动作质量不作为 Gate 2 接受条件。未明确接受前不制作其他方向或 hit、不提交 prototype；反馈只修当前 28 帧原型并重复 Steps 7–12。

- [ ] **Step 13: 登记并提交已接受 prototype**

在 asset register 明确记录：来源；生成方法与工具版本；逐字 prompt/作者；Image 1 身份来源；许可证；修改状态；商业使用状态；署名要求（没有也写“无”）；raw/cutout/prototype SHA-256；完整 chroma/builder 命令；用户接受结论；所有拒绝版本及原因。明确写明 prototype 不含 hit、其他方向或 legacy 像素，legacy 只在运行时 fallback，OpenAI 输出权利须在商业发布前复核。

```powershell
git add -- public/assets/art/characters/player-response-operative-prototype.png src/assets/manifest.js test/player-character-assets.test.js docs/art/asset-register.md
git diff --cached --name-only
git commit -m "feat(art): integrate approved player locomotion prototype"
```

Expected: staged list 精确为四个文件；不含 raw/cutout/contact/screenshot/state JSON；driver 已在独立 smoke-seam commit 提交，`DEFAULT_OPENING_PLAYER_ASSET_ID` 仍为 `legacy`。

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

- [ ] **Step 1: 保留 28 帧 prototype 合同并新增 final RED**

不修改已经通过的 1792×64/28 帧 prototype 断言；新增独立 production manifest/PNG 期望，路径为 `assets/art/characters/player-response-operative.png`。final 资源门禁遍历四行六动作并断言：

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

Expected: FAIL，final PNG/production manifest entry 尚未存在；原有 prototype 合同仍通过，并明确证明它只有 28 帧、没有 legacy 行。

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
  & $python $chroma --input ".superpowers/sdd/player-character/gate-3/raw/$id.png" --out ".superpowers/sdd/player-character/gate-3/cutout/$id.png" --auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill --force
}
& $python scripts/art/build_player_character_assets.py production --down-board .superpowers/sdd/player-character/gate-2/cutout/down-prototype.png --down-hit-board .superpowers/sdd/player-character/gate-3/cutout/down-hit.png --left-board .superpowers/sdd/player-character/gate-3/cutout/left.png --right-board .superpowers/sdd/player-character/gate-3/cutout/right.png --up-board .superpowers/sdd/player-character/gate-3/cutout/up.png --output public/assets/art/characters/player-response-operative.png
```

保留 prototype 的独立 manifest entry，另向 `SPRITESHEET_ASSETS` 增加 production key/path `TEXTURES.playerResponseOperativeSheet` → `assets/art/characters/player-response-operative.png`。这使当前未提交候选可在普通开发 URL 中接受最终审查；Gate 3 用户接受前不暂存、不提交，也不删除 prototype，`DEFAULT_OPENING_PLAYER_ASSET_ID` 仍为 `legacy`。

- [ ] **Step 6: 运行 final GREEN 与定向玩法回归**

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_player_character_assets.py
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-assets.test.js test/character-presentation.test.js test/art-assets.test.js test/presentation-rules.test.js test/attack-facing.test.js test/attack-feedback-notification.test.js test/hit-feedback-notification.test.js test/combat-presentation-equivalence.test.js
npm run build
git diff --check
```

Expected: 全绿；prototype 28 帧与 final 120 帧两套合同同时通过；build 成功；down locomotion 像素未漂移；攻击提交/弹道/伤害等价；opening 权威默认仍为 legacy；没有 whitespace error。

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
- Modify only after Gate 3 acceptance: `src/art/openingVisualContract.js`
- Modify only after Gate 3 acceptance: `test/opening-visual-contract.test.js`
- Generate locally, never stage: `.superpowers/sdd/player-character/gate-3/review/**`

**Interfaces:**
- Consumes: 完整 final 候选和全部自动测试
- Produces: 无 Critical/Important finding、浏览器证据、用户最终接受或精确返工项

- [ ] **Step 1: 使用 `superpowers:requesting-code-review` 做两路独立只读审查**

在 Subagent-Driven 执行中分两路、互不修改：

1. 玩法/生命周期审查：`playerFacingAngle` 只读、body 24×24、攻击/移动/伤害等价、注册回滚、fallback 顺序、warn-once、restart 无残留；
2. 素材/表现审查：registry 接口、120 帧索引、四真实方向、动作分类符号、scale/baseline、pixel contract、legacy/new 双合同与当前默认仍为 legacy、来源登记、无浮空模块。

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
if (rg -n "__SCP_PLAYER_CHARACTER_PROTOTYPE__" dist) { throw 'prototype bridge leaked into production build' }
git diff --check
$phaseBase = Get-Content -LiteralPath '.superpowers\sdd\player-character\execution-baseline.txt' -Raw
git diff --check "$($phaseBase.Trim())..HEAD"
git status --short --branch
```

Expected: 全部 Node/Python 测试 0 fail；build 成功且生产 bundle 不含 prototype bridge；diff 无 whitespace error；`DEFAULT_OPENING_PLAYER_ASSET_ID` 仍为 `legacy`；状态只包含尚未提交的 final candidate、manifest/test/register 修改以及既有 `?? .superpowers/`。

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

用 `http://localhost:64126/?playerCharacterPrototype=1` 加载 Task 5 已提交的 `window.__SCP_PLAYER_CHARACTER_PROTOTYPE__`，但 Gate 3 的 24 状态调用必须逐项使用 `driver.applyState(stateName, { usePrototype: false })`，从而强制审查 production 而不是仍在 worktree 的 28 帧 prototype。浏览器控制器必须用 `try/finally` 调用 `restore()`。截图和 JSON 快照保存到 `.superpowers/sdd/player-character/gate-3/review/`，不暂存。driver 只写 presentation override，不访问或写入 facing/velocity/hit/time/pause/RNG/`localStorage`；真实武器、暂停和 restart 流程通过正常 UI/input 单独执行，不得调用会发奖的胜利/失败内部触发器。

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

在 `docs/art/asset-register.md` 对 down-hit/left/right/up/final 每项显式记录：来源；生成方法与工具版本；逐字 prompt/作者；输入引用；许可证；修改状态；商业使用状态；署名要求（没有也写“无”）；每张 raw/cutout/final 的 SHA-256；完整 chroma/builder 命令；Gate 2 down 帧复用事实；所有拒绝/中断版本及原因；用户 Gate 1/2/3 接受结论；无第三方图像输入；OpenAI 输出权利商业发布前复核。把 prototype 条目标记为“Gate 2 历史候选，已由 final 替代”，保留其 hash 和来源记录。

先把 `test/opening-visual-contract.test.js` 的默认合同断言改为：

```js
assert.equal(DEFAULT_OPENING_PLAYER_ASSET_ID, "responseOperative");
assert.equal(
  DEFAULT_OPENING_PLAYER_ASSET_SPEC,
  OPENING_PLAYER_ASSET_SPECS.responseOperative
);
assert.equal(OPENING_ASSET_SPECS.player, DEFAULT_OPENING_PLAYER_ASSET_SPEC);
assert.deepEqual(OPENING_PLAYER_ASSET_SPECS.legacy, expectedLegacyPlayerSpec);
```

同一 RED 周期把 `test/player-character-assets.test.js` 的 Gate 2 临时 entry 断言改为最终状态：

```js
assert.equal(
  SPRITESHEET_ASSETS.some(
    ({ key }) => key === TEXTURES.playerResponseOperativePrototypeSheet
  ),
  false
);
assert.equal(
  existsSync("public/assets/art/characters/player-response-operative-prototype.png"),
  false
);
assert.equal(
  SPRITESHEET_ASSETS.some(
    ({ key, path }) => key === TEXTURES.playerResponseOperativeSheet
      && path === "assets/art/characters/player-response-operative.png"
  ),
  true
);
```

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/opening-visual-contract.test.js test/player-character-assets.test.js
```

Expected: FAIL；opening actual default 仍为 `legacy`，prototype file/manifest entry 也仍存在；legacy 命名合同与 production 120 帧合同继续通过。

然后只把 `src/art/openingVisualContract.js` 的默认 ID 改为：

```js
export const DEFAULT_OPENING_PLAYER_ASSET_ID = "responseOperative";
```

从 `SPRITESHEET_ASSETS` 删除 prototype entry，只保留 production entry，并执行受控删除：

```powershell
git rm -- public/assets/art/characters/player-response-operative-prototype.png
```

普通运行因此只 preload final；缺失/错误 final 时仍按 production → legacy → static fallback。`TEXTURES.playerResponseOperativePrototypeSheet` 可作为无资源的开发接口 key 保留，但不得成为默认合同或产生网络请求。

运行原子切换 GREEN：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/opening-visual-contract.test.js test/player-character-assets.test.js test/character-presentation.test.js test/player-character-visual-state-driver.test.js
npm run build
```

Expected: 全绿且 build 成功；new contract 成为权威默认，legacy contract 仍按 48×48/48 帧/1.2 完整导出供 fallback。

```powershell
git add -- public/assets/art/characters/player-response-operative.png src/assets/manifest.js src/art/openingVisualContract.js test/player-character-assets.test.js test/opening-visual-contract.test.js docs/art/asset-register.md
git diff --cached --name-only
git diff --cached --check
git commit -m "feat(art): ship response operative animation set"
```

Expected staged list：final PNG、只含 production 新 entry 的 manifest、opening contract、asset/opening tests、asset register，以及 prototype 删除；默认合同切换、prototype preload 移除与 final 素材同一 commit；不含 `.superpowers/` 或其他文件。

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
if (rg -n "__SCP_PLAYER_CHARACTER_PROTOTYPE__" dist) { throw 'prototype bridge leaked into production build' }
git diff --check
git status --short --branch
git log --oneline --decorate -8
git rev-list --left-right --count origin/feature/ui-art-overhaul...HEAD
```

Expected: 全部测试 0 fail、build 成功、生产 build 不含 prototype bridge、diff check 通过；工作区只剩 `?? .superpowers/`；分支仍为 `feature/ui-art-overhaul`；没有 merge/push。

- [ ] **Step 2: 最终 runtime smoke 不复用旧证据**

先用普通 URL 验证 prototype 全局入口不存在并重新走标题→选武器→四方向动作→受击→暂停→restart；再用 `?playerCharacterPrototype=1` 新建 driver，依次执行 24 个 `applyState(name, { usePrototype: false })` 并在 `finally` 调用 `restore()`，重新读取 console、texture、animation key 和 body snapshot。此时 prototype 文件/manifest entry 已删除，24 项都必须使用 production；若服务已停止，按 Task 5 的端口只读检查后重新启动；不得把历史截图当成当前 HEAD 证据。

- [ ] **Step 3: 最终报告**

报告必须包含：

- worktree、分支、最终 HEAD、相对远端 ahead/behind；
- 本阶段 commit 列表及每个 commit 目的；
- final PNG 路径、尺寸、帧数、SHA-256、来源登记摘要；
- `OPENING_PLAYER_ASSET_SPECS.legacy` 与 `.responseOperative` 均保留、默认已原子切到 `responseOperative` 的测试证据；
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
