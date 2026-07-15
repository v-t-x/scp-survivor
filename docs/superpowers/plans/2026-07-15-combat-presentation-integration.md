# 战斗表现纵切集成与验收计划

> **执行要求：** 仅在四个子系统计划全部完成且各自验证通过后执行；使用 `superpowers:requesting-code-review` 和 `superpowers:verification-before-completion`，不得用旧测试结果代替最终新鲜证据。

**目标：** 把设施环境、战术 HUD、终端覆盖层和战斗反馈作为一个完整纵切进行集成审查、回归修复、素材审计和用户手动 smoke 交付，确认它看起来像同一款完成度更高的 SCP 游戏，同时不改变玩法语义。

**依赖顺序：**

1. `2026-07-15-facility-environment-slice.md`
2. `2026-07-15-tactical-hud-slice.md`
3. `2026-07-15-terminal-overlay-slice.md`
4. `2026-07-15-combat-feedback-slice.md`
5. 本计划

同一阶段内只有真正不修改相同文件的任务才可并行；`manifest.js`、`fallbackTextureFactory.js`、`hud.js`、`menus.js`、`main.js` 和素材登记的修改必须串行整合。

## 不可突破的验收边界

- 不改变伤害、刷怪、AI、升级概率、胜负、六分钟时间轴和存档语义。
- 不拆 Scene、不重构 manager 公共接口、不改 Phaser/Vite 技术栈。
- 不清理 `.superpowers/`，不暂存无关文件。
- 不以 build 成功代替运行时、视觉和玩法验证。
- 不在未确认端口归属时终止任何进程。
- 用户负责最终浏览器手动试玩；Agent 负责自动验证、审查、修复和稳定 smoke 服务。
- 未经明确授权不得 merge、push、删除分支/worktree 或重写历史。

---

## 任务 1：做纵切合同审计

**文件：**
- 检查：四份子系统计划涉及的全部源码、测试、PNG 和文档
- 新建：`test/combat-presentation-integration.test.js`

- [ ] **步骤 1：写跨系统失败测试**

至少覆盖：

- manifest 的新 key 全部有正式文件、fallback 和唯一路径；
- facility center-safe 区域不被新装饰侵入；
- HUD 五个固定 region 彼此不重叠，system controls 点击区不受 timeline corruption 位移；overlay 的内容和按钮保持在 viewport 内，打开时全屏 backdrop 阻断或显式禁用底层 HUD 热区；
- overlay 打开时对应玩法暂停/可见性合同保持原值；
- combat warning depth 高于 decoration，阴影低于 actor；
- Scene shutdown 后 facility/HUD/overlay/combat controller 全部销毁；
- 三条 restart 路径（返回标题、失败重启、胜利重启）不会重复注册监听器；
- 所有 presentation optional chaining/fallback 路径缺失时，核心循环仍可运行。

- [ ] **步骤 2：运行 RED 或确认现有实现满足测试**

~~~powershell
node --test test/combat-presentation-integration.test.js
~~~

若首次即通过，人工注入一个局部测试突变，确认测试确实会失败，再撤销该突变；不得提交测试突变。

- [ ] **步骤 3：只修复集成断点**

每个失败先定位到唯一子系统。若修复会改变已批准架构或玩法语义，停止实施并上报；否则把失败断言加入对应子系统测试，在对应子系统计划列出的精确源码范围内最小修复，并把源码与测试放在同一个修复 commit。禁止只提交集成测试而遗留源码，也禁止借集成任务进行顺手重构。

- [ ] **步骤 4：提交集成合同**

~~~powershell
node --test test/combat-presentation-integration.test.js
git diff --check
git status --short
git add -- test/combat-presentation-integration.test.js
git commit -m "test(art): lock combat presentation integration"
~~~

只有 `git status --short` 证明没有未暂存源码修复时才执行上述测试-only commit；否则先按步骤 3 完成相应源码+回归测试 commit。

---

## 任务 2：素材与视觉系统审查

**文件：**
- 检查：`public/assets/art/facility/`
- 检查：`public/assets/art/upgrades/`
- 检查：`public/assets/art/effects/`
- 检查：`public/assets/art/ui/`
- 检查：`docs/art/asset-register.md`
- 必要时修改：对应素材和登记

- [ ] **步骤 1：生成审查 contact sheet**

在 `.superpowers/sdd/combat-presentation-review/` 生成但不暂存：

- 所有新增设施模块，1× 和 4× nearest；
- 16 个升级图标与 3 个终端表面/印章素材，1× 和 8× nearest；
- contact shadow 叠在 player、普通敌人、精英和 Boss 尺寸框下；
- 素材色板和透明像素统计。

- [ ] **步骤 2：审查硬门槛**

拒绝并返工以下问题：3D 透视、柔边/抗锯齿、高清插画混入像素环境、假障碍误导碰撞、图标靠文字才能区分、透明脏边、超过批准色数、素材登记缺失。

- [ ] **步骤 3：做风格一致性审查**

检查设施、HUD、overlay、角色和敌人之间是否共享 Foundation 冷灰蓝、应急琥珀、危险红和异常紫青语言；装饰对比不得压过角色、弹丸、拾取物与预警。

- [ ] **步骤 4：修复并单独提交（如需要）**

每批素材修复后重新运行 `test/art-assets.test.js` 并更新登记；不要把 contact sheet 暂存。

~~~powershell
node --test test/art-assets.test.js test/combat-presentation-integration.test.js
git diff --check
~~~

---

## 任务 3：独立代码审查与修复循环

- [ ] **步骤 1：请求独立审查**

至少分两路只读审查：

1. 玩法安全与生命周期：Scene、physics、timer、tween、listener、post-commit 边界、fallback 等价；
2. UI/美术架构与可访问性：组件 ownership、点击热区、层级、文字裁切、素材合同和 960×540 可读性。

审查范围从本轮开始基线 `507c8ed` 到当前 HEAD；要求 findings 按 Critical / Important / Minor 分类，并给出文件与行号。

- [ ] **步骤 2：验证 findings，不盲目接受**

对每个 Critical/Important 先复现或用代码路径证明。错误或越界建议记录理由后关闭；真实问题先加失败测试，再做最小修复。Minor 只处理明显低风险且不扩大范围的项目。

- [ ] **步骤 3：重复审查直到无 Critical/Important**

修复后重新派发独立复审；不得由原实现 Agent 自我声明审查通过。

- [ ] **步骤 4：提交审查修复**

每个逻辑相关修复单独 commit，格式示例：

~~~powershell
git add -- <exact-files>
git commit -m "fix(art): harden presentation lifecycle"
~~~

---

## 任务 4：新鲜自动验证

- [ ] **步骤 1：运行全部测试**

~~~powershell
node --test
~~~

记录测试数量、通过/失败和耗时。任何失败都必须解决或明确阻塞，不可挑选性忽略。

- [ ] **步骤 2：生产构建**

~~~powershell
& 'C:\Users\24037\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe' scripts/art/test_pixel_tools.py
npm run build
~~~

记录 module 数、构建耗时和产物文件；既有 devdir / chunk 警告可报告，但不得把新警告当既有问题。

- [ ] **步骤 3：检查 diff 和 Git 边界**

~~~powershell
git diff --check 507c8ed..HEAD
git status --short --branch
git log --oneline --decorate 507c8ed..HEAD
~~~

预期：没有 whitespace error；工作树只允许未跟踪 `.superpowers/`；本轮每个 commit 目的清晰；没有 merge/push。

- [ ] **步骤 4：运行关键定向回归**

~~~powershell
node --test test/character-presentation.test.js test/enemy-presentation.test.js test/enemy-replication.test.js test/biomass-collision-compatibility.test.js test/boss-rules.test.js test/combat-presentation-integration.test.js test/overlay-lifecycle.test.js test/combat-presentation-equivalence.test.js
~~~

---

## 任务 5：准备固定端口 smoke 并交给用户

- [ ] **步骤 1：建立不入库的确定性视觉状态驱动**

在 `.superpowers/sdd/combat-presentation-smoke/visual-state-driver.js` 建立浏览器运行时驱动，不修改或暂存 production 源码。入口先保存 Scene 状态、meta 对象、Phaser RNG 状态和 `localStorage["scp-survivor-meta"]` 原始字符串，然后在 `try/finally` 内工作：暂停 physics/spawn，使用固定种子 `combat-presentation-smoke-v1` 和明确的 `elapsedSurvivalMs` 驱动状态，不依赖自然刷怪或真实时钟。提供 normal、low-health、outage、facility-warning、elite-warning、boss、pause、level-up-representative、build、failure、victory。failure/victory 只调用无奖励的 `showGameOverOverlay()` / `showVictoryOverlay()`，严禁调用 `triggerGameOver()` / `triggerVictory()`；升级浏览器只展示普通/武器/质变三张代表卡，全部 16 图标由 contact sheet 与资产测试验收。

若浏览器无法直接取得 Scene，只允许对本地源码应用一个临时未暂存的 debug 暴露补丁；先记录目标文件 SHA-256，smoke 后立即反向应用并验证 SHA-256 恢复，任何恢复失败都阻止交付。每个状态截图后调用 `scene.restart()`，等待下一次 Scene `CREATE`/ready 条件成立，再从 game manager 重新取得新 Scene，禁止复用旧实例。`finally` 无条件恢复 RNG、meta 和 `localStorage["scp-survivor-meta"]` 原始字符串并逐字节比较，即使截图、restart 或断言抛错也执行；任何差异阻止交付。记录截图路径、console error/warn 和 texture warning；状态驱动本身永不进入 Git。

- [ ] **步骤 2：只读检查 64126**

~~~powershell
Get-NetTCPConnection -LocalPort 64126 -State Listen -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess
~~~

若有未知监听者，停止并报告，不终止进程。若端口空闲，再启动：

~~~powershell
npm run dev -- --host 127.0.0.1 --port 64126 --strictPort
~~~

确认服务实际监听后才提供 `http://localhost:64126/`。

- [ ] **步骤 3：Agent 运行浏览器视觉 smoke**

固定 960×540，检查并截图：

1. 标题页和武器选择；
2. 开局默认设施、HUD 与角色/敌人阴影；
3. 暂停层；
4. 升级层中的普通、武器、质变代表卡；16 图标另由 contact sheet 全检；
5. TAB 建造面板；
6. 低生命脉冲；
7. 停电/设施事件；
8. 精英预警和密集战斗；
9. Boss HUD 与 SCP-049；
10. 失败和胜利结算；
11. 返回标题、失败重启、胜利重启。

同时检查 console error/warn 为 0，无 missing/duplicate texture key，无点击热区偏移。

- [ ] **步骤 4：用户手动试玩清单**

请用户重点验证：

- 移动不会改变面朝，自动攻击会；
- 左右/上下切换不再缩小；
- 无悬浮枪或延迟装具；
- 地图装饰有语义且不会像可碰撞障碍；
- HUD、升级、暂停和结果像同一套游戏系统；
- 精英/Boss 预警在火花、碎屑和异常效果中仍清楚；
- 暂停、连续升级、TAB、失败/胜利和重启路径正常。

- [ ] **步骤 5：处理试玩反馈**

真实 Bug 使用 `systematic-debugging` + TDD；纯审美调整先判断是否仍在批准 spec 内。超出 spec 的整体重定不在本轮实施，整理为下一阶段提案。

## 最终报告格式

- 分支、worktree、最终 HEAD、commit 列表；
- 四个子系统的结果；
- 测试、build、diff-check、浏览器 smoke 和用户试玩结果；
- 新增素材与许可证登记摘要；
- 未解决风险和 Minor findings；
- 明确说明未 merge、未 push；
- 只有所有硬门槛真实通过后，才进入 `superpowers:finishing-a-development-branch` 讨论集成选项。
