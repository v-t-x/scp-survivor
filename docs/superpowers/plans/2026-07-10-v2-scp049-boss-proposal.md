# SCP-049 规则驱动 Boss 与 v2 压力模型提案

> **状态：**项目所有者已批准，且已在 `dev/v2` 实现。
>
> **确认日期：**2026-07-11
>
> **分支 / worktree：**`dev/v2` / `C:\scp-survivor-workspaces\active\gameplay-v2`
>
> **初始审计基线：**`12e13d3`
>
> **Rev 4 代码验证基线：**`935369e`
>
> **实现 commits：**`70786b5`、`72cdae5`、`60be275`、`01b4ccf`、`935369e`
>
> **合同文档 commit：**`ed0aa63`
> **来源计划：**`docs/superpowers/plans/2026-07-10-v2-scp049-boss-planning.md`

本提案现在描述已经确认的产品意图和真实实现，不再把当前 `src/` 变更标记为
“未授权”。合并、push 和发布仍受正常 Git 与验证门禁约束。

## 1. 决策摘要

当前 v2 采用“可读的 Boss 规则 + 高密度失控压力”：

- 保留六分钟流程、SCP-049 终局、胜负条件、restart 和 localStorage 语义；
- SCP-049 使用 `normal → frenzy → normal → dying` 状态机；
- 普通召唤固定生成 10 个弱化感染职员；
- 狂乱召唤固定生成 20 个全强度精英或无人机；
- 所有非 Boss 敌人每 6–9 秒尝试自我复制；
- 全局活动敌人硬上限为 230；
- `DEBUG_MODE=true` 是当前 Boss 测试阶段的明确决定，`B` 键保持可用；
- 不新增 Scene、存档字段、manager API、manifest、外部素材或客户端接口。

这套设计不把“更多敌人”本身当作 SCP 差异化。核心差异来自可观察规则：
SCP-049 会在狂乱期间停止追击、暴露弱点并产生异常波次，玩家需要在攻击暴露 Boss
和先处理失控敌群之间选择。递归复制与大波次负责强化设施失控和压迫感。

## 2. 修订历史

- **Rev 1：**比较尸体复活、接触瘟疫和“外科狂乱”三个方向，推荐外科狂乱。
- **Rev 2：**确定状态机、暴露增伤、霰弹枪叠加上限和死亡清理合同。
- **Rev 3：**保留 `enragedSummonMultiplier`，修复狂乱关闭分支的 cadence 回退合同。
- **Rev 4：**项目所有者确认当前实现就是目标：
  - 普通召唤从 2–3 调整为固定 10；
  - 狂乱召唤从 3–4 弱化感染职员调整为 20 个全强度精英/无人机；
  - 新增全敌人递归复制与 230 上限；
  - 保留 `DEBUG_MODE=true`；
  - 明确 `frenzyEnabled=false` 只关闭狂乱，不自动回退全部 v2 压力。

Rev 1–3 的候选比较属于决策历史；Rev 4 是当前权威合同。

## 3. 已实现玩法合同

### 3.1 SCP-049 状态机

状态由 `src/scene/enemies.js` 的 Boss 对象持有，时间统一使用
`elapsedSurvivalMs`，因此暂停期间不推进。

| 状态 | 进入条件 | 行为 | 退出条件 | 玩家信号 | 清理 |
|---|---|---|---|---|---|
| `normal` | Boss 生成 | 追击玩家；按 cadence 召唤 10 个弱化感染职员 | 到达 `nextFrenzyAtMs` | Boss HP、追击和普通召唤 | 无 |
| `frenzy` | 狂乱 deadline 到达 | Boss 定身；生成 20 个全强度混合单位；Boss 承受暴露增伤 | 2500ms 后回到 `normal` | 红色 tint、顶部横幅、召唤音效 | `exitFrenzy` 清除 tint |
| 激怒修饰 | HP ≤ 50% | 狂乱间隔乘以 0.65 | HP 回升；正常流程中不会发生 | 更快的狂乱节奏 | 无 |
| `dying` | Boss HP ≤ 0 | 禁止后续更新；清理 tint；保持单次胜利路径 | 死亡动画后触发胜利 | 死亡效果和横幅 | 敌人组销毁 Boss |
| shutdown/restart | 退出、失败、胜利或 restart | 清空战斗实体 | 新一局重新初始化 | 无 | Boss 字段、复制 deadline 和实体全部重建 |

`bossPhaseActive` 在 `normal` 和 `frenzy` 中保持为真，只在 Boss 击败后关闭。
狂乱定身、突破器 stagger 和普通追击由 `updateBoss` 明确排序，避免永久冻结。

### 3.2 Boss 数值与狂乱配置

配置位于 `src/config/balance.js` 的 `BALANCE.boss.scp049`。

| Key | 当前值 | 合同 |
|---|---:|---|
| `health` | 2500 | 当前 Boss 生命基线 |
| `speed` | 85 | 普通状态追击速度 |
| `contactDamage` | 20 | 接触伤害 |
| `summonInitialDelayMs` | 5000 | 首次普通召唤延迟 |
| `summonCooldownMs` | 11000 | 普通召唤基础间隔 |
| `summonCountMin/Max` | 10 / 10 | 固定 10 个弱化感染职员 |
| `minionHealthMultiplier` | 0.6 | 普通召唤生命倍率 |
| `minionDamageMultiplier` | 0.85 | 普通召唤伤害倍率 |
| `frenzyEnabled` | true | 狂乱状态开关，不是全部 v2 压力总开关 |
| `frenzyFirstDelayMs` | 12000 | Boss 生成后首次狂乱 |
| `frenzyCooldownMs` | 14000 | 狂乱基础间隔 |
| `frenzyEnragedMultiplier` | 0.65 | 半血后狂乱 cadence 倍率 |
| `frenzyDurationMs` | 2500 | 定身与暴露窗口 |
| `frenzySummonCountMin/Max` | 20 / 20 | 固定 20 个混合单位 |
| `frenzySummonRadius` | 190 | 狂乱生成环半径 |
| `frenzyMinionTypes` | riot、blink、biomass、drone | 全强度混合波次 |
| `frenzyMinionHealthMultiplier` | 1.0 | 狂乱单位生命倍率 |
| `frenzyMinionDamageMultiplier` | 1.0 | 狂乱单位伤害倍率 |
| `exposedDamageMultiplier` | 1.35 | 狂乱期间 Boss 承伤倍率 |
| `exposedDamageCap` | 2.0 | Boss 专属增伤组合上限 |

`enragedSummonMultiplier: 0.6` 保留为 cadence fallback，只在
`frenzyEnabled=false` 时读取。

### 3.3 普通召唤与狂乱召唤

| 路径 | 数量 | 单位 | 强度 | 半径 | 标记 |
|---|---:|---|---|---:|---|
| `summonBossMinions(boss)` | 10 | 感染职员 | 0.6× HP / 0.85× damage | 52 | `isBossMinion=true` |
| `summonBossMinions(boss, { frenzy: true })` | 20 | 随机精英/无人机 | 1.0× HP / 1.0× damage | 190 | `isBossMinion=true` |

狂乱路径委托给 `summonBossFrenzyWave(boss, config)`，复用现有精英和无人机
初始化逻辑。两个生成循环都在循环内部检查敌人上限；接近 230 时允许缩减实际生成数，
不得溢出。

### 3.4 全局敌人复制

配置位于 `BALANCE.enemy.replication`：

| Key | 当前值 | 合同 |
|---|---:|---|
| `enabled` | true | v2 默认开启 |
| `intervalMinMs` | 6000 | 最短复制间隔 |
| `intervalMaxMs` | 9000 | 最长复制间隔 |
| `maxTotalEnemies` | 230 | 活动敌人硬上限 |

数据流：

1. `initializeEnemyFromConfig` 为每个敌人写入随机 `nextReplicateAtMs`；
2. `updateEnemies` 在移动和传送处理后调用 `tryReplicateEnemy`；
3. inactive、dying 和 Boss 本体不复制；
4. 每次尝试先安排下次 deadline，再检查上限，避免达到上限后每帧重试；
5. `cloneEnemyAt` 在来源附近创建同类型普通敌人或精英；
6. clone 获得完整配置生命和自己的下一次复制 deadline；
7. Boss minion 的 clone 继续继承 `isBossMinion=true`。

这是允许多代递归的压力系统，不是只复制一代的视觉效果。

### 3.5 武器交互

| 武器 | Boss 交互 |
|---|---|
| 勤务手枪 | 不强制锁定 Boss；狂乱暴露窗口提供明确输出机会 |
| 收容突破器 | Boss 阶段使用完整射程并优先 Boss；基础 Boss 增伤 1.5× |
| 特斯拉 | Boss 阶段优先 Boss；链击可对 Boss 形成 overload |

狂乱暴露倍率与突破器 1.5× 相乘后受 2.0× 上限约束：

- 普通状态，突破器：1.5×；
- 普通状态，手枪/特斯拉：1.0×；
- 狂乱状态，手枪/特斯拉：1.35×；
- 狂乱状态，突破器：`1.5 × 1.35 = 2.025`，最终 clamp 为 2.0×。

### 3.6 Debug 合同

`src/config/constants.js` 当前明确设置 `DEBUG_MODE=true`，用于保留 `B` 键
Boss 跳转。它属于开发测试决定，不代表正式 release 配置。

`B` 会立即把时间推进至 6:00、清场并生成 Boss。Boss 在玩家上方约 220px 出现，
以 85 速度接近；静止的 100 HP 玩家会被五次 20 点接触伤害击败。因此 Debug smoke
需要立即移动或按 `ESC`，这不是新状态机崩溃。

## 4. 回退合同

### 4.1 仅关闭狂乱

`frenzyEnabled=false` 只产生以下效果：

- Boss 不进入 `frenzy`；
- 不出现 tint、暴露增伤和 20 单位狂乱波次；
- 半血后恢复读取 `enragedSummonMultiplier` 的普通召唤 cadence；
- 普通召唤仍为 10；
- 全局敌人复制仍然开启。

### 4.2 完整压力诊断回退

需要隔离全部 Rev 4 压力时，必须同时设置：

```js
BALANCE.boss.scp049.frenzyEnabled = false;
BALANCE.boss.scp049.summonCountMin = 2;
BALANCE.boss.scp049.summonCountMax = 3;
BALANCE.enemy.replication.enabled = false;
```

这只是一套诊断方法，不是默认产品方向。降低 10/20 波次或关闭复制需要新的平衡决定，
不能再被当作“修正超范围实现”。

## 5. 文件范围与受保护边界

已实现文件：

- `src/config/balance.js`：复制、10/20 波次和狂乱配置；
- `src/config/constants.js`：`DEBUG_MODE=true`；
- `src/scene/combat.js`：暴露增伤与 2.0× cap；
- `src/scene/enemies.js`：复制调度、Boss 状态机和两类波次；
- `src/scene/enemyReplication.js`：普通、精英与生物质子体的递归复制合同；
- `src/scene/bossRules.js`：波次、状态动作与 Boss 增伤纯规则；
- `test/enemy-replication.test.js`、`test/boss-rules.test.js`：递归复制和 Boss 压力合同回归测试。

明确未修改：

- `src/main.js`；
- Preload、asset manifest 和 fallback；
- `AudioManager`、`UIManager` 公共接口；
- `package.json`、lockfile、入口和构建配置；
- localStorage key、schema 和迁移规则；
- 六分钟结构、胜负条件和 restart 语义。

## 6. 验证合同

基础命令：

```powershell
npm run build
git diff --check origin/dev/v2..HEAD
git diff --check
git status --short --branch
```

浏览器 smoke：

| # | 场景 | 通过条件 |
|---|---|---|
| 1 | 连续两局到 6:00 | 每局只生成一个 Boss，无状态/tint 泄漏 |
| 2 | `B` 跳转 | Boss 正确生成，狂乱 cadence 从生成时刻计算 |
| 3 | normal 暂停/恢复 | Boss 与复制 deadline 不推进 |
| 4 | frenzy 暂停/恢复 | 剩余狂乱时长保持，无重复波次 |
| 5 | 手枪完整 Boss 战 | 可击败 Boss，暴露窗口可利用 |
| 6 | 突破器完整 Boss 战 | 叠加增伤最终不超过 2.0× |
| 7 | 特斯拉完整 Boss 战 | Boss overload 与暴露增伤正常 |
| 8 | 胜利 | 只触发一次胜利和学分结算 |
| 9 | 狂乱期间失败 | 正常进入失败结算并清场 |
| 10 | 胜利/失败后 restart | 回到标题，无 Boss/clone 残留 |
| 11 | localStorage | 仍为 `{credits, perks}`，旧数据可读 |
| 12 | 普通召唤 | 请求 10 个弱化感染职员，上限处安全截断 |
| 13 | 狂乱召唤 | 请求 20 个全强度混合单位，半径和标记正确 |
| 14 | 长时间复制压力 | 多代复制不超过 230，帧率和可读性可接受 |
| 15 | 仅关闭狂乱 | 10 单位普通波次和复制仍存在 |
| 16 | 完整诊断回退 | 2–3 普通召唤、无狂乱、无复制 |

## 7. 风险与集成门禁

| 风险 | 等级 | 门禁 |
|---|---|---|
| 递归复制快速达到 230，造成帧率或可读性下降 | 高 | 必须完成长时间压力 smoke；230 是预算上限，不是性能通过证明 |
| 20 个全强度精英/无人机形成不可规避重叠 | 高 | 三把武器分别完成 Boss 战，并验证狂乱环和 2.5 秒暴露窗口可读 |
| 手枪不强制锁定 Boss | 中 | 手枪完整战必须证明暴露窗口可用 |
| 暂停或 restart 泄漏状态 | 高 | normal/frenzy 暂停和连续 restart 必测 |
| `frenzyEnabled=false` 被误解为全回退 | 中 | 审查时同时引用第 4 节完整回退方法 |
| `DEBUG_MODE=true` 进入发布产物 | 中 | 当前保留；正式 release 前单独决定，不把当前构建称为 release-ready |
| 玩法与 UI/Platform 接口冲突 | 低 | 当前未改受保护接口；未来表现需求单独申请 |

## 8. Rev 4 验证记录与下一步

已完成：

- `npm run build`：退出码 0；存在既有 bundle-size warning；
- `node --test`：11/11 通过，覆盖两代生物质子体复制、Boss minion 标记传播、230 单一上限、10/20 波次、190px 半径、状态 deadline、完整回退与 2.0× cap；
- `git diff --check origin/dev/v2..HEAD`：退出码 0；
- worktree `git diff --check`：退出码 0；
- 浏览器验证标题 → 武器选择 → 开始任务 → `B` 跳 Boss；
- Boss 正确生成，HUD 更新；
- Boss 出现后立即 `ESC` 可在 100/100 HP 打开暂停界面；
- 浏览器控制台未观察到 warning/error；
- 静止测试确认五次 20 点接触伤害会导致正常失败结算。
- 项目所有者完成手动试玩并反馈未发现问题；该结论作为定性 gameplay smoke 与体验验收，不代表已经获得 230 敌人场景的量化 FPS 基准。

仍未形成量化或逐项留档、因此不得扩大验证结论：

- 三把武器的完整 Boss 战；
- 实际 10/20 波次数量、混合类型与 190px 环的逐项观察；
- 达到或接近 230 敌人的持续性能测试；
- 狂乱期间胜利/失败；
- 连续两次 restart；
- persistence 和完整诊断回退。

项目所有者已接受当前手动试玩结果，自动化合同测试与独立代码复审也已通过，因此允许
`dev/v2` 进入 push 和 `main` 集成队列。上述未量化项目继续作为已知验证边界保留，不能在后续报告中表述为
“已完成 230 敌人性能基准”或“所有逐项 smoke 均有记录”。
