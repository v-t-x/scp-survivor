# Phase 1 玩家表现基础实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不改变移动、碰撞、自动攻击、伤害、成长、六分钟流程、Boss、胜负和存档的前提下，把玩家的“游戏判定点”和“屏幕上看到的人物”分开，建立脚底锚点、接地阴影、轻量移动重量、受击/冲刺反馈和完整回退，并完成新的 body-only 角色 Body Gate A/B/C。

**Architecture:** `this.player` 继续是唯一 Arcade Physics 玩家、摄像机跟随目标、敌人追踪目标和攻击中心；新增 `playerPresentation` 只读取冻结的基础状态快照，拥有可见人物及 Phase 1.5 开发态 dummy equipment。普通游戏在整个 Phase 1 仍显示 legacy `player-opening-sheet`，只是由独立表现对象承载；body-only 人物只在显式开发预览中出现。只有未来 Phase 2 Weapon Gate C 被用户接受后，body-only 人物和正式 Equipment Presentation 才允许作为一个整体切换为默认。

**Tech Stack:** Phaser 3.90、Vite 7、JavaScript ES Modules、Node.js `node:test`、Python 3 + Pillow、ImageGen、Codex in-app browser、960×540 真实游戏 smoke。

## Global Constraints

- 本计划只覆盖 Phase 1，不实现正式手枪、霰弹枪、特斯拉武器层，不改变弹丸起点，不实现真实枪口，不实现光刃。
- 产品定位保持“Vampire Survivors 核心循环 + 更强的基金会干员与装备表现”，不增加手动瞄准、手动攻击、连招或复杂动作状态机。
- 目标代码基线固定为 `feature/ui-art-overhaul` 已提交状态 `2ae03850c955df3f95f1e2230ea81515b7236b43`。
- `C:\scp-survivor-workspaces\active\ui-art` 中现有五个修改文件、`.superpowers\`、`PLAYER-CHARACTER-HANDOFF.md` 和旧带枪 Gate 3 PNG 全部冻结；不清理、不 stash、不覆盖、不暂存、不提交。
- 正式实施使用新的隔离分支 `feature/player-combat-presentation-overhaul` 和 worktree `C:\scp-survivor-workspaces\active\player-combat-presentation-overhaul`。该分支名称、职责、worktree 创建和 Phase 1 实施都必须先得到项目所有者明确授权。
- `.superpowers\` 只保存原始生成图、候选图、接点标记图、截图和审查证据，永不暂存。所有 `git add` 必须列出精确文件，禁止 `git add -A` 和 `git add .`。
- 不修改 `package.json`、`package-lock.json`、`src/scenes/PreloadScene.js`、`src/scenes/preloadOrchestration.js`、`src/assets/fallbackTextureFactory.js`、`src/config/balance.js`、武器数值、敌人 AI、胜负、时间轴或存档。
- `src/main.js` 和 `src/assets/manifest.js` 是共享文件。计划已经限定修改原因、影响和验证，但执行前仍需项目所有者批准本计划。
- 普通 URL 在 Phase 1 结束时仍选择 legacy `player-opening-sheet`；不得把无正式武器的 body-only 人物设为普通游戏默认。
- 新 body-only 预览是一个完整包：人物表、正确帧数、连接位置、Phase 1.5 dummy equipment 和销毁路径必须同时有效；任一部分失败就整包回退到 legacy，不显示裸人物、空气装备、双装备或残留对象。
- `this.player` 的 24×24 Arcade Body、坐标、速度、active 状态、碰撞关系、摄像机跟随和所有玩法消费者保持不变。表现代码不得写入这些字段。
- 接地阴影继续跟随玩法锚点，不跟随人物的程序化起伏；这样人物抬脚或受击时阴影仍固定在地面。
- legacy 48×48 动画的已验证不透明脚底行为 `y=44`，body-only 64×64 固定 baseline `y=56`；静态矩形 fallback 使用纹理底边。三者都对齐到玩法锚点 `y + 12`，不能共用一个错误的 origin。
- 120 帧是完整四方向总预算：每方向 idle 4、forward 6、backward 6、strafeLeft 6、strafeRight 6、hit 2。dash、后坐和倾斜使用程序表现，不额外生成 attack/dash 动画表。
- 旧带枪 Gate 3 和旧 Gate 2 原型只保留为历史证据，不作为新 body-only 的直接修改来源，也不进入新 fallback。
- 每个 Body Gate 都需要项目所有者明确接受；未接受当前门时只修当前门，不生成下一门素材。
- 自动测试不能代替原生 1× 素材检查、960×540 实机画面和用户试玩。
- 本计划中的 commit 都是独立授权门。若用户只批准实施而未批准 commit，就在验证完成后保留未提交的精确变更并报告，不能执行任何 commit 命令。
- 不 push、不建 PR、不 merge、不 tag、不 Release、不部署，除非用户之后分别明确授权。

## 外部评审处理结果

| 评审意见 | 处理 |
|---|---|
| Phase 1 与 Phase 2 之间先验证接点 | 纳入 Phase 1.5；复用 Body Gate B/C 的 dummy equipment，不增加正式阶段 |
| 定义武器方向坐标系 | 纳入 `Equipment local coordinate`，统一 `local +X`、pivot 和 action point |
| Tesla 不应受手枪架构限制 | 统一使用 Equipment Presentation 语义；Phase 2 仍只做已批准的三种装备 |
| 说明光刃验证理由 | 已补入设计文档；不进入本 Phase 1 实施 |
| 提升素材与玩家感受门槛 | 保留单方向先行，并明确 120 帧总预算与 Player Feel Goals |

## Phase 1 Player Feel Goals

普通游戏中：

- 角色仍是现有可用的基金会干员，不会突然变成无武器半成品。
- 人物脚底有稳定落点，阴影不随身体上下漂移。
- 移动时会有非常轻的步态起伏、方向倾斜和速度匹配，不改变移动速度。
- 受击闪红、无敌闪烁、开火后坐和冲刺表现作用在“看到的人物”上，不作用在碰撞体上。
- 暂停、失败、胜利和 restart 后不会残留旧人物、监听器或 tween。

显式开发预览中：

- 可以逐步查看新的 body-only 单方向原型和最终四方向 120 帧。
- Phase 1.5 dummy equipment 只用于确认手部连接、遮挡、旋转和漂移，不代表 Phase 2 正式装备。
- 自动攻击保持原样；开发预览要能让人看懂角色正在使用什么方向的测试装备，但不能改变攻击目标和结果。
- body-only 资源不完整时自动显示 legacy 角色。

## 共享文件变更说明

### `src/main.js`

原因：创建、逐帧更新和销毁 `playerPresentation`，并用一个可清理的开发预览入口替代现有匿名 `update` 监听器。

影响：仅角色显示和开发预览生命周期；不改变 Scene 启动顺序、玩法 update 顺序、计时、攻击或胜负。

验证：生命周期测试、三次 restart、普通 URL/开发 URL smoke、生产 build 中不存在开发全局入口。

### `src/assets/manifest.js`

原因：Body Gate B/C 需要声明新的 body-only 开发 spritesheet。

影响：多预加载一张开发候选或最终 body-only PNG；普通游戏解析仍明确返回 legacy。

验证：manifest key/path 唯一性、精确帧数、缺失资源整包 fallback、普通 URL 默认解析测试、console 检查。

### `src/scene/world.js`

原因：保留现有玩法玩家，同时在其成功创建后建立独立可见人物。

影响：`this.player` 仍是原对象；新增 `this.playerPresentation`。摄像机、碰撞器和敌人继续引用 `this.player`。

验证：24×24 body、对象身份、camera target、collider target、敌人追踪、fallback 测试。

## 文件与职责映射

| 路径 | 操作 | Phase 1 单一职责 |
|---|---|---|
| `src/art/playerPresentationModel.js` | 新建 | 从玩法状态生成冻结快照，并计算脚底、轻量起伏、倾斜和动画速度 |
| `src/art/playerPresentationController.js` | 新建 | 事务化创建/更新/暂停/销毁可见人物，失败时恢复玩法锚点显示 |
| `src/art/playerResponseOperativeBodySockets.js` | Body Gate B 新建，Gate C 扩展 | 由工具生成的只读每帧连接位置模块 |
| `scripts/art/data/player-response-operative-body-sockets.json` | Body Gate B 新建，Gate C 扩展 | 连接位置的权威可审计源数据 |
| `src/art/characterPresentation.js` | 修改 | 让动画同步可以作用于独立可见 Sprite；解析 legacy、static 和显式 body preview |
| `src/art/playerCharacterVisualStateDriver.js` | 修改 | 通过控制器预览 24 个状态；不再给玩法 Sprite 写 sticky override |
| `src/art/combatFeedback.js` | 修改 | 把已提交攻击的后坐通知转发给可见人物，失败时保留旧锚点 fallback |
| `src/scene/world.js` | 修改 | 创建不变的玩法玩家、接地阴影和独立表现控制器 |
| `src/scene/effects.js` | 修改 | 把无敌闪烁发送到表现控制器，失败时回退锚点 |
| `src/scene/combat.js` | 修改 | 把受击 tint/hit 动画发送到表现控制器，失败时回退原逻辑 |
| `src/scene/systems.js` | 修改 | 在玩法暂停/恢复完成后通知表现控制器 |
| `src/main.js` | 修改 | 更新和销毁表现控制器；安装可清理的开发预览 bridge |
| `src/assets/manifest.js` | Body Gate B/C 修改 | 声明 body-only preview spritesheet，不切换普通默认 |
| `scripts/art/build_player_character_assets.py` | 修改 | 确定性组装 body-only 表、验证/生成接点模块、输出接点叠加预览 |
| `scripts/art/test_player_character_assets.py` | 修改 | 锁定 body-only 表和接点生成失败/确定性合同 |
| `test/player-presentation-model.test.js` | 新建 | 锁定只读快照、脚底、重量参数和无玩法写入 |
| `test/player-presentation-controller.test.js` | 新建 | 锁定事务化创建、整包 fallback、更新、暂停和销毁 |
| `test/player-presentation-integration.test.js` | 新建 | 锁定 24×24 锚点、camera/collider 身份和 Scene 生命周期 |
| `test/character-presentation.test.js` | 修改 | 锁定独立 Sprite 动画和 normal/dev 解析边界 |
| `test/player-character-visual-state-driver.test.js` | 修改 | 锁定新 bridge、24 状态、无匿名监听泄漏和玩法零写入 |
| `test/presentation-rules.test.js` | 修改 | 锁定物理锚点不再承担视觉变形 |
| `test/combat-feedback.test.js` | 修改 | 锁定攻击通知到表现控制器及安全 fallback |
| `test/combat-feedback-lifecycle.test.js` | 修改 | 锁定 pause/restart/destroy 后资源回到基线 |
| `test/muzzle-flash-feedback.test.js` | 修改 | 锁定后坐目标是可见人物，弹丸/闪光起点本阶段仍不变 |
| `test/player-character-assets.test.js` | 修改 | 锁定 body-only PNG、帧、alpha、色板、基线和普通默认不切换 |
| `test/art-assets.test.js` | 修改 | 锁定新 key/path 唯一且不冲突 |
| `docs/art/asset-register.md` | 每个 Body Gate 修改 | 记录逐字 prompt、来源、修改、SHA-256、许可、选择/拒绝原因 |
| `public/assets/art/characters/player-response-operative-body-prototype.png` | Gate B 临时新增，Gate C 移除 | 仅 down 的 28 帧 body-only 开发预览 |
| `public/assets/art/characters/player-response-operative-body.png` | Gate C 新增 | 四真实方向 120 帧 body-only 开发预览 |
| `.superpowers/sdd/player-overhaul-phase1/` | 本地生成、不暂存 | 原图、候选、接点图、1× contact sheet、浏览器截图和审查证据 |

## 固定运行时接口

### 只读玩法快照

`src/art/playerPresentationModel.js` 导出：

```js
export function createPlayerPresentationSnapshot(scene) {
  const player = scene?.player;
  return Object.freeze({
    active: player?.active === true && player?.isDying !== true,
    x: Number.isFinite(player?.x) ? player.x : 0,
    y: Number.isFinite(player?.y) ? player.y : 0,
    velocityX: Number.isFinite(player?.body?.velocity?.x) ? player.body.velocity.x : 0,
    velocityY: Number.isFinite(player?.body?.velocity?.y) ? player.body.velocity.y : 0,
    facingAngle: Number.isFinite(scene?.playerFacingAngle) ? scene.playerFacingAngle : 0,
    elapsedMs: Number.isFinite(scene?.elapsedSurvivalMs) ? scene.elapsedSurvivalMs : 0,
    dashActive:
      Number.isFinite(scene?.dashUntilMs)
      && Number.isFinite(scene?.elapsedSurvivalMs)
      && scene.elapsedSurvivalMs < scene.dashUntilMs
  });
}
```

快照只能包含原始布尔值和数字，不包含 Scene、Sprite、Body、敌人、武器或可变对象引用。

### 移动重量模型

固定工程常量：

```js
export const PLAYER_PRESENTATION_MOTION = Object.freeze({
  footOffsetY: 12,
  maxMoveBobPx: 1.25,
  maxMoveLeanRadians: Math.PI / 90,
  maxDashLeanRadians: Math.PI / 45,
  animationRateMin: 0.85,
  animationRateMax: 1.35
});
```

- 停止阈值继续是 `velocityX² + velocityY² <= 1`。
- idle 的 `bobY` 和倾斜必须为 `0`，不能让站立角色漂浮。
- 移动 `bobY` 只能在 `0` 到 `-1.25px` 之间，脚底相对锚点保持可解释。
- 普通移动倾斜不超过 2°，dash 不超过 4°。
- 动画速度只改变可见动画播放速率，不写入 Arcade Body 速度。
- 所有值必须有限；无效输入回退为静止状态。

### 表现控制器

`src/art/playerPresentationController.js` 导出：

```js
export function createPlayerPresentationController(scene, {
  anchor = scene?.player,
  characterId = DEFAULT_CHARACTER_ID,
  allowBodyPreview = false
} = {}) {
  // returns the contract below
}
```

返回合同固定为：

```js
{
  update(snapshot, deltaMs) {},          // true = 更新成功，false = 已回退
  notifyHit({ atMs, durationMs, tint }) {},
  notifyAttack({ angle, weaponId, heavy }) {},
  setAlpha(alpha) {},
  setPaused(paused) {},
  setPreviewOverride(overrideOrNull) {},
  snapshot() {},                         // 只返回数字、布尔值、字符串和 null
  destroy() {}
}
```

`setPreviewOverride()` 只接受 `null` 或以下冻结数据：

```js
{
  mode: "body" | "legacy" | "static",
  facingAngle,
  velocityX,
  velocityY,
  hit
}
```

它只能改变控制器自己的显示选择和动作输入。`mode: "body"` 等同于本次显式允许 body preview；没有 override 且构造参数 `allowBodyPreview=false` 时，即使最终 body PNG 已加载也必须保持 normal legacy 路径。未知 mode 直接拒绝并恢复先前有效状态。

控制器规则：

- 先完整创建可见人物；成功后才隐藏 `anchor`。
- 创建任一对象失败时销毁已创建对象并保持 `anchor` 可见。
- 运行时更新失败时只回退一次：销毁自有对象、恢复 `anchor` 可见、停止继续分配；此后 `update()` 只调用旧兼容 `syncCharacterPresentation(scene)`，让锚点继续显示现有移动/受击动画。
- `destroy()` 可重复调用；移除自有 tween、监听器、人物和 Phase 1.5 dummy equipment。
- 不调用 `anchor.body.setVelocity()`、`setSize()`、`setOffset()`、`setCircle()`，不写 `anchor.x/y`。
- `"legacy"` 和 `"static"` 强制模式只允许开发 bridge 通过 `setPreviewOverride()` 使用。

### 独立人物动画同步

`src/art/characterPresentation.js` 新增：

```js
export function syncCharacterVisual(scene, sprite, {
  characterId,
  animationFamily,
  facingAngle,
  velocityX,
  velocityY,
  hit
}) {
  // only mutates the supplied non-physics visual sprite
}
```

现有 `syncCharacterPresentation(scene, override)` 暂时保留为锚点 fallback 兼容入口，但普通成功路径不再调用它。

### body-only 接点数据

权威源文件 `scripts/art/data/player-response-operative-body-sockets.json` 固定 schema：

```json
{
  "schemaVersion": 1,
  "frameWidth": 64,
  "frameHeight": 64,
  "directions": ["down", "left", "right", "up"],
  "frames": [
    {
      "index": 0,
      "gripX": 32,
      "gripY": 31,
      "supportX": 28,
      "supportY": 33,
      "equipmentLayer": "front"
    }
  ]
}
```

示例只说明字段形状，不授权把示例坐标复制到全部帧。实际每帧坐标必须按成品像素测量并通过接点叠加图和实机测试。验证规则：

- Gate B 恰好 28 项；Gate C 恰好 120 项。
- `index` 从 `0` 连续递增，无缺失、重复或重排。
- 四个坐标都是 `0..63` 的整数。
- `equipmentLayer` 只能是 `"front"` 或 `"behind"`。
- 生成模块冻结数组及每个条目。
- 连接数据不包含世界坐标、目标、伤害、攻击时间或枪口玩法坐标。

### Equipment local coordinate

Phase 1.5 dummy equipment 和未来 Phase 2 正式装备共用以下显示坐标合同：

```text
equipment default forward = local +X
equipment rotation 0 = screen right
equipment pivot = its local grip socket
body grip/support = current 64×64 body frame local coordinates
equipment action point = its own local muzzle/discharge/blade point
```

- dummy equipment 素材/Graphics 在本地 `+X` 方向绘制，不能靠运行时 `±90°` 修正常态朝向。
- body socket 只负责“装到人物哪里”；equipment pivot/action point 只负责“装备自身哪里连接、哪里产生视觉作用”。
- Phase 1.5 只把这些坐标用于画面连接、遮挡和旋转，不创建子弹、不计算伤害、不把 action point 返回玩法层。
- 接点数据和新增运行时接口统一使用 Equipment Presentation 命名，不把特斯拉等异常设备强制当作枪械。

## Task 0：执行授权、隔离 worktree 与基线验证

**Files:** 不修改仓库文件。

- [ ] 确认用户已经分别批准：外部 GPT 审查选择、分支名、worktree 创建、Phase 1 实施。没有批准时停在本任务。
- [ ] 调用 `superpowers:using-git-worktrees`，只读复核主仓库和冻结 UI/Art worktree。
- [ ] 运行：

```powershell
git -C C:\scp-survivor status --short --branch
git -C C:\scp-survivor rev-parse HEAD
git -C C:\scp-survivor-workspaces\active\ui-art status --short --branch
git -C C:\scp-survivor-workspaces\active\ui-art rev-parse HEAD
git -C C:\scp-survivor-workspaces\active\ui-art rev-list --left-right --count origin/feature/ui-art-overhaul...HEAD
```

预期：UI/Art HEAD 仍为 `2ae0385...`；现有 dirty 项与交接记录一致。若多出未知修改、HEAD 改变或目标 worktree 已存在，停止并报告，不清理或覆盖。

- [ ] 经授权后创建：

```powershell
git -C C:\scp-survivor worktree add -b feature/player-combat-presentation-overhaul C:\scp-survivor-workspaces\active\player-combat-presentation-overhaul 2ae03850c955df3f95f1e2230ea81515b7236b43
```

- [ ] 在新 worktree 验证分支、HEAD 和 clean 状态：

```powershell
git status --short --branch
git rev-parse HEAD
git diff --check
```

- [ ] 如果新 worktree 没有依赖，只运行 `C:\Program Files\nodejs\npm.cmd ci`；随后确认 `package.json` 和 `package-lock.json` 未改变。
- [ ] 运行基线 Node 测试、Python 素材测试和 build：

```powershell
$nodeExe = 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$pythonExe = 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$nodeTests = Get-ChildItem -LiteralPath test -Filter *.test.js | Sort-Object FullName | Select-Object -ExpandProperty FullName
& $nodeExe --test $nodeTests
& $pythonExe scripts/art/test_pixel_tools.py
& $pythonExe scripts/art/test_player_character_assets.py
& 'C:\Program Files\nodejs\npm.cmd' run build
git diff --check
git status --short --branch
```

预期：所有命令退出码 `0`，工作树除允许的本地 `.superpowers\` 外无变化。若基线失败，记录真实失败并停止实施，不把基线故障混入 Phase 1。

## Task 1：用测试锁定只读快照和移动重量

**Files:**

- Create: `test/player-presentation-model.test.js`
- Create: `src/art/playerPresentationModel.js`

- [ ] 先写失败测试，覆盖：
  - 快照只含八个基础字段且 `Object.isFrozen(snapshot) === true`；
  - 读取不会改变 Scene、玩家坐标、Body 或速度；
  - idle 没有起伏和倾斜；
  - 横向移动起伏不超过 `1.25px`、倾斜不超过 2°；
  - dash 倾斜不超过 4°；
  - 动画倍率始终在 `0.85..1.35`；
  - `NaN`、`Infinity` 和缺失字段得到有限的静止结果；
  - 脚底世界位置固定为 `x, y + 12`，阴影位置不参与起伏。
- [ ] 运行并确认因模块不存在而失败：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-presentation-model.test.js
```

预期：退出码非 `0`，错误明确指向 `src/art/playerPresentationModel.js` 尚不存在。

- [ ] 实现最小纯函数：

```js
export const PLAYER_PRESENTATION_MOTION = Object.freeze({
  footOffsetY: 12,
  maxMoveBobPx: 1.25,
  maxMoveLeanRadians: Math.PI / 90,
  maxDashLeanRadians: Math.PI / 45,
  animationRateMin: 0.85,
  animationRateMax: 1.35
});

export function createPlayerPresentationSnapshot(scene) {
  const player = scene?.player;
  return Object.freeze({
    active: player?.active === true && player?.isDying !== true,
    x: Number.isFinite(player?.x) ? player.x : 0,
    y: Number.isFinite(player?.y) ? player.y : 0,
    velocityX: Number.isFinite(player?.body?.velocity?.x) ? player.body.velocity.x : 0,
    velocityY: Number.isFinite(player?.body?.velocity?.y) ? player.body.velocity.y : 0,
    facingAngle: Number.isFinite(scene?.playerFacingAngle) ? scene.playerFacingAngle : 0,
    elapsedMs: Number.isFinite(scene?.elapsedSurvivalMs) ? scene.elapsedSurvivalMs : 0,
    dashActive:
      Number.isFinite(scene?.dashUntilMs)
      && Number.isFinite(scene?.elapsedSurvivalMs)
      && scene.elapsedSurvivalMs < scene.dashUntilMs
  });
}

export function getPlayerMovementPresentation(snapshot) {
  const x = Number.isFinite(snapshot?.x) ? snapshot.x : 0;
  const y = Number.isFinite(snapshot?.y) ? snapshot.y : 0;
  const velocityX = Number.isFinite(snapshot?.velocityX) ? snapshot.velocityX : 0;
  const velocityY = Number.isFinite(snapshot?.velocityY) ? snapshot.velocityY : 0;
  const elapsedMs = Number.isFinite(snapshot?.elapsedMs) ? snapshot.elapsedMs : 0;
  const speedSq = velocityX * velocityX + velocityY * velocityY;
  const moving = Number.isFinite(speedSq) && speedSq > 1;
  const speed = moving ? Math.sqrt(speedSq) : 0;
  const speedRatio = Math.min(1, speed / 160);
  const strideRate = 0.75 + speedRatio * 0.75;
  const phase = elapsedMs * 0.012 * strideRate;
  const leanLimit = snapshot?.dashActive === true
    ? PLAYER_PRESENTATION_MOTION.maxDashLeanRadians
    : PLAYER_PRESENTATION_MOTION.maxMoveLeanRadians;
  return Object.freeze({
    footX: x,
    footY: y + PLAYER_PRESENTATION_MOTION.footOffsetY,
    bobY: moving
      ? -Math.abs(Math.sin(phase)) * PLAYER_PRESENTATION_MOTION.maxMoveBobPx
      : 0,
    rotation: moving
      ? Math.max(-1, Math.min(1, velocityX / Math.max(speed, 1))) * leanLimit
      : 0,
    animationRate: moving
      ? Math.max(
          PLAYER_PRESENTATION_MOTION.animationRateMin,
          Math.min(PLAYER_PRESENTATION_MOTION.animationRateMax, speed / 80)
        )
      : 1
  });
}
```

`getPlayerMovementPresentation()` 返回冻结对象：

```js
{
  footX,
  footY,
  bobY,
  rotation,
  animationRate
}
```

- [ ] 运行测试并确认通过：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-presentation-model.test.js
git diff --check
```

- [ ] 若用户已单独授权 commit，只暂存本任务两个文件：

```powershell
git add -- src/art/playerPresentationModel.js test/player-presentation-model.test.js
git commit -m "feat(art): define player presentation snapshot model"
```

未授权 commit 时跳过本步骤。

## Task 2：建立事务化、可整包回退的表现控制器

**Files:**

- Create: `test/player-presentation-controller.test.js`
- Create: `src/art/playerPresentationController.js`
- Modify: `src/art/characterPresentation.js`
- Modify: `test/character-presentation.test.js`

- [ ] 先写失败测试，覆盖：
  - 可见 Sprite 成功创建前锚点一直可见；
  - 成功后只隐藏锚点的显示，不停用锚点、不销毁 Body；
  - `update()` 只移动/旋转可见 Sprite，锚点坐标和 24×24 Body 不变；
  - normal 模式使用 legacy Sprite；即使测试场景声明 body 资源，`allowBodyPreview=false` 也不选择；
  - 显式 body preview 缺 sheet、帧数、接点或通用测试组件任一项时，整包回退 legacy；
  - legacy 缺失时回退 `player-rect`；
  - Sprite 分配、动画播放或接点应用抛错时释放部分对象并恢复锚点；
  - `setPaused()` 冻结自有动画/tween，不调用全局 `pauseAll()`；
  - `destroy()` 两次只销毁每个自有对象一次；
  - `snapshot()` 不返回 Scene、Sprite、Body 或函数引用。
- [ ] 运行并确认失败：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-presentation-controller.test.js test/character-presentation.test.js
```

预期：新控制器模块不存在或新导出不存在。

- [ ] 在 `characterPresentation.js` 增加 `syncCharacterVisual()`；保留旧兼容导出，但把动作判断、hit 窗口和动画播放作用于传入的非物理 Sprite。
- [ ] 实现 `createPlayerPresentationController()`：
  - 用 `scene.add.sprite()` 创建可见人物；
  - legacy 用 `originY=44/48`，body-only 用 `originY=56/64`，static 用 `originY=1`，都把该脚底放到玩法锚点 `y+12`；
  - 事务成功后 `anchor.setVisible(false)`；
  - normal 只解析 legacy/static；
  - body preview bundle 尚未接入时明确回退 legacy；
  - 所有公开方法捕获纯表现错误并触发一次性锚点 fallback；
  - anchor fallback 状态不再尝试重新创建对象，但每帧继续同步锚点的 legacy/static 表现；
  - 不创建 Phaser Container，不给可见 Sprite 添加 Physics Body。
- [ ] 在测试中对 `characterPresentation.js` 做源码边界断言：

```js
assert.doesNotMatch(source, /\.body\.(?:setSize|setOffset|setCircle|setVelocity)/);
assert.doesNotMatch(source, /scene\.(?:health|elapsedSurvivalMs|playerFacingAngle)\s*=/);
```

- [ ] 运行：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-presentation-model.test.js test/player-presentation-controller.test.js test/character-presentation.test.js test/presentation-rules.test.js
git diff --check
```

- [ ] 若用户已授权 commit：

```powershell
git add -- src/art/playerPresentationController.js src/art/characterPresentation.js test/player-presentation-controller.test.js test/character-presentation.test.js
git commit -m "feat(art): separate player visual from physics anchor"
```

## Task 3：接入 Scene，同时保留所有玩法消费者

**Files:**

- Create: `test/player-presentation-integration.test.js`
- Modify: `src/scene/world.js`
- Modify: `src/main.js`
- Modify: `src/scene/systems.js`
- Modify: `test/presentation-rules.test.js`
- Modify: `test/combat-feedback-lifecycle.test.js`

- [ ] 先写失败测试，锁定：
  - `createPlayer()` 仍通过 `physics.add.sprite()` 创建 `this.player`；
  - `this.player.body.setSize(24, 24)` 顺序和结果不变；
  - `cameras.main.startFollow()` 的参数仍是 `this.player`；
  - collider、敌人追踪、拾取和武器代码继续引用 `this.player`；
  - 新对象只保存在 `this.playerPresentation`；
  - update 顺序是玩法移动/武器/敌人完成后，构造只读快照，再更新表现；
  - pause/resume 先提交 Physics 和 spawn 状态，再调用 `playerPresentation.setPaused()`；
  - SHUTDOWN 和 DESTROY 都会销毁表现控制器并置空引用；
  - 三次 restart 后 SHUTDOWN/DESTROY 监听器、可见 Sprite 和 tween 数量回到每局基线。
- [ ] 运行并确认失败：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-presentation-integration.test.js test/combat-feedback-lifecycle.test.js test/presentation-rules.test.js
```

- [ ] 修改 `world.js`：

```js
this.playerPresentation = createPlayerPresentationController(this, {
  anchor: this.player,
  characterId: presentation.characterId
});
```

创建顺序必须是：玩法 Sprite → collide bounds → 24×24 Body → 原有保体 scale → depth → 阴影跟踪 → 表现控制器 → camera follow。若控制器失败，原玩法 Sprite 仍可见。

- [ ] 修改 `main.js`：

```js
const snapshot = createPlayerPresentationSnapshot(this);
this.playerPresentation?.update?.(snapshot, delta);
this.combatFeedback.update(this.elapsedSurvivalMs);
```

移除普通成功路径的 `syncCharacterPresentation(this)`。`teardownManagers()` 中先清空局部引用，再安全暂停和销毁 `playerPresentation`，一个销毁失败不能阻断 combatFeedback、audio 或 UI。

- [ ] 修改 `systems.js`，在现有 pause/resume 已提交后独立 `try/catch` 调用 `playerPresentation.setPaused(true/false)`。
- [ ] 运行：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-presentation-model.test.js test/player-presentation-controller.test.js test/player-presentation-integration.test.js test/presentation-rules.test.js test/combat-feedback-lifecycle.test.js
& 'C:\Program Files\nodejs\npm.cmd' run build
git diff --check
```

- [ ] 若用户已授权 commit：

```powershell
git add -- src/scene/world.js src/main.js src/scene/systems.js test/player-presentation-integration.test.js test/presentation-rules.test.js test/combat-feedback-lifecycle.test.js
git commit -m "feat(art): wire player presentation lifecycle"
```

## Task 4：把受击、无敌闪烁和开火后坐移到可见人物

**Files:**

- Modify: `src/scene/combat.js`
- Modify: `src/scene/effects.js`
- Modify: `src/art/combatFeedback.js`
- Modify: `test/player-presentation-controller.test.js`
- Modify: `test/combat-feedback.test.js`
- Modify: `test/muzzle-flash-feedback.test.js`
- Modify: `test/combat-presentation-equivalence.test.js`
- Modify: `test/hit-feedback-notification.test.js`

- [ ] 先写失败测试，覆盖：
  - `triggerPlayerDamageFeedback()` 先完成生命值/无敌时间玩法提交，再通知表现；
  - 成功时 tint 和 hit 动画作用于可见人物，不作用于隐藏锚点；
  - 表现控制器缺失、返回 `false` 或抛错时，旧锚点 tint/clearTint fallback 仍工作；
  - `updatePlayerInvulnerabilityVisual()` 只改变可见人物 alpha；fallback 时才改变锚点；
  - `notifyAttack()` 把已提交攻击角度交给 `playerPresentation.notifyAttack()`；
  - 后坐只修改可见人物的 skew/rotation，不改锚点位置、scale 或 Body；
  - 弹丸仍从 `this.player.x/y` 创建，枪口 VFX 偏移和所有伤害结果保持原样；
  - real/no-op/throwing presentation 三种模式得到完全相同的子弹、伤害、冷却、弹仓和返回值。
- [ ] 运行并确认失败：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-presentation-controller.test.js test/combat-feedback.test.js test/muzzle-flash-feedback.test.js test/combat-presentation-equivalence.test.js test/hit-feedback-notification.test.js
```

- [ ] 实现：
  - `playerPresentation.notifyHit({ atMs, durationMs, tint: 0xff6666 })`；
  - `playerPresentation.setAlpha(alpha)`；
  - `playerPresentation.notifyAttack({ angle, weaponId, heavy })`；
  - 上述调用全部由调用方单独 `try/catch`，失败不阻断玩法；
  - `combatFeedback` 只有在表现控制器没有处理后坐时才对锚点执行旧 skew fallback；
  - Phase 1.5 dummy equipment 尚未启用时，`notifyAttack()` 只更新可见人物后坐。
- [ ] 运行：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-presentation-controller.test.js test/combat-feedback.test.js test/muzzle-flash-feedback.test.js test/combat-presentation-equivalence.test.js test/hit-feedback-notification.test.js test/attack-feedback-notification.test.js
git diff --check
```

- [ ] 若用户已授权 commit：

```powershell
git add -- src/scene/combat.js src/scene/effects.js src/art/combatFeedback.js test/player-presentation-controller.test.js test/combat-feedback.test.js test/muzzle-flash-feedback.test.js test/combat-presentation-equivalence.test.js test/hit-feedback-notification.test.js
git commit -m "feat(art): route player feedback to visible body"
```

## Task 5：迁移开发预览并消除 restart 监听泄漏

**Files:**

- Modify: `src/art/playerCharacterVisualStateDriver.js`
- Modify: `src/main.js`
- Modify: `test/player-character-visual-state-driver.test.js`
- Modify: `test/player-presentation-integration.test.js`

- [ ] 先写失败测试，覆盖：
  - 24 个 `down/left/right/up × idle/forward/backward/strafeLeft/strafeRight/hit` 状态仍完整；
  - driver 只调用 `playerPresentation.setPreviewOverride()`、`update()` 和 `snapshot()`；
  - driver 不写 `player.presentationPrototypeEnabled`、`presentationSmokeOverride`、Body、速度、RNG、计时或存档；
  - `playerPresentation=states` 安装手动状态 bridge；
  - `playerPresentation=body` 安装具名 live update 回调；
  - `playerPresentation=legacy` 和 `playerPresentation=static` 只强制开发 fallback；
  - SHUTDOWN/DESTROY 会同时移除 live update、成对生命周期监听和全局入口；
  - 三次 restart 后 `"update"`、`"shutdown"`、`"destroy"` 各自没有累积；
  - 重复安装先恢复并清理旧 bridge。
- [ ] 运行并确认失败：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-visual-state-driver.test.js test/player-presentation-integration.test.js
```

- [ ] 保留文件名以减少无关迁移，但把全局入口改为：

```js
window.__SCP_PLAYER_PRESENTATION_PREVIEW__
```

手动状态和 live 模式都通过 `setPreviewOverride({ mode, facingAngle, velocityX, velocityY, hit })` 传入纯值；cleanup 必须先传 `null` 恢复普通 legacy 路径，再移除监听和全局入口。

- [ ] 删除 `main.js` 当前 `playerCharacterPrototype=live` 的匿名 `this.events.on("update", () => {})`。由 driver 保存具名 `onUpdate`，cleanup 精确执行：

```js
scene.events.off("update", onUpdate);
scene.events.off("shutdown", cleanup);
scene.events.off("destroy", cleanup);
delete windowRef.__SCP_PLAYER_PRESENTATION_PREVIEW__;
```

- [ ] 开发动态 import 仍必须位于 `import.meta.env.DEV === true` 分支；普通开发 URL 和生产 build 不安装全局入口。
- [ ] 运行：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-visual-state-driver.test.js test/player-presentation-integration.test.js
& 'C:\Program Files\nodejs\npm.cmd' run build
if (rg -n "__SCP_PLAYER_PRESENTATION_PREVIEW__" dist) { throw 'player presentation preview leaked into production build' }
git diff --check
```

- [ ] 若用户已授权 commit：

```powershell
git add -- src/art/playerCharacterVisualStateDriver.js src/main.js test/player-character-visual-state-driver.test.js test/player-presentation-integration.test.js
git commit -m "fix(art): make player preview lifecycle restart-safe"
```

## Task 6：扩展确定性 body-only 与接点素材工具

**Files:**

- Modify: `scripts/art/build_player_character_assets.py`
- Modify: `scripts/art/test_player_character_assets.py`

- [ ] 先写 Python 失败测试，覆盖：
  - `body-prototype` 输出精确 `1792×64`、28 帧和 28 个接点；
  - `body-production` 输出精确 `1920×256`、120 帧和 120 个接点；
  - 接点数量、index、整数范围或 `equipmentLayer` 错误时，PNG 和 JS 均不写出；
  - 右方向与左方向不是逐帧水平镜像；
  - PNG 使用二值 alpha、最多 32 个不透明 RGB 色、每帧可见高 44–50、baseline `y=56±1`；
  - 接点 JS 连续生成两次字节完全一致；
  - `socket-overlay` 只生成审查图，不修改原 PNG 或源 JSON；
  - 中途失败不会留下半个 PNG 或半个 JS。
- [ ] 运行并确认新命令不存在：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_player_character_assets.py
```

- [ ] 在现有命令不回归的前提下增加：

```text
body-prototype
  --down-board
  --socket-source
  --output
  --socket-output

body-production
  --down-board
  --down-hit-board
  --left-board
  --right-board
  --up-board
  --socket-source
  --output
  --socket-output

socket-overlay
  --sheet
  --socket-source
  --frame-count
  --output
```

- [ ] 所有正式输出先写入同目录临时文件，验证全部通过后用 `Path.replace()` 原子替换目标。
- [ ] 生成的 JS 模块固定导出：

```js
export const BODY_SOCKET_SCHEMA_VERSION = 1;
export const BODY_SOCKET_FRAME_COUNT = 28; // Gate C 时为 120
export const PLAYER_RESPONSE_OPERATIVE_BODY_SOCKETS = Object.freeze([
  Object.freeze({ index: 0, gripX: 32, gripY: 31, supportX: 28, supportY: 33, equipmentLayer: "front" })
]);
```

同样，示例只锁定格式；实际数组来自经测量的 JSON。

- [ ] 运行旧工具测试和新测试：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_pixel_tools.py
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_player_character_assets.py
git diff --check
```

- [ ] 若用户已授权 commit：

```powershell
git add -- scripts/art/build_player_character_assets.py scripts/art/test_player_character_assets.py
git commit -m "feat(art): validate body-only sheets and frame sockets"
```

## Task 7：Body Gate A——确认无武器角色身份

**Files:**

- Modify after acceptance: `docs/art/asset-register.md`
- Local only: `.superpowers/sdd/player-overhaul-phase1/gate-a/`

- [ ] 调用 `imagegen` skill。生成三张独立的 down-facing body-only 候选，使用同一逐字 prompt：

```text
Create one clean game-character cutout for a 2D top-down 3/4-view survival game.
Subject: an adult male SCP Foundation anomaly-response operative, facing downward,
professional and grounded rather than heroic, compact tactical armor, dark charcoal
uniform, restrained amber identification panels, practical boots, readable helmet and
torso silhouette, realistic adult proportions suitable for a 64x64 sprite.
Body-only modular character base: include torso, upper arms, hips and legs, but omit
both forearms, both hands, every firearm, every blade, every weapon, every muzzle,
every shoulder-mounted device and every weapon-shaped holster silhouette. Keep clean
attachment space near the chest and both elbow ends for a later separate arm-and-weapon
component. Neutral ready stance, feet clearly contacting one shared baseline.
Transparent background, one character only, no shadow, no floor, no text, no labels,
no frame, no UI, no extra equipment floating around the body. Crisp hard-edged
pixel-game rendering with a limited palette; no soft airbrush gradients, no blur,
no antialiased halo, no chibi head, no anime school uniform, no exposed skin emphasis.
```

- [ ] 每次生成前不引用旧带枪 Gate 3 像素作为编辑源；它只可用于肉眼参考琥珀身份、比例和失败原因。
- [ ] 将三个结果分别保存为本地证据：
  - `gate-a/body-only-down-candidate-01-source.png`
  - `gate-a/body-only-down-candidate-02-source.png`
  - `gate-a/body-only-down-candidate-03-source.png`
- [ ] 用现有 `silhouette` 命令生成三个 64×64、baseline y=56 的候选；输出留在 Gate A 本地目录。
- [ ] 用 in-app browser 从普通游戏 960×540 画面取得无 UI 遮挡背景，再用现有 `preview` 命令把三个候选分别按 1× 合成到玩家脚底位置。
- [ ] 生成一张不缩放的 contact sheet，明确标出候选编号；检查：
  - 零武器、零枪口、零完整前臂/手部；
  - 成年基金会干员身份清楚；
  - 琥珀识别色克制；
  - 轮廓在 1× 和真实设施地面上可读；
  - 脚底明确，不像悬浮贴图；
  - 可为独立手臂/武器留出连接空间。
- [ ] 把 1× contact sheet 和三张 960×540 合成图发给用户，只请求 Body Gate A 选择或当前门内修改。
- [ ] 用户未明确接受前停止。
- [ ] 接受后在 `docs/art/asset-register.md` 记录三张候选的逐字 prompt、生成工具、日期、原始/归一化 SHA-256、选择结果、拒绝原因、修改状态、商业使用和署名状态。
- [ ] 运行：

```powershell
git diff --check
git status --short
```

确认 `.superpowers\` 未被暂存。

- [ ] 若用户已授权 commit：

```powershell
git add -- docs/art/asset-register.md
git commit -m "docs(art): record body-only identity gate"
```

## Task 8：Phase 1.5 / Body Gate B——单方向 28 帧、接点和 dummy equipment

**Files:**

- Create: `public/assets/art/characters/player-response-operative-body-prototype.png`
- Create: `scripts/art/data/player-response-operative-body-sockets.json`
- Create: `src/art/playerResponseOperativeBodySockets.js`
- Modify: `src/assets/manifest.js`
- Modify: `src/art/characterPresentation.js`
- Modify: `src/art/playerPresentationController.js`
- Modify: `test/player-character-assets.test.js`
- Modify: `test/art-assets.test.js`
- Modify: `test/character-presentation.test.js`
- Modify: `test/player-presentation-controller.test.js`
- Modify: `docs/art/asset-register.md`
- Local only: `.superpowers/sdd/player-overhaul-phase1/gate-b/`

- [ ] 先写 Node 失败测试：
  - manifest 新 key 固定为 `player-response-operative-body-prototype-sheet`；
  - path 固定为 `assets/art/characters/player-response-operative-body-prototype.png`；
  - frame config 固定 64×64；
  - 普通 `resolveCharacterPresentation()` 仍返回 legacy；
  - 显式 body preview 只在 PNG 精确 28 帧、接点精确 28 项且通用测试组件可创建时选择 prototype；
  - down locomotion 显示 body-only + 测试组件；
  - left/right/up 和 hit 整包显示 legacy，不保留 dummy equipment；
  - body preview 构造失败不会隐藏锚点或留下组件。
- [ ] 运行并确认失败：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-assets.test.js test/art-assets.test.js test/character-presentation.test.js test/player-presentation-controller.test.js
```

- [ ] 使用 Gate A 被接受的 cutout 作为 ImageGen 参考，生成 down 方向 6×6 动作板，逐字 prompt：

```text
Using the approved body-only SCP Foundation operative as the exact identity reference,
create one orthographic top-down 3/4-view animation board on a transparent background.
The operative faces downward in every occupied cell. Keep the same adult proportions,
helmet, charcoal armor, amber identification panels, boots and palette in every frame.
Body-only modular base in every frame: torso, upper arms, hips and legs are present;
both forearms, both hands, all weapons, all muzzles, all shoulder devices and all
weapon-shaped holsters are absent. Preserve clear attachment space at both elbow ends.
Use a precise 6-column by 6-row grid with equal cells and no grid lines or labels.
Occupied cells: row 1 columns 1-4 are idle; row 1 columns 5-6 are empty; row 2 has
six forward-walk poses; row 3 has six backward-walk poses; row 4 has six strafe-left
poses; row 5 has six strafe-right poses; row 6 is empty. Every occupied pose is unique,
feet use a consistent baseline, torso size and camera angle never change, and movement
has grounded weight rather than exaggerated jumping. Crisp hard-edged limited-palette
pixel-game rendering, transparent background, no shadow, no text, no effects, no blur,
no antialiased halo and no extra objects.
```

- [ ] 若结果不是透明背景或网格/人物身份不一致，直接拒绝并重新生成，不用模糊抠图修补边缘。
- [ ] 从归一化后的 28 帧逐帧测量 grip/support 坐标，填写权威 JSON；不得用同一坐标复制全部帧。
- [ ] 运行：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/build_player_character_assets.py body-prototype --down-board .superpowers/sdd/player-overhaul-phase1/gate-b/down-board.png --socket-source scripts/art/data/player-response-operative-body-sockets.json --output public/assets/art/characters/player-response-operative-body-prototype.png --socket-output src/art/playerResponseOperativeBodySockets.js
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/build_player_character_assets.py socket-overlay --sheet public/assets/art/characters/player-response-operative-body-prototype.png --socket-source scripts/art/data/player-response-operative-body-sockets.json --frame-count 28 --output .superpowers/sdd/player-overhaul-phase1/gate-b/body-prototype-socket-overlay.png
```

- [ ] 接入 manifest 和显式 body preview。Phase 1.5 dummy equipment 用 Phaser Graphics 按 `local +X` 绘制一件低饱和灰色测试装备和两段简化前臂/手部，只用于接点/遮挡/旋转验证：
  - 不进入 Physics；
  - 不创建子弹、不定义伤害、不读取目标；
  - `notifyAttack()` 只让它旋转到已提交攻击角度并做轻微后坐；
  - `equipmentLayer` 决定它在人物前或后；
  - 任一 Graphics 调用失败就整包 fallback。
- [ ] 自动验证：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_player_character_assets.py
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-assets.test.js test/art-assets.test.js test/character-presentation.test.js test/player-presentation-controller.test.js test/player-character-visual-state-driver.test.js
& 'C:\Program Files\nodejs\npm.cmd' run build
git diff --check
```

- [ ] 使用 in-app browser 打开 `http://127.0.0.1:5173/?playerPresentation=body`，在 960×540 下检查：
  - down idle、forward、backward、strafeLeft、strafeRight；
  - 角色向左/右移动而 dummy equipment 指向相反攻击方向；
  - 脚底和固定阴影；
  - 接点不漂浮、不钻进胸口；
  - pause/resume、受击、dash、一次失败 restart、一次胜利 restart；
  - left/right/up/hit 时完整回退 legacy，没有裸人物或残留 dummy equipment；
  - console 无重复 key、缺失 frame 或 lifecycle 错误。
- [ ] 把 1× 28 帧 contact sheet、socket overlay 和代表性 960×540 截图发给用户，请求 Body Gate B 接受或当前门内修改。
- [ ] 用户未明确接受前停止，不生成其他方向。
- [ ] 接受后更新 `docs/art/asset-register.md`，记录逐字 prompt、输入/输出 SHA-256、接点测量方式、后处理命令、许可和验收结论。
- [ ] 若用户已授权 commit：

```powershell
git add -- public/assets/art/characters/player-response-operative-body-prototype.png scripts/art/data/player-response-operative-body-sockets.json src/art/playerResponseOperativeBodySockets.js src/assets/manifest.js src/art/characterPresentation.js src/art/playerPresentationController.js test/player-character-assets.test.js test/art-assets.test.js test/character-presentation.test.js test/player-presentation-controller.test.js docs/art/asset-register.md
git commit -m "feat(art): add body-only movement prototype"
```

## Task 9：Body Gate C——四方向 120 帧完整 body-only 预览

**Files:**

- Create: `public/assets/art/characters/player-response-operative-body.png`
- Delete after successful migration: `public/assets/art/characters/player-response-operative-body-prototype.png`
- Modify: `scripts/art/data/player-response-operative-body-sockets.json`
- Modify: `src/art/playerResponseOperativeBodySockets.js`
- Modify: `src/assets/manifest.js`
- Modify: `src/art/characterPresentation.js`
- Modify: `src/art/playerPresentationController.js`
- Modify: `test/player-character-assets.test.js`
- Modify: `test/art-assets.test.js`
- Modify: `test/character-presentation.test.js`
- Modify: `test/player-presentation-controller.test.js`
- Modify: `docs/art/asset-register.md`
- Local only: `.superpowers/sdd/player-overhaul-phase1/gate-c/`

- [ ] 先把测试改为最终合同并确认失败：
  - key `player-response-operative-body-sheet`；
  - path `assets/art/characters/player-response-operative-body.png`；
  - PNG 精确 `1920×256`，行顺序 `down,left,right,up`；
  - 每行 30 帧：idle 0–3、forward 4–9、backward 10–15、strafeLeft 16–21、strafeRight 22–27、hit 28–29；
  - 120 个连续接点；
  - 真实 right 行不等于 left 行，也不等于其水平镜像；
  - body preview 四方向均不 flip；
  - 普通 URL 仍解析 legacy；
  - prototype manifest entry 和临时 public PNG 不再存在；
  - sheet、接点或测试组件任一失败时整包 legacy → static → anchor fallback。
- [ ] 运行并确认失败：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/player-character-assets.test.js test/art-assets.test.js test/character-presentation.test.js test/player-presentation-controller.test.js
```

- [ ] 以 Gate B 被接受的 down 动作板和 Gate A 身份为参考，分别生成 left、right、up 动作板。每个方向使用同一 prompt，只替换第一句的方向词：

```text
Using the accepted down-facing body-only animation and identity as the exact reference,
create the left-facing body-only animation board for the same adult male SCP Foundation
operative. Use a precise 6-column by 6-row grid with equal cells and no grid lines or
labels. Row 1 columns 1-4 are idle and columns 5-6 are empty; row 2 is six forward-walk
poses; row 3 is six backward-walk poses; row 4 is six strafe-left poses; row 5 is six
strafe-right poses; row 6 columns 1-2 are two restrained hit-reaction poses and the
remaining cells are empty. Keep torso scale, helmet, charcoal armor, amber panels,
boots, camera angle and shared foot baseline identical. Body-only modular base in every
frame: torso, upper arms, hips and legs present; both forearms, both hands, every weapon,
muzzle, shoulder device and weapon-shaped holster absent. Every occupied pose is unique.
Draw this direction natively; do not mirror another direction. Transparent background,
no shadow, no text, no effects, crisp hard-edged limited-palette pixel-game rendering,
no blur, no antialiased halo and no extra objects.
```

对 right 和 up 分别把 `left-facing` 改为 `right-facing`、`up-facing`；`Draw this direction natively` 保持不变。down 的两个 hit 帧单独用相同身份生成并放入 down hit board。

- [ ] 逐帧测量并扩展 JSON 到 120 项；生成 socket overlay，重点检查 right 不是 left 镜像、hit 不脱离连接点、up 遮挡正确。
- [ ] 构建最终资产：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/build_player_character_assets.py body-production --down-board .superpowers/sdd/player-overhaul-phase1/gate-c/down-board.png --down-hit-board .superpowers/sdd/player-overhaul-phase1/gate-c/down-hit-board.png --left-board .superpowers/sdd/player-overhaul-phase1/gate-c/left-board.png --right-board .superpowers/sdd/player-overhaul-phase1/gate-c/right-board.png --up-board .superpowers/sdd/player-overhaul-phase1/gate-c/up-board.png --socket-source scripts/art/data/player-response-operative-body-sockets.json --output public/assets/art/characters/player-response-operative-body.png --socket-output src/art/playerResponseOperativeBodySockets.js
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/build_player_character_assets.py socket-overlay --sheet public/assets/art/characters/player-response-operative-body.png --socket-source scripts/art/data/player-response-operative-body-sockets.json --frame-count 120 --output .superpowers/sdd/player-overhaul-phase1/gate-c/body-production-socket-overlay.png
```

- [ ] 切换显式 body preview 到最终 sheet，移除新 Gate B prototype manifest entry 和临时 public PNG；不删除旧历史 Gate 2 素材。
- [ ] 自动验证：

```powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_pixel_tools.py
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_player_character_assets.py
$nodeExe = 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$phaseTests = @(
  'test/player-presentation-model.test.js',
  'test/player-presentation-controller.test.js',
  'test/player-presentation-integration.test.js',
  'test/player-character-assets.test.js',
  'test/player-character-visual-state-driver.test.js',
  'test/character-presentation.test.js',
  'test/art-assets.test.js',
  'test/presentation-rules.test.js',
  'test/combat-feedback.test.js',
  'test/combat-feedback-lifecycle.test.js',
  'test/muzzle-flash-feedback.test.js',
  'test/combat-presentation-equivalence.test.js'
)
& $nodeExe --test $phaseTests
& 'C:\Program Files\nodejs\npm.cmd' run build
if (rg -n "__SCP_PLAYER_PRESENTATION_PREVIEW__" dist) { throw 'player presentation preview leaked into production build' }
git diff --check
```

- [ ] 使用 in-app browser 完成 960×540 smoke：
  - 普通 URL：legacy 人物通过独立表现控制器显示，没有 body-only 半成品；
  - `?playerPresentation=body`：四方向、五种移动、hit、dash、停止和 dummy equipment；
  - `?playerPresentation=legacy`：完整 legacy fallback；
  - `?playerPresentation=static`：`player-rect` fallback；
  - 身体向左移动、dummy equipment 向右；身体向上移动、dummy equipment 向下；
  - 暂停 3 次、受击、失败 restart 3 次、胜利 restart 3 次；
  - 每轮 camera 仍跟随同一玩法锚点，接地阴影不随 bob 漂移；
  - console 无错误、重复监听、缺失 texture/frame 或残留全局入口。
- [ ] 输出原生 1× 全表、四方向放大仅供观察图、socket overlay 和代表性游戏截图；发给用户请求 Body Gate C 接受或当前门内修改。
- [ ] 用户未明确接受前停止，不能开始 Phase 2，也不能切普通默认。
- [ ] 接受后完整更新资产登记：逐字 prompts、所有源图/中间图/最终 PNG/接点 JSON/生成 JS 的 SHA-256、工具和命令、修改状态、许可、商业使用、署名、选择与拒绝原因。
- [ ] 若用户已授权 commit：

```powershell
git add -- public/assets/art/characters/player-response-operative-body.png scripts/art/data/player-response-operative-body-sockets.json src/art/playerResponseOperativeBodySockets.js src/assets/manifest.js src/art/characterPresentation.js src/art/playerPresentationController.js test/player-character-assets.test.js test/art-assets.test.js test/character-presentation.test.js test/player-presentation-controller.test.js docs/art/asset-register.md
if (git ls-files -- public/assets/art/characters/player-response-operative-body-prototype.png) {
  git add -u -- public/assets/art/characters/player-response-operative-body-prototype.png
}
git commit -m "feat(art): complete body-only player presentation"
```

条件式 `git add -u --` 只在 Gate B 临时 PNG 曾被提交时记录删除；如果它从未进入 Git，则不执行该命令。不得改用广泛暂存命令。

## Task 10：完整回归、独立审查与 Phase 1 收口

**Files:** 不新增功能；只修复审查发现的 Phase 1 范围内问题。

- [ ] 调用 `superpowers:requesting-code-review`，审查只回答：
  - `this.player` 是否仍是唯一玩法锚点；
  - 表现是否可能写回位置、速度、碰撞、目标、计时、RNG 或存档；
  - 普通默认是否仍是 legacy；
  - body preview 是否整包回退；
  - restart 是否清理自有 Sprite、Graphics、tween 和监听器；
  - 是否恢复了已撤回肩部悬浮/延迟装具；
  - 是否误改弹丸起点或玩法语义。
- [ ] 修复所有阻断 Phase 1 正确性的审查意见；范围外增强写入最终 backlog，不自动实现。
- [ ] 调用 `superpowers:verification-before-completion`，从最终工作树重新运行全部验证：

```powershell
$nodeExe = 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
$pythonExe = 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
$nodeTests = Get-ChildItem -LiteralPath test -Filter *.test.js | Sort-Object FullName | Select-Object -ExpandProperty FullName
& $nodeExe --test $nodeTests
& $pythonExe scripts/art/test_pixel_tools.py
& $pythonExe scripts/art/test_player_character_assets.py
& 'C:\Program Files\nodejs\npm.cmd' run build
if (rg -n "__SCP_PLAYER_PRESENTATION_PREVIEW__" dist) { throw 'player presentation preview leaked into production build' }
git diff --check
git status --short --branch
git diff --stat
```

- [ ] 重新执行普通 URL、body、legacy、static 四条 960×540 browser smoke，并保存最终截图和 console 结果。
- [ ] 核对最终禁止项：

```powershell
rg -n "spawnPlayerProjectile|originX|originY" src/scene/weapons.js
rg -n "setVelocity|setSize|setOffset|setCircle|localStorage|Math\\.random" src/art/playerPresentation*.js
rg -n "shoulder|shoulder-module|lag|lerp" src/art/playerPresentation*.js
```

预期：

- `weapons.js` 仍从 `this.player.x/y` 创建弹丸；
- 表现模块不写 Physics、存档或 RNG；
- 没有恢复旧肩部悬浮/延迟 rig。

- [ ] 向用户提交 Phase 1 报告：
  - 分支、HEAD 和最终 Git 状态；
  - 玩家可见结果；
  - 关键文件；
  - 每条验证命令的最终退出码；
  - Body Gate A/B/C 用户接受证据；
  - 普通默认仍为 legacy；
  - 未进入 Phase 2、未改弹丸起点；
  - 已知非阻塞 backlog。
- [ ] 没有 commit 授权时明确列出未提交文件，不执行 commit。
- [ ] 已有 commit 授权时确认只包含本计划文件，并报告 commit；仍不 push、不建 PR。

## Phase 1 完成定义

只有以下条件全部满足，才可以称为 Phase 1 完成：

- `this.player` 的身份、24×24 Body、速度、camera follow、collider 和玩法消费者未改变；
- 独立可见人物成功承担 legacy 普通显示；
- 脚底、固定阴影、轻量 bob/lean、动画速度、受击、闪烁、dash 和后坐工作；
- 表现失败时玩法继续，fallback 顺序正确；
- 开发 bridge 在 restart 后不泄漏；
- Body Gate A、B、C 均得到用户明确接受；
- 最终 120 帧 body-only 和 120 个接点通过自动与视觉检查；
- 普通游戏仍显示 legacy，不出现无正式武器的 body-only 半成品；
- 全量 Node、Python、build、diff check、browser smoke 和用户试玩全部完成；
- 没有开始 Phase 2、Phase 3 或 Phase 4。

## Phase 1 之后

Phase 1 接受只授权收口当前阶段。Phase 2 必须另写独立计划并获得明确批准；它才负责正式手枪、霰弹枪、特斯拉、武器方向、遮挡和最终默认切换。Phase 3 的真实枪口仍是单独 Level 2 玩法门，不能因为本计划已经存在接点数据就提前实施。
