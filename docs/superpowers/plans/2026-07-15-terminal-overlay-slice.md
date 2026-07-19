# 基金会终端覆盖层实施计划

> **执行要求：** 按任务使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`；每个实现任务都必须遵守 TDD、独立审查和验证闭环。

**目标：** 把升级、暂停、建造、失败和胜利界面统一成一套可复用的基金会终端覆盖层，并为全部 16 个升级提供正式精细像素图标，同时保持所有玩法、输入和重启语义不变。

**架构：** `src/ui/terminalOverlay.js` 只负责通用终端框架和卡片；`src/ui/upgradePresentation.js` 只把已有升级 key 映射到表现数据；原有三个 Scene mixin 继续负责各自流程和回调。所有组件由调用方持有并显式销毁，构造失败必须回滚已创建对象。

**技术栈：** Phaser 3.90、JavaScript ES Modules、Node `node:test`、Vite、精细像素 PNG。

## 全局约束

- 在设施环境和战术 HUD 计划之后执行。
- 只在 `C:\scp-survivor-ui-art` 的 `feature/ui-art-overhaul` 工作。
- 保留 `.superpowers/`，永不暂存。
- 不修改 `src/config/upgrades.js` 中升级效果、概率、等级或文本语义。
- 保留升级卡 220×230、重抽/跳过 200×46、结果重启按钮 170×52 的有效点击区。
- 升级选择继续 `pointerdown` 生效；暂停和结果操作保持当前生效事件，不借视觉迁移改变输入时机。
- 升级和暂停层继续使用现有 world-space 相机定位兼容方案；失败/胜利层继续使用现有 `scrollFactor(0)`；建造面板继续 screen-fixed 且不暂停游戏。
- 不修改暂停、恢复、奖励结算、重启和连续升级的时序。
- 新 PNG 必须更新 `docs/art/asset-register.md` 并通过 fallback 合同。
- 未经明确授权不得 merge 或 push。

---

## 任务 1：建立可复用终端覆盖层组件

**文件：**
- 修改：`src/ui/tacticalUi.js`
- 新建：`src/ui/terminalOverlay.js`
- 修改：`test/tactical-ui.test.js`
- 新建：`test/terminal-overlay.test.js`

- [ ] **步骤 1：先写失败测试，冻结组件 API**

测试以下合同：

~~~js
createTerminalOverlay(scene, {
  x, y, width, height, depth, scrollFactor,
  eyebrow, title, subtitle, tone,
  surfaceTextureKey = null
}) -> {
  container, body, header, content, objects,
  setTone(nextTone), setVisible(visible), destroy()
}

createTerminalCard(scene, {
  x, y, width: 220, height: 230, depth,
  parent = null,
  iconKey, eyebrow, title, description, footer,
  riskLabel = null, tone, onActivate
}) -> {
  objects, hitArea, icon,
  disableInteractive(), setState(state), setFooter(text), destroy()
}
~~~

同时冻结 `createTerminalButton` 的增量参数：

~~~js
variant: "standard" | "primary" | "danger" | "success"
activateOn: "pointerdown" | "pointerup"
~~~

断言所有对象获得一致 depth/scrollFactor；传入 parent 时全部 objects 加入该 container/content，world-space overlay 移动后图形与 hitArea 同步。`destroy()` 幂等并移除监听器；任一 `scene.add.*` 抛错时，之前创建的对象全部销毁。覆盖层必须包含全屏暗化、边缘遮蔽、正式表面纹理槽和程序化扫描线；淡入不超过 160ms，按钮从首帧起可响应，不增加输入等待。220×230 卡片固定 32×32 图标、18px 标题（最多 2 行/180px）、14px 描述（180px 宽且实际 bounds 高度不超过 92px）、13px footer 和 12px riskLabel；用仓库最长真实中文文案测试，仍溢出时在不低于 12px 的下限内自适应并加省略号。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/tactical-ui.test.js test/terminal-overlay.test.js
~~~

预期：因新导出和参数尚不存在而失败。

- [ ] **步骤 3：最小实现并保持旧调用兼容**

在 `tacticalUi.js` 中保持默认 `activateOn: "pointerup"`，让现有开始按钮行为不变；新增 variant 只选择 Theme token，不复制业务回调。`terminalOverlay.js` 组合 `createTacticalPanel`、文本、分隔线和状态灯，不访问 Scene 玩法字段。`surfaceTextureKey` 存在时创建裁切在 panel 内的低 alpha 正式表面纹理；为空或缺失时安全跳过。

- [ ] **步骤 4：验证并提交**

~~~powershell
node --test test/tactical-ui.test.js test/terminal-overlay.test.js
npm run build
git diff --check
git add -- src/ui/tacticalUi.js src/ui/terminalOverlay.js test/tactical-ui.test.js test/terminal-overlay.test.js
git commit -m "feat(ui): add reusable terminal overlays"
~~~

---

## 任务 2：冻结 16 个升级图标、终端表面素材及表现映射

**文件：**
- 新建：`src/ui/upgradePresentation.js`
- 修改：`src/assets/manifest.js`
- 修改：`src/assets/fallbackTextureFactory.js`
- 修改：`docs/art/asset-register.md`
- 新建：`test/upgrade-presentation.test.js`
- 修改：`test/art-assets.test.js`
- 新建：`public/assets/art/upgrades/*.png`（16 个文件）
- 新建：`public/assets/art/ui/terminal-surface-grid.png`
- 新建：`public/assets/art/ui/incident-stamp-frame.png`
- 新建：`public/assets/art/ui/recontainment-stamp-frame.png`

- [ ] **步骤 1：写失败的完整性测试**

测试 `UPGRADE_PRESENTATION` 与 `UPGRADE_DEFINITIONS` 的 key 集合完全相同，不允许缺失或额外 key；每项必须包含：

~~~js
{
  textureKey,
  path,
  tone: "standard" | "weapon" | "mutation",
  riskLabel: null | "本局不可撤销"
}
~~~

所有 `isMutation` 升级必须具有非空 `riskLabel`，普通升级必须为 null，确保质变不只靠颜色表达。

冻结文件名：

~~~text
damage.png
attack-speed.png
move-speed.png
max-health.png
projectile-count.png
penetration.png
pickup-radius.png
emergency-heal.png
breacher-knockback.png
breacher-suppression.png
breacher-magazine.png
tesla-chains.png
tesla-cooldown.png
pistol-boomerang.png
breacher-explosive.png
tesla-field.png
~~~

升级图标测试要求每张 32×32、PNG、nearest、透明背景、最多 32 色。另冻结三张正式终端素材：

| 文件 | 尺寸 | 用途 |
|---|---:|---|
| `terminal-surface-grid.png` | 128×128 | 低对比扫描线/电路表面纹理 |
| `incident-stamp-frame.png` | 96×32 | 失败事故报告红色印章框，文字由 Phaser 精确渲染 |
| `recontainment-stamp-frame.png` | 96×32 | 胜利重新收容绿色印章框，文字由 Phaser 精确渲染 |

三者均为透明、硬边、最多 16 色、无内嵌文字；所有 19 张素材的 manifest key 必须唯一且存在 fallback。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/upgrade-presentation.test.js test/art-assets.test.js
~~~

- [ ] **步骤 3：生成并筛选正式图标**

使用 imagegen skill 生成统一精细像素图标表，再用设施计划已提交的 `scripts/art/normalize_pixel_asset.py` 确定性处理为 16 张 32×32 PNG（`--fit contain --alpha binary --colors 32`）。共同提示约束：俯视基金会终端图标、硬边、二值透明、无文字、无边框、冷灰蓝底色逻辑、青色常规、琥珀武器、紫色质变、单一清晰轮廓、非 3D、非手绘、非写实。

另生成一张无文字的终端表面源板，用同一脚本提取扫描线/电路格和红、绿两种像素印章框（`--alpha binary --colors 16`）。状态文字继续由 Phaser 文本精确渲染，避免 AI 生成乱码，也确保颜色不是唯一提示。运行 `scripts/art/test_pixel_tools.py` 和 `build_contact_sheet.py`，原始/失败候选留在 `.superpowers/`。

逐张在原始分辨率检查轮廓和透明边缘；拒绝靠缩小才显得像像素画的候选。

- [ ] **步骤 4：实现映射、manifest 和 fallback**

`upgradePresentation.js` 不复制升级名称、描述或 apply 函数，只引用 key、图标、tone 与不可逆标签。fallback 使用简化几何符号且仅在正式 PNG 缺失时生成。

- [ ] **步骤 5：更新素材登记并验证**

逐项记录实际 Tool/model、日期、精确 prompt/source、原始输出路径与 SHA-256、完整处理流程、License/right basis、Commercial-use status、Admission、最终尺寸和署名要求；被拒绝或中断候选也写入 prompt/尝试记录。按真实表格行数更新登记表开头的总数摘要；生成升级图标与终端表面素材 contact sheet 供视觉审查。

~~~powershell
node --test test/upgrade-presentation.test.js test/art-assets.test.js
npm run build
git diff --check
git add -- src/ui/upgradePresentation.js src/assets/manifest.js src/assets/fallbackTextureFactory.js docs/art/asset-register.md public/assets/art/upgrades public/assets/art/ui test/upgrade-presentation.test.js test/art-assets.test.js
git commit -m "feat(art): add upgrade terminal icons"
~~~

---

## 任务 3：迁移升级选择层

**文件：**
- 修改：`src/scene/progression.js`
- 修改：`src/scene/menus.js`
- 修改：`src/main.js`
- 新建：`test/level-up-overlay.test.js`

- [ ] **步骤 1：冻结流程与点击合同**

用最小 Scene harness 验证：

- `showLevelUpOverlay()` 仍设置 `isLevelUpActive`、隐藏建造面板、暂停玩法并同步相机位置；
- `levelUpCards` 存放 card controller，controller 实现 `disableInteractive()`；三张卡仍调用 `applyUpgrade(upgrade, selectedCardController)`，选中反馈通过 `setState("selected")`，不再对 controller 调用 Rectangle 专属的 `setStrokeStyle/setFillStyle`；
- 重抽仍只在次数大于 0 时生效；
- 跳过治疗量、pending level-up 消耗、120/160ms 延迟和恢复流程不变；
- `levelUpOverlayController` 持有生命周期，`levelUpOverlay = levelUpOverlayController.container` 仅作现有兼容引用，card 的 parent 必须是 `levelUpOverlayController.content`；world-space 容器移动后，视觉和 hit area 同步；
- 重渲染卡片不会泄漏旧监听器或对象。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/level-up-overlay.test.js
~~~

- [ ] **步骤 3：用终端组件替换原始矩形**

`showLevelUpOverlay` 创建 `levelUpOverlayController`（带 `terminal-surface-grid`），再设置 `levelUpOverlay = levelUpOverlayController.container`；`renderLevelUpCards` 创建 card 时显式传入 `parent: levelUpOverlayController.content`、坐标、尺寸、图标、标题、描述、footer、riskLabel、tone 和 onActivate，并使用 `UPGRADE_PRESENTATION[upgrade.key]` 的表现字段。修改 `applyUpgrade` 的纯视觉参数操作为 controller 的 `setState("selected")`，升级 apply、等级、pending 和延迟逻辑不变。新增 `destroyLevelUpOverlay()`：优先销毁 controller 并清空 controller/container/card 引用，legacy 路径才对 container `destroy(true)`；把 progression 与 menus 中所有直接销毁改为该 helper。

调用 `createTerminalOverlay` 或 card 构造失败时，先清理新 controller，再调用从当前矩形实现抽出的 `createLegacyLevelUpOverlay()`；若连最小 fallback 都无法创建，则设置 `_levelUpPresentationUnavailable = true` 失败锁，撤销 `isLevelUpActive/isResolvingLevelUp`、恢复物理并保留 `pendingLevelUps`。`addExperience()` 的展示条件增加 `!_levelUpPresentationUnavailable`，本局不逐帧重试；`PrototypeScene.create()` 显式初始化该锁为 false，确保 Phaser restart 复用 Scene 实例时不会跨局残留。测试持续失败 10 帧只尝试一次、不反复 pause/resume，restart 后可再次展示，且 pending 不丢失。`main.js` 的共享文件改动仅限这一行表现失败锁初始化。

- [ ] **步骤 4：验证并提交**

~~~powershell
node --test test/level-up-overlay.test.js test/upgrade-presentation.test.js test/terminal-overlay.test.js
npm run build
git diff --check
git add -- src/main.js src/scene/progression.js src/scene/menus.js test/level-up-overlay.test.js
git commit -m "feat(ui): rebuild level up terminal"
~~~

---

## 任务 4：迁移暂停、失败与胜利覆盖层

**文件：**
- 修改：`src/scene/menus.js`
- 新建：`test/mission-overlay.test.js`

- [ ] **步骤 1：先测现有语义**

覆盖暂停显示/隐藏、返回标题、失败重启和胜利重启。断言结算文本仍使用 `getFinalSurvivalTimeSeconds()`、`killCount`、`lastRunCreditsEarned`、`meta.credits`；UI controller 会在首次按钮输入后禁用交互，双击不会重复调用 `scene.restart()`；不测试或修改 `triggerGameOver/triggerVictory` 的奖励幂等语义。输入事件与现有行为一致。

- [ ] **步骤 2：运行 RED 并确认测试能识别旧视觉结构**

~~~powershell
node --test test/mission-overlay.test.js
~~~

- [ ] **步骤 3：迁移为共享终端框架**

暂停使用 standard tone，并显示站点编号、当前任务、运行时间和设施状态；失败使用 danger 并显示 `incident-stamp-frame` + “行动终止”，胜利使用 success 并显示 `recontainment-stamp-frame` + “重新收容确认”。失败/胜利共享生存时间、击杀、当局学分和累计学分排版，主按钮文案统一为“返回行动准备”，回调仍是现有 `scene.restart()`。三者使用 `terminal-surface-grid`，状态文字独立于颜色。结果层由一个 controller 持有全部对象，重开前先禁用按钮以防重复触发。保留现有 scroll factor/world-space 方案，不更改相机与物理暂停逻辑。构造失败时暂停层立即回滚 `isPaused` 并恢复 gameplay；失败/胜利层创建最小 restart 按钮 fallback，不能留下无操作死屏。

- [ ] **步骤 4：验证并提交**

~~~powershell
node --test test/mission-overlay.test.js test/menu-art.test.js test/terminal-overlay.test.js
npm run build
git diff --check
git add -- src/scene/menus.js test/mission-overlay.test.js
git commit -m "feat(ui): unify mission terminal overlays"
~~~

---

## 任务 5：迁移建造面板并完成生命周期验证

**文件：**
- 修改：`src/scene/hud.js`
- 修改：`src/scene/menus.js`
- 修改：`src/scene/progression.js`
- 新建：`test/build-panel-view.test.js`
- 新建：`test/overlay-lifecycle.test.js`

- [ ] **步骤 1：写建造和重启失败测试**

断言 `createBuildPanel`、`toggleBuildPanel`、`hideBuildPanel`、`updateBuildPanelText` 仍可调用；TAB 只控制可见性，不暂停、不改变升级或武器状态。对连续 3 次 pause/unpause、连续升级和 `SHUTDOWN`→`create` 循环检查监听器、controller 和 Phaser 对象数量不增长。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/build-panel-view.test.js test/overlay-lifecycle.test.js
~~~

- [ ] **步骤 3：用紧凑终端视图替换建造面板**

保留 `buildPanel` 兼容引用和 `visible` 读取；内容仍来自原有武器和升级状态，按“主武器 / 常规强化 / 异常突变”分组，使用图标、等级和短数值，不复制连续长说明。新建造 controller 失败时先回滚，再调用从当前实现抽出的 `createLegacyBuildPanel()`；若连 legacy 也失败，安装 `{ visible: false, setVisible() {}, destroy() {} }` no-op `buildPanel`，并让 toggle/hide/updateBuildPanelText 安全短路，保证 `main.create()` 和每帧 `this.buildPanel.visible` 读取不崩溃。统一给三类覆盖层添加幂等 teardown，Scene shutdown 时不残留交互对象。

- [ ] **步骤 4：阶段验证和提交**

~~~powershell
node --test test/build-panel-view.test.js test/overlay-lifecycle.test.js test/level-up-overlay.test.js test/mission-overlay.test.js test/tactical-ui.test.js test/terminal-overlay.test.js test/upgrade-presentation.test.js test/art-assets.test.js
npm run build
git diff --check
git status --short --branch
git add -- src/scene/hud.js src/scene/menus.js src/scene/progression.js test/build-panel-view.test.js test/overlay-lifecycle.test.js
git commit -m "feat(ui): complete terminal overlay lifecycle"
~~~

## 阶段验收

- 代码审查：重点检查输入时机、暂停/恢复、连续升级、重复结算和重启泄漏。
- 视觉审查：960×540 下检查升级、暂停、建造、失败和胜利；文字无裁切，卡片图标可辨，按钮点击区与绘制位置一致。
- 浏览器 smoke 由用户执行；本计划不得仅凭 build 宣称覆盖层完成。
