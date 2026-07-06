# SCP 幸存者 — 改进方案 2

> 基于对 `src/main.js`（4418 行）与设计文档的逐行通读得到的分析。
> 每条建议均标注对应代码位置，可直接定位。
> 最后更新：2026-07-03

---

## 总体评价

这是个完成度相当高的幸存者-like 原型：时间轴分阶段、双层难度、3 武器差异化、精英 AI（冲锋/闪现/分裂）、boss 阶段、感知干扰系统都做出来了，而且做了 boss 战武器公平性调参。**核心循环是完整可玩的**。

问题主要集中在三块：

1. **空间/手感偏薄**
2. **重玩性不足**
3. **一些性能与遗留代码隐患**

---

## 一、必须先修的 Bug / 隐患（几分钟见效）

| # | 问题 | 位置 |
|---|------|------|
| 1 | **`B` 键跳过到 Boss 在正式游戏里始终生效**。玩家误触就直接跳关，破坏体验。应受 `DEBUG_MODE` 保护。 | `setupInputHandlers` line 680-682 |
| 2 | **调试 `console.log` 遗留**（"Created pistol card"等），每次进游戏刷控制台。 | line 1012-1017 |
| 3 | **`DEBUG_MODE` 常量定义了但从未使用**（line 3）。应该用它来门控 `B` 键和日志。 | line 3 |
| 4 | **两套时钟不一致**：玩家无敌帧用 `this.time.now`（line 3566-3571），而全局逻辑用累加的 `elapsedSurvivalMs`。升级暂停时 `physics.pause()` 但 `time.now` 继续走，无敌时间会在暂停期间流失。建议统一到 `elapsedSurvivalMs`。 | `applyPlayerDamage` |

修法示例（第 1、3 条）：

```js
if (DEBUG_MODE) {
  this.input.keyboard.on("keydown-B", () => this.skipToBossPhase());
}
```

---

## 二、手感与空间（最影响"好不好玩"）

**5. 战场太小、没有 kiting 空间** — 地图固定 960×540 单屏，敌人从四边刷（`getSpawnPositionAtEdge`），无摄像机跟随、无滚动地图。后期 230 个敌人四面涌入，玩家几乎无处走位，容易被"包死"，而幸存者-like 的乐趣核心正是**放风筝走位**。

- 建议：把世界放大到 ~2000×2000，加 `this.cameras.main.startFollow(this.player)`，敌人在**相机视野外**刷新。这一步能显著提升手感，改动集中在 `physics.world.setBounds`、`createPlayer`、`getSpawnPositionAtEdge`。

**6. 敌人之间无碰撞，会完全重叠成一个点** — `createColliders` 只注册了玩家/子弹/敌人的 overlap，没有 `enemies` 组的自碰撞。所有敌人直冲玩家会叠成一坨，既难看又让"数量压力"失真。

- 建议：加 `this.physics.add.collider(this.enemies, this.enemies)`（注意性能，见第三节），或做轻量的相互排斥推挤。

**7. 走位手段单一** — 只有 8 向移动，无冲刺/闪避。配合封闭小图，被围时毫无解法。

- 建议：加一个带冷却的闪避（空格），哪怕只是短暂位移 + 无敌帧，就能大幅提升操作上限。

**8. 经验拾取没有磁吸反馈** — `handleExperienceCollection`（line 2911）是"进半径瞬间消失"，缺少宝石飞向玩家的吸附动画，正反馈很弱。

- 建议：进范围后用 tween 让宝石加速飞向玩家再结算，拾取瞬间给个音效+微光。

---

## 三、性能（敌人一多就会卡）

**9. `findNearestEnemy` 是 O(n) 全量扫描**（line 3159），而特斯拉每次攻击要链式调用 `chainTargets` 次（最多 8 次），手枪每次攻击调 1 次。230 敌人 × 多次/帧 → 明显开销。

- 建议：引入简单的空间网格（grid bucketing），或用 Phaser 的 `physics.closest`。

**10. `getTimelinePhase()` / `getDifficultyDirectorState()` 每帧被重算多次** — `updateEnemies` 里**每个敌人**都调用 `getTimelinePhase().effects.teleport` 和 `getEnemyInstabilitySpeedMultiplier()`（后者内部又调一次 `getTimelinePhase`）。230 敌人 = 每帧数百次线性扫描 phases 数组。

- 建议：每帧开头算一次 `this.currentPhase` 缓存起来，循环内复用。

**11. 特效/伤害数字/子弹全程 `create`+`destroy`，无对象池** — `spawnFloatingDamage`、`spawnDeathParticles`、`spawnImpactEffect`、`spawnLightningSegment` 每次 new 一个对象、tween 完再 destroy。高频战斗下 GC 抖动明显。

- 建议：对伤害数字、子弹、宝石、粒子做对象池（Phaser Group 的 `get()/killAndHide()` 复用）。

---

## 四、玩法深度与重玩性（决定"玩几局就腻"）

**12. 升级池太浅、后期被通用项灌水** — 13 项里手枪只有 2 个专属（`projectileCount`/`penetration`），一旦点满，三选一基本只剩 +20%伤害、+15%攻速这类**纯数值**。缺少质变型 build。

- 建议：加"质变"升级，例如手枪的弹跳/回旋弹、特斯拉的常驻电场、突破器的爆炸弹。让不同 build 有明显玩法差异，而非数值堆叠。

**13. 三选一没有 reroll / skip / 锁定** — 现代幸存者-like 的标配。当前若三个都不想要只能硬选。

- 建议：加 reroll（有限次）和 skip（跳过给少量补偿），成本很低、体验提升大。

**14. 内容单薄导致一次通关就见底** — 1 图 + 6 分钟固定 + 1 boss，胜利后只能 `scene.restart`（line 4134），无任何元进度或解锁。

- 建议（按投入排序）：
  - 短期：加**难度档位/循环模式**（通关后开更高难度），复用现有系统几乎零成本。
  - 中期：元进度（局间永久解锁武器/被动），文档第 12 节已列为未来项，是提升留存最有效的一步。
  - 长期：第二 boss / 多阶段终局。

**15. 无暂停功能** — 只有升级时暂停，玩到一半没法停。加个 ESC 暂停菜单。

**16. 武器强度靠 hack 补偿** — boss 战里突破器 ×1.5、特斯拉"全链打 boss"（line 2617-2648）是硬编码补丁，说明基础 DPS 模型本身在单体场景失衡。

- 建议：长期看应让每把武器有**通用的对单/对群定位**，而不是给 boss 开特例。可参考 `scripts/balance-sim.mjs` 把三武器的理论 DPS 拉平后再微调。

---

## 五、平衡观察

- **敌人成长曲线偏平**：血量上限只有 +35%（`healthRampSeconds:360`）、伤害 +22%，6 分钟内单个敌人几乎不变强，难度全靠 spawn 密度堆。容易出现"前 3 分钟无聊、后 2 分钟突然爆炸"。建议让个体成长更明显，密度更平滑。
- **手枪射程 640 近乎全屏 + 自动瞄准最近敌人** → 手枪流几乎无脑站桩；突破器 `triggerRange 180` 要贴脸，风险收益差距过大。可缩手枪射程、或给远程武器加"需要面朝"的限制来拉开策略差异。

---

## 六、代码结构（长期可维护性）

- **单文件 4418 行、单 Scene 承担一切**。武器选择、战斗、结算都塞在 `PrototypeScene` 里。建议拆成 `BootScene` / `WeaponSelectScene` / `GameScene` / `ResultScene`，并把 `UPGRADE_DEFINITIONS`、`BALANCE`、武器逻辑、敌人 AI 拆到独立模块。
- **UI 代码大量重复的 inline `fontFamily` 字符串**。抽成 `TEXT_STYLE` 常量或 `makeLabel()` helper，能砍掉几百行。
- 好的地方：`BALANCE` 集中配置、`registerTransientEffect` 统一清理临时对象、时间轴数据驱动——这些设计值得保留。

---

## 建议的执行顺序

**第 1 批（半天，立竿见影）**：修 §一 全部 4 个 bug + §四.13（reroll/skip）+ §二.8（磁吸）。风险低、体感提升明显。

**第 2 批（1-2 天，改玩法骨架）**：§二.5 摄像机跟随大地图 + §二.6 敌人碰撞 + §二.7 闪避。这三条一起做，游戏"手感"会脱胎换骨。

**第 3 批（性能，配合第 2 批）**：§三 全部——放大地图和加敌人碰撞后，性能问题会更突出，必须同步做缓存+对象池。✅ 已完成（2026-07-03）
  - §9 `findNearestEnemy` 有限半径查询改用每帧构建的空间网格（`ENEMY_GRID_CELL_SIZE`），无限半径仍走全量扫描。
  - §10 `getTimelinePhase()` 按 `elapsedSurvivalMs` 每帧缓存；`updateEnemies` 把不稳定速度倍率与传送开关提到循环外只算一次。
  - §11 伤害数字 / 冲击圈 / 死亡粒子 / 闪电线段改为对象池复用（`releaseToPool`），消除高频 create/destroy 的 GC 抖动。

**第 4 批（长期，提留存）**：§四.12 质变升级池 + §四.14 元进度 + §六 代码拆分。
  - §四.12 质变升级 ✅ 已完成（2026-07-03）：每把武器各加一个一次性「质变」项——手枪**回旋弹**（子弹到射程后折返再命中）、突破器**爆炸弹**（命中引发 AoE，走空间网格）、特斯拉**常驻电场**（玩家周身周期性电击）。质变项在三选一池中醒目标注、可 reroll、每种仅一次。
  - §四.14 元进度 ✅ 已完成（2026-07-03）：localStorage 存学分/解锁（异常降级为内存不崩），结算按击杀+存活+胜利发学分，武器选择界面加「解锁商店」可买 4 个永久起始加成（生命/移速/伤害/拾取），下一局生效。
  - §六 代码拆分 ⏸ 未做（本批按需求跳过）。
