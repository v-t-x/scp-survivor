# 精英怪常驻标识精简设计

## 1. 目标

移除所有非 Boss 精英怪周围的黄色常驻轮廓和“精英”文字，使 R-17 敌人本体轮廓与材质成为主要识别依据，同时保留会影响玩家判断的功能性战斗提示。

本改动属于 Level 0 局部表现修正，不改变伤害、减伤、AI、状态机、碰撞体、刷怪、胜负、时间轴或存档语义。

## 2. 当前原因

`attachEliteVisuals()` 会为每个精英创建两层通用装饰：

- `eliteMarker`：跟随敌人的“精英”文字；
- `eliteOutline`：每帧重绘的黄色矩形或圆形轮廓。

`updateEliteVisuals()` 当前以 `eliteOutline` 是否存在作为整个函数的提前返回条件，因此不能只删除或隐藏黄圈；否则甲壳门的 `shieldIndicator` 装甲弧也不会继续更新。

## 3. 采用方案

彻底删除通用常驻装饰对象，而不是把它们设为透明：

- `attachEliteVisuals()` 不再创建或注册 `eliteMarker`、`eliteOutline`；
- Riot / 甲壳门仍创建 `shieldIndicator`；
- 销毁清理不再访问已删除的 marker/outline，只清理装甲弧和既有临时警告；
- `updateEliteVisuals()` 不再依赖 `eliteOutline`，仅在 `shieldIndicator` 存在时更新装甲弧；
- 精英 sprite 本体仍保持方向中立，不新增常驻文字、图标、描边、缩放、翻转或旋转。

不采用“仅设透明”，因为它仍保留无意义对象、每帧更新和生命周期负担；不采用新的类型图标，因为当前目标是减少遮挡，而非用另一套常驻符号替换旧符号。

## 4. 必须保留的功能提示

以下提示不属于要删除的常驻装饰：

- 甲壳门读取既有 `frontArcDegrees` / `facingAngle` 绘制的正面装甲弧；
- 甲壳门冲锋预警线；
- 缺帧体瞬移目标圈与十字；
- 既有受击、死亡、危险状态和 Boss 表现。

这些提示继续只读取既有玩法状态，不反向写入伤害倍率、朝向、AI 或计时器。

## 5. 测试与验收

先写 RED 测试，再实施最小修改：

- Riot 创建时只产生装甲弧 Graphics，不创建文字或黄色轮廓；
- Blink 与 Biomass 不创建任何常驻 elite marker/outline；
- `updateEliteVisuals()` 在没有 `eliteOutline` 时仍能精确更新甲壳门装甲弧；
- 销毁路径只清理真实存在的对象，不泄漏、不重复销毁；
- 冲锋和瞬移临时警告的创建、更新与清理保持原样；
- 源码合同禁止重新引入“精英”文字、黄色 `0xfff08e` 常驻轮廓或主体 sprite 旋转；
- focused tests、全量 `node --test`、`npm run build`、`git diff --check` 与独立审查全部通过。

自动验证通过后继续使用固定地址 `http://localhost:64126/` 交由项目所有者人工确认。

## 6. 非目标

- 不修改七种 R-17 spritesheet；
- 不重做精英 AI、数值、碰撞体或装甲机制；
- 不删除临时危险预警；
- 不修改 Boss 名称或 Boss HUD；
- 不新增另一套常驻头衔、稀有度边框或小地图标记。
