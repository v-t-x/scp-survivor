# 基金会战术 HUD 实施计划

> **执行要求：** 使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans` 按任务执行；每个任务遵守 TDD、审查和验证闭环。

**目标：** 把当前四块调试感 HUD 和永久拾取范围圈重构为紧凑的五区基金会战术 HUD，同时保留所有 Scene 方法、交互区域和玩法状态合同。

**架构：** 扩展 `getHudPresentation(state)` 的纯冻结输出；新增 `tacticalHudView.js` 事务性持有全部 Phaser 对象；`hudMixin` 继续作为 `main`、timeline、menus、systems 和 UIManager 使用的兼容 façade。拾取范围只由已提交的表现通知或建造查看状态短暂显示。

**技术栈：** Phaser 3.90、JavaScript ES Modules、Node `node:test`、Vite。

## 全局约束

- 在设施环境计划之后执行。
- 只在 `C:\scp-survivor-ui-art` 的 `feature/ui-art-overhaul` 工作。
- 保留 `.superpowers/`，永不暂存。
- 不修改生命、XP、武器、dash、拾取、设施事件、Boss 或 timeline 数值。
- 保留 `createUI`、`updateUI`、`updateWeaponHud`、`setGameplayHudVisible`、`collapseFacilityHud`、`updatePickupRadiusIndicator` 和 `teardownHud`。
- 保留 timeline/UIManager 消费的既有兼容属性。
- 暂停按钮保留现有 96×30 点击区和 `togglePause()` 回调；静音新增 96×26 点击区并复用 M 键的同一状态切换逻辑。timeline corruption 不得移动任一交互热区。
- 本计划不需要新 raster 素材。
- 未经明确授权不得 merge 或 push。

---

## 任务 1：扩展纯 HUD 与布局合同

**文件：**
- 修改：`src/art/openingVisualContract.js`
- 修改：`src/ui/hudPresentation.js`
- 修改：`test/opening-visual-contract.test.js`
- 修改：`test/hud-presentation.test.js`

- [ ] **步骤 1：写失败测试冻结五区布局**

保持已有 mission/facility/vitals/weapon 区域，并增加：

~~~js
system: Object.freeze({
  anchor: "top-right",
  x: 824,
  y: 12,
  width: 120,
  height: 64
})
~~~

断言所有区域在 960×540 viewport 内且互不重叠；system 区域不加入 timeline 的 `timelineHudBasePositions` 或 corruption 移动集合。

- [ ] **步骤 2：冻结 presentation 输出**

`getHudPresentation(state)` 在保留旧字段的基础上增加：

~~~js
{
  mission: {
    active, title, detail, kills, killsText,
    bossHealthRatio, bossActive
  },
  vitals: {
    healthText, healthRatio, critical,
    levelText, xpText, xpRatio, pulseAlpha
  },
  system: {
    muteLabel, muted, pauseLabel, paused,
    tone: "normal" | "warning" | "danger"
  },
  pickup: {
    radius, buildPanelVisible, nowMs
  }
}
~~~

测试 normal、low health、power outage、facility event、Boss、paused/muted 和无武器状态；输入不被修改，返回对象及嵌套对象冻结。

- [ ] **步骤 3：运行 RED**

~~~powershell
node --test test/opening-visual-contract.test.js test/hud-presentation.test.js
~~~

- [ ] **步骤 4：最小实现**

只从现有 Scene 状态派生文字、tone、比例和可见性。`pulseAlpha` 用 `elapsedSurvivalMs` 的确定性函数计算，不创建 timer；pickup presentation 只提供半径、建造面板可见性和当前时间，不持有 cue 截止时间，也不改变 `pickupRadius`。

- [ ] **步骤 5：验证并提交**

~~~powershell
node --test test/opening-visual-contract.test.js test/hud-presentation.test.js
npm run build
git diff --check
git add -- src/art/openingVisualContract.js src/ui/hudPresentation.js test/opening-visual-contract.test.js test/hud-presentation.test.js
git commit -m "feat(ui): define tactical hud contract"
~~~

---

## 任务 2：实现事务性 tacticalHudView

**文件：**
- 新建：`src/ui/tacticalHudView.js`
- 修改：`src/ui/tacticalUi.js`
- 新建：`test/tactical-hud-view.test.js`
- 修改：`test/tactical-ui.test.js`

- [ ] **步骤 1：先冻结 controller API 和创建顺序**

~~~js
createTacticalHudView(scene, {
  regions,
  onTogglePause,
  onToggleMute
}) -> {
  objects,
  pickupWorldGraphic,
  regions: {
    mission: { container }, facility: { container },
    vitals: { container }, weapon: { container }, system: { container }
  },
  refs: {
    statsText, levelText, xpBarBackground, xpBarFill, xpText,
    weaponHudText, phaseText, muteText, pauseButton, pauseButtonLabel,
    pickupRadiusIndicator, eventBannerContainer, eventBannerBg,
    eventBannerTitle, eventBannerDetail, outageDarknessRt, outageLightSprite
  },
  timelineContainers,
  controls: { pauseHitArea, muteHitArea },
  update(presentation),
  setGameplayVisible(visible),
  setFacilityCollapsed(collapsed),
  notifyPickupCue({ reason, nowMs, durationMs }),
  destroy()
}
~~~

测试五个固定 HUD 区对象的坐标/depth/scrollFactor 0；`regions`、`refs` 和 `timelineContainers` 使用稳定具名属性，禁止由 objects 数组顺序推断 alias；timelineContainers 只包含 mission/facility/vitals/weapon，不含 system。`pickupWorldGraphic` 明确保持 world-space（默认 scroll factor 1）并每帧以玩家世界坐标绘制，镜头移动后仍围绕玩家。pause 热区保持 96×30，mute 热区为 96×26，两者精确落在 system region 内。pause 调用 `togglePause()`；mute 在 `BALANCE.audio.enabled` 时切换同一个 `soundMuted` 并调用 `updateMuteText()`，禁用音频时不写状态。update 只改文本/颜色/alpha/visible，不重建对象。`destroy()` 幂等并移除所有监听器；构造中途异常时回滚已创建对象。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/tactical-hud-view.test.js test/tactical-ui.test.js
~~~

- [ ] **步骤 3：实现紧凑五区视觉**

- mission：任务阶段/计时为主，Boss active 时切换危险层级；
- facility：默认单行，事件展开为警告条；
- vitals：生命、XP、等级，低生命使用确定性脉冲；
- weapon：复用 manifest 中现有 `weaponPistolIcon`、`weaponBreacherIcon`、`weaponTeslaIcon`，按 48×48 nearest 显示；纹理缺失时保留 fallback；武器名、状态和 dash 不重复大段说明；
- system：暂停/静音图标化文本和真实点击热区；
- pickup：单一 Graphics 圈，默认隐藏。

复用 `createTacticalPanel`/`createStatusLamp`，不复制 Theme 色值；五个固定 HUD 区对象 scrollFactor 0，拾取圈是 controller 独立持有的 world-space Graphics。测试 pistol/shotgun/tesla 切换时只更新同一个 image 的 `textureKey`，不重建 image 或改变 display size。

- [ ] **步骤 4：验证并提交**

~~~powershell
node --test test/tactical-hud-view.test.js test/tactical-ui.test.js
npm run build
git diff --check
git add -- src/ui/tacticalHudView.js src/ui/tacticalUi.js test/tactical-hud-view.test.js test/tactical-ui.test.js
git commit -m "feat(ui): build tactical hud view"
~~~

---

## 任务 3：通过 hudMixin 兼容层接入

**文件：**
- 修改：`src/scene/hud.js`
- 新建：`test/hud-lifecycle.test.js`
- 新建：`test/hud-compatibility.test.js`
- 修改：`test/hud-presentation.test.js`

- [ ] **步骤 1：冻结旧 façade 与 alias**

测试以下调用在迁移后仍存在并安全：

~~~js
createUI()
updateUI()
updateWeaponHud()
setGameplayHudVisible(visible)
collapseFacilityHud()
updatePickupRadiusIndicator()
updateMuteText()
teardownHud()
~~~

冻结 timeline 当前读取/位移的 HUD 引用；对兼容 alias 断言它们指向 controller 所持对象，而不是重复对象。连续三次 create→teardown 后 listener 和 Phaser object 数量不增长。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/hud-lifecycle.test.js test/hud-compatibility.test.js test/hud-presentation.test.js
~~~

- [ ] **步骤 3：最小委托接线**

`createUI()` 创建一次 `this.tacticalHudView` 并建立 alias；`updateUI()` 获取纯 presentation 后调用 `view.update`；旧更新方法委托同一 view。不要修改 `main.js`、`timeline.js` 或 UIManager；若发现旧消费者无法通过 alias 保持兼容，先增加测试再做最小局部调整并说明原因。

controller 创建失败时，销毁半成品并调用从当前实现抽出的 `createLegacyHud()`；若最小旧 HUD 也失败，则安装空的 `gameplayHudContainers/timelineHudBasePositions`、安全 no-op view 和兼容 alias，保证 timeline、UIManager、暂停、静音和 Scene 创建不会因 undefined 再次抛错。失败测试必须覆盖 tactical view 构造异常后 Scene 仍能 update、pause 和 shutdown。

- [ ] **步骤 4：验证并提交**

~~~powershell
node --test test/hud-lifecycle.test.js test/hud-compatibility.test.js test/hud-presentation.test.js test/tactical-hud-view.test.js test/tactical-ui.test.js
npm run build
git diff --check
git add -- src/scene/hud.js test/hud-lifecycle.test.js test/hud-compatibility.test.js test/hud-presentation.test.js
git commit -m "feat(ui): connect tactical hud facade"
~~~

---

## 任务 4：把拾取范围改为上下文提示

**文件：**
- 修改：`src/scene/hud.js`
- 修改：`src/scene/combat.js`
- 新建：`test/hud-pickup-notification.test.js`
- 修改：`test/tactical-hud-view.test.js`

- [ ] **步骤 1：先测提示条件和玩法等价**

拾取提示时序只由 `tacticalHudView` 内部拥有：`notifyPickupCue()` 更新内部 `cueUntilMs`，纯 presentation 不保存截止时间。默认游玩时圈隐藏；拾取半径数值发生变化或拾取 combat stim/SCP-500 后显示 650ms；`buildPanelVisible` 为 true 时持续显示，关闭后仅在 cue 尚未到期时继续显示。到期后隐藏并 clear Graphics。通知缺失、controller 抛错和 view 不存在时，拾取物销毁、buff、治疗、半径和 XP 结果与基线一致。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/hud-pickup-notification.test.js test/tactical-hud-view.test.js
~~~

- [ ] **步骤 3：实现 post-commit 表现通知**

在 `hudMixin` 增加：

~~~js
notifyPickupRadiusCue(reason, nowMs = this.elapsedSurvivalMs) {
  try {
    this.tacticalHudView?.notifyPickupCue({ reason, nowMs, durationMs: 650 });
  } catch {
    // 表现失败不得影响玩法。
  }
}
~~~

`combat.js` 只能在 combat stim 或 SCP-500 效果已应用且拾取物已销毁后调用。半径变化由 view 比较上一次 presentation.radius 检测；`updateUI()` 每帧把 `buildPanel.visible` 作为 `buildPanelVisible` 传入，因此 `toggleBuildPanel()`/`hideBuildPanel()` 无需另造状态，但测试必须覆盖开、关和 cue 重叠。不在玩法配置里增加 cue 状态。

- [ ] **步骤 4：阶段验证并提交**

~~~powershell
node --test test/hud-pickup-notification.test.js test/hud-presentation.test.js test/tactical-hud-view.test.js test/tactical-ui.test.js test/opening-visual-contract.test.js test/hud-lifecycle.test.js test/hud-compatibility.test.js
npm run build
git diff --check
git status --short --branch
git add -- src/scene/hud.js src/scene/combat.js test/hud-pickup-notification.test.js test/tactical-hud-view.test.js
git commit -m "feat(ui): make pickup range contextual"
~~~

## 阶段验收

- 代码审查：兼容 alias、热区不漂移、post-commit 通知、构造回滚、restart 无泄漏。
- 视觉审查：960×540 下五区无重叠，战斗中心无遮挡，低生命/设施/Boss 层级清晰，拾取圈不常驻。
- 用户最终浏览器 smoke 放到集成计划。
