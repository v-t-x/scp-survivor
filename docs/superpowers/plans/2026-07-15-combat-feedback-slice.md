# 战斗反馈实施计划

> **执行要求：** 按任务使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`；Bug 与回归必须先按 `systematic-debugging` 找根因，再用 TDD 修复。

**目标：** 为玩家和所有敌人增加稳定接触阴影，并用统一、可暂停、可回收的表现控制器提供开火、命中和死亡反馈；玩家面朝自动攻击方向，不显示悬浮枪械，功能性预警始终高于装饰效果。

**架构：** 新建 `src/art/combatFeedback.js`，它只接收已经提交的战斗快照，不决定目标、伤害、穿透、击退或死亡。`main.js` 只负责创建、更新和销毁 controller；`weapons.js`、`combat.js` 和 `enemies.js` 只在业务状态提交后发送通知。正式 contact shadow 走 manifest/fallback，所有高频效果使用有界对象池。

**技术栈：** Phaser 3.90、JavaScript ES Modules、Arcade Physics、Node `node:test`、Vite、精细像素 PNG。

## 全局约束

- 在设施、HUD 和终端覆盖层计划之后执行。
- 只在 `C:\scp-survivor-ui-art` 的 `feature/ui-art-overhaul` 工作。
- 保留 `.superpowers/`，永不暂存。
- 不修改目标选择、攻击间隔、弹丸数量/速度/范围、伤害、穿透、击退、AI、碰撞体、刷怪和胜负条件。
- 玩家移动不改变面朝；只有已提交的自动攻击更新 `playerFacingAngle`。
- 新增 `playerMovementFallbackAngle` 只保存最后移动方向并继续服务无输入闪避；攻击朝向绝不改变 dash 回退方向。
- 不重新引入肩部武器、悬浮枪或跟随延迟装具。
- production texture、fallback texture 和缺失 texture 三条路径的物理状态必须等价。
- 预警状态、持续时间和命中范围不变；只调整视觉层级。
- 计划涉及共享 `src/main.js` 和战斗 mixin，实施前须以本计划的最小接线为边界，不做额外重构。
- 未经明确授权不得 merge 或 push。

---

## 任务 1：建立 contact shadow 素材和控制器合同

**文件：**
- 修改：`src/assets/manifest.js`
- 修改：`src/assets/fallbackTextureFactory.js`
- 新建：`public/assets/art/effects/contact-shadow.png`
- 修改：`docs/art/asset-register.md`
- 新建：`src/art/combatFeedback.js`
- 新建：`test/combat-feedback.test.js`
- 修改：`test/art-assets.test.js`

- [ ] **步骤 1：先写失败的 API、资产和回滚测试**

冻结接口：

~~~js
createCombatFeedbackController(scene, options = {}) -> {
  trackActor(actor, { kind, radius, offsetY }),
  untrackActor(actor),
  notifyAttack({ weaponId, originX, originY, angle, shotCount, heavy }) -> true,
  notifyHit({ x, y, impactX, impactY, enemyType, eliteType, isBoss, damage, lethal }),
  notifyDeath({ x, y, enemyType, eliteType, isBoss, color }),
  update(nowMs), setPaused(paused), destroy()
}

createNoopCombatFeedbackController() -> 同形状 API；`notifyAttack()` 返回 false，其余方法无副作用
~~~

测试要求：

- `trackActor` 幂等，shadow 不进入物理组且不改变 actor body/scale/origin/depth；
- 对象池分别有上限，池满时复用最旧的非活动对象，不无限创建；
- `setPaused(true)` 只暂停 controller 自己的 tween/timer；
- `destroy()` 幂等，移除 shadows、池对象、tween 和 timer；
- 构造或首次分配中途失败时回滚已创建对象；
- 素材为 32×16 透明 PNG，硬边、灰黑、无径向模糊，manifest/fallback key 一致。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/combat-feedback.test.js test/art-assets.test.js
~~~

- [ ] **步骤 3：生成并登记 contact shadow**

使用 imagegen skill 生成俯视精细像素椭圆接触阴影：32×16、二值透明、中心最深、边缘用离散像素阶梯衰减、无物体、无光晕、非 3D。用设施计划已提交的 `scripts/art/normalize_pixel_asset.py --width 32 --height 16 --fit contain --alpha binary --colors 16` 确定性处理，运行 `scripts/art/test_pixel_tools.py` 后写入 `public/assets/art/effects/contact-shadow.png`。登记实际 Tool/model、日期、精确 prompt/source、原始输出路径与 SHA-256、完整处理流程、License/right basis、Commercial-use status、Admission、最终尺寸和署名要求；被拒绝/中断候选也保留尝试记录，并按真实表格行数更新登记表开头总数摘要。

- [ ] **步骤 4：实现纯表现 controller**

内部使用 `Map<actor, shadowRecord>`；每次 `update` 先清理 inactive actor，再把阴影放在 actor 脚下并以 radius 计算 display size。命中、死亡和开火使用三个独立有界池；snapshot 数据在入口复制，后续不读取可变 gameplay object。导出 safe factory：真实 controller 构造失败时先完成事务回滚并返回 no-op controller，而不是把错误传播到 Scene.create。

- [ ] **步骤 5：验证并提交**

~~~powershell
node --test test/combat-feedback.test.js test/art-assets.test.js
npm run build
git diff --check
git add -- src/art/combatFeedback.js src/assets/manifest.js src/assets/fallbackTextureFactory.js public/assets/art/effects/contact-shadow.png docs/art/asset-register.md test/combat-feedback.test.js test/art-assets.test.js
git commit -m "feat(art): add pooled combat feedback controller"
~~~

---

## 任务 2：接入角色阴影和攻击面朝

**文件：**
- 修改：`src/main.js`
- 修改：`src/scene/world.js`
- 修改：`src/scene/enemies.js`
- 修改：`src/scene/systems.js`
- 修改：`src/scene/weapons.js`
- 修改：`src/art/characterPresentation.js`
- 新建：`test/combat-feedback-lifecycle.test.js`
- 新建：`test/attack-facing.test.js`
- 修改：`test/character-presentation.test.js`
- 修改：`test/presentation-rules.test.js`
- 修改：`test/enemy-presentation.test.js`

- [ ] **步骤 1：先冻结物理等价和面朝语义**

写测试证明：

- `handlePlayerMovement()` 仍设置速度和 dash 行为，但任何 WASD 输入都不写 `playerFacingAngle`；
- `handlePlayerMovement()` 有移动输入时写 `playerMovementFallbackAngle`，`tryStartDash()` 无输入时读取该字段；攻击只写 `playerFacingAngle`。两者不同时，无输入 dash 必须与实施前的最后移动方向一致；
- `syncCharacterPresentation()` 对 player 用 `playerFacingAngle` 选择方向行，用 body velocity 只选择 idle/move 动画；WASD 速度变化不得改变 facing，攻击角变化必须改变 facing；enemy presentation 合同不变；
- 自动攻击在目标和真实攻击提交后，才把代表性已提交方向写入 `playerFacingAngle`；
- 手枪和突破器给每个成功创建的 bullet 记录只读 `presentationAngle = finalAngle`，并选择与 `baseAngle` 角距离最小的真实弹丸方向；Tesla 使用从玩家到第一个实际命中目标的方向。无合法目标或没有成功提交攻击时面朝保持不变；
- player、普通敌人、精英、Boss、biomass child 创建后各 track 一次，销毁/清组后不残留阴影；
- 添加阴影前后 body 的 size、offset、circle radius、velocity 和 collision category 不变。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/attack-facing.test.js test/combat-feedback-lifecycle.test.js test/presentation-rules.test.js test/enemy-presentation.test.js
~~~

- [ ] **步骤 3：最小接入 controller 生命周期**

在 `PrototypeScene.create()` 通过 safe factory 创建 `this.combatFeedback`，因此字段始终是有效真实或 no-op controller；在角色创建成功并完成表现/碰撞设置后调用 `trackActor`；在 `update` 的表现阶段调用 `update(this.elapsedSurvivalMs)`；在 `teardownManagers()` 或同等幂等 teardown 中销毁并清空引用。

`src/main.js` 的改动仅限上述生命周期接线。不得把 controller 放进 `transientEffects`，避免被 `clearTransientEffects()` 误销毁。

- [ ] **步骤 4：把面朝更新移动到攻击提交点**

把 `handlePlayerMovement` 的原 `playerFacingAngle` 写入改名为 `playerMovementFallbackAngle`，并把 `tryStartDash()` 无输入 fallback 改读该字段，保持闪避玩法不变。`spawnPlayerProjectile()` 在完成 velocity 设置后把真实 `finalAngle` 写入返回 bullet 的 `presentationAngle`。手枪/突破器收集成功返回的 bullet，用纯 helper 选出与 `baseAngle` 最接近的 `presentationAngle`；Tesla 在首段 lightning 和首个 damage 调用均完成后计算首目标角。随后才写入显示字段：

~~~js
this.playerFacingAngle = committedPresentationAngle;
~~~

`main.js` 初始化 `playerMovementFallbackAngle` 为当前旧默认方向；dash 有输入时仍使用 dash 输入方向，无输入时使用最后移动方向，两条路径都不回写显示朝向。测试显式设置“最后移动向上、攻击向右”，断言角色向右但无输入 dash 仍向上。

- [ ] **步骤 5：验证并提交**

~~~powershell
node --test test/attack-facing.test.js test/combat-feedback-lifecycle.test.js test/presentation-rules.test.js test/character-presentation.test.js test/enemy-presentation.test.js test/enemy-replication.test.js test/biomass-collision-compatibility.test.js
npm run build
git diff --check
git add -- src/main.js src/art/characterPresentation.js src/scene/world.js src/scene/enemies.js src/scene/systems.js src/scene/weapons.js test/combat-feedback-lifecycle.test.js test/attack-facing.test.js test/character-presentation.test.js test/presentation-rules.test.js test/enemy-presentation.test.js
git commit -m "feat(art): align actor presentation with attacks"
~~~

---

## 任务 3：在攻击提交后发送开火通知

**文件：**
- 修改：`src/scene/weapons.js`
- 修改：`src/scene/effects.js`
- 新建：`test/attack-feedback-notification.test.js`

- [ ] **步骤 1：用计数测试冻结通知位置**

分别覆盖手枪、突破器、Tesla 与质变路径。对每次真实发射断言：玩法弹丸/链击/场效果先产生，随后恰好一次 `notifyAttack`；冷却、无目标、暂停、游戏结束和创建失败路径通知 0 次。多弹丸 snapshot 的 angle 必须等于上述选出的真实代表弹丸方向，Tesla 等于首个实际目标方向。snapshot 必须是：

~~~js
{ weaponId, originX, originY, angle, shotCount, heavy }
~~~

`shotCount` 反映已经成功创建的攻击实例，不反向控制 projectileCount。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/attack-feedback-notification.test.js
~~~

- [ ] **步骤 3：添加容错通知**

新增 `emitAttackPresentation(snapshot, fallbackDirection)`，只能在每条攻击路径业务提交之后调用：

~~~js
try {
  if (this.combatFeedback) {
    if (this.combatFeedback.notifyAttack(snapshot) === true) return;
  }
} catch {
  // 落入旧表现 fallback。
}
this.spawnMuzzleFlash(fallbackDirection);
~~~

把手枪/突破器原有提交前 `spawnMuzzleFlash()` 调用移入该 fallback，确保真实 controller 返回 true 时只生成一套枪口表现，no-op 返回 false、controller 缺失或抛错时仍保留旧效果；Tesla 的现有 lightning segment 继续是玩法可读表现，不重复创建第二套链路。新开火表现仅包括短暂 muzzle pixel、方向性 impulse line 或 Tesla arc accent；不创建枪械 sprite。测试对真实、no-op、缺失和抛错四路分别断言视觉调用数，同时证明弹丸、弹药和伤害结果一致。

- [ ] **步骤 4：验证并提交**

~~~powershell
node --test test/attack-feedback-notification.test.js test/combat-feedback.test.js
npm run build
git diff --check
git add -- src/scene/weapons.js src/scene/effects.js test/attack-feedback-notification.test.js
git commit -m "feat(art): add post commit attack feedback"
~~~

---

## 任务 4：接入材质化命中、死亡反馈与预警层级

**文件：**
- 修改：`src/scene/combat.js`
- 修改：`src/scene/enemies.js`
- 修改：`src/scene/effects.js`
- 新建：`test/hit-feedback-notification.test.js`
- 新建：`test/warning-visibility.test.js`

- [ ] **步骤 1：先写命中/死亡通知测试**

普通命中每次发送一次 `notifyHit(lethal:false)`；致死命中先提交 health/死亡/奖励，再发送 `notifyHit(lethal:true)` 和一次 `notifyDeath`。穿透、爆炸、Tesla 链、Boss、biomass 分裂和重复 overlap 分别断言通知次数，不允许表现回调改变伤害或重复死亡。

材质语义只由已知类型映射：生物质为暗红/紫的短碎屑，金属/甲壳为冷白火星，空间异常为青紫断帧块，Boss 为克制的复合效果。

- [ ] **步骤 2：冻结功能性预警优先级**

测试 riot line、blink target、危险圈等 warning depth 高于 controller 所有装饰池；状态机、持续时间、几何尺寸和位置不变。用常量导出层级，避免散落魔法数字：

~~~js
COMBAT_PRESENTATION_DEPTH = {
  decorationMin: 16,
  decorationMax: 26,
  warning: 30
}
~~~

shadow 不使用固定 depth：每次 track/update 取 `actor.depth - 1`，因此玩家 depth 6 得到 5，普通敌人默认 depth 0 得到 -1，精英 depth 10 得到 9，Boss depth 12 得到 11；不得为配合阴影而改变 actor depth。审计并迁移现有 impact、blast、damage text、particle、lightning、muzzle、blink 等所有战斗表现，确保装饰不超过 26；功能预警统一为 30，仍低于 HUD 45 和 overlay 50+。

- [ ] **步骤 3：运行 RED**

~~~powershell
node --test test/hit-feedback-notification.test.js test/warning-visibility.test.js
~~~

- [ ] **步骤 4：在状态提交后发送 snapshot，并提升预警视觉层**

通知失败全部吞并在表现边界内；不要 catch 玩法逻辑本身。旧 `spawnDamageNumber` 等兼容入口可委托 controller 或保留，但同一次事件不能双重生成视觉。

- [ ] **步骤 5：验证并提交**

~~~powershell
node --test test/hit-feedback-notification.test.js test/warning-visibility.test.js test/combat-feedback.test.js test/boss-rules.test.js test/biomass-collision-compatibility.test.js
npm run build
git diff --check
git add -- src/scene/combat.js src/scene/enemies.js src/scene/effects.js test/hit-feedback-notification.test.js test/warning-visibility.test.js
git commit -m "feat(art): add readable hit and death feedback"
~~~

---

## 任务 5：暂停、清场、重启和 fallback 等价验证

**文件：**
- 修改：`src/main.js`
- 修改：`src/scene/systems.js`
- 修改：`test/combat-feedback-lifecycle.test.js`
- 新建：`test/combat-presentation-equivalence.test.js`

- [ ] **步骤 1：写三路径等价与循环测试**

对 production、fallback、纹理缺失三种情况运行同一模拟，比较 actor body 与伤害结果；连续 3 次暂停/恢复、清场、失败重启和胜利重启后，controller、shadow、pool、timer、tween 和事件监听器数量回到基线。

- [ ] **步骤 2：运行 RED**

~~~powershell
node --test test/combat-feedback-lifecycle.test.js test/combat-presentation-equivalence.test.js
~~~

- [ ] **步骤 3：补齐幂等暂停与 teardown**

`pauseGameplaySystems`/`resumeGameplaySystems` 只转发 controller 的暂停状态；`clearCombatEntities` 后清理失效 actor；Scene shutdown 先停止 controller 自有 tween/timer 再销毁对象。保持所有旧 manager teardown 行为。

- [ ] **步骤 4：阶段全量验证并提交**

~~~powershell
node --test
npm run build
git diff --check
git status --short --branch
git add -- src/main.js src/scene/systems.js test/combat-feedback-lifecycle.test.js test/combat-presentation-equivalence.test.js
git commit -m "fix(art): harden combat feedback lifecycle"
~~~

## 阶段验收

- 代码审查重点：post-commit 边界、效果计数、对象池上限、物理等价、重复死亡和 Scene restart。
- 视觉审查重点：左右/上下转向尺寸稳定、面朝攻击目标、无悬浮枪、密集战斗仍能看清功能性预警。
- 最终手动战斗 smoke 由用户执行；Agent 只准备稳定链接和测试清单。
