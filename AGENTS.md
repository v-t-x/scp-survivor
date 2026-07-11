# SCP Survivor 项目规则

## 1. 权威与最终决策

本文件规定所有主 Agent、子 Agent 和开发工具必须遵守的项目特有规则。用户的直接指令优先；项目所有者拥有产品、架构、商业化和发布方向的最终决定权。

通用开发流程由 Superpowers 提供。涉及需求分析、计划、任务拆分、子 Agent 调度、TDD、系统化调试、代码审查、worktree、修复循环和分支收尾时，主 Agent 应优先调用并遵循相应的 Superpowers skill，不在本文件中重复整套流程。

项目规则的优先级为：用户直接指令 → 本文件 → 当前分支指南 → 已批准计划 → Superpowers 通用流程。Superpowers 不得突破项目的产品方向、职责边界或 Git 权限。

## 2. 产品定位与不可偏离的原则

SCP 世界观不是美术包装。项目选择 SCP，是为了利用收容失效、设施压迫、异常规则、基金会组织和风险取舍，形成区别于普通 Survivors-like 的体验。

游戏可以保留移动、自动攻击、击杀、经验和升级等基础循环，但新内容应优先带来至少一种 SCP 特有价值：

- 独立的异常应对规则；
- 设施故障、警报、封锁、供电或收容状态；
- 战斗、探索、处理异常和完成目标之间的选择；
- 有收益也有代价的异常物品；
- 能体现 SCP 设定的 Boss、事件和环境机制。

不得只通过增加伤害、血量、敌人数量或替换名称与皮肤，让项目逐渐变成普通割草游戏。

提出重大玩法时必须判断：是否强化 SCP 世界观、是否产生新决策、是否形成玩法差异、是否只是数值膨胀。

## 3. 当前游戏基线

当前稳定版本是 Phaser 3 + Vite 的 2D 俯视角单局原型。`PreloadScene` 完成资源加载与 fallback 后启动 `PrototypeScene`。

当前核心流程为：标题与永久加成 → 三选一武器 → 移动、自动攻击、经验与升级 → 应对六分钟时间轴和设施干扰 → 终局对抗 SCP-049 → 胜利或失败结算。玩家生命耗尽为失败；终局 Boss 被击败为当前胜利条件。元进度使用 `localStorage`，旧数据应尽量保持兼容。

修改核心循环、胜负条件、六分钟结构或产品定位，必须按 Level 2 处理。`docs/design.md` 只描述 `main` 已实现的事实，不自动授权未来功能。

## 4. 已确认的方向

以下决定不能由 Agent 自行推翻：

- 继续使用 Phaser、Vite 和 JavaScript ES Modules；
- `main` 保持可运行的稳定集成基线；
- 玩法、UI/Art、客户端平台在隔离分支或 worktree 中推进；
- UI Foundation 的 Preload、manifest、fallback、`AudioManager` 和 `UIManager` 是当前稳定接口；
- 程序化纹理和音频继续作为原型能力、动态效果和素材缺失时的 fallback；
- UI/Art 升级不得暗中改变伤害、刷怪、AI、升级概率、胜负或存档语义；
- App Platform 负责本游戏的全部客户端形态，第一阶段优先验证 Windows；
- v2 与 App Platform 可以并行，因为前者处理玩法内容，后者处理承载、构建和发布；
- 正式素材必须记录来源、许可证、修改状态、商业使用和署名要求；
- 新增或实质修改的项目文档使用中文，必要的代码标识符、命令和正式名称可保留原文。

UI 与美术的目标是：进入游戏时体现基金会设施的专业压迫感，游玩中逐步表现异常失控的恐怖感和战术生存的紧张感。第一阶段采用混合资源方案，优先 Theme、HUD、菜单、核心角色与 Boss，不要求一次替换全部程序化表现。

商业化仍是未来可能性，不是已经确定的发行计划。仓库现有代码采用 MIT License；SCP 衍生内容、正式美术、字体和音频需要单独核对许可。已经以开放许可证发布的版本不能被当作简单撤回。

## 5. 尚未批准的长期设想

以下内容可以分析和比较，但未经用户明确批准不得自行实现：

- 全面拆分为多个 Gameplay Scene；
- 多张完整地图、大量角色或大量 SCP 实体；
- 完整任务探索、剧情、档案和世界观系统；
- 完整 i18n、联机、排行榜、账号、云存档或跨设备同步；
- 完整 Roguelite 局外成长；
- macOS、Linux、Steam、商店、自动更新或正式商业发行；
- 彻底替换程序化纹理与音频；
- 改变未来全部代码的许可证策略。

历史 Roadmap、`docs/archive/`、`docs/superpowers/` 中的记录以及未批准提案都不自动构成实施授权。

## 6. 主 Agent 与分支职责

一个主 Agent 负责读取规则和现有计划、调用适用的 Superpowers skill，并自动组织执行、审查、修复和验证。独立且不修改相同区域的任务可以并行；存在依赖或文件重叠的任务必须串行。用户不需要手动把任务复制给多个子 Agent。

| 分支 | 项目职责 | 必读指南 |
|---|---|---|
| `main` | 稳定集成、治理、文档和明确批准的发布操作 | `docs/agents/main.md` |
| `dev/v2` | 玩法、SCP、Boss、敌人、武器、事件、关卡和核心架构 | `docs/agents/dev-v2.md` |
| `feature/ui-art-overhaul` | UI、美术、纹理、动画、VFX 和音频表现 | `docs/agents/feature-ui-art-overhaul.md` |
| `dev/app-platform` | 桌面、移动、PWA、Launcher 等客户端承载与发布 | `docs/agents/dev-app-platform.md` |
| `refactor/ui-foundation` | 已冻结的基础接口，仅接受明确批准的维护 | `docs/agents/refactor-ui-foundation.md` |

未列出的分支默认只读。Agent 不得自行扩大职责、在表现层隐藏玩法修改，或在平台层改变游戏语义。

## 7. 受保护系统与共享文件

未经明确批准，不得大范围重构以下区域：

- Scene 启动、restart 和销毁生命周期；
- Gameplay Scene 的整体拆分方式；
- Preload、asset manifest 和 fallback 合同；
- `AudioManager`、`UIManager` 及 `this.playSound()` 等兼容入口；
- `localStorage` key、格式和迁移规则；
- 核心玩法配置、胜负和时间轴语义；
- Phaser/Vite 技术栈和 Web artifact 合同。

以下属于高冲突共享文件或接口：`src/main.js`、`package.json`、`package-lock.json`、`index.html`、构建配置、asset manifest、preload、manager 公共接口、持久化 schema，以及 README、CHANGELOG、Roadmap、架构和治理文档。修改前必须说明原因、影响范围和验证方法，并取得主 Agent 或项目所有者批准。

## 8. 外部 GPT 审查机制

Superpowers 的代码审查负责本地实现质量，不能代替外部 ChatGPT 5.6 对产品方向和重大决策的审查。默认不需要外部 GPT。

### Level 0：无需外部审查

普通 Bug、小功能、局部 UI、已有设计下的补全、添加测试、构建或 Lint 修复、小范围重构、文档和常规 commit，由本地主 Agent、子 Agent 和 Superpowers 自行完成。

### Level 1：可选咨询

存在值得用户了解的设计或技术取舍，但任务可继续执行。报告中简短说明取舍；只有用户要求时才生成 GPT 审查包。

### Level 2：建议外部 GPT 审查

出现以下任一情况时，暂停不可逆或大范围实施，但继续只读分析、复现、测试和方案整理：

- 改变核心玩法、胜负、长期定位或 SCP 差异化方向；
- 大型架构重构、跨系统重写或测试无法充分覆盖的高回归迁移；
- UI、美术或世界观整体重定，而非局部优化；
- App 技术栈、封装架构、部署或发布路线的重大决定；
- 商业化、付费模式、开源协议、许可证、安全或隐私问题；
- 存在多个高成本、难回退的方案，或需求误解会造成大量返工；
- 重要 Milestone 完成后需要决定下一阶段，或 Agent、审查与测试结论无法协调。

没有真实跨软件接口时，不得声称已经调用 GPT。主 Agent 只能生成不超过 800 字的审查包，由用户手动转发：

```markdown
# GPT Review Request
## 1. 需要决定的问题
## 2. 当前背景
## 3. 已确认事实
## 4. 可选方案（做法、优点、风险、实施和回退成本）
## 5. 当前 Agent 的建议
## 6. 希望 GPT 回答（最多 3 个问题）
## 7. 关键附件（必要路径、diff 摘要或少量代码）
```

GPT 意见是建议，不是自动命令。执行前必须用真实仓库和测试验证其假设；与仓库事实冲突时，以仓库事实和测试结果为准。不得把整个仓库、大量无关代码或已明确决定的问题重复交给 GPT，也不得让 GPT 代替本地构建和测试。

## 9. 安全、验证与 Git 边界

- 只在当前 worktree 工作，保留用户和其他 Agent 的现有修改。
- worktree 意外不干净、范围跨分支、远端 ancestry 异常或需要凭据时，停止有风险的修改并报告。
- 每项实施必须执行与风险相称的 build、测试、smoke、diff 和 Git status 检查；build 成功不等于玩法正确。
- 日常 commit 可以由主 Agent 按批准任务完成，并记录目的和验证结果。
- 未经用户或主 Agent 对具体操作的明确授权，不得 merge、push、删除分支或 worktree、重写历史、创建 release 或发布产物。
- 阶段报告保持简短，包含目标、结果、关键文件、验证、风险、下一步和 GPT 等级；涉及实施时同时报告分支、HEAD、commit 与最终 Git 状态。

## 10. 权威文档

- `docs/product-vision.md`：完整产品意图与 SCP 差异化原则。
- `docs/design.md`：`main` 当前已经实现的游戏事实。
- `docs/development-strategy.md`：批准的工作流和授权边界。
- `docs/art-and-asset-direction.md`：UI、美术、音频和资源方向。
- `docs/licensing-and-commercialization.md`：素材来源、许可证和商业化风险。

Agent 应优先引用这些文档，不重复讨论其中已经确认的决定。
