# Claude Code 项目入口

Claude Code 必须同时遵守：

1. 用户的最新直接指令；
2. `AGENTS.md` 的项目方向、权限边界和 GPT 审查标准；
3. 当前分支对应的 `docs/agents/*.md`；
4. 适用的 Superpowers skill。

项目规则优先于 Superpowers 的通用流程。Claude 不得用“skill 要求”突破分支职责、共享文件门禁或 Git 权限。

## 开始任务

执行任何分析或修改前：

```powershell
Get-Location
git branch --show-current
git status --short --branch
git worktree list
```

随后完整读取 `AGENTS.md`、当前分支指南、指南要求的权威文档，以及当前已批准计划。分支未知或 worktree 意外不干净时保持只读并报告。

## 使用 Superpowers

需求设计、计划、实施、调试、代码审查、worktree 隔离和分支收尾，优先调用对应的 Superpowers skill，不在本文件中复制其详细步骤。

主 Agent 负责自动判断串行或并行、安排子 Agent、复核结果并组织修复；修改相同文件、共享接口或存在依赖的任务必须串行。不要要求用户手动维护多个 Agent 窗口，也不要重复讨论权威文档中已经确认的决定。

## 任务范围与高效编排

- 任务规模和子 Agent 数量不设任意上限；适合并行的独立工作应主动分派，以缩短交付时间。
- 用户当前目标、交付物和明确排除项始终是边界。Superpowers 和子 Agent 只提供执行方法，不授权新增功能、扩大威胁模型、进入下一阶段或追加发布操作。
- 主 Agent 为每个子 Agent 指定清晰且不重叠的职责，并统一协调依赖、审查和最终交付。范围外发现进入 backlog 或风险说明，不触发递归审查与实现循环。
- 已有批准设计或计划时直接执行，不重复规划或要求用户重新确认同一决定。达到当前交付并完成相称验证后立即收口。
- `commit`、`push`、PR、merge、tag、Release 和部署分别理解和授权；“继续”只表示继续此前明确说明的当前范围。

## 外部 GPT 判断

任务开始时按 `AGENTS.md` 判断 Level 0、Level 1 或 Level 2：

- Level 0：使用本地 Agent 与 Superpowers 完成开发和验证。
- Level 1：继续执行，在报告中简短说明取舍。
- Level 2：暂停不可逆或大范围实施，继续安全的分析与测试，并生成 `AGENTS.md` 规定的精简审查包。

Claude Code 不是外部 ChatGPT 5.6。没有真实接口时不得声称已经调用 GPT；用户返回 GPT 意见后，必须先用仓库事实和测试验证。

## 构建与验证

最低基础检查为：

```powershell
npm run build
git diff --check
git status --short --branch
```

此外必须运行与变更直接相关的测试或 smoke。玩法改动检查实际游玩、胜负、暂停、restart 和持久化；UI/Art 检查目标页面、交互、viewport、资源 key 和控制台；客户端改动检查受影响平台的启动、生命周期、离线、权限和打包。没有执行的项目必须明确写“未测试”。

## Git 与交接

- 只修改当前 worktree 中属于当前分支职责的文件。
- 不覆盖、stash、移动、删除或重置用户及其他 Agent 的修改。
- 日常 commit 必须范围明确，并记录验证结果。
- merge、push、历史重写、分支或 worktree 删除、release 和发布需要用户或主 Agent 对具体操作的明确授权。
- 完成报告应简短列出分支、HEAD、commit、修改文件、验证结果、风险、下一步和 GPT 等级。
