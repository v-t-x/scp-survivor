# UI/Art 第一批实际实施计划

> **给 Agent 的要求：**必须使用 `superpowers:executing-plans` 按任务执行。每个任务独立提交并等待 Project Lead 审查。本计划不授权外部素材、manifest、Preload、AudioManager、UIManager 或玩法改动。

**目标：**在不改变玩法的前提下，完成基金会设施 Theme、标题页、武器选择和基础战斗 HUD 的第一轮视觉升级。

**架构：**扩展 `src/ui/theme.js`，保持现有 token 兼容；`menus.js` 和 `hud.js` 只消费 Theme token 与现有玩法数据。第一批全部使用 Phaser 程序化图形，不新增外部图片、字体或音频。

**技术栈：**Phaser 3.90、Vite 7、JavaScript ES Modules、现有 `PrototypeScene` mixin 和 UI Foundation。

## 全局约束

- 只允许修改 `src/ui/theme.js`、`src/scene/menus.js`、`src/scene/hud.js`；
- 不修改 `src/main.js`、manifest、Preload、AudioManager、UIManager、依赖或玩法配置；
- 不改变伤害、生命、武器、刷怪、AI、时间轴、升级、胜负和 localStorage；
- 不导入任何外部素材；
- 保持现有方法签名、交互回调、texture key、Scene restart 和 pointer hit area；
- 所有新文档和交付报告使用中文；
- 每个任务完成后运行 `npm run build` 和 `git diff --check`。

---

### Task 1：扩展 Theme token 并保持兼容

**文件：**

- 修改：`src/ui/theme.js`

**接口：**

- 输入：现有 `THEME.color`、`THEME.fontSize`、`THEME.spacing`；
- 输出：新增 `THEME.surface`、`THEME.text`、`THEME.signal`、`THEME.border`、`THEME.motion`、`THEME.font`，并保留所有旧字段。

- [ ] **步骤 1：加入批准的 token**

新增以下字段，不得删除现有对象：

```js
surface: {
  facility: 0x080c16,
  panel: 0x141c2f,
  raised: 0x243049,
  overlay: 0x000000
},
text: {
  primary: "#e2e8ff",
  secondary: "#c5d2ee",
  muted: "#8fa2c8",
  critical: "#ff8a8a",
  contained: "#a7f3d0",
  onButton: "#ffffff"
},
signal: {
  info: 0x6f91d8,
  warning: 0xffdf9a,
  danger: 0xff6b6b,
  contained: 0x54d67b,
  anomaly: 0xc8a0ff
},
border: {
  default: 0x40557f,
  focus: 0x6f91d8,
  warning: 0xffb347,
  critical: 0xff6b6b
},
motion: {
  stableMs: 120,
  warningMs: 800,
  anomalyJitterPx: 3,
  criticalBannerMs: 3200
},
font: {
  display: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
  body: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif',
  mono: 'Consolas, "Courier New", monospace',
  label: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", Arial, Helvetica, sans-serif'
}
```

- [ ] **步骤 2：验证并提交**

```powershell
node --input-type=module -e "import('./src/ui/theme.js').then(({THEME})=>{if(!THEME.color?.text?.primary||!THEME.surface?.facility||!THEME.signal?.danger)process.exit(1);console.log('theme tokens ok')})"
npm run build
git diff --check
git add src/ui/theme.js
git commit -m "feat(ui): expand foundation theme tokens"
```

预期：输出 `theme tokens ok`，构建成功，diff check 无输出。

### Task 2：升级标题页与武器选择

**文件：**

- 修改：`src/scene/menus.js`

**接口：**

- 输入：Task 1 的 `THEME`；现有 `beginFromStartScreen()`、`startMissionWithWeapon()`、`pendingSelectedWeaponId`；
- 输出：基金会设施风格标题页和装备授权终端，不改变交互回调。

- [ ] **步骤 1：导入 Theme**

```js
import { THEME } from "../ui/theme.js";
```

- [ ] **步骤 2：改造标题页**

保持三个标题页方法签名和对象清理逻辑。使用 Theme token 替代标题页颜色与字体。新增只读状态标签并加入 `startScreenObjects`：

```js
const facilityStatus = this.add.text(cx, cy + 122, "● 电力正常    ● 收容稳定", {
  fontFamily: THEME.font.label,
  fontSize: "13px",
  color: THEME.text.contained
});
facilityStatus.setOrigin(0.5);
facilityStatus.setDepth(11);
this.startScreenObjects.push(facilityStatus);
```

原学分提示移动到 `cy + 158`，不得新增持续 tween。

- [ ] **步骤 3：改造武器选择**

保持卡片尺寸、`cardHitArea`、所有选择回调和开始任务逻辑。只替换颜色、字体和边框；移除悬停缩放，避免热区与绘制位置不一致。核心状态必须等价于：

```js
const scale = 1;
const fill = selected ? 0x1e3358 : hovered ? 0x1d2b49 : 0x17223a;
const border = selected || hovered ? THEME.border.focus : THEME.border.default;
```

- [ ] **步骤 4：验证并提交**

```powershell
npm run build
git diff --check
git diff -- src/scene/menus.js
git add src/scene/menus.js
git commit -m "feat(ui): restyle title and weapon selection"
```

手动检查标题、三张卡片、悬停、选择、解锁商店和开始任务。

### Task 3：升级基础战斗 HUD

**文件：**

- 修改：`src/scene/hud.js`

**接口：**

- 输入：Task 1 的 `THEME`；现有 `updateUI()`、`updateWeaponHud()`、`updatePhaseHud()` 和 `setGameplayHudVisible()`；
- 输出：统一的基金会 HUD 层级和低生命表现，不改变数据语义。

- [ ] **步骤 1：导入并应用 Theme**

```js
import { THEME } from "../ui/theme.js";
```

把 `createUI()` 中 stats、level、XP、mute、pause、weapon、phase 和 banner 的颜色、字体和边框改为 Theme token。不得改变坐标、深度、scroll factor 或交互回调。

- [ ] **步骤 2：增加低生命表现**

在 `updateUI()` 设置文本后加入：

```js
const healthRatio = this.maxHealth > 0 ? this.health / this.maxHealth : 0;
this.statsText.setColor(
  healthRatio < 0.35 ? THEME.text.critical : THEME.text.primary
);
```

本批不新增 tween、危险条或玩法状态。

- [ ] **步骤 3：验证并提交**

```powershell
npm run build
git diff --check
git add src/scene/hud.js
git commit -m "feat(ui): establish tactical combat HUD hierarchy"
```

手动检查 HUD 显隐、暂停、升级、低生命颜色、三把武器、Boss HUD、胜负和两次 restart。

### Task 4：最终验收

- [ ] **步骤 1：范围与构建**

```powershell
git diff --stat 99d5c74..HEAD
git diff --check 99d5c74..HEAD
git status --short --branch
npm run build
```

预期：只修改 `theme.js`、`menus.js`、`hud.js`，worktree 干净，构建成功。

- [ ] **步骤 2：交付报告**

报告三个 commit、文件范围、实际 build 与 smoke 结果、控制台情况、未测试路径和最终 `git status`。不得自行合并。
