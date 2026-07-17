# 文档与 GitHub 同步设计

## 1. 目标

把本机已经存在的项目历史安全同步到 GitHub，并让公开文档准确区分以下四种状态：

1. 已正式发布；
2. 已进入 `main`、但尚未发布；
3. 仅存在于开发分支、等待审查；
4. 已规划、但仍待实现或验收。

本轮不合并 UI/美术或 App Platform 分支，不创建正式 Release，不打版本标签，也不改变玩法、存档、胜负条件或素材准入状态。

## 2. 已确认事实

- 当前正式标签依次为 `v1.0.0`、`v1.1.0`、`v1.2.0`、`v1.3.0`。
- `main` 已包含 SCP-049 狂热状态、敌人复制和 Boss 压力模型，当前相对 `origin/main` 另有 3 个多平台文档提交。
- `feature/ui-art-overhaul` 保留完整的 UI/美术提交历史；正式源码和素材均已提交，未跟踪的 `.superpowers/` 只作为本地执行与审查证据，不进入 Git。
- `dev/app-platform` 已有隔离的 Electron Windows PoC；它与游戏根依赖分离，不代表正式 Windows 版本。
- GitHub 当前没有开放 PR 或 Issue。
- `package.json` 与 `package-lock.json` 的根版本不一致，但这不是本轮文档同步的隐式修复项。

## 3. 方案比较

### 方案 A：一次性推送并合并全部内容

优点是速度快。风险是 UI/美术改动量大、视觉验收和许可证边界尚未全部收口，Electron 也仍是 PoC；直接合并会让 `main` 和 README 过早宣称未验收能力。

### 方案 B：重写历史并拆成多个新分支

优点是 PR 表面更小。风险是要重排大量已存在的提交，容易破坏可追溯性、遗漏修复或制造分支祖先问题，收益不足以抵消成本。

### 方案 C：保留历史，先同步事实，再建立两个 Draft PR

这是本轮采用的方案。先在 `main` 校正文档和 CI，再按原样推送 UI/美术与 App Platform 分支，以 Draft PR 暴露完整差异、测试和剩余门禁。任何合并和正式发布另行决定。

## 4. 版本语义

- `v1.3.0` 继续表示最近一次正式发布，不改写历史标签。
- 当前 `main` 只称为 `v1.4.0` 候选；CHANGELOG 使用 `Unreleased`，不提前创建 `v1.4.0` 标签。
- UI/美术只有在视觉验收、来源审计和合并完成后，才考虑作为后续 minor 版本；本轮不预先承诺具体版本号。
- Electron 继续使用 PoC 语义；若以后提供测试包，可使用预发布标识，不把它描述为正式桌面版。

## 5. 文档设计

### README

`README.md` 与 `README.en.md` 只把当前正式版本和 `main` 已实现事实写成现状。开发中内容通过链接指向项目状态文档，不把 UI/美术分支或 Electron PoC 写成已经发布。

### CHANGELOG

在现有正式版本之前增加 `Unreleased`，记录 `v1.3.0` 之后已经进入 `main` 的玩法、测试和规划文档。分支候选不混入已发布记录。

### 当前项目状态

新增 `docs/project-status.md`，按“稳定基线、已进入 main、开发分支候选、待验收、未授权长期方向”组织。它记录里程碑状态和分支职责，不记录容易立即过期的 ahead 数量。

### 设计事实

复核 `docs/design.md` 与实际 `main` 一致；只在发现事实缺口时最小修改，不复制开发分支候选内容。

## 6. CI 设计

`.github/workflows/ci.yml` 在 `npm ci` 后依次执行：

1. `node --test`；
2. `npm run build`。

原因是 `main` 已有自动化测试，而当前 GitHub Actions 只证明能够构建。该修改不改变运行时代码。验证方式为本地完整执行相同命令，并检查 YAML 和 diff。

## 7. GitHub 同步顺序

### 阶段一：`main`

1. 完成文档和 CI 修改；
2. 将文档修改与 CI 修改分成独立提交；
3. 运行测试、构建、Markdown 链接检查、`git diff --check` 和状态检查；
4. 直接 fast-forward push `main`，包含既有 3 个本地文档提交和本轮新提交。

这里直接推送 `main` 是项目特例：3 个既有提交已经位于本地 `main`，任务属于 `main` 的文档与治理职责，项目所有者已明确批准本轮同步。不得 force push。

### 阶段二：UI/美术

1. 确认除既有 `?? .superpowers/` 外没有未知修改；
2. 重跑 Node、Python 素材工具测试、构建和 diff 检查；
3. fast-forward push `feature/ui-art-overhaul`，不暂存 `.superpowers/`；
4. 建立面向 `main` 的 Draft PR。

PR 按里程碑总结静态素材、开局界面、标题页、R-17 敌人、设施、战术 HUD、终端覆盖层和战斗反馈，明确角色优先路线仍是后续计划，并列出许可与视觉验收门禁。

### 阶段三：App Platform

1. 重跑 Electron 测试、web staging 和 Windows packaging；
2. 记录尚未完成的人工 smoke 项，不把未测试项写成通过；
3. fast-forward push `dev/app-platform`；
4. 建立面向 `main` 的 Draft PR，标题和正文明确标记 Windows PoC。

## 8. 安全与失败处理

- 不使用 force push、历史重写、squash、rebase、分支删除或 worktree 删除。
- 不暂存 `.superpowers/`、`dist/`、备份文件或私有 `docs/portfolio-review.md`。
- push 前重新 fetch；如果远端不再是本地祖先，立即停止并报告。
- 任一测试、构建、打包或 diff 门禁失败时，不推送对应阶段。
- 如果 GitHub 已存在同 head/base 的 PR，复用并更新说明，不重复创建。
- Draft PR 只建立审查入口，不授权合并。

## 9. 完成标准

- GitHub `main` 与本地已批准的文档/CI状态一致；
- README、CHANGELOG、设计事实和项目状态没有混淆发布、main、分支候选与规划；
- UI/美术和 App Platform 分支均安全备份到 GitHub；
- 两个 Draft PR 提供准确范围、验证结果、风险和剩余门禁；
- 没有 merge、正式 Release、版本标签或许可状态升级；
- 所有 worktree 保留用户已有本地材料，最终 Git 状态被明确报告。
