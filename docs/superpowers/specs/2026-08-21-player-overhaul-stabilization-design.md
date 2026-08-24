# Player Overhaul 稳定化设计

**状态：** 2026-08-21 项目所有者已在对话中确认“开始”。本文件只约束当前稳定化交付，不授权 push、PR、merge、发布、Phase 3 或 Phase 4。

## 1. 目标

把 `feature/player-combat-presentation-overhaul@2ae0385` 上混合的本地 WIP 收敛为可复核、可回退的 Phase 1/2 两武器版本：保留 display-only 玩家身体与装备、落地移动表现、战斗反馈和已授权的 Tesla 持续通道；修复武器切换不同步；让素材登记、生产加载和构建边界一致。

## 2. 当前裁决

1. 普通流程保留两种可选装备：内部 `pistol` 对应基金会收容突击步枪，`tesla` 对应 Tesla 收容发射器。
2. `shotgun` 的配置、攻击和升级定义继续保留为内部兼容逻辑，但普通选择、HUD 详情和升级候选不暴露它。
3. 游戏开始和未选择正式装备时显示完整 legacy player；选择允许的武器后才原子激活 body + 完整装备 rig。
4. `selectedWeaponId` 在 `pistol` 与 `tesla` 间变化时，必须原子销毁旧 rig 并用同一只读快照构建新 rig。新 rig 失败时只留下完整 legacy player；同一失败 ID 不循环分配，切换到其他 ID 后可以重新尝试。
5. gameplay anchor、24×24 Arcade Body、camera follow target、移动、拾取、受伤、目标搜索和存档语义保持不变。
6. 真实弹丸、穿透、回旋弹、Tesla 范围和伤害继续从玩家中心计算。action point 只用于枪口、视觉弹道代理和 Tesla 第一段电弧。
7. Tesla 合同固定为每跳 6、300ms、320 range、0.8 链击衰减；Boss 抢占、持久锁定和无补偿连跳保持。`nextAttackAtMs` 必须先于可能抛错的音效或表现回调提交。

## 3. 表现架构

数据流保持为：

```text
gameplay player anchor
  -> movement update
  -> frozen primitive presentation snapshot
  -> display-only PlayerPresentationController
  -> body/equipment sprites and combat VFX
  -> weapons update using gameplay-center mechanics
```

表现层不得写回位置、速度、碰撞体、伤害、目标、冷却、升级或存档。任何表现异常必须 fail closed：先恢复完整 legacy，再决定是否继续表现；不能留下裸 body、空气手臂、双武器、孤立背包或旧 tween/timer。

## 4. 生产素材边界

生产运行时必需集合：

- legacy：`player-opening-sheet.png`、`player.png`；
- formal body：`player-response-operative-body.png`；
- rifle：四张 `foundation-containment-rifle-aim*.png` 和 rifle icon；
- Tesla：四张 `tesla-containment-emitter-aim*.png`、`tesla-containment-power-module.png` 和 Tesla icon。

body prototype、breacher/cbrn sample、两张 core、四张 connector、八张 same/cross 都保留源文件和审计来源，但不是最小 production runtime 输入，也不得进入最终 production bundle。旧 UI/Art Gate 3 `player-response-operative.png` 保持在原 worktree，不复制、不删除、不加载。

`docs/art/asset-register.md` 必须登记当前实际字节的 SHA-256、builder/source、尺寸、准入状态和商业复核状态；八张 aim/recoil 表必须逐项登记。Tesla power module 是正式 Tesla rig 依赖，不能再写成 rollback-only。

## 5. 开发入口与 fallback

开发预览只能由 `import.meta.env.DEV` 路径加载。production build 必须剔除所有 prototype/sample 与历史非运行时 equipment 文件。资源缺失、frameTotal 错误、sprite 分配失败、render/pause/alpha/hit 失败都必须回退到完整 legacy player，不通过物理删除 `public` 源文件验证。

## 6. 验证与完成标准

1. 武器切换测试必须真实复现旧 rig 不重建的 RED，再验证 pistol→Tesla→pistol；缺资源切换必须完整回退且无重复分配。
2. 保留 presentation equivalence：改变 action point 只能改变视觉，不得改变 projectile、range、target order、damage、cooldown、ammo 或返回值。
3. 三组 Python 素材测试、Player/weapon/fallback/Tesla 聚焦测试、Node 全量、production build、bundle 边界和 `git diff --check` 全部重新执行。
4. 普通 URL 在 960×540 下分别验证 rifle/Tesla 的移动、瞄准、攻击、暂停、受击、restart 和 fallback；开发预览不能代替普通路径。
5. 自动化和 HTTP 200 不等于用户视觉接受。最终实机图必须单独报告，未获得用户确认时标为“技术验证完成、视觉 Gate 待确认”。

## 7. 明确排除

- Phase 3 真实枪口/伤害起点迁移；
- Phase 4 异常光刃；
- 新武器、新素材生成、120 帧或四方向扩产；
- `PlayerController`、`WeaponBase`、Phaser Container 或 gameplay Scene 重写；
- 旧 UI/Art Gate 3 的修改、清理或默认切换；
- push、PR、merge、tag、Release、部署。
