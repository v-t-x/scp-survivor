# 文档与 GitHub 同步实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 准确同步 main 文档与 CI，把 UI/美术和 Windows Electron PoC 分支安全备份到 GitHub，并为两个候选分支建立不授权合并的 Draft PR。

**Architecture:** main 只承载当前事实、发布状态和 CI 门禁；feature/ui-art-overhaul 与 dev/app-platform 保留原提交历史并分别通过 Draft PR 暴露候选差异。每个 worktree 独立验证、独立推送，任一阶段失败即停止该阶段，不修改其他分支历史。

**Tech Stack:** Markdown、Git、GitHub Actions、Node.js 20、Phaser 3、Vite 7、Python/Pillow、Electron Forge、GitHub App/CLI。

## Global Constraints

- v1.3.0 仍是最近正式版本；当前 main 只称为 v1.4.0 候选。
- 本轮不 merge、不创建 Release、不打 tag、不 force push、不 rebase、不 squash、不删除分支或 worktree。
- 不改变玩法、存档、胜负条件、正式素材准入或许可证结论。
- 不暂存 .superpowers/、dist/、backup_*、.claude/ 或私有 docs/portfolio-review.md。
- 新增或实质修改的项目文档使用中文；README.en.md 只作为英文镜像。
- push 前必须 fetch，并用 ancestry 检查证明操作是 fast-forward。
- UI/美术和 App Platform 只创建 Draft PR；剩余视觉、许可与人工 smoke 门禁必须显式保留。

---

### Task 1: 对齐 main 的项目与发布状态文档

**Files:**
- Create: docs/project-status.md
- Modify: README.md
- Modify: README.en.md
- Modify: CHANGELOG.md
- Modify: docs/README.md
- Inspect only: docs/design.md

**Interfaces:**
- Consumes: docs/design.md 的当前 main 事实、docs/development-strategy.md 的分支职责、现有 v1.3.0 标签。
- Produces: 公开入口统一使用“正式发布 / main 未发布 / 分支候选 / 规划”四态语义，并提供 docs/project-status.md 作为跨分支状态入口。

- [ ] **Step 1: 新增项目状态文档**

创建 docs/project-status.md，固定以下结构和事实：

~~~markdown
# SCP Survivor 当前项目状态

> 本文记录里程碑状态，不替代 docs/design.md 的当前实现事实，也不自动授权开发中或长期功能。

## 正式发布

- 最近正式版本：v1.3.0。
- 在线 Demo 仅代表其实际部署构建；未验证部署与 main 一致前，不把未发布功能归入 Demo。

## main：v1.4.0 候选

- 保留 Phaser 3 + Vite、PreloadScene -> PrototypeScene 和六分钟单局结构。
- 已集成 SCP-049 狂热状态、暴露承伤窗口、敌人递归复制、230 活动敌人上限和相应 Node 回归测试。
- 多平台客户端路线与 Windows Electron PoC 已完成设计，但不等于正式客户端发布。

## 开发分支候选

### feature/ui-art-overhaul

- 已实现正式候选设施、菜单、HUD、角色、R-17 敌人、升级图标、终端覆盖层和战斗反馈。
- 仍需完成整体视觉验收、来源与商业发布许可复核，以及角色优先路线的后续验收。
- 该分支不得在合并前被 README 描述为当前正式画面。

### dev/app-platform

- 已实现隔离的 Electron Windows PoC、安全 app:// 资源协议、沙箱窗口和资源 staging。
- 尚未成为正式 Windows 版本；安装器、签名、自动更新和正式发布均不在当前批准范围。

### dev/v2 与 refactor/ui-foundation

- dev/v2 的当前玩法成果已经进入 main，分支保留作玩法职责边界。
- refactor/ui-foundation 已冻结，仅接受明确批准的维护。

## 合并与发布门禁

- UI/美术：自动测试、构建、视觉验收、素材来源和许可复核。
- App Platform：自动测试、Windows packaging、人工输入/音频/重启/存档/离线/DPI smoke。
- 正式版本：README、CHANGELOG、在线构建、标签和 Release 内容必须指向同一已验证 commit。

## 尚未授权

多地图、多角色、完整剧情任务、联机、账号、云存档、商店发行、自动更新和正式商业化仍是未批准长期设想。
~~~

- [ ] **Step 2: 更新中英文 README 的版本状态和文档入口**

在两份 README 的项目简介后加入对应状态提示。中文使用：

~~~markdown
> **版本状态：** 最近正式版本为 v1.3.0；当前 main 包含尚未发布的 v1.4.0 候选改动。UI/美术升级和 Windows Electron 客户端仍位于独立开发分支，详见 [当前项目状态](./docs/project-status.md)。
~~~

英文使用：

~~~markdown
> **Version status:** v1.3.0 is the latest formal release. main contains unreleased v1.4.0 candidate changes, while the UI/art overhaul and Windows Electron client remain on separate development branches. See [current project status](./docs/project-status.md).
~~~

在两份 README 的快速开始命令中把 node --test 放在 npm run build 之前；将结构树的 CI 注释改为“测试与构建检查”及 “test and build checks”；在文档列表加入 docs/project-status.md。

- [ ] **Step 3: 增加 CHANGELOG 的 Unreleased 区段**

在 1.3.0 之前加入：

~~~markdown
## [Unreleased] — v1.4.0 候选

本区只记录已经进入 main、但尚未形成正式 Release 的变更；独立开发分支候选不计入已发布内容。

### 玩法与规则
- SCP-049 使用 normal → frenzy → normal → dying 状态机；狂热阶段召唤高压混合单位并开放有上限的承伤窗口。
- 所有非 Boss 敌人获得 6–9 秒递归复制规则，并共享 230 个活动敌人硬上限。

### 测试与工程
- 新增 Boss 压力模型与敌人复制规则的 Node 回归测试。
- GitHub Actions 在构建前运行 node --test。

### 文档与平台规划
- 记录已批准的多平台客户端路线和第一阶段 Windows Electron PoC 计划；这些文档不代表正式客户端已经发布。
- 新增项目状态文档，区分正式发布、main 未发布内容、开发分支候选和未授权长期方向。

---
~~~

在文件末尾增加 [Unreleased]: #unreleased--v140-候选。

- [ ] **Step 4: 更新文档地图并复核设计事实**

在 docs/README.md 的权威/状态入口中加入：

~~~markdown
- [当前项目状态](./project-status.md)：区分正式发布、main 未发布内容、开发分支候选与剩余门禁。
~~~

对照 src/config/balance.js、src/scene/bossRules.js、src/scene/enemyReplication.js 和现有测试复核 docs/design.md。预期无需修改；如果发现不一致，只修正 main 已实现事实，不加入 UI/App 候选。

- [ ] **Step 5: 验证文档链接、状态用语和 diff**

Run:

~~~powershell
$files = @('README.md', 'README.en.md', 'CHANGELOG.md', 'docs/README.md', 'docs/project-status.md')
$broken = foreach ($path in $files) {
  $file = Get-Item -LiteralPath $path
  $text = Get-Content -LiteralPath $path -Raw
  foreach ($match in [regex]::Matches($text, '\[[^\]]+\]\(([^)]+)\)')) {
    $target = $match.Groups[1].Value
    if ($target -match '^(https?://|mailto:|#)') { continue }
    $relative = ($target -split '#', 2)[0]
    if (-not $relative) { continue }
    $resolved = Join-Path $file.DirectoryName $relative
    if (-not (Test-Path -LiteralPath $resolved)) { "$path -> $target" }
  }
}
if ($broken) { $broken; throw 'broken local Markdown links' }
rg -n "v1\.3\.0|v1\.4\.0|Unreleased|project-status" README.md README.en.md CHANGELOG.md docs/README.md docs/project-status.md
git diff --check
~~~

Expected: 没有 broken link；四态版本用语均可定位；git diff --check 无输出。

- [ ] **Step 6: 提交文档同步**

~~~powershell
git add -- README.md README.en.md CHANGELOG.md docs/README.md docs/project-status.md
git diff --cached --check
git diff --cached --name-only
git commit -m "docs: align project and release status"
~~~

Expected staged list: 仅上述 5 个文档；commit 成功。

---

### Task 2: 让 GitHub Actions 同时运行测试与构建

**Files:**
- Modify: .github/workflows/ci.yml

**Interfaces:**
- Consumes: 根目录 package-lock.json、Node 20、test/*.test.js。
- Produces: 对 main 的 push 和 PR 均按 npm ci -> node --test -> npm run build 执行。

- [ ] **Step 1: 建立修改前基线**

~~~powershell
node --test
npm run build
~~~

Expected: 11 个 Node 测试通过；Vite 构建成功。

- [ ] **Step 2: 修改 CI 工作流**

把 job 名称改为 Test and build，并在 Install 与 Build 之间加入：

~~~yaml
      - name: Test
        run: node --test
~~~

最终步骤顺序必须为 Checkout、Set up Node.js、Install dependencies、Test、Build。

- [ ] **Step 3: 验证 CI 等价命令和 YAML 结构**

~~~powershell
node --test
npm run build
rg -n "name: Test and build|name: Test|run: node --test|name: Build|run: npm run build" .github/workflows/ci.yml
git diff --check
~~~

Expected: 11/11 测试通过；构建成功；Test 位于 Build 之前；diff check 无输出。

- [ ] **Step 4: 提交 CI 门禁**

~~~powershell
git add -- .github/workflows/ci.yml
git diff --cached --check
git diff --cached --name-only
git commit -m "ci: run regression tests before build"
~~~

Expected staged list: 仅 .github/workflows/ci.yml；commit 成功。

---

### Task 3: 验证并 fast-forward 推送 main

**Files:**
- Inspect only: complete main commit range and worktree

**Interfaces:**
- Consumes: Tasks 1–2 的提交和既有 3 个多平台文档提交。
- Produces: GitHub main 精确指向本地已验证 HEAD。

- [ ] **Step 1: 检查 GitHub CLI、身份和远端**

~~~powershell
gh --version
gh auth status
git remote -v
git status --short --branch
~~~

Expected: gh 可用并已登录；origin 为 v-t-x/scp-survivor；worktree 无未提交项。

- [ ] **Step 2: 刷新并证明 fast-forward**

~~~powershell
git fetch --all --prune
git merge-base --is-ancestor origin/main main
if ($LASTEXITCODE -ne 0) { throw 'origin/main is not an ancestor of local main' }
git log --reverse --oneline origin/main..main
~~~

Expected: ancestry 通过；范围只包含已审核文档和 CI 提交。

- [ ] **Step 3: 运行最终 main 门禁**

~~~powershell
node --test
npm run build
git diff --check
git status --short --branch
~~~

Expected: 11/11 测试通过；构建成功；工作区干净；仅显示 main ahead。

- [ ] **Step 4: 非强制推送 main**

~~~powershell
git push origin main:main
git rev-list --left-right --count origin/main...main
~~~

Expected: push 成功；ahead/behind 为 0 0。

---

### Task 4: 同步 UI/美术分支并创建 Draft PR

**Files:**
- Inspect only: C:\scp-survivor-ui-art
- Never stage: C:\scp-survivor-ui-art\.superpowers\

**Interfaces:**
- Consumes: feature/ui-art-overhaul 的原提交历史与 main 的最新文档/CI基线。
- Produces: 更新后的远端 UI 分支和一个以 main 为 base 的 Draft PR。

- [ ] **Step 1: 检查状态和远端 ancestry**

~~~powershell
git -C C:\scp-survivor-ui-art status --short --branch
git -C C:\scp-survivor-ui-art fetch --all --prune
git -C C:\scp-survivor-ui-art merge-base --is-ancestor origin/feature/ui-art-overhaul feature/ui-art-overhaul
if ($LASTEXITCODE -ne 0) { throw 'remote UI branch is not an ancestor of local UI branch' }
~~~

Expected: 唯一工作区项是 ?? .superpowers/；ancestry 通过。

- [ ] **Step 2: 运行完整 UI 自动门禁**

~~~powershell
Set-Location C:\scp-survivor-ui-art
node --test
$python = if ($env:SCP_SURVIVOR_PYTHON) { $env:SCP_SURVIVOR_PYTHON } else { 'python' }
& $python scripts/art/test_pixel_tools.py
npm run build
git diff --check
git diff --check origin/main...HEAD
git status --short --branch
~~~

Expected: 311 个 Node 测试和 4 个 Python 测试通过；构建成功；diff check 无错误；仍只有 ?? .superpowers/。

- [ ] **Step 3: 推送 UI 分支**

~~~powershell
git push -u origin feature/ui-art-overhaul
git rev-list --left-right --count origin/feature/ui-art-overhaul...feature/ui-art-overhaul
~~~

Expected: 0 0；.superpowers/ 未进入 Git。

- [ ] **Step 4: 创建 UI Draft PR**

通过 GitHub App 创建 Draft PR：

- base: main
- head: feature/ui-art-overhaul
- title: feat(ui-art): integrate the production presentation vertical slice
- body 必须包含：静态素材与 provenance、开局/标题/武器选择、R-17、设施、战术 HUD、终端覆盖层、战斗反馈；311 Node + 4 Python + build；SCP-049 CC BY-SA 与 OpenAI 输出权利复核；角色优先路线尚未完成；不得合并直至视觉验收。

Expected: PR 为 Draft，未 merge。

---

### Task 5: 同步 App Platform 分支并创建 Draft PR

**Files:**
- Inspect only: C:\scp-survivor-app
- Generated only: C:\scp-survivor-app\dist\、C:\scp-survivor-app\clients\desktop-electron\out\

**Interfaces:**
- Consumes: 根 Web artifact、Electron 43.1.0、Forge 7.11.2、安全 app://scp-survivor 协议。
- Produces: 更新后的远端 App 分支和一个明确标记 PoC 的 Draft PR。

- [ ] **Step 1: 检查状态和远端 ancestry**

~~~powershell
git -C C:\scp-survivor-app status --short --branch
git -C C:\scp-survivor-app fetch --all --prune
git -C C:\scp-survivor-app merge-base --is-ancestor origin/dev/app-platform dev/app-platform
if ($LASTEXITCODE -ne 0) { throw 'remote App branch is not an ancestor of local App branch' }
~~~

Expected: worktree 干净；ancestry 通过。

- [ ] **Step 2: 运行 Web、Electron 和 packaging 门禁**

~~~powershell
Set-Location C:\scp-survivor-app
node --test
npm run build
npm --prefix clients/desktop-electron test
npm --prefix clients/desktop-electron run stage
npm --prefix clients/desktop-electron run package:win
git diff --check
git status --short --branch
~~~

Expected: 根测试和构建通过；Electron 7/7 测试通过；staging 与 Windows x64 packaging 成功；工作区干净。

- [ ] **Step 3: 推送 App 分支**

~~~powershell
git push -u origin dev/app-platform
git rev-list --left-right --count origin/dev/app-platform...dev/app-platform
~~~

Expected: 0 0。

- [ ] **Step 4: 创建 App Draft PR**

通过 GitHub App 创建 Draft PR：

- base: main
- head: dev/app-platform
- title: feat(app): add the sandboxed Windows Electron PoC
- body 必须包含：隔离依赖、artifact staging/manifest、安全协议、沙箱窗口；根 build、7 Electron tests、Windows packaging；明确未完成键盘可测移动、音频/静音、十次 restart、存档、离线冷启动、DPI 和外部导航人工 smoke；不是正式 Windows 发行版。

Expected: PR 为 Draft，未 merge。

---

### Task 6: 最终远端与本地审计

**Files:**
- Inspect only: all five worktrees, GitHub repository, two Draft PRs

**Interfaces:**
- Consumes: Tasks 1–5 的提交、push 和 PR 结果。
- Produces: 可审计的最终交接，不执行 merge/tag/release。

- [ ] **Step 1: 检查所有 worktree 与分支同步状态**

~~~powershell
git -C C:\scp-survivor worktree list
git -C C:\scp-survivor status --short --branch
git -C C:\scp-survivor-v2 status --short --branch
git -C C:\scp-survivor-ui-art status --short --branch
git -C C:\scp-survivor-app status --short --branch
git -C C:\scp-survivor-ui-foundation status --short --branch
git -C C:\scp-survivor tag --sort=version:refname
~~~

Expected: main、UI、App 与远端同步；UI 只保留 ?? .superpowers/；原有标签仍止于 v1.3.0。

- [ ] **Step 2: 通过 GitHub App 复核远端**

读取 v-t-x/scp-survivor 的仓库、分支和开放 PR。Expected: main 指向已推送 commit；UI 和 App 分支存在；恰有两个新的 Draft PR；没有 merge、Release 或 tag 变更。

- [ ] **Step 3: 汇总交接**

最终报告列出：

- main 新提交与验证；
- 三个已推送分支及最终 HEAD；
- 两个 Draft PR URL；
- UI .superpowers/ 保留情况；
- Electron 尚未完成的人工 smoke；
- 未修改的 package-lock 版本差异；
- 明确声明未 merge、未打 tag、未创建 Release。
