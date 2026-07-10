# UI/Art 第一阶段实施计划

> **给 Agent 的要求：**只有 Project Lead 批准提案后，才能使用 `superpowers:executing-plans` 执行本计划。本计划的第一轮只产出表现方案，不导入素材、不实现 UI。

**目标：**为第一轮 UI/Art 视觉切片建立具体、可授权、可回退的方案，范围包括 Theme、标题页、武器选择和战斗 HUD。

**架构：**玩法语义继续由 `src/scene/` 负责，表现层由 `src/ui/`、`hud.js` 和 `menus.js` 的表现部分以及批准的素材目录负责。方案必须消费现有 `PreloadScene`、manifest、fallback texture、`AudioManager` 和 `UIManager` 契约，不能在计划阶段替换它们。

**技术栈：**Phaser 3.90、Vite 7、JavaScript ES Modules、现有 UI Theme token、资源 manifest、程序化 fallback factory、Web Audio Foundation 和 Markdown 来源记录。

## 全局约束

- 第一轮只做计划：不得修改 `src/`、导入素材或改变运行时行为；
- 不得改变伤害、生命、刷怪、AI、时间轴、升级概率、胜利、失败或元进度；
- 保持现有 texture key、fallback、`this.playSound()` 兼容入口和 localStorage 语义；
- 外部素材进入生产资源前必须记录作者/来源、URL、许可证、修改状态、商业使用状态和署名要求；
- `src/main.js`、玩法配置、持久化、`AudioManager`、`UIManager` 和 Preload 契约需要单独审批；
- 结束时必须有干净 worktree、实际验证结果和只包含方案的提交。

---

### Task 1：盘点当前表现和资源契约

**文件：**

- 阅读：`src/ui/theme.js`
- 阅读：`src/ui/UIManager.js`
- 阅读：`src/assets/manifest.js`
- 阅读：`src/assets/fallbackTextureFactory.js`
- 阅读：`src/scenes/PreloadScene.js`
- 阅读：`src/scene/hud.js`
- 阅读：`src/scene/menus.js`
- 阅读：`src/scene/effects.js`
- 阅读：`src/audio/AudioManager.js`
- 阅读：`docs/art-and-asset-direction.md`
- 阅读：`docs/licensing-and-commercialization.md`
- 创建：`docs/superpowers/plans/2026-07-10-ui-art-phase1-proposal.md`

**接口：**

- 输入：当前 UI 对象所有权、纹理 key、manifest 数组、fallback 生成、manager facade 和音频调用；
- 输出：事实盘点和安全的表现层切入点清单。

- [ ] **步骤 1：确认分支和干净状态**

运行：

```powershell
Get-Location
git branch --show-current
git status --short --branch
git rev-parse HEAD
```

预期：当前是 `feature/ui-art-overhaul` worktree，干净，基于 `e9662e0` 或更晚的 Project Lead 批准提交。

- [ ] **步骤 2：追踪标题、选择、HUD 和覆盖层所有权**

运行：

```powershell
rg -n "createStartScreen|createWeaponSelection|createUI|updateUI|pause|levelUp|showVictory|showGameOver|setGameplayHudVisible|theme|UIManager" src/ui src/scene src/main.js
```

记录哪些对象被创建、销毁、固定到摄像机和设置为可交互，并标出共享文件依赖。

- [ ] **步骤 3：追踪素材和音频加载**

运行：

```powershell
rg -n "IMAGE_ASSETS|SPRITESHEET_ASSETS|ATLAS_ASSETS|AUDIO_ASSETS|textures\.exists|generateTexture|AudioManager|playSound" src/assets src/scenes src/audio src/scene src/main.js
```

记录现有 key、fallback、重复 key 防护、首次交互音频和销毁行为。

### Task 2：设计第一轮视觉切片

**文件：**

- 修改：`docs/superpowers/plans/2026-07-10-ui-art-phase1-proposal.md`

**接口：**

- 输入：Task 1 盘点结果和已批准的美术方向；
- 输出：Theme 方案、页面范围和明确的玩法边界。

- [ ] **步骤 1：定义视觉语言**

指定颜色 token、字体角色、间距尺度、面板/卡片状态、警报状态、焦点/悬停/禁用状态、对比度要求和 fallback 外观。每个 token 必须有名称、值或范围和使用位置。

- [ ] **步骤 2：定义页面范围**

分别说明标题、武器选择和战斗 HUD 的布局层级、使用的数据、对象所有权、交互行为、响应式约束和退出/销毁行为。明确哪些玩法保持不变。

- [ ] **步骤 3：定义素材迁移顺序**

把每个素材分类为程序化、原创、外部或生成。外部素材必须提供来源 URL、许可证、修改内容、商业使用状态、署名和再分发条件；不能用“待寻找”作为来源记录。

- [ ] **步骤 4：定义 manifest 和 fallback 契约**

为每个拟定 key 指定 key 字符串、素材类型、加载入口、fallback factory、预期尺寸和重复 key 检查。保持现有 key 兼容，或提供经过审查的迁移表。

### Task 3：定义实施边界和验证

**文件：**

- 修改：`docs/superpowers/plans/2026-07-10-ui-art-phase1-proposal.md`

**接口：**

- 输入：视觉切片和素材契约；
- 输出：精确文件清单、共享文件申请、验证矩阵和回滚方案。

- [ ] **步骤 1：标出文件所有权**

把文件分为 `UI/Art 负责`、`需要 Project Lead 审批` 和 `Gameplay 负责`。每个共享文件都要写明最小变更和受影响分支。

- [ ] **步骤 2：定义验证**

方案必须包含：

```powershell
npm run build
git diff --check
```

以及标题、武器选择、HUD、升级、暂停、胜利、失败、重启、代表性视口、指针热区、缺失素材、重复 key、首次交互音频、控制台输出和干净 worktree 检查。

- [ ] **步骤 3：审查范围并提交**

运行：

```powershell
git diff --check
git status --short --branch
git diff --stat
```

预期：只有 proposal 文件发生变化。提交：

```powershell
git add docs/superpowers/plans/2026-07-10-ui-art-phase1-proposal.md
git commit -m "docs: propose UI art phase one slice"
```

报告 commit hash 并等待 Project Lead 审批。本轮不得导入素材或实现 UI。
