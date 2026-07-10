# UI/Art 第一阶段视觉提案

> **状态：**待 Project Lead 审查  
> **分支：**`feature/ui-art-overhaul`  
> **基线 HEAD：**`7ba082c`  
> **设计依据：**[UI/Art 视觉方向设计](../specs/2026-07-10-ui-art-visual-direction-design.md)（2026-07-10 批准）  
> **计划来源：**[UI/Art 第一阶段实施计划](./2026-07-10-ui-art-phase1-planning.md)  
> **本轮范围：**仅方案文档；不修改 `src/`、不导入素材、不改变玩法。

---

## 1. 执行摘要

本提案为第一轮 UI/Art 视觉切片建立可授权、可回退、可验证的实施蓝图。核心原则：

1. **情绪弧线**：设施秩序 → 警告压力 → 异常干扰 → 收容失效 → 战术求生。
2. **三层视觉语言**：基金会专业压迫感（稳定界面）+ 异常失控表现层（有边界、可恢复）+ 战术生存 HUD 层级（快速回答威胁/工具/拖延代价）。
3. **契约优先**：消费现有 `PreloadScene`、`manifest.js`、`fallbackTextureFactory.js`、`UIManager`、`AudioManager` 和 `this.playSound()` 入口；不替换玩法语义。
4. **混合资源**：正式素材缺失时继续程序化 fallback；外部素材进入生产前必须完成来源登记。

**第一轮实施页面（批准后）：**标题页、武器选择、战斗 HUD。  
**同批遵守 token 但可延后细化：**暂停、升级、胜利、失败、构筑面板。

---

## 2. Task 1 事实盘点

### 2.1 分支与 worktree

| 项 | 值 |
|---|---|
| 分支 | `feature/ui-art-overhaul` |
| worktree | `c:\scp-survivor-ui-art` |
| HEAD | `7ba082c52abad7f12d5bbcc55056c0c08119fada` |
| 工作区 | 干净（提案提交前无未授权改动） |

### 2.2 视口与坐标契约

| 常量 | 值 | 用途 |
|---|---|---|
| `GAME_WIDTH` | 960 | HUD、菜单、覆盖层布局空间 |
| `GAME_HEIGHT` | 540 | 同上 |
| `WORLD_WIDTH/HEIGHT` | 1920 | 玩法世界；摄像机跟随玩家 |

**关键约束：**标题、武器选择、战斗 HUD 主控件使用 `setScrollFactor(0)` 固定屏幕。暂停与升级覆盖层通过 `syncScreenOverlayPosition()` 跟随当前视口，避免摄像机跟随导致热区偏移（`menus.js` 已有注释与修复）。

### 2.3 UI 对象所有权

| 区域 | 创建入口 | 销毁/隐藏 | 深度（当前） | 滚动 |
|---|---|---|---|---|
| 标题页 | `menus.js:createStartScreen` | `destroyStartScreen` | 10–12 | 屏幕固定 |
| 武器选择 | `menus.js:createWeaponSelectionScreen` | `destroyWeaponSelectionScreen` | 10–32 | 屏幕固定 |
| 战斗 HUD 集群 | `hud.js:createUI` | `setGameplayHudVisible` | 45–46 | 屏幕固定 |
| 拾取范围指示 | `hud.js:createUI` | 随 HUD 显隐 | 4 | 世界空间 |
| 停电暗化 | `hud.js:createUI` + `timeline.js:updatePowerOutageVisual` | 强度归零时 clear | 40 | 屏幕固定 |
| 事件横幅 | `hud.js:createUI` + `showTopBanner` | 定时过期 | 58 | 屏幕固定 |
| 构筑面板 | `hud.js:createBuildPanel` | `hideBuildPanel` | 56 | 屏幕固定 |
| 升级覆盖层 | `progression.js` | `destroy(true)` | 60 | 视口同步 |
| 暂停覆盖层 | `menus.js:showPauseOverlay` | `hidePauseOverlay` | 70 | 视口同步 |
| 胜负覆盖层 | `menus.js:showGameOver/VictoryOverlay` | 场景 restart | 50–52 | 屏幕固定 |

**Manager 门面：**

- `UIManager`（`src/ui/UIManager.js`）仅转发 `update()`、`showBanner()`、`setGameplayVisible()` 至 scene HUD 方法；**不得**与 `scene.updateUI()` 形成递归。
- `AudioManager` 拥有 Web Audio 图；`scene.playSound(name)` 为薄包装。静音状态以 `scene.soundMuted` 为唯一来源。

**共享文件依赖（实施时需审批）：**

| 文件 | 原因 | 受影响分支 |
|---|---|---|
| `src/main.js` | 场景构造、manager 挂载 | 全部 |
| `src/assets/manifest.js` | 纹理 key 与加载清单 | `feature/ui-art-overhaul`、未来合并至 `main` |
| `src/scenes/PreloadScene.js` | 加载顺序 | 同上 |
| `AudioManager` / `UIManager` 公共接口 | 跨域契约 | 全部 |

### 2.4 素材与音频契约

**纹理 key（`manifest.js:TEXTURES`，当前全部程序化）：**

| Key 常量 | 字符串 key | 用途 | Fallback 尺寸 |
|---|---|---|---|
| `player` | `player-rect` | 玩家 | 28×28 |
| `enemyInfected` | `enemy-infected` | 感染职员 | 20×20 |
| `enemyCrawler` | `enemy-crawler` | 爬行者 | 20×20 |
| `enemyDrone` | `enemy-drone` | 无人机 | 22×22 |
| `eliteRiot` | `elite-riot` | 精英防暴 | 34×34 |
| `eliteBlink` | `elite-blink` | 闪烁潜行者 | 32×32 |
| `eliteBiomass` | `elite-biomass` | 生物质精英 | 36×36 |
| `biomassChild` | `biomass-child` | 生物质子体 | 20×20 |
| `enemyScp049` | `enemy-scp049` | Boss | 36×36 |
| `bullet` | `bullet-circle` | 弹丸 | 8×8 |
| `enemyProjectile` | `enemy-projectile` | 敌方弹丸 | 10×10 |
| `xpGem` | `xp-gem` | 经验宝石 | 10×10 |
| `combatStim` | `combat-stim` | 战斗兴奋剂 | 16×16 |
| `scp500` | `scp500` | SCP-500 | 18×18 |
| `powerOutageLight` | `power-outage-light` | 停电应急光锥 | 440×440 |

**加载流程：**

1. `PreloadScene.preload()` 遍历 `IMAGE_ASSETS`、`SPRITESHEET_ASSETS`、`ATLAS_ASSETS`、`AUDIO_ASSETS`（当前均为空数组）。
2. `PreloadScene.create()` 调用 `generateFallbackTextures()`；每个 key 经 `textures.exists(key)` 守卫，**正式素材不会被覆盖，不会产生重复 key 警告**。
3. 启动 `PrototypeScene`。

**音频（当前全合成，无文件）：**

| `playSound` 名称 | 触发场景 |
|---|---|
| `shoot` | 射击 |
| `enemyHit` | 命中敌人 |
| `playerDamage` | 玩家受伤 |
| `levelUp` | 升级 |
| `facilityWarning` | 设施事件警告 |
| `objectiveComplete` | 目标完成 |
| `pickupHeal` | 拾取治疗 |
| `bossAppear` | Boss 登场 |
| `bossSummon` | Boss 召唤 |

### 2.5 现有表现层与玩法状态映射

| 玩法状态 | 代码位置 | 当前表现 | 恢复机制 |
|---|---|---|---|
| 电力故障 | `timeline.js:beginFacilityEvent("powerOutage")` | 暗化 RT + 玩家光锥 + 琥珀横幅 + `facilityWarning` 音 | `outageVisualStrength` 渐退；事件结束横幅 |
| 感知诱饵 | `timeline.js` phase≥3 `decoys` | 半透明假目标移向玩家 | `expiresAtMs` 销毁；终局 `clear` |
| 敌人传送 | phase≥5 `teleport`；`blinkStalker` 精英 | 警告圈 + 残影圆 | 单次传送后 destroy |
| HUD 干扰 | phase 6 `hudCorruption` | 文本抖动 ±2.4px、alpha 0.82 | phase 结束或终局复位 base 坐标 |
| 子弹偏移 | phase 6 `bulletDeviation` | 弹道角度 ±2.5° | 仅表现；数值由玩法层计算 |
| 屏幕震动 | phase 6 `screenShake` | 摄像机偏移 | phase 结束停止 |
| Boss 登场 | `enemies.js:spawnScp049Boss` | 横幅 + `bossAppear` | 进入 Boss HUD 稳定模式 |

**玩法不变承诺：**上述表现仅观察 `getTimelinePhase()`、`activeFacilityEvent`、Boss 状态；不创建或修改伤害、生命、刷怪、AI、时间轴节点或胜负条件。

### 2.6 安全切入点清单

| 优先级 | 文件 | 可改范围 | 风险 |
|---|---|---|---|
| P0 | `src/ui/theme.js` | 扩展 token、保持向后兼容导出 | 低 |
| P0 | `src/scene/hud.js` | 表现：颜色/布局/深度；不改 `updateUI` 数据语义 | 中 |
| P0 | `src/scene/menus.js` | 标题/武器/暂停/胜负视觉；不改 `startMissionWithWeapon` 逻辑 | 中 |
| P1 | `src/assets/fallbackTextureFactory.js` | 程序化外观；不改 key 字符串 | 低 |
| P2 | `src/scene/effects.js` | 瞬态 VFX 外观与池化 | 低 |
| P2 | `src/scene/timeline.js` | 异常表现强度/清理；不改 `BALANCE.timeline.phases` | 中–高 |
| 需审批 | `manifest.js`、`PreloadScene.js` | 新增正式素材条目 | 高 |
| 禁止本轮 | `balance.js`、武器/敌人逻辑、`main.js` 构造流程 | — | — |

---

## 3. 视觉语言

### 3.1 第一层：基金会专业压迫感

**情绪目标：**玩家进入游戏时感到身处有流程、人员、设备和管理制度的基金会设施，制度正在承受压力但尚未崩溃。

**造型语言：**

- 深蓝黑底（`#080C16`–`#111319`）+ 冷石墨面板（`#141c2f`–`#243049`）；
- 冷白/浅青信息（`#e2e8ff`–`#c5d2ee`）；
- 琥珀警告（`#ffdf9a`–`#ffe08a`）表示运行压力与需注意状态；
- 红色（`#ff6b6b` 系）**仅**用于即时危险、严重受伤、收容失败；
- 绿色（`#54d67b`–`#a7f3d0`）用于医疗、恢复、收容完成；
- 结构化面板：顶部分段线、状态灯圆点、设施编号前缀（如 `SITE-██`）、警告标签 `[ALERT]`、分段读数（标签左/数值右）；
- 动画克制：悬停 120ms 填充过渡、焦点 1px 描边增亮；无持续故障滤镜。

**适用页面：**标题、武器选择、基础 HUD、升级卡片、暂停、结算——即一切“设施仍试图维持秩序”的界面。

### 3.2 第二层：异常失控表现层

**原则：**故障和扭曲是**玩法状态信号**，必须有开始、持续时间、强度上限和恢复路径；不能成为永久滤镜。

| 状态 | 提案表现 | 强度上限 | 双通道 | 清理 owner |
|---|---|---|---|---|
| 电力故障 | 全局暗化 0→0.96α；玩家光锥；网格 alpha 降至 0.35；横幅琥珀描边 | `outageVisualStrength` ≤ 1 | 暗化 + 横幅文字 + 音效 | `updatePowerOutageVisual`；`systems.js` restart 清零 |
| 感知诱饵 | 假目标：虚线轮廓圆 + `signalAnomaly` 色；**不得**覆盖生命/暂停控件 | 同屏 ≤3 | 形状（虚线）+ 运动 | `instabilityDecoys` group；`expiresAtMs` |
| 传送警告 | 精英脚下弧线 + 0.4s 脉冲环 | 单次 | 弧线 + 精英 tint | `registerTransientEffect` + tween destroy |
| HUD 干扰 | 仅 `timelineHudBasePositions` 列表内文本；抖动 ≤3px；alpha ≥ 0.75 | jitter ≤ 3 | 抖动 + 相位色文字前缀 `▮` 闪烁 | `updateTimelineHudCorruption` 每帧复位 |
| 子弹偏移 | 弹丸生成时 ±2.5°（已有）；可选短尾迹偏色 | 不增玩法角度 | 弹道视觉 + 音效 | 弹丸生命周期 |
| Boss 登场 | 全宽收容警报横幅 3.2s；`signalDanger` 顶栏；Boss HP 独立行 | 单次警报 | 色 + 横幅 + `bossAppear` | `topBannerState` 过期 |

**关键 UI 豁免（异常期间保持可读）：**生命数值、暂停按钮、升级/暂停交互卡片、武器弹药关键数字——位置不抖动或抖动幅度减半。

### 3.3 第三层：战术生存 HUD 层级

战斗 HUD 必须在 200ms 内回答：

1. **什么可能杀死我？** — 生命/受伤态、精英警告、Boss HP、时间轴阶段名。
2. **我有什么工具？** — 当前武器、弹药/冷却、闪避状态。
3. **拖延会更糟吗？** — 下一时间轴节点倒计时、设施事件横幅。

**提案层级（Z-order，自底向上）：**

| 层级 | 深度带 | 内容 | 模式 |
|---|---|---|---|
| L0 世界反馈 | 4 | 拾取范围圈 | 世界空间 |
| L1 环境压迫 | 40 | 停电暗化 RT | 异常变体 |
| L2 核心生存 | 45–46 | 生命、等级、经验条、武器、阶段、静音、暂停 | 稳定基础 |
| L3 战术情报 | 58 | 事件/Boss 横幅 | 脉冲出现 |
| L4 玩家工具 | 56 | 构筑面板（TAB） | 按需覆盖 |
| L5 流程中断 | 60–70 | 升级、暂停 | 全屏覆盖 |

**信息分组（保持现有数据契约，优化视觉权重）：**

```
┌─────────────────────────────────────────────────────────────┐
│ [L3 事件横幅 — 仅活动时]                                      │
├─────────────────────────────────────────────────────────────┤
│ 生命 ████████░░  时间  击杀          [静音] [暂停]  ← L2 右上 │
│ 等级 Lv.N                                                     │
│ 经验 ████████░░  current/max                                  │
│ ■ 武器名 — 等级 | 伤害/冷却 | 弹药/链击 | 闪避状态  ← L2 左下 │
│ 阶段名 | 下一节点/Boss HP                         ← L2 琥珀  │
└─────────────────────────────────────────────────────────────┘
```

**受伤反馈（表现 only）：**生命文本在 `health/maxHealth < 0.35` 时切换 `signalDanger` + 左侧 4px 危险条脉冲（2Hz，alpha 0.3–0.7）；不修改实际伤害逻辑。

---

## 4. Theme Token 系统

### 4.1 设计原则

- 所有页面与组件引用 token，禁止新增散落字面量；
- `theme.js` 已有 catalogue 结构；实施时**扩展**而非替换导出名称，避免破坏并行开发；
- 每个 token 记录：值、对比度意图、允许用途、fallback（程序化）行为。

### 4.2 Token 表

#### 表面（`THEME.surface`）

| Token | 值 | 对比度意图 | 用途 | Fallback |
|---|---|---|---|---|
| `surfaceFacility` | `#080C16` / `0x080c16` | 背景 | 标题/选择全屏底 | `rectangle` 填充 |
| `surfacePanel` | `#141c2f` / `0x141c2f` | 面板 vs 背景 ≥ 3:1 | 卡片、暂停板 | 圆角矩形 + 描边 |
| `surfaceRaised` | `#243049` / `0x243049` | 可交互抬起 | 按钮默认 | 矩形 + 1px 描边 |
| `surfaceOverlay` | `#000000` @ 0.65–0.78 | 遮罩 | 暂停/升级/结算 backdrop | 半透明矩形 |

#### 文字（`THEME.text`）

| Token | 值 | 用途 | 最低字号 |
|---|---|---|---|
| `textPrimary` | `#e2e8ff` | 主读数、HUD 统计 | 16px |
| `textSecondary` | `#c5d2ee` | 副标题、说明 | 14px |
| `textMuted` | `#8fa2c8` | 提示、标签 | 13px |
| `textCritical` | `#ff8a8a` | 危险读数（配图标） | 16px bold |
| `textContained` | `#a7f3d0` | 等级、收容完成 | 16px |
| `textOnButton` | `#ffffff` | 主按钮文字 | 22px |

#### 信号（`THEME.signal`）

| Token | 值 | 语义 | 非色觉辅助 |
|---|---|---|---|
| `signalInfo` | `#6f91d8` / `#a3c1ff` | 普通信息、选中描边 | 实线边框 |
| `signalWarning` | `#ffdf9a` / `#ffe08a` | 运行压力、阶段 | `▲` 前缀 |
| `signalDanger` | `#ff6b6b` / `0xff4040` | 即时危险 | `!!` 标签 + 脉冲条 |
| `signalContained` | `#54d67b` | 医疗/收容/经验 | `●` 状态灯 |
| `signalAnomaly` | `#c8a0ff` / `0xd8b0ff` | 异常干扰 | 虚线描边 |

#### 边框（`THEME.border`）

| Token | 值 | 用途 |
|---|---|---|
| `borderDefault` | `0x4060a0` / `#40557f` | 面板默认 |
| `borderFocus` | `0x6f91d8` | 悬停/焦点 |
| `borderWarning` | `0xffb347` | 警告卡片 |
| `borderCritical` | `0xff6b6b` | 危险/失败 |

#### 动画（`THEME.motion`）

| Token | 时长 | 强度 | 用途 |
|---|---|---|---|
| `motionStable` | 120ms | 无位移 | 按钮悬停 |
| `motionWarning` | 800ms 循环 | 描边 alpha 0.5–1 | 阶段文本 |
| `motionAnomaly` | 每帧 | 抖动 ≤3px | HUD 干扰 |
| `motionCritical` | 3200ms 一次 | 横幅滑入 + 衰减 | Boss 警报 |

#### 字体（`THEME.font`）

| Token | 族 | 用途 |
|---|---|---|
| `fontDisplay` | Microsoft YaHei / PingFang SC / Noto Sans SC, bold | 标题 44–64px |
| `fontBody` | 同上, regular | 正文 14–20px |
| `fontMono` | Consolas / Courier New, regular | 设施读数、倒计时 |
| `fontLabel` | 同上, 12–13px bold | 徽章、状态标签 |

#### 间距（`THEME.spacing`，扩展现有）

| Token | 值 | 用途 |
|---|---|---|
| `hudPaddingX` | 14 | HUD 左边距（已有） |
| `hudPaddingTop` | 12 | HUD 顶距（已有） |
| `panelPadding` | 24 | 面板内边距 |
| `cardGap` | 10 | 武器卡片间距 |
| `touchMin` | 44 | 最小触控热区高度 |

### 4.3 与现有 `theme.js` 映射

实施第一轮时，将 `hud.js` / `menus.js` 中的字面量逐批替换为上述 token。现有 `THEME.color.text.primary` 等保留别名指向新 token，确保渐进迁移。

---

## 5. 页面范围

### 5.1 标题页

**角色：**建立基金会设施身份；克制、专业、可信赖。

**布局：**

| 元素 | 位置 | 数据 | 交互 |
|---|---|---|---|
| 全屏底 | `surfaceFacility` | 无 | 无 |
| 设施顶栏 | 顶 24px | 静态 `SITE-██ · 收容协议在线` | 无 |
| 主标题 | cy−130 | `"SCP：幸存者"` | 无 |
| 副标题 | cy−70 | 任务摘要（现有文案） | 无 |
| 操作提示 | cy−8 | WASD/空格/TAB/ESC/M | 无 |
| 主按钮 | cy+78, 260×62 | — | → `beginFromStartScreen` |
| 学分提示 | cy+150 | `meta.credits` | 只读 |

**状态灯（新增表现）：**标题下方 6px 行：`● 电力正常` `● 收容稳定` — 使用 `signalContained`，轻微 4s 呼吸 alpha（`motionWarning` 强度 0.15），**不**触发故障动画。

**销毁：**`destroyStartScreen` 遍历 `startScreenObjects` destroy；进入武器选择前调用。

**玩法不变：**按钮仍调用 `beginFromStartScreen`；不修改 meta 加载逻辑。

### 5.2 武器选择

**角色：**装备授权终端（Equipment Authorization Terminal）。

**布局层级：**

```
┌─ 学分 [解锁商店] ───────────────────────────────── top bar ─┐
│                    选择主武器                                │
│                 部署前请选择一套装备。                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                      │
│  │ ■ 手枪  │  │ ▲ 突破器│  │ ≈ 特斯拉│   ← 卡片 250×318     │
│  │ 定位摘要│  │         │  │         │                      │
│  │ 难度徽章│  │         │  │         │                      │
│  │ 分段读数│  │         │  │         │                      │
│  └─────────┘  └─────────┘  └─────────┘                      │
│              [ 开始任务 ]                                      │
└──────────────────────────────────────────────────────────────┘
```

**卡片状态机：**

| 状态 | 填充 | 边框 | 附加 |
|---|---|---|---|
| 默认 | `surfacePanel` 衍生 `#17223a` | `borderDefault` | — |
| 悬停 | 提亮 +4% | `borderFocus` | 无缩放 |
| 选中 | 填充 `#1e3358` | `borderFocus` 2px | 右上角 `[已选择]` 徽章 |
| 禁用开始 | 按钮 `surfaceRaised` 灰化 | `borderDefault` | 文案「请选择武器」 |

**数据绑定（不变）：**`BALANCE.weapons[id]` 名称与 stats；`pendingSelectedWeaponId`；`startMissionWithWeapon(id)`。

**解锁商店：**保持左上角学分 + 右上角入口；视觉降为 `fontLabel` + 较小按钮，不抢主决策。

**响应式：**基准 960×540；卡片总宽 870 已适配；若未来支持更窄视口，提案改为纵向堆叠卡片（需单独审批视口常量）。

**销毁：**`destroyWeaponSelectionScreen` 销毁 `weaponSelectUiObjects` 并清空引用。

### 5.3 战斗 HUD

**稳定基础模式（默认）：**

- 生命行：`textPrimary`；低生命切 `textCritical` + 危险条；
- 等级：`textContained`；
- 经验条：track `0x223344` → token `surfaceRaised`；fill `signalContained`；
- 武器块：符号（■/▲/≈）+ 名称 + 关键数值（保持 `updateWeaponHud` 文案结构）；
- 阶段行：`signalWarning`；Boss 阶段追加 `fontMono` HP%；
- 静音/暂停：右上；热区 ≥ `touchMin`。

**异常变体（仅表现）：**

| 触发 | HUD 变化 |
|---|---|
| 电力故障 | L1 暗化；HUD 文本保持 L2 全亮 |
| HUD 干扰 | 非豁免文本抖动；阶段行前缀 `▮` |
| Boss 警告 | L3 横幅「收容加压」；阶段行加粗 |
| Boss 战 | 阶段行显示 `终局：SCP-049 | Boss 生命 N%` |

**更新节奏（不变）：**`updateUI` 每帧；`updatePhaseHud` 内嵌；`UIManager.update()` 转发。

**不修改：**数值含义、字段位置契约（left 14px 对齐）、`setGameplayHudVisible` 目标列表语义。

### 5.4 共享覆盖层（遵守 token，实施可第二批）

| 覆盖层 | 提案要点 |
|---|---|
| 暂停 | `surfaceOverlay` + `surfacePanel`；主按钮 `borderFocus`；退出 `borderCritical` |
| 升级 | 三卡片 + 重抽/跳过；选中卡 `borderFocus`；与暂停同深度策略 |
| 胜利 | `signalContained` 标题描边；绿色主按钮 |
| 失败 | 中性面板 + `signalDanger` 标题 |
| 构筑 | `surfaceOverlay` 78% + 等宽字体读数 |

---

## 6. 素材迁移顺序

### 6.1 分类原则

| 类别 | 定义 | 第一轮 |
|---|---|---|
| 程序化 | `Graphics.generateTexture` 或运行时图形 | **全部 UI 表面与图标** |
| 原创 | 团队自制，MIT 或项目自有 | 暂无 |
| 外部 | 第三方来源，须登记 | **不进入本轮** |
| 生成 | AI 生成，须额外审查 | **不进入本轮** |

### 6.2 迁移 waves（批准后执行顺序）

| Wave | 内容 | 类型 | 依赖 |
|---|---|---|---|
| W0 | Theme token 接入 + 字面量迁移 | 程序化 | 仅 `theme.js`、HUD/菜单 |
| W1 | UI 面板/按钮/徽章程序化纹理（可选 9-slice） | 程序化 | 新 key 需 manifest 登记 |
| W2 | 武器图标 64×64 | 原创或外部 | 来源登记表 |
| W3 | 设施地面/装饰 | 外部 | 来源登记表 |
| W4 | 玩家/敌人/Boss 精灵 | 外部/原创 | 来源登记表 |
| W5 | 核心 UI 音效 | 外部 | `AUDIO_ASSETS` + 审批 |

### 6.3 拟定 UI 纹理 key（W1，尚未实施）

| 拟定 key | 类型 | 尺寸 | Fallback | 加载入口 |
|---|---|---|---|---|
| `ui-panel-facility` | image | 64×64 九宫 | 程序化圆角矩形 | `IMAGE_ASSETS` |
| `ui-button-primary` | image | 128×48 | 程序化 `surfaceRaised` | 同上 |
| `ui-icon-weapon-pistol` | image | 64×64 | 符号 `■` 文本 | 同上 |
| `ui-icon-weapon-shotgun` | image | 64×64 | 符号 `▲` | 同上 |
| `ui-icon-weapon-tesla` | image | 64×64 | 符号 `≈` | 同上 |

**兼容策略：**新 key 只增不删；旧 key 保持；迁移表需在 manifest 修改 PR 中附审查。

### 6.4 来源与许可证

当前生产资源登记表（`docs/licensing-and-commercialization.md`）：

> _尚无正式外部素材_ — 全部程序化 fallback。

**门禁（不变）：**

- 来源不明、仅限个人、禁止商业、无法满足署名/再分发条件的素材**不得**进入 `IMAGE_ASSETS` / `AUDIO_ASSETS`；
- SCP 衍生内容须遵守 [SCP Licensing Guide](https://scp-wiki.wikidot.com/licensing-guide) 与 CC BY-SA 3.0 相同方式共享要求；
- 任何外部素材入库前必须填写完整登记表行（名称、作者、URL、许可证、修改、商业状态、署名）。

**本轮结论：**不新增外部素材行；W2+ 素材在入库 PR 中逐条追加登记。

---

## 7. Manifest 与 Fallback 契约

### 7.1 现有 key 兼容

**冻结：**`TEXTURES` 中 15 个字符串 key 不得在无迁移表的情况下重命名。

### 7.2 Fallback 规则

1. `ensureTexture(scene, key, draw)` 先查 `textures.exists(key)`；
2. 正式素材加载成功则跳过 draw；
3. `graphics.destroy()` 在批次末释放；
4. 场景 `restart` 时 `systems.js` 重置 `outageVisualStrength` 等表现状态。

### 7.3 重复 key 检查

- 禁止在 `generateFallbackTextures` 中对已存在 key 再次 `generateTexture`；
- 新增 manifest 条目前，在开发环境运行并确认控制台无 `Texture key already in use`；
- 验证命令见 §9。

---

## 8. 可访问性、动画强度与清理

### 8.1 可访问性

| 要求 | 提案实现 |
|---|---|
| 双通道状态 | 颜色 + 形状/前缀/状态灯；危险 + `!!` 标签 |
| 色觉差异 | 警告用琥珀+三角；危险用红+粗体；不单靠红绿对立 |
| 异常期可读 | HUD 干扰时生命/暂停豁免抖动；alpha 下限 0.75 |
| 热区对齐 | 屏幕固定 UI 用 `scrollFactor(0)`；视口覆盖层用 `syncScreenOverlayPosition` |
| 最小字号 | HUD 关键数值 ≥16px；标签 ≥13px |
| 静音可见 | `muteText` 始终显示当前音频状态 |

### 8.2 动画强度上限

| 效果 | 上限 | 降级 |
|---|---|---|
| HUD 抖动 | 3px | 低于 30fps 时停用抖动 |
| 停电暗化 | alpha 0.96 | 强度线性进退 |
| 横幅闪烁 | 无闪烁；仅末尾 280ms 淡出 | — |
| 按钮悬停 | 仅颜色过渡 | 无弹性缩放 |
| Boss 警报 | 单次 3.2s | 不循环 |

### 8.3 清理逻辑

| Owner | 触发 | 动作 |
|---|---|---|
| `startScreenObjects` | 离开标题 | 逐个 `destroy` |
| `weaponSelectUiObjects` | 开始任务 | 逐个 `destroy` |
| `pauseOverlay` | 恢复/退出 | `destroy(true)` |
| `levelUpOverlay` | 选择/跳过 | `destroy(true)` |
| `transientEffects` | 特效完成 | `destroy` 或池回收 |
| `instabilityDecoys` | 过期/终局 | `destroy` / `clear` |
| `outageDarknessRt` | 强度 0 / restart | `clear` + `setVisible(false)` |
| `timelineHudBasePositions` | 每帧 | 非干扰态复位坐标 |
| `AudioManager` | scene shutdown | `destroy()` 关闭 AudioContext |
| `topBannerState` | 过期 | `setVisible(false)` + null |

**场景 restart：**`freezeForGameOver`、`quitToTitle`、`scene.restart()` 路径须保持无泄漏（现有 `systems.js` 已部分处理；实施时增补 UI 专用 tween 取消）。

---

## 9. 实施边界

### 9.1 文件所有权

| 分类 | 文件 |
|---|---|
| **UI/Art 负责** | `src/ui/theme.js`、`src/scene/hud.js`、`src/scene/menus.js`（表现）、`src/scene/effects.js`（VFX 外观）、`src/assets/fallbackTextureFactory.js`、素材文件与来源记录 |
| **需 Project Lead 审批** | `src/main.js`、`manifest.js`、`PreloadScene.js`、`AudioManager.js`、`UIManager.js` 公共接口、`package.json`、`index.html` |
| **Gameplay 负责** | `balance.js`、`combat.js`、`enemies.js`、`weapons.js`、`timeline.js`（玩法逻辑）、`meta.js`、持久化 |

### 9.2 建议提交拆分（批准后）

1. `feat(ui): expand theme tokens and migrate HUD literals`
2. `feat(ui): restyle title and weapon selection`
3. `feat(ui): combat HUD hierarchy and anomaly variants`
4. `feat(assets): add UI procedural textures`（若 W1 启用新 key，附 manifest PR）

### 9.3 回滚方案

- 每 PR 限定单页面或单主题；回滚 = revert 单个 commit；
- 无 manifest 改动时，fallback 与现网等价；
- token 迁移保持旧别名 1 个版本周期。

---

## 10. 验证矩阵

### 10.1 本轮（提案阶段）已执行

| 命令 | 预期 | 实际 |
|---|---|---|
| `git branch --show-current` | `feature/ui-art-overhaul` | 通过 |
| `git status --short --branch` | 干净 | 通过（提交前） |
| `git diff --check` | 无冲突标记 | 待提交前执行 |
| `npm run build` | 构建成功 | 待提交前执行 |

### 10.2 实施后必跑（批准后）

| 检查项 | 方法 |
|---|---|
| 生产构建 | `npm run build` |
| 空白字符 | `git diff --check` |
| 标题 → 武器选择 → 战斗 | 手动 smoke |
| HUD 升级/暂停/胜负/重启 | 手动 smoke |
| 视口 960×540 | 浏览器默认 |
| 指针热区 | 暂停/武器卡/开始按钮点击对齐 |
| 缺失素材 | 控制台无 load 错误 |
| 重复 texture key | 控制台无警告 |
| 首次交互音频 | 静音切换 M；射击有音 |
| 停电/HUD 干扰/Boss 横幅 | 时间轴 smoke（可 DEBUG 快进） |
| worktree | `git status` 干净 |

---

## 11. 风险与后续

| 风险 | 缓解 |
|---|---|
| 字面量迁移遗漏 | ESLint 规则或 CI grep 阻止新增 `#` 色值于 `hud.js`/`menus.js` |
| 异常效果过度 | 强度 token 上限 + 低 FPS 降级 |
| 共享文件冲突 | 严格按 §9.1 审批；单域小 PR |
| 外部素材许可证 | 入库前强制登记表；无“待寻找” |

**等待项：**Project Lead 审查本提案；批准后方可按 `superpowers:executing-plans` 进入 W0 实施。

---

## 12. 相关文档

- [UI/Art 视觉方向设计](../specs/2026-07-10-ui-art-visual-direction-design.md)
- [UI/Art 第一阶段实施计划](./2026-07-10-ui-art-phase1-planning.md)
- [UI、美术、音频与资源方向](../../art-and-asset-direction.md)
- [许可与商业化准备](../../licensing-and-commercialization.md)
- [产品愿景](../../product-vision.md)
